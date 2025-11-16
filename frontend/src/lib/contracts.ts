import { ethers } from 'ethers';

// Direcciones de los contratos desplegados en Hardhat local
// IMPORTANTE: Estas direcciones se reinician cada vez que reinicias `npx hardhat node`
// Último deployment local (via Ignition UvoteSystem):
//   CreatorTokenFactory - 0x5FbDB2315678afecb367f032d93F642f64180aa3
//   PredictionMarket    - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
//   TokenExchange       - 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
export const CONTRACT_ADDRESSES = {
  CreatorTokenFactory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  PredictionMarket: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  TokenExchange: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
} as const;

// Configuración de la red local de Hardhat
export const NETWORK_CONFIG = {
  chainId: 31337,
  chainName: 'Hardhat Local',
  rpcUrl: 'http://127.0.0.1:8545',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Provider para leer datos (sin necesidad de wallet)
export const getProvider = () => {
  return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
};

// Provider con signer para escribir transacciones (requiere wallet)
export const getSigner = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask no está instalado');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
};

