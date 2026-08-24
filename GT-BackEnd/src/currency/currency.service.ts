import { randomUUID } from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppCacheService } from '../common/cache/app-cache.service';
import { CurrencyRate } from '../database/entities/currency-rate.entity';
import { CacheProvider } from '../database/enums';
import { ConvertQueryDto } from './dto/convert-query.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { LatestQueryDto } from './dto/latest-query.dto';
import { FrankfurterClient } from './frankfurter.client';
import { FrankfurterLatestResponse } from './frankfurter.types';

const DAY_MS = 24 * 60 * 60 * 1000;

export type RatesResult = {
  data: {
    base: string;
    date: string;
    rates: Record<string, number>;
  };
  meta: { source: 'frankfurter' | 'cache'; stale: boolean };
};

export type ConvertResult = {
  data: {
    amount: number;
    from: string;
    to: string;
    rate: number;
    result: number;
    date: string;
  };
  meta: { source: 'frankfurter' | 'cache'; stale: boolean };
};

export type HistoryResult = {
  data: {
    base: string;
    quote: string | null;
    startDate: string;
    endDate: string;
    points: Array<{ date: string; rates: Record<string, number> }>;
  };
  meta: { source: 'frankfurter' | 'cache'; stale: boolean };
};

export type CurrenciesResult = {
  data: Array<{ code: string; name: string }>;
  meta: { source: 'frankfurter' | 'cache'; stale: boolean };
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly frankfurter: FrankfurterClient,
    private readonly cache: AppCacheService,
    @InjectRepository(CurrencyRate)
    private readonly ratesRepo: Repository<CurrencyRate>,
  ) {}

  async getLatest(query: LatestQueryDto): Promise<RatesResult> {
    const base = query.base ?? 'USD';
    const quotes = this.parseQuotes(query.quotes);
    const key = AppCacheService.hashKey(['frankfurter', 'latest', base, quotes]);

    try {
      const live = await this.frankfurter.getLatest(base, quotes);
      await this.cache.set(key, live, CacheProvider.FRANKFURTER, DAY_MS);
      await this.persistRates(live);
      return this.toRatesResult(live, 'frankfurter', false);
    } catch (error) {
      const cached = await this.cache.get<FrankfurterLatestResponse>(key);
      if (cached) {
        this.logger.warn('Serving latest rates from cache after upstream error');
        return this.toRatesResult(cached.value, 'cache', cached.stale);
      }

      const fallback = await this.loadPersistedRates(base, quotes);
      if (fallback) {
        return this.toRatesResult(fallback, 'cache', true);
      }

      throw error;
    }
  }

  async convert(query: ConvertQueryDto): Promise<ConvertResult> {
    const from = query.from ?? 'USD';
    const to = query.to;

    if (from === to) {
      return {
        data: {
          amount: query.amount,
          from,
          to,
          rate: 1,
          result: query.amount,
          date: new Date().toISOString().slice(0, 10),
        },
        meta: { source: 'cache', stale: false },
      };
    }

    const latest = await this.getLatest({ base: from, quotes: to });
    const rate = latest.data.rates[to];
    if (rate === undefined) {
      throw new NotFoundException(
        `No exchange rate available for ${from} → ${to}`,
      );
    }

    return {
      data: {
        amount: query.amount,
        from,
        to,
        rate,
        result: Number((query.amount * rate).toFixed(6)),
        date: latest.data.date,
      },
      meta: latest.meta,
    };
  }

  async getHistory(query: HistoryQueryDto): Promise<HistoryResult> {
    const base = query.base ?? 'USD';
    const quote = query.quote;
    const key = AppCacheService.hashKey([
      'frankfurter',
      'history',
      query.from,
      query.to,
      base,
      quote,
    ]);

    const fetchLive = () =>
      this.frankfurter.getHistory(
        query.from,
        query.to,
        base,
        quote ? [quote] : undefined,
      );

    try {
      const live = await fetchLive();
      await this.cache.set(key, live, CacheProvider.FRANKFURTER, DAY_MS);
      return {
        data: this.toHistoryData(live, quote ?? null),
        meta: { source: 'frankfurter', stale: false },
      };
    } catch (error) {
      const cached = await this.cache.get<Awaited<ReturnType<typeof fetchLive>>>(
        key,
      );
      if (cached) {
        return {
          data: this.toHistoryData(cached.value, quote ?? null),
          meta: { source: 'cache', stale: cached.stale },
        };
      }
      throw error;
    }
  }

  async getCurrencies(): Promise<CurrenciesResult> {
    const key = AppCacheService.hashKey(['frankfurter', 'currencies']);

    try {
      const live = await this.frankfurter.getCurrencies();
      await this.cache.set(key, live, CacheProvider.FRANKFURTER, DAY_MS);
      return {
        data: this.toCurrencyList(live),
        meta: { source: 'frankfurter', stale: false },
      };
    } catch (error) {
      const cached =
        await this.cache.get<Record<string, string>>(key);
      if (cached) {
        return {
          data: this.toCurrencyList(cached.value),
          meta: { source: 'cache', stale: cached.stale },
        };
      }
      throw error;
    }
  }

  private parseQuotes(quotes?: string): string[] | undefined {
    if (!quotes) {
      return undefined;
    }
    return quotes
      .split(',')
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean);
  }

  private toRatesResult(
    payload: FrankfurterLatestResponse,
    source: 'frankfurter' | 'cache',
    stale: boolean,
  ): RatesResult {
    return {
      data: {
        base: payload.base,
        date: payload.date,
        rates: payload.rates,
      },
      meta: { source, stale },
    };
  }

  private toHistoryData(
    payload: {
      base: string;
      start_date: string;
      end_date: string;
      rates: Record<string, Record<string, number>>;
    },
    quote: string | null,
  ) {
    const points = Object.entries(payload.rates)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, rates]) => ({ date, rates }));

    return {
      base: payload.base,
      quote,
      startDate: payload.start_date,
      endDate: payload.end_date,
      points,
    };
  }

  private toCurrencyList(map: Record<string, string>) {
    return Object.entries(map)
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  private async persistRates(payload: FrankfurterLatestResponse): Promise<void> {
    const rows = Object.entries(payload.rates).map(([quote, rate]) =>
      this.ratesRepo.create({
        id: randomUUID(),
        rateDate: payload.date,
        baseCurrency: payload.base,
        quoteCurrency: quote,
        rate: rate.toFixed(8),
      }),
    );

    if (!rows.length) {
      return;
    }

    await this.ratesRepo.upsert(rows, {
      conflictPaths: ['rateDate', 'baseCurrency', 'quoteCurrency'],
      skipUpdateIfNoValuesChanged: true,
    });
  }

  private async loadPersistedRates(
    base: string,
    quotes?: string[],
  ): Promise<FrankfurterLatestResponse | null> {
    const where = quotes?.length
      ? quotes.map((quote) => ({
          baseCurrency: base,
          quoteCurrency: quote,
        }))
      : { baseCurrency: base };

    const rows = await this.ratesRepo.find({
      where,
      order: { rateDate: 'DESC' },
      take: 64,
    });

    if (!rows.length) {
      return null;
    }

    const latestDate = rows[0].rateDate;
    const rates: Record<string, number> = {};
    for (const row of rows) {
      if (row.rateDate === latestDate) {
        rates[row.quoteCurrency] = Number(row.rate);
      }
    }

    return {
      amount: 1,
      base,
      date: latestDate,
      rates,
    };
  }
}
