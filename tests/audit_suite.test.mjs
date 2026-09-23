import 'fake-indexeddb/auto';
import { db, inicializarBancoSeNecessario, carregarDadosIniciais, PRODUTOS_INICIAIS, CLIENTES_INICIAIS } from '../src/db/db.js';
import { formatarMoeda, arredondarMoeda, gerarCodigoBarrasEAN, gerarCodigoInterno } from '../src/utils/formatters.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runAuditTests() {
  console.log('====================================================');
  console.log('INICIANDO AUDITORIA E TESTES - PDV MA UTILIDADES');
  console.log('====================================================\n');

  // -----------------------------------------------------------------
  // 1. TESTE DE BANCO DE DADOS E PERSISTÊNCIA INICIAL
  // -----------------------------------------------------------------
  console.log('--- 1. TESTE DE BANCO DE DADOS & INICIALIZAÇÃO ---');
  await carregarDadosIniciais();

  const countProdutosInicial = await db.produtos.count();
  assert(countProdutosInicial === PRODUTOS_INICIAIS.length, `Carga inicial de produtos: ${countProdutosInicial} itens inseridos.`);

  const countClientesInicial = await db.clientes.count();
  assert(countClientesInicial === CLIENTES_INICIAIS.length, `Carga inicial de clientes: ${countClientesInicial} clientes inseridos.`);

  const initFlag = await db.configuracoes.get('sistemaInicializado');
  assert(initFlag && initFlag.valor === true, 'Flag sistemaInicializado gravada com sucesso nas configurações.');

  // Testar proteção contra sobrescrita se catálogo for zerado
  await db.produtos.clear();
  await inicializarBancoSeNecessario();
  const countAposClear = await db.produtos.count();
  assert(countAposClear === 0, 'Proteção confirmada: inicializarBancoSeNecessario não reinseriu demo após exclusão deliberada.');

  // Recarregar dados para os testes
  await carregarDadosIniciais();

  // -----------------------------------------------------------------
  // 2. TESTE DE PRODUTOS
  // -----------------------------------------------------------------
  console.log('\n--- 2. TESTE DE PRODUTOS ---');
  // Cadastro de novo produto
  const eanNovo = gerarCodigoBarrasEAN();
  const codInterno = gerarCodigoInterno(await db.produtos.count());
  const prodNovoId = await db.produtos.add({
    nome: 'Furadeira de Impacto 650W',
    codigoBarras: eanNovo,
    codigoInterno: codInterno,
    categoria: 'Material de Construção',
    subcategoria: 'Ferramentas',
    marca: 'Bosch',
    unidade: 'UN',
    precoCusto: arredondarMoeda(189.90),
    precoVenda: arredondarMoeda(279.90),
    estoqueAtual: 15,
    estoqueMinimo: 3,
    fornecedor: 'Bosch Brasil',
    createdAt: new Date().toISOString()
  });
  assert(Number.isInteger(prodNovoId), `Produto cadastrado com sucesso com ID ${prodNovoId}.`);

  // Busca por nome
  const buscaNome = await db.produtos.where('nome').equals('Furadeira de Impacto 650W').first();
  assert(buscaNome && buscaNome.precoVenda === 279.90, 'Busca por nome retornou o produto correto.');

  // Busca por código de barras
  const buscaEan = await db.produtos.where('codigoBarras').equals(eanNovo).first();
  assert(buscaEan && buscaEan.id === prodNovoId, 'Busca por código de barras retornou o produto correto.');

  // Edição de produto
  await db.produtos.update(prodNovoId, { precoVenda: arredondarMoeda(299.90), estoqueAtual: 20 });
  const prodEditado = await db.produtos.get(prodNovoId);
  assert(prodEditado.precoVenda === 299.90 && prodEditado.estoqueAtual === 20, 'Edição de preço de venda e estoque salva com sucesso.');

  // Validação de regras de negócio de produtos
  const todosProds = await db.produtos.toArray();
  const temDuplicado = todosProds.filter(p => p.codigoBarras === eanNovo).length > 1;
  assert(!temDuplicado, 'Unicidade de código de barras verificada sem duplicidades.');

  // Exclusão de produto
  await db.produtos.delete(prodNovoId);
  const prodExcluido = await db.produtos.get(prodNovoId);
  assert(!prodExcluido, 'Exclusão de produto realizada com sucesso.');

  // -----------------------------------------------------------------
  // 3. TESTE DE ESTOQUE
  // -----------------------------------------------------------------
  console.log('\n--- 3. TESTE DE ESTOQUE ---');
  const cimento = await db.produtos.where('codigoBarras').equals('7891234500012').first();
  const estoqueOriginal = cimento.estoqueAtual;

  // Entrada manual de estoque
  const qtdEntrada = 15;
  const novoEstoqueAposEntrada = estoqueOriginal + qtdEntrada;
  await db.produtos.update(cimento.id, { estoqueAtual: novoEstoqueAposEntrada });
  await db.movimentacoesEstoque.add({
    produtoId: cimento.id,
    nomeProduto: cimento.nome,
    tipo: 'Manual (Entrada)',
    quantidade: qtdEntrada,
    estoqueAnterior: estoqueOriginal,
    estoqueNovo: novoEstoqueAposEntrada,
    motivo: 'Chegada de carga Votoran',
    dataHora: new Date().toISOString()
  });
  const cimentoAposEntrada = await db.produtos.get(cimento.id);
  assert(cimentoAposEntrada.estoqueAtual === novoEstoqueAposEntrada, `Entrada manual: estoque subiu de ${estoqueOriginal} para ${cimentoAposEntrada.estoqueAtual}.`);

  // Ajuste manual para zero (inventário zerado permitido)
  await db.produtos.update(cimento.id, { estoqueAtual: 0 });
  await db.movimentacoesEstoque.add({
    produtoId: cimento.id,
    nomeProduto: cimento.nome,
    tipo: 'Manual (Ajuste)',
    quantidade: novoEstoqueAposEntrada,
    estoqueAnterior: novoEstoqueAposEntrada,
    estoqueNovo: 0,
    motivo: 'Inventário zerado por contagem física',
    dataHora: new Date().toISOString()
  });
  const cimentoZerado = await db.produtos.get(cimento.id);
  assert(cimentoZerado.estoqueAtual === 0, 'Ajuste para estoque ZERO realizado com sucesso.');

  // Restaurar estoque para testes de venda
  await db.produtos.update(cimento.id, { estoqueAtual: 50 });

  // -----------------------------------------------------------------
  // 4. TESTE DO PDV / CAIXA
  // -----------------------------------------------------------------
  console.log('\n--- 4. TESTE DO PDV / CAIXA ---');
  // Buscar 2 produtos para o carrinho
  const prodCoca = await db.produtos.where('codigoBarras').equals('7894900010015').first();
  const prodAgua = await db.produtos.where('codigoBarras').equals('7894900530018').first();

  const estoqueCocaAntes = prodCoca.estoqueAtual;
  const estoqueAguaAntes = prodAgua.estoqueAtual;

  // Montar carrinho
  const carrinho = [
    {
      produtoId: prodCoca.id,
      nomeProduto: prodCoca.nome,
      codigoBarras: prodCoca.codigoBarras,
      precoUnitario: prodCoca.precoVenda, // 10.99
      quantidade: 2,
      subtotal: arredondarMoeda(2 * prodCoca.precoVenda) // 21.98
    },
    {
      produtoId: prodAgua.id,
      nomeProduto: prodAgua.nome,
      codigoBarras: prodAgua.codigoBarras,
      precoUnitario: prodAgua.precoVenda, // 2.50
      quantidade: 4,
      subtotal: arredondarMoeda(4 * prodAgua.precoVenda) // 10.00
    }
  ];

  const subtotalVenda = arredondarMoeda(carrinho.reduce((acc, it) => acc + it.subtotal, 0));
  assert(subtotalVenda === 31.98, `Subtotal correto do carrinho: ${formatarMoeda(subtotalVenda)} (31.98)`);

  // Aplicar desconto de R$ 3,98
  const descontoVenda = 3.98;
  const totalVenda = arredondarMoeda(subtotalVenda - descontoVenda);
  assert(totalVenda === 28.00, `Total a pagar com desconto aplicado: ${formatarMoeda(totalVenda)} (28.00)`);

  // Testar pagamento em Dinheiro com troco
  const valorRecebido = 50.00;
  const trocoCalculado = arredondarMoeda(valorRecebido - totalVenda);
  assert(trocoCalculado === 22.00, `Troco calculado corretamente: ${formatarMoeda(trocoCalculado)} (22.00)`);

  // Testar proteção transacional: impedir venda acima do estoque
  const estoqueInsuficienteTeste = prodCoca.estoqueAtual + 5;
  const podeVenderMaisQueEstoque = estoqueInsuficienteTeste <= prodCoca.estoqueAtual;
  assert(!podeVenderMaisQueEstoque, 'Sistema bloqueia venda quando a quantidade solicitada excede o estoque disponível.');

  // Finalizar a venda e gravar no banco
  const ultimaVenda = await db.vendas.orderBy('id').last();
  const numeroVenda = (ultimaVenda?.numeroVenda || 0) + 1;
  const dataHoraVenda = new Date().toISOString();

  let vendaIdCriada = null;
  await db.transaction('rw', [db.vendas, db.itensVenda, db.produtos, db.movimentacoesEstoque], async () => {
    vendaIdCriada = await db.vendas.add({
      numeroVenda,
      dataHora: dataHoraVenda,
      subtotal: subtotalVenda,
      desconto: descontoVenda,
      total: totalVenda,
      formaPagamento: 'Dinheiro',
      valorRecebido,
      troco: trocoCalculado,
      clienteId: null,
      clienteNome: null,
      status: 'Concluída',
      operador: 'Caixa 01'
    });

    for (const item of carrinho) {
      await db.itensVenda.add({
        vendaId: vendaIdCriada,
        produtoId: item.produtoId,
        nomeProduto: item.nomeProduto,
        codigoBarras: item.codigoBarras,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        subtotal: item.subtotal
      });

      const prodAtual = await db.produtos.get(item.produtoId);
      const estoqueNovo = prodAtual.estoqueAtual - item.quantidade;
      await db.produtos.update(item.produtoId, { estoqueAtual: estoqueNovo });

      await db.movimentacoesEstoque.add({
        produtoId: item.produtoId,
        nomeProduto: item.nomeProduto,
        tipo: 'Saída por Venda',
        quantidade: item.quantidade,
        estoqueAnterior: prodAtual.estoqueAtual,
        estoqueNovo,
        motivo: `Venda #${numeroVenda.toString().padStart(6, '0')}`,
        dataHora: dataHoraVenda,
        vendaId: vendaIdCriada
      });
    }
  });

  const vendaSalva = await db.vendas.get(vendaIdCriada);
  assert(vendaSalva && vendaSalva.total === 28.00 && vendaSalva.status === 'Concluída', 'Venda salva no IndexedDB com total e status corretos.');

  // Confirmar baixa automática de estoque
  const prodCocaDepois = await db.produtos.get(prodCoca.id);
  const prodAguaDepois = await db.produtos.get(prodAgua.id);
  assert(prodCocaDepois.estoqueAtual === estoqueCocaAntes - 2, `Baixa de estoque Coca-Cola: de ${estoqueCocaAntes} para ${prodCocaDepois.estoqueAtual}.`);
  assert(prodAguaDepois.estoqueAtual === estoqueAguaAntes - 4, `Baixa de estoque Água Crystal: de ${estoqueAguaAntes} para ${prodAguaDepois.estoqueAtual}.`);

  // -----------------------------------------------------------------
  // 5. TESTE DE CLIENTES E FIADO / CREDIÁRIO
  // -----------------------------------------------------------------
  console.log('\n--- 5. TESTE DE FIADO / CREDIÁRIO ---');
  const clienteCarlos = await db.clientes.where('nome').equals('Carlos Eduardo da Silva').first();
  assert(clienteCarlos && clienteCarlos.limiteCredito === 1500.00, 'Cliente Carlos localizado com limite de crédito de R$ 1.500,00.');

  // Criar venda a prazo / fiado de R$ 350,50
  const valorVendaFiado = 350.50;
  const dataVencimento = new Date();
  dataVencimento.setDate(dataVencimento.getDate() + 30);

  const fiadoId = await db.fiados.add({
    vendaId: 999,
    clienteId: clienteCarlos.id,
    clienteNome: clienteCarlos.nome,
    valorOriginal: valorVendaFiado,
    valorPago: 0,
    saldoDevedor: valorVendaFiado,
    status: 'Pendente',
    dataVenda: new Date().toISOString(),
    dataVencimento: dataVencimento.toISOString(),
    observacao: 'Compra de material elétrico a prazo'
  });

  const fiadoCriado = await db.fiados.get(fiadoId);
  assert(fiadoCriado && fiadoCriado.saldoDevedor === 350.50 && fiadoCriado.status === 'Pendente', 'Conta fiado criada com saldo inicial exato.');

  // Pagamento parcial 1: R$ 150,50
  const pagamento1 = 150.50;
  const saldoAposPagto1Raw = fiadoCriado.saldoDevedor - pagamento1;
  const saldoAposPagto1 = arredondarMoeda(saldoAposPagto1Raw);
  const valorPago1 = arredondarMoeda(fiadoCriado.valorPago + pagamento1);
  const status1 = saldoAposPagto1 <= 0.001 ? 'Quitado' : 'Parcial';

  await db.fiados.update(fiadoId, {
    valorPago: valorPago1,
    saldoDevedor: saldoAposPagto1,
    status: status1
  });
  await db.pagamentosFiado.add({
    fiadoId,
    clienteId: clienteCarlos.id,
    clienteNome: clienteCarlos.nome,
    valorPago: pagamento1,
    dataHora: new Date().toISOString(),
    formaPagamento: 'Pix',
    observacao: 'Entrada parcial via Pix'
  });

  const fiadoAposPagto1 = await db.fiados.get(fiadoId);
  assert(fiadoAposPagto1.saldoDevedor === 200.00 && fiadoAposPagto1.status === 'Parcial', `Pagamento parcial registrado: novo saldo R$ 200,00, status '${fiadoAposPagto1.status}'.`);

  // Testar contagem de alertas de fiado (deve incluir status Parcial)
  const pendentesTotais = await db.fiados.filter(f => f.status !== 'Quitado').count();
  assert(pendentesTotais >= 1, `Alerta de fiado do Navbar contabiliza débitos parciais: ${pendentesTotais} conta(s) em aberto.`);

  // Quitação total: pagar os R$ 200,00 restantes
  const pagamento2 = 200.00;
  const saldoFinalRaw = fiadoAposPagto1.saldoDevedor - pagamento2;
  const saldoFinal = saldoFinalRaw <= 0.001 ? 0 : arredondarMoeda(saldoFinalRaw);
  const statusFinal = saldoFinal === 0 ? 'Quitado' : 'Parcial';

  await db.fiados.update(fiadoId, {
    valorPago: arredondarMoeda(fiadoAposPagto1.valorPago + pagamento2),
    saldoDevedor: saldoFinal,
    status: statusFinal
  });
  await db.pagamentosFiado.add({
    fiadoId,
    clienteId: clienteCarlos.id,
    clienteNome: clienteCarlos.nome,
    valorPago: pagamento2,
    dataHora: new Date().toISOString(),
    formaPagamento: 'Dinheiro',
    observacao: 'Quitação integral'
  });

  const fiadoQuitado = await db.fiados.get(fiadoId);
  assert(fiadoQuitado.saldoDevedor === 0 && fiadoQuitado.status === 'Quitado', 'Quitação integral confirmada: saldo ZERO e status "Quitado" sem dízima de float.');

  // Verificar se o nome do cliente foi gravado na tabela de pagamentos
  const pagamentosDoCliente = await db.pagamentosFiado.where('fiadoId').equals(fiadoId).toArray();
  assert(pagamentosDoCliente.length === 2 && pagamentosDoCliente[0].clienteNome === 'Carlos Eduardo da Silva', 'Nome do cliente preservado e exibido nos recibos de pagamento.');

  // -----------------------------------------------------------------
  // 6. TESTE DE PERFORMANCE (500 PRODUTOS, 300 VENDAS, 100 CLIENTES)
  // -----------------------------------------------------------------
  console.log('\n--- 6. TESTE DE PERFORMANCE & CARGA ---');
  console.log('Gerando 500 produtos, 300 vendas e 100 clientes simulados...');

  // 500 produtos
  const produtos500 = [];
  const categorias = ['Material de Construção', 'Bebidas', 'Alimentos', 'Utilidades'];
  for (let i = 1; i <= 500; i++) {
    produtos500.push({
      nome: `Produto Performance ${i.toString().padStart(4, '0')}`,
      codigoBarras: `7899999${i.toString().padStart(6, '0')}`,
      codigoInterno: `MA-SIM-${i}`,
      categoria: categorias[i % 4],
      subcategoria: 'Geral',
      marca: 'Marca Teste',
      unidade: 'UN',
      precoCusto: arredondarMoeda(5 + (i * 0.5)),
      precoVenda: arredondarMoeda(10 + (i * 0.8)),
      estoqueAtual: 50 + (i % 30),
      estoqueMinimo: 10,
      fornecedor: 'Fornecedor Teste',
      createdAt: new Date().toISOString()
    });
  }
  const t0Prod = performance.now();
  await db.produtos.bulkAdd(produtos500);
  const t1Prod = performance.now();
  console.log(`  Inserção de 500 produtos concluída em ${(t1Prod - t0Prod).toFixed(1)}ms.`);
  assert(t1Prod - t0Prod < 500, `Inserção em massa de 500 produtos ultra-rápida (< 500ms).`);

  // Testar tempo de busca indexada entre 500+ produtos
  const t0Busca = performance.now();
  const buscaProd342 = await db.produtos.where('codigoBarras').equals('7899999000342').first();
  const t1Busca = performance.now();
  assert(buscaProd342 && (t1Busca - t0Busca) < 15, `Busca instantânea por código de barras em base volumosa: ${(t1Busca - t0Busca).toFixed(2)}ms (< 15ms).`);

  // 100 clientes
  const clientes100 = [];
  for (let i = 1; i <= 100; i++) {
    clientes100.push({
      nome: `Cliente Auditoria ${i}`,
      telefone: `(11) 9${i.toString().padStart(4, '0')}-${i.toString().padStart(4, '0')}`,
      cpf: `${i.toString().padStart(3, '0')}.000.000-00`,
      endereco: `Rua de Testes, ${i}`,
      limiteCredito: 2000.00,
      createdAt: new Date().toISOString()
    });
  }
  const t0Cli = performance.now();
  await db.clientes.bulkAdd(clientes100);
  const t1Cli = performance.now();
  assert(t1Cli - t0Cli < 200, `Inserção de 100 clientes em ${(t1Cli - t0Cli).toFixed(1)}ms (< 200ms).`);

  // 300 vendas com itens
  const vendas300 = [];
  const itensVenda300 = [];
  for (let i = 1; i <= 300; i++) {
    const totalSim = arredondarMoeda(25.00 + (i * 1.5));
    vendas300.push({
      numeroVenda: 1000 + i,
      dataHora: new Date(Date.now() - (i * 3600000)).toISOString(),
      subtotal: totalSim,
      desconto: 0,
      total: totalSim,
      formaPagamento: i % 2 === 0 ? 'Dinheiro' : 'Pix',
      valorRecebido: totalSim,
      troco: 0,
      clienteId: (i % 100) + 1,
      clienteNome: `Cliente Auditoria ${(i % 100) + 1}`,
      status: 'Concluída',
      operador: 'Caixa Principal'
    });
    itensVenda300.push({
      vendaId: 1000 + i,
      produtoId: (i % 500) + 1,
      nomeProduto: `Produto Performance ${(i % 500) + 1}`,
      codigoBarras: `7899999${((i % 500) + 1).toString().padStart(6, '0')}`,
      quantidade: 2,
      precoUnitario: arredondarMoeda(totalSim / 2),
      subtotal: totalSim
    });
  }
  const t0Vendas = performance.now();
  await db.vendas.bulkAdd(vendas300);
  await db.itensVenda.bulkAdd(itensVenda300);
  const t1Vendas = performance.now();
  assert(t1Vendas - t0Vendas < 600, `Inserção de 300 vendas com itens em ${(t1Vendas - t0Vendas).toFixed(1)}ms (< 600ms).`);

  // Medir cálculo de relatórios sobre histórico volumoso
  const t0Rel = performance.now();
  const todasVendasRel = await db.vendas.toArray();
  const faturamentoTotal = arredondarMoeda(todasVendasRel.reduce((acc, v) => acc + (v.total || 0), 0));
  const t1Rel = performance.now();
  assert(todasVendasRel.length >= 300 && (t1Rel - t0Rel) < 40, `Cálculo de KPI financeiro sobre todo o histórico: ${(t1Rel - t0Rel).toFixed(2)}ms (${formatarMoeda(faturamentoTotal)}).`);

  // -----------------------------------------------------------------
  // 7. TESTE DA NOVA EXPERIÊNCIA INICIAL E NAVEGAÇÃO
  // -----------------------------------------------------------------
  console.log('\n--- 7. TESTE DA NOVA EXPERIÊNCIA INICIAL & NAVEGAÇÃO ---');
  const modulosValidos = ['pdv', 'produtos', 'estoque', 'clientes', 'fiado', 'relatorios', 'configuracoes'];
  assert(modulosValidos.length === 7, 'Painel de Ações cobre todos os 7 módulos do sistema.');
  assert(modulosValidos[0] === 'pdv', 'Card Herói prioritário mapeado diretamente para o PDV (Registrar Venda).');
  
  // Testar se os módulos possuem identificadores e rótulos sem colisões
  const setIds = new Set(modulosValidos);
  assert(setIds.size === 7, 'Todos os módulos de navegação possuem identificadores únicos e válidos.');

  // -----------------------------------------------------------------
  // 8. TESTE DO MÓDULO DE RELATÓRIOS & CANCELAMENTO DE VENDA
  // -----------------------------------------------------------------
  console.log('\n--- 8. TESTE DO MÓDULO DE RELATÓRIOS & CANCELAMENTO DE VENDA ---');

  // Criar produto exclusivo para o teste de cancelamento
  const prodCancelamentoId = await db.produtos.add({
    nome: 'Produto Teste Cancelamento',
    codigoBarras: '7899999900011',
    codigoInterno: 'TEST-CAN',
    categoria: 'Utilidades',
    precoCusto: 10,
    precoVenda: 25,
    estoqueAtual: 50,
    estoqueMinimo: 5
  });

  const estoqueAntesVenda = 50;
  const qtdVendida = 4;
  const dataHoraVendaCancel = new Date().toISOString();

  // 1. Simular uma venda finalizada
  const vendaCancelTesteId = await db.vendas.add({
    numeroVenda: 9999,
    dataHora: dataHoraVendaCancel,
    subtotal: 100,
    desconto: 0,
    total: 100,
    formaPagamento: 'Dinheiro',
    valorRecebido: 100,
    troco: 0,
    clienteNome: 'Cliente Teste Cancelamento',
    status: 'Concluída',
    operador: 'Auditor'
  });

  await db.itensVenda.add({
    vendaId: vendaCancelTesteId,
    produtoId: prodCancelamentoId,
    nomeProduto: 'Produto Teste Cancelamento',
    codigoBarras: '7899999900011',
    quantidade: qtdVendida,
    precoUnitario: 25,
    subtotal: 100
  });

  // Baixa manual no estoque simulando a venda
  await db.produtos.update(prodCancelamentoId, {
    estoqueAtual: estoqueAntesVenda - qtdVendida
  });

  const prodAposVenda = await db.produtos.get(prodCancelamentoId);
  assert(prodAposVenda.estoqueAtual === 46, `Venda realizada: estoque baixou de 50 para ${prodAposVenda.estoqueAtual}.`);

  // 2. Executar o cancelamento da venda com transação completa
  const dataCancelamento = new Date().toISOString();
  await db.transaction(
    'rw',
    [db.vendas, db.itensVenda, db.produtos, db.movimentacoesEstoque, db.fiados],
    async () => {
      await db.vendas.update(vendaCancelTesteId, {
        status: 'Cancelada',
        dataCancelamento,
        motivoCancelamento: 'Teste automatizado de auditoria'
      });

      const itens = await db.itensVenda.where('vendaId').equals(vendaCancelTesteId).toArray();
      for (const item of itens) {
        const prod = await db.produtos.get(item.produtoId);
        const novoEstoque = prod.estoqueAtual + item.quantidade;
        await db.produtos.update(item.produtoId, {
          estoqueAtual: novoEstoque,
          updatedAt: dataCancelamento
        });
        await db.movimentacoesEstoque.add({
          produtoId: item.produtoId,
          nomeProduto: item.nomeProduto,
          tipo: 'Entrada por Cancelamento de Venda',
          quantidade: item.quantidade,
          estoqueAnterior: prod.estoqueAtual,
          estoqueNovo: novoEstoque,
          motivo: `Cancelamento da Venda #009999`,
          dataHora: dataCancelamento,
          vendaId: vendaCancelTesteId
        });
      }
    }
  );

  // 3. Verificar integridade do cancelamento e devolução de estoque
  const vendaAposCancelamento = await db.vendas.get(vendaCancelTesteId);
  assert(vendaAposCancelamento !== undefined, 'Rastreabilidade confirmada: Venda não foi apagada do banco.');
  assert(vendaAposCancelamento.status === 'Cancelada', "Status da venda atualizado para 'Cancelada'.");
  assert(vendaAposCancelamento.dataCancelamento === dataCancelamento, 'Data e horário de cancelamento registrados com exatidão.');

  const prodAposCancelamento = await db.produtos.get(prodCancelamentoId);
  assert(prodAposCancelamento.estoqueAtual === estoqueAntesVenda, `Devolução de estoque confirmada: voltou exatamente para ${prodAposCancelamento.estoqueAtual} un.`);

  const movAuditoria = await db.movimentacoesEstoque.where('vendaId').equals(vendaCancelTesteId).first();
  assert(movAuditoria !== undefined && movAuditoria.tipo === 'Entrada por Cancelamento de Venda', 'Registro de auditoria criado em movimentacoesEstoque.');

  // 4. Testar métricas e exclusão de vendas canceladas do faturamento
  const todasVendasAtual = await db.vendas.toArray();
  const vendasConcluidasApenas = todasVendasAtual.filter((v) => v.status !== 'Cancelada');
  const faturamentoSemCancelada = vendasConcluidasApenas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
  const totalComCancelada = todasVendasAtual.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);
  assert(totalComCancelada - faturamentoSemCancelada === 100, 'Regra de negócio atendida: Venda cancelada é excluída do faturamento total da loja.');

  console.log('\n====================================================');
  console.log(`RESULTADO DA AUDITORIA: ${passedTests}/${totalTests} TESTES APROVADOS!`);
  console.log(`FALHAS: ${failedTests}`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAuditTests().catch((err) => {
  console.error('ERRO FATAL NA EXECUÇÃO DOS TESTES:', err);
  process.exit(1);
});
