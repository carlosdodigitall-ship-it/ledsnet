import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../../firebase-applet-config.json');

function readFirebaseConfig(): Record<string, any> {
  try {
    return fs.existsSync(configPath)
      ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
      : {};
  } catch (error) {
    console.error('[Firebase Admin] Não foi possível ler a configuração pública do projeto.', error);
    return {};
  }
}

const firebaseConfig = readFirebaseConfig();
const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const databaseId = process.env.FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)';

let adminApp: App | null = null;
let firestore: Firestore | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps().find(app => app.name === '[DEFAULT]');
  if (existing) {
    adminApp = existing;
    return existing;
  }
  if (!projectId) {
    throw new Error('Firebase não configurado: defina FIREBASE_PROJECT_ID no ambiente do servidor.');
  }

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawKey) {
    let serviceAccount: Record<string, unknown>;
    try {
      serviceAccount = JSON.parse(rawKey);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY precisa conter o JSON válido da conta de serviço Firebase Admin.');
    }
    adminApp = initializeApp({ credential: cert(serviceAccount as any), projectId });
  } else {
    // Em produção, o ambiente precisa fornecer ADC ou uma conta de serviço válida.
    // A ausência de credenciais nunca ativa armazenamento em memória.
    adminApp = initializeApp({ projectId });
  }
  return adminApp;
}

/**
 * Retorna somente o Firestore real. Erros de credencial, permissão ou banco
 * são propagados para a API: nunca há fallback em memória nem gravação fictícia.
 */
export function getServerFirebaseApp(): App { return getAdminApp(); }

export function getServerFirestore(): Firestore {
  if (firestore) return firestore;
  const app = getServerFirebaseApp();
  firestore = getFirestore(app, databaseId);
  return firestore;
}
