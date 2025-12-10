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
  status: 'Active' | 'Inactive';
  sensitiveNotes?: string; // New field for sensitive data
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  date: string;
}

export interface DatabaseSchema {
  users: User[];
  clients: Client[];
  transactions: Transaction[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}