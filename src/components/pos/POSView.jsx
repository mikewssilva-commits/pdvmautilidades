import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Layers,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, CATEGORIAS_PADRAO } from '../../db/db';
import { soundFX } from '../../utils/audio';
import { formatarMoeda, arredondarMoeda } from '../../utils/formatters';
import CheckoutModal from './CheckoutModal';
import ReceiptModal from './ReceiptModal';

export default function POSView({ config, clientes = [], onVendaFinalizada, onVoltarInicio }) {
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);

  // Suporte a Leitor USB HID & Quantidade Múltipla
  const [quantidadeLeitor, setQuantidadeLeitor] = useState(1);
  const [feedbackLeitor, setFeedbackLeitor] = useState(null); // { tipo: 'sucesso' | 'erro', mensagem: string }
  
  // Carrinho da venda
  const [carrinho, setCarrinho] = useState([]);
  const [desconto, setDesconto] = useState(0);

  // Modais
  const [mostrarCheckout, setMostrarCheckout] = useState(false);
  const [ultimaVendaFinalizada, setUltimaVendaFinalizada] = useState(null);
  const [itensUltimaVenda, setItensUltimaVenda] = useState([]);
  const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const searchInputRef = useRef(null);

  // Carregar produtos do banco
  const carregarProdutos = useCallback(async () => {
    const todos = await db.produtos.toArray();
    setProdutosDisponiveis(todos);
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  // Foco automático inicial no campo de busca/código de barras
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Feedback visual e sonoro não-bloqueante para o leitor de código de barras
  const exibirFeedbackLeitor = useCallback((tipo, mensagem) => {
    setFeedbackLeitor({ tipo, mensagem });
    if (tipo === 'erro') {
      soundFX.playAlert();
    } else {
      soundFX.playBeep();
    }
    setTimeout(() => {
      setFeedbackLeitor((prev) => (prev?.mensagem === mensagem ? null : prev));
    }, 4500);
  }, []);

  // Limpar todo o carrinho
  const handleLimparCarrinho = useCallback(() => {
    if (carrinho.length === 0) return;
    if (window.confirm('Tem certeza que deseja cancelar a venda atual e limpar o carrinho?')) {
      setCarrinho([]);
      setDesconto(0);
      setQuantidadeLeitor(1);
      if (searchInputRef.current) searchInputRef.current.focus();
    }
  }, [carrinho.length]);

  // Atalhos globais de teclado e captura inteligente do leitor USB HID
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.querySelector('.modal-backdrop')) return;

      if (e.key === 'F2') {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (carrinho.length > 0 && !mostrarCheckout) {
          setMostrarCheckout(true);
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (carrinho.length > 0) {
          handleLimparCarrinho();
        }
      } else {
        // Redirecionamento inteligente do leitor USB HID:
        // Se o operador começar a bipar enquanto o foco está fora do input,
        // redireciona o foco para o campo de leitura sem perder a digitação.
        const activeEl = document.activeElement;
        const isEditingOtherField = activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.tagName === 'SELECT'
        );
        if (!isEditingOtherField && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (searchInputRef.current && searchInputRef.current !== activeEl) {
            searchInputRef.current.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carrinho.length, mostrarCheckout, handleLimparCarrinho]);

  // Filtragem dinâmica de produtos por texto e categoria
  useEffect(() => {
    let filtrados = [...produtosDisponiveis];

    if (categoriaAtiva !== 'todos') {
      filtrados = filtrados.filter((p) => p.categoria.toLowerCase() === categoriaAtiva.toLowerCase());
    }

    if (termoBusca.trim() !== '') {
      const q = termoBusca.toLowerCase().trim();
      filtrados = filtrados.filter((p) =>
        p.nome.toLowerCase().includes(q) ||
        p.codigoBarras.includes(q) ||
        (p.codigoInterno && p.codigoInterno.toLowerCase().includes(q)) ||
        (p.subcategoria && p.subcategoria.toLowerCase().includes(q))
      );
    }

    setProdutosFiltrados(filtrados);
  }, [termoBusca, categoriaAtiva, produtosDisponiveis]);

  // Adicionar produto ao carrinho com suporte a quantidade e validação não-bloqueante
  const handleAdicionarProduto = (produto, qtd = 1) => {
    const qtdNum = Math.max(1, parseInt(qtd, 10) || 1);

    if (produto.estoqueAtual <= 0) {
      exibirFeedbackLeitor('erro', 'Produto sem estoque disponível.');
      return false;
    }

    const itemExistente = carrinho.find((item) => item.produtoId === produto.id);
    const qtdAtual = itemExistente ? itemExistente.quantidade : 0;

    if (qtdAtual + qtdNum > produto.estoqueAtual) {
      exibirFeedbackLeitor('erro', `Estoque insuficiente! Disponível: ${produto.estoqueAtual} unidades.`);
      return false;
    }

    soundFX.playBeep();

    setCarrinho((prev) => {
      const index = prev.findIndex((item) => item.produtoId === produto.id);
      if (index > -1) {
        const atual = prev[index];
        const novaQtd = atual.quantidade + qtdNum;
        const atualizado = [...prev];
        atualizado[index] = {
          ...atual,
          quantidade: novaQtd,
          subtotal: arredondarMoeda(novaQtd * atual.precoUnitario)
        };
        return atualizado;
      } else {
        return [
          ...prev,
          {
            produtoId: produto.id,
            nomeProduto: produto.nome,
            codigoBarras: produto.codigoBarras,
            categoria: produto.categoria,
            precoUnitario: produto.precoVenda,
            quantidade: qtdNum,
            subtotal: arredondarMoeda(qtdNum * produto.precoVenda),
            estoqueDisponivel: produto.estoqueAtual,
            foto: produto.foto
          }
        ];
      }
    });

    exibirFeedbackLeitor('sucesso', `${produto.nome} (${qtdNum} un) adicionado ao carrinho!`);

    // Manter o foco no input para próxima bipagem contínua
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    return true;
  };

  // Tratamento da tecla Enter no input (leitor de código de barras USB HID e Bluetooth)
  const handleKeyDownBusca = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let termo = termoBusca.trim();
      if (!termo) return;

      let qtd = quantidadeLeitor;

      // Suporte a sintaxe rápida: 5*CODIGO ou 5xCODIGO
      if (termo.includes('*')) {
        const partes = termo.split('*');
        const qtdParse = parseInt(partes[0], 10);
        if (!isNaN(qtdParse) && qtdParse > 0) {
          qtd = qtdParse;
          termo = partes.slice(1).join('*').trim();
        }
      } else if (termo.toLowerCase().includes('x') && !termo.startsWith('x')) {
        const partes = termo.split(/[xX]/);
        const qtdParse = parseInt(partes[0], 10);
        if (!isNaN(qtdParse) && qtdParse > 0) {
          qtd = qtdParse;
          termo = partes.slice(1).join('').trim();
        }
      }

      // 1. Buscar por código de barras exato
      let produtoEncontrado = produtosDisponiveis.find((p) => p.codigoBarras === termo);

      // 2. Se não achou por código de barras exato, buscar por código interno exato
      if (!produtoEncontrado && termo) {
        produtoEncontrado = produtosDisponiveis.find(
          (p) => p.codigoInterno && p.codigoInterno.toLowerCase() === termo.toLowerCase()
        );
      }

      // 3. Se ainda não achou e a lista filtrada tiver exatamente 1 item por busca textual
      if (!produtoEncontrado && produtosFiltrados.length === 1) {
        produtoEncontrado = produtosFiltrados[0];
      }

      if (produtoEncontrado) {
        const adicionou = handleAdicionarProduto(produtoEncontrado, qtd);
        if (adicionou) {
          setTermoBusca('');
          setQuantidadeLeitor(1); // Reseta a quantidade para 1 após leitura com sucesso
        }
      } else {
        // Mensagem exata solicitada: não trava o sistema
        exibirFeedbackLeitor('erro', 'Produto não encontrado. Cadastre o produto antes de vender.');
        setTermoBusca('');
      }

      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  // Alterar quantidade no carrinho com segurança
  const handleAlterarQuantidade = (produtoId, novaQuantidade) => {
    if (novaQuantidade === '') {
      setCarrinho((prev) =>
        prev.map((item) => (item.produtoId === produtoId ? { ...item, quantidade: '' } : item))
      );
      return;
    }

    const qtdNum = Math.max(1, parseInt(novaQuantidade, 10) || 1);
    const produto = produtosDisponiveis.find((p) => p.id === produtoId);

    if (produto && qtdNum > produto.estoqueAtual) {
      soundFX.playAlert();
      alert(`Quantidade solicitada (${qtdNum}) excede o estoque disponível (${produto.estoqueAtual}).`);
      return;
    }

    setCarrinho((prev) =>
      prev.map((item) => {
        if (item.produtoId === produtoId) {
          return {
            ...item,
            quantidade: qtdNum,
            subtotal: arredondarMoeda(qtdNum * item.precoUnitario)
          };
        }
        return item;
      })
    );
  };

  // Remover item do carrinho
  const handleRemoverItem = (produtoId) => {
    setCarrinho((prev) => prev.filter((item) => item.produtoId !== produtoId));
  };

  // Totais financeiros com arredondamento seguro de 2 casas decimais
  const subtotal = arredondarMoeda(carrinho.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0));
  const totalDesconto = arredondarMoeda(Math.min(subtotal, Math.max(0, parseFloat(desconto) || 0)));
  const total = Math.max(0, arredondarMoeda(subtotal - totalDesconto));
  const totalItens = carrinho.reduce((acc, it) => acc + (parseInt(it.quantidade, 10) || 0), 0);

  // Confirmar Venda (com validação prévia de estoque em tempo real)
  const handleConfirmarVenda = async (dadosPagamento) => {
    try {
      // 1. Verificação transacional prévia de estoque em tempo real para TODOS os itens
      for (const item of carrinho) {
        const prodAtual = await db.produtos.get(item.produtoId);
        if (!prodAtual) {
          soundFX.playAlert();
          alert(`O produto "${item.nomeProduto}" não foi localizado no cadastro de estoque.`);
          return;
        }
        const qtdItem = parseInt(item.quantidade, 10) || 1;
        if (qtdItem > prodAtual.estoqueAtual) {
          soundFX.playAlert();
          alert(`Estoque insuficiente para "${prodAtual.nome}". Disponível: ${prodAtual.estoqueAtual}, solicitado: ${qtdItem}.`);
          return;
        }
      }

      const dataHora = new Date().toISOString();
      const ultimaVenda = await db.vendas.orderBy('id').last();
      const numeroVenda = (ultimaVenda?.numeroVenda || 0) + 1;

      let vendaIdCriada = null;

      // Transação segura para garantir consistência no banco
      await db.transaction(
        'rw', 
        [db.vendas, db.itensVenda, db.produtos, db.movimentacoesEstoque, db.fiados], 
        async () => {
          // 1. Inserir Registro da Venda
          vendaIdCriada = await db.vendas.add({
            numeroVenda,
            dataHora,
            subtotal,
            desconto: totalDesconto,
            total,
            formaPagamento: dadosPagamento.formaPagamento,
            valorRecebido: dadosPagamento.valorRecebido,
            troco: dadosPagamento.troco,
            clienteId: dadosPagamento.clienteId,
            clienteNome: dadosPagamento.clienteNome,
            status: 'Concluída',
            operador: config?.nomeOperador || 'Operador',
            caixaId: config?.numeroCaixa || '01'
          });

          // 2. Inserir Itens da Venda e Baixar Estoque
          for (const item of carrinho) {
            const qtdNum = parseInt(item.quantidade, 10) || 1;
            const subtotalItem = arredondarMoeda(qtdNum * item.precoUnitario);

            await db.itensVenda.add({
              vendaId: vendaIdCriada,
              produtoId: item.produtoId,
              nomeProduto: item.nomeProduto,
              codigoBarras: item.codigoBarras,
              quantidade: qtdNum,
              precoUnitario: item.precoUnitario,
              subtotal: subtotalItem
            });

            // Buscar saldo anterior do produto
            const prodAtual = await db.produtos.get(item.produtoId);
            if (prodAtual) {
              const estoqueNovo = Math.max(0, prodAtual.estoqueAtual - qtdNum);
              
              // Baixa automática no estoque do produto
              await db.produtos.update(item.produtoId, {
                estoqueAtual: estoqueNovo,
                updatedAt: dataHora
              });

              // Registro da movimentação de auditoria
              await db.movimentacoesEstoque.add({
                produtoId: item.produtoId,
                nomeProduto: item.nomeProduto,
                tipo: 'Saída por Venda',
                quantidade: qtdNum,
                estoqueAnterior: prodAtual.estoqueAtual,
                estoqueNovo,
                motivo: `Venda #${numeroVenda.toString().padStart(6, '0')}`,
                dataHora,
                vendaId: vendaIdCriada
              });
            }
          }

          // 3. Se a forma de pagamento for Fiado / Crediário, registrar na tabela fiados
          if (dadosPagamento.formaPagamento === 'Fiado / Crediário' && dadosPagamento.clienteId) {
            const dataVencimento = new Date();
            dataVencimento.setDate(dataVencimento.getDate() + 30); // 30 dias para vencimento padrão

            await db.fiados.add({
              vendaId: vendaIdCriada,
              clienteId: dadosPagamento.clienteId,
              clienteNome: dadosPagamento.clienteNome,
              valorOriginal: total,
              valorPago: 0,
              saldoDevedor: total,
              status: 'Pendente',
              dataVenda: dataHora,
              dataVencimento: dataVencimento.toISOString(),
              observacao: `Venda a prazo #${numeroVenda.toString().padStart(6, '0')}`
            });
          }
        }
      );

      // Sucesso na transação!
      soundFX.playCashChime();
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Ignorar se confetti falhar
      }

      const vendaObjeto = {
        id: vendaIdCriada,
        numeroVenda,
        dataHora,
        subtotal,
        desconto: totalDesconto,
        total,
        formaPagamento: dadosPagamento.formaPagamento,
        valorRecebido: dadosPagamento.valorRecebido,
        troco: dadosPagamento.troco,
        clienteNome: dadosPagamento.clienteNome,
        operador: config?.nomeOperador || 'Operador'
      };

      setUltimaVendaFinalizada(vendaObjeto);
      setItensUltimaVenda([...carrinho]);
      setMostrarCheckout(false);
      setMostrarRecibo(true);

      // Limpar carrinho para a próxima venda
      setCarrinho([]);
      setDesconto(0);

      // Recarregar catálogo e notificar componente pai
      await carregarProdutos();
      if (onVendaFinalizada) onVendaFinalizada();

      setMensagemSucesso(`Venda #${numeroVenda.toString().padStart(6, '0')} realizada com sucesso!`);
      setTimeout(() => setMensagemSucesso(''), 4000);

    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      soundFX.playAlert();
      alert('Ocorreu um erro ao registrar a venda no banco de dados.');
    }
  };

  const handleFecharRecibo = () => {
    setMostrarRecibo(false);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  return (
    <div className="pos-view-wrapper">
      {/* Barra Superior do Caixa com Botão Voltar ao Início */}
      <div className="pos-top-action-bar">
        {onVoltarInicio && (
          <button
            type="button"
            onClick={onVoltarInicio}
            className="pos-btn-back-home"
            title="Voltar para a tela inicial do sistema"
          >
            <ArrowLeft size={18} />
            <span>Voltar ao Início</span>
          </button>
        )}

        <div className="pos-header-status-info">
          <span className="pos-header-status-pill">
            <span className="status-dot-active"></span>
            Caixa {config?.numeroCaixa || '01'} • {config?.nomeOperador || 'Operador'}
          </span>
          <span className="pos-header-tip">
            Fluxo contínuo: finalize a venda e o caixa estará pronto para a próxima!
          </span>
        </div>
      </div>

      <div className="pos-container">
        {/* ======================================================================
            COLUNA ESQUERDA: BUSCA DE PRODUTOS E CATÁLOGO RÁPIDO
            ====================================================================== */}
        <div className="pos-panel">
          <div className="search-panel-header">
            {/* Bloco de Leitura com Multiplicador de Quantidade */}
            <div className="barcode-scan-group">
              <div className="barcode-qty-box" title="Quantidade para o próximo produto bipado">
                <span className="barcode-qty-label">Qtd:</span>
                <div className="barcode-qty-controls">
                  <button
                    type="button"
                    className="btn-barcode-qty-step"
                    onClick={() => setQuantidadeLeitor((prev) => Math.max(1, prev - 1))}
                    title="Diminuir quantidade"
                  >
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={quantidadeLeitor}
                    onChange={(e) => setQuantidadeLeitor(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="barcode-qty-input"
                  />
                  <button
                    type="button"
                    className="btn-barcode-qty-step"
                    onClick={() => setQuantidadeLeitor((prev) => prev + 1)}
                    title="Aumentar quantidade"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              <div className="search-input-wrapper">
                <Barcode className="search-input-icon" size={24} color="#0F172A" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input search-input-giant"
                  placeholder="Bipar ou digitar código do produto..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  onKeyDown={handleKeyDownBusca}
                />
              </div>
            </div>

            {/* Banner de Feedback em Tempo Real do Leitor */}
            {feedbackLeitor && (
              <div className={`barcode-feedback-banner ${feedbackLeitor.tipo}`}>
                {feedbackLeitor.tipo === 'erro' ? (
                  <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                ) : (
                  <CheckCircle size={18} color="#16A34A" style={{ flexShrink: 0 }} />
                )}
                <span>{feedbackLeitor.mensagem}</span>
              </div>
            )}

            <div className="search-barcode-helper">
              <span><Barcode size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Leitor USB HID pronto • Enter automático</span>
              <span>Dica: <strong>Qtd</strong> ou <strong>5*código</strong></span>
            </div>
          </div>

        {/* Chips de Categorias */}
        <div className="category-chips-bar">
          <button
            onClick={() => setCategoriaAtiva('todos')}
            className={`category-chip ${categoriaAtiva === 'todos' ? 'active' : ''}`}
          >
            Todos
          </button>
          {CATEGORIAS_PADRAO.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.nome)}
              className={`category-chip ${categoriaAtiva.toLowerCase() === cat.nome.toLowerCase() ? 'active' : ''}`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* Lista de Resultados Encontrados (Otimizado para 500+ produtos) */}
        <div className="products-search-results">
          {produtosFiltrados.length === 0 ? (
            <div className="cart-empty-placeholder" style={{ minHeight: 200 }}>
              <Layers size={36} />
              <div>Nenhum produto encontrado.</div>
              <span style={{ fontSize: '0.75rem' }}>Tente outro nome ou código de barras.</span>
            </div>
          ) : (
            <>
              {produtosFiltrados.slice(0, 48).map((prod) => {
                const isEsgotado = prod.estoqueAtual <= 0;
                const isEstoqueBaixo = prod.estoqueAtual <= prod.estoqueMinimo;

                return (
                  <div key={prod.id} className="product-search-card">
                    <img
                      src={prod.foto || 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=150&auto=format&fit=crop&q=60'}
                      alt={prod.nome}
                      className="product-thumb"
                      loading="lazy"
                    />
                    <div className="product-info-box">
                      <span className="product-name-title" title={prod.nome}>
                        {prod.nome}
                      </span>
                      <div className="product-meta-sub">
                        <span>{prod.categoria}</span>
                        <span>•</span>
                        <span>Cód: {prod.codigoBarras}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <span className="product-price-tag">{formatarMoeda(prod.precoVenda)}</span>
                        <span className={`badge-stock ${isEsgotado ? 'out' : isEstoqueBaixo ? 'low' : 'ok'}`}>
                          Estoque: {prod.estoqueAtual} {prod.unidade || 'UN'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => handleAdicionarProduto(prod, 1)}
                        disabled={isEsgotado}
                        className="btn-add-item"
                        title={isEsgotado ? 'Produto esgotado' : 'Adicionar ao carrinho'}
                      >
                        <Plus size={16} />
                        Adicionar
                      </button>
                    </div>
                  </div>
                );
              })}
              {produtosFiltrados.length > 48 && (
                <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem', color: '#64748B', background: '#F8FAFC', borderRadius: 6 }}>
                  Exibindo 48 de {produtosFiltrados.length} produtos. Digite na busca para filtrar com exatidão.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ======================================================================
          COLUNA CENTRAL: CARRINHO DA VENDA
          ====================================================================== */}
      <div className="pos-panel">
        <div className="cart-header-row">
          <div className="cart-title-info">
            <ShoppingCart size={22} color="#DC2626" />
            <h2>Carrinho da Venda</h2>
            <span className="cart-count-pill">
              {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'} ({totalItens} un)
            </span>
          </div>

          {carrinho.length > 0 && (
            <button onClick={handleLimparCarrinho} className="btn-clear-cart" title="Limpar carrinho (F9)">
              <Trash2 size={14} />
              Cancelar Venda (F9)
            </button>
          )}
        </div>

        {mensagemSucesso && (
          <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #BBF7D0' }}>
            <CheckCircle size={18} color="#16A34A" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        <div className="cart-table-wrapper">
          {carrinho.length === 0 ? (
            <div className="cart-empty-placeholder">
              <ShoppingCart size={48} strokeWidth={1.5} />
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#475569' }}>
                O carrinho está vazio
              </div>
              <p style={{ maxWidth: 300, fontSize: '0.85rem' }}>
                Bipe um produto com o leitor ou selecione na lista à esquerda para iniciar o atendimento.
              </p>
            </div>
          ) : (
            <table className="cart-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Produto</th>
                  <th style={{ width: 110, textAlign: 'center' }}>Qtd</th>
                  <th style={{ width: 100, textAlign: 'right' }}>Unitário</th>
                  <th style={{ width: 110, textAlign: 'right' }}>Subtotal</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {carrinho.map((item, index) => (
                  <tr key={item.produtoId}>
                    <td className="cart-item-idx">{index + 1}</td>
                    <td>
                      <div className="cart-product-title">{item.nomeProduto}</div>
                      <div className="cart-product-sub">
                        Cód: {item.codigoBarras} | {item.categoria}
                      </div>
                    </td>
                    <td>
                      <div className="qty-control-wrapper">
                        <button
                          type="button"
                          className="btn-qty-step"
                          onClick={() => handleAlterarQuantidade(item.produtoId, item.quantidade - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={item.estoqueDisponivel}
                          value={item.quantidade}
                          onChange={(e) => handleAlterarQuantidade(item.produtoId, e.target.value)}
                          onBlur={(e) => {
                            if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                              handleAlterarQuantidade(item.produtoId, 1);
                            }
                          }}
                          className="qty-number-input"
                        />
                        <button
                          type="button"
                          className="btn-qty-step"
                          onClick={() => handleAlterarQuantidade(item.produtoId, item.quantidade + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="cart-price-num">{formatarMoeda(item.precoUnitario)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="cart-subtotal-num">{formatarMoeda(item.subtotal)}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleRemoverItem(item.produtoId)}
                        className="btn-delete-row"
                        title="Remover produto da venda"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ======================================================================
          COLUNA DIREITA: RESUMO E FINALIZAÇÃO DA VENDA
          ====================================================================== */}
      <div className="pos-panel summary-panel">
        <div className="summary-header">
          <h3>
            <Sparkles size={18} color="#EAB308" />
            Resumo da Compra
          </h3>
          <span className="summary-header-badge">
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
        </div>

        <div className="summary-body">
          <div className="summary-line-row">
            <span>Subtotal Itens:</span>
            <span className="summary-subtotal-val">{formatarMoeda(subtotal)}</span>
          </div>

          <div className="summary-line-row summary-qty-row">
            <span>Volume Total:</span>
            <span className="summary-qty-val">
              {totalItens} un ({carrinho.length} {carrinho.length === 1 ? 'produto' : 'produtos'})
            </span>
          </div>

          <div className="discount-input-group">
            <label htmlFor="input-desconto">Desconto (R$):</label>
            <div className="discount-field-row">
              <input
                id="input-desconto"
                type="number"
                step="0.01"
                min="0"
                max={subtotal}
                value={desconto === 0 ? '' : desconto}
                placeholder="0,00"
                onChange={(e) => setDesconto(e.target.value)}
                className="discount-input"
              />
            </div>
          </div>

          {/* Visor Gigante do Total a Pagar */}
          <div className="total-screen-box">
            <div className="total-screen-label">Total a Pagar</div>
            <div className="total-screen-amount">
              {formatarMoeda(total)}
            </div>
          </div>

          {/* Botão de Cancelar Venda / Limpar Carrinho no próprio Resumo */}
          {carrinho.length > 0 && (
            <button
              type="button"
              onClick={handleLimparCarrinho}
              className="btn-summary-clear-cart"
              title="Cancelar venda e limpar todos os itens (F9)"
            >
              <Trash2 size={16} />
              <span>Cancelar Venda (F9)</span>
            </button>
          )}
        </div>

        <div className="summary-footer">
          <button
            onClick={() => setMostrarCheckout(true)}
            disabled={carrinho.length === 0}
            className="btn-checkout-giant"
            title="Finalizar Venda (F4)"
          >
            <div className="btn-checkout-giant-content">
              <span className="btn-checkout-giant-title">FINALIZAR VENDA</span>
              <span className="btn-checkout-giant-sub">Pressione F4 ou clique para receber</span>
            </div>
            <ArrowRight size={24} className="btn-checkout-giant-arrow" />
          </button>
        </div>
      </div>

      {/* Modal de Pagamento / Checkout */}
      {mostrarCheckout && (
        <CheckoutModal
          total={total}
          desconto={totalDesconto}
          clientes={clientes}
          onConfirmar={handleConfirmarVenda}
          onClose={() => setMostrarCheckout(false)}
        />
      )}

      {/* Modal de Recibo Térmico */}
      {mostrarRecibo && (
        <ReceiptModal
          venda={ultimaVendaFinalizada}
          itens={itensUltimaVenda}
          config={config}
          onClose={handleFecharRecibo}
        />
      )}
      </div>

      {/* Barra Fixa Inferior de Fechamento (Exibida em Tablets e Telas Menores) */}
      <div className="pos-mobile-bottom-bar">
        <div className="pos-mobile-total-box">
          <span className="pos-mobile-total-label">TOTAL A PAGAR ({totalItens} un):</span>
          <span className="pos-mobile-total-amount">{formatarMoeda(total)}</span>
        </div>
        <button
          type="button"
          onClick={() => setMostrarCheckout(true)}
          disabled={carrinho.length === 0}
          className="btn-mobile-checkout"
          title="Finalizar Venda"
        >
          <span>FINALIZAR VENDA</span>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
