import React from 'react';
import {
  LayoutDashboard,
  Search,
  Kanban,
  CheckSquare,
  BookOpen,
  Globe,
  Settings,
  Plus,
  ShieldCheck,
  X,
  Sparkles,
  ArrowRight,
  LogOut,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: 'dashboard' | 'finder' | 'kanban' | 'tasks' | 'prd' | 'capture';
  onSelectTab: (tab: 'dashboard' | 'finder' | 'kanban' | 'tasks' | 'prd' | 'capture') => void;
  totalLeadsCount: number;
  pendingTasksCount: number;
  accessKey: string;
  onOpenSettings: () => void;
  onOpenManualLead: () => void;
  onLogout: () => void;
  isDesktopPinned: boolean;
  onToggleDesktopPin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  totalLeadsCount,
  pendingTasksCount,
  accessKey,
  onOpenSettings,
  onOpenManualLead,
  onLogout,
  isDesktopPinned,
  onToggleDesktopPin,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      description: 'Métricas e Funil',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'finder' as const,
      label: 'Buscar Leads',
      description: 'Google Maps & Score',
      icon: Search,
      highlight: true,
      badge: null,
    },
    {
      id: 'kanban' as const,
      label: 'Funil Comercial',
      description: 'Pipeline de 6 estágios',
      icon: Kanban,
      badge: totalLeadsCount > 0 ? `${totalLeadsCount}` : null,
      badgeColor: 'bg-blue-600/30 text-blue-300 border border-blue-500/30',
    },
    {
      id: 'tasks' as const,
      label: 'Tarefas de Hoje',
      description: 'Follow-ups agendados',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
      badgeColor: 'bg-amber-600/30 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'capture' as const,
      label: 'Página /captura',
      description: 'Formulário com UTMs',
      icon: Globe,
      badge: 'Pública',
      badgeColor: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20',
    },
    {
      id: 'prd' as const,
      label: 'PRD Oficial',
      description: 'Requisitos & Escopo',
      icon: BookOpen,
      badge: 'v1.0',
      badgeColor: 'bg-purple-600/20 text-purple-300 border border-purple-500/20',
    },
  ];

  return (
    <>
      {/* Backdrop para celular e tablets */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Gaveta Lateral (Sidebar Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/80 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDesktopPinned ? 'lg:translate-x-0 lg:static lg:z-30' : ''}`}
      >
        {/* Cabeçalho da Gaveta */}
        <div>
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>LedsNet</span>
                  <span className="text-[10px] font-mono-numbers px-1.5 py-0.2 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30">
                    SaaS
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  Prospecção Inteligente
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Botão de fixar na lateral no Desktop */}
              <button
                type="button"
                onClick={onToggleDesktopPin}
                title={isDesktopPinned ? 'Desafixar barra lateral' : 'Fixar barra lateral no desktop'}
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition cursor-pointer"
              >
                <ChevronLeft className={`w-4 h-4 transition-transform ${isDesktopPinned ? '' : 'rotate-180'}`} />
              </button>

              {/* Botão de Fechar Gaveta */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer lg:hidden"
                title="Fechar gaveta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Botão de Ação Rápida */}
          <div className="p-3">
            <button
              type="button"
              onClick={() => {
                onOpenManualLead();
                onClose();
              }}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Lead Manual</span>
            </button>
          </div>

          {/* Links de Navegação */}
          <nav className="px-3 py-2 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 block">
              Menu de Navegação
            </span>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer group ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-300 font-semibold border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-blue-400'
                          : item.highlight
                          ? 'text-blue-400 group-hover:text-blue-300'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <div className="text-left min-w-0">
                      <div className="truncate leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded-md font-bold shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Link para Landing Page de Vendas */}
            <div className="pt-2 border-t border-slate-800/60 mt-2">
              <a
                href="/landing.html"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/40 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="truncate font-semibold">Landing de Vendas</div>
                    <div className="text-[10px] text-slate-400 truncate">Página pública externa</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              </a>
            </div>
          </nav>
        </div>

        {/* Rodapé da Gaveta */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/30 space-y-2">
          {/* Status da Chave de Acesso */}
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-slate-300 block truncate">
                  Chave Ativa
                </span>
                <span className="text-[10px] text-slate-400 font-mono-numbers truncate block">
                  {'Autenticação Firebase ativa'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              title="Configurações e Chave Privada"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botão de Encerrar Sessão */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja encerrar a sessão neste navegador?')) {
                onLogout();
                onClose();
              }
            }}
            className="w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};
