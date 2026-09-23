import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ReceiptText } from 'lucide-react';
import { db } from '../../db/db';
import { formatarMoeda, formatarDataHora, formatarData } from '../../utils/formatters';

export default function CustomerDetailModal({ cliente, onClose }) {
  const [vendas, setVendas] = useState([]);
  const [fiados, setFiados] = useState([]);
  const [itensVendaMap, setItensVendaMap] = useState({});
  const [vendaExpandida, setVendaExpandida] = useState(null);
  const [aba, setAba] = useState('compras'); // 'compras' | 'fiado'

  useEffect(() => {
    const carregarHistorico = async () => {
      if (!cliente?.id) return;
      const vendasCliente = await db.vendas.where('clienteId').equals(cliente.id).reverse().toArray();
      const fiadosCliente = await db.fiados.where('clienteId').equals(cliente.id).reverse().toArray();
      
      const vIds = vendasCliente.map(v => v.id);
      let map = {};
      if (vIds.length > 0) {
        const itens = await db.itensVenda.where('vendaId').anyOf(vIds).toArray();
        itens.forEach(it => {
          if (!map[it.vendaId]) map[it.vendaId] = [];
          map[it.vendaId].push(it);
        });
      }
      setItensVendaMap(map);
      setVendas(vendasCliente);
      setFiados(fiadosCliente);
    };
    carregarHistorico();
  }, [cliente]);

  const totalComprado = vendas.reduce((acc, v) => acc + (v.total || 0), 0);
  const totalPendente = fiados.filter((f) => f.status !== 'Quitado').reduce((acc, f) => acc + (f.saldoDevedor || 0), 0);

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h3>Ficha do Cliente: {cliente.nome}</h3>
          <button onClick={onClose} className="btn-close-modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Card Resumo do Cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 18, background: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #CBD5E1' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Telefone:</div>
              <div style={{ fontWeight: 700 }}>{cliente.telefone || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>CPF:</div>
              <div style={{ fontWeight: 700 }}>{cliente.cpf || '-'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Total em Compras:</div>
              <div style={{ fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{formatarMoeda(totalComprado)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Saldo Devedor (Fiado):</div>
              <div style={{ fontWeight: 900, color: totalPendente > 0 ? '#DC2626' : '#16A34A', fontFamily: 'var(--font-mono)' }}>
                {formatarMoeda(totalPendente)}
              </div>
            </div>
          </div>

          {/* Abas */}
          <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', marginBottom: 14 }}>
            <button
              onClick={() => setAba('compras')}
              className={`nav-tab-btn ${aba === 'compras' ? 'active' : ''}`}
              style={{ color: aba === 'compras' ? '#0F172A' : '#64748B', borderBottomColor: aba === 'compras' ? '#EAB308' : 'transparent' }}
            >
              <ShoppingBag size={16} />
              <span>Histórico de Vendas ({vendas.length})</span>
            </button>
            <button
              onClick={() => setAba('fiado')}
              className={`nav-tab-btn ${aba === 'fiado' ? 'active' : ''}`}
              style={{ color: aba === 'fiado' ? '#0F172A' : '#64748B', borderBottomColor: aba === 'fiado' ? '#EAB308' : 'transparent' }}
            >
              <ReceiptText size={16} />
              <span>Contas Fiado / Crediário ({fiados.length})</span>
            </button>
          </div>

          {aba === 'compras' && (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {vendas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8' }}>Nenhuma compra realizada por este cliente ainda.</div>
              ) : (
                <table className="standard-table">
                  <thead>
                    <tr>
                      <th>Venda Nº</th>
                      <th>Data / Horário</th>
                      <th>Forma de Pagto</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'center' }}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((v) => {
                      const itens = itensVendaMap[v.id] || [];
                      const isExpandida = vendaExpandida === v.id;
                      return (
                        <React.Fragment key={v.id}>
                          <tr>
                            <td style={{ fontWeight: 700 }}>#{v.numeroVenda?.toString().padStart(6, '0')}</td>
                            <td>{formatarDataHora(v.dataHora)}</td>
                            <td>{v.formaPagamento}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                              {formatarMoeda(v.total)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setVendaExpandida(isExpandida ? null : v.id)}
                                className="btn-qty-step"
                                style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem', borderRadius: 4 }}
                                title="Ver itens desta venda"
                              >
                                {isExpandida ? 'Ocultar Itens' : `Ver Itens (${itens.length})`}
                              </button>
                            </td>
                          </tr>
                          {isExpandida && (
                            <tr>
                              <td colSpan="5" style={{ background: '#F8FAFC', padding: '10px 16px', borderBottom: '2px solid #E2E8F0' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                                  Itens comprados nesta venda:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {itens.map((it, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px dashed #E2E8F0', paddingBottom: 2 }}>
                                      <span>{it.quantidade}x {it.nomeProduto}</span>
                                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatarMoeda(it.subtotal)}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {aba === 'fiado' && (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {fiados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8' }}>Nenhuma venda fiada vinculada a este cliente.</div>
              ) : (
                <table className="standard-table">
                  <thead>
                    <tr>
                      <th>Data Venda</th>
                      <th>Vencimento</th>
                      <th style={{ textAlign: 'right' }}>Valor Original</th>
                      <th style={{ textAlign: 'right' }}>Valor Pago</th>
                      <th style={{ textAlign: 'right' }}>Saldo Restante</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fiados.map((f) => (
                      <tr key={f.id}>
                        <td>{formatarData(f.dataVenda)}</td>
                        <td>{formatarData(f.dataVencimento)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatarMoeda(f.valorOriginal)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#16A34A' }}>{formatarMoeda(f.valorPago)}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: f.saldoDevedor > 0 ? '#DC2626' : '#16A34A' }}>
                          {formatarMoeda(f.saldoDevedor)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge-stock ${f.status === 'Quitado' ? 'ok' : 'low'}`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-accent-action">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
