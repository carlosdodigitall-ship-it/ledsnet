import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicialização do SDK do Firebase no cliente
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Conexão com o banco de dados específico do Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Validação de conexão e aplicação das regras Zero-Trust.
 * Em conformidade com o PASSO 2, o cliente deve receber 'permission-denied'
 * em leituras diretas, pois todo tráfego de dados é intermediado pelo backend.
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; zeroTrustEnforced: boolean }> {
  try {
    await getDocFromServer(doc(db, 'teste', 'ping'));
    return { connected: true, zeroTrustEnforced: false };
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      return { connected: true, zeroTrustEnforced: true };
    }
    return { connected: false, zeroTrustEnforced: false };
  }
}

export default app;
