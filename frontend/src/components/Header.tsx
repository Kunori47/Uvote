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

interface HeaderProps {
  onProfileClick?: () => void;
  onCreateClick?: () => void;
  onCreateTokenClick?: () => void;
  onAccessClick?: () => void;
}
export function Header({ onProfileClick, onCreateClick, onCreateTokenClick, onAccessClick }: HeaderProps) {
  const { address, balance, isConnected, isConnecting, connect, disconnect, error } = useWallet();
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);
  
  const handleAccess = async () => {
    if (isConnecting) return;

    // Para primer acceso, delegamos en la pantalla de onboarding
    if (onAccessClick) {
      onAccessClick();
      return;
    }

    // Fallback: flujo antiguo (por si se usa Header en otro contexto sin onAccessClick)
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
        console.error("Error creando/actualizando usuario en backend:", profileError);
      }
    } catch (e) {
      console.error("Error en flujo de acceso:", e);
    }
  };

  const handleChangeWallet = async () => {
    if (isConnecting) return;

    try {
      // Limpiar el estado local primero
      disconnect();
      // Reejecutar el flujo de acceso para que el usuario seleccione otra cuenta en la extensión
      await handleAccess();
    } catch (e) {
      console.error("Error cambiando de wallet:", e);
    }
  };
  
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
              placeholder="Buscar..."
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
              <div className="flex flex-col items-end mr-2">
                <span className="text-xs text-slate-400">Balance</span>
                <span className="text-sm font-medium text-emerald-400">
                  {balance ? `${parseFloat(balance).toFixed(4)} ETH` : '...'}
                </span>
                <button
                  type="button"
                  onClick={handleChangeWallet}
                  disabled={isConnecting}
                  className="mt-1 text-[11px] text-slate-500 hover:text-emerald-400 hover:underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cambiar wallet
                </button>
              </div>

              <div className="relative">
                <Badge
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm transition-all rounded-full bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Crear
                  <ChevronDown className="w-4 h-4" />
                </Badge>
                
                {showCreateMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowCreateMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          setShowCreateMenu(false);
                          onCreateTokenClick?.();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 text-slate-300 hover:text-emerald-400"
                      >
                        <Coins className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Crear Token</div>
                          <div className="text-xs text-slate-500">Token de creador</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateMenu(false);
                          onCreateClick?.();
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center gap-3 text-slate-300 hover:text-emerald-400"
                      >
                        <FileText className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Crear Predicción</div>
                          <div className="text-xs text-slate-500">Nueva predicción</div>
                        </div>
                      </button>
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
                title={address || ''}
              >
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`} />
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
              {isConnecting ? 'Accediendo...' : 'Acceder'}
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