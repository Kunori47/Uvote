export interface PredictionImage {
    id?: number;
    prediction_id_onchain: string;
    prediction_market_address: string;
    chain_id: number;
    creator_address?: string | null;
    image_url?: string | null;
    image_path?: string | null;
    tags?: string[];
    created_at?: Date;
}
export declare const PredictionImageModel: {
    create(data: PredictionImage): Promise<PredictionImage>;
    findByOnchainId(predictionIdOnchain: string, predictionMarketAddress: string, chainId: number): Promise<PredictionImage | null>;
};
//# sourceMappingURL=PredictionImage.d.ts.map