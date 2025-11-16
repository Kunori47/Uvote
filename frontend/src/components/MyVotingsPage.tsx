import { useState, useMemo } from 'react';
import { Filter, Calendar, CheckCircle2, XCircle, Clock, Trophy, Loader2, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useMyBets } from '../hooks/useMyBets';

const STATUS_NAMES = ['Activa', 'Cerrada', 'Cooldown', 'En Revisión', 'Confirmada', 'Disputada', 'Cancelada'];
const STATUS_COLORS = ['blue', 'slate', 'yellow', 'orange', 'emerald', 'red', 'gray'];

const statusFilters = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas (0-1)' },
  { id: 'finished', label: 'Finalizadas (4)' },
  { id: 'cooldown', label: 'En Cooldown (2)' },
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
  const { address, isConnected } = useWallet();
  const { bets, loading, error } = useMyBets(address);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar apuestas
  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      // Filtro de estado
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && bet.predictionStatus > 1) return false;
        if (statusFilter === 'finished' && bet.predictionStatus !== 4) return false;
        if (statusFilter === 'cooldown' && bet.predictionStatus !== 2) return false;
      }

      // Filtro de resultado
      if (resultFilter !== 'all') {
        if (resultFilter === 'won' && !bet.canClaim) return false;
        if (resultFilter === 'lost' && (bet.predictionStatus !== 4 || bet.canClaim)) return false;
        if (resultFilter === 'pending' && bet.predictionStatus >= 4) return false;
      }

      return true;
    });
  }, [bets, statusFilter, resultFilter]);

  // Estadísticas
  const stats = useMemo(() => {
    const totalInvested = bets.reduce((sum, bet) => sum + parseFloat(bet.totalBetAmount), 0);
    const activeBets = bets.filter(b => b.predictionStatus <= 1).length;
    const wonBets = bets.filter(b => b.canClaim).length;
    const lostBets = bets.filter(b => b.predictionStatus === 4 && !b.canClaim).length;
    
    return {
      total: bets.length,
      active: activeBets,
      won: wonBets,
      lost: lostBets,
      totalInvested: totalInvested.toFixed(2),
    };
  }, [bets]);

  // Determinar resultado de una apuesta
  const getBetResult = (bet: typeof bets[0]): 'won' | 'lost' | 'pending' => {
    if (bet.predictionStatus < 4) return 'pending';
    if (bet.canClaim) return 'won';
    return 'lost';
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Wallet className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Wallet no conectada</h2>
          <p className="text-slate-400">Conecta tu wallet para ver tus apuestas</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Cargando tus apuestas...</p>
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
      {/* Header with stats */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-6">Mis Votaciones</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Total</div>
            <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Activas</div>
            <div className="text-2xl font-bold text-blue-400">{stats.active}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Ganadas</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.won}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Perdidas</div>
            <div className="text-2xl font-bold text-red-400">{stats.lost}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Total Apostado</div>
            <div className="text-2xl font-bold text-slate-100">{stats.totalInvested}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-all"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          
          {(statusFilter !== 'all' || resultFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setResultFilter('all');
              }}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 mb-4 space-y-4">
            <div>
              <div className="text-slate-400 text-sm mb-2">Estado</div>
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
            
            <div>
              <div className="text-slate-400 text-sm mb-2">Resultado</div>
              <div className="flex flex-wrap gap-2">
                {resultFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setResultFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      resultFilter === filter.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bets List */}
      {filteredBets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Trophy className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-300 mb-2">No hay apuestas</h3>
          <p className="text-slate-500">
            {bets.length === 0 
              ? 'Aún no has apostado en ninguna predicción'
              : 'No hay apuestas que coincidan con los filtros'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBets.map((bet) => {
            const result = getBetResult(bet);
            const statusColor = STATUS_COLORS[bet.predictionStatus];
            
            return (
              <div
                key={bet.predictionId}
                onClick={() => onViewPrediction(bet.predictionId)}
                className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5 hover:bg-slate-900/70 hover:border-slate-700/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                      {bet.predictionTitle}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-1 rounded-lg text-xs bg-${statusColor}-500/10 border border-${statusColor}-500/30 text-${statusColor}-400`}>
                        {STATUS_NAMES[bet.predictionStatus]}
                      </span>
                      {result === 'won' && (
                        <span className="px-2 py-1 rounded-lg text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          Ganaste
                        </span>
                      )}
                      {result === 'lost' && (
                        <span className="px-2 py-1 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Perdiste
                        </span>
                      )}
                      {result === 'pending' && (
                        <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-slate-500 mb-1">Total apostado</div>
                    <div className="text-xl font-bold text-emerald-400">
                      {bet.totalBetAmount} {bet.creatorTokenSymbol}
                    </div>
                  </div>
                </div>

                {/* Bets Detail */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="text-sm text-slate-400 mb-2">Tus apuestas:</div>
                  {bet.bets.map((userBet, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          bet.predictionStatus === 4 && userBet.optionIndex === bet.winningOption
                            ? 'bg-emerald-400'
                            : 'bg-slate-600'
                        }`}></div>
                        <span className="text-slate-300">{userBet.optionDescription}</span>
                        {bet.predictionStatus === 4 && userBet.optionIndex === bet.winningOption && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <span className="text-slate-400">{userBet.amount} tokens</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                {bet.canClaim && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 text-sm font-medium">¡Puedes reclamar tus ganancias!</span>
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
