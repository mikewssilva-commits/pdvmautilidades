import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Barcode,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { db, CATEGORIAS_PADRAO } from '../../db/db';
import { formatarMoeda } from '../../utils/formatters';
import ProductModal from './ProductModal';

export default function ProductsView({ onAtualizacao }) {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const carregarProdutos = async () => {
    const lista = await db.produtos.toArray();
    setProdutos(lista);
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const handleSalvarProduto = async (dadosProduto) => {
    if (produtoEmEdicao) {
      await db.produtos.update(produtoEmEdicao.id, dadosProduto);
      setFeedbackMsg(`Produto "${dadosProduto.nome}" atualizado com sucesso!`);
    } else {
      const idNovo = await db.produtos.add({
        ...dadosProduto,
        createdAt: new Date().toISOString()
      });
      // Registrar movimentação inicial de estoque
      await db.movimentacoesEstoque.add({
        produtoId: idNovo,
        nomeProduto: dadosProduto.nome,
        tipo: 'Entrada Inicial',
        quantidade: dadosProduto.estoqueAtual,
        estoqueAnterior: 0,
        estoqueNovo: dadosProduto.estoqueAtual,
        motivo: 'Cadastro de novo produto',
        dataHora: new Date().toISOString(),
        vendaId: null
      });
      setFeedbackMsg(`Produto "${dadosProduto.nome}" cadastrado com sucesso!`);
    }

    setMostrarModal(false);
    setProdutoEmEdicao(null);
    await carregarProdutos();
    if (onAtualizacao) onAtualizacao();
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleExcluirProduto = async (produto) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"? Esta ação não pode ser desfeita.`)) {
      await db.produtos.delete(produto.id);
      setFeedbackMsg(`Produto "${produto.nome}" excluído.`);
      await carregarProdutos();
      if (onAtualizacao) onAtualizacao();
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  // Filtragem dos produtos
  const produtosFiltrados = produtos.filter((p) => {
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigoBarras.includes(busca) ||
      (p.codigoInterno && p.codigoInterno.toLowerCase().includes(busca.toLowerCase())) ||
      (p.marca && p.marca.toLowerCase().includes(busca.toLowerCase()));

    const matchCategoria =
      categoriaFiltro === 'todas' || p.categoria.toLowerCase() === categoriaFiltro.toLowerCase();

    const matchEstoqueBaixo =
      !apenasEstoqueBaixo || p.estoqueAtual <= p.estoqueMinimo;

    return matchBusca && matchCategoria && matchEstoqueBaixo;
  });

  return (
    <div className="module-page-container">
      {/* Cabeçalho da Página */}
      <div className="page-action-header">
        <div className="page-title-box">
          <h1>
            <Package size={26} color="#EAB308" />
            Catálogo de Produtos
          </h1>
          <p>
            Gerenciamento completo de materiais de construção, bebidas, alimentos e utilidades
          </p>
        </div>

        <button
          onClick={() => {
            setProdutoEmEdicao(null);
            setMostrarModal(true);
          }}
          className="btn-accent-action"
        >
          <Plus size={18} />
          Cadastrar Novo Produto
        </button>
      </div>

      {feedbackMsg && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 18px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #BBF7D0' }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tabela de Produtos com Toolbar de Filtros */}
      <div className="data-table-card">
        <div className="data-table-toolbar">
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 260 }}>
            <Search className="search-input-icon" size={18} />
            <input
              type="text"
              className="search-input"
              style={{ padding: '8px 12px 8px 36px', fontSize: '0.9rem' }}
              placeholder="Buscar por nome, código de barras ou interno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: 180, padding: '8px 12px' }}
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="todas">Todas as Categorias</option>
            {CATEGORIAS_PADRAO.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', background: apenasEstoqueBaixo ? '#FEF2F2' : '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1' }}>
            <input
              type="checkbox"
              checked={apenasEstoqueBaixo}
              onChange={(e) => setApenasEstoqueBaixo(e.target.checked)}
            />
            <AlertTriangle size={16} color={apenasEstoqueBaixo ? '#DC2626' : '#64748B'} />
            <span>Apenas Estoque Baixo</span>
          </label>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="standard-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Foto</th>
                <th>Nome / Cód. Barras</th>
                <th>Código Interno</th>
                <th>Categoria</th>
                <th>Marca</th>
                <th style={{ textAlign: 'right' }}>Preço Venda</th>
                <th style={{ textAlign: 'center' }}>Estoque Atual</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ width: 100, textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    <Layers size={36} style={{ margin: '0 auto 8px', display: 'block' }} />
                    Nenhum produto atende aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((prod) => {
                  const isEsgotado = prod.estoqueAtual <= 0;
                  const isBaixo = prod.estoqueAtual <= prod.estoqueMinimo;

                  return (
                    <tr key={prod.id}>
                      <td>
                        <img
                          src={prod.foto || 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=100&auto=format&fit=crop&q=60'}
                          alt={prod.nome}
                          style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #E2E8F0' }}
                          loading="lazy"
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>{prod.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Barcode size={12} />
                          <span>{prod.codigoBarras}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#475569' }}>
                          {prod.codigoInterno || '-'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prod.categoria}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{prod.subcategoria}</div>
                      </td>
                      <td>{prod.marca || '-'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem' }}>
                        {formatarMoeda(prod.precoVenda)}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {prod.estoqueAtual} {prod.unidade || 'UN'}
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Mín: {prod.estoqueMinimo}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge-stock ${isEsgotado ? 'out' : isBaixo ? 'low' : 'ok'}`}>
                          {isEsgotado ? 'Esgotado' : isBaixo ? 'Estoque Baixo' : 'Disponível'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setProdutoEmEdicao(prod);
                              setMostrarModal(true);
                            }}
                            className="btn-qty-step"
                            title="Editar Produto"
                          >
                            <Edit size={15} color="#2563EB" />
                          </button>
                          <button
                            onClick={() => handleExcluirProduto(prod)}
                            className="btn-qty-step"
                            title="Excluir Produto"
                          >
                            <Trash2 size={15} color="#DC2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModal && (
        <ProductModal
          produto={produtoEmEdicao}
          totalProdutos={produtos.length}
          produtos={produtos}
          onSalvar={handleSalvarProduto}
          onClose={() => {
            setMostrarModal(false);
            setProdutoEmEdicao(null);
          }}
        />
      )}
    </div>
  );
}
