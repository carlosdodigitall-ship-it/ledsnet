import { collection, doc, getDocs, writeBatch, type DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';

const ownedCollections = ['leads', 'tasks', 'interactions', 'templates'] as const;
export type OwnedCollection = typeof ownedCollections[number];

export async function loadOwnedCollection<T>(ownerId: string, name: OwnedCollection): Promise<T[]> {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs
    .filter((item) => item.data().ownerId === ownerId)
    .map((item) => ({ ...item.data(), id: item.id } as T));
}

/** Replace the signed-in user's collection using atomic batches and a server-enforced ownerId. */
export async function saveOwnedCollection<T extends { id: string }>(
  ownerId: string,
  name: OwnedCollection,
  values: T[],
): Promise<void> {
  if (!ownerId) throw new Error('É necessário entrar na conta para salvar os dados.');
  const snapshot = await getDocs(collection(db, name));
  const ownDocs = snapshot.docs.filter((item) => item.data().ownerId === ownerId);
  const batch = writeBatch(db);
  ownDocs.forEach((item) => batch.delete(item.ref));
  values.forEach((value) => {
    const { id, ...fields } = value as T & DocumentData;
    batch.set(doc(db, name, id), { ...fields, id, ownerId });
  });
  if (ownDocs.length + values.length > 450) {
    throw new Error('Muitos registros para uma única operação. Divida a atualização em lotes.');
  }
  await batch.commit();
}

export async function saveUserProfile(uid: string, values: Record<string, unknown>) {
  await (await import('firebase/firestore')).setDoc(doc(db, 'users', uid), {
    ...values,
    uid,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}
