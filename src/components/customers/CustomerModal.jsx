import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';

export default function CustomerModal({ cliente, onSalvar, onClose }) {
  const [formData, setFormData] = useState({
    nome: cliente?.nome || '',
    telefone: cliente?.telefone || '',
    cpf: cliente?.cpf || '',
    endereco: cliente?.endereco || '',
    observacoes: cliente?.observacoes || '',
    limiteCredito: cliente?.limiteCredito !== undefined ? cliente.limiteCredito : 1000.00
  });

  const [erro, setErro] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');

    if (!formData.nome.trim()) {
      setErro('O nome do cliente é obrigatório.');
      return;
    }

    onSalvar({
      ...formData,
      limiteCredito: parseFloat(formData.limiteCredito) || 0
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>
            <User size={20} color="#EAB308" />
            {cliente ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
          </h3>
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
              <div className="form-group col-span-2">
                <label>Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo da Silva"
                  className="form-control"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 99999-8888"
                  className="form-control"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  className="form-control"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label>Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade..."
                  className="form-control"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Limite para Fiado / Crediário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000,00"
                  className="form-control"
                  value={formData.limiteCredito}
                  onChange={(e) => setFormData({ ...formData, limiteCredito: e.target.value })}
                />
              </div>

              <div className="form-group col-span-2">
                <label>Observações</label>
                <textarea
                  rows="3"
                  placeholder="Informações adicionais, preferências ou notas..."
                  className="form-control"
                  style={{ resize: 'vertical' }}
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-clear-cart" style={{ borderColor: '#CBD5E1', color: '#475569' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-accent-action">
              <Save size={16} />
              {cliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
