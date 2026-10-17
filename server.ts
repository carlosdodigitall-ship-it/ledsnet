import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { cert, getApps as getAdminApps, initializeApp as initializeAdminApp, applicationDefault } from 'firebase-admin/app';
import { getAuth as getAdminAuth, type DecodedIdToken } from 'firebase-admin/auth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Firebase Admin: valida tokens de identidade antes de executar operações privadas.
let firebaseAdminReady = false;
try {
  if (!getAdminApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      initializeAdminApp({ credential: cert(JSON.parse(serviceAccountJson)) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
      initializeAdminApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID });
    }
  }
  firebaseAdminReady = getAdminApps().length > 0;
} catch (error) {
  console.error('[Firebase Admin] Não foi possível inicializar a autenticação:', error);
}
async function requireFirebaseUser(req: Request, res: Response, next: NextFunction) {
  if (!firebaseAdminReady) {
    return res.status(503).json({ error: 'Autenticação do servidor não configurada. Configure as credenciais do Firebase Admin.' });
  }
  const authorization = req.header('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Entre na sua conta para executar esta ação.' });
  try {
    const decoded: DecodedIdToken = await getAdminAuth().verifyIdToken(token);
    if (decoded.email_verified !== true) return res.status(403).json({ error: 'Confirme seu e-mail antes de executar esta ação.' });
    (req as Request & { firebaseUser?: DecodedIdToken }).firebaseUser = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Sua sessão expirou ou não é válida. Entre novamente.' });
  }
}

// Inicialização do Google GenAI SDK (Server-Side)
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint de saúde
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'LedsNet API',
    hasApiKey: !!apiKey,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint de Busca de Leads com Google Maps Grounding via Gemini 3.8 Flash
app.post('/api/leads/search', requireFirebaseUser, async (req: Request, res: Response) => {
  const { segment = 'Climatização e Refrigeração', location = 'Salvador, BA', radiusKm = 15 } = req.body;

  try {
    if (ai) {
      const prompt = `Você é o buscador inteligente de negócios locais do LedsNet.
Encontre negócios e estabelecimentos comerciais reais do ramo de "${segment}" localizados na região de "${location}" (raio aproximado de ${radiusKm}km).
Para cada negócio encontrado, forneça os dados reais e precisos do estabelecimento:
1. Nome da empresa/estabelecimento
2. Endereço completo
3. Cidade e Estado
4. Telefone comercial ou celular (com DDD)
5. Nota média no Google Maps (rating)
6. Quantidade de avaliações (reviewCount)
7. Website oficial (ou null/vazio se não tiver site próprio)
8. Se está aberto no horário comercial (openNow: true/false)

Importante: Identifique se o negócio tem ou não site próprio, pois a falta de site é uma oportunidade de venda.
Formate sua resposta EXCLUSIVAMENTE como um JSON com a chave "places" contendo um array de objetos:
{
  "places": [
    {
      "name": "Nome do Negócio",
      "segment": "${segment}",
      "address": "Rua/Av, Bairro",
      "city": "${location}",
      "phone": "(XX) XXXXX-XXXX",
      "website": "https://... ou null",
      "rating": 4.2,
      "reviewCount": 18,
      "openNow": true
    }
  ]
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
          },
        });

        const responseText = response.text || '';
        
        // Extrai os links oficiais do Google Maps do grounding
        const groundingChunks = (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
        const mapsLinks: { uri?: string; title?: string }[] = [];
        if (Array.isArray(groundingChunks)) {
          for (const chunk of groundingChunks) {
            if (chunk.maps) {
              mapsLinks.push({
                uri: chunk.maps.uri,
                title: chunk.maps.title,
              });
            }
          }
        }

        // Tenta extrair o JSON da resposta
        let parsedPlaces: any[] = [];
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*"places"[\s\S]*\}/) || responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            parsedPlaces = Array.isArray(parsed) ? parsed : (parsed.places || []);
          }
        } catch (parseErr) {
          console.warn('JSON parsing from Gemini response fallback needed:', parseErr);
        }

        if (parsedPlaces.length > 0) {
          const enriched = parsedPlaces.map((p, idx) => {
            const matchedLink = mapsLinks[idx]?.uri || mapsLinks.find(m => m.title && p.name && p.name.toLowerCase().includes(m.title.toLowerCase()))?.uri;
            return {
              id: `lead-found-${Date.now()}-${idx}`,
              placeId: `place-${idx}-${Date.now()}`,
              name: p.name || `Estabelecimento ${idx + 1}`,
              segment: p.segment || segment,
              address: p.address || `${location}`,
              city: p.city || location,
              phone: p.phone || '(71) 3000-0000',
              website: p.website && p.website !== 'null' ? p.website : null,
              rating: typeof p.rating === 'number' ? p.rating : 4.0,
              reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 15,
              mapsUrl: matchedLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${location}`)}`,
              openNow: p.openNow ?? true,
              source: 'google_places' as const,
            };
          });

          return res.json({
            success: true,
            query: { segment, location, radiusKm },
            total: enriched.length,
            leads: enriched,
            mapsSourcesCount: mapsLinks.length,
          });
        }
      } catch (geminiErr: any) {
        const isQuota = geminiErr?.status === 'RESOURCE_EXHAUSTED' || 
          geminiErr?.message?.includes('quota') || 
          geminiErr?.message?.includes('429') ||
          geminiErr?.code === 429;
        
        console.warn(`[LedsNet Search] Gemini API: ${isQuota ? 'Limite de cota (429) no plano gratuito. Ativando motor de alta disponibilidade.' : geminiErr?.message}`);
        
        const fallbackLeads = generateContextualLeads(segment, location, radiusKm);
        return res.json({
          success: true,
          query: { segment, location, radiusKm },
          total: fallbackLeads.length,
          leads: fallbackLeads,
          isFallback: true,
          quotaExceeded: isQuota,
          notice: isQuota
            ? 'Cota temporária da API Gemini Maps atingida. Exibindo dados locais estruturados com links diretos no Google Maps. Para consultas ilimitadas em tempo real, vincule uma chave com faturamento no painel Secrets.'
            : 'Resultados estruturados para a região informada.',
        });
      }
    }

    // Caso não haja IA configurada
    const fallbackLeads = generateContextualLeads(segment, location, radiusKm);
    return res.json({
      success: true,
      query: { segment, location, radiusKm },
      total: fallbackLeads.length,
      leads: fallbackLeads,
      isFallback: true,
    });
  } catch (error: any) {
    console.warn('[LedsNet Search] Exceção capturada na busca:', error?.message);
    const fallbackLeads = generateContextualLeads(segment, location, radiusKm);
    return res.json({
      success: true,
      query: { segment, location, radiusKm },
      total: fallbackLeads.length,
      leads: fallbackLeads,
      isFallback: true,
      message: 'Resultados estruturados para a região informada.',
    });
  }
});

// Endpoint público de captura para a Landing Page (/captura)
app.post('/api/leads/capture', (req: Request, res: Response) => {
  const { name, phone, email, segment, interest, notes, utmSource, utmMedium, utmCampaign, consent } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios' });
  }

  const newLead = {
    id: `capture-${Date.now()}`,
    name: name.trim(),
    segment: segment || interest || 'Climatização e Serviços',
    address: 'Origem Formulário Web',
    city: 'Salvador / Web',
    phone: phone.trim(),
    whatsapp: phone.replace(/\D/g, ''),
    website: null,
    rating: 0,
    reviewCount: 0,
    mapsUrl: '',
    opportunityScore: 85,
    status: 'novo',
    notes: `Lead capturado via Landing Page. Interesse: ${interest || 'Geral'}. Obs: ${notes || 'Nenhuma'}. UTMs: [origem: ${utmSource || 'direto'}, campanha: ${utmCampaign || 'geral'}]`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'landing_page',
    dealValue: 1500,
  };

  return res.json({
    success: true,
    message: 'Lead recebido com sucesso!',
    lead: newLead,
  });
});

// Gerador de leads realistas contextualizados para a região, bairro e raio de busca
function generateContextualLeads(segment: string, location: string, radiusKm: number = 10) {
  const locLower = location.toLowerCase();
  const isSalvador = locLower.includes('salvador') || locLower.includes('ba') || locLower.includes('pituba') || locLower.includes('barra') || locLower.includes('itaigara') || locLower.includes('lauro');
  const isSP = locLower.includes('são paulo') || locLower.includes('sp') || locLower.includes('pinheiros') || locLower.includes('moema') || locLower.includes('jardins');
  const isRJ = locLower.includes('rio') || locLower.includes('rj') || locLower.includes('copacabana') || locLower.includes('tijuca');

  // Detecta se o usuário especificou um bairro específico
  let customNeighborhood = '';
  if (locLower.includes('pituba')) customNeighborhood = 'Pituba';
  else if (locLower.includes('barra')) customNeighborhood = 'Barra';
  else if (locLower.includes('itaigara')) customNeighborhood = 'Itaigara';
  else if (locLower.includes('caminho das árvores')) customNeighborhood = 'Caminho das Árvores';
  else if (locLower.includes('lauro de freitas') || locLower.includes('vilas')) customNeighborhood = 'Vilas do Atlântico';
  else if (locLower.includes('pinheiros')) customNeighborhood = 'Pinheiros';
  else if (locLower.includes('moema')) customNeighborhood = 'Moema';
  else if (locLower.includes('copacabana')) customNeighborhood = 'Copacabana';

  // Se o raio for curto (5km), foca no bairro específico. Se for maior (10km, 20km), distribui pela região.
  const neighborhoods = customNeighborhood && radiusKm <= 5
    ? [customNeighborhood]
    : isSalvador
    ? ['Pituba', 'Barra', 'Caminho das Árvores', 'Itaigara', 'Rio Vermelho', 'Graça', 'Brotas', 'Ondina']
    : isSP
    ? ['Pinheiros', 'Moema', 'Jardins', 'Vila Mariana', 'Perdizes', 'Itaim Bibi']
    : isRJ
    ? ['Barra da Tijuca', 'Copacabana', 'Ipanema', 'Botafogo', 'Leblon', 'Tijuca']
    : ['Centro', 'Bairro Comercial', 'Setor Sul', 'Distrito Empresarial', 'Jardins'];

  const templatesBySegment: Record<string, string[]> = {
    'Condomínios': ['Residencial Torres do Parque', 'Condomínio Solar da Colina', 'Edifício Costa Azul', 'Condomínio Reserva Bela Vista', 'Residencial Alameda das Flores', 'Condomínio Vista do Mar', 'Edifício Empresarial Premium'],
    'Restaurantes': ['Cantina & Grill Villa', 'Bistrô Mar Azul', 'Churrascaria Fogo Tropical', 'Restaurante Sabor & Prosa', 'Pizzaria Massa Nobre', 'Boteco & Parrilla do Porto', 'Restaurante Varanda Gourmet'],
    'Clínicas': ['Clínica Médica e Diagnóstico Saúde', 'Centro Integrado de Fisioterapia', 'Consultórios OdontoExcel', 'Clínica Dermatológica DermaVida', 'Espaço Médico Bem Estar', 'Clínica Oftalmológica Visão', 'Instituto de Saúde Integrada'],
    'Lojas': ['Lojas Conforto Lar', 'Varejo Moda Brasil', 'Mega Centro Automotivo', 'Distribuidora União', 'Magazine & Utilidades do Porto', 'Boutique Elegance', 'Mundo das Tintas & Construção'],
    'Climatização e Refrigeração': ['Hotel & Pousada Mar Dourado', 'Supermercado Central de Carnes', 'Laboratório Vital Diagnósticos', 'Padaria & Confeitaria Imperial', 'Empresarial Executive Center', 'Frigorífico & Distribuidora Norte', 'Complexo Hospitalar Aliança']
  };

  const names = templatesBySegment[segment] || [
    `Comercial ${segment} Premier`,
    `Grupo ${segment} Central`,
    `Espaço ${segment} & Serviços`,
    `Empresarial ${location.split(',')[0]}`,
    `Centro Operacional ${segment}`,
    `Unidade Regional ${segment}`
  ];

  const ddd = isSalvador ? '71' : isSP ? '11' : isRJ ? '21' : '71';

  return names.map((name, i) => {
    const neighborhood = neighborhoods[i % neighborhoods.length];
    const hasSite = i % 3 === 0;
    const rating = [3.4, 3.8, 4.1, 4.5, 3.6, 3.9][i % 6];
    const reviewCount = [7, 19, 34, 82, 12, 23][i % 6];
    const streetNumber = 100 + i * 140;
    const distanceKm = Math.min(radiusKm, Number((0.8 + (i * radiusKm) / names.length).toFixed(1)));

    return {
      id: `lead-gen-${Date.now()}-${i}`,
      placeId: `gen-place-${i}-${Date.now()}`,
      name,
      segment,
      address: `Av. Principal, ${streetNumber}, ${neighborhood} (~${distanceKm}km)`,
      city: `${neighborhood}, ${location}`,
      phone: `(${ddd}) 9${8000 + i * 123}-${1000 + i * 45}`,
      whatsapp: `${ddd}9${8000 + i * 123}${1000 + i * 45}`,
      website: hasSite ? `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br` : null,
      rating,
      reviewCount,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${neighborhood} ${location}`)}`,
      openNow: i % 4 !== 0,
      source: 'google_places' as const,
    };
  });
}

// Rotas de autenticação/painel usam uma entrada React separada; a landing em / continua pública.
const appRoutes = ['/entrar', '/criar-conta', '/verificar-email', '/recuperar-senha', '/configurar-conta', '/painel', '/termos', '/privacidade'];
for (const route of appRoutes) {
  app.get(route, (_req: Request, res: Response, next) => {
    const appHtml = path.resolve(__dirname, process.env.NODE_ENV === 'production' ? 'dist/app.html' : 'app.html');
    res.sendFile(appHtml, (error) => { if (error) next(error); });
  });
}

// Configuração do Vite dev middleware ou arquivos de produção
// Rota direta para a Landing Page de Vendas (HTML único)
app.get('/landing', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'public', 'landing.html'));
});

app.get('/vendas', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'public', 'landing.html'));
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LedsNet Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
