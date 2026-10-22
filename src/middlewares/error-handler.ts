import type {
  ErrorRequestHandler,
} from 'express';

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  next,
) => {
  console.error(err.stack);

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(500).json({
    message: 'Internal server error',
  });
};