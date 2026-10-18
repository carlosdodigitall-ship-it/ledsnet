import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import fs from 'fs';
import path from 'path';

export interface DecodedUserToken extends JWTPayload {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

// Conjunto de chaves públicas oficiais do Google Identity para verificação de tokens Firebase Auth
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export function getFirebaseProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.projectId) return cfg.projectId;
    }
  } catch {
    // Arquivo não disponível no ambiente serverless isolado
  }
  return 'gen-lang-client-0177432537';
}

export function isFirebaseConfigured(): boolean {
  return Boolean(getFirebaseProjectId());
}

export function initFirebaseAdmin(): boolean {
  return isFirebaseConfigured();
}

export async function verifyFirebaseUserToken(authHeader: string | undefined): Promise<{
  user: DecodedUserToken | null;
  error?: string;
  status?: number;
}> {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return {
      user: null,
      error: 'Entre na sua conta para executar esta ação.',
      status: 401,
    };
  }

  const projectId = getFirebaseProjectId();
  if (!projectId) {
    return {
      user: null,
      error: 'Autenticação do servidor não configurada. Configure o FIREBASE_PROJECT_ID.',
      status: 503,
    };
  }

  try {
    const { payload } = await jwtVerify(token, GOOGLE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const user: DecodedUserToken = {
      ...payload,
      uid: String(payload.sub || ''),
      email: typeof payload.email === 'string' ? payload.email : undefined,
      email_verified: Boolean(payload.email_verified),
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };

    if (process.env.REQUIRE_EMAIL_VERIFIED === 'true' && user.email_verified !== true) {
      return {
        user: null,
        error: 'Confirme seu e-mail antes de executar esta ação.',
        status: 403,
      };
    }

    return { user };
  } catch (err: any) {
    // Não expor dados confidenciais ou segredos
    const isExpired = err?.code === 'ERR_JWT_EXPIRED';
    return {
      user: null,
      error: isExpired
        ? 'Sua sessão expirou. Entre novamente.'
        : 'Sua sessão não é válida. Entre novamente.',
      status: 401,
    };
  }
}
