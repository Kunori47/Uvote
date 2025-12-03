import { useState, useEffect } from 'react';
import { predictionMarketService, creatorTokenService } from '../lib/contractService';

export interface CreatorPrediction {
  id: string;
  title: string;
  description: string;
  status: number;
  totalPool: string;
  createdAt: number;
  closesAt: number;
  resolvedAt: number;
  winningOption: number;
  reportCount: number;
  cooldownEndsAt: number;
  optionsCount: number;
  participantCount: number;
  options: { index: number; description: string; totalAmount: string; totalBettors: number }[];
  creatorTokenSymbol: string;
  creatorToken: string;
}

export const useCreatorPredictions = (creatorAddress: string | null) => {
  const [predictions, setPredictions] = useState<CreatorPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPredictions = async () => {
    if (!creatorAddress) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 Cargando predicciones del creador:', creatorAddress);

      // Get actual number of predictions from contract
      const nextId = await predictionMarketService.getPrediction('999999').catch(() => null);
      if (!nextId) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      // Determine how many predictions to check (reasonable limit)
      const maxToCheck = 50; // Reduced from 100 to avoid rate limits

      // Get all predictions in BATCHES to avoid rate limiting
      const BATCH_SIZE = 5; // Process 5 at a time (reduced for public RPC)
      const allPredictions = [];

      for (let batchStart = 1; batchStart <= maxToCheck; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, maxToCheck);
        const batchPromises = [];

        for (let i = batchStart; i <= batchEnd; i++) {
          batchPromises.push(
            predictionMarketService.getPrediction(i.toString())
              .catch(() => null)
          );
        }

        const batchResults = await Promise.all(batchPromises);
        allPredictions.push(...batchResults);

        // Increased delay between batches for public RPC (150ms)
        if (batchEnd < maxToCheck) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      // Filter out null/invalid predictions and match creator
      const validPredictions = allPredictions.filter(
        (pred) => pred && pred.id !== '0' && pred.creator.toLowerCase() === creatorAddress.toLowerCase()
      );

      // Now load options and token info in parallel for all creator predictions
      const creatorPredictions: CreatorPrediction[] = await Promise.all(
        validPredictions.map(async (prediction) => {
          if (!prediction) return null; // TypeScript guard

          // Load options and token info in parallel
          const [options, tokenInfo] = await Promise.all([
            predictionMarketService.getPredictionOptions(prediction.id),
            creatorTokenService.getTokenInfo(prediction.creatorToken).catch(() => ({ symbol: 'uVotes' }))
          ]);

          const participantCount = options.reduce((sum, opt) => sum + opt.totalBettors, 0);

          return {
            id: prediction.id,
            title: prediction.title,
            description: prediction.description,
            status: prediction.status,
            totalPool: prediction.totalPool,
            createdAt: prediction.createdAt,
            closesAt: prediction.closesAt,
            resolvedAt: prediction.resolvedAt,
            winningOption: prediction.winningOption,
            reportCount: prediction.reportCount,
            cooldownEndsAt: prediction.cooldownEndsAt,
            optionsCount: options.length,
            participantCount,
            options,
            creatorTokenSymbol: tokenInfo.symbol,
            creatorToken: prediction.creatorToken,
          };
        })
      ).then(results => results.filter((p): p is CreatorPrediction => p !== null));

      console.log(`✅ Encontradas ${creatorPredictions.length} predicciones del creador`);
      setPredictions(creatorPredictions);
    } catch (err: any) {
      console.error('Error cargando predicciones del creador:', err);
      setError(err.message || 'Error al cargar predicciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [creatorAddress]);

  return { predictions, loading, error, refetch: loadPredictions };
};

