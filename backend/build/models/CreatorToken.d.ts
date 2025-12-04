export interface CreatorToken {
    id?: number;
    token_address: string;
    creator_address: string;
    name: string;
    symbol: string;
    coin_image_url?: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}
export declare const CreatorTokenModel: {
    /**
     * Obtener token por dirección
     */
    findByAddress(address: string): Promise<CreatorToken | null>;
    /**
     * Obtener tokens de un creador
     */
    findByCreator(creatorAddress: string): Promise<CreatorToken | null>;
    /**
     * Crear o actualizar token
     */
    upsert(token: CreatorToken): Promise<CreatorToken>;
    /**
     * Actualizar metadata del token
     */
    update(address: string, updates: Partial<CreatorToken>): Promise<CreatorToken>;
};
//# sourceMappingURL=CreatorToken.d.ts.map