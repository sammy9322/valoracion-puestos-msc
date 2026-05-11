const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const PDF_PATH = `c:\\Users\\gaboa\\OneDrive\\Desarrollo de Apps\\Apps Muni\\Metodología Valoración de Puestos por Puntos\\valoracion-puestos-msc\\server\\manual_diag.pdf`;

async function debugParser() {
  try {
    if (!fs.existsSync(PDF_PATH)) {
      console.error('No se encontró:', PDF_PATH);
      return;
    }
    
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdf(dataBuffer);
    const text = data.text;
    
    const target = "Control Interno";
    const index = text.indexOf(target);
    
    if (index !== -1) {
      const snippet = text.substring(index - 50, index + 4000);
      console.log('--- RAW TEXT SNIPPET ---');
      console.log(snippet);
      console.log('--- END SNIPPET ---');
    } else {
      console.log('No se encontró "' + target + '"');
    }
  } catch (err) {
    console.error(err);
  }
}

debugParser();
