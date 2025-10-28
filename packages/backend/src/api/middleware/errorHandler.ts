import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ERROR_CODES } from '@forkweb/shared';
import type { ApiResponse } from '@forkweb/shared';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export async function errorHandler(
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: Date.now(),
    };
    return reply.status(error.statusCode).send(response);
  }

  // Handle Fastify validation errors
  if (error.validation) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ERROR_CODES.INVALID_REQUEST,
        message: 'Validation error',
        details: error.validation,
      },
      timestamp: Date.now(),
    };
    return reply.status(400).send(response);
  }

  // Generic error
  const response: ApiResponse = {
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: error.message || 'Internal server error',
    },
    timestamp: Date.now(),
  };
  
  return reply.status(error.statusCode || 500).send(response);
}
