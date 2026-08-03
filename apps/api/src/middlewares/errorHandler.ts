/**
 * Centralized JSON error responses — always `{ success: false, error: { code, message, details? } }`.
 */
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { logger } from '../logging';
import { AppError } from '../utils/AppError';
import { firstValidationMessage, formatZodError } from '../utils/zodErrors';

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
  requestId?: string,
): void {
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(requestId ? { request_id: requestId } : {}),
    },
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;
  const baseFields = {
    request_id: requestId,
    method: req.method,
    path: req.path,
    user_id: req.user?.id,
  };

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, {
        ...baseFields,
        code: err.code,
        details: err.details,
        stack: err.stack,
      });
    } else if (err.statusCode >= 400) {
      logger.warn(err.message, {
        ...baseFields,
        code: err.code,
        status: err.statusCode,
      });
    }
    sendError(res, err.statusCode, err.code, err.message, err.details, requestId);
    return;
  }

  if (err instanceof Error && err.message.startsWith('CORS_FORBIDDEN:')) {
    logger.warn('CORS origin rejected', {
      ...baseFields,
      origin: err.message.replace('CORS_FORBIDDEN:', ''),
    });
    sendError(
      res,
      403,
      'CORS_FORBIDDEN',
      'Origin is not allowed by CORS policy',
      undefined,
      requestId,
    );
    return;
  }

  if (err instanceof ZodError) {
    const details = formatZodError(err);
    logger.warn('Request validation failed', {
      ...baseFields,
      issues: details.issues.slice(0, 10),
    });
    sendError(
      res,
      400,
      'VALIDATION_ERROR',
      firstValidationMessage(details),
      details,
      requestId,
    );
    return;
  }

  if (err instanceof multer.MulterError) {
    logger.warn('Upload error', {
      ...baseFields,
      multer_code: err.code,
      message: err.message,
    });
    sendError(
      res,
      400,
      'UPLOAD_ERROR',
      err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : err.message,
      { code: err.code },
      requestId,
    );
    return;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    (err as { status?: number }).status === 429
  ) {
    logger.warn('Rate limit exceeded', baseFields);
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later',
      undefined,
      requestId,
    );
    return;
  }

  logger.error('Unhandled error', {
    ...baseFields,
    err:
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : String(err),
  });

  sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err instanceof Error
        ? err.message
        : 'An unexpected error occurred',
    undefined,
    requestId,
  );
}
