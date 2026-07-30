import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

import { AppError } from '../utils/AppError';

type RequestValidationTarget = 'body' | 'query' | 'params';

/**
 * Zod-based validation middleware.
 * Usage: validate(schema) or validate(schema, 'query')
 */
export function validate(schema: ZodSchema, target: RequestValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(
        new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', result.error.flatten()),
      );
      return;
    }

    req[target] = result.data;
    next();
  };
}
