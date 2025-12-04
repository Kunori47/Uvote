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
    
    // Verificar que la dirección sea válida
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    const user = await UserModel.findByAddress(address);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Obtener contador de suscriptores si es creador
    let subscriberCount = 0;
    try {
      if (user.is_creator) {
        subscriberCount = await SubscriptionModel.countSubscribers(address);
      }
    } catch (subError: any) {
      // Si falla obtener suscriptores, continuar sin ese dato
      console.warn('Error getting subscriber count:', subError.message);
    }

    res.json({
      ...user,
      subscriberCount,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Si es un error de configuración de Supabase
    if (error.code === 'SUPABASE_NOT_CONFIGURED' || 
        (error.message && error.message.includes('Supabase client not initialized'))) {
      return res.status(503).json({ 
        error: 'Database not configured',
        message: 'Please configure SUPABASE_URL and SUPABASE_ANON_KEY environment variables in Vercel',
        code: 'SUPABASE_NOT_CONFIGURED'
      });
    }
    
    // Si es un error de base de datos
    if (error.code === 'DATABASE_ERROR' || 
        (error.message && error.message.includes('Database error'))) {
      return res.status(500).json({ 
        error: 'Database error',
        message: 'An error occurred while querying the database',
        code: 'DATABASE_ERROR'
      });
    }
    
    // Error inesperado
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    });
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

