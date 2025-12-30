import { z } from 'zod';

export const financeEntrySchema = z.object({
  type: z.enum(['income', 'expense', 'investment', 'balance']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  description: z.string().optional(),
  note: z.string().optional(),
  status: z.enum(['paid', 'pending']).default('paid'),
  company: z.string().optional(),
  projectId: z.string().uuid().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).default('none'),
});

export function validateFinanceEntry(entry: any) {
  try {
    return financeEntrySchema.parse(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: 'Dados inválidos' };
  }
}

export const COMMON_CATEGORIES = {
  income: [
    'Salário',
    'Freelance',
    'Projetos',
    'Mestrado',
    'RVT',
    'Bolsa',
    'Presente',
    'Vendas',
    'Outros Recebimentos',
  ],
  expense: [
    'Casa',
    'Cartão',
    'Financiamento',
    'Carro',
    'CREA',
    'Saúde',
    'Roupas',
    'Empréstimo',
    'Financeiro',
    'Alimentação',
    'Transporte',
    'Educação',
    'Lazer',
    'Compras',
    'Contas',
    'Impostos',
    'Outros Gastos',
  ],
  investment: [
    'Investimentos',
    'Ações',
    'Renda Fixa',
    'Fundos',
  ],
  balance: [
    'Saldo',
    'Saldo Inicial',
  ],
};
