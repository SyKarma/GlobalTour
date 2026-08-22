import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Destination } from '../database/entities/destination.entity';
import { TravelpayoutsClient } from '../travelpayouts/travelpayouts.client';
import { DestinationsService } from './destinations.service';

describe('DestinationsService', () => {
  let service: DestinationsService;
  const find = jest.fn<Repository<Destination>['find']>();
  const findOne = jest.fn<Repository<Destination>['findOne']>();
  const count = jest.fn<Repository<Destination>['count']>();
  const createQueryBuilder = jest.fn();
  const getCities = jest.fn<TravelpayoutsClient['getCities']>();
  const getCountries = jest.fn<TravelpayoutsClient['getCountries']>();

  beforeEach(async () => {
    find.mockReset();
    findOne.mockReset();
    count.mockReset();
    createQueryBuilder.mockReset();
    getCities.mockReset();
    getCountries.mockReset();
    count.mockResolvedValue(10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DestinationsService,
        {
          provide: getRepositoryToken(Destination),
          useValue: { find, findOne, count, createQueryBuilder, create: (row: object) => row },
        },
        {
          provide: TravelpayoutsClient,
          useValue: { getCities, getCountries },
        },
      ],
    }).compile();

    service = module.get(DestinationsService);
  });

  it('searches by city name', async () => {
    find.mockResolvedValue([
      {
        id: '1',
        cityName: 'Barcelona',
        countryName: 'Spain',
        countryCode: 'ES',
        cityIata: 'BCN',
        latitude: '41.3',
        longitude: '2.1',
        timezone: 'Europe/Madrid',
        wishlistItems: [],
      },
    ]);

    const result = await service.search({ q: 'barc' });

    expect(find).toHaveBeenCalled();
    expect(result.data[0].cityIata).toBe('BCN');
    expect(result.meta.featured).toBe(false);
  });

  it('throws when an IATA code is missing', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.getByIata('ZZZ')).rejects.toThrow('Destination ZZZ');
  });
});
