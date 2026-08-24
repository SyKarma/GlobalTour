import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AppCacheService } from '../common/cache/app-cache.service';
import { CurrencyService } from '../currency/currency.service';
import { TravelpayoutsClient } from '../travelpayouts/travelpayouts.client';
import { FlightsService } from './flights.service';

describe('FlightsService', () => {
  let service: FlightsService;
  const getPricesForDates = jest.fn<TravelpayoutsClient['getPricesForDates']>();
  const getGroupedPrices = jest.fn<TravelpayoutsClient['getGroupedPrices']>();
  const getAirlines = jest.fn<TravelpayoutsClient['getAirlines']>();
  const cacheGet = jest.fn<AppCacheService['get']>();
  const cacheSet = jest.fn<AppCacheService['set']>();

  beforeEach(async () => {
    getPricesForDates.mockReset();
    getGroupedPrices.mockReset();
    getAirlines.mockReset();
    cacheGet.mockReset();
    cacheSet.mockReset();
    cacheGet.mockResolvedValue(null);
    getAirlines.mockResolvedValue([{ code: 'IB', name: 'Iberia' }]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlightsService,
        {
          provide: TravelpayoutsClient,
          useValue: { getPricesForDates, getGroupedPrices, getAirlines },
        },
        {
          provide: AppCacheService,
          useValue: { get: cacheGet, set: cacheSet },
        },
        {
          provide: CurrencyService,
          useValue: {
            convert: jest.fn(async () => ({
              data: { rate: 1, result: 1 },
            })),
          },
        },
      ],
    }).compile();

    service = module.get(FlightsService);
  });

  it('normalizes offers and marks empty routes as unavailable', async () => {
    getPricesForDates.mockResolvedValue({
      success: true,
      currency: 'usd',
      data: [],
    });

    const empty = await service.search({
      origin: 'MAD',
      destination: 'XXX',
      currency: 'USD',
    });
    expect(empty.data).toEqual([]);
    expect(empty.meta.unavailable).toBe(true);

    getPricesForDates.mockResolvedValue({
      success: true,
      currency: 'usd',
      data: [
        {
          origin: 'MAD',
          destination: 'BCN',
          origin_airport: 'MAD',
          destination_airport: 'BCN',
          price: 45,
          airline: 'IB',
          flight_number: 8752,
          departure_at: '2026-09-01T07:00:00Z',
          transfers: 0,
          duration: 80,
          link: '/search/MAD0109BCN1',
        },
      ],
    });

    const result = await service.search({
      origin: 'MAD',
      destination: 'BCN',
      currency: 'USD',
    });

    expect(result.data[0]).toMatchObject({
      origin: 'MAD',
      destination: 'BCN',
      price: 45,
      currency: 'USD',
      airline: 'IB',
      airlineName: 'Iberia',
      transfers: 0,
    });
    expect(result.meta.unavailable).toBe(false);
    expect(cacheSet).toHaveBeenCalled();
  });

  it('builds monthly history points from grouped prices', async () => {
    getGroupedPrices.mockResolvedValue({
      success: true,
      currency: 'USD',
      data: {
        '2026-08': { price: 60, origin: 'MAD', destination: 'BCN', airline: 'IB' },
        '2026-09': { price: 40, origin: 'MAD', destination: 'BCN', airline: 'VY' },
      },
    });

    const result = await service.history({
      origin: 'MAD',
      destination: 'BCN',
      currency: 'USD',
    });

    expect(result.data.map((point) => point.period)).toEqual([
      '2026-08',
      '2026-09',
    ]);
    expect(result.data[1].price).toBe(40);
  });
});
