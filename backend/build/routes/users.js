"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const Subscription_1 = require("../models/Subscription");
const router = (0, express_1.Router)();
/**
 * GET /api/users/:address
 * Obtener perfil de usuario
 */
router.get('/:address', async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const user = await User_1.UserModel.findByAddress(address);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Obtener contador de suscriptores si es creador
        let subscriberCount = 0;
        if (user.is_creator) {
            subscriberCount = await Subscription_1.SubscriptionModel.countSubscribers(address);
        }
        res.json({
            ...user,
            subscriberCount,
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/users
 * Crear o actualizar perfil de usuario
 */
router.post('/', auth_1.authenticateWallet, async (req, res) => {
    try {
        const userAddress = req.userAddress;
        const { username, display_name, bio, profile_image_url, is_creator } = req.body;
        // Validar username único si se proporciona
        if (username) {
            const existing = await User_1.UserModel.findByUsername(username);
            if (existing && existing.wallet_address.toLowerCase() !== userAddress) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }
        const user = await User_1.UserModel.upsert({
            wallet_address: userAddress,
            username,
            display_name,
            bio,
            profile_image_url,
            is_creator,
        });
        res.json(user);
    }
    catch (error) {
        console.error('Error creating/updating user:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * PUT /api/users/:address
 * Actualizar perfil de usuario (solo el propio)
 */
router.put('/:address', auth_1.authenticateWallet, async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const userAddress = req.userAddress;
        if (address !== userAddress) {
            return res.status(403).json({ error: 'You can only update your own profile' });
        }
        const { username, display_name, bio, profile_image_url } = req.body;
        // Validar username único si se proporciona
        if (username) {
            const existing = await User_1.UserModel.findByUsername(username);
            if (existing && existing.wallet_address.toLowerCase() !== userAddress) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }
        const user = await User_1.UserModel.update(address, {
            username,
            display_name,
            bio,
            profile_image_url,
        });
        res.json(user);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/users/:address/subscriptions
 * Obtener suscripciones de un usuario
 */
router.get('/:address/subscriptions', async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const subscriptions = await Subscription_1.SubscriptionModel.getSubscriptions(address);
        // Obtener información de los creadores
        const creators = await Promise.all(subscriptions.map(async (sub) => {
            const creator = await User_1.UserModel.findByAddress(sub.creator_address);
            return {
                ...sub,
                creator: creator || { wallet_address: sub.creator_address },
            };
        }));
        res.json(creators);
    }
    catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/users/:address/subscribers
 * Obtener suscriptores de un creador
 */
router.get('/:address/subscribers', async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const subscribers = await Subscription_1.SubscriptionModel.getSubscribers(address, limit, offset);
        const count = await Subscription_1.SubscriptionModel.countSubscribers(address);
        res.json({
            subscribers,
            total: count,
            limit,
            offset,
        });
    }
    catch (error) {
        console.error('Error fetching subscribers:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map