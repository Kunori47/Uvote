import { network } from "hardhat";

const { ethers } = await network.connect();

const TARGET_ADDRESS = "0x51688BD1aa9fCa4e1c71E8D91CFEDa5E684A465C";

async function main() {
  console.log("\n🔍 Verificando balance de la dirección...\n");
  console.log(`📍 Dirección: ${TARGET_ADDRESS}\n`);
  console.log("=" .repeat(80));
  
  const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);
  
  // 1. Balance ETH
  const ethBalance = await ethers.provider.getBalance(TARGET_ADDRESS);
  console.log(`\n💵 Balance ETH: ${ethers.formatEther(ethBalance)} ETH`);
  
  // 2. Obtener todos los tokens de creadores
  const [deployer, creator1, creator2, creator3] = await ethers.getSigners();
  const creators = [creator1, creator2, creator3];
  const tokenNames = ["Ibaisitos (IBAI)", "Rubius Coin (RUBIUS)", "Auron Coin (AURON)"];
  
  console.log("\n📦 Tokens de creadores:\n");
  
  let totalValue = 0;
  
  for (let i = 0; i < creators.length; i++) {
    try {
      const tokenAddress = await factory.getCreatorToken(creators[i].address);
      
      if (tokenAddress === ethers.ZeroAddress) {
        console.log(`  ${i + 1}. ${tokenNames[i]}: Token no existe`);
        continue;
      }
      
      const token = await ethers.getContractAt("CreatorToken", tokenAddress);
      const balance = await token.balanceOf(TARGET_ADDRESS);
      const symbol = await token.symbol();
      const price = await token.tokenPrice();
      const priceInEth = ethers.formatEther(price);
      const balanceFormatted = ethers.formatUnits(balance, 18);
      const value = parseFloat(balanceFormatted) * parseFloat(priceInEth);
      totalValue += value;
      
      console.log(`  ${i + 1}. ${tokenNames[i]}:`);
      console.log(`     Token: ${tokenAddress}`);
      console.log(`     Balance: ${balanceFormatted} ${symbol}`);
      console.log(`     Precio: ${priceInEth} ETH`);
      console.log(`     Valor: ${value.toFixed(4)} ETH`);
      console.log("");
      
    } catch (error: any) {
      console.log(`  ${i + 1}. ${tokenNames[i]}: Error - ${error.message}`);
    }
  }
  
  console.log("=" .repeat(80));
  console.log(`\n💰 Valor total del portfolio: ${totalValue.toFixed(4)} ETH\n`);
  
  // Verificar si la dirección tiene algún token
  if (totalValue === 0 && ethBalance === 0n) {
    console.log("⚠️  La dirección no tiene tokens ni ETH.");
    console.log("💡 Voy a comprar tokens ahora...\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

