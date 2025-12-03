import { network } from "hardhat";

/**
 * Script para verificar el estado del sistema desplegado
 * 
 * Ejecutar:
 * npx hardhat run scripts/check-system.ts --network moonbase
 */

// Direcciones desplegadas en Moonbase
const DEPLOYED_ADDRESSES = {
  factory: "0x686961672e23CF56e43ce55AC65a59482bc2B517",
  market: "0x15842957dC0393695604Eed459E9D72512420a5d",
  exchange: "0x7419a28F6C02e13DFf306AAEE8F318348A340C7B",
};

async function main() {
  const { ethers } = await network.connect();

  console.log("\n🔍 Uvote - Verificación del Sistema");
  console.log("=====================================\n");

  const [account] = await ethers.getSigners();
  console.log(`📍 Cuenta: ${account.address}\n`);

  // Conectar a contratos
  const factory = await ethers.getContractAt("CreatorTokenFactory", DEPLOYED_ADDRESSES.factory);
  const market = await ethers.getContractAt("PredictionMarket", DEPLOYED_ADDRESSES.market);
  const exchange = await ethers.getContractAt("TokenExchange", DEPLOYED_ADDRESSES.exchange);

  try {
    // Factory
    console.log("📦 CreatorTokenFactory");
    console.log("  Dirección:", DEPLOYED_ADDRESSES.factory);
    console.log("  Owner:", await factory.owner());
    console.log("  Total tokens creados:", (await factory.getTotalTokens()).toString());
    console.log("  Intervalo por defecto:", (await factory.defaultPriceUpdateInterval()).toString(), "segundos");
    console.log("");

    // Market
    console.log("🎯 PredictionMarket");
    console.log("  Dirección:", DEPLOYED_ADDRESSES.market);
    console.log("  Owner:", await market.owner());
    console.log("  Cooldown:", (await market.cooldownDuration()).toString(), "segundos");
    console.log("  Umbral de reportes:", (await market.reportThresholdPercentage()).toString(), "%");
    console.log("  Mínimo reportes:", (await market.minReportsRequired()).toString());
    console.log("  Próxima predicción ID:", (await market.nextPredictionId()).toString());
    console.log("");

    // Exchange
    console.log("💱 TokenExchange");
    console.log("  Dirección:", DEPLOYED_ADDRESSES.exchange);
    console.log("  Owner:", await exchange.owner());
    console.log("  Fee de plataforma:", (await exchange.platformFee()).toString(), "%");
    console.log("  Fees acumulados:", ethers.formatEther(await exchange.accumulatedFees()), "DEV");
    console.log("  Balance del contrato:", ethers.formatEther(await exchange.getContractBalance()), "DEV");
    console.log("");

    // Verificar si la cuenta tiene un token
    try {
      const tokenAddress = await factory.getCreatorToken(account.address);
      console.log("👤 Tu Token de Creador");
      console.log("  Dirección:", tokenAddress);

      const token = await ethers.getContractAt("CreatorToken", tokenAddress);
      console.log("  Nombre:", await token.name());
      console.log("  Símbolo:", await token.symbol());
      console.log("  Precio:", ethers.formatEther(await token.tokenPrice()), "DEV");
      console.log("  Supply:", ethers.formatUnits(await token.totalSupply(), 18), "tokens");
      console.log("  Tu balance:", ethers.formatUnits(await token.balanceOf(account.address), 18), "tokens");
      console.log("");
    } catch (e) {
      console.log("👤 Tu Token de Creador: No creado aún\n");
    }

    // Verificar autorizaciones
    console.log("🔐 Estado de Autorizaciones");
    const isMarketAuthorized = await factory.authorizedContracts(DEPLOYED_ADDRESSES.market);
    const isExchangeAuthorized = await factory.authorizedContracts(DEPLOYED_ADDRESSES.exchange);
    console.log("  PredictionMarket autorizado:", isMarketAuthorized ? "✅" : "❌");
    console.log("  TokenExchange autorizado:", isExchangeAuthorized ? "✅" : "❌");
    console.log("");

    console.log("✅ Verificación completada\n");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

