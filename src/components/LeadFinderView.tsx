import React, { useState } from 'react';
import {
  Search,
  Filter,
  MapPin,
  ExternalLink,
  Plus,
  Check,
  MessageSquare,
  HelpCircle,
  Globe,
  Star,
  SlidersHorizontal,
  Loader2,
  Sparkles,
  AlertCircle,
  Info
} from 'lucide-react';
import { Lead, SearchFilters } from '../types';
import { calculateOpportunityScore } from '../services/scorer';

interface LeadFinderViewProps {
  existingLeads: Lead[];
  onAddLeadToFunnel: (lead: Lead) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onOpenScoreExplanation: (lead: Lead) => void;
}

const REGION_PRESETS = [
  'Salvador - Pituba e Região',
  'Salvador - Barra e Graça',
  'Salvador - Caminho das Árvores e Itaigara',
  'Lauro de Freitas - Estrada do Coco',
  'São Paulo - Pinheiros e Jardins',
  'Rio de Janeiro - Barra da Tijuca',
];

const SEGMENT_PRESETS = [
  'Climatização e Refrigeração',
  'Condomínios',
  'Restaurantes',
  'Clínicas Médicas e Odonto',
  'Lojas e Varejo',
  'Academias e Fitness',
  'Hotéis e Pousadas',
];

export const LeadFinderView: React.FC<LeadFinderViewProps> = ({
  existingLeads,
  onAddLeadToFunnel,
  onOpenWhatsApp,
  onOpenScoreExplanation,
}) => {
  const [segment, setSegment] = useState('Climatização e Refrigeração');
  const [location, setLocation] = useState('Salvador, BA');
  const [radiusKm, setRadiusKm] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');

  // Filtros de Oportunidade
  const [filters, setFilters] = useState<SearchFilters>({
    onlyNoWebsite: false,
    lowRatingOnly: false,
    fewReviewsOnly: false,
    minScore: 0,
  });

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!location.trim() || !segment.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment: segment.trim(),
          location: location.trim(),
          radiusKm,
        }),
      });

      const data = await response.json();
      if (data.notice && data.quotaExceeded) {
        setNoticeMessage(data.notice);
      } else {
        setNoticeMessage('');
      }

      if (data.leads && Array.isArray(data.leads)) {
        // Enriquecer cada lead com o cálculo de score LedsNet
        const enriched = data.leads.map((raw: any) => {
          const scoreData = calculateOpportunityScore({
            website: raw.website,
            rating: raw.rating,
            reviewCount: raw.reviewCount,
            phone: raw.phone,
          });

          return {
            ...raw,
            opportunityScore: scoreData.score,
            scoreBreakdown: scoreData.breakdown,
            status: 'novo' as const,
            notes: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Lead;
        });

        // Ordena por maior Score de Oportunidade primeiro (mais urgentes)
        enriched.sort((a: Lead, b: Lead) => b.opportunityScore - a.opportunityScore);
        setSearchResults(enriched);
        setHasSearched(true);
      } else {
        setErrorMessage('Nenhum estabelecimento encontrado com os filtros atuais.');
      }
    } catch (err: any) {
      console.warn('Falha na busca:', err);
      setErrorMessage('Não foi possível conectar ao servidor de busca. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtragem no cliente
  const filteredResults = searchResults.filter((lead) => {
    if (filters.onlyNoWebsite && lead.website) return false;
    if (filters.lowRatingOnly && lead.rating >= 4.0) return false;
    if (filters.fewReviewsOnly && lead.reviewCount >= 20) return false;
    if (filters.minScore > 0 && lead.opportunityScore < filters.minScore) return false;
    return true;
  });

  const isLeadInFunnel = (lead: Lead) => {
    return existingLeads.some(
      (el) =>
        (lead.placeId && el.placeId === lead.placeId) ||
        (lead.phone && el.phone && el.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, '')) ||
        el.name.toLowerCase() === lead.name.toLowerCase()
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Barra de Pesquisa Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              <span>Buscador de Leads & Oportunidades Locais</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Dados públicos do Google Maps com análise preditiva de oportunidade de vendas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Raio: {radiusKm} km
            </span>
            <input
              type="range"
              min="3"
              max="50"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
              className="w-24 accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Ramo de Atividade */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-350 uppercase tracking-wider mb-1.5">
                Ramo de Atividade / Negócio
              </label>
              <input
                type="text"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="Ex: Climatização e Refrigeração, Condomínios, Clínicas..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition"
              />
            </div>

            {/* Localização (Cidade ou Bairro) */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-350 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Localização (Cidade ou Bairro)</span>
                <span className="text-[10px] text-slate-500 lowercase">cidade, bairro ou região</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Pituba, Salvador ou Barra, Salvador ou Pinheiros, SP..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white outline-none transition"
                />
                <MapPin className="w-4 h-4 text-blue-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Segunda linha: Seletor de Raio de Busca e Botão de Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            {/* Seletor de Raio (5km, 10km, 20km, 50km) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                Raio de Busca:
              </span>
              <div className="inline-flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl gap-1">
                {[5, 10, 20, 50].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => {
                      setRadiusKm(km);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer font-mono-numbers ${
                      radiusKm === km
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 hidden lg:inline">
                ({radiusKm === 5 ? 'Hiperlocal no bairro' : radiusKm === 10 ? 'Bairros adjacentes' : radiusKm === 20 ? 'Região Metropolitana' : 'Ampla Cobertura'})
              </span>
            </div>

            {/* Botão de Busca */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 h-[40px] bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-600/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buscando no Google Maps...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar Estabelecimentos ({radiusKm}km)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Sugestões Rápidas de Cidade ou Bairro */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">Bairros e Cidades Sugeridos:</span>
          {[
            { label: 'Pituba (Salvador)', loc: 'Pituba, Salvador - BA' },
            { label: 'Barra (Salvador)', loc: 'Barra, Salvador - BA' },
            { label: 'Itaigara (Salvador)', loc: 'Itaigara, Salvador - BA' },
            { label: 'Lauro de Freitas', loc: 'Lauro de Freitas, BA' },
            { label: 'Pinheiros (SP)', loc: 'Pinheiros, São Paulo - SP' },
            { label: 'Barra da Tijuca (RJ)', loc: 'Barra da Tijuca, Rio de Janeiro - RJ' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setLocation(item.loc);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 border border-slate-800/80 text-[11px] transition cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Painel de Filtros de Oportunidade */}
      {searchResults.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-300">Filtros de Oportunidade:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={filters.onlyNoWebsite}
                onChange={(e) => setFilters({ ...filters, onlyNoWebsite: e.target.checked })}
                className="accent-blue-500 rounded"
              />
              <span>Apenas sem site (+40 pts)</span>
            </label>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={filters.lowRatingOnly}
                onChange={(e) => setFilters({ ...filters, lowRatingOnly: e.target.checked })}
                className="accent-amber-500 rounded"
              />
              <span>Nota &lt; 4.0 (+25 pts)</span>
            </label>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={filters.fewReviewsOnly}
                onChange={(e) => setFilters({ ...filters, fewReviewsOnly: e.target.checked })}
                className="accent-blue-500 rounded"
              />
              <span>Poucas avaliações (&lt; 20)</span>
            </label>
          </div>

          <span className="text-xs text-slate-400 font-mono-numbers">
            Mostrando {filteredResults.length} de {searchResults.length} estabelecimentos
          </span>
        </div>
      )}

      {/* Mensagem de Erro */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Aviso Informativo / Motor de Alta Disponibilidade */}
      {noticeMessage && (
        <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/80 text-blue-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="leading-relaxed">{noticeMessage}</span>
          </div>
          <button
            onClick={() => setNoticeMessage('')}
            className="text-[11px] text-blue-400 hover:text-white underline cursor-pointer shrink-0"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Grid de Resultados */}
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResults.map((lead) => {
            const inFunnel = isLeadInFunnel(lead);
            const isHighUrgency = lead.opportunityScore >= 80;

            return (
              <div
                key={lead.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition flex flex-col justify-between group"
              >
                <div>
                  {/* Topo do Card com Score */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 font-medium block truncate">
                        {lead.segment}
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-blue-300 transition truncate">
                        {lead.name}
                      </h3>
                    </div>

                    {/* Opportunity Score Badge */}
                    <div className="text-right shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenScoreExplanation(lead)}
                        title="Ver cálculo detalhado do Opportunity Score"
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono-numbers transition cursor-pointer flex items-center gap-1 ${
                          isHighUrgency
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{lead.opportunityScore}</span>
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                      </button>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {isHighUrgency ? 'Alta Urgência' : 'Oportunidade'}
                      </span>
                    </div>
                  </div>

                  {/* Informações de Endereço e Google Maps */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{lead.address}</span>
                    </p>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-amber-400 font-bold font-mono-numbers">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{lead.rating > 0 ? lead.rating.toFixed(1) : 'Sem nota'}</span>
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono-numbers text-slate-400">
                        {lead.reviewCount} avaliações
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono-numbers">{lead.phone}</span>
                    </div>

                    <div className="pt-1">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Sem site oficial (Oportunidade Forte)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {lead.mapsUrl ? (
                    <a
                      href={lead.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Ver ficha oficial no Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(lead)}
                      className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/30 transition cursor-pointer"
                      title="Falar no WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={inFunnel}
                      onClick={() => onAddLeadToFunnel(lead)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                        inFunnel
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-sm shadow-blue-600/30'
                      }`}
                    >
                      {inFunnel ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>No Funil</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add ao Funil</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : hasSearched && !isLoading ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Nenhum resultado nos critérios selecionados</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Tente desativar os filtros restritivos (como "Apenas sem site") ou aumentar o raio de busca em quilômetros.
          </p>
          <button
            onClick={() => setFilters({ onlyNoWebsite: false, lowRatingOnly: false, fewReviewsOnly: false, minScore: 0 })}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        /* Estado inicial / Convite à busca */
        <div className="text-center py-12 bg-slate-900/30 border border-slate-800/50 rounded-2xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">Pronto para Prospectar</h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto mt-1 mb-6 leading-relaxed">
            Selecione uma região e ramo acima. O LedsNet consultará os dados públicos do Google Maps e priorizará os estabelecimentos com maiores brechas comerciais para você contatar no WhatsApp.
          </p>
          <button
            onClick={() => handleSearch()}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-blue-600/25"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Fazer Busca de Demonstração em Salvador</span>
          </button>
        </div>
      )}
    </div>
  );
};
