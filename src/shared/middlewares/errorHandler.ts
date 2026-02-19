import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
): void => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Error occurred:', {
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

