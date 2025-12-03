import { useState, useEffect, useCallback } from 'react';
import { Coins, TrendingUp, Calendar, DollarSign, AlertCircle, Loader2, Wallet, Clock, Info, CheckCircle2 } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useMyCreatorToken } from '../hooks/useMyCreatorToken';
import { creatorTokenService, tokenExchangeService } from '../lib/contractService';
import { CONTRACT_ADDRESSES } from '../lib/contracts';
import { ethers } from 'ethers';
import { apiService } from '../lib/apiService';

interface MyCoinPageProps {
  onCreateToken?: () => void;
}

export function MyCoinPage({ onCreateToken }: MyCoinPageProps) {
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
      setPriceChangeError('Price must be greater than 0');
      return;
    }

    if (priceNum === parseFloat(token.price)) {
      setPriceChangeError('New price must be different from current price');
      return;
    }

    try {
      setIsUpdating(true);
      setPriceChangeError(null);

      console.log('💰 Updating token price...');
      console.log('   Token:', token.address);
      console.log('   Current price:', token.price, 'DOT');
      console.log('   New price:', newPrice, 'DOT');

      const tokenContract = await creatorTokenService.getContractWithSigner(token.address);
      const priceInWei = ethers.parseEther(newPrice);

      const tx = await tokenContract.updatePrice(priceInWei);
      console.log('   ✅ Transaction sent, hash:', tx.hash);
      console.log('   ⏳ Waiting for confirmation...');
      await tx.wait();
      console.log('   ✅ Price updated successfully');

      setUpdateSuccess(true);
      setNewPrice('');
      setIsChangingPrice(false);

      setTimeout(() => {
        setUpdateSuccess(false);
        refetch();
      }, 2000);
    } catch (err: any) {
      console.error('Error updating price:', err);
      setPriceChangeError(err.message || err.reason || 'Error updating price');
    } finally {
      setIsUpdating(false);
    }
  };

  // Load coin image and creator profile from Supabase
  useEffect(() => {
    const loadTokenMetadata = async () => {
      if (!token?.address || !address) {
        setLoadingMetadata(false);
        return;
      }

      try {
        setLoadingMetadata(true);

        // Get coin image from Supabase
        const tokenData = await apiService.getToken(token.address);
        if (tokenData?.coin_image_url) {
          setCoinImageUrl(tokenData.coin_image_url);
        } else {
          setCoinImageUrl(null);
        }

        // Get creator profile
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

  // Function to load creator earnings from contract (memoized)
  const loadEarnings = useCallback(async () => {
    if (!address || !hasToken) {
      console.log('⚠️ Cannot load earnings: missing address or hasToken', { address, hasToken });
      setEarnings('0');
      return;
    }

    try {
      console.log('📊 Loading creator earnings from contract...', { address });
      setLoadingEarnings(true);

      // Read accumulated earnings directly from TokenExchange contract
      // The contract already has earnings summed in creatorEarnings[address]
      const earningsEth = await tokenExchangeService.getCreatorEarnings(address);

      console.log('💰 Earnings obtained from contract:', earningsEth, 'DOT');

      // The contract already has accumulated earnings, we just read them
      setEarnings(earningsEth);

      console.log('✅ Earnings updated in state:', earningsEth, 'DOT');
    } catch (err) {
      console.error('❌ Error loading creator earnings:', err);
      setEarnings('0');
    } finally {
      setLoadingEarnings(false);
    }
  }, [address, hasToken]);

  // Load initial earnings when there is token and address
  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  // Listen for balance changes to automatically update earnings
  useEffect(() => {
    if (!address || !hasToken || !isConnected || !balance) {
      return;
    }

    // If it's the first time we have balance, save it and load earnings
    if (previousBalance === null) {
      console.log('🔄 Primera carga de balance:', balance, 'DOT');
      setPreviousBalance(balance);
      loadEarnings();
      return;
    }

    // If balance changed, it means we received ETH (possibly earnings)
    if (previousBalance !== balance) {
      const oldBalance = parseFloat(previousBalance);
      const newBalance = parseFloat(balance);
      const difference = newBalance - oldBalance;

      console.log('💸 Balance change detected!');
      console.log('   Balance anterior:', previousBalance, 'DOT');
      console.log('   Balance nuevo:', balance, 'DOT');
      console.log('   Diferencia:', difference > 0 ? `+${difference.toFixed(6)}` : difference.toFixed(6), 'DOT');

      if (difference > 0) {
        console.log('✅ Balance increased - possibly received earnings from contract');
        console.log('🔄 Refreshing earnings from TokenExchange contract...');
        console.log('   (Earnings are already accumulated in creatorEarnings[address])');

        // Refresh earnings from contract
        // IMPORTANT: We don't sum here, the contract already has accumulated earnings
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

      console.log('🔐 Authorizing contracts...');
      const tokenContract = await creatorTokenService.getContractWithSigner(token.address);

      // Authorize TokenExchange
      if (!isExchangeAuthorized) {
        console.log('   Authorizing TokenExchange...');
        const exchangeTx = await tokenContract.setAuthorizedMinter(CONTRACT_ADDRESSES.TokenExchange, true);
        await exchangeTx.wait();
        console.log('   ✅ TokenExchange authorized');
        setIsExchangeAuthorized(true);
      }

      // Authorize PredictionMarket
      if (!isMarketAuthorized) {
        console.log('   Authorizing PredictionMarket...');
        const marketTx = await tokenContract.setAuthorizedMinter(CONTRACT_ADDRESSES.PredictionMarket, true);
        await marketTx.wait();
        console.log('   ✅ PredictionMarket authorized');
        setIsMarketAuthorized(true);
      }

      console.log('✅ All contracts authorized');
    } catch (err: any) {
      console.error('Error authorizing contracts:', err);
      setAuthorizeError(err.message || err.reason || 'Error authorizing contracts');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Now';

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
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Wallet not connected</h2>
          <p className="text-slate-400">Connect your wallet to view your creator token</p>
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
            {loading ? 'Loading your token from blockchain...' : 'Loading token information...'}
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
          <h2 className="text-2xl font-bold text-slate-100 mb-2">You don't have a creator token</h2>
          <p className="text-slate-400 mb-6 text-center max-w-md">
            Create your creator token to start creating predictions and earning commissions
          </p>
          <button
            onClick={() => onCreateToken && onCreateToken()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Coins className="w-5 h-5" />
            Create Creator Token
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
        <h1 className="text-3xl font-bold text-slate-100 mb-2">My Creator Token</h1>
        <p className="text-slate-400">Manage and monitor your token</p>
      </div>

      {/* Success Message */}
      {updateSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <p className="text-green-400 font-medium">Price updated successfully!</p>
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
              <span className="text-slate-500 text-sm">Current Price</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{token.price} DOT</p>
            <p className="text-slate-500 text-xs mt-1">per token</p>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-blue-400" />
              <span className="text-slate-500 text-sm">Total Supply</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {parseFloat(token.totalSupply).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-slate-500 text-xs mt-1">{token.symbol}</p>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-slate-500 text-sm">Last Price Update</span>
            </div>
            <p className="text-slate-100 font-medium">
              {new Date(token.lastPriceUpdate * 1000).toLocaleDateString('en-US')}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Interval: {priceUpdateIntervalDays} days
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
              <h3 className="text-xl font-semibold text-yellow-400 mb-2">Authorization Required</h3>
              <p className="text-yellow-300/80 text-sm mb-4">
                Your token needs to authorize the system contracts so users can purchase tokens and bet on your predictions.
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
                    Authorizing...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5" />
                    Authorize Contracts
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
            <h3 className="text-xl font-semibold text-slate-100 mb-2">Update Price</h3>
            <p className="text-slate-400 text-sm">
              You can change your token price every {priceUpdateIntervalDays} days
            </p>
          </div>

          {token.canUpdatePrice ? (
            <span className="px-3 py-1 rounded-lg text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Available
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
              <p className="font-medium mb-1">Price change locked</p>
              <p className="text-slate-100/90">
                You can update the price in {formatTime(token.timeUntilPriceUpdate)}
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
              <label className="block text-slate-300 text-sm mb-2">New Price (DOT)</label>
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
              <p className="text-slate-500 text-xs mt-1">Current price: {token.price} DOT</p>
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
                Cancel
              </button>
              <button
                onClick={handleUpdatePrice}
                disabled={isUpdating || !newPrice || !token.canUpdatePrice}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Confirm Change
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
            {token.canUpdatePrice ? 'Change Price' : `Available in ${formatTime(token.timeUntilPriceUpdate)}`}
          </button>
        )}
      </div>

      {/* Token Info */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Token Information</h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Name</span>
            <span className="text-slate-100 font-medium">{token.name}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Symbol</span>
            <span className="text-slate-100 font-medium">{token.symbol}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Contract Address</span>
            <span className="text-slate-100 font-mono text-sm">
              {token.address.slice(0, 10)}...{token.address.slice(-8)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Current Price</span>
            <span className="text-emerald-400 font-bold">{token.price} DOT</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Total Supply</span>
            <span className="text-slate-100 font-medium">
              {parseFloat(token.totalSupply).toLocaleString('en-US', { maximumFractionDigits: 2 })} {token.symbol}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-slate-800">
            <span className="text-slate-400">Last Price Update</span>
            <span className="text-slate-100">
              {new Date(token.lastPriceUpdate * 1000).toLocaleDateString('en-US')}
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-slate-400">Update Interval</span>
            <span className="text-slate-100">{priceUpdateIntervalDays} days</span>
          </div>
        </div>
      </div>

      {/* Creator Earnings */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border border-emerald-500/20 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-100">Creator Earnings</h3>
            <p className="text-slate-400 text-sm">Total accumulated from token sales</p>
          </div>
        </div>

        {loadingEarnings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="ml-3 text-slate-400">Loading earnings...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-slate-400 text-sm">Total Earnings</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-400">
                  {parseFloat(earnings).toFixed(4)}
                </span>
                <span className="text-xl text-slate-300">DOT</span>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                These are the accumulated earnings when users purchase your tokens
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-400 text-sm">Total Paid</span>
                </div>
                <p className="text-slate-100 text-lg font-medium">
                  {parseFloat(earnings) > 0
                    ? `${(parseFloat(earnings) / 0.95).toFixed(4)} DOT`
                    : '0.0000 DOT'
                  }
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Total paid by users (includes 5% fee)
                </p>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400 text-sm">Status</span>
                </div>
                <p className="text-slate-100 text-lg font-medium">
                  {parseFloat(earnings) > 0 ? 'Active' : 'No sales yet'}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {parseFloat(earnings) > 0
                    ? 'You have received payments for your tokens'
                    : 'Earnings will appear when someone purchases your tokens'
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
          Important Information
        </h4>
        <ul className="text-slate-100 text-sm space-y-1">
          <li>• Users purchase your tokens to participate in your predictions</li>
          <li>• You earn a commission (fee) from each prediction you create</li>
          <li>• Price can only be changed every {priceUpdateIntervalDays} days</li>
          <li>• Users can redeem tokens for DOT using the exchange</li>
        </ul>
      </div>
    </div>
  );
}
