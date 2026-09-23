import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Sliders, CheckCircle2 } from 'lucide-react';

export default function StockMovementModal({ produto, produtos = [], onSalvar, onClose }) {
  const [produtoId, setProdutoId] = useState(produto?.id || (produtos[0]?.id || ''));
  const [tipo, setTipo] = useState('Entrada'); // Entrada, Saída, Ajuste
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('Entrada de mercadoria / Nota fiscal');
  const [erro, setErro] = useState('');

  const produtoSelecionado = produtos.find((p) => p.id === Number(produtoId)) || produto;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');

    if (!produtoSelecionado) {
      setErro('Por favor, selecione um produto válido.');
      return;
    }

    if (quantidade === '' || quantidade === undefined || quantidade === null) {
      setErro('Informe uma quantidade válida.');
      return;
    }

    const qtdNum = parseInt(quantidade, 10);
    if (isNaN(qtdNum)) {
      setErro('A quantidade informada é inválida.');
      return;
    }

    if (tipo === 'Ajuste') {
      if (qtdNum < 0) {
        setErro('No ajuste de inventário, o estoque não pode ser negativo.');
        return;
      }
    } else {
      if (qtdNum <= 0) {
        setErro('Para entrada ou saída, informe uma quantidade maior que zero.');
        return;
      }
    }

    if (tipo === 'Saída' && qtdNum > produtoSelecionado.estoqueAtual) {
      setErro(`A quantidade de saída (${qtdNum}) não pode ser maior que o estoque atual (${produtoSelecionado.estoqueAtual} un).`);
      return;
    }

    onSalvar({
      produto: produtoSelecionado,
      tipo,
      quantidade: qtdNum,
      motivo: motivo.trim() || 'Movimentação manual'
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-sm">
        <div className="modal-header">
          <h3>Movimentação Manual de Estoque</h3>
          <button onClick={onClose} className="btn-close-modal">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {erro && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, marginBottom: 14, fontSize: '0.85rem' }}>
                {erro}
              </div>
            )}
            {/* Seleção do Produto */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Produto:</label>
              {produto ? (
                <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 6, fontWeight: 700, border: '1px solid #CBD5E1' }}>
                  {produto.nome}
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                    Estoque Atual: {produto.estoqueAtual} {produto.unidade || 'UN'}
                  </div>
                </div>
              ) : (
                <select
                  className="form-control"
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Atual: {p.estoqueAtual})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tipo de Movimento */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Tipo de Operação:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setTipo('Entrada');
                    setMotivo('Entrada de mercadoria / Nota fiscal');
                  }}
                  className={`payment-method-card ${tipo === 'Entrada' ? 'active' : ''}`}
                  style={{ padding: '10px 6px', fontSize: '0.8rem' }}
                >
                  <ArrowUpRight size={18} color="#16A34A" />
                  <span>Entrada (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipo('Saída');
                    setMotivo('Avaria / Perda / Uso Interno');
                  }}
                  className={`payment-method-card ${tipo === 'Saída' ? 'active' : ''}`}
                  style={{ padding: '10px 6px', fontSize: '0.8rem' }}
                >
                  <ArrowDownRight size={18} color="#DC2626" />
                  <span>Saída (-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipo('Ajuste');
                    setMotivo('Contagem física de inventário');
                  }}
                  className={`payment-method-card ${tipo === 'Ajuste' ? 'active' : ''}`}
                  style={{ padding: '10px 6px', fontSize: '0.8rem' }}
                >
                  <Sliders size={18} color="#2563EB" />
                  <span>Ajuste Total</span>
                </button>
              </div>
            </div>

            {/* Quantidade */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>
                {tipo === 'Ajuste' ? 'Nova Quantidade Real (Inventário):' : 'Quantidade a Movimentar:'}
              </label>
              <input
                type="number"
                min={tipo === 'Ajuste' ? "0" : "1"}
                required
                className="form-control"
                placeholder={tipo === 'Ajuste' ? "Ex: 0 ou nova quantidade" : "Ex: 10"}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>

            {/* Motivo */}
            <div className="form-group">
              <label>Motivo da Movimentação:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Compra de reposição, avaria, inventário..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-clear-cart" style={{ borderColor: '#CBD5E1', color: '#475569' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-accent-action">
              <CheckCircle2 size={16} />
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
