import { describe, expect, it } from 'vitest';

import { registerCustomerSchema } from '../../src/modules/auth/http/register-customer.schema.js';

const validInput = {
  firstName: 'Mohammad',
  lastName: 'Al-Azzeh',
  email: 'User@Test.COM',
  password: 'Example@123',
};

describe('registerCustomerSchema', () => {
  it('accepts valid English input and normalizes email casing', () => {
    const result = registerCustomerSchema.parse(validInput);

    expect(result.email).toBe('user@test.com');
  });

  it('accepts Arabic names', () => {
    const result = registerCustomerSchema.safeParse({
      ...validInput,
      firstName: 'محمد',
      lastName: 'العزة',
      email: 'arabic@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('accepts supported spaces, hyphens, and apostrophes in names', () => {
    const result = registerCustomerSchema.safeParse({
      ...validInput,
      firstName: 'Mohammad Ali',
      lastName: "Al-Azzeh O'Neil",
    });

    expect(result.success).toBe(true);
  });

  it('accepts a 50-character name and rejects a 51-character name', () => {
    const accepted = registerCustomerSchema.safeParse({
      ...validInput,
      firstName: 'A'.repeat(50),
    });
    const rejected = registerCustomerSchema.safeParse({
      ...validInput,
      firstName: 'A'.repeat(51),
    });

    expect(accepted.success).toBe(true);
    expect(rejected.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = registerCustomerSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = new Set(result.error.issues.map((issue) => issue.path[0]));
      expect(fields).toEqual(new Set(['firstName', 'lastName', 'email', 'password']));
    }
  });

  it('rejects names containing numbers or unsupported symbols', () => {
    const result = registerCustomerSchema.safeParse({
      ...validInput,
      firstName: 'Mohammad123',
      lastName: 'Alazzeh!',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid email format', () => {
    const result = registerCustomerSchema.safeParse({
      ...validInput,
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an email longer than the PostgreSQL column limit', () => {
    const result = registerCustomerSchema.safeParse({
      ...validInput,
      email: 'a'.repeat(321),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes('320'))).toBe(true);
    }
  });

  it.each([
    ['too short', 'Aa1@aaa'],
    ['too long', `Aa1@${'a'.repeat(61)}`],
    ['missing uppercase', 'example@123'],
    ['missing lowercase', 'EXAMPLE@123'],
    ['missing number', 'Example@Test'],
    ['missing special character', 'Example123'],
  ])('rejects a password that is %s', (_caseName, password) => {
    const result = registerCustomerSchema.safeParse({
      ...validInput,
      password,
    });

    expect(result.success).toBe(false);
  });

  it('rejects privileged or unexpected fields', () => {
    const result = registerCustomerSchema.safeParse({
      ...validInput,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.code === 'unrecognized_keys')).toBe(true);
    }
  });
});
