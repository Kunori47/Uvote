import { ethers } from "hardhat";

/**
 * Script de demostración para interactuar con el sistema desplegado
 * 
 * Ejecutar:
 * npx hardhat run scripts/interact-demo.ts --network moonbase
 */

// ⚠️ ACTUALIZAR ESTAS DIRECCIONES DESPUÉS DEL DEPLOY
const DEPLOYED_ADDRESSES = {
  factory: "0x...",
  market: "0x...",
  exchange: "0x...",
};

async function main() {
  console.log("\n🚀 Uvote - Script de Demostración");
  console.log("=====================================\n");
  
  const [deployer] = await ethers.getSigners();
  console.log(`📍 Usando cuenta: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} DEV\n`);
  
  // Obtener contratos
  const factory = await ethers.getContractAt("CreatorTokenFactory", DEPLOYED_ADDRESSES.factory);
  const market = await ethers.getContractAt("PredictionMarket", DEPLOYED_ADDRESSES.market);
  const exchange = await ethers.getContractAt("TokenExchange", DEPLOYED_ADDRESSES.exchange);
  
  console.log("✅ Contratos conectados\n");
  
  // PASO 1: Crear token de creador
  console.log("📝 PASO 1: Creando token de creador...");
  try {
    const tx = await factory.createCreatorToken(
      "DemoTokens",
      "DEMO",
      ethers.parseEther("0.01"), // 0.01 DEV por token
      { gasLimit: 5000000 }
    );
    console.log(`  Transacción enviada: ${tx.hash}`);
    await tx.wait();
    
    const tokenAddress = await factory.getCreatorToken(deployer.address);
    const token = await ethers.getContractAt("CreatorToken", tokenAddress);
    
    console.log(`  ✅ Token creado: ${await token.name()} (${await token.symbol()})`);
    console.log(`  📍 Dirección: ${tokenAddress}`);
    console.log(`  💵 Precio: ${ethers.formatEther(await token.tokenPrice())} DEV\n`);
    
    // PASO 2: Autorizar contratos
    console.log("🔐 PASO 2: Autorizando contratos para mint/burn...");
    
    const tx1 = await token.setAuthorizedMinter(DEPLOYED_ADDRESSES.exchange, true, { gasLimit: 100000 });
    await tx1.wait();
    console.log("  ✅ Exchange autorizado");
    
    const tx2 = await token.setAuthorizedMinter(DEPLOYED_ADDRESSES.market, true, { gasLimit: 100000 });
    await tx2.wait();
    console.log("  ✅ Market autorizado\n");
    
    // PASO 3: Comprar tokens
    console.log("💰 PASO 3: Comprando tokens...");
    const buyTx = await exchange.buyTokens(tokenAddress, {
      value: ethers.parseEther("0.5"),
      gasLimit: 200000
    });
    await buyTx.wait();
    
    const balance = await token.balanceOf(deployer.address);
    console.log(`  ✅ Comprados: ${ethers.formatUnits(balance, 18)} tokens\n`);
    
    // PASO 4: Crear predicción
    console.log("🎯 PASO 4: Creando predicción...");
    const predTx = await market.createPrediction(
      tokenAddress,
      "¿Bitcoin alcanzará $100k en 2025?",
      "Predicción sobre el precio de Bitcoin",
      ["Sí, alcanzará $100k", "No alcanzará"],
      24 * 60 * 60, // 1 día
      5, // 5% fee
      { gasLimit: 500000 }
    );
    await predTx.wait();
    
    const nextId = await market.nextPredictionId();
    const predId = nextId - 1n;
    
    console.log(`  ✅ Predicción creada con ID: ${predId}\n`);
    
    // PASO 5: Apostar
    console.log("🎲 PASO 5: Realizando apuesta...");
    const approveTx = await token.approve(DEPLOYED_ADDRESSES.market, ethers.parseUnits("10", 18), {
      gasLimit: 100000
    });
    await approveTx.wait();
    
    const betTx = await market.placeBet(predId, 0, ethers.parseUnits("10", 18), { gasLimit: 200000 });
    await betTx.wait();
    
    console.log("  ✅ Apuesta realizada: 10 tokens en 'Sí'\n");
    
    // Información final
    console.log("📊 RESUMEN:");
    console.log(`  Token: ${tokenAddress}`);
    console.log(`  Balance: ${ethers.formatUnits(await token.balanceOf(deployer.address), 18)} tokens`);
    console.log(`  Predicción ID: ${predId}`);
    console.log(`  Estado: Active\n`);
    
    console.log("✅ Demostración completada!\n");
    console.log("💡 Tip: Guarda estas direcciones para interactuar después:");
    console.log(`  - Token: ${tokenAddress}`);
    console.log(`  - Predicción: ${predId}\n`);
    
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.data) {
      console.error("Datos:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

