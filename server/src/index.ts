import dotenv from 'dotenv';
dotenv.config();

import prisma from './db';
import express from 'express';
import cors from 'cors';
import puestosRouter from './routes/puestos';
import evaluacionesRouter from './routes/evaluaciones';
import encuestasRouter from './routes/encuestas';
import calculosRouter from './routes/calculos';
import asignacionesRouter from './routes/asignaciones';
import auditoriaRouter from './routes/auditoria';
import manualRouter from './routes/manual';

const startup = (async () => {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Evaluacion" ADD COLUMN IF NOT EXISTS "motor" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Evaluacion" ADD COLUMN IF NOT EXISTS "buildVersion" TEXT;`);
    console.log('[migrate] columns motor/buildVersion ensured on Evaluacion');
  } catch (e: any) {
    console.warn('[migrate] could not ensure columns:', e?.message);
  }
})();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Wait for startup migration before processing requests
app.use(async (_req, _res, next) => {
  await startup;
  next();
});

// Main Routes
app.use('/api/puestos', puestosRouter);
app.use('/api/evaluaciones', evaluacionesRouter);
app.use('/api/encuestas', encuestasRouter);
app.use('/api/calculos', calculosRouter);
app.use('/api/asignaciones', asignacionesRouter);
app.use('/api/auditoria', auditoriaRouter);
app.use('/api/manual', manualRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Valoración de Puestos MSC is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
