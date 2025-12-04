"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const router = (0, express_1.Router)();
/**
 * GET /api/creators
 * Listar todos los creadores
 */
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const creators = await User_1.UserModel.findAllCreators(limit, offset);
        // Agregar contador de suscriptores a cada creador
        const creatorsWithStats = await Promise.all(creators.map(async (creator) => {
            const subscriberCount = await Subscription_1.SubscriptionModel.countSubscribers(creator.wallet_address);
            return {
                ...creator,
                subscriberCount,
            };
        }));
        res.json({
            creators: creatorsWithStats,
            total: creators.length,
            limit,
            offset,
        });
    }
    catch (error) {
        console.error('Error fetching creators:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/creators/:address
 * Obtener perfil de creador
 */
router.get('/:address', async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const creator = await User_1.UserModel.findByAddress(address);
        if (!creator || !creator.is_creator) {
            return res.status(404).json({ error: 'Creator not found' });
        }
        const subscriberCount = await Subscription_1.SubscriptionModel.countSubscribers(address);
        res.json({
            ...creator,
            subscriberCount,
        });
    }
    catch (error) {
        console.error('Error fetching creator:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/creators/:address/stats
 * Obtener estadísticas del creador
 */
router.get('/:address/stats', async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const creator = await User_1.UserModel.findByAddress(address);
        if (!creator || !creator.is_creator) {
            return res.status(404).json({ error: 'Creator not found' });
        }
        const subscriberCount = await Subscription_1.SubscriptionModel.countSubscribers(address);
        res.json({
            subscriberCount,
            // Aquí puedes agregar más estadísticas cuando las tengas
            // totalPredictions: ...,
            // totalPool: ...,
            // etc.
        });
    }
    catch (error) {
        console.error('Error fetching creator stats:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=creators.js.map