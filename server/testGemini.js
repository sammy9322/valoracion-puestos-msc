require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro', generationConfig: { responseMimeType: 'application/json' } });
    const result = await model.generateContent('Respond with {"status": "ok"}');
    console.log("Success:", result.response.text());
  } catch (e) {
    console.error("Gemini Error:", e.message);
  }
}
test();
