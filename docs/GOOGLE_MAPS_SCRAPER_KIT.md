# LedsNet — integração do Google Maps Scraper Kit

## Repositório de referência confirmado

O repositório correto é [felipenunes07/google-maps-scraper-kit](https://github.com/felipenunes07/google-maps-scraper-kit), branch `master`, licença MIT.

Ele é uma camada de conveniência em torno de [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper). Acrescenta Docker Compose, uma interface web em português com mapa e painel, scripts Python/Bash para consultas individuais e em lote, geocodificação via Nominatim e enriquecimento opcional de links sociais a partir dos sites das empresas. A saída padrão inclui nome, telefone, e-mail, site, categoria, endereço, nota e quantidade de avaliações.

## Plano de integração no LedsNet

A integração deve reutilizar a lógica e a interface relevantes sem substituir o frontend, o Firebase Auth ou o banco atual do LedsNet. O fluxo pretendido é:

1. O usuário autenticado informa categoria/termo e região do Brasil.
2. O backend executa a coleta com limites de concorrência e profundidade.
3. Os resultados são normalizados pelo importador do LedsNet.
4. Os registros são enviados ao Supabase e associados ao Firebase UID autenticado.
5. A tela de leads exibe os resultados e permite filtrar/exportar, sem expor chaves secretas ao navegador.

**Importante:** o kit original foi desenhado para execução local. O Docker Compose publica o serviço somente em `127.0.0.1:8080`, pois a API do scraper não tem autenticação própria. Não exponha essa API publicamente sem uma camada de autenticação e controles de acesso. Para uso multiusuário no LedsNet, o scraper precisa rodar em um worker/serviço controlado, não no navegador do cliente.

## Fluxo já preparado no LedsNet

1. O usuário dispara manualmente o workflow **LedsNet - Buscar leads no Google Maps** em GitHub Actions.
2. O workflow executa o scraper em um runner temporário do GitHub, sem exigir VPS própria.
3. O resultado é normalizado pelo arquivo **scripts/import_scraper_results.py**.
4. Os registros são enviados ao Supabase em lotes de até 100 e associados ao Firebase UID informado.
5. O índice único **(user_id, place_id)** permite atualizar registros repetidos sem duplicá-los.
6. O arquivo bruto é salvo como artefato do workflow por sete dias para diagnóstico.

Esse workflow é uma etapa de importação manual e não significa que a interface completa do kit já esteja incorporada ao produto nem que a coleta de ponta a ponta tenha sido validada em produção.

## Formatos aceitos pelo importador

O importador aceita JSON com lista, JSON com uma lista dentro de `results`, `places`, `data` ou `items`, um objeto único e JSON Lines (um objeto por linha). Ele reconhece os campos do scraper, incluindo `title`, `link`, `cid`, `review_rating` e `review_count`, além de aliases comuns.

Testes locais sem rede:

    python3 -m unittest discover -s tests -v

## Configuração necessária

Cadastre os secrets em **Settings → Secrets and variables → Actions** no repositório:

- **SUPABASE_URL**: URL do projeto Supabase do LedsNet.
- **SUPABASE_SERVICE_ROLE_KEY**: chave secreta de servidor do mesmo projeto. Nunca a exponha no frontend, logs ou commits.

Ao executar o workflow, informe um Firebase UID válido. O workflow atual usa esse UID como proprietário dos leads importados; antes de habilitar o recurso para todos os usuários, o backend deve validar que o UID enviado corresponde ao usuário autenticado que solicitou a busca.

## Limites e responsabilidade

- A execução atual do workflow é manual e pontual; não é um serviço de scraping contínuo.
- GitHub Actions fornece runners temporários, mas limites de uso e disponibilidade dependem das cotas da conta GitHub.
- O projeto original alerta que o Google Maps pode limitar ou bloquear temporariamente tráfego automatizado. Comece com profundidade baixa e uma busca por vez.
- Os resultados devem ser verificados antes do contato. Respeite os termos aplicáveis, a LGPD, a finalidade e a base legal para tratamento de dados pessoais e solicitações de não contato.
- E-mails e telefones não são garantidos para cada empresa.

## Estado real de deploy (não marcar como produção ainda)

A validação do PR identificou dois bloqueios externos/de integração:

- O CI falhou na checagem TypeScript em `src/server/scraperRoutes.ts`; o ajuste de tipo já foi enviado no commit `880dc9c`. A próxima execução precisa confirmar que `npm run lint` e `npm run build` passam.
- Os checks Vercel associados ao repositório retornaram falha por limite de builds do workspace (`build-rate-limit`). Isso precisa ser liberado no painel Vercel; não é um erro corrigível pelo código do scraper.

O deploy estático atual de Vite, por si só, não comprova que as rotas Express `/api/*` estejam publicadas como funções serverless. Antes de anunciar a aplicação como pronta, validar um deploy de preview com login Firebase, `/api/health`, busca autenticada e persistência real. Não considerar o scraper conectado apenas porque o frontend compila.

### Variáveis privadas a conferir no ambiente de servidor

- `FIREBASE_SERVICE_ACCOUNT_KEY` (credencial JSON de servidor, nunca no frontend)
- `SCRAPER_API_URL` e `SCRAPER_API_KEY` (somente se for usar o serviço compatível com o cliente de scraper já existente)
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (para a integração Supabase/importador)

Os nomes devem coincidir com o código e o ambiente efetivamente implantado. Nunca commitar valores secretos nem colocá-los em `VITE_*`.

## Atualização operacional — 18/10/2026

- O workflow `LedsNet CI` run #49 terminou com sucesso: testes Python, TypeScript e build de produção passaram.
- A função catch-all `api/[...path].ts` já existe e exporta o Express do `server.ts`; `vercel.json` mantém o build Vite e a pasta `dist`. Isso valida a configuração de entrada no repositório, mas não substitui um teste HTTP em um deploy atualizado.
- A Vercel recusou novo deploy pela API com `402 payment_required`: limite gratuito de mais de 100 chamadas de deployment por dia, solicitar nova tentativa após 24 horas. Os checks Git anteriores também sinalizaram `build-rate-limit`. Não alterar plano/faturamento automaticamente.
- Nos projetos Vercel `ledsnet` e `ledsnet-l7hs`, a listagem de variáveis retornou `FIREBASE_PROJECT_ID`, `FIRESTORE_DATABASE_ID` e `SUPABASE_URL`; não retornou `FIREBASE_SERVICE_ACCOUNT_KEY` nem `SUPABASE_SERVICE_ROLE_KEY`. As credenciais privadas precisam ser adicionadas manualmente por alguém autorizado.

### Ações manuais necessárias antes da produção

1. Vercel → projeto `ledsnet` → Settings → Environment Variables: adicionar `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON da conta de serviço Firebase Admin) e `SUPABASE_SERVICE_ROLE_KEY` (chave secreta do projeto Supabase), nos ambientes Preview e Production conforme necessário.
2. Repetir a configuração no projeto `ledsnet-l7hs` apenas se ele continuar sendo usado; idealmente manter um projeto Vercel canônico para evitar builds duplicados.
3. Após a janela de rate limit da Vercel, implantar o commit mais recente de `feat/maps-scraper-kit-adapter` e testar `/api/health`, login Firebase, endpoint autenticado de busca e gravação/leitura dos leads.
4. Não compartilhar nem commitar os valores das chaves. Não usar prefixo `VITE_` para segredos de servidor.

