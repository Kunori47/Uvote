import { Router, Response } from 'express';
import { CreatorTokenModel } from '../models/CreatorToken';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/tokens/:address
 * Obtener metadata del token
 */
router.get('/:address', async (req, res: Response) => {
  try {
    const address = req.params.address.toLowerCase();
    const token = await CreatorTokenModel.findByAddress(address);
    
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json(token);
  } catch (error: any) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tokens
 * Registrar o actualizar token
 */
router.post('/', authenticateWallet, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.userAddress!;
    const { token_address, name, symbol, coin_image_url, description } = req.body;

    if (!token_address || !name || !symbol) {
      return res.status(400).json({ error: 'Missing required fields: token_address, name, symbol' });
    }

    // Verificar que el token pertenece al usuario (esto debería verificarse contra el contrato)
    // Por ahora, confiamos en el usuario, pero en producción deberías verificar contra CreatorTokenFactory

    const token = await CreatorTokenModel.upsert({
      token_address,
      creator_address: userAddress,
      name,
      symbol,
      coin_image_url,
      description,
    });

    res.json(token);
  } catch (error: any) {
    console.error('Error creating/updating token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tokens/:address
 * Actualizar metadata del token (solo el creador)
 */
router.put('/:address', authenticateWallet, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const address = req.params.address.toLowerCase();
    const userAddress = req.userAddress!;
    
    const token = await CreatorTokenModel.findByAddress(address);
    if (!token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (token.creator_address.toLowerCase() !== userAddress) {
      return res.status(403).json({ error: 'You can only update your own tokens' });
    }

    const { coin_image_url, coin_image_ipfs_hash, description } = req.body;
    const updated = await CreatorTokenModel.update(address, {
      coin_image_url,
      description,
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating token:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

