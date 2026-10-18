export function processLeadCapture(body: any): { status: number; data: any } {
  const { name, phone, email, segment, interest, notes, utmSource, utmMedium, utmCampaign } = body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return {
      status: 400,
      data: { error: 'O nome é obrigatório para solicitar a demonstração.' },
    };
  }

  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return {
      status: 400,
      data: { error: 'O número de WhatsApp é obrigatório para contato.' },
    };
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return {
      status: 400,
      data: { error: 'Informe um número de WhatsApp válido com DDD.' },
    };
  }

  const newLead = {
    id: `capture-${Date.now()}`,
    name: name.trim(),
    segment: segment || interest || 'Climatização e Serviços',
    address: 'Origem Formulário Web',
    city: 'Brasil / Web',
    phone: phone.trim(),
    whatsapp: cleanPhone,
    email: email && typeof email === 'string' ? email.trim() : null,
    website: null,
    rating: 0,
    reviewCount: 0,
    mapsUrl: '',
    opportunityScore: 85,
    status: 'novo',
    notes: `Lead capturado via Landing Page. Interesse: ${interest || 'Demonstração'}. Obs: ${notes || 'Nenhuma'}. UTMs: [origem: ${utmSource || 'direto'}, mídia: ${utmMedium || 'organico'}, campanha: ${utmCampaign || 'geral'}]`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'landing_page',
    dealValue: 1500,
  };

  return {
    status: 200,
    data: {
      success: true,
      message: 'Demonstração solicitada com sucesso! Entraremos em contato via WhatsApp.',
      lead: newLead,
    },
  };
}
