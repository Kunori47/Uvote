import { useState, useEffect } from 'react';
import { ethers, Contract, formatEther } from 'ethers';
import { CONTRACT_ADDRESSES, getProvider } from '../lib/contracts';
import PredictionMarketABI from '../lib/abis/PredictionMarket.json';

export interface PredictionOption {
  description: string;
  totalAmount: string;
  totalBettors: number;
}

export interface PredictionData {
  id: string;
  creator: string;
  creatorToken: string;
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
}

export const usePredictions = () => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = getProvider();
      const predictionMarket = new Contract(
        CONTRACT_ADDRESSES.PredictionMarket,
        PredictionMarketABI,
        provider
      );

      // Obtener el nextPredictionId para saber cuántas predicciones hay
      const nextId = await predictionMarket.nextPredictionId();
      const totalPredictions = Number(nextId) - 1;

      if (totalPredictions === 0) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      // Obtener todas las predicciones en paralelo
      const predictionPromises = [];
      for (let i = 1; i <= totalPredictions; i++) {
        predictionPromises.push(predictionMarket.predictions(i));
      }

      const predictionsData = await Promise.all(predictionPromises);

      // Formatear las predicciones
      const formattedPredictions: PredictionData[] = await Promise.all(
        predictionsData.map(async (pred, index) => {
          const predictionId = index + 1;
          
          // Obtener las opciones (necesitamos llamar a getOptions o similar)
          // Como el contrato no tiene getter para options[], las obtendremos iterando
          const options: PredictionOption[] = [];
          let optionIndex = 0;
          let hasMoreOptions = true;

          while (hasMoreOptions) {
            try {
              // Intentar obtener la opción en este índice
              const option = await predictionMarket.getBetOption(predictionId, optionIndex);
              options.push({
                description: option[0], // description
                totalAmount: formatEther(option[1]), // totalAmount
                totalBettors: Number(option[2]), // totalBettors
              });
              optionIndex++;
            } catch {
              // Si falla, no hay más opciones
              hasMoreOptions = false;
            }
          }

          return {
            id: predictionId.toString(),
            creator: pred.creator,
            creatorToken: pred.creatorToken,
            title: pred.title,
            description: pred.description,
            options,
            createdAt: Number(pred.createdAt),
            closesAt: Number(pred.closesAt),
            resolvedAt: Number(pred.resolvedAt),
            status: Number(pred.status),
            winningOption: Number(pred.winningOption),
            cooldownEndsAt: Number(pred.cooldownEndsAt),
            reportCount: Number(pred.reportCount),
            totalPool: formatEther(pred.totalPool),
          };
        })
      );

      setPredictions(formattedPredictions);
    } catch (err: any) {
      console.error('Error fetching predictions:', err);
      setError(err.message || 'Error al obtener predicciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();

    // Escuchar eventos de nuevas predicciones
    const provider = getProvider();
    const predictionMarket = new Contract(
      CONTRACT_ADDRESSES.PredictionMarket,
      PredictionMarketABI,
      provider
    );

    const handlePredictionCreated = () => {
      console.log('Nueva predicción creada, actualizando...');
      fetchPredictions();
    };

    const handlePredictionResolved = () => {
      console.log('Predicción resuelta, actualizando...');
      fetchPredictions();
    };

    // Suscribirse a eventos
    predictionMarket.on('PredictionCreated', handlePredictionCreated);
    predictionMarket.on('PredictionResolved', handlePredictionResolved);

    // Cleanup
    return () => {
      predictionMarket.off('PredictionCreated', handlePredictionCreated);
      predictionMarket.off('PredictionResolved', handlePredictionResolved);
    };
  }, []);

  return {
    predictions,
    loading,
    error,
    refetch: fetchPredictions,
  };
};

