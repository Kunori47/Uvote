import { useState } from 'react';
import { ArrowLeft, Calendar, Users, TrendingUp, Eye, Share2, Edit, CheckCircle2, Clock, DollarSign, Award, Activity, MessageSquare, ThumbsUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import React from 'react';

interface PredictionOption {
  id: string;
  text: string;
  color: string;
  votes: number;
  totalStaked: number;
  percentage: number;
}

interface TopBettor {
  id: string;
  username: string;
  avatar: string;
  amount: number;
  option: string;
  date: string;
}

interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  likes: number;
  date: string;
}

interface EngagementData {
  date: string;
  participants: number;
  totalStaked: number;
}

interface PredictionDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  createdDate: string;
  endDate?: string;
  finalizedDate?: string;
  status: 'active' | 'finished';
  category: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    followers: number;
  };
  participants: number;
  totalStaked: number;
  views: number;
  shares: number;
  options: PredictionOption[];
  winningOption?: string;
  // Creator-only data
  earnings?: number;
  commission?: number; // Porcentaje de comisión
  topBettors?: TopBettor[];
  engagementData?: EngagementData[];
  comments: Comment[];
}

const mockPrediction: PredictionDetail = {
  id: '1',
  title: '¿Argentina ganará el próximo Mundial 2026?',
  description: 'La Selección Argentina, actual campeona del mundo, se prepara para defender su título en el Mundial 2026 que se celebrará en Estados Unidos, México y Canadá. Con Lionel Messi aún en el equipo y una nueva generación de talentos emergentes, ¿lograrán repetir la hazaña?',
  thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop',
  createdDate: '2024-10-01',
  endDate: '2026-06-15',
  status: 'active',
  category: 'Deportes',
  creator: {
    id: '1',
    name: 'Juan Pérez',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    followers: 15420,
  },
  participants: 12450,
  totalStaked: 125000,
  views: 45600,
  shares: 892,
  earnings: 6250,
  commission: 5,
  options: [
    { id: '1', text: 'Sí', color: '#10b981', votes: 7850, totalStaked: 78500, percentage: 63.1 },
    { id: '2', text: 'No', color: '#ef4444', votes: 4600, totalStaked: 46500, percentage: 36.9 },
  ],
  topBettors: [
    { id: '1', username: 'CryptoKing', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', amount: 5000, option: 'Sí', date: '2024-10-15' },
    { id: '2', username: 'BetMaster', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', amount: 4200, option: 'Sí', date: '2024-10-20' },
    { id: '3', username: 'LuckyPlayer', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', amount: 3800, option: 'No', date: '2024-10-18' },
    { id: '4', username: 'ProBetter', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', amount: 3500, option: 'Sí', date: '2024-10-22' },
    { id: '5', username: 'WinnerCircle', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', amount: 3200, option: 'No', date: '2024-10-25' },
  ],
  engagementData: [
    { date: '01 Oct', participants: 120, totalStaked: 1200 },
    { date: '05 Oct', participants: 450, totalStaked: 4500 },
    { date: '10 Oct', participants: 1200, totalStaked: 12000 },
    { date: '15 Oct', participants: 2800, totalStaked: 28000 },
    { date: '20 Oct', participants: 5500, totalStaked: 55000 },
    { date: '25 Oct', participants: 8900, totalStaked: 89000 },
    { date: '30 Oct', participants: 11200, totalStaked: 112000 },
    { date: '05 Nov', participants: 12450, totalStaked: 125000 },
  ],
  comments: [
    { id: '1', username: 'FutbolFan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', text: 'Argentina tiene un equipazo, pero la competencia será dura. ¡Vamos Messi!', likes: 124, date: '2024-11-01' },
    { id: '2', username: 'SportsAnalyst', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', text: 'Depende mucho de si Messi sigue en forma para 2026. La edad es un factor.', likes: 89, date: '2024-11-02' },
    { id: '3', username: 'Mundial2026', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', text: 'Brasil y Francia también son candidatos muy fuertes. No será fácil.', likes: 67, date: '2024-11-03' },
  ],
};

interface PredictionDetailPageProps {
  predictionId: string;
  isCreatorView?: boolean;
  onBack: () => void;
}

export function PredictionDetailPage({ predictionId, isCreatorView = false, onBack }: PredictionDetailPageProps) {
  const [prediction] = useState<PredictionDetail>(mockPrediction);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [userVote, setUserVote] = useState<{ optionId: string; amount: number } | null>(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleFinalize = () => {
    if (!selectedWinner) return;
    // Finalizar predicción
    console.log('Finalizando predicción con ganador:', selectedWinner);
    setShowFinalizationModal(false);
  };

  const handleVote = () => {
    if (!selectedOption || !voteAmount) return;
    setUserVote({ optionId: selectedOption, amount: parseFloat(voteAmount) });
    setVoteAmount('');
    setSelectedOption('');
  };

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      {/* Header */}
      <div className="mb-6">
        <img
          src={prediction.thumbnail}
          alt={prediction.title}
          className="w-full h-96 object-cover rounded-xl mb-6"
        />

        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 text-sm">
                {prediction.category}
              </span>
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
            <h1 className="text-slate-100 mb-3">{prediction.title}</h1>
            <p className="text-slate-400 mb-4">{prediction.description}</p>

            {/* Creator Info */}
            <div className="flex items-center gap-3">
              <img
                src={prediction.creator.avatar}
                alt={prediction.creator.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="text-slate-200">{prediction.creator.name}</div>
                <div className="text-slate-500 text-sm">{prediction.creator.followers.toLocaleString()} seguidores</div>
              </div>
            </div>
          </div>

          {/* Creator Actions */}
          {isCreatorView && prediction.status === 'active' && (
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-all">
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => setShowFinalizationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar</span>
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>Participantes</span>
            </div>
            <div className="text-slate-100">{prediction.participants.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Total Apostado</span>
            </div>
            <div className="text-slate-100">{prediction.totalStaked.toLocaleString()}u</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Eye className="w-4 h-4" />
              <span>Vistas</span>
            </div>
            <div className="text-slate-100">{prediction.views.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Share2 className="w-4 h-4" />
              <span>Compartido</span>
            </div>
            <div className="text-slate-100">{prediction.shares.toLocaleString()}</div>
          </div>
        </div>

        {/* Creator Stats */}
        {isCreatorView && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Ingresos</span>
              </div>
              <div className="text-emerald-400 text-2xl">{prediction.earnings?.toLocaleString()}u</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
              <div className="text-slate-500 text-sm mb-1">Comisión</div>
              <div className="text-slate-100 text-2xl">{prediction.commission}%</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
              <div className="text-slate-500 text-sm mb-1">Ingresos Proyectados</div>
              <div className="text-slate-100 text-2xl">
                {prediction.earnings ? Math.round(prediction.earnings * 1.3).toLocaleString() : 0}u
              </div>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-6 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Creada: {formatDate(prediction.createdDate)}</span>
          </div>
          {prediction.status === 'active' && prediction.endDate && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Finaliza: {formatDate(prediction.endDate)}</span>
            </div>
          )}
          {prediction.status === 'finished' && prediction.finalizedDate && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizada: {formatDate(prediction.finalizedDate)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Options */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
            <h2 className="text-slate-200 mb-4">Opciones</h2>
            <div className="space-y-4">
              {prediction.options.map((option) => {
                const isWinner = prediction.winningOption === option.text;
                const isUserVote = userVote?.optionId === option.id;

                return (
                  <div
                    key={option.id}
                    className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
                      isWinner
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-slate-800/50 hover:border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="px-3 py-1 rounded-lg text-sm font-medium"
                          style={{
                            backgroundColor: `${option.color}20`,
                            color: option.color,
                            border: `1px solid ${option.color}40`,
                          }}
                        >
                          {option.text}
                        </span>
                        {isWinner && (
                          <span className="flex items-center gap-1 text-emerald-400 text-sm">
                            <Award className="w-4 h-4" />
                            Ganadora
                          </span>
                        )}
                        {isUserVote && (
                          <span className="text-blue-400 text-sm">Tu voto</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-slate-100 text-lg">{option.percentage}%</div>
                        <div className="text-slate-500 text-sm">{option.votes.toLocaleString()} votos</div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${option.percentage}%`,
                            backgroundColor: option.color,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-slate-400 text-sm">
                      Total apostado: {option.totalStaked.toLocaleString()}u
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vote Section - Only for non-creator view and active predictions */}
            {!isCreatorView && prediction.status === 'active' && !userVote && (
              <div className="mt-6 pt-6 border-t border-slate-800/50">
                <h3 className="text-slate-200 mb-4">Haz tu predicción</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Selecciona una opción</label>
                    <div className="grid grid-cols-2 gap-3">
                      {prediction.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedOption(option.id)}
                          className={`px-4 py-3 rounded-xl text-sm transition-all ${
                            selectedOption === option.id
                              ? 'border-2 text-slate-100'
                              : 'border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600/50'
                          }`}
                          style={
                            selectedOption === option.id
                              ? {
                                  backgroundColor: `${option.color}20`,
                                  borderColor: option.color,
                                }
                              : {}
                          }
                        >
                          {option.text}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-sm mb-2">Cantidad a apostar</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="100"
                        value={voteAmount}
                        onChange={(e) => setVoteAmount(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">u</span>
                    </div>
                  </div>
                  <button
                    onClick={handleVote}
                    disabled={!selectedOption || !voteAmount}
                    className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl transition-all"
                  >
                    Votar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Engagement Chart - Creator Only */}
          {isCreatorView && prediction.engagementData && (
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
              <h2 className="text-slate-200 mb-4">Participación en el Tiempo</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prediction.engagementData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="participants"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Participantes"
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
            <h2 className="text-slate-200 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comentarios ({prediction.comments.length})
            </h2>
            <div className="space-y-4">
              {prediction.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img
                    src={comment.avatar}
                    alt={comment.username}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-200">{comment.username}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500 text-sm">{formatDate(comment.date)}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{comment.text}</p>
                    <button className="flex items-center gap-1 text-slate-500 hover:text-emerald-400 text-sm transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Bettors - Creator Only */}
          {isCreatorView && prediction.topBettors && (
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
              <h2 className="text-slate-200 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Apostadores
              </h2>
              <div className="space-y-3">
                {prediction.topBettors.map((bettor, index) => (
                  <div key={bettor.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 text-center">
                      <span className={`${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-slate-400' :
                        index === 2 ? 'text-orange-400' :
                        'text-slate-600'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                    <img
                      src={bettor.avatar}
                      alt={bettor.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-200 text-sm truncate">{bettor.username}</div>
                      <div className="text-slate-500 text-xs">{bettor.option}</div>
                    </div>
                    <div className="text-emerald-400 text-sm">{bettor.amount.toLocaleString()}u</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
            <h2 className="text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Actividad Reciente
            </h2>
            <div className="space-y-3">
              <div className="text-slate-400 text-sm">
                <span className="text-slate-200">ProBetter</span> apostó 3,500u a <span className="text-emerald-400">Sí</span>
                <div className="text-slate-600 text-xs mt-1">Hace 2 horas</div>
              </div>
              <div className="text-slate-400 text-sm">
                <span className="text-slate-200">LuckyPlayer</span> apostó 3,800u a <span className="text-red-400">No</span>
                <div className="text-slate-600 text-xs mt-1">Hace 5 horas</div>
              </div>
              <div className="text-slate-400 text-sm">
                <span className="text-slate-200">BetMaster</span> apostó 4,200u a <span className="text-emerald-400">Sí</span>
                <div className="text-slate-600 text-xs mt-1">Hace 8 horas</div>
              </div>
            </div>
          </div>

          {/* Share */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
            <h2 className="text-slate-200 mb-4">Compartir</h2>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-all">
              <Share2 className="w-4 h-4" />
              <span>Compartir predicción</span>
            </button>
          </div>
        </div>
      </div>

      {/* Finalization Modal */}
      {showFinalizationModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-slate-100 text-xl mb-4">Finalizar Predicción</h2>
            <p className="text-slate-400 text-sm mb-6">
              Selecciona la opción ganadora para finalizar esta predicción. Esta acción no se puede deshacer.
            </p>

            <div className="space-y-3 mb-6">
              {prediction.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedWinner(option.id)}
                  className={`w-full px-4 py-3 rounded-xl text-left transition-all ${
                    selectedWinner === option.id
                      ? 'border-2'
                      : 'border border-slate-700/50 hover:border-slate-600/50'
                  }`}
                  style={
                    selectedWinner === option.id
                      ? {
                          backgroundColor: `${option.color}20`,
                          borderColor: option.color,
                        }
                      : {}
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200">{option.text}</span>
                    <span className="text-slate-400">{option.percentage}%</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinalizationModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalize}
                disabled={!selectedWinner}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
