import { auth } from '../lib/firebase';

// Firebase ID tokens são obtidos no momento de cada chamada; não são guardados no localStorage.
async function getHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `Erro HTTP ${response.status}`);
  return data;
}

export const api = {
  async getLeads(filters?: { status?: string; ramo?: string; regiao?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'todos') params.append('status', filters.status);
    if (filters?.ramo && filters.ramo !== 'todos') params.append('ramo', filters.ramo);
    if (filters?.regiao) params.append('regiao', filters.regiao);
    if (filters?.search) params.append('search', filters.search);
    const res = await fetch(`/api/leads?${params.toString()}`, { headers: await getHeaders() });
    const data = await readJson(res);
    return data.leads || [];
  },

  async getLeadById(id: string) {
    return readJson(await fetch(`/api/leads/${encodeURIComponent(id)}`, { headers: await getHeaders() }));
  },

  async createLead(leadData: any) {
    return readJson(await fetch('/api/leads', { method: 'POST', headers: await getHeaders(), body: JSON.stringify(leadData) }));
  },

  async updateLead(id: string, updateData: any) {
    return readJson(await fetch(`/api/leads/${encodeURIComponent(id)}`, { method: 'PATCH', headers: await getHeaders(), body: JSON.stringify(updateData) }));
  },

  async deleteLead(id: string) {
    return readJson(await fetch(`/api/leads/${encodeURIComponent(id)}`, { method: 'DELETE', headers: await getHeaders() }));
  },

  async searchPlaces(location: string, segment: string, radiusKm: number) {
    const res = await fetch('/api/leads/search', {
      method: 'POST', headers: await getHeaders(),
      body: JSON.stringify({ location, segment, radiusKm }),
    });
    return readJson(res);
  },

  async createScraperJob(input: { keyword: string; email?: boolean; lang?: string; max_depth?: number; fast_mode?: boolean; timeout?: number }) {
    return readJson(await fetch('/api/scraper/jobs', {
      method: 'POST', headers: await getHeaders(), body: JSON.stringify(input),
    }));
  },

  async getScraperJob(jobId: string) {
    return readJson(await fetch(`/api/scraper/jobs/${encodeURIComponent(jobId)}`, { headers: await getHeaders() }));
  },

  async getWhatsAppStatus() {
    const res = await fetch('/api/whatsapp/status', { headers: await getHeaders() });
    if (!res.ok) return { state: 'disconnected', configured: false };
    return res.json();
  },

  async sendWhatsAppMessage(leadId: string, texto: string, delaySeconds?: number) {
    return readJson(await fetch('/api/whatsapp/send', {
      method: 'POST', headers: await getHeaders(), body: JSON.stringify({ leadId, texto, delaySeconds }),
    }));
  },

  async getTasks() {
    const data = await readJson(await fetch('/api/tasks', { headers: await getHeaders() }));
    return data.tasks || [];
  },

  async replaceTasks(tasks: unknown[]) {
    return readJson(await fetch('/api/tasks', { method: 'PUT', headers: await getHeaders(), body: JSON.stringify({ tasks }) }));
  },

  async getInteractions() {
    const data = await readJson(await fetch('/api/interactions', { headers: await getHeaders() }));
    return data.interactions || [];
  },

  async replaceInteractions(interactions: unknown[]) {
    return readJson(await fetch('/api/interactions', { method: 'PUT', headers: await getHeaders(), body: JSON.stringify({ interactions }) }));
  },

  async replaceTemplates(templates: unknown[]) {
    return readJson(await fetch('/api/templates', { method: 'PUT', headers: await getHeaders(), body: JSON.stringify({ templates }) }));
  },

  async getStats() {
    return readJson(await fetch('/api/stats', { headers: await getHeaders() }));
  },

  async getConfig() {
    return readJson(await fetch('/api/config', { headers: await getHeaders() }));
  },

  async updateConfig(newConfig: any) {
    return readJson(await fetch('/api/config', { method: 'PATCH', headers: await getHeaders(), body: JSON.stringify(newConfig) }));
  },

  async getTemplates() {
    const data = await readJson(await fetch('/api/templates', { headers: await getHeaders() }));
    return data.templates || [];
  },

  async saveTemplate(template: { id?: string; titulo: string; texto: string }) {
    return readJson(await fetch('/api/templates', { method: 'POST', headers: await getHeaders(), body: JSON.stringify(template) }));
  },

  async submitPublicCapture(payload: { nome: string; telefone: string; ramo?: string; regiao?: string; mensagem?: string; consentimentoLgpd: boolean }) {
    return readJson(await fetch('/api/leads/public/capture', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    }));
  },
};
