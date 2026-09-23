import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  MapPin, 
  CheckCircle2
} from 'lucide-react';
import { db } from '../../db/db';
import { formatarMoeda } from '../../utils/formatters';
import CustomerModal from './CustomerModal';
import CustomerDetailModal from './CustomerDetailModal';

export default function CustomersView({ onAtualizacao }) {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [mostrarModalCadastro, setMostrarModalCadastro] = useState(false);
  const [clienteEmEdicao, setClienteEmEdicao] = useState(null);
  const [clienteDetalhes, setClienteDetalhes] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const carregarClientes = async () => {
    const lista = await db.clientes.toArray();
    // Calcular débitos de cada cliente
    const fiados = await db.fiados.toArray();
    const clientesComSaldo = lista.map((c) => {
      const fiadosDoCliente = fiados.filter((f) => f.clienteId === c.id && f.status !== 'Quitado');
      const saldoDevedor = fiadosDoCliente.reduce((acc, f) => acc + f.saldoDevedor, 0);
      return { ...c, saldoDevedor };
    });
    setClientes(clientesComSaldo);
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleSalvarCliente = async (dados) => {
    if (clienteEmEdicao) {
      await db.clientes.update(clienteEmEdicao.id, dados);
      setFeedbackMsg(`Cliente "${dados.nome}" atualizado!`);
    } else {
      await db.clientes.add({
        ...dados,
        createdAt: new Date().toISOString()
      });
      setFeedbackMsg(`Cliente "${dados.nome}" cadastrado com sucesso!`);
    }

    setMostrarModalCadastro(false);
    setClienteEmEdicao(null);
    await carregarClientes();
    if (onAtualizacao) onAtualizacao();
    setTimeout(() => setFeedbackMsg(''), 4000);
  };

  const handleExcluirCliente = async (cliente) => {
    if (cliente.saldoDevedor > 0) {
      alert(`Não é possível excluir o cliente "${cliente.nome}" pois ele possui pendências financeiras no Fiado (${formatarMoeda(cliente.saldoDevedor)}).`);
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
      await db.clientes.delete(cliente.id);
      setFeedbackMsg(`Cliente "${cliente.nome}" excluído.`);
      await carregarClientes();
      if (onAtualizacao) onAtualizacao();
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.cpf && c.cpf.includes(busca)) ||
    (c.telefone && c.telefone.includes(busca))
  );

  return (
    <div className="module-page-container">
      {/* Cabeçalho */}
      <div className="page-action-header">
        <div className="page-title-box">
          <h1>
            <Users size={26} color="#EAB308" />
            Cadastro de Clientes
          </h1>
          <p>
            Controle de contatos, histórico de compras e limites para crediário/fiado
          </p>
        </div>

        <button
          onClick={() => {
            setClienteEmEdicao(null);
            setMostrarModalCadastro(true);
          }}
          className="btn-accent-action"
        >
          <UserPlus size={18} />
          Cadastrar Novo Cliente
        </button>
      </div>

      {feedbackMsg && (
        <div style={{ background: '#DCFCE7', color: '#166534', padding: '10px 18px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #BBF7D0' }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tabela de Clientes */}
      <div className="data-table-card">
        <div className="data-table-toolbar">
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 260 }}>
            <Search className="search-input-icon" size={18} />
            <input
              type="text"
              className="search-input"
              style={{ padding: '8px 12px 8px 36px', fontSize: '0.9rem' }}
              placeholder="Buscar cliente por nome, CPF ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="standard-table">
            <thead>
              <tr>
                <th>Nome do Cliente</th>
                <th>Telefone / WhatsApp</th>
                <th>CPF</th>
                <th>Endereço</th>
                <th style={{ textAlign: 'right' }}>Limite Fiado</th>
                <th style={{ textAlign: 'right' }}>Débito Pendente</th>
                <th style={{ width: 140, textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cli) => (
                  <tr key={cli.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{cli.nome}</div>
                      {cli.observacoes && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: 280, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {cli.observacoes}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                        <Phone size={14} color="#64748B" />
                        <span>{cli.telefone || '-'}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{cli.cpf || '-'}</td>
                    <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} color="#64748B" />
                        <span>{cli.endereco || '-'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {formatarMoeda(cli.limiteCredito || 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: cli.saldoDevedor > 0 ? '#DC2626' : '#16A34A' }}>
                      {formatarMoeda(cli.saldoDevedor || 0)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => setClienteDetalhes(cli)}
                          className="btn-qty-step"
                          title="Visualizar Histórico e Ficha Completa"
                        >
                          <Eye size={15} color="#0F172A" />
                        </button>
                        <button
                          onClick={() => {
                            setClienteEmEdicao(cli);
                            setMostrarModalCadastro(true);
                          }}
                          className="btn-qty-step"
                          title="Editar Cadastro"
                        >
                          <Edit size={15} color="#2563EB" />
                        </button>
                        <button
                          onClick={() => handleExcluirCliente(cli)}
                          className="btn-qty-step"
                          title="Excluir Cliente"
                        >
                          <Trash2 size={15} color="#DC2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarModalCadastro && (
        <CustomerModal
          cliente={clienteEmEdicao}
          onSalvar={handleSalvarCliente}
          onClose={() => {
            setMostrarModalCadastro(false);
            setClienteEmEdicao(null);
          }}
        />
      )}

      {clienteDetalhes && (
        <CustomerDetailModal
          cliente={clienteDetalhes}
          onClose={() => setClienteDetalhes(null)}
        />
      )}
    </div>
  );
}
