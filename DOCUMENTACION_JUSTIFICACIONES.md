# Documentación Técnica: Motor de Justificaciones de Valoración (MSC)

Este documento centraliza las reglas de negocio, fórmulas y lógica de evaluación del **Motor de Análisis Contextual** utilizado para generar los informes PDF de valoración de puestos para la Municipalidad de San Carlos.

**Objetivo:** Cumplir con los requerimientos de auditoría y asegurar la trazabilidad técnica de cada grado asignado.

---

## 1. Estructura de la Justificación (Insumo Técnico)

Cada factor evaluado (Dificultad, Supervisión, Responsabilidad, Condiciones, Error, Requisitos) genera una justificación estructurada en 3 bloques obligatorios:

- **HALLAZGOS:** Enumera la evidencia textual extraída de las funciones del puesto (`fuente: 'funciones'`) y/o de los procedimientos operativos (`fuente: 'procedimiento'`). Se citan textualmente las oraciones detectadas.
- **ANÁLISIS:** Explica el razonamiento de por qué la evidencia corresponde al grado asignado, referenciando textualmente la escala oficial MSC.
- **RESOLUCIÓN:** Concluye con el grado asignado y los puntos correspondientes.

---

## 2. Fórmulas de Asignación por Factor

### 2.1 Dificultad de Funciones
- **Metodología:** Análisis Sintáctico Contextual (Verbo + Objeto).
- **Fórmula de Grado Base Verbo:** 
  - Ejecución/Operativo = 1-2
  - Análisis/Coordinación = 3
  - Dirección/Estrategia = 4-5
- **Boost de Objeto:**
  - Objetos rutinarios/menores = +0
  - Objetos técnicos especializados = +0 a +1
  - Objetos estratégicos/institucionales = +1 a +2
- **Fórmula Final (Acción):** `Grado Acción = clamp(Grado Base Verbo + Boost Objeto)`
- **Fórmula de Puesto:** `Grado Dificultad = Max(Promedio Redondeado de Acciones, Perfil Base del Área)`

### 2.2 Supervisión Ejercida
- **Criterios de Evaluación:** Búsqueda heurística en el texto combinado de funciones y procedimientos.
- **Asignación:**
  - Jefatura de departamento/unidad declarada en título o área = G4/G5
  - Verbos explícitos de "supervisar", "coordinar", "dirigir" personal = G3
  - Guía ocasional a compañeros o apoyo = G2
  - Trabajo individual sin personal a cargo = G1

### 2.3 Responsabilidad
- **Factores de Impacto:** Manejo de presupuestos, activos, custodia de información y gestión de procesos clave.
- **Asignación:**
  - Responsabilidad total por proceso estratégico o recursos macro = G5
  - Presupuestos, contrataciones, activos mayores = G4
  - Información sensible, confidencial, custodia de valores = G3
  - Activos menores, equipo, herramientas, suministros = G2
  - Responsabilidad estándar (uso de equipo propio de oficina) = G1

### 2.4 Condiciones de Trabajo
- **Criterios:** Entorno físico y riesgos asociados a las funciones descritas.
- **Asignación:**
  - Peligrosidad extrema, insalubridad recurrente = G5
  - Riesgos mecánicos, químicos o biológicos comprobables = G4
  - Intemperie, trabajo de campo continuo = G3
  - Esfuerzo físico (bipedestación, cargas) o ambiente incómodo = G2
  - Oficina controlada = G1

### 2.5 Consecuencia del Error
- **Criterios:** Alcance del daño en caso de equivocación.
- **Asignación:**
  - Compromete estabilidad institucional o seguridad pública = G5
  - Pérdidas económicas, multas, consecuencias penales/legales = G4
  - Afecta directamente al servicio ciudadano o entidades externas = G3
  - Retrasos internos u operativos = G2
  - Errores fácilmente subsanables = G1

### 2.6 Requisitos de Formación
- **Criterios:** Mapeo de términos educativos en el perfil de requisitos mínimos.
- **Asignación:**
  - Maestría, Posgrado, Doctorado = G5
  - Licenciatura, Bachillerato Universitario = G4
  - Diplomado, Parauniversitario, Técnico Superior = G3
  - Bachillerato Educación Media, Técnico Básico = G2
  - Educación Primaria o sin requisito = G1

---

## 3. Integración de Procedimientos (Rastreo)

El motor unifica las `Acciones` derivadas de:
1. `descripcion_funciones` (Perfil descriptivo del puesto)
2. `procedimientos` (Propósito, alcance, pasos, y políticas extraídos de la base de datos `v_catalogo_procedimientos_extendido` para el área del puesto).

En el reporte final, estas fuentes están visualmente tabuladas antes de la justificación para total transparencia.

---
*Última actualización: Implementación Fase 1 y 2 (Formatos Estructurados) - [2026-05-20]*
