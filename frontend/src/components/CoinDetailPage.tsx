import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Coins, Wallet, DollarSign, Loader2, AlertCircle, CheckCircle2, ArrowDownUp, UserPlus, UserMinus } from "lucide-react";
import React from "react";
import { useWallet } from '../hooks/useWallet';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { creatorTokenService, tokenExchangeService, factoryService } from '../lib/contractService';

interface CoinDetailPageProps {
  coinId: string; // Token address
  onBack?: () => void;
}

export function CoinDetailPage({ coinId, onBack }: CoinDetailPageProps) {
  const { address, balance, isConnected } = useWallet();
  const { subscribe, unsubscribe, isSubscribed } = useSubscriptions(address);
  
  // Token info
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [userBalance, setUserBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Buy/Sell states
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);
  
  // Subscription states
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Load token info
  useEffect(() => {
    const loadTokenInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🪙 Cargando información del token:', coinId);

        const info = await creatorTokenService.getTokenInfo(coinId);
        setTokenInfo(info);

        if (address) {
          const balance = await creatorTokenService.getBalance(coinId, address);
          setUserBalance(balance);
        }

        console.log('   ✅ Token cargado:', info.name);
      } catch (err: any) {
        console.error('Error cargando token:', err);
        setError(err.message || 'Error al cargar información del token');
      } finally {
        setLoading(false);
      }
    };

    loadTokenInfo();
  }, [coinId, address]);

  // Calculate estimated tokens
  useEffect(() => {
    const calculateEstimate = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setEstimatedTokens('0');
        return;
      }

      try {
        if (action === 'buy') {
          const result = await tokenExchangeService.calculateBuyAmount(coinId, amount);
          setEstimatedTokens(result.tokens);
        } else {
          const result = await tokenExchangeService.calculateSellAmount(coinId, amount);
          setEstimatedTokens(result.native);
        }
      } catch (err) {
        console.error('Error calculando estimación:', err);
        setEstimatedTokens('0');
      }
    };

    const timeoutId = setTimeout(calculateEstimate, 300);
    return () => clearTimeout(timeoutId);
  }, [amount, action, coinId]);

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setActionError('Ingresa una cantidad válida');
      return;
    }

    const ethBalance = parseFloat(balance || '0');
    if (parseFloat(amount) > ethBalance) {
      setActionError(`Balance insuficiente. Tienes ${ethBalance.toFixed(4)} ETH`);
      return;
    }

    try {
      setIsProcessing(true);
      setActionError(null);

      console.log('💰 Comprando tokens...');
      await tokenExchangeService.buyTokens(coinId, amount);

      setActionSuccess(true);
      setAmount('');
      
      setTimeout(() => {
        setActionSuccess(false);
        // Recargar balance
        if (address) {
          creatorTokenService.getBalance(coinId, address).then(setUserBalance);
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error comprando tokens:', err);
      setActionError(err.message || 'Error al comprar tokens');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setActionError('Ingresa una cantidad válida');
      return;
    }

    const tokenBalance = parseFloat(userBalance);
    if (parseFloat(amount) > tokenBalance) {
      setActionError(`Balance insuficiente. Tienes ${tokenBalance.toFixed(2)} ${tokenInfo?.symbol}`);
      return;
    }

    try {
      setIsProcessing(true);
      setActionError(null);

      console.log('💸 Vendiendo tokens...');
      
      // 1. Aprobar tokens al exchange
      console.log('   Aprobando tokens...');
      await creatorTokenService.approve(
        coinId,
        tokenExchangeService.getContract().target as string,
        amount
      );
      
      // 2. Vender tokens
      console.log('   Vendiendo tokens...');
      await tokenExchangeService.sellTokens(coinId, amount);

      setActionSuccess(true);
      setAmount('');
      
      setTimeout(() => {
        setActionSuccess(false);
        // Recargar balance
        if (address) {
          creatorTokenService.getBalance(coinId, address).then(setUserBalance);
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error vendiendo tokens:', err);
      setActionError(err.message || 'Error al vender tokens');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSubscription = async () => {
    if (!tokenInfo) return;
    
    try {
      setIsSubscribing(true);
      
      if (isSubscribed(tokenInfo.creator)) {
        await unsubscribe(tokenInfo.creator);
      } else {
        await subscribe(tokenInfo.creator);
      }
    } catch (err: any) {
      console.error('Error toggling subscription:', err);
      alert(err.message || 'Error al cambiar suscripción');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Cargando token...</p>
        </div>
      </div>
    );
  }

  if (error || !tokenInfo) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Error</h2>
          <p className="text-red-400 mb-6">{error || 'Token no encontrado'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
      </div>

      {/* Token Card */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Coins className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{tokenInfo.name}</h1>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span>{tokenInfo.symbol}</span>
                <span>•</span>
                <span>Creador: {tokenInfo.creator.slice(0, 6)}...{tokenInfo.creator.slice(-4)}</span>
              </div>
            </div>
          </div>
          
          {/* Botón Seguir/Dejar de seguir */}
          {isConnected && address?.toLowerCase() !== tokenInfo.creator.toLowerCase() && (
            <button
              onClick={handleToggleSubscription}
              disabled={isSubscribing}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isSubscribed(tokenInfo.creator)
                  ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ...
                </>
              ) : isSubscribed(tokenInfo.creator) ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  Siguiendo
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Seguir
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="text-slate-500 text-sm mb-1">Precio</div>
            <div className="text-2xl font-bold text-emerald-400">{tokenInfo.price} ETH</div>
            <div className="text-slate-500 text-xs">por token</div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="text-slate-500 text-sm mb-1">Tu Balance</div>
            <div className="text-2xl font-bold text-slate-100">
              {parseFloat(userBalance).toFixed(2)}
            </div>
            <div className="text-slate-500 text-xs">{tokenInfo.symbol}</div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="text-slate-500 text-sm mb-1">Valor Total</div>
            <div className="text-2xl font-bold text-purple-400">
              {(parseFloat(userBalance) * parseFloat(tokenInfo.price)).toFixed(4)}
            </div>
            <div className="text-slate-500 text-xs">ETH</div>
          </div>
        </div>
      </div>

      {/* Buy/Sell Section */}
      {isConnected ? (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Comprar / Vender</h2>

          {/* Action Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setAction('buy');
                setAmount('');
                setActionError(null);
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                action === 'buy'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Comprar
            </button>
            <button
              onClick={() => {
                setAction('sell');
                setAmount('');
                setActionError(null);
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                action === 'sell'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
              }`}
            >
              Vender
            </button>
          </div>

          {/* Input */}
          <div className="mb-4">
            <label className="block text-slate-300 text-sm mb-2">
              {action === 'buy' ? 'Cantidad a gastar (ETH)' : `Cantidad a vender (${tokenInfo.symbol})`}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step={action === 'buy' ? "0.01" : "0.1"}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-slate-500 text-xs mt-1">
              {action === 'buy' 
                ? `Balance: ${parseFloat(balance || '0').toFixed(4)} ETH`
                : `Balance: ${parseFloat(userBalance).toFixed(2)} ${tokenInfo.symbol}`
              }
            </p>
          </div>

          {/* Estimation */}
          {amount && parseFloat(amount) > 0 && (
            <div className="mb-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">
                  {action === 'buy' ? 'Recibirás aproximadamente:' : 'Recibirás aproximadamente:'}
                </span>
                <ArrowDownUp className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {parseFloat(estimatedTokens).toFixed(action === 'buy' ? 2 : 4)} {action === 'buy' ? tokenInfo.symbol : 'ETH'}
              </div>
              <div className="text-slate-500 text-xs mt-1">
                Fee de plataforma: 1%
              </div>
            </div>
          )}

          {/* Error */}
          {actionError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{actionError}</p>
            </div>
          )}

          {/* Success */}
          {actionSuccess && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-green-400 text-sm">
                {action === 'buy' ? '¡Compra exitosa!' : '¡Venta exitosa!'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={action === 'buy' ? handleBuy : handleSell}
            disabled={isProcessing || !amount || parseFloat(amount) <= 0}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              action === 'buy'
                ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700'
                : 'bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700'
            } text-white disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                {action === 'buy' ? (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Comprar {tokenInfo.symbol}
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Vender {tokenInfo.symbol}
                  </>
                )}
              </>
            )}
          </button>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="text-slate-400 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Precio del token:</span>
                <span className="text-slate-100">{tokenInfo.price} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Fee de plataforma:</span>
                <span className="text-slate-100">1%</span>
              </div>
              {action === 'buy' && (
                <div className="flex justify-between">
                  <span>Precio final con fee:</span>
                  <span className="text-slate-100">
                    {(parseFloat(tokenInfo.price) * 1.01).toFixed(6)} ETH
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
          <div className="text-center py-6">
            <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400">Conecta tu wallet para comprar o vender tokens</p>
          </div>
        </div>
      )}
    </div>
  );
}
