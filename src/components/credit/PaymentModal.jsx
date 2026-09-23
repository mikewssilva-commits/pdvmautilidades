import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatarMoeda, arredondarMoeda } from '../../utils/formatters';

export default function PaymentModal({ fiado, onConfirmarPagamento, onClose }) {
  const [valorPago, setValorPago] = useState(fiado?.saldoDevedor ? Number(fiado.saldoDevedor).toFixed(2) : '0.00');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [observacao, setObservacao] = useState('Pagamento de conta fiado');
  const [erro, setErro] = useState('');

  if (!fiado) return null;

  const numPago = arredondarMoeda(parseFloat(valorPago) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');

    if (numPago <= 0) {
      setErro('Informe um valor de pagamento maior que zero.');
      return;
    }

    if (numPago > arredondarMoeda(fiado.saldoDevedor) + 0.001) {
      setErro(`O valor pago não pode ser maior que o saldo devedor (${formatarMoeda(fiado.saldoDevedor)}).`);
      return;
    }

    onConfirmarPagamento({
      fiadoId: fiado.id,
      clienteId: fiado.clienteId,
      clienteNome: fiado.clienteNome,
      valorPago: numPago,
      formaPagamento,
      observacao
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-sm">
        <div className="modal-header">
          <h3>
            <DollarSign size={20} color="#16A34A" />
            Receber Pagamento do Fiado
          </h3>
          <button onClick={onClose} className="btn-close-modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Resumo da Dívida */}
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: '0.8rem', color: '#991B1B' }}>Cliente Devedor:</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#7F1D1D' }}>{fiado.clienteNome}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, borderTop: '1px dashed #FCA5A5', paddingTop: 6 }}>
                <span style={{ fontSize: '0.8rem', color: '#991B1B' }}>Saldo Devedor Atual:</span>
                <span style={{ fontWeight: 900, color: '#DC2626', fontFamily: 'var(--font-mono)' }}>
                  {formatarMoeda(fiado.saldoDevedor)}
                </span>
              </div>
            </div>

            {erro && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, marginBottom: 14, fontSize: '0.85rem' }}>
                {erro}
              </div>
            )}

            {/* Valor a Pagar */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Valor a Abater / Quitar (R$):</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={fiado.saldoDevedor}
                  required
                  className="form-control"
                  style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                  value={valorPago}
                  onChange={(e) => setValorPago(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setValorPago(fiado.saldoDevedor.toFixed(2))}
                  className="btn-accent-action"
                  style={{ whiteSpace: 'nowrap', padding: '6px 10px', fontSize: '0.78rem' }}
                >
                  Quitar Tudo
                </button>
              </div>
            </div>

            {/* Forma de Recebimento */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Forma de Recebimento:</label>
              <select
                className="form-control"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
              >
                <option value="Dinheiro">Dinheiro</option>
                <option value="Pix">Pix Instantâneo</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
              </select>
            </div>

            {/* Observação */}
            <div className="form-group">
              <label>Observação / Recibo:</label>
              <input
                type="text"
                className="form-control"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-clear-cart" style={{ borderColor: '#CBD5E1', color: '#475569' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-accent-action">
              <CheckCircle2 size={16} />
              Confirmar Recebimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
