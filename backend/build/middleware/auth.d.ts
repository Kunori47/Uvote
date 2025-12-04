import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    userAddress?: string;
}
/**
 * Middleware para autenticar usuarios mediante firma de wallet
 */
export declare const authenticateWallet: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware opcional - verifica si el usuario está autenticado, pero no falla si no lo está
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map