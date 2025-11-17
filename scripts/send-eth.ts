import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const TARGET_ADDRESSES = [
    "0x51688BD1aa9fCa4e1c71E8D91CFEDa5E684A465C",
    "0x1E6EC0ad80EE9Ff5Ae4ABed0E9C2A12AD8116a88",
    "0x06A868C73A1AdfBeaB20Ca71B514829b56150f4D",
    "0x6285194dd78F8609077541453817368087f71862"
  ];
  const AMOUNT = ethers.parseEther("100.0");

  const [deployer] = await ethers.getSigners();
  console.log("\n💰 Enviando ETH a múltiples direcciones...\n");
  console.log(`📤 Desde: ${deployer.address}\n`);
  console.log(`💵 Cantidad por dirección: ${ethers.formatEther(AMOUNT)} ETH\n`);

  for (const TARGET_ADDRESS of TARGET_ADDRESSES) {
    console.log("-----------------------------------------------------");
    console.log(`📍 Dirección destino: ${TARGET_ADDRESS}`);

    // Verificar balance antes
    const balanceBefore = await ethers.provider.getBalance(TARGET_ADDRESS);
    console.log(`💵 Balance antes: ${ethers.formatEther(balanceBefore)} ETH`);

    // Enviar ETH
    const tx = await deployer.sendTransaction({
      to: TARGET_ADDRESS,
      value: AMOUNT,
    });

    console.log(`⏳ Transacción enviada, hash: ${tx.hash}`);
    console.log(`⏳ Esperando confirmación...\n`);
    
    await tx.wait();
    console.log(`✅ Transacción confirmada!`);

    // Verificar balance después
    const balanceAfter = await ethers.provider.getBalance(TARGET_ADDRESS);
    console.log(`💵 Balance después: ${ethers.formatEther(balanceAfter)} ETH`);
    console.log(`✅ ${ethers.formatEther(AMOUNT)} ETH enviados exitosamente a ${TARGET_ADDRESS}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

