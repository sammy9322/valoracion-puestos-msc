import { z } from 'zod';

export const ValuationReportSchema = z.object({
  puesto_id: z.string(),
  totalPuntos: z.number(),
  analisis_multifuente: z.any().optional(),
  alerta_global: z.string().optional(),
  evaluacion: z.object({
    dificultad: z.number().min(1).max(5),
    dificultad_just: z.string().min(10),
    supervision: z.number().min(1).max(5),
    supervision_just: z.string().min(10),
    responsabilidad: z.number().min(1).max(5),
    responsabilidad_just: z.string().min(10),
    condiciones: z.number().min(1).max(5),
    condiciones_just: z.string().min(10),
    error: z.number().min(1).max(5),
    error_just: z.string().min(10),
    requisitos: z.number().min(1).max(5),
    requisitos_just: z.string().min(10),
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
