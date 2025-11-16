import { network } from "hardhat";

const { ethers } = await network.connect();

/**
 * Script para verificar el flujo económico completo
 */

async function main() {
  const FACTORY_ADDRESS = "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";
  const EXCHANGE_ADDRESS = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";

  console.log("\n💰 Verificando flujo económico completo...\n");

  const [deployer, creator, buyer] = await ethers.getSigners();
  const factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);
  const exchange = await ethers.getContractAt("TokenExchange", EXCHANGE_ADDRESS);

  // Usar token de Ibai (ya creado)
  const ibaiAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const ibaiToken = await factory.getCreatorToken(ibaiAddress);
  
  console.log(`👤 Creador: ${ibaiAddress}`);
  console.log(`🪙 Token: ${ibaiToken}\n`);

  // 1. Balance inicial del creador
  const creatorBalanceBefore = await ethers.provider.getBalance(ibaiAddress);
  console.log(`1️⃣ Balance inicial del creador: ${ethers.formatEther(creatorBalanceBefore)} ETH`);

  // 2. Comprador compra tokens
  const buyAmount = ethers.parseEther("1.0"); // 1 ETH
  console.log(`\n2️⃣ Comprador va a comprar tokens con ${ethers.formatEther(buyAmount)} ETH...`);
  
  const buyTx = await exchange.connect(buyer).buyTokens(ibaiToken, { value: buyAmount });
  await buyTx.wait();
  console.log(`   ✅ Compra completada`);

  // 3. Balance final del creador
  const creatorBalanceAfter = await ethers.provider.getBalance(ibaiAddress);
  console.log(`\n3️⃣ Balance final del creador: ${ethers.formatEther(creatorBalanceAfter)} ETH`);

  // 4. Calcular ganancia
  const creatorGain = creatorBalanceAfter - creatorBalanceBefore;
  console.log(`\n📈 Ganancia del creador: ${ethers.formatEther(creatorGain)} ETH`);
  
  // 5. Verificar fee (debería ser 1% = 0.01 ETH)
  const expectedGain = (buyAmount * 9900n) / 10000n; // 99% del monto
  const expectedFee = buyAmount - expectedGain; // 1% del monto
  
  console.log(`\n📊 Verificación:`);
  console.log(`   - Monto enviado: ${ethers.formatEther(buyAmount)} ETH`);
  console.log(`   - Ganancia esperada (99%): ${ethers.formatEther(expectedGain)} ETH`);
  console.log(`   - Fee esperado (1%): ${ethers.formatEther(expectedFee)} ETH`);
  console.log(`   - Ganancia real: ${ethers.formatEther(creatorGain)} ETH`);
  
  if (creatorGain === expectedGain) {
    console.log(`\n✅ ¡PERFECTO! El creador recibió exactamente el 99% del pago`);
  } else {
    console.log(`\n⚠️  ATENCIÓN: La ganancia no coincide con lo esperado`);
    console.log(`   Diferencia: ${ethers.formatEther(creatorGain - expectedGain)} ETH`);
  }

  // 6. Verificar balance de tokens del comprador
  const tokenContract = await ethers.getContractAt("CreatorToken", ibaiToken);
  const buyerTokenBalance = await tokenContract.balanceOf(buyer.address);
  const tokenPrice = await tokenContract.tokenPrice();
  
  console.log(`\n🪙 Tokens del comprador:`);
  console.log(`   - Balance: ${ethers.formatUnits(buyerTokenBalance, 18)} tokens`);
  console.log(`   - Precio del token: ${ethers.formatEther(tokenPrice)} ETH`);
  
  const expectedTokens = buyAmount / tokenPrice;
  console.log(`   - Tokens esperados: ${ethers.formatUnits(expectedTokens, 0)} tokens`);
  
  console.log(`\n✅ Verificación del flujo económico completada!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

