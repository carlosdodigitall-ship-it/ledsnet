import { isFirebaseAdminInitialized } from './_lib/firebaseAdmin';
import { sendJsonResponse } from './_lib/httpHelper';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendJsonResponse(res, 405, { error: 'Método não permitido' });
  }

  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  const firebaseAdminReady = isFirebaseAdminInitialized();

  return sendJsonResponse(res, 200, {
    status: 'ok',
    service: 'LedsNet API',
    runtime: 'Vercel Serverless Function',
    hasApiKey,
    firebaseAdminReady,
    timestamp: new Date().toISOString(),
  });
}
