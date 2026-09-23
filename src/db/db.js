import Dexie from 'dexie';

export const db = new Dexie('MAUtilidadesDB');

db.version(1).stores({
  produtos: '++id, nome, codigoBarras, codigoInterno, categoria, subcategoria, marca, unidade, precoCusto, precoVenda, estoqueAtual, estoqueMinimo, fornecedor',
  vendas: '++id, numeroVenda, dataHora, total, formaPagamento, clienteId, clienteNome, status, operador',
  itensVenda: '++id, vendaId, produtoId, nomeProduto, codigoBarras, quantidade, precoUnitario, subtotal',
  clientes: '++id, nome, telefone, cpf, endereco, observacoes, limiteCredito, createdAt',
  fiados: '++id, vendaId, clienteId, clienteNome, valorOriginal, valorPago, saldoDevedor, status, dataVenda, dataVencimento',
  pagamentosFiado: '++id, fiadoId, clienteId, valorPago, dataHora, formaPagamento',
  movimentacoesEstoque: '++id, produtoId, nomeProduto, tipo, quantidade, estoqueAnterior, estoqueNovo, motivo, dataHora, vendaId',
  configuracoes: 'chave, valor'
});

// Categorias e subcategorias predefinidas da MA Utilidades
export const CATEGORIAS_PADRAO = [
  {
    id: 'construcao',
    nome: 'Material de Construção',
    icone: 'Hammer',
    cor: '#EAB308',
    subcategorias: ['Cimento', 'Ferramentas', 'Hidráulica', 'Elétrica', 'Tintas', 'Ferragens']
  },
  {
    id: 'bebidas',
    nome: 'Bebidas',
    icone: 'CupSoda',
    cor: '#3B82F6',
    subcategorias: ['Refrigerantes', 'Água', 'Energéticos', 'Bebidas diversas']
  },
  {
    id: 'alimentos',
    nome: 'Alimentos',
    icone: 'Cookie',
    cor: '#F97316',
    subcategorias: ['Snacks', 'Doces', 'Produtos rápidos']
  },
  {
    id: 'utilidades',
    nome: 'Utilidades',
    icone: 'Sparkles',
    cor: '#10B981',
    subcategorias: ['Limpeza', 'Casa', 'Outros']
  }
];

// Dados iniciais realistas para a loja híbrida MA Utilidades
export const PRODUTOS_INICIAIS = [
  // MATERIAL DE CONSTRUÇÃO
  {
    nome: 'Cimento CP II 50kg Votoran',
    codigoBarras: '7891234500012',
    codigoInterno: 'MA-001',
    categoria: 'Material de Construção',
    subcategoria: 'Cimento',
    marca: 'Votoran',
    unidade: 'SC',
    precoCusto: 28.50,
    precoVenda: 36.90,
    estoqueAtual: 85,
    estoqueMinimo: 20,
    fornecedor: 'Votorantim Cimentos',
    foto: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Tubo Soldável PVC 25mm (3/4") 6 Metros',
    codigoBarras: '7891234500029',
    codigoInterno: 'MA-002',
    categoria: 'Material de Construção',
    subcategoria: 'Hidráulica',
    marca: 'Tigre',
    unidade: 'UN',
    precoCusto: 14.20,
    precoVenda: 22.50,
    estoqueAtual: 40,
    estoqueMinimo: 15,
    fornecedor: 'Tigre Tubos e Conexões',
    foto: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Fio Flexível 2,5mm 750V Rolo 100m Azul',
    codigoBarras: '7891234500036',
    codigoInterno: 'MA-003',
    categoria: 'Material de Construção',
    subcategoria: 'Elétrica',
    marca: 'Sil Fios',
    unidade: 'RL',
    precoCusto: 145.00,
    precoVenda: 198.00,
    estoqueAtual: 18,
    estoqueMinimo: 5,
    fornecedor: 'Sil Fios e Cabos',
    foto: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Martelo Unha Polido 27mm Cabo Fibra',
    codigoBarras: '7891234500043',
    codigoInterno: 'MA-004',
    categoria: 'Material de Construção',
    subcategoria: 'Ferramentas',
    marca: 'Tramontina',
    unidade: 'UN',
    precoCusto: 24.00,
    precoVenda: 38.90,
    estoqueAtual: 14,
    estoqueMinimo: 4,
    fornecedor: 'Tramontina S/A',
    foto: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Tinta Acrílica Fosca Rende Muito Branco Neve 18L',
    codigoBarras: '7891234500050',
    codigoInterno: 'MA-005',
    categoria: 'Material de Construção',
    subcategoria: 'Tintas',
    marca: 'Coral',
    unidade: 'LT',
    precoCusto: 240.00,
    precoVenda: 329.90,
    estoqueAtual: 6,
    estoqueMinimo: 5,
    fornecedor: 'AkzoNobel Coral',
    foto: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Fita Isolante 19mm x 20m Imperial',
    codigoBarras: '7891234500067',
    codigoInterno: 'MA-006',
    categoria: 'Material de Construção',
    subcategoria: 'Elétrica',
    marca: '3M',
    unidade: 'UN',
    precoCusto: 4.80,
    precoVenda: 8.50,
    estoqueAtual: 4, // Estoque baixo para alerta
    estoqueMinimo: 10,
    fornecedor: '3M do Brasil',
    foto: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Torneira para Pia de Parede 1158 Metal Cromado',
    codigoBarras: '7891234500074',
    codigoInterno: 'MA-007',
    categoria: 'Material de Construção',
    subcategoria: 'Hidráulica',
    marca: 'Docol',
    unidade: 'UN',
    precoCusto: 38.00,
    precoVenda: 59.90,
    estoqueAtual: 9,
    estoqueMinimo: 3,
    fornecedor: 'Docol Metais',
    foto: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Jogo de Chaves Fenda e Phillips 6 Peças',
    codigoBarras: '7891234500081',
    codigoInterno: 'MA-008',
    categoria: 'Material de Construção',
    subcategoria: 'Ferramentas',
    marca: 'Vonder',
    unidade: 'JG',
    precoCusto: 22.00,
    precoVenda: 37.00,
    estoqueAtual: 12,
    estoqueMinimo: 4,
    fornecedor: 'Grupo OVD',
    foto: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=300&auto=format&fit=crop&q=60'
  },

  // BEBIDAS
  {
    nome: 'Refrigerante Coca-Cola Original Garrafa 2L',
    codigoBarras: '7894900010015',
    codigoInterno: 'MA-101',
    categoria: 'Bebidas',
    subcategoria: 'Refrigerantes',
    marca: 'Coca-Cola',
    unidade: 'UN',
    precoCusto: 7.20,
    precoVenda: 10.99,
    estoqueAtual: 64,
    estoqueMinimo: 24,
    fornecedor: 'Coca-Cola FEMSA',
    foto: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Refrigerante Guaraná Antarctica Pet 2L',
    codigoBarras: '7891991000840',
    codigoInterno: 'MA-102',
    categoria: 'Bebidas',
    subcategoria: 'Refrigerantes',
    marca: 'Antarctica',
    unidade: 'UN',
    precoCusto: 5.80,
    precoVenda: 8.99,
    estoqueAtual: 42,
    estoqueMinimo: 18,
    fornecedor: 'Ambev',
    foto: 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Água Mineral Crystal Sem Gás 500ml',
    codigoBarras: '7894900530018',
    codigoInterno: 'MA-103',
    categoria: 'Bebidas',
    subcategoria: 'Água',
    marca: 'Crystal',
    unidade: 'UN',
    precoCusto: 1.10,
    precoVenda: 2.50,
    estoqueAtual: 120,
    estoqueMinimo: 30,
    fornecedor: 'Coca-Cola FEMSA',
    foto: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Água Mineral Crystal Com Gás 500ml',
    codigoBarras: '7894900530025',
    codigoInterno: 'MA-104',
    categoria: 'Bebidas',
    subcategoria: 'Água',
    marca: 'Crystal',
    unidade: 'UN',
    precoCusto: 1.30,
    precoVenda: 3.00,
    estoqueAtual: 58,
    estoqueMinimo: 20,
    fornecedor: 'Coca-Cola FEMSA',
    foto: 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Energético Red Bull Energy Drink 250ml',
    codigoBarras: '9002490100070',
    codigoInterno: 'MA-105',
    categoria: 'Bebidas',
    subcategoria: 'Energéticos',
    marca: 'Red Bull',
    unidade: 'UN',
    precoCusto: 6.90,
    precoVenda: 9.99,
    estoqueAtual: 35,
    estoqueMinimo: 15,
    fornecedor: 'Red Bull do Brasil',
    foto: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Suco Del Valle 100% Uva 1 Litro',
    codigoBarras: '7894900680010',
    codigoInterno: 'MA-106',
    categoria: 'Bebidas',
    subcategoria: 'Bebidas diversas',
    marca: 'Del Valle',
    unidade: 'UN',
    precoCusto: 6.20,
    precoVenda: 9.50,
    estoqueAtual: 3, // Estoque baixo
    estoqueMinimo: 10,
    fornecedor: 'Coca-Cola FEMSA',
    foto: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Cerveja Heineken Puro Malte Long Neck 330ml',
    codigoBarras: '7896045505013',
    codigoInterno: 'MA-107',
    categoria: 'Bebidas',
    subcategoria: 'Bebidas diversas',
    marca: 'Heineken',
    unidade: 'UN',
    precoCusto: 5.10,
    precoVenda: 7.90,
    estoqueAtual: 72,
    estoqueMinimo: 24,
    fornecedor: 'Grupo Heineken',
    foto: 'https://images.unsplash.com/photo-1608270111559-0097f5945e41?w=300&auto=format&fit=crop&q=60'
  },

  // ALIMENTOS
  {
    nome: 'Batata Pringles Original 114g',
    codigoBarras: '7896000701023',
    codigoInterno: 'MA-201',
    categoria: 'Alimentos',
    subcategoria: 'Snacks',
    marca: 'Pringles',
    unidade: 'UN',
    precoCusto: 8.50,
    precoVenda: 13.90,
    estoqueAtual: 28,
    estoqueMinimo: 12,
    fornecedor: 'Kellogg Brasil',
    foto: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Salgadinho Doritos Queijo Nacho 140g',
    codigoBarras: '7892840222949',
    codigoInterno: 'MA-202',
    categoria: 'Alimentos',
    subcategoria: 'Snacks',
    marca: 'Doritos',
    unidade: 'UN',
    precoCusto: 7.80,
    precoVenda: 12.50,
    estoqueAtual: 30,
    estoqueMinimo: 10,
    fornecedor: 'PepsiCo do Brasil',
    foto: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Chocolate Barra Nestlé Classic ao Leite 80g',
    codigoBarras: '7613035987012',
    codigoInterno: 'MA-203',
    categoria: 'Alimentos',
    subcategoria: 'Doces',
    marca: 'Nestlé',
    unidade: 'UN',
    precoCusto: 4.10,
    precoVenda: 6.99,
    estoqueAtual: 45,
    estoqueMinimo: 15,
    fornecedor: 'Nestlé Brasil',
    foto: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Biscoito Recheado Passatempo Chocolate 130g',
    codigoBarras: '7891000100101',
    codigoInterno: 'MA-204',
    categoria: 'Alimentos',
    subcategoria: 'Doces',
    marca: 'Passatempo',
    unidade: 'UN',
    precoCusto: 2.30,
    precoVenda: 3.99,
    estoqueAtual: 50,
    estoqueMinimo: 20,
    fornecedor: 'Nestlé Brasil',
    foto: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Amendoim Japonês Dori 120g',
    codigoBarras: '7896058200158',
    codigoInterno: 'MA-205',
    categoria: 'Alimentos',
    subcategoria: 'Snacks',
    marca: 'Dori',
    unidade: 'UN',
    precoCusto: 2.20,
    precoVenda: 3.80,
    estoqueAtual: 40,
    estoqueMinimo: 12,
    fornecedor: 'Dori Alimentos',
    foto: 'https://images.unsplash.com/photo-1569466896818-335b1bedfcce?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Barra de Cereal Nutry Castanha e Chocolate 22g',
    codigoBarras: '7896005800017',
    codigoInterno: 'MA-206',
    categoria: 'Alimentos',
    subcategoria: 'Produtos rápidos',
    marca: 'Nutry',
    unidade: 'UN',
    precoCusto: 1.40,
    precoVenda: 2.50,
    estoqueAtual: 60,
    estoqueMinimo: 15,
    fornecedor: 'Nutry Alimentos',
    foto: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=300&auto=format&fit=crop&q=60'
  },

  // UTILIDADES
  {
    nome: 'Detergente Líquido Ypê Neutro 500ml',
    codigoBarras: '7896098900207',
    codigoInterno: 'MA-301',
    categoria: 'Utilidades',
    subcategoria: 'Limpeza',
    marca: 'Ypê',
    unidade: 'UN',
    precoCusto: 1.80,
    precoVenda: 2.89,
    estoqueAtual: 85,
    estoqueMinimo: 25,
    fornecedor: 'Química Amparo (Ypê)',
    foto: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Desinfetante Pinho Sol Original 1 Litro',
    codigoBarras: '7891024131501',
    codigoInterno: 'MA-302',
    categoria: 'Utilidades',
    subcategoria: 'Limpeza',
    marca: 'Pinho Sol',
    unidade: 'UN',
    precoCusto: 7.50,
    precoVenda: 11.90,
    estoqueAtual: 24,
    estoqueMinimo: 10,
    fornecedor: 'Colgate-Palmolive',
    foto: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Vassoura de Cerdas Macias com Cabo Noviça',
    codigoBarras: '7896001001019',
    codigoInterno: 'MA-303',
    categoria: 'Utilidades',
    subcategoria: 'Limpeza',
    marca: 'Bettanin',
    unidade: 'UN',
    precoCusto: 12.00,
    precoVenda: 19.90,
    estoqueAtual: 16,
    estoqueMinimo: 6,
    fornecedor: 'Bettanin S/A',
    foto: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Lâmpada LED Bulbo 9W Bivolt 6500K Branca',
    codigoBarras: '7898379480011',
    codigoInterno: 'MA-304',
    categoria: 'Utilidades',
    subcategoria: 'Casa',
    marca: 'Taschibra',
    unidade: 'UN',
    precoCusto: 4.90,
    precoVenda: 8.90,
    estoqueAtual: 52,
    estoqueMinimo: 15,
    fornecedor: 'Taschibra Iluminação',
    foto: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Balde Plástico com Alça Reforçada 12 Litros',
    codigoBarras: '7898000000101',
    codigoInterno: 'MA-305',
    categoria: 'Utilidades',
    subcategoria: 'Casa',
    marca: 'Sanremo',
    unidade: 'UN',
    precoCusto: 8.50,
    precoVenda: 14.90,
    estoqueAtual: 18,
    estoqueMinimo: 5,
    fornecedor: 'Sanremo Plásticos',
    foto: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=300&auto=format&fit=crop&q=60'
  },
  {
    nome: 'Fita Adesiva Multiuso Silver Tape 48mm x 5m',
    codigoBarras: '7891234500999',
    codigoInterno: 'MA-306',
    categoria: 'Utilidades',
    subcategoria: 'Outros',
    marca: 'Adelbras',
    unidade: 'UN',
    precoCusto: 6.90,
    precoVenda: 12.00,
    estoqueAtual: 2, // Estoque baixo
    estoqueMinimo: 8,
    fornecedor: 'Adelbras Fitas',
    foto: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=60'
  }
];

export const CLIENTES_INICIAIS = [
  {
    nome: 'Carlos Eduardo da Silva',
    telefone: '(11) 98765-4321',
    cpf: '123.456.789-00',
    endereco: 'Rua das Flores, 142 - Bairro Central',
    observacoes: 'Cliente fiel da parte de construção e reforma',
    limiteCredito: 1500.00,
    createdAt: new Date().toISOString()
  },
  {
    nome: 'Maria Aparecida dos Santos',
    telefone: '(11) 97654-3210',
    cpf: '234.567.890-11',
    endereco: 'Av. Brasil, 850, Apto 22',
    observacoes: 'Compra utilidades e mercearia semanalmente',
    limiteCredito: 800.00,
    createdAt: new Date().toISOString()
  },
  {
    nome: 'João Pedro de Oliveira',
    telefone: '(11) 99123-4567',
    cpf: '345.678.901-22',
    endereco: 'Rua Paraná, 55 - Jardim Primavera',
    observacoes: 'Eletricista autônomo, compra fios e materiais elétricos',
    limiteCredito: 2500.00,
    createdAt: new Date().toISOString()
  }
];

// Configurações padrão
export const CONFIG_PADRAO = {
  nomeEmpresa: 'MA Utilidades',
  slogan: 'Construção, Bebidas, Alimentos e Utilidades',
  cnpj: '12.345.678/0001-90',
  telefone: '(11) 3456-7890',
  whatsapp: '(11) 99999-8888',
  endereco: 'Av. Comercial, 1000 - Centro',
  numeroCaixa: '01',
  nomeOperador: 'Caixa Principal',
  somAtivo: true,
  mensagemRodape: 'Agradecemos a preferência! Volte sempre à MA Utilidades.'
};

// Inicialização e preenchimento de dados de demonstração caso o banco esteja vazio pela primeira vez
export async function inicializarBancoSeNecessario() {
  const initFlag = await db.configuracoes.get('sistemaInicializado');
  if (!initFlag) {
    await carregarDadosIniciais();
  }
}

export async function carregarDadosIniciais() {
  await db.transaction('rw', [db.produtos, db.clientes, db.configuracoes, db.movimentacoesEstoque], async () => {
    // Limpar anteriores se for recarga
    await db.produtos.clear();
    await db.clientes.clear();
    await db.configuracoes.clear();
    await db.movimentacoesEstoque.clear();

    // Inserir produtos
    const produtoIds = await db.produtos.bulkAdd(PRODUTOS_INICIAIS, { allKeys: true });

    // Inserir movimentações de estoque iniciais
    const dataHora = new Date().toISOString();
    const movs = PRODUTOS_INICIAIS.map((p, idx) => ({
      produtoId: produtoIds[idx],
      nomeProduto: p.nome,
      tipo: 'Entrada',
      quantidade: p.estoqueAtual,
      estoqueAnterior: 0,
      estoqueNovo: p.estoqueAtual,
      motivo: 'Carga inicial do estoque / Inventário de abertura',
      dataHora,
      vendaId: null
    }));
    await db.movimentacoesEstoque.bulkAdd(movs);

    // Inserir clientes
    await db.clientes.bulkAdd(CLIENTES_INICIAIS);

    // Inserir configurações
    for (const [chave, valor] of Object.entries(CONFIG_PADRAO)) {
      await db.configuracoes.put({ chave, valor });
    }

    // Marcar banco como inicializado para nunca sobrescrever involuntariamente
    await db.configuracoes.put({ chave: 'sistemaInicializado', valor: true });
  });
}
