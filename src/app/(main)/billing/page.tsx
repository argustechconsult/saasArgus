'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  getFinancialDashboard,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../../../lib/actions/transaction.actions';
import { getClients } from '../../../lib/actions/cliente.actions';
import { getBillingConfig } from '../../../lib/actions/settings.actions';
import { PixPayload } from '../../../lib/pixUtils';
import QRCode from 'qrcode';
import { Transaction, User, Client, BillingConfig } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const transactionSchema = z.object({
  description: z.string().min(2, 'Descrição é obrigatória'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  type: z.enum(['revenue', 'expense']),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function BillingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [billingConfig, setBillingConfig] = useState<BillingConfig | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBoletoModal, setShowBoletoModal] = useState(false);

  // Boleto State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [boletoValue, setBoletoValue] = useState('');
  const [boletoDueDate, setBoletoDueDate] = useState('');
  const [showBoletoPreview, setShowBoletoPreview] = useState(false);
  const [pixQrCode, setPixQrCode] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: 'revenue',
      date: '',
    },
  });

  useEffect(() => {
    setValue('date', new Date().toISOString().split('T')[0]);
  }, [setValue]);

  useEffect(() => {
    if (showBoletoPreview && billingConfig?.pixKey && boletoValue) {
      const generatePix = async () => {
        try {
          const payload = new PixPayload(
            billingConfig.companyName,
            'SAO PAULO', // Default city as it's not in config yet
            billingConfig.pixKey!,
            boletoValue,
            '***',
          ).generate();

          const url = await QRCode.toDataURL(payload);
          setPixQrCode(url);
        } catch (err) {
          console.error('Error generating PIX:', err);
        }
      };
      generatePix();
    }
  }, [showBoletoPreview, billingConfig, boletoValue]);

  const currentType = watch('type');

  const loadData = async () => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user: User = JSON.parse(userStr);

      const [finResponse, clientResponse, configResponse] = await Promise.all([
        getFinancialDashboard(user.id),
        getClients(user.id),
        getBillingConfig(user.id),
      ]);

      if (finResponse.success && finResponse.data) {
        setTransactions(finResponse.data.transactions);
      }
      if (clientResponse.success && clientResponse.data) {
        setClients(clientResponse.data);
      }
      if (configResponse.success && configResponse.data) {
        setBillingConfig(configResponse.data);
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
        await updateTransaction(user.id, editingId, data);
      } else {
        await createTransaction(user.id, data);
      }

      reset({
        type: 'revenue',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
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
        await deleteTransaction(user.id, id);
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
      amount: 0,
    });
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client && client.paymentDueDate) {
      // Calculate next due date
      const today = new Date();
      let year = today.getFullYear();
      let month = today.getMonth();
      const day = client.paymentDueDate;

      // If due date for this month passed, move to next month
      if (today.getDate() > day) {
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }

      // Handle end of month edge cases roughly
      const date = new Date(year, month, day);
      setBoletoDueDate(date.toISOString().split('T')[0]);
    }

    if (client && client.contractValue) {
      setBoletoValue(client.contractValue.toString());
    }
  };

  const printBoleto = () => {
    const printContent = document.getElementById('boleto-print-area');
    if (printContent) {
      const win = window.open('', '', 'height=700,width=800');
      if (win) {
        win.document.write('<html><head><title>Boleto</title>');
        win.document.write(
          '<script src="https://cdn.tailwindcss.com"></script>',
        ); // Quick way to get styles
        win.document.write('</head><body >');
        win.document.write(printContent.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        // Wait for styles/images
        setTimeout(() => {
          win.print();
        }, 1000);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Faturamento & Despesas
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowBoletoModal(true);
              setShowBoletoPreview(false);
            }}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Gerar Boleto
          </Button>
          <Button
            onClick={() => {
              setEditingId(null);
              reset({
                type: 'revenue',
                date: new Date().toISOString().split('T')[0],
              });
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancelar' : '+ Nova Transação'}
          </Button>
        </div>
      </div>

      {showBoletoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Gerar Boleto</h3>
              <button
                onClick={() => setShowBoletoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {!showBoletoPreview ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 p-2"
                    value={selectedClientId}
                    onChange={handleClientSelect}
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={boletoValue}
                      onChange={(e) => setBoletoValue(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vencimento
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={boletoDueDate}
                      onChange={(e) => setBoletoDueDate(e.target.value)}
                    />
                  </div>
                </div>

                {!billingConfig && (
                  <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm">
                    Aviso: Configure os dados da empresa em Configurações para
                    que apareçam no boleto.
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setShowBoletoPreview(true)}
                    disabled={
                      !selectedClientId || !boletoValue || !boletoDueDate
                    }
                  >
                    Visualizar Boleto
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div id="boleto-print-area" className="p-8 bg-white">
                  {/* Simulate Boleto View */}
                  <div className="border border-black p-4 font-mono text-sm">
                    <div className="flex justify-between items-center border-b border-black pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 px-2 py-1 font-bold text-xl border border-black">
                          001
                        </div>
                        <span className="font-bold text-lg">
                          ArgusTech Bank
                        </span>
                      </div>
                      <div className="font-bold text-sm">
                        00190.50095 40144.816069 06809.350314 3 37370000000100
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-x-4 gap-y-2 mb-4">
                      <div className="col-span-3 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Local de Pagamento
                        </div>
                        <div>Pagável em qualquer banco até o vencimento</div>
                      </div>
                      <div className="col-span-1 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Vencimento
                        </div>
                        <div className="font-bold">
                          {new Date(boletoDueDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      <div className="col-span-3 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Beneficiário
                        </div>
                        <div className="font-bold">
                          {billingConfig?.companyName ||
                            'Empresa Não Configurada'}{' '}
                          ({billingConfig?.cnpj || 'CNPJ N/A'})
                        </div>
                      </div>
                      <div className="col-span-1 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Agência/Código Beneficiário
                        </div>
                        <div>
                          {billingConfig?.agency}/{billingConfig?.account}
                        </div>
                      </div>

                      <div className="col-span-1 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Data do Documento
                        </div>
                        <div>{new Date().toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div className="col-span-1 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Número do Documento
                        </div>
                        <div>123456</div>
                      </div>
                      <div className="col-span-1 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Espécie Doc.
                        </div>
                        <div>DM</div>
                      </div>
                      <div className="col-span-1 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">Aceite</div>
                        <div>N</div>
                      </div>

                      <div className="col-span-1 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Data Processamento
                        </div>
                        <div>{new Date().toLocaleDateString('pt-BR')}</div>
                      </div>
                      <div className="col-span-2 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Carteira
                        </div>
                        <div>09</div>
                      </div>
                      <div className="col-span-1 border-b border-gray-300">
                        <div className="text-[10px] text-gray-500">
                          Valor do Documento
                        </div>
                        <div className="font-bold">
                          R$ {Number(boletoValue).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-[10px] text-gray-500">Pagador</div>
                      <div className="font-bold">
                        {clients.find((c) => c.id === selectedClientId)?.name}
                      </div>
                      <div className="text-xs">
                        {clients.find((c) => c.id === selectedClientId)?.email}
                      </div>
                      <div className="text-xs">CNPJ/CPF: 000.000.000-00</div>
                    </div>

                    <div className="border-t border-black pt-2 mt-4">
                      {billingConfig?.pixKey && (
                        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 flex flex-col items-center">
                          <p className="font-bold text-center mb-2">
                            Pague com PIX
                          </p>
                          {pixQrCode && (
                            <img
                              src={pixQrCode}
                              alt="QR Code PIX"
                              className="w-32 h-32 mb-2"
                            />
                          )}
                          <p className="text-center text-xs text-gray-500 font-mono break-all max-w-sm">
                            Chave: {billingConfig.pixKey}
                          </p>
                        </div>
                      )}
                      <div className="h-16 bg-gradient-to-r from-black via-white to-black opacity-20 transform skew-x-12"></div>
                      <div className="text-center text-[10px] mt-1">
                        Autenticação Mecânica
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between p-6 bg-gray-50 rounded-b-xl border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowBoletoPreview(false)}
                  >
                    Voltar
                  </Button>
                  <Button onClick={printBoleto}>Imprimir / Salvar PDF</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Editar Transação' : 'Adicionar Transação'}
          </h3>
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
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className={
                  currentType === 'revenue'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }
              >
                {editingId ? 'Atualizar' : 'Salvar'}{' '}
                {currentType === 'revenue' ? 'Receita' : 'Despesa'}
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
                  <td className="px-6 py-4 text-gray-500">{t.date}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.type === 'revenue'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {t.type === 'revenue' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-semibold ${
                      t.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {t.type === 'revenue' ? '+' : '-'}$
                    {t.amount.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Editar"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Excluir"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
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
