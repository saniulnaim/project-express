import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.errors === undefined ? {} : { errors: err.errors }),
    });
    return;
  }

  // body-parser reports malformed JSON with this type
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid JSON body' });
    return;
  }

  console.error(err?.stack ?? err);

  res.status(500).json({
    message: 'Internal server error',
  });
};
