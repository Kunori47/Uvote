import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

// Routes
import usersRouter from './routes/users';
import creatorsRouter from './routes/creators';
import tokensRouter from './routes/tokens';
import subscriptionsRouter from './routes/subscriptions';
import imagesRouter from './routes/images';
import predictionsRouter from './routes/predictions';
import docsRouter from './routes/docs';
import swaggerSpec from './swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS debe ir ANTES de otros middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej. curl, Postman, server-side)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      'http://localhost:5173',
      'http://localhost:3000',
      'https://uvote-one.vercel.app',
      'https://uvote-one.vercel.app/',
    ].filter(Boolean); // Remover valores undefined/null

    // Permitir cualquier origen de Vercel (desarrollo y producción)
    const isVercelOrigin = 
      origin.includes('.vercel.app') || 
      origin.includes('vercel.app') ||
      origin.startsWith('https://uvote-one');

    if (allowedOrigins.includes(origin) || isVercelOrigin) {
      callback(null, true);
    } else {
      // En desarrollo, permitir todos los orígenes
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        // En producción, ser más permisivo con Vercel pero loguear
        console.log(`CORS check - Origin: ${origin}, Allowed: ${allowedOrigins.join(', ')}, IsVercel: ${isVercelOrigin}`);
        callback(null, true); // Permitir temporalmente para debug
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Configurar helmet para que no bloquee CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (excluyendo /api/docs para Swagger)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
// Aplica a todas las rutas /api/* excepto /api/docs y /api/docs/*
app.use(/^\/api\/(?!docs)/, limiter);

// Serve uploaded images
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/tokens', tokensRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/predictions', predictionsRouter);
// JSON docs (opcional)
app.use('/api/docs/json', docsRouter);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Si es un error de CORS, asegurarse de enviar los headers correctos
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: err.message || 'CORS policy violation',
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server (solo si no estamos en modo serverless/Vercel)
// En Vercel, el servidor se maneja mediante serverless-http
if (process.env.VERCEL !== '1') {
  const startServer = () => {
    app.listen(PORT, () => {
      console.log(`🚀 Uvote Backend API running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API base: http://localhost:${PORT}/api`);
      console.log(`📖 Swagger UI: http://localhost:${PORT}/api/docs`);
      console.log(`📄 JSON docs: http://localhost:${PORT}/api/docs/json`);
    });
  };
  
  // Solo iniciar si estamos ejecutando directamente (no importado)
  if (typeof require !== 'undefined' && require.main === module) {
    startServer();
  }
}

export default app;

