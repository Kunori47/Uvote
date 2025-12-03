# Configuración de Vercel para Backend

## Problema Actual
- Error 404: Vercel no encuentra las rutas
- Error CORS: Headers no se están enviando

## Solución

### Opción 1: Proyecto Separado en Vercel (Recomendado)
1. En Vercel, crea un proyecto separado para el backend
2. Conecta el repositorio
3. Configura el **Root Directory** como `backend`
4. Las funciones serverless estarán en `api/[...all].js`

### Opción 2: Monorepo con Configuración Específica
Si el backend está en un subdirectorio, asegúrate de que:
- `vercel.json` esté en la raíz del proyecto backend
- El build command compile TypeScript correctamente
- Las funciones serverless estén en `backend/api/`

## Verificación

Después del deploy, verifica:
1. `/health` debería responder con `{ status: 'ok' }`
2. `/api/users/:address` debería responder (404 si no existe, pero con headers CORS)

## Logs de Debug

Los logs en Vercel deberían mostrar:
```
[Serverless] ===== Initializing =====
[Serverless] Loading app from: /var/task/build/app.js
[Serverless] App loaded successfully
[Serverless] Handler created successfully
```

Si ves errores, verifica:
- Que el build se complete correctamente
- Que `build/app.js` exista después del build
- Que todas las dependencias estén instaladas

