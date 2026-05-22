import fetch from 'node-fetch';

async function test() {
  console.log("Conectando a Ollama en http://localhost:11434...");
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    const data = await res.json();
    console.log("Modelos instalados:", data.models?.map((m: any) => m.name));
    
    console.log("Enviando prompt de prueba...");
    const genRes = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-coder-v2:latest',
        prompt: 'Hola, responde con un JSON: {"estado": "ok"}',
        stream: false,
        format: 'json'
      })
    });
    const genData = await genRes.json();
    console.log("Respuesta de Ollama:", genData.response);
  } catch (e) {
    console.error("Error contactando a Ollama:", e);
  }
}

test();
