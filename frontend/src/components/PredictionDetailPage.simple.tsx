import { useState } from 'react';
import { ArrowLeft, Calendar, Users, TrendingUp, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import React from 'react';
import { usePredictionDetail } from '../hooks/usePredictionDetail';
import { useWallet } from '../hooks/useWallet';
import { predictionMarketService, creatorTokenService } from '../lib/contractService';

interface PredictionDetailPageProps {
  predictionId: string;
  onBack?: () => void;
}

const STATUS_NAMES = ['Activa', 'Cerrada', 'Cooldown', 'En Revisión', 'Confirmada', 'Disputada', 'Cancelada'];
const STATUS_COLORS = ['emerald', 'slate', 'yellow', 'orange', 'green', 'red', 'gray'];

export function PredictionDetailPage({ predictionId, onBack }: PredictionDetailPageProps) {
  const { address, isConnected } = useWallet();
  const { prediction, loading, error, refetch } = usePredictionDetail(predictionId, address);
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);
  const [betSuccess, setBetSuccess] = useState(false);
  const [userBalance, setUserBalance] = useState<string>('0');

  // Cargar balance del usuario cuando selecciona una opción
  React.useEffect(() => {
    if (prediction && address && isConnected) {
      creatorTokenService
        .getBalance(prediction.creatorToken, address)
        .then((balance) => setUserBalance(balance))
        .catch((err) => console.error('Error loading balance:', err));
    }
  }, [prediction, address, isConnected]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (closesAt: number) => {
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

    try {
      setIsPlacingBet(true);
      setBetError(null);
      setBetSuccess(false);

      // 1. Aprobar tokens al contrato PredictionMarket
      console.log('Aprobando tokens...');
      await creatorTokenService.approve(
        prediction.creatorToken,
        '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // PredictionMarket address
        betAmount
      );

      // 2. Realizar la apuesta
      console.log('Realizando apuesta...');
      await predictionMarketService.placeBet(predictionId, selectedOption, betAmount);

      setBetSuccess(true);
      setBetAmount('');
      setSelectedOption(null);
      
      // Refrescar datos
      setTimeout(() => {
        refetch();
        setBetSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error placing bet:', err);
      setBetError(err.message || 'Error al realizar la apuesta');
    } finally {
      setIsPlacingBet(false);
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
            <span className={`px-3 py-1 rounded-full text-sm bg-${statusColor}-500/10 border border-${statusColor}-500/30 text-${statusColor}-400`}>
              {STATUS_NAMES[prediction.status]}
            </span>
          </div>

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
                  disabled={isPlacingBet || selectedOption === null || !betAmount}
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isPlacingBet ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Apostando...
                    </>
                  ) : (
                    'Confirmar Apuesta'
                  )}
                </button>

                <p className="text-slate-500 text-xs mt-3 text-center">
                  Fee del creador: {prediction.creatorFee}%
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

