import fs from 'fs';
import path from 'path';
import { parseManual } from '../services/manualParser.js'; // Note: might need to be .ts if running with ts-node
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

async function testParser() {
    const filePath = path.join(process.cwd(), 'manual_diag.pdf');
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    const buffer = fs.readFileSync(filePath);
    console.log('Testing Parser with:', filePath, `(${buffer.length} bytes)`);

    try {
        const result = await parseManual(buffer, 'manual_diag.pdf');
        console.log('Parse Results:');
        console.log('Total Clases:', result.resumen.total_clases);
        console.log('Total Cargos:', result.resumen.total_cargos);
        console.log('Vinculados con Supabase:', result.resumen.vinculados);
        
        if (result.clases.length > 0) {
            const firstClase = result.clases[0];
            console.log('\nSample Clase:', firstClase.nombre_clase);
            if (firstClase.cargos.length > 0) {
                const firstCargo = firstClase.cargos[0];
                console.log('Sample Cargo:', firstCargo.nombre);
                console.log('Functions:', firstCargo.funciones.length);
                console.log('First Function:', firstCargo.funciones[0]);
            }
        }
    } catch (error) {
        console.error('Error during parsing:', error);
    }
}

testParser();
