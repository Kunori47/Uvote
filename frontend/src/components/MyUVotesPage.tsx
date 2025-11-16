import { useState, useMemo } from 'react';
import { Plus, Filter, Calendar, CheckCircle2, Clock, Users, TrendingUp, AlertCircle, Loader2, Wallet, BarChart3, X } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useCreatorPredictions } from '../hooks/useCreatorPredictions';
import { predictionMarketService } from '../lib/contractService';

const STATUS_NAMES = ['Activa', 'Cerrada', 'Cooldown', 'En Revisión', 'Confirmada', 'Disputada', 'Cancelada'];
const STATUS_COLORS = ['emerald', 'slate', 'yellow', 'orange', 'green', 'red', 'gray'];
const STATUS_ICONS = [Clock, CheckCircle2, Clock, AlertCircle, CheckCircle2, AlertCircle, CheckCircle2];

const statusFilters = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas (0)' },
  { id: 'closed', label: 'Cerradas (1)' },
  { id: 'cooldown', label: 'En Cooldown (2)' },
  { id: 'finished', label: 'Finalizadas (4)' },
];

interface MyUVotesPageProps {
  onViewPrediction: (id: string) => void;
}

export function MyUVotesPage({ onViewPrediction }: MyUVotesPageProps) {
  const { address, isConnected } = useWallet();
  const { predictions, loading, error } = useCreatorPredictions(address);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [closingPredictionId, setClosingPredictionId] = useState<string | null>(null);

  const handleClosePrediction = async (e: React.MouseEvent, predictionId: string) => {
    e.stopPropagation(); // Prevenir que se abra la predicción
    
    if (!confirm('¿Estás seguro de que quieres cerrar esta predicción? Una vez cerrada, no se podrán hacer más apuestas.')) {
      return;
    }
    
    try {
      setClosingPredictionId(predictionId);
      await predictionMarketService.closePrediction(predictionId);
      // El hook se actualizará automáticamente
    } catch (err: any) {
      console.error('Error cerrando predicción:', err);
      alert(err.message || 'Error al cerrar predicción');
    } finally {
      setClosingPredictionId(null);
    }
  };

  // Filtrar predicciones
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

  // Estadísticas
  const stats = useMemo(() => {
    const totalPool = predictions.reduce((sum, pred) => sum + parseFloat(pred.totalPool), 0);
    const totalParticipants = predictions.reduce((sum, pred) => sum + pred.participantCount, 0);
    const activePredictions = predictions.filter(p => p.status === 0).length;
    const closedPredictions = predictions.filter(p => p.status === 1).length;
    const finishedPredictions = predictions.filter(p => p.status === 4).length;
    
    // Los creadores no ganan por predicciones, solo por venta de tokens
    const estimatedEarnings = 0;

    return {
      total: predictions.length,
      active: activePredictions,
      closed: closedPredictions,
      finished: finishedPredictions,
      totalPool: totalPool.toFixed(2),
      totalParticipants,
      estimatedEarnings: estimatedEarnings.toFixed(2),
    };
  }, [predictions]);

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Wallet className="w-16 h-16 text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Wallet no conectada</h2>
          <p className="text-slate-400">Conecta tu wallet para ver tu dashboard de creador</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Cargando tus predicciones...</p>
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
            <h1 className="text-3xl font-bold text-slate-100 mb-1">Dashboard de Creador</h1>
            <p className="text-slate-400">Gestiona y monitorea tus predicciones</p>
          </div>
          <button
            onClick={() => {/* Navegar a crear predicción */}}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Predicción
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Total</div>
            <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Activas</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Cerradas</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.closed}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Finalizadas</div>
            <div className="text-2xl font-bold text-blue-400">{stats.finished}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Pool Total</div>
            <div className="text-2xl font-bold text-purple-400">{stats.totalPool}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Participantes</div>
            <div className="text-2xl font-bold text-slate-100">{stats.totalParticipants}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="text-slate-500 text-sm mb-1">Ganancias</div>
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
            Filtros
          </button>
          
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 mb-4">
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
        )}
      </div>

      {/* Predictions List */}
      {filteredPredictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <BarChart3 className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-300 mb-2">No hay predicciones</h3>
          <p className="text-slate-500 mb-6">
            {predictions.length === 0 
              ? 'Aún no has creado ninguna predicción'
              : 'No hay predicciones que coincidan con los filtros'}
          </p>
          {predictions.length === 0 && (
            <button
              onClick={() => {/* Navegar a crear predicción */}}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Primera Predicción
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((pred) => {
            const statusColor = STATUS_COLORS[pred.status];
            const StatusIcon = STATUS_ICONS[pred.status];
            const isActive = pred.status === 0;
            const isClosed = pred.status === 1;
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = pred.closesAt - now;
            const hoursLeft = Math.max(0, Math.floor(timeLeft / 3600));
            
            return (
              <div
                key={pred.id}
                onClick={() => onViewPrediction(pred.id)}
                className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-5 hover:bg-slate-900/70 hover:border-slate-700/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                      {pred.title}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-1 rounded-lg text-xs bg-${statusColor}-500/10 border border-${statusColor}-500/30 text-${statusColor}-400 flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_NAMES[pred.status]}
                      </span>
                      {isActive && hoursLeft > 0 && (
                        <span className="text-xs text-slate-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {hoursLeft}h restantes
                        </span>
                      )}
                      {isClosed && (
                        <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                          ⚠️ Requiere resolución
                        </span>
                      )}
                      {pred.reportCount > 0 && (
                        <span className="px-2 py-1 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400">
                          🚨 {pred.reportCount} reportes
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Participantes</div>
                    <div className="text-slate-100 font-medium flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      {pred.participantCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Pool Total</div>
                    <div className="text-emerald-400 font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {parseFloat(pred.totalPool).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs mb-1">Opciones</div>
                    <div className="text-slate-100 font-medium">{pred.optionsCount}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  {isActive && (
                    <button
                      onClick={(e) => handleClosePrediction(e, pred.id)}
                      disabled={closingPredictionId === pred.id}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {closingPredictionId === pred.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cerrando...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Cerrar
                        </>
                      )}
                    </button>
                  )}
                  {isClosed && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-400 font-medium">Haz clic para resolver esta predicción</span>
                      <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
