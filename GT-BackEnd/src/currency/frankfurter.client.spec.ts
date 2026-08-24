import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import { FrankfurterClient } from './frankfurter.client';
import { FrankfurterV2Currency, FrankfurterV2Rate } from './frankfurter.types';

describe('FrankfurterClient', () => {
  const getJson = jest.fn<HttpClientService['getJson']>();
  let client: FrankfurterClient;

  beforeEach(() => {
    getJson.mockReset();
    client = new FrankfurterClient(
      { getJson } as unknown as HttpClientService,
      {
        get: () => 'https://api.frankfurter.dev',
      } as unknown as ConfigService<EnvironmentVariables, true>,
    );
  });

  it('maps v2 USD/CRC rows into a latest-rates object', async () => {
    getJson.mockResolvedValue([
      { date: '2026-08-21', base: 'USD', quote: 'CRC', rate: 449.25 },
    ] satisfies FrankfurterV2Rate[]);

    const result = await client.getLatest('USD', ['CRC']);

    expect(getJson).toHaveBeenCalledWith(
      'https://api.frankfurter.dev/v2/rates?base=USD&quotes=CRC',
    );
    expect(result).toEqual({
      amount: 1,
      base: 'USD',
      date: '2026-08-21',
      rates: { CRC: 449.25 },
    });
  });

  it('maps v2 currency records including CRC', async () => {
    getJson.mockResolvedValue([
      {
        iso_code: 'CRC',
        name: 'Costa Rican Colon',
        symbol: '₡',
      },
      {
        iso_code: 'USD',
        name: 'United States Dollar',
        symbol: '$',
      },
    ] satisfies FrankfurterV2Currency[]);

    const result = await client.getCurrencies();

    expect(result.CRC).toBe('Costa Rican Colon');
    expect(result.USD).toBe('United States Dollar');
  });
});
