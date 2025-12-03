import { useState } from 'react';
import { ArrowLeft, Calendar, Users, TrendingUp, Loader2, AlertCircle, CheckCircle2, Clock, Coins, UserPlus, UserMinus } from 'lucide-react';
import React from 'react';
import { ethers } from 'ethers';
import { usePredictionDetail } from '../hooks/usePredictionDetail';
import { useWallet } from '../hooks/useWallet';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { predictionMarketService, creatorTokenService } from '../lib/contractService';

interface PredictionDetailPageProps {
  predictionId: string;
  onBack?: () => void;
  onBuyTokens?: (tokenAddress: string) => void;
}

const STATUS_NAMES = ['Active', 'Closed', 'Cooldown', 'Under Review', 'Confirmed', 'Disputed', 'Cancelled'];
const STATUS_COLORS = ['emerald', 'slate', 'yellow', 'orange', 'green', 'red', 'gray'];

export function PredictionDetailPage({ predictionId, onBack, onBuyTokens }: PredictionDetailPageProps) {
  const { address, isConnected } = useWallet();
  const { prediction, loading, error, refetch } = usePredictionDetail(predictionId, address);
  const { subscribe, unsubscribe, isSubscribed } = useSubscriptions(address);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [betSuccess, setBetSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState<string>('0');

  // States for claiming winnings
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimableAmount, setClaimableAmount] = useState<string | null>(null);
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);

  // States for reporting fraud
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  // States for resolving prediction (creator)
  const [isResolving, setIsResolving] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeSuccess, setCloseSuccess] = useState(false);

  // Cooldown counter
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Subscription states
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Load user balance when selecting an option
  React.useEffect(() => {
    if (prediction && address && isConnected) {
      creatorTokenService
        .getBalance(prediction.creatorToken, address)
        .then((balance) => setUserBalance(balance))
        .catch((err) => console.error('Error loading balance:', err));
    }
  }, [prediction, address, isConnected]);

  // Cooldown counter (updates every second)
  React.useEffect(() => {
    if (!prediction || prediction.status !== 2 || prediction.cooldownEndsAt === 0) {
      setCooldownRemaining(0);
      return;
    }

    const updateCooldown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, prediction.cooldownEndsAt - now);
      setCooldownRemaining(remaining);
    };

    updateCooldown(); // Update immediately
    const interval = setInterval(updateCooldown, 1000); // Update every second

    return () => clearInterval(interval);
  }, [prediction]);

  // Auto-confirm if cooldown ended
  React.useEffect(() => {
    const autoConfirm = async () => {
      if (!prediction || prediction.status !== 2) return; // Only if in Cooldown

      const now = Math.floor(Date.now() / 1000);
      const cooldownEnded = prediction.cooldownEndsAt > 0 && now >= prediction.cooldownEndsAt;

      if (cooldownEnded) {
        console.log('⏰ Cooldown ended, confirming automatically...');
        try {
          await predictionMarketService.autoConfirmOutcome(prediction.id);
          // Refresh after confirming
          setTimeout(() => {
            refetch();
          }, 2000);
        } catch (err: any) {
          // If already confirmed or other error, do nothing
          console.log('ℹ️  Could not confirm automatically:', err.message);
        }
      }
    };

    // Only check if cooldown already ended
    if (cooldownRemaining === 0 && prediction?.status === 2) {
      autoConfirm();
    }
  }, [prediction, cooldownRemaining, refetch]);

  // Calculate how much user can claim if they won
  React.useEffect(() => {
    const calculateReward = async () => {
      if (!prediction || !address || prediction.status !== 4) {
        setClaimableAmount(null);
        return;
      }

      // Check if user has unclaimed winning bets
      const hasWinningBets = prediction.userBets.some(
        bet => bet.optionIndex === prediction.winningOption && !bet.claimed
      );

      if (!hasWinningBets) {
        setClaimableAmount(null);
        return;
      }

      try {
        setIsCalculatingReward(true);
        const result = await predictionMarketService.calculateClaimableReward(prediction.id, address);
        if (result.hasWinningBets) {
          setClaimableAmount(result.claimable);
        } else {
          setClaimableAmount(null);
        }
      } catch (err) {
        console.error('Error calculating reward:', err);
        setClaimableAmount(null);
      } finally {
        setIsCalculatingReward(false);
      }
    };

    calculateReward();
  }, [prediction, address]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCooldownTime = (seconds: number) => {
    if (seconds <= 0) return '0m 0s';

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}m ${secs}s`;
  };

  const getTimeRemaining = (closesAt: number) => {
    // If closesAt is a very large value (type(uint256).max), it's an indefinite prediction
    const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const closesAtBigInt = BigInt(closesAt);

    // If it's more than a year in the future (very unlikely), it's probably indefinite
    if (closesAtBigInt > BigInt(10) ** BigInt(15)) {
      return 'No time limit';
    }

    const now = Date.now() / 1000;
    const remaining = closesAt - now;

    if (remaining <= 0) return 'Closed';

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(remaining / 60)}min`;
  };

  const handlePlaceBet = async () => {
    if (!prediction || selectedOption === null || !betAmount) {
      setBetError('Please select an option and amount');
      return;
    }

    if (!isConnected || !address) {
      setBetError('Please connect your wallet');
      return;
    }

    if (parseFloat(betAmount) <= 0) {
      setBetError('Amount must be greater than 0');
      return;
    }

    if (parseFloat(betAmount) > parseFloat(userBalance)) {
      setBetError(`Insufficient balance. You have ${parseFloat(userBalance).toFixed(2)} ${prediction.creatorTokenSymbol}`);
      return;
    }

    // Verificar balance de ETH antes de continuar
    if (!address) {
      setBetError('No wallet address connected');
      return;
    }

    try {
      setIsPlacingBet(true);
      setBetError(null);
      setBetSuccess(false);

      // Check ETH balance (needed to pay for gas)
      const walletProvider = getWalletProvider();
      if (!walletProvider) throw new Error('No wallet provider found');

      const provider = new ethers.BrowserProvider(walletProvider);
      const ethBalance = await provider.getBalance(address);
      const ethBalanceFormatted = parseFloat(ethers.formatEther(ethBalance));

      console.log('💰 Balance ETH:', ethBalanceFormatted, 'ETH');

      if (ethBalanceFormatted < 0.001) {
        throw new Error(`Insufficient ETH for gas. You have ${ethBalanceFormatted.toFixed(6)} ETH. You need at least 0.001 ETH. Verify that SubWallet is connected to the local network (ChainID: 31337) and you can see your ETH balance.`);
      }

      const marketAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

      // 1. Check if already has sufficient approval
      console.log('📝 Step 1: Verifying token approval...');
      console.log('   Token:', prediction.creatorToken);
      console.log('   Spender:', marketAddress);
      console.log('   Amount needed:', betAmount);

      if (!address) {
        throw new Error('No wallet address connected');
      }

      const currentAllowance = await creatorTokenService.getAllowance(
        prediction.creatorToken,
        address,
        marketAddress
      );

      console.log('   Current approval:', currentAllowance);

      // Check if approval is unlimited or very large (MaxUint256 converts to a very large number)
      const allowanceNum = parseFloat(currentAllowance);
      const betAmountNum = parseFloat(betAmount);
      const isUnlimited = allowanceNum > 1e20; // MaxUint256 is ~1.15e77, but parseFloat can lose precision

      if (isUnlimited) {
        console.log('   You already have unlimited approval (from when you bought the tokens)');
        console.log('   You dont need to pay gas for approval!');
      } else if (allowanceNum < betAmountNum) {
        console.log('   Insufficient approval, requesting new approval...');
        try {
          // Approve a larger amount to avoid multiple approvals (e.g., 10x the amount)
          const approveAmount = (parseFloat(betAmount) * 10).toString();
          console.log('   Approving amount:', approveAmount, '(to avoid multiple approvals)');

          const approveTx = await creatorTokenService.approve(
            prediction.creatorToken,
            marketAddress,
            approveAmount
          );
          console.log('   ✅ Approval sent, waiting for confirmation...');
          console.log('   Hash:', approveTx.hash);
          console.log('   ✅ Approval confirmed');
        } catch (approveErr: any) {
          console.error('   ❌ Error in approval:', approveErr);

          // Check if it's an insufficient balance error
          if (approveErr.message?.includes('Insufficient balance') ||
            approveErr.message?.includes('insufficient funds') ||
            approveErr.code === -32603) {
            throw new Error('Insufficient ETH for gas. You need ETH in your wallet to approve tokens. Verify that SubWallet is connected to the local network (ChainID: 31337).');
          }

          throw new Error(`Error approving tokens: ${approveErr.message || approveErr.reason || 'Transaction rejected'}`);
        }
      } else {
        console.log('   ✅ You already have sufficient approval, continuing...');
      }

      // 2. Place the bet
      console.log('📝 Step 2: Placing bet...');
      console.log('   Prediction ID:', predictionId);
      console.log('   Option Index:', selectedOption);
      console.log('   Amount:', betAmount);

      try {
        const betTx = await predictionMarketService.placeBet(predictionId, selectedOption, betAmount);
        console.log('   ✅ Bet sent, waiting for confirmation...');
        console.log('   Hash:', betTx.hash);
        console.log('   ✅ Bet confirmed');
      } catch (betErr: any) {
        console.error('   ❌ Error in bet:', betErr);
        throw new Error(`Error placing bet: ${betErr.message || betErr.reason || 'Transaction rejected'}`);
      }

      setBetSuccess(true);
      setBetAmount('');
      setSelectedOption(null);

      // Refrescar datos
      setTimeout(() => {
        refetch();
        setBetSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('❌ Complete error placing bet:', err);
      const errorMessage = err.message || err.reason || err.error?.message || 'Error placing the bet';
      setBetError(errorMessage);
      setIsPlacingBet(false); // Ensure loading is deactivated
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Claim winnings
  const handleClaimWinnings = async () => {
    if (!prediction || !address) return;

    try {
      setIsClaiming(true);
      setClaimError(null);

      console.log('💰 Claiming winnings...');
      await predictionMarketService.claimWinnings(prediction.id);

      setClaimSuccess(true);
      setClaimableAmount(null); // Clear claimable amount

      // Refresh data after claiming
      setTimeout(() => {
        refetch();
        setClaimSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error claiming winnings:', err);
      setClaimError(err.message || 'Error claiming winnings');
    } finally {
      setIsClaiming(false);
    }
  };

  // Report fraud
  const handleReportFraud = async () => {
    if (!prediction || !address) return;

    if (!confirm('Are you sure you want to report this prediction as fraud? This action cannot be undone.')) {
      return;
    }

    try {
      setIsReporting(true);
      setReportError(null);

      console.log('🚨 Reporting fraud...');
      await predictionMarketService.reportFraud(prediction.id, 'Reported from UI');

      setReportSuccess(true);
      setTimeout(() => {
        refetch();
        setReportSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error reporting fraud:', err);
      setReportError(err.message || 'Error reporting prediction');
    } finally {
      setIsReporting(false);
    }
  };

  // Close prediction manually (creator)
  const handleClose = async () => {
    if (!prediction || !address) return;

    if (!confirm('Are you sure you want to close this prediction? Once closed, no more bets can be placed.')) {
      return;
    }

    try {
      setIsClosing(true);
      setCloseError(null);

      console.log('🔒 Closing prediction...');
      await predictionMarketService.closePrediction(prediction.id);

      setCloseSuccess(true);
      setTimeout(() => {
        refetch();
        setCloseSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error closing prediction:', err);
      setCloseError(err.message || 'Error closing prediction');
    } finally {
      setIsClosing(false);
    }
  };

  const handleToggleSubscription = async () => {
    if (!prediction) return;

    try {
      setIsSubscribing(true);

      if (isSubscribed(prediction.creator)) {
        await unsubscribe(prediction.creator);
      } else {
        await subscribe(prediction.creator);
      }
    } catch (err: any) {
      console.error('Error toggling subscription:', err);
      alert(err.message || 'Error changing subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Resolve prediction (creator)
  const handleResolve = async () => {
    if (!prediction || !address || selectedWinner === null) return;

    if (!confirm(`Confirm that the winning option is "${prediction.options[selectedWinner].description}"?`)) {
      return;
    }

    try {
      setIsResolving(true);
      setResolveError(null);

      console.log('🏁 Resolving prediction...');
      await predictionMarketService.resolvePrediction(prediction.id, selectedWinner);

      setResolveSuccess(true);
      setSelectedWinner(null);
      setTimeout(() => {
        refetch();
        setResolveSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error resolving prediction:', err);
      setResolveError(err.message || 'Error resolving prediction');
    } finally {
      setIsResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-400">Loading prediction...</p>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-red-400 mb-2">Error loading prediction</p>
        <p className="text-slate-500 text-sm">{error}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[prediction.status];
  const isActive = prediction.status === 0;
  const timeRemaining = getTimeRemaining(prediction.closesAt);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-100 mb-2">{prediction.title}</h1>
              <p className="text-slate-400">{prediction.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm bg-${statusColor}-500/10 border border-${statusColor}-500/30 text-${statusColor}-400`}>
                {STATUS_NAMES[prediction.status]}
              </span>

              {/* Follow/Unfollow Button */}
              {isConnected && address?.toLowerCase() !== prediction.creator.toLowerCase() && (
                <button
                  onClick={handleToggleSubscription}
                  disabled={isSubscribing}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isSubscribed(prediction.creator)
                    ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubscribing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isSubscribed(prediction.creator) ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Featured cooldown counter */}
          {prediction.status === 2 && cooldownRemaining > 0 && (
            <div className="mt-4 space-y-3">
              {/* Winning Option */}
              {prediction.winningOption >= 0 && prediction.winningOption < prediction.options.length && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-emerald-400 font-medium mb-1">Declared Winning Option</p>
                      <p className="text-white text-lg font-semibold">
                        {prediction.options[prediction.winningOption].description}
                      </p>
                      <p className="text-white text-xs mt-1">
                        Check if this result is correct. If not, you can report it during the cooldown period.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cooldown Counter */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-yellow-400" />
                  <div className="flex-1">
                    <p className="text-yellow-400 font-medium">Cooldown Period Active</p>
                    <p className="text-white text-sm">
                      Time remaining to report fraud
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold font-mono text-yellow-400">
                      {formatCooldownTime(cooldownRemaining)}
                    </div>
                    <p className="text-white text-xs">until confirmation</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 text-sm">Participantes</span>
              </div>
              <p className="text-slate-100 text-lg font-semibold">
                {prediction.options.reduce((sum, opt) => sum + opt.totalBettors, 0)}
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 text-sm">Pool Total</span>
              </div>
              <p className="text-emerald-400 text-lg font-semibold">
                {parseFloat(prediction.totalPool).toFixed(2)} {prediction.creatorTokenSymbol}
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 text-sm">Cierra en</span>
              </div>
              <p className="text-slate-100 text-lg font-semibold">{timeRemaining}</p>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 text-sm">Creada</span>
              </div>
              <p className="text-slate-100 text-sm">{formatDate(prediction.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Options & Betting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Options */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-100 mb-4">Options</h2>
          <div className="space-y-3">
            {prediction.options.map((option) => {
              // Determine if this option is the winner (when in cooldown or confirmed)
              const isWinner = (prediction.status === 2 || prediction.status === 3 || prediction.status === 4)
                && prediction.winningOption >= 0
                && option.index === prediction.winningOption;

              return (
                <div
                  key={option.index}
                  onClick={() => isActive && setSelectedOption(option.index)}
                  className={`bg-slate-900/50 border rounded-xl p-4 transition-all cursor-pointer ${isWinner
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                    : selectedOption === option.index
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-800/50 hover:border-slate-700'
                    } ${!isActive && 'opacity-50 cursor-not-allowed'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">{option.description}</h3>
                      {isWinner && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-xs font-medium">Ganadora</span>
                        </div>
                      )}
                    </div>
                    <span className="text-emerald-400 font-semibold">{option.percentage.toFixed(1)}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      {parseFloat(option.totalAmount).toFixed(2)} {prediction.creatorTokenSymbol}
                    </span>
                    <span className="text-slate-500">{option.totalBettors} bettors</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User's Bets */}
          {prediction.userHasBet && (
            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h3 className="text-blue-400 font-medium mb-2">Your Bet</h3>
              <p className="text-slate-300">
                You bet {prediction.userTotalBet} {prediction.creatorTokenSymbol}
              </p>
              <div className="mt-2 space-y-1">
                {prediction.userBets.map((bet, index) => (
                  <div key={index} className="text-sm text-slate-400">
                    • {bet.amount} {prediction.creatorTokenSymbol} on "{prediction.options[bet.optionIndex].description}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Betting Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 sticky top-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Bet</h2>

            {!isConnected ? (
              <div className="text-center py-6">
                <p className="text-slate-400 mb-4">Connect your wallet to bet</p>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
                  Connect Wallet
                </button>
              </div>
            ) : address && address.toLowerCase() === prediction.creator.toLowerCase() ? (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium mb-2">You are the creator of this prediction</p>
                <p className="text-slate-400 text-sm mb-4">
                  As the creator, you cannot bet on your own prediction. You can only manage it (close it and resolve it).
                </p>
              </div>
            ) : !isActive ? (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-slate-400">This prediction is not active</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-slate-300 text-sm mb-2 block">Select an option</label>
                  {selectedOption !== null ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                      {prediction.options[selectedOption].description}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">Click on an option above</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-slate-300 text-sm mb-2 block">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {prediction.creatorTokenSymbol}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Balance: {parseFloat(userBalance).toFixed(2)} {prediction.creatorTokenSymbol}
                  </p>
                </div>

                {/* Message if user has no tokens */}
                {parseFloat(userBalance) === 0 && (
                  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-400 font-medium mb-1">You don't have {prediction.creatorTokenSymbol}</p>
                        <p className="text-white text-sm">
                          You need to buy tokens from this creator to be able to bet
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onBuyTokens?.(prediction.creatorToken)}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Coins className="w-5 h-5" />
                      Buy {prediction.creatorTokenSymbol}
                    </button>
                  </div>
                )}

                {betError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{betError}</p>
                  </div>
                )}

                {betSuccess && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <p className="text-green-400 text-sm">Bet placed!</p>
                  </div>
                )}

                <button
                  onClick={handlePlaceBet}
                  disabled={isPlacingBet || selectedOption === null || !betAmount || parseFloat(userBalance) === 0}
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isPlacingBet ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Betting...
                    </>
                  ) : parseFloat(userBalance) === 0 ? (
                    'Buy tokens first'
                  ) : (
                    'Confirm Bet'
                  )}
                </button>

              </>
            )}

            {/* Additional actions */}
            {isConnected && address && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                {/* Claim winnings */}
                {prediction.status === 4 && claimableAmount && parseFloat(claimableAmount) > 0 && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-emerald-400 font-bold text-lg mb-1">You got it right! 🎉</h3>
                        <p className="text-white text-sm">
                          Your bet was correct. You can claim your winnings.
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Winnings to claim:</span>
                        {isCalculatingReward ? (
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        ) : (
                          <span className="text-emerald-400 font-bold text-lg">
                            {claimableAmount} {prediction.creatorTokenSymbol}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        {parseFloat(claimableAmount) === parseFloat(prediction.userBets
                          .filter(b => b.optionIndex === prediction.winningOption && !b.claimed)
                          .reduce((sum, b) => sum + parseFloat(b.amount), 0).toFixed(4))
                          ? 'As you were the only bettor, you get your bet back'
                          : 'Includes your bet plus your share of the losers pool'}
                      </p>
                    </div>

                    {claimSuccess && (
                      <div className="mb-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <p className="text-green-400 text-sm font-medium">Winnings claimed successfully!</p>
                      </div>
                    )}
                    {claimError && (
                      <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{claimError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleClaimWinnings}
                      disabled={isClaiming || isCalculatingReward}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5" />
                          Claim {claimableAmount} {prediction.creatorTokenSymbol}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Report fraud */}
                {prediction.status === 2 && prediction.userBets.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-slate-300 font-medium">Cooldown Period</h3>
                      <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-mono font-medium">
                            {cooldownRemaining > 0 ? formatCooldownTime(cooldownRemaining) : 'Finished'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Show declared winning option */}
                    {prediction.winningOption >= 0 && prediction.winningOption < prediction.options.length && (
                      <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400 text-xs font-medium">Declared Result:</span>
                        </div>
                        <p className="text-white font-semibold text-sm">
                          {prediction.options[prediction.winningOption].description}
                        </p>
                      </div>
                    )}

                    <p className="text-slate-400 text-sm mb-3">
                      {cooldownRemaining > 0
                        ? 'If you think the declared result is incorrect, you can report it during this period.'
                        : 'The cooldown has ended. The prediction will be confirmed automatically.'
                      }
                    </p>
                    {reportSuccess && (
                      <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                        <p className="text-yellow-400 text-sm">Report sent!</p>
                      </div>
                    )}
                    {reportError && (
                      <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{reportError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleReportFraud}
                      disabled={isReporting}
                      className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isReporting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Reporting...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          Report Fraud
                        </>
                      )}
                    </button>
                    <p className="text-slate-500 text-xs mt-2">
                      Reports: {prediction.reportCount}
                    </p>
                  </div>
                )}

                {/* Close prediction manually (creator) */}
                {prediction.status === 0 && address.toLowerCase() === prediction.creator.toLowerCase() && (
                  <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <h3 className="text-slate-300 font-medium mb-2">Close Prediction</h3>
                    <p className="text-slate-400 text-sm mb-3">
                      You can close this prediction manually before it expires. Once closed, no more bets can be placed.
                    </p>
                    {closeSuccess && (
                      <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <p className="text-green-400 text-sm">Prediction closed successfully!</p>
                      </div>
                    )}
                    {closeError && (
                      <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{closeError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleClose}
                      disabled={isClosing}
                      className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isClosing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Closing...
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5" />
                          Close Prediction
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Resolve prediction (creator) */}
                {prediction.status === 1 && address.toLowerCase() === prediction.creator.toLowerCase() && (
                  <div className="mb-4">
                    <h3 className="text-slate-300 font-medium mb-3">Resolve Prediction</h3>
                    <p className="text-slate-400 text-sm mb-3">
                      Select the winning option:
                    </p>
                    <div className="space-y-2 mb-4">
                      {prediction.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedWinner(index)}
                          className={`w-full p-3 rounded-lg border transition-colors text-left ${selectedWinner === index
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                        >
                          {option.description}
                        </button>
                      ))}
                    </div>
                    {resolveSuccess && (
                      <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <p className="text-green-400 text-sm">Prediction resolved!</p>
                      </div>
                    )}
                    {resolveError && (
                      <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">{resolveError}</p>
                      </div>
                    )}
                    <button
                      onClick={handleResolve}
                      disabled={isResolving || selectedWinner === null}
                      className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isResolving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Resolving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Confirm Result
                        </>
                      )}
                    </button>
                    <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      A 10-minute cooldown period will start
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

