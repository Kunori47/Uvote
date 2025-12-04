export interface SignatureData {
    message: string;
    signature: string;
    address: string;
}
/**
 * Verifica que una firma fue creada por la dirección especificada
 */
export declare const verifySignature: (data: SignatureData) => boolean;
/**
 * Genera un mensaje para que el usuario lo firme
 */
export declare const generateAuthMessage: (address: string, nonce: string) => string;
/**
 * Genera un nonce único para autenticación
 */
export declare const generateNonce: () => string;
//# sourceMappingURL=signature.d.ts.map