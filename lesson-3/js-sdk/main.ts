import { createPublicClient, defineChain, http, hexToBigInt, createWalletClient } from "viem"
import { ABI, BYTECODE } from "./erc20"
import { privateKeyToAccount } from "viem/accounts"
export const localChain = (url: string) => defineChain({
    id: 420420420,
    name: 'Testnet',
    network: 'Testnet',
    nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: [url],
        },
    },
    testnet: true,
})
async function main() {
    const url = "http://127.0.0.1:8545"
    const publicClient = createPublicClient({ chain: localChain(url), transport: http() })
    const privateKey = "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133"
    const wallet = privateKeyToAccount(privateKey)

    publicClient.watchBlockNumber({
        onBlockNumber: (blockNumber) => {
            console.log(`blockNumber is ${blockNumber}`)
        },
        onError: (error) => {
            console.error(`error is ${error}`)
        }
    })
}
main().catch((error) => {
    console.error(error)
})
