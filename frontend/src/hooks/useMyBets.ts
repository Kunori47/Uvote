import { useState, useEffect } from 'react';
import { predictionMarketService, creatorTokenService } from '../lib/contractService';

export interface MyBet {
  predictionId: string;
  predictionTitle: string;
  predictionStatus: number;
  totalBetAmount: string;
  bets: {
    optionIndex: number;
    optionDescription: string;
    amount: string;
    claimed: boolean;
  }[];
  winningOption: number;
  canClaim: boolean;
  creatorTokenSymbol: string;
  closesAt: number;
  resolvedAt: number;
  totalParticipants: number;
  totalPool: string;
  primaryOptionIndex: number; // La opción principal que votó el usuario
  primaryOptionDescription: string;
  creatorToken: string;
  createdAt: number;
  options: { index: number; description: string; totalAmount: string; totalBettors: number }[];
}

export const useMyBets = (userAddress: string | null) => {
  const [bets, setBets] = useState<MyBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBets = async () => {
    if (!userAddress) {
      setBets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 Cargando apuestas del usuario:', userAddress);

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

      // Filter out null/invalid predictions
      const validPredictions = allPredictions.filter((pred) => pred && pred.id !== '0');

      // Now check which predictions the user bet on and load all data in parallel
      const myBets: MyBet[] = (await Promise.all(
        validPredictions.map(async (prediction) => {
          if (!prediction) return null;

          // Check if user has bets on this prediction
          const userBets = await predictionMarketService.getUserBets(prediction.id, userAddress);

          if (userBets.length === 0) return null; // User didn't bet here

          // Load options and token info in parallel
          const [options, tokenInfo] = await Promise.all([
            predictionMarketService.getPredictionOptions(prediction.id),
            creatorTokenService.getTokenInfo(prediction.creatorToken).catch(() => ({ symbol: 'uVotes' }))
          ]);

          const betsWithOptions = userBets.map(bet => ({
            optionIndex: bet.optionIndex,
            optionDescription: options[bet.optionIndex]?.description || `Opción ${bet.optionIndex}`,
            amount: bet.amount,
            claimed: bet.claimed,
          }));

          const totalBetAmount = userBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0).toFixed(4);

          // Find primary option (the one with most bets from this user)
          const optionAmounts = betsWithOptions.reduce((acc, bet) => {
            acc[bet.optionIndex] = (acc[bet.optionIndex] || 0) + parseFloat(bet.amount);
            return acc;
          }, {} as Record<number, number>);

          const primaryOptionIndex = Number(Object.entries(optionAmounts)
            .sort(([, a], [, b]) => (b as number) - (a as number))[0][0]);
          const primaryOptionDescription = options[primaryOptionIndex]?.description || `Opción ${primaryOptionIndex}`;

          // Calculate total participants
          const totalParticipants = Math.max(...options.map(opt => opt.totalBettors), 0);

          // Check if can claim winnings
          const canClaim = prediction.status === 4 && // Confirmed
            userBets.some(bet => bet.optionIndex === prediction.winningOption && !bet.claimed);

          return {
            predictionId: prediction.id,
            predictionTitle: prediction.title,
            predictionStatus: prediction.status,
            totalBetAmount,
            bets: betsWithOptions,
            winningOption: prediction.winningOption,
            canClaim,
            creatorTokenSymbol: tokenInfo.symbol,
            closesAt: prediction.closesAt,
            resolvedAt: prediction.resolvedAt,
            totalParticipants,
            totalPool: prediction.totalPool,
            primaryOptionIndex,
            primaryOptionDescription,
            creatorToken: prediction.creatorToken,
            createdAt: prediction.createdAt,
            options,
          };
        })
      )).filter((bet): bet is MyBet => bet !== null);

      console.log(`✅ Encontradas ${myBets.length} apuestas`);
      setBets(myBets);
    } catch (err: any) {
      console.error('Error cargando apuestas:', err);
      setError(err.message || 'Error al cargar apuestas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBets();
  }, [userAddress]);

  return { bets, loading, error, refetch: loadBets };
};

