import { z } from 'zod';

export const ValuationReportSchema = z.object({
  puesto_id: z.string(),
  totalPuntos: z.number(),
  analisis_multifuente: z.any().optional(),
  alerta_global: z.string().optional(),
  evaluacion: z.object({
    dificultad: z.number().min(1).max(6),
    dificultad_just: z.string().min(10),
    dificultad_intensidad: z.enum(['bajo', 'medio', 'alto']),
    supervision: z.number().min(1).max(6),
    supervision_just: z.string().min(10),
    supervision_intensidad: z.enum(['bajo', 'medio', 'alto']),
    responsabilidad: z.number().min(1).max(6),
    responsabilidad_just: z.string().min(10),
    responsabilidad_intensidad: z.enum(['bajo', 'medio', 'alto']),
    condiciones: z.number().min(1).max(5),
    condiciones_just: z.string().min(10),
    condiciones_intensidad: z.enum(['bajo', 'medio', 'alto']),
    error: z.number().min(1).max(6),
    error_just: z.string().min(10),
    error_intensidad: z.enum(['bajo', 'medio', 'alto']),
    requisitos: z.number().min(1).max(6),
    requisitos_just: z.string().min(10),
    requisitos_intensidad: z.enum(['bajo', 'medio', 'alto']),
  }),
  auditoria: z.object({
    motor: z.string(),
    buildVersion: z.string(),
    timestamp: z.string(),
    confidence: z.number().min(0).max(1),
    evidenceFound: z.array(z.string()),
    confidenceBreakdown: z.object({
      base: z.number(),
      penalties: z.array(z.object({
        reason: z.string(),
        factor: z.string().optional(),
        deduction: z.number()
      })),
      final: z.number(),
      reasoning: z.string().optional()
    }).optional()
  })
});

export type ValuationReport = z.infer<typeof ValuationReportSchema>;
