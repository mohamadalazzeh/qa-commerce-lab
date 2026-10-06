import pino from 'pino';

import { env } from '../../config/env.js';

const transport =
  env.NODE_ENV === 'development'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:standard',
        },
      })
    : undefined;

export const logger = pino(
  {
    level: env.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers.set-cookie',
        'password',
        'newPassword',
        'token',
        'otp',
      ],
      censor: '[REDACTED]',
    },
  },
  transport,
);
