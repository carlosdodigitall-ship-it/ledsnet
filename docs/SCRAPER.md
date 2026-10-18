# LedsNet — integração do scraper

## Configuração no servidor

Configure somente nas variáveis de ambiente do deploy (Vercel), nunca no frontend:

- `FIREBASE_SERVICE_ACCOUNT_KEY`: JSON completo da conta de serviço do Firebase Admin. Cadastre como variável **Sensitive/Encrypted**; nunca commite esse JSON no GitHub.
- Ative **Authentication → Sign-in method → Email/Password** no Firebase Console.
- Em **Authentication → Settings → Authorized domains**, inclua o domínio de produção do LedsNet e o domínio usado nos testes.

- `SCRAPER_API_URL`: URL base da instância privada do `gosom/google-maps-scraper`, sem barra final.
- `SCRAPER_API_KEY`: API key criada/permitida pela instância do scraper.
- `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_KEY` e `FIRESTORE_DATABASE_ID`: credenciais/identificação do Firebase Admin e Firestore já usados pelo backend.

Não use a chave do LedsNet como chave do scraper. Restrinja a API do scraper por firewall/rede privada sempre que possível.

## Dados dos usuários

As rotas de leads usam a coleção `users/{uid}/leads` no Firestore, isolando a lista de cada usuário autenticado. Os jobs do scraper ficam em `scraper_jobs` e incluem `ownerId`; apenas o proprietário pode consultá-los ou cancelá-los.

## Endpoints adicionados

Todos exigem `Authorization: Bearer <Firebase ID token>` de uma conta com e-mail verificado.

- `GET /api/scraper/health`
- `POST /api/scraper/jobs`
- `GET /api/scraper/jobs/:jobId`
- `DELETE /api/scraper/jobs/:jobId`

Exemplo de criação:

```json
{
  "keyword": "clínicas odontológicas em Salvador, BA",
  "lang": "pt",
  "max_depth": 1,
  "email": true,
  "extra_reviews": false,
  "fast_mode": true,
  "timeout": 120
}
```

O job fica registrado na coleção `scraper_jobs`, associado a `ownerId`. A consulta e o cancelamento conferem o proprietário antes de acessar o job externo.

## Contrato REST

A integração usa `POST /api/v1/scrape`, `GET /api/v1/jobs/{job_id}`, `DELETE /api/v1/jobs/{job_id}` e `GET /api/v1/health`, conforme as rotas presentes em `api/api.go` no repositório upstream. Não presumimos endpoint CSV do scraper; exportação deverá ser feita pelo LedsNet depois de normalizar os resultados.

## Limitações importantes

- A interface atual ainda envia `x-access-key`, não Firebase ID tokens. Por isso, estas rotas autenticadas por Firebase ainda não estão ligadas ao fluxo atual da interface; não use chave compartilhada como substituto da identidade Firebase.
- O contrato do scraper upstream tem divergências entre README e roteador. Valide a versão instalada contra os endpoints acima antes de habilitar em produção.
- A busca sem a opção de e-mail precisa de `GOOGLE_PLACES_API_KEY` ou `GEMINI_API_KEY`. A busca com extração de e-mails precisa de `SCRAPER_API_URL` e `SCRAPER_API_KEY` apontando para a instância real na VPS.
- A extração de e-mails depende de `email: true`, do suporte na versão do scraper e da disponibilidade pública dos dados. Não há garantia de e-mail para cada empresa.
- Scraping e prospecção devem respeitar termos aplicáveis, LGPD, base legal, transparência e solicitações de não contato.
