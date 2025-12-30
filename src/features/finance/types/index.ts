export interface FinanceEntry {
  id: string;
  workspace_id: string;
  type: 'income' | 'expense' | 'investment' | 'balance';
  category: string;
  amount: number;
  date: string;
  description?: string;
  company?: string;
  note?: string;
  status: 'pending' | 'paid';
  recurrence?: string;
  recurring_rule_id?: string;
  project_id?: string;
  page_id?: string;
  running_balance?: number;
  created_at?: string;
  updated_at?: string;
  projects?: {
    id: string;
    title: string;
  } | null;
  pages?: {
    id: string;
    title: string;
  } | null;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  investment: number;
  balance: number;
  totalBalance: number;
}
