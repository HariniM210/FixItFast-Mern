// backend/api/index.js
// Vercel serverless entrypoint wrapping the Express app
const app = require('../src/server');

module.exports = app;
