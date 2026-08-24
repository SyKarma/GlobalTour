import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppCacheService } from '../common/cache/app-cache.service';
import { CurrencyRate } from '../database/entities/currency-rate.entity';
import { CurrencyService } from './currency.service';
import { FrankfurterClient } from './frankfurter.client';

describe('CurrencyService', () => {
  let service: CurrencyService;
  const getLatest = jest.fn<FrankfurterClient['getLatest']>();
  const getHistory = jest.fn<FrankfurterClient['getHistory']>();
  const getCurrencies = jest.fn<FrankfurterClient['getCurrencies']>();
  const cacheGet = jest.fn<AppCacheService['get']>();
  const cacheSet = jest.fn<AppCacheService['set']>();
  const upsert = jest.fn();
  const find = jest.fn();
  const create = jest.fn((row: object) => row);

  beforeEach(async () => {
    getLatest.mockReset();
    getHistory.mockReset();
    getCurrencies.mockReset();
    cacheGet.mockReset();
    cacheSet.mockReset();
    upsert.mockReset();
    find.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: FrankfurterClient,
          useValue: { getLatest, getHistory, getCurrencies },
        },
        {
          provide: AppCacheService,
          useValue: { get: cacheGet, set: cacheSet },
        },
        {
          provide: getRepositoryToken(CurrencyRate),
          useValue: { upsert, find, create },
        },
      ],
    }).compile();

    service = module.get(CurrencyService);
  });

  it('returns live latest rates and caches them', async () => {
    getLatest.mockResolvedValue({
      amount: 1,
      base: 'USD',
      date: '2026-08-21',
      rates: { EUR: 0.86 },
    });

    const result = await service.getLatest({ base: 'USD', quotes: 'EUR' });

    expect(result.data.rates.EUR).toBe(0.86);
    expect(result.meta.source).toBe('frankfurter');
    expect(cacheSet).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalled();
  });

  it('falls back to cache when Frankfurter is down', async () => {
    getLatest.mockRejectedValue(new Error('timeout'));
    cacheGet.mockResolvedValue({
      value: {
        amount: 1,
        base: 'USD',
        date: '2026-08-20',
        rates: { EUR: 0.85 },
      },
      stale: true,
    });

    const result = await service.getLatest({ base: 'USD', quotes: 'EUR' });

    expect(result.meta.source).toBe('cache');
    expect(result.meta.stale).toBe(true);
    expect(result.data.rates.EUR).toBe(0.85);
  });

  it('converts USD to CRC using the latest rate', async () => {
    getLatest.mockResolvedValue({
      amount: 1,
      base: 'USD',
      date: '2026-08-21',
      rates: { CRC: 449.25 },
    });

    const result = await service.convert({
      amount: 100,
      from: 'USD',
      to: 'CRC',
    });

    expect(result.data.rate).toBe(449.25);
    expect(result.data.result).toBe(44925);
  });

  it('converts using the latest rate', async () => {
    getLatest.mockResolvedValue({
      amount: 1,
      base: 'USD',
      date: '2026-08-21',
      rates: { EUR: 0.5 },
    });

    const result = await service.convert({
      amount: 100,
      from: 'USD',
      to: 'EUR',
    });

    expect(result.data.result).toBe(50);
    expect(result.data.rate).toBe(0.5);
  });

  it('returns 1:1 when converting the same currency', async () => {
    const result = await service.convert({
      amount: 25,
      from: 'USD',
      to: 'USD',
    });

    expect(result.data.rate).toBe(1);
    expect(result.data.result).toBe(25);
    expect(getLatest).not.toHaveBeenCalled();
  });
});
