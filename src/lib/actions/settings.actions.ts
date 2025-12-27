'use server';

import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { BillingConfig } from '../../types';

export async function getBillingConfig(userId: string) {
  try {
    const config = await prisma.billingConfig.findUnique({
      where: { userId },
    });
    return { success: true, data: config };
  } catch (error) {
    console.error('Error fetching billing config:', error);
    return { success: false, error: 'Failed to fetch billing config' };
  }
}

export async function updateBillingConfig(userId: string, data: Partial<BillingConfig>) {
  try {
    const existingConfig = await prisma.billingConfig.findUnique({
      where: { userId },
    });

    let config;
    if (existingConfig) {
      config = await prisma.billingConfig.update({
        where: { userId },
        data: {
          companyName: data.companyName,
          cnpj: data.cnpj,
          bank: data.bank,
          agency: data.agency,
          account: data.account,
          pixKey: data.pixKey,
        },
      });
    } else {
      config = await prisma.billingConfig.create({
        data: {
          userId,
          companyName: data.companyName!,
          cnpj: data.cnpj!,
          bank: data.bank,
          agency: data.agency,
          account: data.account,
          pixKey: data.pixKey,
        },
      });
    }

    revalidatePath('/settings');
    return { success: true, data: config };
  } catch (error) {
    console.error('Error updating billing config:', error);
    return { success: false, error: 'Failed to update billing config' };
  }
}
