import { CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import React from 'react';

interface PredictionOption {
  id: string;
  label: string;
  votes: number;
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
  options: PredictionOption[];
  endDate: string;
  thumbnail: string;
  creatorTokenSymbol?: string; // Símbolo del token del creador
}

interface PredictionCardProps {
  prediction: Prediction;
  onClick?: () => void;
}

const optionColors = [
  { border: 'border-emerald-500', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/10', bg: 'bg-emerald-500', bgBar: 'bg-emerald-500/15' },
  { border: 'border-red-500', text: 'text-red-400', hover: 'hover:bg-red-500/10', bg: 'bg-red-500', bgBar: 'bg-red-500/15' },
  { border: 'border-blue-500', text: 'text-blue-400', hover: 'hover:bg-blue-500/10', bg: 'bg-blue-500', bgBar: 'bg-blue-500/15' },
  { border: 'border-amber-500', text: 'text-amber-400', hover: 'hover:bg-amber-500/10', bg: 'bg-amber-500', bgBar: 'bg-amber-500/15' },
  { border: 'border-orange-500', text: 'text-orange-400', hover: 'hover:bg-orange-500/10', bg: 'bg-orange-500', bgBar: 'bg-orange-500/15' },
  { border: 'border-purple-500', text: 'text-purple-400', hover: 'hover:bg-purple-500/10', bg: 'bg-purple-500', bgBar: 'bg-purple-500/15' },
];

// Helper to get color for specific option label
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

export function PredictionCard({ prediction, onClick }: PredictionCardProps) {
  // Detectar si la predicción no tiene tiempo límite
  const hasNoTimeLimit = prediction.endDate === 'Indefinida' || isNaN(new Date(prediction.endDate).getTime());
  
  // Calcular días restantes solo si tiene tiempo límite válido
  const daysLeft = hasNoTimeLimit 
    ? null 
    : Math.ceil(
        (new Date(prediction.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

  const isBinaryChoice = prediction.options.length === 2;

  return (
    <Card 
      className="bg-slate-900/50 border-slate-800/50 overflow-hidden hover:border-slate-700/50 hover:shadow-xl hover:shadow-black/20 transition-all group cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative h-32 overflow-hidden">
        <img 
          src={prediction.thumbnail} 
          alt={prediction.question}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        {/* Creator Info */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Avatar className="w-7 h-7 ring-2 ring-white/10">
            <AvatarImage src={prediction.creator.avatar} />
            <AvatarFallback>{prediction.creator.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5">
            <span className="text-white text-xs">{prediction.creator.name}</span>
            {prediction.creator.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            )}
          </div>
        </div>

        {/* Time Badge */}
        <Badge className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm border-white/10 text-white text-xs px-2.5 py-1">
          <Clock className="w-3 h-3 mr-1" />
          {hasNoTimeLimit ? '∞' : `${daysLeft}d`}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-white mb-3 line-clamp-2 leading-snug text-sm font-medium">
          {prediction.question}
        </h3>

        {/* Pool Info */}
        <div className="flex items-center gap-2 mb-3 text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-xs">
            {prediction.totalPool.toLocaleString()} {prediction.creatorTokenSymbol || 'uVotes'}
          </span>
        </div>

        {/* Vote Buttons */}
        <div className={`grid gap-2 mb-3 ${isBinaryChoice ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {prediction.options.map((option, index) => {
            const percentage = (option.votes / prediction.totalPool) * 100;
            const color = getColorForOption(option.label, index);
            
            return (
              <div 
                key={option.id}
                className={`${color.border} ${color.text} bg-slate-950/50 border text-xs h-8 relative overflow-hidden transition-all rounded-lg flex items-center px-2.5`}
              >
                <span className="relative z-10 flex items-center justify-between w-full">
                  <span className="truncate">{option.label}</span>
                  <span className="text-xs opacity-80 ml-2 flex-shrink-0">{percentage.toFixed(1)}%</span>
                </span>
                <div 
                  className={`absolute left-0 top-0 h-full ${color.bgBar} transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Progress Bar - Multi-segment for multiple options */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500 flex-wrap gap-2">
            {prediction.options.map((option, index) => {
              const color = getColorForOption(option.label, index);
              return (
                <span key={option.id} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${color.bg}`}></span>
                  <span>{option.label}: {option.votes.toLocaleString()}</span>
                </span>
              );
            })}
          </div>
          <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden flex">
            {prediction.options.map((option, index) => {
              const percentage = (option.votes / prediction.totalPool) * 100;
              const color = getColorForOption(option.label, index);
              
              return (
                <div 
                  key={option.id}
                  className={`${color.bg} transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}