import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Boxes, 
  Users, 
  Wallet, 
  TrendingUp, 
  Settings, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function HomeView({ 
  alertasEstoque = 0, 
  alertasFiado = 0, 
  onNavegar 
}) {
  const blocosSecundarios = [
    {
      id: 'produtos',
      titulo: 'PRODUTOS',
      descricao: 'Cadastrar e consultar produtos',
      icone: Package,
      corTema: 'bloco-azul',
      badge: null
    },
    {
      id: 'estoque',
      titulo: 'ESTOQUE',
      descricao: 'Controlar quantidade dos produtos',
      icone: Boxes,
      corTema: 'bloco-roxo',
      badge: alertasEstoque > 0 ? `${alertasEstoque} em baixa` : null,
      badgeTipo: 'aviso'
    },
    {
      id: 'clientes',
      titulo: 'CLIENTES',
      descricao: 'Cadastrar e consultar clientes',
      icone: Users,
      corTema: 'bloco-ciano',
      badge: null
    },
    {
      id: 'fiado',
      titulo: 'FIADO / CREDIÁRIO',
      descricao: 'Ver pendências e registrar pagamentos',
      icone: Wallet,
      corTema: 'bloco-laranja',
      badge: alertasFiado > 0 ? `${alertasFiado} pendente(s)` : null,
      badgeTipo: 'perigo'
    },
    {
      id: 'relatorios',
      titulo: 'RELATÓRIOS',
      descricao: 'Acompanhar vendas e resultados',
      icone: TrendingUp,
      corTema: 'bloco-verde',
      badge: null
    },
    {
      id: 'configuracoes',
      titulo: 'CONFIGURAÇÕES',
      descricao: 'Ajustar sistema',
      icone: Settings,
      corTema: 'bloco-grafite',
      badge: null
    }
  ];

  return (
    <div className="terminal-pos-wrapper">
      {/* Título Central */}
      <div className="terminal-title-container">
        <h2 className="terminal-main-question">O que deseja fazer?</h2>
        <div className="terminal-title-divider"></div>
      </div>

      <div className="terminal-kiosk-container">
        {/* ======================================================================
            1. REGISTRAR VENDA (MAIOR E MAIS DESTACADO BLOCO DA TELA)
            ====================================================================== */}
        <button
          onClick={() => onNavegar('pdv')}
          className="terminal-bloco-hero"
          title="Abrir caixa e registrar vendas"
        >
          <div className="terminal-hero-content">
            <div className="terminal-hero-icon-bubble">
              <ShoppingCart size={54} strokeWidth={2.4} color="#FFFFFF" />
            </div>

            <div className="terminal-hero-text-block">
              <span className="terminal-hero-pill-tag">PRINCIPAL AÇÃO DO SISTEMA</span>
              <h3 className="terminal-hero-title">REGISTRAR VENDA</h3>
              <p className="terminal-hero-subtitle">Abrir caixa e registrar vendas</p>
            </div>
          </div>

          <div className="terminal-hero-touch-hint">
            <span>Toque para Iniciar</span>
            <ArrowRight size={24} strokeWidth={2.6} />
          </div>
        </button>

        {/* ======================================================================
            GRID DE 2 COLUNAS: GRANDES BLOCOS COLORIDOS AUTOEXPLICATIVOS
            ====================================================================== */}
        <div className="terminal-two-cols-grid">
          {blocosSecundarios.map((bloco) => {
            const Icone = bloco.icone;
            return (
              <button
                key={bloco.id}
                onClick={() => onNavegar(bloco.id)}
                className={`terminal-bloco-card ${bloco.corTema}`}
                title={`${bloco.titulo} - ${bloco.descricao}`}
              >
                {bloco.badge && (
                  <div className={`terminal-bloco-badge ${bloco.badgeTipo || 'aviso'}`}>
                    <AlertTriangle size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    {bloco.badge}
                  </div>
                )}

                <div className="terminal-bloco-icon-bubble">
                  <Icone size={42} strokeWidth={2.3} color="#FFFFFF" />
                </div>

                <div className="terminal-bloco-text-block">
                  <h4 className="terminal-bloco-title">{bloco.titulo}</h4>
                  <p className="terminal-bloco-subtitle">{bloco.descricao}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
