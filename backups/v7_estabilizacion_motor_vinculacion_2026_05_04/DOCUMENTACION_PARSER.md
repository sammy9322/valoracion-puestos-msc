# Motor de Análisis del Manual de Puestos (Parser PDF)

Este documento detalla la lógica de extracción de datos utilizada en `server/src/services/manualParser.ts`, la cual fue altamente optimizada para extraer con precisión la información de un PDF legal no estructurado.

## El Problema de la Estructura del Documento
El "Manual Descriptivo de Puestos" carece de un marcado interno. Para extraer las "Clases", los "Cargos" y las "Funciones" de cada puesto de forma programática, se utilizó un motor basado en expresiones regulares (RegEx).

Durante la estabilización, nos enfrentamos a problemas de "truncamiento prematuro" o "match fallido" para ciertos puestos complejos (por ejemplo, el *Asistente de Control Interno* y el *Asistente en Catastro*).

## Soluciones Implementadas y Lecciones Aprendidas

### 1. Limpieza de Tablas de Contenidos (TOC)
La clase contenía un índice interno con números de página ("Funciones específicas por cargo ........ 108"). 
**Solución:** Se implementó una lógica de pre-limpieza estricta que remueve los puntos de relleno (`\.{5,}`) y evita que la expresión regular del encabezado se enganche en la tabla de contenidos en lugar del verdadero encabezado del texto.

### 2. Anclaje Estricto de Delimitadores de Bloque
El bloque de funciones se extrae buscando todo el texto desde el encabezado "Funciones específicas por cargo" hasta que se encuentre el siguiente título importante (como "Requisitos", "Conocimientos", o "Condiciones").

**El Bug Crítico:**
La palabra "condiciones" aparecía a mitad de una oración en las funciones del puesto "Asistente en Catastro" (*"...observación de propiedades y sus condiciones de infraestructura..."*). Esto provocaba que el parser pensara que el bloque de funciones había terminado prematuramente, truncando al Asistente en Catastro y eliminando todos los puestos que le seguían (incluyendo al Asistente de Control Interno).

**La Solución:**
Se anclaron todos los delimitadores de fin de bloque al inicio de línea (`(?:^|\n)`). De este modo, la palabra "Condiciones" solo interrumpe el bloque si aparece como un verdadero título o subtítulo al inicio de un renglón.
```typescript
// Regex implementada para asegurar el fin del bloque de funciones
(?=(?:^|\n)\s*(?:Requisitos|Conocimientos|Condiciones|Nombre de la clase)|$)
```

### 3. Delimitación Dinámica de Cargos (Lookaheads)
Para extraer las funciones *específicas* de un cargo, el parser usa un "lookahead" dinámico que busca el nombre del cargo actual y recolecta todo el texto hasta que encuentre el nombre del *siguiente* cargo en la lista de ese estrato.

**La Mejora:**
Se aplicó insensibilidad a los espacios en blanco (`\s+`) a la hora de buscar el nombre de los cargos, de modo que dobles o triples espacios en el PDF (comunes en alineaciones justificadas) no rompan la búsqueda.

## Flujo de Parseo
1. **Extracción del Texto:** Se extrae el texto puro del PDF mediante `pdf-parse`.
2. **Identificación de Clases:** Se divide el texto en "Estratos" o "Clases" usando `/Nombre de la clase:\s*([A-Za-zÁÉÍÓÚÑ0-9 ]+)/`.
3. **Limpieza Previa:** Se limpian los encabezados de página y los índices internos.
4. **Cargos Contenidos:** Se extrae la lista de todos los cargos listados bajo la clase.
5. **Funciones Globales vs Específicas:** Se extraen las "Actividades Generales" (heredadas) y luego se iteran las "Funciones específicas" usando el array de nombres de cargos como delimitadores dinámicos.
6. **Requisitos:** Se parsea la "Educación" y la "Experiencia".
7. **Resultado:** Se entrega un array de objetos JSON fuertemente tipado que luego es guardado directamente en SQLite para autocompletar las fichas en la UI.
