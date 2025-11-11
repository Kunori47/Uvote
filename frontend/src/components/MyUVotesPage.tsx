import { useState } from 'react';
import { Plus, Filter, Calendar, CheckCircle2, Clock, Users, TrendingUp, Share2, Edit, BarChart3 } from 'lucide-react';
import React from 'react';

interface PredictionOption {
  id: string;
  text: string;
  color: string;
  votes: number;
  totalStaked: number;
}

interface MyPrediction {
  id: string;
  title: string;
  thumbnail: string;
  createdDate: string;
  status: 'active' | 'finished';
  endDate?: string;
  finalizedDate?: string;
  participants: number;
  totalStaked: number;
  views: number;
  options: PredictionOption[];
  winningOption?: string;
  earnings: number; // Comisión/ganancias del creador
  category: string;
}

const mockPredictions: MyPrediction[] = [
  {
    id: '1',
    title: '¿Argentina ganará el próximo Mundial 2026?',
    thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=225&fit=crop',
    createdDate: '2024-10-01',
    status: 'active',
    endDate: '2026-06-15',
    participants: 12450,
    totalStaked: 125000,
    views: 45600,
    earnings: 6250, // 5% comisión
    category: 'Deportes',
    options: [
      { id: '1', text: 'Sí', color: '#10b981', votes: 7850, totalStaked: 78500 },
      { id: '2', text: 'No', color: '#ef4444', votes: 4600, totalStaked: 46500 },
    ],
  },
  {
    id: '2',
    title: 'El precio de Bitcoin superará los $100,000 en 2025?',
    thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=225&fit=crop',
    createdDate: '2024-09-15',
    status: 'active',
    endDate: '2025-12-31',
    participants: 8932,
    totalStaked: 189000,
    views: 32100,
    earnings: 9450,
    category: 'Cripto',
    options: [
      { id: '1', text: 'Sí', color: '#10b981', votes: 5600, totalStaked: 112000 },
      { id: '2', text: 'No', color: '#ef4444', votes: 3332, totalStaked: 77000 },
    ],
  },
  {
    id: '3',
    title: '¿Quién ganará las elecciones de EE.UU. en 2024?',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=225&fit=crop',
    createdDate: '2024-01-10',
    status: 'finished',
    finalizedDate: '2024-11-06',
    participants: 25684,
    totalStaked: 512000,
    views: 89500,
    earnings: 25600,
    category: 'Política',
    winningOption: 'Opción A',
    options: [
      { id: '1', text: 'Opción A', color: '#3b82f6', votes: 14200, totalStaked: 284000 },
      { id: '2', text: 'Opción B', color: '#eab308', votes: 11484, totalStaked: 228000 },
    ],
  },
  {
    id: '4',
    title: '¿Cuál será el juego más vendido en 2024?',
    thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=225&fit=crop',
    createdDate: '2024-08-20',
    status: 'finished',
    finalizedDate: '2024-12-31',
    participants: 15840,
    totalStaked: 238000,
    views: 52300,
    earnings: 11900,
    category: 'Gaming',
    winningOption: 'GTA VI',
    options: [
      { id: '1', text: 'GTA VI', color: '#3b82f6', votes: 6800, totalStaked: 102000 },
      { id: '2', text: 'FIFA 25', color: '#eab308', votes: 4200, totalStaked: 63000 },
      { id: '3', text: 'Call of Duty', color: '#f97316', votes: 3100, totalStaked: 46500 },
      { id: '4', text: 'Otros', color: '#a855f7', votes: 1740, totalStaked: 26500 },
    ],
  },
  {
    id: '5',
    title: '¿Tesla lanzará un modelo más económico en 2025?',
    thumbnail: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=225&fit=crop',
    createdDate: '2024-07-12',
    status: 'active',
    endDate: '2025-12-31',
    participants: 6521,
    totalStaked: 98000,
    views: 18900,
    earnings: 4900,
    category: 'Tecnología',
    options: [
      { id: '1', text: 'Sí', color: '#10b981', votes: 4100, totalStaked: 61500 },
      { id: '2', text: 'No', color: '#ef4444', votes: 2421, totalStaked: 36500 },
    ],
  },
  {
    id: '6',
    title: '¿Quién ganará el Balón de Oro 2024?',
    thumbnail: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0adb?w=400&h=225&fit=crop',
    createdDate: '2024-06-05',
    status: 'finished',
    finalizedDate: '2024-10-28',
    participants: 19200,
    totalStaked: 345000,
    views: 67800,
    earnings: 17250,
    category: 'Deportes',
    winningOption: 'Vinicius Jr',
    options: [
      { id: '1', text: 'Vinicius Jr', color: '#3b82f6', votes: 8500, totalStaked: 153000 },
      { id: '2', text: 'Messi', color: '#eab308', votes: 6200, totalStaked: 111600 },
      { id: '3', text: 'Haaland', color: '#f97316', votes: 4500, totalStaked: 80400 },
    ],
  },
];

type SortOption = 'date-desc' | 'date-asc' | 'participants-desc' | 'participants-asc' | 'earnings-desc' | 'earnings-asc' | 'staked-desc' | 'staked-asc';

const sortOptions = [
  { id: 'date-desc' as SortOption, label: 'Más recientes' },
  { id: 'date-asc' as SortOption, label: 'Más antiguas' },
  { id: 'participants-desc' as SortOption, label: 'Más participantes' },
  { id: 'participants-asc' as SortOption, label: 'Menos participantes' },
  { id: 'earnings-desc' as SortOption, label: 'Mayores ganancias' },
  { id: 'earnings-asc' as SortOption, label: 'Menores ganancias' },
  { id: 'staked-desc' as SortOption, label: 'Mayor dinero apostado' },
  { id: 'staked-asc' as SortOption, label: 'Menor dinero apostado' },
];

const statusFilters = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'finished', label: 'Finalizadas' },
];

interface MyUVotesPageProps {
  onViewPrediction: (id: string) => void;
}

export function MyUVotesPage({ onViewPrediction }: MyUVotesPageProps) {
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const stats = {
    total: mockPredictions.length,
    active: mockPredictions.filter(p => p.status === 'active').length,
    finished: mockPredictions.filter(p => p.status === 'finished').length,
    totalParticipants: mockPredictions.reduce((sum, p) => sum + p.participants, 0),
    totalStaked: mockPredictions.reduce((sum, p) => sum + p.totalStaked, 0),
    totalEarnings: mockPredictions.reduce((sum, p) => sum + p.earnings, 0),
    totalViews: mockPredictions.reduce((sum, p) => sum + p.views, 0),
  };

  // Filter and sort
  const filteredAndSortedPredictions = mockPredictions
    .filter((pred) => {
      if (statusFilter !== 'all' && pred.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
        case 'date-asc':
          return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
        case 'participants-desc':
          return b.participants - a.participants;
        case 'participants-asc':
          return a.participants - b.participants;
        case 'earnings-desc':
          return b.earnings - a.earnings;
        case 'earnings-asc':
          return a.earnings - b.earnings;
        case 'staked-desc':
          return b.totalStaked - a.totalStaked;
        case 'staked-asc':
          return a.totalStaked - b.totalStaked;
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      {/* Header with Create Button */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-slate-100">Mis uVotes</h1>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all">
            <Plus className="w-5 h-5" />
            <span>Crear Predicción</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Total</div>
            <div className="text-slate-100">{stats.total}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Activas</div>
            <div className="text-blue-400">{stats.active}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Finalizadas</div>
            <div className="text-slate-400">{stats.finished}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Participantes</div>
            <div className="text-slate-100">{stats.totalParticipants.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Total Apostado</div>
            <div className="text-slate-100">{stats.totalStaked.toLocaleString()}u</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Ganancias</div>
            <div className="text-emerald-400">{stats.totalEarnings.toLocaleString()}u</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Vistas</div>
            <div className="text-slate-100">{stats.totalViews.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-all"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>

          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Filter */}
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Estado</span>
                </div>
                <div className="space-y-2">
                  {statusFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        statusFilter === filter.id
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <BarChart3 className="w-4 h-4" />
                  <span>Ordenar por</span>
                </div>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        sortBy === option.id
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Predictions List */}
      <div className="space-y-3">
        {filteredAndSortedPredictions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-500 mb-4">No tienes predicciones creadas</div>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all">
              <Plus className="w-5 h-5" />
              <span>Crear mi primera predicción</span>
            </button>
          </div>
        ) : (
          filteredAndSortedPredictions.map((prediction) => {
            const totalVotes = prediction.options.reduce((sum, opt) => sum + opt.votes, 0);
            const leadingOption = prediction.options.reduce((prev, current) =>
              current.votes > prev.votes ? current : prev
            );

            return (
              <div
                key={prediction.id}
                className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 hover:bg-slate-900/50 hover:border-slate-700/50 transition-all cursor-pointer"
                onClick={() => onViewPrediction(prediction.id)}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={prediction.thumbnail}
                      alt={prediction.title}
                      className="w-40 h-24 object-cover rounded-lg"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-slate-200 mb-1 line-clamp-2">{prediction.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 rounded text-xs">
                            {prediction.category}
                          </span>
                          <span>{formatDate(prediction.createdDate)}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {prediction.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm">
                            <Clock className="w-3.5 h-3.5" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 text-slate-400 border border-slate-700/50 rounded-lg text-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Finalizada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Options Distribution */}
                    <div className="mb-3 space-y-2">
                      {prediction.options.map((option) => {
                        const percentage = totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(1) : 0;
                        const isWinner = prediction.winningOption === option.text;

                        return (
                          <div key={option.id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="px-2 py-0.5 rounded text-xs"
                                    style={{
                                      backgroundColor: `${option.color}20`,
                                      color: option.color,
                                      border: `1px solid ${option.color}40`,
                                    }}
                                  >
                                    {option.text}
                                  </span>
                                  {isWinner && (
                                    <span className="text-emerald-400 text-xs flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Ganadora
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-400">
                                  {percentage}% ({option.votes.toLocaleString()} votos)
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: option.color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Users className="w-4 h-4" />
                        <span>{prediction.participants.toLocaleString()} participantes</span>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {prediction.totalStaked.toLocaleString()}u apostados
                      </div>
                      <div className="text-slate-400 text-sm">
                        {prediction.views.toLocaleString()} vistas
                      </div>
                      <div className="text-emerald-400 text-sm flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        +{prediction.earnings.toLocaleString()}u ganados
                      </div>

                      {prediction.status === 'active' && (
                        <div className="text-slate-500 text-sm ml-auto">
                          Finaliza: {formatDate(prediction.endDate!)}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="ml-auto flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all">
                          <Share2 className="w-4 h-4" />
                        </button>
                        {prediction.status === 'active' && (
                          <button className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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