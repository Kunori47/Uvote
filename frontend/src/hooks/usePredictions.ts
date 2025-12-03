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

      // Get predictions in BATCHES to avoid rate limiting
      const BATCH_SIZE = 5; // Process 5 at a time (reduced for public RPC)
      const predictionsData = [];

      for (let batchStart = 1; batchStart <= totalPredictions; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPredictions);
        const batchPromises = [];

        for (let i = batchStart; i <= batchEnd; i++) {
          batchPromises.push(predictionMarket.predictions(i));
        }

        const batchResults = await Promise.all(batchPromises);
        predictionsData.push(...batchResults);

        // Increased delay between batches for public RPC (150ms)
        if (batchEnd < totalPredictions) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      // Format predictions - also batch the options loading
      const formattedPredictions: PredictionData[] = [];

      for (let batchStart = 0; batchStart < predictionsData.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, predictionsData.length);
        const batchPredictions = predictionsData.slice(batchStart, batchEnd);

        const formattedBatch = await Promise.all(
          batchPredictions.map(async (pred, relativeIndex) => {
            const predictionId = batchStart + relativeIndex + 1;

            // Obtener las opciones
            const options: PredictionOption[] = [];
            let optionIndex = 0;
            let hasMoreOptions = true;

            while (hasMoreOptions) {
              try {
                const option = await predictionMarket.getBetOption(predictionId, optionIndex);
                options.push({
                  description: option[0],
                  totalAmount: formatEther(option[1]),
                  totalBettors: Number(option[2]),
                });
                optionIndex++;
              } catch {
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

        formattedPredictions.push(...formattedBatch);

        // Increased delay between batches for public RPC (150ms)
        if (batchEnd < predictionsData.length) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

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

