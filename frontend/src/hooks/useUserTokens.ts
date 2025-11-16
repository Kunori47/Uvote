import { useState, useEffect } from 'react';
import { factoryService, creatorTokenService } from '../lib/contractService';

export interface UserToken {
  tokenAddress: string;
  creatorAddress: string;
  name: string;
  symbol: string;
  balance: string;
  price: string; // Precio en ETH
  totalValue: string; // balance * price en ETH
}

export const useUserTokens = (userAddress: string | null) => {
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTokens = async () => {
    if (!userAddress) {
      setTokens([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Obtener todos los tokens del factory
      const totalTokens = await factoryService.getTotalTokens();
      const tokenAddresses = await factoryService.getAllTokens(0, totalTokens);

      // 2. Para cada token, obtener info y balance del usuario
      const userTokensData: UserToken[] = [];

      for (const tokenAddress of tokenAddresses) {
        try {
          // Obtener info del token
          const tokenInfo = await creatorTokenService.getTokenInfo(tokenAddress);
          
          // Obtener balance del usuario
          const balance = await creatorTokenService.getBalance(tokenAddress, userAddress);
          
          // Solo incluir si el usuario tiene balance > 0
          if (parseFloat(balance) > 0) {
            const totalValue = (parseFloat(balance) * parseFloat(tokenInfo.price)).toFixed(4);
            
            userTokensData.push({
              tokenAddress,
              creatorAddress: tokenInfo.creator,
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              balance,
              price: tokenInfo.price,
              totalValue,
            });
          }
        } catch (err) {
          console.error(`Error loading token ${tokenAddress}:`, err);
        }
      }

      setTokens(userTokensData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar tokens');
      console.error('Error loading user tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, [userAddress]);

  return {
    tokens,
    loading,
    error,
    refetch: loadTokens,
  };
};

