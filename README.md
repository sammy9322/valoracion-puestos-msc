# Valoración de Puestos MSC

Sistema integral de valoración salarial por puntos para la Municipalidad de San Carlos.

## Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 4, TypeScript
- **Backend:** Express, Prisma, TypeScript
- **Base de datos:** PostgreSQL (Neon)
- **Catálogo externo:** Supabase (solo lectura)
- **AI Agent:** Ollama (deepseek-coder-v2)
- **Librerías clave:** Axios, Lucide React, Recharts, jsPDF, Multer, pdf-parse, Mammoth

## Setup

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd valoracion-puestos-msc

# 2. Variables de entorno
cp .env.example .env
# Editar .env con las credenciales correspondientes

# 3. Instalar dependencias
cd frontend && npm install
cd ../server && npm install

# 4. Inicializar BD
cd ../server
npx prisma generate
npx prisma db push

# 5. Iniciar en desarrollo
cd ../frontend && npm run dev   # http://localhost:5173
cd ../server && npm run dev     # http://localhost:5000
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `cd frontend && npm run dev` | Inicia frontend en Vite |
| `cd frontend && npm run build` | Build de producción |
| `cd server && npm run dev` | Inicia servidor Express con nodemon |
| `cd server && npx prisma generate` | Regenera cliente Prisma |
| `cd server && npx prisma db push` | Sincroniza schema con BD |

## Estructura

```
msc-valoracion-monorepo/
├── frontend/                    # React + Vite + Tailwind
│   └── src/
│       ├── components/          # Componentes reutilizables
│       ├── config/              # Configuración (anomalías)
│       ├── constants/           # Constantes
│       ├── pages/               # Páginas/rutas
│       ├── services/            # API y Supabase clients
│       ├── App.tsx              # Layout y routing
│       └── main.tsx             # Entry point
├── server/                      # Express + Prisma
│   └── src/
│       ├── routes/              # Endpoints REST
│       ├── services/            # Lógica de negocio
│       ├── index.ts             # Entry point
│       └── db.ts                # Conexión Prisma
├── docs/                        # Documentación adicional
├── .env.example                 # Template de variables de entorno
├── docker-compose.yml           # Orquestación Docker
└── vercel.json                  # Deploy config
```
