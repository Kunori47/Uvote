import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from './contracts';
import { getWalletProvider } from './walletProvider';

export interface WalletState {
    address: string | null;
    balance: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

interface WalletContextType extends WalletState {
    connect: () => Promise<void>;
    disconnect: () => void;
    refreshBalance: () => Promise<void>;
    isWalletInstalled: boolean;
    walletType: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Helper to get a fresh wallet provider
const getFreshProvider = () => {
    const walletProvider = getWalletProvider();
    if (!walletProvider) return null;
    return new ethers.BrowserProvider(walletProvider);
};

// Helper to fetch balance using RPC provider (more reliable than wallet provider)
const fetchBalance = async (address: string): Promise<string> => {
    try {
        const rpcProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
        const balanceBigInt = await rpcProvider.getBalance(address);
        return ethers.formatEther(balanceBigInt);
    } catch (error) {
        console.warn('Error fetching balance via RPC:', error);
        return '0';
    }
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<WalletState>({
        address: null,
        balance: null,
        isConnected: false,
        isConnecting: false,
        error: null,
    });

    const mountedRef = useRef(true);

    const isWalletInstalled = useCallback(() => {
        return getWalletProvider() !== null;
    }, []);

    // Connect wallet
    const connect = useCallback(async () => {
        if (!isWalletInstalled()) {
            setState(prev => ({
                ...prev,
                error: 'Por favor instala SubWallet (recomendado) o MetaMask'
            }));
            return;
        }

        try {
            setState(prev => ({ ...prev, isConnecting: true, error: null }));

            const provider = getFreshProvider();
            if (!provider) {
                throw new Error('No wallet provider found');
            }

            // Request account access
            console.log('🔗 Requesting accounts...');
            const accounts = await provider.send('eth_requestAccounts', []);
            console.log('✅ Got accounts:', accounts);

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts returned');
            }

            // Get fresh provider after account request
            const freshProvider = getFreshProvider();
            if (!freshProvider) {
                throw new Error('Provider disconnected');
            }

            // Check/Switch to correct network
            const currentChainId = await freshProvider.send('eth_chainId', []);
            const targetChainId = `0x${NETWORK_CONFIG.chainId.toString(16)}`;

            if (currentChainId !== targetChainId) {
                console.log('⚠️ Wrong network. Switching...');
                try {
                    try {
                        await freshProvider.send('wallet_addEthereumChain', [
                            {
                                chainId: targetChainId,
                                chainName: NETWORK_CONFIG.chainName,
                                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                                nativeCurrency: NETWORK_CONFIG.nativeCurrency,
                                blockExplorerUrls: [],
                            }
                        ]);
                    } catch (addError: any) {
                        console.log('Network add result:', addError?.message || 'ok');
                    }

                    await freshProvider.send('wallet_switchEthereumChain', [
                        { chainId: targetChainId }
                    ]);
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (switchError: any) {
                    console.warn('Network switch error:', switchError?.message);
                }
            }

            // Get address
            const finalProvider = getFreshProvider();
            if (!finalProvider) {
                throw new Error('Provider disconnected after network switch');
            }

            const signer = await finalProvider.getSigner();
            const address = await signer.getAddress();

            // Get balance using RPC (more reliable)
            const balance = await fetchBalance(address);

            console.log('💰 Balance:', balance, 'DOT');
            console.log('📍 Address:', address);

            if (mountedRef.current) {
                setState({
                    address,
                    balance,
                    isConnected: true,
                    isConnecting: false,
                    error: null,
                });
            }
        } catch (error: any) {
            console.error('Error connecting wallet:', error);
            if (mountedRef.current) {
                setState(prev => ({
                    ...prev,
                    isConnecting: false,
                    error: error.message || 'Error connecting wallet',
                }));
            }
        }
    }, [isWalletInstalled]);

    // Disconnect
    const disconnect = useCallback(() => {
        setState({
            address: null,
            balance: null,
            isConnected: false,
            isConnecting: false,
            error: null,
        });
    }, []);

    // Refresh balance
    const refreshBalance = useCallback(async () => {
        if (!state.address) return;

        const balance = await fetchBalance(state.address);
        if (mountedRef.current) {
            setState(prev => ({
                ...prev,
                balance,
            }));
        }
    }, [state.address]);

    // Listen for account changes
    useEffect(() => {
        if (!isWalletInstalled()) return;

        const handleAccountsChanged = async (accounts: string[]) => {
            console.log('📢 Accounts changed:', accounts);
            if (accounts.length === 0) {
                disconnect();
            } else {
                try {
                    const provider = getFreshProvider();
                    if (!provider) return;

                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();
                    const balance = await fetchBalance(address);

                    if (mountedRef.current) {
                        setState(prev => ({
                            ...prev,
                            address,
                            balance,
                            isConnected: true,
                        }));
                    }
                } catch (error) {
                    console.error('Error updating account:', error);
                }
            }
        };

        const handleChainChanged = () => {
            console.log('📢 Chain changed, reloading...');
            window.location.reload();
        };

        const walletProvider = getWalletProvider();
        if (walletProvider) {
            walletProvider.on('accountsChanged', handleAccountsChanged);
            walletProvider.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (walletProvider) {
                try {
                    walletProvider.removeListener('accountsChanged', handleAccountsChanged);
                    walletProvider.removeListener('chainChanged', handleChainChanged);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, [disconnect, isWalletInstalled]);

    // Auto-connect if already connected
    useEffect(() => {
        mountedRef.current = true;

        const autoConnect = async () => {
            if (!isWalletInstalled()) return;

            try {
                const provider = getFreshProvider();
                if (!provider) return;

                const accounts = await provider.send('eth_accounts', []);

                if (accounts.length > 0) {
                    console.log('🔄 Auto-connecting with existing account...');

                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();
                    const balance = await fetchBalance(address);

                    if (mountedRef.current) {
                        setState({
                            address,
                            balance,
                            isConnected: true,
                            isConnecting: false,
                            error: null,
                        });
                    }
                }
            } catch (error) {
                console.error('Error in auto-connect:', error);
            }
        };

        const timeout = setTimeout(autoConnect, 500);

        return () => {
            mountedRef.current = false;
            clearTimeout(timeout);
        };
    }, [isWalletInstalled]);

    // Detect wallet type
    const getWalletType = useCallback(() => {
        if (!isWalletInstalled()) return null;
        const walletProvider = getWalletProvider();
        if (walletProvider?.isSubWallet || (typeof window !== 'undefined' && (window as any).SubWallet)) return 'SubWallet';
        if (walletProvider?.isMetaMask) return 'MetaMask';
        return 'Unknown';
    }, [isWalletInstalled]);

    const value: WalletContextType = {
        ...state,
        connect,
        disconnect,
        refreshBalance,
        isWalletInstalled: isWalletInstalled(),
        walletType: getWalletType(),
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet(): WalletContextType {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
