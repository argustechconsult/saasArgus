'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  getBillingConfig,
  updateBillingConfig,
} from '../../../lib/actions/settings.actions';
import { User } from '../../../types';

const settingsSchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa é obrigatório'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  bank: z.string().optional(),
  agency: z.string().optional(),
  account: z.string().optional(),
  pixKey: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const loadConfig = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user: User = JSON.parse(userStr);
        const response = await getBillingConfig(user.id);
        if (response.success && response.data) {
          setValue('companyName', response.data.companyName);
          setValue('cnpj', response.data.cnpj);
          setValue('bank', response.data.bank || '');
          setValue('agency', response.data.agency || '');
          setValue('account', response.data.account || '');
          setValue('pixKey', response.data.pixKey || '');
        }
      }
      setLoading(false);
    };
    loadConfig();
  }, [setValue]);

  const onSubmit = async (data: SettingsFormData) => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user: User = JSON.parse(userStr);
      await updateBillingConfig(user.id, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Configurações de Faturamento
        </h2>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Dados da Empresa
              </h3>
              <Input
                label="Razão Social / Nome da Empresa"
                {...register('companyName')}
                error={errors.companyName?.message}
              />
              <Input
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                {...register('cnpj')}
                error={errors.cnpj?.message}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Dados Bancários & PIX
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Banco"
                  {...register('bank')}
                  error={errors.bank?.message}
                />
                <Input
                  label="Agência"
                  {...register('agency')}
                  error={errors.agency?.message}
                />
                <Input
                  label="Conta"
                  {...register('account')}
                  error={errors.account?.message}
                />
              </div>
              <Input
                label="Chave PIX"
                placeholder="CPF, CNPJ, Email ou Aleatória"
                {...register('pixKey')}
                error={errors.pixKey?.message}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            {success && (
              <span className="text-green-600 font-medium animate-pulse">
                Configurações salvas com sucesso!
              </span>
            )}
            <Button type="submit" className="w-full md:w-auto">
              Salvar Configurações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
