import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { signToken } from '../lib/auth.js';
import { conflict, unauthorized } from '../lib/errors.js';
import type { User } from '../../generated/prisma/client';
import type { LoginInput, RegisterInput } from '../validations/auth.validation.js';

const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const session = (user: User) => ({
  user: publicUser(user),
  token: signToken({ id: user.id, role: user.role }),
});

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw conflict('Email already registered');
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: await bcrypt.hash(input.password, 10),
    },
  });

  return session(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const valid =
    user !== null && (await bcrypt.compare(input.password, user.passwordHash));

  if (!user || !valid) {
    throw unauthorized('Invalid email or password');
  }

  return session(user);
}

export async function getProfile(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    // token is valid but the account no longer exists
    throw unauthorized();
  }

  return publicUser(user);
}
