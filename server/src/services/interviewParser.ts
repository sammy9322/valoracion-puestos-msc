export interface InterviewContext {
  entrevistado: string;
  puesto: string;
  fecha_entrevista: string;
  factores: Array<any>;
  alertas: string[];
}

export async function parseEntrevistaMD(input: Buffer | string, options?: { filename?: string }): Promise<InterviewContext> {
  try {
    const rawText = typeof input === 'string' ? input : input.toString('utf8');
    
    // Bypass the fragile intermediate LLM processing.
    // Truncate to 6000 characters to prevent context overflow in the main LLM.
    const maxLen = 6000;
    const truncatedText = rawText.length > maxLen ? rawText.substring(0, maxLen) + '\n...[Texto truncado para análisis]...' : rawText;

    return {
      entrevistado: options?.filename ? options.filename.replace('.txt', '') : 'Desconocido',
      puesto: 'Ocupante',
      fecha_entrevista: new Date().toISOString().split('T')[0],
      factores: [
        {
          factor: "Transcripcion",
          citas: [],
          resumen_entrevista: "Extracto de la entrevista:\n\n" + truncatedText,
          evidencia_tipo: "testimonial"
        }
      ],
      alertas: rawText.length > maxLen ? ['La transcripción era muy larga y fue truncada para el análisis.'] : []
    };
  } catch (error) {
    return {
      entrevistado: '',
      puesto: '',
      fecha_entrevista: '',
      factores: [],
      alertas: ['Error al leer el archivo.']
    };
  }
}
