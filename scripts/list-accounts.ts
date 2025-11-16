import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("\n📋 Lista de Cuentas Disponibles en Hardhat\n");
  console.log("=" .repeat(80));
  
  const signers = await ethers.getSigners();
  const totalAccounts = signers.length;
  
  console.log(`\nTotal de cuentas: ${totalAccounts}\n`);
  console.log("-".repeat(80));
  
  for (let i = 0; i < totalAccounts; i++) {
    const signer = signers[i];
    const address = await signer.getAddress();
    const balance = await ethers.provider.getBalance(address);
    
    console.log(`\nCuenta #${i}:`);
    console.log(`  Dirección: ${address}`);
    console.log(`  Balance: ${ethers.formatEther(balance)} ETH`);
    
    // Mostrar private key solo para las primeras 5 cuentas (por seguridad)
    if (i < 5) {
      // Hardhat usa claves predefinidas, pero no las podemos obtener directamente
      // Solo mostramos que están disponibles
      console.log(`  Estado: ✅ Disponible`);
    }
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("\n💡 Nota: Hardhat provee 20 cuentas con 10,000 ETH cada una");
  console.log("💡 La cuenta #0 es la que se usa por defecto en los scripts");
  console.log("\n🔑 Private Key de la cuenta #0 (para importar en SubWallet):");
  console.log("   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("\n📍 Dirección de la cuenta #0:");
  console.log(`   ${await signers[0].getAddress()}`);
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

