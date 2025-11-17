import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Coins, Wallet, DollarSign, Loader2, AlertCircle, CheckCircle2, ArrowDownUp } from "lucide-react";
import React from "react";
import { useWallet } from '../hooks/useWallet';
import { creatorTokenService, tokenExchangeService } from '../lib/contractService';
import { apiService } from '../lib/apiService';

interface CoinDetailPageProps {
  coinId: string; // Token address
  onBack?: () => void;
}

export function CoinDetailPage({ coinId, onBack }: CoinDetailPageProps) {
  const { address, balance, isConnected, refreshBalance } = useWallet();
  
  // Token info
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [userBalance, setUserBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Metadata from Supabase
  const [coinImageUrl, setCoinImageUrl] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<{ displayName: string; avatarUrl: string } | null>(null);
  
  // Buy/Sell states
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(false);

  // Load token info
  useEffect(() => {
    const loadTokenInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🪙 Loading token information:', coinId);

        const info = await creatorTokenService.getTokenInfo(coinId);
        setTokenInfo(info);

        if (address) {
          const balance = await creatorTokenService.getBalance(coinId, address);
          setUserBalance(balance);
        }

        console.log('   ✅ Token loaded:', info.name);
      } catch (err: any) {
        console.error('Error loading token:', err);
        setError(err.message || 'Error loading token information');
      } finally {
        setLoading(false);
      }
    };

    loadTokenInfo();
  }, [coinId, address]);

  // Load coin image and creator profile from Supabase
  useEffect(() => {
    const loadTokenMetadata = async () => {
      if (!tokenInfo?.creator || !coinId) {
        setLoadingMetadata(false);
        return;
      }
      
      try {
        setLoadingMetadata(true);
        
        // Get coin image from Supabase
        const tokenData = await apiService.getToken(coinId);
        if (tokenData?.coin_image_url) {
          setCoinImageUrl(tokenData.coin_image_url);
        } else {
          setCoinImageUrl(null);
        }
        
        // Get creator profile
        const creatorData = await apiService.getUser(tokenInfo.creator);
        if (creatorData) {
          setCreatorProfile({
            displayName: creatorData.display_name || creatorData.username || `${tokenInfo.creator.slice(0, 6)}...${tokenInfo.creator.slice(-4)}`,
            avatarUrl: creatorData.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tokenInfo.creator}`,
          });
        } else {
          setCreatorProfile({
            displayName: `${tokenInfo.creator.slice(0, 6)}...${tokenInfo.creator.slice(-4)}`,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${tokenInfo.creator}`,
          });
        }
      } catch (err) {
        console.error('Error loading token metadata:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };
    
    loadTokenMetadata();
  }, [tokenInfo?.creator, coinId]);

  // Calculate estimated tokens (frontend calculation using token price)
  useEffect(() => {
    const calculateEstimate = () => {
      if (!amount || parseFloat(amount) <= 0 || !tokenInfo) {
        setEstimatedTokens('0');
        return;
      }

      try {
        if (action === 'buy') {
          // Frontend calculation: 1% fee, then divide by token price
          const ethAmount = parseFloat(amount);
          const fee = ethAmount * 0.01; // 1% fee
          const amountAfterFee = ethAmount - fee;
          const tokenPrice = parseFloat(tokenInfo.price);
          
          if (tokenPrice > 0) {
            const tokensToReceive = amountAfterFee / tokenPrice;
            setEstimatedTokens(tokensToReceive.toFixed(4));
          } else {
            setEstimatedTokens('0');
          }
        } else {
          // For selling: tokens * price - fee
          const tokenAmount = parseFloat(amount);
          const tokenPrice = parseFloat(tokenInfo.price);
          const nativeValue = tokenAmount * tokenPrice;
          const fee = nativeValue * 0.01; // 1% fee
          const ethToReceive = nativeValue - fee;
          
          setEstimatedTokens(ethToReceive.toFixed(6));
        }
      } catch (err) {
        console.error('Error calculating estimate:', err);
        setEstimatedTokens('0');
      }
    };

    const timeoutId = setTimeout(calculateEstimate, 300);
    return () => clearTimeout(timeoutId);
  }, [amount, action, coinId, tokenInfo]);

  const handleBuy = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setActionError('Enter a valid amount');
      return;
    }

    const ethBalance = parseFloat(balance || '0');
    if (parseFloat(amount) > ethBalance) {
      setActionError(`Insufficient balance. You have ${ethBalance.toFixed(4)} DOT`);
      return;
    }

    try {
      setIsProcessing(true);
      setActionError(null);

      console.log('💰 Buying tokens...');
      await tokenExchangeService.buyTokens(coinId, amount);

      setActionSuccess(true);
      setAmount('');
      
      setTimeout(() => {
        setActionSuccess(false);
        // Reload balance
        if (address) {
          creatorTokenService.getBalance(coinId, address).then(setUserBalance);
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error buying tokens:', err);
      setActionError(err.message || 'Error buying tokens');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setActionError('Enter a valid amount');
      return;
    }

    const tokenBalance = parseFloat(userBalance);
    if (parseFloat(amount) > tokenBalance) {
      setActionError(`Insufficient balance. You have ${tokenBalance.toFixed(2)} ${tokenInfo?.symbol}`);
      return;
    }

    try {
      setIsProcessing(true);
      setActionError(null);

      console.log('💸 Selling tokens...');
      
      // 1. Approve tokens to exchange
      console.log('   Approving tokens...');
      await creatorTokenService.approve(
        coinId,
        tokenExchangeService.getContract().target as string,
        amount
      );
      
      // 2. Sell tokens
      console.log('   Selling tokens...');
      const sellReceipt = await tokenExchangeService.sellTokens(coinId, amount);
      console.log('   ✅ Sell transaction confirmed:', sellReceipt.hash);

      setActionSuccess(true);
      setAmount('');
      
      // Wait a bit for blockchain to update, then reload balance
      setTimeout(async () => {
        if (address) {
          try {
            console.log('   🔄 Reloading token balance after sell...');
            const newBalance = await creatorTokenService.getBalance(coinId, address);
            console.log('   ✅ New token balance:', newBalance);
            setUserBalance(newBalance);
            
            // Also refresh DOT/ETH balance since user received ETH from selling
            console.log('   💰 Refreshing DOT/ETH balance after sell...');
            await refreshBalance();
          } catch (err) {
            console.error('Error reloading balance after sell:', err);
          }
        }
      }, 1000); // Wait 1 second for blockchain state to update
      
      setTimeout(() => {
        setActionSuccess(false);
        // Final balance check after more time
        if (address) {
          creatorTokenService.getBalance(coinId, address).then(balance => {
            console.log('   🔍 Final token balance check:', balance);
            setUserBalance(balance);
          });
          
          // Final DOT/ETH balance refresh
          refreshBalance();
        }
      }, 3000);
    } catch (err: any) {
      console.error('Error selling tokens:', err);
      setActionError(err.message || 'Error selling tokens');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || loadingMetadata) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">
            {loading ? 'Loading token information from blockchain...' : 'Loading creator information...'}
          </p>
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
          <p className="text-red-400 mb-6">{error || 'Token not found'}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Back
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
          Back
        </button>
      </div>

      {/* Token Card */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden">
            {coinImageUrl ? (
              <img 
                src={coinImageUrl} 
                alt={tokenInfo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Coins className="w-8 h-8 text-emerald-400" />
            )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">{tokenInfo.name}</h1>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <span>{tokenInfo.symbol}</span>
                <span>•</span>
              <span>
                {creatorProfile?.displayName || `${tokenInfo.creator.slice(0, 6)}...${tokenInfo.creator.slice(-4)}`}
              </span>
              </div>
            </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="text-slate-500 text-sm mb-1">Price</div>
            <div className="text-2xl font-bold text-emerald-400">{tokenInfo.price} DOT</div>
            <div className="text-slate-500 text-xs">per token</div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="text-slate-500 text-sm mb-1">Your Balance</div>
            <div className="text-2xl font-bold text-slate-100">
              {parseFloat(userBalance).toFixed(2)}
            </div>
            <div className="text-slate-500 text-xs">{tokenInfo.symbol}</div>
          </div>

          <div className="bg-slate-800/30 rounded-lg p-4">
            <div className="text-slate-500 text-sm mb-1">Total Value</div>
            <div className="text-2xl font-bold text-purple-400">
              {(parseFloat(userBalance) * parseFloat(tokenInfo.price)).toFixed(4)}
            </div>
            <div className="text-slate-500 text-xs">DOT</div>
          </div>
        </div>
      </div>

      {/* Buy/Sell Section */}
      {isConnected ? (
        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Buy / Sell</h2>

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
              Buy
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
              Sell
            </button>
          </div>

          {/* Input */}
          <div className="mb-4">
            <label className="block text-slate-300 text-sm mb-2">
              {action === 'buy' ? 'Cantidad a gastar (DOT)' : `Cantidad a vender (${tokenInfo.symbol})`}
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
                ? `Balance: ${parseFloat(balance || '0').toFixed(4)} DOT`
                : `Balance: ${parseFloat(userBalance).toFixed(2)} ${tokenInfo.symbol}`
              }
            </p>
          </div>

          {/* Estimation */}
          {amount && parseFloat(amount) > 0 && (
            <div className="mb-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">
                  {action === 'buy' ? 'You will receive approximately:' : 'You will receive approximately:'}
                </span>
                <ArrowDownUp className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {parseFloat(estimatedTokens).toFixed(action === 'buy' ? 2 : 4)} {action === 'buy' ? tokenInfo.symbol : 'DOT'}
              </div>
              <div className="text-slate-500 text-xs mt-1">
                Platform fee: 1%
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
                {action === 'buy' ? 'Purchase successful!' : 'Sale successful!'}
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
                Processing...
              </>
            ) : (
              <>
                {action === 'buy' ? (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Buy {tokenInfo.symbol}
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Sell {tokenInfo.symbol}
                  </>
                )}
              </>
            )}
          </button>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="text-slate-400 text-sm space-y-2">
              <div className="flex justify-between">
                <span>Token price:</span>
                <span className="text-slate-100">{tokenInfo.price} DOT</span>
              </div>
              <div className="flex justify-between">
                <span>Platform fee:</span>
                <span className="text-slate-100">1%</span>
              </div>
              {action === 'buy' && (
                <div className="flex justify-between">
                  <span>Final price with fee:</span>
                  <span className="text-slate-100">
                    {(parseFloat(tokenInfo.price) * 1.01).toFixed(6)} DOT
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
            <p className="text-slate-400">Connect your wallet to buy or sell tokens</p>
          </div>
        </div>
      )}
    </div>
  );
}
