import { useState, useEffect } from 'react';
import { predictionMarketService } from '../lib/contractService';

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

      const creatorPredictions: CreatorPrediction[] = [];

      // Iterar por todas las predicciones posibles (limitado a primeras 100)
      for (let i = 1; i <= 100; i++) {
        try {
          const prediction = await predictionMarketService.getPrediction(i.toString());
          
          if (!prediction || prediction.id === '0') {
            break; // No hay más predicciones
          }

          // Verificar si esta predicción es del creador
          if (prediction.creator.toLowerCase() === creatorAddress.toLowerCase()) {
            const options = await predictionMarketService.getPredictionOptions(i.toString());
            
            const participantCount = options.reduce((sum, opt) => sum + opt.totalBettors, 0);

            creatorPredictions.push({
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
            });
          }
        } catch (err) {
          // Si falla, probablemente no existe la predicción, continuar
          console.log(`Predicción ${i} no existe o error:`, err);
          break;
        }
      }

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

