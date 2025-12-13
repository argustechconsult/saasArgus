import { DatabaseSchema, User, ApiResponse } from '../types';
import { hashPassword, comparePassword } from '../utils/bcryptUtils';
import { v4 as uuidv4 } from 'uuid';

const DB_KEY = 'saas_mock_db';

// Initialize DB from db.json structure if empty
const getDB = (): DatabaseSchema => {
  const stored = localStorage.getItem(DB_KEY);
  let db: DatabaseSchema;

  if (!stored) {
    db = {
      users: [],
      clients: [],
      transactions: []
    };
  } else {
    db = JSON.parse(stored);
  }

  // Ensure demo user exists for testing convenience
  const demoUserId = 'demo-user-id';
  const demoEmail = 'demo@example.com';
  
  if (!db.users.find(u => u.email === demoEmail)) {
     db.users.push({
        id: demoUserId,
        email: demoEmail,
        passwordHash: 'hashed_cGFzc3dvcmQxMjM=', // password123
        createdAt: new Date().toISOString(),
        name: 'Demo User'
     });
  }

  // Seed Mock Clients if none exist for demo user
  const demoClients = db.clients.filter(c => c.userId === demoUserId);
  if (demoClients.length === 0) {
     db.clients.push(
       { id: 'c1', userId: demoUserId, name: 'Acme Corp', email: 'contact@acme.com', phone: '555-0101', status: 'Active', sensitiveNotes: 'Contract ID: 9988-X\nServer Access: root/admin123' },
       { id: 'c2', userId: demoUserId, name: 'Globex Corporation', email: 'info@globex.com', phone: '555-0102', status: 'Active', sensitiveNotes: 'VIP Client - Handle with care.' },
       { id: 'c3', userId: demoUserId, name: 'Soylent Corp', email: 'sales@soylent.com', phone: '555-0103', status: 'Inactive', sensitiveNotes: 'Billing dispute in progress.' },
       { id: 'c4', userId: demoUserId, name: 'Initech', email: 'support@initech.com', phone: '555-0104', status: 'Active' },
       { id: 'c5', userId: demoUserId, name: 'Umbrella Corp', email: 'secure@umbrella.com', phone: '555-0105', status: 'Active', sensitiveNotes: 'Top Secret Clearance Required.' }
     );
  }

  // Seed Mock Transactions if none exist for demo user
  const demoTransactions = db.transactions.filter(t => t.userId === demoUserId);
  if (demoTransactions.length === 0) {
      const today = new Date();
      const getDate = (daysAgo: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
      };

      db.transactions.push(
        { id: 't1', userId: demoUserId, type: 'revenue', amount: 5000, description: 'Website Redesign - Acme', date: getDate(2) },
        { id: 't2', userId: demoUserId, type: 'expense', amount: 120, description: 'Cloud Hosting (AWS)', date: getDate(3) },
        { id: 't3', userId: demoUserId, type: 'revenue', amount: 1500, description: 'Monthly Retainer - Globex', date: getDate(5) },
        { id: 't4', userId: demoUserId, type: 'expense', amount: 50, description: 'SaaS Subscription (Jira)', date: getDate(8) },
        { id: 't5', userId: demoUserId, type: 'revenue', amount: 3000, description: 'Consulting - Initech', date: getDate(10) },
        { id: 't6', userId: demoUserId, type: 'revenue', amount: 8000, description: 'Mobile App Dev - Umbrella', date: getDate(12) },
        { id: 't7', userId: demoUserId, type: 'expense', amount: 2000, description: 'Freelancer Payment (Design)', date: getDate(15) },
        { id: 't8', userId: demoUserId, type: 'revenue', amount: 4500, description: 'SEO Optimization - Acme', date: getDate(18) },
        { id: 't9', userId: demoUserId, type: 'expense', amount: 300, description: 'Office Supplies', date: getDate(20) }
      );
  }
  
  // Save ensures all seeds are persisted
  localStorage.setItem(DB_KEY, JSON.stringify(db));

  return db;
};

const saveDB = (db: DatabaseSchema) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};

// Generic response helper
const response = <T>(success: boolean, data?: T, error?: string): ApiResponse<T> => {
  return { success, data, error };
};

export const apiRoutes = {
  // POST /api/routes?action=register
  register: async (payload: { email: string; password: string; name?: string }) => {
    try {
      const db = getDB();
      const existingUser = db.users.find(u => u.email === payload.email);
      
      if (existingUser) {
        return response(false, undefined, "Email already in use");
      }

      const passwordHash = await hashPassword(payload.password);
      const newUser: User = {
        id: uuidv4(),
        email: payload.email,
        passwordHash,
        name: payload.name,
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      saveDB(db);

      // Return user without hash
      const { passwordHash: _, ...userWithoutHash } = newUser;
      return response(true, userWithoutHash);
    } catch (e) {
      return response(false, undefined, "Registration failed");
    }
  },

  // POST /api/routes?action=login
  login: async (payload: { email: string; password: string }) => {
    try {
      const db = getDB();
      const user = db.users.find(u => u.email === payload.email);

      if (!user) {
        return response(false, undefined, "Invalid credentials");
      }

      const isValid = await comparePassword(payload.password, user.passwordHash);
      if (!isValid) {
        return response(false, undefined, "Invalid credentials");
      }

      const { passwordHash: _, ...userWithoutHash } = user;
      return response(true, userWithoutHash);
    } catch (e) {
      return response(false, undefined, "Login failed");
    }
  },

  // GET /api/routes?action=clients
  getClients: async (userId: string) => {
    const db = getDB();
    const clients = db.clients.filter(c => c.userId === userId);
    return response(true, clients);
  },

  // POST /api/routes?action=client-create
  createClient: async (userId: string, payload: any) => {
    const db = getDB();
    const newClient = {
      id: uuidv4(),
      userId,
      ...payload,
      status: payload.status || 'Active',
      sensitiveNotes: payload.sensitiveNotes || ''
    };
    db.clients.push(newClient);
    saveDB(db);
    return response(true, newClient);
  },

  // PUT /api/routes?action=client-update
  updateClient: async (userId: string, clientId: string, payload: any) => {
    const db = getDB();
    const index = db.clients.findIndex(c => c.id === clientId && c.userId === userId);
    if (index === -1) return response(false, undefined, "Client not found");
    
    db.clients[index] = { ...db.clients[index], ...payload };
    saveDB(db);
    return response(true, db.clients[index]);
  },

  // DELETE /api/routes?action=client-delete
  deleteClient: async (userId: string, clientId: string) => {
    const db = getDB();
    const initialLength = db.clients.length;
    db.clients = db.clients.filter(c => !(c.id === clientId && c.userId === userId));
    
    if (db.clients.length === initialLength) return response(false, undefined, "Client not found");
    
    saveDB(db);
    return response(true);
  },

  // POST /api/routes?action=transaction-create
  createTransaction: async (userId: string, payload: { type: 'revenue' | 'expense'; amount: number; description: string; date: string }) => {
    const db = getDB();
    const newTransaction = {
      id: uuidv4(),
      userId,
      ...payload
    };
    db.transactions.push(newTransaction);
    saveDB(db);
    return response(true, newTransaction);
  },

  // PUT /api/routes?action=transaction-update
  updateTransaction: async (userId: string, transactionId: string, payload: any) => {
    const db = getDB();
    const index = db.transactions.findIndex(t => t.id === transactionId && t.userId === userId);
    if (index === -1) return response(false, undefined, "Transaction not found");

    db.transactions[index] = { ...db.transactions[index], ...payload };
    saveDB(db);
    return response(true, db.transactions[index]);
  },

  // DELETE /api/routes?action=transaction-delete
  deleteTransaction: async (userId: string, transactionId: string) => {
    const db = getDB();
    const initialLength = db.transactions.length;
    db.transactions = db.transactions.filter(t => !(t.id === transactionId && t.userId === userId));

    if (db.transactions.length === initialLength) return response(false, undefined, "Transaction not found");

    saveDB(db);
    return response(true);
  },

  // GET /api/routes?action=financial-dashboard
  getFinancialDashboard: async (userId: string) => {
    const db = getDB();
    const userClients = db.clients.filter(c => c.userId === userId);
    const userTransactions = db.transactions.filter(t => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalRevenue = userTransactions
      .filter(t => t.type === 'revenue')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpense = userTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return response(true, {
      totalClients: userClients.length,
      totalRevenue,
      totalExpense,
      transactions: userTransactions
    });
  }
};
