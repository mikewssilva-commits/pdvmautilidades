// Utilitários de formatação e geração para o PDV da MA Utilidades

export function arredondarMoeda(valor) {
  const num = Number(valor) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatarMoeda(valor) {
  const num = arredondarMoeda(valor);
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function formatarDataHora(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatarData(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR');
}

// Gerador simples e válido de código de barras padrão EAN-13 numérico
export function gerarCodigoBarrasEAN() {
  const prefixo = '789'; // Brasil
  let digitos = prefixo;
  for (let i = 0; i < 9; i++) {
    digitos += Math.floor(Math.random() * 10);
  }
  // Cálculo do dígito verificador EAN-13
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    const n = parseInt(digitos[i], 10);
    soma += (i % 2 === 0) ? n : n * 3;
  }
  const digitoVerificador = (10 - (soma % 10)) % 10;
  return digitos + digitoVerificador;
}

export function gerarCodigoInterno(totalProdutos) {
  const num = (totalProdutos + 1).toString().padStart(4, '0');
  return `MA-${num}`;
}
