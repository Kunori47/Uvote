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

// Middleware manual de CORS (debe ir PRIMERO, antes de cualquier otro middleware)
// Este middleware SIEMPRE establece los headers de CORS para permitir cualquier origen de Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // SIEMPRE establecer headers de CORS para cualquier origen
  // En producción (Vercel), permitimos todos los orígenes de Vercel y localhost
  if (origin) {
    // Usar el origin específico para permitir credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Si no hay origin (request del servidor), usar wildcard
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Manejar solicitudes OPTIONS (preflight) - responder inmediatamente
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// CORS también con la librería cors (como respaldo)
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
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ].filter(Boolean);

    // Permitir CUALQUIER origen de Vercel
    const isVercelOrigin = 
      origin.includes('.vercel.app') || 
      origin.includes('vercel.app') ||
      origin.includes('vercel-dns.com') ||
      origin.startsWith('https://uvote');

    const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');

    // Siempre permitir en producción (Vercel)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
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

// 404 handler - asegurar que también tenga headers CORS
app.use((req, res) => {
  // Establecer headers CORS incluso para 404
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method 
  });
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

