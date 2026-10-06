import type { RequestHandler } from 'express';

import type { RegisterCustomerService } from '../application/register-customer.service.js';
import type { RegisterCustomerRequest } from './register-customer.schema.js';

export class AuthController {
  public constructor(private readonly registerCustomerService: RegisterCustomerService) {}

  public readonly register: RequestHandler = async (request, response) => {
    const input = request.body as RegisterCustomerRequest;

    await this.registerCustomerService.execute(input);

    response.status(201).json({
      message: 'Registration successful. Please verify your email.',
      verificationRequired: true,
    });
  };
}
