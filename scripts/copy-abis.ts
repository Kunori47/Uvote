import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contratos que necesitamos copiar
const contracts = [
  'CreatorTokenFactory',
  'CreatorToken',
  'PredictionMarket',
  'TokenExchange',
];

// Directorios
const artifactsDir = path.join(__dirname, '../artifacts/contracts');
const frontendAbiDir = path.join(__dirname, '../frontend/src/lib/abis');

// Crear directorio si no existe
if (!fs.existsSync(frontendAbiDir)) {
  fs.mkdirSync(frontendAbiDir, { recursive: true });
}

// Copiar ABIs
contracts.forEach((contractName) => {
  const artifactPath = path.join(
    artifactsDir,
    `${contractName}.sol`,
    `${contractName}.json`
  );
  
  try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abi = artifact.abi;
    
    // Guardar solo el ABI
    const outputPath = path.join(frontendAbiDir, `${contractName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    
    console.log(`✅ Copiado: ${contractName}.json`);
  } catch (error) {
    console.error(`❌ Error copiando ${contractName}:`, error);
  }
});

console.log('\n✨ ABIs copiados exitosamente al frontend!');

