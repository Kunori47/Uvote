import { ethers } from 'ethers';

export interface SignatureData {
  message: string;
  signature: string;
  address: string;
}

/**
 * Verifica que una firma fue creada por la dirección especificada
 */
export const verifySignature = (data: SignatureData): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(data.message, data.signature);
    return recoveredAddress.toLowerCase() === data.address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Genera un mensaje para que el usuario lo firme
 */
export const generateAuthMessage = (address: string, nonce: string): string => {
  return `Sign this message to authenticate with Uvote:\n\nAddress: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction.`;
};

/**
 * Genera un nonce único para autenticación
 */
export const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
};

