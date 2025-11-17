import { Home, Vote, Shuffle, Coins, TrendingUp, Wallet, Users } from 'lucide-react';
import React from 'react';

const menuItems = [
  { icon: Home, label: 'Home', id: 'home' },
  { icon: Vote, label: 'My Votes', id: 'my-votes' },
  { icon: Shuffle, label: 'Random', id: 'random' },
  { icon: Coins, label: 'My Coin', id: 'my-coin' },
  { icon: Wallet, label: 'My Wallet', id: 'my-wallet' },
  { icon: Users, label: 'My Subscriptions', id: 'my-subscriptions' },
  { icon: TrendingUp, label: 'My uVotes', id: 'my-uvotes' },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'my-votes' | 'my-wallet' | 'my-subscriptions' | 'my-uvotes' | 'my-coin') => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-20 bg-[#0a0a0f] border-r border-slate-800/50 overflow-y-auto">
      <nav className="p-3 pt-4">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isClickable = item.id === 'home' || item.id === 'my-votes' || item.id === 'my-wallet' || item.id === 'my-subscriptions' || item.id === 'my-uvotes' || item.id === 'my-coin';
            
            return (
              <li key={item.id}>
                <button 
                  onClick={() => {
                    if (isClickable) {
                      onNavigate(item.id as 'home' | 'my-votes' | 'my-wallet' | 'my-subscriptions' | 'my-uvotes' | 'my-coin');
                    }
                  }}
                  className={`w-full flex flex-col items-center gap-2 px-2 py-3 rounded-xl transition-all group ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive
                      ? 'text-emerald-500'
                      : 'text-slate-500 group-hover:text-emerald-500'
                  }`} />
                  <span className="text-[10px] text-center leading-tight">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}