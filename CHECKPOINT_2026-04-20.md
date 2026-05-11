# 📋 CHECKPOINT — Valoración de Puestos MSC
**Fecha:** 20 de abril de 2026  
**Estado:** ✅ Aplicación Funcional (Backend + Frontend)  
**Autor del Checkpoint:** Antigravity AI + Desarrollador RRHH MSC

---

## 1. DESCRIPCIÓN GENERAL

**Valoración de Puestos MSC** es un sistema web diseñado para la **Municipalidad de San Carlos** que implementa la **Metodología de Valoración por Puntos** para definir una estructura salarial técnica, legal y transparente.

### Objetivo Principal
Determinar el **Valor del Punto (VP)** que, multiplicado por los puntos de evaluación de cada puesto, define el salario base del cargo. El sistema cruza datos de evaluación interna con comparativos de mercado basados en la **Ley Marco de Empleo Público (Ley 10.159)** y el esquema de **Salario Global**.

### Marco Legal
- **Ley 10.159** — Ley Marco de Empleo Público (Salario Global)
- **MIDEPLAN** — Clasificación por familias de puestos
- **MTSS** — Salarios mínimos legales
- **SEVRI** — Sistema Específico de Valoración del Riesgo Institucional

---

## 2. STACK TECNOLÓGICO

| Componente | Tecnología | Versión |
|---|---|---|
| **Frontend** | React + TypeScript + Vite | React 18.x, Vite 6.x |
| **Backend** | Express.js + TypeScript | Express 4.x |
| **Base de Datos** | SQLite (via Prisma ORM) | Prisma 5.x |
| **Estilos** | CSS custom (diseño Apple-style) | — |
| **Runtime** | Node.js | v20.12.2 |
| **Dev Server Backend** | Nodemon + ts-node | — |

---

## 3. ESTRUCTURA DE ARCHIVOS (al 20/04/2026)

```
valoracion-puestos-msc/
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── pages/
│   │   │   ├── FichasPuestos.tsx      ← Catálogo de cargos (CRUD)
│   │   │   ├── PuestosClave.tsx       ← Selección de benchmarks
│   │   │   ├── EncuestaSalario.tsx    ← Comparativo de mercado (Ley 10.159)
│   │   │   ├── WizardEvaluacion.tsx   ← Asistente paso a paso (6 factores)
│   │   │   ├── CalculoVP.tsx          ← Determinación del Valor del Punto
│   │   │   ├── Asignaciones.tsx       ← Cruce final Puntos × VP = Salario
│   │   │   └── PanelAuditoria.tsx     ← Trazabilidad y cumplimiento
│   │   ├── services/
│   │   │   └── api.ts                 ← Axios config (baseURL: localhost:5000)
│   │   ├── App.tsx                    ← Layout + Router + Dashboard
│   │   ├── App.css                    ← Estilos del layout
│   │   ├── index.css                  ← Variables CSS globales
│   │   └── main.tsx                   ← Entry point
│   ├── .env                           ← Variables de entorno frontend
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma              ← Esquema completo de la BD
│   │   └── dev.db                     ← Base de datos SQLite (127KB)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── puestos.ts             ← CRUD fichas + borrado lógico + auditoría
│   │   │   ├── evaluaciones.ts        ← Wizard de puntuación (6 factores)
│   │   │   ├── encuestas.ts           ← Motor de Salario Global (LEY 10.159)
│   │   │   ├── calculos.ts            ← Cálculo VP sugerido + aprobación
│   │   │   ├── asignaciones.ts        ← Cruce salarial final
│   │   │   └── auditoria.ts           ← Logs de seguridad
│   │   ├── db.ts                      ← Instancia Prisma Client
│   │   └── index.ts                   ← Express app + rutas
│   ├── .env                           ← Variables de entorno server
│   ├── package.json
│   └── tsconfig.json
│
├── backups/                           ← Respaldos históricos
├── docker-compose.yml
└── CHECKPOINT_2026-04-20.md           ← ESTE DOCUMENTO
```

---

## 4. BASE DE DATOS (Prisma Schema)

### Modelos Principales

| Modelo | Propósito | Campos Clave |
|---|---|---|
| **User** | Usuarios del sistema | email, nombre, rol (ADMIN/EVALUADOR) |
| **Puesto** | Fichas de cargos municipales | nombre, area, es_puesto_clave, estado, eliminado |
| **Evaluacion** | Valoración por factores | 6 factores × (grado, puntos, justificación), puntos_totales |
| **EncuestaSalarios** | Datos de mercado por puesto | salario_min/prom/max, fuente, periodo |
| **ValorPunto** | VP calculado y aprobado | valor_punto_exacto, valor_punto_aplicado, periodo |
| **AsignacionSalario** | Resultado final del cruce | puntos_totales × VP = salario_calculado |
| **Auditoria** | Trazabilidad de cambios | tabla, accion, datos_antes, usuario_id |
| **SalarioMinimoLegal** | Pisos salariales del MTSS | categoria, monto, decreto_mtss |
| **NormaLegal** | Marco jurídico aplicable | ley, artículo, ámbito |

### Relaciones Clave
```
User ──┬── Evaluacion (creador)
       ├── Evaluacion (aprobador)
       ├── ValorPunto (calculador)
       ├── ValorPunto (aprobador)
       └── Auditoria

Puesto ──┬── Evaluacion[]
         ├── EncuestaSalarios[]
         ├── AsignacionSalario[]
         └── IndiceSalarial[]
```

---

## 5. API ENDPOINTS

### Backend: `http://localhost:5000/api`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/puestos` | Listar puestos activos |
| GET | `/puestos/eliminados` | Listar puestos borrados (auditoría) |
| GET | `/puestos/clave` | Solo puestos marcados como benchmark |
| POST | `/puestos` | Crear nueva ficha de puesto |
| PUT | `/puestos/:id/clave` | Toggle puesto clave (sí/no) |
| DELETE | `/puestos/:id` | Borrado lógico con registro en auditoría |
| GET | `/evaluaciones` | Listar evaluaciones con puesto incluido |
| POST | `/evaluaciones` | Guardar evaluación del Wizard (6 factores) |
| GET | `/encuestas/scraping?puesto=X&id=Y` | **Motor de Salario Global** — Consulta inteligente |
| POST | `/encuestas` | Guardar resultado de encuesta de mercado |
| GET | `/calculos/sugerido` | **VP Sugerido** basado en puestos clave |
| GET | `/calculos/actual` o `/calculos/vp` | VP vigente (último aprobado) |
| POST | `/calculos` | Guardar VP definitivo para el periodo |
| GET | `/asignaciones/cruce` | Cruce final: Puntos × VP = Salario |
| POST | `/asignaciones/publicar` | Publicar escala salarial |
| GET | `/auditoria` | Logs con filtros (accion, fechas) |
| GET | `/auditoria/estadisticas` | Resumen: total, eliminaciones, últimas 24h |
| GET | `/health` | Health check del servidor |

---

## 6. LÓGICA DE NEGOCIO CRÍTICA

### 6.1 Motor de Salario Global (encuestas.ts)

El motor reemplaza el "scraping" simulado por una lógica basada en datos reales de la Ley 10.159.

**Familias de Puestos:**
```
ADMINISTRATIVA_PROFESIONAL: Director, Jefe, Profesional, Abogado, Ingeniero
TECNICA_OPERATIVA:          Todos los demás puestos
```

**Escalas Salariales por Familia (en colones, antes de ajuste):**

| Familia | Rango Puntos | Mínimo | Promedio | Máximo |
|---|---|---|---|---|
| Admin/Prof | 0-300 | ₡385,000 | ₡425,000 | ₡480,000 |
| Admin/Prof | 301-500 | ₡550,000 | ₡620,000 | ₡750,000 |
| Admin/Prof | 501-700 | ₡850,000 | ₡950,000 | ₡1,150,000 |
| Admin/Prof | 701-900 | ₡1,200,000 | ₡1,450,000 | ₡1,850,000 |
| Admin/Prof | 901-1000 | ₡1,900,000 | ₡2,200,000 | ₡2,800,000 |
| Téc/Oper | 0-200 | ₡350,000 | ₡395,000 | ₡450,000 |
| Téc/Oper | 201-400 | ₡420,000 | ₡510,000 | ₡620,000 |
| Téc/Oper | 401-600 | ₡580,000 | ₡720,000 | ₡880,000 |

**Factor de Ajuste Municipalidad Tipo A (San Carlos):** `1.08x`

> **Fórmula:** `Salario_Ajustado = Salario_Base × 1.08`

### 6.2 Cálculo del Valor del Punto (calculos.ts)

**Fórmula VP Sugerido:**
```
VP = Σ(Salarios Mercado de Puestos Clave) / Σ(Puntos de Evaluación de Puestos Clave)
```

**Requisitos para el cálculo:**
1. El puesto debe estar marcado como **Puesto Clave**
2. Debe tener una **Evaluación aprobada** (estado = 'aprobada')
3. Debe tener una **Encuesta de Mercado** del periodo actual

### 6.3 Cruce Salarial (asignaciones.ts)

**Fórmula Salario Base:**
```
Salario_Base = Puntos_Totales × VP_Aplicado
```

**Validación:** Si `Salario_Base < Salario_Mínimo_Legal` → se marca como `isUnderMin: true`

### 6.4 Factores de Evaluación (WizardEvaluacion.tsx)

| Factor | Puntos Máximos | Grados |
|---|---|---|
| Dificultad de Funciones | 200 | 5 |
| Supervisión Ejercida | 150 | 5 |
| Responsabilidad | 200 | 5 |
| Condiciones de Trabajo | — | — |
| Consecuencia del Error | — | — |
| Requisitos | — | — |

> **Nota:** Los factores "Condiciones", "Consecuencia del Error" y "Requisitos" están definidos en el schema pero el Wizard actual los completa con valores por defecto. Pendiente de implementar en una iteración futura.

---

## 7. FRONTEND — RUTAS Y PANTALLAS

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | Dashboard (en App.tsx) | Resumen gerencial con checklist SEVRI |
| `/fichas` | FichasPuestos.tsx | Catálogo de puestos con tarjetas |
| `/puestos-clave` | PuestosClave.tsx | Marcar/desmarcar benchmarks |
| `/encuesta` | EncuestaSalario.tsx | Comparativo de mercado (tabla) |
| `/evaluaciones` | WizardEvaluacion.tsx | Asistente paso a paso |
| `/calculo-vp` | CalculoVP.tsx | VP sugerido y aprobación |
| `/asignaciones` | Asignaciones.tsx | Cruce final Puntos × VP |
| `/auditoria` | PanelAuditoria.tsx | Logs de seguridad |

---

## 8. CÓMO RETOMAR EL DESARROLLO

### 8.1 Configuración Inicial (PC nueva)

```bash
# 1. Instalar Node.js v20+ desde https://nodejs.org

# 2. Verificar instalación
node -v   # Debe mostrar v20.x.x
npm -v    # Debe mostrar 10.x.x

# 3. Instalar dependencias del Backend
cd valoracion-puestos-msc/server
npm install
npx prisma generate    # Genera el cliente de Prisma

# 4. Instalar dependencias del Frontend
cd ../frontend
npm install
```

### 8.2 Arrancar la Aplicación

```bash
# Terminal 1 — Backend (Puerto 5000)
cd server
npm run dev
# Debe mostrar: "Server running on port 5000"

# Terminal 2 — Frontend (Puerto 5173)
cd frontend
npm run dev
# Debe mostrar: "Local: http://localhost:5173/"
```

### 8.3 Problemas Conocidos con OneDrive

> ⚠️ **IMPORTANTE:** Si la carpeta está en OneDrive, los archivos pueden estar en modo "Solo en la nube" y no descargarse automáticamente.

**Solución:**
1. Clic derecho en la carpeta del proyecto en el Explorador de Archivos.
2. Seleccionar **"Mantener siempre en este dispositivo"**.
3. Esperar a que todos los íconos cambien a ✅ (check verde).
4. Si `npm install` falla, pausar OneDrive, borrar `node_modules` y reinstalar.

### 8.4 Si la terminal no reconoce `npm`

```powershell
# Agregar Node.js al PATH de la sesión actual:
$env:Path += ";C:\Program Files\nodejs"
```

---

## 9. FLUJO DE TRABAJO COMPLETO

```
┌─────────────────┐
│  1. CREAR FICHA │  → POST /api/puestos
│  (FichasPuestos) │     estado: 'borrador'
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. MARCAR CLAVE │  → PUT /api/puestos/:id/clave
│  (PuestosClave)  │     es_puesto_clave: true
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. EVALUAR      │  → POST /api/evaluaciones
│  (Wizard)        │     6 factores → puntos_totales
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. ENCUESTAR    │  → GET /api/encuestas/scraping
│  (EncuestaSalario│     Motor Salario Global
│   )              │     → POST /api/encuestas (guardar)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. CALCULAR VP  │  → GET /api/calculos/sugerido
│  (CalculoVP)     │     VP = ΣSalarios / ΣPuntos
│                  │  → POST /api/calculos (aprobar)
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. ASIGNAR      │  → GET /api/asignaciones/cruce
│  (Asignaciones)  │     Salario = Puntos × VP
│                  │     Validar vs. mínimo legal
└─────────────────┘
```

---

## 10. PENDIENTES Y MEJORAS FUTURAS

- [ ] **Completar Wizard:** Agregar los 3 factores faltantes (Condiciones, Consecuencia del Error, Requisitos) con sus grados y puntos.
- [ ] **Autenticación JWT:** Actualmente se usa un usuario de prueba. Implementar login real con tokens.
- [ ] **Exportar PDF:** Los botones de "Exportar PDF" e "Imprimir Escala" están en la interfaz pero sin lógica.
- [ ] **Validación RRHH:** Revisar que los valores sugeridos por el motor coincidan con las expectativas salariales reales de la Municipalidad.
- [ ] **Modo Producción:** Migrar de SQLite a PostgreSQL para producción (el schema Prisma ya soporta el cambio con un ajuste en `datasource`).
- [ ] **CORS Seguro:** Actualmente `cors()` está abierto. Restringir a dominios específicos en producción.
- [ ] **Dockerización:** Ya existe `docker-compose.yml` pero no está configurado completamente.

---

## 11. DATOS DE PRUEBA EXISTENTES EN LA BD

La base de datos SQLite (`dev.db`) ya contiene al menos 2 puestos de prueba:
- **Asistente de Control Interno**
- **Jefe de Salud Ocupacional**

Y un usuario administrador:
- Email: `admin@msc.go.cr`
- Rol: `ADMIN`

---

## 12. CONTACTO Y CONTEXTO

- **Desarrollado para:** Municipalidad de San Carlos (MSC)
- **Tipo de Municipalidad:** Tipo A (Gran Escala)
- **País:** Costa Rica
- **Normativa Base:** Ley 10.159, MIDEPLAN, MTSS, SEVRI
- **Carpeta del Proyecto:** `C:\Users\gaboa\OneDrive\Desarrollo de Apps\Apps Muni\Metodología Valoración de Puestos por Puntos\valoracion-puestos-msc`

---

> **💡 TIP para la IA:** Si retomas este proyecto en una nueva sesión, lee este documento primero. Contiene toda la arquitectura, las decisiones de diseño y el estado exacto de la aplicación al momento de este checkpoint.
