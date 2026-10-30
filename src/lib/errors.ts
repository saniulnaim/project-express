export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, errors?: unknown) =>
  new HttpError(400, message, errors);
export const unauthorized = (message = 'Unauthorized') =>
  new HttpError(401, message);
export const forbidden = (message = 'Forbidden') => new HttpError(403, message);
export const notFound = (resource: string) =>
  new HttpError(404, `${resource} not found`);
export const conflict = (message: string) => new HttpError(409, message);
