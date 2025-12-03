import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Script para:
 * 1) Redeploy manual del sistema Uvote en Moonbase Alpha usando scripts/deploy-manual.ts
 * 2) Extraer las nuevas direcciones de la salida de consola
 * 3) Actualizar automáticamente las variables VITE_MOONBASE_* en frontend/.env
 *
 * Uso:
 *   npx tsx scripts/redeploy-moonbase.ts
 *
 * (asegúrate de tener configurada la red "moonbase" en hardhat.config.ts)
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function upsertEnvVar(envContent: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, "m");

  if (regex.test(envContent)) {
    // Reemplazar línea existente
    return envContent.replace(regex, `${key}=${value}`);
  }

  // Añadir nueva línea
  if (envContent.length > 0 && !envContent.endsWith("\n")) {
    envContent += "\n";
  }
  envContent += `${key}=${value}\n`;
  return envContent;
}

async function main() {
  console.log("🚀 Redeploy manual a Moonbase Alpha + sync de direcciones en frontend/.env\n");

  try {
    // 1) Ejecutar deployment manual en Moonbase y capturar salida
    console.log("🧪 Ejecutando scripts/deploy-manual.ts en Moonbase...");
    const output = execSync(
      "npx hardhat run scripts/deploy-manual.ts --network moonbase",
      { encoding: "utf8", stdio: "pipe" }
    );

    console.log("📍 Output del deployment manual:");
    console.log(output);

    // 2) Extraer direcciones usando regex según los logs de deploy-manual.ts
    const factoryMatch = output.match(/CreatorTokenFactory deployed to:\s*(0x[a-fA-F0-9]+)/);
    const marketMatch = output.match(/PredictionMarket deployed to:\s*(0x[a-fA-F0-9]+)/);
    const exchangeMatch = output.match(/TokenExchange deployed to:\s*(0x[a-fA-F0-9]+)/);

    if (!factoryMatch || !marketMatch || !exchangeMatch) {
      console.error("❌ No se pudieron extraer todas las direcciones del output de deploy-manual.ts");
      console.error("   Asegúrate de que el script haya desplegado los 3 contratos correctamente.");
      process.exit(1);
    }

    const factoryAddr = factoryMatch[1];
    const marketAddr = marketMatch[1];
    const exchangeAddr = exchangeMatch[1];

    console.log("\n📍 Nuevas direcciones desplegadas en Moonbase (manual):");
    console.log(`   CreatorTokenFactory: ${factoryAddr}`);
    console.log(`   PredictionMarket:    ${marketAddr}`);
    console.log(`   TokenExchange:       ${exchangeAddr}\n`);

    // 3) Actualizar frontend/.env con las VITE_MOONBASE_* correspondientes
    const envPath = path.join(__dirname, "../frontend/.env");
    let envContent = "";

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    } else {
      console.log("ℹ️  No se encontró frontend/.env, se creará uno nuevo.");
    }

    envContent = upsertEnvVar(envContent, "VITE_MOONBASE_FACTORY_ADDRESS", factoryAddr);
    envContent = upsertEnvVar(envContent, "VITE_MOONBASE_PREDICTION_MARKET_ADDRESS", marketAddr);
    envContent = upsertEnvVar(envContent, "VITE_MOONBASE_TOKEN_EXCHANGE_ADDRESS", exchangeAddr);

    // Asegurarse de que la red esté en moonbase
    envContent = upsertEnvVar(envContent, "VITE_NETWORK", "moonbase");
    // Cadena / RPC recomendados (solo se añaden si no existen)
    envContent = upsertEnvVar(envContent, "VITE_MOONBASE_CHAIN_ID", "1287");
    envContent = upsertEnvVar(
      envContent,
      "VITE_MOONBASE_RPC_URL",
      "https://rpc.api.moonbase.moonbeam.network"
    );

    fs.writeFileSync(envPath, envContent);

    console.log("✅ frontend/.env actualizado con las nuevas direcciones de Moonbase.");
    console.log("   Archivo: frontend/.env\n");
    console.log("👉 Recuerda hacer commit de los cambios (si quieres que Vercel los use en el siguiente deploy),");
    console.log("   o copiar estas direcciones manualmente a las variables de entorno del proyecto en Vercel.");
  } catch (error) {
    console.error("❌ Error en redeploy-moonbase:", error);
    process.exit(1);
  }
}

main();


