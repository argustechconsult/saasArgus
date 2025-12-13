'use server';

import { prisma } from '../prisma';
import { hashPassword, comparePassword } from '../../utils/bcryptUtils';
import { LoginFormData, RegisterFormData } from '../../lib/validators';
import { v4 as uuidv4 } from 'uuid';

export async function login(data: LoginFormData) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValid = await comparePassword(data.password, user.passwordHash);

    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    const { passwordHash, ...userWithoutHash } = user;
    return { success: true, data: userWithoutHash };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Something went wrong' };
  }
}

export async function register(data: RegisterFormData) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: 'Email already in use' };
    }

    const passwordHash = await hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email,
        passwordHash,
        name: data.name,
      },
    });

    const { passwordHash: _, ...userWithoutHash } = newUser;
    return { success: true, data: userWithoutHash };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Something went wrong' };
  }
}
