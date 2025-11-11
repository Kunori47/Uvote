import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Categories } from './components/Categories';
import { PredictionFeed } from './components/PredictionFeed';
import { MyVotingsPage } from './components/MyVotingsPage';
import { MyWalletPage } from './components/MyWalletPage';
import { MySubscriptionsPage } from './components/MySubscriptionsPage';
import { MyUVotesPage } from './components/MyUVotesPage';
import { MyCoinPage } from './components/MyCoinPage';
import { PredictionDetailPage } from './components/PredictionDetailPage';
import { CoinDetailPage } from './components/CoinDetailPage';
import { CreatorProfilePage } from './components/CreatorProfilePage';
import { MyProfilePage } from './components/MyProfilePage';
import React from 'react';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Changed to true for testing
  const [selectedCategory, setSelectedCategory] = useState('trending');
  const [currentPage, setCurrentPage] = useState<'home' | 'my-votes' | 'my-wallet' | 'my-subscriptions' | 'my-uvotes' | 'my-coin' | 'prediction-detail' | 'coin-detail' | 'creator-profile' | 'my-profile'>('home');
  const [previousPage, setPreviousPage] = useState<'home' | 'my-votes' | 'my-wallet' | 'my-subscriptions' | 'my-uvotes' | 'my-coin' | 'prediction-detail' | 'coin-detail' | 'creator-profile' | 'my-profile'>('home');
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [isCreatorView, setIsCreatorView] = useState(false);

  const handleViewPrediction = (id: string, isCreator: boolean = false) => {
    setSelectedPredictionId(id);
    setIsCreatorView(isCreator);
    setPreviousPage(currentPage);
    setCurrentPage('prediction-detail');
  };

  const handleViewCoin = (coinId: string) => {
    setSelectedCoinId(coinId);
    setCurrentPage('coin-detail');
  };

  const handleViewCreator = (creatorId: string) => {
    setSelectedCreatorId(creatorId);
    setCurrentPage('creator-profile');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header 
        isLoggedIn={isLoggedIn} 
        onLogin={() => setIsLoggedIn(true)}
        onProfileClick={() => setCurrentPage('my-profile')}
      />
      
      <div className="flex pt-16">
        <Sidebar 
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
        
        <main className="flex-1 ml-20">
          {currentPage === 'home' ? (
            <>
              <Categories 
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              
              <PredictionFeed 
                category={selectedCategory}
                onViewPrediction={(id) => handleViewPrediction(id, false)}
              />
            </>
          ) : currentPage === 'my-votes' ? (
            <MyVotingsPage onViewPrediction={(id) => handleViewPrediction(id, false)} />
          ) : currentPage === 'my-wallet' ? (
            <MyWalletPage onViewCoin={handleViewCoin} />
          ) : currentPage === 'my-subscriptions' ? (
            <MySubscriptionsPage onViewCreator={handleViewCreator} />
          ) : currentPage === 'my-uvotes' ? (
            <MyUVotesPage onViewPrediction={(id) => handleViewPrediction(id, true)} />
          ) : currentPage === 'my-coin' ? (
            <MyCoinPage />
          ) : currentPage === 'prediction-detail' && selectedPredictionId ? (
            <PredictionDetailPage 
              predictionId={selectedPredictionId}
              isCreatorView={isCreatorView}
              onBack={() => setCurrentPage(previousPage)}
            />
          ) : currentPage === 'coin-detail' && selectedCoinId ? (
            <CoinDetailPage
              coinId={selectedCoinId}
              onBack={() => setCurrentPage('my-wallet')}
            />
          ) : currentPage === 'creator-profile' && selectedCreatorId ? (
            <CreatorProfilePage
              creatorId={selectedCreatorId}
              onBack={() => setCurrentPage('my-subscriptions')}
            />
          ) : currentPage === 'my-profile' ? (
            <MyProfilePage onBack={() => setCurrentPage('home')} />
          ) : null}
        </main>
      </div>
    </div>
  );
}