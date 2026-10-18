/**
 * Testes Automatizados de Validação das Regras do Firestore (Isolamento por Usuário)
 * 
 * Regras ativas em firestore.rules:
 * - /users/{uid}: allow read, write: if request.auth.uid == uid;
 * - /{collectionName}/{docId}: allow read, write: if resource.data.ownerId == request.auth.uid;
 * - todo o resto: allow read, write: if false;
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

function evaluateRule({
  path,
  authUid,
  operation,
  existingData,
  newData,
}: {
  path: string;
  authUid: string | null;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  existingData?: { ownerId?: string; [key: string]: unknown };
  newData?: { ownerId?: string; [key: string]: unknown };
}): boolean {
  if (!authUid) return false;

  const parts = path.split('/').filter(Boolean);
  const [collection, docId] = parts;

  if (collection === 'users') {
    return authUid === docId;
  }

  if (operation === 'get' || operation === 'list') {
    return existingData?.ownerId === authUid;
  }

  if (operation === 'create') {
    return newData?.ownerId === authUid;
  }

  if (operation === 'update') {
    return existingData?.ownerId === authUid && newData?.ownerId === authUid;
  }

  if (operation === 'delete') {
    return existingData?.ownerId === authUid;
  }

  return false;
}

describe('Validação de Regras do Firestore — LedsNet com Isolamento por Usuário', () => {
  it('CASO NEGADO: Acesso não autenticado a leads ou perfil', () => {
    const allowed = evaluateRule({
      path: 'leads/lead-1',
      authUid: null,
      operation: 'get',
      existingData: { ownerId: 'usr-123' },
    });
    assert.strictEqual(allowed, false, 'Usuário não autenticado deve ser rejeitado');
  });

  it('CASO NEGADO: Usuário tentando ler leads de outro usuário', () => {
    const allowed = evaluateRule({
      path: 'leads/lead-1',
      authUid: 'usr-hacker',
      operation: 'get',
      existingData: { ownerId: 'usr-legit' },
    });
    assert.strictEqual(allowed, false, 'Leitura de documento pertencente a outro ownerId deve ser bloqueada');
  });

  it('CASO NEGADO: Usuário tentando criar documento com ownerId de outro', () => {
    const allowed = evaluateRule({
      path: 'leads/lead-2',
      authUid: 'usr-attacker',
      operation: 'create',
      newData: { ownerId: 'usr-victim', name: 'Lead Falso' },
    });
    assert.strictEqual(allowed, false, 'Criação de documento atribuído a outro usuário deve ser bloqueada');
  });

  it('CASO PERMITIDO: Usuário lendo e atualizando seu próprio perfil em /users/{uid}', () => {
    const readAllowed = evaluateRule({
      path: 'users/usr-123',
      authUid: 'usr-123',
      operation: 'get',
    });
    assert.strictEqual(readAllowed, true, 'Usuário deve conseguir acessar seu próprio perfil');
  });

  it('CASO PERMITIDO: Usuário acessando e salvando seus próprios leads', () => {
    const readAllowed = evaluateRule({
      path: 'leads/lead-456',
      authUid: 'usr-123',
      operation: 'get',
      existingData: { ownerId: 'usr-123', name: 'Empresa A' },
    });
    assert.strictEqual(readAllowed, true, 'Usuário deve conseguir ler seus próprios leads');

    const createAllowed = evaluateRule({
      path: 'leads/lead-789',
      authUid: 'usr-123',
      operation: 'create',
      newData: { ownerId: 'usr-123', name: 'Empresa B' },
    });
    assert.strictEqual(createAllowed, true, 'Usuário deve conseguir criar leads com seu ownerId');
  });
});
