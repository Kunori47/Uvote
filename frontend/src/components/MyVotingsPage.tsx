import { useState, useMemo, useEffect } from 'react';
import { Filter, Calendar, CheckCircle2, XCircle, Clock, Trophy, Loader2, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { useMyBets } from '../hooks/useMyBets';
import { apiService } from '../lib/apiService';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../lib/contracts';
import { predictionMarketService } from '../lib/contractService';

const STATUS_NAMES = ['Activa', 'Cerrada', 'Cooldown', 'En Revisión', 'Confirmada', 'Disputada', 'Cancelada'];
const STATUS_COLORS = ['blue', 'slate', 'yellow', 'orange', 'emerald', 'red', 'gray'];

// Colores de opciones (igual que en PredictionCard)
const optionColors = [
  { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-600/20', bgBorder: 'bg-emerald-500/40' },
  { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-600/20', bgBorder: 'bg-red-500/40' },
  { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-600/20', bgBorder: 'bg-blue-500/40' },
  { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-600/20', bgBorder: 'bg-amber-500/40' },
  { border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-600/20', bgBorder: 'bg-orange-500/40' },
  { border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-600/20', bgBorder: 'bg-purple-500/40' },
];

// Helper para obtener color de opción (igual que en PredictionCard)
const getColorForOption = (label: string, index: number) => {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel === 'sí' || normalizedLabel === 'si') {
    return optionColors[0]; // Verde para Sí
  }
  if (normalizedLabel === 'no') {
    return optionColors[1]; // Rojo para No
  }
  return optionColors[index % optionColors.length];
};

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
  const [predictionImages, setPredictionImages] = useState<Record<string, string>>({});
  const [potentialReturns, setPotentialReturns] = useState<Record<string, string>>({});
  const [predictionOptions, setPredictionOptions] = useState<Record<string, Array<{ description: string; totalAmount: string }>>>({});
  const [loadingImages, setLoadingImages] = useState(false);

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

  // Cargar imágenes de predicciones
  useEffect(() => {
    const loadImages = async () => {
      if (bets.length === 0) return;
      
      setLoadingImages(true);
      const imageMap: Record<string, string> = {};
      const returnsMap: Record<string, string> = {};
      const optionsMap: Record<string, Array<{ description: string; totalAmount: string }>> = {};

      await Promise.all(
        bets.map(async (bet) => {
          // Cargar imagen
          try {
            const img = await apiService.getPredictionImage(
              bet.predictionId,
              CONTRACT_ADDRESSES.PredictionMarket,
              NETWORK_CONFIG.chainId
            );
            if (img && typeof img === 'object' && 'image_url' in img && img.image_url) {
              imageMap[bet.predictionId] = img.image_url as string;
            }
          } catch (err) {
            console.error(`Error loading image for prediction ${bet.predictionId}:`, err);
          }

          // Cargar opciones para predicciones en cooldown o confirmadas (con 2 opciones)
          if ((bet.predictionStatus === 2 || bet.predictionStatus === 4) && bet.predictionStatus >= 0) {
            try {
              const options = await predictionMarketService.getPredictionOptions(bet.predictionId);
              if (options.length === 2) {
                optionsMap[bet.predictionId] = options.map(opt => ({
                  description: opt.description,
                  totalAmount: opt.totalAmount,
                }));
              }
            } catch (err) {
              console.error(`Error loading options for prediction ${bet.predictionId}:`, err);
            }
          }

          // Calcular retorno potencial para predicciones activas
          if (bet.predictionStatus <= 1) {
            try {
              const result = await predictionMarketService.calculatePotentialWinnings(
                bet.predictionId,
                bet.primaryOptionIndex,
                bet.totalBetAmount
              );
              returnsMap[bet.predictionId] = result.winnings;
            } catch (err) {
              console.error(`Error calculating potential return for prediction ${bet.predictionId}:`, err);
            }
          } else if (bet.predictionStatus === 4 && bet.canClaim) {
            // Para predicciones finalizadas ganadas, calcular retorno real
            try {
              const result = await predictionMarketService.calculateClaimableReward(
                bet.predictionId,
                address || ''
              );
              if (result.hasWinningBets) {
                returnsMap[bet.predictionId] = result.claimable;
              }
            } catch (err) {
              console.error(`Error calculating claimable reward for prediction ${bet.predictionId}:`, err);
            }
          }
        })
      );

      setPredictionImages(imageMap);
      setPotentialReturns(returnsMap);
      setPredictionOptions(optionsMap);
      setLoadingImages(false);
    };

    loadImages();
  }, [bets, address]);

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Formatear fecha completa para fecha de fin
  const formatFullDate = (timestamp: number) => {
    if (timestamp === 0 || timestamp >= 2**256 - 1) return '∞';
    return new Date(timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Formatear número con puntos
  const formatNumber = (num: number) => {
    return num.toLocaleString('es-ES');
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
        <div className="space-y-6">
          {filteredBets.map((bet) => {
            const result = getBetResult(bet);
            const isFinished = bet.predictionStatus === 4;
            const isActive = bet.predictionStatus <= 1;
            const imageUrl = predictionImages[bet.predictionId] || `https://api.dicebear.com/7.x/shapes/svg?seed=${bet.predictionId}`;
            const returnAmount = potentialReturns[bet.predictionId];
            const betReturn = returnAmount ? parseFloat(returnAmount) : 0;
            const betAmount = parseFloat(bet.totalBetAmount);
            const profit = betReturn - betAmount;
            
            return (
              <div
                key={bet.predictionId}
                onClick={() => onViewPrediction(bet.predictionId)}
                className="bg-slate-900/50 border border-slate-800/50 rounded-xl overflow-hidden hover:bg-slate-900/70 hover:border-slate-700/50 transition-all cursor-pointer flex items-center p-4 gap-4"
              >
                {/* Imagen de la predicción - Izquierda (encapsulada) */}
                <div className="relative w-40 h-32 bg-slate-800/50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-800/50">
                  <img
                    src={imageUrl}
                    alt={bet.predictionTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target;
                      if (target && 'src' in target) {
                        (target as { src: string }).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${bet.predictionId}`;
                      }
                    }}
                  />
                  
                  {/* Estado en esquina superior derecha */}
                  <div className="absolute top-2 right-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      isFinished
                        ? 'bg-slate-900/90 backdrop-blur-sm text-slate-300 border border-slate-700/50'
                        : 'bg-blue-500/90 backdrop-blur-sm text-white'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {STATUS_NAMES[bet.predictionStatus]}
                    </div>
                  </div>
                </div>

                {/* Separador visual */}
                <div className="w-px h-full bg-slate-800/50 flex-shrink-0"></div>

                {/* Contenido - Derecha */}
                <div className="flex-1 flex flex-col justify-center min-w-0 gap-3">
                  {/* Sección superior */}
                  <div className="space-y-2">
                    {/* Título */}
                    <h3 className="text-lg font-bold text-slate-100 line-clamp-1 leading-tight">
                      {bet.predictionTitle}
                    </h3>

                    {/* Votaste y metadata en fila */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500 text-sm">Votaste:</span>
                        {/* Mostrar todas las opciones únicas que votó con sus colores correspondientes */}
                        {Array.from(new Set(bet.bets.map(b => b.optionIndex))).map((optionIndex, idx) => {
                          const option = bet.bets.find(b => b.optionIndex === optionIndex);
                          if (!option) return null;
                          
                          const color = getColorForOption(option.optionDescription, optionIndex);
                          return (
                            <span 
                              key={idx}
                              className={`inline-block px-2.5 py-1 ${color.bg} border ${color.border} ${color.text} rounded-lg text-sm font-medium`}
                            >
                              {option.optionDescription}
                            </span>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center gap-3 text-slate-500 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(bet.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Trophy className="w-4 h-4" />
                          <span>{formatNumber(bet.totalParticipants)} participantes</span>
                        </div>
                      </div>
                    </div>
                </div>

                  {/* Detalles de apuesta - Sección inferior */}
                  <div className="grid grid-cols-3 gap-x-6 gap-y-2 pt-4 border-t border-slate-800/50">
                    {/* Apostado */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-500 text-xs">Apostado</span>
                      <span className="text-slate-200 font-semibold text-base">{betAmount.toFixed(2)} {bet.creatorTokenSymbol}</span>
                    </div>

                    {/* Retorno o Retorno potencial */}
                    {(() => {
                      // Determinar si hay opciones cargadas y es una predicción de 2 opciones
                      const options = predictionOptions[bet.predictionId];
                      const hasTwoOptions = options && options.length === 2;
                      
                      // Si hay 2 opciones y la predicción está en cooldown o confirmada, encontrar la más apostada
                      let mostBetOption: { description: string; totalAmount: string } | null = null;
                      if (hasTwoOptions && (bet.predictionStatus === 2 || bet.predictionStatus === 4)) {
                        mostBetOption = options.reduce((max, opt) => {
                          return parseFloat(opt.totalAmount) > parseFloat(max.totalAmount) ? opt : max;
                        });
                      }
                      
                      return isFinished && bet.canClaim ? (
                        <>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-500 text-xs">Retorno</span>
                            <span className="text-emerald-400 font-semibold text-base">{betReturn.toFixed(2)} {bet.creatorTokenSymbol}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-500 text-xs">Resultado</span>
                            {hasTwoOptions && mostBetOption ? (
                              <span className="text-emerald-400 font-semibold text-base flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                {mostBetOption.description}
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold text-base flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                Ganaste
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 col-span-3">
                            <span className="text-slate-500 text-xs">Ganancia/Pérdida</span>
                            <span className="text-emerald-400 font-semibold text-base">+{profit.toFixed(2)} {bet.creatorTokenSymbol}</span>
                          </div>
                        </>
                      ) : isFinished && !bet.canClaim ? (
                        <>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-500 text-xs">Resultado</span>
                            {hasTwoOptions && mostBetOption ? (
                              <span className="text-red-400 font-semibold text-base flex items-center gap-1.5">
                                <XCircle className="w-4 h-4" />
                                {mostBetOption.description}
                              </span>
                            ) : (
                              <span className="text-red-400 font-semibold text-base flex items-center gap-1.5">
                                <XCircle className="w-4 h-4" />
                                Perdiste
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 col-span-2">
                            <span className="text-slate-500 text-xs">Ganancia/Pérdida</span>
                            <span className="text-red-400 font-semibold text-base">-{betAmount.toFixed(2)} {bet.creatorTokenSymbol}</span>
                          </div>
                        </>
                      ) : (
                      <>
                        {returnAmount && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-slate-500 text-xs">Retorno potencial</span>
                            <span className="text-blue-400 font-semibold text-base">{betReturn.toFixed(2)} {bet.creatorTokenSymbol}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-500 text-xs">Finaliza</span>
                          <span className="text-slate-300 font-semibold text-base">{formatFullDate(bet.closesAt)}</span>
                        </div>
                      </>
                    );
                    })()}
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
