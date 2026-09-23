import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Clock } from 'lucide-react';

export default function Header({ config, somAtivo, onToggleSom, onIrParaInicio }) {
  const [dataHora, setDataHora] = useState({ data: '', hora: '' });

  useEffect(() => {
    const atualizarRelogio = () => {
      const agora = new Date();
      setDataHora({
        data: agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        hora: agora.toLocaleTimeString('pt-BR')
      });
    };
    atualizarRelogio();
    const interval = setInterval(atualizarRelogio, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-header">
      <div 
        className="brand-wrapper" 
        onClick={onIrParaInicio}
        style={{ cursor: onIrParaInicio ? 'pointer' : 'default' }}
        title="Clique para ir à Tela Inicial"
      >
        <div className="brand-logo-badge">
          <span className="brand-name">
            <span className="brand-name-ma">MA</span>
            <span className="brand-name-utilidades">Utilidades</span>
          </span>
          <span className="brand-badge-tag">PDV</span>
        </div>
      </div>

      <div className="header-status-bar">
        <div className="status-pill terminal-caixa-badge">
          <div className="status-dot-active" title="Caixa Aberto"></div>
          <span className="terminal-caixa-text">Caixa {config?.numeroCaixa || '01'}</span>
        </div>

        <button 
          onClick={onToggleSom} 
          className="status-pill"
          style={{ cursor: 'pointer', background: somAtivo ? '#1E293B' : '#334155' }}
          title={somAtivo ? 'Sons de bipe e caixa ativados (clique para mutar)' : 'Sons mutados (clique para ativar)'}
        >
          {somAtivo ? <Volume2 size={16} color="#EAB308" /> : <VolumeX size={16} color="#94A3B8" />}
          <span>{somAtivo ? 'Bip Ativo' : 'Mudo'}</span>
        </button>

        <div className="clock-display">
          <Clock size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          <span>{dataHora.data} • {dataHora.hora}</span>
        </div>
      </div>
    </header>
  );
}
