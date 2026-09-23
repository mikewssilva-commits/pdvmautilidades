import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Search, 
  Calendar, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Award, 
  PieChart
} from 'lucide-react';
import { db, CATEGORIAS_PADRAO } from '../../db/db';
import { soundFX } from '../../utils/audio';
import { formatarMoeda } from '../../utils/formatters';
import SaleDetailModal from './SaleDetailModal';

export default function ReportsView({ onAtualizacao }) {
  // Filtros de período
  const [periodo, setPeriodo] = useState('hoje'); // 'hoje' | 'ontem' | '7dias' | '30dias' | 'personalizado'
  
  // Datas personalizadas padrão (dia atual)
  const hojeFormatado = new Date().toISOString().split('T')[0];
  const [dataInicioInput, setDataInicioInput] = useState(hojeFormatado);
  const [dataFimInput, setDataFimInput] = useState(hojeFormatado);
  const [filtroDataAtivo, setFiltroDataAtivo] = useState({
    tipo: 'hoje',
    dataInicio: hojeFormatado,
    dataFim: hojeFormatado
  });

  // Busca e filtro da tabela
  const [buscaVenda, setBuscaVenda] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos' | 'Finalizada' | 'Cancelada'

  // Dados do banco
  const [vendas, setVendas] = useState([]);
  const [itensVendas, setItensVendas] = useState([]);
  const [produtos, setProdutos] = useState([]);

  // Modal de Detalhes e Notificação
  const [vendaSelecionada, setVendaSelecionada] = useState(null);
  const [itensVendaSelecionada, setItensVendaSelecionada] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Carregar dados gerais do banco
  const carregarDados = useCallback(async () => {
    try {
      const [todasVendas, todosItens, todosProdutos] = await Promise.all([
        db.vendas.orderBy('id').reverse().toArray(),
        db.itensVenda.toArray(),
        db.produtos.toArray()
      ]);
      setVendas(todasVendas);
      setItensVendas(todosItens);
      setProdutos(todosProdutos);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Aplicar busca por data personalizada
  const handleBuscarPersonalizado = (e) => {
    e.preventDefault();
    setPeriodo('personalizado');
    setFiltroDataAtivo({
      tipo: 'personalizado',
      dataInicio: dataInicioInput,
      dataFim: dataFimInput
    });
  };

  // Alternar período rápido
  const handleMudarPeriodo = (novoPeriodo) => {
    setPeriodo(novoPeriodo);
    setFiltroDataAtivo({
      tipo: novoPeriodo,
      dataInicio: dataInicioInput,
      dataFim: dataFimInput
    });
  };

  // Filtragem estrita de vendas por período
  const vendasDoPeriodo = useMemo(() => {
    const agora = new Date();
    
    // Início e fim do dia de hoje
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
    const fimHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);

    // Início e fim de ontem
    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);
    const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 0, 0, 0, 0);
    const fimOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59, 999);

    // Últimos 7 dias
    const d7 = new Date(agora);
    d7.setDate(d7.getDate() - 7);
    const inicio7Dias = new Date(d7.getFullYear(), d7.getMonth(), d7.getDate(), 0, 0, 0, 0);

    // Últimos 30 dias
    const d30 = new Date(agora);
    d30.setDate(d30.getDate() - 30);
    const inicio30Dias = new Date(d30.getFullYear(), d30.getMonth(), d30.getDate(), 0, 0, 0, 0);

    return vendas.filter((v) => {
      const dv = new Date(v.dataHora);

      if (filtroDataAtivo.tipo === 'hoje') {
        return dv >= inicioHoje && dv <= fimHoje;
      }
      if (filtroDataAtivo.tipo === 'ontem') {
        return dv >= inicioOntem && dv <= fimOntem;
      }
      if (filtroDataAtivo.tipo === '7dias') {
        return dv >= inicio7Dias && dv <= fimHoje;
      }
      if (filtroDataAtivo.tipo === '30dias') {
        return dv >= inicio30Dias && dv <= fimHoje;
      }
      if (filtroDataAtivo.tipo === 'personalizado') {
        const dtInicio = new Date(`${filtroDataAtivo.dataInicio}T00:00:00.000`);
        const dtFim = new Date(`${filtroDataAtivo.dataFim}T23:59:59.999`);
        return dv >= dtInicio && dv <= dtFim;
      }
      return true;
    });
  }, [vendas, filtroDataAtivo]);

  // Mapa de itens por venda para lookup rápido
  const itensPorVendaMap = useMemo(() => {
    const map = new Map();
    itensVendas.forEach((it) => {
      if (!map.has(it.vendaId)) {
        map.set(it.vendaId, []);
      }
      map.get(it.vendaId).push(it);
    });
    return map;
  }, [itensVendas]);

  // Vendas Concluídas vs Canceladas do período
  const vendasConcluidas = useMemo(() => {
    return vendasDoPeriodo.filter((v) => v.status !== 'Cancelada');
  }, [vendasDoPeriodo]);

  const vendasCanceladas = useMemo(() => {
    return vendasDoPeriodo.filter((v) => v.status === 'Cancelada');
  }, [vendasDoPeriodo]);

  // Itens de vendas concluídas do período (para produtos e categorias)
  const itensConcluidosPeriodo = useMemo(() => {
    const idsConcluidas = new Set(vendasConcluidas.map((v) => v.id));
    return itensVendas.filter((it) => idsConcluidas.has(it.vendaId));
  }, [vendasConcluidas, itensVendas]);

  // ==========================================
  // CÁLCULO DOS CARDS DE INDICADORES (KPIS)
  // ==========================================
  const faturamentoTotal = useMemo(() => {
    return vendasConcluidas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
  }, [vendasConcluidas]);

  const quantidadeVendas = vendasConcluidas.length;

  const quantidadeProdutosVendidos = useMemo(() => {
    return itensConcluidosPeriodo.reduce((acc, it) => acc + (parseInt(it.quantidade, 10) || 0), 0);
  }, [itensConcluidosPeriodo]);

  const ticketMedio = quantidadeVendas > 0 ? faturamentoTotal / quantidadeVendas : 0;

  // ==========================================
  // PRODUTOS MAIS VENDIDOS
  // ==========================================
  const topProdutos = useMemo(() => {
    const map = {};
    itensConcluidosPeriodo.forEach((it) => {
      const pid = it.produtoId;
      if (!map[pid]) {
        map[pid] = {
          produtoId: pid,
          nome: it.nomeProduto,
          codigoBarras: it.codigoBarras,
          quantidade: 0,
          receita: 0
        };
      }
      map[pid].quantidade += parseInt(it.quantidade, 10) || 0;
      map[pid].receita += parseFloat(it.subtotal) || 0;
    });

    return Object.values(map)
      .sort((a, b) => b.quantidade - a.quantidade || b.receita - a.receita)
      .slice(0, 8);
  }, [itensConcluidosPeriodo]);

  // ==========================================
  // VENDAS POR CATEGORIA
  // ==========================================
  const vendasPorCategoria = useMemo(() => {
    // Montar mapa rápido de id/nome de produto para categoria
    const prodCatMap = new Map();
    produtos.forEach((p) => prodCatMap.set(p.id, p.categoria));

    const catMap = {};
    // Inicializar com categorias padrão para garantir ordem
    CATEGORIAS_PADRAO.forEach((c) => {
      catMap[c.nome] = { nome: c.nome, cor: c.cor, quantidade: 0, receita: 0 };
    });

    itensConcluidosPeriodo.forEach((it) => {
      const cat = prodCatMap.get(it.produtoId) || 'Outros';
      if (!catMap[cat]) {
        catMap[cat] = { nome: cat, cor: '#64748B', quantidade: 0, receita: 0 };
      }
      catMap[cat].quantidade += parseInt(it.quantidade, 10) || 0;
      catMap[cat].receita += parseFloat(it.subtotal) || 0;
    });

    return Object.values(catMap)
      .filter((c) => c.receita > 0 || c.quantidade > 0)
      .sort((a, b) => b.receita - a.receita);
  }, [itensConcluidosPeriodo, produtos]);

  // ==========================================
  // LISTAGEM DE VENDAS COM FILTRO DE BUSCA & STATUS
  // ==========================================
  const vendasExibidas = useMemo(() => {
    let lista = [...vendasDoPeriodo];

    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'Finalizada') {
        lista = lista.filter((v) => v.status !== 'Cancelada');
      } else if (filtroStatus === 'Cancelada') {
        lista = lista.filter((v) => v.status === 'Cancelada');
      }
    }

    if (buscaVenda.trim() !== '') {
      const q = buscaVenda.toLowerCase().trim();
      lista = lista.filter((v) => {
        const num = v.numeroVenda ? v.numeroVenda.toString() : v.id.toString();
        const cliente = (v.clienteNome || '').toLowerCase();
        const forma = (v.formaPagamento || '').toLowerCase();
        return num.includes(q) || cliente.includes(q) || forma.includes(q);
      });
    }

    return lista;
  }, [vendasDoPeriodo, filtroStatus, buscaVenda]);

  // Abrir detalhes de uma venda
  const handleAbrirDetalhes = (venda) => {
    const itens = itensPorVendaMap.get(venda.id) || [];
    setVendaSelecionada(venda);
    setItensVendaSelecionada(itens);
  };

  // ==========================================
  // CANCELAMENTO TRANSACIONAL DE VENDA COM RESTITUIÇÃO DE ESTOQUE
  // ==========================================
  const handleCancelarVenda = async (vendaId, motivo) => {
    try {
      const venda = await db.vendas.get(vendaId);
      if (!venda) {
        alert('Venda não localizada.');
        return;
      }

      if (venda.status === 'Cancelada') {
        alert('Esta venda já se encontra cancelada.');
        return;
      }

      const itens = await db.itensVenda.where('vendaId').equals(vendaId).toArray();
      const dataHoraCancelamento = new Date().toISOString();
      const numeroFormatado = venda.numeroVenda ? venda.numeroVenda.toString().padStart(6, '0') : venda.id;

      // Executar rollback seguro em transação
      await db.transaction(
        'rw',
        [db.vendas, db.itensVenda, db.produtos, db.movimentacoesEstoque, db.fiados],
        async () => {
          // 1. Atualizar status da venda para Cancelada
          await db.vendas.update(vendaId, {
            status: 'Cancelada',
            dataCancelamento: dataHoraCancelamento,
            motivoCancelamento: motivo || 'Cancelada pelo operador'
          });

          // 2. Restaurar cada produto no estoque e registrar histórico de auditoria
          for (const item of itens) {
            const prodAtual = await db.produtos.get(item.produtoId);
            if (prodAtual) {
              const estoqueRestaurado = prodAtual.estoqueAtual + item.quantidade;

              await db.produtos.update(item.produtoId, {
                estoqueAtual: estoqueRestaurado,
                updatedAt: dataHoraCancelamento
              });

              await db.movimentacoesEstoque.add({
                produtoId: item.produtoId,
                nomeProduto: item.nomeProduto,
                tipo: 'Entrada por Cancelamento de Venda',
                quantidade: item.quantidade,
                estoqueAnterior: prodAtual.estoqueAtual,
                estoqueNovo: estoqueRestaurado,
                motivo: `Cancelamento da Venda #${numeroFormatado}`,
                dataHora: dataHoraCancelamento,
                vendaId: vendaId
              });
            }
          }

          // 3. Se a venda tiver sido Fiado / Crediário, cancelar débito pendente
          const fiadoVinculado = await db.fiados.where('vendaId').equals(vendaId).first();
          if (fiadoVinculado && fiadoVinculado.status !== 'Cancelado') {
            await db.fiados.update(fiadoVinculado.id, {
              status: 'Cancelado',
              saldoDevedor: 0,
              observacao: `${fiadoVinculado.observacao || ''} (Venda #${numeroFormatado} Cancelada em ${new Date().toLocaleDateString('pt-BR')})`
            });
          }
        }
      );

      // Feedback auditivo e visual
      soundFX.playAlert();
      setFeedbackMsg(`Venda #${numeroFormatado} cancelada com sucesso! Produtos devolvidos ao estoque.`);
      setTimeout(() => setFeedbackMsg(''), 5000);

      // Recarregar dados locais
      await carregarDados();

      // Fechar modal de detalhes
      setVendaSelecionada(null);

      // Notificar aplicação pai para atualizar badges do Navbar e alertas de estoque
      if (onAtualizacao) onAtualizacao();

    } catch (err) {
      console.error('Erro ao cancelar venda:', err);
      soundFX.playAlert();
      alert('Ocorreu um erro ao processar o cancelamento da venda no banco de dados.');
    }
  };

  const formatarDataTabela = (dataStr) => {
    if (!dataStr) return '-';
    try {
      const d = new Date(dataStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="module-page-container reports-view-container">
      {/* ======================================================================
          CABEÇALHO E FILTROS DE PERÍODO
          ====================================================================== */}
      <div className="reports-top-header">
        <div className="page-title-box">
          <h1>
            <BarChart3 size={28} color="#EAB308" />
            <span>Acompanhamento de Vendas & Relatórios</span>
          </h1>
          <p>
            Visão gerencial do faturamento, volume de vendas, histórico e cancelamentos
          </p>
        </div>

        {/* Chips de Períodos Rápidos */}
        <div className="reports-period-selector-bar">
          {[
            { id: 'hoje', label: 'Hoje' },
            { id: 'ontem', label: 'Ontem' },
            { id: '7dias', label: 'Últimos 7 dias' },
            { id: '30dias', label: 'Últimos 30 dias' },
            { id: 'personalizado', label: 'Data personalizada' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleMudarPeriodo(item.id)}
              className={`reports-period-btn ${periodo === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Filtro de Data Personalizada (quando selecionado) */}
      {periodo === 'personalizado' && (
        <form onSubmit={handleBuscarPersonalizado} className="reports-custom-date-bar">
          <div className="custom-date-field">
            <label htmlFor="data-inicio-filtro">
              <Calendar size={14} /> Data Inicial:
            </label>
            <input
              id="data-inicio-filtro"
              type="date"
              value={dataInicioInput}
              onChange={(e) => setDataInicioInput(e.target.value)}
              className="custom-date-input"
              required
            />
          </div>

          <div className="custom-date-field">
            <label htmlFor="data-fim-filtro">
              <Calendar size={14} /> Data Final:
            </label>
            <input
              id="data-fim-filtro"
              type="date"
              value={dataFimInput}
              onChange={(e) => setDataFimInput(e.target.value)}
              className="custom-date-input"
              required
            />
          </div>

          <button type="submit" className="btn-search-sales">
            <Search size={16} />
            <span>Buscar Vendas</span>
          </button>
        </form>
      )}

      {/* Banner de Feedback / Alerta */}
      {feedbackMsg && (
        <div className="reports-feedback-banner">
          <CheckCircle size={20} color="#16A34A" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* ======================================================================
          CARDS DE INDICADORES (RESUMO DO DIA / PERÍODO)
          ====================================================================== */}
      <div className="reports-kpi-grid">
        {/* Card 1: Faturamento Total */}
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon-bubble" style={{ background: '#DCFCE7', color: '#16A34A' }}>
            <DollarSign size={32} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Faturamento Total</span>
            <div className="kpi-big-number" style={{ color: '#16A34A' }}>
              {formatarMoeda(faturamentoTotal)}
            </div>
            <span className="kpi-subtext">
              {vendasCanceladas.length > 0
                ? `${vendasCanceladas.length} cancelamento(s) desconsiderado(s)`
                : 'Vendas líquidas do período'}
            </span>
          </div>
        </div>

        {/* Card 2: Quantidade de Vendas */}
        <div className="kpi-card">
          <div className="kpi-icon-bubble" style={{ background: '#E0E7FF', color: '#4338CA' }}>
            <ShoppingBag size={30} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Quantidade de Vendas</span>
            <div className="kpi-big-number">
              {quantidadeVendas}
              <span className="kpi-unit">vendas</span>
            </div>
            <span className="kpi-subtext">
              {vendasCanceladas.length > 0 ? `(${vendasCanceladas.length} cancelada(s))` : 'Concluídas com sucesso'}
            </span>
          </div>
        </div>

        {/* Card 3: Produtos Vendidos */}
        <div className="kpi-card">
          <div className="kpi-icon-bubble" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Package size={30} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Produtos Vendidos</span>
            <div className="kpi-big-number">
              {quantidadeProdutosVendidos}
              <span className="kpi-unit">unidades</span>
            </div>
            <span className="kpi-subtext">Volume físico entregue</span>
          </div>
        </div>

        {/* Card 4: Ticket Médio */}
        <div className="kpi-card">
          <div className="kpi-icon-bubble" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
            <TrendingUp size={30} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Ticket Médio por Venda</span>
            <div className="kpi-big-number" style={{ color: '#0F172A' }}>
              {formatarMoeda(ticketMedio)}
            </div>
            <span className="kpi-subtext">Gasto médio por cliente</span>
          </div>
        </div>
      </div>

      {/* ======================================================================
          SEÇÃO PRINCIPAL: LISTAGEM DE VENDAS & ANÁLISE DE PRODUTOS
          ====================================================================== */}
      <div className="reports-layout-grid">
        {/* ====================================================================
            COLUNA ESQUERDA: LISTAGEM DE VENDAS DO PERÍODO
            ==================================================================== */}
        <div className="data-table-card sales-list-card">
          <div className="sales-list-card-header">
            <div className="sales-list-title-box">
              <ShoppingBag size={20} color="#EAB308" />
              <h3>Vendas Registradas ({vendasExibidas.length})</h3>
            </div>

            {/* Filtros da Tabela */}
            <div className="sales-table-filter-bar">
              <div className="sales-search-input-wrapper">
                <Search size={16} className="sales-search-icon" />
                <input
                  type="text"
                  placeholder="Buscar nº da venda ou cliente..."
                  value={buscaVenda}
                  onChange={(e) => setBuscaVenda(e.target.value)}
                  className="sales-search-input"
                />
              </div>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="sales-status-select"
              >
                <option value="todos">Todos os Status</option>
                <option value="Finalizada">Apenas Finalizadas</option>
                <option value="Cancelada">Apenas Canceladas</option>
              </select>
            </div>
          </div>

          <div className="sales-table-wrapper">
            {vendasExibidas.length === 0 ? (
              <div className="table-empty-state">
                <ShoppingBag size={42} strokeWidth={1.5} color="#94A3B8" />
                <div style={{ fontWeight: 700, color: '#334155' }}>Nenhuma venda encontrada</div>
                <span>Tente alterar o período selecionado ou os termos da busca.</span>
              </div>
            ) : (
              <table className="standard-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}># Venda</th>
                    <th style={{ width: 140 }}>Data e Horário</th>
                    <th>Cliente</th>
                    <th style={{ width: 130, textAlign: 'center' }}>Qtd Itens</th>
                    <th style={{ width: 130, textAlign: 'right' }}>Valor Total</th>
                    <th style={{ width: 120, textAlign: 'center' }}>Status</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasExibidas.map((v) => {
                    const isCancelada = v.status === 'Cancelada';
                    const itensV = itensPorVendaMap.get(v.id) || [];
                    const qtdUnidades = itensV.reduce((acc, it) => acc + (parseInt(it.quantidade, 10) || 0), 0);

                    return (
                      <tr 
                        key={v.id} 
                        className={`sales-table-row ${isCancelada ? 'row-cancelled' : ''}`}
                        onClick={() => handleAbrirDetalhes(v)}
                        title="Clique para ver os detalhes da venda"
                      >
                        <td className="sale-num-col">
                          #{v.numeroVenda ? v.numeroVenda.toString().padStart(6, '0') : v.id}
                        </td>
                        <td className="sale-date-col">
                          {formatarDataTabela(v.dataHora)}
                        </td>
                        <td className="sale-client-col">
                          <span className="client-name-text">
                            {v.clienteNome || 'Consumidor Final'}
                          </span>
                          <span className="payment-sub-text">
                            {v.formaPagamento || 'Balcão'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge-item-count">
                            {itensV.length} {itensV.length === 1 ? 'item' : 'itens'} ({qtdUnidades} un)
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`sale-total-num ${isCancelada ? 'cancelled-strike' : ''}`}>
                            {formatarMoeda(v.total)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge-sale-status ${isCancelada ? 'cancelled' : 'completed'}`}>
                            {isCancelada ? (
                              <>
                                <XCircle size={13} />
                                <span>Cancelada</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={13} />
                                <span>Finalizada</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAbrirDetalhes(v);
                            }}
                            className="btn-view-sale-details"
                            title="Ver detalhes da venda"
                          >
                            <Eye size={15} />
                            <span>Ver</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ====================================================================
            COLUNA DIREITA: ANÁLISE DE PRODUTOS E VENDAS POR CATEGORIA
            ==================================================================== */}
        <div className="reports-analytics-col">
          {/* Card: Produtos Mais Vendidos */}
          <div className="data-table-card">
            <div className="analytics-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={20} color="#EAB308" />
                <h3>Produtos Mais Vendidos</h3>
              </div>
              <span className="analytics-subtitle-badge">Top Ranking</span>
            </div>

            <div style={{ padding: 14 }}>
              {topProdutos.length === 0 ? (
                <div className="analytics-empty-state">
                  <span>Nenhum produto faturado no período selecionado.</span>
                </div>
              ) : (
                <div className="top-products-list">
                  {topProdutos.map((item, index) => (
                    <div key={item.produtoId || index} className="top-product-item">
                      <div className="top-product-rank-badge" style={{
                        background: index === 0 ? '#EAB308' : index === 1 ? '#94A3B8' : index === 2 ? '#B45309' : '#F1F5F9',
                        color: index <= 2 ? '#FFFFFF' : '#475569'
                      }}>
                        {index + 1}º
                      </div>

                      <div className="top-product-info">
                        <span className="top-product-name" title={item.nome}>{item.nome}</span>
                        <span className="top-product-sub">
                          {item.quantidade} unidades vendidas
                        </span>
                      </div>

                      <div className="top-product-revenue">
                        {formatarMoeda(item.receita)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card: Vendas por Categoria */}
          <div className="data-table-card">
            <div className="analytics-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChart size={20} color="#3B82F6" />
                <h3>Vendas por Categoria</h3>
              </div>
              <span className="analytics-subtitle-badge">Distribuição</span>
            </div>

            <div style={{ padding: 14 }}>
              {vendasPorCategoria.length === 0 ? (
                <div className="analytics-empty-state">
                  <span>Nenhuma categoria com faturamento no período.</span>
                </div>
              ) : (
                <div className="categories-distribution-list">
                  {vendasPorCategoria.map((cat) => {
                    const percentual = faturamentoTotal > 0 
                      ? Math.min(100, Math.round((cat.receita / faturamentoTotal) * 100)) 
                      : 0;

                    return (
                      <div key={cat.nome} className="category-distribution-item">
                        <div className="category-distribution-row">
                          <span className="category-dist-name" style={{ borderLeft: `3px solid ${cat.cor}` }}>
                            {cat.nome}
                          </span>
                          <div className="category-dist-values">
                            <span className="category-dist-total">{formatarMoeda(cat.receita)}</span>
                            <span className="category-dist-percent">({percentual}%)</span>
                          </div>
                        </div>

                        {/* Barra de Progresso Visual */}
                        <div className="category-dist-progress-bg">
                          <div 
                            className="category-dist-progress-fill" 
                            style={{ width: `${percentual}%`, background: cat.cor || '#3B82F6' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Venda e Cancelamento */}
      {vendaSelecionada && (
        <SaleDetailModal
          venda={vendaSelecionada}
          itens={itensVendaSelecionada}
          onClose={() => setVendaSelecionada(null)}
          onCancelarVenda={handleCancelarVenda}
        />
      )}
    </div>
  );
}
