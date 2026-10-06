import { describe, expect, it } from 'vitest';

import { openApiDocument } from '../../src/openapi/openapi.js';

describe('Registration OpenAPI alignment', () => {
  it('documents the frozen register endpoint and expected response codes', () => {
    const operation = openApiDocument.paths?.['/api/v1/auth/register']?.post;

    expect(operation).toBeDefined();
    expect(operation?.responses).toHaveProperty('201');
    expect(operation?.responses).toHaveProperty('400');
    expect(operation?.responses).toHaveProperty('409');
    expect(operation?.responses).toHaveProperty('503');
  });
});
