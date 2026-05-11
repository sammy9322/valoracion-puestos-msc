# Metodología de Valoración de Puestos MSC

> **Referencia Legal:** Ley Marco de Empleo Público (Ley 10.159)
> **Ecosistema:** Municipalidad de San Carlos (Tipo A)

## 🏗️ Estructura del Conocimiento

La aplicación utiliza un modelo de **Puntos por Factor** cruzado con el **Salario Global** definido por MIDEPLAN.

### 1. Clasificación por Estratos (Supabase Data)
Basado en los registros oficiales, los puestos se categorizan según el puntaje obtenido:

| Serie | Clase | Rango Puntos |
|---|---|---|
| Operativa | Operativo 1-7 | 135 - 400 |
| Administrativa | Administrativo 1-4 | 225 - 440 |
| Técnica | Técnico 1-3 | 285 - 495 |
| Profesional | Profesional 1-4 | 480 - 595 |
| Jefatura | Jefe 1-5 | 685 - 890 |

### 2. Algoritmo de Cálculo (VP)
El **Valor del Punto (VP)** se calcula mediante la fórmula:
`VP = Σ (Salarios de Mercado) / Σ (Puntos de Evaluación)`

### 3. Factor de Competitividad
Para Municipalidades Tipo A (como San Carlos), se aplica un multiplicador de **1.08x** sobre la escala base de MIDEPLAN, asegurando competitividad ante el sector privado y otras instituciones autónomas.

## 📉 Flujo Lógico de Valoración

```mermaid
graph TD
    A[Inicio: Ficha de Puesto] --> B{¿Es Puesto Clave?}
    B -- Sí --> C[Sondeo Mercado: Salario Global + 8%]
    B -- No --> D[Evaluación por Puntos: 6 Factores]
    
    C --> E[Cálculo Valor del Punto - VP]
    D --> F[Total Puntos Obtenidos]
    
    E & F --> G[Cálculo Sugerido: Puntos x VP]
    G --> H{¿Cumple Mínimo Legal MTSS?}
    
    H -- No --> I[Ajuste a Mínimo Legal]
    H -- Sí --> J[Salario Sugerido Final]
    I --> J
    
    J --> K[Clasificación Oficial: Serie + Clase]
    K --> L[Fin: Ficha Técnica Aprobada]
    
    style C fill:#e1f5fe,stroke:#01579b
    style G fill:#fff3e0,stroke:#e65100
    style J fill:#e8f5e9,stroke:#1b5e20
```

## 🔗 Vínculos Relacionados
- [[Manual de Puestos]]
- [[Escala Salarial 2024]]
- [[Panel de Auditoría]]

---
*Generado automáticamente por Documentation Orchestrator v2.0*
