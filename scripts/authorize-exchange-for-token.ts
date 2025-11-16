import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script para autorizar TokenExchange y PredictionMarket en un token específico
 * 
 * Uso: npx hardhat run scripts/authorize-exchange-for-token.ts --network localhost
 * 
 * O con argumento: npx hardhat run scripts/authorize-exchange-for-token.ts --network localhost [TOKEN_ADDRESS]
 */

async function main() {
  const TOKEN_ADDRESS = process.argv[2] || process.env.TOKEN_ADDRESS;
  
  if (!TOKEN_ADDRESS) {
    console.error("❌ Error: Debes proporcionar la dirección del token");
    console.log("\nUso:");
    console.log("  npx hardhat run scripts/authorize-exchange-for-token.ts --network localhost [TOKEN_ADDRESS]");
    console.log("\nO configura TOKEN_ADDRESS en .env");
    process.exit(1);
  }

  const TOKEN_EXCHANGE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const PREDICTION_MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  console.log("\n🔐 Autorizando contratos para token...\n");
  console.log(`📍 Token: ${TOKEN_ADDRESS}`);
  console.log(`📍 Exchange: ${TOKEN_EXCHANGE_ADDRESS}`);
  console.log(`📍 Market: ${PREDICTION_MARKET_ADDRESS}\n`);

  // Obtener el owner del token (el creador)
  const [deployer, ...signers] = await ethers.getSigners();
  const token = await ethers.getContractAt("CreatorToken", TOKEN_ADDRESS);
  const owner = await token.owner();
  
  console.log(`👤 Owner del token: ${owner}\n`);

  // Buscar el signer que es el owner
  let ownerSigner = deployer;
  for (const signer of signers) {
    if ((await signer.getAddress()).toLowerCase() === owner.toLowerCase()) {
      ownerSigner = signer;
      break;
    }
  }

  if ((await ownerSigner.getAddress()).toLowerCase() !== owner.toLowerCase()) {
    console.error("❌ Error: No se encontró el signer que es owner del token");
    console.log(`   Owner: ${owner}`);
    console.log(`   Signer actual: ${await ownerSigner.getAddress()}`);
    console.log("\n💡 Necesitas ejecutar este script con la wallet que creó el token");
    process.exit(1);
  }

  try {
    // Autorizar TokenExchange
    console.log("1️⃣ Autorizando TokenExchange...");
    const authExchangeTx = await token.connect(ownerSigner).setAuthorizedMinter(TOKEN_EXCHANGE_ADDRESS, true);
    await authExchangeTx.wait();
    console.log("   ✅ TokenExchange autorizado\n");

    // Autorizar PredictionMarket
    console.log("2️⃣ Autorizando PredictionMarket...");
    const authMarketTx = await token.connect(ownerSigner).setAuthorizedMinter(PREDICTION_MARKET_ADDRESS, true);
    await authMarketTx.wait();
    console.log("   ✅ PredictionMarket autorizado\n");

    // Verificar
    console.log("3️⃣ Verificando autorizaciones...");
    const isExchangeAuthorized = await token.authorizedMinters(TOKEN_EXCHANGE_ADDRESS);
    const isMarketAuthorized = await token.authorizedMinters(PREDICTION_MARKET_ADDRESS);
    
    console.log(`   TokenExchange autorizado: ${isExchangeAuthorized}`);
    console.log(`   PredictionMarket autorizado: ${isMarketAuthorized}\n`);

    if (isExchangeAuthorized && isMarketAuthorized) {
      console.log("✅ ¡Autorizaciones completadas exitosamente!\n");
      console.log("💡 Ahora los usuarios pueden comprar tokens y usarlos en apuestas\n");
    } else {
      console.log("⚠️  Algunas autorizaciones fallaron\n");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.reason) {
      console.error("   Razón:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

