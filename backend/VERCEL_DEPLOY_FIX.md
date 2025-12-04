# Guía de Deploy del Backend en Vercel - Solución CORS y 404

## Problema Identificado

Tienes dos problemas principales:
1. **CORS Error**: No se están enviando los headers correctos de CORS
2. **404 Error**: Las rutas no están siendo manejadas correctamente por Vercel

## Cambios Realizados

### 1. `vercel.json` - Configuración de Vercel
- Actualizado para usar la configuración v2 de Vercel
- Configura el routing para que todas las requests pasen por el handler serverless

### 2. `api/[...all].js` - Handler Serverless
- Mejorado para manejar tanto exports por defecto como named exports
- Asegura compatibilidad con el build de TypeScript

### 3. `src/app.ts` - Configuración de CORS
- Agregado el origen de producción explícitamente: `https://uvote-one.vercel.app`
- Agregado manejo de preflight requests (OPTIONS)
- Configurado `maxAge` para cachear preflight requests por 24 horas
- Agregados headers expuestos adicionales

### 4. `.env.example` - Variables de Entorno
- Plantilla con todas las variables necesarias

## Pasos para Deployar

### 1. Configurar Variables de Entorno en Vercel

Ve a tu proyecto backend en Vercel Dashboard y agrega estas variables de entorno:

```
NODE_ENV=production
CORS_ORIGIN=https://uvote-one.vercel.app
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_supabase_anon_key
PORT=3001
```

### 2. Rebuild y Redeploy

Desde el directorio `backend`, ejecuta:

```bash
npm run build
```

Luego haz commit y push de los cambios:

```bash
git add .
git commit -m "Fix CORS and 404 errors for Vercel deployment"
git push
```

O si prefieres hacer deploy directo desde la CLI de Vercel:

```bash
cd backend
vercel --prod
```

### 3. Verificar el Deploy

Una vez deployado, verifica:

1. **Health Check**: 
   ```
   https://uvote-backend.vercel.app/health
   ```

2. **API Endpoint de usuarios**:
   ```
   https://uvote-backend.vercel.app/api/users/TU_ADDRESS
   ```

## Notas Importantes

1. **CORS Origins**: El backend ahora acepta requests de:
   - `https://uvote-one.vercel.app` (tu frontend de producción)
   - Cualquier dominio `*.vercel.app` (deployments de preview)
   - `localhost:5173` y `localhost:3000` (desarrollo local)

2. **Serverless Functions**: Vercel convierte tu Express app en una función serverless. Cada request inicia una nueva instancia, así que:
   - Las conexiones a base de datos deben ser eficientes
   - No hay estado persistente entre requests
   - Cold starts pueden causar latencia inicial

3. **Logs**: Para ver logs en Vercel:
   - Ve a tu proyecto → Deployments → [deployment específico] → Logs
   - O usa `vercel logs [deployment-url]`

4. **Troubleshooting adicional**:
   - Si sigues viendo CORS errors, verifica que las variables de entorno estén correctamente configuradas
   - Si hay 404s, verifica que el build esté generando el directorio `build/` correctamente
   - Usa las DevTools del navegador para ver los headers de respuesta

## Testing Local con Serverless

Para probar localmente el entorno serverless:

```bash
cd backend
npm install -g vercel
vercel dev
```

Esto simula el entorno de Vercel localmente.

## Estructura de Archivos Críticos

```
backend/
├── api/
│   └── [...all].js       # Handler serverless de Vercel
├── src/
│   ├── app.ts           # Express app principal
│   └── routes/          # Rutas de API
├── vercel.json          # Configuración de Vercel
├── package.json         # Dependencias
└── tsconfig.json        # Configuración TypeScript
```

## ¿Qué hace cada archivo?

- **vercel.json**: Le dice a Vercel cómo construir y routear tu app
- **api/[...all].js**: Envuelve tu Express app para funcionar como serverless function
- **src/app.ts**: Tu aplicación Express con todas las rutas y middleware

## Siguiente Paso

Después de hacer el deploy, intenta hacer una request desde tu frontend y verifica en las DevTools:
1. Que la request esté llegando a la URL correcta
2. Que los headers de CORS estén presentes en la respuesta
3. Que el status code sea 200 (y no 404)
