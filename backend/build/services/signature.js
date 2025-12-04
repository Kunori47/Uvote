"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNonce = exports.generateAuthMessage = exports.verifySignature = void 0;
const ethers_1 = require("ethers");
/**
 * Verifica que una firma fue creada por la dirección especificada
 */
const verifySignature = (data) => {
    try {
        const recoveredAddress = ethers_1.ethers.verifyMessage(data.message, data.signature);
        return recoveredAddress.toLowerCase() === data.address.toLowerCase();
    }
    catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
};
exports.verifySignature = verifySignature;
/**
 * Genera un mensaje para que el usuario lo firme
 */
const generateAuthMessage = (address, nonce) => {
    return `Sign this message to authenticate with Uvote:\n\nAddress: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction.`;
};
exports.generateAuthMessage = generateAuthMessage;
/**
 * Genera un nonce único para autenticación
 */
const generateNonce = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
};
exports.generateNonce = generateNonce;
//# sourceMappingURL=signature.js.map