import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CreatorToken", function () {
  let creatorToken: any;
  let owner: any;
  let creator: any;
  let minter: any;
  let user1: any;
  let user2: any;
  
  const TOKEN_NAME = "Ibaisitos";
  const TOKEN_SYMBOL = "IBAI";
  const INITIAL_PRICE = ethers.parseEther("0.01"); // 0.01 DEV por token
  const THIRTY_DAYS = 30 * 24 * 60 * 60; // 30 días en segundos
  
  beforeEach(async function () {
    [owner, creator, minter, user1, user2] = await ethers.getSigners();
    
    const CreatorTokenFactory = await ethers.getContractFactory("CreatorToken");
    creatorToken = await CreatorTokenFactory.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_PRICE,
      creator.address,
      THIRTY_DAYS
    );
  });
  
  describe("Deployment", function () {
    it("Should set the correct token name and symbol", async function () {
      expect(await creatorToken.name()).to.equal(TOKEN_NAME);
      expect(await creatorToken.symbol()).to.equal(TOKEN_SYMBOL);
    });
    
    it("Should set the correct initial price", async function () {
      expect(await creatorToken.tokenPrice()).to.equal(INITIAL_PRICE);
    });
    
    it("Should set the creator as owner", async function () {
      expect(await creatorToken.owner()).to.equal(creator.address);
    });
    
    it("Should set the correct price update interval", async function () {
      expect(await creatorToken.priceUpdateInterval()).to.equal(THIRTY_DAYS);
    });
    
    it("Should initialize lastPriceUpdate to deployment time", async function () {
      const lastUpdate = await creatorToken.lastPriceUpdate();
      expect(lastUpdate).to.be.gt(0);
    });
    
    it("Should revert if initial price is 0", async function () {
      const CreatorTokenFactory = await ethers.getContractFactory("CreatorToken");
      await expect(
        CreatorTokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL, 0, creator.address, THIRTY_DAYS)
      ).to.be.revertedWith("Price must be greater than 0");
    });
    
    it("Should revert if creator address is zero", async function () {
      const CreatorTokenFactory = await ethers.getContractFactory("CreatorToken");
      await expect(
        CreatorTokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_PRICE, ethers.ZeroAddress, THIRTY_DAYS)
      ).to.be.revertedWithCustomError(CreatorTokenFactory, "OwnableInvalidOwner"); // OpenZeppelin Ownable custom error
    });
    
    it("Should revert if update interval is 0", async function () {
      const CreatorTokenFactory = await ethers.getContractFactory("CreatorToken");
      await expect(
        CreatorTokenFactory.deploy(TOKEN_NAME, TOKEN_SYMBOL, INITIAL_PRICE, creator.address, 0)
      ).to.be.revertedWith("Update interval must be greater than 0");
    });
  });
  
  describe("Authorized Minters", function () {
    it("Should allow owner to authorize a minter", async function () {
      await creatorToken.connect(creator).setAuthorizedMinter(minter.address, true);
      expect(await creatorToken.authorizedMinters(minter.address)).to.be.true;
    });
    
    it("Should emit MinterAuthorized event", async function () {
      await expect(creatorToken.connect(creator).setAuthorizedMinter(minter.address, true))
        .to.emit(creatorToken, "MinterAuthorized")
        .withArgs(minter.address, true);
    });
    
    it("Should allow owner to revoke minter authorization", async function () {
      await creatorToken.connect(creator).setAuthorizedMinter(minter.address, true);
      await creatorToken.connect(creator).setAuthorizedMinter(minter.address, false);
      expect(await creatorToken.authorizedMinters(minter.address)).to.be.false;
    });
    
    it("Should revert if non-owner tries to authorize minter", async function () {
      await expect(
        creatorToken.connect(user1).setAuthorizedMinter(minter.address, true)
      ).to.be.revertedWithCustomError(creatorToken, "OwnableUnauthorizedAccount");
    });
    
    it("Should revert if trying to authorize zero address", async function () {
      await expect(
        creatorToken.connect(creator).setAuthorizedMinter(ethers.ZeroAddress, true)
      ).to.be.revertedWith("Invalid minter address");
    });
  });
  
  describe("Price Updates", function () {
    it("Should allow owner to update price after cooldown", async function () {
      // Avanzar el tiempo 30 días
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      const newPrice = ethers.parseEther("0.02");
      await creatorToken.connect(creator).updatePrice(newPrice);
      
      expect(await creatorToken.tokenPrice()).to.equal(newPrice);
    });
    
    it("Should emit PriceUpdated event", async function () {
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      const newPrice = ethers.parseEther("0.02");
      await expect(creatorToken.connect(creator).updatePrice(newPrice))
        .to.emit(creatorToken, "PriceUpdated")
        .withArgs(INITIAL_PRICE, newPrice, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });
    
    it("Should update lastPriceUpdate timestamp", async function () {
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      const newPrice = ethers.parseEther("0.02");
      const tx = await creatorToken.connect(creator).updatePrice(newPrice);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      expect(await creatorToken.lastPriceUpdate()).to.equal(block!.timestamp);
    });
    
    it("Should revert if cooldown has not elapsed", async function () {
      const newPrice = ethers.parseEther("0.02");
      await expect(
        creatorToken.connect(creator).updatePrice(newPrice)
      ).to.be.revertedWith("Price update cooldown not elapsed");
    });
    
    it("Should revert if new price is 0", async function () {
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(
        creatorToken.connect(creator).updatePrice(0)
      ).to.be.revertedWith("Price must be greater than 0");
    });
    
    it("Should revert if new price equals current price", async function () {
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(
        creatorToken.connect(creator).updatePrice(INITIAL_PRICE)
      ).to.be.revertedWith("Price is the same");
    });
    
    it("Should revert if non-owner tries to update price", async function () {
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      await expect(
        creatorToken.connect(user1).updatePrice(ethers.parseEther("0.02"))
      ).to.be.revertedWithCustomError(creatorToken, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Price Update Interval Configuration", function () {
    it("Should allow owner to change update interval", async function () {
      const newInterval = 15 * 24 * 60 * 60; // 15 días
      await creatorToken.connect(creator).setPriceUpdateInterval(newInterval);
      expect(await creatorToken.priceUpdateInterval()).to.equal(newInterval);
    });
    
    it("Should emit PriceUpdateIntervalChanged event", async function () {
      const newInterval = 15 * 24 * 60 * 60;
      await expect(creatorToken.connect(creator).setPriceUpdateInterval(newInterval))
        .to.emit(creatorToken, "PriceUpdateIntervalChanged")
        .withArgs(THIRTY_DAYS, newInterval);
    });
    
    it("Should revert if new interval is 0", async function () {
      await expect(
        creatorToken.connect(creator).setPriceUpdateInterval(0)
      ).to.be.revertedWith("Interval must be greater than 0");
    });
    
    it("Should revert if new interval equals current interval", async function () {
      await expect(
        creatorToken.connect(creator).setPriceUpdateInterval(THIRTY_DAYS)
      ).to.be.revertedWith("Interval is the same");
    });
    
    it("Should revert if non-owner tries to change interval", async function () {
      await expect(
        creatorToken.connect(user1).setPriceUpdateInterval(15 * 24 * 60 * 60)
      ).to.be.revertedWithCustomError(creatorToken, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Can Update Price", function () {
    it("Should return false and remaining time during cooldown", async function () {
      const [canUpdate, timeRemaining] = await creatorToken.canUpdatePrice();
      expect(canUpdate).to.be.false;
      expect(timeRemaining).to.be.gt(0);
      expect(timeRemaining).to.be.lte(THIRTY_DAYS);
    });
    
    it("Should return true and 0 after cooldown", async function () {
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      const [canUpdate, timeRemaining] = await creatorToken.canUpdatePrice();
      expect(canUpdate).to.be.true;
      expect(timeRemaining).to.equal(0);
    });
  });
  
  describe("Token Calculations", function () {
    it("Should correctly calculate tokens for wei", async function () {
      const weiAmount = ethers.parseEther("1"); // 1 DEV
      const expectedTokens = ethers.parseUnits("100", 18); // 100 tokens (1 DEV / 0.01 DEV per token)
      
      expect(await creatorToken.calculateTokensForWei(weiAmount)).to.equal(expectedTokens);
    });
    
    it("Should correctly calculate wei for tokens", async function () {
      const tokenAmount = ethers.parseUnits("100", 18); // 100 tokens
      const expectedWei = ethers.parseEther("1"); // 1 DEV (100 tokens * 0.01 DEV per token)
      
      expect(await creatorToken.calculateWeiForTokens(tokenAmount)).to.equal(expectedWei);
    });
    
    it("Should handle different price correctly", async function () {
      // Avanzar tiempo y cambiar precio
      await ethers.provider.send("evm_increaseTime", [THIRTY_DAYS]);
      await ethers.provider.send("evm_mine", []);
      
      const newPrice = ethers.parseEther("0.05"); // 0.05 DEV por token
      await creatorToken.connect(creator).updatePrice(newPrice);
      
      const weiAmount = ethers.parseEther("1"); // 1 DEV
      const expectedTokens = ethers.parseUnits("20", 18); // 20 tokens (1 DEV / 0.05 DEV per token)
      
      expect(await creatorToken.calculateTokensForWei(weiAmount)).to.equal(expectedTokens);
    });
    
    it("Should revert calculateTokensForWei with 0 amount", async function () {
      await expect(
        creatorToken.calculateTokensForWei(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
    
    it("Should revert calculateWeiForTokens with 0 amount", async function () {
      await expect(
        creatorToken.calculateWeiForTokens(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });
  
  describe("Minting", function () {
    beforeEach(async function () {
      // Autorizar minter
      await creatorToken.connect(creator).setAuthorizedMinter(minter.address, true);
    });
    
    it("Should allow authorized minter to mint tokens", async function () {
      const amount = ethers.parseUnits("100", 18);
      await creatorToken.connect(minter).mint(user1.address, amount);
      
      expect(await creatorToken.balanceOf(user1.address)).to.equal(amount);
    });
    
    it("Should increase total supply when minting", async function () {
      const amount = ethers.parseUnits("100", 18);
      await creatorToken.connect(minter).mint(user1.address, amount);
      
      expect(await creatorToken.totalSupply()).to.equal(amount);
    });
    
    it("Should revert if unauthorized address tries to mint", async function () {
      const amount = ethers.parseUnits("100", 18);
      await expect(
        creatorToken.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWith("Not authorized to mint");
    });
    
    it("Should revert if minting to zero address", async function () {
      const amount = ethers.parseUnits("100", 18);
      await expect(
        creatorToken.connect(minter).mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Cannot mint to zero address");
    });
    
    it("Should revert if minting 0 amount", async function () {
      await expect(
        creatorToken.connect(minter).mint(user1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });
  
  describe("Burning", function () {
    const mintAmount = ethers.parseUnits("100", 18);
    
    beforeEach(async function () {
      // Autorizar minter y mintear tokens
      await creatorToken.connect(creator).setAuthorizedMinter(minter.address, true);
      await creatorToken.connect(minter).mint(user1.address, mintAmount);
    });
    
    it("Should allow authorized minter to burn tokens", async function () {
      const burnAmount = ethers.parseUnits("50", 18);
      await creatorToken.connect(minter).burn(user1.address, burnAmount);
      
      expect(await creatorToken.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
    });
    
    it("Should decrease total supply when burning", async function () {
      const burnAmount = ethers.parseUnits("50", 18);
      await creatorToken.connect(minter).burn(user1.address, burnAmount);
      
      expect(await creatorToken.totalSupply()).to.equal(mintAmount - burnAmount);
    });
    
    it("Should revert if unauthorized address tries to burn", async function () {
      const burnAmount = ethers.parseUnits("50", 18);
      await expect(
        creatorToken.connect(user1).burn(user1.address, burnAmount)
      ).to.be.revertedWith("Not authorized to burn");
    });
    
    it("Should revert if burning from zero address", async function () {
      const burnAmount = ethers.parseUnits("50", 18);
      await expect(
        creatorToken.connect(minter).burn(ethers.ZeroAddress, burnAmount)
      ).to.be.revertedWith("Cannot burn from zero address");
    });
    
    it("Should revert if burning 0 amount", async function () {
      await expect(
        creatorToken.connect(minter).burn(user1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
    
    it("Should revert if burning more than balance", async function () {
      const burnAmount = ethers.parseUnits("200", 18); // More than minted
      await expect(
        creatorToken.connect(minter).burn(user1.address, burnAmount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });
  
  describe("Token Info", function () {
    it("Should return correct token information", async function () {
      const [name, symbol, totalSupply, price, owner] = await creatorToken.getTokenInfo();
      
      expect(name).to.equal(TOKEN_NAME);
      expect(symbol).to.equal(TOKEN_SYMBOL);
      expect(totalSupply).to.equal(0); // No minting yet
      expect(price).to.equal(INITIAL_PRICE);
      expect(owner).to.equal(creator.address);
    });
    
    it("Should reflect changes in total supply", async function () {
      // Mintear tokens
      await creatorToken.connect(creator).setAuthorizedMinter(minter.address, true);
      const amount = ethers.parseUnits("100", 18);
      await creatorToken.connect(minter).mint(user1.address, amount);
      
      const [, , totalSupply] = await creatorToken.getTokenInfo();
      expect(totalSupply).to.equal(amount);
    });
  });
  
  describe("ERC20 Functionality", function () {
    const mintAmount = ethers.parseUnits("100", 18);
    
    beforeEach(async function () {
      await creatorToken.connect(creator).setAuthorizedMinter(minter.address, true);
      await creatorToken.connect(minter).mint(user1.address, mintAmount);
    });
    
    it("Should allow transfers between users", async function () {
      const transferAmount = ethers.parseUnits("50", 18);
      await creatorToken.connect(user1).transfer(user2.address, transferAmount);
      
      expect(await creatorToken.balanceOf(user1.address)).to.equal(mintAmount - transferAmount);
      expect(await creatorToken.balanceOf(user2.address)).to.equal(transferAmount);
    });
    
    it("Should allow approvals and transferFrom", async function () {
      const transferAmount = ethers.parseUnits("50", 18);
      
      await creatorToken.connect(user1).approve(user2.address, transferAmount);
      await creatorToken.connect(user2).transferFrom(user1.address, user2.address, transferAmount);
      
      expect(await creatorToken.balanceOf(user2.address)).to.equal(transferAmount);
    });
    
    it("Should have 18 decimals", async function () {
      expect(await creatorToken.decimals()).to.equal(18);
    });
  });
});

