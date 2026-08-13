import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  sub: string;
  email: string;
  rol: string;
}

// Extiende el Request de Express para arrastrar el usuario autenticado.
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || '';
export const TOKEN_TTL = '12h';

if (!JWT_SECRET) {
  console.error('[Auth] ⛔ JWT_SECRET no está configurada. Las rutas protegidas rechazarán todo hasta que se defina.');
}

export function signToken(payload: AuthPayload): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET no configurada');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'Servidor sin JWT_SECRET configurada' });
  }

  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
