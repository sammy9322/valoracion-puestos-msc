# Despliegue a producción — con autenticación

La app pasó de tener la API abierta a exigir un JWT en todas las rutas salvo
`/api/auth/*` y `/api/health`. **El orden de estos pasos importa**: invertirlos
deja producción caída o te deja fuera de tu propia app.

## Orden obligatorio

### 1. Crear la contraseña en la BD de producción

Antes de desplegar. Si desplegás primero, la app va a exigir login contra una
base que todavía no tiene ningún usuario con contraseña válida.

```bash
cd server
# Con DATABASE_URL apuntando a Neon de producción en server/.env
npx ts-node set_password.ts admin@msc.go.cr "una-clave-de-12-o-mas-caracteres"
```

El usuario `admin@msc.go.cr` que crea `seed_local.ts` tiene la contraseña en
texto plano (`mock_password`). El login **rechaza** cualquier contraseña que no
esté hasheada con bcrypt, así que ese usuario no sirve hasta correr el script.

### 2. Cargar las variables nuevas en Vercel

Settings → Environment Variables. Sin `JWT_SECRET`, **todas** las rutas
protegidas responden 500 y la app queda inutilizable.

| Variable | Valor |
|---|---|
| `JWT_SECRET` | Cadena aleatoria larga. Generar con: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |
| `ALLOWED_ORIGINS` | El dominio de producción, p.ej. `https://valoracion-puestos-msc.vercel.app` |
| `GEMINI_MODEL` | `gemini-3.5-flash` (opcional; es el default en código) |

Las que ya existían (`DATABASE_URL`, `GEMINI_API_KEY`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) se quedan como están.

En Vercel el frontend y la API comparten dominio, así que CORS no interviene en
producción. `ALLOWED_ORIGINS` importa solo si algún día se separan.

### 3. Desplegar

Recién ahora. Verificar en este orden:

```bash
# 1. health responde sin token
curl https://<tu-dominio>/api/health

# 2. una ruta protegida rechaza sin token
curl -o /dev/null -w "%{http_code}\n" https://<tu-dominio>/api/puestos   # → 401

# 3. login devuelve token
curl -X POST https://<tu-dominio>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@msc.go.cr","password":"tu-clave"}'
```

Si el paso 2 devuelve 500 en vez de 401, falta `JWT_SECRET` en Vercel.

## Rollback

Si algo sale mal, el cambio de auth se desactiva comentando una sola línea en
`server/src/index.ts`:

```ts
// app.use('/api', requireAuth);
```

Eso devuelve la API al comportamiento anterior (abierta) sin tocar nada más.
El motor de análisis no depende de la autenticación.

## Qué NO se tocó

El motor de evaluación quedó intacto en su lógica de puntajes:

- `contextualAnalyzer.ts`, `confidenceCalculator.ts`, `valuationPipeline.ts`,
  `reportGenerator.ts`, `htmlReportGenerator.ts` — sin cambios.
- `aiAgentService.ts` — solo se cambió el modelo a variable de entorno
  (`GEMINI_MODEL`, con el mismo default `gemini-3.5-flash` de antes), se
  corrigieron escapes Unicode rotos en los textos de alerta, y se agregó un
  warning de arranque. **Ningún cálculo cambió.**
