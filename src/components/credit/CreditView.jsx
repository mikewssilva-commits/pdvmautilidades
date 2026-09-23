import React, { useState, useEffect } from 'react';
import { 
  ReceiptText, 
  DollarSign, 
  CheckCircle2, 
  Search, 
  AlertCircle,
  TrendingUp,
  History,
  User
} from 'lucide-react';
import { db } from '../../db/db';
import { soundFX } from '../../utils/audio';
import { formatarMoeda, formatarData, formatarDataHora, arredondarMoeda } from '../../utils/formatters';
import PaymentModal from './PaymentModal';

export default function CreditView({ onAtualizacao }) {
  const [fiados, setFiados] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('pendentes'); // 'pendentes' | 'quitados' | 'todos'
  const [abaAtiva, setAbaAtiva] = useState('debitos'); // 'debitos' | 'historico_pagamentos'
  const [fiadoParaPagamento, setFiadoParaPagamento] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const carregarDados = React.useCallback(async () => {
    const todosFiados = await db.fiados.reverse().toArray();
    const todosPagamentos = await db.pagamentosFiado.reverse().sortBy('dataHora');
    setFiados(todosFiados);
    setPagamentos(todosPagamentos);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleConfirmarPagamento = async ({ fiadoId, clienteId, clienteNome, valorPago, formaPagamento, observacao }) => {
    const fiadoAtual = await db.fiados.get(fiadoId);
    if (!fiadoAtual) return;

    const dataHora = new Date().toISOString();
    const vPago = arredondarMoeda(valorPago);
    const novoValorPago = arredondarMoeda(fiadoAtual.valorPago + vPago);
    const novoSaldoRaw = arredondarMoeda(fiadoAtual.saldoDevedor - vPago);
    const novoSaldo = novoSaldoRaw <= 0.001 ? 0 : novoSaldoRaw;
    const novoStatus = novoSaldo === 0 ? 'Quitado' : 'Parcial';

    await db.transaction('rw', [db.fiados, db.pagamentosFiado], async () => {
      // 1. Atualizar registro do fiado
      await db.fiados.update(fiadoId, {
        valorPago: novoValorPago,
        saldoDevedor: novoSaldo,
        status: novoStatus
      });

      // 2. Registrar pagamento na auditoria com o nome do cliente
      await db.pagamentosFiado.add({
        fiadoId,
        clienteId,
        clienteNome: clienteNome || fiadoAtual.clienteNome || `Cliente #${clienteId}`,
        valorPago: vPago,
        dataHora,
        formaPagamento,
        observacao
      });
    });

    soundFX.playCashChime();
    setFiadoParaPagamento(null);
    setFeedbackMsg(`Pagamento de ${formatarMoeda(valorPago)} recebido com sucesso!`);
    await carregarDados();
    if (onAtualizacao) onAtualizacao();
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Cálculos
  const totalPendenteGeral = fiados.filter((f) => f.status !== 'Quitado').reduce((acc, f) => acc + f.saldoDevedor, 0);
  const totalRecebidoHistorico = pagamentos.reduce((acc, p) => acc + p.valorPago, 0);
  const clientesDevedoresUnicos = new Set(fiados.filter((f) => f.status !== 'Quitado').map((f) => f.clienteId)).size;

  // Filtragem
  const fiadosFiltrados = fiados.filter((f) => {
    const matchBusca =
      f.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
      (f.observacao && f.observacao.toLowerCase().includes(busca.toLowerCase()));

    const matchStatus =
      statusFiltro === 'todos'
        ? true
        : statusFiltro === 'quitados'
        ? f.status === 'Quitado'
        : f.status !== 'Quitado';

    return matchBusca && matchStatus;
  });

  return (
    <div className="module-page-container">
      {/* Cabeçalho */}
      <div className="page-action-header">
        <div className="page-title-box">
          <h1>
            <ReceiptText size={26} color="#DC2626" />
            Controle de Fiado / Crediário
          </h1>
          <p>
            Gestão de vendas a prazo, controle de cobrança e registro de quitação de débitos
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 18px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #BBF7D0' }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Cartões de Métricas */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid #DC2626' }}>
          <div className="metric-info">
            <h4>Total em Aberto (Fiado)</h4>
            <div className="metric-val" style={{ color: '#DC2626' }}>
              {formatarMoeda(totalPendenteGeral)}
            </div>
          </div>
          <div className="metric-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <AlertCircle size={26} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Clientes com Pendências</h4>
            <div className="metric-val">{clientesDevedoresUnicos}</div>
          </div>
          <div className="metric-icon-box" style={{ background: '#FEF3C7', color: '#CA8A04' }}>
            <User size={26} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Total já Quitado / Recebido</h4>
            <div className="metric-val" style={{ color: '#16A34A' }}>
              {formatarMoeda(totalRecebidoHistorico)}
            </div>
          </div>
          <div className="metric-icon-box" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <TrendingUp size={26} />
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="data-table-card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: '#F8FAFC', padding: '0 14px' }}>
          <button
            onClick={() => setAbaAtiva('debitos')}
            className={`nav-tab-btn ${abaAtiva === 'debitos' ? 'active' : ''}`}
            style={{ color: abaAtiva === 'debitos' ? '#0F172A' : '#64748B', borderBottomColor: abaAtiva === 'debitos' ? '#EAB308' : 'transparent' }}
          >
            <ReceiptText size={18} />
            <span>Contas a Receber ({fiados.length})</span>
          </button>
          <button
            onClick={() => setAbaAtiva('historico_pagamentos')}
            className={`nav-tab-btn ${abaAtiva === 'historico_pagamentos' ? 'active' : ''}`}
            style={{ color: abaAtiva === 'historico_pagamentos' ? '#0F172A' : '#64748B', borderBottomColor: abaAtiva === 'historico_pagamentos' ? '#EAB308' : 'transparent' }}
          >
            <History size={18} />
            <span>Histórico de Pagamentos Recebidos ({pagamentos.length})</span>
          </button>
        </div>

        {/* Toolbar de Filtros */}
        <div className="data-table-toolbar">
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 260 }}>
            <Search className="search-input-icon" size={18} />
            <input
              type="text"
              className="search-input"
              style={{ padding: '8px 12px 8px 36px', fontSize: '0.9rem' }}
              placeholder="Buscar por nome do cliente ou anotação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {abaAtiva === 'debitos' && (
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 160, padding: '8px 12px' }}
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="pendentes">Apenas Pendentes</option>
              <option value="quitados">Apenas Quitados</option>
              <option value="todos">Todos os Status</option>
            </select>
          )}
        </div>

        {/* Tabela de Contas Fiado */}
        {abaAtiva === 'debitos' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Data da Compra</th>
                  <th>Vencimento</th>
                  <th style={{ textAlign: 'right' }}>Valor Original</th>
                  <th style={{ textAlign: 'right' }}>Valor Pago</th>
                  <th style={{ textAlign: 'right' }}>Saldo Devedor</th>
                  <th style={{ textAlign: 'center' }}>Situação</th>
                  <th style={{ width: 140, textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {fiadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      Nenhuma conta localizada para os filtros atuais.
                    </td>
                  </tr>
                ) : (
                  fiadosFiltrados.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{item.clienteNome}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.observacao}</div>
                      </td>
                      <td>{formatarData(item.dataVenda)}</td>
                      <td>{formatarData(item.dataVencimento)}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {formatarMoeda(item.valorOriginal)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#16A34A', fontWeight: 600 }}>
                        {formatarMoeda(item.valorPago)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: item.saldoDevedor > 0 ? '#DC2626' : '#16A34A', fontSize: '1rem' }}>
                        {formatarMoeda(item.saldoDevedor)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge-stock ${item.status === 'Quitado' ? 'ok' : item.status === 'Parcial' ? 'low' : 'out'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {item.saldoDevedor > 0 ? (
                          <button
                            onClick={() => setFiadoParaPagamento(item)}
                            className="btn-accent-action"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <DollarSign size={14} />
                            Receber
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 700 }}>
                            Quitado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela de Histórico de Pagamentos */}
        {abaAtiva === 'historico_pagamentos' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Data / Horário</th>
                  <th>Cliente</th>
                  <th style={{ textAlign: 'right' }}>Valor Recebido</th>
                  <th>Forma de Pagamento</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      Nenhum recebimento registrado ainda.
                    </td>
                  </tr>
                ) : (
                  pagamentos.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontSize: '0.85rem', color: '#475569' }}>{formatarDataHora(p.dataHora)}</td>
                      <td style={{ fontWeight: 700 }}>{p.clienteNome || `Cliente #${p.clienteId}`}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#16A34A' }}>
                        {formatarMoeda(p.valorPago)}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{p.formaPagamento}</span>
                      </td>
                      <td style={{ color: '#64748B' }}>{p.observacao}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {fiadoParaPagamento && (
        <PaymentModal
          fiado={fiadoParaPagamento}
          onConfirmarPagamento={handleConfirmarPagamento}
          onClose={() => setFiadoParaPagamento(null)}
        />
      )}
    </div>
  );
}
