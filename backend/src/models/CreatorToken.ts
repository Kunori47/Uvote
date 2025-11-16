import { supabase } from '../config/supabase';

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

export const CreatorTokenModel = {
  /**
   * Obtener token por dirección
   */
  async findByAddress(address: string): Promise<CreatorToken | null> {
    const result = await supabase?.from('creator_tokens').select('*').eq('token_address', address.toLowerCase());
    return result?.data?.[0] || null;
  },

  /**
   * Obtener tokens de un creador
   */
  async findByCreator(creatorAddress: string): Promise<CreatorToken | null> {
    const result = await supabase?.from('creator_tokens').select('*').eq('creator_address', creatorAddress.toLowerCase());
    return result?.data?.[0] || null;
  },

  /**
   * Crear o actualizar token
   */
  async upsert(token: CreatorToken): Promise<CreatorToken> {
    const result = await supabase?.from('creator_tokens').upsert({
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
  async update(address: string, updates: Partial<CreatorToken>): Promise<CreatorToken> {
    const fields: string[] = [];
    const values: any[] = [];
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

    const result = await supabase?.from('creator_tokens').update(updates).eq('token_address', address.toLowerCase()).select().single();
    return result?.data?.[0] || null;
  },
};

