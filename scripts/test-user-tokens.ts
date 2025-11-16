import { network } from "hardhat";

const { ethers } = await network.connect();

const TARGET_ADDRESS = "0x51688BD1aa9fCa4e1c71E8D91CFEDa5E684A465C";

async function main() {
  console.log("\n🧪 Test: Verificando tokens del usuario como lo hace el frontend...\n");
  console.log(`📍 Dirección: ${TARGET_ADDRESS}\n`);
  
  const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);
  
  // Simular lo que hace useUserTokens
  console.log("1️⃣ Obteniendo total de tokens...");
  const totalTokens = await factory.getTotalTokens();
  console.log(`   ✅ Total: ${totalTokens}\n`);
  
  console.log("2️⃣ Obteniendo todas las direcciones de tokens...");
  const tokenAddresses = await factory.getAllTokens(0, Number(totalTokens));
  console.log(`   ✅ Encontrados ${tokenAddresses.length} tokens\n`);
  
  console.log("3️⃣ Verificando balance en cada token...\n");
  
  for (let i = 0; i < tokenAddresses.length; i++) {
    const tokenAddress = tokenAddresses[i];
    const token = await ethers.getContractAt("CreatorToken", tokenAddress);
    
    const name = await token.name();
    const symbol = await token.symbol();
    const balance = await token.balanceOf(TARGET_ADDRESS);
    const price = await token.tokenPrice();
    
    const balanceFormatted = ethers.formatUnits(balance, 18);
    const priceFormatted = ethers.formatEther(price);
    
    console.log(`   Token ${i + 1}: ${name} (${symbol})`);
    console.log(`   Dirección: ${tokenAddress}`);
    console.log(`   Balance: ${balanceFormatted} ${symbol}`);
    console.log(`   Precio: ${priceFormatted} ETH`);
    
    if (parseFloat(balanceFormatted) > 0) {
      console.log(`   ✅ Este token SÍ debería aparecer en My Wallet\n`);
    } else {
      console.log(`   ⚠️  Balance 0, no aparecerá en My Wallet\n`);
    }
  }
  
  console.log("=" .repeat(80));
  console.log("\n💡 Si los balances son > 0 pero no aparecen en el frontend:");
  console.log("   1. Verifica que la dirección conectada sea: " + TARGET_ADDRESS);
  console.log("   2. Abre la consola del navegador (F12) y busca errores");
  console.log("   3. Recarga la página con Ctrl+Shift+R\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

