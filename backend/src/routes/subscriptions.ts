import { Router, Response } from 'express';
import { SubscriptionModel } from '../models/Subscription';
import { UserModel } from '../models/User';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/subscriptions
 * Suscribirse a un creador
 */
router.post('/', authenticateWallet, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriberAddress = req.userAddress!;
    const { creator_address } = req.body;

    if (!creator_address) {
      return res.status(400).json({ error: 'Missing creator_address' });
    }

    if (subscriberAddress.toLowerCase() === creator_address.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot subscribe to yourself' });
    }

    // Asegurarnos de que existan registros en users para respetar las foreign keys
    // Crea/actualiza un usuario mínimo para el suscriptor
    await UserModel.upsert({
      wallet_address: subscriberAddress,
    });

    // Crea/actualiza un usuario mínimo para el creador (marcado como posible creador)
    await UserModel.upsert({
      wallet_address: creator_address,
      is_creator: true,
    });

    const subscription = await SubscriptionModel.subscribe(subscriberAddress, creator_address);
    res.json(subscription);
  } catch (error: any) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/subscriptions/:creatorAddress
 * Desuscribirse de un creador
 */
router.delete('/:creatorAddress', authenticateWallet, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriberAddress = req.userAddress!;
    const creatorAddress = req.params.creatorAddress.toLowerCase();

    const success = await SubscriptionModel.unsubscribe(subscriberAddress, creatorAddress);
    
    if (!success) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/check/:subscriber/:creator
 * Verificar si está suscrito
 */
router.get('/check/:subscriber/:creator', async (req, res: Response) => {
  try {
    const subscriberAddress = req.params.subscriber.toLowerCase();
    const creatorAddress = req.params.creator.toLowerCase();

    const isSubscribed = await SubscriptionModel.isSubscribed(subscriberAddress, creatorAddress);
    res.json({ isSubscribed });
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/count/:creatorAddress
 * Obtener la cantidad de suscriptores de un creador por dirección de wallet
 */
router.get('/count/:creatorAddress', async (req, res: Response) => {
  try {
    const creatorAddress = req.params.creatorAddress.toLowerCase();

    if (!creatorAddress) {
      return res.status(400).json({ error: 'Missing creatorAddress' });
    }

    const total = await SubscriptionModel.countSubscribers(creatorAddress);
    res.json({
      creator_address: creatorAddress,
      total,
    });
  } catch (error: any) {
    console.error('Error counting subscribers:', error);
    res.status(500).json({ error: error.message || 'Error counting subscribers' });
  }
});

export default router;

