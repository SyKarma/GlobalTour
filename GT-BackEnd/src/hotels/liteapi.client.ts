import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import {
  LiteApiHotelResponse,
  LiteApiListResponse,
  LiteApiRatesResponse,
} from './liteapi.types';

export type LiteApiSearchParams = {
  countryCode: string;
  cityName: string;
  limit?: number;
};

export type LiteApiRatesParams = {
  hotelId: string;
  checkin: string;
  checkout: string;
  currency: string;
  adults: number;
  guestNationality: string;
  maxRatesPerHotel?: number;
};

@Injectable()
export class LiteApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpClientService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.baseUrl = config
      .get('LITEAPI_BASE_URL', { infer: true })
      .replace(/\/$/, '');
    this.apiKey = config.get('LITEAPI_API_KEY', { infer: true });
  }

  searchHotels(params: LiteApiSearchParams): Promise<LiteApiListResponse> {
    const url = new URL(`${this.baseUrl}/data/hotels`);
    url.searchParams.set('countryCode', params.countryCode);
    url.searchParams.set('cityName', params.cityName);
    url.searchParams.set('limit', String(params.limit ?? 20));

    return this.http.getJson<LiteApiListResponse>(url.toString(), {
      headers: this.headers(),
      timeoutMs: 15_000,
    });
  }

  getHotel(hotelId: string): Promise<LiteApiHotelResponse> {
    const url = new URL(`${this.baseUrl}/data/hotel`);
    url.searchParams.set('hotelId', hotelId);

    return this.http.getJson<LiteApiHotelResponse>(url.toString(), {
      headers: this.headers(),
      timeoutMs: 12_000,
    });
  }

  getRates(params: LiteApiRatesParams): Promise<LiteApiRatesResponse> {
    return this.http.postJson<LiteApiRatesResponse>(
      `${this.baseUrl}/hotels/rates`,
      {
        hotelIds: [params.hotelId],
        occupancies: [{ adults: params.adults }],
        currency: params.currency,
        guestNationality: params.guestNationality,
        checkin: params.checkin,
        checkout: params.checkout,
        maxRatesPerHotel: params.maxRatesPerHotel ?? 5,
        includeHotelData: true,
        timeout: 8,
      },
      {
        headers: this.headers(),
        timeoutMs: 20_000,
      },
    );
  }

  private headers(): Record<string, string> {
    return { 'X-API-Key': this.apiKey };
  }
}
