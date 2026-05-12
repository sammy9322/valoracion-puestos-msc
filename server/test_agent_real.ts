import dotenv from 'dotenv';
dotenv.config();
import { aiAgentService } from './src/services/aiAgentService';

const puestoMock = {
    nombre: "Analista Programador",
    area: "Tecnología",
    descripcion_funciones: "Desarrollar y mantener sistemas informáticos.",
    educacion_requerida: "Bachiller en Computación",
    experiencia_requerida: "3 años en desarrollo web"
};

async function testAgent() {
    console.log('Testing aiAgentService with model:', process.env.OLLAMA_MODEL || 'deepseek-coder-v2:latest');
    const result = await aiAgentService.suggestEvaluation(puestoMock);
    console.log('Result:', result);
}

testAgent();
