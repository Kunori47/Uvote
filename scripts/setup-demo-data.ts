import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script para crear datos de demostración en la blockchain local
 * Crea varios tokens de creadores y les da balance a una cuenta de prueba
 * 
 * Ejecutar:
 * npx hardhat run scripts/setup-demo-data.ts --network localhost
 */

async function main() {
  console.log("\n🎬 Configurando datos de demostración...\n");
  
  const [deployer, ...creators] = await ethers.getSigners();
  
  // Direcciones de contratos desplegados
  const FACTORY_ADDRESS = "0x67d269191c92Caf3cD7723F116c85e6E9bf55933";
  const EXCHANGE_ADDRESS = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
  const MARKET_ADDRESS = "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E";
  
  // Usuario que recibirá los tokens (Account #0 de Hardhat)
  const testUser = deployer.address;
  
  console.log(`👤 Usuario de prueba: ${testUser}\n`);
  
  // Conectar a contratos
  const factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);
  const exchange = await ethers.getContractAt("TokenExchange", EXCHANGE_ADDRESS);
  
  // Tokens de creadores a crear
  const creatorsData = [
    { name: "Ibaisitos", symbol: "IBAI", price: "0.01", buyAmount: "1.0" },
    { name: "Rubius Coin", symbol: "RUBIUS", price: "0.015", buyAmount: "0.8" },
    { name: "Auron Coin", symbol: "AURON", price: "0.02", buyAmount: "0.5" },
  ];
  
  console.log("📦 Creando tokens de creadores...\n");
  
  for (let i = 0; i < creatorsData.length; i++) {
    const creator = creators[i];
    const data = creatorsData[i];
    
    try {
      // 1. Crear token
      console.log(`  ${i + 1}. Creando ${data.name} (${data.symbol})...`);
      const tx = await factory.connect(creator).createCreatorToken(
        data.name,
        data.symbol,
        ethers.parseEther(data.price)
      );
      await tx.wait();
      
      const tokenAddress = await factory.getCreatorToken(creator.address);
      console.log(`     ✅ Token creado: ${tokenAddress}`);
      
      // 2. Autorizar exchange para mint
      const token = await ethers.getContractAt("CreatorToken", tokenAddress);
      const authTx = await token.connect(creator).setAuthorizedMinter(EXCHANGE_ADDRESS, true);
      await authTx.wait();
      console.log(`     ✅ Exchange autorizado`);
      
      // 3. Usuario compra tokens
      const buyTx = await exchange.connect(deployer).buyTokens(tokenAddress, {
        value: ethers.parseEther(data.buyAmount)
      });
      await buyTx.wait();
      
      const balance = await token.balanceOf(testUser);
      console.log(`     ✅ Usuario compró: ${ethers.formatUnits(balance, 18)} tokens\n`);
      
      // 4. Autorizar market para usar estos tokens
      const authMarketTx = await token.connect(creator).setAuthorizedMinter(MARKET_ADDRESS, true);
      await authMarketTx.wait();
      
    } catch (error: any) {
      console.error(`     ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log("✅ Datos de demostración configurados!\n");
  console.log("📊 Resumen:");
  console.log(`  - ${creatorsData.length} tokens de creadores creados`);
  console.log(`  - Usuario ${testUser} tiene balance en todos\n`);
  console.log("🎯 Ahora puedes:");
  console.log("  1. Conectar tu wallet al frontend");
  console.log("  2. Ver tus tokens en My Wallet");
  console.log("  3. Crear predicciones");
  console.log("  4. Apostar en predicciones\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

