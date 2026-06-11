import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message,
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
    });
  }

  if ((err as any).code === 11000) {
    return res.status(409).json({
      error: 'Duplicate key error',
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
}
