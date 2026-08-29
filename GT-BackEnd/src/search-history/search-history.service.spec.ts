import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Destination } from '../database/entities/destination.entity';
import { SearchHistory } from '../database/entities/search-history.entity';
import { SearchType } from '../database/enums';
import { SearchHistoryService } from './search-history.service';

async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('SearchHistoryService', () => {
  let service: SearchHistoryService;
  const save = jest.fn();
  const create = jest.fn((row: object) => row);
  const getOne = jest.fn();
  const createQueryBuilder = jest.fn();

  beforeEach(async () => {
    save.mockReset();
    create.mockClear();
    getOne.mockReset();
    createQueryBuilder.mockReset();
    save.mockResolvedValue(undefined);
    createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchHistoryService,
        {
          provide: getRepositoryToken(SearchHistory),
          useValue: { save, create },
        },
        {
          provide: getRepositoryToken(Destination),
          useValue: { createQueryBuilder },
        },
      ],
    }).compile();

    service = module.get(SearchHistoryService);
  });

  it('records a guest flight search with travel month', async () => {
    service.recordFlight({
      origin: 'SJO',
      destination: 'MIA',
      departureAt: '2026-09-15',
      returnAt: '2026-09-22',
      currency: 'USD',
    });
    await flush();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        searchType: SearchType.FLIGHT,
        originIata: 'SJO',
        destinationIata: 'MIA',
        travelMonth: '2026-09',
      }),
    );
  });

  it('records a destination IATA typed in the search box', async () => {
    service.recordDestination({ q: 'bcn' }, null);
    await flush();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        searchType: SearchType.DESTINATION,
        destinationIata: 'BCN',
        originIata: null,
      }),
    );
  });

  it('falls back to the first destination match when the query is a city name', async () => {
    service.recordDestination({ q: 'barcelona' }, 'BCN');
    await flush();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        destinationIata: 'BCN',
      }),
    );
  });

  it('records a hotel search using the catalog IATA when the city matches', async () => {
    getOne.mockResolvedValue({ cityIata: 'BCN' });

    service.recordHotel({ countryCode: 'ES', cityName: 'Barcelona' });
    await flush();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        searchType: SearchType.HOTEL,
        destinationIata: 'BCN',
        queryJson: { cityName: 'Barcelona', countryCode: 'ES' },
      }),
    );
  });

  it('records a currency conversion without IATA codes', async () => {
    service.recordCurrency({ amount: 100, from: 'USD', to: 'EUR' });
    await flush();

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        searchType: SearchType.CURRENCY,
        originIata: null,
        destinationIata: null,
        queryJson: { from: 'USD', to: 'EUR' },
      }),
    );
  });

  it('does not throw when insert fails', async () => {
    save.mockRejectedValue(new Error('disk full'));

    expect(() =>
      service.recordFlight({ origin: 'SJO', destination: 'MIA' }),
    ).not.toThrow();
    await flush();
  });
});
