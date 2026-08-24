import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import {
  TravelpayoutsAirline,
  TravelpayoutsCity,
  TravelpayoutsCountry,
  TravelpayoutsGroupedResponse,
  TravelpayoutsSearchResponse,
} from './travelpayouts.types';

export type PricesForDatesParams = {
  origin: string;
  destination: string;
  departureAt?: string;
  returnAt?: string;
  currency?: string;
  direct?: boolean;
  limit?: number;
};

export type GroupedPricesParams = {
  origin: string;
  destination: string;
  groupBy: 'departure_at' | 'month';
  departureAt?: string;
  returnAt?: string;
  currency?: string;
  direct?: boolean;
};

@Injectable()
export class TravelpayoutsClient {
  private readonly baseUrl = 'https://api.travelpayouts.com';
  private readonly token: string;

  constructor(
    private readonly http: HttpClientService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.token = config.get('TRAVELPAYOUTS_API_TOKEN', { infer: true });
  }

  getCities(): Promise<TravelpayoutsCity[]> {
    return this.http.getJson<TravelpayoutsCity[]>(
      `${this.baseUrl}/data/en/cities.json`,
      { headers: this.headers(), timeoutMs: 30_000 },
    );
  }

  getCountries(): Promise<TravelpayoutsCountry[]> {
    return this.http.getJson<TravelpayoutsCountry[]>(
      `${this.baseUrl}/data/en/countries.json`,
      { headers: this.headers(), timeoutMs: 30_000 },
    );
  }

  getAirlines(): Promise<TravelpayoutsAirline[]> {
    return this.http.getJson<TravelpayoutsAirline[]>(
      `${this.baseUrl}/data/en/airlines.json`,
      { headers: this.headers(), timeoutMs: 30_000 },
    );
  }

  getPricesForDates(
    params: PricesForDatesParams,
  ): Promise<TravelpayoutsSearchResponse> {
    const url = new URL(`${this.baseUrl}/aviasales/v3/prices_for_dates`);
    url.searchParams.set('origin', params.origin);
    url.searchParams.set('destination', params.destination);
    url.searchParams.set('unique', 'false');
    url.searchParams.set('sorting', 'price');
    const currency = (params.currency ?? 'USD').toUpperCase();
    url.searchParams.set('cy', currency.toLowerCase());
    url.searchParams.set('currency', currency);
    url.searchParams.set('limit', String(params.limit ?? 30));
    url.searchParams.set('page', '1');
    url.searchParams.set('direct', String(params.direct ?? false));
    url.searchParams.set('one_way', String(!params.returnAt));

    if (params.departureAt) {
      url.searchParams.set('departure_at', params.departureAt);
    }
    if (params.returnAt) {
      url.searchParams.set('return_at', params.returnAt);
    }

    return this.http.getJson<TravelpayoutsSearchResponse>(url.toString(), {
      headers: this.headers(),
      timeoutMs: 12_000,
    });
  }

  getGroupedPrices(
    params: GroupedPricesParams,
  ): Promise<TravelpayoutsGroupedResponse> {
    const url = new URL(`${this.baseUrl}/aviasales/v3/grouped_prices`);
    url.searchParams.set('origin', params.origin);
    url.searchParams.set('destination', params.destination);
    url.searchParams.set('group_by', params.groupBy);
    url.searchParams.set('currency', (params.currency ?? 'USD').toUpperCase());
    url.searchParams.set('direct', String(params.direct ?? false));

    if (params.departureAt) {
      url.searchParams.set('departure_at', params.departureAt);
    }
    if (params.returnAt) {
      url.searchParams.set('return_at', params.returnAt);
    }

    return this.http.getJson<TravelpayoutsGroupedResponse>(url.toString(), {
      headers: this.headers(),
      timeoutMs: 12_000,
    });
  }

  private headers(): Record<string, string> {
    return { 'X-Access-Token': this.token };
  }
}
