# Plan de Reconstrucción: App Valoración de Puestos MSC

Este plan detalla los pasos necesarios para recuperar la funcionalidad de la aplicación de valoración de puestos, migrando la lógica del disco D (dañado) a la versión de OneDrive.

## Estado de la Aplicación
*   **Origen:** C:\Users\gaboa\OneDrive\Desarrollo de Apps\Apps Muni\Metodología Valoración de Puestos por Puntos\valoracion-puestos-msc
*   **Objetivo:** Restaurar el sistema de checklist objetivo, clasificación automática de estratos y catálogo de puestos vía Supabase.

## Fase 1: Sincronización de Base de Datos (Prisma)
1.  **Modificar `schema.prisma`:**
    *   Agregar `tipo_serie` al modelo `Puesto`.
    *   Agregar `respuestas_checklist` (Json) al modelo `Evaluacion`.
2.  **Ejecutar Migración:**
    *   `npx prisma migrate dev --name sync_msc_logic`
3.  **Actualización de Datos:**
    *   Asignar manualmente el `tipo_serie` a los puestos existentes.

## Fase 2: Lógica del Backend (Express + TypeScript)
1.  **Validación de Rangos:**
    *   Implementar validación de puntos vs `tipo_serie`.
2.  **Procesamiento de Checklist:**
    *   Guardar selecciones de niveles (Bajo/Medio/Alto) en formato JSON.

## Fase 3: Reconstrucción del Wizard (Frontend - React)
1.  **Componente de Checklist:**
    *   Implementar botones de selección de nivel por cada factor.
2.  **Cálculo de Estrato:**
    *   Lógica dinámica para mostrar la serie resultante (Operativa, etc.) en tiempo real.

## Fase 4: Integración con Supabase (Catálogo de Puestos)
1.  **Cliente Supabase:**
    *   Restaurar la conexión y variables de entorno para consultar el catálogo.
2.  **Autocompletado de Fichas:**
    *   Implementar buscador en el módulo de Puestos que consulte Supabase.
    *   Al seleccionar un puesto del catálogo, autocompletar automáticamente campos como `manual_descriptor`, `clase`, y `area`.

## Fase 5: Verificación y Pruebas
1.  Realizar evaluaciones de prueba.
2.  Verificar la correcta importación de datos desde Supabase.

---
**Nota:** Este plan se ejecutará sobre la base de OneDrive para asegurar que el trabajo quede respaldado inmediatamente en la nube.
