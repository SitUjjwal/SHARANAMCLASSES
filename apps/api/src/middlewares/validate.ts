/**
 * Zod request validation middleware.
 *
 * Architecture:
 *   Route → validate(schema) | validateRequest({ body, query, params })
 *        → on fail: AppError(400, VALIDATION_ERROR, message, structured details)
 *        → on ok:  replace req.body / req.query / req.params with parsed data
 *
 * Error `details` shape:
 *   {
 *     formErrors: string[],
 *     fieldErrors: { [path]: string[] },
 *     issues: [{ path, message, code }]
 *   }
 */
import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';

import { AppError } from '../utils/AppError';
import { firstValidationMessage, formatZodError } from '../utils/zodErrors';

export type RequestValidationTarget = 'body' | 'query' | 'params';

export type ValidateRequestSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};

function fail(next: NextFunction, error: ZodError): void {
  const details = formatZodError(error);
  next(new AppError(400, 'VALIDATION_ERROR', firstValidationMessage(details), details));
}

function assignParsed(
  req: Request,
  target: RequestValidationTarget,
  data: unknown,
): void {
  if (target === 'body') {
    req.body = data;
    return;
  }
  if (target === 'query') {
    req.query = data as Request['query'];
    return;
  }
  req.params = data as Request['params'];
}

/**
 * Validate a single request slice.
 * @example validate(createCourseSchema)
 * @example validate(listTestsQuerySchema, 'query')
 * @example validate(uuidIdParamSchema, 'params')
 */
export function validate(schema: ZodSchema, target: RequestValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      fail(next, result.error);
      return;
    }
    assignParsed(req, target, result.data);
    next();
  };
}

/**
 * Validate multiple slices in one middleware (params → query → body).
 * @example
 * validateRequest({
 *   params: uuidIdParamSchema,
 *   body: updateCourseSchema,
 * })
 */
export function validateRequest(schemas: ValidateRequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const order: RequestValidationTarget[] = ['params', 'query', 'body'];

    for (const target of order) {
      const schema = schemas[target];
      if (!schema) continue;
      const result = schema.safeParse(req[target]);
      if (!result.success) {
        fail(next, result.error);
        return;
      }
      assignParsed(req, target, result.data);
    }

    next();
  };
}
