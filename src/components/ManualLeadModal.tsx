import React, { useState } from 'react';
import { X, Plus, Building, Phone, MapPin, Globe, DollarSign } from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { calculateOpportunityScore } from '../services/scorer';

interface ManualLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: Lead) => void;
}

export const ManualLeadModal: React.FC<ManualLeadModalProps> = ({
  isOpen,
  onClose,
  onAddLead,
}) => {
  const [name, setName] = useState('');
  const [segment, setSegment] = useState('Climatização e Refrigeração');
  const [city, setCity] = useState('Salvador - BA');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [dealValue, setDealValue] = useState<number>(1800);
  const [status, setStatus] = useState<LeadStatus>('novo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Nome da empresa e telefone são obrigatórios.');
      return;
    }

    const scoreData = calculateOpportunityScore({
      website: website.trim() || null,
      rating: 4.0,
      reviewCount: 10,
      phone: phone.trim(),
    });

    const newLead: Lead = {
      id: `manual-lead-${Date.now()}`,
      name: name.trim(),
      segment: segment.trim(),
      address: address.trim() || 'Endereço comercial local',
      city: city.trim(),
      phone: phone.trim(),
      whatsapp: phone.replace(/\D/g, ''),
      website: website.trim() || null,
      rating: 4.0,
      reviewCount: 10,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`)}`,
      opportunityScore: scoreData.score,
      scoreBreakdown: scoreData.breakdown,
      status,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual',
      dealValue: Number(dealValue) || 0,
    };

    onAddLead(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Cadastrar Lead Manual
              </h3>
              <p className="text-xs text-slate-400">
                Inserir oportunidade direta de indicação ou prospecção de rua
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
              Nome da Empresa / Condomínio
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Condomínio Edifício Mirante da Barra"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                Ramo / Segmento
              </label>
              <input
                type="text"
                required
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="Ex: Condomínios, Clínicas..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(71) 98888-0000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono-numbers"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                Cidade e Estado
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Salvador - BA"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                placeholder="1800"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono-numbers"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
              Endereço Físico (Bairro, Rua)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Av. ACM, 1200, Itaigara"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
              Website (Deixe em branco se não possuir)
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://exemplo.com.br"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">
              Anotações Preliminares
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Indicado pelo síndico do Condomínio Alfa..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-blue-600/30"
            >
              Cadastrar no Funil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
