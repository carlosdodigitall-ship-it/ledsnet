# LedsNet — Google Maps Scraper Kit + Firebase

## Arquitetura adotada

O LedsNet usa **Firebase Authentication + Cloud Firestore** como camada de dados. O Supabase não faz parte desta arquitetura.

- Autenticação de usuários: Firebase Authentication (e-mail/senha).
- Dados de cada conta: subcoleções users/{uid}/leads, tasks, interactions, templates, send_logs e settings.
- Jobs do scraper: coleção scraper_jobs, cada documento com ownerId e verificação de propriedade nas consultas.
- Capturas públicas de formulários: coleção separada public_captures.
- Backend: Express em server.ts, exposto por api/[...path].ts na Vercel.
- Coleta: gosom/google-maps-scraper executado por demanda via GitHub Actions.

## Repositório de referência

O projeto de referência é [felipenunes07/google-maps-scraper-kit](https://github.com/felipenunes07/google-maps-scraper-kit), com licença MIT, baseado em [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper). O scraper pode coletar nome, telefone, site, e-mail quando disponível, categoria, endereço, nota e quantidade de avaliações.

O kit original é orientado à execução local. A API do scraper não deve ser exposta publicamente sem autenticação. O workflow atual executa um contêiner no runner do GitHub e grava os resultados no Firestore do usuário informado, depois de validar que o UID existe no projeto Firebase.

## Configuração do Firebase

### Vercel — servidor

Configure as variáveis abaixo no projeto Vercel canônico do LedsNet, nos ambientes Preview e Production conforme necessário:

- FIREBASE_PROJECT_ID: ID real do projeto Firebase.
- FIRESTORE_DATABASE_ID: ID do banco Firestore configurado no projeto; use o valor padrão somente se a aplicação realmente usar o banco (default).
- FIREBASE_SERVICE_ACCOUNT_KEY: conteúdo JSON completo de uma conta de serviço do Firebase Admin, armazenado como variável secreta/sensível. Nunca use prefixo VITE_ e nunca faça commit do JSON.

A conta de serviço precisa ter permissão para autenticar usuários e ler/gravar no banco Firestore especificado. A ausência de credenciais não habilita fallback em memória: as APIs devem falhar explicitamente em vez de reportar gravações falsas.

### GitHub Actions — importação de resultados

No repositório carlosdodigitall-ship-it/ledsnet, abra **Settings → Secrets and variables → Actions**:

- Variable FIREBASE_PROJECT_ID: o mesmo projeto usado pelo app.
- Variable FIRESTORE_DATABASE_ID: o mesmo banco Firestore usado pelo app.
- Secret FIREBASE_SERVICE_ACCOUNT_KEY: JSON da conta de serviço do Firebase Admin.

Depois, abra **Actions → LedsNet - Buscar leads no Google Maps → Run workflow**. Informe o termo/região, o Firebase UID de um usuário existente, se deseja extração de e-mails e a profundidade. O workflow valida o UID com Firebase Authentication antes de gravar. O JSON bruto fica disponível como artefato por sete dias.

## Fluxo de dados

1. O usuário autentica com Firebase Authentication.
2. O backend valida o Firebase ID token.
3. Leads e dados do CRM são armazenados em subcoleções vinculadas ao UID autenticado.
4. O importador normaliza JSON/JSONL do scraper e faz upsert por ID determinístico derivado do place_id, evitando duplicatas dentro da lista daquele usuário.
5. A interface carrega leads, tarefas, interações e modelos pelas APIs autenticadas do backend.

## Testes

Testes offline do normalizador: python3 -m unittest discover -s tests -v

Validação de TypeScript e build: npm run lint e npm run build.

## Limitações e segurança

- O workflow de coleta é manual; não é um serviço contínuo e ainda não é iniciado diretamente por um botão do painel.
- Antes de marcar como produção, é necessário executar o workflow com credenciais válidas, verificar login, buscar leads, confirmar gravação no Firestore e testar isolamento entre duas contas.
- O scraper pode ser bloqueado ou limitado pela fonte. E-mails e telefones não são garantidos.
- Os dados devem ser usados conforme os termos aplicáveis, a LGPD, finalidade/base legal e pedidos de não contato.
- Os endpoints do backend não devem usar fallback em memória para leads, tarefas, interações, templates ou configurações.
- O endpoint público de captura guarda solicitações em public_captures, separado dos leads privados de usuários.
