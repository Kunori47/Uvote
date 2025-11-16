import { useState, useEffect, useCallback } from 'react';
import { Coins, TrendingUp, Calendar, DollarSign, AlertCircle, Loader2, Wallet, Clock, Info, CheckCircle2 } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useMyCreatorToken } from '../hooks/useMyCreatorToken';
import { creatorTokenService, tokenExchangeService } from '../lib/contractService';
import { CONTRACT_ADDRESSES } from '../lib/contracts';
import { ethers } from 'ethers';
import { apiService } from '../lib/apiService';

export function MyCoinPage() {
  const { address, isConnected, balance } = useWallet();
  const { token, hasToken, loading, error, refetch } = useMyCreatorToken(address);
  
  const [isChangingPrice, setIsChangingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [priceChangeError, setPriceChangeError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isExchangeAuthorized, setIsExchangeAuthorized] = useState<boolean | null>(null);
  const [isMarketAuthorized, setIsMarketAuthorized] = useState<boolean | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authorizeError, setAuthorizeError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<string>('0');
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [previousBalance, setPreviousBalance] = useState<string | null>(null);
  const [coinImageUrl, setCoinImageUrl] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<{ displayName: string; avatarUrl: string } | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const handleUpdatePrice = async () => {
    if (!token || !newPrice) return;
    
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setPriceChangeError('El precio debe ser mayor a 0');
      return;
    }

    if (priceNum === parseFloat(token.price)) {
      setPriceChangeError('El nuevo precio debe ser diferente al actual');
      return;
    }

    try {
      setIsUpdating(true);
      setPriceChangeError(null);

      console.log('💰 Actualizando precio del token...');
      console.log('   Token:', token.address);
      console.log('   Precio actual:', token.price, 'DOT');
      console.log('   Nuevo precio:', newPrice, 'DOT');

      const tokenContract = await creatorTokenService.getContractWithSigner(token.address);
      const priceInWei = ethers.parseEther(newPrice);
      
      const tx = await tokenContract.updatePrice(priceInWei);
      console.log('   ✅ Transacción enviada, hash:', tx.hash);
      console.log('   ⏳ Esperando confirmación...');
      await tx.wait();
      console.log('   ✅ Precio actualizado exitosamente');

      setUpdateSuccess(true);
      setNewPrice('');
      setIsChangingPrice(false);
      
      setTimeout(() => {
        setUpdateSuccess(false);
        refetch();
      }, 2000);
    } catch (err: any) {
      console.error('Error actualizando precio:', err);
      setPriceChangeError(err.message || err.reason || 'Error al actualizar precio');
    } finally {
      setIsUpdating(false);
    }
  };

  // Cargar imagen de la moneda y perfil del creador desde Supabase
  useEffect(() => {
    const loadTokenMetadata = async () => {
      if (!token?.address || !address) {
        setLoadingMetadata(false);
        return;
      }
      
      try {
        setLoadingMetadata(true);
        
        // Obtener imagen de la moneda desde Supabase
        const tokenData = await apiService.getToken(token.address);
        if (tokenData?.coin_image_url) {
          setCoinImageUrl(tokenData.coin_image_url);
        } else {
          setCoinImageUrl(null);
        }
        
        // Obtener perfil del creador
        const creatorData = await apiService.getUser(address);
        if (creatorData) {
          setCreatorProfile({
            displayName: creatorData.display_name || creatorData.username || `${address.slice(0, 6)}...${address.slice(-4)}`,
            avatarUrl: creatorData.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
          });
        } else {
          setCreatorProfile({
            displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
          });
        }
      } catch (err) {
        console.error('Error cargando metadata del token:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };
    
    loadTokenMetadata();
  }, [token?.address, address]);

  // Verificar autorizaciones cuando se carga el token
  useEffect(() => {
    const checkAuthorizations = async () => {
      if (!token?.address) return;
      
      try {
        const tokenContract = creatorTokenService.getContract(token.address);
        const exchangeAuth = await tokenContract.authorizedMinters(CONTRACT_ADDRESSES.TokenExchange);
        const marketAuth = await tokenContract.authorizedMinters(CONTRACT_ADDRESSES.PredictionMarket);
        
        setIsExchangeAuthorized(exchangeAuth);
        setIsMarketAuthorized(marketAuth);
      } catch (err) {
        console.error('Error verificando autorizaciones:', err);
      }
    };
    
    checkAuthorizations();
  }, [token?.address]);

  // Función para cargar ganancias del creador desde el contrato (memoizada)
  const loadEarnings = useCallback(async () => {
    if (!address || !hasToken) {
      console.log('⚠️ No se pueden cargar ganancias: address o hasToken faltantes', { address, hasToken });
      setEarnings('0');
      return;
    }

    try {
      console.log('📊 Cargando ganancias del creador desde el contrato...', { address });
      setLoadingEarnings(true);
      
      // Leer las ganancias acumuladas directamente del contrato TokenExchange
      // El contrato ya tiene las ganancias sumadas en creatorEarnings[address]
      const earningsEth = await tokenExchangeService.getCreatorEarnings(address);

      console.log('💰 Ganancias obtenidas del contrato:', earningsEth, 'DOT');
      
      // El contrato ya tiene las ganancias acumuladas, solo las leemos
      setEarnings(earningsEth);

      console.log('✅ Ganancias actualizadas en estado:', earningsEth, 'DOT');
    } catch (err) {
      console.error('❌ Error cargando ganancias del creador:', err);
      setEarnings('0');
    } finally {
      setLoadingEarnings(false);
    }
  }, [address, hasToken]);

  // Cargar ganancias inicialmente cuando hay token y dirección
  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  // Escuchar cambios en el balance para actualizar ganancias automáticamente
  useEffect(() => {
    if (!address || !hasToken || !isConnected || !balance) {
      return;
    }

    // Si es la primera vez que tenemos balance, guardarlo y cargar ganancias
    if (previousBalance === null) {
      console.log('🔄 Primera carga de balance:', balance, 'DOT');
      setPreviousBalance(balance);
      loadEarnings();
      return;
    }

    // Si el balance cambió, significa que recibimos ETH (posiblemente ganancias)
    if (previousBalance !== balance) {
      const oldBalance = parseFloat(previousBalance);
      const newBalance = parseFloat(balance);
      const difference = newBalance - oldBalance;

      console.log('💸 Balance cambió detectado!');
      console.log('   Balance anterior:', previousBalance, 'DOT');
      console.log('   Balance nuevo:', balance, 'DOT');
      console.log('   Diferencia:', difference > 0 ? `+${difference.toFixed(6)}` : difference.toFixed(6), 'DOT');

      if (difference > 0) {
        console.log('✅ Balance aumentó - posiblemente recibiste ganancias del contrato');
        console.log('🔄 Refrescando ganancias desde el contrato TokenExchange...');
        console.log('   (Las ganancias ya están acumuladas en creatorEarnings[address])');
        
        // Refrescar las ganancias desde el contrato
        // IMPORTANTE: No sumamos aquí, el contrato ya tiene las ganancias acumuladas
        loadEarnings();
      }

      // Actualizar el balance anterior
      setPreviousBalance(balance);
    }
  }, [balance, address, hasToken, isConnected, previousBalance, loadEarnings]);

  const handleAuthorizeContracts = async () => {
    if (!token?.address) return;
    
    try {
      setIsAuthorizing(true);
      setAuthorizeError(null);
      
      console.log('🔐 Autorizando contratos...');
      const tokenContract = await creatorTokenService.getContractWithSigner(token.address);
      
      // Autorizar TokenExchange
      if (!isExchangeAuthorized) {
        console.log('   Autorizando TokenExchange...');
        const exchangeTx = await tokenContract.setAuthorizedMinter(CONTRACT_ADDRESSES.TokenExchange, true);
        await exchangeTx.wait();
        console.log('   ✅ TokenExchange autorizado');
        setIsExchangeAuthorized(true);
      }
      
      // Autorizar PredictionMarket
      if (!isMarketAuthorized) {
        console.log('   Autorizando PredictionMarket...');
        const marketTx = await tokenContract.setAuthorizedMinter(CONTRACT_ADDRESSES.PredictionMarket, true);
        await marketTx.wait();
        console.log('   ✅ PredictionMarket autorizado');
        setIsMarketAuthorized(true);
      }
      
      console.log('✅ Todos los contratos autorizados');
    } catch (err: any) {
      console.error('Error autorizando contratos:', err);
      setAuthorizeError(err.message || err.reason || 'Error al autorizar contratos');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Ahora';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Wallet className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Wallet no conectada</h2>
          <p className="text-slate-400">Conecta tu wallet para ver tu token de creador</p>
        </div>
      </div>
    );
  }

  if (loading || loadingMetadata) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">
            {loading ? 'Cargando tu token desde blockchain...' : 'Cargando información del token...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Error</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!hasToken || !token) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Coins className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">No tienes un token de creador</h2>
          <p className="text-slate-400 mb-6 text-center max-w-md">
            Crea tu token de creador para empezar a crear predicciones y ganar comisiones
          </p>
          <button
            onClick={() => {/* Navegar a crear token */}}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Coins className="w-5 h-5" />
            Crear Token de Creador
          </button>
        </div>
      </div>
    );
  }

  const priceUpdateIntervalDays = Math.floor(token.priceUpdateInterval / 86400);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Mi Token de Creador</h1>
        <p className="text-slate-400">Gestiona y monitorea tu token</p>
      </div>

      {/* Success Message */}
      {updateSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <p className="text-green-400 font-medium">¡Precio actualizado exitosamente!</p>
        </div>
      )}

      {/* Token Info Card */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden">
            {coinImageUrl ? (
              <img 
                src={coinImageUrl} 
                alt={token.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Coins className="w-8 h-8 text-emerald-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{token.name}</h2>
            <div className="flex items-center gap-2 text-slate-400">
              <span>{token.symbol}</span>
              <span>•</span>
              <span className="text-xs">
                {creatorProfile?.displayName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-500 text-sm">Precio Actual</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{token.price} DOT</p>
            <p className="text-slate-500 text-xs mt-1">por token</p>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-blue-400" />
              <span className="text-slate-500 text-sm">Supply Total</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {parseFloat(token.totalSupply).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-slate-500 text-xs mt-1">{token.symbol}</p>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-slate-500 text-sm">Última Act. Precio</span>
            </div>
            <p className="text-slate-100 font-medium">
              {new Date(token.lastPriceUpdate * 1000).toLocaleDateString('es-ES')}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Intervalo: {priceUpdateIntervalDays} días
            </p>
          </div>
        </div>
      </div>

      {/* Authorization Section */}
      {(isExchangeAuthorized === false || isMarketAuthorized === false) && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-yellow-400 mb-2">Autorización Requerida</h3>
              <p className="text-yellow-300/80 text-sm mb-4">
                Tu token necesita autorizar los contratos del sistema para que los usuarios puedan comprar tokens y apostar en tus predicciones.
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  {isExchangeAuthorized ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 text-sm">TokenExchange autorizado</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">TokenExchange no autorizado</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isMarketAuthorized ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 text-sm">PredictionMarket autorizado</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">PredictionMarket no autorizado</span>
                    </>
                  )}
                </div>
              </div>

              {authorizeError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{authorizeError}</p>
                </div>
              )}

              <button
                onClick={handleAuthorizeContracts}
                disabled={isAuthorizing}
                className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isAuthorizing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Autorizando...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5" />
                    Autorizar Contratos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Update Section */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Actualizar Precio</h3>
            <p className="text-slate-400 text-sm">
              Puedes cambiar el precio de tu token cada {priceUpdateIntervalDays} días
            </p>
          </div>
          
          {token.canUpdatePrice ? (
            <span className="px-3 py-1 rounded-lg text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Disponible
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg text-sm bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(token.timeUntilPriceUpdate)}
            </span>
          )}
        </div>

        {!token.canUpdatePrice && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-slate-100 text-sm">
              <p className="font-medium mb-1">Cambio de precio bloqueado</p>
              <p className="text-slate-100/90">
                Podrás actualizar el precio en {formatTime(token.timeUntilPriceUpdate)}
              </p>
            </div>
          </div>
        )}

        {priceChangeError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{priceChangeError}</p>
          </div>
        )}

        {isChangingPrice ? (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Nuevo Precio (DOT)</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={token.price}
                step="0.001"
                min="0.000001"
                disabled={!token.canUpdatePrice}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-slate-500 text-xs mt-1">Precio actual: {token.price} DOT</p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsChangingPrice(false);
                  setNewPrice('');
                  setPriceChangeError(null);
                }}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePrice}
                disabled={isUpdating || !newPrice || !token.canUpdatePrice}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Confirmar Cambio
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsChangingPrice(true)}
            disabled={!token.canUpdatePrice}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            {token.canUpdatePrice ? 'Cambiar Precio' : `Disponible en ${formatTime(token.timeUntilPriceUpdate)}`}
          </button>
        )}
      </div>

      {/* Token Info */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Información del Token</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Nombre</span>
            <span className="text-slate-100 font-medium">{token.name}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Símbolo</span>
            <span className="text-slate-100 font-medium">{token.symbol}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Dirección del Contrato</span>
            <span className="text-slate-100 font-mono text-sm">
              {token.address.slice(0, 10)}...{token.address.slice(-8)}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Precio Actual</span>
            <span className="text-emerald-400 font-bold">{token.price} DOT</span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Supply Total</span>
            <span className="text-slate-100 font-medium">
              {parseFloat(token.totalSupply).toLocaleString('es-ES', { maximumFractionDigits: 2 })} {token.symbol}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Última Actualización de Precio</span>
            <span className="text-slate-100">
              {new Date(token.lastPriceUpdate * 1000).toLocaleDateString('es-ES')}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-3">
            <span className="text-slate-400">Intervalo de Actualización</span>
            <span className="text-slate-100">{priceUpdateIntervalDays} días</span>
          </div>
        </div>
      </div>

      {/* Ganancias del Creador */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/20 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-100">Ganancias del Creador</h3>
            <p className="text-slate-400 text-sm">Total acumulado de ventas de tokens</p>
          </div>
        </div>

        {loadingEarnings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="ml-3 text-slate-400">Cargando ganancias...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-slate-400 text-sm">Ganancias Totales</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-400">
                  {parseFloat(earnings).toFixed(4)}
                </span>
                <span className="text-xl text-slate-300">DOT</span>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                Estas son las ganancias acumuladas cuando los usuarios compran tus tokens
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-400 text-sm">Total Pagado</span>
                </div>
                <p className="text-slate-100 text-lg font-medium">
                  {parseFloat(earnings) > 0 
                    ? `${(parseFloat(earnings) / 0.95).toFixed(4)} DOT`
                    : '0.0000 DOT'
                  }
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Total que los usuarios han pagado (incluye 5% fee)
                </p>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Estado</span>
                </div>
                <p className="text-slate-100 text-lg font-medium">
                  {parseFloat(earnings) > 0 ? 'Activo' : 'Sin ventas aún'}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {parseFloat(earnings) > 0 
                    ? 'Has recibido pagos por tus tokens'
                    : 'Las ganancias aparecerán cuando alguien compre tus tokens'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          Información Importante
        </h4>
        <ul className="text-slate-100 text-sm space-y-1">
          <li>• Los usuarios compran tus tokens para participar en tus predicciones</li>
          <li>• Ganas una comisión (fee) de cada predicción que creas</li>
          <li>• El precio solo puede cambiarse cada {priceUpdateIntervalDays} días</li>
          <li>• Los usuarios pueden canjear tokens por DOT usando el exchange</li>
        </ul>
      </div>
    </div>
  );
}
