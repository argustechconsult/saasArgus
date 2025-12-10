'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiRoutes } from '../../../api/routes';
import { Transaction, User } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const transactionSchema = z.object({
  description: z.string().min(2, "Descrição é obrigatória"),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), "Data inválida"),
  type: z.enum(['revenue', 'expense'])
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'revenue',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const currentType = watch('type');

  const loadData = async () => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user: User = JSON.parse(userStr);
      const response = await apiRoutes.getFinancialDashboard(user.id);
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (data: TransactionFormData) => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user: User = JSON.parse(userStr);
      
      if (editingId) {
        await apiRoutes.updateTransaction(user.id, editingId, data);
      } else {
        await apiRoutes.createTransaction(user.id, data);
      }
      
      reset({
         type: 'revenue',
         date: new Date().toISOString().split('T')[0],
         description: '',
         amount: 0
      });
      setShowForm(false);
      setEditingId(null);
      loadData();
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setValue('description', tx.description);
    setValue('amount', tx.amount);
    setValue('date', tx.date);
    setValue('type', tx.type);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta transação?')) {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user: User = JSON.parse(userStr);
        await apiRoutes.deleteTransaction(user.id, id);
        loadData();
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset({
      type: 'revenue',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0
   });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Faturamento & Despesas</h2>
        <Button onClick={() => { setEditingId(null); reset({ type: 'revenue', date: new Date().toISOString().split('T')[0] }); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : '+ Nova Transação'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Editar Transação' : 'Adicionar Transação'}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Type Selection */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setValue('type', 'revenue')}
                className={`flex-1 py-2 rounded-md font-medium text-sm border ${
                  currentType === 'revenue' 
                    ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-500 ring-offset-2' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'expense')}
                className={`flex-1 py-2 rounded-md font-medium text-sm border ${
                  currentType === 'expense' 
                    ? 'bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500 ring-offset-2' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Despesa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="Descrição" 
                placeholder="Ex: Consultoria, Servidor, etc"
                {...register('description')} 
                error={errors.description?.message} 
              />
              <Input 
                label="Valor (R$)" 
                type="number" 
                step="0.01" 
                placeholder="0.00"
                {...register('amount')} 
                error={errors.amount?.message} 
              />
              <Input 
                label="Data" 
                type="date" 
                {...register('date')} 
                error={errors.date?.message} 
              />
            </div>
            
            <div className="flex justify-end pt-2 gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
              <Button type="submit" className={currentType === 'revenue' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                {editingId ? 'Atualizar' : 'Salvar'} {currentType === 'revenue' ? 'Receita' : 'Despesa'}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {t.description}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {t.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.type === 'revenue' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t.type === 'revenue' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${
                      t.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === 'revenue' ? '+' : '-'}${t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(t)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Editar">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Excluir">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
}