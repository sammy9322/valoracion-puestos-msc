import { describe, it, expect } from 'vitest';
import { parseEntrevistaMD } from '../services/interviewParser';

/**
 * El truncado a 6.000 caracteres se agregó en el commit f9fca57 para evitar que
 * Ollama se cayera con textos largos. La app ya no usa Ollama: usa Gemini, cuyo
 * límite de entrada es de 1.048.576 tokens. Estos tests fijan el comportamiento
 * esperado: una entrevista real debe llegar completa al motor.
 */

const MARCADOR_FINAL = 'ESTA-FRASE-VA-AL-FINAL-DE-LA-ENTREVISTA';

function transcripcionDe(caracteres: number): string {
  const cuerpo = 'El ocupante describe sus funciones cotidianas. '.repeat(
    Math.ceil(caracteres / 47)
  ).slice(0, caracteres);
  return cuerpo + MARCADOR_FINAL;
}

describe('parseEntrevistaMD', () => {
  it('conserva íntegra una entrevista de 50.000 caracteres', async () => {
    const ctx = await parseEntrevistaMD(Buffer.from(transcripcionDe(50_000), 'utf8'), {
      filename: 'entrevista.txt'
    });
    const texto = ctx.factores[0].resumen_entrevista;

    // Si el final llegó, el motor vio la entrevista completa.
    expect(texto).toContain(MARCADOR_FINAL);
    expect(ctx.alertas).toHaveLength(0);
  });

  it('conserva una entrevista de dos horas (~120.000 caracteres)', async () => {
    const ctx = await parseEntrevistaMD(Buffer.from(transcripcionDe(120_000), 'utf8'), {
      filename: 'entrevista-larga.txt'
    });
    expect(ctx.factores[0].resumen_entrevista).toContain(MARCADOR_FINAL);
  });

  it('trunca y avisa cuando la transcripción excede el límite', async () => {
    const ctx = await parseEntrevistaMD(Buffer.from(transcripcionDe(250_000), 'utf8'), {
      filename: 'entrevista-enorme.txt'
    });
    const texto = ctx.factores[0].resumen_entrevista;

    expect(texto).not.toContain(MARCADOR_FINAL);
    expect(texto).toContain('truncado');
    expect(ctx.alertas.length).toBeGreaterThan(0);
  });

  it('extrae el nombre del entrevistado del archivo', async () => {
    const ctx = await parseEntrevistaMD(Buffer.from('Entrevista breve.', 'utf8'), {
      filename: 'Juan Perez.txt'
    });
    expect(ctx.entrevistado).toBe('Juan Perez');
  });
});
