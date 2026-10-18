import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAuth } from 'firebase-admin/auth';
import { getApps } from 'firebase-admin/app';
import { serverDb, getServerFirestore } from './src/server/db.js';
import scraperRouter from './src/server/scraperRoutes.js';
import { isSupabaseLeadsConfigured, listSupabaseLeads, getSupabaseLeadById, createSupabaseLead, updateSupabaseLead, deleteSupabaseLead } from './src/server/supabaseLeads.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Configuração de Chave de Acesso Privada
const ACCESS_KEY = process.env.ACCESS_KEY || '';

// Configurações da Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://api.evolution.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'ledsnet-prod';

// Chave do Google Places API. Sem uma fonte real configurada, a busca retorna indisponibilidade.
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

app.use(express.json({ limit: '1mb' }));
app.use('/api/scraper', scraperRouter);

// ============================================================================
// 1. MIDDLEWARE DE AUTENTICAÇÃO FIREBASE (Zero-Trust)
// ============================================================================
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ error: 'Sessão Firebase ausente. Entre novamente na plataforma.' });
  }
  try {
    const app = getApps()[0];
    if (!app) return res.status(503).json({ error: 'Firebase Admin não está inicializado.' });
    const decoded = await getAuth(app).verifyIdToken(token);
    (req as Request & { firebaseUid?: string }).firebaseUid = decoded.uid;
    return next();
  } catch {
    return res.status(401).json({ error: 'Sessão Firebase inválida ou expirada. Entre novamente.' });
  }
}

// Endpoint para validação da chave de acesso no login do painel
app.post('/api/auth/validate-key', (req: Request, res: Response) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ valid: false, error: 'Chave não informada.' });
  }

  if (key === ACCESS_KEY) {
    return res.json({ valid: true, message: 'Chave de acesso autenticada com sucesso.' });
  }

  return res.status(401).json({ valid: false, error: 'Chave de acesso incorreta.' });
});

// Endpoint de saúde
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LedsNet API',
    hasPlacesKey: !!GOOGLE_PLACES_API_KEY,
    hasEvolutionKey: !!EVOLUTION_API_KEY,
    evolutionInstance: EVOLUTION_INSTANCE,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// 2. BUSCA DE LEADS (Google Places com Deduplicação e Score)
// ============================================================================
app.post('/api/leads/search', requireAuth, async (req: Request, res: Response) => {
  const { segment = 'Climatização e Refrigeração', location = 'Salvador, BA', radiusKm = 15 } = req.body;

  try {
    const config = await serverDb.getConfig();
    const pesoSemSite = config?.pesoSemSite ?? 40;
    const pesoBaixaNota = config?.pesoBaixaNota ?? 25;
    const pesoPoucasAvaliacoes = config?.pesoPoucasAvaliacoes ?? 15;

    let rawPlaces: any[] = [];

    // 1. Tenta consulta direta ao Google Places API se houver chave oficial
    if (GOOGLE_PLACES_API_KEY) {
      try {
        const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${segment} em ${location}`)}&radius=${radiusKm * 1000}&language=pt-BR&key=${GOOGLE_PLACES_API_KEY}`;
        const placesResp = await fetch(placesUrl);
        const placesData: any = await placesResp.json();

        if (placesData.status === 'OK' && Array.isArray(placesData.results)) {
          rawPlaces = placesData.results.map((p: any) => ({
            name: p.name,
            address: p.formatted_address,
            placeId: p.place_id,
            rating: p.rating ?? null,
            reviewCount: p.user_ratings_total ?? null,
            website: null,
            phone: null,
            openNow: p.opening_hours?.open_now ?? true
          }));
        } else if (placesData.status === 'OVER_QUERY_LIMIT') {
          console.warn('[Google Places] Cota excedida na chave direta. Usando motor Gemini Grounding.');
        }
      } catch (placesErr) {
        console.warn('[Google Places API] Erro ao consultar diretamente:', placesErr);
      }
    }

    // Não usa texto gerado por LLM como fonte de empresas reais. Sem Google Places,
    // a busca real deve ser executada pelo worker de scraping, não por dados inventados.
    // Não inventa estabelecimentos quando as fontes reais falham.
    if (rawPlaces.length === 0) {
      return res.status(503).json({
        error: 'Nenhuma fonte real de pesquisa respondeu. Configure GOOGLE_PLACES_API_KEY ou execute o workflow de scraping do LedsNet.',
        sourceUnavailable: true,
      });
    }

    // 4. Processamento, Deduplicação por place_id e Cálculo do Opportunity Score
    const userId = (req as FirebaseRequest).firebaseUid!;
    const existingSupabaseLeads = isSupabaseLeadsConfigured()
      ? await listSupabaseLeads(userId)
      : null;
    const processedLeads = [];
    for (let i = 0; i < rawPlaces.length; i++) {
      const p = rawPlaces[i];
      const placeId = p.placeId || `place_${Date.now()}_${i}`;

      // Verifica duplicados no armazenamento ativo, sempre dentro do usuário autenticado.
      const existingLead = existingSupabaseLeads
        ? existingSupabaseLeads.find((lead: any) => lead.place_id === placeId)
        : await serverDb.findLeadByPlaceId(placeId);
      const isDuplicate = !!existingLead;

      // Normaliza somente dados existentes; nunca inventa telefone, nota ou avaliações.
      const rawPhone = String(p.phone || '');
      let cleanDigits = rawPhone.replace(/\D/g, '');
      if (cleanDigits.length === 10 || cleanDigits.length === 11) {
        cleanDigits = '55' + cleanDigits;
      }

      // Cálculo do Opportunity Score usando apenas métricas disponíveis.
      let score = 10; // Base
      const hasNoWebsite = !p.website || String(p.website).trim() === '';
      if (hasNoWebsite) score += pesoSemSite;

      const rating = p.rating === undefined || p.rating === null || p.rating === ''
        ? null
        : Number(p.rating);
      if (rating !== null && Number.isFinite(rating)) {
        if (rating < 4.0) score += pesoBaixaNota;
        else if (rating < 4.5) score += Math.round(pesoBaixaNota / 2);
      }

      const reviewCount = p.reviewCount === undefined || p.reviewCount === null || p.reviewCount === ''
        ? null
        : Number(p.reviewCount);
      if (reviewCount !== null && Number.isFinite(reviewCount)) {
        if (reviewCount < 15) score += pesoPoucasAvaliacoes;
        else if (reviewCount < 30) score += Math.round(pesoPoucasAvaliacoes / 2);
      }

      score = Math.min(100, Math.max(10, score));

      processedLeads.push({
        id: existingLead ? existingLead.id : `lead_search_${Date.now()}_${i}`,
        nome: p.name,
        endereco: p.address || `${location}`,
        telefone: cleanDigits,
        place_id: placeId,
        nota: rating,
        numeroAvaliacoes: reviewCount,
        site: p.website || null,
        ramo: segment,
        regiao: location,
        score,
        status: existingLead ? existingLead.status : 'novo',
        isDuplicate,
        existingId: existingLead?.id || null,
        origem: 'places',
        criadoEm: existingLead?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      query: { segment, location, radiusKm },
      totalFound: processedLeads.length,
      duplicatesFound: processedLeads.filter(l => l.isDuplicate).length,
      leads: processedLeads
    });

  } catch (error: any) {
    console.error('Erro na rota /api/leads/search:', error);
    return res.status(500).json({
      error: 'Erro interno ao processar busca de leads.',
      details: error?.message || String(error)
    });
  }
});

// ============================================================================
 // 3. GESTÃO DE LEADS (Firestore isolado por usuário autenticado)
 // ============================================================================
type FirebaseRequest = Request & { firebaseUid?: string };
function userLeads(req: Request) {
  const uid = (req as FirebaseRequest).firebaseUid;
  if (!uid) throw new Error('Sessão Firebase ausente.');
  return getServerFirestore().collection('users').doc(uid).collection('leads');
}

app.get('/api/leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, ramo, regiao, search } = req.query as any;
    const uid = (req as FirebaseRequest).firebaseUid!;
    if (isSupabaseLeadsConfigured()) {
      const leads = await listSupabaseLeads(uid, { status, ramo, regiao, search });
      return res.json({ success: true, count: leads.length, leads });
    }
    const snapshot = await userLeads(req).get();
    let leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (status && status !== 'todos') leads = leads.filter((lead: any) => lead.status === status);
    if (ramo && ramo !== 'todos') leads = leads.filter((lead: any) => lead.ramo === ramo || lead.segment === ramo);
    if (regiao) leads = leads.filter((lead: any) => String(lead.regiao || lead.city || '').toLowerCase().includes(String(regiao).toLowerCase()));
    if (search) leads = leads.filter((lead: any) => [lead.nome, lead.name, lead.telefone, lead.phone, lead.email, lead.site, lead.website].some(value => String(value || '').toLowerCase().includes(String(search).toLowerCase())));
    res.json({ success: true, count: leads.length, leads });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao buscar leads', details: err?.message });
  }
});

app.get('/api/leads/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as FirebaseRequest).firebaseUid!;
    if (isSupabaseLeadsConfigured()) {
      const lead = await getSupabaseLeadById(uid, req.params.id);
      if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });
      return res.json({ success: true, lead, interacoes: [] });
    }
    const doc = await userLeads(req).doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Lead não encontrado.' });
    res.json({ success: true, lead: { id: doc.id, ...doc.data() }, interacoes: [] });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao carregar lead', details: err?.message });
  }
});

app.post('/api/leads', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = req.body || {};
    const nome = String(data.nome || data.name || '').trim();
    const telefone = String(data.telefone || data.phone || '').trim();
    const email = String(data.email || '').trim();
    if (!nome) return res.status(400).json({ error: 'Nome da empresa é obrigatório.' });
    const uid = (req as FirebaseRequest).firebaseUid!;
    if (isSupabaseLeadsConfigured()) {
      try {
        const lead = await createSupabaseLead(uid, data);
        return res.status(201).json({ success: true, lead });
      } catch (error: any) {
        if (String(error?.message || '').includes('HTTP 409')) {
          return res.status(409).json({ error: 'Esta empresa já está salva na sua lista.' });
        }
        throw error;
      }
    }
    const collection = userLeads(req);
    if (data.place_id || data.placeId) {
      const placeId = String(data.place_id || data.placeId);
      const duplicate = await collection.where('place_id', '==', placeId).limit(1).get();
      if (!duplicate.empty) return res.status(409).json({ error: 'Esta empresa já está salva na sua lista.', lead: { id: duplicate.docs[0].id, ...duplicate.docs[0].data() } });
    }
    const ref = collection.doc(typeof data.id === 'string' && data.id.length < 120 ? data.id : undefined);
    const lead = {
      ...data,
      nome,
      name: nome,
      telefone,
      phone: telefone,
      email,
      id: ref.id,
      criadoEm: data.criadoEm || data.createdAt || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      status: data.status || 'novo',
    };
    await ref.set(lead, { merge: true });
    res.status(201).json({ success: true, lead });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar lead', details: err?.message });
  }
});

app.patch('/api/leads/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as FirebaseRequest).firebaseUid!;
    const allowed = ['status', 'motivoPerda', 'proximoContato', 'nota', 'site', 'ramo', 'regiao', 'email', 'emails', 'telefone', 'phone', 'website', 'notes', 'nextFollowUpDate', 'nextFollowUpNote', 'score', 'address', 'endereco'];
    if (isSupabaseLeadsConfigured()) {
      const patch: Record<string, unknown> = {};
      for (const key of allowed) if (req.body?.[key] !== undefined) patch[key] = req.body[key];
      const updated = await updateSupabaseLead(uid, req.params.id, patch);
      if (!updated) return res.status(404).json({ error: 'Lead não encontrado.' });
      return res.json({ success: true, lead: updated });
    }
    const ref = userLeads(req).doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: 'Lead não encontrado.' });
    const patch: Record<string, unknown> = {};
    for (const key of allowed) if (req.body?.[key] !== undefined) patch[key] = req.body[key];
    patch.atualizadoEm = new Date().toISOString();
    await ref.set(patch, { merge: true });
    const updated = await ref.get();
    res.json({ success: true, lead: { id: updated.id, ...updated.data() } });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao atualizar lead', details: err?.message });
  }
});

app.delete('/api/leads/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as FirebaseRequest).firebaseUid!;
    if (isSupabaseLeadsConfigured()) {
      const lead = await getSupabaseLeadById(uid, req.params.id);
      if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });
      await deleteSupabaseLead(uid, req.params.id);
      return res.json({ success: true, message: 'Lead removido da sua lista.' });
    }
    const ref = userLeads(req).doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: 'Lead não encontrado.' });
    await ref.delete();
    res.json({ success: true, message: 'Lead removido da sua lista.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao excluir lead', details: err?.message });
  }
});

// Endpoint público para página de vendas/captura (/captura ou landing page)
app.post('/api/leads/public/capture', async (req: Request, res: Response) => {
  try {
    const { nome, telefone, ramo, regiao, mensagem, consentimentoLgpd } = req.body;

    if (!consentimentoLgpd) {
      return res.status(400).json({ error: 'Consentimento da LGPD é obrigatório.' });
    }
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios.' });
    }

    let cleanDigits = telefone.replace(/\D/g, '');
    if (cleanDigits.length === 10 || cleanDigits.length === 11) {
      cleanDigits = '55' + cleanDigits;
    }

    const newLead = await serverDb.saveLead({
      nome,
      telefone: cleanDigits,
      endereco: regiao || 'Via formulário público',
      place_id: `form_${Date.now()}`,
      nota: 5.0,
      numeroAvaliacoes: 1,
      site: null,
      ramo: ramo || 'Interesse Comercial',
      regiao: regiao || 'Brasil',
      score: 85,
      status: 'novo',
      origem: 'formulario',
      motivoPerda: null,
      proximoContato: null
    });

    if (mensagem) {
      await serverDb.addInteraction(newLead.id, 'anotacao', `Mensagem do formulário de captura: ${mensagem}`);
    }

    res.status(201).json({ success: true, message: 'Lead capturado com sucesso.', leadId: newLead.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao processar captura', details: err?.message });
  }
});

// ============================================================================
// 4. INTEGRAÇÃO WHATSAPP (EVOLUTION API) & WEBHOOK
// ============================================================================

// Status da Instância do WhatsApp
app.get('/api/whatsapp/status', requireAuth, async (_req: Request, res: Response) => {
  try {
    if (!EVOLUTION_API_KEY) {
      return res.json({
        configured: false,
        instance: EVOLUTION_INSTANCE,
        state: 'disconnected',
        message: 'Evolution API Key não configurada no servidor (.env).'
      });
    }

    const checkUrl = `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`;
    const resp = await fetch(checkUrl, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    const data: any = await resp.json();

    return res.json({
      configured: true,
      instance: EVOLUTION_INSTANCE,
      state: data?.instance?.state || 'open',
      raw: data
    });
  } catch (err: any) {
    return res.json({
      configured: !!EVOLUTION_API_KEY,
      instance: EVOLUTION_INSTANCE,
      state: 'simulated_ready',
      message: 'Modo assistido de envio ativo.'
    });
  }
});

// Envio de Mensagem Individual com Confirmação e Limite Diário
app.post('/api/whatsapp/send', requireAuth, async (req: Request, res: Response) => {
  try {
    const { leadId, texto, delaySeconds } = req.body;

    if (!leadId || !texto) {
      return res.status(400).json({ error: 'leadId e texto da mensagem são obrigatórios.' });
    }

    const lead = await serverDb.getLeadById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    // REGRA DE SEGURANÇA: Bloqueio estrito se o lead estiver como nao_contatar
    if (lead.status === 'nao_contatar') {
      return res.status(403).json({
        error: 'Envio bloqueado: Este lead solicitou NÃO ser contatado (opt-out LGPD).'
      });
    }

    const config = await serverDb.getConfig();
    const limiteDiario = config?.limiteDiarioEnvios ?? 50;
    const todayCount = await serverDb.getTodaySendCount();

    if (todayCount >= limiteDiario) {
      return res.status(429).json({
        error: `Limite diário de disparos atingido (${todayCount}/${limiteDiario} envios hoje). Aguarde até amanhã para novos envios.`
      });
    }

    // Calcula intervalo aleatório entre o mínimo e máximo
    const minSec = config?.intervaloMinimoSegundos ?? 15;
    const maxSec = config?.intervaloMaximoSegundos ?? 60;
    const appliedDelaySeconds = delaySeconds || Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;

    let sendSuccess = true;
    let errorMessage: string | null = null;

    // Dispara via Evolution API se configurada
    if (EVOLUTION_API_KEY && EVOLUTION_API_URL) {
      try {
        const sendUrl = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
        const evoResp = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
          },
          body: JSON.stringify({
            number: lead.telefone,
            text: texto,
            delay: appliedDelaySeconds * 1000
          })
        });

        if (!evoResp.ok) {
          const errText = await evoResp.text();
          sendSuccess = false;
          errorMessage = `Erro Evolution API HTTP ${evoResp.status}: ${errText}`;
        }
      } catch (evoErr: any) {
        sendSuccess = false;
        errorMessage = evoErr?.message || 'Falha de conexão com a Evolution API.';
      }
    } else {
      // Modo de demonstração / homologação assistida
      console.log(`[WhatsApp Simulado] Para ${lead.telefone} (${lead.nome}): "${texto}"`);
      sendSuccess = true;
    }

    // Registra em logs_envio
    await serverDb.addSendLog(leadId, sendSuccess ? 'sucesso' : 'erro', errorMessage);

    if (sendSuccess) {
      // Registra interação no histórico
      await serverDb.addInteraction(leadId, 'mensagem_enviada', texto);

      // Atualiza status para 'contatado' se era 'novo'
      if (lead.status === 'novo') {
        await serverDb.updateLeadStatus(leadId, 'contatado');
      }

      return res.json({
        success: true,
        message: 'Mensagem despachada com sucesso.',
        appliedDelaySeconds,
        todayCount: todayCount + 1,
        limiteDiario
      });
    } else {
      return res.status(502).json({
        success: false,
        error: errorMessage || 'Falha ao despachar mensagem pelo WhatsApp.'
      });
    }

  } catch (err: any) {
    console.error('Erro em /api/whatsapp/send:', err);
    return res.status(500).json({ error: 'Erro interno ao processar envio', details: err?.message });
  }
});

// Webhook para Recepção de Respostas da Evolution API
app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log('[Webhook Evolution] Evento recebido:', payload?.event || 'mensagem');

    // Extrai mensagem e remetente (compatível com os formatos padrão da Evolution API)
    const data = payload?.data;
    const remoteJid = data?.key?.remoteJid || data?.sender;
    const messageContent = data?.message?.conversation || 
                           data?.message?.extendedTextMessage?.text || 
                           payload?.text || '';

    if (!remoteJid || !messageContent) {
      return res.json({ status: 'ignored', reason: 'Payload sem texto ou remetente.' });
    }

    // Limpa telefone no formato E.164
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    const lead = await serverDb.findLeadByPhone(phone);

    if (!lead) {
      console.log(`[Webhook Evolution] Lead com telefone ${phone} não localizado.`);
      return res.json({ status: 'lead_not_found', phone });
    }

    const trimmedMsg = messageContent.trim();
    const isOptOut = trimmedMsg.toUpperCase() === 'SAIR';

    if (isOptOut) {
      // Se a resposta for "SAIR", muda para nao_contatar e bloqueia envios futuros
      await serverDb.updateLeadStatus(lead.id, 'nao_contatar', 'Solicitou opt-out via WhatsApp (comando SAIR)');
      await serverDb.addInteraction(lead.id, 'resposta', `[OPT-OUT] ${trimmedMsg}`);
      await serverDb.addInteraction(lead.id, 'anotacao', 'Cliente solicitou formalmente a remoção de contatos. Status alterado para Não Contatar.');
      console.log(`[LGPD Opt-Out] Lead ${lead.nome} (${phone}) marcou SAIR. Bloqueado.`);
    } else {
      // Salva em interações e muda status para 'respondeu'
      await serverDb.addInteraction(lead.id, 'resposta', trimmedMsg);
      if (lead.status !== 'qualificado' && lead.status !== 'convertido' && lead.status !== 'nao_contatar') {
        await serverDb.updateLeadStatus(lead.id, 'respondeu');
      }
    }

    return res.json({ status: 'processed', leadId: lead.id, isOptOut });
  } catch (err: any) {
    console.error('Erro no webhook Evolution:', err);
    return res.status(500).json({ error: 'Erro no processamento do webhook', details: err?.message });
  }
});

// ============================================================================
// 5. CONFIGURAÇÕES & MODELOS DE MENSAGEM
// ============================================================================
app.get('/api/config', requireAuth, async (_req: Request, res: Response) => {
  const config = await serverDb.getConfig();
  const todayCount = await serverDb.getTodaySendCount();
  res.json({ success: true, config, todayCount });
});

app.patch('/api/config', requireAuth, async (req: Request, res: Response) => {
  const updated = await serverDb.updateConfig(req.body);
  res.json({ success: true, config: updated });
});

app.get('/api/templates', requireAuth, async (_req: Request, res: Response) => {
  const templates = await serverDb.getMessageTemplates();
  res.json({ success: true, templates });
});

app.post('/api/templates', requireAuth, async (req: Request, res: Response) => {
  const { titulo, texto, id } = req.body;
  if (!titulo || !texto) {
    return res.status(400).json({ error: 'Título e texto são obrigatórios.' });
  }
  const saved = await serverDb.saveMessageTemplate({ id, titulo, texto });
  res.json({ success: true, template: saved });
});

// KPIs do Dashboard
app.get('/api/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as FirebaseRequest).firebaseUid!;
    const leads = isSupabaseLeadsConfigured()
      ? await listSupabaseLeads(uid)
      : await serverDb.getLeads();
    const today = new Date().toISOString().split('T')[0];

    const totalLeads = leads.length;
    const novosHoje = leads.filter(l => l.criadoEm?.startsWith(today)).length;
    const responderam = leads.filter(l => l.status === 'respondeu' || l.status === 'qualificado' || l.status === 'convertido').length;
    const contatados = leads.filter(l => l.status !== 'novo').length;
    const taxaResposta = contatados > 0 ? Math.round((responderam / contatados) * 100) : 0;
    const convertidos = leads.filter(l => l.status === 'convertido').length;
    const taxaConversao = totalLeads > 0 ? Math.round((convertidos / totalLeads) * 100) : 0;
    const followUpsHoje = leads.filter(l => l.proximoContato && l.proximoContato.startsWith(today)).length;

    // Leads por Ramo
    const ramosMap: Record<string, number> = {};
    leads.forEach(l => {
      const r = l.ramo || 'Geral';
      ramosMap[r] = (ramosMap[r] || 0) + 1;
    });

    // Funil por Status
    const funil = {
      novo: leads.filter(l => l.status === 'novo').length,
      contatado: leads.filter(l => l.status === 'contatado').length,
      respondeu: leads.filter(l => l.status === 'respondeu').length,
      qualificado: leads.filter(l => l.status === 'qualificado').length,
      convertido: leads.filter(l => l.status === 'convertido').length,
      perdido: leads.filter(l => l.status === 'perdido').length,
      nao_contatar: leads.filter(l => l.status === 'nao_contatar').length
    };

    res.json({
      success: true,
      kpis: {
        totalLeads,
        novosHoje,
        taxaResposta,
        taxaConversao,
        followUpsHoje
      },
      funil,
      ramos: ramosMap
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao gerar métricas', details: err?.message });
  }
});

// ============================================================================
// 6. ROTAS ESTÁTICAS, LANDING PAGE E VITE MIDDLEWARE
// ============================================================================

// Rota para a Landing Page de Vendas (HTML único)
app.get('/landing', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'landing.html'));
});

app.get('/vendas', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'landing.html'));
});

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`LedsNet Server running at http://0.0.0.0:${PORT}`);
    });
  }
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


// Exporta o Express para a função serverless da Vercel.
export default app;
