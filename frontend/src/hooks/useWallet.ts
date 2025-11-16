import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../lib/contracts';

export interface WalletState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Verificar si hay una wallet compatible instalada (SubWallet o MetaMask)
  const isWalletInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Conectar wallet
  const connect = async () => {
    if (!isWalletInstalled()) {
      setState(prev => ({ 
        ...prev, 
        error: 'Por favor instala SubWallet (recomendado) o MetaMask' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }));

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Solicitar acceso a las cuentas
      await provider.send('eth_requestAccounts', []);
      
      // Verificar/Cambiar a la red correcta ANTES de obtener el signer
      const currentChainId = await provider.send('eth_chainId', []);
      const targetChainId = `0x${NETWORK_CONFIG.chainId.toString(16)}`;
      
      if (currentChainId !== targetChainId) {
        console.log('⚠️  Red incorrecta en connect(). Cambiando a Hardhat Local...');
        console.log('   ChainID actual:', currentChainId, '| Esperado:', targetChainId);
        
        try {
          // Primero intentar agregar la red (por si no existe)
          try {
            await provider.send('wallet_addEthereumChain', [
              {
                chainId: targetChainId,
                chainName: NETWORK_CONFIG.chainName,
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                blockExplorerUrls: [],
              }
            ]);
            console.log('✅ Red agregada');
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (addError: any) {
            // Si la red ya existe, está bien
            if (addError.code === -32602 || addError.message?.includes('already')) {
              console.log('ℹ️  La red ya existe');
            }
          }
          
          // Ahora cambiar a la red
          await provider.send('wallet_switchEthereumChain', [
            { chainId: targetChainId }
          ]);
          console.log('✅ Cambio de red solicitado');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (switchError: any) {
          // Ignorar error "Duplicate request" - significa que ya está en la red correcta
          if (switchError.code === -32602 && switchError.message?.includes('Duplicate')) {
            console.log('Red ya está activa, continuando...');
          } 
          // Otros errores los lanzamos
          else {
            console.error('Error cambiando de red:', switchError);
            throw switchError;
          }
        }
      }
      
      // Esperar un momento para que la red se actualice
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Obtener el signer y datos de la cuenta
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Verificar que estamos en la red correcta
      const chainId = await provider.send('eth_chainId', []);
      console.log('🔗 ChainID actual:', chainId, '(esperado:', targetChainId, ')');
      
      // Obtener balance
      const balanceBigInt = await provider.getBalance(address);
      const balance = ethers.formatEther(balanceBigInt);
      
      console.log('💰 Balance leído:', balance, 'ETH');
      console.log('📍 Dirección:', address);

      setState({
        address,
        balance,
        isConnected: true,
        isConnecting: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error conectando wallet:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Error al conectar wallet',
      }));
    }
  };

  // Desconectar (solo limpia el estado local)
  const disconnect = () => {
    setState({
      address: null,
      balance: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  };

  // Refrescar balance manualmente
  const refreshBalance = async () => {
    if (!isWalletInstalled() || !state.address) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const balanceBigInt = await provider.getBalance(state.address);
      const balance = ethers.formatEther(balanceBigInt);
      
      console.log('🔄 Balance refrescado:', balance, 'ETH');
      
      setState(prev => ({
        ...prev,
        balance,
      }));
    } catch (error) {
      console.error('Error refrescando balance:', error);
    }
  };

  // Escuchar cambios de cuenta
  useEffect(() => {
    if (!isWalletInstalled()) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        // Actualizar con la nueva cuenta sin llamar a connect() completo
        try {
          const provider = new ethers.BrowserProvider(window.ethereum!);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const balanceBigInt = await provider.getBalance(address);
          const balance = ethers.formatEther(balanceBigInt);
          
          setState(prev => ({
            ...prev,
            address,
            balance,
            isConnected: true,
          }));
        } catch (error) {
          console.error('Error actualizando cuenta:', error);
        }
      }
    };

    const handleChainChanged = () => {
      // Recargar la página cuando cambia la red
      window.location.reload();
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Auto-conectar si ya estaba conectado
  useEffect(() => {
    const autoConnect = async () => {
      if (!isWalletInstalled()) return;
      if (state.isConnected) return; // Ya está conectado, no hacer nada

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        
        if (accounts.length > 0) {
          // Verificar ChainID y cambiar si es necesario
          const chainId = await provider.send('eth_chainId', []);
          const targetChainId = `0x${NETWORK_CONFIG.chainId.toString(16)}`;
          console.log('🔄 Auto-connect - ChainID:', chainId, '(esperado:', targetChainId, ')');
          
          // Si no está en la red correcta, cambiar
          if (chainId !== targetChainId) {
            console.log('⚠️  Red incorrecta. Cambiando a Hardhat Local...');
            console.log('   ChainID actual:', chainId, '| Esperado:', targetChainId);
            
            try {
              // Primero intentar agregar la red (por si no existe)
              console.log('📝 Agregando/configurando red Hardhat Local...');
              try {
                await provider.send('wallet_addEthereumChain', [
                  {
                    chainId: targetChainId,
                    chainName: NETWORK_CONFIG.chainName,
                    rpcUrls: [NETWORK_CONFIG.rpcUrl],
                    nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                    blockExplorerUrls: [], // Sin explorer para red local
                  }
                ]);
                console.log('✅ Red agregada exitosamente');
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (addError: any) {
                // Si la red ya existe, está bien, continuamos
                if (addError.code === -32602 || addError.message?.includes('already')) {
                  console.log('ℹ️  La red ya existe, continuando...');
                } else {
                  console.warn('⚠️  No se pudo agregar la red (puede que ya exista):', addError.message);
                }
              }
              
              // Ahora intentar cambiar a la red
              console.log('🔄 Cambiando a red Hardhat Local...');
              await provider.send('wallet_switchEthereumChain', [
                { chainId: targetChainId }
              ]);
              console.log('✅ Cambio de red solicitado');
              
              // Esperar más tiempo para que SubWallet procese el cambio
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Verificar que el cambio se completó
              const newChainId = await provider.send('eth_chainId', []);
              if (newChainId === targetChainId) {
                console.log('✅ Cambio de red completado exitosamente');
              } else {
                console.warn('⚠️  El ChainID aún no coincide. Puede que necesites confirmar en SubWallet.');
              }
            } catch (switchError: any) {
              console.error('❌ Error cambiando de red:', switchError);
              // Continuar de todos modos para mostrar el error al usuario
            }
          }
          
          // Actualizar el estado
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const balanceBigInt = await provider.getBalance(address);
          const balance = ethers.formatEther(balanceBigInt);
          
          console.log('💰 Auto-connect - Balance:', balance, 'ETH');
          console.log('📍 Auto-connect - Dirección:', address);
          
          setState({
            address,
            balance,
            isConnected: true,
            isConnecting: false,
            error: chainId !== targetChainId ? 'Red incorrecta. Cambia a Hardhat Local en SubWallet.' : null,
          });
        }
      } catch (error) {
        console.error('Error en auto-connect:', error);
        // No establecer error en auto-connect, solo en conexión manual
      }
    };

    autoConnect();
  }, []); // Solo ejecutar una vez al montar

  // Detectar qué wallet está instalada
  const getWalletType = () => {
    if (!isWalletInstalled()) return null;
    // SubWallet se identifica como SubWallet en window.ethereum
    if (window.ethereum?.isSubWallet) return 'SubWallet';
    if (window.ethereum?.isMetaMask) return 'MetaMask';
    return 'Unknown';
  };

  return {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    isWalletInstalled: isWalletInstalled(),
    walletType: getWalletType(),
  };
};

