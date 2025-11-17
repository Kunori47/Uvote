import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Trophy,
  Target,
  Award,
  Coins,
  BarChart3,
  Calendar,
  Edit2,
  Camera,
  Save,
  X,
  DollarSign,
  Settings,
  Loader2,
} from "lucide-react";
import { PredictionCard } from "./PredictionCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import React from "react";
import { useWallet } from "../hooks/useWallet";
import { apiService } from "../lib/apiService";
import { usePredictions, PredictionData } from "../hooks/usePredictions";
import { tokenExchangeService } from "../lib/contractService";
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from "../lib/contracts";
import { useMyCreatorToken } from "../hooks/useMyCreatorToken";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  banner: string;
  category: string;
  followers: number;
  totalPredictions: number;
  activePredictions: number;
  winRate: number;
  joinedDate: string;
  bio: string;
  hasCreatorCoin: boolean;
  coinSymbol?: string;
  coinValue?: number;
  totalEarnings?: number;
  averageParticipants?: number;
  email: string;
  socialLinks?: {
    twitter?: string;
    youtube?: string;
    twitch?: string;
  };
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

const mockUserProfile: UserProfile = {
  id: "current-user",
  name: "Ibai",
  username: "@ibai",
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
  bio: "Content creator focused on Gaming, Esports, and entertainment. Creating the best predictions about gaming events and competitions.",
  hasCreatorCoin: true,
  coinSymbol: "IBAI",
  coinValue: 2.5,
  totalEarnings: 125000,
  averageParticipants: 8500,
  email: "ibai@example.com",
  socialLinks: {
    twitter: "https://twitter.com/ibai",
    youtube: "https://youtube.com/@ibai",
    twitch: "https://twitch.tv/ibai",
  },
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
];

type TabType = "predictions" | "about" | "stats" | "settings";

interface MyProfilePageProps {
  onBack: () => void;
}

export function MyProfilePage({ onBack }: MyProfilePageProps) {
  const { address, isConnected } = useWallet();
  const { predictions: allPredictions } = usePredictions();
  const {
    token: myCreatorToken,
    hasToken: hasCreatorToken,
  } = useMyCreatorToken(address || null);
  const [activeTab, setActiveTab] =
    useState<TabType>("predictions");
  const [isEditingProfile, setIsEditingProfile] =
    useState(false);
  const [isEditingCoin, setIsEditingCoin] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    bio: "",
    category: "Gaming",
    email: "",
    twitter: "",
    youtube: "",
    twitch: "",
  });
  const [coinForm, setCoinForm] = useState({
    coinSymbol: "",
    coinValue: "",
  });
  const [predictionThumbnails, setPredictionThumbnails] = useState<
    Record<string, string>
  >({});

  // Predictions created by this user (from blockchain)
  const myPredictionsRaw: PredictionData[] = useMemo(() => {
    if (!address) return [];
    return allPredictions.filter(
      (p) => p.creator.toLowerCase() === address.toLowerCase()
    );
  }, [allPredictions, address]);

  // Load creator prediction images from Supabase
  useEffect(() => {
    let cancelled = false;

    const loadImages = async () => {
      if (!myPredictionsRaw || myPredictionsRaw.length === 0) {
        setPredictionThumbnails({});
        return;
      }

      try {
        const entries: Array<[string, string]> = [];

        await Promise.all(
          myPredictionsRaw.map(async (pred) => {
            const img: any = await apiService.getPredictionImage(
              pred.id,
              CONTRACT_ADDRESSES.PredictionMarket,
              NETWORK_CONFIG.chainId
            );
            if (img && img.image_url) {
              entries.push([pred.id, img.image_url as string]);
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
  }, [myPredictionsRaw]);

  const myPredictionsForCards: Prediction[] = useMemo(() => {
    return myPredictionsRaw.map((pred) => {
      const MAX_SAFE_TIMESTAMP = 10 ** 15;
      let endDate: string;
      if (pred.closesAt > MAX_SAFE_TIMESTAMP) {
        endDate = "Indefinida";
      } else {
        const date = new Date(pred.closesAt * 1000);
        endDate = isNaN(date.getTime())
          ? "Indefinida"
          : date.toISOString().split("T")[0];
      }

      const options = pred.options.map((opt, index) => ({
        id: index.toString(),
        label: opt.description,
        votes: parseFloat(opt.totalAmount),
      }));

      let predCategory = "other";
      const title = pred.title.toLowerCase();
      if (title.includes("deporte") || title.includes("fútbol") || title.includes("madrid")) {
        predCategory = "sports";
      } else if (title.includes("juego") || title.includes("gaming") || title.includes("gta")) {
        predCategory = "gaming";
      } else if (title.includes("crypto") || title.includes("bitcoin") || title.includes("eth")) {
        predCategory = "crypto";
      } else if (title.includes("tech") || title.includes("tecnología") || title.includes("iphone")) {
        predCategory = "tech";
      }

      let status: Prediction["status"] = "active";
      if (pred.status === 4) {
        status = "ended";
      } else if (pred.status === 6) {
        status = "cancelled";
      }

      return {
        id: pred.id,
        creator: {
          name: profile?.name || "User",
          avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
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
  }, [myPredictionsRaw, profile, address, predictionThumbnails]);

  const totalUserPredictions = myPredictionsRaw.length;
  const activeUserPredictions = myPredictionsRaw.filter(
    (p) => p.status === 0 || p.status === 1 || p.status === 2 || p.status === 3
  ).length;

  // When profile arrives from backend, sync edit form
  useEffect(() => {
    if (profile) {
    setEditForm({
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      category: profile.category,
      email: profile.email,
      twitter: profile.socialLinks?.twitter || "",
      youtube: profile.socialLinks?.youtube || "",
      twitch: profile.socialLinks?.twitch || "",
    });
      setCoinForm({
        coinSymbol: profile.coinSymbol || "",
        coinValue: profile.coinValue?.toString() || "",
      });
    }
  }, [profile]);

  // Load real profile from Supabase (backend) using wallet
  useEffect(() => {
    const loadProfile = async () => {
      if (!address || !isConnected) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        setProfileError(null);

        const user: any = await apiService.getUser(address);
        
        // If no user in backend, create basic profile
        if (!user) {
          const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
          const followersCount = await apiService.getCreatorFollowersCount(address);
          
          setProfile({
            ...mockUserProfile,
            id: address,
            name: shortAddr,
            username: shortAddr,
            bio: "",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
            followers: followersCount,
            joinedDate: new Date().toISOString(),
          });
          return;
        }

        const displayName =
          user.display_name ||
          user.username ||
          `${address.slice(0, 6)}...${address.slice(-4)}`;
        const usernameFormatted = user.username
          ? `@${user.username}`
          : `${address.slice(0, 6)}...${address.slice(-4)}`;

        // If Supabase didn't mark is_creator, we still calculate followers from subscriptions
        const followersCount = await apiService.getCreatorFollowersCount(address);

        setProfile({
          ...mockUserProfile,
          id: address,
          name: displayName,
          username: usernameFormatted,
          bio: user.bio || "",
          avatar:
            user.profile_image_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
          followers: followersCount,
          joinedDate: user.created_at || new Date().toISOString(),
        });
      } catch (e: any) {
        console.error("Error loading profile from backend:", e);
        setProfileError(e?.message || "Error loading your profile");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [address, isConnected]);

  // Calculate average participants of all user predictions
  useEffect(() => {
    if (!profile || myPredictionsRaw.length === 0) {
      if (profile) {
        setProfile({
          ...profile,
          averageParticipants: 0,
        });
      }
      return;
    }

    // Calculate total participants of all predictions
    let totalParticipants = 0;
    let predictionsWithParticipants = 0;

    myPredictionsRaw.forEach((pred) => {
      // For each prediction, add totalBettors from all options
      const participantsInPrediction = pred.options.reduce((sum, opt) => sum + opt.totalBettors, 0);
      if (participantsInPrediction > 0) {
        totalParticipants += participantsInPrediction;
        predictionsWithParticipants++;
      }
    });

    // Calculate average
    const averageParticipants = predictionsWithParticipants > 0 
      ? Math.round(totalParticipants / predictionsWithParticipants)
      : 0;

    setProfile({
      ...profile,
      averageParticipants,
    });
  }, [myPredictionsRaw, profile]);

  // Load creator coin information (if exists) reusing the same hook as "My Coin"
  useEffect(() => {
    const loadCreatorCoin = async () => {
      // If no wallet connected or hook indicates no token, clear state
      if (!address || !isConnected || !hasCreatorToken || !myCreatorToken || !profile) {
        if (profile) {
          setProfile({
            ...profile,
          hasCreatorCoin: false,
          coinSymbol: undefined,
          coinValue: undefined,
          totalEarnings: undefined,
          });
        }
        return;
      }

      try {
        // Reuse the data that useMyCreatorToken already calculates
        const earningsEth = await tokenExchangeService.getCreatorEarnings(address);

        setProfile({
          ...profile,
          hasCreatorCoin: true,
          coinSymbol: myCreatorToken.symbol,
          coinValue: parseFloat(myCreatorToken.price),
          totalEarnings: parseFloat(earningsEth),
        });
      } catch (e) {
        console.error("Error loading creator coin info:", e);
      }
    };

    loadCreatorCoin();
  }, [address, isConnected, hasCreatorToken, myCreatorToken, profile]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const handleSaveProfile = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      name: editForm.name,
      username: editForm.username,
      bio: editForm.bio,
      category: editForm.category,
      email: editForm.email,
      socialLinks: {
        twitter: editForm.twitter,
        youtube: editForm.youtube,
        twitch: editForm.twitch,
      },
    });
    setIsEditingProfile(false);
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    setEditForm({
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
      category: profile.category,
      email: profile.email,
      twitter: profile.socialLinks?.twitter || "",
      youtube: profile.socialLinks?.youtube || "",
      twitch: profile.socialLinks?.twitch || "",
    });
    setIsEditingProfile(false);
  };

  const handleSaveCoin = () => {
    if (!profile) return;
    setProfile({
      ...profile,
      coinSymbol: coinForm.coinSymbol,
      coinValue: parseFloat(coinForm.coinValue),
      hasCreatorCoin: true,
    });
    setIsEditingCoin(false);
  };

  // Loading screen
  if (loadingProfile || !profile) {
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

        {/* Loading State */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-lg">Loading your profile...</p>
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
      <div className="relative h-48 md:h-64 bg-slate-900/50 border-y border-slate-800/50 mb-6 group">
        <img
          src={profile.banner}
          alt={profile.name}
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

        {/* Edit Banner Button */}
        <button className="absolute top-4 right-4 p-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-all opacity-0 group-hover:opacity-100">
          <Camera className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="px-6">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-20 md:-mt-16 mb-6">
          {/* Avatar */}
          <div className="relative z-10 group">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0a0a0f] bg-slate-900 object-cover"
            />
            <button className="absolute bottom-2 right-2 p-2 bg-emerald-600 rounded-full text-white hover:bg-emerald-500 transition-all shadow-lg opacity-0 group-hover:opacity-100">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-slate-100">
                    {profile.name}
                  </h1>
                  <span className="text-slate-400">
                    {profile.username}
                  </span>
                  <span className="px-3 py-1 bg-slate-800/50 border border-slate-700/50 rounded text-slate-300 text-sm">
                    {profile.category}
                  </span>
                </div>
            <div className="flex items-center gap-4 text-slate-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>
                      {formatNumber(profile.followers)}{" "}
                      followers
                    </span>
                  </div>
                  <span className="text-slate-700">•</span>
                  <span>
                    {totalUserPredictions} predictions
                  </span>
                  <span className="text-slate-700">•</span>
                  <span>
                    Joined in {formatDate(profile.joinedDate)}
                  </span>
                </div>
              </div>

              {/* Edit Profile Button */}
              <Button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 text-slate-300 hover:bg-slate-800 border border-slate-700/50 rounded-xl"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Profile status message */}
        {loadingProfile && (
          <div className="mb-4 text-sm text-slate-400">
            Loading your profile from Supabase...
          </div>
        )}
        {profileError && (
          <div className="mb-4 text-sm text-red-400">
            {profileError}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </div>
            <div className="text-slate-100 text-2xl">
              {activeUserPredictions}
            </div>
          </div>

          {/* Coin container - always visible */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Coins className="w-4 h-4" />
              <span className="text-sm">Coin</span>
            </div>
            {hasCreatorToken && myCreatorToken ? (
              <>
                <div className="text-slate-100 text-2xl">
                  {parseFloat(myCreatorToken.price).toFixed(2)} DOT
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  {myCreatorToken.symbol}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-sm">
                No coin
              </div>
            )}
          </div>

          {/* Additional containers only if has coin */}
          {profile.hasCreatorCoin && (
            <>
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Earnings</span>
                </div>
                <div className="text-slate-100 text-2xl">
                  {formatNumber(profile.totalEarnings || 0)} DOT
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
              About
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "stats"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Stats
            </button>
            {/* <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === "settings"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Settings
            </button> */}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "predictions" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPredictionsForCards.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  You don't have predictions yet
                </div>
              ) : (
                myPredictionsForCards.map((prediction) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="max-w-3xl">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-100">
                  About {profile.name}
                </h2>
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  variant="ghost"
                  className="text-slate-400 hover:text-emerald-400"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                {profile.bio}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-500 text-sm mb-1">
                    Main Category
                  </div>
                  <div className="text-slate-200">
                    {profile.category}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">
                    Member since
                  </div>
                  <div className="text-slate-200">
                    {formatDate(profile.joinedDate)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">
                    Total Followers
                  </div>
                  <div className="text-slate-200">
                    {formatNumber(profile.followers)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm mb-1">
                    Average Participants
                  </div>
                  <div className="text-slate-200">
                    {formatNumber(
                      profile.averageParticipants || 0,
                    )}{" "}
                    per prediction
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
                    {profile.hasCreatorCoin
                      ? "Manage your creator coin"
                      : "Create your creator coin so your followers can invest in you"}
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditingCoin(true)}
                  variant="ghost"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              {profile.hasCreatorCoin ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-slate-500 text-sm mb-1">
                      Symbol
                    </div>
                    <div className="text-emerald-400">
                      {profile.coinSymbol}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">
                      Current Price
                    </div>
                    <div className="text-emerald-400">
                      {profile.coinValue} DOT
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEditingCoin(true)}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Create Coin
                </Button>
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
                  <h3 className="text-slate-100">
                    Predictions
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-slate-500 text-sm mb-1">
                      Total Predictions
                    </div>
                    <div className="text-slate-200 text-xl">
                      {totalUserPredictions}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">
                      Active Predictions
                    </div>
                    <div className="text-slate-200 text-xl">
                      {activeUserPredictions}
                    </div>
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
                    <div className="text-slate-500 text-sm mb-1">
                      Followers
                    </div>
                    <div className="text-slate-200 text-xl">
                      {formatNumber(profile.followers)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-sm mb-1">
                      Average Participants
                    </div>
                    <div className="text-slate-200 text-xl">
                      {formatNumber(
                        profile.averageParticipants || 0,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Stats */}
              {profile.hasCreatorCoin && (
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-slate-100">
                      Financial
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500 text-sm mb-1">
                        Total Earnings
                      </div>
                      <div className="text-slate-200 text-xl">
                        {formatNumber(
                          profile.totalEarnings || 0,
                        )} DOT
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-sm mb-1">
                        Coin Value
                      </div>
                      <div className="text-slate-200 text-xl">
                        {profile.coinValue} DOT
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-sm mb-1">
                        Average per Prediction
                      </div>
                      <div className="text-slate-200 text-xl">
                        {formatNumber(
                          Math.floor(
                            (profile.totalEarnings || 0) /
                              profile.totalPredictions,
                          ),
                        )} DOT
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories - Not implemented yet 
              <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h3 className="text-slate-100">Categories</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">
                        Gaming
                      </span>
                      <span className="text-slate-400 text-sm">
                        65%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "65%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">
                        Esports
                      </span>
                      <span className="text-slate-400 text-sm">
                        25%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: "25%" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">
                        Entertainment
                      </span>
                      <span className="text-slate-400 text-sm">
                        10%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/50 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: "10%" }}
                      />
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* Settings - Not implemented yet 
        {activeTab === "settings" && (
          <div className="max-w-3xl">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-slate-400" />
                <h2 className="text-slate-100">
                  Account Settings
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                    disabled
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Contact support to change your email
                  </p>
                </div>

                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Notifications
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors">
                      <span className="text-slate-300">
                        Email for new predictions
                      </span>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-emerald-600"
                        defaultChecked
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors">
                      <span className="text-slate-300">
                        Push notifications
                      </span>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-emerald-600"
                        defaultChecked
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors">
                      <span className="text-slate-300">
                        Weekly newsletter
                      </span>
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-emerald-600"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/50">
                  <Button
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Edit Profile Modal - Not implemented yet 
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-slate-100 text-xl">
                Edit Profile
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Name
                  </label>
                  <Input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        name: (e.target as HTMLInputElement).value,
                      })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Username
                  </label>
                  <Input
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        username: (e.target as HTMLInputElement).value,
                      })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      category: (e.target as HTMLSelectElement).value,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option>Gaming</option>
                  <option>Esports</option>
                  <option>Sports</option>
                  <option>Entertainment</option>
                  <option>Music</option>
                  <option>Technology</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Biography
                </label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      bio: (e.target as HTMLTextAreaElement).value,
                    })
                  }
                  rows={4}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      email: (e.target as HTMLInputElement).value,
                    })
                  }
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Social Networks
                </label>
                <div className="space-y-2">
                  <Input
                    placeholder="Twitter URL"
                    value={editForm.twitter}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        twitter: (e.target as HTMLInputElement).value,
                      })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                  <Input
                    placeholder="YouTube URL"
                    value={editForm.youtube}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        youtube: (e.target as HTMLInputElement).value,
                      })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                  <Input
                    placeholder="Twitch URL"
                    value={editForm.twitch}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        twitch: (e.target as HTMLInputElement).value,
                      })
                    }
                    className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleSaveProfile}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="ghost"
                className="flex-1 bg-slate-800/50 hover:bg-slate-800 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )} */}

      {/* Edit Coin Modal - Not implemented yet 
      {isEditingCoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800/50 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-slate-100 text-xl">
                {profile.hasCreatorCoin ? "Edit" : "Create"}{" "}
                Coin
              </h2>
              <button
                onClick={() => setIsEditingCoin(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Coin Symbol
                </label>
                <Input
                  placeholder="Ex: IBAI"
                  value={coinForm.coinSymbol}
                  onChange={(e) =>
                    setCoinForm({
                      ...coinForm,
                      coinSymbol: (e.target as HTMLInputElement).value.toUpperCase(),
                    })
                  }
                  maxLength={6}
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 text-sm mb-2 block">
                  Initial Price (DOT)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 2.5"
                  value={coinForm.coinValue}
                  onChange={(e) =>
                    setCoinForm({
                      ...coinForm,
                      coinValue: (e.target as HTMLInputElement).value,
                    })
                  }
                  className="bg-slate-800/50 border-slate-700/50 text-slate-200"
                />
                <p className="text-slate-500 text-xs mt-1">
                  Fixed price, you can only change it once a
                  month
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleSaveCoin}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {profile.hasCreatorCoin
                  ? "Update"
                  : "Create"}{" "}
                Coin
              </Button>
              <Button
                onClick={() => setIsEditingCoin(false)}
                variant="ghost"
                className="flex-1 bg-slate-800/50 hover:bg-slate-800 text-slate-300"
              >
                Cancel
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}