import { z } from 'zod';

export const registerSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(100),
});

export const loginSchema = z.strictObject({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
