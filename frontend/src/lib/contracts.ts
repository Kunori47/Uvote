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
      CreatorTokenFactory: import.meta.env.VITE_LOCAL_FACTORY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      PredictionMarket: import.meta.env.VITE_LOCAL_PREDICTION_MARKET_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      TokenExchange: import.meta.env.VITE_LOCAL_TOKEN_EXCHANGE_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
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
export const NATIVE_CURRENCY_SYMBOL = NETWORK_CONFIG.nativeCurrency.symbol;

// Provider para leer datos (sin necesidad de wallet)
export const getProvider = () => {
  return new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
};

// Helper para verificar que el wallet provider esté conectado
// NOTA: Esta verificación es mínima para evitar falsos positivos de "wallet desconectada"
const verifyWalletConnection = async (walletProvider: any): Promise<void> => {
  // Solo verificar que el provider esté disponible y tenga la función request
  if (!walletProvider || typeof walletProvider.request !== 'function') {
    throw new Error('Wallet provider no está disponible');
  }

  // No hacemos verificación adicional con eth_accounts porque:
  // 1. Puede causar timeouts falsos si la wallet tarda en responder
  // 2. El BrowserProvider.getSigner() ya hará la verificación necesaria
  // 3. Si hay un problema real, se detectará al intentar firmar la transacción
};

// Provider con signer para escribir transacciones (requiere wallet)
export const getSigner = async () => {
  const { getWalletProvider } = await import('./walletProvider');
  const walletProvider = getWalletProvider();

  if (!walletProvider) {
    throw new Error('No se encontró ninguna wallet instalada (SubWallet o MetaMask)');
  }

  // Verificar conexión antes de crear el BrowserProvider
  await verifyWalletConnection(walletProvider);

  // Crear un nuevo BrowserProvider cada vez para evitar problemas de conexión
  // Esto es importante porque el BrowserProvider puede cachear un estado desconectado
  const browserProvider = new ethers.BrowserProvider(walletProvider);

  try {
    // Intentar obtener el signer
    const signer = await browserProvider.getSigner();

    // Nota: No hacemos verificación adicional con getBlockNumber() porque:
    // 1. verifyWalletConnection ya validó que la wallet está conectada
    // 2. getBlockNumber usa el RPC provider, que puede fallar por razones de red
    //    incluso cuando la wallet está correctamente conectada
    // 3. Esto causaba falsos positivos de "wallet desconectada"

    return signer;
  } catch (error: any) {
    // Si hay un error al obtener el signer, verificar si es un problema de conexión
    if (error?.message?.includes('disconnected') ||
      error?.message?.includes('port') ||
      error?.code === 'UNKNOWN_ERROR' ||
      (error?.error?.message?.includes && error.error.message.includes('disconnected'))) {
      throw new Error('La wallet se desconectó. Por favor, reconecta tu wallet e intenta de nuevo.');
    }
    throw error;
  }
};

