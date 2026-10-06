import type { RequestHandler } from 'express';
import type { ZodIssue, ZodType } from 'zod';

interface ValidationItem {
  field: string;
  message: string;
}

function issueToValidationItems(issue: ZodIssue): ValidationItem[] {
  if (issue.code === 'unrecognized_keys') {
    return issue.keys.map((key) => ({
      field: key,
      message: 'Unexpected field.',
    }));
  }

  return [
    {
      field: issue.path.join('.') || 'body',
      message: issue.message,
    },
  ];
}

export function validateBody(schema: ZodType): RequestHandler {
  return (request, response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed.',
        errors: result.error.issues.flatMap(issueToValidationItems),
      });
      return;
    }

    request.body = result.data;
    next();
  };
}
