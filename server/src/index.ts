import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import puestosRouter from './routes/puestos';
import evaluacionesRouter from './routes/evaluaciones';
import encuestasRouter from './routes/encuestas';
import calculosRouter from './routes/calculos';
import asignacionesRouter from './routes/asignaciones';
import auditoriaRouter from './routes/auditoria';
import manualRouter from './routes/manual';
import valoracionRouter from './routes/valoracion';
import authRouter from './routes/auth';
import { requireAuth } from './middleware/auth';

const app = express();
const port = process.env.PORT || 5000;

// En Vercel el frontend y la API comparten dominio, así que CORS solo importa
// en desarrollo, donde Vite corre en otro puerto.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Sin Origin = mismo origen, curl o healthchecks: se permite.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    // Se niega omitiendo los headers CORS (el navegador bloquea) en vez de
    // lanzar, que degeneraba en un 500 y ensuciaba los logs.
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());

// Público: login y health. Todo lo demás exige un JWT válido.
app.use('/api/auth', authRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Valoración de Puestos MSC is running' });
});

app.use('/api', requireAuth);

// Main Routes
app.use('/api/puestos', puestosRouter);
app.use('/api/evaluaciones', evaluacionesRouter);
app.use('/api/encuestas', encuestasRouter);
app.use('/api/calculos', calculosRouter);
app.use('/api/asignaciones', asignacionesRouter);
app.use('/api/auditoria', auditoriaRouter);
app.use('/api/manual', manualRouter);
app.use('/api/valoracion', valoracionRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
/* force rebuild */
