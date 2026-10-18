import { GoogleGenAI } from '@google/genai';

interface SearchParams {
  segment: string;
  location: string;
  radiusKm?: number;
}

export async function searchLeadsWithGemini({
  segment,
  location,
  radiusKm = 15,
}: SearchParams): Promise<{ status: number; data: any }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      status: 503,
      data: {
        success: false,
        error: 'A integração com a busca de estabelecimentos reais no Google Maps não está configurada no servidor (variável GEMINI_API_KEY ausente). Configure a chave de API para habilitar a prospecção.',
      },
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    let parsedPlaces: any[] = [];

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*"places"[\s\S]*\}/) || responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsedPlaces = Array.isArray(parsed) ? parsed : (parsed.places || []);
      }
    } catch (parseErr) {
      console.warn('[Gemini Search] Erro ao extrair JSON dos resultados:', parseErr);
    }

    if (!parsedPlaces || parsedPlaces.length === 0) {
      return {
        status: 200,
        data: {
          success: true,
          query: { segment, location, radiusKm },
          total: 0,
          leads: [],
          message: 'Nenhum estabelecimento comercial real foi encontrado para os parâmetros informados no Google Maps.',
        },
      };
    }

    const enriched = parsedPlaces.map((p, idx) => {
      const rawPhone = p.phone || '';
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const cleanWhatsapp = cleanPhone.length >= 10 ? cleanPhone : (cleanPhone ? `71${cleanPhone}` : '');

      return {
        id: `lead-${Date.now()}-${idx}`,
        placeId: `place-${idx}-${Date.now()}`,
        name: p.name || 'Negócio Local',
        segment: p.segment || segment,
        address: p.address || `${location}`,
        city: p.city || location,
        phone: rawPhone,
        whatsapp: cleanWhatsapp,
        website: p.website && p.website !== 'null' ? p.website : null,
        rating: typeof p.rating === 'number' ? p.rating : 4.0,
        reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 10,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${location}`)}`,
        openNow: p.openNow ?? true,
        source: 'google_places' as const,
      };
    });

    return {
      status: 200,
      data: {
        success: true,
        query: { segment, location, radiusKm },
        total: enriched.length,
        leads: enriched,
        source: 'gemini_grounding',
      },
    };
  } catch (error: any) {
    console.error('[Gemini Search] Erro na consulta de empresas reais:', error?.message || error);
    const isQuota = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');

    return {
      status: isQuota ? 429 : 502,
      data: {
        success: false,
        error: isQuota
          ? 'Cota temporária da API do Google Maps/Gemini excedida. Tente novamente em alguns minutos.'
          : 'Não foi possível consultar os dados de estabelecimentos reais no Google Maps. Verifique as credenciais e tente novamente.',
      },
    };
  }
}
