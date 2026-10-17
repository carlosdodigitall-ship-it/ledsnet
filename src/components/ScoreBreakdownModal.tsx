import React from 'react';
import { X, CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert, Zap } from 'lucide-react';
import { Lead } from '../types';

interface ScoreBreakdownModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  lead,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !lead) return null;

  const { scoreBreakdown, opportunityScore, website, rating, reviewCount } = lead;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Score de Oportunidade: {opportunityScore}/100
              </h3>
              <p className="text-xs text-slate-400">{lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-350 leading-relaxed mb-5">
          O <strong>Opportunity Score</strong> mede a propensão deste estabelecimento aceitar uma abordagem de serviços. Negócios sem presença digital ou com baixa reputação têm maior urgência em contratar melhorias.
        </p>

        {/* Lista de Fatores */}
        <div className="space-y-3 mb-6">
          {/* Base */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-200">Pontuação Base Comercial</div>
                <div className="text-[11px] text-slate-400">Ponto de partida padrão para todo lead auditado</div>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-400 font-mono-numbers">+{scoreBreakdown?.base ?? 10} pts</span>
          </div>

          {/* Presença Web / Site */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {!website ? (
                <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-medium text-slate-200">Presença Web (Website)</div>
                <div className="text-[11px] text-slate-400">
                  {!website
                    ? 'Sem site cadastrado (Oportunidade máxima de venda)'
                    : `Site registrado: ${website}`}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono-numbers">
              +{scoreBreakdown?.noWebsite ?? (!website ? 40 : 0)} pts
            </span>
          </div>

          {/* Reputação Google */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {rating < 4.0 ? (
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-medium text-slate-200">Nota no Google Maps</div>
                <div className="text-[11px] text-slate-400">
                  Nota atual: ★ {rating > 0 ? rating.toFixed(1) : 'Sem avaliações'} (Quanto menor, maior a urgência)
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 font-mono-numbers">
              +{scoreBreakdown?.lowRating ?? 15} pts
            </span>
          </div>

          {/* Volume de Avaliações */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-200">Volume de Avaliações</div>
                <div className="text-[11px] text-slate-400">
                  {reviewCount} avaliações públicas registradas
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-300 font-mono-numbers">
              +{scoreBreakdown?.fewReviews ?? 10} pts
            </span>
          </div>

          {/* Canal de Contato */}
          {scoreBreakdown?.contactChannel ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-slate-200">Canal de Contato Inicial</div>
                  <div className="text-[11px] text-slate-400">Telefone fixo tradicional sem WhatsApp direto evidente</div>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-400 font-mono-numbers">
                +{scoreBreakdown.contactChannel} pts
              </span>
            </div>
          ) : null}
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Total Calculado</span>
          <span className="text-sm font-bold text-emerald-400 font-mono-numbers">
            {opportunityScore} / 100 pontos
          </span>
        </div>

        <div className="mt-5 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
