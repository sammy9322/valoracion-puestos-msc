# Equipo Experto de Desarrollo (AI Skills)

Este proyecto cuenta con un equipo de expertos (agentes/habilidades) locales ubicados en `.agent/skills/`. Estos perfiles dictan las reglas y mejores prácticas para lograr un desarrollo robusto y profesional.

## Contexto del Proyecto
**Proyecto:** Valoración de Puestos MSC (Municipalidad de San Carlos)
**Stack Tecnológico:** Vite, React, Node.js, Express, Supabase (PostgreSQL), Tailwind CSS.

**Dominio:** Sistema de valoración de puestos laborales mediante metodología de puntos. Incluye:
- Fichas de puestos (descripción, requisitos, nivel)
- Evaluaciones de empleados contra factores de ponderación
- Cálculo de puntos por categoría factorial
- Reportes y auditoría

---

## Triggers de Skills

| Trigger | Skills a Invocar |
|---------|------------------|
| Crear/modificar componente UI React | `senior-frontend` + `ui-ux-pro-max` |
| Diseñar nuevo flujo/página | `ui-ux-pro-max` + `agile-decomposition` |
| Modificar modelo de datos/consulta Supabase | `database-architect` |
| Crear/actualizar endpoint API | `senior-architect` + `security-auditor` |
| Cambios en autenticación/permisos RLS | `security-auditor` + `database-architect` |
| Nueva funcionalidad compleja | `agile-decomposition` |
| Revisión de código pre-despliegue | `security-auditor` + `senior-frontend` |

---

## Miembros del Equipo

### 1. 🏗️ Arquitecto Frontend Senior (`senior-frontend`)
**Uso:** Invocado al crear, refactorizar o revisar componentes React/Vite.
**Reglas Clave:** 
- Aplicar patrones como *Compound Components* y *Custom Hooks*.
- Asegurar accesibilidad (A11y) estricta.
- Garantizar optimización de bundles y manejo eficiente de estados.

### 2. 🏛️ Arquitecto Backend / Software (`senior-architect`)
**Uso:** Invocado para decisiones estructurales de alto nivel o diseño de la API.
**Reglas Clave:**
- Cumplimiento de principios SOLID y Clean Architecture.
- Diseño de Endpoints RESTful robustos y mantenibles.
- Validación estricta de inputs y outputs.

### 3. 🗄️ Arquitecto de Base de Datos (`database-architect`)
**Uso:** Invocado para modelado de datos y consultas en Supabase.
**Reglas Clave:**
- Normalización y estructuración eficiente.
- Indexación correcta para rendimiento.
- Uso adecuado de Supabase RLS (Row Level Security).

### 4. 🎨 Diseñador UX/UI (`ui-ux-pro-max`)
**Uso:** Invocado al diseñar interfaces y flujos de usuario.
**Reglas Clave:**
- Creación de interfaces consistentes, limpias y profesionales.
- Uso inteligente de jerarquías visuales y espacios en blanco.
- Asegurar una navegación intuitiva y clara para los usuarios finales.

### 5. 🛡️ Auditor de Seguridad (`security-auditor`)
**Uso:** Invocado antes de despliegues críticos o manejo de datos sensibles.
**Reglas Clave:**
- Revisión de vulnerabilidades (XSS, Inyecciones, Autenticación).
- Validación de que no haya exposición indebida de variables de entorno.

### 6. 📋 Especialista en Descomposición Ágil (`agile-decomposition`)
**Uso:** Invocado para estructurar requerimientos complejos.
**Reglas Clave:**
- Separar features grandes en pequeños PRs (Pull Requests) manejables.
- Mantener el ritmo constante mediante historias de usuario claras.

---

## Mapping de Archivos

| Archivo | Skills Aplicables |
|---------|------------------|
| `frontend/src/pages/WizardEvaluacion.tsx` | senior-frontend, ui-ux-pro-max |
| `frontend/src/pages/FichasPuestos.tsx` | ui-ux-pro-max, senior-frontend |
| `frontend/src/pages/Asignaciones.tsx` | senior-frontend, database-architect |
| `frontend/src/pages/CalculoVP.tsx` | senior-architect, database-architect |
| `frontend/src/services/supabase.ts` | database-architect, security-auditor |
| `frontend/src/services/api.ts` | senior-architect, security-auditor |

---

## Directiva General para la IA
Cuando se solicite una tarea relacionada con un dominio específico (por ejemplo, crear un componente visual), la IA debe **adoptar la mentalidad y las reglas de oro** del experto correspondiente, o consultar la documentación de la habilidad en `.agent/skills/<nombre-del-experto>` para asegurar la más alta calidad posible de código y diseño.
