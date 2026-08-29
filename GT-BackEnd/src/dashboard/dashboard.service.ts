import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { Destination } from '../database/entities/destination.entity';
import { SearchHistory } from '../database/entities/search-history.entity';
import { SearchType } from '../database/enums';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 5 * 60 * 1000;

export type NamedIataCount = {
  iata: string;
  cityName: string | null;
  countryName: string | null;
  countryCode: string | null;
  count: number;
};

export type RouteCount = {
  originIata: string;
  destinationIata: string;
  originCityName: string | null;
  destinationCityName: string | null;
  count: number;
};

export type TypeCount = {
  searchType: SearchType;
  count: number;
};

export type DayCount = {
  date: string;
  count: number;
};

export type CountryCount = {
  countryCode: string;
  countryName: string | null;
  count: number;
};

export type MonthCount = {
  month: string;
  count: number;
};

export type DashboardData = {
  generatedAt: string;
  period: {
    days: number;
    from: string;
    to: string;
  };
  summary: {
    totalSearches: number;
    uniqueOrigins: number;
    uniqueDestinations: number;
    byType: TypeCount[];
  };
  topDestinations: NamedIataCount[];
  topOrigins: NamedIataCount[];
  topCountries: CountryCount[];
  topRoutes: RouteCount[];
  volumeByDay: DayCount[];
  travelMonths: MonthCount[];
};

export type DashboardResult = {
  data: DashboardData;
  meta: { cached: boolean };
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(SearchHistory)
    private readonly searches: Repository<SearchHistory>,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async getAnalytics(query: DashboardQueryDto): Promise<DashboardResult> {
    const days = query.days ?? 30;
    const limit = query.limit ?? 10;
    const cacheKey = `dashboard:v2:${days}:${limit}`;

    const cached = await this.cache.get<DashboardData>(cacheKey);
    if (cached) {
      return { data: cached, meta: { cached: true } };
    }

    const to = new Date();
    const toDate = toIsoDate(to);
    const fromDate = toIsoDate(new Date(to.getTime() - (days - 1) * DAY_MS));
    const from = new Date(`${fromDate}T00:00:00.000Z`);
    const fromSql = `${fromDate} 00:00:00`;

    const [
      totalRow,
      byTypeRows,
      uniqueRow,
      destinationRows,
      originRows,
      countryRows,
      routeRows,
      volumeRows,
      travelMonthRows,
    ] = await Promise.all([
      this.totalSince(fromSql),
      this.countsByType(fromSql),
      this.uniquePlaces(fromSql),
      this.topIatas(fromSql, 'destinationIata', limit),
      this.topIatas(fromSql, 'originIata', limit),
      this.topCountries(fromSql, limit),
      this.topRoutes(fromSql, limit),
      this.volumeByDay(fromSql),
      this.travelMonths(fromSql),
    ]);

    const data: DashboardData = {
      generatedAt: to.toISOString(),
      period: {
        days,
        from: fromDate,
        to: toDate,
      },
      summary: {
        totalSearches: toCount(totalRow?.total),
        uniqueOrigins: toCount(uniqueRow?.uniqueOrigins),
        uniqueDestinations: toCount(uniqueRow?.uniqueDestinations),
        byType: byTypeRows.map((row) => ({
          searchType: row.searchType,
          count: toCount(row.count),
        })),
      },
      topDestinations: destinationRows.map(toNamedIata),
      topOrigins: originRows.map(toNamedIata),
      topCountries: countryRows.map((row) => ({
        countryCode: row.countryCode,
        countryName: row.countryName ?? null,
        count: toCount(row.count),
      })),
      topRoutes: routeRows.map((row) => ({
        originIata: row.originIata,
        destinationIata: row.destinationIata,
        originCityName: row.originCityName ?? null,
        destinationCityName: row.destinationCityName ?? null,
        count: toCount(row.count),
      })),
      volumeByDay: fillDays(from, days, volumeRows),
      travelMonths: travelMonthRows.map((row) => ({
        month: row.month,
        count: toCount(row.count),
      })),
    };

    await this.cache.set(cacheKey, data, CACHE_TTL_MS);
    return { data, meta: { cached: false } };
  }

  private totalSince(fromSql: string) {
    return this.searches
      .createQueryBuilder('search')
      .select('COUNT(*)', 'total')
      .where('search.createdAt >= :from', { from: fromSql })
      .getRawOne<{ total: string | number }>();
  }

  private countsByType(fromSql: string) {
    return this.searches
      .createQueryBuilder('search')
      .select('search.searchType', 'searchType')
      .addSelect('COUNT(*)', 'count')
      .where('search.createdAt >= :from', { from: fromSql })
      .groupBy('search.searchType')
      .orderBy('count', 'DESC')
      .getRawMany<{ searchType: SearchType; count: string | number }>();
  }

  private uniquePlaces(fromSql: string) {
    return this.searches
      .createQueryBuilder('search')
      .select('COUNT(DISTINCT search.originIata)', 'uniqueOrigins')
      .addSelect('COUNT(DISTINCT search.destinationIata)', 'uniqueDestinations')
      .where('search.createdAt >= :from', { from: fromSql })
      .getRawOne<{
        uniqueOrigins: string | number;
        uniqueDestinations: string | number;
      }>();
  }

  private topCountries(fromSql: string, limit: number) {
    return this.searches
      .createQueryBuilder('search')
      .select('destination.countryCode', 'countryCode')
      .addSelect('destination.countryName', 'countryName')
      .addSelect('COUNT(*)', 'count')
      .innerJoin(
        Destination,
        'destination',
        'destination.cityIata = search.destinationIata',
      )
      .where('search.createdAt >= :from', { from: fromSql })
      .andWhere('search.destinationIata IS NOT NULL')
      .andWhere('destination.countryCode IS NOT NULL')
      .groupBy('destination.countryCode')
      .addGroupBy('destination.countryName')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{
        countryCode: string;
        countryName: string | null;
        count: string | number;
      }>();
  }

  private topIatas(
    fromSql: string,
    column: 'originIata' | 'destinationIata',
    limit: number,
  ) {
    return this.searches
      .createQueryBuilder('search')
      .select(`search.${column}`, 'iata')
      .addSelect('COUNT(*)', 'count')
      .addSelect('destination.cityName', 'cityName')
      .addSelect('destination.countryName', 'countryName')
      .addSelect('destination.countryCode', 'countryCode')
      .leftJoin(
        Destination,
        'destination',
        `destination.cityIata = search.${column}`,
      )
      .where('search.createdAt >= :from', { from: fromSql })
      .andWhere(`search.${column} IS NOT NULL`)
      .groupBy(`search.${column}`)
      .addGroupBy('destination.cityName')
      .addGroupBy('destination.countryName')
      .addGroupBy('destination.countryCode')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{
        iata: string;
        cityName: string | null;
        countryName: string | null;
        countryCode: string | null;
        count: string | number;
      }>();
  }

  private topRoutes(fromSql: string, limit: number) {
    return this.searches
      .createQueryBuilder('search')
      .select('search.originIata', 'originIata')
      .addSelect('search.destinationIata', 'destinationIata')
      .addSelect('COUNT(*)', 'count')
      .addSelect('origin.cityName', 'originCityName')
      .addSelect('destination.cityName', 'destinationCityName')
      .leftJoin(Destination, 'origin', 'origin.cityIata = search.originIata')
      .leftJoin(
        Destination,
        'destination',
        'destination.cityIata = search.destinationIata',
      )
      .where('search.createdAt >= :from', { from: fromSql })
      .andWhere('search.originIata IS NOT NULL')
      .andWhere('search.destinationIata IS NOT NULL')
      .groupBy('search.originIata')
      .addGroupBy('search.destinationIata')
      .addGroupBy('origin.cityName')
      .addGroupBy('destination.cityName')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany<{
        originIata: string;
        destinationIata: string;
        originCityName: string | null;
        destinationCityName: string | null;
        count: string | number;
      }>();
  }

  private volumeByDay(fromSql: string) {
    return this.searches
      .createQueryBuilder('search')
      .select('DATE(search.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('search.createdAt >= :from', { from: fromSql })
      .groupBy('DATE(search.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string | Date; count: string | number }>();
  }

  private travelMonths(fromSql: string) {
    return this.searches
      .createQueryBuilder('search')
      .select('search.travelMonth', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('search.createdAt >= :from', { from: fromSql })
      .andWhere('search.travelMonth IS NOT NULL')
      .groupBy('search.travelMonth')
      .orderBy('search.travelMonth', 'ASC')
      .getRawMany<{ month: string; count: string | number }>();
  }
}

function toCount(value: string | number | undefined | null): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toDateString(value: string | Date): string {
  if (value instanceof Date) {
    return toIsoDate(value);
  }
  return value.slice(0, 10);
}

function toNamedIata(row: {
  iata: string;
  cityName: string | null;
  countryName: string | null;
  countryCode: string | null;
  count: string | number;
}): NamedIataCount {
  return {
    iata: row.iata,
    cityName: row.cityName ?? null,
    countryName: row.countryName ?? null,
    countryCode: row.countryCode ?? null,
    count: toCount(row.count),
  };
}

function fillDays(
  from: Date,
  days: number,
  rows: Array<{ date: string | Date; count: string | number }>,
): DayCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(toDateString(row.date), toCount(row.count));
  }

  const points: DayCount[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = toIsoDate(new Date(from.getTime() + offset * DAY_MS));
    points.push({ date, count: counts.get(date) ?? 0 });
  }
  return points;
}
