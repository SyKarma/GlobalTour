import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import { LiteApiClient } from './liteapi.client';

describe('LiteApiClient', () => {
  const getJson = jest.fn<HttpClientService['getJson']>();
  const postJson = jest.fn<HttpClientService['postJson']>();
  let client: LiteApiClient;

  beforeEach(() => {
    getJson.mockReset();
    postJson.mockReset();
    getJson.mockResolvedValue({ data: [] });
    postJson.mockResolvedValue({ data: [] });
    client = new LiteApiClient(
      { getJson, postJson } as unknown as HttpClientService,
      {
        get: (key: string) =>
          key === 'LITEAPI_BASE_URL'
            ? 'https://api.liteapi.travel/v3.0'
            : 'sand_test',
      } as unknown as ConfigService<EnvironmentVariables, true>,
    );
  });

  it('searches hotels with the API key header', async () => {
    await client.searchHotels({
      countryCode: 'ES',
      cityName: 'Barcelona',
      limit: 10,
    });

    const [url, options] = getJson.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('/data/hotels');
    expect(url).toContain('countryCode=ES');
    expect(url).toContain('cityName=Barcelona');
    expect(options.headers['X-API-Key']).toBe('sand_test');
  });

  it('searches hotels around coordinates when no country is given', async () => {
    await client.searchHotels({
      latitude: 9.93,
      longitude: -84.08,
      radius: 500,
      limit: 10,
    });

    const [url] = getJson.mock.calls[0] as [string];
    expect(url).toContain('latitude=9.93');
    expect(url).toContain('longitude=-84.08');
    expect(url).toContain('radius=1000');
    expect(url).not.toContain('countryCode');
  });
});
