import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import { NominatimClient } from './nominatim.client';

describe('NominatimClient', () => {
  const getJson = jest.fn<HttpClientService['getJson']>();
  let client: NominatimClient;

  beforeEach(() => {
    getJson.mockReset();
    getJson.mockResolvedValue([]);
    client = new NominatimClient(
      { getJson } as unknown as HttpClientService,
      {
        get: (key: string) =>
          key === 'NOMINATIM_BASE_URL'
            ? 'https://nominatim.openstreetmap.org'
            : undefined,
      } as unknown as ConfigService<EnvironmentVariables, true>,
    );
  });

  it('geocodes a city with countrycodes and a User-Agent', async () => {
    getJson.mockResolvedValueOnce([
      {
        lat: '10.087',
        lon: '-84.470',
        name: 'San Ramón',
        display_name: 'San Ramón, Alajuela, Costa Rica',
        address: {
          town: 'San Ramón',
          country: 'Costa Rica',
          country_code: 'cr',
        },
      },
    ]);

    const place = await client.geocode({
      cityName: 'San Ramón',
      countryCode: 'CR',
    });

    const [url, options] = getJson.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('nominatim.openstreetmap.org/search');
    expect(url).toContain('city=San');
    expect(url).toContain('countrycodes=cr');
    expect(url).toContain('featureType=settlement');
    expect(options.headers['User-Agent']).toContain('GlobalTour');
    expect(place).toMatchObject({
      latitude: 10.087,
      longitude: -84.47,
      name: 'San Ramón',
      countryCode: 'CR',
    });
  });

  it('falls back to a free-text query when structured search is empty', async () => {
    getJson.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        lat: '10.087',
        lon: '-84.470',
        name: 'San Ramon',
        display_name: 'San Ramón, Costa Rica',
        address: { country: 'Costa Rica', country_code: 'cr' },
      },
    ]);

    const place = await client.geocode({
      cityName: 'San Ramon',
      countryCode: 'CR',
    });

    expect(getJson).toHaveBeenCalledTimes(2);
    const fallbackUrl = getJson.mock.calls[1]?.[0] as string;
    expect(fallbackUrl).toContain('q=San');
    expect(place?.countryCode).toBe('CR');
  });
});
