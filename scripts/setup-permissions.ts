import { network } from "hardhat";

/**
 * Script para configurar los permisos después del despliegue
 * 
 * Este script debe ejecutarse después de desplegar todos los contratos
 * para autorizar al PredictionMarket y TokenExchange en el Factory
 */

async function main() {
  const { ethers } = await network.connect();
  
  // Direcciones de los contratos desplegados (Hardhat local)
  const FACTORY_ADDRESS = "0x67d269191c92Caf3cD7723F116c85e6E9bf55933";
  const PREDICTION_MARKET_ADDRESS = "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E";
  const TOKEN_EXCHANGE_ADDRESS = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
  
  console.log("Configurando permisos del sistema...");
  
  // Obtener el factory
  const Factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);
  
  // Autorizar PredictionMarket
  console.log("\n1. Autorizando PredictionMarket...");
  const tx1 = await Factory.setAuthorizedContract(PREDICTION_MARKET_ADDRESS, true);
  await tx1.wait();
  console.log("✅ PredictionMarket autorizado");
  
  // Autorizar TokenExchange
  console.log("\n2. Autorizando TokenExchange...");
  const tx2 = await Factory.setAuthorizedContract(TOKEN_EXCHANGE_ADDRESS, true);
  await tx2.wait();
  console.log("✅ TokenExchange autorizado");
  
  // Verificar configuración
  console.log("\n📋 Verificando configuración:");
  const isPMAuthorized = await Factory.authorizedContracts(PREDICTION_MARKET_ADDRESS);
  const isExchangeAuthorized = await Factory.authorizedContracts(TOKEN_EXCHANGE_ADDRESS);
  
  console.log(`- PredictionMarket autorizado: ${isPMAuthorized}`);
  console.log(`- TokenExchange autorizado: ${isExchangeAuthorized}`);
  
  console.log("\n✅ Configuración completada!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

