import { ScoreBreakdown } from '../types';

export function calculateOpportunityScore(params: {
  website?: string | null;
  rating?: number;
  reviewCount?: number;
  phone?: string;
}): { score: number; breakdown: ScoreBreakdown; urgencyLabel: 'Alta Urgência' | 'Boa Oportunidade' | 'Moderada' | 'Monitoramento' } {
  const base = 10;
  
  // 1. Presença Web (Site)
  let noWebsite = 0;
  const hasSite = params.website && params.website.trim().length > 3 && !params.website.toLowerCase().includes('sem site');
  if (!hasSite) {
    noWebsite = 40; // Sem site oficial: oportunidade alta
  } else if (
    params.website?.includes('wixsite.com') ||
    params.website?.includes('blogspot.com') ||
    params.website?.includes('business.site') ||
    params.website?.includes('wordpress.com')
  ) {
    noWebsite = 20; // Domínio genérico/gratuito
  } else {
    noWebsite = 0; // Site próprio
  }

  // 2. Nota Google
  let lowRating = 0;
  const rating = params.rating ?? 0;
  if (rating === 0) {
    lowRating = 20; // Sem nota/novo
  } else if (rating < 3.8) {
    lowRating = 25; // Baixa nota: dor latente
  } else if (rating <= 4.4) {
    lowRating = 15; // Nota média
  } else {
    lowRating = 5; // Boa nota
  }

  // 3. Volume de Avaliações
  let fewReviews = 0;
  const reviews = params.reviewCount ?? 0;
  if (reviews < 15) {
    fewReviews = 15; // Poucas avaliações: pouca autoridade online
  } else if (reviews <= 50) {
    fewReviews = 10;
  } else {
    fewReviews = 5;
  }

  // 4. Canal de Contato
  let contactChannel = 0;
  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  // No Brasil números com 8 dígitos (fixos) ou sem 9º dígito
  if (cleanPhone.length > 0 && cleanPhone.length <= 10) {
    contactChannel = 10; // Apenas fixo, sem WhatsApp direto evidente
  } else {
    contactChannel = 0;
  }

  const total = Math.min(100, Math.max(10, base + noWebsite + lowRating + fewReviews + contactChannel));

  let urgencyLabel: 'Alta Urgência' | 'Boa Oportunidade' | 'Moderada' | 'Monitoramento' = 'Moderada';
  if (total >= 80) urgencyLabel = 'Alta Urgência';
  else if (total >= 65) urgencyLabel = 'Boa Oportunidade';
  else if (total >= 50) urgencyLabel = 'Moderada';
  else urgencyLabel = 'Monitoramento';

  return {
    score: total,
    breakdown: {
      base,
      noWebsite,
      lowRating,
      fewReviews,
      contactChannel
    },
    urgencyLabel
  };
}
