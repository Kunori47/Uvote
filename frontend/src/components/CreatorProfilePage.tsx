import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Bell,
  BellOff,
  CheckCircle,
  UserPlus,
  UserMinus,
  BarChart3,
  Filter,
  Calendar,
  Trophy,
  Target,
  Award,
  Coins,
  Loader2,
} from "lucide-react";
import { PredictionCard } from "./PredictionCard";
import React from "react";
import { useWallet } from "../hooks/useWallet";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { usePredictions, PredictionData } from "../hooks/usePredictions";
import { useMyCreatorToken } from "../hooks/useMyCreatorToken";
import { apiService } from "../lib/apiService";
import { tokenExchangeService } from "../lib/contractService";
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from "../lib/contracts";

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
  bio: "Content creator focused on Gaming, Esports and entertainment. Creating the best predictions about gaming events and competitions.",
  isSubscribed: true,
  notificationsEnabled: true,
  hasCreatorCoin: true,
  coinSymbol: "IBAI",
  coinValue: 2.5,
  coinBalance: 1000,
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
    question: "Who will win the LVP Superliga 2025?",
    category: "Gaming",
    totalPool: 45670,
    options: [
      { id: "1", label: "KOI", votes: 6823 },
      { id: "2", label: "G2 Heretics", votes: 4570 },
      { id: "3", label: "MAD Lions", votes: 2284 },
      { id: "4", label: "Other team", votes: 1557 },
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
    question: "Will GTA 6 be released in 2025?",
    category: "Gaming",
    totalPool: 67890,
    options: [
      { id: "1", label: "Yes", votes: 9382 },
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
    question: "How many viewers will the Velada del Año IV have?",
    category: "Entertainment",
    totalPool: 52340,
    options: [
      { id: "1", label: "More than 3M", votes: 7506 },
      { id: "2", label: "Between 2M-3M", votes: 6568 },
      { id: "3", label: "Between 1M-2M", votes: 3753 },
      { id: "4", label: "Less than 1M", votes: 938 },
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
    question: "Will T1 win Worlds 2025?",
    category: "Esports",
    totalPool: 38670,
    options: [
      { id: "1", label: "Yes", votes: 7734 },
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
    question: "Will Riot's new game be successful?",
    category: "Gaming",
    totalPool: 29630,
    options: [
      { id: "1", label: "Yes", votes: 5925 },
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
    question: "Will there be an Ibai x Rubius collaboration in 2025?",
    category: "Entertainment",
    totalPool: 64370,
    options: [
      { id: "1", label: "Yes", votes: 17165 },
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
  { id: "recent" as SortOption, label: "Most recent" },
  { id: "popular" as SortOption, label: "Most popular" },
  { id: "ending-soon" as SortOption, label: "Ending soon" },
  { id: "most-votes" as SortOption, label: "Most votes" },
];

interface CreatorProfilePageProps {
  creatorId: string;
  onBack: () => void;
}

export function CreatorProfilePage({
  creatorId,
  onBack,
}: CreatorProfilePageProps) {
  const { address: currentUserAddress, isConnected } = useWallet();
  const { predictions: allPredictions } = usePredictions();
  const { token: creatorToken, hasToken: hasCreatorToken } = useMyCreatorToken(creatorId);
  const { isSubscribed: isUserSubscribed, subscribe, unsubscribe, loading: subscriptionLoading } = useSubscriptions(currentUserAddress);
  
  const [activeTab, setActiveTab] = useState<TabType>("predictions");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // States for real data
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [creatorEarnings, setCreatorEarnings] = useState<string>("0");
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [predictionThumbnails, setPredictionThumbnails] = useState<Record<string, string>>({});
  const [isTogglingSubscription, setIsTogglingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

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

  // ============ LOAD BACKEND DATA ============
  
  // Load creator profile from Supabase
  useEffect(() => {
    const loadCreatorProfile = async () => {
      if (!creatorId) return;

      try {
        setLoadingProfile(true);
        setProfileError(null);

        const user: any = await apiService.getUser(creatorId);
        const followersCount = await apiService.getCreatorFollowersCount(creatorId);

        if (!user) {
          // If no user in backend, use basic data
          const shortAddr = `${creatorId.slice(0, 6)}...${creatorId.slice(-4)}`;
          setCreator({
            ...mockCreator,
            id: creatorId,
            name: shortAddr,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorId}`,
            followers: 0,
            joinedDate: new Date().toISOString(),
            bio: "",
            hasCreatorCoin: false,
          });
          return;
        }

        const displayName =
          user.display_name ||
          user.username ||
          `${creatorId.slice(0, 6)}...${creatorId.slice(-4)}`;

        setCreator({
          ...mockCreator,
          id: creatorId,
          name: displayName,
          avatar:
            user.profile_image_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorId}`,
          banner: mockCreator.banner, // Use default banner if no custom one
          bio: user.bio || "",
          followers: followersCount,
          joinedDate: user.created_at || new Date().toISOString(),
        });
      } catch (e: any) {
        console.error("Error loading creator profile:", e);
        setProfileError(e?.message || "Error loading creator profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadCreatorProfile();
  }, [creatorId]);

  // ============ LOAD BLOCKCHAIN DATA ============

  // Load creator token information
  useEffect(() => {
    if (!creatorId || !hasCreatorToken || !creatorToken || !creator) {
      if (creator) {
        setCreator((prev) => ({
          ...prev!,
          hasCreatorCoin: false,
          coinSymbol: undefined,
          coinValue: undefined,
        }));
      }
      return;
    }

    setCreator((prev) => ({
      ...prev!,
      hasCreatorCoin: true,
      coinSymbol: creatorToken.symbol,
      coinValue: parseFloat(creatorToken.price),
    }));
  }, [creatorId, hasCreatorToken, creatorToken]);

  // Load creator earnings
  useEffect(() => {
    const loadEarnings = async () => {
      if (!creatorId || !hasCreatorToken) {
        setCreatorEarnings("0");
        return;
      }

      try {
        setLoadingEarnings(true);
        const earningsEth = await tokenExchangeService.getCreatorEarnings(creatorId);
        setCreatorEarnings(earningsEth);
      } catch (err) {
        console.error("Error loading creator earnings:", err);
        setCreatorEarnings("0");
      } finally {
        setLoadingEarnings(false);
      }
    };

    loadEarnings();
  }, [creatorId, hasCreatorToken]);

  // Filter creator predictions
  const creatorPredictions: PredictionData[] = useMemo(() => {
    if (!creatorId) return [];
    return allPredictions.filter(
      (p) => p.creator.toLowerCase() === creatorId.toLowerCase()
    );
  }, [allPredictions, creatorId]);

  // Load creator prediction images
  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      if (!creatorPredictions || creatorPredictions.length === 0) {
        setPredictionThumbnails({});
        return;
      }

      try {
        const entries: Array<[string, string]> = [];

        await Promise.all(
          creatorPredictions.map(async (pred) => {
            try {
              const img: any = await apiService.getPredictionImage(
                pred.id,
                CONTRACT_ADDRESSES.PredictionMarket,
                NETWORK_CONFIG.chainId
              );
              if (img && img.image_url) {
                entries.push([pred.id, img.image_url as string]);
              }
            } catch (e) {
              // Ignorar errores individuales
            }
          })
        );

        if (!cancelled) {
          const map: Record<string, string> = {};
          for (const [id, url] of entries) {
            map[id] = url;
          }
          setPredictionThumbnails(map);
        }
      } catch (e) {
        console.error("Error loading creator prediction thumbnails:", e);
      }
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [creatorPredictions]);

  // Update prediction statistics
  useEffect(() => {
    if (!creator) return;
    
    const totalPredictions = creatorPredictions.length;
    const activePredictions = creatorPredictions.filter(
      (p) => p.status === 0 || p.status === 1 || p.status === 2 || p.status === 3
    ).length;
    
    // Calculate success percentage based on confirmed predictions
    // Only count predictions that are confirmed (status === 4) and have a valid winningOption
    const confirmedPredictions = creatorPredictions.filter(
      (p) => p.status === 4 && p.winningOption >= 0 && p.winningOption < p.options.length
    );
    
    // Only count predictions that have been resolved (status >= 2) to calculate the percentage
    // Exclude active, cancelled, and disputed predictions from the calculation
    const resolvedPredictions = creatorPredictions.filter(
      (p) => p.status === 2 || p.status === 3 || p.status === 4 || p.status === 5
    );
    
    // Calculate win rate: percentage of confirmed predictions over resolved predictions
    let winRate = 0;
    if (resolvedPredictions.length > 0) {
      winRate = (confirmedPredictions.length / resolvedPredictions.length) * 100;
      // Round to 1 decimal
      winRate = Math.round(winRate * 10) / 10;
    }

    // Calculate average participants of all creator predictions
    let totalParticipants = 0;
    let predictionsWithParticipants = 0;

    creatorPredictions.forEach((pred) => {
      // For each prediction, sum totalBettors from all options
      const participantsInPrediction = pred.options.reduce((sum, opt) => sum + opt.totalBettors, 0);
      if (participantsInPrediction > 0) {
        totalParticipants += participantsInPrediction;
        predictionsWithParticipants++;
      }
    });

    // Calculate the average
    const averageParticipants = predictionsWithParticipants > 0 
      ? Math.round(totalParticipants / predictionsWithParticipants)
      : 0;

    setCreator((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        totalPredictions,
        activePredictions,
        winRate,
        averageParticipants,
      };
    });
  }, [creatorPredictions, creator]);

  // ============ SUBSCRIPTION MANAGEMENT ============

  const handleToggleSubscription = async () => {
    if (!isConnected || !currentUserAddress) {
      setSubscriptionError("You must connect your wallet to subscribe");
      setTimeout(() => setSubscriptionError(null), 3000);
      return;
    }

    if (isTogglingSubscription) return;

    try {
      setIsTogglingSubscription(true);
      setSubscriptionError(null);
      
      if (isUserSubscribed(creatorId)) {
        await unsubscribe(creatorId);
      } else {
        await subscribe(creatorId);
      }
    } catch (err: any) {
      console.error("Error toggling subscription:", err);
      setSubscriptionError(err.message || "Error changing subscription");
      setTimeout(() => setSubscriptionError(null), 5000);
    } finally {
      setIsTogglingSubscription(false);
    }
  };

  // Verify subscription status
  const isSubscribed = isUserSubscribed(creatorId);

  // Convert blockchain predictions to PredictionCard format
  const predictionsForCards = useMemo(() => {
    if (!creator) return [];
    
    return creatorPredictions.map((pred) => {
      const MAX_SAFE_TIMESTAMP = 10 ** 15;
      let endDate: string;
      if (pred.closesAt > MAX_SAFE_TIMESTAMP) {
        endDate = "Indefinite";
      } else {
        const date = new Date(pred.closesAt * 1000);
        endDate = isNaN(date.getTime())
          ? "Indefinite"
          : date.toISOString().split("T")[0];
      }

      const options = pred.options.map((opt, index) => ({
        id: index.toString(),
        label: opt.description,
        votes: parseFloat(opt.totalAmount),
      }));

      let predCategory = "other";
      const title = pred.title.toLowerCase();
      if (title.includes("sports") || title.includes("soccer") || title.includes("madrid")) {
        predCategory = "sports";
      } else if (title.includes("juego") || title.includes("gaming") || title.includes("gta")) {
        predCategory = "gaming";
      } else if (title.includes("crypto") || title.includes("bitcoin") || title.includes("eth")) {
        predCategory = "crypto";
      } else if (title.includes("tech") || title.includes("technology") || title.includes("iphone")) {
        predCategory = "tech";
      }

      let status: "active" | "ended" | "cancelled" = "active";
      if (pred.status === 4) {
        status = "ended";
      } else if (pred.status === 6) {
        status = "cancelled";
      }

      return {
        id: pred.id,
        creator: {
          name: creator.name,
          avatar: creator.avatar,
          verified: true,
        },
        question: pred.title,
        category: predCategory,
        totalPool: parseFloat(pred.totalPool),
        options,
        endDate,
        thumbnail:
          predictionThumbnails[pred.id] ||
          `https://api.dicebear.com/7.x/shapes/svg?seed=${pred.id}`,
        status,
      };
    });
  }, [creatorPredictions, creator, predictionThumbnails]);

  // Filter and sort predictions
  const filteredAndSortedPredictions = predictionsForCards
    .filter((pred) => {
      if (filterStatus === "all") return true;
      return pred.status === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return parseInt(b.id) - parseInt(a.id);
        case "popular":
          return b.totalPool - a.totalPool;
        case "ending-soon":
          if (a.endDate === "Indefinite") return 1;
          if (b.endDate === "Indefinite") return -1;
          return (
            new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
          );
        case "most-votes":
          const totalVotesA = a.options.reduce((sum, opt) => sum + opt.votes, 0);
          const totalVotesB = b.options.reduce((sum, opt) => sum + opt.votes, 0);
          return totalVotesB - totalVotesA;
        default:
          return 0;
      }
    });

  // Show loading screen while loading profile
  if (loadingProfile || !creator) {
    return (
      <div className="pb-6">
        <div className="p-6 pb-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-lg">Loading creator profile...</p>
        </div>
      </div>
    );
  }

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
        {creator.banner ? (
          <img
            src={creator.banner}
            alt={creator.name}
            className="w-full h-full object-cover opacity-40"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20" />
        )}
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
                    <span>{formatNumber(creator.followers)} followers</span>
                  </div>
                  <span className="text-slate-700">•</span>
                  <span>{creator.totalPredictions} predictions</span>
                  <span className="text-slate-700">•</span>
                  <span>Joined in {formatDate(creator.joinedDate)}</span>
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
                  onClick={handleToggleSubscription}
                  disabled={!isConnected || isTogglingSubscription || subscriptionLoading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSubscribed
                      ? "bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/50"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {isTogglingSubscription || subscriptionLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isSubscribed ? "Unsubscribing..." : "Subscribing..."}</span>
                    </>
                  ) : isSubscribed ? (
                    <>
                      <UserMinus className="w-5 h-5" />
                      <span>Unsubscribe</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Subscribe</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Status Messages */}
        {profileError && (
          <div className="mb-4 mx-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {profileError}
          </div>
        )}
        {subscriptionError && (
          <div className="mb-4 mx-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {subscriptionError}
          </div>
        )}
        {loadingProfile && (
          <div className="mb-4 mx-6 text-sm text-slate-400">
            Loading creator profile...
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm">% Success</span>
            </div>
            <div className="text-emerald-400 text-2xl">{creator.winRate.toFixed(1)}%</div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </div>
            <div className="text-slate-100 text-2xl">
              {creator.activePredictions}
            </div>
          </div>

          {/* Coin Container - always visible */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Coins className="w-4 h-4" />
              <span className="text-sm">Coin</span>
            </div>
            {creator.hasCreatorCoin && creatorToken ? (
              <>
                <div className="text-slate-100 text-2xl">
                  {parseFloat(creatorToken.price).toFixed(2)} DOT
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  {creatorToken.symbol}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-sm">
                No coin
              </div>
            )}
          </div>
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
              Predictions
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "about"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Information
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "stats"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Statistics
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
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("active")}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                    filterStatus === "active"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-900/50 text-slate-400 border border-slate-800/50 hover:bg-slate-800/50"
                  }`}
                >
                  Active ({creator.activePredictions || 0})
                </button>
                <button
                  onClick={() => setFilterStatus("ended")}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                    filterStatus === "ended"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-900/50 text-slate-400 border border-slate-800/50 hover:bg-slate-800/50"
                  }`}
                >
                  Completed
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
              {loadingProfile ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading predictions...
                </div>
              ) : filteredAndSortedPredictions.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No predictions to show
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
              <h2 className="text-slate-100 mb-4">About {creator.name}</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                {creator.bio}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-500 text-sm mb-1">Main Category</div>
                  <div className="text-slate-200">{creator.category}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">Member since</div>
                  <div className="text-slate-200">{formatDate(creator.joinedDate)}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">Total Followers</div>
                  <div className="text-slate-200">{formatNumber(creator.followers)}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">Average Participants</div>
                  <div className="text-slate-200">
                    {formatNumber(creator.averageParticipants || 0)} per prediction
                  </div>
                </div>
              </div>
            </div>

            {/* Creator Coin Section */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-slate-100 mb-2">
                    Creator Coin
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {creator.hasCreatorCoin
                      ? `Invest in ${creator.name} by buying their official coin`
                      : `${creator.name} hasn't created their coin yet`}
                  </p>
                </div>
              </div>
              {creator.hasCreatorCoin && creatorToken ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-500 text-sm mb-1">
                      Symbol
                    </div>
                    <div className="text-emerald-400">
                      {creatorToken.symbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">
                      Current Price
                    </div>
                    <div className="text-emerald-400">
                      {parseFloat(creatorToken.price).toFixed(2)} DOT
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-sm">
                  This creator hasn't created their coin yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Stats */}
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-slate-100">Performance</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Success Rate</span>
                      <span className="text-emerald-400">{creator.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${creator.winRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Total Predictions</div>
                    <div className="text-slate-200 text-xl">{creator.totalPredictions}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Active Predictions</div>
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
                    <div className="text-slate-500 text-sm mb-1">Followers</div>
                    <div className="text-slate-200 text-xl">
                      {formatNumber(creator.followers)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">Average Participants</div>
                    <div className="text-slate-200 text-xl">
                      {formatNumber(creator.averageParticipants || 0)}
                    </div>
                  </div>
                </div>
              </div>

              

              {/* Categories - Not implemented yet
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="text-slate-100">Categories</h3>
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
              </div>*/}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}