import { Request, Response, NextFunction } from 'express';
import { verifySignature, SignatureData } from '../services/signature';

export interface AuthenticatedRequest extends Request {
  userAddress?: string;
}

/**
 * Middleware para autenticar usuarios mediante firma de wallet
 */
export const authenticateWallet = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const token = authHeader.substring(7);
    const signatureData: SignatureData = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (!verifySignature(signatureData)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    req.userAddress = signatureData.address.toLowerCase();
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

/**
 * Middleware opcional - verifica si el usuario está autenticado, pero no falla si no lo está
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const signatureData: SignatureData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      if (verifySignature(signatureData)) {
        req.userAddress = signatureData.address.toLowerCase();
      }
    } catch (error) {
      // Silently fail, user is not authenticated
    }
  }
  
  next();
};

