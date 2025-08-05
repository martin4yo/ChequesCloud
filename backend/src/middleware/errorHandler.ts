import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Error de validación';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'No autorizado';
  } else if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Error de validación de datos';
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'El registro ya existe';
  }

  // Log error for debugging
  console.error('❌ Error occurred:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });

  const response: ApiResponse = {
    success: false,
    error: message,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.data = { stack: error.stack };
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};