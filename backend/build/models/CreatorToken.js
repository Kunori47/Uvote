"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatorTokenModel = void 0;
const supabase_1 = require("../config/supabase");
exports.CreatorTokenModel = {
    /**
     * Obtener token por dirección
     */
    async findByAddress(address) {
        const result = await supabase_1.supabase?.from('creator_tokens').select('*').eq('token_address', address.toLowerCase());
        return result?.data?.[0] || null;
    },
    /**
     * Obtener tokens de un creador
     */
    async findByCreator(creatorAddress) {
        const result = await supabase_1.supabase?.from('creator_tokens').select('*').eq('creator_address', creatorAddress.toLowerCase());
        return result?.data?.[0] || null;
    },
    /**
     * Crear o actualizar token
     */
    async upsert(token) {
        const result = await supabase_1.supabase?.from('creator_tokens').upsert({
            token_address: token.token_address.toLowerCase(),
            creator_address: token.creator_address.toLowerCase(),
            name: token.name,
            symbol: token.symbol,
            coin_image_url: token.coin_image_url,
            description: token.description,
        }, {
            onConflict: 'token_address',
            ignoreDuplicates: false,
        }).select().single();
        return result?.data?.[0] || null;
    },
    /**
     * Actualizar metadata del token
     */
    async update(address, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && key !== 'token_address' && key !== 'id' && key !== 'creator_address') {
                fields.push(`${key} = $${paramCount}`);
                values.push(value);
                paramCount++;
            }
        });
        if (fields.length === 0) {
            throw new Error('No fields to update');
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(address.toLowerCase());
        const result = await supabase_1.supabase?.from('creator_tokens').update(updates).eq('token_address', address.toLowerCase()).select().single();
        return result?.data?.[0] || null;
    },
};
//# sourceMappingURL=CreatorToken.js.map