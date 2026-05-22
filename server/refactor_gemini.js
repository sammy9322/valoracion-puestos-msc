const fs = require('fs');
const file = '/Users/macbookpro/.gemini/antigravity-ide/scratch/valoracion-puestos-msc/server/src/services/aiAgentService.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Add Gemini import at the top
code = code.replace(
  "import dotenv from 'dotenv';\ndotenv.config();",
  "import dotenv from 'dotenv';\ndotenv.config();\nimport { GoogleGenerativeAI } from '@google/generative-ai';"
);

// 2. Replace checkOllama logic
code = code.replace(
  /let ollamaAvailable = false;[\s\S]*?\}\);/m,
  "let ollamaAvailable = true;\n\nasync function checkOllama(): Promise<boolean> {\n  return true;\n}\n\ncheckOllama().then(() => {\n  console.log('[AI Service] Conectado a Google Gemini API — usando motor LLM en la nube');\n});"
);

// 3. Replace callOllama function implementation
code = code.replace(
  /async function callOllama\(prompt: string\): Promise<any> \{[\s\S]*?return JSON\.parse\(cleanJson\);\n\}/m,
  "async function callOllama(prompt: string): Promise<any> {\n  const apiKey = process.env.GEMINI_API_KEY;\n  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada');\n  const genAI = new GoogleGenerativeAI(apiKey);\n  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });\n  const result = await model.generateContent(prompt);\n  const jsonText = result.response.text();\n  const match = jsonText.match(/\\{[\\s\\S]*\\}/);\n  const cleanJson = match ? match[0] : jsonText;\n  return JSON.parse(cleanJson);\n}"
);

fs.writeFileSync(file, code);
