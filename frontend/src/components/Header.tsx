import { Search, User, Plus, Bell, Wallet, Coins, FileText, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import React from "react";
import { useWallet } from "../hooks/useWallet";
import { getSigner } from "../lib/contracts";
import { apiService, generateAuthToken } from "../lib/apiService";
import { useMyCreatorToken } from "../hooks/useMyCreatorToken";

interface HeaderProps {
  onProfileClick?: () => void;
  onCreateClick?: () => void;
  onCreateTokenClick?: () => void;
  onAccessClick?: () => void;
}
export function Header({ onProfileClick, onCreateClick, onCreateTokenClick, onAccessClick }: HeaderProps) {
  const { address, balance, isConnected, isConnecting, connect, disconnect, error } = useWallet();
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<{
    avatarUrl: string;
    displayName: string;
  } | null>(null);
  
  // Check if user already has a creator token
  const { hasToken: hasCreatorToken } = useMyCreatorToken(address || null);
  
  const handleAccess = async () => {
    if (isConnecting) return;

    // For first access, delegate to onboarding screen
    if (onAccessClick) {
      onAccessClick();
      return;
    }

    // Fallback: old flow (in case Header is used in another context without onAccessClick)
    try {
      await connect();

      try {
        const signer = await getSigner();
        const addr = await signer.getAddress();
        const authToken = await generateAuthToken(addr, signer);

        await apiService.upsertUser(
          {
            is_creator: false,
          },
          authToken
        );
      } catch (profileError) {
        console.error("Error creating/updating user in backend:", profileError);
      }
    } catch (e) {
      console.error("Error in access flow:", e);
    }
  };

  const handleChangeWallet = async () => {
    if (isConnecting) return;

    try {
      // Clear local state first
      disconnect();
      setUserProfile(null);
      // Re-run access flow so user selects another account in extension
      await handleAccess();
    } catch (e) {
      console.error("Error changing wallet:", e);
    }
  };

  // Load user profile from DB (same as MyProfilePage)
  React.useEffect(() => {
    const loadUserProfile = async () => {
      if (!address || !isConnected) {
        setUserProfile(null);
        return;
      }

      try {
        const user: any = await apiService.getUser(address);
        if (!user) {
          // If no user in backend, use fallback
          const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
          setUserProfile({
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
            displayName: shortAddr,
          });
          return;
        }

        const displayName =
          user.display_name ||
          (user.username ? `@${user.username}` : `${address.slice(0, 6)}...${address.slice(-4)}`);
        const avatarUrl =
          user.profile_image_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`;

        setUserProfile({
          avatarUrl,
          displayName,
        });
      } catch (e: any) {
        console.error("Error loading user profile in header:", e);
        // Fallback en caso de error
        const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
        setUserProfile({
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
          displayName: shortAddr,
        });
      }
    };

    loadUserProfile();
  }, [address, isConnected]);
  
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0f] border-b border-slate-800/50 z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-8 gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/50">
            <span className="text-white">U</span>
          </div>
          <span className="text-xl text-white tracking-tight">
            Uvote
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              className="w-full h-11 bg-slate-900/50 border-slate-700/50 text-slate-100 placeholder:text-slate-500 pr-12 focus:border-emerald-600 focus:bg-slate-900 transition-all"
            />
            <button className="absolute right-0 top-0 h-full px-4 hover:bg-slate-800/50 transition-colors rounded-r-md">
              <Search className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* User Section */}
        <div className="min-w-[200px] flex justify-end items-center gap-3">
          {isConnected ? (
            <>
              {/* Balance + Cambiar wallet */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:bg-slate-900/50 transition-colors">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Balance</span>
                    <span className="text-sm font-semibold text-emerald-400 tabular-nums">
                      {balance ? `${parseFloat(balance).toFixed(4)} DOT` : '...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeWallet}
                    disabled={isConnecting}
                    className="text-[10px] text-slate-500 hover:text-emerald-400 hover:underline underline-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Change wallet
                  </button>
                </div>
              </div>

              <div className="relative">
                <Badge
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm transition-all rounded-full bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create
                  <ChevronDown className="w-4 h-4" />
                </Badge>
                
                {showCreateMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowCreateMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden">
                      {/* Show "Create Token" only if user does NOT have token */}
                      {!hasCreatorToken && (
                        <button
                          onClick={() => {
                            setShowCreateMenu(false);
                            onCreateTokenClick?.();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 text-slate-300 hover:text-emerald-400"
                        >
                          <Coins className="w-5 h-5" />
                          <div>
                            <div className="font-medium">Create Token</div>
                            <div className="text-xs text-slate-500">Creator token</div>
                          </div>
                        </button>
                      )}
                      {/* Show "Create Prediction" only if user has token */}
                      {hasCreatorToken && (
                        <button
                          onClick={() => {
                            setShowCreateMenu(false);
                            onCreateClick?.();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 text-slate-300 hover:text-emerald-400"
                        >
                          <FileText className="w-5 h-5" />
                          <div>
                            <div className="font-medium">Create Prediction</div>
                            <div className="text-xs text-slate-500">New prediction</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <button className="relative w-10 h-10 rounded-full bg-slate-900/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-900 hover:border-slate-600 transition-all group">
                <Bell className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <Avatar 
                className="w-10 h-10 cursor-pointer ring-2 ring-slate-700/50 hover:ring-emerald-600 transition-all" 
                onClick={onProfileClick}
                title={userProfile?.displayName || address || ''}
              >
                <AvatarImage src={userProfile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`} />
                <AvatarFallback className="bg-slate-900 border border-emerald-600">
                  <User className="w-5 h-5 text-emerald-500" />
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button
              onClick={handleAccess}
              disabled={isConnecting}
              variant="outline"
              className="h-10 px-6 bg-slate-900/50 border-slate-700/50 text-emerald-400 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          )}
          
          {error && (
            <div className="absolute top-full right-8 mt-2 p-3 bg-red-900/90 border border-red-700 rounded-lg text-sm text-white">
              {error}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}