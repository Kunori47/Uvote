# Configuración de Variables de Entorno en Vercel

## Problema: Error 500

Si estás viendo un error 500, probablemente es porque faltan las variables de entorno de Supabase.

## Pasos para Configurar

### 1. Obtener Credenciales de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** → será `SUPABASE_URL`
   - **anon public key** → será `SUPABASE_ANON_KEY`

### 2. Configurar en Vercel

1. Ve a tu proyecto backend en [Vercel Dashboard](https://vercel.com)
2. Ve a **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_STORAGE_BUCKET=uvote-media (opcional, tiene valor por defecto)
   ```

4. Selecciona los **Environments** donde aplicar:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. Haz clic en **Save**

### 3. Redesplegar

Después de agregar las variables:
1. Ve a **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo push al repositorio

### 4. Verificar

Después del redeploy, prueba:
```
https://uvote-backend.vercel.app/health
```

Debería responder con `{ status: 'ok' }`

Luego prueba:
```
https://uvote-backend.vercel.app/api/users/0x1E6EC0ad80EE9Ff5Ae4ABed0E9C2A12AD8116a88
```

Si el usuario no existe, debería responder con `404` (no `500`).

## Variables Opcionales

- `CORS_ORIGIN`: Si quieres restringir CORS a un origen específico
- `PORT`: Puerto del servidor (por defecto 3001, no necesario en Vercel)
- `NODE_ENV`: `production` en Vercel (se establece automáticamente)

## Verificar Logs

Si sigues teniendo problemas:
1. Ve a **Deployments** → último deployment
2. Haz clic en **Functions**
3. Revisa los logs para ver el error específico

