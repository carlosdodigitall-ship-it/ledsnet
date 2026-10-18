import { randomUUID } from 'node:crypto';

type LeadRow = {
  id: string;
  user_id: string;
  place_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  emails: string[] | null;
  rating: number | null;
  review_count: number | null;
  category: string | null;
  region: string | null;
  status: string;
  score: number;
  notes: string | null;
  next_follow_up_date: string | null;
  next_follow_up_note: string | null;
  motivo_perda: string | null;
  source: string;
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export function isSupabaseLeadsConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  );
}

function getConfig() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!baseUrl || !key) {
    throw new Error('Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.');
  }
  if (!baseUrl.startsWith('https://')) {
    throw new Error('SUPABASE_URL deve usar HTTPS.');
  }
  return { baseUrl, key };
}

async function requestSupabase<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { baseUrl, key } = getConfig();
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!response.ok) {
    const details = (await response.text()).slice(0, 800);
    throw new Error(`Supabase REST HTTP ${response.status}: ${details}`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function mapRow(row: LeadRow) {
  const raw = row.raw_data || {};
  return {
    id: row.id,
    nome: row.name,
    name: row.name,
    endereco: row.address || '',
    address: row.address || '',
    telefone: row.phone || '',
    phone: row.phone || '',
    place_id: row.place_id,
    placeId: row.place_id,
    nota: row.rating,
    rating: row.rating,
    numeroAvaliacoes: row.review_count,
    reviewCount: row.review_count,
    site: row.website,
    website: row.website,
    email: row.emails?.[0] || null,
    emails: row.emails || [],
    ramo: row.category || '',
    category: row.category || '',
    regiao: row.region || '',
    score: row.score ?? 0,
    status: row.status || 'novo',
    notes: row.notes || '',
    nextFollowUpDate: row.next_follow_up_date,
    nextFollowUpNote: row.next_follow_up_note,
    motivoPerda: row.motivo_perda,
    origem: row.source,
    source: row.source,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
    raw_data: raw,
  };
}

export async function listSupabaseLeads(
  userId: string,
  filters: { status?: string; ramo?: string; regiao?: string; search?: string } = {}
) {
  const params = new URLSearchParams({
    select: '*',
    user_id: `eq.${userId}`,
    order: 'created_at.desc',
    limit: '1000',
  });
  const rows = await requestSupabase<LeadRow[]>(`ledsnet_leads?${params.toString()}`);
  let leads = rows.map(mapRow);
  if (filters.status && filters.status !== 'todos') {
    leads = leads.filter((lead: any) => lead.status === filters.status);
  }
  if (filters.ramo && filters.ramo !== 'todos') {
    leads = leads.filter((lead: any) => lead.ramo === filters.ramo);
  }
  if (filters.regiao) {
    const region = filters.regiao.toLocaleLowerCase();
    leads = leads.filter((lead: any) => String(lead.regiao || lead.endereco || '').toLocaleLowerCase().includes(region));
  }
  if (filters.search) {
    const search = filters.search.toLocaleLowerCase();
    leads = leads.filter((lead: any) =>
      [lead.nome, lead.telefone, lead.email, lead.site, lead.endereco, ...(lead.emails || [])]
        .some(value => String(value || '').toLocaleLowerCase().includes(search))
    );
  }
  return leads;
}

export async function getSupabaseLeadById(userId: string, id: string) {
  const params = new URLSearchParams({ select: '*', user_id: `eq.${userId}`, id: `eq.${id}`, limit: '1' });
  const rows = await requestSupabase<LeadRow[]>(`ledsnet_leads?${params.toString()}`);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createSupabaseLead(userId: string, data: Record<string, any>) {
  const name = String(data.nome || data.name || '').trim();
  if (!name) throw new Error('Nome da empresa é obrigatório.');
  const placeId = String(data.place_id || data.placeId || `manual:${randomUUID()}`);
  const payload = {
    user_id: userId,
    place_id: placeId,
    name,
    address: data.endereco || data.address || null,
    phone: String(data.telefone || data.phone || '').trim() || null,
    website: data.site || data.website || null,
    emails: Array.isArray(data.emails)
      ? data.emails.map((e: unknown) => String(e).trim().toLowerCase()).filter((e: string) => e.includes('@'))
      : (data.email ? [String(data.email).trim().toLowerCase()] : []),
    rating: data.nota ?? data.rating ?? null,
    review_count: data.numeroAvaliacoes ?? data.reviewCount ?? null,
    category: data.ramo || data.category || null,
    region: data.regiao || data.region || null,
    status: data.status || 'novo',
    score: Math.min(100, Math.max(0, Number(data.score) || 0)),
    notes: data.notes || null,
    next_follow_up_date: data.nextFollowUpDate || data.proximoContato || null,
    next_follow_up_note: data.nextFollowUpNote || null,
    motivo_perda: data.motivoPerda || null,
    source: data.origem || data.source || 'manual',
    raw_data: data.raw_data || data,
  };
  const params = new URLSearchParams({ select: '*' });
  const rows = await requestSupabase<LeadRow[]>(`ledsnet_leads?${params.toString()}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  return mapRow(rows[0]);
}

export async function updateSupabaseLead(userId: string, id: string, patch: Record<string, unknown>) {
  const body: Record<string, unknown> = {};
  const mapping: Record<string, string> = {
    status: 'status',
    motivoPerda: 'motivo_perda',
    nextFollowUpDate: 'next_follow_up_date',
    proximoContato: 'next_follow_up_date',
    nextFollowUpNote: 'next_follow_up_note',
    nota: 'rating',
    rating: 'rating',
    site: 'website',
    website: 'website',
    ramo: 'category',
    category: 'category',
    regiao: 'region',
    region: 'region',
    email: 'emails',
    emails: 'emails',
    telefone: 'phone',
    phone: 'phone',
    notes: 'notes',
    endereco: 'address',
    address: 'address',
    score: 'score',
  };
  for (const [key, value] of Object.entries(patch)) {
    const column = mapping[key];
    if (!column) continue;
    body[column] = column === 'emails'
      ? (Array.isArray(value) ? value : [value]).map(item => String(item || '').trim().toLowerCase()).filter(item => item.includes('@'))
      : value;
  }
  body.updated_at = new Date().toISOString();
  const params = new URLSearchParams({ select: '*', user_id: `eq.${userId}`, id: `eq.${id}` });
  const rows = await requestSupabase<LeadRow[]>(`ledsnet_leads?${params.toString()}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteSupabaseLead(userId: string, id: string) {
  const params = new URLSearchParams({ user_id: `eq.${userId}`, id: `eq.${id}` });
  await requestSupabase<void>(`ledsnet_leads?${params.toString()}`, { method: 'DELETE' });
}
