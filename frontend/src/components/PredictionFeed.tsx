import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PredictionCard } from './PredictionCard';
import { usePredictions } from '../hooks/usePredictions';
import { apiService } from '../lib/apiService';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../lib/contracts';
import { predictionMarketService, creatorTokenService } from '../lib/contractService';

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
  const [predictionTags, setPredictionTags] = useState<Record<string, string[]>>({});
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, {
    displayName: string;
    avatarUrl: string;
  }>>({});
  const [predictionTokenSymbols, setPredictionTokenSymbols] = useState<Record<string, string>>({});
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingTokenSymbols, setLoadingTokenSymbols] = useState(false);

  // Cargar imágenes y tags desde Supabase para cada predicción
  useEffect(() => {
    let cancelled = false;

    const loadImagesAndTags = async () => {
      if (!blockchainPredictions || blockchainPredictions.length === 0) {
        setThumbnails({});
        setPredictionTags({});
        return;
      }

      try {
        const imageEntries: Array<[string, string]> = [];
        const tagEntries: Array<[string, string[]]> = [];

        await Promise.all(
          blockchainPredictions.map(async (pred) => {
            const img = await apiService.getPredictionImage(
              pred.id,
              CONTRACT_ADDRESSES.PredictionMarket,
              NETWORK_CONFIG.chainId
            );
            if (img) {
              if (img.image_url) {
                imageEntries.push([pred.id, img.image_url as string]);
              }
              // Cargar tags si existen
              if (img.tags && Array.isArray(img.tags) && img.tags.length > 0) {
                tagEntries.push([pred.id, img.tags as string[]]);
              }
            }
          })
        );

        if (!cancelled) {
          const imageMap: Record<string, string> = {};
          for (const [id, url] of imageEntries) {
            imageMap[id] = url;
          }
          setThumbnails(imageMap);

          const tagMap: Record<string, string[]> = {};
          for (const [id, tags] of tagEntries) {
            tagMap[id] = tags;
          }
          setPredictionTags(tagMap);
        }
      } catch (e) {
        console.error('Error loading prediction thumbnails and tags:', e);
      }
    };

    loadImagesAndTags();

    return () => {
      cancelled = true;
    };
  }, [blockchainPredictions]);

  // Cargar perfiles de creadores desde la BD
  useEffect(() => {
    let cancelled = false;

    const loadCreatorProfiles = async () => {
      if (!blockchainPredictions || blockchainPredictions.length === 0) {
        setCreatorProfiles({});
        setLoadingProfiles(false);
        return;
      }

      try {
        setLoadingProfiles(true);
        // Obtener direcciones únicas de creadores
        const uniqueCreators = Array.from(
          new Set(blockchainPredictions.map(pred => pred.creator.toLowerCase()))
        );

        // Cargar perfiles en paralelo
        const profileEntries: Array<[string, { displayName: string; avatarUrl: string }]> = [];

        await Promise.all(
          uniqueCreators.map(async (creatorAddress) => {
            try {
              const user = await apiService.getUser(creatorAddress);
              
              if (user) {
                const displayName =
                  user.display_name ||
                  (user.username ? `@${user.username}` : `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`);
                const avatarUrl =
                  user.profile_image_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorAddress}`;
                
                profileEntries.push([creatorAddress.toLowerCase(), { displayName, avatarUrl }]);
              } else {
                // Si no hay usuario en BD, usar fallback
                const shortAddr = `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`;
                profileEntries.push([
                  creatorAddress.toLowerCase(),
                  {
                    displayName: shortAddr,
                    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorAddress}`,
                  },
                ]);
              }
            } catch (e) {
              // En caso de error, usar fallback
              console.error(`Error loading creator profile for ${creatorAddress}:`, e);
              const shortAddr = `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`;
              profileEntries.push([
                creatorAddress.toLowerCase(),
                {
                  displayName: shortAddr,
                  avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorAddress}`,
                },
              ]);
            }
          })
        );

        if (!cancelled) {
          const map: Record<string, { displayName: string; avatarUrl: string }> = {};
          for (const [address, profile] of profileEntries) {
            map[address] = profile;
          }
          setCreatorProfiles(map);
          setLoadingProfiles(false);
        }
      } catch (e) {
        console.error('Error loading creator profiles:', e);
        if (!cancelled) {
          setLoadingProfiles(false);
        }
      }
    };

    loadCreatorProfiles();

    return () => {
      cancelled = true;
    };
  }, [blockchainPredictions]);

  // Cargar símbolos de tokens de creadores
  useEffect(() => {
    let cancelled = false;

    const loadTokenSymbols = async () => {
      if (!blockchainPredictions || blockchainPredictions.length === 0) {
        setPredictionTokenSymbols({});
        setLoadingTokenSymbols(false);
        return;
      }

      try {
        setLoadingTokenSymbols(true);
        const symbolMap: Record<string, string> = {};

        await Promise.all(
          blockchainPredictions.map(async (pred) => {
            try {
              const predictionData = await predictionMarketService.getPrediction(pred.id);
              if (predictionData && predictionData.creatorToken) {
                const tokenInfo = await creatorTokenService.getTokenInfo(predictionData.creatorToken);
                symbolMap[pred.id] = tokenInfo.symbol;
              } else {
                symbolMap[pred.id] = 'uVotes'; // Fallback
              }
            } catch (err) {
              console.error(`Error loading token symbol for prediction ${pred.id}:`, err);
              symbolMap[pred.id] = 'uVotes'; // Fallback
            }
          })
        );

        if (!cancelled) {
          setPredictionTokenSymbols(symbolMap);
          setLoadingTokenSymbols(false);
        }
      } catch (e) {
        console.error('Error loading token symbols:', e);
        if (!cancelled) {
          setLoadingTokenSymbols(false);
        }
      }
    };

    loadTokenSymbols();

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

      // Determinar categoría: primero usar tags desde Supabase, luego fallback a keywords
      let predCategory = 'other';
      const tags = predictionTags[pred.id];
      
      if (tags && tags.length > 0) {
        // Si hay tags, usar el primer tag como categoría principal
        predCategory = tags[0];
      } else {
        // Fallback: determinar categoría basada en keywords en el título (solo si no hay tags)
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
      }

      // Obtener perfil del creador (o usar fallback)
      const creatorAddressLower = pred.creator.toLowerCase();
      const creatorProfile = creatorProfiles[creatorAddressLower] || {
        displayName: `${pred.creator.slice(0, 6)}...${pred.creator.slice(-4)}`,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${pred.creator}`,
      };

      return {
        id: pred.id,
        creator: {
          name: creatorProfile.displayName,
          avatar: creatorProfile.avatarUrl,
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
        creatorTokenSymbol: predictionTokenSymbols[pred.id] || 'uVotes', // Símbolo del token del creador
      };
    });
  }, [blockchainPredictions, thumbnails, creatorProfiles, predictionTags, predictionTokenSymbols]);

  // Filtrar por categoría (usando tags guardados en Supabase)
  const filteredPredictions = useMemo(() => {
    // Si la categoría es 'todos' o 'trending', mostrar todas las predicciones
    if (category === 'todos' || category === 'trending') {
      return formattedPredictions;
    }
    
    return formattedPredictions.filter((p) => {
      // Primero verificar si la categoría coincide directamente
      if (p.category === category) {
        return true;
      }
      
      // También verificar si alguno de los tags de la predicción coincide con la categoría
      const tags = predictionTags[p.id];
      if (tags && tags.includes(category)) {
        return true;
      }
      
      return false;
    });
  }, [formattedPredictions, category, predictionTags]);

  // Mostrar loading si está cargando predicciones O perfiles de creadores O símbolos de tokens
  const isLoading = loading || loadingProfiles || loadingTokenSymbols;

  // Fallback a mocks solo si no hay predicciones reales Y no está cargando
  const displayPredictions = !isLoading && filteredPredictions.length > 0 
    ? filteredPredictions 
    : (!isLoading && (category === 'todos' || category === 'trending') ? mockPredictions : (!isLoading ? mockPredictions.filter(p => p.category === category) : []));

  return (
    <div className="p-8">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">
            {loading ? 'Cargando predicciones desde blockchain...' : 'Cargando información de creadores...'}
          </p>
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