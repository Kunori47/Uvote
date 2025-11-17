import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script para sincronizar automáticamente las direcciones de contratos
 * desplegados en Hardhat local con el frontend
 */

async function syncContractAddresses() {
  console.log("🔄 Sincronizando direcciones de contratos...");

  try {
    // Obtener las direcciones del deployment más reciente
    const deploymentPath = path.join(__dirname, "../ignition/deployments/chain-31337/deployed_addresses.json");
    
    if (!fs.existsSync(deploymentPath)) {
      console.error("❌ No se encontró el archivo de deployment. Ejecuta primero el deployment.");
      return;
    }

    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contracts = deploymentData;
    
    if (!contracts) {
      console.error("❌ No se encontró el deployment de UvoteSystem");
      return;
    }

    // Extraer direcciones
    const addresses = {
      CreatorTokenFactory: contracts["UvoteSystem#CreatorTokenFactory"],
      PredictionMarket: contracts["UvoteSystem#PredictionMarket"],
      TokenExchange: contracts["UvoteSystem#TokenExchange"],
    };

    console.log("📍 Direcciones encontradas:");
    console.log(`  CreatorTokenFactory: ${addresses.CreatorTokenFactory}`);
    console.log(`  PredictionMarket: ${addresses.PredictionMarket}`);
    console.log(`  TokenExchange: ${addresses.TokenExchange}`);

    // Actualizar el archivo del frontend
    const frontendContractsPath = path.join(__dirname, "../frontend/src/lib/contracts.ts");
    
    if (!fs.existsSync(frontendContractsPath)) {
      console.error("❌ No se encontró el archivo contracts.ts del frontend");
      return;
    }

    // Leer el archivo actual
    let content = fs.readFileSync(frontendContractsPath, "utf8");
    
    // Reemplazar las direcciones
    content = content.replace(
      /CreatorTokenFactory: '0x[a-fA-F0-9]+'/g,
      `CreatorTokenFactory: '${addresses.CreatorTokenFactory}'`
    );
    content = content.replace(
      /PredictionMarket: '0x[a-fA-F0-9]+'/g,
      `PredictionMarket: '${addresses.PredictionMarket}'`
    );
    content = content.replace(
      /TokenExchange: '0x[a-fA-F0-9]+'/g,
      `TokenExchange: '${addresses.TokenExchange}'`
    );

    // Actualizar comentarios
    content = content.replace(
      /\/\/   CreatorTokenFactory - 0x[a-fA-F0-9]+/g,
      `//   CreatorTokenFactory - ${addresses.CreatorTokenFactory}`
    );
    content = content.replace(
      /\/\/   PredictionMarket    - 0x[a-fA-F0-9]+/g,
      `//   PredictionMarket    - ${addresses.PredictionMarket}`
    );
    content = content.replace(
      /\/\/   TokenExchange       - 0x[a-fA-F0-9]+/g,
      `//   TokenExchange       - ${addresses.TokenExchange}`
    );

    // Guardar el archivo actualizado
    fs.writeFileSync(frontendContractsPath, content);
    
    console.log("✅ Direcciones sincronizadas exitosamente con el frontend");
    console.log("📁 Archivo actualizado: frontend/src/lib/contracts.ts");
    
  } catch (error) {
    console.error("❌ Error sincronizando direcciones:", error);
  }
}

// Ejecutar la sincronización
syncContractAddresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
