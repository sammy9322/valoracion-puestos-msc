export interface ExcludedPosition {
    id: string;
    nombre: string;
    clase: string;
    razon: string;
}

export const EXCLUDED_POSITIONS: ExcludedPosition[] = [
    {
        id: "63",
        nombre: "Encargado del Acueducto",
        clase: "Técnico Municipal 3",
        razon: "Duplicado anómalo del catálogo fuente (cruce incorrecto con estrato técnico). El puesto correcto oficial corresponde al ID 110 (Profesional Municipal 4)."
    }
    // Añadir futuros puestos anómalos aquí para mantener trazabilidad
];
