import { Router, Response } from 'express';
import { UserModel } from '../models/User';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';
import { SubscriptionModel } from '../models/Subscription';

const router = Router();

/**
 * GET /api/users/:address
 * Obtener perfil de usuario
 */
router.get('/:address', async (req, res: Response) => {
  try {
    const address = req.params.address.toLowerCase();
    const user = await UserModel.findByAddress(address);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Obtener contador de suscriptores si es creador
    let subscriberCount = 0;
    if (user.is_creator) {
      subscriberCount = await SubscriptionModel.countSubscribers(address);
    }

    res.json({
      ...user,
      subscriberCount,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/users
 * Crear o actualizar perfil de usuario
 */
router.post('/', authenticateWallet, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userAddress = req.userAddress!;
    const { username, display_name, bio, profile_image_url, is_creator } = req.body;

    // Validar username único si se proporciona
    if (username) {
      const existing = await UserModel.findByUsername(username);
      if (existing && existing.wallet_address.toLowerCase() !== userAddress) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const user = await UserModel.upsert({
      wallet_address: userAddress,
      username,
      display_name,
      bio,
      profile_image_url,
      is_creator,
    });

    res.json(user);
  } catch (error: any) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/users/:address
 * Actualizar perfil de usuario (solo el propio)
 */
router.put('/:address', authenticateWallet, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const address = req.params.address.toLowerCase();
    const userAddress = req.userAddress!;

    if (address !== userAddress) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { username, display_name, bio, profile_image_url } = req.body;

    // Validar username único si se proporciona
    if (username) {
      const existing = await UserModel.findByUsername(username);
      if (existing && existing.wallet_address.toLowerCase() !== userAddress) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const user = await UserModel.update(address, {
      username,
      display_name,
      bio,
      profile_image_url,
    });

    res.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:address/subscriptions
 * Obtener suscripciones de un usuario
 */
router.get('/:address/subscriptions', async (req, res: Response) => {
  try {
    const address = req.params.address.toLowerCase();
    const subscriptions = await SubscriptionModel.getSubscriptions(address);
    
    // Obtener información de los creadores
    const creators = await Promise.all(
      subscriptions.map(async (sub) => {
        const creator = await UserModel.findByAddress(sub.creator_address);
        return {
          ...sub,
          creator: creator || { wallet_address: sub.creator_address },
        };
      })
    );

    res.json(creators);
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/users/:address/subscribers
 * Obtener suscriptores de un creador
 */
router.get('/:address/subscribers', async (req, res: Response) => {
  try {
    const address = req.params.address.toLowerCase();
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const subscribers = await SubscriptionModel.getSubscribers(address, limit, offset);
    const count = await SubscriptionModel.countSubscribers(address);

    res.json({
      subscribers,
      total: count,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

