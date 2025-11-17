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

  // Load images and tags from Supabase for each prediction
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
              // Load tags if they exist
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

  // Load creator profiles from the database
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
        // Get unique creator addresses
        const uniqueCreators = Array.from(
          new Set(blockchainPredictions.map(pred => pred.creator.toLowerCase()))
        );

        // Load profiles in parallel
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
                // If no user in database, use fallback
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
              // In case of error, use fallback
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

  // Load creator token symbols
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

  // Convert blockchain predictions to the format expected by PredictionCard
  const formattedPredictions: Prediction[] = useMemo(() => {
    return blockchainPredictions.map((pred) => {
      // Calculate readable end date
      // If closesAt is a very large value (type(uint256).max), it's an indefinite prediction
      const MAX_SAFE_TIMESTAMP = 10 ** 15; // A very large but safe value for Date
      let endDate: string;
      
      if (pred.closesAt > MAX_SAFE_TIMESTAMP) {
        // Indefinite prediction (no time limit)
        endDate = 'Indefinite';
      } else {
        try {
          const date = new Date(pred.closesAt * 1000);
          if (isNaN(date.getTime())) {
            endDate = 'Indefinite';
          } else {
            endDate = date.toISOString().split('T')[0];
          }
        } catch {
          endDate = 'Indefinite';
        }
      }
      
      // Format options
      const options = pred.options.map((opt, index) => ({
        id: index.toString(),
        label: opt.description,
        votes: parseFloat(opt.totalAmount),
      }));

      // Determine category: first use tags from Supabase, then fallback to keywords
      let predCategory = 'other';
      const tags = predictionTags[pred.id];
      
      if (tags && tags.length > 0) {
        // If there are tags, use the first tag as the main category
        predCategory = tags[0];
      } else {
        // Fallback: determine category based on keywords in title (only if no tags)
        const title = pred.title.toLowerCase();
        if (title.includes('sport') || title.includes('futbol') || title.includes('madrid')) {
          predCategory = 'sports';
        } else if (title.includes('game') || title.includes('gaming') || title.includes('gta')) {
          predCategory = 'gaming';
        } else if (title.includes('crypto') || title.includes('bitcoin') || title.includes('eth')) {
          predCategory = 'crypto';
        } else if (title.includes('tech') || title.includes('technology') || title.includes('iphone')) {
          predCategory = 'tech';
        }
      }

      // Get creator profile (or use fallback)
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
          verified: true, // TODO: Verify from CreatorTokenFactory if active
        },
        question: pred.title,
        category: predCategory,
        totalPool: parseFloat(pred.totalPool),
        options,
        endDate,
        thumbnail:
          thumbnails[pred.id] ||
          `https://api.dicebear.com/7.x/shapes/svg?seed=${pred.id}`, // Placeholder if no image
        creatorTokenSymbol: predictionTokenSymbols[pred.id] || 'uVotes', // Creator's token symbol
      };
    });
  }, [blockchainPredictions, thumbnails, creatorProfiles, predictionTags, predictionTokenSymbols]);

  // Filter by category (using tags saved in Supabase)
  const filteredPredictions = useMemo(() => {
    // If category is 'todos' or 'trending', show all predictions
    if (category === 'todos' || category === 'trending') {
      return formattedPredictions;
    }
    
    return formattedPredictions.filter((p) => {
      // First check if the category matches directly
      if (p.category === category) {
        return true;
      }
      
      // Also check if any of the prediction's tags match the category
      const tags = predictionTags[p.id];
      if (tags && tags.includes(category)) {
        return true;
      }
      
      return false;
    });
  }, [formattedPredictions, category, predictionTags]);

  // Show loading if loading predictions OR creator profiles OR token symbols
  const isLoading = loading || loadingProfiles || loadingTokenSymbols;

  // Fallback to mocks only if there are no real predictions AND not loading
  const displayPredictions = !isLoading && filteredPredictions.length > 0 
    ? filteredPredictions 
    : (!isLoading && (category === 'todos' || category === 'trending') ? blockchainPredictions : (!isLoading ? blockchainPredictions.filter(p => p.category === category) : []));

  return (
    <div className="p-8">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">
            {loading ? 'Loading predictions from blockchain...' : 'Loading creator information...'}
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-400 mb-2">No predictions available</p>
          <p className="text-slate-500 text-sm">Try creating a new prediction or check back later</p>
        </div>
      ) : displayPredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-400 mb-2">No predictions in this category</p>
          <p className="text-slate-500 text-sm">Create the first prediction</p>
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