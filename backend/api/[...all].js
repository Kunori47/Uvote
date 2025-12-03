const serverless = require('serverless-http');
const path = require('path');

// Set Vercel environment variable
process.env.VERCEL = '1';

// Import the compiled Express app
let app;
try {
  app = require(path.join(process.cwd(), 'build', 'app.js')).default || require(path.join(process.cwd(), 'build', 'app.js'));
} catch (error) {
  console.error('Error loading app:', error);
  // Fallback: try to load from src if build doesn't exist (for development)
  app = require(path.join(process.cwd(), 'src', 'app.ts'));
}

module.exports = serverless(app);
