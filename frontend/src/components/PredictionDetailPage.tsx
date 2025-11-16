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

const STATUS_NAMES = ['Activa', 'Cerrada', 'Cooldown', 'En Revisión', 'Confirmada', 'Disputada', 'Cancelada'];
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
  
  // Estados para reclamar ganancias
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimableAmount, setClaimableAmount] = useState<string | null>(null);
  const [isCalculatingReward, setIsCalculatingReward] = useState(false);
  
  // Estados para reportar fraude
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  // Estados para resolver predicción (creador)
  const [isResolving, setIsResolving] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeSuccess, setCloseSuccess] = useState(false);
  
  // Contador de cooldown
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  
  // Subscription states
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Cargar balance del usuario cuando selecciona una opción
  React.useEffect(() => {
    if (prediction && address && isConnected) {
      creatorTokenService
        .getBalance(prediction.creatorToken, address)
        .then((balance) => setUserBalance(balance))
        .catch((err) => console.error('Error loading balance:', err));
    }
  }, [prediction, address, isConnected]);

  // Contador de cooldown (actualiza cada segundo)
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

    updateCooldown(); // Actualizar inmediatamente
    const interval = setInterval(updateCooldown, 1000); // Actualizar cada segundo

    return () => clearInterval(interval);
  }, [prediction]);

  // Confirmar automáticamente si el cooldown terminó
  React.useEffect(() => {
    const autoConfirm = async () => {
      if (!prediction || prediction.status !== 2) return; // Solo si está en Cooldown
      
      const now = Math.floor(Date.now() / 1000);
      const cooldownEnded = prediction.cooldownEndsAt > 0 && now >= prediction.cooldownEndsAt;
      
      if (cooldownEnded) {
        console.log('⏰ Cooldown terminó, confirmando automáticamente...');
        try {
          await predictionMarketService.autoConfirmOutcome(prediction.id);
          // Refrescar después de confirmar
          setTimeout(() => {
            refetch();
          }, 2000);
        } catch (err: any) {
          // Si ya está confirmada o hay otro error, no hacer nada
          console.log('ℹ️  No se pudo confirmar automáticamente:', err.message);
        }
      }
    };

    // Solo verificar si el cooldown ya terminó
    if (cooldownRemaining === 0 && prediction?.status === 2) {
      autoConfirm();
    }
  }, [prediction, cooldownRemaining, refetch]);

  // Calcular cuánto puede reclamar el usuario si ganó
  React.useEffect(() => {
    const calculateReward = async () => {
      if (!prediction || !address || prediction.status !== 4) {
        setClaimableAmount(null);
        return;
      }

      // Verificar si el usuario tiene apuestas ganadoras no reclamadas
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
        console.error('Error calculando recompensa:', err);
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
    // Si closesAt es un valor muy grande (type(uint256).max), es una predicción indefinida
    const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const closesAtBigInt = BigInt(closesAt);
    
    // Si es mayor a un año en el futuro (muy improbable), probablemente es indefinida
    if (closesAtBigInt > BigInt(10) ** BigInt(15)) {
      return 'Sin tiempo límite';
    }
    
    const now = Date.now() / 1000;
    const remaining = closesAt - now;
    
    if (remaining <= 0) return 'Cerrada';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(remaining / 60)}min`;
  };

  const handlePlaceBet = async () => {
    if (!prediction || selectedOption === null || !betAmount) {
      setBetError('Por favor selecciona una opción y cantidad');
      return;
    }

    if (!isConnected || !address) {
      setBetError('Por favor conecta tu wallet');
      return;
    }

    if (parseFloat(betAmount) <= 0) {
      setBetError('La cantidad debe ser mayor a 0');
      return;
    }

    if (parseFloat(betAmount) > parseFloat(userBalance)) {
      setBetError(`Balance insuficiente. Tienes ${parseFloat(userBalance).toFixed(2)} ${prediction.creatorTokenSymbol}`);
      return;
    }

    // Verificar balance de ETH antes de continuar
    if (!address) {
      setBetError('No hay dirección de wallet conectada');
      return;
    }

    try {
      setIsPlacingBet(true);
      setBetError(null);
      setBetSuccess(false);

      // Verificar balance de ETH (necesario para pagar gas)
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const ethBalance = await provider.getBalance(address);
      const ethBalanceFormatted = parseFloat(ethers.formatEther(ethBalance));
      
      console.log('💰 Balance ETH:', ethBalanceFormatted, 'ETH');
      
      if (ethBalanceFormatted < 0.001) {
        throw new Error(`ETH insuficiente para pagar el gas. Tienes ${ethBalanceFormatted.toFixed(6)} ETH. Necesitas al menos 0.001 ETH. Verifica que SubWallet esté conectado a la red local (ChainID: 31337) y que veas tu balance de ETH.`);
      }

      const marketAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
      
      // 1. Verificar si ya tiene aprobación suficiente
      console.log('📝 Paso 1: Verificando aprobación de tokens...');
      console.log('   Token:', prediction.creatorToken);
      console.log('   Spender:', marketAddress);
      console.log('   Amount necesario:', betAmount);
      
      if (!address) {
        throw new Error('No hay dirección de wallet conectada');
      }

      const currentAllowance = await creatorTokenService.getAllowance(
        prediction.creatorToken,
        address,
        marketAddress
      );
      
      console.log('   Aprobación actual:', currentAllowance);
      
      // Verificar si la aprobación es ilimitada o muy grande (MaxUint256 se convierte a un número muy grande)
      const allowanceNum = parseFloat(currentAllowance);
      const betAmountNum = parseFloat(betAmount);
      const isUnlimited = allowanceNum > 1e20; // MaxUint256 es ~1.15e77, pero parseFloat puede perder precisión
      
      if (isUnlimited) {
        console.log('   ✅ Ya tienes aprobación ilimitada (de cuando compraste los tokens)');
        console.log('   💡 No necesitas pagar gas por aprobación!');
      } else if (allowanceNum < betAmountNum) {
        console.log('   ⚠️  Aprobación insuficiente, solicitando nueva aprobación...');
        try {
          // Aprobar una cantidad mayor para evitar múltiples aprobaciones (ej: 10x la cantidad)
          const approveAmount = (parseFloat(betAmount) * 10).toString();
          console.log('   Aprobando cantidad:', approveAmount, '(para evitar múltiples aprobaciones)');
          
          const approveTx = await creatorTokenService.approve(
            prediction.creatorToken,
            marketAddress,
            approveAmount
          );
          console.log('   ✅ Aprobación enviada, esperando confirmación...');
          console.log('   Hash:', approveTx.hash);
          console.log('   ✅ Aprobación confirmada');
        } catch (approveErr: any) {
          console.error('   ❌ Error en aprobación:', approveErr);
          
          // Verificar si es un error de balance insuficiente
          if (approveErr.message?.includes('Insufficient balance') || 
              approveErr.message?.includes('insufficient funds') ||
              approveErr.code === -32603) {
            throw new Error('ETH insuficiente para pagar el gas. Necesitas ETH en tu wallet para aprobar tokens. Verifica que SubWallet esté conectado a la red local (ChainID: 31337).');
          }
          
          throw new Error(`Error al aprobar tokens: ${approveErr.message || approveErr.reason || 'Transacción rechazada'}`);
        }
      } else {
        console.log('   ✅ Ya tienes aprobación suficiente, continuando...');
      }

      // 2. Realizar la apuesta
      console.log('📝 Paso 2: Realizando apuesta...');
      console.log('   Prediction ID:', predictionId);
      console.log('   Option Index:', selectedOption);
      console.log('   Amount:', betAmount);
      
      try {
        const betTx = await predictionMarketService.placeBet(predictionId, selectedOption, betAmount);
        console.log('   ✅ Apuesta enviada, esperando confirmación...');
        console.log('   Hash:', betTx.hash);
        console.log('   ✅ Apuesta confirmada');
      } catch (betErr: any) {
        console.error('   ❌ Error en apuesta:', betErr);
        throw new Error(`Error al realizar apuesta: ${betErr.message || betErr.reason || 'Transacción rechazada'}`);
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
      console.error('❌ Error completo placing bet:', err);
      const errorMessage = err.message || err.reason || err.error?.message || 'Error al realizar la apuesta';
      setBetError(errorMessage);
      setIsPlacingBet(false); // Asegurar que se desactive el loading
    } finally {
      setIsPlacingBet(false);
    }
  };

  // Reclamar ganancias
  const handleClaimWinnings = async () => {
    if (!prediction || !address) return;
    
    try {
      setIsClaiming(true);
      setClaimError(null);
      
      console.log('💰 Reclamando ganancias...');
      await predictionMarketService.claimWinnings(prediction.id);
      
      setClaimSuccess(true);
      setClaimableAmount(null); // Limpiar el monto reclamable
      
      // Refrescar datos después de reclamar
      setTimeout(() => {
        refetch();
        setClaimSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error reclamando ganancias:', err);
      setClaimError(err.message || 'Error al reclamar ganancias');
    } finally {
      setIsClaiming(false);
    }
  };

  // Reportar fraude
  const handleReportFraud = async () => {
    if (!prediction || !address) return;
    
    if (!confirm('¿Estás seguro de que quieres reportar esta predicción como fraude? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      setIsReporting(true);
      setReportError(null);
      
      console.log('🚨 Reportando fraude...');
      await predictionMarketService.reportFraud(prediction.id, 'Reported from UI');
      
      setReportSuccess(true);
      setTimeout(() => {
        refetch();
        setReportSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error reportando fraude:', err);
      setReportError(err.message || 'Error al reportar fraude');
    } finally {
      setIsReporting(false);
    }
  };

  // Cerrar predicción manualmente (creador)
  const handleClose = async () => {
    if (!prediction || !address) return;
    
    if (!confirm('¿Estás seguro de que quieres cerrar esta predicción? Una vez cerrada, no se podrán hacer más apuestas.')) {
      return;
    }
    
    try {
      setIsClosing(true);
      setCloseError(null);
      
      console.log('🔒 Cerrando predicción...');
      await predictionMarketService.closePrediction(prediction.id);
      
      setCloseSuccess(true);
      setTimeout(() => {
        refetch();
        setCloseSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error cerrando predicción:', err);
      setCloseError(err.message || 'Error al cerrar predicción');
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
      alert(err.message || 'Error al cambiar suscripción');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Resolver predicción (creador)
  const handleResolve = async () => {
    if (!prediction || !address || selectedWinner === null) return;
    
    if (!confirm(`¿Confirmar que la opción ganadora es "${prediction.options[selectedWinner].description}"?`)) {
      return;
    }
    
    try {
      setIsResolving(true);
      setResolveError(null);
      
      console.log('🏁 Resolviendo predicción...');
      await predictionMarketService.resolvePrediction(prediction.id, selectedWinner);
      
      setResolveSuccess(true);
      setSelectedWinner(null);
      setTimeout(() => {
        refetch();
        setResolveSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error resolviendo predicción:', err);
      setResolveError(err.message || 'Error al resolver predicción');
    } finally {
      setIsResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
        <p className="text-slate-400">Cargando predicción...</p>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <p className="text-red-400 mb-2">Error al cargar la predicción</p>
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
              
              {/* Botón Seguir/Dejar de seguir */}
              {isConnected && address?.toLowerCase() !== prediction.creator.toLowerCase() && (
                <button
                  onClick={handleToggleSubscription}
                  disabled={isSubscribing}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isSubscribed(prediction.creator)
                      ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubscribing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isSubscribed(prediction.creator) ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5" />
                      Siguiendo
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Seguir
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Contador de cooldown destacado */}
          {prediction.status === 2 && cooldownRemaining > 0 && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-yellow-400 font-medium">Período de Cooldown Activo</p>
                  <p className="text-yellow-300/80 text-sm">
                    Tiempo restante para reportar fraude
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold font-mono text-yellow-400">
                    {formatCooldownTime(cooldownRemaining)}
                  </div>
                  <p className="text-yellow-300/60 text-xs">hasta confirmar</p>
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
          <h2 className="text-xl font-bold text-slate-100 mb-4">Opciones</h2>
          <div className="space-y-3">
            {prediction.options.map((option) => (
              <div
                key={option.index}
                onClick={() => isActive && setSelectedOption(option.index)}
                className={`bg-slate-900/50 border rounded-xl p-4 transition-all cursor-pointer ${
                  selectedOption === option.index
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800/50 hover:border-slate-700'
                } ${!isActive && 'opacity-50 cursor-not-allowed'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-slate-100 font-medium">{option.description}</h3>
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
                  <span className="text-slate-500">{option.totalBettors} apostadores</span>
                </div>
              </div>
            ))}
          </div>

          {/* User's Bets */}
          {prediction.userHasBet && (
            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h3 className="text-blue-400 font-medium mb-2">Tu apuesta</h3>
              <p className="text-slate-300">
                Has apostado {prediction.userTotalBet} {prediction.creatorTokenSymbol}
              </p>
              <div className="mt-2 space-y-1">
                {prediction.userBets.map((bet, index) => (
                  <div key={index} className="text-sm text-slate-400">
                    • {bet.amount} {prediction.creatorTokenSymbol} en "{prediction.options[bet.optionIndex].description}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Betting Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 sticky top-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Apostar</h2>

            {!isConnected ? (
              <div className="text-center py-6">
                <p className="text-slate-400 mb-4">Conecta tu wallet para apostar</p>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
                  Conectar Wallet
                </button>
              </div>
            ) : address && address.toLowerCase() === prediction.creator.toLowerCase() ? (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-slate-300 font-medium mb-2">Eres el creador de esta predicción</p>
                <p className="text-slate-400 text-sm mb-4">
                  Como creador, no puedes apostar en tu propia predicción. Solo puedes gestionarla (cerrarla y resolverla).
                </p>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 text-sm">
                    Ve a "Mis Uvotes" para gestionar esta predicción
                  </p>
                </div>
              </div>
            ) : !isActive ? (
              <div className="text-center py-6">
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-slate-400">Esta predicción no está activa</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-slate-300 text-sm mb-2 block">Selecciona una opción</label>
                  {selectedOption !== null ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                      {prediction.options[selectedOption].description}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">Haz clic en una opción arriba</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="text-slate-300 text-sm mb-2 block">Cantidad</label>
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

                {/* Mensaje si no tiene tokens */}
                {parseFloat(userBalance) === 0 && (
                  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-400 font-medium mb-1">No tienes {prediction.creatorTokenSymbol}</p>
                        <p className="text-yellow-300/80 text-sm">
                          Necesitas comprar tokens de este creador para poder apostar
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onBuyTokens?.(prediction.creatorToken)}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Coins className="w-5 h-5" />
                      Comprar {prediction.creatorTokenSymbol}
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
                    <p className="text-green-400 text-sm">¡Apuesta realizada!</p>
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
                      Apostando...
                    </>
                  ) : parseFloat(userBalance) === 0 ? (
                    'Primero compra tokens'
                  ) : (
                    'Confirmar Apuesta'
                  )}
                </button>

              </>
            )}

            {/* Acciones adicionales */}
            {isConnected && address && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                {/* Reclamar ganancias */}
                {prediction.status === 4 && claimableAmount && parseFloat(claimableAmount) > 0 && (
                  <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-green-400 font-bold text-lg mb-1">¡Acertaste! 🎉</h3>
                        <p className="text-slate-300 text-sm">
                          Tu apuesta fue correcta. Puedes reclamar tus ganancias.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Ganancias a reclamar:</span>
                        {isCalculatingReward ? (
                          <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                        ) : (
                          <span className="text-green-400 font-bold text-lg">
                            {claimableAmount} {prediction.creatorTokenSymbol}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        {parseFloat(claimableAmount) === parseFloat(prediction.userBets
                          .filter(b => b.optionIndex === prediction.winningOption && !b.claimed)
                          .reduce((sum, b) => sum + parseFloat(b.amount), 0).toFixed(4))
                          ? 'Como fuiste el único apostador, recibes tu apuesta de vuelta'
                          : 'Incluye tu apuesta más tu proporción del pool de perdedores'}
                      </p>
                    </div>

                    {claimSuccess && (
                      <div className="mb-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <p className="text-green-400 text-sm font-medium">¡Ganancias reclamadas exitosamente!</p>
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
                          Reclamando...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-5 h-5" />
                          Reclamar {claimableAmount} {prediction.creatorTokenSymbol}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Reportar fraude */}
                {prediction.status === 2 && prediction.userBets.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-slate-300 font-medium">Período de Cooldown</h3>
                      <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-mono font-medium">
                            {cooldownRemaining > 0 ? formatCooldownTime(cooldownRemaining) : 'Terminado'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">
                      {cooldownRemaining > 0 
                        ? 'Si crees que el resultado es incorrecto, puedes reportarlo durante este período.'
                        : 'El cooldown ha terminado. La predicción se confirmará automáticamente.'
                      }
                    </p>
                    {reportSuccess && (
                      <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                        <p className="text-yellow-400 text-sm">¡Reporte enviado!</p>
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
                          Reportando...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          Reportar Fraude
                        </>
                      )}
                    </button>
                    <p className="text-slate-500 text-xs mt-2">
                      Reportes: {prediction.reportCount}
                    </p>
                  </div>
                )}

                {/* Cerrar predicción manualmente (creador) */}
                {prediction.status === 0 && address.toLowerCase() === prediction.creator.toLowerCase() && (
                  <div className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <h3 className="text-slate-300 font-medium mb-2">Cerrar Predicción</h3>
                    <p className="text-slate-400 text-sm mb-3">
                      Puedes cerrar esta predicción manualmente antes de que expire. Una vez cerrada, no se podrán hacer más apuestas.
                    </p>
                    {closeSuccess && (
                      <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <p className="text-green-400 text-sm">¡Predicción cerrada exitosamente!</p>
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
                          Cerrando...
                        </>
                      ) : (
                        <>
                          <Clock className="w-5 h-5" />
                          Cerrar Predicción
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Resolver predicción (creador) */}
                {prediction.status === 1 && address.toLowerCase() === prediction.creator.toLowerCase() && (
                  <div className="mb-4">
                    <h3 className="text-slate-300 font-medium mb-3">Resolver Predicción</h3>
                    <p className="text-slate-400 text-sm mb-3">
                      Selecciona la opción ganadora:
                    </p>
                    <div className="space-y-2 mb-4">
                      {prediction.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedWinner(index)}
                          className={`w-full p-3 rounded-lg border transition-colors text-left ${
                            selectedWinner === index
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
                        <p className="text-green-400 text-sm">¡Predicción resuelta!</p>
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
                          Resolviendo...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Confirmar Resultado
                        </>
                      )}
                    </button>
                    <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Se iniciará un período de cooldown de 10 minutos
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

