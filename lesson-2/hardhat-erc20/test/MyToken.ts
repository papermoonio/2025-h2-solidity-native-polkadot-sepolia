import hre from "hardhat"
import { expect } from "chai"
import { MyToken } from "../typechain-types/contracts/MyToken"

describe("MyToken", () => {
    let token: MyToken
    let owner: any
    let addr1: any
    let addr2: any

    const toWei = (value: string) => hre.ethers.parseUnits(value, 18)

    beforeEach(async () => {
        ;[owner, addr1, addr2] = await hre.ethers.getSigners()
        const balance = await hre.ethers.provider.getBalance(owner.address)
        console.log("balance", balance)

        const MyToken = await hre.ethers.getContractFactory("MyToken")
        token = await MyToken.deploy(toWei("1000000"))
        await token.waitForDeployment()
    })

    it("assigns initial supply to deployer", async () => {
        const balance = await token.balanceOf(owner.address)
        expect(balance).to.equal(toWei("1000000"))
    })

    it("allows minting", async () => {
        const amount = toWei("1000")
        await token.mint(addr1.address, amount)
        const balance = await token.balanceOf(addr1.address)
        expect(balance).to.equal(amount)
    })
})
