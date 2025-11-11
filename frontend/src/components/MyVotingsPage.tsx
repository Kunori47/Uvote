import { useState } from 'react';
import { Filter, Calendar, CheckCircle2, XCircle, Clock, Trophy } from 'lucide-react';
import React from 'react';

interface VotingHistory {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  status: 'active' | 'finished';
  result: 'won' | 'lost' | 'pending';
  option: string;
  optionColor: string;
  amount: number;
  potentialReturn: number;
  actualReturn?: number;
  participants: number;
  endDate?: string;
}

const mockVotings: VotingHistory[] = [
  {
    id: '1',
    title: '¿Argentina ganará el próximo Mundial 2026?',
    thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=225&fit=crop',
    date: '2024-11-05',
    status: 'finished',
    result: 'won',
    option: 'Sí',
    optionColor: '#10b981',
    amount: 500,
    potentialReturn: 850,
    actualReturn: 850,
    participants: 12450,
  },
  {
    id: '2',
    title: '¿El precio de Bitcoin superará los $100,000 en 2025?',
    thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=225&fit=crop',
    date: '2024-11-03',
    status: 'active',
    result: 'pending',
    option: 'Sí',
    optionColor: '#10b981',
    amount: 1000,
    potentialReturn: 1800,
    participants: 8932,
    endDate: '2025-12-31',
  },
  {
    id: '3',
    title: '¿Habrá elecciones anticipadas en España en 2025?',
    thumbnail: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=225&fit=crop',
    date: '2024-10-28',
    status: 'finished',
    result: 'lost',
    option: 'No',
    optionColor: '#ef4444',
    amount: 300,
    potentialReturn: 540,
    actualReturn: 0,
    participants: 5621,
  },
  {
    id: '4',
    title: '¿Quién ganará las elecciones de EE.UU. en 2024?',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=225&fit=crop',
    date: '2024-10-15',
    status: 'finished',
    result: 'won',
    option: 'Opción A',
    optionColor: '#3b82f6',
    amount: 750,
    potentialReturn: 1200,
    actualReturn: 1200,
    participants: 25684,
  },
  {
    id: '5',
    title: '¿Tesla lanzará un modelo más económico en 2025?',
    thumbnail: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=225&fit=crop',
    date: '2024-10-10',
    status: 'active',
    result: 'pending',
    option: 'Opción B',
    optionColor: '#eab308',
    amount: 600,
    potentialReturn: 1020,
    participants: 4521,
    endDate: '2025-12-31',
  },
  {
    id: '6',
    title: '¿La inflación en Argentina bajará del 50% en 2025?',
    thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=225&fit=crop',
    date: '2024-09-22',
    status: 'finished',
    result: 'lost',
    option: 'Sí',
    optionColor: '#10b981',
    amount: 450,
    potentialReturn: 720,
    actualReturn: 0,
    participants: 9856,
  },
];

const timeFilters = [
  { id: 'all', label: 'Todo el tiempo' },
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mes' },
  { id: 'year', label: 'Este año' },
];

const statusFilters = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'finished', label: 'Finalizadas' },
];

const resultFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'won', label: 'Ganadas' },
  { id: 'lost', label: 'Perdidas' },
  { id: 'pending', label: 'Pendientes' },
];

interface MyVotingsPageProps {
  onViewPrediction: (id: string) => void;
}

export function MyVotingsPage({ onViewPrediction }: MyVotingsPageProps) {
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter logic
  const filteredVotings = mockVotings.filter((voting) => {
    if (statusFilter !== 'all' && voting.status !== statusFilter) return false;
    if (resultFilter !== 'all' && voting.result !== resultFilter) return false;
    // Time filter logic would go here
    return true;
  });

  // Statistics
  const stats = {
    total: mockVotings.length,
    active: mockVotings.filter(v => v.status === 'active').length,
    won: mockVotings.filter(v => v.result === 'won').length,
    lost: mockVotings.filter(v => v.result === 'lost').length,
    totalInvested: mockVotings.reduce((sum, v) => sum + v.amount, 0),
    totalReturns: mockVotings.reduce((sum, v) => sum + (v.actualReturn || 0), 0),
  };

  return (
    <div className="p-6">
      {/* Header with stats */}
      <div className="mb-8">
        <h1 className="text-slate-100 mb-6">Mis Votaciones</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Total</div>
            <div className="text-slate-100">{stats.total}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Activas</div>
            <div className="text-blue-400">{stats.active}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Ganadas</div>
            <div className="text-emerald-400">{stats.won}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Perdidas</div>
            <div className="text-red-400">{stats.lost}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Invertido</div>
            <div className="text-slate-100">{stats.totalInvested}u</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Retornos</div>
            <div className={stats.totalReturns >= stats.totalInvested ? 'text-emerald-400' : 'text-red-400'}>
              {stats.totalReturns}u
            </div>
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

          {(timeFilter !== 'all' || statusFilter !== 'all' || resultFilter !== 'all') && (
            <button
              onClick={() => {
                setTimeFilter('all');
                setStatusFilter('all');
                setResultFilter('all');
              }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Time Filter */}
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Tiempo</span>
                </div>
                <div className="space-y-2">
                  {timeFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setTimeFilter(filter.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        timeFilter === filter.id
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

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

              {/* Result Filter */}
              <div>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                  <Trophy className="w-4 h-4" />
                  <span>Resultado</span>
                </div>
                <div className="space-y-2">
                  {resultFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setResultFilter(filter.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        resultFilter === filter.id
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voting History List */}
      <div className="space-y-3">
        {filteredVotings.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No se encontraron votaciones con los filtros seleccionados
          </div>
        ) : (
          filteredVotings.map((voting) => (
            <div
              key={voting.id}
              className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 hover:bg-slate-900/50 hover:border-slate-700/50 transition-all cursor-pointer"
              onClick={() => onViewPrediction(voting.id)}
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={voting.thumbnail}
                    alt={voting.title}
                    className="w-40 h-24 object-cover rounded-lg"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-slate-200 line-clamp-2">{voting.title}</h3>
                    
                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {voting.status === 'active' ? (
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

                  <div className="flex items-center gap-6 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Votaste:</span>
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${voting.optionColor}20`, color: voting.optionColor, border: `1px solid ${voting.optionColor}40` }}
                      >
                        {voting.option}
                      </span>
                    </div>
                    <div className="text-slate-500">{voting.date}</div>
                    <div className="text-slate-500">{voting.participants.toLocaleString()} participantes</div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div>
                      <div className="text-slate-500 text-sm">Apostado</div>
                      <div className="text-slate-300">{voting.amount}u</div>
                    </div>

                    {voting.status === 'active' ? (
                      <>
                        <div>
                          <div className="text-slate-500 text-sm">Retorno potencial</div>
                          <div className="text-blue-400">{voting.potentialReturn}u</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-sm">Finaliza</div>
                          <div className="text-slate-300">{voting.endDate}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-slate-500 text-sm">Retorno</div>
                          <div className={voting.actualReturn! > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {voting.actualReturn}u
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-sm">Resultado</div>
                          <div className="flex items-center gap-1.5">
                            {voting.result === 'won' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Ganaste</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span className="text-red-400">Perdiste</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-sm">Ganancia/Pérdida</div>
                          <div className={voting.actualReturn! - voting.amount > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {voting.actualReturn! - voting.amount > 0 ? '+' : ''}{voting.actualReturn! - voting.amount}u
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}