# Solución al Error "Build directory does not exist"

## Problema
El error `Build directory does not exist: /var/task/build` indica que el código compilado no está disponible cuando la función serverless se ejecuta.

## Cambios Realizados

### 1. Configuración de Vercel (`vercel.json`)
- Eliminado `outputDirectory` (no se usa para funciones serverless)
- Cambiado `buildCommand` a `npm run vercel-build`

### 2. Script de Build (`package.json`)
- Agregado script `vercel-build` que ejecuta `npm run build`
- Vercel ejecutará automáticamente `vercel-build` durante el deployment

### 3. Handler Serverless (`api/[...all].js`)
- Mejorado para buscar el archivo `app.js` en múltiples ubicaciones posibles
- Agregado logging detallado para diagnosticar problemas
- Busca en:
  - `process.cwd()/build/app.js`
  - `__dirname/../build/app.js`
  - `process.cwd()/app.js`
  - `__dirname/../app.js`

## Verificación

Después de hacer push y que Vercel despliegue:

1. **Revisa los logs de Vercel**:
   - Ve a Deployments → último deployment → Functions → `api/[...all]`
   - Busca `[Serverless]` en los logs
   - Deberías ver: `[Serverless] Found app at: ...`

2. **Si el error persiste**, los logs mostrarán:
   - Todas las rutas que se intentaron
   - El contenido del directorio actual
   - El contenido del directorio padre

3. **Prueba el endpoint**:
   ```
   https://uvote-backend.vercel.app/api/test
   ```
   Debería responder con `{ message: 'API is working', ... }`

## Si el Problema Persiste

Si después de estos cambios el build aún no se encuentra:

1. **Verifica que el build se ejecute correctamente**:
   - En Vercel, ve a Deployments → Build Logs
   - Deberías ver: `> npm run vercel-build` y `> tsc`
   - No debería haber errores de compilación

2. **Verifica que no haya `.vercelignore`**:
   - Asegúrate de que no haya un archivo `.vercelignore` que excluya `build/`

3. **Considera usar una estructura diferente**:
   - Si el problema persiste, podríamos mover el código compilado a `api/` o usar un enfoque diferente

