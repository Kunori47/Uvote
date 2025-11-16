import { supabase } from '../config/supabase';

export interface PredictionImage {
  id?: number;
  prediction_id_onchain: string; // usamos string para soportar uint256 grandes
  prediction_market_address: string;
  chain_id: number;
  creator_address?: string | null;
  image_url: string;
  image_path?: string | null;
  created_at?: Date;
}

export const PredictionImageModel = {
  async create(data: PredictionImage): Promise<PredictionImage> {
    const result = await supabase?.from('prediction_images').insert({
      prediction_id_onchain: data.prediction_id_onchain,
      prediction_market_address: data.prediction_market_address.toLowerCase(),
      chain_id: data.chain_id,
      creator_address: data.creator_address ? data.creator_address.toLowerCase() : null,
      image_url: data.image_url,
      image_path: data.image_path || null,
    }).select().single();

    return result?.data?.[0] || null;
  },

  async findByOnchainId(
    predictionIdOnchain: string,
    predictionMarketAddress: string,
    chainId: number
  ): Promise<PredictionImage | null> {
    const result = await supabase?.from('prediction_images').select('*').eq('prediction_id_onchain', predictionIdOnchain).eq('prediction_market_address', predictionMarketAddress.toLowerCase()).eq('chain_id', chainId).order('created_at', { ascending: false }).limit(1);
    return result?.data?.[0] || null;
  },
};


