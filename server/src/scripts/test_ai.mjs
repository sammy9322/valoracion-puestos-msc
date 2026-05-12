// Usar fetch nativo de Node.js (v18+)
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: 'server/.env' });

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3';

async function testAi() {
    console.log('Testing AI Agent with:', { OLLAMA_URL, DEFAULT_MODEL });
    const puesto = {
        nombre: 'Recepcionista',
        area: 'Administración',
        descripcion_funciones: 'Atender público, telefonía, recepción de documentos',
        educacion_requerida: 'Secundaria completa',
        experiencia_requerida: '1-2 años'
    };

    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`);
        if (!response.ok) {
            console.error('Ollama is not responding at', OLLAMA_URL);
            return;
        }
        const tags = await response.json();
        console.log('Available models:', tags.models?.map(m => m.name));

        const body = JSON.stringify({
            model: DEFAULT_MODEL,
            prompt: 'Test prompt',
            stream: false
        });

        const res = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        });

        if (!res.ok) {
            console.error('Error generating response:', res.status, await res.text());
        } else {
            const data = await res.json();
            console.log('AI Response:', data.response);
        }
    } catch (error) {
        console.error('Error connecting to Ollama:', error.message);
    }
}

testAi();
