import { useState } from "react";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Bell,
  BellOff,
  CheckCircle,
  UserPlus,
  BarChart3,
  Filter,
  Calendar,
  Trophy,
  Target,
  Award,
  Coins,
} from "lucide-react";
import { PredictionCard } from "./PredictionCard";
import React from "react";

interface Creator {
  id: string;
  name: string;
  avatar: string;
  banner: string;
  category: string;
  followers: number;
  totalPredictions: number;
  activePredictions: number;
  winRate: number;
  joinedDate: string;
  bio: string;
  isSubscribed: boolean;
  notificationsEnabled: boolean;
  hasCreatorCoin: boolean;
  coinSymbol?: string;
  coinValue?: number;
  coinBalance?: number;
  totalEarnings?: number;
  averageParticipants?: number;
}

interface Prediction {
  id: string;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  question: string;
  category: string;
  totalPool: number;
  options: Array<{
    id: string;
    label: string;
    votes: number;
  }>;
  endDate: string;
  thumbnail: string;
  status?: "active" | "ended" | "cancelled";
}

const mockCreator: Creator = {
  id: "1",
  name: "Ibai",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
  banner:
    "https://images.unsplash.com/photo-1642779179433-52493000bc73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920",
  category: "Gaming",
  followers: 1250000,
  totalPredictions: 156,
  activePredictions: 12,
  winRate: 68.5,
  joinedDate: "2023-06-15",
  bio: "Creador de contenido enfocado en Gaming, Esports y entretenimiento. Creando las mejores predicciones sobre eventos de gaming y competiciones.",
  isSubscribed: true,
  notificationsEnabled: true,
  hasCreatorCoin: true,
  coinSymbol: "IBAI",
  coinValue: 2.5,
  coinBalance: 1000,
  totalEarnings: 125000,
  averageParticipants: 8500,
};

const mockPredictions: Prediction[] = [
  {
    id: "1",
    creator: {
      name: "Ibai",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    question: "¿Quién ganará la LVP Superliga 2025?",
    category: "Gaming",
    totalPool: 45670,
    options: [
      { id: "1", label: "KOI", votes: 6823 },
      { id: "2", label: "G2 Heretics", votes: 4570 },
      { id: "3", label: "MAD Lions", votes: 2284 },
      { id: "4", label: "Otro equipo", votes: 1557 },
    ],
    endDate: "2025-12-15",
    thumbnail:
      "https://images.unsplash.com/photo-1635372730136-06b29022281c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    status: "active",
  },
  {
    id: "2",
    creator: {
      name: "Ibai",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    question: "¿Lanzará GTA 6 en 2025?",
    category: "Gaming",
    totalPool: 67890,
    options: [
      { id: "1", label: "Sí", votes: 9382 },
      { id: "2", label: "No", votes: 14074 },
    ],
    endDate: "2025-12-31",
    thumbnail:
      "https://images.unsplash.com/photo-1738858078480-916cda8e6e3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    status: "active",
  },
  {
    id: "3",
    creator: {
      name: "Ibai",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    question: "¿Cuántos viewers tendrá la Velada del Año IV?",
    category: "Entertainment",
    totalPool: 52340,
    options: [
      { id: "1", label: "Más de 3M", votes: 7506 },
      { id: "2", label: "Entre 2M-3M", votes: 6568 },
      { id: "3", label: "Entre 1M-2M", votes: 3753 },
      { id: "4", label: "Menos de 1M", votes: 938 },
    ],
    endDate: "2025-11-20",
    thumbnail:
      "https://images.unsplash.com/photo-1669670617524-5f08060c8dcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    status: "active",
  },
  {
    id: "4",
    creator: {
      name: "Ibai",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    question: "¿T1 ganará Worlds 2025?",
    category: "Esports",
    totalPool: 38670,
    options: [
      { id: "1", label: "Sí", votes: 7734 },
      { id: "2", label: "No", votes: 5156 },
    ],
    endDate: "2025-11-05",
    thumbnail:
      "https://images.unsplash.com/photo-1635372730136-06b29022281c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    status: "active",
  },
  {
    id: "5",
    creator: {
      name: "Ibai",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    question: "¿El nuevo juego de Riot será exitoso?",
    category: "Gaming",
    totalPool: 29630,
    options: [
      { id: "1", label: "Sí", votes: 5925 },
      { id: "2", label: "No", votes: 3950 },
    ],
    endDate: "2025-12-01",
    thumbnail:
      "https://images.unsplash.com/photo-1611138290962-2c550ffd4002?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    status: "active",
  },
  {
    id: "6",
    creator: {
      name: "Ibai",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      verified: true,
    },
    question: "¿Habrá colaboración Ibai x Rubius en 2025?",
    category: "Entertainment",
    totalPool: 64370,
    options: [
      { id: "1", label: "Sí", votes: 17165 },
      { id: "2", label: "No", votes: 4291 },
    ],
    endDate: "2025-12-31",
    thumbnail:
      "https://images.unsplash.com/photo-1611138290962-2c550ffd4002?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    status: "active",
  },
];

type TabType = "predictions" | "about" | "stats";
type FilterStatus = "all" | "active" | "ended" | "cancelled";
type SortOption = "recent" | "popular" | "ending-soon" | "most-votes";

const sortOptions = [
  { id: "recent" as SortOption, label: "Más recientes" },
  { id: "popular" as SortOption, label: "Más populares" },
  { id: "ending-soon" as SortOption, label: "Finalizan pronto" },
  { id: "most-votes" as SortOption, label: "Más votos" },
];

interface CreatorProfilePageProps {
  creatorId: string;
  onBack: () => void;
}

export function CreatorProfilePage({
  creatorId,
  onBack,
}: CreatorProfilePageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("predictions");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [isSubscribed, setIsSubscribed] = useState(mockCreator.isSubscribed);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    mockCreator.notificationsEnabled
  );
  const [showSortMenu, setShowSortMenu] = useState(false);

  const creator = mockCreator;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  };

  // Filter and sort predictions
  const filteredAndSortedPredictions = mockPredictions
    .filter((pred) => {
      if (filterStatus === "all") return true;
      return pred.status === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b.id.localeCompare(a.id); // Assuming higher ID = more recent
        case "popular":
          return b.totalPool - a.totalPool;
        case "ending-soon":
          return (
            new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
          );
        case "most-votes":
          return b.totalPool - a.totalPool;
        default:
          return 0;
      }
    });

  return (
    <div className="pb-6">
      {/* Back Button */}
      <div className="p-6 pb-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
      </div>

      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-slate-900/50 border-y border-slate-800/50 mb-6">
        <img
          src={creator.banner}
          alt={creator.name}
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="px-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-20 md:-mt-16 mb-6">
          {/* Avatar */}
          <div className="relative z-10">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0a0a0f] bg-slate-900 object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-slate-100">{creator.name}</h1>
                  {isSubscribed && (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  )}
                  <span className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-slate-300 text-sm">
                    {creator.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{formatNumber(creator.followers)} seguidores</span>
                  </div>
                  <span className="text-slate-700">•</span>
                  <span>{creator.totalPredictions} predicciones</span>
                  <span className="text-slate-700">•</span>
                  <span>Se unió en {formatDate(creator.joinedDate)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`p-3 rounded-xl transition-all ${
                    notificationsEnabled
                      ? "bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/50"
                      : "bg-slate-900/50 text-slate-500 hover:bg-slate-800/50 border border-slate-800/50"
                  }`}
                >
                  {notificationsEnabled ? (
                    <Bell className="w-5 h-5" />
                  ) : (
                    <BellOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                    isSubscribed
                      ? "bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/50"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Suscrito</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Suscribirse</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">% Acierto</span>
            </div>
            <div className="text-emerald-400 text-2xl">{creator.winRate}%</div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm">Activas</span>
            </div>
            <div className="text-slate-100 text-2xl">
              {creator.activePredictions}
            </div>
          </div>

          {creator.hasCreatorCoin && (
            <>
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm">Moneda</span>
                </div>
                <div className="text-slate-100 text-2xl">
                  {creator.coinValue}u
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  {creator.coinSymbol}
                </div>
              </div>

              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Ganancias</span>
                </div>
                <div className="text-slate-100 text-2xl">
                  {formatNumber(creator.totalEarnings || 0)}u
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-800/50 mb-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab("predictions")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "predictions"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Predicciones
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "about"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Información
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "stats"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Estadísticas
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "predictions" && (
          <div>
            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
              {/* Status Filters */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                    filterStatus === "all"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-900/50 text-slate-400 border border-slate-800/50 hover:bg-slate-800/50"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                    filterStatus === "active"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-900/50 text-slate-400 border border-slate-800/50 hover:bg-slate-800/50"
                  }`}
                >
                  Activas ({creator.activePredictions})
                </button>
                <button
                  onClick={() => setFilterStatus("ended")}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                    filterStatus === "ended"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-900/50 text-slate-400 border border-slate-800/50 hover:bg-slate-800/50"
                  }`}
                >
                  Finalizadas
                </button>
              </div>

              {/* Sort */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-slate-300 hover:bg-slate-800/50 transition-all whitespace-nowrap"
                >
                  <Filter className="w-4 h-4" />
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

            {/* Predictions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedPredictions.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No hay predicciones para mostrar
                </div>
              ) : (
                filteredAndSortedPredictions.map((prediction) => (
                  <PredictionCard key={prediction.id} prediction={prediction} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-3xl">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 mb-6">
              <h2 className="text-slate-100 mb-4">Sobre {creator.name}</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                {creator.bio}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-500 text-sm mb-1">Categoría Principal</div>
                  <div className="text-slate-200">{creator.category}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">Miembro desde</div>
                  <div className="text-slate-200">{formatDate(creator.joinedDate)}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">Total Seguidores</div>
                  <div className="text-slate-200">{formatNumber(creator.followers)}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">Promedio Participantes</div>
                  <div className="text-slate-200">
                    {formatNumber(creator.averageParticipants || 0)} por predicción
                  </div>
                </div>
              </div>
            </div>

            {creator.hasCreatorCoin && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-slate-100 mb-2">Moneda del Creador</h3>
                    <p className="text-slate-400 text-sm">
                      Invierte en {creator.name} comprando su moneda oficial
                    </p>
                  </div>
                  <Coins className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Símbolo</div>
                    <div className="text-emerald-400">{creator.coinSymbol}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Precio Actual</div>
                    <div className="text-emerald-400">{creator.coinValue}u</div>
                  </div>
                </div>
                {creator.coinBalance && creator.coinBalance > 0 && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20">
                    <div className="text-slate-400 text-sm mb-1">Tus tenencias</div>
                    <div className="text-slate-100">
                      {creator.coinBalance.toLocaleString()} {creator.coinSymbol}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Stats */}
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-slate-100">Rendimiento</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Tasa de Acierto</span>
                      <span className="text-emerald-400">{creator.winRate}%</span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${creator.winRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Predicciones Totales</div>
                    <div className="text-slate-200 text-xl">{creator.totalPredictions}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Predicciones Activas</div>
                    <div className="text-slate-200 text-xl">{creator.activePredictions}</div>
                  </div>
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-slate-100">Engagement</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Seguidores</div>
                    <div className="text-slate-200 text-xl">
                      {formatNumber(creator.followers)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Promedio Participantes</div>
                    <div className="text-slate-200 text-xl">
                      {formatNumber(creator.averageParticipants || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Ratio Engagement</div>
                    <div className="text-slate-200 text-xl">
                      {((creator.averageParticipants || 0) / creator.followers * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Stats */}
              {creator.hasCreatorCoin && (
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-slate-100">Financiero</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500 text-sm mb-1">Ganancias Totales</div>
                      <div className="text-slate-200 text-xl">
                        {formatNumber(creator.totalEarnings || 0)}u
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-sm mb-1">Valor Moneda</div>
                      <div className="text-slate-200 text-xl">{creator.coinValue}u</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-sm mb-1">Promedio por Predicción</div>
                      <div className="text-slate-200 text-xl">
                        {formatNumber(Math.floor((creator.totalEarnings || 0) / creator.totalPredictions))}u
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="text-slate-100">Categorías</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Gaming</span>
                      <span className="text-slate-400 text-sm">65%</span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "65%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Esports</span>
                      <span className="text-slate-400 text-sm">25%</span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "25%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Entertainment</span>
                      <span className="text-slate-400 text-sm">10%</span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "10%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}