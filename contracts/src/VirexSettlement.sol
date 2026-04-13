// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VirexSettlement {
    address public owner;
    
    mapping(address => uint256) public solverStakes;
    mapping(address => bool) public whitelistedSolvers;

    event SolverWhitelisted(address indexed solver);
    event SolverStaked(address indexed solver, uint256 amount);
    event SolverUnstaked(address indexed solver, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function whitelistSolver(address solver) external onlyOwner {
        whitelistedSolvers[solver] = true;
        emit SolverWhitelisted(solver);
    }

    function stake() external payable {
        require(whitelistedSolvers[msg.sender], "Not whitelisted");
        solverStakes[msg.sender] += msg.value;
        emit SolverStaked(msg.sender, msg.value);
    }

    function unstake(uint256 amount) external {
        require(solverStakes[msg.sender] >= amount, "Insufficient stake");
        solverStakes[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit SolverUnstaked(msg.sender, amount);
    }
}
