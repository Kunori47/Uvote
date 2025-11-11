import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [account] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(account.address);
  console.log(`Account: ${account.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} DEV`);
}

await main();


