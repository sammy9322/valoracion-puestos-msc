import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API KEY found locally!");
    process.exit(1);
}
console.log("API KEY starts with:", apiKey.substring(0, 5));

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0 }
});

const prompt = `=== FORMATO JSON REQUERIDO ===
{
  "dificultad": 3,
  "dificultad_just": "<justificacion tecnica>",
  "dificultad_cita_documental": "<cita textual de las funciones>",
  "dificultad_fuente": "documental|entrevista|mixta",
  "dificultad_cita_entrevista": "<cita textual de la entrevista si aplica o ''>",
  "dificultad_intensidad": "alto|medio|bajo",
  "dificultad_contradiccion": false,
  "supervision": 3,
  "supervision_just": "<justificacion tecnica>",
  "supervision_cita_documental": "<cita textual>",
  "supervision_fuente": "documental|entrevista|mixta",
  "supervision_cita_entrevista": "<cita o ''>",
  "supervision_intensidad": "alto|medio|bajo",
  "supervision_contradiccion": false,
  "responsabilidad": 3,
  "responsabilidad_just": "<justificacion tecnica>",
  "responsabilidad_cita_documental": "<cita textual>",
  "responsabilidad_fuente": "documental|entrevista|mixta",
  "responsabilidad_cita_entrevista": "<cita o ''>",
  "responsabilidad_intensidad": "alto|medio|bajo",
  "responsabilidad_contradiccion": false,
  "condiciones": 3,
  "condiciones_just": "<justificacion tecnica>",
  "condiciones_cita_documental": "<cita textual>",
  "condiciones_fuente": "documental|entrevista|mixta",
  "condiciones_cita_entrevista": "<cita o ''>",
  "condiciones_intensidad": "alto|medio|bajo",
  "condiciones_contradiccion": false,
  "error": 3,
  "error_just": "<justificacion tecnica>",
  "error_cita_documental": "<cita textual>",
  "error_fuente": "documental|entrevista|mixta",
  "error_cita_entrevista": "<cita o ''>",
  "error_intensidad": "alto|medio|bajo",
  "error_contradiccion": false,
  "requisitos": 3,
  "requisitos_just": "<justificacion tecnica>",
  "requisitos_cita_documental": "<cita textual>",
  "requisitos_fuente": "documental|entrevista|mixta",
  "requisitos_cita_entrevista": "<cita o ''>",
  "requisitos_intensidad": "alto|medio|bajo",
  "requisitos_contradiccion": false,
  "alertas_contradiccion": ["<alerta si hay contradiccion entre fuentes>"]
}`;

async function run() {
    try {
        console.log("Calling Gemini...");
        const result = await model.generateContent("Genera un json valido de prueba con el siguiente formato:\n" + prompt);
        console.log("Success! Response:");
        console.log(result.response.text());
    } catch (e: any) {
        console.error("Gemini failed:", e.message);
    }
}
run();
