import React from 'react';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Boxes, 
  Users, 
  ReceiptText, 
  BarChart3, 
  Settings,
  ChevronRight
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  alertasEstoque = 0, 
  alertasFiado = 0 
}) {
  // Se estiver na tela inicial (painel de ações), não renderiza menu superior
  // mantendo a experiência 100% limpa e focada nos cards grandes
  if (activeTab === 'home') {
    return null;
  }

  const modulosMap = {
    pdv: {
      label: 'REGISTRAR VENDA (Caixa)',
      icon: ShoppingCart,
      cor: '#EAB308',
      atalho: 'F4 Finalizar'
    },
    produtos: {
      label: 'PRODUTOS',
      icon: Package,
      cor: '#3B82F6',
      atalho: null
    },
    estoque: {
      label: 'CONTROLE DE ESTOQUE',
      icon: Boxes,
      cor: '#8B5CF6',
      badge: alertasEstoque > 0 ? `${alertasEstoque} em baixa` : null,
      atalho: null
    },
    clientes: {
      label: 'CLIENTES',
      icon: Users,
      cor: '#06B6D4',
      atalho: null
    },
    fiado: {
      label: 'FIADO / CREDIÁRIO',
      icon: ReceiptText,
      cor: '#F59E0B',
      badge: alertasFiado > 0 ? `${alertasFiado} pendente(s)` : null,
      atalho: null
    },
    relatorios: {
      label: 'RELATÓRIOS',
      icon: BarChart3,
      cor: '#10B981',
      atalho: null
    },
    configuracoes: {
      label: 'CONFIGURAÇÕES',
      icon: Settings,
      cor: '#94A3B8',
      atalho: null
    }
  };

  const moduloAtual = modulosMap[activeTab] || {
    label: 'Módulo',
    icon: ShoppingCart,
    cor: '#EAB308'
  };

  const ModuloIcone = moduloAtual.icon;

  return (
    <nav className="context-nav-bar">
      <div className="context-nav-left">
        {/* Botão Principal: Voltar ao Início */}
        <button
          onClick={() => setActiveTab('home')}
          className="btn-nav-back-home"
          title="Voltar para a tela inicial com todos os botões"
        >
          <Home size={18} />
          <span>Início</span>
        </button>

        <ChevronRight size={16} color="#64748B" />

        {/* Indicador 'Você está aqui' com alto destaque */}
        <div className="current-location-badge">
          <span className="location-prefix">Você está em:</span>
          <div className="location-name-pill" style={{ borderColor: moduloAtual.cor }}>
            <ModuloIcone size={18} color={moduloAtual.cor} />
            <span className="location-name-text">{moduloAtual.label}</span>
          </div>

          {moduloAtual.badge && (
            <span className="location-alert-badge">
              {moduloAtual.badge}
            </span>
          )}
        </div>
      </div>

      <div className="context-nav-right">
        {/* Atalhos contextuais da tela */}
        <div className="nav-shortcuts-hint">
          {activeTab === 'pdv' ? (
            <>
              <span><kbd className="kbd-badge">F2</kbd> Buscar</span>
              <span><kbd className="kbd-badge">F4</kbd> Finalizar</span>
              <span><kbd className="kbd-badge">F9</kbd> Limpar</span>
            </>
          ) : (
            <span>Pressione no botão <strong>Início</strong> para trocar de opção</span>
          )}
        </div>
      </div>
    </nav>
  );
}
