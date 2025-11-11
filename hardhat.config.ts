import "dotenv/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

const moonbasePrivateKey = process.env.MOONBASE_PRIVATE_KEY
  ? process.env.MOONBASE_PRIVATE_KEY.startsWith("0x")
    ? process.env.MOONBASE_PRIVATE_KEY
    : `0x${process.env.MOONBASE_PRIVATE_KEY}`
  : undefined;

const sepoliaPrivateKey = process.env.SEPOLIA_PRIVATE_KEY
  ? process.env.SEPOLIA_PRIVATE_KEY.startsWith("0x")
    ? process.env.SEPOLIA_PRIVATE_KEY
    : `0x${process.env.SEPOLIA_PRIVATE_KEY}`
  : undefined;

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;

const networks: Record<string, any> = {
  moonbase: {
    type: "http",
    url: "https://rpc.api.moonbase.moonbeam.network",
    accounts: moonbasePrivateKey ? [moonbasePrivateKey] : [],
    chainId: 1287,
  },
  hardhatMainnet: {
    type: "edr-simulated",
    chainType: "l1",
  },
  hardhatOp: {
    type: "edr-simulated",
    chainType: "op",
  },
};

if (sepoliaRpcUrl) {
  networks.sepolia = {
    type: "http",
    chainType: "l1",
    url: sepoliaRpcUrl,
    accounts: sepoliaPrivateKey ? [sepoliaPrivateKey] : [],
  };
}

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    },
  },
  networks,
});
