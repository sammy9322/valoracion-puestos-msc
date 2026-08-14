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
    //
    // El limite previo era de 6.000 caracteres (~7 minutos de conversacion). Se
    // habia puesto para que Ollama no se cayera con textos largos, pero la app
    // ya no usa Ollama: usa Gemini, con un limite de entrada de 1.048.576
    // tokens. Con 6.000 caracteres se descartaba el resto de la entrevista, que
    // es uno de los tres pilares de la metodologia de valoracion.
    //
    // 200.000 caracteres cubren una entrevista de dos horas (~50.000 tokens) y
    // siguen siendo el 5% de la capacidad del modelo. Se conserva un tope
    // porque el archivo llega de afuera y no debe poder tumbar el proceso.
    const maxLen = 200000;
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
