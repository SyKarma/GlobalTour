import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from '../database/entities/destination.entity';
import { TravelpayoutsClient } from '../travelpayouts/travelpayouts.client';
import { DestinationsService } from './destinations.service';

function destination(partial: Partial<Destination> & { cityIata: string }) {
  return {
    id: partial.id ?? partial.cityIata,
    cityName: partial.cityName ?? 'San Jose',
    countryName: partial.countryName ?? 'Costa Rica',
    countryCode: partial.countryCode ?? 'CR',
    cityIata: partial.cityIata,
    hasFlightableAirport: partial.hasFlightableAirport ?? true,
    airports: partial.airports ?? [{ iata: partial.cityIata, name: 'Main' }],
    latitude: partial.latitude ?? '9.9',
    longitude: partial.longitude ?? '-84.1',
    timezone: partial.timezone ?? 'America/Costa_Rica',
    wishlistItems: [],
  } satisfies Destination;
}

describe('DestinationsService', () => {
  let service: DestinationsService;
  const find = jest.fn<Repository<Destination>['find']>();
  const findOne = jest.fn<Repository<Destination>['findOne']>();
  const count = jest.fn<Repository<Destination>['count']>();
  const getMany = jest.fn<() => Promise<Destination[]>>();
  const createQueryBuilder = jest.fn();
  const getCities = jest.fn<TravelpayoutsClient['getCities']>();
  const getCountries = jest.fn<TravelpayoutsClient['getCountries']>();
  const getAirports = jest.fn<TravelpayoutsClient['getAirports']>();

  beforeEach(async () => {
    find.mockReset();
    findOne.mockReset();
    count.mockReset();
    getMany.mockReset();
    createQueryBuilder.mockReset();
    getCities.mockReset();
    getCountries.mockReset();
    getAirports.mockReset();
    count.mockResolvedValue(10);
    createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany,
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      orUpdate: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DestinationsService,
        {
          provide: getRepositoryToken(Destination),
          useValue: {
            find,
            findOne,
            count,
            createQueryBuilder,
            create: (row: object) => row,
          },
        },
        {
          provide: TravelpayoutsClient,
          useValue: { getCities, getCountries, getAirports },
        },
      ],
    }).compile();

    service = module.get(DestinationsService);
  });

  it('hides non-flightable duplicates when the user types a city name', async () => {
    getMany.mockResolvedValue([
      destination({
        cityIata: 'SYQ',
        hasFlightableAirport: false,
        countryName: 'Costa Rica',
      }),
      destination({
        cityIata: 'SJC',
        countryName: 'United States',
        countryCode: 'US',
      }),
      destination({ cityIata: 'SJO', countryName: 'Costa Rica' }),
    ]);

    const result = await service.search({ q: 'san jose' });

    expect(result.data.map((row) => row.cityIata)).toEqual(['SJO', 'SJC']);
    expect(result.data[0]?.hasFlightableAirport).toBe(true);
    expect(result.meta.featured).toBe(false);
  });

  it('still returns a typed IATA even when that city is not flightable', async () => {
    getMany.mockResolvedValue([
      destination({
        cityIata: 'SYQ',
        hasFlightableAirport: false,
      }),
    ]);

    const result = await service.search({ q: 'SYQ' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.cityIata).toBe('SYQ');
  });

  it('returns featured flightable cities when no query is sent', async () => {
    getMany.mockResolvedValue([
      destination({
        cityIata: 'MAD',
        cityName: 'Madrid',
        countryName: 'Spain',
        countryCode: 'ES',
      }),
    ]);

    const result = await service.search({});

    expect(result.meta.featured).toBe(true);
    expect(result.data[0]?.cityIata).toBe('MAD');
  });

  it('throws when an IATA code is missing', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.getByIata('ZZZ')).rejects.toThrow('Destination ZZZ');
  });
});
