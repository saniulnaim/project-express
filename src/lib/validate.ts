import type { z } from 'zod';
import { badRequest } from './errors.js';

export function parse<S extends z.ZodType>(
  schema: S,
  data: unknown,
): z.output<S> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw badRequest('Validation failed', result.error.issues);
  }

  return result.data;
}

export function parseId(raw: unknown, resource: string): number {
  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`Invalid ${resource} ID`);
  }

  return id;
}
