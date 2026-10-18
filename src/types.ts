export type LeadStatus = 'novo' | 'contatado' | 'respondeu' | 'qualificado' | 'convertido' | 'perdido';

export interface ScoreBreakdown {
  base: number;
  noWebsite: number;
  lowRating: number;
  fewReviews: number;
  contactChannel: number;
}

export interface Lead {
  id: string;
  placeId?: string;
  name: string;
  segment: string;
  address: string;
  city: string;
  phone: string;
  whatsapp?: string;
  website?: string | null;
  rating: number;
  reviewCount: number;
  mapsUrl: string;
  opportunityScore: number;
  scoreBreakdown: ScoreBreakdown;
  status: LeadStatus;
  notes: string;
  nextFollowUpDate?: string | null;
  nextFollowUpNote?: string | null;
  createdAt: string;
  updatedAt: string;
  source: 'google_places' | 'landing_page' | 'manual';
  dealValue?: number;
  openNow?: boolean;
}

export interface Interaction {
  id: string;
  leadId: string;
  type: 'whatsapp' | 'call' | 'note' | 'status_change';
  content: string;
  timestamp: string;
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
  title: string;
  category: 'primeiro_contato' | 'follow_up' | 'proposta';
  text: string;
}

export interface SearchFilters {
  onlyNoWebsite: boolean;
  lowRatingOnly: boolean;
  fewReviewsOnly: boolean;
  minScore: number;
}
