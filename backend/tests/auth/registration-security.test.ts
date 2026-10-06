import { createHash } from 'node:crypto';

import argon2 from 'argon2';
import { describe, expect, it } from 'vitest';

import { Argon2PasswordHasher } from '../../src/modules/auth/infrastructure/argon2-password-hasher.js';
import { SecureVerificationTokenGenerator } from '../../src/modules/auth/infrastructure/secure-verification-token-generator.js';

describe('Registration security adapters', () => {
  it('hashes passwords with Argon2id instead of persisting plaintext', async () => {
    const hasher = new Argon2PasswordHasher();
    const password = 'Example@123';

    const hash = await hasher.hash(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(argon2.verify(hash, password)).resolves.toBe(true);
  });

  it('returns a raw verification token but only a SHA-256 hash for persistence', () => {
    const generator = new SecureVerificationTokenGenerator();

    const { rawToken, tokenHash } = generator.generate();
    const expectedHash = createHash('sha256').update(rawToken).digest('hex');

    expect(rawToken).not.toBe(tokenHash);
    expect(tokenHash).toBe(expectedHash);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
