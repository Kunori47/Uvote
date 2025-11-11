import { Search, User, Plus, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";
import React from "react";

interface HeaderProps {
  isLoggedIn: boolean;
  onLogin: () => void;
  onProfileClick?: () => void;
}

export function Header({ isLoggedIn, onLogin, onProfileClick }: HeaderProps) {
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
          {isLoggedIn ? (
            <>
              <Badge
                className="cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm transition-all rounded-full bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear
              </Badge>
              <button className="relative w-10 h-10 rounded-full bg-slate-900/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-900 hover:border-slate-600 transition-all group">
                <Bell className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <Avatar className="w-10 h-10 cursor-pointer ring-2 ring-slate-700/50 hover:ring-emerald-600 transition-all" onClick={onProfileClick}>
                <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" />
                <AvatarFallback className="bg-slate-900 border border-emerald-600">
                  <User className="w-5 h-5 text-emerald-500" />
                </AvatarFallback>
              </Avatar>
            </>
          ) : (
            <Button
              onClick={onLogin}
              variant="outline"
              className="h-10 px-6 bg-slate-900/50 border-slate-700/50 text-emerald-400 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all"
            >
              Acceder
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}