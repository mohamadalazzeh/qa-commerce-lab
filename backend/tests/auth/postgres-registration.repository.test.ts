import type { Pool, PoolClient } from 'pg';
import { describe, expect, it, vi } from 'vitest';

import { PostgresRegistrationRepository } from '../../src/modules/auth/infrastructure/postgres-registration.repository.js';

const registrationInput = {
  firstName: 'Mohammad',
  lastName: 'Alazzeh',
  email: 'user@example.com',
  passwordHash: 'argon2-hash',
  verificationTokenHash: 'verification-token-hash',
  verificationExpiresAt: new Date('2026-10-07T10:00:00.000Z'),
};

function createPoolWithMockClient() {
  const query = vi.fn<(...args: unknown[]) => Promise<unknown>>();
  const release = vi.fn();
  const client = { query, release } as unknown as PoolClient;
  const connect = vi.fn<() => Promise<PoolClient>>().mockResolvedValue(client);
  const pool = { connect } as unknown as Pool;

  return { pool, query, release };
}

describe('PostgresRegistrationRepository', () => {
  it('creates the user and verification token in one committed transaction', async () => {
    const { pool, query, release } = createPoolWithMockClient();
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'user-123' }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const repository = new PostgresRegistrationRepository(pool);
    const result = await repository.createPendingCustomerWithVerificationToken(registrationInput);

    expect(result).toEqual({ userId: 'user-123' });
    expect(query.mock.calls[0]?.[0]).toBe('BEGIN');
    expect(String(query.mock.calls[2]?.[0])).toContain('INSERT INTO users');
    expect(String(query.mock.calls[3]?.[0])).toContain('INSERT INTO email_verification_tokens');
    expect(query.mock.calls[4]?.[0]).toBe('COMMIT');
    expect(release).toHaveBeenCalledOnce();
  });

  it('rolls back when verification-token persistence fails', async () => {
    const { pool, query, release } = createPoolWithMockClient();
    const tokenFailure = new Error('verification token insert failed');
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'user-123' }] })
      .mockRejectedValueOnce(tokenFailure)
      .mockResolvedValueOnce({});

    const repository = new PostgresRegistrationRepository(pool);

    await expect(
      repository.createPendingCustomerWithVerificationToken(registrationInput),
    ).rejects.toBe(tokenFailure);

    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(release).toHaveBeenCalledOnce();
  });

  it('maps a database unique-email race to 409 EMAIL_ALREADY_REGISTERED', async () => {
    const { pool, query, release } = createPoolWithMockClient();
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockRejectedValueOnce({
        code: '23505',
        constraint: 'users_email_ci_unique',
      })
      .mockResolvedValueOnce({});

    const repository = new PostgresRegistrationRepository(pool);

    await expect(
      repository.createPendingCustomerWithVerificationToken(registrationInput),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    });

    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(release).toHaveBeenCalledOnce();
  });

  it('defensively rejects an email found inside the transaction', async () => {
    const { pool, query, release } = createPoolWithMockClient();
    query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'existing-user' }] })
      .mockResolvedValueOnce({});

    const repository = new PostgresRegistrationRepository(pool);

    await expect(
      repository.createPendingCustomerWithVerificationToken(registrationInput),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    });

    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
    expect(query.mock.calls.some((call) => String(call[0]).includes('INSERT INTO users'))).toBe(
      false,
    );
    expect(release).toHaveBeenCalledOnce();
  });
});
