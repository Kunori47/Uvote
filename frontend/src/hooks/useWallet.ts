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

  // Manually refresh balance
  const refreshBalance = async () => {
    if (!isWalletInstalled() || !state.address) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const balanceBigInt = await provider.getBalance(state.address);
      const balance = ethers.formatEther(balanceBigInt);
      
      console.log('🔄 Balance refreshed:', balance, 'ETH');
      
      setState(prev => ({
        ...prev,
        balance,
      }));
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (!isWalletInstalled()) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        // Update with new account without calling full connect()
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
          console.error('Error updating account:', error);
        }
      }
    };

    const handleChainChanged = () => {
      // Reload page when network changes
      window.location.reload();
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Auto-connect if already connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!isWalletInstalled()) return;
      if (state.isConnected) return; // Already connected, do nothing

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);
        
        if (accounts.length > 0) {
          // Verify ChainID and switch if necessary
          const chainId = await provider.send('eth_chainId', []);
          const targetChainId = `0x${NETWORK_CONFIG.chainId.toString(16)}`;
          console.log('🔄 Auto-connect - ChainID:', chainId, '(esperado:', targetChainId, ')');
          
          // If not on correct network, switch
          if (chainId !== targetChainId) {
            console.log('⚠️  Wrong network. Switching to Hardhat Local...');
            console.log('   Current ChainID:', chainId, '| Expected:', targetChainId);
            
            try {
              // First try to add network (in case it doesn't exist)
              console.log('📝 Adding/configuring Hardhat Local network...');
              try {
                await provider.send('wallet_addEthereumChain', [
                  {
                    chainId: targetChainId,
                    chainName: NETWORK_CONFIG.chainName,
                    rpcUrls: [NETWORK_CONFIG.rpcUrl],
                    nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                    blockExplorerUrls: [], // No explorer for local network
                  }
                ]);
                console.log('✅ Network added successfully');
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (addError: any) {
                // If network already exists, it's fine, we continue
                if (addError.code === -32602 || addError.message?.includes('already')) {
                  console.log('ℹ️  Network already exists, continuing...');
                } else {
                  console.warn('⚠️  Could not add network (may already exist):', addError.message);
                }
              }
              
              // Now try to switch to network
              console.log('🔄 Switching to Hardhat Local network...');
              await provider.send('wallet_switchEthereumChain', [
                { chainId: targetChainId }
              ]);
              console.log('✅ Network switch requested');
              
              // Wait more time for SubWallet to process the change
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Verify the change was completed
              const newChainId = await provider.send('eth_chainId', []);
              if (newChainId === targetChainId) {
                console.log('✅ Network switch completed successfully');
              } else {
                console.warn('⚠️  ChainID still doesn\'t match. You may need to confirm in SubWallet.');
              }
            } catch (switchError: any) {
              console.error('❌ Error switching network:', switchError);
              // Continue anyway to show error to user
            }
          }
          
          // Update state
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const balanceBigInt = await provider.getBalance(address);
          const balance = ethers.formatEther(balanceBigInt);
          
          console.log('💰 Auto-connect - Balance:', balance, 'ETH');
          console.log('📍 Auto-connect - Address:', address);
          
          setState({
            address,
            balance,
            isConnected: true,
            isConnecting: false,
            error: chainId !== targetChainId ? 'Wrong network. Switch to Hardhat Local in SubWallet.' : null,
          });
        }
      } catch (error) {
        console.error('Error in auto-connect:', error);
        // Don't set error in auto-connect, only in manual connection
      }
    };

    autoConnect();
  }, []); // Only run once on mount

  // Detect which wallet is installed
  const getWalletType = () => {
    if (!isWalletInstalled()) return null;
    // SubWallet identifies as SubWallet in window.ethereum
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

