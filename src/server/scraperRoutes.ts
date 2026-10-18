import { Router, Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { scraperClient } from './scraperClient.js';

const router = Router();
const dbId = process.env.FIRESTORE_DATABASE_ID || '(default)';
const jobs = () => {
  const app = getApps()[0];
  if (!app) throw new Error('Firebase Admin não foi inicializado.');
  return getFirestore(app, dbId).collection('scraper_jobs');
};

type AuthRequest = Request & { firebaseUid?: string };

async function requireFirebaseUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ error: 'Envie um Firebase ID token em Authorization: Bearer.' });
    const app = getApps()[0];
    if (!app) return res.status(503).json({ error: 'Firebase Admin não está configurado.' });
    const decoded = await getAuth(app).verifyIdToken(token);
    if (!decoded.email_verified) return res.status(403).json({ error: 'Verifique o e-mail da conta antes de pesquisar.' });
    req.firebaseUid = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão Firebase inválida ou expirada.' });
  }
}

const createSchema = z.object({
  keyword: z.string().trim().min(2).max(300),
  lang: z.string().trim().min(2).max(10).default('pt'),
  max_depth: z.number().int().min(1).max(5).default(1),
  email: z.boolean().default(true),
  extra_reviews: z.boolean().default(false),
  fast_mode: z.boolean().default(true),
  geo_coordinates: z.string().trim().max(100).optional(),
  radius: z.number().positive().max(100).optional(),
  timeout: z.number().int().min(1).max(300).default(120),
  zoom: z.number().int().min(1).max(21).optional(),
});

router.get('/health', requireFirebaseUser, async (_req, res) => {
  try {
    const health = await scraperClient.health();
    return res.json({ configured: true, scraper: health });
  } catch (error) {
    return res.status(503).json({
      configured: false,
      error: error instanceof Error ? error.message : 'Scraper indisponível.',
    });
  }
});

router.post('/jobs', requireFirebaseUser, async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Parâmetros de busca inválidos.', details: parsed.error.flatten() });
  }

  try {
    const created = await scraperClient.createJob(parsed.data);
    const externalId = String(created.job_id || created.id || '');
    if (!externalId) {
      return res.status(502).json({ error: 'O scraper não retornou job_id; confira a versão da API instalada.' });
    }

    const record = {
      externalJobId: externalId,
      ownerId: req.firebaseUid,
      keyword: parsed.data.keyword,
      options: parsed.data,
      status: String(created.status || 'pending'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await jobs().doc(externalId).set(record, { merge: true });
    return res.status(202).json({ success: true, job: { ...record, id: externalId } });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Não foi possível criar a busca no scraper.' });
  }
});

router.get('/jobs/:jobId', requireFirebaseUser, async (req: AuthRequest, res: Response) => {
  try {
    const doc = await jobs().doc(req.params.jobId).get();
    if (!doc.exists || doc.data()?.ownerId !== req.firebaseUid) {
      return res.status(404).json({ error: 'Busca não encontrada.' });
    }
    const result = await scraperClient.getJob(req.params.jobId);
    await doc.ref.set({ status: String(result.status || doc.data()?.status || 'running'), updatedAt: new Date().toISOString() }, { merge: true });
    return res.json({ success: true, job: { ...doc.data(), result } });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Não foi possível consultar a busca.' });
  }
});

router.delete('/jobs/:jobId', requireFirebaseUser, async (req: AuthRequest, res: Response) => {
  try {
    const doc = await jobs().doc(req.params.jobId).get();
    if (!doc.exists || doc.data()?.ownerId !== req.firebaseUid) {
      return res.status(404).json({ error: 'Busca não encontrada.' });
    }
    const result = await scraperClient.cancelJob(req.params.jobId);
    await doc.ref.set({ status: 'cancel_requested', updatedAt: new Date().toISOString() }, { merge: true });
    return res.json({ success: true, result });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'Não foi possível cancelar a busca.' });
  }
});

export default router;
