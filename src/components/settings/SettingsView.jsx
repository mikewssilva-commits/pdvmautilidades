import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  Database
} from 'lucide-react';
import { db, carregarDadosIniciais } from '../../db/db';

export default function SettingsView({ config, onSalvarConfig, somAtivo, onToggleSom }) {
  const [formData, setFormData] = useState({
    nomeEmpresa: config?.nomeEmpresa || 'MA Utilidades',
    slogan: config?.slogan || 'Construção, Bebidas, Alimentos e Utilidades',
    cnpj: config?.cnpj || '12.345.678/0001-90',
    telefone: config?.telefone || '(11) 3456-7890',
    whatsapp: config?.whatsapp || '(11) 99999-8888',
    endereco: config?.endereco || 'Av. Comercial, 1000 - Centro',
    numeroCaixa: config?.numeroCaixa || '01',
    nomeOperador: config?.nomeOperador || 'Caixa Principal',
    mensagemRodape: config?.mensagemRodape || 'Agradecemos a preferência! Volte sempre à MA Utilidades.'
  });

  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const [chave, valor] of Object.entries(formData)) {
      await db.configuracoes.put({ chave, valor });
    }
    onSalvarConfig(formData);
    setFeedbackMsg('Configurações salvas com sucesso!');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Exportar Backup do Banco de Dados para arquivo JSON
  const handleExportarBackup = async () => {
    const dados = {
      produtos: await db.produtos.toArray(),
      vendas: await db.vendas.toArray(),
      itensVenda: await db.itensVenda.toArray(),
      clientes: await db.clientes.toArray(),
      fiados: await db.fiados.toArray(),
      pagamentosFiado: await db.pagamentosFiado.toArray(),
      movimentacoesEstoque: await db.movimentacoesEstoque.toArray(),
      configuracoes: await db.configuracoes.toArray(),
      exportadoEm: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ma_utilidades_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMsg('Backup do banco de dados exportado com sucesso!');
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  // Restaurar Backup a partir de arquivo JSON
  const handleImportarBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dados = JSON.parse(event.target.result);
        if (!dados.produtos) {
          alert('Arquivo de backup inválido.');
          return;
        }

        if (window.confirm('Atenção: A restauração substituirá todos os dados atuais pelo conteúdo do backup. Deseja prosseguir?')) {
          await db.transaction('rw', [
            db.produtos, db.vendas, db.itensVenda, db.clientes, db.fiados, db.pagamentosFiado, db.movimentacoesEstoque, db.configuracoes
          ], async () => {
            await db.produtos.clear();
            await db.vendas.clear();
            await db.itensVenda.clear();
            await db.clientes.clear();
            await db.fiados.clear();
            await db.pagamentosFiado.clear();
            await db.movimentacoesEstoque.clear();
            await db.configuracoes.clear();

            if (dados.produtos?.length) await db.produtos.bulkAdd(dados.produtos);
            if (dados.vendas?.length) await db.vendas.bulkAdd(dados.vendas);
            if (dados.itensVenda?.length) await db.itensVenda.bulkAdd(dados.itensVenda);
            if (dados.clientes?.length) await db.clientes.bulkAdd(dados.clientes);
            if (dados.fiados?.length) await db.fiados.bulkAdd(dados.fiados);
            if (dados.pagamentosFiado?.length) await db.pagamentosFiado.bulkAdd(dados.pagamentosFiado);
            if (dados.movimentacoesEstoque?.length) await db.movimentacoesEstoque.bulkAdd(dados.movimentacoesEstoque);
            if (dados.configuracoes?.length) {
              for (const c of dados.configuracoes) {
                await db.configuracoes.put(c);
              }
            }
          });

          alert('Backup restaurado com sucesso! O sistema será recarregado.');
          window.location.reload();
        }
      } catch (err) {
        alert('Erro ao processar o arquivo de backup.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Restaurar Catálogo de Demonstração Inicial
  const handleRestaurarCatalogoDemo = async () => {
    if (window.confirm('Deseja recarregar o catálogo demonstrativo inicial da MA Utilidades? (Produtos, estoque inicial e clientes de demonstração)')) {
      await carregarDadosIniciais();
      setFeedbackMsg('Catálogo inicial demonstrativo recarregado com sucesso!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="module-page-container">
      {/* Cabeçalho */}
      <div className="page-action-header">
        <div className="page-title-box">
          <h1>
            <Settings size={26} color="#EAB308" />
            Configurações do Sistema
          </h1>
          <p>
            Parâmetros do caixa, identificação comercial, dados de cupom e backup do banco de dados
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 18px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #BBF7D0' }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Formulário de Identificação e Caixa */}
        <div className="data-table-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Store size={20} color="#DC2626" />
            Identificação da Loja e Caixa
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group col-span-2">
                <label>Razão Social / Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={formData.nomeEmpresa}
                  onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label>Slogan Comercial</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>CNPJ</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Telefone / WhatsApp</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label>Endereço Comercial Completo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Número do Caixa</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.numeroCaixa}
                  onChange={(e) => setFormData({ ...formData, numeroCaixa: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Nome do Operador de Caixa</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nomeOperador}
                  onChange={(e) => setFormData({ ...formData, nomeOperador: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label>Mensagem de Rodapé do Cupom de Venda</label>
                <textarea
                  rows="2"
                  className="form-control"
                  value={formData.mensagemRodape}
                  onChange={(e) => setFormData({ ...formData, mensagemRodape: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button type="submit" className="btn-accent-action">
                <Save size={16} />
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Gerenciamento do Banco de Dados e Sons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card Som */}
          <div className="data-table-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {somAtivo ? <Volume2 size={20} color="#16A34A" /> : <VolumeX size={20} color="#64748B" />}
              Sons do PDV
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 14 }}>
              Feedback sonoro de leitor de código de barras e som de caixa ao finalizar venda.
            </p>
            <button
              onClick={onToggleSom}
              className="btn-primary-action"
              style={{ background: somAtivo ? '#16A34A' : '#475569' }}
            >
              {somAtivo ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{somAtivo ? 'Sons Ativados (Clique para Desativar)' : 'Sons Desativados (Clique para Ativar)'}</span>
            </button>
          </div>

          {/* Card Banco de Dados & Backup */}
          <div className="data-table-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={20} color="#2563EB" />
              Banco de Dados Estruturado (IndexedDB)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 16 }}>
              Todos os cadastros, vendas e movimentações ficam armazenados no navegador com persistência total.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handleExportarBackup} className="btn-primary-action" style={{ justifyContent: 'center' }}>
                <Download size={16} />
                Exportar Backup do Banco de Dados (JSON)
              </button>

              <label className="btn-primary-action" style={{ justifyContent: 'center', background: '#334155', cursor: 'pointer' }}>
                <Upload size={16} />
                <span>Restaurar Backup a partir de Arquivo (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportarBackup}
                />
              </label>

              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12, marginTop: 4 }}>
                <button
                  onClick={handleRestaurarCatalogoDemo}
                  className="btn-clear-cart"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }}
                >
                  <RotateCcw size={16} />
                  Recarregar Catálogo Inicial Demonstrativo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
