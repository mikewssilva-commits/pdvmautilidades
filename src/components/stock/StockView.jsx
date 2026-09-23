import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  History, 
  Search, 
  Plus, 
  CheckCircle2,
  TrendingDown,
  Layers
} from 'lucide-react';
import { db } from '../../db/db';
import { formatarMoeda, formatarDataHora } from '../../utils/formatters';
import StockMovementModal from './StockMovementModal';

export default function StockView({ onAtualizacao }) {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('posicao'); // 'posicao' | 'historico'
  const [busca, setBusca] = useState('');
  const [mostrarModalMovimento, setMostrarModalMovimento] = useState(false);
  const [produtoSelecionadoParaMovimento, setProdutoSelecionadoParaMovimento] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const carregarDados = React.useCallback(async () => {
    const todosProds = await db.produtos.toArray();
    const todasMovs = await db.movimentacoesEstoque.reverse().sortBy('dataHora');
    setProdutos(todosProds);
    setMovimentacoes(todasMovs);
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSalvarMovimento = async ({ produto, tipo, quantidade, motivo }) => {
    const dataHora = new Date().toISOString();
    let novoEstoque = produto.estoqueAtual;

    if (tipo === 'Entrada') {
      novoEstoque = produto.estoqueAtual + quantidade;
    } else if (tipo === 'Saída') {
      if (quantidade > produto.estoqueAtual) {
        alert(`Erro: Quantidade de saída (${quantidade} un) não pode ser maior que o estoque atual disponível (${produto.estoqueAtual} un).`);
        return;
      }
      novoEstoque = Math.max(0, produto.estoqueAtual - quantidade);
    } else if (tipo === 'Ajuste') {
      novoEstoque = Math.max(0, quantidade);
    }

    await db.transaction('rw', [db.produtos, db.movimentacoesEstoque], async () => {
      await db.produtos.update(produto.id, {
        estoqueAtual: novoEstoque,
        updatedAt: dataHora
      });

      await db.movimentacoesEstoque.add({
        produtoId: produto.id,
        nomeProduto: produto.nome,
        tipo: `Manual (${tipo})`,
        quantidade: tipo === 'Ajuste' ? Math.abs(novoEstoque - produto.estoqueAtual) : quantidade,
        estoqueAnterior: produto.estoqueAtual,
        estoqueNovo: novoEstoque,
        motivo,
        dataHora,
        vendaId: null
      });
    });

    setMostrarModalMovimento(false);
    setProdutoSelecionadoParaMovimento(null);
    setFeedbackMsg(`Estoque de "${produto.nome}" atualizado para ${novoEstoque} unidades.`);
    await carregarDados();
    if (onAtualizacao) onAtualizacao();
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Itens com estoque baixo
  const produtosEstoqueBaixo = produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo);

  // Cálculos do Dashboard
  const totalUnidades = produtos.reduce((acc, p) => acc + p.estoqueAtual, 0);
  const valorEstoqueVenda = produtos.reduce((acc, p) => acc + (p.estoqueAtual * p.precoVenda), 0);

  // Filtragem da tabela de posição
  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigoBarras.includes(busca) ||
    p.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  // Filtragem da tabela de histórico
  const movimentacoesFiltradas = movimentacoes.filter((m) =>
    m.nomeProduto.toLowerCase().includes(busca.toLowerCase()) ||
    (m.motivo && m.motivo.toLowerCase().includes(busca.toLowerCase())) ||
    m.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="module-page-container">
      {/* Cabeçalho */}
      <div className="page-action-header">
        <div className="page-title-box">
          <h1>
            <Boxes size={26} color="#EAB308" />
            Controle de Estoque
          </h1>
          <p>
            Baixas automáticas na venda, movimentações manuais e auditoria de estoque
          </p>
        </div>

        <button
          onClick={() => {
            setProdutoSelecionadoParaMovimento(null);
            setMostrarModalMovimento(true);
          }}
          className="btn-accent-action"
        >
          <Plus size={18} />
          Nova Movimentação Manual
        </button>
      </div>

      {feedbackMsg && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 18px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #BBF7D0' }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Métricas do Estoque */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-info">
            <h4>Total de Produtos</h4>
            <div className="metric-val">{produtos.length}</div>
          </div>
          <div className="metric-icon-box" style={{ background: '#FEF3C7', color: '#CA8A04' }}>
            <Boxes size={26} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Unidades em Estoque</h4>
            <div className="metric-val">{totalUnidades} un</div>
          </div>
          <div className="metric-icon-box" style={{ background: '#E0E7FF', color: '#4338CA' }}>
            <Layers size={26} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: produtosEstoqueBaixo.length > 0 ? '4px solid #DC2626' : undefined }}>
          <div className="metric-info">
            <h4>Estoque Baixo</h4>
            <div className="metric-val" style={{ color: produtosEstoqueBaixo.length > 0 ? '#DC2626' : '#16A34A' }}>
              {produtosEstoqueBaixo.length} {produtosEstoqueBaixo.length === 1 ? 'item' : 'itens'}
            </div>
          </div>
          <div className="metric-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
            <AlertTriangle size={26} />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h4>Valor em Prateleira</h4>
            <div className="metric-val">{formatarMoeda(valorEstoqueVenda)}</div>
          </div>
          <div className="metric-icon-box" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <TrendingDown size={26} />
          </div>
        </div>
      </div>

      {/* Alerta de Estoque Baixo em Destaque */}
      {produtosEstoqueBaixo.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#991B1B', fontWeight: 800, marginBottom: 10 }}>
            <AlertTriangle size={20} color="#DC2626" />
            <span>ALERTA DE REPOSIÇÃO: {produtosEstoqueBaixo.length} produtos abaixo do estoque mínimo estipulado!</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {produtosEstoqueBaixo.map((p) => (
              <div key={p.id} style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{p.nome}</div>
                  <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>
                    Estoque Atual: {p.estoqueAtual} / Mínimo: {p.estoqueMinimo} {p.unidade}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setProdutoSelecionadoParaMovimento(p);
                    setMostrarModalMovimento(true);
                  }}
                  className="btn-accent-action"
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  Repor Estoque
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abas: Posição vs Histórico */}
      <div className="data-table-card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: '#F8FAFC', padding: '0 14px' }}>
          <button
            onClick={() => setAbaAtiva('posicao')}
            className={`nav-tab-btn ${abaAtiva === 'posicao' ? 'active' : ''}`}
            style={{ color: abaAtiva === 'posicao' ? '#0F172A' : '#64748B', borderBottomColor: abaAtiva === 'posicao' ? '#EAB308' : 'transparent' }}
          >
            <Boxes size={18} />
            <span>Posição Geral de Estoque ({produtos.length})</span>
          </button>
          <button
            onClick={() => setAbaAtiva('historico')}
            className={`nav-tab-btn ${abaAtiva === 'historico' ? 'active' : ''}`}
            style={{ color: abaAtiva === 'historico' ? '#0F172A' : '#64748B', borderBottomColor: abaAtiva === 'historico' ? '#EAB308' : 'transparent' }}
          >
            <History size={18} />
            <span>Histórico de Movimentações ({movimentacoes.length})</span>
          </button>
        </div>

        {/* Toolbar de Busca */}
        <div className="data-table-toolbar">
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 260 }}>
            <Search className="search-input-icon" size={18} />
            <input
              type="text"
              className="search-input"
              style={{ padding: '8px 12px 8px 36px', fontSize: '0.9rem' }}
              placeholder={abaAtiva === 'posicao' ? 'Filtrar produtos por nome ou categoria...' : 'Filtrar histórico por produto ou motivo...'}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Tabela de Posição */}
        {abaAtiva === 'posicao' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th style={{ textAlign: 'center' }}>Estoque Atual</th>
                  <th style={{ textAlign: 'center' }}>Estoque Mínimo</th>
                  <th style={{ textAlign: 'right' }}>Valor Custo</th>
                  <th style={{ textAlign: 'right' }}>Valor Venda</th>
                  <th style={{ textAlign: 'center' }}>Situação</th>
                  <th style={{ width: 140, textAlign: 'center' }}>Movimentar</th>
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map((prod) => {
                  const isEsgotado = prod.estoqueAtual <= 0;
                  const isBaixo = prod.estoqueAtual <= prod.estoqueMinimo;

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{prod.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Cód: {prod.codigoBarras} | {prod.marca}
                        </div>
                      </td>
                      <td>{prod.categoria}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem' }}>
                        {prod.estoqueAtual} {prod.unidade || 'UN'}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#64748B' }}>
                        {prod.estoqueMinimo} {prod.unidade || 'UN'}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {formatarMoeda(prod.precoCusto)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {formatarMoeda(prod.precoVenda)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge-stock ${isEsgotado ? 'out' : isBaixo ? 'low' : 'ok'}`}>
                          {isEsgotado ? 'Esgotado' : isBaixo ? 'Crítico / Baixo' : 'Normal'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setProdutoSelecionadoParaMovimento(prod);
                            setMostrarModalMovimento(true);
                          }}
                          className="btn-accent-action"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tabela de Histórico (Auditoria) */}
        {abaAtiva === 'historico' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="standard-table">
              <thead>
                <tr>
                  <th>Data / Hora</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'center' }}>Qtd Movimentada</th>
                  <th style={{ textAlign: 'center' }}>Saldo Anterior</th>
                  <th style={{ textAlign: 'center' }}>Novo Saldo</th>
                  <th>Motivo / Referência</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                ) : (
                  movimentacoesFiltradas.slice(0, 100).map((m) => {
                    const isSaida = m.tipo.includes('Saída');
                    return (
                      <tr key={m.id}>
                        <td style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                          {formatarDataHora(m.dataHora)}
                        </td>
                        <td style={{ fontWeight: 700 }}>{m.nomeProduto}</td>
                        <td>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            padding: '3px 8px', 
                            borderRadius: 4,
                            background: isSaida ? '#FEE2E2' : '#DCFCE7',
                            color: isSaida ? '#DC2626' : '#16A34A',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {isSaida ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                            {m.tipo}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                          {m.quantidade}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#64748B' }}>
                          {m.estoqueAnterior}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#0F172A' }}>
                          {m.estoqueNovo}
                        </td>
                        <td style={{ color: '#475569', fontSize: '0.85rem' }}>{m.motivo}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {movimentacoesFiltradas.length > 100 && (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: '#64748B', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                Exibindo as 100 movimentações mais recentes de {movimentacoesFiltradas.length}. Digite na busca para filtrar.
              </div>
            )}
          </div>
        )}
      </div>

      {mostrarModalMovimento && (
        <StockMovementModal
          produto={produtoSelecionadoParaMovimento}
          produtos={produtos}
          onSalvar={handleSalvarMovimento}
          onClose={() => {
            setMostrarModalMovimento(false);
            setProdutoSelecionadoParaMovimento(null);
          }}
        />
      )}
    </div>
  );
}
