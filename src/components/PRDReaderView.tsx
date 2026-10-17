import React, { useState } from 'react';
import { FileText, Copy, Check, Download, BookOpen, Layers, CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export const PRDReaderView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('1');

  const prdMarkdown = `# DOCUMENTO DE REQUISITOS DE PRODUTO (PRD) — LedsNet v1.0 MVP

## 1. Visão Geral, Problema e Proposta de Valor
- **Nome do Produto:** LedsNet
- **Posicionamento:** Plataforma web enxuta para prospecção de leads locais B2B no Google Places e qualificação por Opportunity Score com funil integrado para WhatsApp.
- **Problema:** Negócios locais gastam horas vasculhando o Google Maps e anotando contatos em cadernos e planilhas, sem priorização clara de quais estabelecimentos realmente precisam de serviços.
- **Proposta de Valor:** Encontrar estabelecimentos em segundos, priorizar os que não possuem site ou têm baixa reputação e iniciar contato no WhatsApp com mensagem personalizada sem burocracia de login.

---

## 2. Persona e Jornada do Usuário
- **Persona:** Carlos Eduardo, 38 anos, dono de empresa de serviços de climatização e refrigeração em Salvador/BA.
- **Jornada:** Acessa link privado -> Busca ramo "Restaurantes" na Pituba -> Analisa os leads com maior Opportunity Score -> Importa para o Funil -> Clica em "Falar no WhatsApp" com template pronto -> Agenda retorno com follow-up.

---

## 3. Escopo do MVP (MoSCoW)
- **Must Have:** Acesso por link/chave privada; Busca no Google Places com Opportunity Score; Funil Kanban (Novo, Contatado, Respondeu, Qualificado, Convertido, Perdido); Disparo WhatsApp Click-to-Chat; Histórico e Ficha do Lead; Dashboard com 5 KPIs; Exportação CSV.
- **Should Have:** Página de captura pública /captura com UTMs e consentimento LGPD; Filtros rápidos por ausência de site e nota baixa; Deduplicação de leads.
- **Could Have:** Geolocalização do navegador; Personalização de pesos do score.
- **Won't Have:** Planos pagos e cobrança por cartão; Disparo em massa não autorizado; Integração com CRM externo legado.

---

## 4. Funcionalidades com Critérios de Aceite (BDD)
- **F01 (Acesso Privado):** Dado que o usuário acessa com token na URL, quando carrega a aplicação, então tem acesso liberado imediatamente sem tela de login.
- **F02 (Busca Google Places):** Dado que o usuário preenche ramo e região, quando pesquisa, então estabelecimentos são retornados em até 3 segundos com Opportunity Score calculado.
- **F03 (WhatsApp Click-to-Chat):** Dado que o lead possui telefone válido, quando o usuário seleciona um template, então o WhatsApp abre com o texto preenchido e a interação é registrada no histórico.

---

## 5. Regras do Score de Oportunidade
- **Fórmula:** Score = Base (10) + Presença Web (+40 se sem site, +20 se site gratuito) + Nota Google (+25 se <3.8, +15 se 3.8-4.4, +5 se >=4.5) + Avaliações (+15 se <15, +10 se 15-50, +5 se >50) + Canal Fixo (+10).
- **Exemplo Numérico:** Condomínio sem site (+40), Nota 3.6 (+25), 9 avaliações (+15), Base (10) = 90 pontos (Alta Urgência).

---

## 6. Fluxos de Navegação e Wireframe
- **Localizador:** Busca com filtros rápidos e cards ordenados por Opportunity Score.
- **Funil Kanban:** 6 colunas com arraste rápido, indicador de retorno do dia e valor financeiro.
- **Ficha do Lead:** Abas de dados, linha do tempo de contatos e agendamento de retorno.

---

## 7. Modelo de Dados
- Entidades: Lead, Interaction, Task, MessageTemplate, SearchFilters.

---

## 8. Arquitetura Sugerida e Integrações
- Frontend: React 19 + TypeScript + Tailwind CSS.
- Backend: Express em server.ts com Gemini 3.8 Flash e ferramenta googleMaps para dados enriquecidos e links de grounding.
- Armazenamento: Local sincronizado com exportação CSV e backup JSON.

---

## 9. Métricas de Sucesso
- Redução de 80% no tempo de prospecção.
- Taxa de resposta no WhatsApp >= 25%.
- Taxa de conversão do funil >= 8%.

---

## 10. Riscos e Conformidade
- Google Places: Acesso em conformidade com termos oficiais de grounding.
- LGPD: Tratamento de dados comerciais sob Legítimo Interesse (Art. 7, IX) e direito de exclusão imediata (Art. 18).
- WhatsApp: Disparos manuais 1 a 1 para evitar banimentos.

---

## 11. Roadmap em Fases
- MVP (Atual): Prospecção Maps, Score de Oportunidade, Funil Kanban, WhatsApp e CSV.
- v1.1: Notificações web para tarefas e sincronização cloud.
- v2.0: Multiusuários com permissões de vendedores e API oficial do WhatsApp Business.

---

## 12. Perguntas Estratégicas para Refinamento com o Cliente
1. Quais são as 3 principais objeções que seus clientes mais apresentam no primeiro contato?
2. Estabelecimentos sem site são mais prioritários do que estabelecimentos com nota baixa?
3. Quais dados adicionais (como CNPJ ou porte predial) são cruciais na sua vistoria?
4. Qual é a meta diária de contatos por vendedor na sua rotina?
5. Que tipo de isca ou oferta de diagnóstico gratuito converte melhor no seu nicho?`;

  const handleCopy = () => {
    navigator.clipboard.writeText(prdMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([prdMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PRD_LedsNet_v1.md';
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Banner com Ações */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>DOCUMENTO OFICIAL DE REQUISITOS (PRD)</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            LedsNet v1.0 — Especificação Pronta para Desenvolvimento
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Documento completo em português do Brasil com todas as 11 seções técnicas e 5 perguntas de refinamento.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Markdown</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PRD (.md)</span>
          </button>
        </div>
      </div>

      {/* Visualizador Estruturado em Abas / Capítulos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Menu Lateral de Capítulos */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-2">
            Capítulos do PRD
          </span>
          {[
            { id: '1', title: '1. Visão Geral & Problema' },
            { id: '2', title: '2. Persona & Jornada' },
            { id: '3', title: '3. Escopo MoSCoW' },
            { id: '4', title: '4. BDD & Critérios de Aceite' },
            { id: '5', title: '5. Regras do Opportunity Score' },
            { id: '6', title: '6. Wireframes & Telas' },
            { id: '7', title: '7. Modelo de Dados' },
            { id: '8', title: '8. Arquitetura & Integrações' },
            { id: '9', title: '9. Métricas de Sucesso' },
            { id: '10', title: '10. Riscos, LGPD & Premissas' },
            { id: '11', title: '11. Roadmap em Fases' },
            { id: '12', title: '12. Perguntas com o Cliente' },
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveSection(ch.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                activeSection === ch.id
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span>{ch.title}</span>
              {activeSection === ch.id && (
                <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Leitor de Conteúdo do Capítulo */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl leading-relaxed text-slate-300 text-xs space-y-4">
          {activeSection === '1' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">1. Visão Geral, Problema e Proposta de Valor</h2>
              <p>O <strong>LedsNet</strong> é um software de prospecção ativa B2B voltado para prestadores de serviços técnicos (climatização, refrigeração, instalações prediais, eletricistas) e comércios locais.</p>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-semibold text-white">Dores Atuais do Mercado:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Dispersão de contatos anotados manualmente no Google Maps.</li>
                  <li>Falta de critério para identificar quais negócios realmente têm carência técnica imediata.</li>
                  <li>Lentidão no processo de salvar contatos na agenda antes de iniciar a conversa no WhatsApp.</li>
                </ul>
              </div>
              <p><strong>Proposta de Valor:</strong> Centralizar em uma única tela a descoberta no Google Places, qualificação por Opportunity Score transparente e abordagem via WhatsApp com 1 clique.</p>
            </div>
          )}

          {activeSection === '2' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">2. Persona e Jornada do Usuário</h2>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                <h4 className="font-semibold text-white">Persona Principal: Carlos Eduardo (38 anos)</h4>
                <p className="text-slate-400 mt-1">Dono de empresa de serviços de manutenção de ar-condicionado em Salvador. Busca 15 novas oportunidades por dia para manter sua equipe técnica 100% ocupada.</p>
              </div>
              <h4 className="font-semibold text-white pt-2">Jornada em 5 Etapas:</h4>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
                <li>Acesso instantâneo via link privado sem barreira de login.</li>
                <li>Pesquisa de restaurantes e condomínios na região metropolitana.</li>
                <li>Identificação de negócios com score &ge; 80 (sem site oficial ou nota baixa).</li>
                <li>Importação para a etapa "Novo" do funil comercial.</li>
                <li>Envio de mensagem via WhatsApp com proposta de diagnóstico preventivo.</li>
              </ol>
            </div>
          )}

          {activeSection === '3' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">3. Escopo do MVP com Priorização (MoSCoW)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-slate-400">
                    <tr>
                      <th className="p-2.5 border-b border-slate-800">Categoria</th>
                      <th className="p-2.5 border-b border-slate-800">Itens Inclusos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="p-2.5 font-bold text-emerald-400">Must Have</td>
                      <td className="p-2.5">Acesso por chave privada; Busca Google Places com IA; Cálculo de Score; Funil Kanban de 6 fases; Botão WhatsApp com 3 templates; Ficha com histórico; Dashboard de 5 KPIs; Exportação CSV.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-blue-400">Should Have</td>
                      <td className="p-2.5">Página de captura pública /captura com UTMs e consentimento LGPD; Filtro rápido por ausência de site e nota &lt; 4.0; Deduplicação inteligente.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-amber-400">Could Have</td>
                      <td className="p-2.5">Pesquisa por geolocalização do navegador; Personalização dos pesos do algoritmo de score.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-rose-400">Won't Have</td>
                      <td className="p-2.5">Disparador robótico em massa (risco de ban no WhatsApp); Gateway de cobrança por cartão; Multi-usuários complexos.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === '4' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">4. Especificação de Funcionalidades e BDD</h2>
              <div className="space-y-3 font-mono-numbers text-[11px]">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <strong className="text-blue-400 font-sans block mb-1">Cenário 1: Acesso por Link Privado</strong>
                  <p><strong>Dado que</strong> o usuário acessa com URL contendo o parâmetro <code>?key=LEDS-DEMO-2026</code></p>
                  <p><strong>Quando</strong> a página carrega</p>
                  <p><strong>Então</strong> o acesso é liberado diretamente para o Dashboard sem exibir tela de cadastro.</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <strong className="text-emerald-400 font-sans block mb-1">Cenário 2: Disparo de Mensagem no WhatsApp</strong>
                  <p><strong>Dado que</strong> o lead possui telefone válido e foi adicionado ao funil</p>
                  <p><strong>Quando</strong> o vendedor seleciona o template de "Diagnóstico Técnico"</p>
                  <p><strong>Então</strong> o sistema abre o WhatsApp Web com os dados da empresa inseridos e avança o lead para "Contatado".</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === '5' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">5. Regras do Opportunity Score</h2>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono-numbers">
                <div className="text-sm font-bold text-emerald-400">Score = Base (10) + P(site) + P(nota) + P(avaliações) + P(contato)</div>
                <ul className="space-y-1 text-slate-350 text-[11px] pt-1">
                  <li>• <strong>Sem Site Oficial:</strong> +40 pontos (Domínio gratuito: +20 pts; Site próprio: 0 pts)</li>
                  <li>• <strong>Nota Google &lt; 3.8:</strong> +25 pontos (3.8 a 4.4: +15 pts; &ge;4.5: +5 pts)</li>
                  <li>• <strong>Avaliações &lt; 15:</strong> +15 pontos (15 a 50: +10 pts; &gt;50: +5 pts)</li>
                  <li>• <strong>Canal Fixo:</strong> +10 pontos</li>
                </ul>
              </div>
              <p><strong>Exemplo Numérico:</strong> Condomínio sem site (+40), com nota 3.6 (+25), 9 avaliações (+15), Base (10) = <strong>90 pontos (Alta Urgência)</strong>.</p>
            </div>
          )}

          {activeSection === '6' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">6. Fluxos de Navegação e Wireframes</h2>
              <p>Interface estruturada com 4 telas centrais:</p>
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">1. Localizador de Leads</strong>
                  <span>Busca geográfica com filtros de oportunidade e importação rápida.</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">2. Funil de Vendas Kanban</strong>
                  <span>6 estágios de conversão com indicadores visuais de follow-up do dia.</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">3. Ficha do Lead</strong>
                  <span>Histórico completo de interações, ligações e agendamento de retorno.</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <strong className="text-white block mb-1">4. Página Pública /captura</strong>
                  <span>Landing page com formulário rastreado por UTMs e consentimento LGPD.</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === '7' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">7. Modelo de Dados</h2>
              <p>Entidades modeladas em TypeScript com suporte a histórico e rastreabilidade:</p>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] overflow-x-auto text-blue-300">
{`interface Lead {
  id: string;
  name: string;
  segment: string;
  address: string;
  city: string;
  phone: string;
  website: string | null;
  rating: number;
  reviewCount: number;
  mapsUrl: string;
  opportunityScore: number;
  status: 'novo' | 'contatado' | 'respondeu' | 'qualificado' | 'convertido' | 'perdido';
  dealValue?: number;
  nextFollowUpDate?: string;
  notes: string;
}`}
              </pre>
            </div>
          )}

          {activeSection === '8' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">8. Arquitetura Técnica & Integrações</h2>
              <div className="space-y-2 text-slate-350">
                <p>• <strong>Frontend:</strong> React 19 + TypeScript + Tailwind CSS v4 com navegação fluida.</p>
                <p>• <strong>Backend Proxy Express:</strong> Em <code>server.ts</code>, consome o modelo <code>gemini-3.8-flash</code> com ferramenta nativa <code>googleMaps</code> para aterramento fidedigno de dados de negócios locais.</p>
                <p>• <strong>Click-to-Chat WhatsApp:</strong> Integração com protocolo E.164 (<code>https://wa.me/55...</code>) com sanitização de caracteres e variáveis interpoladas.</p>
              </div>
            </div>
          )}

          {activeSection === '9' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">9. Métricas de Sucesso (KPIs)</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-350">
                <li><strong>Tempo de Prospecção:</strong> Redução de 80% do tempo gasto por lead (meta: &le; 10 min para 10 contatos).</li>
                <li><strong>Taxa de Resposta:</strong> Manter respostas positivas no WhatsApp &ge; 25%.</li>
                <li><strong>Taxa de Conversão:</strong> Atingir &ge; 8% de fechamento de contratos em relação aos leads importados.</li>
              </ul>
            </div>
          )}

          {activeSection === '10' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">10. Riscos, Conformidade Legal e LGPD</h2>
              <div className="space-y-2">
                <p>• <strong>LGPD (Lei 13.709/2018):</strong> Tratamento de dados comerciais de pessoas jurídicas embasado no Legítimo Interesse (Art. 7º, IX). O sistema provê exclusão definitiva de registros a qualquer momento (Art. 18).</p>
                <p>• <strong>Termos Google:</strong> Uso dentro dos parâmetros de grounding e consumo de dados públicos sem scraping invasivo.</p>
                <p>• <strong>Segurança WhatsApp:</strong> Disparos 1 a 1 controlados pelo vendedor para prevenir banimentos de conta comercial.</p>
              </div>
            </div>
          )}

          {activeSection === '11' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">11. Roadmap em Fases</h2>
              <div className="space-y-2">
                <p><strong>Fase 1 (MVP Atual):</strong> Busca Google Maps, Opportunity Score, Funil Kanban, WhatsApp, Dashboard e Exportação CSV.</p>
                <p><strong>Fase 2 (v1.1):</strong> Alertas de follow-up no navegador, sincronização cloud e personalização de pesos de score.</p>
                <p><strong>Fase 3 (v2.0):</strong> Múltiplos vendedores com metas e API oficial WhatsApp Business.</p>
              </div>
            </div>
          )}

          {activeSection === '12' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white tracking-tight">12. Perguntas Estratégicas para Refinamento</h2>
              <ol className="list-decimal pl-5 space-y-2 text-slate-350">
                <li>Quais são as 3 principais dores ou propostas que mais convertem no seu atendimento atual?</li>
                <li>Para o seu negócio, empresas sem site são mais prioritárias do que aquelas com notas baixas no Google?</li>
                <li>Quais campos específicos (como CNPJ ou quantidade de máquinas) você deseja registrar nas anotações da ficha?</li>
                <li>Qual é a sua meta diária de contatos por vendedor na equipe comercial?</li>
                <li>Deseja oferecer um diagnóstico gratuito na página /captura para atrair contatos espontâneos via tráfego pago?</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
