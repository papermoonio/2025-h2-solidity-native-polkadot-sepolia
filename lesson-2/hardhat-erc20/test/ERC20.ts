import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("ERC20 Token", function () {
    const TOKEN_NAME = "TestToken";
    const TOKEN_SYMBOL = "TT";
    const TOKEN_DECIMALS = 18;
    const INITIAL_SUPPLY = ethers.parseUnits("1000000", TOKEN_DECIMALS); // 1 million tokens

    let token: any;
    let owner: any;
    let addr1: any;
    let addr2: any;
    let addr3: any;

    beforeEach(async function () {
        // Get test accounts
        [owner] = await ethers.getSigners();
        addr1 = await ethers.Wallet.createRandom();
        addr2 = await ethers.Wallet.createRandom();
        addr3 = await ethers.Wallet.createRandom();

        // Transfer ETH from owner to addr3 (if needed for gas)
        const ethAmount = ethers.parseEther("1.0"); // 1 ETH
        await owner.sendTransaction({
            to: addr1.address,
            value: ethAmount
        });

        let balance = await ethers.provider.getBalance(addr1.address);
        console.log("balance", balance);

        await owner.sendTransaction({
            to: addr2.address,
            value: ethAmount
        });
        await owner.sendTransaction({
            to: addr3.address,
            value: ethAmount
        });

        // Deploy a fresh ERC20 contract for each test
        token = await ethers.deployContract("ERC20", [
            TOKEN_NAME,
            TOKEN_SYMBOL,
            TOKEN_DECIMALS,
            INITIAL_SUPPLY
        ]);

        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct token name", async function () {
            expect(await token.name()).to.equal(TOKEN_NAME);
        });

        it("Should set the correct token symbol", async function () {
            expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
        });

        it("Should set the correct decimals", async function () {
            expect(await token.decimals()).to.equal(TOKEN_DECIMALS);
        });

        it("Should assign the total supply to the deployer", async function () {
            const ownerBalance = await token.balanceOf(owner.address);
            expect(await token.totalSupply()).to.equal(ownerBalance);
            expect(ownerBalance).to.equal(INITIAL_SUPPLY);
        });

        it("Should deploy with zero initial supply if specified", async function () {
            const zeroSupplyToken = await ethers.deployContract("ERC20", [
                "ZeroToken",
                "ZT",
                18,
                0
            ]);
            expect(await zeroSupplyToken.totalSupply()).to.equal(0);
        });
    });

    describe("Metadata Functions", function () {
        it("Should return correct name", async function () {
            expect(await token.name()).to.equal(TOKEN_NAME);
        });

        it("Should return correct symbol", async function () {
            expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
        });

        it("Should return correct decimals", async function () {
            expect(await token.decimals()).to.equal(TOKEN_DECIMALS);
        });

        it("Should return correct total supply", async function () {
            expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
        });
    });

    describe("balanceOf", function () {
        it("Should return the correct balance for an account", async function () {
            expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
            expect(await token.balanceOf(addr1.address)).to.equal(0);
        });

        it("Should return zero for accounts that have never held tokens", async function () {
            expect(await token.balanceOf(addr2.address)).to.equal(0);
        });
    });

    describe("transfer", function () {
        it("Should transfer tokens between accounts", async function () {
            const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.transfer(addr1.address, transferAmount);

            expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
            expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - transferAmount);
        });

        it("Should emit Transfer event", async function () {
            const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await expect(token.transfer(addr1.address, transferAmount))
                .to.emit(token, "Transfer")
                .withArgs(owner.address, addr1.address, transferAmount);
        });

        it("Should fail when sender doesn't have enough tokens", async function () {
            const initialOwnerBalance = await token.balanceOf(owner.address);

            await expect(
                token.connect(addr1).transfer(owner.address, 1n)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });

        it("Should fail when transferring to zero address", async function () {
            await expect(
                token.transfer(ethers.ZeroAddress, 100)
            ).to.be.revertedWith("ERC20: transfer to the zero address");
        });

        it("Should handle zero amount transfers", async function () {
            await expect(token.transfer(addr1.address, 0))
                .to.emit(token, "Transfer")
                .withArgs(owner.address, addr1.address, 0);
        });

        it("Should update balances correctly after multiple transfers", async function () {
            const amount1 = ethers.parseUnits("100", TOKEN_DECIMALS);
            const amount2 = ethers.parseUnits("50", TOKEN_DECIMALS);

            await token.transfer(addr1.address, amount1);
            await token.transfer(addr2.address, amount2);

            expect(await token.balanceOf(owner.address)).to.equal(
                INITIAL_SUPPLY - amount1 - amount2
            );
            expect(await token.balanceOf(addr1.address)).to.equal(amount1);
            expect(await token.balanceOf(addr2.address)).to.equal(amount2);
        });

        it("Should return true on successful transfer", async function () {
            const result = await token.transfer.staticCall(addr1.address, 100);
            expect(result).to.equal(true);
        });
    });

    describe("approve", function () {
        it("Should approve tokens for delegated transfer", async function () {
            const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.approve(addr1.address, approveAmount);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);
        });

        it("Should emit Approval event", async function () {
            const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await expect(token.approve(addr1.address, approveAmount))
                .to.emit(token, "Approval")
                .withArgs(owner.address, addr1.address, approveAmount);
        });

        it("Should allow updating approval amount", async function () {
            const firstApproval = ethers.parseUnits("100", TOKEN_DECIMALS);
            const secondApproval = ethers.parseUnits("200", TOKEN_DECIMALS);

            await token.approve(addr1.address, firstApproval);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(firstApproval);

            await token.approve(addr1.address, secondApproval);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(secondApproval);
        });

        it("Should fail when approving to zero address", async function () {
            await expect(
                token.approve(ethers.ZeroAddress, 100)
            ).to.be.revertedWith("ERC20: approve to the zero address");
        });

        it("Should allow zero amount approval", async function () {
            await token.approve(addr1.address, 0);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
        });

        it("Should return true on successful approval", async function () {
            const result = await token.approve.staticCall(addr1.address, 100);
            expect(result).to.equal(true);
        });
    });

    describe("allowance", function () {
        it("Should return correct allowance amount", async function () {
            const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.approve(addr1.address, approveAmount);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(approveAmount);
        });

        it("Should return zero for accounts with no allowance", async function () {
            expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
        });

        it("Should track multiple allowances independently", async function () {
            const amount1 = ethers.parseUnits("100", TOKEN_DECIMALS);
            const amount2 = ethers.parseUnits("200", TOKEN_DECIMALS);

            await token.approve(addr1.address, amount1);
            await token.approve(addr2.address, amount2);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(amount1);
            expect(await token.allowance(owner.address, addr2.address)).to.equal(amount2);
        });
    });

    describe("transferFrom", function () {
        it("Should transfer tokens using allowance", async function () {
            const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);
            const transferAmount = ethers.parseUnits("50", TOKEN_DECIMALS);

            await token.approve(addr1.address, approveAmount);
            await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

            expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
            expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - transferAmount);
            expect(await token.allowance(owner.address, addr1.address)).to.equal(
                approveAmount - transferAmount
            );
        });

        it("Should emit Transfer event", async function () {
            const approveAmount = ethers.parseUnits("100", TOKEN_DECIMALS);
            const transferAmount = ethers.parseUnits("50", TOKEN_DECIMALS);

            await token.approve(addr1.address, approveAmount);

            await expect(
                token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
            )
                .to.emit(token, "Transfer")
                .withArgs(owner.address, addr2.address, transferAmount);
        });

        it("Should fail when allowance is insufficient", async function () {
            const approveAmount = ethers.parseUnits("50", TOKEN_DECIMALS);
            const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.approve(addr1.address, approveAmount);

            await expect(
                token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
            ).to.be.revertedWith("ERC20: insufficient allowance");
        });

        it("Should fail when balance is insufficient", async function () {
            const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            // addr1 approves addr2 to spend, but addr1 has no tokens
            await token.connect(addr1).approve(addr2.address, transferAmount);

            await expect(
                token.connect(addr2).transferFrom(addr1.address, addr3.address, transferAmount)
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("Should fail when transferring to zero address", async function () {
            await token.approve(addr1.address, 100);

            await expect(
                token.connect(addr1).transferFrom(owner.address, ethers.ZeroAddress, 100)
            ).to.be.revertedWith("ERC20: transfer to the zero address");
        });

        it("Should handle unlimited allowance (max uint256)", async function () {
            const maxAllowance = ethers.MaxUint256;
            const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.approve(addr1.address, maxAllowance);
            await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

            // Allowance should remain at max (unlimited)
            expect(await token.allowance(owner.address, addr1.address)).to.equal(maxAllowance);
            expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
        });

        it("Should return true on successful transferFrom", async function () {
            await token.approve(addr1.address, 100);
            const result = await token.connect(addr1).transferFrom.staticCall(
                owner.address,
                addr2.address,
                100
            );
            expect(result).to.equal(true);
        });
    });

    describe("increaseAllowance", function () {
        it("Should increase allowance correctly", async function () {
            const initialAllowance = ethers.parseUnits("100", TOKEN_DECIMALS);
            const increaseAmount = ethers.parseUnits("50", TOKEN_DECIMALS);

            await token.approve(addr1.address, initialAllowance);
            await token.increaseAllowance(addr1.address, increaseAmount);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(
                initialAllowance + increaseAmount
            );
        });

        it("Should emit Approval event", async function () {
            const increaseAmount = ethers.parseUnits("50", TOKEN_DECIMALS);

            await expect(token.increaseAllowance(addr1.address, increaseAmount))
                .to.emit(token, "Approval")
                .withArgs(owner.address, addr1.address, increaseAmount);
        });

        it("Should increase allowance from zero", async function () {
            const increaseAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.increaseAllowance(addr1.address, increaseAmount);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(increaseAmount);
        });

        it("Should return true on success", async function () {
            const result = await token.increaseAllowance.staticCall(addr1.address, 100);
            expect(result).to.equal(true);
        });
    });

    describe("decreaseAllowance", function () {
        it("Should decrease allowance correctly", async function () {
            const initialAllowance = ethers.parseUnits("100", TOKEN_DECIMALS);
            const decreaseAmount = ethers.parseUnits("30", TOKEN_DECIMALS);

            await token.approve(addr1.address, initialAllowance);
            await token.decreaseAllowance(addr1.address, decreaseAmount);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(
                initialAllowance - decreaseAmount
            );
        });

        it("Should emit Approval event", async function () {
            const initialAllowance = ethers.parseUnits("100", TOKEN_DECIMALS);
            const decreaseAmount = ethers.parseUnits("30", TOKEN_DECIMALS);

            await token.approve(addr1.address, initialAllowance);

            await expect(token.decreaseAllowance(addr1.address, decreaseAmount))
                .to.emit(token, "Approval")
                .withArgs(owner.address, addr1.address, initialAllowance - decreaseAmount);
        });

        it("Should fail when decreasing below zero", async function () {
            const initialAllowance = ethers.parseUnits("50", TOKEN_DECIMALS);
            const decreaseAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.approve(addr1.address, initialAllowance);

            await expect(
                token.decreaseAllowance(addr1.address, decreaseAmount)
            ).to.be.revertedWith("ERC20: decreased allowance below zero");
        });

        it("Should decrease allowance to zero", async function () {
            const allowance = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.approve(addr1.address, allowance);
            await token.decreaseAllowance(addr1.address, allowance);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
        });

        it("Should return true on success", async function () {
            await token.approve(addr1.address, 100);
            const result = await token.decreaseAllowance.staticCall(addr1.address, 50);
            expect(result).to.equal(true);
        });
    });

    describe("mint", function () {
        it("Should mint new tokens", async function () {
            const mintAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);
            const initialSupply = await token.totalSupply();

            await token.mint(addr1.address, mintAmount);

            expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
            expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);
        });

        it("Should emit Transfer event from zero address", async function () {
            const mintAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);

            await expect(token.mint(addr1.address, mintAmount))
                .to.emit(token, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, mintAmount);
        });

        it("Should fail when minting to zero address", async function () {
            await expect(
                token.mint(ethers.ZeroAddress, 100)
            ).to.be.revertedWith("ERC20: mint to the zero address");
        });

        it("Should allow anyone to mint (for testing)", async function () {
            const mintAmount = ethers.parseUnits("500", TOKEN_DECIMALS);

            await token.connect(addr1).mint(addr2.address, mintAmount);

            expect(await token.balanceOf(addr2.address)).to.equal(mintAmount);
        });
    });

    describe("burn", function () {
        it("Should burn tokens from caller", async function () {
            const burnAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);
            const initialBalance = await token.balanceOf(owner.address);
            const initialSupply = await token.totalSupply();

            await token.burn(burnAmount);

            expect(await token.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
            expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
        });

        it("Should emit Transfer event to zero address", async function () {
            const burnAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);

            await expect(token.burn(burnAmount))
                .to.emit(token, "Transfer")
                .withArgs(owner.address, ethers.ZeroAddress, burnAmount);
        });

        it("Should fail when burning more than balance", async function () {
            const balance = await token.balanceOf(addr1.address);

            await expect(
                token.connect(addr1).burn(balance + 1n)
            ).to.be.revertedWith("ERC20: burn amount exceeds balance");
        });
    });

    describe("burnFrom", function () {
        it("Should burn tokens from another account with allowance", async function () {
            const transferAmount = ethers.parseUnits("1000", TOKEN_DECIMALS);
            const burnAmount = ethers.parseUnits("500", TOKEN_DECIMALS);

            // Transfer some tokens to addr1
            await token.transfer(addr1.address, transferAmount);

            // addr1 approves addr2 to spend
            await token.connect(addr1).approve(addr2.address, burnAmount);

            const initialSupply = await token.totalSupply();
            const initialBalance = await token.balanceOf(addr1.address);

            // addr2 burns from addr1
            await token.connect(addr2).burnFrom(addr1.address, burnAmount);

            expect(await token.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
            expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
            expect(await token.allowance(addr1.address, addr2.address)).to.equal(0);
        });

        it("Should emit Transfer event to zero address", async function () {
            const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.approve(addr1.address, amount);

            await expect(token.connect(addr1).burnFrom(owner.address, amount))
                .to.emit(token, "Transfer")
                .withArgs(owner.address, ethers.ZeroAddress, amount);
        });

        it("Should fail when allowance is insufficient", async function () {
            const approveAmount = ethers.parseUnits("50", TOKEN_DECIMALS);
            const burnAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

            await token.approve(addr1.address, approveAmount);

            await expect(
                token.connect(addr1).burnFrom(owner.address, burnAmount)
            ).to.be.revertedWith("ERC20: insufficient allowance");
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle transfer to self", async function () {
            const amount = ethers.parseUnits("100", TOKEN_DECIMALS);
            const initialBalance = await token.balanceOf(owner.address);

            await token.transfer(owner.address, amount);

            expect(await token.balanceOf(owner.address)).to.equal(initialBalance);
        });

        it("Should handle multiple approvals correctly", async function () {
            await token.approve(addr1.address, 100);
            await token.approve(addr2.address, 200);
            await token.approve(addr1.address, 300);

            expect(await token.allowance(owner.address, addr1.address)).to.equal(300);
            expect(await token.allowance(owner.address, addr2.address)).to.equal(200);
        });

        it("Should handle complex transfer scenarios", async function () {
            const amount1 = ethers.parseUnits("100", TOKEN_DECIMALS);
            const amount2 = ethers.parseUnits("50", TOKEN_DECIMALS);

            // owner -> addr1
            await token.transfer(addr1.address, amount1);

            // addr1 -> addr2
            await token.connect(addr1).transfer(addr2.address, amount2);

            // addr2 -> owner
            await token.connect(addr2).transfer(owner.address, amount2);

            expect(await token.balanceOf(addr1.address)).to.equal(amount2);
            expect(await token.balanceOf(addr2.address)).to.equal(0);
            expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - amount2);
        });

        it("Should maintain total supply invariant", async function () {
            const initialSupply = await token.totalSupply();

            // Perform various operations
            await token.transfer(addr1.address, ethers.parseUnits("100", TOKEN_DECIMALS));
            await token.transfer(addr2.address, ethers.parseUnits("200", TOKEN_DECIMALS));
            await token.connect(addr1).transfer(addr2.address, ethers.parseUnits("50", TOKEN_DECIMALS));

            // Total supply should remain unchanged
            expect(await token.totalSupply()).to.equal(initialSupply);

            // Sum of all balances should equal total supply
            const ownerBal = await token.balanceOf(owner.address);
            const addr1Bal = await token.balanceOf(addr1.address);
            const addr2Bal = await token.balanceOf(addr2.address);

            expect(ownerBal + addr1Bal + addr2Bal).to.equal(initialSupply);
        });
    });

    describe("Events", function () {
        it("Should emit Transfer events with correct parameters", async function () {
            const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

            const tx = await token.transfer(addr1.address, amount);
            const receipt = await tx.wait();

            const transferEvent = receipt.logs.find(
                (log: any) => log.fragment && log.fragment.name === "Transfer"
            );

            expect(transferEvent).to.not.be.undefined;
            expect(transferEvent.args[0]).to.equal(owner.address);
            expect(transferEvent.args[1]).to.equal(addr1.address);
            expect(transferEvent.args[2]).to.equal(amount);
        });

        it("Should emit Approval events with correct parameters", async function () {
            const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

            const tx = await token.approve(addr1.address, amount);
            const receipt = await tx.wait();

            const approvalEvent = receipt.logs.find(
                (log: any) => log.fragment && log.fragment.name === "Approval"
            );

            expect(approvalEvent).to.not.be.undefined;
            expect(approvalEvent.args[0]).to.equal(owner.address);
            expect(approvalEvent.args[1]).to.equal(addr1.address);
            expect(approvalEvent.args[2]).to.equal(amount);
        });
    });
});

