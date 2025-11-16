import { Router, Response } from 'express';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';
import { PredictionImageModel } from '../models/PredictionImage';

const router = Router();

/**
 * POST /api/predictions/images
 * Guardar referencia de imagen para una predicción on-chain
 */
router.post(
  '/images',
  authenticateWallet,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { prediction_id_onchain, prediction_market_address, chain_id, image_url, image_path } =
        req.body || {};

      if (!prediction_id_onchain || !prediction_market_address || !chain_id || !image_url) {
        return res.status(400).json({
          error:
            'prediction_id_onchain, prediction_market_address, chain_id e image_url son obligatorios',
        });
      }

      const creatorAddress = req.userAddress || null;

      const record = await PredictionImageModel.create({
        prediction_id_onchain: String(prediction_id_onchain),
        prediction_market_address,
        chain_id: Number(chain_id),
        creator_address: creatorAddress,
        image_url,
        image_path,
      });

      res.json(record);
    } catch (error: any) {
      console.error('Error saving prediction image:', error);
      res.status(500).json({ error: error.message || 'Error saving prediction image' });
    }
  }
);

/**
 * GET /api/predictions/:id/images
 * Obtener la última imagen asociada a una predicción on-chain
 * Query params:
 *  - prediction_market_address
 *  - chain_id
 */
router.get(
  '/:id/images',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const predictionIdOnchain = req.params.id;
      const predictionMarketAddress = (req.query.prediction_market_address as string) || '';
      const chainId = parseInt((req.query.chain_id as string) || '31337', 10);

      if (!predictionMarketAddress) {
        return res.status(400).json({
          error: 'prediction_market_address es obligatorio',
        });
      }

      const record = await PredictionImageModel.findByOnchainId(
        predictionIdOnchain,
        predictionMarketAddress,
        chainId
      );

      if (!record) {
        return res.status(404).json({ error: 'Prediction image not found' });
      }

      res.json(record);
    } catch (error: any) {
      console.error('Error fetching prediction image:', error);
      res.status(500).json({ error: error.message || 'Error fetching prediction image' });
    }
  }
);

export default router;


