import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const factory = await ethers.getContractAt("CreatorTokenFactory", FACTORY_ADDRESS);

  console.log("\n📋 Listando todos los tokens de creadores...\n");

  const totalTokens = await factory.getTotalTokens();
  console.log(`Total de tokens: ${totalTokens}\n`);

  if (totalTokens === 0n) {
    console.log("No hay tokens creados aún.\n");
    return;
  }

  const tokens = await factory.getAllTokens(0, Number(totalTokens));

  console.log("=" .repeat(80));
  for (let i = 0; i < tokens.length; i++) {
    const tokenAddress = tokens[i];
    const creator = await factory.getTokenCreator(tokenAddress);
    const creatorInfo = await factory.getCreatorInfo(creator);
    
    try {
      const token = await ethers.getContractAt("CreatorToken", tokenAddress);
      const name = await token.name();
      const symbol = await token.symbol();
      const price = await token.tokenPrice();
      
      console.log(`\n${i + 1}. ${name} (${symbol})`);
      console.log(`   Token: ${tokenAddress}`);
      console.log(`   Creador: ${creator}`);
      console.log(`   Precio: ${ethers.formatEther(price)} ETH`);
      console.log(`   Activo: ${creatorInfo.isActive ? '✅' : '❌'}`);
      console.log(`   Baneado: ${creatorInfo.isBanned ? '🚫' : '✅'}`);
      
      // Verificar autorizaciones
      const isExchangeAuthorized = await token.authorizedMinters("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
      const isMarketAuthorized = await token.authorizedMinters("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
      
      console.log(`   Exchange autorizado: ${isExchangeAuthorized ? '✅' : '❌'}`);
      console.log(`   Market autorizado: ${isMarketAuthorized ? '✅' : '❌'}`);
      
      if (!isExchangeAuthorized || !isMarketAuthorized) {
        console.log(`   ⚠️  Para autorizar, ejecuta:`);
        console.log(`      npx hardhat run scripts/authorize-exchange-for-token.ts --network localhost ${tokenAddress}`);
      }
    } catch (err) {
      console.log(`   ⚠️  Error obteniendo info del token: ${err}`);
    }
  }
  console.log("\n" + "=" .repeat(80) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

