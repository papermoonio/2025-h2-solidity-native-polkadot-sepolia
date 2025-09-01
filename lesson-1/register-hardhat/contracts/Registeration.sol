// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Registeration {
    address public owner;
    mapping(uint256 => bool) public isRegistered;
    event Registered(uint256 id);

    constructor() {
        owner = msg.sender;
    }

    function register(uint256 id) public {
        require(!isRegistered[id], "Already registered");
        isRegistered[id] = true;
        emit Registered(id);
    }
}
