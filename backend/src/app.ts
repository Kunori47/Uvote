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

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:5173',
      'http://localhost:3000',
    ];

    // Permitir requests sin origin (ej. curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
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
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Uvote Backend API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API base: http://localhost:${PORT}/api`);
  console.log(`📖 Swagger UI: http://localhost:${PORT}/api/docs`);
  console.log(`📄 JSON docs: http://localhost:${PORT}/api/docs/json`);
});

export default app;

