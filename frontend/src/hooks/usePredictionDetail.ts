import { useState, useEffect } from 'react';
import { predictionMarketService, creatorTokenService } from '../lib/contractService';

export interface PredictionOption {
  index: number;
  description: string;
  totalAmount: string;
  totalBettors: number;
  percentage: number; // Porcentaje del pool total
}

export interface UserBet {
  bettor: string;
  optionIndex: number;
  amount: string;
  claimed: boolean;
}

export interface PredictionDetail {
  id: string;
  creator: string;
  creatorToken: string;
  creatorTokenSymbol: string;
  title: string;
  description: string;
  options: PredictionOption[];
  createdAt: number;
  closesAt: number;
  resolvedAt: number;
  status: number; // 0=Active, 1=Closed, 2=Cooldown, 3=UnderReview, 4=Confirmed, 5=Disputed, 6=Cancelled
  winningOption: number;
  cooldownEndsAt: number;
  reportCount: number;
  totalPool: string;
  userBets: UserBet[];
  userHasBet: boolean;
  userTotalBet: string;
}

export const usePredictionDetail = (predictionId: string | null, userAddress: string | null) => {
  const [prediction, setPrediction] = useState<PredictionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrediction = async () => {
    if (!predictionId) {
      setPrediction(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Obtener datos básicos de la predicción
      const predData = await predictionMarketService.getPrediction(predictionId);

      // 2. Obtener opciones
      const optionsData = await predictionMarketService.getPredictionOptions(predictionId);

      // 3. Calcular porcentajes
      const totalPool = parseFloat(predData.totalPool);
      const optionsWithPercentage = optionsData.map((opt) => ({
        ...opt,
        percentage: totalPool > 0 ? (parseFloat(opt.totalAmount) / totalPool) * 100 : 0,
      }));

      // 4. Obtener símbolo del token del creador
      const tokenInfo = await creatorTokenService.getTokenInfo(predData.creatorToken);

      // 5. Obtener apuestas del usuario (si está conectado)
      let userBets: UserBet[] = [];
      let userTotalBet = '0';
      if (userAddress) {
        userBets = await predictionMarketService.getUserBets(predictionId, userAddress);
        userTotalBet = userBets
          .reduce((sum, bet) => sum + parseFloat(bet.amount), 0)
          .toFixed(4);
      }

      const predictionData = {
        ...predData,
        options: optionsWithPercentage,
        creatorTokenSymbol: tokenInfo.symbol,
        userBets,
        userHasBet: userBets.length > 0,
        userTotalBet,
      };

      setPrediction(predictionData);

      // Si está en Cooldown y el cooldown terminó, confirmar automáticamente (sin signer, solo lectura)
      if (predData.status === 2 && predData.cooldownEndsAt > 0) {
        const now = Math.floor(Date.now() / 1000);
        if (now >= predData.cooldownEndsAt) {
          console.log('⏰ Cooldown terminó, la predicción debería estar confirmada');
          // Nota: La confirmación real se hace en PredictionDetailPage cuando el usuario está conectado
        }
      }
    } catch (err: any) {
      console.error('Error loading prediction:', err);
      setError(err.message || 'Error al cargar la predicción');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrediction();
  }, [predictionId, userAddress]);

  return {
    prediction,
    loading,
    error,
    refetch: loadPrediction,
  };
};

