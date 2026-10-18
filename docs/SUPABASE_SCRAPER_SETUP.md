# LedsNet — Supabase + worker de scraping sem VPS

Esta branch adiciona a primeira etapa de armazenamento dos resultados reais e um worker sob demanda com GitHub Actions. O scraper não fica rodando 24/7: ele executa somente quando alguém autorizado dispara manualmente o workflow. Isso evita exigir VPS, mas ainda não integra um botão do painel para iniciar o workflow.

## 1. Preparar o banco Supabase
1. Crie ou selecione um projeto Supabase exclusivo para o LedsNet (não reutilize o banco do Gestor Inove sem decisão explícita).
2. Abra SQL Editor e execute o arquivo supabase/migrations/202610180001_ledsnet_leads.sql.
3. Copie a Project URL e a chave service_role/secret. Nunca use essa chave no frontend.

## 2. Configurar secrets no GitHub
No repositório carlosdodigitall-ship-it/ledsnet, abra Settings → Secrets and variables → Actions → New repository secret:
- SUPABASE_URL: Project URL do projeto Supabase do LedsNet.
- SUPABASE_SERVICE_ROLE_KEY: chave secreta do Supabase (somente no GitHub Actions).

## 3. Executar uma busca de teste
1. Abra Actions → LedsNet - Buscar leads no Google Maps → Run workflow.
2. Informe o termo e região, o Firebase UID do usuário dono dos resultados, se deseja extrair e-mails e a profundidade.
3. Ao terminar, os leads ficam em public.ledsnet_leads; o JSON bruto fica disponível como artefato por 7 dias.

## Segurança e limites
- O workflow é manual e deve ser disparado por uma pessoa com acesso ao repositório. Não compartilhe acesso ao repositório para permitir buscas de clientes.
- A chave service role fica apenas em GitHub Actions Secrets e nunca no navegador.
- A tabela não concede acesso direto a anon nem authenticated; a autenticação Firebase atual não é equivalente ao Supabase Auth.
- Este worker ainda é uma etapa operacional de validação, não uma integração de botão dentro do painel. A migração completa das rotas CRUD de leads, CRM, configurações, interações, templates e logs de envio do Firestore para Supabase precisa ser feita e testada antes de remover Firebase/Firestore.
- GitHub Actions em repositórios públicos é gratuito para runners padrão conforme a política atual do GitHub; disponibilidade e limites podem mudar. Scraping pode sofrer bloqueios, variação de resultados e demorar; não há garantia de execução contínua.
- Colete e use dados de forma compatível com os termos das fontes e a LGPD.

## Arquitetura
- App atual: React/Vite + Express; autenticação ainda usa Firebase.
- Persistência nova preparada: Supabase Postgres, isolada por user_id (Firebase UID).
- Coleta: gosom/google-maps-scraper via container em GitHub Actions, com opção de extração de e-mails.
