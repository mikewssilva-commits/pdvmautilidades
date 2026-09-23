import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/common/Header';
import Navbar from './components/common/Navbar';
import POSView from './components/pos/POSView';
import ProductsView from './components/products/ProductsView';
import StockView from './components/stock/StockView';
import CustomersView from './components/customers/CustomersView';
import CreditView from './components/credit/CreditView';
import ReportsView from './components/reports/ReportsView';
import SettingsView from './components/settings/SettingsView';
import HomeView from './components/home/HomeView';
import { db, inicializarBancoSeNecessario, CONFIG_PADRAO } from './db/db';
import { soundFX } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [clientes, setClientes] = useState([]);
  const [alertasEstoque, setAlertasEstoque] = useState(0);
  const [alertasFiado, setAlertasFiado] = useState(0);
  const [somAtivo, setSomAtivo] = useState(true);
  const [carregando, setCarregando] = useState(true);

  // Inicializar o banco de dados e carregar parâmetros
  const sincronizarDados = useCallback(async () => {
    try {
      await inicializarBancoSeNecessario();

      // Carregar configurações salvas
      const configsDB = await db.configuracoes.toArray();
      const configObj = { ...CONFIG_PADRAO };
      configsDB.forEach((c) => {
        configObj[c.chave] = c.valor;
      });
      setConfig(configObj);
      if (configObj.somAtivo !== undefined) {
        setSomAtivo(Boolean(configObj.somAtivo));
        soundFX.setEnabled(Boolean(configObj.somAtivo));
      }

      // Carregar clientes com débitos fiado atualizados em tempo real
      const todosClientes = await db.clientes.toArray();
      const todosFiados = await db.fiados.toArray();
      const clientesComSaldo = todosClientes.map((c) => {
        const fiadosCliente = todosFiados.filter((f) => f.clienteId === c.id && f.status !== 'Quitado');
        const saldoDevedor = fiadosCliente.reduce((acc, f) => acc + (f.saldoDevedor || 0), 0);
        return { ...c, saldoDevedor: Math.round((saldoDevedor + Number.EPSILON) * 100) / 100 };
      });
      setClientes(clientesComSaldo);

      // Contar alertas de estoque baixo
      const todosProdutos = await db.produtos.toArray();
      const baixos = todosProdutos.filter((p) => p.estoqueAtual <= p.estoqueMinimo).length;
      setAlertasEstoque(baixos);

      // Contar alertas de fiado pendente (incluindo pagamentos parciais)
      const fiadosPendentes = await db.fiados.filter((f) => f.status !== 'Quitado').count();
      setAlertasFiado(fiadosPendentes);
    } catch (err) {
      console.error('Erro na inicialização:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    sincronizarDados();
  }, [sincronizarDados]);

  // Tecla ESC para voltar à tela inicial caso não esteja em modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeTab !== 'home') {
        const modalAberto = document.querySelector('.modal-backdrop');
        if (!modalAberto) {
          setActiveTab('home');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const handleToggleSom = async () => {
    const novoValor = !somAtivo;
    setSomAtivo(novoValor);
    soundFX.setEnabled(novoValor);
    try {
      await db.configuracoes.put({ chave: 'somAtivo', valor: novoValor });
    } catch (e) {
      console.error('Erro ao salvar preferência de som:', e);
    }
  };

  const handleSalvarConfig = (novasConfigs) => {
    setConfig(novasConfigs);
  };

  if (carregando) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#FFFFFF' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-brand)', marginBottom: 12 }}>
          <span style={{ color: '#EAB308' }}>MA </span>
          <span style={{ color: '#EF4444' }}>Utilidades</span>
        </div>
        <div style={{ color: '#94A3B8', fontSize: '1rem' }}>
          Iniciando Frente de Caixa PDV...
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Cabeçalho Fixo com Marca MA Utilidades */}
      <Header
        config={config}
        somAtivo={somAtivo}
        onToggleSom={handleToggleSom}
        onIrParaInicio={() => setActiveTab('home')}
      />

      {/* Barra de Navegação Contextual Simplificada */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertasEstoque={alertasEstoque}
        alertasFiado={alertasFiado}
      />

      {/* Conteúdo Dinâmico do Módulo Ativo */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === 'home' && (
          <HomeView
            config={config}
            alertasEstoque={alertasEstoque}
            alertasFiado={alertasFiado}
            onNavegar={(modulo) => setActiveTab(modulo)}
          />
        )}

        {activeTab === 'pdv' && (
          <POSView
            config={config}
            clientes={clientes}
            onVendaFinalizada={sincronizarDados}
            onVoltarInicio={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'produtos' && (
          <ProductsView onAtualizacao={sincronizarDados} />
        )}

        {activeTab === 'estoque' && (
          <StockView onAtualizacao={sincronizarDados} />
        )}

        {activeTab === 'clientes' && (
          <CustomersView onAtualizacao={sincronizarDados} />
        )}

        {activeTab === 'fiado' && (
          <CreditView onAtualizacao={sincronizarDados} />
        )}

        {activeTab === 'relatorios' && (
          <ReportsView onAtualizacao={sincronizarDados} />
        )}

        {activeTab === 'configuracoes' && (
          <SettingsView
            config={config}
            onSalvarConfig={handleSalvarConfig}
            somAtivo={somAtivo}
            onToggleSom={handleToggleSom}
          />
        )}
      </main>
    </div>
  );
}
