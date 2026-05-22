import { InterviewContext } from './aiAgentService';

export async function parseEntrevistaMD(input: Buffer | string, options?: { filename?: string }): Promise<InterviewContext> {
  try {
    const rawText = typeof input === 'string' ? input : input.toString('utf8');
    
    // Bypass the fragile intermediate LLM processing. 
    // Pass the entire raw transcript to the main LLM so no context is lost.
    return {
      entrevistado: options?.filename ? options.filename.replace('.txt', '') : 'Desconocido',
      puesto: 'Ocupante',
      fecha_entrevista: new Date().toISOString().split('T')[0],
      factores: [
        {
          factor: "Transcripcion Bruta",
          citas: [],
          resumen_entrevista: "Transcipcion completa (evaluar para todos los factores):\n\n" + rawText,
          evidencia_tipo: "testimonial"
        }
      ],
      alertas: []
    };
  } catch (error) {
    console.error('[InterviewParser] Error reading file buffer:', error);
    return {
      entrevistado: '',
      puesto: '',
      fecha_entrevista: '',
      factores: [],
      alertas: ['Error al leer el archivo.']
    };
  }
}
