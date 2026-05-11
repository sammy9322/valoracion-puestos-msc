# Plan: Auto-completado de Fichas de Puesto desde el Catálogo Supabase
**Fecha:** 2026-05-03

## Contexto

Al crear una nueva "Ficha de Puesto", el usuario selecciona un cargo del manual institucional (Supabase). El sistema debe auto-completar: **funciones**, **área/departamento**, **educación** y **experiencia**. Actualmente hay 3 problemas:

1. **`getCargoDetails` no extraía los datos correctos** — ya corregido en `supabase.ts` consultando `cargos_puesto` (funciones) y `clases_puesto.detalle` (educación/experiencia).
2. **El botón "Crear Puesto" no funciona** — está fuera del `<form>`, y `handleCreate` espera un `FormEvent` con `preventDefault()` que no recibe al ser llamado desde `onClick`.
3. **La pestaña "Manual MSC" (importación PDF)** — el parser extrae texto pero no segmenta correctamente los cargos del PDF del manual MSC; además, el dato se pierde si el servidor reinicia antes de confirmar.

---

## Estructura de Datos en Supabase (Fuente de Verdad)

| Tabla | Campos clave |
|---|---|
| `v_catalogo_puestos` | `cargo_id`, `cargo`, `clase_id`, `clase`, `estrato` |
| `cargos_puesto` | `id`, `clase_id`, `nombre`, `funciones` (array JSON) |
| `clases_puesto` | `id`, `nombre`, `naturaleza`, `detalle` → `{requisitos_minimos: {academicos, experiencia_laboral, experiencia_supervision, legales}, conocimientos_deseables[], condiciones_personales[]}` |

### Mapeo al formulario de "Nuevo Puesto"

| Campo del formulario | Fuente |
|---|---|
| Nombre del Puesto | `v_catalogo_puestos.cargo` |
| Descripción de Funciones | `cargos_puesto.funciones` → formateado con viñetas |
| Educación Requerida | `clases_puesto.detalle.requisitos_minimos.academicos` |
| Experiencia Requerida | `clases_puesto.detalle.requisitos_minimos.experiencia_laboral` |
| Área / Departamento | Algoritmo de scoring por keywords (ya existente) |
| Estrato | `v_catalogo_puestos.clase` |

---

## Cambios Propuestos

### Componente 1: Frontend — Ficha de Puesto

#### [MODIFICAR] `frontend/src/services/supabase.ts`

> **YA APLICADO.** La función `getCargoDetails` ahora consulta `cargos_puesto` para funciones y `clases_puesto` para requisitos.

- Consulta `cargos_puesto` por nombre del cargo → obtiene `funciones[]`
- Consulta `clases_puesto` por nombre de la clase → obtiene `detalle.requisitos_minimos`
- Retorna `funciones_detalladas`, `requisitos_educacion`, `requisitos_experiencia`

---

#### [MODIFICAR] `frontend/src/pages/FichasPuestos.tsx`

**Cambio 1: Arreglar el botón "Crear Puesto" (BUG CRÍTICO)**

El botón en línea 542 está **fuera** del `<form>` (que cierra en línea 539). Llama a `handleCreate` directamente desde `onClick`, pero esa función espera un `React.FormEvent` y ejecuta `e.preventDefault()`. Como el evento del click normal no es un FormEvent, puede fallar silenciosamente.

**Solución:** Cambiar `handleCreate` para aceptar un evento genérico opcional:
```typescript
const handleCreate = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    // ... rest of logic
};
```

**Cambio 2: Mejorar visualización de funciones en el textarea**

El `textarea` de "Descripción de Funciones" tiene `rows={3}` — insuficiente para mostrar las funciones detalladas que vienen del manual. Aumentar a `rows={6}` para que el usuario vea el contenido completo.

---

### Componente 2: Backend — Parser e Importación PDF (Mejora futura)

> Estos cambios son para que el flujo de importación de PDF funcione correctamente cuando se use. La funcionalidad principal de auto-completado ya funciona vía Supabase.

#### [MODIFICAR] `server/src/routes/manual.ts`

- **Problema:** `let ultimoParseo` es una variable en memoria. Si el servidor reinicia entre el `/upload` y el `/confirmar`, los datos se pierden.
- **Solución:** Guardar el resultado del parseo directamente al subir (eliminar paso intermedio), o persistir `ultimoParseo` en un archivo temporal.

#### [MODIFICAR] `server/src/services/manualParser.ts`

- **Problema:** El regex `Nombre de la clase:` puede no coincidir exactamente con el formato del PDF del manual MSC.
- **Solución:** Agregar logging del texto crudo extraído para diagnosticar el formato real y ajustar los patrones. Agregar estrategias de búsqueda alternativas como fallback.

---

## Plan de Ejecución

| # | Tarea | Archivo | Impacto |
|---|---|---|---|
| 1 | Arreglar `handleCreate` para aceptar evento opcional | FichasPuestos.tsx | **Crítico** — Desbloquea el botón "Crear Puesto" |
| 2 | Aumentar rows del textarea de funciones | FichasPuestos.tsx | UX — Mostrar funciones completas |
| 3 | Verificar que `getCargoDetails` retorna datos | supabase.ts | Validación — Ya aplicado |
| 4 | Probar flujo completo en el navegador | — | E2E — Seleccionar cargo → ver campos → crear puesto |

---

## Verificación

1. **Abrir la app** en `http://localhost:5173/fichas`
2. **Clic en "Nuevo Puesto"** → el modal debe abrirse
3. **Seleccionar un cargo del dropdown** (ej: "Conserje") → los campos deben llenarse:
   - Nombre: "Conserje"
   - Funciones: Lista con viñetas de las 3 funciones del conserje
   - Educación: "I Ciclo Aprobado de la Educación General Básica (tercer grado aprobado)"
   - Experiencia: "No requiere"
   - Área: Detectada por el algoritmo de scoring
4. **Clic en "Crear Puesto"** → debe guardarse sin errores y aparecer en la lista

> **IMPORTANTE:** El cambio más urgente es el bug del botón "Crear Puesto" (Tarea #1). Sin eso, ninguna ficha puede crearse aunque los datos se auto-completen correctamente.
