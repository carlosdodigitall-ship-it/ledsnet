import React from 'react';
import { Search, Settings, Globe, Plus, Shield, Menu, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'finder' | 'kanban' | 'tasks' | 'prd' | 'capture';
  onSelectTab: (tab: 'dashboard' | 'finder' | 'kanban' | 'tasks' | 'prd' | 'capture') => void;
  onOpenSettings: () => void;
  onNewSearch: () => void;
  accessKey: string;
  totalLeadsCount: number;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  onNewSearch,
  accessKey,
  totalLeadsCount,
  onToggleSidebar,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 md:gap-8">
      {/* Zone 1: Gaveta Drawer button + Single text element wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          title="Abrir gaveta de navegação lateral"
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
        >
          <Menu className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline text-xs font-semibold text-slate-300">Menu</span>
        </button>

        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('dashboard');
          }}
          className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0 group ml-1"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
          <span>LedsNet</span>
        </a>
      </div>

      {/* Zone 2: 4-5 concise single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
            currentTab === 'dashboard' ? 'text-white font-semibold' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('finder')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
            currentTab === 'finder' ? 'text-blue-400 font-semibold' : ''
          }`}
        >
          Buscar Leads
        </button>
        <button
          onClick={() => onSelectTab('kanban')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
            currentTab === 'kanban' ? 'text-white font-semibold' : ''
          }`}
        >
          Funil ({totalLeadsCount})
        </button>
        <button
          onClick={() => onSelectTab('tasks')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
            currentTab === 'tasks' ? 'text-white font-semibold' : ''
          }`}
        >
          Tarefas do Dia
        </button>
        <button
          onClick={() => onSelectTab('prd')}
          className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
            currentTab === 'prd' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          PRD Oficial
        </button>
      </nav>

      {/* Zone 3: 1 primary action with secondary icon utilities */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/landing.html"
          target="_blank"
          rel="noopener noreferrer"
          title="Ver Landing Page de Vendas externa"
          className="p-2 rounded-lg text-xs font-medium border border-blue-900/60 bg-blue-950/40 text-blue-300 hover:text-white hover:bg-blue-900/50 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">Landing Page</span>
        </a>

        <button
          onClick={() => onSelectTab('capture')}
          title="Ver Página Pública de Captura (/captura)"
          className={`p-2 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            currentTab === 'capture'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Página /captura</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Configurações e Chave Privada"
          className="p-2 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onNewSearch}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-600/30"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Buscar Leads</span>
        </button>
      </div>
    </header>
  );
};
