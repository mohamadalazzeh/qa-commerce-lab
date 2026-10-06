import { z } from 'zod';

const supportedNameRegex =
  /^(?!.*\p{Number})[A-Za-z\p{Script=Arabic}]+(?:[ '-][A-Za-z\p{Script=Arabic}]+)*$/u;

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required.')
  .max(50, 'Name must be 50 characters or fewer.')
  .regex(
    supportedNameRegex,
    'Name may contain Arabic or English letters, spaces, hyphens, and apostrophes only.',
  );

const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters.')
  .max(64, 'Password must contain at most 64 characters.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^A-Za-z0-9\s]/, 'Password must contain at least one special character.');

export const registerCustomerSchema = z.strictObject({
  firstName: nameSchema,
  lastName: nameSchema,
  email: z
    .string()
    .trim()
    .max(320, 'Email must contain at most 320 characters.')
    .pipe(z.email('Email is invalid.'))
    .transform((email) => email.toLowerCase()),
  password: passwordSchema,
});

export type RegisterCustomerRequest = z.infer<typeof registerCustomerSchema>;
