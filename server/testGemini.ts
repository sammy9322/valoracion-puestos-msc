import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

function testSchema() {
  const genAI = new GoogleGenerativeAI("fake-api-key-1234567890");
  const schema = {
    type: SchemaType.OBJECT as const,
    properties: {
      alertas_contradiccion: { type: SchemaType.ARRAY as const, items: { type: SchemaType.STRING as const } }
    },
    required: ["alertas_contradiccion"]
  };
  
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { 
        responseMimeType: 'application/json', 
        responseSchema: schema, 
        temperature: 0 
      }
    });
    console.log("SCHEMA IS VALID SYNCHRONOUSLY");
  } catch (e) {
    console.error("SCHEMA VALIDATION FAILED SYNCHRONOUSLY:", e);
  }
}

testSchema();
