import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AppCacheService } from '../common/cache/app-cache.service';
import { HotelsService } from './hotels.service';
import { LiteApiClient } from './liteapi.client';

describe('HotelsService', () => {
  let service: HotelsService;
  const searchHotels = jest.fn<LiteApiClient['searchHotels']>();
  const getHotel = jest.fn<LiteApiClient['getHotel']>();
  const getRates = jest.fn<LiteApiClient['getRates']>();
  const cacheGet = jest.fn<AppCacheService['get']>();
  const cacheSet = jest.fn<AppCacheService['set']>();

  beforeEach(async () => {
    searchHotels.mockReset();
    getHotel.mockReset();
    getRates.mockReset();
    cacheGet.mockReset();
    cacheSet.mockReset();
    cacheGet.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelsService,
        {
          provide: LiteApiClient,
          useValue: { searchHotels, getHotel, getRates },
        },
        {
          provide: AppCacheService,
          useValue: { get: cacheGet, set: cacheSet },
        },
      ],
    }).compile();

    service = module.get(HotelsService);
  });

  it('normalizes hotel listings and marks empty cities as unavailable', async () => {
    searchHotels.mockResolvedValue({ data: [], total: 0 });
    const empty = await service.search({
      countryCode: 'ES',
      cityName: 'Nowhere',
    });
    expect(empty.data).toEqual([]);
    expect(empty.meta.unavailable).toBe(true);

    searchHotels.mockResolvedValue({
      data: [
        {
          id: 'lp1897',
          name: 'Hotel Jadran',
          city: 'Barcelona',
          country: 'ES',
          stars: 3,
          rating: 8.2,
          thumbnail: 'https://example.com/thumb.jpg',
        },
      ],
      total: 1,
    });

    const result = await service.search({
      countryCode: 'ES',
      cityName: 'Barcelona',
    });

    expect(result.data[0]).toMatchObject({
      id: 'lp1897',
      name: 'Hotel Jadran',
      city: 'Barcelona',
      starRating: 3,
      provider: 'liteapi',
      href: '/api/hotels/lp1897',
      links: {
        self: '/api/hotels/lp1897',
        rates: '/api/hotels/lp1897/rates',
      },
    });
    expect(result.meta.unavailable).toBe(false);
    expect(cacheSet).toHaveBeenCalled();
  });

  it('extracts cheapest room rates', async () => {
    getRates.mockResolvedValue({
      data: [
        {
          hotelId: 'lp1897',
          roomTypes: [
            {
              rates: [
                {
                  name: 'Standard',
                  boardName: 'Room Only',
                  maxOccupancy: 2,
                  retailRate: { total: [{ amount: 120, currency: 'USD' }] },
                },
                {
                  name: 'Deluxe',
                  boardName: 'Breakfast Included',
                  maxOccupancy: 2,
                  retailRate: { total: [{ amount: 90, currency: 'USD' }] },
                },
              ],
            },
          ],
        },
      ],
    });

    const result = await service.getRates('lp1897', {
      checkin: '2026-09-15',
      checkout: '2026-09-18',
      currency: 'USD',
    });

    expect(result.data.rates[0].price).toBe(90);
    expect(result.data.rates[0].board).toBe('Breakfast Included');
    expect(result.meta.unavailable).toBe(false);
  });
});
