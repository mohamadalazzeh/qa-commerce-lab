import type { Pool, PoolClient } from 'pg';

import { AppError } from '../../../shared/errors/app-error.js';
import type {
  CreateRegistrationRecordInput,
  RegistrationRepository,
} from '../application/registration.ports.js';

interface PostgresErrorLike {
  code?: string;
  constraint?: string;
}

function isDuplicateEmailError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const postgresError = error as PostgresErrorLike;
  return postgresError.code === '23505' && postgresError.constraint === 'users_email_ci_unique';
}

async function rollbackQuietly(client: PoolClient): Promise<void> {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Preserve the original failure. Connection cleanup is handled by client.release().
  }
}

export class PostgresRegistrationRepository implements RegistrationRepository {
  public constructor(private readonly pool: Pool) {}

  public async emailExists(email: string): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM users
         WHERE LOWER(email) = LOWER($1)
       ) AS exists`,
      [email],
    );

    return result.rows[0]?.exists ?? false;
  }

  public async createPendingCustomerWithVerificationToken(
    input: CreateRegistrationRecordInput,
  ): Promise<{ userId: string }> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const existingUser = await client.query<{ id: string }>(
        `SELECT id
         FROM users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [input.email],
      );

      if (existingUser.rowCount && existingUser.rowCount > 0) {
        throw new AppError(
          409,
          'EMAIL_ALREADY_REGISTERED',
          'An account with this email already exists.',
        );
      }

      const userResult = await client.query<{ id: string }>(
        `INSERT INTO users (
           first_name,
           last_name,
           email,
           password_hash,
           role,
           status
         )
         VALUES ($1, $2, $3, $4, 'CUSTOMER', 'PENDING_VERIFICATION')
         RETURNING id`,
        [input.firstName, input.lastName, input.email, input.passwordHash],
      );

      const userId = userResult.rows[0]?.id;

      if (!userId) {
        throw new Error('Registration user insert returned no id.');
      }

      await client.query(
        `INSERT INTO email_verification_tokens (
           user_id,
           token_hash,
           expires_at
         )
         VALUES ($1, $2, $3)`,
        [userId, input.verificationTokenHash, input.verificationExpiresAt],
      );

      await client.query('COMMIT');
      return { userId };
    } catch (error) {
      await rollbackQuietly(client);

      if (isDuplicateEmailError(error)) {
        throw new AppError(
          409,
          'EMAIL_ALREADY_REGISTERED',
          'An account with this email already exists.',
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }
}
