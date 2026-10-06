import { postgresPool } from '../../infrastructure/database/postgres.js';
import { mailTransporter } from '../../infrastructure/mail/mail-client.js';
import { RegisterCustomerService } from './application/register-customer.service.js';
import { AuthController } from './http/auth.controller.js';
import { createAuthRouter } from './http/auth.routes.js';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher.js';
import { NodemailerRegistrationMailer } from './infrastructure/nodemailer-registration-mailer.js';
import { PostgresRegistrationRepository } from './infrastructure/postgres-registration.repository.js';
import { SecureVerificationTokenGenerator } from './infrastructure/secure-verification-token-generator.js';

const registrationRepository = new PostgresRegistrationRepository(postgresPool);
const passwordHasher = new Argon2PasswordHasher();
const tokenGenerator = new SecureVerificationTokenGenerator();
const registrationMailer = new NodemailerRegistrationMailer(mailTransporter);

const registerCustomerService = new RegisterCustomerService(
  registrationRepository,
  passwordHasher,
  tokenGenerator,
  registrationMailer,
);

const authController = new AuthController(registerCustomerService);

export const authRouter = createAuthRouter(authController);
