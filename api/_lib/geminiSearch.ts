interface SearchParams {
  segment: string;
  location: string;
  radiusKm?: number;
}

type OsmElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type GeoResult = { lat: string; lon: string; display_name: string };

const USER_AGENT = 'LedsNet/1.0 (https://ledsnet.vercel.app)';

function categoryFilters(segment: string): string[] {
  const value = segment.toLocaleLowerCase('pt-BR');
  if (/climat|refrigera|ar.?condicionado|hvac/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["craft"="hvac"];',
      'nwr(around:{radius},{lat},{lon})["shop"="appliance"];',
      'nwr(around:{radius},{lat},{lon})["shop"="electronics"];',
      'nwr(around:{radius},{lat},{lon})["craft"="electrician"];',
    ];
  }
  if (/restaurante|lanchonete|pizzaria|comida|aliment/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["amenity"~"restaurant|fast_food|food_court"];',
      'nwr(around:{radius},{lat},{lon})["amenity"="cafe"];',
    ];
  }
  if (/barbear|sal[aã]o|beleza|cabeleireir/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["shop"~"hairdresser|beauty"];',
    ];
  }
  if (/mercado|supermercado|mercearia|conveni[eê]ncia/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["shop"~"supermarket|convenience|greengrocer"];',
    ];
  }
  if (/m[eé]dic|cl[ií]nica|dent|sa[uú]de|farm[aá]cia/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["amenity"~"clinic|dentist|doctors|pharmacy"];',
      'nwr(around:{radius},{lat},{lon})["healthcare"];',
    ];
  }
  if (/oficina|mec[aâ]nic|autom[oó]v|autopeça|pneu/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["shop"~"car_repair|car_parts|tyres"];',
      'nwr(around:{radius},{lat},{lon})["amenity"="car_repair"];',
    ];
  }
  if (/hotel|pousada|hosped/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["tourism"~"hotel|guest_house|hostel"];',
    ];
  }
  if (/escrit[oó]rio|contabilidade|advocacia|consultoria/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["office"];',
    ];
  }
  if (/loja|com[eé]rcio|varejo/.test(value)) {
    return [
      'nwr(around:{radius},{lat},{lon})["shop"];',
    ];
  }

  // For other business segments, use common OSM business tags. Results are
  // still real OpenStreetMap features; no AI-generated companies are returned.
  return [
    'nwr(around:{radius},{lat},{lon})["shop"];',
    'nwr(around:{radius},{lat},{lon})["office"];',
    'nwr(around:{radius},{lat},{lon})["craft"];',
    'nwr(around:{radius},{lat},{lon})["amenity"~"restaurant|cafe|clinic|dentist|doctors|pharmacy|car_repair"];',
  ];
}

function getCoordinates(element: OsmElement): { lat: number; lon: number } | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  return typeof lat === 'number' && typeof lon === 'number' ? { lat, lon } : null;
}

function addressFromTags(tags: Record<string, string>, fallback: string): string {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', ');
  const locality = [tags['addr:suburb'], tags['addr:city'], tags['addr:state']].filter(Boolean).join(', ');
  const parts = [street, tags['addr:postcode'], locality].filter(Boolean);
  return parts.length ? parts.join(' - ') : fallback;
}

export async function searchLeadsWithGemini({
  segment,
  location,
  radiusKm = 15,
}: SearchParams): Promise<{ status: number; data: any }> {
  // Free, public OpenStreetMap services. Their usage policies and rate limits apply.
  if (!segment.trim() || !location.trim()) {
    return {
      status: 400,
      data: { success: false, error: 'Informe o segmento e a região para pesquisar.' },
    };
  }

  const safeRadiusKm = Math.min(50, Math.max(1, Number(radiusKm) || 15));
  const radius = Math.round(safeRadiusKm * 1000);

  try {
    const geocodeUrl = new URL('https://nominatim.openstreetmap.org/search');
    geocodeUrl.searchParams.set('q', `${location.trim()}, Brasil`);
    geocodeUrl.searchParams.set('format', 'jsonv2');
    geocodeUrl.searchParams.set('limit', '1');
    geocodeUrl.searchParams.set('countrycodes', 'br');

    const geocodeResponse = await fetch(geocodeUrl, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR,pt;q=0.9' },
    });

    if (geocodeResponse.status === 429) {
      return {
        status: 503,
        data: { success: false, error: 'O serviço gratuito de localização está temporariamente ocupado. Aguarde um minuto e tente novamente.' },
      };
    }
    if (!geocodeResponse.ok) {
      throw new Error(`Nominatim geocoding failed: HTTP ${geocodeResponse.status}`);
    }

    const geocoded = (await geocodeResponse.json()) as GeoResult[];
    if (!geocoded.length) {
      return {
        status: 200,
        data: {
          success: true, query: { segment, location, radiusKm: safeRadiusKm },
          total: 0, leads: [], source: 'openstreetmap',
          message: 'Não encontramos essa região no OpenStreetMap. Confira o nome da cidade e o estado.',
        },
      };
    }

    const center = geocoded[0];
    const clauses = categoryFilters(segment)
      .map((clause) => clause.replaceAll('{radius}', String(radius))
        .replaceAll('{lat}', center.lat).replaceAll('{lon}', center.lon))
      .join('\n');
    const query = `[out:json][timeout:25];(\n${clauses}\n);out center tags;`;

    const overpassResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': USER_AGENT,
      },
      body: new URLSearchParams({ data: query }).toString(),
    });

    if (overpassResponse.status === 429 || overpassResponse.status === 504) {
      return {
        status: 503,
        data: { success: false, error: 'O serviço gratuito de mapas está com alta demanda. Aguarde um pouco e tente novamente.' },
      };
    }
    if (!overpassResponse.ok) {
      throw new Error(`Overpass query failed: HTTP ${overpassResponse.status}`);
    }

    const payload = await overpassResponse.json() as { elements?: OsmElement[] };
    const seen = new Set<string>();
    const leads = (payload.elements || [])
      .filter((element) => element.tags?.name)
      .filter((element) => {
        const key = `${element.type}/${element.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 100)
      .map((element) => {
        const tags = element.tags || {};
        const coords = getCoordinates(element);
        const name = tags.name!;
        const phone = tags.phone || tags['contact:phone'] || '';
        const website = tags.website || tags['contact:website'] || null;
        const osmType = element.type;
        const osmId = element.id;
        return {
          id: `osm-${osmType}-${osmId}`,
          placeId: `osm-${osmType}-${osmId}`,
          name,
          segment: tags.shop || tags.amenity || tags.office || tags.craft || segment.trim(),
          address: addressFromTags(tags, center.display_name),
          city: location.trim(),
          phone,
          whatsapp: phone.replace(/\D/g, ''),
          website,
          mapsUrl: coords
            ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=18/${coords.lat}/${coords.lon}`
            : `https://www.openstreetmap.org/search?query=${encodeURIComponent(name + ' ' + location)}`,
          source: 'openstreetmap' as const,
          sourceUrl: coords
            ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=18/${coords.lat}/${coords.lon}`
            : undefined,
        };
      });

    return {
      status: 200,
      data: {
        success: true,
        query: { segment: segment.trim(), location: location.trim(), radiusKm: safeRadiusKm },
        total: leads.length,
        leads,
        source: 'openstreetmap',
        message: leads.length
          ? 'Resultados obtidos de dados mapeados no OpenStreetMap. Telefones, sites e endereços podem estar ausentes ou desatualizados.'
          : 'O OpenStreetMap não retornou locais mapeados para esse segmento e região. Experimente um segmento mais amplo ou um raio maior.',
      },
    };
  } catch (error: any) {
    console.error('[OpenStreetMap Search] Error:', error?.message || error);
    return {
      status: 502,
      data: {
        success: false,
        error: 'Não foi possível consultar os serviços gratuitos de mapas agora. Tente novamente em instantes.',
      },
    };
  }
}
