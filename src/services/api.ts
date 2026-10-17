/**
 * Cliente de API do LedsNet
 * 
 * Implementação Zero-Trust:
 * Todas as requisições direcionadas para o backend seguro enviam
 * a chave de acesso privada (ACCESS_KEY) no cabeçalho 'x-access-key'.
 */

import { getStoredAccessKey } from './storage';

function getHeaders(customKey?: string): HeadersInit {
  const key = customKey || getStoredAccessKey() || '';
  return {
    'Content-Type': 'application/json',
    'x-access-key': key,
  };
}

export const api = {
  // 1. Autenticação
  async validateKey(key: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      return { valid: res.ok && data.valid, error: data.error };
    } catch (err: any) {
      return { valid: false, error: err?.message || 'Falha de conexão com o servidor.' };
    }
  },

  // 2. Leads (Firestore via Backend)
  async getLeads(filters?: { status?: string; ramo?: string; regiao?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'todos') params.append('status', filters.status);
    if (filters?.ramo && filters.ramo !== 'todos') params.append('ramo', filters.ramo);
    if (filters?.regiao) params.append('regiao', filters.regiao);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`/api/leads?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao buscar leads.');
    const data = await res.json();
    return data.leads || [];
  },

  async getLeadById(id: string) {
    const res = await fetch(`/api/leads/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao carregar lead.');
    return await res.json();
  },

  async createLead(leadData: any) {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(leadData),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar lead.');
    return await res.json();
  },

  async updateLead(id: string, updateData: any) {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao atualizar lead.');
    return await res.json();
  },

  async deleteLead(id: string) {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Erro ao excluir lead.');
    return await res.json();
  },

  // 3. Busca no Google Places com Deduplicação e Score
  async searchPlaces(location: string, segment: string, radiusKm: number) {
    const res = await fetch('/api/leads/search', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ location, segment, radiusKm }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.details || 'Falha ao buscar no Google Places.');
    }
    return await res.json();
  },

  // 4. WhatsApp via Evolution API
  async getWhatsAppStatus() {
    const res = await fetch('/api/whatsapp/status', {
      headers: getHeaders(),
    });
    if (!res.ok) return { state: 'disconnected', configured: false };
    return await res.json();
  },

  async sendWhatsAppMessage(leadId: string, texto: string, delaySeconds?: number) {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ leadId, texto, delaySeconds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem pelo WhatsApp.');
    return data;
  },

  // 5. KPIs e Estatísticas
  async getStats() {
    const res = await fetch('/api/stats', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Erro ao carregar estatísticas do dashboard.');
    return await res.json();
  },

  // 6. Configurações & Modelos de Mensagem
  async getConfig() {
    const res = await fetch('/api/config', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Erro ao carregar configurações.');
    return await res.json();
  },

  async updateConfig(newConfig: any) {
    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(newConfig),
    });
    if (!res.ok) throw new Error('Erro ao salvar configurações.');
    return await res.json();
  },

  async getTemplates() {
    const res = await fetch('/api/templates', {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Erro ao carregar modelos de mensagem.');
    const data = await res.json();
    return data.templates || [];
  },

  async saveTemplate(template: { id?: string; titulo: string; texto: string }) {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error('Erro ao salvar modelo.');
    return await res.json();
  },

  // 7. Formulário de Captura Público (Sem Autenticação + Consentimento LGPD)
  async submitPublicCapture(payload: {
    nome: string;
    telefone: string;
    ramo?: string;
    regiao?: string;
    mensagem?: string;
    consentimentoLgpd: boolean;
  }) {
    const res = await fetch('/api/leads/public/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar formulário de contato.');
    return data;
  }
};
