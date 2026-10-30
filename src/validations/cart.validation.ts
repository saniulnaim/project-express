import { z } from 'zod';

const quantity = z.number().int().min(1).max(99);

export const addCartItemSchema = z.strictObject({
  productId: z.number().int().positive(),
  quantity,
});

export const updateCartItemSchema = z.strictObject({ quantity });
