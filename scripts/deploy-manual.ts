import { network } from "hardhat";

async function main() {
    const { ethers } = await network.connect();

    console.log("Starting manual deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "DEV");

    // 1. Deploy CreatorTokenFactory
    console.log("\n1. Deploying CreatorTokenFactory...");
    const CreatorTokenFactory = await ethers.getContractFactory("CreatorTokenFactory");
    const factory = await CreatorTokenFactory.deploy();
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ CreatorTokenFactory deployed to:", factoryAddress);

    // 2. Deploy PredictionMarket
    console.log("\n2. Deploying PredictionMarket...");
    try {
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const predictionMarket = await PredictionMarket.deploy(factoryAddress);
        await predictionMarket.waitForDeployment();
        const predictionMarketAddress = await predictionMarket.getAddress();
        console.log("✅ PredictionMarket deployed to:", predictionMarketAddress);
    } catch (error: any) {
        console.error("❌ PredictionMarket deployment failed:", error.message);
        console.error("Full error:", error);
    }

    // 3. Deploy TokenExchange
    console.log("\n3. Deploying TokenExchange...");
    try {
        const TokenExchange = await ethers.getContractFactory("TokenExchange");
        const tokenExchange = await TokenExchange.deploy(factoryAddress);
        await tokenExchange.waitForDeployment();
        const tokenExchangeAddress = await tokenExchange.getAddress();
        console.log("✅ TokenExchange deployed to:", tokenExchangeAddress);
    } catch (error: any) {
        console.error("❌ TokenExchange deployment failed:", error.message);
        console.error("Full error:", error);
    }

    console.log("\nDeployment script finished!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
