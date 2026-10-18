# LedsNet — integração do scraper

## Configuração no servidor

Configure apenas nas variáveis de ambiente da Vercel, nunca no frontend:

- FIREBASE_PROJECT_ID: projeto Firebase usado pelo login e pelo Firestore.
- FIRESTORE_DATABASE_ID: banco Firestore configurado para o projeto.
- FIREBASE_SERVICE_ACCOUNT_KEY: JSON da conta de serviço Firebase Admin, guardado como variável secreta/sensível.
- SCRAPER_API_URL e SCRAPER_API_KEY: somente para a API privada do scraper configurada no backend.

Ative **Authentication → Sign-in method → Email/Password** e inclua o domínio do LedsNet em **Authentication → Settings → Authorized domains**. A conta de serviço deve ter acesso ao Firestore e à validação de usuários.

## Dados por usuário

As rotas de leads usam users/{uid}/leads; tarefas, interações, templates, logs e configurações também ficam dentro do documento do usuário. O backend valida o Firebase ID token e não deve recorrer a armazenamento em memória em caso de falha.

Os jobs ficam em scraper_jobs, cada um com ownerId; consultas e cancelamentos conferem o proprietário. Capturas públicas são armazenadas separadamente em public_captures.

## Endpoints do scraper

Todos exigem Authorization: Bearer <Firebase ID token>:

- GET /api/scraper/health
- POST /api/scraper/jobs
- GET /api/scraper/jobs/:jobId
- DELETE /api/scraper/jobs/:jobId

A integração usa POST /api/v1/scrape, GET /api/v1/jobs/{job_id}, DELETE /api/v1/jobs/{job_id} e GET /api/v1/health, conforme o contrato esperado pelo cliente do LedsNet. Valide a versão instalada do scraper antes de habilitar em produção.

## Importação via GitHub Actions

O workflow LedsNet - Buscar leads no Google Maps usa as Actions Variables FIREBASE_PROJECT_ID e FIRESTORE_DATABASE_ID e o Actions Secret FIREBASE_SERVICE_ACCOUNT_KEY. O UID informado precisa existir no projeto Firebase. O resultado é salvo em users/{uid}/leads e o JSON bruto é preservado como artefato por sete dias.

## Limitações

- A coleta via Actions é manual e não equivale a uma fila contínua nem a um botão integrado ao painel.
- O scraper pode sofrer bloqueios e não garante telefone/e-mail para toda empresa.
- A interface e os dados precisam ser testados em deploy real, incluindo isolamento entre duas contas.
- Respeite os termos aplicáveis, LGPD, finalidade/base legal e solicitações de não contato.
