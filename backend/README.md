# 🚀 Uvote Backend API

Backend API para almacenar metadata de usuarios, creadores, tokens y suscripciones.

## 📋 Características

- ✅ Gestión de perfiles de usuarios y creadores
- ✅ Sistema de suscripciones (seguir creadores)
- ✅ Metadata de tokens (imágenes, descripciones)
- ✅ Almacenamiento de imágenes en **Supabase Storage** (carpetas `profile/` y `moneda/`)
- ✅ Autenticación mediante firma de wallet
- ✅ API REST completa

## 🛠️ Instalación

```bash
cd backend
npm install
```

## ⚙️ Configuración

1. **Crea un proyecto en Supabase**:
   - Ve a https://supabase.com
   - Crea un nuevo proyecto
   - Guarda la contraseña de la base de datos

2. **Obtén la URL de conexión**:
   - En el dashboard: Settings → Database
   - Copia la "Connection string" (URI)

3. **Copia `.env.example` a `.env`**:
```bash
cp .env.example .env
```

4. **Configura las variables de entorno**:
```env
PORT=3001
# URL completa de Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Opcional: Para usar cliente de Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
```

Ver `SETUP_INSTRUCTIONS.md` para instrucciones detalladas.

## 🗄️ Migraciones

### Opción A: Desde el Dashboard de Supabase (Recomendado)
1. Ve a **SQL Editor** en el dashboard
2. Copia el contenido de `src/migrations/001_create_tables.sql`
3. Pega y ejecuta

### Opción B: Desde la línea de comandos
```bash
npm run migrate
```

## 🚀 Ejecutar

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 📡 Endpoints

### Usuarios
- `GET /api/users/:address` - Obtener perfil
- `POST /api/users` - Crear/actualizar perfil
- `PUT /api/users/:address` - Actualizar perfil
- `GET /api/users/:address/subscriptions` - Obtener suscripciones
- `GET /api/users/:address/subscribers` - Obtener seguidores

### Creadores
- `GET /api/creators` - Listar creadores
- `GET /api/creators/:address` - Perfil de creador
- `GET /api/creators/:address/stats` - Estadísticas

### Tokens
- `GET /api/tokens/:address` - Metadata del token
- `POST /api/tokens` - Registrar token
- `PUT /api/tokens/:address` - Actualizar metadata

### Suscripciones
- `POST /api/subscriptions` - Suscribirse
- `DELETE /api/subscriptions/:creatorAddress` - Desuscribirse
- `GET /api/subscriptions/check/:subscriber/:creator` - Verificar

### Imágenes
- `POST /api/images/upload` - Subir imagen a Supabase Storage

## 🔐 Autenticación

El backend usa autenticación mediante firma de wallet. El frontend debe:

1. Generar un mensaje para firmar
2. El usuario firma con su wallet
3. Enviar la firma en el header `Authorization: Bearer <base64(signatureData)>`

Ejemplo:
```typescript
const message = `Sign this message to authenticate with Uvote:\n\nAddress: ${address}\nNonce: ${nonce}`;
const signature = await wallet.signMessage(message);
const token = btoa(JSON.stringify({ message, signature, address }));
// Usar en header: Authorization: Bearer ${token}
```

## 📦 Estructura

```
backend/
├── src/
│   ├── config/        # Configuración (DB, IPFS)
│   ├── models/       # Modelos de datos
│   ├── routes/       # Rutas API
│   ├── middleware/   # Middleware (auth, etc)
│   ├── services/     # Servicios (signature, etc)
│   └── app.ts        # Aplicación principal
├── migrations/       # Migraciones SQL
└── package.json
```

## 🔗 Integración con Frontend

El frontend debe actualizar las llamadas para usar el backend API en lugar de generar datos aleatorios.

Ver `INTEGRATION_GUIDE.md` para más detalles.

