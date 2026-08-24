import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import { TravelpayoutsClient } from './travelpayouts.client';

describe('TravelpayoutsClient', () => {
  const getJson = jest.fn<HttpClientService['getJson']>();
  let client: TravelpayoutsClient;

  beforeEach(() => {
    getJson.mockReset();
    getJson.mockResolvedValue({ success: true, data: [] });
    client = new TravelpayoutsClient(
      { getJson } as unknown as HttpClientService,
      { get: () => 'test-token' } as unknown as ConfigService<
        EnvironmentVariables,
        true
      >,
    );
  });

  it('requests prices_for_dates with the access token header', async () => {
    await client.getPricesForDates({
      origin: 'MAD',
      destination: 'BCN',
      departureAt: '2026-09',
      currency: 'USD',
    });

    const [url, options] = getJson.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('/aviasales/v3/prices_for_dates');
    expect(url).toContain('origin=MAD');
    expect(url).toContain('destination=BCN');
    expect(url).toContain('cy=usd');
    expect(options.headers['X-Access-Token']).toBe('test-token');
  });
});
