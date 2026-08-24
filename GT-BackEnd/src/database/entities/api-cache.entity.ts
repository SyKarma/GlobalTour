import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { CacheProvider } from '../enums';

@Entity('api_cache')
export class ApiCache {
  @PrimaryColumn({ name: 'cache_key', type: 'varchar', length: 128 })
  cacheKey: string;

  @Column({ type: 'enum', enum: CacheProvider })
  provider: CacheProvider;

  @Column({ type: 'json' })
  payload: unknown;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
