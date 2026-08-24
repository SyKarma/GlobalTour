import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { ALL_ENTITIES } from './entities';
import { InitialSchema20260821000000 } from './migrations/20260821000000-InitialSchema';

config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ALL_ENTITIES,
  migrations: [InitialSchema20260821000000],
  synchronize: false,
  charset: 'utf8mb4',
  timezone: 'Z',
  logging: ['error', 'warn', 'migration'],
});

export default AppDataSource;
