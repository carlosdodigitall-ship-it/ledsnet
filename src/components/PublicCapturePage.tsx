import React, { useState } from 'react';
import { ShieldCheck, Send, CheckCircle2, ArrowLeft, Sparkles, Building, Phone, User, MessageCircle } from 'lucide-react';
import { Lead } from '../types';

interface PublicCapturePageProps {
  onBackToApp: () => void;
  onLeadCaptured: (lead: Lead) => void;
}

export const PublicCapturePage: React.FC<PublicCapturePageProps> = ({
  onBackToApp,
  onLeadCaptured,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [interest, setInterest] = useState('Manutenção Preventiva e Climatização');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Parâmetros UTM simulados ou obtidos da URL
  const utmSource = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') || 'instagram' : 'direto';
  const utmCampaign = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') || 'salvador_climatizacao' : 'geral';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !consent) {
      alert('Por favor, preencha nome, WhatsApp e aceite os termos de consentimento.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${name.trim()} (${company.trim() || 'Empresa'})`,
          phone: phone.trim(),
          segment: interest,
          notes,
          utmSource,
          utmCampaign,
          consent,
        }),
      });

      const data = await response.json();
      if (data.lead) {
        onLeadCaptured(data.lead);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Erro ao enviar formulário:', err);
      // Fallback local se estiver offline
      const localLead: Lead = {
        id: `capture-${Date.now()}`,
        name: `${name.trim()} (${company.trim() || 'Empresa'})`,
        segment: interest,
        address: 'Contato Web',
        city: 'Salvador - BA',
        phone: phone.trim(),
        whatsapp: phone.replace(/\D/g, ''),
        website: null,
        rating: 0,
        reviewCount: 0,
        mapsUrl: '',
        opportunityScore: 88,
        scoreBreakdown: {
          base: 10,
          noWebsite: 40,
          lowRating: 20,
          fewReviews: 15,
          contactChannel: 0,
        },
        status: 'novo',
        notes: `Solicitação via página de captura. Interesse: ${interest}. Obs: ${notes}. UTM: [origem: ${utmSource}]`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'landing_page',
        dealValue: 2000,
      };
      onLeadCaptured(localLead);
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Topo com navegação de volta para o Dashboard */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-bold text-white text-lg tracking-tight">LedsNet Soluções</span>
          <span className="text-xs text-slate-500 font-mono-numbers">/captura pública</span>
        </div>
        <button
          onClick={onBackToApp}
          className="text-xs text-blue-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Painel Interno</span>
        </button>
      </header>

      {/* Conteúdo Central */}
      <main className="max-w-xl w-full mx-auto p-6 my-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Decoração sutil */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Solicitação Recebida com Sucesso!</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Nossa equipe comercial já recebeu os seus dados e entrará em contato via WhatsApp em até 15 minutos com um diagnóstico preliminar.
              </p>
              <div className="pt-4">
                <button
                  onClick={onBackToApp}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition cursor-pointer"
                >
                  Ver Lead no Painel de Vendas
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Diagnóstico Técnico Gratuito</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Solicite um Diagnóstico Preventivo para sua Empresa
                </h1>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Evite quebras de equipamentos, multas sanitárias do PMOC e contas de energia excessivas em condomínios, clínicas e comércios.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                    Seu Nome Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo Silva"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                    WhatsApp para Contato
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: (71) 99999-8888"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none font-mono-numbers"
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                    Nome da Empresa / Condomínio
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ex: Condomínio Edifício Mirante"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white outline-none"
                    />
                    <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                    Principal Necessidade
                  </label>
                  <select
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="Manutenção Preventiva e Climatização">Contrato de Manutenção Preventiva (PMOC)</option>
                    <option value="Reparo Urgente de Ar Condicionado">Conserto / Reparo Emergencial</option>
                    <option value="Instalação de Novos Equipamentos">Nova Instalação / Troca de Aparelhos</option>
                    <option value="Higienização e Laudo Técnico">Higienização e Emissão de Laudos</option>
                    <option value="Outros Serviços Técnicos">Outros Serviços Prediais / Comerciais</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                    Observações Adicionais (Opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Ex: Temos 12 aparelhos split e 1 câmara fria..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-white outline-none resize-none"
                  />
                </div>

                {/* Consentimento LGPD */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 accent-emerald-500 rounded"
                    />
                    <span className="text-[11px] leading-relaxed">
                      Concordo em receber um contato técnico via WhatsApp com o diagnóstico solicitado e estou ciente da Política de Privacidade nos termos da LGPD (Lei 13.709/2018).
                    </span>
                  </label>
                </div>

                {/* Rastreador UTM Visível */}
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-mono-numbers flex items-center justify-between">
                  <span>Campanha Rastreável: {utmCampaign}</span>
                  <span>Origem: {utmSource}</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Enviando...' : 'Solicitar Diagnóstico sem Compromisso'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800/80 p-4 text-center text-xs text-slate-500">
        © 2026 LedsNet · Todos os direitos reservados · Em conformidade com a LGPD
      </footer>
    </div>
  );
};
