import { useState, useMemo, useEffect } from 'react';
import { Plus, Filter, Calendar, CheckCircle2, Clock, Users, TrendingUp, AlertCircle, Loader2, Wallet, BarChart3, X, Share2, Edit, Eye } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useCreatorPredictions } from '../hooks/useCreatorPredictions';
import { predictionMarketService, creatorTokenService } from '../lib/contractService';
import { apiService } from '../lib/apiService';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../lib/contracts';

const STATUS_NAMES = ['Active', 'Closed', 'Cooldown', 'Under Review', 'Confirmed', 'Disputed', 'Cancelled'];
const STATUS_COLORS = ['emerald', 'slate', 'yellow', 'orange', 'green', 'red', 'gray'];
const STATUS_ICONS = [Clock, CheckCircle2, Clock, AlertCircle, CheckCircle2, AlertCircle, CheckCircle2];

// Option colors (same as in PredictionCard)
const optionColors = [
  { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500', bgBar: 'bg-emerald-500' },
  { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-500', bgBar: 'bg-red-500' },
  { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500', bgBar: 'bg-blue-500' },
  { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-500', bgBar: 'bg-amber-500' },
  { border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-500', bgBar: 'bg-orange-500' },
  { border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-500', bgBar: 'bg-purple-500' },
];

// Helper to get option color
const getColorForOption = (label: string, index: number) => {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel === 'yes' || normalizedLabel === 'si') {
    return optionColors[0]; // Green for Yes
  }
  if (normalizedLabel === 'no') {
    return optionColors[1]; // Red for No
  }
  return optionColors[index % optionColors.length];
};

// Category mapping to English names
const categoryNames: Record<string, string> = {
  'sports': 'Sports',
  'gaming': 'Gaming',
  'crypto': 'Crypto',
  'tech': 'Tech',
  'politics': 'Politics',
  'entertainment': 'Entertainment',
  'finance': 'Finance',
  'science': 'Science',
  'music': 'Music',
  'fashion': 'Fashion',
  'food': 'Food',
  'other': 'Other',
};

// Status filters are now generated dynamically with real statistics

interface MyUVotesPageProps {
  onViewPrediction: (id: string) => void;
  onCreatePrediction?: () => void;
}

export function MyUVotesPage({ onViewPrediction, onCreatePrediction }: MyUVotesPageProps) {
  const { address, isConnected } = useWallet();
  const { predictions, loading, error } = useCreatorPredictions(address);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [predictionImages, setPredictionImages] = useState<Record<string, string>>({});
  const [predictionTags, setPredictionTags] = useState<Record<string, string[]>>({});
  const [predictionOptions, setPredictionOptions] = useState<Record<string, Array<{ description: string; totalAmount: string; totalBettors: number }>>>({});
  const [predictionTokenSymbols, setPredictionTokenSymbols] = useState<Record<string, string>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load images, tags and prediction options
  useEffect(() => {
    const loadPredictionMetadata = async () => {
      if (predictions.length === 0) {
        setPredictionImages({});
        setPredictionTags({});
        setPredictionOptions({});
        setPredictionTokenSymbols({});
      return;
    }
    
    try {
        setLoadingMetadata(true);
        const imageMap: Record<string, string> = {};
        const tagMap: Record<string, string[]> = {};
        const optionsMap: Record<string, Array<{ description: string; totalAmount: string; totalBettors: number }>> = {};
        const tokenSymbolMap: Record<string, string> = {};

        await Promise.all(
          predictions.map(async (pred) => {
            // Load image and tags
            try {
              const img = await apiService.getPredictionImage(
                pred.id,
                CONTRACT_ADDRESSES.PredictionMarket,
                NETWORK_CONFIG.chainId
              );
              if (img) {
                if (img.image_url) {
                  imageMap[pred.id] = img.image_url as string;
                }
                if (img.tags && Array.isArray(img.tags) && img.tags.length > 0) {
                  tagMap[pred.id] = img.tags as string[];
                }
              }
            } catch (err) {
              console.error(`Error loading image for prediction ${pred.id}:`, err);
            }

            // Load options
            try {
              const options = await predictionMarketService.getPredictionOptions(pred.id);
              optionsMap[pred.id] = options;
            } catch (err) {
              console.error(`Error loading options for prediction ${pred.id}:`, err);
            }

            // Load creator token symbol
            try {
              const predictionData = await predictionMarketService.getPrediction(pred.id);
              if (predictionData && predictionData.creatorToken) {
                const tokenInfo = await creatorTokenService.getTokenInfo(predictionData.creatorToken);
                tokenSymbolMap[pred.id] = tokenInfo.symbol;
              } else {
                tokenSymbolMap[pred.id] = 'uVotes'; // Fallback
              }
            } catch (err) {
              console.error(`Error loading token symbol for prediction ${pred.id}:`, err);
              tokenSymbolMap[pred.id] = 'uVotes'; // Fallback
            }
          })
        );

        setPredictionImages(imageMap);
        setPredictionTags(tagMap);
        setPredictionOptions(optionsMap);
        setPredictionTokenSymbols(tokenSymbolMap);
      } catch (err) {
        console.error('Error loading prediction metadata:', err);
    } finally {
        setLoadingMetadata(false);
      }
    };

    loadPredictionMetadata();
  }, [predictions]);

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Format end date
  const formatEndDate = (timestamp: number) => {
    if (timestamp === 0 || timestamp >= 2**256 - 1) return '∞';
    const date = new Date(timestamp * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Format number with thousands separators
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  // Filter predictions
  const filteredPredictions = useMemo(() => {
    return predictions.filter((pred) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && pred.status !== 0) return false;
        if (statusFilter === 'closed' && pred.status !== 1) return false;
        if (statusFilter === 'cooldown' && pred.status !== 2) return false;
        if (statusFilter === 'finished' && pred.status !== 4) return false;
      }
      return true;
    });
  }, [predictions, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalPool = predictions.reduce((sum, pred) => sum + parseFloat(pred.totalPool), 0);
    const totalParticipants = predictions.reduce((sum, pred) => sum + pred.participantCount, 0);
    const activePredictions = predictions.filter(p => p.status === 0).length;
    const closedPredictions = predictions.filter(p => p.status === 1).length;
    const cooldownPredictions = predictions.filter(p => p.status === 2).length;
    const finishedPredictions = predictions.filter(p => p.status === 4).length;
    
      // Creators don't earn from predictions, only from token sales
    const estimatedEarnings = 0;

    return {
      total: predictions.length,
      active: activePredictions,
      closed: closedPredictions,
      cooldown: cooldownPredictions,
      finished: finishedPredictions,
      totalPool: totalPool.toFixed(2),
      totalParticipants,
      estimatedEarnings: estimatedEarnings.toFixed(2),
    };
  }, [predictions]);

  // Generate filters dynamically with real statistics
  const statusFilters = useMemo(() => [
    { id: 'all', label: 'All' },
    { id: 'active', label: `Active (${stats.active})` },
    { id: 'closed', label: `Closed (${stats.closed})` },
    { id: 'cooldown', label: `Cooldown (${stats.cooldown})` },
    { id: 'finished', label: `Finished (${stats.finished})` },
  ], [stats]);

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Wallet className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Wallet not connected</h2>
          <p className="text-slate-400">Connect your wallet to see your creator dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Loading your predictions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Error</h2>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Creator Dashboard</h1>
            <p className="text-slate-400">Manage and monitor your predictions</p>
          </div>
          <button
            onClick={() => onCreatePrediction?.()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Prediction
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Total</div>
            <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Active</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Closed</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.closed}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Finished</div>
            <div className="text-2xl font-bold text-blue-400">{stats.finished}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Total Pool</div>
            <div className="text-2xl font-bold text-purple-400">{stats.totalPool}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Participants</div>
            <div className="text-2xl font-bold text-slate-100">{stats.totalParticipants}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Earnings</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.estimatedEarnings}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-all"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 mb-4">
            <div className="text-slate-400 text-sm mb-2">Status</div>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    statusFilter === filter.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Predictions List */}
      {filteredPredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <BarChart3 className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-300 mb-2">No predictions</h3>
          <p className="text-slate-500 mb-6">
            {predictions.length === 0 
              ? 'You haven\'t created any predictions yet'
              : 'No predictions match the filters'}
          </p>
          {predictions.length === 0 && (
            <button
              onClick={() => onCreatePrediction?.()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Prediction
            </button>
          )}
        </div>
      ) : loadingMetadata ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Loading prediction information...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPredictions.map((pred) => {
            const statusColor = STATUS_COLORS[pred.status];
            const isActive = pred.status === 0;
            const imageUrl = predictionImages[pred.id] || `https://api.dicebear.com/7.x/shapes/svg?seed=${pred.id}`;
            const tags = predictionTags[pred.id] || [];
            const primaryTag = tags[0] || 'other';
            const options = predictionOptions[pred.id] || [];
            const totalPool = parseFloat(pred.totalPool);
            const tokenSymbol = predictionTokenSymbols[pred.id] || 'uVotes';
            
            return (
              <div
                key={pred.id}
                onClick={() => onViewPrediction(pred.id)}
                className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden hover:bg-slate-900/70 hover:border-slate-700/50 transition-all cursor-pointer flex"
              >
                {/* Prediction image - Left */}
                <div className="relative w-80 h-64 bg-slate-800/50 flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={pred.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target;
                      if (target && 'src' in target) {
                        (target as { src: string }).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${pred.id}`;
                      }
                    }}
                  />
                  
                </div>

                {/* Content - Right */}
                <div className="flex-1 flex flex-col justify-between p-6 min-w-0">
                  {/* Upper section */}
                  <div className="space-y-4">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold text-slate-100 line-clamp-2 leading-tight flex-1">
                      {pred.title}
                    </h3>
                      {/* Status in top right corner */}
                      <div className="flex-shrink-0">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                          isActive
                            ? 'bg-blue-500/90 backdrop-blur-sm text-white'
                            : 'bg-slate-900/90 backdrop-blur-sm text-slate-300 border border-slate-700/50'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                        {STATUS_NAMES[pred.status]}
                    </div>
                  </div>
                </div>

                    {/* Metadata: Category and Date */}
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300">
                        {categoryNames[primaryTag] || primaryTag}
                      </span>
                      <span className="text-slate-500">
                        {formatDate(pred.createdAt)}
                      </span>
                    </div>

                    {/* Voting options with progress bars */}
                    {options.length > 0 && (
                      <div className="space-y-3">
                        {options.map((option, index) => {
                          const optionAmount = parseFloat(option.totalAmount);
                          const percentage = totalPool > 0 ? (optionAmount / totalPool) * 100 : 0;
                          const color = getColorForOption(option.description, index);
                          
                          return (
                            <div key={index} className="space-y-1.5">
                              {/* Option text with percentage */}
                              <div className="flex items-center justify-between">
                                <span className={`${color.text} text-sm font-medium`}>
                                  {option.description}
                                </span>
                                <span className="text-slate-400 text-sm">
                                  {percentage.toFixed(1)}% ({formatNumber(option.totalBettors)} votes)
                                </span>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="relative w-full h-2 bg-slate-800/50 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${color.bgBar} transition-all rounded-full`}
                                  style={{ width: `${percentage}%` }}
                                />
                    </div>
                  </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Bottom section: Metrics and actions */}
                  <div className="flex items-end justify-between pt-4 border-t border-slate-800/50">
                    {/* Engagement metrics - Left */}
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{formatNumber(pred.participantCount)} participants</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>{formatNumber(Math.floor(totalPool))} {tokenSymbol} bet</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                        <span>+0 {tokenSymbol} earned</span>
                    </div>
                  </div>

                    {/* End date and actions - Right */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-slate-400 text-xs mb-0.5">Ends</div>
                        <div className="text-slate-300 text-sm font-medium">
                          {formatEndDate(pred.closesAt)}
                  </div>
                </div>

                      {/* Action icons - Not implemented yet 
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement share
                          }}
                          className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                    <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewPrediction(pred.id);
                          }}
                          className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                    </button>
                      </div> */}
                    </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
