'use client';

import React, { useEffect, useState } from 'react';
import { apiRoutes } from '../../../api/routes';
import { User, Transaction } from '../../../types';

interface DashboardData {
  totalClients: number;
  totalRevenue: number;
  totalExpense: number;
  transactions: Transaction[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user: User = JSON.parse(userStr);
        const response = await apiRoutes.getFinancialDashboard(user.id);
        if (response.success && response.data) {
          setData(response.data);
        }
      }
      setLoading(false);
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return <div>Failed to load dashboard data.</div>;
  }

  const netIncome = data.totalRevenue - data.totalExpense;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            ${data.totalRevenue.toLocaleString()}
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            ${data.totalExpense.toLocaleString()}
          </p>
        </div>

        {/* Net Income Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
          <p className={`mt-2 text-3xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ${netIncome.toLocaleString()}
          </p>
        </div>

        {/* Clients Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {data.totalClients}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.length > 0 ? (
                data.transactions.slice(0, 5).map((t) => (
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
                        {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${
                      t.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === 'revenue' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}