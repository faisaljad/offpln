// Vercel serverless entry point — routes all requests to NestJS
// Uses .js to avoid TypeScript compilation issues with dist imports
const handler = require('../dist/serverless').default;
module.exports = handler;
