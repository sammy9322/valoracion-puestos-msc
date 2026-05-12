import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDetails() {
    const cargoId = 1; // Conserje
    console.log('Testing Details for ID:', cargoId);

    const { data: cargo } = await supabase
        .from('v_catalogo_puestos')
        .select('*')
        .eq('cargo_id', cargoId)
        .single();

    if (!cargo) {
        console.error('Cargo not found in v_catalogo_puestos');
        return;
    }
    console.log('Cargo found:', cargo.cargo, '| Clase:', cargo.clase);

    const { data: cargoDetalle, error: cdErr } = await supabase
        .from('cargos_puesto')
        .select('*')
        .eq('nombre', cargo.cargo)
        .single();
    
    console.log('cargoDetalle found:', !!cargoDetalle, cdErr?.message || '');

    const { data: claseDetalle, error: clErr } = await supabase
        .from('clases_puesto')
        .select('*')
        .eq('nombre', cargo.clase)
        .single();

    console.log('claseDetalle found:', !!claseDetalle, clErr?.message || '');
    if (claseDetalle) {
        console.log('claseDetalle.detalle:', JSON.stringify(claseDetalle.detalle).substring(0, 100));
    }
}

testDetails();
