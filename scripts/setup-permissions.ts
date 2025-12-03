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
  const FACTORY_ADDRESS = "0x686961672e23CF56e43ce55AC65a59482bc2B517";
  const PREDICTION_MARKET_ADDRESS = "0x15842957dC0393695604Eed459E9D72512420a5d";
  const TOKEN_EXCHANGE_ADDRESS = "0x7419a28F6C02e13DFf306AAEE8F318348A340C7B";

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

