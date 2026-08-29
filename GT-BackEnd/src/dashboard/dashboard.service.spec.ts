import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchHistory } from '../database/entities/search-history.entity';
import { SearchType } from '../database/enums';
import { DashboardService } from './dashboard.service';

function mockQueryBuilder(options?: {
  total?: string;
  uniqueOrigins?: string;
  uniqueDestinations?: string;
  many?: unknown[];
}) {
  const getRawOne = jest.fn().mockResolvedValue({
    total: options?.total ?? '0',
    uniqueOrigins: options?.uniqueOrigins ?? '0',
    uniqueDestinations: options?.uniqueDestinations ?? '0',
  });
  const getRawMany = jest.fn().mockResolvedValue(options?.many ?? []);

  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne,
    getRawMany,
  };
}

describe('DashboardService', () => {
  let service: DashboardService;
  const createQueryBuilder = jest.fn();
  const cacheGet = jest.fn();
  const cacheSet = jest.fn();

  beforeEach(async () => {
    createQueryBuilder.mockReset();
    cacheGet.mockReset();
    cacheSet.mockReset();
    cacheGet.mockResolvedValue(undefined);
    cacheSet.mockResolvedValue(undefined);
    createQueryBuilder.mockImplementation(() => mockQueryBuilder());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(SearchHistory),
          useValue: { createQueryBuilder },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: cacheGet, set: cacheSet },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('returns empty chart series without login and caches the payload', async () => {
    const result = await service.getAnalytics({ days: 7, limit: 10 });

    expect(result.meta.cached).toBe(false);
    expect(result.data.summary.totalSearches).toBe(0);
    expect(result.data.summary.uniqueOrigins).toBe(0);
    expect(result.data.summary.uniqueDestinations).toBe(0);
    expect(result.data.topDestinations).toEqual([]);
    expect(result.data.topOrigins).toEqual([]);
    expect(result.data.topCountries).toEqual([]);
    expect(result.data.topRoutes).toEqual([]);
    expect(result.data.volumeByDay).toHaveLength(7);
    expect(result.data.volumeByDay.every((point) => point.count === 0)).toBe(
      true,
    );
    expect(result.data.period.days).toBe(7);
    expect(cacheSet).toHaveBeenCalled();
  });

  it('returns a cached payload on the next request', async () => {
    const cached = {
      generatedAt: '2026-08-28T00:00:00.000Z',
      period: { days: 30, from: '2026-07-30', to: '2026-08-28' },
      summary: { totalSearches: 12, byType: [] },
      topDestinations: [],
      topOrigins: [],
      topRoutes: [],
      volumeByDay: [],
      travelMonths: [],
    };
    cacheGet.mockResolvedValue(cached);

    const result = await service.getAnalytics({});

    expect(result).toEqual({ data: cached, meta: { cached: true } });
    expect(createQueryBuilder).not.toHaveBeenCalled();
  });

  it('maps aggregate rows into chart series', async () => {
    createQueryBuilder
      .mockImplementationOnce(() => mockQueryBuilder({ total: '5' }))
      .mockImplementationOnce(() =>
        mockQueryBuilder({
          many: [{ searchType: SearchType.FLIGHT, count: '5' }],
        }),
      )
      .mockImplementationOnce(() =>
        mockQueryBuilder({ uniqueOrigins: '2', uniqueDestinations: '3' }),
      )
      .mockImplementationOnce(() =>
        mockQueryBuilder({
          many: [
            {
              iata: 'MIA',
              cityName: 'Miami',
              countryName: 'United States',
              countryCode: 'US',
              count: '3',
            },
          ],
        }),
      )
      .mockImplementationOnce(() =>
        mockQueryBuilder({
          many: [
            {
              iata: 'SJO',
              cityName: 'San Jose',
              countryName: 'Costa Rica',
              countryCode: 'CR',
              count: '4',
            },
          ],
        }),
      )
      .mockImplementationOnce(() =>
        mockQueryBuilder({
          many: [
            {
              countryCode: 'US',
              countryName: 'United States',
              count: '3',
            },
          ],
        }),
      )
      .mockImplementationOnce(() =>
        mockQueryBuilder({
          many: [
            {
              originIata: 'SJO',
              destinationIata: 'MIA',
              originCityName: 'San Jose',
              destinationCityName: 'Miami',
              count: '2',
            },
          ],
        }),
      )
      .mockImplementationOnce(() => mockQueryBuilder({ many: [] }))
      .mockImplementationOnce(() =>
        mockQueryBuilder({
          many: [{ month: '2026-09', count: '2' }],
        }),
      );

    const result = await service.getAnalytics({ days: 1, limit: 5 });

    expect(result.data.summary.totalSearches).toBe(5);
    expect(result.data.summary.uniqueOrigins).toBe(2);
    expect(result.data.summary.uniqueDestinations).toBe(3);
    expect(result.data.summary.byType).toEqual([
      { searchType: SearchType.FLIGHT, count: 5 },
    ]);
    expect(result.data.topDestinations[0]).toEqual({
      iata: 'MIA',
      cityName: 'Miami',
      countryName: 'United States',
      countryCode: 'US',
      count: 3,
    });
    expect(result.data.topOrigins[0]?.iata).toBe('SJO');
    expect(result.data.topCountries[0]).toEqual({
      countryCode: 'US',
      countryName: 'United States',
      count: 3,
    });
    expect(result.data.topRoutes[0]).toMatchObject({
      originIata: 'SJO',
      destinationIata: 'MIA',
      count: 2,
    });
    expect(result.data.travelMonths).toEqual([{ month: '2026-09', count: 2 }]);
  });
});
