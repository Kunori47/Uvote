import { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Users, TrendingUp, Loader2, UserMinus, Wallet } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useUserTokens } from '../hooks/useUserTokens';
import { factoryService, creatorTokenService } from '../lib/contractService';

interface SubscriptionDisplay {
  id: string;
  creatorAddress: string;
  creatorName: string;
  creatorAvatar: string;
  followedSince: string;
  hasCreatorCoin: boolean;
  coinBalance?: string;
  coinName?: string;
  coinSymbol?: string;
}

type SortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';

const sortOptions = [
  { id: 'name-asc' as SortOption, label: 'Name A-Z' },
  { id: 'name-desc' as SortOption, label: 'Name Z-A' },
  { id: 'date-desc' as SortOption, label: 'Recently followed' },
  { id: 'date-asc' as SortOption, label: 'Followed first' },
];

interface MySubscriptionsPageProps {
  onViewCreator?: (creatorAddress: string) => void;
}

export function MySubscriptionsPage({ onViewCreator }: MySubscriptionsPageProps) {
  const { address, isConnected } = useWallet();
  const { subscriptions: rawSubscriptions, loading, error, unsubscribe: unsubscribeApi, refetch } = useSubscriptions(address);
  const { tokens: userTokens } = useUserTokens(address);
  
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);
  const [creatorTokenInfo, setCreatorTokenInfo] = useState<Record<string, { name: string; symbol: string }>>({});
  const [loadingTokenInfo, setLoadingTokenInfo] = useState(false);

  // Transform backend subscriptions to display format
  const subscriptions: SubscriptionDisplay[] = rawSubscriptions.map((sub) => {
    const creator = sub.creator;
    const creatorName = creator?.display_name || creator?.username || `${sub.creator_address.slice(0, 6)}...${sub.creator_address.slice(-4)}`;
    const creatorAvatar = creator?.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.creator_address}`;
    
    // Check if user has tokens from this creator
    const userToken = userTokens.find(t => t.creatorAddress.toLowerCase() === sub.creator_address.toLowerCase());
    
    // Get creator coin information
    const tokenInfo = creatorTokenInfo[sub.creator_address.toLowerCase()];
    
    return {
      id: sub.id.toString(),
      creatorAddress: sub.creator_address,
      creatorName,
      creatorAvatar,
      followedSince: new Date(sub.created_at).toLocaleDateString('en-US'),
      hasCreatorCoin: !!userToken,
      coinBalance: userToken?.balance,
      coinName: tokenInfo?.name,
      coinSymbol: tokenInfo?.symbol,
    };
  });

  // Load creator token information
  useEffect(() => {
    const loadCreatorTokenInfo = async () => {
      if (!rawSubscriptions || rawSubscriptions.length === 0) {
        setCreatorTokenInfo({});
        setLoadingTokenInfo(false);
        return;
      }

      try {
        setLoadingTokenInfo(true);
        const tokenInfoMap: Record<string, { name: string; symbol: string }> = {};

        await Promise.all(
          rawSubscriptions.map(async (sub) => {
            try {
              // Try to get the creator token
              const tokenAddress = await factoryService.getCreatorToken(sub.creator_address);
              if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
                // Get token information
                const tokenInfo = await creatorTokenService.getTokenInfo(tokenAddress);
                tokenInfoMap[sub.creator_address.toLowerCase()] = {
                  name: tokenInfo.name,
                  symbol: tokenInfo.symbol,
                };
              }
            } catch (err) {
              // If creator doesn't have token, just don't add information
              // This is expected for creators who haven't created their coin yet
              console.log(`Creator ${sub.creator_address} does not have a token yet`);
            }
          })
        );

        setCreatorTokenInfo(tokenInfoMap);
      } catch (err) {
        console.error('Error loading creator token info:', err);
      } finally {
        setLoadingTokenInfo(false);
      }
    };

    loadCreatorTokenInfo();
  }, [rawSubscriptions]);

  // Statistics
  const stats = {
    totalSubscriptions: subscriptions.length,
    withCoins: subscriptions.filter(s => s.hasCreatorCoin).length,
  };

  // Unsubscribe
  const handleUnsubscribe = async (creatorAddress: string, creatorName: string) => {
    if (!confirm(`Are you sure you want to unfollow ${creatorName}?`)) {
      return;
    }
    
    try {
      setUnsubscribingId(creatorAddress);
      await unsubscribeApi(creatorAddress);
      
      // Reload subscriptions list after successful unsubscribe
      await refetch();
    } catch (err: any) {
      // If error is "Subscription not found", it means it was already successfully deleted
      // This can happen if backend returns 404 after deletion
      if (err.message?.toLowerCase().includes('subscription not found') || 
          err.message?.toLowerCase().includes('not found') ||
          err.message?.toLowerCase().includes('not found')) {
        console.log('Subscription already deleted, reloading list...');
        // Reload list anyway
        await refetch();
        return;
      }
      
      console.error('Error unsubscribing:', err);
      alert(err.message || 'Error unsubscribing');
    } finally {
      setUnsubscribingId(null);
    }
  };

  // Filter and sort
  const filteredAndSortedSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch = sub.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           sub.creatorAddress.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.creatorName.localeCompare(b.creatorName);
        case 'name-desc':
          return b.creatorName.localeCompare(a.creatorName);
        case 'date-desc':
          return new Date(b.followedSince).getTime() - new Date(a.followedSince).getTime();
        case 'date-asc':
          return new Date(a.followedSince).getTime() - new Date(b.followedSince).getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-6">My Subscriptions</h1>

        {/* Stats */}
        {isConnected && !loading && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400 text-sm">Followed creators</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{stats.totalSubscriptions}</p>
            </div>
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400 text-sm">With coins</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{stats.withCoins}</p>
            </div>
          </div>
        )}

        {/* Search and Sort */}
        {isConnected && subscriptions.length > 0 && (
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar creador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-all whitespace-nowrap"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Ordenar</span>
              </button>

              {showSortMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800/50 rounded-xl shadow-xl z-20">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-all first:rounded-t-xl last:rounded-b-xl ${
                          sortBy === option.id
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subscriptions List */}
      <div className="space-y-3">
        {!isConnected ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Connect your wallet to see your subscriptions</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading subscriptions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : filteredAndSortedSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">
              {searchQuery ? 'No creators found' : 'You don\'t follow any creators yet'}
            </p>
            {!searchQuery && (
              <p className="text-slate-500 text-sm">Explore predictions and follow your favorite creators</p>
            )}
          </div>
        ) : (
          filteredAndSortedSubscriptions.map((sub) => (
            <div
              key={sub.id}
              className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 hover:bg-slate-900/50 hover:border-slate-700/50 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div 
                  className="flex-shrink-0 cursor-pointer"
                  onClick={() => onViewCreator?.(sub.creatorAddress)}
                >
                  <img
                    src={sub.creatorAvatar}
                    alt={sub.creatorName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-800/50 hover:border-emerald-500/50 transition-colors"
                  />
                </div>

                {/* Creator Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 
                      className="text-lg font-semibold text-slate-100 hover:text-emerald-400 transition-colors cursor-pointer"
                      onClick={() => onViewCreator?.(sub.creatorAddress)}
                    >
                      {sub.creatorName}
                    </h3>
                    {sub.coinSymbol && (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {sub.coinName} ({sub.coinSymbol})
                        {sub.hasCreatorCoin && sub.coinBalance && (
                          <span className="ml-1 text-emerald-300">• {sub.coinBalance}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <span>Following since {sub.followedSince}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnsubscribe(sub.creatorAddress, sub.creatorName);
                    }}
                    disabled={unsubscribingId === sub.creatorAddress}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {unsubscribingId === sub.creatorAddress ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-4 h-4" />
                        Unfollow
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
