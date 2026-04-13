// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VirexVault.sol";
import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MockUSDC is ERC20, ERC20Permit {
    constructor() ERC20("Mock USDC", "USDC") ERC20Permit("Mock USDC") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract VirexVaultTest is Test {
    VirexVault vault;
    MockUSDC usdc;
    
    address relayer = address(this);
    address user;
    address receiver = address(2);
    address solver = address(3);

    uint256 userPrivateKey = 0xA11CE;

    function setUp() public {
        usdc = new MockUSDC();
        vault = new VirexVault(address(usdc), relayer);

        user = vm.addr(userPrivateKey);
        usdc.mint(user, 1000 ether);
        usdc.mint(solver, 1000 ether);
    }

    function _getPermitSignature(
        address owner,
        uint256 ownerPrivateKey,
        address spender,
        uint256 value,
        uint256 deadline
    ) internal returns (uint8 v, bytes32 r, bytes32 s) {
        uint256 nonce = usdc.nonces(owner);
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                nonce,
                deadline
            )
        );

        bytes32 DOMAIN_SEPARATOR = usdc.DOMAIN_SEPARATOR();
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        (v, r, s) = vm.sign(ownerPrivateKey, digest);
    }

    function test_lockIntentWithPermit() public {
        uint256 amount = 100 ether;
        uint256 fee = 1 ether;
        uint256 deadline = block.timestamp + 1 hours;
        uint256 destChainId = 137;

        (uint8 v, bytes32 r, bytes32 s) = _getPermitSignature(user, userPrivateKey, address(vault), amount, deadline);

        vm.prank(solver);
        bytes32 intentHash = vault.lockIntentWithPermit(
            user, receiver, amount, fee, deadline, destChainId, amount, deadline, v, r, s
        );

        (,,,,,, VirexVault.IntentStatus status, address intentSolver) = vault.intents(intentHash);
        assertEq(uint(status), uint(VirexVault.IntentStatus.PENDING));
        assertEq(intentSolver, solver);
        assertEq(usdc.balanceOf(address(vault)), amount);
    }

    function test_fulfillIntent() public {
        uint256 amount = 100 ether;
        uint256 amountToReceiver = 99 ether; // Assuming fee deduction off-chain

        vm.startPrank(solver);
        usdc.approve(address(vault), amount);
        
        // Solver uses own vault / inventory directly
        bytes32 fakeHash = keccak256("fake");
        vault.fulfillIntent(fakeHash, receiver, amountToReceiver);
        vm.stopPrank();

        assertEq(usdc.balanceOf(receiver), amountToReceiver);
    }
}
