"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CreatorToken_1 = require("../models/CreatorToken");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/tokens/:address
 * Obtener metadata del token
 */
router.get('/:address', async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const token = await CreatorToken_1.CreatorTokenModel.findByAddress(address);
        if (!token) {
            return res.status(404).json({ error: 'Token not found' });
        }
        res.json(token);
    }
    catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/tokens
 * Registrar o actualizar token
 */
router.post('/', auth_1.authenticateWallet, async (req, res) => {
    try {
        const userAddress = req.userAddress;
        const { token_address, name, symbol, coin_image_url, description } = req.body;
        if (!token_address || !name || !symbol) {
            return res.status(400).json({ error: 'Missing required fields: token_address, name, symbol' });
        }
        // Verificar que el token pertenece al usuario (esto debería verificarse contra el contrato)
        // Por ahora, confiamos en el usuario, pero en producción deberías verificar contra CreatorTokenFactory
        const token = await CreatorToken_1.CreatorTokenModel.upsert({
            token_address,
            creator_address: userAddress,
            name,
            symbol,
            coin_image_url,
            description,
        });
        res.json(token);
    }
    catch (error) {
        console.error('Error creating/updating token:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * PUT /api/tokens/:address
 * Actualizar metadata del token (solo el creador)
 */
router.put('/:address', auth_1.authenticateWallet, async (req, res) => {
    try {
        const address = req.params.address.toLowerCase();
        const userAddress = req.userAddress;
        const token = await CreatorToken_1.CreatorTokenModel.findByAddress(address);
        if (!token) {
            return res.status(404).json({ error: 'Token not found' });
        }
        if (token.creator_address.toLowerCase() !== userAddress) {
            return res.status(403).json({ error: 'You can only update your own tokens' });
        }
        const { coin_image_url, coin_image_ipfs_hash, description } = req.body;
        const updated = await CreatorToken_1.CreatorTokenModel.update(address, {
            coin_image_url,
            description,
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating token:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=tokens.js.map