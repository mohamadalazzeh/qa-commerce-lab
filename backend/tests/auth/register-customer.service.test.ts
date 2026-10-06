import { describe, expect, it, vi } from 'vitest';

import { RegisterCustomerService } from '../../src/modules/auth/application/register-customer.service.js';
import type {
  PasswordHasher,
  RegistrationMailSender,
  RegistrationRepository,
  VerificationTokenGenerator,
} from '../../src/modules/auth/application/registration.ports.js';
import type { AppError } from '../../src/shared/errors/app-error.js';

function createDependencies(options?: { emailExists?: boolean; mailFails?: boolean }) {
  const emailExists = vi
    .fn<RegistrationRepository['emailExists']>()
    .mockResolvedValue(options?.emailExists ?? false);
  const createPendingCustomerWithVerificationToken = vi
    .fn<RegistrationRepository['createPendingCustomerWithVerificationToken']>()
    .mockResolvedValue({ userId: 'user-123' });
  const hash = vi.fn<PasswordHasher['hash']>().mockResolvedValue('argon2-hash');
  const generate = vi.fn<VerificationTokenGenerator['generate']>().mockReturnValue({
    rawToken: 'raw-verification-token',
    tokenHash: 'hashed-verification-token',
  });
  const sendVerificationEmail = vi.fn<RegistrationMailSender['sendVerificationEmail']>();

  if (options?.mailFails) {
    sendVerificationEmail.mockRejectedValue(new Error('SMTP unavailable'));
  } else {
    sendVerificationEmail.mockResolvedValue(undefined);
  }

  return {
    repository: {
      emailExists,
      createPendingCustomerWithVerificationToken,
    } satisfies RegistrationRepository,
    passwordHasher: { hash } satisfies PasswordHasher,
    tokenGenerator: { generate } satisfies VerificationTokenGenerator,
    mailSender: { sendVerificationEmail } satisfies RegistrationMailSender,
    mocks: {
      emailExists,
      createPendingCustomerWithVerificationToken,
      hash,
      generate,
      sendVerificationEmail,
    },
  };
}

const validInput = {
  firstName: 'Mohammad',
  lastName: 'Alazzeh',
  email: 'User@Example.COM',
  password: 'Example@123',
};

describe('RegisterCustomerService', () => {
  it('rejects an already registered email before password hashing', async () => {
    const dependencies = createDependencies({ emailExists: true });
    const service = new RegisterCustomerService(
      dependencies.repository,
      dependencies.passwordHasher,
      dependencies.tokenGenerator,
      dependencies.mailSender,
    );

    await expect(service.execute(validInput)).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    } satisfies Partial<AppError>);

    expect(dependencies.mocks.hash).not.toHaveBeenCalled();
    expect(dependencies.mocks.createPendingCustomerWithVerificationToken).not.toHaveBeenCalled();
    expect(dependencies.mocks.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('creates a pending customer and sends the raw verification token', async () => {
    const dependencies = createDependencies();
    const service = new RegisterCustomerService(
      dependencies.repository,
      dependencies.passwordHasher,
      dependencies.tokenGenerator,
      dependencies.mailSender,
    );

    const before = Date.now();
    await service.execute(validInput);
    const after = Date.now();

    expect(dependencies.mocks.hash).toHaveBeenCalledWith('Example@123');
    expect(dependencies.mocks.createPendingCustomerWithVerificationToken).toHaveBeenCalledOnce();

    const persistenceInput =
      dependencies.mocks.createPendingCustomerWithVerificationToken.mock.calls[0]?.[0];
    expect(persistenceInput).toBeDefined();
    expect(persistenceInput?.email).toBe('user@example.com');
    expect(persistenceInput?.passwordHash).toBe('argon2-hash');
    expect(persistenceInput?.verificationTokenHash).toBe('hashed-verification-token');

    const expiryMs = persistenceInput?.verificationExpiresAt.getTime();
    expect(expiryMs).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000);
    expect(expiryMs).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000);

    expect(dependencies.mocks.sendVerificationEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      firstName: 'Mohammad',
      verificationToken: 'raw-verification-token',
    });
  });

  it('returns EMAIL_DELIVERY_FAILED after persistence succeeds when mail delivery fails', async () => {
    const dependencies = createDependencies({ mailFails: true });
    const service = new RegisterCustomerService(
      dependencies.repository,
      dependencies.passwordHasher,
      dependencies.tokenGenerator,
      dependencies.mailSender,
    );

    await expect(service.execute(validInput)).rejects.toMatchObject({
      statusCode: 503,
      code: 'EMAIL_DELIVERY_FAILED',
      details: {
        accountCreated: true,
        verificationRequired: true,
      },
    } satisfies Partial<AppError>);

    expect(dependencies.mocks.createPendingCustomerWithVerificationToken).toHaveBeenCalledOnce();
  });
});
