'use client';

import React, { useEffect, useState } from 'react';
import { apiRoutes } from '../../../api/routes';
import { Client, User } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const clientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(5, "Phone is required"),
  sensitiveNotes: z.string().optional()
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema)
  });

  const loadClients = async () => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user: User = JSON.parse(userStr);
      const response = await apiRoutes.getClients(user.id);
      if (response.success && response.data) {
        setClients(response.data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const onSubmit = async (data: ClientFormData) => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user: User = JSON.parse(userStr);
      
      if (editingId) {
        // Update existing client
        await apiRoutes.updateClient(user.id, editingId, { ...data, status: 'Active' });
      } else {
        // Create new client
        await apiRoutes.createClient(user.id, { ...data, status: 'Active' });
      }
      
      reset();
      setShowForm(false);
      setEditingId(null);
      loadClients();
    }
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setValue('name', client.name);
    setValue('email', client.email);
    setValue('phone', client.phone);
    setValue('sensitiveNotes', client.sensitiveNotes || '');
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Tem certeza que deseja remover este cliente?')) {
       const userStr = localStorage.getItem('currentUser');
       if (userStr) {
         const user: User = JSON.parse(userStr);
         await apiRoutes.deleteClient(user.id, clientId);
         loadClients();
       }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
  }

  const toggleSecret = (id: string) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Meus Clientes</h2>
        <Button onClick={() => { setEditingId(null); reset(); setShowForm(!showForm); }}>
          {showForm ? 'Cancelar' : '+ Novo Cliente'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nome da Empresa/Cliente" {...register('name')} error={errors.name?.message} />
              <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
              <Input label="Telefone" {...register('phone')} error={errors.phone?.message} />
            </div>
            
            <div className="w-full">
              <label className="text-sm font-medium leading-none mb-2 block text-gray-700">
                Dados Sensíveis (Senhas, Tokens, Chaves)
              </label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                placeholder="Insira dados privados aqui..."
                {...register('sensitiveNotes')}
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">Esses dados só serão visíveis quando solicitados.</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Atualizar Cliente' : 'Salvar Cliente'}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Contato</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Dados Sensíveis</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span>{client.email}</span>
                    <span className="text-xs text-gray-500">{client.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status === 'Active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {client.sensitiveNotes ? (
                     <div className="relative">
                       {visibleSecrets[client.id] ? (
                         <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs font-mono text-gray-800 whitespace-pre-wrap max-w-xs">
                           {client.sensitiveNotes}
                           <button onClick={() => toggleSecret(client.id)} className="block mt-1 text-blue-600 hover:underline">Ocultar</button>
                         </div>
                       ) : (
                         <button onClick={() => toggleSecret(client.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                           Visualizar Dados
                         </button>
                       )}
                     </div>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(client)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50" title="Editar">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Excluir">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum cliente cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}