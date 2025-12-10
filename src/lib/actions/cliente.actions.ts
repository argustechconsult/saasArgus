'use server';

import { prisma } from '../prisma';
import { revalidatePath } from 'next/cache';
import { Client } from '../../types';

export async function getClients(userId: string) {
  try {
    const clients = await prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: clients };
  } catch (error) {
    console.error('Error fetching clients:', error);
    return { success: false, error: 'Failed to fetch clients' };
  }
}

export async function createClient(userId: string, data: Partial<Client>) {
  try {
    const newClient = await prisma.client.create({
      data: {
        userId,
        name: data.name!,
        email: data.email!,
        phone: data.phone!,
        status: data.status || 'Active',
        sensitiveNotes: data.sensitiveNotes,
      },
    });
    revalidatePath('/clients');
    return { success: true, data: newClient };
  } catch (error) {
    console.error('Error creating client:', error);
    return { success: false, error: 'Failed to create client' };
  }
}

export async function updateClient(userId: string, clientId: string, data: Partial<Client>) {
  try {
    // Verify ownership
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        sensitiveNotes: data.sensitiveNotes,
      },
    });
    revalidatePath('/clients');
    return { success: true, data: updatedClient };
  } catch (error) {
    console.error('Error updating client:', error);
    return { success: false, error: 'Failed to update client' };
  }
}

export async function deleteClient(userId: string, clientId: string) {
  try {
    // Verify ownership
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    await prisma.client.delete({
      where: { id: clientId },
    });
    revalidatePath('/clients');
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    return { success: false, error: 'Failed to delete client' };
  }
}
