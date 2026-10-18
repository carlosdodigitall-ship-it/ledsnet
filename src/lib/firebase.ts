import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Usa a configuração Firebase já conectada ao projeto.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function testFirestoreConnection(): Promise<{ connected: boolean; zeroTrustEnforced: boolean }> {
  try {
    await getDocFromServer(doc(db, 'teste', 'ping'));
    return { connected: true, zeroTrustEnforced: false };
  } catch (error: any) {
    if (error?.code === 'permission-denied') return { connected: true, zeroTrustEnforced: true };
    return { connected: false, zeroTrustEnforced: false };
  }
}

export default app;
