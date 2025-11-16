import { supabase } from '../config/supabase';

export interface Subscription {
  id?: number;
  subscriber_address: string;
  creator_address: string;
  created_at?: Date;
}

export const SubscriptionModel = {
  /**
   * Verificar si un usuario está suscrito a un creador
   */
  async isSubscribed(subscriberAddress: string, creatorAddress: string): Promise<boolean> {
    const result = await supabase?.from('subscriptions').select('1').eq('subscriber_address', subscriberAddress.toLowerCase()).eq('creator_address', creatorAddress.toLowerCase());
    return result?.data?.length && result.data.length > 0 || false;
  },

  /**
   * Suscribirse a un creador
   */
  async subscribe(subscriberAddress: string, creatorAddress: string): Promise<Subscription> {
    const result = await supabase?.from('subscriptions').insert({
      subscriber_address: subscriberAddress.toLowerCase(),
      creator_address: creatorAddress.toLowerCase(),
    }).select().single();
    return result?.data?.[0] || null;
  },

  /**
   * Desuscribirse de un creador
   */
  async unsubscribe(subscriberAddress: string, creatorAddress: string): Promise<boolean> {
    const result = await supabase?.from('subscriptions').delete().eq('subscriber_address', subscriberAddress.toLowerCase()).eq('creator_address', creatorAddress.toLowerCase()).select().single();
    return result?.data?.length && result.data.length > 0 || false;
  },

  /**
   * Obtener todas las suscripciones de un usuario
   */
  async getSubscriptions(subscriberAddress: string): Promise<Subscription[]> {
    const result = await supabase?.from('subscriptions').select('*').eq('subscriber_address', subscriberAddress.toLowerCase()).order('created_at', { ascending: false });
    return result?.data || [];
  },

  /**
   * Obtener todos los suscriptores de un creador
   */
  async getSubscribers(creatorAddress: string, limit: number = 100, offset: number = 0): Promise<Subscription[]> {
    const result = await supabase?.from('subscriptions').select('*').eq('creator_address', creatorAddress.toLowerCase()).order('created_at', { ascending: false }).limit(limit).range(offset, offset + limit - 1);
    return result?.data || [];
  },

  /**
   * Contar suscriptores de un creador
   */
  async countSubscribers(creatorAddress: string): Promise<number> {
    // Usamos count: 'exact' para obtener el número de filas que cumplen la condición
    const result = await supabase
      ?.from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_address', creatorAddress.toLowerCase());

    return result?.count ?? 0;
  },
};

