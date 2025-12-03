const serverless = require('serverless-http');
const path = require('path');

// Import the compiled Express app
const app = require(path.join(process.cwd(), 'build', 'app.js'));

module.exports = serverless(app);
