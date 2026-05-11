# CHECKPOINT — 20 de Abril 2026, 22:42 CST
## Proyecto: Valoración de Puestos MSC — Municipalidad de San Carlos

---

## ESTADO ACTUAL DEL SISTEMA

### Infraestructura
- **Ruta:** `C:\Users\gaboa\OneDrive\Desarrollo de Apps\Apps Muni\Metodología Valoración de Puestos por Puntos\valoracion-puestos-msc`
- **PM2:** Configurado pero con issues de compatibilidad en Windows (interpreter: 'none' no funciona). Se usa `Start-Process -WindowStyle Hidden` como alternativa para correr en segundo plano.
- **Base de Datos:** SQLite local (Prisma) + Supabase remoto.
- **Para levantar la app:** Ejecutar en PowerShell:
  ```powershell
  $serverPath = "C:\Users\gaboa\OneDrive\Desarrollo de Apps\Apps Muni\Metodología Valoración de Puestos por Puntos\valoracion-puestos-msc\server"
  $frontPath = "C:\Users\gaboa\OneDrive\Desarrollo de Apps\Apps Muni\Metodología Valoración de Puestos por Puntos\valoracion-puestos-msc\frontend"
  Start-Process powershell -WindowStyle Hidden -ArgumentList "-Command", "cd '$serverPath'; npm run dev"
  Start-Process powershell -WindowStyle Hidden -ArgumentList "-Command", "cd '$frontPath'; npm run dev"
  ```
- **URLs:** Frontend: http://localhost:5173 | Backend: http://localhost:3001

### Archivos Clave Modificados Hoy
| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `frontend/src/pages/EncuestaSalario.tsx` | ✅ Actualizado | Badges de fiabilidad + panel de auditoría |
| `frontend/src/pages/WizardEvaluacion.tsx` | ⚠️ PENDIENTE DE REESCRITURA | Tiene 6 factores con puntos fijos, pero debe migrar a sistema de Checklist |
| `server/src/routes/evaluaciones.ts` | ⚠️ PENDIENTE DE REESCRITURA | Tiene pointsMap de 6 factores, debe migrar a validación por checklist |
| `server/src/routes/encuestas.ts` | ✅ Actualizado | 23 niveles oficiales + campos de transparencia |
| `ecosystem.config.js` | ⚠️ No funcional | PM2 no ejecuta npm.cmd correctamente en Windows |

### Archivos de Referencia (NO MODIFICAR)
| Archivo | Importancia |
|---------|------------|
| `REQUERIMIENTOS_APP_VALORACION_PUESTOS_MSC (2).md` | **BIBLIA DEL PROYECTO** — Contiene la metodología completa, las tablas de grados/rangos, los 9 flujos de pantalla, y los casos de prueba. Líneas clave: 548-556 (RANGOS_POR_GRADO), 162-228 (Descripciones de factores). |
| `CHECKPOINT_2026-04-20.md` | Checkpoint anterior con arquitectura, familias de puestos y esquemas de BD. |
| `server/prisma/schema.prisma` | Esquema completo de 11 tablas (211 líneas). |

---

## DECISIÓN PENDIENTE DE APROBACIÓN

### Plan: Evaluación Automatizada por Checklist
**Archivo:** `implementation_plan_msc_v3.md` (en carpeta brain de la conversación)

**Concepto:** Reemplazar la selección manual de grados por un sistema de **30 preguntas cerradas** (5 por factor) que calculan automáticamente el grado y los puntos.

**Por qué se tomó esta decisión:**
1. El sistema anterior usaba una escala genérica de 5 grados con puntos fijos — no coincidía con la metodología oficial de San Carlos.
2. La metodología oficial tiene rangos (ej. 30-50 pts para Grado 2°), lo cual permite subjetividad del evaluador.
3. El usuario pidió eliminar toda subjetividad → se propuso Bajo/Medio/Alto → luego se pidió aún menos subjetividad → llegamos al sistema de Checklist.

**Estado:** Esperando aprobación del usuario para implementar.

---

## PRÓXIMOS PASOS (para mañana)

1. **Revisar y aprobar** el plan de Checklist (`implementation_plan_msc_v3.md`).
2. **Implementar** el componente `ChecklistFactor.tsx` (reutilizable para los 6 factores).
3. **Reescribir** `WizardEvaluacion.tsx` con el nuevo flujo de preguntas.
4. **Actualizar** `evaluaciones.ts` para validación server-side de respuestas.
5. **Modificar** `schema.prisma` para añadir campo `respuestas_checklist` a la tabla Evaluacion.
6. **Probar** con el caso Recepcionista del manual (QA-04: total esperado = 205 pts).

---

## CONTEXTO TÉCNICO IMPORTANTE

### Metodología de 6 Factores (del archivo de Requerimientos, líneas 162-228):
| Factor | Grados | Máx. Pts | Peso |
|--------|--------|----------|------|
| Dificultad | 6 | 150 | ~15% |
| Supervisión | 6 | 150 | ~15% |
| Responsabilidad | 6 | 200 | ~20% |
| Condiciones | 5 | 150 | ~15% |
| Consecuencia Error | 6 | 150 | ~15% |
| Requisitos | 6 | 150 | ~15% |
| **TOTAL** | | **~950** | **~95%** |

### Rangos Oficiales (RF-BE-03, líneas 548-556):
```javascript
RANGOS_POR_GRADO = {
  dificultad:         {1:[0,25],   2:[30,50],  3:[55,75],  4:[80,100], 5:[105,130], 6:[135,150]},
  supervision:        {1:[5,25],   2:[30,50],  3:[55,75],  4:[80,100], 5:[105,125], 6:[130,150]},
  responsabilidad:    {1:[0,25],   2:[30,50],  3:[55,75],  4:[80,100], 5:[105,150], 6:[160,200]},
  condiciones:        {1:[5,30],   2:[35,60],  3:[65,90],  4:[95,120], 5:[125,150]},
  consecuencia_error: {1:[0,25],   2:[30,50],  3:[55,75],  4:[80,100], 5:[105,125], 6:[130,150]},
  requisitos:         {1:[5,20],   2:[25,45],  3:[50,75],  4:[80,100], 5:[105,125], 6:[130,150]}
}
```

### Credenciales y Servicios
- **Supabase:** Credenciales en `server/.env` (NO exponer).
- **Puerto Backend:** 3001
- **Puerto Frontend:** 5173
- **OneDrive:** Usar `usePolling: true` en Vite y `--delay 2.5` en Nodemon.

---

*Checkpoint generado: 20 de Abril 2026, 22:42 CST*
*Conversación ID: bfab2421-aaf5-4d22-aa92-21d54f3a0173*
