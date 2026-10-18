import { isFirebaseConfigured, getFirebaseProjectId } from './_lib/firebaseAdmin.js';
import { sendJsonResponse } from './_lib/httpHelper.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendJsonResponse(res, 405, { error: 'Método não permitido' });
  }

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  const firebaseConfigured = isFirebaseConfigured();
  const projectId = getFirebaseProjectId();

  return sendJsonResponse(res, 200, {
    status: 'ok',
    service: 'LedsNet API',
    runtime: 'Vercel Serverless Function',
    hasApiKey,
    firebaseConfigured,
    projectId,
    timestamp: new Date().toISOString(),
  });
}
