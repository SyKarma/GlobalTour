import { createHash } from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { LessThan, Repository } from 'typeorm';
import { ApiCache } from '../../database/entities/api-cache.entity';
import { CacheProvider } from '../../database/enums';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AppCacheService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly memoryCache: Cache,
    @InjectRepository(ApiCache)
    private readonly apiCacheRepo: Repository<ApiCache>,
  ) {}

  static hashKey(parts: unknown[]): string {
    return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
  }

  async get<T>(key: string): Promise<{ value: T; stale: boolean } | null> {
    const memory = await this.memoryCache.get<T>(key);
    if (memory !== undefined && memory !== null) {
      return { value: memory, stale: false };
    }

    const row = await this.apiCacheRepo.findOne({ where: { cacheKey: key } });
    if (!row) {
      return null;
    }

    const stale = row.expiresAt.getTime() < Date.now();
    if (!stale) {
      const ttl = row.expiresAt.getTime() - Date.now();
      await this.memoryCache.set(key, row.payload as T, ttl);
    }

    return { value: row.payload as T, stale };
  }

  async set<T>(
    key: string,
    value: T,
    provider: CacheProvider,
    ttlMs = DAY_MS,
  ): Promise<void> {
    await this.memoryCache.set(key, value, ttlMs);
    await this.apiCacheRepo.save({
      cacheKey: key,
      provider,
      payload: value,
      expiresAt: new Date(Date.now() + ttlMs),
    });
  }

  async deleteExpired(): Promise<void> {
    await this.apiCacheRepo.delete({ expiresAt: LessThan(new Date()) });
  }
}
