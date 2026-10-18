import { processLeadCapture } from '../_lib/leadCapture';
import { parseRequestBody, sendJsonResponse } from '../_lib/httpHelper';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Método não permitido' });
  }

  const body = parseRequestBody(req);
  const result = processLeadCapture(body);
  return sendJsonResponse(res, result.status, result.data);
}
