"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateWallet = void 0;
const signature_1 = require("../services/signature");
/**
 * Middleware para autenticar usuarios mediante firma de wallet
 */
const authenticateWallet = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    try {
        const token = authHeader.substring(7);
        const signatureData = JSON.parse(Buffer.from(token, 'base64').toString());
        if (!(0, signature_1.verifySignature)(signatureData)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        req.userAddress = signatureData.address.toLowerCase();
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid authentication token' });
    }
};
exports.authenticateWallet = authenticateWallet;
/**
 * Middleware opcional - verifica si el usuario está autenticado, pero no falla si no lo está
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const signatureData = JSON.parse(Buffer.from(token, 'base64').toString());
            if ((0, signature_1.verifySignature)(signatureData)) {
                req.userAddress = signatureData.address.toLowerCase();
            }
        }
        catch (error) {
            // Silently fail, user is not authenticated
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map