import { Injectable, Logger } from '@nestjs/common';
import { AppCacheService } from '../common/cache/app-cache.service';
import { CurrencyService } from '../currency/currency.service';
import { CacheProvider } from '../database/enums';
import { TravelpayoutsClient } from '../travelpayouts/travelpayouts.client';
import {
  TravelpayoutsGroupedResponse,
  TravelpayoutsSearchResponse,
  TravelpayoutsTicket,
} from '../travelpayouts/travelpayouts.types';
import { CalendarFlightsDto } from './dto/calendar-flights.dto';
import { HistoryFlightsDto } from './dto/history-flights.dto';
import { SearchFlightsDto } from './dto/search-flights.dto';

const SEARCH_TTL_MS = 3 * 60 * 60 * 1000;
const TREND_TTL_MS = 12 * 60 * 60 * 1000;
const AIRLINES_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const YEAR_MONTH = /^\d{4}-\d{2}$/;
const YEAR_MONTH_DAY = /^\d{4}-\d{2}-\d{2}$/;

function isYearMonth(value?: string): value is string {
  return !!value && YEAR_MONTH.test(value);
}

function isYearMonthDay(value?: string): value is string {
  return !!value && YEAR_MONTH_DAY.test(value);
}

function yearMonthOf(value: string): string {
  return value.slice(0, 7);
}

type SearchFallback = 'one_way' | 'one_way_month' | 'calendar';

type SearchFetch = {
  payload: TravelpayoutsSearchResponse;
  fallback?: SearchFallback;
  fallbackPeriod?: string;
};

export type FlightOffer = {
  origin: string;
  destination: string;
  originAirport: string | null;
  destinationAirport: string | null;
  price: number;
  currency: string;
  airline: string | null;
  airlineName: string | null;
  flightNumber: string | null;
  departureAt: string | null;
  returnAt: string | null;
  transfers: number;
  durationMinutes: number | null;
  deeplink: string | null;
};

@Injectable()
export class FlightsService {
  private readonly logger = new Logger(FlightsService.name);

  constructor(
    private readonly travelpayouts: TravelpayoutsClient,
    private readonly cache: AppCacheService,
    private readonly currency: CurrencyService,
  ) {}

  async search(query: SearchFlightsDto) {
    const currency = query.currency ?? 'USD';
    const key = AppCacheService.hashKey([
      'travelpayouts',
      'search',
      'v3',
      query.origin,
      query.destination,
      query.departureAt,
      query.returnAt,
      currency,
      query.direct,
      query.limit,
    ]);

    const cached = await this.cache.get<TravelpayoutsSearchResponse>(key);
    if (cached && !cached.stale && this.hasTickets(cached.value)) {
      return this.toSearchResult(cached.value, currency, 'cache', false);
    }

    try {
      const live = await this.fetchSearchPrices(query, currency);
      if (this.hasTickets(live.payload)) {
        await this.cache.set(
          key,
          live.payload,
          CacheProvider.TRAVELPAYOUTS,
          SEARCH_TTL_MS,
        );
      }
      return this.toSearchResult(
        live.payload,
        currency,
        'travelpayouts',
        false,
        live,
      );
    } catch (error) {
      if (cached && this.hasTickets(cached.value)) {
        this.logger.warn('Serving flight search from stale cache');
        return this.toSearchResult(cached.value, currency, 'cache', true);
      }
      throw error;
    }
  }

  private async fetchSearchPrices(
    query: SearchFlightsDto,
    currency: string,
  ): Promise<SearchFetch> {
    const requested = await this.travelpayouts.getPricesForDates({
      origin: query.origin,
      destination: query.destination,
      departureAt: query.departureAt,
      returnAt: query.returnAt,
      currency,
      direct: query.direct,
      limit: query.limit,
    });
    if (this.hasTickets(requested)) {
      return { payload: requested };
    }

    if (isYearMonth(query.departureAt) && isYearMonthDay(query.returnAt)) {
      const oneWayMonth = await this.travelpayouts.getPricesForDates({
        origin: query.origin,
        destination: query.destination,
        departureAt: query.departureAt,
        currency,
        direct: query.direct,
        limit: query.limit,
      });
      if (this.hasTickets(oneWayMonth)) {
        return {
          payload: oneWayMonth,
          fallback: 'one_way_month',
          fallbackPeriod: query.departureAt,
        };
      }
    }

    if (!isYearMonthDay(query.departureAt)) {
      return { payload: requested };
    }

    const oneWayDay = await this.travelpayouts.getPricesForDates({
      origin: query.origin,
      destination: query.destination,
      departureAt: query.departureAt,
      currency,
      direct: query.direct,
      limit: query.limit,
    });
    if (this.hasTickets(oneWayDay)) {
      return {
        payload: oneWayDay,
        fallback: 'one_way',
        fallbackPeriod: query.departureAt,
      };
    }

    const departureMonth = yearMonthOf(query.departureAt);
    const departureCalendar = await this.calendarAsSearch(
      query,
      currency,
      departureMonth,
    );
    if (this.hasTickets(departureCalendar)) {
      return {
        payload: departureCalendar,
        fallback: 'calendar',
        fallbackPeriod: departureMonth,
      };
    }

    if (isYearMonthDay(query.returnAt)) {
      const returnMonth = yearMonthOf(query.returnAt);
      if (returnMonth !== departureMonth) {
        const returnCalendar = await this.calendarAsSearch(
          query,
          currency,
          returnMonth,
        );
        if (this.hasTickets(returnCalendar)) {
          return {
            payload: returnCalendar,
            fallback: 'calendar',
            fallbackPeriod: returnMonth,
          };
        }
      }
    }

    return { payload: requested };
  }

  private async calendarAsSearch(
    query: SearchFlightsDto,
    currency: string,
    month: string,
  ): Promise<TravelpayoutsSearchResponse> {
    const grouped = await this.travelpayouts.getGroupedPrices({
      origin: query.origin,
      destination: query.destination,
      groupBy: 'departure_at',
      departureAt: month,
      currency,
      direct: query.direct,
    });
    return {
      success: grouped.success,
      currency: grouped.currency,
      data: Object.values(grouped.data ?? {}),
    };
  }

  async calendar(query: CalendarFlightsDto) {
    return this.getGrouped(
      {
        origin: query.origin,
        destination: query.destination,
        groupBy: 'departure_at',
        departureAt: query.month,
        currency: query.currency ?? 'USD',
        direct: query.direct,
      },
      'calendar',
    );
  }

  async history(query: HistoryFlightsDto) {
    return this.getGrouped(
      {
        origin: query.origin,
        destination: query.destination,
        groupBy: 'month',
        currency: query.currency ?? 'USD',
        direct: query.direct,
      },
      'history',
    );
  }

  private async getGrouped(
    params: {
      origin: string;
      destination: string;
      groupBy: 'departure_at' | 'month';
      departureAt?: string;
      currency: string;
      direct?: boolean;
    },
    kind: 'calendar' | 'history',
  ) {
    const key = AppCacheService.hashKey([
      'travelpayouts',
      kind,
      params.origin,
      params.destination,
      params.groupBy,
      params.departureAt,
      params.currency,
      params.direct,
    ]);

    const cached = await this.cache.get<TravelpayoutsGroupedResponse>(key);
    if (cached && !cached.stale) {
      return this.toGroupedResult(
        cached.value,
        params.currency,
        'cache',
        false,
      );
    }

    try {
      const live = await this.travelpayouts.getGroupedPrices(params);
      await this.cache.set(
        key,
        live,
        CacheProvider.TRAVELPAYOUTS,
        TREND_TTL_MS,
      );
      return this.toGroupedResult(
        live,
        params.currency,
        'travelpayouts',
        false,
      );
    } catch (error) {
      if (cached) {
        return this.toGroupedResult(
          cached.value,
          params.currency,
          'cache',
          true,
        );
      }
      throw error;
    }
  }

  private async toSearchResult(
    payload: TravelpayoutsSearchResponse,
    fallbackCurrency: string,
    source: 'travelpayouts' | 'cache',
    stale: boolean,
    extras: Pick<SearchFetch, 'fallback' | 'fallbackPeriod'> = {},
  ) {
    const tickets = this.asTicketList(payload.data);
    const providerCurrency = (
      payload.currency ?? fallbackCurrency
    ).toUpperCase();
    const airlines = await this.getAirlineNames();
    const raw = tickets
      .map((ticket) => this.toOffer(ticket, providerCurrency, airlines))
      .filter((offer): offer is FlightOffer => offer !== null)
      .sort((a, b) => a.price - b.price);
    const { offers: data, currency } = await this.alignCurrency(
      raw,
      providerCurrency,
      fallbackCurrency,
    );

    return {
      data,
      meta: {
        source,
        stale,
        unavailable: data.length === 0,
        currency,
        fallback: extras.fallback,
        fallbackPeriod: extras.fallbackPeriod,
        disclaimer:
          extras.fallback === 'calendar'
            ? 'No dump for these exact dates; showing cheapest one-way days nearby. Prices are indicative, not bookable quotes.'
            : 'Prices are indicative reference points, not bookable quotes.',
      },
    };
  }

  private async toGroupedResult(
    payload: TravelpayoutsGroupedResponse,
    fallbackCurrency: string,
    source: 'travelpayouts' | 'cache',
    stale: boolean,
  ) {
    const providerCurrency = (
      payload.currency ?? fallbackCurrency
    ).toUpperCase();
    const airlines = await this.getAirlineNames();
    const raw = Object.entries(payload.data ?? {})
      .map(([period, ticket]) => {
        const offer = this.toOffer(ticket, providerCurrency, airlines);
        if (!offer) {
          return null;
        }
        return { period, ...offer };
      })
      .filter((point): point is NonNullable<typeof point> => point !== null)
      .sort((a, b) => a.period.localeCompare(b.period));
    const { offers, currency } = await this.alignCurrency(
      raw,
      providerCurrency,
      fallbackCurrency,
    );

    return {
      data: offers,
      meta: {
        source,
        stale,
        unavailable: offers.length === 0,
        currency,
        disclaimer:
          'Prices are indicative reference points, not bookable quotes.',
      },
    };
  }

  private async alignCurrency<T extends FlightOffer>(
    offers: T[],
    providerCurrency: string,
    requestedCurrency: string,
  ): Promise<{ offers: T[]; currency: string }> {
    if (!offers.length || providerCurrency === requestedCurrency) {
      return { offers, currency: providerCurrency };
    }

    try {
      const conversion = await this.currency.convert({
        amount: 1,
        from: providerCurrency,
        to: requestedCurrency,
      });
      const rate = conversion.data.rate;
      return {
        currency: requestedCurrency,
        offers: offers.map((offer) => ({
          ...offer,
          price: Number((offer.price * rate).toFixed(2)),
          currency: requestedCurrency,
        })),
      };
    } catch {
      this.logger.warn(
        `Could not convert ${providerCurrency} → ${requestedCurrency}; keeping provider currency`,
      );
      return { offers, currency: providerCurrency };
    }
  }

  private asTicketList(
    data?: TravelpayoutsTicket[] | Record<string, TravelpayoutsTicket>,
  ): TravelpayoutsTicket[] {
    if (!data) {
      return [];
    }
    return Array.isArray(data) ? data : Object.values(data);
  }

  private hasTickets(payload: TravelpayoutsSearchResponse): boolean {
    return this.asTicketList(payload.data).some(
      (ticket) => ticket.price !== undefined && ticket.price !== null,
    );
  }

  private toOffer(
    ticket: TravelpayoutsTicket,
    currency: string,
    airlines: Record<string, string>,
  ): FlightOffer | null {
    if (ticket.price === undefined || ticket.price === null) {
      return null;
    }

    const airline = ticket.airline?.toUpperCase() ?? null;
    return {
      origin: ticket.origin?.toUpperCase() ?? '',
      destination: ticket.destination?.toUpperCase() ?? '',
      originAirport: ticket.origin_airport?.toUpperCase() ?? null,
      destinationAirport: ticket.destination_airport?.toUpperCase() ?? null,
      price: ticket.price,
      currency,
      airline,
      airlineName: airline ? (airlines[airline] ?? null) : null,
      flightNumber:
        ticket.flight_number != null ? String(ticket.flight_number) : null,
      departureAt: ticket.departure_at ?? null,
      returnAt: ticket.return_at ?? null,
      transfers: ticket.transfers ?? 0,
      durationMinutes: ticket.duration ?? null,
      deeplink: ticket.link ? `https://www.aviasales.com${ticket.link}` : null,
    };
  }

  private async getAirlineNames(): Promise<Record<string, string>> {
    const key = AppCacheService.hashKey(['travelpayouts', 'airlines']);
    const cached = await this.cache.get<Record<string, string>>(key);
    if (cached && !cached.stale) {
      return cached.value;
    }

    try {
      const rows = await this.travelpayouts.getAirlines();
      const map = Object.fromEntries(
        rows
          .filter((row) => row.code && row.name)
          .map((row) => [row.code!.toUpperCase(), row.name!]),
      );
      await this.cache.set(
        key,
        map,
        CacheProvider.TRAVELPAYOUTS,
        AIRLINES_TTL_MS,
      );
      return map;
    } catch {
      return cached?.value ?? {};
    }
  }
}
