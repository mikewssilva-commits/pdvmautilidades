import React, { useState } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { CATEGORIAS_PADRAO } from '../../db/db';
import { gerarCodigoBarrasEAN, gerarCodigoInterno, arredondarMoeda } from '../../utils/formatters';

export default function ProductModal({ produto, totalProdutos = 0, produtos = [], onSalvar, onClose }) {
  const [formData, setFormData] = useState({
    nome: produto?.nome || '',
    codigoBarras: produto?.codigoBarras || '',
    codigoInterno: produto?.codigoInterno || gerarCodigoInterno(totalProdutos),
    categoria: produto?.categoria || 'Material de Construção',
    subcategoria: produto?.subcategoria || 'Cimento',
    marca: produto?.marca || '',
    unidade: produto?.unidade || 'UN',
    precoCusto: produto?.precoCusto !== undefined ? produto.precoCusto : '',
    precoVenda: produto?.precoVenda !== undefined ? produto.precoVenda : '',
    estoqueAtual: produto?.estoqueAtual !== undefined ? produto.estoqueAtual : '',
    estoqueMinimo: produto?.estoqueMinimo !== undefined ? produto.estoqueMinimo : 5,
    fornecedor: produto?.fornecedor || '',
    foto: produto?.foto || ''
  });

  const [erro, setErro] = useState('');

  // Ao mudar de categoria principal, atualizar subcategoria default
  const handleCategoriaChange = (e) => {
    const novaCat = e.target.value;
    const catEncontrada = CATEGORIAS_PADRAO.find((c) => c.nome === novaCat);
    setFormData((prev) => ({
      ...prev,
      categoria: novaCat,
      subcategoria: catEncontrada?.subcategorias[0] || ''
    }));
  };

  const handleGerarCodigoBarras = () => {
    const novoEan = gerarCodigoBarrasEAN();
    setFormData((prev) => ({ ...prev, codigoBarras: novoEan }));
  };

  const categoriaAtualObj = CATEGORIAS_PADRAO.find((c) => c.nome === formData.categoria);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');

    if (!formData.nome.trim()) {
      setErro('O nome do produto é obrigatório.');
      return;
    }
    const codBarras = formData.codigoBarras.trim();
    if (!codBarras) {
      setErro('O código de barras é obrigatório. Clique em "Gerar" para criar um automaticamente.');
      return;
    }
    // Verificar duplicidade de código de barras
    const duplicado = produtos.find(
      (p) => p.codigoBarras === codBarras && p.id !== produto?.id
    );
    if (duplicado) {
      setErro(`Já existe outro produto cadastrado com este código de barras: "${duplicado.nome}".`);
      return;
    }
    const precoVendaNum = parseFloat(formData.precoVenda);
    if (isNaN(precoVendaNum) || precoVendaNum <= 0) {
      setErro('O preço de venda é obrigatório e deve ser maior que zero (R$ 0,00).');
      return;
    }
    const precoCustoNum = parseFloat(formData.precoCusto) || 0;
    if (precoCustoNum < 0) {
      setErro('O preço de custo não pode ser negativo.');
      return;
    }
    if (formData.estoqueAtual === '' || formData.estoqueAtual === undefined || formData.estoqueAtual === null) {
      setErro('O estoque atual é obrigatório (informe 0 ou mais).');
      return;
    }
    const estoqueAtualNum = parseInt(formData.estoqueAtual, 10);
    if (isNaN(estoqueAtualNum) || estoqueAtualNum < 0) {
      setErro('O estoque atual deve ser um número inteiro igual ou maior que zero.');
      return;
    }
    const estoqueMinimoNum = parseInt(formData.estoqueMinimo, 10);
    if (isNaN(estoqueMinimoNum) || estoqueMinimoNum < 0) {
      setErro('O estoque mínimo não pode ser negativo.');
      return;
    }

    onSalvar({
      ...formData,
      nome: formData.nome.trim(),
      codigoBarras: codBarras,
      precoCusto: arredondarMoeda(precoCustoNum),
      precoVenda: arredondarMoeda(precoVendaNum),
      estoqueAtual: estoqueAtualNum,
      estoqueMinimo: estoqueMinimoNum,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h3>{produto ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>
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

            <div className="form-grid">
              {/* Nome */}
              <div className="form-group col-span-2">
                <label>Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cimento CP II 50kg, Refrigerante Coca-Cola 2L..."
                  className="form-control"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              {/* Código de Barras com botão de gerar EAN */}
              <div className="form-group">
                <label>Código de Barras (EAN) *</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 7891234567890"
                    className="form-control"
                    value={formData.codigoBarras}
                    onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleGerarCodigoBarras}
                    className="btn-accent-action"
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                    title="Gerar código EAN-13 aleatório válido"
                  >
                    <RefreshCw size={14} />
                    Gerar
                  </button>
                </div>
              </div>

              {/* Código Interno */}
              <div className="form-group">
                <label>Código Interno</label>
                <input
                  type="text"
                  placeholder="Ex: MA-0042"
                  className="form-control"
                  value={formData.codigoInterno}
                  onChange={(e) => setFormData({ ...formData, codigoInterno: e.target.value })}
                />
              </div>

              {/* Categoria */}
              <div className="form-group">
                <label>Categoria Principal *</label>
                <select
                  className="form-control"
                  value={formData.categoria}
                  onChange={handleCategoriaChange}
                >
                  {CATEGORIAS_PADRAO.map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategoria */}
              <div className="form-group">
                <label>Subcategoria</label>
                <select
                  className="form-control"
                  value={formData.subcategoria}
                  onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                >
                  {categoriaAtualObj?.subcategorias.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div className="form-group">
                <label>Marca / Fabricante</label>
                <input
                  type="text"
                  placeholder="Ex: Coral, Ambev, Tigre, Ypê..."
                  className="form-control"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                />
              </div>

              {/* Unidade */}
              <div className="form-group">
                <label>Unidade de Medida</label>
                <select
                  className="form-control"
                  value={formData.unidade}
                  onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                >
                  <option value="UN">Unidade (UN)</option>
                  <option value="KG">Quilograma (KG)</option>
                  <option value="LT">Litro (LT)</option>
                  <option value="MT">Metro (MT)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="PC">Peça (PC)</option>
                  <option value="SC">Saco (SC)</option>
                  <option value="RL">Rolo (RL)</option>
                </select>
              </div>

              {/* Preço de Custo */}
              <div className="form-group">
                <label>Preço de Custo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className="form-control"
                  value={formData.precoCusto}
                  onChange={(e) => setFormData({ ...formData, precoCusto: e.target.value })}
                />
              </div>

              {/* Preço de Venda */}
              <div className="form-group">
                <label>Preço de Venda (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  className="form-control"
                  style={{ fontWeight: 800, color: '#0F172A' }}
                  value={formData.precoVenda}
                  onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
                />
              </div>

              {/* Estoque Atual */}
              <div className="form-group">
                <label>Estoque Atual *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="form-control"
                  value={formData.estoqueAtual}
                  onChange={(e) => setFormData({ ...formData, estoqueAtual: e.target.value })}
                />
              </div>

              {/* Estoque Mínimo */}
              <div className="form-group">
                <label>Estoque Mínimo (Alerta)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={formData.estoqueMinimo}
                  onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                />
              </div>

              {/* Fornecedor */}
              <div className="form-group col-span-2">
                <label>Fornecedor</label>
                <input
                  type="text"
                  placeholder="Ex: Distribuidora Central, Votorantim, etc."
                  className="form-control"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                />
              </div>

              {/* URL da Foto */}
              <div className="form-group col-span-2">
                <label>URL da Foto do Produto</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    className="form-control"
                    value={formData.foto}
                    onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                  />
                  {formData.foto && (
                    <img
                      src={formData.foto}
                      alt="Preview"
                      style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #CBD5E1' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-clear-cart" style={{ borderColor: '#CBD5E1', color: '#475569' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-accent-action">
              <Save size={16} />
              {produto ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
