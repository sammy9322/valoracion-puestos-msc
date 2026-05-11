---
name: agile-decomposition
description: >
  Skill para descomponer requerimientos complejos en elementos Agile.
  Úsalo cuando necesites dividir épicas, features o user stories, aplicar principios INVEST,
  hacer slicing de historias, crear jerarquías de work items, o planificar sprints.
  Triggers: descomponer, dividir, slice, INVEST, story points, sprint planning.
license: MIT
metadata:
  version: "2.0"
  type: method
  author: mapplics
allowed-tools: Read, Edit, Write, Glob, Grep
---

# Agile Decomposition

Skill especializado en la descomposición de requerimientos complejos en elementos de trabajo Agile. No está atado a ningún proyecto específico (como SCM); proporciona las bases metodológicas para cualquier equipo.

## When to Use This Skill

Use this skill when you need to:
- Descomponer épicas en features y user stories
- Aplicar principios INVEST a historias de usuario
- Dividir historias grandes en incrementos más pequeños
- Crear jerarquías de work items (Epic → Feature → US → Task)
- Estimar story points (Fibonacci)
- Planificar sprints

## Prerequisites

- Acceso a Azure DevOps o sistema similar (Jira, etc.)
- (Opcional) Un skill de contexto del proyecto (ej. `myproject-architecture`) para conocer la estructura local.

---

## Quick Reference

### Principios INVEST

| Principio | Verificación Clave |
|-----------|-------------------|
| **I**ndependent | ¿Puede completarse sin esperar otras historias? |
| **N**egotiable | ¿El equipo entiende el "qué" y el "por qué"? (No prescribe el "cómo") |
| **V**aluable | ¿Quién se beneficia de esta historia? |
| **E**stimable | ¿Es demasiado grande o incierta para estimar con confianza? |
| **S**mall | ¿Tiene más de 8-13 story points? → Dividir |
| **T**estable | ¿Los criterios de aceptación son claros y verificables? |

### Jerarquía de Work Items

| Nivel | Elemento | Duración | Stakeholder Típico |
|-------|----------|----------|----------------|
| 1 | Epic | Semanas-Meses | Product Owner, Gerencia |
| 2 | Feature | 1-4 sprints | PO, Usuarios clave |
| 3 | User Story | 1-3 días | Usuario final |
| 4 | Task / Bug | 1-8 horas | Equipo de desarrollo |

### Técnicas de Slicing (División)

Para revisar ejemplos concretos, lee los archivos en `references/`.
- **Por Flujo de Trabajo (Workflow Steps)**: Dividir por pasos del proceso (ej. Login -> Seleccionar -> Pagar).
- **Por Operación CRUD**: Create, Read, Update, Delete.
- **Por Rol de Usuario**: Según quién usa la funcionalidad.
- **Por Plataforma**: Web, móvil, API.
- **Por Variante de Datos / Complejidad**: Simple (Happy path) → Excepciones/Casos complejos.
- **Spike (Investigación)**: Para reducir incertidumbre antes de implementar.

```markdown
# Ejemplo de Slicing (Previamente Epica "Implementar Login")
- US-01: Login con Email y Password (Happy Path)
- US-02: Recupero de Contraseña
- US-03: Bloqueo de cuenta tras 3 intentos
```

---

## Escala Fibonacci Modificada (Estimación)

Los puntos reflejan *Complejidad + Incertidumbre + Esfuerzo*.

| Puntos | Descripción | Ejemplo de Tiempo Categórico |
|--------|-------------|--------------------------|
| 1 | Trivial | Horas. Cambio de texto, ajuste menor de UI. |
| 2 | Simple | Medio día. CRUD simple, endpoint básico. |
| 3 | Pequeño | 1 día. Feature acotada, testeo estándar. |
| 5 | Mediano | 2-3 días. Integración conocida, flujos normales. |
| 8 | Grande | Semana. Varios componentes, lógica de negocio intermedia. |
| 13 | Muy Grande | Sprint completo. Alta incertidumbre, integración compleja. |
| 21+ | **Dividir** | Demasiado grande. Requiere Slicing obligatorio. |

---

## Checklist de Validación

### Pre-Creación de User Story

- [ ] ¿Cumple con INVEST?
- [ ] ¿El formato es correcto (Como... Quiero... Para...)?
- [ ] ¿Los criterios de aceptación son verificables y en formato Gherkin (Dado/Cuando/Entonces)?
- [ ] ¿Se puede estimar con confianza?
- [ ] ¿Es menor a 13 story points? (Idealmente <= 8).

---

## Antipatrones a Evitar

| Antipatrón | Ejemplo Malo | Ejemplo Bueno |
|------------|--------------|---------------|
| Historia Técnica | "Crear tabla de usuarios" | "Como usuario, quiero registrarme para acceder al sistema" |
| Historia muy grande | "Implementar e-commerce completo" | Dividir en: Catálogo, Carrito, Checkout |
| Criterios vagos | "Debe cargar rápido" | "Tiempo de respuesta < 200ms en 95% de requests" |
| Tareas huérfanas | Tarea: "Configurar servidor" | Tarea bajo US de "Desplegar ambiente staging" |

---

## AI Behavior

1. **Revisar `references/` y `assets/examples/`**: Si tienes dudas sobre cómo dividir una historia, consulta la carpeta de referencias para ver patrones detallados ("Cómo hacer slicing por rol", "Cómo hacer slicing por datos").
2. **Aplicar INVEST** a CADA user story que propongas o revises.
3. **Validar Tamaño**: Si una historia que generas parece tomar más de un par de días, sugiera proactivamente al usuario dividirla usando una de las técnicas de Slicing.
4. **Contexto Aislado**: Nunca asumas NADA sobre el proyecto. Si necesitas roles específicos, pregúntale al usuario o consulta el skill de arquitectura del proyecto huésped.
