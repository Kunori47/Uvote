import { useState } from 'react';
import { Search, ArrowUpDown, Users, Bell, BellOff, TrendingUp } from 'lucide-react';
import React from 'react';

interface Subscription {
  id: string;
  creatorName: string;
  creatorAvatar: string;
  category: string;
  followedSince: string;
  followers: number;
  activePredictions: number;
  totalPredictions: number;
  winRate: number; // Porcentaje de predicciones acertadas
  notificationsEnabled: boolean;
  hasCreatorCoin: boolean;
  coinBalance?: number;
}

const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    creatorName: 'Ibai',
    creatorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    category: 'Gaming',
    followedSince: '2024-01-15',
    followers: 1250000,
    activePredictions: 12,
    totalPredictions: 156,
    winRate: 68.5,
    notificationsEnabled: true,
    hasCreatorCoin: true,
    coinBalance: 1000,
  },
  {
    id: '2',
    creatorName: 'El Rubius',
    creatorAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    category: 'Gaming',
    followedSince: '2024-02-20',
    followers: 980000,
    activePredictions: 8,
    totalPredictions: 132,
    winRate: 71.2,
    notificationsEnabled: true,
    hasCreatorCoin: true,
    coinBalance: 700,
  },
  {
    id: '3',
    creatorName: 'AuronPlay',
    creatorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop',
    category: 'Entertainment',
    followedSince: '2024-03-10',
    followers: 850000,
    activePredictions: 15,
    totalPredictions: 203,
    winRate: 65.8,
    notificationsEnabled: false,
    hasCreatorCoin: true,
    coinBalance: 500,
  },
  {
    id: '4',
    creatorName: 'ElSpreen',
    creatorAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    category: 'Gaming',
    followedSince: '2024-04-05',
    followers: 620000,
    activePredictions: 6,
    totalPredictions: 89,
    winRate: 73.4,
    notificationsEnabled: true,
    hasCreatorCoin: true,
    coinBalance: 850,
  },
  {
    id: '5',
    creatorName: 'Germán',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    category: 'Comedy',
    followedSince: '2024-05-12',
    followers: 740000,
    activePredictions: 10,
    totalPredictions: 145,
    winRate: 69.7,
    notificationsEnabled: true,
    hasCreatorCoin: true,
    coinBalance: 300,
  },
  {
    id: '6',
    creatorName: 'Coscu',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    category: 'Gaming',
    followedSince: '2024-06-08',
    followers: 580000,
    activePredictions: 9,
    totalPredictions: 112,
    winRate: 64.3,
    notificationsEnabled: false,
    hasCreatorCoin: true,
    coinBalance: 450,
  },
  {
    id: '7',
    creatorName: 'Luzu',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    category: 'Entertainment',
    followedSince: '2024-07-22',
    followers: 490000,
    activePredictions: 7,
    totalPredictions: 98,
    winRate: 70.1,
    notificationsEnabled: true,
    hasCreatorCoin: true,
    coinBalance: 600,
  },
  {
    id: '8',
    creatorName: 'Reven',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    category: 'Sports',
    followedSince: '2024-08-15',
    followers: 320000,
    activePredictions: 5,
    totalPredictions: 67,
    winRate: 75.2,
    notificationsEnabled: false,
    hasCreatorCoin: true,
    coinBalance: 200,
  },
  {
    id: '9',
    creatorName: 'Ampeterby7',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    category: 'Gaming',
    followedSince: '2024-09-03',
    followers: 280000,
    activePredictions: 11,
    totalPredictions: 124,
    winRate: 62.9,
    notificationsEnabled: true,
    hasCreatorCoin: false,
  },
  {
    id: '10',
    creatorName: 'Rivers',
    creatorAvatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop',
    category: 'Music',
    followedSince: '2024-10-01',
    followers: 410000,
    activePredictions: 4,
    totalPredictions: 56,
    winRate: 78.6,
    notificationsEnabled: true,
    hasCreatorCoin: false,
  },
];

type SortOption = 'name-asc' | 'name-desc' | 'followers-desc' | 'followers-asc' | 'date-desc' | 'date-asc' | 'winrate-desc' | 'winrate-asc';

const sortOptions = [
  { id: 'name-asc' as SortOption, label: 'Nombre A-Z' },
  { id: 'name-desc' as SortOption, label: 'Nombre Z-A' },
  { id: 'followers-desc' as SortOption, label: 'Más seguidores' },
  { id: 'followers-asc' as SortOption, label: 'Menos seguidores' },
  { id: 'date-desc' as SortOption, label: 'Seguidos recientemente' },
  { id: 'date-asc' as SortOption, label: 'Seguidos primero' },
  { id: 'winrate-desc' as SortOption, label: 'Mayor % acierto' },
  { id: 'winrate-asc' as SortOption, label: 'Menor % acierto' },
];

const categoryFilters = [
  { id: 'all', label: 'Todas las categorías' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Entertainment', label: 'Entertainment' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Music', label: 'Music' },
  { id: 'Comedy', label: 'Comedy' },
];

interface MySubscriptionsPageProps {
  onViewCreator?: (creatorId: string) => void;
}

export function MySubscriptionsPage({ onViewCreator }: MySubscriptionsPageProps) {
  const [sortBy, setSortBy] = useState<SortOption>('followers-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subscriptions, setSubscriptions] = useState(mockSubscriptions);

  // Statistics
  const stats = {
    totalSubscriptions: subscriptions.length,
    withNotifications: subscriptions.filter(s => s.notificationsEnabled).length,
    withCoins: subscriptions.filter(s => s.hasCreatorCoin).length,
    totalActivePredictions: subscriptions.reduce((sum, s) => sum + s.activePredictions, 0),
  };

  // Toggle notifications
  const toggleNotifications = (id: string) => {
    setSubscriptions(subscriptions.map(sub => 
      sub.id === id ? { ...sub, notificationsEnabled: !sub.notificationsEnabled } : sub
    ));
  };

  // Filter and sort
  const filteredAndSortedSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch = sub.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || sub.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.creatorName.localeCompare(b.creatorName);
        case 'name-desc':
          return b.creatorName.localeCompare(a.creatorName);
        case 'followers-desc':
          return b.followers - a.followers;
        case 'followers-asc':
          return a.followers - b.followers;
        case 'date-desc':
          return new Date(b.followedSince).getTime() - new Date(a.followedSince).getTime();
        case 'date-asc':
          return new Date(a.followedSince).getTime() - new Date(b.followedSince).getTime();
        case 'winrate-desc':
          return b.winRate - a.winRate;
        case 'winrate-asc':
          return a.winRate - b.winRate;
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  };

  const formatFollowers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-slate-100 mb-6">Mis Suscripciones</h1>

        {/* Category Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {categoryFilters.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategoryFilter(category.id)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                categoryFilter === category.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900/50 text-slate-400 border border-slate-800/50 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Search and Sort */}
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
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
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

      {/* Subscriptions List */}
      <div className="space-y-3">
        {filteredAndSortedSubscriptions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No se encontraron creadores
          </div>
        ) : (
          filteredAndSortedSubscriptions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onViewCreator?.(sub.id)}
              className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 hover:bg-slate-900/50 hover:border-slate-700/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <img
                    src={sub.creatorAvatar}
                    alt={sub.creatorName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-800/50"
                  />
                </div>

                {/* Creator Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-slate-100">{sub.creatorName}</h3>
                    <span className="px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 rounded text-slate-400 text-xs">
                      {sub.category}
                    </span>
                    {sub.hasCreatorCoin && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-xs flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {sub.coinBalance} monedas
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Users className="w-3.5 h-3.5" />
                    <span>{formatFollowers(sub.followers)} seguidores</span>
                    <span className="text-slate-700">•</span>
                    <span>{formatDate(sub.followedSince)}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="hidden md:grid grid-cols-3 gap-8 flex-shrink-0">
                  {/* Win Rate */}
                  <div>
                    <div className="text-slate-500 text-sm mb-1">% Acierto</div>
                    <div className={`${sub.winRate >= 70 ? 'text-emerald-400' : sub.winRate >= 60 ? 'text-blue-400' : 'text-slate-400'}`}>
                      {sub.winRate}%
                    </div>
                  </div>

                  {/* Predictions */}
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Predicciones</div>
                    <div className="text-slate-200">
                      {sub.activePredictions} / {sub.totalPredictions}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Notificaciones</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNotifications(sub.id);
                      }}
                      className={`p-1.5 rounded-lg transition-all ${
                        sub.notificationsEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      {sub.notificationsEnabled ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Stats */}
                <div className="md:hidden flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-slate-100">{sub.activePredictions} activas</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotifications(sub.id);
                    }}
                    className={`p-1.5 rounded-lg transition-all ${
                      sub.notificationsEnabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800/50 text-slate-500'
                    }`}
                  >
                    {sub.notificationsEnabled ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
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
