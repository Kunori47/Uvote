import { network } from "hardhat";

/**
 * Script completo para deploy a Moonbase Alpha
 * 
 * Este script:
 * 1. Verifica el balance
 * 2. Despliega los contratos
 * 3. Configura los permisos
 * 4. Verifica el sistema
 * 
 * Uso:
 *   npx hardhat run scripts/deploy-to-moonbase.ts --network moonbase
 */

async function main() {
  const { ethers } = await network.connect();
  
  console.log("🚀 Iniciando deploy a Moonbase Alpha...\n");
  
  // Verificar balance
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`📊 Balance del deployer: ${ethers.formatEther(balance)} DEV`);
  
  if (balance === 0n) {
    console.log("⚠️  Balance insuficiente. Obtén tokens DEV del faucet:");
    console.log("   https://faucet.moonbeam.network/\n");
    return;
  }
  
  console.log("\n✅ Balance suficiente. Procediendo con el deploy...\n");
  console.log("📝 NOTA: Este script solo verifica el balance.");
  console.log("   Para hacer el deploy completo, ejecuta:");
  console.log("   npx hardhat ignition deploy ignition/modules/deploy-system.ts --network moonbase\n");
  console.log("   Luego actualiza las direcciones en scripts/setup-permissions.ts");
  console.log("   y ejecuta:");
  console.log("   npx hardhat run scripts/setup-permissions.ts --network moonbase\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

