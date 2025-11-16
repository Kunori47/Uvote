import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PredictionCard } from './PredictionCard';
import { usePredictions } from '../hooks/usePredictions';
import { apiService } from '../lib/apiService';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../lib/contracts';

interface PredictionOption {
  id: string;
  label: string;
  votes: number;
}

interface Prediction {
  id: string;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  question: string;
  category: string;
  totalPool: number;
  options: PredictionOption[];
  endDate: string;
  thumbnail: string;
}

const mockPredictions: Prediction[] = [
  {
    id: '1',
    creator: {
      name: 'Ibai',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿Ganará el Real Madrid la Champions League este año?',
    category: 'sports',
    totalPool: 45000,
    options: [
      { id: 'yes', label: 'Sí', votes: 28000 },
      { id: 'no', label: 'No', votes: 17000 },
    ],
    endDate: '2025-06-01',
    thumbnail: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=400&fit=crop',
  },
  {
    id: '2',
    creator: {
      name: 'ElRubius',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿GTA 6 se lanzará en 2025?',
    category: 'gaming',
    totalPool: 32000,
    options: [
      { id: 'yes', label: 'Sí', votes: 8000 },
      { id: 'no', label: 'No', votes: 24000 },
    ],
    endDate: '2025-12-31',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop',
  },
  {
    id: '3',
    creator: {
      name: 'CryptoExpert',
      avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿Bitcoin superará los $100,000 este año?',
    category: 'crypto',
    totalPool: 78000,
    options: [
      { id: 'yes', label: 'Sí', votes: 52000 },
      { id: 'no', label: 'No', votes: 26000 },
    ],
    endDate: '2025-12-31',
    thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop',
  },
  {
    id: '4',
    creator: {
      name: 'TechGuru',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      verified: false,
    },
    question: '¿Apple lanzará iPhone plegable en 2026?',
    category: 'tech',
    totalPool: 15000,
    options: [
      { id: 'yes', label: 'Sí', votes: 9000 },
      { id: 'no', label: 'No', votes: 6000 },
    ],
    endDate: '2026-01-01',
    thumbnail: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=400&fit=crop',
  },
  {
    id: '5',
    creator: {
      name: 'Deportes Pro',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿Quién ganará el Balón de Oro este año?',
    category: 'sports',
    totalPool: 95000,
    options: [
      { id: 'messi', label: 'Messi', votes: 20000 },
      { id: 'cristiano', label: 'Cristiano', votes: 15000 },
      { id: 'mbappe', label: 'Mbappé', votes: 35000 },
      { id: 'haaland', label: 'Haaland', votes: 25000 },
    ],
    endDate: '2025-10-30',
    thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop',
  },
  {
    id: '6',
    creator: {
      name: 'Gaming Zone',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿Qué juego será el más vendido en 2025?',
    category: 'gaming',
    totalPool: 62000,
    options: [
      { id: 'gta6', label: 'GTA 6', votes: 28000 },
      { id: 'cod', label: 'Call of Duty', votes: 12000 },
      { id: 'fifa', label: 'EA FC 26', votes: 10000 },
      { id: 'zelda', label: 'Zelda', votes: 12000 },
    ],
    endDate: '2025-12-31',
    thumbnail: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=600&h=400&fit=crop',
  },
];

interface PredictionFeedProps {
  category: string;
  onViewPrediction?: (id: string) => void;
}

export function PredictionFeed({ category, onViewPrediction }: PredictionFeedProps) {
  const { predictions: blockchainPredictions, loading, error } = usePredictions();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Cargar imágenes desde Supabase para cada predicción
  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      if (!blockchainPredictions || blockchainPredictions.length === 0) {
        setThumbnails({});
        return;
      }

      try {
        const entries: Array<[string, string]> = [];

        await Promise.all(
          blockchainPredictions.map(async (pred) => {
            const img = await apiService.getPredictionImage(
              pred.id,
              CONTRACT_ADDRESSES.PredictionMarket,
              NETWORK_CONFIG.chainId
            );
            if (img && img.image_url) {
              entries.push([pred.id, img.image_url as string]);
            }
          })
        );

        if (!cancelled) {
          const map: Record<string, string> = {};
          for (const [id, url] of entries) {
            map[id] = url;
          }
          setThumbnails(map);
        }
      } catch (e) {
        console.error('Error loading prediction thumbnails:', e);
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [blockchainPredictions]);

  // Convertir predicciones de blockchain al formato esperado por PredictionCard
  const formattedPredictions: Prediction[] = useMemo(() => {
    return blockchainPredictions.map((pred) => {
      // Calcular fecha de fin legible
      // Si closesAt es un valor muy grande (type(uint256).max), es una predicción indefinida
      const MAX_SAFE_TIMESTAMP = 10 ** 15; // Un valor muy grande pero seguro para Date
      let endDate: string;
      
      if (pred.closesAt > MAX_SAFE_TIMESTAMP) {
        // Predicción indefinida (sin tiempo límite)
        endDate = 'Indefinida';
      } else {
        try {
          const date = new Date(pred.closesAt * 1000);
          if (isNaN(date.getTime())) {
            endDate = 'Indefinida';
          } else {
            endDate = date.toISOString().split('T')[0];
          }
        } catch {
          endDate = 'Indefinida';
        }
      }
      
      // Formatear opciones
      const options = pred.options.map((opt, index) => ({
        id: index.toString(),
        label: opt.description,
        votes: parseFloat(opt.totalAmount),
      }));

      // Determinar categoría basada en keywords en el título (temporal)
      let predCategory = 'other';
      const title = pred.title.toLowerCase();
      if (title.includes('deporte') || title.includes('fútbol') || title.includes('madrid')) {
        predCategory = 'sports';
      } else if (title.includes('juego') || title.includes('gaming') || title.includes('gta')) {
        predCategory = 'gaming';
      } else if (title.includes('crypto') || title.includes('bitcoin') || title.includes('eth')) {
        predCategory = 'crypto';
      } else if (title.includes('tech') || title.includes('tecnología') || title.includes('iphone')) {
        predCategory = 'tech';
      }

      return {
        id: pred.id,
        creator: {
          name: `${pred.creator.slice(0, 6)}...${pred.creator.slice(-4)}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pred.creator}`,
          verified: true, // TODO: Verificar desde CreatorTokenFactory si está activo
        },
        question: pred.title,
        category: predCategory,
        totalPool: parseFloat(pred.totalPool),
        options,
        endDate,
        thumbnail:
          thumbnails[pred.id] ||
          `https://api.dicebear.com/7.x/shapes/svg?seed=${pred.id}`, // Placeholder si no hay imagen
      };
    });
  }, [blockchainPredictions, thumbnails]);

  // Filtrar por categoría
  const filteredPredictions = useMemo(() => {
    if (category === 'trending') {
      return formattedPredictions;
    }
    return formattedPredictions.filter((p) => p.category === category);
  }, [formattedPredictions, category]);

  // Fallback a mocks si no hay predicciones reales (para desarrollo)
  const displayPredictions = filteredPredictions.length > 0 
    ? filteredPredictions 
    : (category === 'trending' ? mockPredictions : mockPredictions.filter(p => p.category === category));

  return (
    <div className="p-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Cargando predicciones desde blockchain...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-red-400 mb-2">Error al cargar predicciones</p>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      ) : displayPredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-400 mb-2">No hay predicciones en esta categoría</p>
          <p className="text-slate-500 text-sm">Crea la primera predicción</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 max-w-[1800px]">
          {displayPredictions.map((prediction) => (
            <PredictionCard 
              key={prediction.id} 
              prediction={prediction} 
              onClick={() => onViewPrediction?.(prediction.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}