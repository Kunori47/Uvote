import { useState, useEffect } from 'react';
import { factoryService, creatorTokenService } from '../lib/contractService';
import { ethers } from 'ethers';

export interface MyCreatorToken {
  address: string;
  name: string;
  symbol: string;
  price: string; // en ETH
  totalSupply: string;
  canUpdatePrice: boolean;
  timeUntilPriceUpdate: number; // en segundos
  lastPriceUpdate: number; // timestamp
  priceUpdateInterval: number; // en segundos
}

export const useMyCreatorToken = (creatorAddress: string | null) => {
  const [token, setToken] = useState<MyCreatorToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  const loadToken = async () => {
    if (!creatorAddress) {
      setToken(null);
      setHasToken(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🪙 Cargando token del creador:', creatorAddress);

      // Obtener dirección del token
      const tokenAddress = await factoryService.getCreatorToken(creatorAddress);
      
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        console.log('   ℹ️  El creador no tiene token');
        setHasToken(false);
        setToken(null);
        setLoading(false);
        return;
      }

      console.log('   Token encontrado:', tokenAddress);
      setHasToken(true);

      // Obtener información del token
      const tokenInfo = await creatorTokenService.getTokenInfo(tokenAddress);
      
      // Obtener información adicional del contrato
      const tokenContract = creatorTokenService.getContract(tokenAddress);
      const totalSupply = await tokenContract.totalSupply();
      const canUpdatePriceResult = await tokenContract.canUpdatePrice();
      const lastPriceUpdate = await tokenContract.lastPriceUpdate();
      const priceUpdateInterval = await tokenContract.priceUpdateInterval();
      
      setToken({
        address: tokenAddress,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        price: tokenInfo.price,
        totalSupply: ethers.formatUnits(totalSupply, 18),
        canUpdatePrice: canUpdatePriceResult[0],
        timeUntilPriceUpdate: Number(canUpdatePriceResult[1]),
        lastPriceUpdate: Number(lastPriceUpdate),
        priceUpdateInterval: Number(priceUpdateInterval),
      });

      console.log('   ✅ Token cargado:', tokenInfo.name);
    } catch (err: any) {
      console.error('Error cargando token del creador:', err);
      setError(err.message || 'Error al cargar token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadToken();
  }, [creatorAddress]);

  return { token, hasToken, loading, error, refetch: loadToken };
};

