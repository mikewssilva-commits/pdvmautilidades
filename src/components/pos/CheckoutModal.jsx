import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  CreditCard, 
  QrCode, 
  ReceiptText, 
  X, 
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  User,
  Calculator
} from 'lucide-react';
import { formatarMoeda, arredondarMoeda } from '../../utils/formatters';

export default function CheckoutModal({ 
  total, 
  desconto, 
  clientes = [], 
  onConfirmar, 
  onClose 
}) {
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [valorRecebido, setValorRecebido] = useState(total.toFixed(2));
  const [clienteId, setClienteId] = useState('');
  const [erro, setErro] = useState('');

  const numRecebido = arredondarMoeda(parseFloat(valorRecebido) || 0);
  const troco = Math.max(0, arredondarMoeda(numRecebido - total));

  const clienteAtual = clientes.find((c) => c.id === Number(clienteId));
  const saldoDevedorAtual = clienteAtual?.saldoDevedor || 0;
  const limiteCreditoTotal = clienteAtual?.limiteCredito || 0;
  const creditoDisponivel = Math.max(0, arredondarMoeda(limiteCreditoTotal - saldoDevedorAtual));
  const totalAposCompra = arredondarMoeda(saldoDevedorAtual + total);
  const excedeLimite = clienteAtual && totalAposCompra > limiteCreditoTotal;

  // Tecla de atalho Enter para confirmar e ESC para fechar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSelecionarAtalhoValor = (adicional) => {
    if (adicional === 'exato') {
      setValorRecebido(total.toFixed(2));
    } else {
      const atual = parseFloat(valorRecebido) || 0;
      setValorRecebido(arredondarMoeda(atual + adicional).toFixed(2));
    }
  };

  const handleFinalizar = (e) => {
    e.preventDefault();
    setErro('');

    if (formaPagamento === 'Dinheiro') {
      if (numRecebido < total) {
        setErro(`Valor recebido (${formatarMoeda(numRecebido)}) é menor que o total (${formatarMoeda(total)}).`);
        return;
      }
    }

    if (formaPagamento === 'Fiado / Crediário') {
      if (!clienteId) {
        setErro('Por favor, selecione o cliente para vincular a venda fiada.');
        return;
      }
      if (excedeLimite) {
        const confirmarExcesso = window.confirm(
          `Atenção: Esta compra (${formatarMoeda(total)}) somada ao saldo devedor atual (${formatarMoeda(saldoDevedorAtual)}) totaliza ${formatarMoeda(totalAposCompra)}, excedendo o limite de ${formatarMoeda(limiteCreditoTotal)}.\n\nDeseja autorizar a venda mesmo assim?`
        );
        if (!confirmarExcesso) {
          return;
        }
      }
    }

    onConfirmar({
      formaPagamento,
      valorRecebido: formaPagamento === 'Dinheiro' ? numRecebido : total,
      troco: formaPagamento === 'Dinheiro' ? troco : 0,
      clienteId: clienteId ? Number(clienteId) : null,
      clienteNome: clienteAtual ? clienteAtual.nome : null
    });
  };

  const formas = [
    { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote, color: '#16A34A' },
    { id: 'Cartão de Débito', label: 'Cartão Débito', icon: CreditCard, color: '#2563EB' },
    { id: 'Cartão de Crédito', label: 'Cartão Crédito', icon: CreditCard, color: '#9333EA' },
    { id: 'Pix', label: 'Pix Instantâneo', icon: QrCode, color: '#0D9488' },
    { id: 'Fiado / Crediário', label: 'Fiado / Crediário', icon: ReceiptText, color: '#DC2626' }
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <Calculator size={20} color="#EAB308" />
            Finalização da Venda
          </h3>
          <button onClick={onClose} className="btn-close-modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleFinalizar}>
          <div className="modal-body">
            {/* Resumo Rápido de Valores */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: 8, marginBottom: 18, border: '1px solid #E2E8F0' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Total a Pagar:</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 900, color: '#DC2626' }}>
                  {formatarMoeda(total)}
                </div>
              </div>
              {desconto > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Desconto Aplicado:</span>
                  <div style={{ fontWeight: 700, color: '#16A34A' }}>- {formatarMoeda(desconto)}</div>
                </div>
              )}
            </div>

            {/* Formas de Pagamento */}
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 8 }}>
              SELECIONE A FORMA DE PAGAMENTO:
            </label>
            <div className="payment-methods-grid">
              {formas.map((f) => {
                const Icon = f.icon;
                const isSelected = formaPagamento === f.id;
                return (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => {
                      setFormaPagamento(f.id);
                      setErro('');
                    }}
                    className={`payment-method-card ${isSelected ? 'active' : ''}`}
                  >
                    <Icon size={24} color={isSelected ? '#DC2626' : f.color} />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Painel Específico: Dinheiro (Calculadora de Troco) */}
            {formaPagamento === 'Dinheiro' && (
              <div className="change-calculator-box">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                      Valor Entregue pelo Cliente (R$):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      autoFocus
                      className="form-control"
                      style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}
                      value={valorRecebido}
                      onChange={(e) => setValorRecebido(e.target.value)}
                    />
                  </div>
                </div>

                {/* Atalhos de Cédulas */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', width: '100%' }}>Atalhos de cédulas:</span>
                  <button type="button" onClick={() => handleSelecionarAtalhoValor('exato')} className="btn-qty-step" style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem', borderRadius: 4, background: '#E2E8F0' }}>
                    Exato ({formatarMoeda(total)})
                  </button>
                  {[10, 20, 50, 100, 200].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => handleSelecionarAtalhoValor(val)}
                      className="btn-qty-step"
                      style={{ width: 'auto', padding: '4px 10px', fontSize: '0.8rem', borderRadius: 4, background: '#E2E8F0' }}
                    >
                      +{val}
                    </button>
                  ))}
                </div>

                {/* Troco */}
                <div className="change-display-row">
                  <span>TROCO A DEVOLVER:</span>
                  <span className="change-display-amount">
                    {formatarMoeda(troco)}
                  </span>
                </div>
              </div>
            )}

            {/* Painel Específico: Pix */}
            {formaPagamento === 'Pix' && (
              <div style={{ background: '#F0FDFA', border: '1px solid #CCFBF1', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <QrCode size={90} color="#0F766E" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 800, color: '#0F766E', fontSize: '0.95rem' }}>
                  QR Code Pix Dinâmico Gerado
                </div>
                <div style={{ fontSize: '0.8rem', color: '#115E59', marginTop: 4 }}>
                  Chave Pix (CNPJ): 12.345.678/0001-90 - MA Utilidades
                </div>
                <div style={{ marginTop: 8, background: '#FFFFFF', padding: '6px 10px', borderRadius: 4, fontSize: '0.75rem', fontFamily: 'var(--font-mono)', border: '1px dashed #0D9488', color: '#0F766E' }}>
                  00020126580014br.gov.bcb.pix013612345678000190520400005303986540{total.toFixed(2)}
                </div>
              </div>
            )}

            {/* Painel Específico: Fiado / Crediário */}
            {formaPagamento === 'Fiado / Crediário' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#991B1B', fontWeight: 800, marginBottom: 10 }}>
                  <User size={18} />
                  <span>Vincular Venda ao Cadastro do Cliente</span>
                </div>

                <div className="form-group">
                  <label htmlFor="select-cliente">Selecione o Cliente Cadastrado:</label>
                  <select
                    id="select-cliente"
                    className="form-control"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                  >
                    <option value="">-- Escolha um cliente --</option>
                    {clientes.map((cli) => (
                      <option key={cli.id} value={cli.id}>
                        {cli.nome} ({cli.cpf || cli.telefone}) - Limite: {formatarMoeda(cli.limiteCredito || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                {clienteAtual && (
                  <div style={{ marginTop: 10, padding: 12, background: '#FFFFFF', borderRadius: 8, fontSize: '0.85rem', border: excedeLimite ? '1px solid #FCA5A5' : '1px solid #E2E8F0' }}>
                    <div><strong>Cliente:</strong> {clienteAtual.nome}</div>
                    <div><strong>Telefone:</strong> {clienteAtual.telefone || '-'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8, paddingTop: 6, borderTop: '1px dashed #E2E8F0' }}>
                      <div><span style={{ color: '#64748B' }}>Limite Total:</span> <strong>{formatarMoeda(limiteCreditoTotal)}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Débito Atual:</span> <strong style={{ color: saldoDevedorAtual > 0 ? '#DC2626' : '#16A34A' }}>{formatarMoeda(saldoDevedorAtual)}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Disponível p/ Compra:</span> <strong style={{ color: creditoDisponivel < total ? '#DC2626' : '#16A34A' }}>{formatarMoeda(creditoDisponivel)}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Saldo após Venda:</span> <strong style={{ color: excedeLimite ? '#DC2626' : '#0F172A' }}>{formatarMoeda(totalAposCompra)}</strong></div>
                    </div>
                    {excedeLimite && (
                      <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEF2F2', borderRadius: 6, color: '#B91C1C', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={15} />
                        <span>Atenção: Esta compra excede o limite em {formatarMoeda(totalAposCompra - limiteCreditoTotal)}!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mensagem de Erro de Validação */}
            {erro && (
              <div style={{ marginTop: 14, padding: 10, background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 6, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                <AlertCircle size={18} />
                <span>{erro}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-clear-cart" style={{ borderColor: '#CBD5E1', color: '#475569' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-checkout-primary" style={{ width: 'auto', padding: '12px 24px' }}>
              <CheckCircle2 size={18} />
              CONFIRMAR VENDA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
