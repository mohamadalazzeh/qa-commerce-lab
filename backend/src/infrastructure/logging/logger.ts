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
        'req.body.password',
        'req.body.newPassword',
        'req.body.token',
        'req.body.refreshToken',
        'req.body.resetToken',
        'req.body.otp',
        'req.query.token',
        'req.query.refreshToken',
        'req.query.resetToken',
        'req.query.otp',
        'req.params.token',
        'password',
        'passwordHash',
        'newPassword',
        'token',
        'tokenHash',
        'refreshToken',
        'resetToken',
        'otp',
        'otpHash',
      ],
      censor: '[REDACTED]',
    },
  },
  transport,
);
