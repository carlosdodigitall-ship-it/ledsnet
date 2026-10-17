import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega as configurações do Firebase geradas no provisionamento
const configPath = path.resolve(__dirname, '../../firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error('Erro ao ler firebase-applet-config.json:', err);
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'gen-lang-client-0177432537';
const databaseId = process.env.FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)';

let firestoreInstance: Firestore | null = null;
let useMemoryFallback = false;

// Inicializa o Firebase Admin SDK no servidor
try {
  if (getApps().length === 0) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      try {
        const parsedKey = JSON.parse(serviceAccountKey);
        initializeApp({
          credential: cert(parsedKey),
          projectId,
        });
      } catch (keyErr) {
        initializeApp({ projectId });
      }
    } else {
      initializeApp({ projectId });
    }
  }

  // Conecta ao banco de dados específico provisionado
  firestoreInstance = getFirestore(getApps()[0], databaseId);
  console.log(`[Firestore Admin] Inicializado com sucesso no projeto '${projectId}', database '${databaseId}'`);
} catch (error: any) {
  console.warn('[Firestore Admin] Fallback resiliente ativado para ambiente de desenvolvimento:', error?.message);
  useMemoryFallback = true;
}

// Armazenamento em memória resiliente como garantia contra ausência de credenciais locais de serviço
const memoryDb = {
  leads: new Map<string, any>(),
  interacoes: new Map<string, any>(),
  modelos_mensagem: new Map<string, any>(),
  configuracoes: new Map<string, any>(),
  logs_envio: new Map<string, any>()
};

// Seed inicial de modelos de mensagem e configurações padrão
function initDefaultData() {
  if (!memoryDb.configuracoes.has('padrao')) {
    memoryDb.configuracoes.set('padrao', {
      id: 'padrao',
      pesoSemSite: 40,
      pesoBaixaNota: 25,
      pesoPoucasAvaliacoes: 15,
      limiteDiarioEnvios: 50,
      intervaloMinimoSegundos: 15,
      intervaloMaximoSegundos: 60,
      instanciaEvolution: process.env.EVOLUTION_INSTANCE || 'ledsnet-prod',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    });
  }

  if (memoryDb.modelos_mensagem.size === 0) {
    const templates = [
      {
        id: 'tpl-1',
        titulo: 'Oportunidade Comercial Direta',
        texto: 'Olá, {nome}! Notei que sua empresa em {bairro} tem grande potencial de novos clientes e gostaria de apresentar uma solução rápida para aumentar seus atendimentos.'
      },
      {
        id: 'tpl-2',
        titulo: 'Presença Online e Site',
        texto: 'Olá, equipe da {empresa}! Vi que muitos clientes procuram seus serviços no Google em {bairro}. Tenho uma proposta para estruturar seu canal oficial na web e captar mais contatos.'
      },
      {
        id: 'tpl-3',
        titulo: 'Parceria e Serviços B2B',
        texto: 'Olá, tudo bem? Me chamo da equipe comercial e presto serviços para negócios como a {empresa} na região de {bairro}. Podemos agendar 5 minutos no WhatsApp esta semana?'
      }
    ];
    templates.forEach(t => memoryDb.modelos_mensagem.set(t.id, t));
  }
}
initDefaultData();

export const serverDb = {
  // ==========================================
  // LEADS
  // ==========================================
  async getLeads(filters?: { status?: string; ramo?: string; regiao?: string; search?: string }) {
    if (firestoreInstance && !useMemoryFallback) {
      try {
        let query: any = firestoreInstance.collection('leads');
        if (filters?.status) {
          query = query.where('status', '==', filters.status);
        }
        if (filters?.ramo) {
          query = query.where('ramo', '==', filters.ramo);
        }
        const snap = await query.get();
        let leads = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

        if (filters?.regiao) {
          const regLower = filters.regiao.toLowerCase();
          leads = leads.filter((l: any) => l.regiao?.toLowerCase().includes(regLower));
        }
        if (filters?.search) {
          const searchLower = filters.search.toLowerCase();
          leads = leads.filter((l: any) => 
            l.nome?.toLowerCase().includes(searchLower) ||
            l.telefone?.includes(searchLower) ||
            l.endereco?.toLowerCase().includes(searchLower)
          );
        }
        return leads.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      } catch (err) {
        console.warn('[Firestore] Falha em getLeads, usando memory fallback:', err);
      }
    }

    let leads = Array.from(memoryDb.leads.values());
    if (filters?.status) leads = leads.filter(l => l.status === filters.status);
    if (filters?.ramo) leads = leads.filter(l => l.ramo === filters.ramo);
    if (filters?.regiao) {
      const regLower = filters.regiao.toLowerCase();
      leads = leads.filter(l => l.regiao?.toLowerCase().includes(regLower));
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      leads = leads.filter(l => 
        l.nome?.toLowerCase().includes(searchLower) ||
        l.telefone?.includes(searchLower) ||
        l.endereco?.toLowerCase().includes(searchLower)
      );
    }
    return leads.sort((a, b) => (b.score || 0) - (a.score || 0));
  },

  async getLeadById(id: string) {
    if (firestoreInstance && !useMemoryFallback) {
      try {
        const doc = await firestoreInstance.collection('leads').doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.warn(`[Firestore] Falha em getLeadById(${id}), usando memory:`, err);
      }
    }
    return memoryDb.leads.get(id) || null;
  },

  async findLeadByPlaceId(placeId: string) {
    if (!placeId) return null;
    if (firestoreInstance && !useMemoryFallback) {
      try {
        const snap = await firestoreInstance.collection('leads').where('place_id', '==', placeId).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.warn('[Firestore] Falha em findLeadByPlaceId:', err);
      }
    }
    for (const lead of memoryDb.leads.values()) {
      if (lead.place_id === placeId) return lead;
    }
    return null;
  },

  async findLeadByPhone(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return null;

    if (firestoreInstance && !useMemoryFallback) {
      try {
        const snap = await firestoreInstance.collection('leads').where('telefone', '==', cleanPhone).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.warn('[Firestore] Falha em findLeadByPhone:', err);
      }
    }
    for (const lead of memoryDb.leads.values()) {
      if (lead.telefone === cleanPhone) return lead;
    }
    return null;
  },

  async saveLead(leadData: any) {
    const now = new Date().toISOString();
    const id = leadData.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullLead = {
      ...leadData,
      id,
      criadoEm: leadData.criadoEm || now,
      atualizadoEm: now
    };

    if (firestoreInstance && !useMemoryFallback) {
      try {
        await firestoreInstance.collection('leads').doc(id).set(fullLead, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Falha em saveLead:', err);
      }
    }
    memoryDb.leads.set(id, fullLead);
    return fullLead;
  },

  async updateLeadStatus(id: string, status: string, motivoPerda?: string) {
    const now = new Date().toISOString();
    const updateData: any = { status, atualizadoEm: now };
    if (motivoPerda !== undefined) updateData.motivoPerda = motivoPerda;

    if (firestoreInstance && !useMemoryFallback) {
      try {
        await firestoreInstance.collection('leads').doc(id).update(updateData);
      } catch (err) {
        console.warn(`[Firestore] Falha ao atualizar status do lead ${id}:`, err);
      }
    }

    const existing = memoryDb.leads.get(id);
    if (existing) {
      Object.assign(existing, updateData);
      memoryDb.leads.set(id, existing);
    }
    return existing;
  },

  async deleteLead(id: string) {
    if (firestoreInstance && !useMemoryFallback) {
      try {
        await firestoreInstance.collection('leads').doc(id).delete();
      } catch (err) {
        console.warn(`[Firestore] Falha ao excluir lead ${id}:`, err);
      }
    }
    memoryDb.leads.delete(id);
    return true;
  },

  // ==========================================
  // INTERAÇÕES
  // ==========================================
  async getInteractionsByLead(leadId: string) {
    if (firestoreInstance && !useMemoryFallback) {
      try {
        const snap = await firestoreInstance
          .collection('interacoes')
          .where('leadId', '==', leadId)
          .orderBy('criadoEm', 'desc')
          .get();
        return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('[Firestore] Falha em getInteractionsByLead:', err);
      }
    }
    return Array.from(memoryDb.interacoes.values())
      .filter(i => i.leadId === leadId)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  },

  async addInteraction(leadId: string, tipo: 'mensagem_enviada' | 'resposta' | 'anotacao', conteudo: string) {
    const id = `int_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const interaction = {
      id,
      leadId,
      tipo,
      conteudo,
      criadoEm: new Date().toISOString()
    };

    if (firestoreInstance && !useMemoryFallback) {
      try {
        await firestoreInstance.collection('interacoes').doc(id).set(interaction);
      } catch (err) {
        console.warn('[Firestore] Falha em addInteraction:', err);
      }
    }
    memoryDb.interacoes.set(id, interaction);
    return interaction;
  },

  // ==========================================
  // CONFIGURAÇÕES & MODELOS DE MENSAGEM
  // ==========================================
  async getConfig() {
    if (firestoreInstance && !useMemoryFallback) {
      try {
        const doc = await firestoreInstance.collection('configuracoes').doc('padrao').get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
      } catch (err) {
        console.warn('[Firestore] Falha em getConfig:', err);
      }
    }
    return memoryDb.configuracoes.get('padrao');
  },

  async updateConfig(newConfig: any) {
    const updated = {
      ...memoryDb.configuracoes.get('padrao'),
      ...newConfig,
      atualizadoEm: new Date().toISOString()
    };

    if (firestoreInstance && !useMemoryFallback) {
      try {
        await firestoreInstance.collection('configuracoes').doc('padrao').set(updated, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Falha em updateConfig:', err);
      }
    }
    memoryDb.configuracoes.set('padrao', updated);
    return updated;
  },

  async getMessageTemplates() {
    if (firestoreInstance && !useMemoryFallback) {
      try {
        const snap = await firestoreInstance.collection('modelos_mensagem').get();
        if (!snap.empty) {
          return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        }
      } catch (err) {
        console.warn('[Firestore] Falha em getMessageTemplates:', err);
      }
    }
    return Array.from(memoryDb.modelos_mensagem.values());
  },

  async saveMessageTemplate(template: { id?: string; titulo: string; texto: string }) {
    const id = template.id || `tpl_${Date.now()}`;
    const tpl = { id, titulo: template.titulo, texto: template.texto };

    if (firestoreInstance && !useMemoryFallback) {
      try {
        await firestoreInstance.collection('modelos_mensagem').doc(id).set(tpl, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Falha em saveMessageTemplate:', err);
      }
    }
    memoryDb.modelos_mensagem.set(id, tpl);
    return tpl;
  },

  // ==========================================
  // LOGS DE ENVIO & COTA DIÁRIA
  // ==========================================
  async getTodaySendCount() {
    const today = new Date().toISOString().split('T')[0];
    if (firestoreInstance && !useMemoryFallback) {
      try {
        const snap = await firestoreInstance
          .collection('logs_envio')
          .where('status', '==', 'sucesso')
          .where('criadoEm', '>=', `${today}T00:00:00.000Z`)
          .get();
        return snap.size;
      } catch (err) {
        console.warn('[Firestore] Falha em getTodaySendCount:', err);
      }
    }
    return Array.from(memoryDb.logs_envio.values()).filter(
      log => log.status === 'sucesso' && log.criadoEm.startsWith(today)
    ).length;
  },

  async addSendLog(leadId: string, status: 'sucesso' | 'erro', erro?: string | null) {
    const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const log = {
      id,
      leadId,
      status,
      erro: erro || null,
      criadoEm: new Date().toISOString()
    };

    if (firestoreInstance && !useMemoryFallback) {
      try {
        await firestoreInstance.collection('logs_envio').doc(id).set(log);
      } catch (err) {
        console.warn('[Firestore] Falha em addSendLog:', err);
      }
    }
    memoryDb.logs_envio.set(id, log);
    return log;
  }
};
