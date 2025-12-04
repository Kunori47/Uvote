# 🔧 Solución al Error 500 + CORS

## Estado Actual

✅ **Progreso**: El error cambió de 404 a 500 - ¡esto significa que el routing ahora funciona!

❌ **Problema actual**: Error 500 (Internal Server Error)
- El error de CORS es secundario - cuando hay un 500, los headers no se envían correctamente
- Causa probable: Variables de entorno no configuradas en Vercel

## Cambios Adicionales Realizados

### 1. Mejorado el Error Handler (`src/app.ts`)
- Ahora **siempre** envía headers CORS, incluso en errores
- Logs detallados para debugging en producción
- Maneja explícitamente casos 404 con CORS

### 2. Mejor Diagnóstico en User Model (`src/models/User.ts`)
- Mensajes de error más claros
- Logs que indican exactamente qué variables faltan
- Ayuda a identificar problemas de configuración rápidamente

## 🚨 ACCIÓN REQUERIDA: Configurar Variables de Entorno

El error 500 muy probablemente se debe a que **las variables de entorno no están configuradas en Vercel**.

### Paso 1: Ir al Dashboard de Vercel

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **backend** (uvote-backend)
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar Variables Necesarias

Agrega estas variables para **Production**, **Preview** y **Development**:

```
NODE_ENV=production
CORS_ORIGIN=https://uvote-one.vercel.app
SUPABASE_URL=https://[tu-proyecto].supabase.co
SUPABASE_ANON_KEY=[tu-anon-key-de-supabase]
PORT=3001
```

### ¿Cómo obtener las credenciales de Supabase?

1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Abre tu proyecto de Uvote
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → Usa esto para `SUPABASE_URL`
   - **Project API keys** → **anon/public** → Usa esto para `SUPABASE_ANON_KEY`

### Paso 3: Redeploy

Después de agregar las variables de entorno:

1. Ve a **Deployments** en Vercel
2. Haz clic en el deployment más reciente
3. Haz clic en los **3 puntos** (⋯) → **Redeploy**
4. Selecciona **Use existing Build Cache** (más rápido)
5. Confirma el redeploy

O simplemente haz un nuevo commit:

```bash
git add .
git commit -m "Fix error handling and CORS for 500 errors"
git push
```

## 🔍 Verificar que Funcione

### 1. Ver los Logs

Después del redeploy, ve a:
- **Vercel Dashboard** → **Deployments** → [tu deployment] → **Logs**

Busca estos mensajes:
- ✅ `🚀 Uvote Backend API running on port 3001`
- ❌ `❌ Supabase not initialized` (si aún falta configuración)

### 2. Probar los Endpoints

**Health Check** (debe devolver 200 OK):
```bash
curl https://uvote-backend.vercel.app/health
```

**API de Usuario** (debe devolver 200 con datos o 404 si no existe):
```bash
curl https://uvote-backend.vercel.app/api/users/0x1E6EC0ad80EE9Ff5Ae4ABed0E9C2A12AD8116a88
```

### 3. Verificar CORS desde el Frontend

Una vez que el 500 esté resuelto, abre DevTools en tu frontend:

1. Ve a **Network** tab
2. Haz una request al backend
3. Verifica los headers de respuesta:
   - ✅ `Access-Control-Allow-Origin: https://uvote-one.vercel.app`
   - ✅ `Access-Control-Allow-Credentials: true`

## 📊 Diagnóstico del Error

Si después de configurar aún tienes errores, los logs ahora mostrarán:

```
=== ERROR ===
Path: /api/users/0x...
Method: GET
Error: Database not configured. Please set SUPABASE_URL...
   SUPABASE_URL: Missing
   SUPABASE_ANON_KEY: Missing
```

Esto te dirá exactamente qué variables faltan.

## 🎯 Checklist Final

- [ ] Variables de entorno configuradas en Vercel
- [ ] Redeploy ejecutado con las nuevas variables
- [ ] Health check responde 200 OK
- [ ] Logs no muestran errores de "Supabase not initialized"
- [ ] API de usuarios responde correctamente
- [ ] Headers CORS presentes en las respuestas
- [ ] Frontend puede hacer requests sin errores de CORS

## 💡 Tips Adicionales

### Si el error persiste:

1. **Verifica que las variables estén bien escritas:**
   - No debe haber espacios antes o después
   - La URL de Supabase debe empezar con `https://`
   - La ANON_KEY debe ser la key pública (anon), no la service_role

2. **Verifica que estén en el environment correcto:**
   - Marca todas las opciones: Production, Preview, Development

3. **Fuerza un nuevo build:**
   - NO uses "Use existing Build Cache"
   - Esto asegura que las variables se carguen desde cero

4. **Verifica la conexión a Supabase:**
   - Asegúrate de que tu proyecto de Supabase esté activo
   - Verifica que no esté pausado (proyectos gratuitos se pausan si no se usan)

## 📞 Siguiente Paso

Una vez configuradas las variables de entorno y redeployado:

1. Intenta acceder al endpoint de nuevo desde tu frontend
2. Revisa los logs en Vercel para ver si hay otros errores
3. Si todo está bien, deberías ver una respuesta exitosa ✅
