export interface User {
    id?: number;
    wallet_address: string;
    username?: string;
    display_name?: string;
    bio?: string;
    profile_image_url?: string;
    profile_image_ipfs_hash?: string;
    is_creator?: boolean;
    created_at?: Date;
    updated_at?: Date;
}
export declare const UserModel: {
    /**
     * Obtener usuario por dirección de wallet
     */
    findByAddress(address: string): Promise<User | null>;
    /**
     * Obtener usuario por username
     */
    findByUsername(username: string): Promise<User | null>;
    /**
     * Crear o actualizar usuario
     */
    upsert(user: User): Promise<User>;
    /**
     * Listar todos los creadores
     */
    findAllCreators(limit?: number, offset?: number): Promise<User[]>;
    /**
     * Actualizar perfil de usuario
     */
    update(address: string, updates: Partial<User>): Promise<User>;
};
//# sourceMappingURL=User.d.ts.map