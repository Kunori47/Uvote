import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script para autorizar TokenExchange y PredictionMarket en el token "galacticos" del usuario
 */

async function main() {
  const TOKEN_ADDRESS = "0x10C6E9530F1C1AF873a391030a1D9E8ed0630D26";
  const TOKEN_EXCHANGE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const PREDICTION_MARKET_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const CREATOR_ADDRESS = "0x51688BD1aa9fCa4e1c71E8D91CFEDa5E684A465C";

  console.log("\n🔐 Autorizando contratos para token 'galacticos'...\n");
  console.log(`📍 Token: ${TOKEN_ADDRESS}`);
  console.log(`📍 Creador: ${CREATOR_ADDRESS}\n`);

  const token = await ethers.getContractAt("CreatorToken", TOKEN_ADDRESS);
  
  // Verificar que el owner es correcto
  const owner = await token.owner();
  console.log(`👤 Owner del token: ${owner}`);
  
  if (owner.toLowerCase() !== CREATOR_ADDRESS.toLowerCase()) {
    console.error(`❌ Error: El owner no coincide. Owner actual: ${owner}`);
    process.exit(1);
  }

  // Buscar el signer que corresponde al creador
  // En Hardhat local, necesitamos usar una cuenta que tenga permisos
  // Como el token fue creado desde SubWallet, necesitamos que el usuario lo autorice desde el frontend
  // Pero podemos intentar con la cuenta #0 si tiene permisos de owner
  
  // Intentar con todas las cuentas de Hardhat
  const signers = await ethers.getSigners();
  let ownerSigner = null;
  
  for (const signer of signers) {
    const address = await signer.getAddress();
    if (address.toLowerCase() === owner.toLowerCase()) {
      ownerSigner = signer;
      break;
    }
  }

  if (!ownerSigner) {
    console.error("❌ Error: No se encontró el signer que es owner del token");
    console.log("\n💡 Solución:");
    console.log("   1. Conecta tu wallet (SubWallet) con la dirección del creador");
    console.log("   2. Ve a 'Mi Moneda' en el frontend");
    console.log("   3. El sistema debería autorizar automáticamente al crear nuevos tokens");
    console.log("\n   O ejecuta manualmente desde el frontend:");
    console.log("   - Ve a CoinDetailPage del token");
    console.log("   - El botón de autorizar debería aparecer si no está autorizado");
    process.exit(1);
  }

  try {
    // Autorizar TokenExchange
    console.log("1️⃣ Autorizando TokenExchange...");
    const authExchangeTx = await token.connect(ownerSigner).setAuthorizedMinter(TOKEN_EXCHANGE_ADDRESS, true);
    console.log("   ⏳ Transacción enviada, esperando confirmación...");
    await authExchangeTx.wait();
    console.log("   ✅ TokenExchange autorizado\n");

    // Autorizar PredictionMarket
    console.log("2️⃣ Autorizando PredictionMarket...");
    const authMarketTx = await token.connect(ownerSigner).setAuthorizedMinter(PREDICTION_MARKET_ADDRESS, true);
    console.log("   ⏳ Transacción enviada, esperando confirmación...");
    await authMarketTx.wait();
    console.log("   ✅ PredictionMarket autorizado\n");

    // Verificar
    console.log("3️⃣ Verificando autorizaciones...");
    const isExchangeAuthorized = await token.authorizedMinters(TOKEN_EXCHANGE_ADDRESS);
    const isMarketAuthorized = await token.authorizedMinters(PREDICTION_MARKET_ADDRESS);
    
    console.log(`   TokenExchange autorizado: ${isExchangeAuthorized ? '✅' : '❌'}`);
    console.log(`   PredictionMarket autorizado: ${isMarketAuthorized ? '✅' : '❌'}\n`);

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
    console.log("\n💡 Como el token fue creado desde SubWallet, necesitas autorizarlo desde el frontend:");
    console.log("   1. Conecta tu wallet con la dirección del creador");
    console.log("   2. Ve a 'Mi Moneda' en el frontend");
    console.log("   3. Debería haber un botón para autorizar los contratos");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

