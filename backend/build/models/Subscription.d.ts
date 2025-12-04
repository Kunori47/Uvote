export interface Subscription {
    id?: number;
    subscriber_address: string;
    creator_address: string;
    created_at?: Date;
}
export declare const SubscriptionModel: {
    /**
     * Verificar si un usuario está suscrito a un creador
     */
    isSubscribed(subscriberAddress: string, creatorAddress: string): Promise<boolean>;
    /**
     * Suscribirse a un creador
     */
    subscribe(subscriberAddress: string, creatorAddress: string): Promise<Subscription>;
    /**
     * Desuscribirse de un creador
     */
    unsubscribe(subscriberAddress: string, creatorAddress: string): Promise<boolean>;
    /**
     * Obtener todas las suscripciones de un usuario
     */
    getSubscriptions(subscriberAddress: string): Promise<Subscription[]>;
    /**
     * Obtener todos los suscriptores de un creador
     */
    getSubscribers(creatorAddress: string, limit?: number, offset?: number): Promise<Subscription[]>;
    /**
     * Contar suscriptores de un creador
     */
    countSubscribers(creatorAddress: string): Promise<number>;
};
//# sourceMappingURL=Subscription.d.ts.map