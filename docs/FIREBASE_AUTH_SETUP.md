# Configuração do Firebase para o LedsNet

A integração foi preparada no código, mas este repositório não continha configuração Firebase existente. Antes de publicar, conecte o projeto real seguindo os passos abaixo.

## 1. Firebase Authentication

1. No Console do Firebase, abra **Authentication → Sign-in method**.
2. Ative **E-mail/senha** e **Google**.
3. Em **Settings → Authorized domains**, adicione o domínio de produção e o domínio de preview usado para testes.
4. Em **Templates**, personalize o e-mail de verificação e a redefinição de senha para a marca LedsNet.

## 2. Firebase Web App

Crie ou selecione um Web App no projeto e configure as variáveis abaixo no ambiente de build/deploy (Vercel ou servidor). Os valores VITE_FIREBASE_* são a configuração pública do SDK Web, não credenciais administrativas.

- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

Use .env.example como referência. Não coloque credenciais de service account em variáveis com prefixo VITE_.

## 3. Firestore e isolamento por usuário

1. Crie o banco Firestore no projeto.
2. Publique as regras deste repositório: firebase deploy --only firestore:rules.
3. As coleções leads, tasks, interactions e templates usam ownerId e consultas filtradas pelo UID autenticado.
4. O documento users/{uid} é acessível somente pelo próprio UID.
5. As regras padrão negam acesso a outras coleções/documentos.

As regras não substituem a configuração de Authentication. Não publique com regras de teste abertas.

## 4. Firebase Admin no servidor

O endpoint privado POST /api/leads/search exige um ID token Firebase válido. Configure no ambiente do servidor, nunca no cliente:

- FIREBASE_SERVICE_ACCOUNT_JSON: JSON completo da service account, como variável secreta; **ou**
- GOOGLE_APPLICATION_CREDENTIALS com credenciais ADC suportadas pelo ambiente.

Também configure FIREBASE_PROJECT_ID quando necessário. A chave GEMINI_API_KEY continua exclusiva do servidor. Não versione service accounts, chaves privadas, tokens da Evolution API ou arquivos .env reais.

## 5. Rotas

- Landing pública: /
- Login: /entrar
- Cadastro: /criar-conta
- Verificação: /verificar-email
- Recuperação: /recuperar-senha
- Configuração inicial: /configurar-conta
- Painel protegido: /painel

O servidor Express serve app.html nas rotas de autenticação e painel. A landing original permanece em index.html.

## 6. Checklist antes da produção

- [ ] Configurar variáveis de ambiente no build e no servidor.
- [ ] Ativar e-mail/senha e Google no Firebase.
- [ ] Adicionar domínios autorizados.
- [ ] Criar Firestore e publicar firestore.rules.
- [ ] Configurar Firebase Admin como segredo do servidor.
- [ ] Executar npm run lint e npm run build no ambiente com dependências instaladas.
- [ ] Testar login, cadastro, verificação, recuperação, saída e isolamento com duas contas diferentes.
- [ ] Confirmar que a API de busca retorna 401 sem token e funciona com token válido.
