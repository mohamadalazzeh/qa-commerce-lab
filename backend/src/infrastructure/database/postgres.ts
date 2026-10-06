import { Pool } from 'pg';

import { env } from '../../config/env.js';

export const postgresPool = new Pool({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function verifyPostgresConnection(): Promise<string> {
  const result = await postgresPool.query<{ current_database: string }>(
    'SELECT current_database()',
  );

  const databaseName = result.rows[0]?.current_database;

  if (!databaseName) {
    throw new Error('PostgreSQL connection check returned no database name.');
  }

  return databaseName;
}
