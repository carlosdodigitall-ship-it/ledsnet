interface SearchParams {
  segment: string;
  location: string;
  radiusKm?: number;
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  currentOpeningHours?: { openNow?: boolean };
}

export async function searchLeadsWithGemini({
  segment,
  location,
  radiusKm = 15,
}: SearchParams): Promise<{ status: number; data: any }> {
  // Despite the legacy function name, this now queries Google Places directly.
  // Configure GOOGLE_MAPS_API_KEY in the Vercel server environment.
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      status: 503,
      data: {
        success: false,
        error: 'A busca real do Google Maps não está configurada. Adicione GOOGLE_MAPS_API_KEY nas variáveis de ambiente da Vercel e habilite a Places API (New) no Google Cloud.',
      },
    };
  }

  if (!segment.trim() || !location.trim()) {
    return {
      status: 400,
      data: { success: false, error: 'Informe o segmento e a região para pesquisar.' },
    };
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.nationalPhoneNumber',
          'places.internationalPhoneNumber',
          'places.websiteUri',
          'places.rating',
          'places.userRatingCount',
          'places.googleMapsUri',
          'places.currentOpeningHours.openNow',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery: `${segment.trim()} em ${location.trim()}, Brasil`,
        languageCode: 'pt-BR',
        regionCode: 'BR',
        pageSize: 20,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiStatus = payload?.error?.status;
      const apiMessage = payload?.error?.message;
      console.error('[Google Places] API request failed:', response.status, apiStatus, apiMessage);

      if (response.status === 403) {
        return {
          status: 502,
          data: {
            success: false,
            error: 'O Google recusou a consulta. Confira se a Places API (New) está habilitada no projeto Google Cloud, se a chave GOOGLE_MAPS_API_KEY está correta e se o faturamento está ativo.',
          },
        };
      }

      if (response.status === 429) {
        return {
          status: 429,
          data: {
            success: false,
            error: 'A cota da API Google Places foi excedida. Verifique as cotas e o faturamento no Google Cloud.',
          },
        };
      }

      return {
        status: 502,
        data: {
          success: false,
          error: 'A consulta ao Google Places falhou. Verifique a chave de API, as restrições da chave e a configuração do Google Cloud.',
        },
      };
    }

    const places: GooglePlace[] = Array.isArray(payload?.places) ? payload.places : [];
    const leads = places
      .filter((place) => place.id && place.displayName?.text)
      .map((place) => {
        const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
        const digits = phone.replace(/\\D/g, '');

        return {
          id: place.id,
          placeId: place.id,
          name: place.displayName!.text!,
          segment: segment.trim(),
          address: place.formattedAddress || location.trim(),
          city: location.trim(),
          phone,
          whatsapp: digits,
          website: place.websiteUri || null,
          ...(typeof place.rating === 'number' ? { rating: place.rating } : {}),
          ...(typeof place.userRatingCount === 'number' ? { reviewCount: place.userRatingCount } : {}),
          mapsUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.displayName!.text} ${location}`)}`,
          ...(typeof place.currentOpeningHours?.openNow === 'boolean'
            ? { openNow: place.currentOpeningHours.openNow }
            : {}),
          source: 'google_places' as const,
        };
      });

    return {
      status: 200,
      data: {
        success: true,
        query: { segment, location, radiusKm },
        total: leads.length,
        leads,
        source: 'google_places_api',
        message: leads.length ? undefined : 'O Google Places não retornou estabelecimentos para essa pesquisa. Tente outro segmento ou região.',
      },
    };
  } catch (error: any) {
    console.error('[Google Places] Request error:', error?.message || error);
    return {
      status: 502,
      data: {
        success: false,
        error: 'Não foi possível conectar ao Google Places. Tente novamente e confira a disponibilidade da API.',
      },
    };
  }
}
