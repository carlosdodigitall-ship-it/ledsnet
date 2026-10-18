import { cert, getApps as getAdminApps, initializeApp as initializeAdminApp, applicationDefault } from 'firebase-admin/app';
import { getAuth as getAdminAuth, type DecodedIdToken } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let firebaseAdminReady = false;

export function initFirebaseAdmin(): boolean {
  if (firebaseAdminReady) return true;
  if (getAdminApps().length > 0) {
    firebaseAdminReady = true;
    return true;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      initializeAdminApp({ credential: cert(JSON.parse(serviceAccountJson)) });
    } else {
      let configProjectId = '';
      try {
        const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          configProjectId = cfg.projectId || '';
        }
      } catch {
        // Ignora ausência do arquivo local de configuração
      }

      const projectId = process.env.FIREBASE_PROJECT_ID || configProjectId || 'gen-lang-client-0177432537';
      initializeAdminApp({ credential: applicationDefault(), projectId });
    }
    firebaseAdminReady = getAdminApps().length > 0;
    return firebaseAdminReady;
  } catch (error) {
    console.error('[Firebase Admin] Erro ao inicializar SDK admin:', error);
    return false;
  }
}

export function isFirebaseAdminInitialized(): boolean {
  if (getAdminApps().length > 0) return true;
  return initFirebaseAdmin();
}

export async function verifyFirebaseUserToken(authHeader: string | undefined): Promise<{
  user: DecodedIdToken | null;
  error?: string;
  status?: number;
}> {
  if (!isFirebaseAdminInitialized()) {
    return {
      user: null,
      error: 'Autenticação do servidor não configurada. Configure as credenciais do Firebase Admin.',
      status: 503,
    };
  }

  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return {
      user: null,
      error: 'Entre na sua conta para executar esta ação.',
      status: 401,
    };
  }

  try {
    const decoded: DecodedIdToken = await getAdminAuth().verifyIdToken(token);
    if (process.env.REQUIRE_EMAIL_VERIFIED === 'true' && decoded.email_verified !== true) {
      return {
        user: null,
        error: 'Confirme seu e-mail antes de executar esta ação.',
        status: 403,
      };
    }
    return { user: decoded };
  } catch (err: any) {
    console.warn('[Firebase Auth] Erro ao validar token:', err?.message);
    return {
      user: null,
      error: 'Sua sessão expirou ou não é válida. Entre novamente.',
      status: 401,
    };
  }
}
