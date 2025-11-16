import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("\n🎯 Creando predicciones de demostración...\n");
  
  const [deployer, creator1, creator2, creator3] = await ethers.getSigners();
  
  const FACTORY_ADDRESS = "0x67d269191c92Caf3cD7723F116c85e6E9bf55933";
  const MARKET_ADDRESS = "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E";

  const factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);
  const market = await ethers.getContractAt("PredictionMarket", MARKET_ADDRESS);

  // Obtener los tokens de los creadores
  const ibaiTokenAddress = await factory.getCreatorToken(creator1.address);
  const rubiusTokenAddress = await factory.getCreatorToken(creator2.address);
  const auronTokenAddress = await factory.getCreatorToken(creator3.address);

  console.log("📦 Tokens de creadores:");
  console.log(`  - Ibai: ${ibaiTokenAddress}`);
  console.log(`  - Rubius: ${rubiusTokenAddress}`);
  console.log(`  - Auron: ${auronTokenAddress}\n`);

  // Predicción 1: Ibai - Deportes
  console.log("1️⃣ Creando predicción de Ibai (Deportes)...");
  const prediction1 = await market.connect(creator1).createPrediction(
    ibaiTokenAddress,
    "¿Ganará el Real Madrid la Champions League 2025?",
    "Predicción sobre el resultado de la Champions League",
    ["Sí, ganará", "No, no ganará"],
    7 * 24 * 60 * 60 // 7 días
  );
  await prediction1.wait();
  console.log("   ✅ Predicción creada\n");

  // Predicción 2: Rubius - Gaming
  console.log("2️⃣ Creando predicción de Rubius (Gaming)...");
  const prediction2 = await market.connect(creator2).createPrediction(
    rubiusTokenAddress,
    "¿Se lanzará GTA 6 en 2025?",
    "Predicción sobre el lanzamiento de GTA 6",
    ["Sí, en 2025", "No, se retrasará"],
    14 * 24 * 60 * 60 // 14 días
  );
  await prediction2.wait();
  console.log("   ✅ Predicción creada\n");

  // Predicción 3: Auron - Crypto
  console.log("3️⃣ Creando predicción de Auron (Crypto)...");
  const prediction3 = await market.connect(creator3).createPrediction(
    auronTokenAddress,
    "¿Bitcoin superará los $100,000 en 2025?",
    "Predicción sobre el precio de Bitcoin",
    ["Sí, superará $100k", "No, se quedará por debajo"],
    30 * 24 * 60 * 60 // 30 días
  );
  await prediction3.wait();
  console.log("   ✅ Predicción creada\n");

  // Predicción 4: Ibai - Tech
  console.log("4️⃣ Creando predicción de Ibai (Tech)...");
  const prediction4 = await market.connect(creator1).createPrediction(
    ibaiTokenAddress,
    "¿Apple lanzará un iPhone plegable en 2026?",
    "Predicción sobre nuevos productos de Apple",
    ["Sí, lo lanzará", "No, no lanzará", "Quizás, pero no confirmado"],
    60 * 24 * 60 * 60 // 60 días
  );
  await prediction4.wait();
  console.log("   ✅ Predicción creada\n");

  // Predicción 5: Rubius - Gaming
  console.log("5️⃣ Creando predicción de Rubius (Gaming)...");
  const prediction5 = await market.connect(creator2).createPrediction(
    rubiusTokenAddress,
    "¿Qué juego será el más vendido en 2025?",
    "Predicción sobre ventas de videojuegos",
    ["GTA 6", "Call of Duty", "FIFA/EA FC", "Otro"],
    90 * 24 * 60 * 60 // 90 días
  );
  await prediction5.wait();
  console.log("   ✅ Predicción creada\n");

  console.log("✅ 5 predicciones creadas exitosamente!\n");
  console.log("📊 Resumen:");
  console.log("  - 2 predicciones de Ibai (Deportes, Tech)");
  console.log("  - 2 predicciones de Rubius (Gaming)");
  console.log("  - 1 predicción de Auron (Crypto)");
  console.log("\n🎯 Ahora puedes:");
  console.log("  1. Ver las predicciones en el frontend (PredictionFeed)");
  console.log("  2. Apostar en predicciones (PredictionDetailPage)");
  console.log("  3. Ver actualizaciones en tiempo real");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

