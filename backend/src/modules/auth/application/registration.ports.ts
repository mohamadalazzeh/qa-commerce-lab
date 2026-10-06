export interface CreateRegistrationRecordInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  verificationTokenHash: string;
  verificationExpiresAt: Date;
}

export interface RegistrationRepository {
  emailExists(email: string): Promise<boolean>;

  createPendingCustomerWithVerificationToken(
    input: CreateRegistrationRecordInput,
  ): Promise<{ userId: string }>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
}

export interface VerificationTokenGenerator {
  generate(): { rawToken: string; tokenHash: string };
}

export interface RegistrationMailSender {
  sendVerificationEmail(input: {
    to: string;
    firstName: string;
    verificationToken: string;
  }): Promise<void>;
}
