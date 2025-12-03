const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

// Set Vercel environment variable
process.env.VERCEL = '1';

// Import the compiled Express app
let app;
try {
  const appPath = path.join(process.cwd(), 'build', 'app.js');
  console.log('[Serverless] Loading app from:', appPath);
  console.log('[Serverless] CWD:', process.cwd());
  console.log('[Serverless] Build exists:', fs.existsSync(path.join(process.cwd(), 'build')));
  
  const appModule = require(appPath);
  app = appModule.default || appModule;
  
  if (!app) {
    throw new Error('App not found in module - module exports:', Object.keys(appModule));
  }
  
  console.log('[Serverless] App loaded successfully');
} catch (error) {
  console.error('[Serverless] Error loading app:', error);
  console.error('[Serverless] Stack:', error.stack);
  throw error;
}

// Wrap with serverless-http
const handler = serverless(app);

module.exports = handler;
