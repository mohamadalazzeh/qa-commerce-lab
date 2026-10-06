import argon2 from 'argon2';

import type { PasswordHasher } from '../application/registration.ports.js';

export class Argon2PasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
    });
  }
}
