export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseCurrency(value: string): number {
  // Remove todos os caracteres exceto números, vírgula e ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '');

  // Substitui vírgula por ponto
  const normalized = cleanValue.replace(',', '.');

  return parseFloat(normalized) || 0;
}
