import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppCacheService } from '../common/cache/app-cache.service';
import { DestinationsService } from '../destinations/destinations.service';
import { NominatimClient } from '../restaurants/nominatim.client';
import { OverpassClient } from '../restaurants/overpass.client';
import { CarsService } from './cars.service';

const SJO = {
  id: 'dest-sjo',
  cityName: 'San Jose',
  countryName: 'Costa Rica',
  countryCode: 'CR',
  cityIata: 'SJO',
  hasFlightableAirport: true,
  airports: [],
  latitude: 9.9281,
  longitude: -84.0907,
  timezone: 'America/Costa_Rica',
};

const SJO_GEO = {
  latitude: 9.9281,
  longitude: -84.0907,
  name: 'San Jose',
  displayName: 'San José, Costa Rica',
  countryName: 'Costa Rica',
  countryCode: 'CR',
};

describe('CarsService', () => {
  let service: CarsService;
  const searchNearby = jest.fn<OverpassClient['searchNearby']>();
  const getElement = jest.fn<OverpassClient['getElement']>();
  const geocode = jest.fn<NominatimClient['geocode']>();
  const getByCity = jest.fn<DestinationsService['getByCity']>();
  const cacheGet = jest.fn<AppCacheService['get']>();
  const cacheSet = jest.fn<AppCacheService['set']>();

  beforeEach(async () => {
    searchNearby.mockReset();
    getElement.mockReset();
    geocode.mockReset();
    getByCity.mockReset();
    cacheGet.mockReset();
    cacheSet.mockReset();
    cacheGet.mockResolvedValue(null);
    geocode.mockResolvedValue(SJO_GEO);
    getByCity.mockResolvedValue({ data: SJO });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarsService,
        {
          provide: OverpassClient,
          useValue: { searchNearby, getElement },
        },
        {
          provide: NominatimClient,
          useValue: { geocode },
        },
        {
          provide: DestinationsService,
          useValue: { getByCity },
        },
        {
          provide: AppCacheService,
          useValue: { get: cacheGet, set: cacheSet },
        },
      ],
    }).compile();

    service = module.get(CarsService);
  });

  it('maps OSM rental offices for the map and marks empty cities as unavailable', async () => {
    searchNearby.mockResolvedValue({ elements: [] });
    const empty = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
    });
    expect(empty.data).toEqual([]);
    expect(empty.meta.unavailable).toBe(true);
    expect(empty.meta.disclaimer).toContain('No rates');

    searchNearby.mockResolvedValue({
      elements: [
        {
          type: 'node',
          id: 99,
          lat: 9.93,
          lon: -84.08,
          tags: {
            amenity: 'car_rental',
            brand: 'Hertz',
            name: 'Hertz San Jose',
            website: 'https://www.hertz.com',
            'addr:city': 'San Jose',
          },
        },
      ],
    });

    const result = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
    });
    expect(searchNearby).toHaveBeenCalledWith(
      expect.objectContaining({
        amenities: ['car_rental', 'car_sharing'],
      }),
    );
    expect(result.data[0]).toMatchObject({
      id: 'node-99',
      name: 'Hertz San Jose',
      brand: 'Hertz',
      primaryType: 'Car rental',
      provider: 'openstreetmap',
      href: '/api/cars/node-99',
      links: {
        maps: 'https://www.openstreetmap.org/node/99',
        website: 'https://www.hertz.com',
      },
    });
    expect(result.meta.unavailable).toBe(false);
  });

  it('uses brand as the name when OSM has no name tag', async () => {
    searchNearby.mockResolvedValue({
      elements: [
        {
          type: 'node',
          id: 7,
          lat: 10.15,
          lon: -85.45,
          tags: { amenity: 'car_rental', brand: 'Enterprise' },
        },
      ],
    });

    const result = await service.search({
      cityName: 'Nicoya',
      countryCode: 'CR',
    });
    expect(result.data[0]?.name).toBe('Enterprise');
    expect(result.data[0]?.brand).toBe('Enterprise');
  });

  it('filters by type and brand query', async () => {
    searchNearby.mockResolvedValue({
      elements: [
        {
          type: 'node',
          id: 1,
          tags: {
            amenity: 'car_rental',
            brand: 'Hertz',
            name: 'Hertz Airport',
          },
        },
        {
          type: 'node',
          id: 2,
          tags: { amenity: 'car_sharing', name: 'Zipcar' },
        },
      ],
    });

    const rentals = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
      type: 'car_rental',
    });
    expect(rentals.data.map((row) => row.id)).toEqual(['node-1']);

    const hertz = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
      q: 'hertz',
    });
    expect(hertz.data.map((row) => row.id)).toEqual(['node-1']);
  });

  it('rejects an invalid OSM id', async () => {
    await expect(service.getById('../secret')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns 404 when Nominatim cannot geocode the city', async () => {
    geocode.mockResolvedValue(null);
    await expect(
      service.search({ cityName: 'Nowhere', countryCode: 'XX' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(searchNearby).not.toHaveBeenCalled();
  });
});
