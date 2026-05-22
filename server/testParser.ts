import { parseEntrevistaMD } from './src/services/interviewParser';

async function test() {
  const text = "Entrevistado: Juan\nPuesto: Analista\n\nEl trabajo es muy complejo. Todos los días tengo que hacer análisis financieros y tomar decisiones críticas. Si me equivoco, la municipalidad pierde millones.";
  console.log("Iniciando prueba de parser...");
  const result = await parseEntrevistaMD(text, { filename: 'test.txt' });
  console.log("Resultado:", JSON.stringify(result, null, 2));
}

test().catch(console.error);
