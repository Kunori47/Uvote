"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const supabase_1 = require("../config/supabase");
exports.UserModel = {
    /**
     * Obtener usuario por dirección de wallet
     */
    async findByAddress(address) {
        if (!supabase_1.supabase) {
            const error = new Error('Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables in Vercel.');
            console.error('❌ Supabase not initialized. Check environment variables.');
            console.error('   SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
            console.error('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set (length: ' + process.env.SUPABASE_ANON_KEY.length + ')' : 'Missing');
            throw error;
        }
        try {
            const { data, error } = await supabase_1.supabase
                .from('users')
                .select('*')
                .eq('wallet_address', address.toLowerCase())
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Supabase error finding user by address:', error);
                throw new Error(`Database error: ${error.message}`);
            }
            return data || null;
        }
        catch (error) {
            console.error('Error in findByAddress:', error);
            throw error;
        }
    },
    /**
     * Obtener usuario por username
     */
    async findByUsername(username) {
        const result = await supabase_1.supabase?.from('users').select('*').eq('username', username);
        return result?.data?.[0] || null;
    },
    /**
     * Crear o actualizar usuario
     */
    async upsert(user) {
        const result = await supabase_1.supabase?.from('users').insert({
            wallet_address: user.wallet_address.toLowerCase(),
            username: user.username,
            display_name: user.display_name,
            bio: user.bio,
            profile_image_url: user.profile_image_url,
            is_creator: user.is_creator || false,
        }).select().single();
        return result?.data?.[0] || null;
    },
    /**
     * Listar todos los creadores
     */
    async findAllCreators(limit = 50, offset = 0) {
        const result = await supabase_1.supabase?.from('users').select('*').eq('is_creator', true).order('created_at', { ascending: false }).limit(limit).range(offset, offset + limit - 1);
        return result?.data || [];
    },
    /**
     * Actualizar perfil de usuario
     */
    async update(address, updates) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && key !== 'wallet_address' && key !== 'id') {
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
        const result = await supabase_1.supabase?.from('users').update(updates).eq('wallet_address', address.toLowerCase()).select().single();
        return result?.data?.[0] || null;
    },
};
//# sourceMappingURL=User.js.map