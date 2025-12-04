const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

// Set Vercel environment variable
process.env.VERCEL = '1';

// Import the compiled Express app
let app;
let handler;

try {
  console.log('[Serverless] ===== Initializing =====');
  console.log('[Serverless] CWD:', process.cwd());
  console.log('[Serverless] __dirname:', __dirname);
  
  // Intentar diferentes rutas posibles para el build
  const possiblePaths = [
    path.join(process.cwd(), 'build', 'app.js'),      // Ruta estándar
    path.join(__dirname, '..', 'build', 'app.js'),    // Relativo a api/
    path.join(process.cwd(), 'app.js'),                // En la raíz
    path.join(__dirname, '..', 'app.js'),             // Relativo desde api/
  ];
  
  let appPath = null;
  let buildDir = null;
  
  // Buscar el archivo en las rutas posibles
  for (const possiblePath of possiblePaths) {
    console.log('[Serverless] Checking path:', possiblePath);
    if (fs.existsSync(possiblePath)) {
      appPath = possiblePath;
      buildDir = path.dirname(possiblePath);
      console.log('[Serverless] Found app at:', appPath);
      break;
    }
  }
  
  if (!appPath) {
    // Listar directorios para debugging
    console.log('[Serverless] Current directory contents:', fs.readdirSync(process.cwd()));
    if (fs.existsSync(path.join(process.cwd(), '..'))) {
      console.log('[Serverless] Parent directory contents:', fs.readdirSync(path.join(process.cwd(), '..')));
    }
    throw new Error(`App file not found in any of these paths: ${possiblePaths.join(', ')}`);
  }
  
  console.log('[Serverless] Loading app from:', appPath);
  const appModule = require(appPath);
  app = appModule.default || appModule;
  
  if (!app) {
    console.error('[Serverless] Module exports:', Object.keys(appModule));
    throw new Error('App not found in module');
  }
  
  console.log('[Serverless] App loaded successfully');
  
  // Wrap with serverless-http
  handler = serverless(app, {
    binary: ['image/*', 'application/pdf'],
  });
  
  console.log('[Serverless] Handler created successfully');
} catch (error) {
  console.error('[Serverless] ===== ERROR =====');
  console.error('[Serverless] Error loading app:', error.message);
  console.error('[Serverless] Stack:', error.stack);
  
  // Create a fallback handler that returns an error
  handler = async (req, res) => {
    console.error('[Serverless] Handler called but app failed to load');
    res.status(500).json({
      error: 'Server configuration error',
      message: error.message,
      path: req.path,
      cwd: process.cwd(),
    });
  };
}

// Export handler with request logging and CORS headers
module.exports = async (req, res) => {
  console.log(`[Serverless] Request: ${req.method} ${req.path}`);
  console.log(`[Serverless] Origin: ${req.headers.origin}`);
  
  // ESTABLECER HEADERS CORS INMEDIATAMENTE, antes de cualquier otra cosa
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Manejar OPTIONS directamente aquí
  if (req.method === 'OPTIONS') {
    console.log('[Serverless] Handling OPTIONS preflight');
    return res.status(204).end();
  }
  
  try {
    return await handler(req, res);
  } catch (error) {
    console.error('[Serverless] Handler error:', error);
    // Asegurar que los headers CORS estén incluso en errores
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
};
