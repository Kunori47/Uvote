const serverless = require('serverless-http');
const path = require('path');

// Import the compiled Express app
// Intentar varias rutas posibles para encontrar el build
const possiblePaths = [
    path.join(process.cwd(), 'build', 'app.js'),
    path.join(__dirname, '..', 'build', 'app.js'),
    path.join(__dirname, 'build', 'app.js')
];

let appModule;
for (const p of possiblePaths) {
    try {
        appModule = require(p);
        console.log(`✅ Loaded app from: ${p}`);
        break;
    } catch (e) {
        console.log(`⚠️ Could not load from: ${p}`);
    }
}

if (!appModule) {
    throw new Error('Could not find build/app.js in any expected location. Current directory: ' + process.cwd());
}

const app = appModule.default || appModule;

module.exports = serverless(app);
module.exports.default = serverless(app);

