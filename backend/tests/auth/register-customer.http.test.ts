import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { RegisterCustomerService } from '../../src/modules/auth/application/register-customer.service.js';
import { AuthController } from '../../src/modules/auth/http/auth.controller.js';
import { createAuthRouter } from '../../src/modules/auth/http/auth.routes.js';
import { AppError } from '../../src/shared/errors/app-error.js';
import { errorHandler } from '../../src/shared/http/error-handler.js';

const validRequest = {
  firstName: 'Mohammad',
  lastName: 'Alazzeh',
  email: 'User@Example.COM',
  password: 'Example@123',
};

function createTestApp() {
  const execute = vi.fn<RegisterCustomerService['execute']>().mockResolvedValue(undefined);
  const service = { execute } as unknown as RegisterCustomerService;
  const controller = new AuthController(service);
  const app = express();

  app.use(express.json());
  app.use('/api/v1/auth', createAuthRouter(controller));
  app.use(errorHandler);

  return { app, execute };
}

describe('POST /api/v1/auth/register HTTP wiring', () => {
  it('returns the exact 201 contract response and no authentication tokens', async () => {
    const { app, execute } = createTestApp();

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validRequest)
      .expect(201);

    expect(response.body).toEqual({
      message: 'Registration successful. Please verify your email.',
      verificationRequired: true,
    });
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');
    expect(execute).toHaveBeenCalledWith({
      ...validRequest,
      email: 'user@example.com',
    });
  });

  it('rejects privileged fields before the service runs', async () => {
    const { app, execute } = createTestApp();

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validRequest, role: 'ADMIN' })
      .expect(400);

    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body.errors).toContainEqual({
      field: 'role',
      message: 'Unexpected field.',
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('maps malformed JSON to 400 VALIDATION_ERROR', async () => {
    const { app, execute } = createTestApp();

    const response = await request(app)
      .post('/api/v1/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"firstName":')
      .expect(400);

    expect(response.body).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed.',
      errors: [{ field: 'body', message: 'Invalid JSON body.' }],
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it('maps a service business error to the standard error shape', async () => {
    const { app, execute } = createTestApp();
    execute.mockRejectedValue(
      new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists.'),
    );

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validRequest)
      .expect(409);

    expect(response.body).toEqual({
      code: 'EMAIL_ALREADY_REGISTERED',
      message: 'An account with this email already exists.',
    });
  });

  it('preserves safe recovery details when verification email delivery fails', async () => {
    const { app, execute } = createTestApp();
    execute.mockRejectedValue(
      new AppError(
        503,
        'EMAIL_DELIVERY_FAILED',
        'Account created, but the verification email could not be delivered.',
        {
          accountCreated: true,
          verificationRequired: true,
        },
      ),
    );

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validRequest)
      .expect(503);

    expect(response.body).toEqual({
      code: 'EMAIL_DELIVERY_FAILED',
      message: 'Account created, but the verification email could not be delivered.',
      details: {
        accountCreated: true,
        verificationRequired: true,
      },
    });
  });
});
