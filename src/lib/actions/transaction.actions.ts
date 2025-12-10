'use server';

import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { Transaction } from '../../types';

export async function createTransaction(userId: string, data: Partial<Transaction>) {
  try {
    const newTransaction = await prisma.transaction.create({
      data: {
        userId,
        type: data.type!,
        amount: data.amount!,
        description: data.description!,
        date: new Date(data.date!),
      },
    });
    revalidatePath('/dashboard');
    revalidatePath('/billing');
    return { success: true, data: newTransaction };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { success: false, error: 'Failed to create transaction' };
  }
}

export async function updateTransaction(userId: string, transactionId: string, data: Partial<Transaction>) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
    revalidatePath('/dashboard');
    revalidatePath('/billing');
    return { success: true, data: updatedTransaction };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: 'Failed to update transaction' };
  }
}

export async function deleteTransaction(userId: string, transactionId: string) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });
    revalidatePath('/dashboard');
    revalidatePath('/billing');
    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: 'Failed to delete transaction' };
  }
}

export async function getFinancialDashboard(userId: string) {
  try {
    const totalClients = await prisma.client.count({
      where: { userId },
    });

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const totalRevenue = transactions
      .filter((t: any) => t.type === 'revenue')
      .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const totalExpense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    // Convert dates to string for serialization if needed, or keep as Date
    // The frontend expects string dates usually if it uses the Transaction interface from types.ts
    const formattedTransactions = transactions.map((t: any) => ({
      ...t,
      date: t.date.toISOString().split('T')[0],
    }));

    return {
      success: true,
      data: {
        totalClients,
        totalRevenue,
        totalExpense,
        transactions: formattedTransactions,
      },
    };
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return { success: false, error: 'Failed to load dashboard' };
  }
}
