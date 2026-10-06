import type { Server } from 'node:http';

import { app } from './app.js';
import { env } from './config/env.js';
import { postgresPool, verifyPostgresConnection } from './infrastructure/database/postgres.js';
import { logger } from './infrastructure/logging/logger.js';
import { mailTransporter, verifyMailTransport } from './infrastructure/mail/mail-client.js';
import { connectRedis, redisClient } from './infrastructure/redis/redis-client.js';

let server: Server | undefined;

async function closeHttpServer(): Promise<void> {
  const activeServer = server;

  if (!activeServer) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    activeServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function closeInfrastructure(): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }

  await postgresPool.end();
  mailTransporter.close();
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown requested');

  try {
    await closeHttpServer();
    await closeInfrastructure();
    logger.info('Shutdown completed');
    process.exitCode = 0;
  } catch (error) {
    logger.error({ err: error }, 'Shutdown failed');
    process.exitCode = 1;
  }
}

async function bootstrap(): Promise<void> {
  const databaseName = await verifyPostgresConnection();
  logger.info({ database: databaseName }, 'PostgreSQL connection verified');

  await connectRedis();
  logger.info('Redis connection verified');

  await verifyMailTransport();
  logger.info({ host: env.SMTP_HOST, port: env.SMTP_PORT }, 'SMTP/Mailpit connection verified');

  server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'HTTP server listening');
  });
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void bootstrap().catch(async (error: unknown) => {
  logger.fatal({ err: error }, 'Backend startup failed');

  try {
    await closeInfrastructure();
  } catch (cleanupError) {
    logger.error({ err: cleanupError }, 'Startup cleanup failed');
  }

  process.exitCode = 1;
});
