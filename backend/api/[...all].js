const serverless = require('serverless-http');
const path = require('path');

// Import the compiled Express app
const appModule = require(path.join(process.cwd(), 'build', 'app.js'));
const app = appModule.default || appModule;

module.exports = serverless(app);
module.exports.default = serverless(app);

