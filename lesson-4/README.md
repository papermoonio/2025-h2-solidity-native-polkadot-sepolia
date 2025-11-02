# Call vs DelegateCall Demo

This Hardhat project demonstrates the fundamental difference between `call` and `delegatecall` in Solidity.

## Overview

**Call** and **DelegateCall** are two low-level functions in Solidity that allow contracts to interact with other contracts. The key difference lies in **which contract's storage context** is used when executing the code:

- **`call`**: Executes code in the **called contract's context** (modifies the called contract's storage)
- **`delegatecall`**: Executes code in the **calling contract's context** (modifies the calling contract's storage)

## Project Structure

```
lesson-4/
├── contracts/
│   ├── Library.sol      # Contract with a function that modifies storage
│   └── Caller.sol       # Contract that uses both call and delegatecall
├── test/
│   └── CallVsDelegateCall.test.ts  # Comprehensive test suite
├── hardhat.config.ts    # Hardhat configuration
└── package.json         # Dependencies and scripts
```

## Contracts

### Library.sol
A simple contract with a storage variable `libraryValue` and functions to set/get it.

### Caller.sol
A contract that demonstrates both `call` and `delegatecall`:
- `executeCall()`: Uses `call` to execute `setValue()` on Library
- `executeDelegateCall()`: Uses `delegatecall` to execute `setValue()` on Library

## Key Differences Demonstrated

1. **Storage Context**:
   - When using `call`: Library's `libraryValue` is modified
   - When using `delegatecall`: Caller's `callerValue` is modified (because it uses Caller's storage)

2. **Storage Isolation**:
   - Multiple Caller instances can share the same Library contract
   - Each Caller maintains its own storage when using `delegatecall`

## Running the Project

### Install Dependencies
```bash
npm install
```

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm test
```

## Test Coverage

The test suite includes:
- ✅ Initial state verification
- ✅ Call behavior verification (modifies Library's storage)
- ✅ DelegateCall behavior verification (modifies Caller's storage)
- ✅ Side-by-side comparison tests
- ✅ Storage isolation tests
- ✅ Edge cases (zero values, large values)

All 12 tests pass successfully.

## Understanding the Results

When you run the tests, you'll see that:
- **`executeCall`**: Modifies `library.getValue()` but not `caller.getCallerValue()`
- **`executeDelegateCall`**: Modifies `caller.getCallerValue()` but not `library.getValue()`

This perfectly demonstrates that `delegatecall` preserves the calling contract's storage context, which is why it's commonly used for upgradeable proxy patterns and library contracts.

