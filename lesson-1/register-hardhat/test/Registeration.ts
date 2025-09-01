import hre from "hardhat"
import { expect } from "chai"
import { Registeration } from "../typechain-types/contracts/Registeration"

describe("Registeration", () => {
    let registeration: Registeration
    let owner: any
    let addr1: any
    let addr2: any

    before(async () => {
        ;[owner, addr1] = await hre.ethers.getSigners()
        addr2 = await hre.ethers.Wallet.createRandom()

        console.log("owner", owner.address)
        console.log("addr1", addr1.address)
        console.log("addr2", addr2.address)

        console.log("owner balance", await hre.ethers.provider.getBalance(owner.address))
        console.log("addr1 balance", await hre.ethers.provider.getBalance(addr1.address))
        console.log("addr2 balance", await hre.ethers.provider.getBalance(addr2.address))

        const Registeration = await hre.ethers.getContractFactory("Registeration")
        registeration = await Registeration.deploy()
        await registeration.waitForDeployment()
    })

    describe("Deployment", () => {
        it("should set the deployer as owner", async () => {
            expect(await registeration.owner()).to.equal(owner.address)
        })

        it("should have no IDs registered initially", async () => {
            expect(await registeration.isRegistered(1)).to.be.false
            expect(await registeration.isRegistered(999)).to.be.false
        })
    })

    describe("Registration", () => {
        it("should register a new ID successfully", async () => {
            const id = 1
            const tx = await registeration.register(id)
            await tx.wait()

            expect(await registeration.isRegistered(id)).to.be.true
        })

        it("should register multiple different IDs", async () => {
            const id1 = 2
            const id2 = 999
            const id3 = 12345

            const tx1 = await registeration.register(id1)
            await tx1.wait()

            const tx2 = await registeration.register(id2)
            await tx2.wait()

            const tx3 = await registeration.register(id3)
            await tx3.wait()

            expect(await registeration.isRegistered(id1)).to.be.true
            expect(await registeration.isRegistered(id2)).to.be.true
            expect(await registeration.isRegistered(id3)).to.be.true
        })

    })
})
