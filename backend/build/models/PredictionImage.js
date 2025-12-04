"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionImageModel = void 0;
const supabase_1 = require("../config/supabase");
exports.PredictionImageModel = {
    async create(data) {
        const result = await supabase_1.supabase?.from('prediction_images').insert({
            prediction_id_onchain: data.prediction_id_onchain,
            prediction_market_address: data.prediction_market_address.toLowerCase(),
            chain_id: data.chain_id,
            creator_address: data.creator_address ? data.creator_address.toLowerCase() : null,
            image_url: data.image_url || null,
            image_path: data.image_path || null,
            tags: data.tags || [],
        }).select().single();
        return result?.data?.[0] || null;
    },
    async findByOnchainId(predictionIdOnchain, predictionMarketAddress, chainId) {
        const result = await supabase_1.supabase?.from('prediction_images').select('*').eq('prediction_id_onchain', predictionIdOnchain).eq('prediction_market_address', predictionMarketAddress.toLowerCase()).eq('chain_id', chainId).order('created_at', { ascending: false }).limit(1);
        return result?.data?.[0] || null;
    },
};
//# sourceMappingURL=PredictionImage.js.map