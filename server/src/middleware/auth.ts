import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

/**
 * Clave de firma de los JWT.
 *
 * Lo correcto es definir JWT_SECRET en el entorno. Cuando no está —caso del
 * despliegue actual, donde no se pudieron agregar variables nuevas— se deriva
 * una clave estable a partir del DATABASE_URL, que ya vive en el entorno. No
 * agrega exposición: quien tenga esa cadena ya tiene la base completa. La
 * contraparte es que rotar la contraseña de la base invalida las sesiones
 * activas, algo tolerable con un TTL de 12 horas.
 */
function resolveSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.DATABASE_URL) {
    console.warn('[Auth] JWT_SECRET no definida; derivando la clave de firma del DATABASE_URL. Definir JWT_SECRET para desacoplarlas.');
    return crypto.createHmac('sha256', 'msc-valoracion-jwt-v1').update(process.env.DATABASE_URL).digest('hex');
  }

  console.error('[Auth] ⛔ Sin JWT_SECRET ni DATABASE_URL: las rutas protegidas rechazarán todo.');
  return '';
}

const JWT_SECRET = resolveSecret();
export const TOKEN_TTL = '12h';

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
