export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  name?: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  sensitiveNotes?: string | null;
  paymentDueDate?: number | null;
  contractValue?: number | null;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  date: string;
}

export interface BillingConfig {
  id: string;
  userId: string;
  companyName: string;
  cnpj: string;
  bank?: string | null;
  agency?: string | null;
  account?: string | null;
  pixKey?: string | null;
}

export interface DatabaseSchema {
  users: User[];
  clients: Client[];
  transactions: Transaction[];
  billingConfig: BillingConfig[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}