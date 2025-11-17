import { useState, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
  Coins,
} from "lucide-react";
import React from "react";
import { useWallet } from "../hooks/useWallet";
import { useUserTokens } from "../hooks/useUserTokens";
import { apiService } from "../lib/apiService";

interface PriceChange {
  date: string;
  price: number;
}

interface CreatorCoin {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  coinsOwned: number;
  coinValue: number; // Value of each coin
  totalValue: number; // Total value of coins owned
  totalInvested: number; // Original investment amount
  category: string;
  priceHistory: PriceChange[];
  description: string;
  lastPriceChange: string;
}

const mockCoins: CreatorCoin[] = [
  {
    id: "1",
    creatorName: "Ibai",
    creatorAvatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    coinName: "Ibai Coin",
    coinSymbol: "IBAI",
    coinImage: "https://images.unsplash.com/photo-1624365168785-c65be9114821?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 1000,
    coinValue: 2.5,
    totalValue: 2500,
    totalInvested: 2000,
    category: "Gaming",
    description: "Official creator token for Ibai. Invest in the future of gaming and entertainment.",
    lastPriceChange: "2025-10-15",
    priceHistory: [
      { date: "2024-11-11", price: 2.5 },
      { date: "2024-10-11", price: 2.3 },
      { date: "2024-09-11", price: 2.1 },
      { date: "2024-08-11", price: 2.0 },
      { date: "2024-07-11", price: 1.8 },
    ],
  },
  {
    id: "2",
    creatorName: "El Rubius",
    creatorAvatar:
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
    coinName: "Rubius Coin",
    coinSymbol: "RUBIUS",
    coinImage: "https://images.unsplash.com/photo-1624365169873-d42588f4e866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 700,
    coinValue: 3.8,
    totalValue: 2660,
    totalInvested: 2800,
    category: "Gaming",
    description: "Support one of the most influential gaming creators in Spanish.",
    lastPriceChange: "2025-10-20",
    priceHistory: [
      { date: "2024-11-11", price: 3.8 },
      { date: "2024-10-11", price: 4.0 },
      { date: "2024-09-11", price: 3.9 },
      { date: "2024-08-11", price: 3.7 },
      { date: "2024-07-11", price: 3.5 },
    ],
  },
  {
    id: "3",
    creatorName: "AuronPlay",
    creatorAvatar:
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
    coinName: "Auron Coin",
    coinSymbol: "AURON",
    coinImage: "https://images.unsplash.com/photo-1665060221110-6dbe583fa329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 500,
    coinValue: 4.2,
    totalValue: 2100,
    totalInvested: 1800,
    category: "Entertainment",
    description: "Invest in the king of entertainment and humor on YouTube.",
    lastPriceChange: "2025-09-28",
    priceHistory: [
      { date: "2024-11-11", price: 4.2 },
      { date: "2024-10-11", price: 4.0 },
      { date: "2024-09-11", price: 3.8 },
      { date: "2024-08-11", price: 3.6 },
      { date: "2024-07-11", price: 3.4 },
    ],
  },
  {
    id: "4",
    creatorName: "ElSpreen",
    creatorAvatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    coinName: "Spreen Coin",
    coinSymbol: "SPREEN",
    coinImage: "https://images.unsplash.com/photo-1707075891530-30f9b3a6577c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 850,
    coinValue: 1.8,
    totalValue: 1530,
    totalInvested: 1700,
    category: "Gaming",
    description: "The new generation of gaming. Support ElSpreen on his journey.",
    lastPriceChange: "2025-10-05",
    priceHistory: [
      { date: "2024-11-11", price: 1.8 },
      { date: "2024-10-11", price: 1.9 },
      { date: "2024-09-11", price: 2.0 },
      { date: "2024-08-11", price: 2.1 },
      { date: "2024-07-11", price: 2.0 },
    ],
  },
  {
    id: "5",
    creatorName: "Germán",
    creatorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    coinName: "German Coin",
    coinSymbol: "GERMAN",
    coinImage: "https://images.unsplash.com/photo-1632071865819-512bac164112?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 300,
    coinValue: 5.1,
    totalValue: 1530,
    totalInvested: 1500,
    category: "Comedy",
    description: "Invest in one of the pioneers of Spanish content.",
    lastPriceChange: "2025-10-10",
    priceHistory: [
      { date: "2024-11-11", price: 5.1 },
      { date: "2024-10-11", price: 5.0 },
      { date: "2024-09-11", price: 4.8 },
      { date: "2024-08-11", price: 4.6 },
      { date: "2024-07-11", price: 4.5 },
    ],
  },
  {
    id: "6",
    creatorName: "Coscu",
    creatorAvatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
    coinName: "Coscu Coin",
    coinSymbol: "COSCU",
    coinImage: "https://images.unsplash.com/photo-1624365168785-c65be9114821?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 450,
    coinValue: 2.9,
    totalValue: 1305,
    totalInvested: 1400,
    category: "Gaming",
    description: "The CoscuArmy coin. Join the community.",
    lastPriceChange: "2025-09-18",
    priceHistory: [
      { date: "2024-11-11", price: 2.9 },
      { date: "2024-10-11", price: 3.0 },
      { date: "2024-09-11", price: 3.1 },
      { date: "2024-08-11", price: 3.0 },
      { date: "2024-07-11", price: 2.8 },
    ],
  },
  {
    id: "7",
    creatorName: "Luzu",
    creatorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    coinName: "Luzu Coin",
    coinSymbol: "LUZU",
    coinImage: "https://images.unsplash.com/photo-1624365169873-d42588f4e866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 600,
    coinValue: 1.95,
    totalValue: 1170,
    totalInvested: 1200,
    category: "Entertainment",
    description: "Support Luzu in his entertainment projects.",
    lastPriceChange: "2025-10-22",
    priceHistory: [
      { date: "2024-11-11", price: 1.95 },
      { date: "2024-10-11", price: 2.0 },
      { date: "2024-09-11", price: 2.1 },
      { date: "2024-08-11", price: 2.0 },
      { date: "2024-07-11", price: 1.9 },
    ],
  },
  {
    id: "8",
    creatorName: "Reven",
    creatorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    coinName: "Reven Coin",
    coinSymbol: "REVEN",
    coinImage: "https://images.unsplash.com/photo-1665060221110-6dbe583fa329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    coinsOwned: 200,
    coinValue: 3.2,
    totalValue: 640,
    totalInvested: 600,
    category: "Sports",
    description: "Invest in the future of sports content.",
    lastPriceChange: "2025-10-01",
    priceHistory: [
      { date: "2024-11-11", price: 3.2 },
      { date: "2024-10-11", price: 3.0 },
      { date: "2024-09-11", price: 2.9 },
      { date: "2024-08-11", price: 2.8 },
      { date: "2024-07-11", price: 2.7 },
    ],
  },
];

type SortOption =
  | "coins-desc"
  | "coins-asc"
  | "value-desc"
  | "value-asc"
  | "change-desc"
  | "change-asc";

const sortOptions = [
  { id: "coins-desc" as SortOption, label: "Most coins" },
  { id: "coins-asc" as SortOption, label: "Fewest coins" },
  { id: "value-desc" as SortOption, label: "Highest value" },
  { id: "value-asc" as SortOption, label: "Lowest value" },
  {
    id: "change-desc" as SortOption,
    label: "Highest gain %",
  },
  { id: "change-asc" as SortOption, label: "Highest loss %" },
];

interface MyWalletPageProps {
  onViewCoin?: (coinId: string) => void;
}

export function MyWalletPage({ onViewCoin }: MyWalletPageProps) {
  const [sortBy, setSortBy] = useState<SortOption>("coins-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Get wallet and real tokens
  const { address, isConnected } = useWallet();
  const { tokens: userTokens, loading, error } = useUserTokens(address);
  
  // States for token metadata from Supabase
  const [tokenImages, setTokenImages] = useState<Record<string, string>>({});
  const [creatorProfiles, setCreatorProfiles] = useState<Record<string, { displayName: string; avatarUrl: string }>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Load coin images and creator profiles from Supabase
  useEffect(() => {
    const loadTokenMetadata = async () => {
      if (userTokens.length === 0) {
        setLoadingMetadata(false);
        return;
      }
      
      try {
        setLoadingMetadata(true);
        const images: Record<string, string> = {};
        const profiles: Record<string, { displayName: string; avatarUrl: string }> = {};
        
        // Load metadata for each token
        for (const token of userTokens) {
          // Get coin image
          try {
            const tokenData = await apiService.getToken(token.tokenAddress);
            if (tokenData?.coin_image_url) {
              images[token.tokenAddress] = tokenData.coin_image_url;
            }
          } catch (err) {
            console.error(`Error loading image for token ${token.tokenAddress}:`, err);
          }
          
          // Get creator profile (only if we haven't loaded it yet)
          if (!profiles[token.creatorAddress]) {
            try {
              const creatorData = await apiService.getUser(token.creatorAddress);
              if (creatorData) {
                profiles[token.creatorAddress] = {
                  displayName: creatorData.display_name || creatorData.username || `${token.creatorAddress.slice(0, 6)}...${token.creatorAddress.slice(-4)}`,
                  avatarUrl: creatorData.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.creatorAddress}`,
                };
              } else {
                profiles[token.creatorAddress] = {
                  displayName: `${token.creatorAddress.slice(0, 6)}...${token.creatorAddress.slice(-4)}`,
                  avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.creatorAddress}`,
                };
              }
            } catch (err) {
              console.error(`Error loading creator profile ${token.creatorAddress}:`, err);
              profiles[token.creatorAddress] = {
                displayName: `${token.creatorAddress.slice(0, 6)}...${token.creatorAddress.slice(-4)}`,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${token.creatorAddress}`,
              };
            }
          }
        }
        
        setTokenImages(images);
        setCreatorProfiles(profiles);
      } catch (err) {
        console.error('Error loading token metadata:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };
    
    loadTokenMetadata();
  }, [userTokens]);

  // Statistics (calculated from real tokens)
  const stats = {
    totalCreators: userTokens.length,
    totalCoins: userTokens.reduce(
      (sum, token) => sum + parseFloat(token.balance),
      0,
    ),
    totalValue: userTokens.reduce(
      (sum, token) => sum + parseFloat(token.totalValue),
      0,
    ),
    totalInvested: 0, // TODO: Calculate from history (requires DB or events)
  };

  const profitLoss = 0; // TODO: Calculate when we have history
  const profitLossPercentage = "0.00";

  // Filter and sort real tokens
  const filteredAndSortedTokens = userTokens
    .filter((token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "coins-desc":
          return parseFloat(b.balance) - parseFloat(a.balance);
        case "coins-asc":
          return parseFloat(a.balance) - parseFloat(b.balance);
        case "value-desc":
          return parseFloat(b.totalValue) - parseFloat(a.totalValue);
        case "value-asc":
          return parseFloat(a.totalValue) - parseFloat(b.totalValue);
        default:
          return 0;
      }
    });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-slate-100 mb-6">My Wallet</h1>

        {/* Portfolio Summary */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 border border-slate-800/50 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-slate-400 text-sm">
                Total Portfolio Value
              </div>
              <div className="text-slate-100 text-2xl">
                {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} DOT
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-slate-500 text-sm mb-1">
                Creators
              </div>
              <div className="text-slate-100">
                {stats.totalCreators}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-sm mb-1">
                Total Coins
              </div>
              <div className="text-slate-100">
                {stats.totalCoins.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-sm mb-1">
                Invested
              </div>
              <div className="text-slate-100">
                {stats.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} DOT
              </div>
            </div>
            <div>
              <div className="text-slate-500 text-sm mb-1">
                Gain/Loss
              </div>
              <div
                className={
                  profitLoss >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {profitLoss >= 0 ? "+" : ""}
                {profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} DOT
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center gap-3 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search creators..."
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
              <span>Sort</span>
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800/50 rounded-xl shadow-xl z-10">
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortBy(option.id);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all first:rounded-t-xl last:rounded-b-xl ${
                      sortBy === option.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coins List */}
      <div className="space-y-3">
        {!isConnected ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">Connect your wallet to see your tokens</p>
            <p className="text-slate-500 text-sm">Use SubWallet or MetaMask</p>
          </div>
        ) : loading || loadingMetadata ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">
              {loading ? 'Loading your tokens from blockchain...' : 'Loading creator information...'}
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-2">You don't have any creator tokens</p>
            <p className="text-slate-500 text-sm">Start by buying tokens from creators you follow</p>
          </div>
        ) : filteredAndSortedTokens.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 mb-2 text-lg">You don't have creator tokens yet</p>
            <p className="text-slate-500 text-sm mb-4">Explore creators and buy their tokens to get started</p>
          </div>
        ) : (
          filteredAndSortedTokens.map((token) => {
            return (
              <div
                key={token.tokenAddress}
                onClick={() => onViewCoin?.(token.tokenAddress)}
                className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 hover:bg-slate-900/50 hover:border-slate-700/50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {/* Coin Image */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600/20 to-slate-900/50 border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden">
                      {tokenImages[token.tokenAddress] ? (
                        <img 
                          src={tokenImages[token.tokenAddress]} 
                          alt={token.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Coins className="w-8 h-8 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Coin Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-slate-100">
                        {token.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 rounded text-slate-400 text-xs">
                        {token.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">
                        {creatorProfiles[token.creatorAddress]?.displayName || `${token.creatorAddress.slice(0, 6)}...${token.creatorAddress.slice(-4)}`}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="px-2 py-0.5 bg-emerald-800/30 border border-emerald-700/30 rounded text-emerald-500 text-xs">
                        On-Chain
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500 text-xs">
                        {token.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Coins Owned - Prominent Display */}
                  <div className="flex-shrink-0 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="text-emerald-400/70 text-xs mb-0.5">
                      I Have
                    </div>
                    <div className="text-emerald-400 text-xl">
                      {parseFloat(token.balance).toLocaleString(undefined, { 
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2 
                      })}
                    </div>
                    <div className="text-emerald-400/60 text-xs">
                      {token.symbol}
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="hidden md:grid grid-cols-3 gap-8 flex-shrink-0">
                    {/* Coin Value */}
                    <div>
                      <div className="text-slate-500 text-sm mb-1">
                        Price
                      </div>
                      <div className="text-slate-200">
                        {parseFloat(token.price).toFixed(4)} DOT
                      </div>
                    </div>

                    {/* Total Value */}
                    <div>
                      <div className="text-slate-500 text-sm mb-1">
                        Total Value
                      </div>
                      <div className="text-slate-100">
                        {parseFloat(token.totalValue).toFixed(4)} DOT
                      </div>
                    </div>

                    {/* Contract Address */}
                    <div>
                      <div className="text-slate-500 text-sm mb-1">
                        Contract
                      </div>
                      <div className="text-slate-400 text-xs font-mono">
                        {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="md:hidden flex-shrink-0 text-right">
                    <div className="text-slate-100 mb-1">
                      {parseFloat(token.totalValue).toFixed(4)} DOT
                    </div>
                    <div className="text-slate-400 text-sm">
                      @ {parseFloat(token.price).toFixed(4)} DOT
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}