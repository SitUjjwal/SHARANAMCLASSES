/**
 * Format Zod failures into a stable API error `details` payload.
 */
import type { ZodError, ZodIssue } from 'zod';

export type ValidationIssue = {
  path: string;
  message: string;
  code: string;
};

export type StructuredValidationDetails = {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
  issues: ValidationIssue[];
};

function issuePath(issue: ZodIssue): string {
  return issue.path.length ? issue.path.map(String).join('.') : '';
}

export function formatZodError(error: ZodError): StructuredValidationDetails {
  const flattened = error.flatten();
  const fieldErrors: Record<string, string[]> = {};

  for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
    if (Array.isArray(messages) && messages.length) {
      fieldErrors[key] = messages.filter((m): m is string => typeof m === 'string');
    }
  }

  // Nested paths from flatten() can be missing; rebuild from issues
  for (const issue of error.issues) {
    const path = issuePath(issue);
    if (!path) continue;
    if (!fieldErrors[path]) fieldErrors[path] = [];
    if (!fieldErrors[path].includes(issue.message)) {
      fieldErrors[path].push(issue.message);
    }
  }

  return {
    formErrors: flattened.formErrors ?? [],
    fieldErrors,
    issues: error.issues.map((issue) => ({
      path: issuePath(issue) || '(root)',
      message: issue.message,
      code: issue.code,
    })),
  };
}

export function firstValidationMessage(details: StructuredValidationDetails): string {
  const firstIssue = details.issues[0];
  if (firstIssue) {
    return firstIssue.path === '(root)'
      ? firstIssue.message
      : `${firstIssue.path}: ${firstIssue.message}`;
  }
  if (details.formErrors[0]) return details.formErrors[0];
  return 'Request validation failed';
}
