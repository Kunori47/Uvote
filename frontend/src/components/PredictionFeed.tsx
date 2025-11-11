import React from 'react';
import { PredictionCard } from './PredictionCard';

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
}

const mockPredictions: Prediction[] = [
  {
    id: '1',
    creator: {
      name: 'Ibai',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿Ganará el Real Madrid la Champions League este año?',
    category: 'sports',
    totalPool: 45000,
    options: [
      { id: 'yes', label: 'Sí', votes: 28000 },
      { id: 'no', label: 'No', votes: 17000 },
    ],
    endDate: '2025-06-01',
    thumbnail: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&h=400&fit=crop',
  },
  {
    id: '2',
    creator: {
      name: 'ElRubius',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿GTA 6 se lanzará en 2025?',
    category: 'gaming',
    totalPool: 32000,
    options: [
      { id: 'yes', label: 'Sí', votes: 8000 },
      { id: 'no', label: 'No', votes: 24000 },
    ],
    endDate: '2025-12-31',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop',
  },
  {
    id: '3',
    creator: {
      name: 'CryptoExpert',
      avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿Bitcoin superará los $100,000 este año?',
    category: 'crypto',
    totalPool: 78000,
    options: [
      { id: 'yes', label: 'Sí', votes: 52000 },
      { id: 'no', label: 'No', votes: 26000 },
    ],
    endDate: '2025-12-31',
    thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop',
  },
  {
    id: '4',
    creator: {
      name: 'TechGuru',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      verified: false,
    },
    question: '¿Apple lanzará iPhone plegable en 2026?',
    category: 'tech',
    totalPool: 15000,
    options: [
      { id: 'yes', label: 'Sí', votes: 9000 },
      { id: 'no', label: 'No', votes: 6000 },
    ],
    endDate: '2026-01-01',
    thumbnail: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&h=400&fit=crop',
  },
  {
    id: '5',
    creator: {
      name: 'Deportes Pro',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿Quién ganará el Balón de Oro este año?',
    category: 'sports',
    totalPool: 95000,
    options: [
      { id: 'messi', label: 'Messi', votes: 20000 },
      { id: 'cristiano', label: 'Cristiano', votes: 15000 },
      { id: 'mbappe', label: 'Mbappé', votes: 35000 },
      { id: 'haaland', label: 'Haaland', votes: 25000 },
    ],
    endDate: '2025-10-30',
    thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop',
  },
  {
    id: '6',
    creator: {
      name: 'Gaming Zone',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      verified: true,
    },
    question: '¿Qué juego será el más vendido en 2025?',
    category: 'gaming',
    totalPool: 62000,
    options: [
      { id: 'gta6', label: 'GTA 6', votes: 28000 },
      { id: 'cod', label: 'Call of Duty', votes: 12000 },
      { id: 'fifa', label: 'EA FC 26', votes: 10000 },
      { id: 'zelda', label: 'Zelda', votes: 12000 },
    ],
    endDate: '2025-12-31',
    thumbnail: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=600&h=400&fit=crop',
  },
];

interface PredictionFeedProps {
  category: string;
  onViewPrediction?: (id: string) => void;
}

export function PredictionFeed({ category, onViewPrediction }: PredictionFeedProps) {
  const filteredPredictions = category === 'trending' 
    ? mockPredictions 
    : mockPredictions.filter(p => p.category === category);

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 max-w-[1800px]">
        {filteredPredictions.map((prediction) => (
          <PredictionCard 
            key={prediction.id} 
            prediction={prediction} 
            onClick={() => onViewPrediction?.(prediction.id)} 
          />
        ))}
      </div>
    </div>
  );
}