import { describe, it } from 'node:test';
import assert from 'node:assert';
import healthHandler from '../api/health.js';
import searchHandler from '../api/leads/search.js';
import captureHandler from '../api/leads/capture.js';
import { searchLeadsWithGemini } from '../api/_lib/geminiSearch.js';

function createMockReq(overrides: Record<string, any> = {}) {
  return {
    method: 'GET',
    headers: {} as Record<string, string>,
    header(name: string) {
      return this.headers[name.toLowerCase()] || '';
    },
    body: {},
    ...overrides,
  };
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return this;
    },
    setHeader(key: string, value: string) {
      this.headers[key] = value;
    },
    end(data?: string) {
      if (data && !this.body) {
        try {
          this.body = JSON.parse(data);
        } catch {
          this.body = data;
        }
      }
    },
  };
  return res;
}

describe('Testes de Endpoints e Vercel Serverless Functions — LedsNet', () => {
  it('1. /api/health retorna status 200 com informações do serviço', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();

    await healthHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.service, 'LedsNet API');
    assert.strictEqual(typeof res.body.hasApiKey, 'boolean');
  });

  it('2. /api/leads/search rejeita requisições não autenticadas com 401', async () => {
    const req = createMockReq({
      method: 'POST',
      headers: {},
      body: { segment: 'Restaurantes', location: 'Salvador' },
    });
    const res = createMockRes();

    await searchHandler(req, res);

    assert.strictEqual(res.statusCode, 401);
    assert.ok(res.body.error, 'Deve retornar mensagem de erro para usuário não autenticado');
  });

  it('3. /api/leads/capture valida campos obrigatórios (nome e telefone)', async () => {
    const reqEmpty = createMockReq({ method: 'POST', body: {} });
    const resEmpty = createMockRes();
    await captureHandler(reqEmpty, resEmpty);

    assert.strictEqual(resEmpty.statusCode, 400);
    assert.ok(resEmpty.body.error.includes('nome'));

    const reqNoPhone = createMockReq({ method: 'POST', body: { name: 'Carlos Digital' } });
    const resNoPhone = createMockRes();
    await captureHandler(reqNoPhone, resNoPhone);

    assert.strictEqual(resNoPhone.statusCode, 400);
    assert.ok(resNoPhone.body.error.includes('WhatsApp'));
  });

  it('4. /api/leads/capture processa e sanitiza lead válido com sucesso', async () => {
    const req = createMockReq({
      method: 'POST',
      body: {
        name: 'Maria Oliveira',
        phone: '(71) 99123-4567',
        email: 'maria@empresa.com.br',
        segment: 'Climatização',
        utmSource: 'google',
      },
    });
    const res = createMockRes();

    await captureHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.lead.name, 'Maria Oliveira');
    assert.strictEqual(res.body.lead.whatsapp, '71991234567');
  });

  it('5. Regra anti-mock: Se GEMINI_API_KEY não estiver presente, retorna erro explícito e NUNCA leads fictícios', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      const result = await searchLeadsWithGemini({ segment: 'Clínicas', location: 'Salvador' });
      assert.strictEqual(result.status, 503);
      assert.strictEqual(result.data.success, false);
      assert.ok(result.data.error.includes('GEMINI_API_KEY'));
      assert.strictEqual(result.data.leads, undefined, 'Não deve conter array de leads mockados');
    } finally {
      if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    }
  });
});
