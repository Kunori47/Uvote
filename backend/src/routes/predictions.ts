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
      const { prediction_id_onchain, prediction_market_address, chain_id, image_url, image_path, tags } =
        req.body || {};

      if (!prediction_id_onchain || !prediction_market_address || !chain_id) {
        return res.status(400).json({
          error:
            'prediction_id_onchain, prediction_market_address y chain_id son obligatorios',
        });
      }

      // Si hay tags pero no hay image_url, permitimos guardar solo con tags (image_url será opcional)
      // Si no hay tags ni image_url, entonces image_url es requerido
      if (!image_url && (!tags || (Array.isArray(tags) && tags.length === 0))) {
        return res.status(400).json({
          error:
            'Debe proporcionar al menos image_url o tags',
        });
      }

      const creatorAddress = req.userAddress || null;

      // Validar que tags sea un array si está presente
      let tagsArray: string[] = [];
      if (tags) {
        if (Array.isArray(tags)) {
          tagsArray = tags.filter(tag => typeof tag === 'string' && tag.trim() !== '');
        } else {
          return res.status(400).json({
            error: 'tags debe ser un array de strings',
          });
        }
      }

      const record = await PredictionImageModel.create({
        prediction_id_onchain: String(prediction_id_onchain),
        prediction_market_address,
        chain_id: Number(chain_id),
        creator_address: creatorAddress,
        image_url: image_url || null,
        image_path,
        tags: tagsArray,
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


