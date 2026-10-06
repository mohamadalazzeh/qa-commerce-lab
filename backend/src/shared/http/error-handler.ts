import type { ErrorRequestHandler } from 'express';

import { logger } from '../../infrastructure/logging/logger.js';
import { AppError } from '../errors/app-error.js';

function isMalformedJsonError(error: unknown): boolean {
  if (!(error instanceof SyntaxError) || typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as { status?: unknown; body?: unknown };
  return candidate.status === 400 && 'body' in candidate;
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (isMalformedJsonError(error)) {
    logger.warn('Malformed JSON request body');

    response.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
      errors: [
        {
          field: 'body',
          message: 'Invalid JSON body.',
        },
      ],
    });
    return;
  }

  if (error instanceof AppError) {
    logger.warn(
      {
        code: error.code,
        statusCode: error.statusCode,
      },
      'Handled application error',
    );

    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  logger.error({ err: error }, 'Unhandled request error');

  response.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
  });
};
