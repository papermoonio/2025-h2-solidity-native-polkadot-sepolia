import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"

const { vars } = require("hardhat/config");

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkavm: true,
            nodeConfig: {
                nodeBinaryPath: "./bin/dev-node",
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
        },
        localNode: {
            polkavm: true,
            url: `http://127.0.0.1:8545`,
        },
        hub: {
            polkavm: true,
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            accounts: [vars.get("PASSET_HUB_PRIVATE_KEY"), vars.get("PASSET_HUB_PRIVATE_KEY2")],
        },
        sepolia: {
            polkavm: false,
            url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/7b0c8b0d85d843cfb9e94bc85450f7ad",
            accounts: [vars.get("SEPOLIA_PRIVATE_KEY"), vars.get("SEPOLIA_PRIVATE_KEY2")],
            chainId: 11155111,
        },
    },
}

export default config
