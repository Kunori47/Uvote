const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

// Set Vercel environment variable
process.env.VERCEL = '1';

// Import the compiled Express app
let app;
let handler;

try {
  const appPath = path.join(process.cwd(), 'build', 'app.js');
  console.log('[Serverless] ===== Initializing =====');
  console.log('[Serverless] Loading app from:', appPath);
  console.log('[Serverless] CWD:', process.cwd());
  console.log('[Serverless] Build exists:', fs.existsSync(path.join(process.cwd(), 'build')));
  
  // Check if build directory exists
  const buildDir = path.join(process.cwd(), 'build');
  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory does not exist: ${buildDir}`);
  }
  
  // Check if app.js exists
  if (!fs.existsSync(appPath)) {
    throw new Error(`App file does not exist: ${appPath}`);
  }
  
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
