const getConfig = () => {
  const baseUrl = process.env.SCRAPER_API_URL?.trim().replace(/\/+$/, '');
  const apiKey = process.env.SCRAPER_API_KEY?.trim();
  if (!baseUrl || !apiKey) {
    throw new Error('Scraper não configurado. Defina SCRAPER_API_URL e SCRAPER_API_KEY no ambiente do servidor.');
  }
  return { baseUrl, apiKey };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { baseUrl, apiKey } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(20_000),
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { message: text.slice(0, 500) }; }
  }
  if (!response.ok) {
    const detail = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `HTTP ${response.status}`;
    throw new Error(`Falha no scraper (${response.status}): ${detail}`);
  }
  return payload as T;
}

export type ScraperJobInput = {
  keyword: string;
  lang?: string;
  max_depth?: number;
  email?: boolean;
  extra_reviews?: boolean;
  fast_mode?: boolean;
  geo_coordinates?: string;
  radius?: number;
  timeout?: number;
  zoom?: number;
};

export const scraperClient = {
  createJob(input: ScraperJobInput) {
    // O código atual do gosom/google-maps-scraper registra POST /api/v1/scrape.
    return request<{ job_id?: string; id?: string; status?: string; [key: string]: unknown }>(
      '/api/v1/scrape',
      { method: 'POST', body: JSON.stringify(input) },
    );
  },
  getJob(jobId: string) {
    return request<Record<string, unknown>>(`/api/v1/jobs/${encodeURIComponent(jobId)}`);
  },
  cancelJob(jobId: string) {
    return request<Record<string, unknown>>(`/api/v1/jobs/${encodeURIComponent(jobId)}`, { method: 'DELETE' });
  },
  health() {
    return request<Record<string, unknown>>('/api/v1/health');
  },
};
