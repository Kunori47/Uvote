"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/subscriptions
 * Suscribirse a un creador
 */
router.post('/', auth_1.authenticateWallet, async (req, res) => {
    try {
        const subscriberAddress = req.userAddress;
        const { creator_address } = req.body;
        if (!creator_address) {
            return res.status(400).json({ error: 'Missing creator_address' });
        }
        if (subscriberAddress.toLowerCase() === creator_address.toLowerCase()) {
            return res.status(400).json({ error: 'Cannot subscribe to yourself' });
        }
        // Asegurarnos de que existan registros en users para respetar las foreign keys
        // Crea/actualiza un usuario mínimo para el suscriptor
        await User_1.UserModel.upsert({
            wallet_address: subscriberAddress,
        });
        // Crea/actualiza un usuario mínimo para el creador (marcado como posible creador)
        await User_1.UserModel.upsert({
            wallet_address: creator_address,
            is_creator: true,
        });
        const subscription = await Subscription_1.SubscriptionModel.subscribe(subscriberAddress, creator_address);
        res.json(subscription);
    }
    catch (error) {
        console.error('Error subscribing:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * DELETE /api/subscriptions/:creatorAddress
 * Desuscribirse de un creador
 */
router.delete('/:creatorAddress', auth_1.authenticateWallet, async (req, res) => {
    try {
        const subscriberAddress = req.userAddress;
        const creatorAddress = req.params.creatorAddress.toLowerCase();
        const success = await Subscription_1.SubscriptionModel.unsubscribe(subscriberAddress, creatorAddress);
        if (!success) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/subscriptions/check/:subscriber/:creator
 * Verificar si está suscrito
 */
router.get('/check/:subscriber/:creator', async (req, res) => {
    try {
        const subscriberAddress = req.params.subscriber.toLowerCase();
        const creatorAddress = req.params.creator.toLowerCase();
        const isSubscribed = await Subscription_1.SubscriptionModel.isSubscribed(subscriberAddress, creatorAddress);
        res.json({ isSubscribed });
    }
    catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/subscriptions/count/:creatorAddress
 * Obtener la cantidad de suscriptores de un creador por dirección de wallet
 */
router.get('/count/:creatorAddress', async (req, res) => {
    try {
        const creatorAddress = req.params.creatorAddress.toLowerCase();
        if (!creatorAddress) {
            return res.status(400).json({ error: 'Missing creatorAddress' });
        }
        const total = await Subscription_1.SubscriptionModel.countSubscribers(creatorAddress);
        res.json({
            creator_address: creatorAddress,
            total,
        });
    }
    catch (error) {
        console.error('Error counting subscribers:', error);
        res.status(500).json({ error: error.message || 'Error counting subscribers' });
    }
});
exports.default = router;
//# sourceMappingURL=subscriptions.js.map