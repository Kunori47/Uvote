import { Badge } from './ui/badge';
import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import React from 'react';

const categories = [
  { id: 'trending', label: 'Trending', emoji: '🔥' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'crypto', label: 'Crypto', emoji: '₿' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'food', label: 'Food', emoji: '🍔' },
];

interface CategoriesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function Categories({ selectedCategory, onSelectCategory }: CategoriesProps) {
  const visibleCount = 8;
  const visibleCategories = categories.slice(0, visibleCount);
  const moreCategories = categories.slice(visibleCount);

  return (
    <div className="sticky top-16 bg-[#0a0a0f] border-b border-slate-800/50 px-8 py-5 z-40 backdrop-blur-sm">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {visibleCategories.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            className={`cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm transition-all rounded-full ${
              selectedCategory === category.id
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/30'
                : 'bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-200'
            }`}
            onClick={() => onSelectCategory(category.id)}
          >
            <span className="mr-2">{category.emoji}</span>
            {category.label}
          </Badge>
        ))}
        
        {moreCategories.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-pointer whitespace-nowrap px-5 py-2.5 text-sm transition-all rounded-full bg-slate-900/50 text-slate-400 border-slate-700/50 hover:border-slate-600 hover:bg-slate-900 hover:text-slate-200"
              >
                <MoreHorizontal className="w-4 h-4 mr-2" />
                More
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-slate-900 border-slate-700/50 text-slate-300"
            >
              {moreCategories.map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => onSelectCategory(category.id)}
                  className="cursor-pointer hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white"
                >
                  <span className="mr-2">{category.emoji}</span>
                  {category.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}