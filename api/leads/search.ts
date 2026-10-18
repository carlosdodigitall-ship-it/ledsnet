import { verifyFirebaseUserToken } from '../_lib/firebaseAdmin.js';
import { searchLeadsWithGemini } from '../_lib/geminiSearch.js';
import { parseRequestBody, sendJsonResponse } from '../_lib/httpHelper.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Método não permitido' });
  }

  const authHeader = req.headers?.authorization || (typeof req.header === 'function' ? req.header('Authorization') : undefined);
  const authResult = await verifyFirebaseUserToken(authHeader);
  if (!authResult.user) {
    return sendJsonResponse(res, authResult.status || 401, { error: authResult.error });
  }

  const body = parseRequestBody(req);
  const { segment = 'Climatização e Refrigeração', location = 'Salvador, BA', radiusKm = 15 } = body;

  const result = await searchLeadsWithGemini({
    segment: String(segment || ''),
    location: String(location || ''),
    radiusKm: Number(radiusKm) || 15,
  });

  return sendJsonResponse(res, result.status, result.data);
}
