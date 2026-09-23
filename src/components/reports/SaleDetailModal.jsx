import React, { useState } from 'react';
import { 
  X, 
  Receipt, 
  User, 
  CreditCard, 
  AlertTriangle, 
  AlertOctagon,
  Trash2,
  Clock
} from 'lucide-react';
import { formatarMoeda } from '../../utils/formatters';

export default function SaleDetailModal({ 
  venda, 
  itens = [], 
  onClose, 
  onCancelarVenda 
}) {
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [processando, setProcessando] = useState(false);

  if (!venda) return null;

  const isCancelada = venda.status === 'Cancelada';
  const totalItens = itens.reduce((acc, it) => acc + (parseInt(it.quantidade, 10) || 0), 0);

  const handleConfirmarCancelamento = async () => {
    setProcessando(true);
    try {
      await onCancelarVenda(venda.id, motivo || 'Cancelada pelo operador');
      setConfirmandoCancelamento(false);
    } catch (err) {
      console.error('Erro ao cancelar:', err);
    } finally {
      setProcessando(false);
    }
  };

  const formatarDataHora = (dataStr) => {
    if (!dataStr) return '-';
    try {
      const d = new Date(dataStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content sale-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Modal */}
        <div className="modal-header">
          <div className="sale-detail-header-info">
            <div className="sale-detail-icon-badge">
              <Receipt size={24} color="#EAB308" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2>Venda #{venda.numeroVenda ? venda.numeroVenda.toString().padStart(6, '0') : venda.id}</h2>
                <span className={`badge-sale-status ${isCancelada ? 'cancelled' : 'completed'}`}>
                  {isCancelada ? 'Cancelada' : 'Finalizada'}
                </span>
              </div>
              <span className="sale-detail-subtitle">
                Registrada em {formatarDataHora(venda.dataHora)} • Caixa {venda.caixaId || '01'}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal" title="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Alerta se a venda foi Cancelada */}
          {isCancelada && (
            <div className="sale-cancelled-alert">
              <AlertOctagon size={24} color="#DC2626" style={{ flexShrink: 0 }} />
              <div>
                <strong>Essa venda foi cancelada em {formatarDataHora(venda.dataCancelamento)}.</strong>
                <p>Os itens foram devolvidos ao estoque e a venda não é computada no faturamento.</p>
                {venda.motivoCancelamento && (
                  <div style={{ marginTop: 4, fontSize: '0.85rem' }}>
                    <strong>Motivo:</strong> {venda.motivoCancelamento}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cards Rápidos de Informação */}
          <div className="sale-info-grid">
            <div className="sale-info-card">
              <div className="sale-info-card-label">
                <User size={14} /> Cliente
              </div>
              <div className="sale-info-card-val" title={venda.clienteNome || 'Consumidor Final'}>
                {venda.clienteNome || 'Consumidor Final'}
              </div>
            </div>

            <div className="sale-info-card">
              <div className="sale-info-card-label">
                <CreditCard size={14} /> Forma de Pagamento
              </div>
              <div className="sale-info-card-val">
                {venda.formaPagamento || 'Não informada'}
              </div>
            </div>

            <div className="sale-info-card">
              <div className="sale-info-card-label">
                <Clock size={14} /> Operador
              </div>
              <div className="sale-info-card-val">
                {venda.operador || 'Operador'}
              </div>
            </div>

            <div className="sale-info-card">
              <div className="sale-info-card-label">
                <Receipt size={14} /> Volume de Itens
              </div>
              <div className="sale-info-card-val">
                {itens.length} {itens.length === 1 ? 'item' : 'itens'} ({totalItens} un)
              </div>
            </div>
          </div>

          {/* Tabela de Produtos Vendidos */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#334155' }}>
                Produtos da Venda ({itens.length})
              </h4>
            </div>

            <div className="sale-items-table-wrapper">
              <table className="standard-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Produto</th>
                    <th style={{ width: 140 }}>Cód. Barras</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Qtd</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Preço Unit.</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>
                        Nenhum item associado a esta venda.
                      </td>
                    </tr>
                  ) : (
                    itens.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td style={{ color: '#94A3B8', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>{it.nomeProduto}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748B' }}>
                          {it.codigoBarras || '-'}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                          {it.quantidade} un
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#475569' }}>
                          {formatarMoeda(it.precoUnitario)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>
                          {formatarMoeda(it.subtotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Financeiro da Venda */}
          <div className="sale-totals-summary-box">
            <div className="sale-totals-col">
              <div className="sale-totals-row">
                <span>Subtotal dos Produtos:</span>
                <span>{formatarMoeda(venda.subtotal || venda.total)}</span>
              </div>
              {venda.desconto > 0 && (
                <div className="sale-totals-row discount-row">
                  <span>Desconto Aplicado:</span>
                  <span>- {formatarMoeda(venda.desconto)}</span>
                </div>
              )}
              {venda.valorRecebido > 0 && venda.troco > 0 && (
                <>
                  <div className="sale-totals-row">
                    <span>Valor Recebido:</span>
                    <span>{formatarMoeda(venda.valorRecebido)}</span>
                  </div>
                  <div className="sale-totals-row">
                    <span>Troco:</span>
                    <span>{formatarMoeda(venda.troco)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="sale-grand-total-box">
              <span className="sale-grand-total-label">Total da Venda</span>
              <span className={`sale-grand-total-num ${isCancelada ? 'cancelled-strike' : ''}`}>
                {formatarMoeda(venda.total)}
              </span>
            </div>
          </div>

          {/* Fluxo de Confirmação de Cancelamento */}
          {confirmandoCancelamento && !isCancelada && (
            <div className="cancel-confirmation-box">
              <div className="cancel-confirmation-header">
                <AlertTriangle size={22} color="#DC2626" />
                <div>
                  <h4>Confirmar Cancelamento da Venda</h4>
                  <p className="cancel-confirmation-highlight">
                    Essa ação irá cancelar a venda e devolver os produtos ao estoque.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Motivo do cancelamento (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Desistência do cliente, produto incorreto, etc."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="search-input"
                  style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setConfirmandoCancelamento(false)}
                  disabled={processando}
                  className="btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarCancelamento}
                  disabled={processando}
                  className="btn-danger"
                  style={{ padding: '8px 18px', fontWeight: 800 }}
                >
                  <Trash2 size={16} />
                  <span>{processando ? 'Cancelando...' : 'Sim, Cancelar Venda'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {!isCancelada && !confirmandoCancelamento && (
              <button
                type="button"
                onClick={() => setConfirmandoCancelamento(true)}
                className="btn-cancel-sale-trigger"
                title="Cancelar esta venda e estornar produtos"
              >
                <Trash2 size={16} />
                <span>Cancelar Venda</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '10px 24px', fontWeight: 700 }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
