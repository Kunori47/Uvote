import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  
  console.log("Desplegando contrato Counter en Moonbeam...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance de la cuenta:", ethers.formatEther(balance), "DEV");
  
  // Deploy Counter contract
  console.log("\nDesplegando Counter...");
  const Counter = await ethers.getContractFactory("Counter");
  const counter = await Counter.deploy();
  await counter.waitForDeployment();
  
  const counterAddress = await counter.getAddress();
  console.log("✅ Counter desplegado en:", counterAddress);
  
  // Test the contract
  console.log("\n🧪 Probando el contrato...");
  console.log("Valor inicial de x:", await counter.x());
  
  console.log("Incrementando...");
  const tx1 = await counter.inc();
  await tx1.wait();
  console.log("Valor después de inc():", await counter.x());
  
  console.log("Incrementando por 5...");
  const tx2 = await counter.incBy(5);
  await tx2.wait();
  console.log("Valor después de incBy(5):", await counter.x());
  
  console.log("\n✅ Despliegue y pruebas completados!");
  console.log(`\n📝 Dirección del contrato: ${counterAddress}`);
  console.log(`🔍 Ver en Moonscan: https://moonbase.moonscan.io/address/${counterAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
