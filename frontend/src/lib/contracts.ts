import { ethers } from 'ethers';

// Tipo de red disponible
type NetworkType = 'local' | 'moonbase' | 'moonbeam';

// Obtener el tipo de red desde variables de entorno (default: local)
const getNetworkType = (): NetworkType => {
  const network = import.meta.env.VITE_NETWORK;
  if (network === 'moonbase' || network === 'moonbeam') {
    return network;
  }
  return 'local';
};

const networkType = getNetworkType();

// Configuraciones de red
const NETWORK_CONFIGS = {
  local: {
    chainId: Number(import.meta.env.VITE_LOCAL_CHAIN_ID || '31337'),
    chainName: 'Hardhat Local',
    rpcUrl: import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    contractAddresses: {
      CreatorTokenFactory: import.meta.env.VITE_LOCAL_FACTORY_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      PredictionMarket: import.meta.env.VITE_LOCAL_PREDICTION_MARKET_ADDRESS || '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      TokenExchange: import.meta.env.VITE_LOCAL_TOKEN_EXCHANGE_ADDRESS || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    },
  },
  moonbase: {
    chainId: Number(import.meta.env.VITE_MOONBASE_CHAIN_ID || '1287'),
    chainName: 'Moonbase Alpha',
    rpcUrl: import.meta.env.VITE_MOONBASE_RPC_URL || 'https://rpc.api.moonbase.moonbeam.network',
    nativeCurrency: {
      name: 'Moonbase',
      symbol: 'DEV',
      decimals: 18,
    },
    contractAddresses: {
      CreatorTokenFactory: import.meta.env.VITE_MOONBASE_FACTORY_ADDRESS || '',
      PredictionMarket: import.meta.env.VITE_MOONBASE_PREDICTION_MARKET_ADDRESS || '',
      TokenExchange: import.meta.env.VITE_MOONBASE_TOKEN_EXCHANGE_ADDRESS || '',
    },
  },
  moonbeam: {
    chainId: Number(import.meta.env.VITE_MOONBEAM_CHAIN_ID || '1284'),
    chainName: 'Moonbeam',
    rpcUrl: import.meta.env.VITE_MOONBEAM_RPC_URL || 'https://rpc.api.moonbeam.network',
    nativeCurrency: {
      name: 'Moonbeam',
      symbol: 'GLMR',
      decimals: 18,
    },
    contractAddresses: {
      CreatorTokenFactory: import.meta.env.VITE_MOONBEAM_FACTORY_ADDRESS || '',
      PredictionMarket: import.meta.env.VITE_MOONBEAM_PREDICTION_MARKET_ADDRESS || '',
      TokenExchange: import.meta.env.VITE_MOONBEAM_TOKEN_EXCHANGE_ADDRESS || '',
    },
  },
} as const;

// Configuración actual basada en el tipo de red
export const NETWORK_CONFIG = NETWORK_CONFIGS[networkType];

// Direcciones de contratos para la red actual
export const CONTRACT_ADDRESSES = NETWORK_CONFIGS[networkType].contractAddresses as {
  CreatorTokenFactory: string;
  PredictionMarket: string;
  TokenExchange: string;
};

// Símbolo de moneda nativa para mostrar en la UI
// En Moonbeam/Moonbase mostramos DOT, en local ETH
export const NATIVE_CURRENCY_SYMBOL = 
  networkType === 'moonbase' || networkType === 'moonbeam' 
    ? 'DOT' 
    : 'ETH';

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

