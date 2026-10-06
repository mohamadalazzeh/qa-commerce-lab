import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { registerCustomerSchema } from '../modules/auth/http/register-customer.schema.js';

const registry = new OpenAPIRegistry();

const businessErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});

const validationErrorSchema = businessErrorSchema.extend({
  errors: z.array(
    z.object({
      field: z.string(),
      message: z.string(),
    }),
  ),
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Authentication'],
  summary: 'Register a new Customer',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: registerCustomerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Customer created in PENDING_VERIFICATION state.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.literal('Registration successful. Please verify your email.'),
            verificationRequired: z.literal(true),
          }),
        },
      },
    },
    400: {
      description: 'Request validation failed.',
      content: {
        'application/json': {
          schema: validationErrorSchema,
        },
      },
    },
    409: {
      description: 'Email is already registered.',
      content: {
        'application/json': {
          schema: businessErrorSchema,
        },
      },
    },
    503: {
      description: 'Account was created but verification email delivery failed.',
      content: {
        'application/json': {
          schema: businessErrorSchema.extend({
            details: z.object({
              accountCreated: z.literal(true),
              verificationRequired: z.literal(true),
            }),
          }),
        },
      },
    },
  },
});

const generator = new OpenApiGeneratorV31(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'QA Commerce Lab API',
    version: '1.0.0',
    description: 'Portfolio-grade e-commerce API used for QA Engineering practice.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
});
