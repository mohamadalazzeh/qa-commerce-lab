import { createClient } from 'redis';

import { env } from '../../config/env.js';
import { logger } from '../logging/logger.js';

export const redisClient = createClient({
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
});

redisClient.on('error', (error) => {
  logger.error({ err: error }, 'Redis client error');
});

export async function connectRedis(): Promise<void> {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  const response = await redisClient.ping();

  if (response !== 'PONG') {
    throw new Error(`Unexpected Redis ping response: ${response}`);
  }
}
