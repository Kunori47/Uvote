import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Script que se ejecuta después del deployment para sincronizar direcciones
 * Uso: npx tsx scripts/auto-sync.ts
 */

async function autoSync() {
  console.log("🔄 Auto-sincronizando contratos con frontend...");

  try {
    // Ejecutar deployment y capturar salida
    const output = execSync(
      "npx hardhat ignition deploy ignition/modules/UvoteSystem.ts --network localhost",
      { encoding: "utf8", stdio: "pipe" }
    );

    console.log("📍 Output del deployment:");
    console.log(output);

    // Extraer direcciones usando regex
    const factoryMatch = output.match(/CreatorTokenFactory - (0x[a-fA-F0-9]+)/);
    const marketMatch = output.match(/PredictionMarket - (0x[a-fA-F0-9]+)/);
    const exchangeMatch = output.match(/TokenExchange - (0x[a-fA-F0-9]+)/);

    if (!factoryMatch || !marketMatch || !exchangeMatch) {
      throw new Error("No se pudieron extraer las direcciones del deployment");
    }

    const addresses = {
      CreatorTokenFactory: factoryMatch[1],
      PredictionMarket: marketMatch[1],
      TokenExchange: exchangeMatch[1],
    };

    console.log("✅ Direcciones extraídas:");
    Object.entries(addresses).forEach(([name, addr]) => {
      console.log(`  ${name}: ${addr}`);
    });

    // Actualizar frontend
    const frontendPath = path.join(__dirname, "../frontend/src/lib/contracts.ts");
    let content = fs.readFileSync(frontendPath, "utf8");

    // Reemplazar direcciones
    Object.entries(addresses).forEach(([name, addr]) => {
      const regex = new RegExp(`${name}: '0x[a-fA-F0-9]+'`, "g");
      content = content.replace(regex, `${name}: '${addr}'`);
    });

    fs.writeFileSync(frontendPath, content);
    console.log("✅ Frontend actualizado exitosamente!");

  } catch (error) {
    console.error("❌ Error en auto-sync:", error);
    process.exit(1);
  }
}

autoSync();
