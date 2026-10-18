# LedsNet — integração do Google Maps Scraper Kit

## O que foi integrado

O link informado anteriormente (vzbaggio/google-maps-scraper-kit) não pôde ser localizado pelo conector do GitHub. Para não copiar código de um repositório que não conseguimos verificar, esta integração usa o motor open-source [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper), que já é a base do worker do LedsNet e possui licença MIT.

A integração mantém o painel e o banco do LedsNet; não substitui o projeto nem cria outro banco.

## Fluxo

1. O usuário dispara manualmente o workflow **LedsNet - Buscar leads no Google Maps** em GitHub Actions.
2. O workflow executa o scraper em um runner temporário do GitHub, sem exigir VPS própria.
3. O resultado é normalizado pelo arquivo **scripts/import_scraper_results.py**.
4. Os registros são enviados ao Supabase em lotes de até 100 e associados ao Firebase UID informado.
5. O índice único **(user_id, place_id)** permite atualizar registros repetidos sem duplicá-los.
6. O arquivo bruto é salvo como artefato do workflow por sete dias para diagnóstico.

## Formatos aceitos pelo importador

O importador aceita JSON com lista, JSON com uma lista dentro de results, places, data ou items, um objeto único e JSON Lines (um objeto por linha). Ele reconhece os campos do scraper, incluindo title, link, cid, review_rating e review_count, além de aliases comuns.

Testes locais sem rede:

    python3 -m unittest discover -s tests -v

## Configuração necessária

Cadastre os secrets em **Settings → Secrets and variables → Actions** no repositório:

- **SUPABASE_URL**: URL do projeto Supabase do LedsNet.
- **SUPABASE_SERVICE_ROLE_KEY**: chave secreta de servidor do mesmo projeto. Nunca a exponha no frontend, logs ou commits.

Ao executar o workflow, informe um Firebase UID válido. O workflow atual usa esse UID como proprietário dos leads importados; antes de habilitar o recurso para todos os usuários, o backend deve validar que o UID enviado corresponde ao usuário autenticado que solicitou a busca.

## Limites e responsabilidade

- A execução é manual e pontual; não é um serviço de scraping contínuo.
- GitHub Actions fornece runners temporários, mas limites de uso e disponibilidade dependem das cotas da conta GitHub.
- Google Maps pode limitar ou bloquear temporariamente tráfego automatizado. Comece com profundidade baixa e uma busca por vez.
- Os resultados devem ser verificados antes do contato. Respeite os termos aplicáveis, a LGPD, a finalidade e a base legal para tratamento de dados pessoais e solicitações de não contato.
- E-mails e telefones não são garantidos para cada empresa.
