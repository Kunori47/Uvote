import { supabase } from '../config/supabase';

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

export const UserModel = {
  /**
   * Obtener usuario por dirección de wallet
   */
  async findByAddress(address: string): Promise<User | null> {
    if (!supabase) {
      const error = new Error('Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      (error as any).code = 'SUPABASE_NOT_CONFIGURED';
      throw error;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address.toLowerCase())
        .single();

      // PGRST116 = no rows returned (usuario no existe) - esto es normal, retornar null
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Usuario no encontrado, no es un error
        }
        // Otro error de Supabase
        console.error('Supabase error finding user by address:', error);
        const dbError = new Error(`Database error: ${error.message}`);
        (dbError as any).code = 'DATABASE_ERROR';
        (dbError as any).originalError = error;
        throw dbError;
      }

      return data || null;
    } catch (error: any) {
      // Si ya tiene un code, re-lanzar tal cual
      if (error.code) {
        throw error;
      }
      // Error inesperado
      console.error('Error in findByAddress:', error);
      const unexpectedError = new Error(`Unexpected error: ${error.message}`);
      (unexpectedError as any).code = 'UNEXPECTED_ERROR';
      throw unexpectedError;
    }
  },

  /**
   * Obtener usuario por username
   */
  async findByUsername(username: string): Promise<User | null> {
    const result = await supabase?.from('users').select('*').eq('username', username);
    return result?.data?.[0] || null;
  },

  /**
   * Crear o actualizar usuario
   */
  async upsert(user: User): Promise<User> {
    const result = await supabase?.from('users').insert({
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
  async findAllCreators(limit: number = 50, offset: number = 0): Promise<User[]> {
    const result = await supabase?.from('users').select('*').eq('is_creator', true).order('created_at', { ascending: false }).limit(limit).range(offset, offset + limit - 1);
    return result?.data || [];
  },

  /**
   * Actualizar perfil de usuario
   */
  async update(address: string, updates: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
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

    const result = await supabase?.from('users').update(updates).eq('wallet_address', address.toLowerCase()).select().single();
    return result?.data?.[0] || null;
  },
};

