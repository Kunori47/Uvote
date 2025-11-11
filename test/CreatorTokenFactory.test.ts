import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CreatorTokenFactory", function () {
  let factory: any;
  let owner: any;
  let creator1: any;
  let creator2: any;
  let user1: any;
  let predictionMarket: any;
  let tokenExchange: any;
  
  const INITIAL_PRICE = ethers.parseEther("0.01");
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  
  beforeEach(async function () {
    [owner, creator1, creator2, user1, predictionMarket, tokenExchange] = await ethers.getSigners();
    
    const FactoryContract = await ethers.getContractFactory("CreatorTokenFactory");
    factory = await FactoryContract.deploy();
  });
  
  describe("Deployment", function () {
    it("Should set the deployer as owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });
    
    it("Should set default price update interval to 30 days", async function () {
      expect(await factory.defaultPriceUpdateInterval()).to.equal(THIRTY_DAYS);
    });
    
    it("Should start with 0 tokens created", async function () {
      expect(await factory.getTotalTokens()).to.equal(0);
    });
  });
  
  describe("Creating Creator Tokens", function () {
    it("Should allow a creator to create their token", async function () {
      const tx = await factory.connect(creator1).createCreatorToken(
        "Ibaisitos",
        "IBAI",
        INITIAL_PRICE
      );
      
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
      
      // Verificar que se registró correctamente
      const creatorInfo = await factory.creators(creator1.address);
      expect(creatorInfo.isActive).to.be.true;
      expect(creatorInfo.isBanned).to.be.false;
    });
    
    it("Should emit CreatorTokenCreated event", async function () {
      await expect(
        factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE)
      ).to.emit(factory, "CreatorTokenCreated");
    });
    
    it("Should store the token address in the creator info", async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      
      const creatorInfo = await factory.creators(creator1.address);
      expect(creatorInfo.tokenAddress).to.not.equal(ethers.ZeroAddress);
    });
    
    it("Should add token to allTokens array", async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      
      expect(await factory.getTotalTokens()).to.equal(1);
      
      const tokens = await factory.getAllTokens(0, 10);
      expect(tokens.length).to.equal(1);
    });
    
    it("Should map token address to creator", async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      
      const tokenAddress = await factory.getCreatorToken(creator1.address);
      const creatorAddress = await factory.getTokenCreator(tokenAddress);
      
      expect(creatorAddress).to.equal(creator1.address);
    });
    
    it("Should allow multiple creators to create tokens", async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      await factory.connect(creator2).createCreatorToken("RubToken", "RUBIUS", INITIAL_PRICE);
      
      expect(await factory.getTotalTokens()).to.equal(2);
    });
    
    it("Should revert if creator already has a token", async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      
      await expect(
        factory.connect(creator1).createCreatorToken("Ibaisitos2", "IBAI2", INITIAL_PRICE)
      ).to.be.revertedWith("Creator already has a token");
    });
    
    it("Should revert if initial price is 0", async function () {
      await expect(
        factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", 0)
      ).to.be.revertedWith("Initial price must be greater than 0");
    });
    
    it("Should create token with correct parameters", async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      
      const tokenAddress = await factory.getCreatorToken(creator1.address);
      const token = await ethers.getContractAt("CreatorToken", tokenAddress);
      
      expect(await token.name()).to.equal("Ibaisitos");
      expect(await token.symbol()).to.equal("IBAI");
      expect(await token.tokenPrice()).to.equal(INITIAL_PRICE);
      expect(await token.owner()).to.equal(creator1.address);
    });
  });
  
  describe("Banning Creators", function () {
    beforeEach(async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
    });
    
    it("Should allow owner to ban a creator", async function () {
      await factory.connect(owner).banCreator(creator1.address, "Fraudulent behavior");
      
      const creatorInfo = await factory.creators(creator1.address);
      expect(creatorInfo.isBanned).to.be.true;
    });
    
    it("Should emit CreatorBanned event", async function () {
      await expect(
        factory.connect(owner).banCreator(creator1.address, "Fraudulent behavior")
      ).to.emit(factory, "CreatorBanned")
        .withArgs(
          creator1.address,
          await factory.getCreatorToken(creator1.address),
          "Fraudulent behavior",
          await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1)
        );
    });
    
    it("Should store ban reason", async function () {
      const reason = "Fraudulent behavior";
      await factory.connect(owner).banCreator(creator1.address, reason);
      
      const creatorInfo = await factory.creators(creator1.address);
      expect(creatorInfo.reason).to.equal(reason);
    });
    
    it("Should update bannedAt timestamp", async function () {
      const tx = await factory.connect(owner).banCreator(creator1.address, "Fraud");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      const creatorInfo = await factory.creators(creator1.address);
      expect(creatorInfo.bannedAt).to.equal(block!.timestamp);
    });
    
    it("Should mark creator as not active when banned", async function () {
      await factory.connect(owner).banCreator(creator1.address, "Fraud");
      
      expect(await factory.isCreatorActive(creator1.address)).to.be.false;
    });
    
    it("Should revert if non-owner tries to ban", async function () {
      await expect(
        factory.connect(creator2).banCreator(creator1.address, "Fraud")
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
    
    it("Should revert if creator does not exist", async function () {
      await expect(
        factory.connect(owner).banCreator(creator2.address, "Fraud")
      ).to.be.revertedWith("Creator does not exist");
    });
    
    it("Should revert if creator is already banned", async function () {
      await factory.connect(owner).banCreator(creator1.address, "Fraud");
      
      await expect(
        factory.connect(owner).banCreator(creator1.address, "Fraud again")
      ).to.be.revertedWith("Creator is already banned");
    });
  });
  
  describe("Unbanning Creators", function () {
    beforeEach(async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      await factory.connect(owner).banCreator(creator1.address, "Fraud");
    });
    
    it("Should allow owner to unban a creator", async function () {
      await factory.connect(owner).unbanCreator(creator1.address);
      
      const creatorInfo = await factory.creators(creator1.address);
      expect(creatorInfo.isBanned).to.be.false;
    });
    
    it("Should emit CreatorUnbanned event", async function () {
      await expect(
        factory.connect(owner).unbanCreator(creator1.address)
      ).to.emit(factory, "CreatorUnbanned");
    });
    
    it("Should clear ban reason", async function () {
      await factory.connect(owner).unbanCreator(creator1.address);
      
      const creatorInfo = await factory.creators(creator1.address);
      expect(creatorInfo.reason).to.equal("");
    });
    
    it("Should reset bannedAt timestamp", async function () {
      await factory.connect(owner).unbanCreator(creator1.address);
      
      const creatorInfo = await factory.creators(creator1.address);
      expect(creatorInfo.bannedAt).to.equal(0);
    });
    
    it("Should mark creator as active again", async function () {
      await factory.connect(owner).unbanCreator(creator1.address);
      
      expect(await factory.isCreatorActive(creator1.address)).to.be.true;
    });
    
    it("Should revert if non-owner tries to unban", async function () {
      await expect(
        factory.connect(creator2).unbanCreator(creator1.address)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
    
    it("Should revert if creator does not exist", async function () {
      await expect(
        factory.connect(owner).unbanCreator(creator2.address)
      ).to.be.revertedWith("Creator does not exist");
    });
    
    it("Should revert if creator is not banned", async function () {
      await factory.connect(owner).unbanCreator(creator1.address);
      
      await expect(
        factory.connect(owner).unbanCreator(creator1.address)
      ).to.be.revertedWith("Creator is not banned");
    });
  });
  
  describe("Authorized Contracts", function () {
    it("Should allow owner to authorize a contract", async function () {
      await factory.connect(owner).setAuthorizedContract(predictionMarket.address, true);
      
      expect(await factory.authorizedContracts(predictionMarket.address)).to.be.true;
    });
    
    it("Should emit ContractAuthorized event", async function () {
      await expect(
        factory.connect(owner).setAuthorizedContract(predictionMarket.address, true)
      ).to.emit(factory, "ContractAuthorized")
        .withArgs(predictionMarket.address, true);
    });
    
    it("Should allow owner to revoke contract authorization", async function () {
      await factory.connect(owner).setAuthorizedContract(predictionMarket.address, true);
      await factory.connect(owner).setAuthorizedContract(predictionMarket.address, false);
      
      expect(await factory.authorizedContracts(predictionMarket.address)).to.be.false;
    });
    
    it("Should revert if trying to authorize zero address", async function () {
      await expect(
        factory.connect(owner).setAuthorizedContract(ethers.ZeroAddress, true)
      ).to.be.revertedWith("Invalid contract address");
    });
    
    it("Should revert if non-owner tries to authorize contract", async function () {
      await expect(
        factory.connect(creator1).setAuthorizedContract(predictionMarket.address, true)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Default Price Update Interval", function () {
    it("Should allow owner to change default interval", async function () {
      const newInterval = 15 * 24 * 60 * 60; // 15 días
      await factory.connect(owner).setDefaultPriceUpdateInterval(newInterval);
      
      expect(await factory.defaultPriceUpdateInterval()).to.equal(newInterval);
    });
    
    it("Should emit DefaultPriceUpdateIntervalChanged event", async function () {
      const newInterval = 15 * 24 * 60 * 60;
      await expect(
        factory.connect(owner).setDefaultPriceUpdateInterval(newInterval)
      ).to.emit(factory, "DefaultPriceUpdateIntervalChanged")
        .withArgs(THIRTY_DAYS, newInterval);
    });
    
    it("Should apply new interval to newly created tokens", async function () {
      const newInterval = 15 * 24 * 60 * 60;
      await factory.connect(owner).setDefaultPriceUpdateInterval(newInterval);
      
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      
      const tokenAddress = await factory.getCreatorToken(creator1.address);
      const token = await ethers.getContractAt("CreatorToken", tokenAddress);
      
      expect(await token.priceUpdateInterval()).to.equal(newInterval);
    });
    
    it("Should revert if new interval is 0", async function () {
      await expect(
        factory.connect(owner).setDefaultPriceUpdateInterval(0)
      ).to.be.revertedWith("Interval must be greater than 0");
    });
    
    it("Should revert if non-owner tries to change interval", async function () {
      await expect(
        factory.connect(creator1).setDefaultPriceUpdateInterval(15 * 24 * 60 * 60)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });
  
  describe("Creator Queries", function () {
    beforeEach(async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
    });
    
    it("Should return if creator is active", async function () {
      expect(await factory.isCreatorActive(creator1.address)).to.be.true;
    });
    
    it("Should return false for banned creator", async function () {
      await factory.connect(owner).banCreator(creator1.address, "Fraud");
      
      expect(await factory.isCreatorActive(creator1.address)).to.be.false;
    });
    
    it("Should return false for non-existent creator", async function () {
      expect(await factory.isCreatorActive(creator2.address)).to.be.false;
    });
    
    it("Should return complete creator info", async function () {
      const [tokenAddress, isActive, isBanned, createdAt, bannedAt, reason] = 
        await factory.getCreatorInfo(creator1.address);
      
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
      expect(isActive).to.be.true;
      expect(isBanned).to.be.false;
      expect(createdAt).to.be.gt(0);
      expect(bannedAt).to.equal(0);
      expect(reason).to.equal("");
    });
    
    it("Should return creator's token address", async function () {
      const tokenAddress = await factory.getCreatorToken(creator1.address);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
    });
    
    it("Should revert when getting token for non-existent creator", async function () {
      await expect(
        factory.getCreatorToken(creator2.address)
      ).to.be.revertedWith("Creator does not exist");
    });
    
    it("Should return creator from token address", async function () {
      const tokenAddress = await factory.getCreatorToken(creator1.address);
      const creatorAddress = await factory.getTokenCreator(tokenAddress);
      
      expect(creatorAddress).to.equal(creator1.address);
    });
  });
  
  describe("Token Listing", function () {
    beforeEach(async function () {
      await factory.connect(creator1).createCreatorToken("Ibaisitos", "IBAI", INITIAL_PRICE);
      await factory.connect(creator2).createCreatorToken("RubToken", "RUBIUS", INITIAL_PRICE);
    });
    
    it("Should return total number of tokens", async function () {
      expect(await factory.getTotalTokens()).to.equal(2);
    });
    
    it("Should return all tokens with pagination", async function () {
      const tokens = await factory.getAllTokens(0, 10);
      expect(tokens.length).to.equal(2);
    });
    
    it("Should handle pagination correctly", async function () {
      const firstToken = await factory.getAllTokens(0, 1);
      expect(firstToken.length).to.equal(1);
      
      const secondToken = await factory.getAllTokens(1, 1);
      expect(secondToken.length).to.equal(1);
      
      expect(firstToken[0]).to.not.equal(secondToken[0]);
    });
    
    it("Should limit results if limit exceeds total", async function () {
      const tokens = await factory.getAllTokens(0, 100);
      expect(tokens.length).to.equal(2);
    });
    
    it("Should revert if offset is out of bounds", async function () {
      await expect(
        factory.getAllTokens(10, 5)
      ).to.be.revertedWith("Offset out of bounds");
    });
  });
});

