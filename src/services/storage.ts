import { Lead, Interaction, Task, MessageTemplate, LeadStatus } from '../types';
import { calculateOpportunityScore } from './scorer';

const STORAGE_KEYS = {
  ACCESS_KEY: 'ledsnet_access_key',
  LEADS: 'ledsnet_leads_data',
  INTERACTIONS: 'ledsnet_interactions',
  TASKS: 'ledsnet_tasks',
  TEMPLATES: 'ledsnet_templates',
};

export const DEFAULT_ACCESS_KEY = 'LEDS-DEMO-2026';

export const INITIAL_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl-1',
    title: '1. Abordagem Direta (Serviços & Manutenção)',
    category: 'primeiro_contato',
    text: 'Olá, equipe da {{empresa}}! Tudo bem?\n\nMe chamo Carlos e sou especialista em manutenção preventiva e climatização comercial aqui na região de {{cidade}}. Notei a estrutura de vocês e gostaria de saber: como está a rotina de manutenção dos equipamentos neste trimestre?\n\nEstamos com uma condição especial para condomínios e estabelecimentos locais esta semana. Teria 5 minutinhos para conversar?'
  },
  {
    id: 'tmpl-2',
    title: '2. Diagnóstico Preventivo Gratuito (Alto Impacto)',
    category: 'primeiro_contato',
    text: 'Olá! Sou da equipe técnica da LedsNet Soluções em {{cidade}}.\n\nEstamos realizando um mapeamento técnico em empresas do ramo de {{ramo}} na sua região para identificar riscos de paradas não programadas e alto consumo elétrico.\n\nGostaria de agendar uma visita rápida de 15 minutos de diagnóstico cortesia para a {{empresa}} sem nenhum compromisso. Qual o melhor dia para vocês: terça ou quinta-feira?'
  },
  {
    id: 'tmpl-3',
    title: '3. Follow-up de Retorno (Reativação Amigável)',
    category: 'follow_up',
    text: 'Olá novamente! Espero que esteja tendo uma ótima semana.\n\nPassando apenas para saber se conseguiram avaliar nossa mensagem sobre a revisão da infraestrutura da {{empresa}}. Sei que a rotina é corrida, por isso podemos agendar quando for mais conveniente para vocês!'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-salvador-1',
    placeId: 'ChIJz2x0-pituba-1',
    name: 'Condomínio Solar das Palmeiras',
    segment: 'Condomínios',
    address: 'Av. Paulo VI, 1240, Pituba',
    city: 'Salvador - BA',
    phone: '(71) 3358-4411',
    whatsapp: '7133584411',
    website: null,
    rating: 3.6,
    reviewCount: 11,
    mapsUrl: 'https://maps.google.com/?cid=1001',
    opportunityScore: 90,
    scoreBreakdown: calculateOpportunityScore({ website: null, rating: 3.6, reviewCount: 11, phone: '7133584411' }).breakdown,
    status: 'novo',
    notes: 'Condomínio de 2 torres com 80 apartamentos. Sistema central e bombas necessitando de contrato de manutenção.',
    nextFollowUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    nextFollowUpNote: 'Falar com o síndico Sr. Marcelo no período da manhã',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    source: 'google_places',
    dealValue: 2400,
    openNow: true
  },
  {
    id: 'lead-salvador-2',
    placeId: 'ChIJz2x0-barra-2',
    name: 'Restaurante Baía Gourmet',
    segment: 'Restaurantes',
    address: 'Rua Afonso Celso, 210, Barra',
    city: 'Salvador - BA',
    phone: '(71) 99245-8833',
    whatsapp: '71992458833',
    website: 'http://baiagourmet.blogspot.com',
    rating: 3.7,
    reviewCount: 28,
    mapsUrl: 'https://maps.google.com/?cid=1002',
    opportunityScore: 80,
    scoreBreakdown: calculateOpportunityScore({ website: 'http://baiagourmet.blogspot.com', rating: 3.7, reviewCount: 28, phone: '71992458833' }).breakdown,
    status: 'contatado',
    notes: 'Câmara frigorífica e 6 aparelhos split no salão. Relataram falha no ar condicionado em dias de pico.',
    nextFollowUpDate: new Date().toISOString().split('T')[0], // Hoje!
    nextFollowUpNote: 'Enviar proposta do plano preventivo com checagem quinzenal',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    source: 'google_places',
    dealValue: 1800,
    openNow: true
  },
  {
    id: 'lead-salvador-3',
    placeId: 'ChIJz2x0-itaigara-3',
    name: 'Clínica Integrada OdontoMais',
    segment: 'Clínicas',
    address: 'Av. ACM, 2501, Ed. Profissional, Itaigara',
    city: 'Salvador - BA',
    phone: '(71) 98711-2099',
    whatsapp: '71987112099',
    website: null,
    rating: 4.1,
    reviewCount: 14,
    mapsUrl: 'https://maps.google.com/?cid=1003',
    opportunityScore: 80,
    scoreBreakdown: calculateOpportunityScore({ website: null, rating: 4.1, reviewCount: 14, phone: '71987112099' }).breakdown,
    status: 'respondeu',
    notes: 'Dra. Camila respondeu no WhatsApp demonstrando interesse em higienização hospitalar para os consultórios.',
    nextFollowUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    nextFollowUpNote: 'Agendar visita com o técnico para medição de duto',
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    source: 'google_places',
    dealValue: 3500,
    openNow: false
  },
  {
    id: 'lead-salvador-4',
    placeId: 'ChIJz2x0-lauro-4',
    name: 'Boutique & Loja Bella Casa',
    segment: 'Lojas',
    address: 'Estrada do Coco, Km 4.5, Vilas do Atlântico',
    city: 'Lauro de Freitas - BA',
    phone: '(71) 3289-5500',
    whatsapp: '7132895500',
    website: null,
    rating: 3.5,
    reviewCount: 8,
    mapsUrl: 'https://maps.google.com/?cid=1004',
    opportunityScore: 95,
    scoreBreakdown: calculateOpportunityScore({ website: null, rating: 3.5, reviewCount: 8, phone: '7132895500' }).breakdown,
    status: 'qualificado',
    notes: 'Loja com 300m². Gerente relatou gotejamento constante em 2 máquinas e conta de energia alta.',
    nextFollowUpDate: new Date().toISOString().split('T')[0], // Hoje!
    nextFollowUpNote: 'Apresentar cálculo de economia de energia com filtros limpos',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    source: 'google_places',
    dealValue: 4200,
    openNow: true
  },
  {
    id: 'lead-salvador-5',
    placeId: 'ChIJz2x0-cam-5',
    name: 'Condomínio Empresarial Tancredo Neves',
    segment: 'Condomínios',
    address: 'Av. Tancredo Neves, 1632, Caminho das Árvores',
    city: 'Salvador - BA',
    phone: '(71) 3450-9000',
    whatsapp: '7134509000',
    website: 'https://empresarialtancredoneves.com.br',
    rating: 4.6,
    reviewCount: 94,
    mapsUrl: 'https://maps.google.com/?cid=1005',
    opportunityScore: 25,
    scoreBreakdown: calculateOpportunityScore({ website: 'https://empresarialtancredoneves.com.br', rating: 4.6, reviewCount: 94, phone: '7134509000' }).breakdown,
    status: 'convertido',
    notes: 'Contrato de manutenção predial preventiva e PMOC assinado com vigência de 12 meses.',
    nextFollowUpDate: null,
    createdAt: new Date(Date.now() - 3600000 * 200).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    source: 'landing_page',
    dealValue: 6800,
    openNow: true
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    leadId: 'lead-salvador-2',
    leadName: 'Restaurante Baía Gourmet',
    dueDate: new Date().toISOString().split('T')[0],
    description: 'Enviar proposta comercial personalizada via WhatsApp com planos mensais.',
    completed: false
  },
  {
    id: 'task-2',
    leadId: 'lead-salvador-4',
    leadName: 'Boutique & Loja Bella Casa',
    dueDate: new Date().toISOString().split('T')[0],
    description: 'Telefonar para a gerente Aline para alinhar visita técnica no local.',
    completed: false
  },
  {
    id: 'task-3',
    leadId: 'lead-salvador-1',
    leadName: 'Condomínio Solar das Palmeiras',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    description: 'Ligar para a portaria e solicitar o e-mail ou WhatsApp do síndico em exercício.',
    completed: false
  }
];

export const INITIAL_INTERACTIONS: Interaction[] = [
  {
    id: 'int-1',
    leadId: 'lead-salvador-2',
    type: 'whatsapp',
    content: 'Mensagem de primeiro contato enviada via template "Abordagem Direta".',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'int-2',
    leadId: 'lead-salvador-3',
    type: 'whatsapp',
    content: 'Dra. Camila respondeu: "Temos interesse sim, vocês atendem no sábado pela manhã?"',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'int-3',
    leadId: 'lead-salvador-5',
    type: 'status_change',
    content: 'Status alterado de Qualificado para Convertido (Contrato Anual R$ 6.800/mês).',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

// --- Funções de Storage ---

export function getStoredAccessKey(): string | null {
  // 1. Verifica parâmetro de URL ?key=...
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const keyFromUrl = params.get('key');
    if (keyFromUrl) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_KEY, keyFromUrl.trim());
      return keyFromUrl.trim();
    }
    return localStorage.getItem(STORAGE_KEYS.ACCESS_KEY);
  }
  return null;
}

export function setStoredAccessKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACCESS_KEY, key.trim());
  }
}

export function clearStoredAccessKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_KEY);
  }
}

export function loadLeads(): Lead[] {
  if (typeof window === 'undefined') return INITIAL_LEADS;
  const data = localStorage.getItem(STORAGE_KEYS.LEADS);
  if (!data) {
    saveLeads(INITIAL_LEADS);
    return INITIAL_LEADS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_LEADS;
  }
}

export function saveLeads(leads: Lead[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }
}

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  const data = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!data) {
    saveTasks(INITIAL_TASKS);
    return INITIAL_TASKS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }
}

export function loadInteractions(): Interaction[] {
  if (typeof window === 'undefined') return INITIAL_INTERACTIONS;
  const data = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
  if (!data) {
    saveInteractions(INITIAL_INTERACTIONS);
    return INITIAL_INTERACTIONS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_INTERACTIONS;
  }
}

export function saveInteractions(interactions: Interaction[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(interactions));
  }
}

export function loadTemplates(): MessageTemplate[] {
  if (typeof window === 'undefined') return INITIAL_TEMPLATES;
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  if (!data) {
    saveTemplates(INITIAL_TEMPLATES);
    return INITIAL_TEMPLATES;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_TEMPLATES;
  }
}

export function saveTemplates(templates: MessageTemplate[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }
}

// Exportação CSV com suporte a acentos no Excel (BOM UTF-8)
export function exportLeadsToCSV(leads: Lead[]): void {
  const headers = [
    'ID',
    'Nome da Empresa',
    'Ramo / Segmento',
    'Status no Funil',
    'Opportunity Score',
    'Classificação',
    'Telefone',
    'WhatsApp',
    'Endereço',
    'Cidade',
    'Website',
    'Nota Google',
    'Total Avaliações',
    'Valor Estimado (R$)',
    'Origem',
    'Próximo Follow-up',
    'Anotações'
  ];

  const rows = leads.map(l => [
    l.id,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.segment || '').replace(/"/g, '""')}"`,
    l.status.toUpperCase(),
    l.opportunityScore,
    l.opportunityScore >= 80 ? 'Alta Urgência' : l.opportunityScore >= 65 ? 'Boa Oportunidade' : 'Moderada',
    `"${l.phone || ''}"`,
    `"${l.whatsapp || ''}"`,
    `"${(l.address || '').replace(/"/g, '""')}"`,
    `"${(l.city || '').replace(/"/g, '""')}"`,
    `"${l.website || 'Sem site'}"`,
    l.rating || 0,
    l.reviewCount || 0,
    l.dealValue || 0,
    l.source,
    l.nextFollowUpDate || 'Sem agendamento',
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ledsnet_leads_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
