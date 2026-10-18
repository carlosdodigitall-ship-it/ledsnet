import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import healthHandler from './api/health.js';
import searchHandler from './api/leads/search.js';
import captureHandler from './api/leads/capture.js';
import { initFirebaseAdmin } from './api/_lib/firebaseAdmin.js';

dotenv.config();

// Inicializa Firebase Admin no bootstrap do servidor
initFirebaseAdmin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Endpoints da API compartilhados com Vercel Functions
app.get('/api/health', (req: Request, res: Response) => {
  return healthHandler(req, res);
});

app.post('/api/leads/search', (req: Request, res: Response) => {
  return searchHandler(req, res);
});

app.post('/api/leads/capture', (req: Request, res: Response) => {
  return captureHandler(req, res);
});

// Rotas de autenticação, onboarding e aplicação React SPA
const appRoutes = [
  '/entrar',
  '/criar-conta',
  '/verificar-email',
  '/recuperar-senha',
  '/configurar-conta',
  '/painel',
  '/painel/*',
  '/termos',
  '/privacidade',
  '/app',
];

// Rotas da Landing Page
app.get(['/landing', '/vendas'], (_req: Request, res: Response) => {
  const landingPath = path.resolve(__dirname, 'public', 'landing.html');
  if (fs.existsSync(landingPath)) {
    return res.sendFile(landingPath);
  }
  return res.sendFile(path.resolve(__dirname, 'index.html'));
});

async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    for (const route of appRoutes) {
      app.get(route, async (req: Request, res: Response, next: NextFunction) => {
        try {
          const appHtmlPath = path.resolve(__dirname, 'app.html');
          const template = fs.readFileSync(appHtmlPath, 'utf-8');
          const html = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
        } catch (err) {
          next(err);
        }
      });
    }

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    for (const route of appRoutes) {
      app.get(route, (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'app.html'));
      });
    }
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Em ambiente serverless (Vercel), app.listen() não deve ser executado
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`LedsNet Server running at http://0.0.0.0:${PORT}`);
    });
  }
}

// Inicia servidor apenas fora de ambientes serverless puros
if (!process.env.VERCEL) {
  setupServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
