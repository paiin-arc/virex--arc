// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Permit.sol";

contract VirexVault {
    address public usdcToken;
    address public relayerAddress;

    enum IntentStatus { PENDING, FULFILLED, REFUNDED }

    struct Intent {
        address sender;
        address receiver;
        uint256 amount;
        uint256 fee;
        uint256 deadline;
        uint256 destChainId;
        IntentStatus status;
        address solver;
    }

    mapping(bytes32 => Intent) public intents;
    mapping(bytes32 => bool) public usedIntents;

    event IntentCreated(bytes32 indexed intentHash, address indexed sender, address receiver, uint256 amount, uint256 fee, uint256 destChainId);
    event IntentFulfilled(bytes32 indexed intentHash, address indexed solver);
    event IntentSettled(bytes32 indexed intentHash, address indexed solver, uint256 claimedAmount);
    event IntentRefunded(bytes32 indexed intentHash, address indexed user);

    modifier onlyRelayer() {
        require(msg.sender == relayerAddress, "Not authorized relayer");
        _;
    }

    constructor(address _usdcToken, address _relayerAddress) {
        usdcToken = _usdcToken;
        relayerAddress = _relayerAddress;
    }

    function lockIntentWithPermit(
        address sender,
        address receiver,
        uint256 amount,
        uint256 fee,
        uint256 deadline,
        uint256 destChainId,
        uint256 permitValue,
        uint256 permitDeadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (bytes32) {
        require(block.timestamp <= deadline, "Intent deadline passed");
        
        bytes32 intentHash = keccak256(abi.encode(sender, receiver, amount, fee, deadline, destChainId));
        require(intents[intentHash].sender == address(0), "Intent already exists");
        require(!usedIntents[intentHash], "Intent previously processed");

        IERC20Permit(usdcToken).permit(sender, address(this), permitValue, permitDeadline, v, r, s);
        
        require(IERC20(usdcToken).transferFrom(sender, address(this), amount), "Transfer failed");

        intents[intentHash] = Intent({
            sender: sender,
            receiver: receiver,
            amount: amount,
            fee: fee,
            deadline: deadline,
            destChainId: destChainId,
            status: IntentStatus.PENDING,
            solver: msg.sender
        });
        usedIntents[intentHash] = true;

        emit IntentCreated(intentHash, sender, receiver, amount, fee, destChainId);
        return intentHash;
    }

    function fulfillIntent(
        bytes32 intentHash,
        address receiver,
        uint256 amount
    ) external {
        require(IERC20(usdcToken).transferFrom(msg.sender, receiver, amount), "Solver transfer failed");
        emit IntentFulfilled(intentHash, msg.sender);
    }

    function settleIntent(bytes32 intentHash, address solver) external onlyRelayer {
        Intent storage intent = intents[intentHash];
        require(intent.status == IntentStatus.PENDING, "Not pending");
        require(intent.solver == solver || intent.solver == address(0), "Solver mismatch");
        
        intent.status = IntentStatus.FULFILLED;
        
        uint256 totalRelease = intent.amount;
        require(IERC20(usdcToken).transfer(solver, totalRelease), "Transfer failed");
        emit IntentSettled(intentHash, solver, totalRelease);
    }

    function refundIntent(bytes32 intentHash) external {
        Intent storage intent = intents[intentHash];
        require(intent.status == IntentStatus.PENDING, "Not pending");
        require(block.timestamp > intent.deadline, "Deadline not passed");

        intent.status = IntentStatus.REFUNDED;
        require(IERC20(usdcToken).transfer(intent.sender, intent.amount), "Transfer failed");
        emit IntentRefunded(intentHash, intent.sender);
    }
}
