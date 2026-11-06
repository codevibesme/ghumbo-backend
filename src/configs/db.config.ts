import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import pg from 'pg';
import ENTITIES from '../entities/index.js';

// Return `date` columns as 'YYYY-MM-DD' strings instead of local-midnight JS Dates
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

const dbConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ENTITIES,
  synchronize: process.env.ENV === 'local',
  dropSchema: false,
  connectTimeoutMS: 50000,
  extra: {
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    ...(process.env.DB_SSL === 'true' && {
      ssl: {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
        ca: process.env.DB_CA_CERT,
        key: process.env.DB_CLIENT_KEY,
        cert: process.env.DB_CLIENT_CERT,
      },
    }),
  },
};

export default dbConfig;
