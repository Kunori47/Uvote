import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("TokenExchange", function () {
  let factory: any;
  let exchange: any;
  let creatorToken: any;
  let owner: any;
  let creator: any;
  let buyer: any;
  let seller: any;
  
  const INITIAL_PRICE = ethers.parseEther("0.01"); // 0.01 DEV por token
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  
  beforeEach(async function () {
    [owner, creator, buyer, seller] = await ethers.getSigners();
    
    // Desplegar Factory
    const FactoryContract = await ethers.getContractFactory("CreatorTokenFactory");
    factory = await FactoryContract.deploy();
    
    // Desplegar Exchange
    const ExchangeContract = await ethers.getContractFactory("TokenExchange");
    exchange = await ExchangeContract.deploy(await factory.getAddress());
    
    // Creator crea su token
    await factory.connect(creator).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
    const tokenAddress = await factory.getCreatorToken(creator.address);
    creatorToken = await ethers.getContractAt("CreatorToken", tokenAddress);
    
    // Autorizar exchange para mint/burn
    await creatorToken.connect(creator).setAuthorizedMinter(await exchange.getAddress(), true);
  });
  
  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await exchange.owner()).to.equal(owner.address);
    });
    
    it("Should set the correct factory address", async function () {
      expect(await exchange.factory()).to.equal(await factory.getAddress());
    });
    
    it("Should set default platform fee to 1%", async function () {
      expect(await exchange.platformFee()).to.equal(1);
    });
    
    it("Should start with 0 accumulated fees", async function () {
      expect(await exchange.accumulatedFees()).to.equal(0);
    });
    
    it("Should revert if factory address is zero", async function () {
      const ExchangeContract = await ethers.getContractFactory("TokenExchange");
      await expect(
        ExchangeContract.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid factory address");
    });
  });
  
  describe("Buying Tokens", function () {
    it("Should allow buying tokens with native currency", async function () {
      const buyAmount = ethers.parseEther("1"); // 1 DEV
      
      await exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
        value: buyAmount
      });
      
      // Verificar balance (debe recibir ~99 tokens después del 1% fee)
      const balance = await creatorToken.balanceOf(buyer.address);
      expect(balance).to.be.gt(0);
    });
    
    it("Should emit TokensPurchased event", async function () {
      const buyAmount = ethers.parseEther("1");
      
      await expect(
        exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
          value: buyAmount
        })
      ).to.emit(exchange, "TokensPurchased");
    });
    
    it("Should calculate correct token amount after fee", async function () {
      const buyAmount = ethers.parseEther("1"); // 1 DEV
      const fee = buyAmount / 100n; // 1% fee
      const amountAfterFee = buyAmount - fee;
      
      // 1 DEV = 100 tokens (price is 0.01 DEV per token)
      // After 1% fee: 0.99 DEV = 99 tokens
      const expectedTokens = (amountAfterFee * ethers.parseUnits("1", 18)) / INITIAL_PRICE;
      
      await exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
        value: buyAmount
      });
      
      const balance = await creatorToken.balanceOf(buyer.address);
      expect(balance).to.equal(expectedTokens);
    });
    
    it("Should accumulate platform fees", async function () {
      const buyAmount = ethers.parseEther("1");
      const expectedFee = buyAmount / 100n; // 1%
      
      await exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
        value: buyAmount
      });
      
      expect(await exchange.accumulatedFees()).to.equal(expectedFee);
    });
    
    it("Should revert if no native currency sent", async function () {
      await expect(
        exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
          value: 0
        })
      ).to.be.revertedWith("Must send native currency");
    });
    
    it("Should revert if token not registered", async function () {
      const randomAddress = ethers.Wallet.createRandom().address;
      
      await expect(
        exchange.connect(buyer).buyTokens(randomAddress, {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWith("Token not registered");
    });
    
    it("Should revert if creator is banned", async function () {
      // Banear al creador
      await factory.connect(owner).banCreator(creator.address, "Fraud");
      
      await expect(
        exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWith("Creator is banned");
    });
    
    it("Should handle multiple purchases", async function () {
      const buyAmount = ethers.parseEther("0.5");
      
      await exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
        value: buyAmount
      });
      
      const firstBalance = await creatorToken.balanceOf(buyer.address);
      
      await exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
        value: buyAmount
      });
      
      const secondBalance = await creatorToken.balanceOf(buyer.address);
      expect(secondBalance).to.be.gt(firstBalance);
    });
  });
  
  describe("Selling Tokens", function () {
    const buyAmount = ethers.parseEther("1"); // 1 DEV
    let tokenAmount: bigint;
    
    beforeEach(async function () {
      // Comprar tokens primero
      await exchange.connect(seller).buyTokens(await creatorToken.getAddress(), {
        value: buyAmount
      });
      
      tokenAmount = await creatorToken.balanceOf(seller.address);
      
      // Aprobar exchange para transferir tokens
      await creatorToken.connect(seller).approve(await exchange.getAddress(), tokenAmount);
      
      // Añadir liquidez al exchange para poder vender
      await owner.sendTransaction({
        to: await exchange.getAddress(),
        value: ethers.parseEther("10")
      });
    });
    
    it("Should allow selling tokens for native currency", async function () {
      const initialBalance = await ethers.provider.getBalance(seller.address);
      
      await exchange.connect(seller).sellTokens(
        await creatorToken.getAddress(),
        tokenAmount
      );
      
      const finalBalance = await ethers.provider.getBalance(seller.address);
      expect(finalBalance).to.be.gt(initialBalance - ethers.parseEther("0.1")); // Considerando gas
    });
    
    it("Should emit TokensSold event", async function () {
      await expect(
        exchange.connect(seller).sellTokens(await creatorToken.getAddress(), tokenAmount)
      ).to.emit(exchange, "TokensSold");
    });
    
    it("Should burn tokens when selling", async function () {
      await exchange.connect(seller).sellTokens(await creatorToken.getAddress(), tokenAmount);
      
      expect(await creatorToken.balanceOf(seller.address)).to.equal(0);
    });
    
    it("Should calculate correct native amount after fee", async function () {
      const weiForTokens = await creatorToken.calculateWeiForTokens(tokenAmount);
      const fee = weiForTokens / 100n; // 1%
      const expectedAmount = weiForTokens - fee;
      
      const initialBalance = await ethers.provider.getBalance(seller.address);
      
      const tx = await exchange.connect(seller).sellTokens(
        await creatorToken.getAddress(),
        tokenAmount
      );
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(seller.address);
      const received = finalBalance - initialBalance + gasUsed;
      
      expect(received).to.be.closeTo(expectedAmount, ethers.parseEther("0.001"));
    });
    
    it("Should accumulate platform fees from selling", async function () {
      const initialFees = await exchange.accumulatedFees();
      
      await exchange.connect(seller).sellTokens(await creatorToken.getAddress(), tokenAmount);
      
      const finalFees = await exchange.accumulatedFees();
      expect(finalFees).to.be.gt(initialFees);
    });
    
    it("Should revert if amount is 0", async function () {
      await expect(
        exchange.connect(seller).sellTokens(await creatorToken.getAddress(), 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
    
    it("Should revert if token not registered", async function () {
      const randomAddress = ethers.Wallet.createRandom().address;
      
      await expect(
        exchange.connect(seller).sellTokens(randomAddress, tokenAmount)
      ).to.be.revertedWith("Token not registered");
    });
    
    it("Should revert if creator is banned", async function () {
      await factory.connect(owner).banCreator(creator.address, "Fraud");
      
      await expect(
        exchange.connect(seller).sellTokens(await creatorToken.getAddress(), tokenAmount)
      ).to.be.revertedWith("Creator is banned");
    });
    
    it("Should revert if insufficient balance", async function () {
      const tooMuch = tokenAmount * 2n;
      
      await creatorToken.connect(seller).approve(await exchange.getAddress(), tooMuch);
      
      await expect(
        exchange.connect(seller).sellTokens(await creatorToken.getAddress(), tooMuch)
      ).to.be.revertedWith("Insufficient balance");
    });
    
    it("Should revert if contract has insufficient balance", async function () {
      // Crear mucho supply sin liquidez
      await creatorToken.connect(creator).setAuthorizedMinter(owner.address, true);
      await creatorToken.connect(owner).mint(seller.address, ethers.parseUnits("1000000", 18));
      
      await creatorToken.connect(seller).approve(
        await exchange.getAddress(),
        ethers.parseUnits("1000000", 18)
      );
      
      await expect(
        exchange.connect(seller).sellTokens(
          await creatorToken.getAddress(),
          ethers.parseUnits("1000000", 18)
        )
      ).to.be.revertedWith("Insufficient contract balance");
    });
  });
  
  describe("Price Calculations", function () {
    it("Should calculate correct buy amount", async function () {
      const nativeAmount = ethers.parseEther("1");
      
      const [tokensAmount, fee] = await exchange.calculateBuyAmount(
        await creatorToken.getAddress(),
        nativeAmount
      );
      
      expect(fee).to.equal(nativeAmount / 100n);
      expect(tokensAmount).to.be.gt(0);
    });
    
    it("Should calculate correct sell amount", async function () {
      const tokenAmount = ethers.parseUnits("100", 18);
      
      const [nativeAmount, fee] = await exchange.calculateSellAmount(
        await creatorToken.getAddress(),
        tokenAmount
      );
      
      expect(nativeAmount).to.be.gt(0);
      expect(fee).to.be.gt(0);
    });
    
    it("Should revert calculateBuyAmount with 0", async function () {
      await expect(
        exchange.calculateBuyAmount(await creatorToken.getAddress(), 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
    
    it("Should revert calculateSellAmount with 0", async function () {
      await expect(
        exchange.calculateSellAmount(await creatorToken.getAddress(), 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });
  
  describe("Platform Fee Configuration", function () {
    it("Should allow owner to update platform fee", async function () {
      await exchange.connect(owner).setPlatformFee(2);
      expect(await exchange.platformFee()).to.equal(2);
    });
    
    it("Should emit PlatformFeeUpdated event", async function () {
      await expect(
        exchange.connect(owner).setPlatformFee(2)
      ).to.emit(exchange, "PlatformFeeUpdated")
        .withArgs(1, 2);
    });
    
    it("Should revert if fee is too high", async function () {
      await expect(
        exchange.connect(owner).setPlatformFee(11)
      ).to.be.revertedWith("Fee too high (max 10%)");
    });
    
    it("Should revert if non-owner tries to update fee", async function () {
      await expect(
        exchange.connect(buyer).setPlatformFee(2)
      ).to.be.revertedWithCustomError(exchange, "OwnableUnauthorizedAccount");
    });
    
    it("Should apply new fee to subsequent transactions", async function () {
      await exchange.connect(owner).setPlatformFee(5); // 5%
      
      const buyAmount = ethers.parseEther("1");
      const expectedFee = (buyAmount * 5n) / 100n;
      
      await exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
        value: buyAmount
      });
      
      expect(await exchange.accumulatedFees()).to.equal(expectedFee);
    });
  });
  
  describe("Fee Withdrawal", function () {
    beforeEach(async function () {
      // Generar fees
      await exchange.connect(buyer).buyTokens(await creatorToken.getAddress(), {
        value: ethers.parseEther("1")
      });
    });
    
    it("Should allow owner to withdraw fees", async function () {
      const feesAccumulated = await exchange.accumulatedFees();
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      const tx = await exchange.connect(owner).withdrawFees(owner.address);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      const received = finalBalance - initialBalance + gasUsed;
      
      expect(received).to.be.closeTo(feesAccumulated, ethers.parseEther("0.001"));
    });
    
    it("Should emit FeesWithdrawn event", async function () {
      await expect(
        exchange.connect(owner).withdrawFees(owner.address)
      ).to.emit(exchange, "FeesWithdrawn");
    });
    
    it("Should reset accumulated fees to 0", async function () {
      await exchange.connect(owner).withdrawFees(owner.address);
      expect(await exchange.accumulatedFees()).to.equal(0);
    });
    
    it("Should revert if recipient is zero address", async function () {
      await expect(
        exchange.connect(owner).withdrawFees(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");
    });
    
    it("Should revert if no fees to withdraw", async function () {
      await exchange.connect(owner).withdrawFees(owner.address);
      
      await expect(
        exchange.connect(owner).withdrawFees(owner.address)
      ).to.be.revertedWith("No fees to withdraw");
    });
    
    it("Should revert if non-owner tries to withdraw", async function () {
      await expect(
        exchange.connect(buyer).withdrawFees(buyer.address)
      ).to.be.revertedWithCustomError(exchange, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Emergency Withdraw", function () {
    beforeEach(async function () {
      // Añadir fondos al contrato
      await owner.sendTransaction({
        to: await exchange.getAddress(),
        value: ethers.parseEther("5")
      });
    });
    
    it("Should allow owner to emergency withdraw", async function () {
      const amount = ethers.parseEther("1");
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      const tx = await exchange.connect(owner).emergencyWithdraw(owner.address, amount);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      const received = finalBalance - initialBalance + gasUsed;
      
      expect(received).to.be.closeTo(amount, ethers.parseEther("0.001"));
    });
    
    it("Should revert if recipient is zero address", async function () {
      await expect(
        exchange.connect(owner).emergencyWithdraw(ethers.ZeroAddress, ethers.parseEther("1"))
      ).to.be.revertedWith("Invalid recipient");
    });
    
    it("Should revert if amount is 0", async function () {
      await expect(
        exchange.connect(owner).emergencyWithdraw(owner.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
    
    it("Should revert if insufficient contract balance", async function () {
      await expect(
        exchange.connect(owner).emergencyWithdraw(owner.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Insufficient balance");
    });
    
    it("Should revert if non-owner tries to withdraw", async function () {
      await expect(
        exchange.connect(buyer).emergencyWithdraw(buyer.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(exchange, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Contract Balance", function () {
    it("Should return correct contract balance", async function () {
      const amount = ethers.parseEther("5");
      
      await owner.sendTransaction({
        to: await exchange.getAddress(),
        value: amount
      });
      
      expect(await exchange.getContractBalance()).to.equal(amount);
    });
    
    it("Should accept native currency via receive", async function () {
      const amount = ethers.parseEther("1");
      
      await owner.sendTransaction({
        to: await exchange.getAddress(),
        value: amount
      });
      
      expect(await ethers.provider.getBalance(await exchange.getAddress())).to.equal(amount);
    });
  });
});

