import { onRequest } from 'firebase-functions/v2/https';
import app from './src/server.js';

// Wrap and export the Express application as a Firebase Cloud Function named 'api'
export const api = onRequest({
  cors: true,
  // You can customize memory and timeout settings if needed
  memory: '256MiB',
  timeoutSeconds: 60
}, app);
