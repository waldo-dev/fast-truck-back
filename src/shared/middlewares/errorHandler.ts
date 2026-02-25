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
  // Extra info de errores de base de datos (Sequelize/Postgres) para depurar
  const dbDetail =
    (err as any)?.parent?.detail ||
    (err as any)?.original?.detail ||
    (err as any)?.parent?.message ||
    (err as any)?.original?.message;
  const dbCode = (err as any)?.parent?.code || (err as any)?.original?.code;

  logger.error('Error occurred:', {
    statusCode,
    message,
    dbCode,
    dbDetail,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(dbCode ? { code: dbCode } : {}),
      ...(dbDetail ? { detail: dbDetail } : {}),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

