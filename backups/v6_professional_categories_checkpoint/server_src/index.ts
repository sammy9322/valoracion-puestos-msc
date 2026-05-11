import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import puestosRouter from './routes/puestos';
import evaluacionesRouter from './routes/evaluaciones';
import encuestasRouter from './routes/encuestas';
import calculosRouter from './routes/calculos';
import asignacionesRouter from './routes/asignaciones';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/puestos', puestosRouter);
app.use('/api/evaluaciones', evaluacionesRouter);
app.use('/api/encuestas', encuestasRouter);
app.use('/api/calculos', calculosRouter);
app.use('/api/asignaciones', asignacionesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Valoración de Puestos MSC is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
