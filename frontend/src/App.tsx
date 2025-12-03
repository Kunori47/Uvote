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
import { CreatePredictionPage } from './components/CreatePredictionPage';
import { CreateTokenPage } from './components/CreateTokenPage';
import { OnboardingPage } from './components/OnboardingPage';
import React from 'react';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState<'home' | 'my-votes' | 'my-wallet' | 'my-subscriptions' | 'my-uvotes' | 'my-coin' | 'prediction-detail' | 'coin-detail' | 'creator-profile' | 'my-profile' | 'create-prediction' | 'create-token' | 'onboarding'>('home');
  const [previousPage, setPreviousPage] = useState<'home' | 'my-votes' | 'my-wallet' | 'my-subscriptions' | 'my-uvotes' | 'my-coin' | 'prediction-detail' | 'coin-detail' | 'creator-profile' | 'my-profile' | 'create-prediction' | 'create-token' | 'onboarding'>('home');
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
        onProfileClick={() => setCurrentPage('my-profile')}
        onAccessClick={() => setCurrentPage('onboarding')}
        onCreateClick={() => {
          setPreviousPage(currentPage);
          setCurrentPage('create-prediction');
        }}
        onCreateTokenClick={() => {
          setPreviousPage(currentPage);
          setCurrentPage('create-token');
        }}
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
            <MyUVotesPage 
              onViewPrediction={(id) => handleViewPrediction(id, true)}
              onCreatePrediction={() => {
                setPreviousPage('my-uvotes');
                setCurrentPage('create-prediction');
              }}
            />
          ) : currentPage === 'my-coin' ? (
            <MyCoinPage 
              onCreateToken={() => {
                setPreviousPage('my-coin');
                setCurrentPage('create-token');
              }}
            />
          ) : currentPage === 'prediction-detail' && selectedPredictionId ? (
            <PredictionDetailPage 
              predictionId={selectedPredictionId}
              isCreatorView={isCreatorView}
              onBack={() => setCurrentPage(previousPage)}
              onBuyTokens={(tokenAddress) => {
                setSelectedCoinId(tokenAddress);
                setPreviousPage('prediction-detail');
                setCurrentPage('coin-detail');
              }}
            />
          ) : currentPage === 'coin-detail' && selectedCoinId ? (
            <CoinDetailPage
              coinId={selectedCoinId}
              onBack={() => setCurrentPage(previousPage)}
            />
          ) : currentPage === 'creator-profile' && selectedCreatorId ? (
            <CreatorProfilePage
              creatorId={selectedCreatorId}
              onBack={() => setCurrentPage('my-subscriptions')}
              onViewPrediction={(id) => handleViewPrediction(id, false)}
            />
          ) : currentPage === 'my-profile' ? (
            <MyProfilePage onBack={() => setCurrentPage('home')} />
          ) : currentPage === 'create-prediction' ? (
            <CreatePredictionPage 
              onBack={() => setCurrentPage(previousPage)}
              onCreated={(predictionId) => {
                setSelectedPredictionId(predictionId);
                setCurrentPage('prediction-detail');
              }}
            />
          ) : currentPage === 'create-token' ? (
            <CreateTokenPage 
              onBack={() => setCurrentPage(previousPage)}
              onCreated={() => setCurrentPage('my-uvotes')}
            />
          ) : currentPage === 'onboarding' ? (
            <OnboardingPage 
              onCompleted={() => setCurrentPage('home')}
              onBack={() => setCurrentPage('home')}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}