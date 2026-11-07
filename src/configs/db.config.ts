import path from 'node:path';
import pg from 'pg';
import type { DataSourceOptions } from 'typeorm';
import ENTITIES from '../entities/index.js';

// Return `date` columns as 'YYYY-MM-DD' strings instead of local-midnight JS Dates
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

const dbConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ENTITIES,
  synchronize: false,
  migrationsRun: false,
  migrations: [path.join(import.meta.dirname, '../migrations/*.js')],
  migrationsTableName: 'migrations',
  dropSchema: false,
  connectTimeoutMS: 10_000,
  poolSize: 10,
  ssl:
    process.env.ENV === 'production'
      ? {
          rejectUnauthorized: true,
        }
      : false,
  extra: {
    idleTimeoutMillis: 30_000,
  },
};

export default dbConfig;
