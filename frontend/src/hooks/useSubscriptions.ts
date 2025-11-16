import { useState, useEffect } from 'react';
import { apiService, generateAuthToken } from '../lib/apiService';
import { getSigner } from '../lib/contracts';

export interface Subscription {
  id: number;
  subscriber_address: string;
  creator_address: string;
  created_at: string;
  creator?: {
    wallet_address: string;
    username?: string;
    display_name?: string;
    profile_image_url?: string;
    is_creator: boolean;
  };
}

export const useSubscriptions = (userAddress: string | null) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    if (!userAddress) {
      setSubscriptions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.getUserSubscriptions(userAddress);
      setSubscriptions(data);
    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
      setError(err.message || 'Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [userAddress]);

  const subscribe = async (creatorAddress: string) => {
    if (!userAddress) throw new Error('No wallet connected');
    
    try {
      const signer = await getSigner();
      const authToken = await generateAuthToken(userAddress, signer);
      
      await apiService.subscribe(creatorAddress, authToken);
      await loadSubscriptions(); // Refrescar
    } catch (err: any) {
      throw new Error(err.message || 'Error al suscribirse');
    }
  };

  const unsubscribe = async (creatorAddress: string) => {
    if (!userAddress) throw new Error('No wallet connected');
    
    try {
      const signer = await getSigner();
      const authToken = await generateAuthToken(userAddress, signer);
      
      await apiService.unsubscribe(creatorAddress, authToken);
      await loadSubscriptions(); // Refrescar
    } catch (err: any) {
      throw new Error(err.message || 'Error al desuscribirse');
    }
  };

  const isSubscribed = (creatorAddress: string) => {
    return subscriptions.some(
      sub => sub.creator_address.toLowerCase() === creatorAddress.toLowerCase()
    );
  };

  return {
    subscriptions,
    loading,
    error,
    subscribe,
    unsubscribe,
    isSubscribed,
    refetch: loadSubscriptions,
  };
};

