export type LeadStatus =
  | 'novo'
  | 'contatado'
  | 'respondeu'
  | 'qualificado'
  | 'convertido'
  | 'perdido'
  | 'nao_contatar';

export interface ScoreBreakdown {
  base: number;
  noWebsite: number;
  lowRating: number;
  fewReviews: number;
  contactChannel: number;
}

export interface Lead {
  id: string;
  // Campos normalizados do Firestore
  nome: string;
  endereco: string;
  telefone: string; // Formato E.164 sem o +
  place_id?: string;
  placeId?: string;
  nota: number;
  numeroAvaliacoes: number;
  site?: string | null;
  ramo: string;
  regiao: string;
  score: number;
  status: LeadStatus;
  motivoPerda?: string | null;
  proximoContato?: string | null;
  origem: 'places' | 'formulario' | 'importacao';
  criadoEm: string;
  atualizadoEm: string;

  // Aliases compatíveis com os componentes visuais
  name?: string;
  segment?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  website?: string | null;
  rating?: number;
  reviewCount?: number;
  mapsUrl?: string;
  opportunityScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  notes?: string;
  nextFollowUpDate?: string | null;
  nextFollowUpNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
  source?: 'google_places' | 'landing_page' | 'manual' | 'formulario' | 'places' | 'importacao';
  dealValue?: number;
  openNow?: boolean;
}

export interface Interaction {
  id: string;
  leadId: string;
  tipo: 'mensagem_enviada' | 'resposta' | 'anotacao';
  conteudo: string;
  criadoEm: string;

  // Aliases
  type?: 'mensagem_enviada' | 'resposta' | 'anotacao' | 'whatsapp' | 'call' | 'note' | 'status_change';
  content?: string;
  timestamp?: string;
}

export interface Task {
  id: string;
  leadId: string;
  leadName: string;
  dueDate: string;
  description: string;
  completed: boolean;
}

export interface MessageTemplate {
  id: string;
  titulo: string;
  texto: string; // Suporta variáveis {nome}, {empresa} e {bairro}

  // Aliases
  title?: string;
  category?: 'primeiro_contato' | 'follow_up' | 'proposta';
  text?: string;
}

export interface Configuracao {
  id: string;
  pesoSemSite: number;
  pesoBaixaNota: number;
  pesoPoucasAvaliacoes: number;
  limiteDiarioEnvios: number;
  intervaloMinimoSegundos: number;
  intervaloMaximoSegundos: number;
  instanciaEvolution: string;
}

export interface LogEnvio {
  id: string;
  leadId: string;
  status: 'sucesso' | 'erro';
  erro?: string | null;
  criadoEm: string;
}

export interface SearchFilters {
  onlyNoWebsite: boolean;
  lowRatingOnly: boolean;
  fewReviewsOnly: boolean;
  minScore: number;
}
