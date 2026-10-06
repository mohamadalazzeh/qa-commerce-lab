import { AppError } from '../../../shared/errors/app-error.js';
import type {
  PasswordHasher,
  RegistrationMailSender,
  RegistrationRepository,
  VerificationTokenGenerator,
} from './registration.ports.js';

export interface RegisterCustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const VERIFICATION_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

export class RegisterCustomerService {
  public constructor(
    private readonly repository: RegistrationRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: VerificationTokenGenerator,
    private readonly mailSender: RegistrationMailSender,
  ) {}

  public async execute(input: RegisterCustomerInput): Promise<void> {
    const normalizedEmail = input.email.trim().toLowerCase();

    if (await this.repository.emailExists(normalizedEmail)) {
      throw new AppError(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'An account with this email already exists.',
      );
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const { rawToken, tokenHash } = this.tokenGenerator.generate();
    const verificationExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_LIFETIME_MS);

    await this.repository.createPendingCustomerWithVerificationToken({
      firstName: input.firstName,
      lastName: input.lastName,
      email: normalizedEmail,
      passwordHash,
      verificationTokenHash: tokenHash,
      verificationExpiresAt,
    });

    try {
      await this.mailSender.sendVerificationEmail({
        to: normalizedEmail,
        firstName: input.firstName,
        verificationToken: rawToken,
      });
    } catch {
      throw new AppError(
        503,
        'EMAIL_DELIVERY_FAILED',
        'Account created, but the verification email could not be delivered.',
        {
          accountCreated: true,
          verificationRequired: true,
        },
      );
    }
  }
}
