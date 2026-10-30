import { z } from 'zod';
import { paginationShape } from './common.validation.js';

const status = z.enum(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']);

export const listOrdersQuerySchema = z.object({
  ...paginationShape,
  status: status.optional(),
});

export const updateOrderStatusSchema = z.strictObject({ status });
