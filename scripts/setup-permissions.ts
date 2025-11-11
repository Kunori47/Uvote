import { ethers } from "hardhat";

/**
 * Script para configurar los permisos después del despliegue
 * 
 * Este script debe ejecutarse después de desplegar todos los contratos
 * para autorizar al PredictionMarket y TokenExchange en el Factory
 */

async function main() {
  // Direcciones de los contratos desplegados (ACTUALIZAR CON TUS DIRECCIONES)
  const FACTORY_ADDRESS = "0x..."; // Dirección del CreatorTokenFactory
  const PREDICTION_MARKET_ADDRESS = "0x..."; // Dirección del PredictionMarket
  const TOKEN_EXCHANGE_ADDRESS = "0x..."; // Dirección del TokenExchange
  
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

