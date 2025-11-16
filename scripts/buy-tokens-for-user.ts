import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script para comprar tokens de creadores para el usuario de prueba
 * Asume que los tokens ya están creados
 * 
 * Ejecutar:
 * npx hardhat run scripts/buy-tokens-for-user.ts --network localhost
 */

async function main() {
  console.log("\n💰 Comprando tokens para el usuario...\n");
  
  const [deployer, creator1, creator2, creator3] = await ethers.getSigners();
  
  const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const EXCHANGE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);
  const exchange = await ethers.getContractAt("TokenExchange", EXCHANGE_ADDRESS);

  const userAddress = deployer.address;
  console.log(`👤 Usuario: ${userAddress}\n`);

  // Intentar obtener tokens de los creadores
  const creators = [creator1, creator2, creator3];
  const tokenData = [
    { name: "Ibaisitos", symbol: "IBAI", buyAmount: "1.0" },
    { name: "Rubius Coin", symbol: "RUBIUS", buyAmount: "0.8" },
    { name: "Auron Coin", symbol: "AURON", buyAmount: "0.5" },
  ];

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];
    const data = tokenData[i];
    
    try {
      // Obtener dirección del token
      const tokenAddress = await factory.getCreatorToken(creator.address);
      
      if (tokenAddress === ethers.ZeroAddress) {
        console.log(`  ⚠️  ${data.name}: Token no existe, saltando...\n`);
        continue;
      }

      console.log(`  📦 ${data.name} (${data.symbol})...`);
      console.log(`     Token: ${tokenAddress}`);

      // Verificar balance actual
      const token = await ethers.getContractAt("CreatorToken", tokenAddress);
      const currentBalance = await token.balanceOf(userAddress);
      console.log(`     Balance actual: ${ethers.formatUnits(currentBalance, 18)} ${data.symbol}`);

      // Comprar tokens
      const buyTx = await exchange.connect(deployer).buyTokens(tokenAddress, {
        value: ethers.parseEther(data.buyAmount)
      });
      await buyTx.wait();

      // Verificar nuevo balance
      const newBalance = await token.balanceOf(userAddress);
      const purchased = newBalance - currentBalance;
      
      console.log(`     ✅ Comprado: ${ethers.formatUnits(purchased, 18)} ${data.symbol}`);
      console.log(`     ✅ Nuevo balance: ${ethers.formatUnits(newBalance, 18)} ${data.symbol}\n`);

    } catch (error: any) {
      console.error(`     ❌ Error con ${data.name}: ${error.message}\n`);
    }
  }

  console.log("✅ Proceso completado!\n");
  console.log("🎯 Ahora puedes:");
  console.log("  1. Ver tus tokens en My Wallet");
  console.log("  2. Apostar en predicciones");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

