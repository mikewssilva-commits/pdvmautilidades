import React from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';
import { formatarMoeda, formatarDataHora } from '../../utils/formatters';

export default function ReceiptModal({ venda, itens, config, onClose }) {
  if (!venda) return null;

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-sm">
        <div className="modal-header">
          <h3>
            <CheckCircle size={20} color="#22C55E" />
            Comprovante da Venda
          </h3>
          <button onClick={onClose} className="btn-close-modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#F8FAFC' }}>
          <div className="receipt-paper">
            <div className="receipt-header-center">
              <div className="receipt-brand-title">
                <span style={{ color: '#CA8A04' }}>MA </span>
                <span style={{ color: '#DC2626' }}>UTILIDADES</span>
              </div>
              <div>{config?.slogan || 'Construção, Bebidas, Alimentos e Utilidades'}</div>
              <div>CNPJ: {config?.cnpj || '12.345.678/0001-90'}</div>
              <div>{config?.endereco || 'Av. Comercial, 1000 - Centro'}</div>
              <div>Tel: {config?.telefone || '(11) 3456-7890'}</div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>
                *** CUPOM NÃO FISCAL ***
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                Venda Nº {venda.numeroVenda?.toString().padStart(6, '0')} | {formatarDataHora(venda.dataHora)}
              </div>
              <div style={{ fontSize: '0.75rem' }}>
                Caixa: {config?.numeroCaixa || '01'} | Operador: {venda.operador || 'Operador'}
              </div>
              {venda.clienteNome && (
                <div style={{ fontSize: '0.78rem', marginTop: 4, fontWeight: 700 }}>
                  Cliente: {venda.clienteNome}
                </div>
              )}
            </div>

            <div className="receipt-items-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: 4, borderBottom: '1px solid #E2E8F0', paddingBottom: 2 }}>
                <span>ITEM DESCRIÇÃO</span>
                <span>TOTAL</span>
              </div>
              {itens?.map((it, idx) => (
                <div key={idx} style={{ marginBottom: 4 }}>
                  <div style={{ fontWeight: 600 }}>
                    {idx + 1}. {it.nomeProduto}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.78rem' }}>
                    <span>{it.quantidade} UN x {formatarMoeda(it.precoUnitario)}</span>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatarMoeda(it.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="receipt-totals-section">
              <div className="receipt-item-row">
                <span>Subtotal:</span>
                <span>{formatarMoeda(venda.subtotal)}</span>
              </div>
              {venda.desconto > 0 && (
                <div className="receipt-item-row" style={{ color: '#DC2626' }}>
                  <span>Desconto:</span>
                  <span>- {formatarMoeda(venda.desconto)}</span>
                </div>
              )}
              <div className="receipt-item-row" style={{ fontWeight: 900, fontSize: '1.05rem', marginTop: 4 }}>
                <span>TOTAL A PAGAR:</span>
                <span>{formatarMoeda(venda.total)}</span>
              </div>
              <div className="receipt-item-row" style={{ marginTop: 4 }}>
                <span>Forma de Pagto:</span>
                <span style={{ fontWeight: 700 }}>{venda.formaPagamento}</span>
              </div>
              {venda.formaPagamento === 'Dinheiro' && (
                <>
                  <div className="receipt-item-row">
                    <span>Valor Recebido:</span>
                    <span>{formatarMoeda(venda.valorRecebido)}</span>
                  </div>
                  <div className="receipt-item-row" style={{ fontWeight: 700 }}>
                    <span>Troco:</span>
                    <span>{formatarMoeda(venda.troco)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="receipt-barcode-visual">
              ||| | | |||| | ||| || ||| | ||
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748B', marginTop: 8 }}>
              {config?.mensagemRodape || 'Obrigado pela preferência! Volte sempre.'}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button onClick={handleImprimir} className="btn-clear-cart" style={{ borderColor: '#CBD5E1', color: '#1E293B', fontWeight: 700 }}>
            <Printer size={16} />
            Imprimir Cupom
          </button>
          <button 
            onClick={onClose} 
            className="btn-accent-action"
            style={{ background: '#16A34A', padding: '10px 20px', fontWeight: 800, fontSize: '0.95rem' }}
            title="Concluir e preparar caixa para o próximo cliente"
          >
            ✓ Concluir e Nova Venda
          </button>
        </div>
      </div>
    </div>
  );
}
