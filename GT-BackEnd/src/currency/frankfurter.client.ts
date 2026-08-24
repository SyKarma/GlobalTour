import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import {
  FrankfurterCurrenciesResponse,
  FrankfurterHistoryResponse,
  FrankfurterLatestResponse,
  FrankfurterV2Currency,
  FrankfurterV2Rate,
} from './frankfurter.types';

@Injectable()
export class FrankfurterClient {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpClientService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.baseUrl = config
      .get('FRANKFURTER_BASE_URL', { infer: true })
      .replace(/\/$/, '');
  }

  async getLatest(
    base: string,
    quotes?: string[],
  ): Promise<FrankfurterLatestResponse> {
    const url = new URL(`${this.baseUrl}/v2/rates`);
    url.searchParams.set('base', base);
    if (quotes?.length) {
      url.searchParams.set('quotes', quotes.join(','));
    }
    const rows = await this.http.getJson<FrankfurterV2Rate[]>(url.toString());
    return this.toLatest(rows, base);
  }

  async getHistory(
    startDate: string,
    endDate: string,
    base: string,
    quotes?: string[],
  ): Promise<FrankfurterHistoryResponse> {
    const url = new URL(`${this.baseUrl}/v2/rates`);
    url.searchParams.set('base', base);
    url.searchParams.set('from', startDate);
    url.searchParams.set('to', endDate);
    if (quotes?.length) {
      url.searchParams.set('quotes', quotes.join(','));
    }
    const rows = await this.http.getJson<FrankfurterV2Rate[]>(url.toString());
    return this.toHistory(rows, base, startDate, endDate);
  }

  async getCurrencies(): Promise<FrankfurterCurrenciesResponse> {
    const rows = await this.http.getJson<FrankfurterV2Currency[]>(
      `${this.baseUrl}/v2/currencies`,
    );
    return Object.fromEntries(
      rows.map((currency) => [currency.iso_code, currency.name]),
    );
  }

  private toLatest(
    rows: FrankfurterV2Rate[],
    fallbackBase: string,
  ): FrankfurterLatestResponse {
    if (!rows.length) {
      throw new NotFoundException('No exchange rates found for the requested currencies');
    }

    const date = rows.reduce(
      (latest, row) => (row.date > latest ? row.date : latest),
      rows[0].date,
    );

    return {
      amount: 1,
      base: rows[0].base || fallbackBase,
      date,
      rates: Object.fromEntries(rows.map((row) => [row.quote, row.rate])),
    };
  }

  private toHistory(
    rows: FrankfurterV2Rate[],
    fallbackBase: string,
    startDate: string,
    endDate: string,
  ): FrankfurterHistoryResponse {
    const rates: Record<string, Record<string, number>> = {};
    for (const row of rows) {
      rates[row.date] ??= {};
      rates[row.date][row.quote] = row.rate;
    }

    const dates = Object.keys(rates).sort();
    return {
      amount: 1,
      base: rows[0]?.base || fallbackBase,
      start_date: dates[0] ?? startDate,
      end_date: dates[dates.length - 1] ?? endDate,
      rates,
    };
  }
}
