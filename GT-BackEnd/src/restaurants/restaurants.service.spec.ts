import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppCacheService } from '../common/cache/app-cache.service';
import { DestinationsService } from '../destinations/destinations.service';
import { NominatimClient } from './nominatim.client';
import { OverpassClient } from './overpass.client';
import { RestaurantsService } from './restaurants.service';

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

describe('RestaurantsService', () => {
  let service: RestaurantsService;
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
        RestaurantsService,
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

    service = module.get(RestaurantsService);
  });

  it('normalizes OSM restaurants and marks empty results as unavailable', async () => {
    searchNearby.mockResolvedValue({ elements: [] });
    const empty = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
    });
    expect(empty.data).toEqual([]);
    expect(empty.meta.unavailable).toBe(true);
    expect(empty.meta.attribution).toBe('© OpenStreetMap contributors');

    searchNearby.mockResolvedValue({
      elements: [
        {
          type: 'node',
          id: 12345,
          lat: 9.93,
          lon: -84.08,
          tags: {
            name: 'Soda Tapia',
            amenity: 'restaurant',
            cuisine: 'costa_rican',
            website: 'https://example.com',
            'addr:street': 'Avenida Central',
            'addr:city': 'San Jose',
          },
        },
      ],
    });

    const result = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
      limit: 10,
    });
    expect(result.data[0]).toMatchObject({
      id: 'node-12345',
      name: 'Soda Tapia',
      address: 'Avenida Central, San Jose',
      rating: null,
      priceLevel: null,
      primaryType: 'Restaurant',
      cuisine: ['costa_rican'],
      provider: 'openstreetmap',
      href: '/api/restaurants/node-12345',
      links: {
        self: '/api/restaurants/node-12345',
        maps: 'https://www.openstreetmap.org/node/12345',
        website: 'https://example.com',
      },
    });
    expect(result.meta.unavailable).toBe(false);
    expect(result.meta.iata).toBe('SJO');
    expect(cacheSet).toHaveBeenCalled();
  });

  it('filters by amenity type, cuisine, name, and website', async () => {
    searchNearby.mockResolvedValue({
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 9.93,
          lon: -84.08,
          tags: {
            name: 'Hibachi',
            amenity: 'restaurant',
            cuisine: 'japanese',
          },
        },
        {
          type: 'node',
          id: 2,
          lat: 9.94,
          lon: -84.09,
          tags: {
            name: 'Café Central',
            amenity: 'cafe',
            website: 'https://cafe.example',
          },
        },
        {
          type: 'node',
          id: 3,
          lat: 9.95,
          lon: -84.1,
          tags: {
            name: 'Soda Tapia',
            amenity: 'restaurant',
            cuisine: 'costa_rican',
            website: 'https://soda.example',
          },
        },
      ],
    });

    const japanese = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
      cuisine: 'japanese',
    });
    expect(japanese.data.map((row) => row.id)).toEqual(['node-1']);
    expect(japanese.meta.filters).toEqual({
      type: null,
      cuisine: 'japanese',
      q: null,
      hasWebsite: false,
    });

    const cafes = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
      type: 'cafe',
    });
    expect(cafes.data.map((row) => row.id)).toEqual(['node-2']);

    const named = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
      q: 'hibachi',
    });
    expect(named.data.map((row) => row.name)).toEqual(['Hibachi']);

    const withSite = await service.search({
      cityName: 'San Jose',
      countryCode: 'CR',
      hasWebsite: true,
    });
    expect(withSite.data.map((row) => row.id)).toEqual(['node-3', 'node-2']);
  });

  it('geocodes towns that are not in the flight catalog', async () => {
    getByCity.mockRejectedValue(
      new NotFoundException('Destination San Ramón, CR was not found'),
    );
    geocode.mockResolvedValue({
      latitude: 10.087,
      longitude: -84.47,
      name: 'San Ramón',
      displayName: 'San Ramón, Alajuela, Costa Rica',
      countryName: 'Costa Rica',
      countryCode: 'CR',
    });
    searchNearby.mockResolvedValue({
      elements: [
        {
          type: 'node',
          id: 99,
          lat: 10.08,
          lon: -84.47,
          tags: { name: 'Soda Central', amenity: 'restaurant' },
        },
      ],
    });

    const result = await service.search({
      cityName: 'San Ramón',
      countryCode: 'CR',
    });

    expect(geocode).toHaveBeenCalledWith({
      cityName: 'San Ramón',
      countryCode: 'CR',
    });
    expect(searchNearby).toHaveBeenCalledWith({
      latitude: 10.087,
      longitude: -84.47,
      radiusMeters: 4000,
      amenities: ['restaurant', 'cafe', 'fast_food'],
    });
    expect(result.data[0]?.name).toBe('Soda Central');
    expect(result.meta.iata).toBeNull();
    expect(result.meta.cityName).toBe('San Ramón');
  });

  it('rejects destinations without coordinates', async () => {
    geocode.mockResolvedValue(null);

    await expect(
      service.search({ cityName: 'San Jose', countryCode: 'CR' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(searchNearby).not.toHaveBeenCalled();
  });

  it('loads restaurant details and opening hours', async () => {
    getElement.mockResolvedValue({
      type: 'node',
      id: 12345,
      tags: {
        name: 'Soda Tapia',
        amenity: 'restaurant',
        cuisine: 'costa_rican',
        phone: '2222-0000',
        opening_hours: 'Mo-Su 07:00-20:00',
        description: 'Classic soda.',
      },
    });

    const result = await service.getById('node-12345');
    expect(result.data).toMatchObject({
      id: 'node-12345',
      name: 'Soda Tapia',
      phone: '2222-0000',
      editorialSummary: 'Classic soda.',
      weekdayHours: ['Mo-Su 07:00-20:00'],
    });
    expect(result.meta.source).toBe('overpass');
  });

  it('rejects an invalid OSM id', async () => {
    await expect(service.getById('../secret')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(getElement).not.toHaveBeenCalled();
  });

  it('propagates unknown destination errors', async () => {
    geocode.mockResolvedValue(null);
    await expect(
      service.search({ cityName: 'Nowhere', countryCode: 'XX' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
