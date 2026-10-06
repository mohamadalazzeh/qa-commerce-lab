import { createHash, randomBytes } from 'node:crypto';

import type { VerificationTokenGenerator } from '../application/registration.ports.js';

export class SecureVerificationTokenGenerator implements VerificationTokenGenerator {
  public generate(): { rawToken: string; tokenHash: string } {
    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    return { rawToken, tokenHash };
  }
}
