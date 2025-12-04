"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const supabase_1 = require("../config/supabase");
exports.SubscriptionModel = {
    /**
     * Verificar si un usuario está suscrito a un creador
     */
    async isSubscribed(subscriberAddress, creatorAddress) {
        const result = await supabase_1.supabase?.from('subscriptions').select('1').eq('subscriber_address', subscriberAddress.toLowerCase()).eq('creator_address', creatorAddress.toLowerCase());
        return result?.data?.length && result.data.length > 0 || false;
    },
    /**
     * Suscribirse a un creador
     */
    async subscribe(subscriberAddress, creatorAddress) {
        const result = await supabase_1.supabase?.from('subscriptions').insert({
            subscriber_address: subscriberAddress.toLowerCase(),
            creator_address: creatorAddress.toLowerCase(),
        }).select().single();
        return result?.data?.[0] || null;
    },
    /**
     * Desuscribirse de un creador
     */
    async unsubscribe(subscriberAddress, creatorAddress) {
        const result = await supabase_1.supabase?.from('subscriptions').delete().eq('subscriber_address', subscriberAddress.toLowerCase()).eq('creator_address', creatorAddress.toLowerCase()).select().single();
        return result?.data?.length && result.data.length > 0 || false;
    },
    /**
     * Obtener todas las suscripciones de un usuario
     */
    async getSubscriptions(subscriberAddress) {
        const result = await supabase_1.supabase?.from('subscriptions').select('*').eq('subscriber_address', subscriberAddress.toLowerCase()).order('created_at', { ascending: false });
        return result?.data || [];
    },
    /**
     * Obtener todos los suscriptores de un creador
     */
    async getSubscribers(creatorAddress, limit = 100, offset = 0) {
        const result = await supabase_1.supabase?.from('subscriptions').select('*').eq('creator_address', creatorAddress.toLowerCase()).order('created_at', { ascending: false }).limit(limit).range(offset, offset + limit - 1);
        return result?.data || [];
    },
    /**
     * Contar suscriptores de un creador
     */
    async countSubscribers(creatorAddress) {
        if (!supabase_1.supabase) {
            throw new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
        }
        try {
            // Usamos count: 'exact' para obtener el número de filas que cumplen la condición
            const { count, error } = await supabase_1.supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('creator_address', creatorAddress.toLowerCase());
            if (error) {
                console.error('Supabase error counting subscribers:', error);
                throw new Error(`Database error: ${error.message}`);
            }
            return count ?? 0;
        }
        catch (error) {
            console.error('Error in countSubscribers:', error);
            throw error;
        }
    },
};
//# sourceMappingURL=Subscription.js.map