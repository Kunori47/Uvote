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

      // Obtener todas las predicciones
      const nextId = await predictionMarketService.getPrediction('999999')
        .catch(() => null);
      
      // Si no hay predicciones, retornar vacío
      if (!nextId) {
        setBets([]);
        setLoading(false);
        return;
      }

      const myBets: MyBet[] = [];

      // Iterar por todas las predicciones posibles (limitado a primeras 100)
      for (let i = 1; i <= 100; i++) {
        try {
          const prediction = await predictionMarketService.getPrediction(i.toString());
          
          if (!prediction || prediction.id === '0') {
            break; // No hay más predicciones
          }

          // Verificar si el usuario apostó en esta predicción
          const userBets = await predictionMarketService.getUserBets(i.toString(), userAddress);

          if (userBets.length > 0) {
            // El usuario apostó en esta predicción
            const options = await predictionMarketService.getPredictionOptions(i.toString());
            
            const betsWithOptions = userBets.map(bet => ({
              optionIndex: bet.optionIndex,
              optionDescription: options[bet.optionIndex]?.description || `Opción ${bet.optionIndex}`,
              amount: bet.amount,
              claimed: bet.claimed,
            }));

            const totalBetAmount = userBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0).toFixed(4);

            // Encontrar la opción principal (la que tiene más apuestas del usuario)
            const optionAmounts = betsWithOptions.reduce((acc, bet) => {
              acc[bet.optionIndex] = (acc[bet.optionIndex] || 0) + parseFloat(bet.amount);
              return acc;
            }, {} as Record<number, number>);
            
            const primaryOptionIndex = Object.entries(optionAmounts)
              .sort(([, a], [, b]) => b - a)[0][0];
            const primaryOptionDescription = options[Number(primaryOptionIndex)]?.description || `Opción ${primaryOptionIndex}`;

            // Calcular número total de participantes únicos
            // Nota: sumar totalBettors puede contar a la misma persona múltiples veces si votó en varias opciones
            // Usamos el máximo de totalBettors como estimación más precisa (una persona solo puede votar una vez por opción)
            const totalParticipants = Math.max(...options.map(opt => opt.totalBettors), 0);

            // Verificar si puede reclamar ganancias
            const canClaim = prediction.status === 4 && // Confirmada
              userBets.some(bet => bet.optionIndex === prediction.winningOption && !bet.claimed);

            // Obtener símbolo real del token del creador
            let tokenSymbol = 'uVotes'; // Fallback
            try {
              const tokenInfo = await creatorTokenService.getTokenInfo(prediction.creatorToken);
              tokenSymbol = tokenInfo.symbol;
            } catch (err) {
              console.warn(`Error obteniendo símbolo del token ${prediction.creatorToken}:`, err);
            }

            myBets.push({
              predictionId: prediction.id,
              predictionTitle: prediction.title,
              predictionStatus: prediction.status,
              totalBetAmount,
              bets: betsWithOptions,
              winningOption: prediction.winningOption,
              canClaim,
              creatorTokenSymbol: tokenSymbol,
              closesAt: prediction.closesAt,
              resolvedAt: prediction.resolvedAt,
              totalParticipants,
              totalPool: prediction.totalPool,
              primaryOptionIndex: Number(primaryOptionIndex),
              primaryOptionDescription,
              creatorToken: prediction.creatorToken,
              createdAt: prediction.createdAt,
            });
          }
        } catch (err) {
          // Si falla, probablemente no existe la predicción, continuar
          console.log(`Predicción ${i} no existe o error:`, err);
          break;
        }
      }

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

