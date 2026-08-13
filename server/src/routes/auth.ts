import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { requireAuth, signToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Mismo mensaje para usuario inexistente y clave incorrecta: no filtramos
    // qué correos están registrados.
    const invalid = { error: 'Credenciales inválidas' };
    if (!user) return res.status(401).json(invalid);

    // Los hashes de bcrypt siempre empiezan con $2. Cualquier otra cosa es un
    // password en texto plano heredado del seed y no se acepta para entrar.
    if (!user.password.startsWith('$2')) {
      console.warn(`[Auth] Usuario ${user.email} tiene password sin hashear. Correr: npx ts-node set_password.ts`);
      return res.status(401).json(invalid);
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json(invalid);

    const token = signToken({ sub: user.id, email: user.email, rol: user.rol });
    return res.json({
      token,
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol }
    });
  } catch (error: any) {
    console.error('[Auth] Error en login:', error.message);
    return res.status(500).json({ error: 'Error interno al autenticar' });
  }
});

// Permite al frontend validar al arrancar si el token guardado sigue vigente.
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
