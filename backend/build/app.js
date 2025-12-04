"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Routes
const users_1 = __importDefault(require("./routes/users"));
const creators_1 = __importDefault(require("./routes/creators"));
const tokens_1 = __importDefault(require("./routes/tokens"));
const subscriptions_1 = __importDefault(require("./routes/subscriptions"));
const images_1 = __importDefault(require("./routes/images"));
const predictions_1 = __importDefault(require("./routes/predictions"));
const docs_1 = __importDefault(require("./routes/docs"));
const swagger_1 = __importDefault(require("./swagger"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// CORS debe ir ANTES de otros middlewares
app.use((0, cors_1.default)({
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
        ].filter(Boolean); // Remover valores undefined/null
        // Permitir cualquier origen de Vercel (desarrollo y producción)
        const isVercelOrigin = origin.includes('.vercel.app') || origin.includes('vercel.app');
        if (allowedOrigins.includes(origin) || isVercelOrigin) {
            callback(null, true);
        }
        else {
            // En desarrollo, permitir todos los orígenes
            if (process.env.NODE_ENV !== 'production') {
                callback(null, true);
            }
            else {
                callback(new Error(`Origin ${origin} not allowed by CORS`));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
}));
// Manejar preflight requests explícitamente
app.options('*', (0, cors_1.default)());
// Configurar helmet para que no bloquee CORS
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting (excluyendo /api/docs para Swagger)
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
// Aplica a todas las rutas /api/* excepto /api/docs y /api/docs/*
app.use(/^\/api\/(?!docs)/, limiter);
// Serve uploaded images
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), uploadDir)));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Swagger UI
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// API Routes
app.use('/api/users', users_1.default);
app.use('/api/creators', creators_1.default);
app.use('/api/tokens', tokens_1.default);
app.use('/api/subscriptions', subscriptions_1.default);
app.use('/api/images', images_1.default);
app.use('/api/predictions', predictions_1.default);
// JSON docs (opcional)
app.use('/api/docs/json', docs_1.default);
// Error handling
app.use((err, req, res, next) => {
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
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Uvote Backend API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API base: http://localhost:${PORT}/api`);
    console.log(`📖 Swagger UI: http://localhost:${PORT}/api/docs`);
    console.log(`📄 JSON docs: http://localhost:${PORT}/api/docs/json`);
});
exports.default = app;
//# sourceMappingURL=app.js.map