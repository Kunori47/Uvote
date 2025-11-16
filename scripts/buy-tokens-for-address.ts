import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script para comprar tokens de creadores para una dirección específica
 * 
 * Ejecutar:
 * npx hardhat run scripts/buy-tokens-for-address.ts --network localhost
 */

const TARGET_ADDRESS = "0x51688BD1aa9fCa4e1c71E8D91CFEDa5E684A465C";

async function main() {
  console.log("\n💰 Comprando tokens para dirección específica...\n");
  console.log(`🎯 Dirección objetivo: ${TARGET_ADDRESS}\n`);
  
  const [deployer, creator1, creator2, creator3] = await ethers.getSigners();
  
  const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const EXCHANGE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);
  const exchange = await ethers.getContractAt("TokenExchange", EXCHANGE_ADDRESS);

  // Verificar que la dirección tenga ETH
  const targetBalance = await ethers.provider.getBalance(TARGET_ADDRESS);
  console.log(`💵 Balance ETH de la dirección: ${ethers.formatEther(targetBalance)} ETH\n`);

  if (targetBalance < ethers.parseEther("2")) {
    console.log("⚠️  Advertencia: La dirección tiene poco ETH. Necesitarás ETH para comprar tokens.");
    console.log("💡 Puedes enviar ETH desde otra cuenta o usar la cuenta #0 de Hardhat.\n");
  }

  // Intentar obtener tokens de los creadores
  const creators = [creator1, creator2, creator3];
  const tokenData = [
    { name: "Ibaisitos", symbol: "IBAI", buyAmount: "1.0" },
    { name: "Rubius Coin", symbol: "RUBIUS", buyAmount: "0.8" },
    { name: "Auron Coin", symbol: "AURON", buyAmount: "0.5" },
  ];

  // Verificar si la dirección es una cuenta de Hardhat
  const allSigners = await ethers.getSigners();
  let isHardhatAccount = false;
  for (const signer of allSigners) {
    const addr = await signer.getAddress();
    if (addr.toLowerCase() === TARGET_ADDRESS.toLowerCase()) {
      isHardhatAccount = true;
      break;
    }
  }

  if (!isHardhatAccount) {
    // Si no es una cuenta de Hardhat, usaremos deployer para comprar y transferir
    console.log("📤 La dirección no es una cuenta de Hardhat.");
    console.log("📤 Enviando ETH desde cuenta #0 para que pueda hacer transacciones...\n");
    
    const ethToSend = ethers.parseEther("5.0"); // Enviar 5 ETH
    const sendTx = await deployer.sendTransaction({
      to: TARGET_ADDRESS,
      value: ethToSend,
    });
    await sendTx.wait();
    console.log(`✅ Enviados ${ethers.formatEther(ethToSend)} ETH a ${TARGET_ADDRESS}\n`);
    
    // Usar deployer para comprar tokens y luego transferirlos
    console.log("🔄 Comprando tokens con cuenta #0 y transfiriendo a tu dirección...\n");
    
    for (let i = 0; i < creators.length; i++) {
      const creator = creators[i];
      const data = tokenData[i];
      
      try {
        const tokenAddress = await factory.getCreatorToken(creator.address);
        
        if (tokenAddress === ethers.ZeroAddress) {
          console.log(`  ⚠️  ${data.name}: Token no existe, saltando...\n`);
          continue;
        }

        console.log(`  📦 ${data.name} (${data.symbol})...`);
        console.log(`     Token: ${tokenAddress}`);

        // Comprar tokens con deployer
        const buyTx = await exchange.connect(deployer).buyTokens(tokenAddress, {
          value: ethers.parseEther(data.buyAmount)
        });
        await buyTx.wait();

        // Transferir tokens a la dirección objetivo
        const token = await ethers.getContractAt("CreatorToken", tokenAddress);
        const balance = await token.balanceOf(deployer.address);
        const transferTx = await token.connect(deployer).transfer(TARGET_ADDRESS, balance);
        await transferTx.wait();

        console.log(`     ✅ Comprados y transferidos: ${ethers.formatUnits(balance, 18)} ${data.symbol}`);
        
        // Verificar balance final
        const finalBalance = await token.balanceOf(TARGET_ADDRESS);
        console.log(`     ✅ Balance final en ${TARGET_ADDRESS.slice(0, 10)}...: ${ethers.formatUnits(finalBalance, 18)} ${data.symbol}\n`);

      } catch (error: any) {
        console.error(`     ❌ Error con ${data.name}: ${error.message}\n`);
      }
    }
    
    console.log("✅ Proceso completado!\n");
    return;
  }

  // Si llegamos aquí, la dirección es una cuenta de Hardhat
  console.log("✅ La dirección es una cuenta de Hardhat, comprando directamente...\n");

  for (let i = 0; i < creators.length; i++) {
    const creator = creators[i];
    const data = tokenData[i];
    
    try {
      const tokenAddress = await factory.getCreatorToken(creator.address);
      
      if (tokenAddress === ethers.ZeroAddress) {
        console.log(`  ⚠️  ${data.name}: Token no existe, saltando...\n`);
        continue;
      }

      console.log(`  📦 ${data.name} (${data.symbol})...`);
      console.log(`     Token: ${tokenAddress}`);

      // Verificar balance actual
      const token = await ethers.getContractAt("CreatorToken", tokenAddress);
      const currentBalance = await token.balanceOf(TARGET_ADDRESS);
      console.log(`     Balance actual: ${ethers.formatUnits(currentBalance, 18)} ${data.symbol}`);

      // Comprar tokens
      const buyTx = await exchange.connect(targetSigner).buyTokens(tokenAddress, {
        value: ethers.parseEther(data.buyAmount)
      });
      await buyTx.wait();

      // Verificar nuevo balance
      const newBalance = await token.balanceOf(TARGET_ADDRESS);
      const purchased = newBalance - currentBalance;
      
      console.log(`     ✅ Comprado: ${ethers.formatUnits(purchased, 18)} ${data.symbol}`);
      console.log(`     ✅ Nuevo balance: ${ethers.formatUnits(newBalance, 18)} ${data.symbol}\n`);

    } catch (error: any) {
      console.error(`     ❌ Error con ${data.name}: ${error.message}\n`);
    }
  }

  console.log("✅ Proceso completado!\n");
  console.log("🎯 Ahora puedes:");
  console.log("  1. Ver tus tokens en My Wallet");
  console.log("  2. Apostar en predicciones");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

