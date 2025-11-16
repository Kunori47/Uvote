import { Router, Response } from 'express';
import { UserModel } from '../models/User';
import { SubscriptionModel } from '../models/Subscription';

const router = Router();

/**
 * GET /api/creators
 * Listar todos los creadores
 */
router.get('/', async (req, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const creators = await UserModel.findAllCreators(limit, offset);
    
    // Agregar contador de suscriptores a cada creador
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        const subscriberCount = await SubscriptionModel.countSubscribers(creator.wallet_address);
        return {
          ...creator,
          subscriberCount,
        };
      })
    );

    res.json({
      creators: creatorsWithStats,
      total: creators.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/creators/:address
 * Obtener perfil de creador
 */
router.get('/:address', async (req, res: Response) => {
  try {
    const address = req.params.address.toLowerCase();
    const creator = await UserModel.findByAddress(address);
    
    if (!creator || !creator.is_creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const subscriberCount = await SubscriptionModel.countSubscribers(address);

    res.json({
      ...creator,
      subscriberCount,
    });
  } catch (error: any) {
    console.error('Error fetching creator:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/creators/:address/stats
 * Obtener estadísticas del creador
 */
router.get('/:address/stats', async (req, res: Response) => {
  try {
    const address = req.params.address.toLowerCase();
    const creator = await UserModel.findByAddress(address);
    
    if (!creator || !creator.is_creator) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const subscriberCount = await SubscriptionModel.countSubscribers(address);

    res.json({
      subscriberCount,
      // Aquí puedes agregar más estadísticas cuando las tengas
      // totalPredictions: ...,
      // totalPool: ...,
      // etc.
    });
  } catch (error: any) {
    console.error('Error fetching creator stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

