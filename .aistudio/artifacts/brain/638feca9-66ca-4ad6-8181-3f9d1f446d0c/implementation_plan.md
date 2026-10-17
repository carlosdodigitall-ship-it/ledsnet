# LedsNet: Plataforma de Captação e Prospecção Inteligente de Leads Locais

Plano de Implementação Arquitetural e Documento de Requisitos de Produto (PRD) de nível executivo para o **LedsNet** — uma solução web B2B para descoberta, qualificação por Opportunity Score e conversão de negócios locais via WhatsApp, inspirada no modelo AIVIO-IA com acesso seguro por chave única (zero telas de login/cadastro convencionais).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Confirmadas:**
> 1. **Escopo Geográfico Flexível:** O sistema suporta qualquer cidade ou bairro do Brasil com raio ajustável em km, trazendo seletores rápidos para Salvador/RM, Grande SP, RJ e campo de busca aberta.
> 2. **Entrega Completa:** O PRD documental completo em português do Brasil está estruturado abaixo com todas as 11 seções técnicas e 5 perguntas de refinamento, servindo como especificação exata para a construção do aplicativo interativo.
> 3. **Segmento e Nicho Padrão:** O MVP vem pré-configurado com exemplos e filtros para *Climatização, Refrigeração e Serviços Técnicos Prediais/Comerciais* (além de condomínios, clínicas, restaurantes e lojas), sendo 100% customizável em tempo de execução para qualquer segmento B2B.

---

## 1. Overview & Core Concept

- **O que é o LedsNet:** Plataforma web enxuta e de alta performance que conecta a busca de estabelecimentos públicos locais (via Google Maps / Places com IA de aterramento) a um pipeline comercial (Kanban).
- **Diferencial Competitivo:** Elimina a fricção de cadastros e autenticações complexas usando link privado com token/chave de acesso criptografada no cliente. Prioriza negócios através de um **Score de Oportunidade** proprietário (penalizando estabelecimentos sem site ou com baixa reputação, que são os clientes ideais para venda de serviços digitais ou manutenção urgente).
- **Proposta de Valor:** Transformar 2 horas de pesquisa manual em planilhas dispersas em uma rotina de 5 minutos: buscar estabelecimentos, filtrar os mais carentes de serviço, clicar em "Conversar no WhatsApp" com abordagem personalizada e registrar o follow-up em um painel unificado.

---

## 2. User Experience & Visual Design

Conforme as diretrizes de design SaaS e painéis de dados profissionais:

- **Estética & Tema:** Dark mode sofisticado com fundo ardósia neutra (`#090D16` / `#0F172A`), superfícies de cards em `#131C2E`, bordas sutis de 1px em cinza escuro (`border-slate-800`), acentos em **Azul Elétrico** (`#2563EB` / `#38BDF8`) para dados/ações primárias e **Verde-Limão** (`#10B981` / `#84CC16`) para WhatsApp e leads de alto score.
- **Top Bar Contract:** Barra superior minimalista com Wordmark do produto (`LedsNet`), indicador de chave de acesso ativa, atalho de bloqueio/logout e botão de Ação Rápida ("Nova Busca").
- **Navegação:** Barra lateral fixa no desktop ($240\text{px}$) com navegação por ícones + texto para:
  - 📊 **Dashboard & Métricas**
  - 🔍 **Localizador de Leads (Google Maps/Places)**
  - 📋 **Funil de Vendas (Kanban / Tabela)**
  - 📅 **Tarefas & Follow-ups do Dia**
  - 🌐 **Página de Captura Pública (/captura)**
  - ⚙️ **Configurações & Backup (Exportar CSV)**
- **Versão Mobile:** Barra de navegação inferior flutuante com altura $\le 15\%$ da viewport, respeitando o toque ergonômico.
- **Zero-Pill Discipline:** Metadados, avaliações, horários e categorias exibidos com separadores tipográficos limpos (`·`, `/`) sem acúmulo de badges coloridas estáticas. Números e estatísticas com fonte mono tabular (`font-mono tabular-nums`).

---

## 3. Key Product Decisions & Trade-Offs

- **Acesso por Link Privado com Chave:**
  - *Decisão:* Sem formulário de cadastro, login social ou recuperação de senha. O acesso ocorre via URL com parâmetro `?key=SUA_CHAVE` ou modal inicial de chave mestra armazenada com segurança em `localStorage`.
  - *Vantagem:* Simplicidade extrema para o usuário único ou time comercial local, zero atrito inicial e total privacidade.
- **Busca de Dados via Backend Proxy com Maps Grounding:**
  - *Decisão:* Chamadas de API do Google / Maps executadas exclusivamente via rotas Express server-side (`/api/leads/search`) utilizando o modelo `gemini-3.8-flash` com a ferramenta nativa `googleMaps`.
  - *Vantagem:* A chave de API nunca é exposta no navegador; permite enriquecer resultados com dados de contato, notas, status e links oficiais do Google Maps.
- **Persistência de Dados & Offline First:**
  - *Decisão:* Armazenamento primário estruturado em banco de dados local sincronizado (`IndexedDB` / `localStorage`) com backup automático e exportação instantânea para CSV/JSON.
  - *Vantagem:* Resposta ultrarrápida ($< 100\text{ms}$ para transições de funil), sem custos de banco de dados na nuvem para o MVP e sem riscos de perda de dados.

---

## 4. Technical Architecture & Component Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            NAVEGADOR DO USUÁRIO                             │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    LedsNet Interface (React 19 + TS)                  │  │
│  │                                                                       │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │  Dashboard   │ │  Busca Maps  │ │ Funil Kanban │ │ Follow-ups   │  │  │
│  │  │  & Métricas  │ │  & Oportun.  │ │  (6 Estágios)│ │   do Dia     │  │  │
│  │  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘  │  │
│  │         │                │                │                │          │  │
│  │         └────────────────┼────────────────┼────────────────┘          │  │
│  │                          ▼                ▼                           │  │
│  │             ┌─────────────────────────────────────────┐               │  │
│  │             │   LeadStore & Security (localStorage)   │               │  │
│  │             │   - Leads CRUD & Histórico Interações   │               │  │
│  │             │   - Tarefas com Alertas de Vencimento   │               │  │
│  │             │   - Templates de WhatsApp & Configs     │               │  │
│  │             └────────────────────┬────────────────────┘               │  │
│  └──────────────────────────────────┼────────────────────────────────────┘  │
│                                     │                                       │
│                                     │ fetch('/api/leads/search')            │
│                                     ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                 BACKEND EXPRESS (server.ts / Node.js)                 │  │
│  │                                                                       │  │
│  │  ┌─────────────────────┐                 ┌─────────────────────────┐  │  │
│  │  │ Auth & Token Guard  │                 │ Lead Formatter & Scorer │  │  │
│  │  └──────────┬──────────┘                 └────────────▲────────────┘  │  │
│  │             │                                         │               │  │
│  │             ▼                                         │               │  │
│  │  ┌────────────────────────────────────────────────────┴────────────┐  │  │
│  │  │ Google GenAI SDK (@google/genai)                                 │  │  │
│  │  │ Model: gemini-3.8-flash com tool googleMaps                      │  │  │
│  │  │ Extrai: nome, endereço, fone, rating, reviews, website, maps_url │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. DOCUMENTO DE REQUISITOS DE PRODUTO (PRD OFICIAL)

### 1. Visão Geral, Problema e Proposta de Valor

#### 1.1 Contexto e Visão do Produto
O **LedsNet** é um SaaS B2B de prospecção ativa de clientes desenvolvido para pequenos e médios negócios, prestadores de serviços técnicos (ex: manutenção de ar-condicionado e climatização, instalações elétricas, engenharia predial) e agências que dependem de prospecção de negócios locais físicos.

#### 1.2 O Problema
- **Dispersão e perda de dados:** Negócios pesquisados no Google Maps acabam anotados em blocos de notas, papéis ou planilhas desorganizadas.
- **Falta de critério de qualificação:** O vendedor gasta tempo ligando para empresas grandes com equipes estruturadas em vez de focar nos estabelecimentos com dores imediatas e claras.
- **Atrito operacional no primeiro contato:** Fazer pesquisa, copiar telefone, salvar na agenda do celular, abrir o WhatsApp e digitar mensagem do zero gera lentidão e desmotivação.

#### 1.3 Proposta de Valor
- **Descoberta em 1 clique:** Busca instantânea por ramo e raio geográfico.
- **Algoritmo de Oportunidade:** Destaca na hora estabelecimentos sem presença digital ou com reputação desassistida.
- **Disparo WhatsApp Sem Salvar Contato:** Integração nativa com a API `https://wa.me/` com mensagens hiperpersonalizadas prontas.
- **Gestão em Funil Visual:** Acompanhamento desde a abordagem até a conversão em uma interface Kanban veloz e sem senhas complicadas.

---

### 2. Persona e Jornada do Usuário

#### 2.1 Persona
- **Nome:** Carlos Eduardo, 38 anos.
- **Papel:** Proprietário e responsável comercial de uma empresa de serviços de climatização e refrigeração predial em Salvador/BA.
- **Dores:** Perde clientes para concorrentes porque só prospecta quando a demanda cai; não tem paciência para CRMs complexos como HubSpot ou Salesforce; quer agilidade no WhatsApp.
- **Objetivo:** Prospectar 15 novos restaurantes, clínicas e condomínios por dia em menos de 30 minutos e agendar 2 visitas técnicas por semana.

#### 2.2 Jornada do Usuário
```
[Início]
   │
   ▼
Acessa link com chave privada (ex: ledsnet.app?key=xyz123)
   │
   ▼
Abre tela "Buscar Leads" -> Define ramo ("Restaurantes") e bairro/cidade ("Pituba, Salvador")
   │
   ▼
Visualiza lista de resultados ordenada por "Opportunity Score" decrescente
   │
   ▼
Analisa o primeiro colocado (Score 92: Sem site oficial, nota 3.7, 14 avaliações)
   │
   ▼
Clica em "Adicionar ao Funil" -> Lead vai para coluna "Novo"
   │
   ▼
Clica no ícone do WhatsApp -> Seleciona Modelo "Abordagem para Negócios com Climatização Crítica"
   │
   ▼
WhatsApp Web / Desktop abre com texto personalizado preenchido
   │
   ▼
Envia mensagem -> Arrasta o card para "Contatado" e agenda follow-up para amanhã
```

---

### 3. Escopo do MVP com Priorização (MoSCoW)

| Categoria | Funcionalidades |
| :--- | :--- |
| **Must Have (Obrigatório)** | • Acesso protegido por chave privada (sem cadastro/login).<br>• Busca integrada com Google Places / Maps (dados reais de estabelecimentos).<br>• Cálculo automático do Score de Oportunidade.<br>• Funil Kanban (Novo, Contatado, Respondeu, Qualificado, Convertido, Perdido).<br>• Botão Click-to-Chat WhatsApp com 3 templates editáveis.<br>• Ficha do lead com histórico de interações e anotações.<br>• Dashboard com 5 KPIs e lista de tarefas do dia.<br>• Exportação completa para CSV. |
| **Should Have (Importante)** | • Página de captura pública (/captura) com UTMs e consentimento LGPD.<br>• Filtro rápido por "Apenas sem site" ou "Nota < 4.0".<br>• Detecção inteligente de leads duplicados por telefone ou nome similar.<br>• Agendamento de retorno com alerta visual de prazo vencido. |
| **Could Have (Desejável)** | • Gráfico animado de conversão por ramo de negócio.<br>• Ativação de geolocalização do navegador para preenchimento de raio local.<br>• Personalização avançada dos pesos do Score de Oportunidade pelo usuário. |
| **Won't Have (Fora do Escopo MVP)** | • Login multiusuário e planos pagos com cobrança por cartão.<br>• Disparo automatizado em massa por robôs (WhatsApp ban risk).<br>• Integração bidirecional com CRM corporativo externo.<br>• Criação e hospedagem de landing pages automáticas para o lead. |

---

### 4. Funcionalidades com Critérios de Aceite (BDD / Gherkin)

#### F01: Acesso por Chave Privada
- **Cenário 1: Primeiro Acesso com Token na URL**
  - *Dado que* o usuário recebe a URL `https://app.ledsnet.com/?key=LEDS-SECRET-2026`
  - *Quando* a página é carregada
  - *Então* o sistema valida a chave, salva a sessão autorizada no `localStorage` e exibe o dashboard principal.
- **Cenário 2: Encerramento de Sessão**
  - *Dado que* o usuário está logado
  - *Quando* clica no botão "Encerrar Sessão neste Navegador"
  - *Então* a chave é removida do armazenamento e a tela solicita a inserção da chave mestra para continuar.

#### F02: Busca de Leads no Google Places
- **Cenário 1: Busca com Filtros de Oportunidade**
  - *Dado que* o usuário preenche "Ramo: Clínicas Odontológicas", "Região: Salvador - Barra" e raio de 10km
  - *Quando* clica em "Buscar Oportunidades"
  - *Então* o backend consulta o Google Maps via Gemini 3.8 Flash e retorna estabelecimentos com nome, endereço, telefone, rating, contagem de reviews, website e link do Maps em até 3 segundos.
- **Cenário 2: Deduplicação de Leads**
  - *Dado que* um estabelecimento retornado na busca já existe no funil
  - *Quando* os resultados são listados
  - *Então* o card exibe uma marcação "Já no Funil (Status: Contatado)" e desabilita o botão de importação duplicada.

#### F03: Integração e Disparo WhatsApp
- **Cenário 1: Disparo de Mensagem com Template**
  - *Dado que* o lead possui telefone válido formatado `+55 (71) 98888-1234`
  - *Quando* o usuário clica no botão "Falar no WhatsApp" e seleciona o "Modelo 1: Manutenção Preventiva"
  - *Então* o sistema substitui as variáveis `{{nome}}`, `{{empresa}}`, `{{ramo}}` e abre `https://wa.me/5571988881234?text=...` em nova aba, registrando automaticamente uma interação no histórico do lead.

---

### 5. Regras do Score de Oportunidade

O **Opportunity Score** é uma métrica de 0 a 100 que mede o quão propício o estabelecimento está para aceitar propostas de serviços profissionais (por exemplo, ausência de canais modernos, suporte técnico desatualizado ou deficiência de reputação).

#### 5.1 Fórmula de Cálculo
$$\text{Score} = \text{Base} (10) + P_{\text{site}} + P_{\text{nota}} + P_{\text{avaliações}} + P_{\text{contato}}$$

| Fator | Condição | Pontos Atribuídos | Justificativa Comercial |
| :--- | :--- | :--- | :--- |
| **Presença Web (Site)** | Sem website cadastrado | **+40 pontos** | Empresa dependente de canais manuais; necessita de presença digital ou serviços diretos. |
| | Site presente com domínio gratuito | **+20 pontos** | Baixo investimento em infraestrutura. |
| | Site próprio profissional | **0 pontos** | Empresa mais estruturada e com fornecedores definidos. |
| **Nota Google (Rating)** | Nota $< 3.8$ | **+25 pontos** | Atendimento ou infraestrutura deficiente; dor latente. |
| | Nota entre $3.8$ e $4.4$ | **+15 pontos** | Espaço para melhorias operacionais. |
| | Nota $\ge 4.5$ | **+5 pontos** | Negócio bem avaliado, focado em manter o padrão. |
| **Volume de Avaliações** | $< 15$ avaliações | **+15 pontos** | Pouca autoridade; negócio novo ou desassistido. |
| | Entre 15 e 50 avaliações | **+10 pontos** | Nível intermediário de tração local. |
| | $> 50$ avaliações | **+5 pontos** | Grande fluxo de clientes. |
| **Canal de Contato** | Apenas telefone fixo (sem celular claro) | **+10 pontos** | Dificuldade de contato via WhatsApp = oportunidade para modernização. |

#### 5.2 Exemplo Numérico Prático
- **Empresa:** *Condomínio Residencial Parque dos Pássaros*
- **Dados:** Sem site cadastrado (`+40`), Nota Google: 3.6 (`+25`), Quantidade de Avaliações: 9 (`+15`), Telefone celular informado (`0`).
- **Cálculo:** $10\text{ (Base)} + 40 + 25 + 15 + 0 = \mathbf{90\text{ pontos}}$.
- **Classificação:** **Oportunidade Quente (Score 90 / 100)** — Prioridade máxima de abordagem.

---

### 6. Fluxos de Navegação e Wireframes Textuais

#### Tela 1: Localizador de Leads (Busca Google Places)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ LedsNet          [Região: Salvador/BA ▼]  [Ramo: Restaurantes ▼] [Buscar]  │
├────────────────────────────────────────────────────────────────────────────┤
│ Filtros: [ ] Apenas sem site   [ ] Nota < 4.0   [ Raio: 15 km ───────○── ] │
├────────────────────────────────────────────────────────────────────────────┤
│ 24 NEGÓCIOS ENCONTRADOS NA REGIÃO                                          │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Churrascaria Boi Preto                          SCORE DE OPORTUNIDADE  │ │
│ │ Av. Otávio Mangabeira, 500 · Pituba             92/100 [ALTA URGÊNCIA] │ │
│ │ ★ 3.8 (19 avaliações) · Sem site registrado                            │ │
│ │ Tel: (71) 3345-0000 · Status: Aberto agora                             │ │
│ │                                                                        │ │
│ │ [Adicionar ao Funil]   [Abrir no Google Maps]   [WhatsApp com Template]│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Tela 2: Gestão do Funil (Pipeline Kanban)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ FUNIL DE PROSPECÇÃO                            [+ Lead Manual]  [CSV Exp]  │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬──────┤
│ NOVO (12)   │CONTATADO(8) │RESPONDEU(4) │QUALIFIC.(3) │CONVERTID(2) │PERD. │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┼──────┤
│ [Card Lead] │ [Card Lead] │ [Card Lead] │ [Card Lead] │ [Card Lead] │ ...  │
│ Restaurante │ Clínica Sol │ Condomínio  │ Padaria     │ Buffet Real │      │
│ Score: 88   │ Score: 74   │ Score: 95   │ Score: 80   │ R$ 3.200/m  │      │
│ [Zap] [Ver] │ Retorno:Hoje│ Retorno:18h │ Visita agend│ [Garantido] │      │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴──────┘
```

#### Tela 3: Ficha Detalhada do Lead (Modal Lateral)
- **Cabeçalho:** Nome do negócio, ramo, cidade, score visual e status atual com menu de mudança de etapa.
- **Dados de Contato:** Telefone com clique direto para chamada ou WhatsApp, endereço com link Google Maps e website.
- **Próximo Passo Comercial:** Data e hora do follow-up com campo de lembrete (ex: "Ligar para o síndico Dr. Roberto para confirmar visita técnica").
- **Histórico Cronológico:** Linha do tempo com todas as mensagens disparadas, anotações de ligações e mudanças de fase.

---

### 7. Modelo de Dados (TypeScript Interfaces)

```typescript
export type LeadStatus = 'novo' | 'contatado' | 'respondeu' | 'qualificado' | 'convertido' | 'perdido';

export interface Lead {
  id: string;
  placeId?: string;
  name: string;
  segment: string;
  address: string;
  city: string;
  phone: string;
  whatsapp?: string;
  website?: string | null;
  rating: number;
  reviewCount: number;
  mapsUrl: string;
  opportunityScore: number;
  status: LeadStatus;
  scoreBreakdown: {
    base: number;
    noWebsite: number;
    lowRating: number;
    fewReviews: number;
  };
  notes: string;
  nextFollowUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
  source: 'google_places' | 'landing_page' | 'manual';
  dealValue?: number;
}

export interface Interaction {
  id: string;
  leadId: string;
  type: 'whatsapp' | 'call' | 'note' | 'status_change';
  content: string;
  timestamp: string;
}

export interface Task {
  id: string;
  leadId: string;
  leadName: string;
  dueDate: string;
  description: string;
  completed: boolean;
}

export interface MessageTemplate {
  id: string;
  title: string;
  text: string;
  category: 'primeiro_contato' | 'follow_up' | 'proposta';
}
```

---

### 8. Arquitetura Técnica e Integrações

1. **Frontend:** React 19 com TypeScript, Tailwind CSS v4, Motion para microinterações no Kanban e Lucide Icons.
2. **Backend:** Express API em `server.ts` operando na mesma porta, com rotas:
   - `GET /api/health`: Checagem de disponibilidade.
   - `POST /api/leads/search`: Busca de estabelecimentos geolocalizados via Gemini 3.8 Flash com Google Maps grounding.
   - `POST /api/leads/capture`: Endpoint público para receber formulários da landing page `/captura` com UTMs.
3. **Persistência:** Sincronização em `localStorage` com controle de integridade, permitindo importação e exportação de backups JSON e relatórios em CSV.
4. **WhatsApp Click-to-Chat:** Codificação URI com sanitização de números E.164 brasileiros (`+55DD9XXXXXXXX`).

---

### 9. Métricas de Sucesso do Produto (KPIs)

- **Tempo de Prospecção:** Redução de 80% no tempo necessário para encontrar e contatar 10 leads (meta: $\le 10$ minutos).
- **Taxa de Resposta no WhatsApp:** Atingir $\ge 25\%$ de respostas no primeiro contato através de templates contextuais.
- **Taxa de Conversão do Funil:** Manter conversão $\ge 8\%$ de "Novo" para "Convertido".
- **Zero Leads Perdidos por Esquecimento:** $100\%$ dos leads em "Contatado" com tarefa de follow-up preenchida.

---

### 10. Riscos, Conformidade Legal e Premissas

- **Termos de Uso do Google Maps:** Não realizar web scraping de interfaces HTML. O sistema consome dados estruturados através de grounding oficial, armazenando apenas identificadores (`place_id`) e dados comerciais públicos básicos.
- **Conformidade LGPD (Lei 13.709/2018):**
  - Dados de pessoas jurídicas e contatos comerciais públicos são tratados com base no Legítimo Interesse (Art. 7º, IX da LGPD).
  - A página pública de captura inclui checkbox com consentimento explícito e link para a Política de Privacidade.
  - O sistema oferece botão de exclusão imediata e permanente de qualquer lead a pedido do titular (Art. 18).
- **Boas Práticas de WhatsApp:** Disparos manuais 1 a 1 via `wa.me`, sem ferramentas não oficiais que possam causar banimento do número comercial.

---

### 11. Roadmap em Fases

- **Fase 1 (MVP Atual):**
  - Autenticação por chave privada no navegador.
  - Busca de leads via Google Maps com Opportunity Score automático.
  - Pipeline Kanban interativo com 6 estágios e drag-and-drop.
  - Click-to-chat WhatsApp com 3 templates nativos editáveis.
  - Dashboard analítico e exportação CSV.
  - Página de captura pública `/captura`.
- **Fase 2 (v1.1):**
  - Sincronização em nuvem via Cloud SQL / Firestore opcional.
  - Notificações no navegador para follow-ups agendados.
  - Personalização de pesos e critérios do Score de Oportunidade.
- **Fase 3 (v2.0):**
  - Múltiplos operadores comerciais na mesma conta com atribuição de leads.
  - Integração com WhatsApp Business Cloud API oficial para leitura de respostas automáticas.

---

### 12. Perguntas Estratégicas para Refinamento com o Cliente

1. **Templates de Mensagem:** Quais são as 3 principais dores ou propostas que mais convertem no seu atendimento atual para inserirmos como mensagens padrão?
2. **Critérios de Filtro:** Para o seu ramo, estabelecimentos que não possuem site são mais atraentes do que aqueles que possuem notas baixas de clientes?
3. **Campos da Ficha:** Além de telefone, endereço e responsável, você precisa registrar campos como CNPJ, quantidade de equipamentos ou metragem do local?
4. **Volume Diário:** Quantos leads em média você ou sua equipe pretendem prospectar e contatar por dia de trabalho?
5. **Página de Captura:** Deseja que a página `/captura` ofereça algum material ou diagnóstico gratuito (ex: "Solicite um Diagnóstico Preventivo Gratuito") para atrair leads espontâneos?

---

## 6. Próximos Passos de Desenvolvimento (Após Aprovação)

1. **Configurar Servidor Express & Gemini 3.8 Flash:** Implementar endpoint `/api/leads/search` com grounding no Google Maps e fallback robusto de dados enriquecidos.
2. **Desenvolver o Design System LedsNet:** Layout em dark mode com tokens de cores elétricas, sidebar de navegação e componentes modulares.
3. **Construir os Módulos Centrais:**
   - Tela de Busca com filtros de oportunidade e cálculo de Score em tempo real.
   - Funil Kanban com 6 colunas, arrastar/mover e histórico de interações.
   - Integração com WhatsApp e modal de seleção de templates dinâmicos.
   - Dashboard com KPIs, gráficos de conversão e tarefas do dia.
   - Página pública de captura `/captura` com formulário compatível com LGPD.
   - Exportação completa em formato CSV e backup local.
4. **Verificação & Testes de Compilação:** Executar validação de tipos TypeScript e `compile_applet` garantindo funcionamento sem erros.
