import app from '../server.js';

// Vercel encaminha /api/* para este Express handler. O servidor não chama listen()
// quando VERCEL está definido, para respeitar o ciclo de vida serverless.
export default app;
