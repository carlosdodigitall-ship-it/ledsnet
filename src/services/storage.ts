import { Lead } from '../types';

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
