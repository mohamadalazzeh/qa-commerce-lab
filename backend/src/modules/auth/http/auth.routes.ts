import { Router } from 'express';

import { validateBody } from '../../../shared/http/validate-body.js';
import type { AuthController } from './auth.controller.js';
import { registerCustomerSchema } from './register-customer.schema.js';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post('/register', validateBody(registerCustomerSchema), controller.register);

  return router;
}
