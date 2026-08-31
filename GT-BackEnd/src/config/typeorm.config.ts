import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvironmentVariables } from './env.validation';
import { ALL_ENTITIES } from '../database/entities';
import { InitialSchema20260821000000 } from '../database/migrations/20260821000000-InitialSchema';
import { SearchHistoryAnalytics20260828210000 } from '../database/migrations/20260828210000-SearchHistoryAnalytics';
import { DestinationFlightableSearch20260828220000 } from '../database/migrations/20260828220000-DestinationFlightableSearch';
import { RestaurantSearchSupport20260831120000 } from '../database/migrations/20260831120000-RestaurantSearchSupport';
import { OverpassCacheProvider20260831140000 } from '../database/migrations/20260831140000-OverpassCacheProvider';
import { CarSearchSupport20260831150000 } from '../database/migrations/20260831150000-CarSearchSupport';

export function typeOrmConfig(
  config: ConfigService<EnvironmentVariables, true>,
): TypeOrmModuleOptions {
  const isDev = config.get('NODE_ENV', { infer: true }) === 'development';

  return {
    type: 'mysql',
    host: config.get('DATABASE_HOST', { infer: true }),
    port: config.get('DATABASE_PORT', { infer: true }),
    username: config.get('DATABASE_USER', { infer: true }),
    password: config.get('DATABASE_PASSWORD', { infer: true }),
    database: config.get('DATABASE_NAME', { infer: true }),
    entities: ALL_ENTITIES,
    migrations: [
      InitialSchema20260821000000,
      SearchHistoryAnalytics20260828210000,
      DestinationFlightableSearch20260828220000,
      RestaurantSearchSupport20260831120000,
      OverpassCacheProvider20260831140000,
      CarSearchSupport20260831150000,
    ],
    migrationsRun: true,
    synchronize: false,
    autoLoadEntities: true,
    charset: 'utf8mb4',
    timezone: 'Z',
    retryAttempts: 5,
    retryDelay: 3000,
    logging: isDev ? ['error', 'warn', 'migration'] : ['error'],
  };
}
