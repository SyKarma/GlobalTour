import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppCacheService } from '../common/cache/app-cache.service';
import { CacheProvider } from '../database/enums';
import { HotelRatesDto } from './dto/hotel-rates.dto';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { LiteApiClient } from './liteapi.client';
import {
  LiteApiHotel,
  LiteApiHotelRates,
  LiteApiHotelResponse,
  LiteApiListResponse,
  LiteApiRatesResponse,
} from './liteapi.types';

const LIST_TTL_MS = 24 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 24 * 60 * 60 * 1000;
const RATES_TTL_MS = 60 * 60 * 1000;

export type HotelLinks = {
  self: string;
  rates: string;
  map: string | null;
};

export type HotelSummary = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  starRating: number | null;
  rating: number | null;
  reviewCount: number | null;
  chain: string | null;
  thumbnail: string | null;
  mainPhoto: string | null;
  provider: 'liteapi';
  href: string;
  links: HotelLinks;
};

export type HotelDetail = HotelSummary & {
  description: string | null;
  amenities: string[];
  images: Array<{ url: string; caption: string | null }>;
};

export type HotelRate = {
  name: string | null;
  board: string | null;
  maxOccupancy: number | null;
  price: number;
  currency: string;
};

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(
    private readonly liteapi: LiteApiClient,
    private readonly cache: AppCacheService,
  ) {}

  async search(query: SearchHotelsDto) {
    const limit = query.limit ?? 20;
    const key = AppCacheService.hashKey([
      'liteapi',
      'search',
      'v2',
      query.countryCode,
      query.cityName,
      limit,
    ]);

    const cached = await this.cache.get<LiteApiListResponse>(key);
    if (cached && !cached.stale) {
      return this.toSearchResult(cached.value, 'cache', false);
    }

    try {
      const live = await this.liteapi.searchHotels({
        countryCode: query.countryCode,
        cityName: query.cityName,
        limit,
      });
      await this.cache.set(key, live, CacheProvider.LITEAPI, LIST_TTL_MS);
      return this.toSearchResult(live, 'liteapi', false);
    } catch (error) {
      if (cached) {
        this.logger.warn('Serving hotel search from stale cache');
        return this.toSearchResult(cached.value, 'cache', true);
      }
      throw error;
    }
  }

  async getById(hotelId: string) {
    const key = AppCacheService.hashKey(['liteapi', 'hotel', 'v2', hotelId]);
    const cached = await this.cache.get<LiteApiHotelResponse>(key);
    if (cached && !cached.stale) {
      return { data: this.toDetail(cached.value.data), meta: { source: 'cache', stale: false } };
    }

    try {
      const live = await this.liteapi.getHotel(hotelId);
      if (!live.data?.id) {
        throw new NotFoundException(`Hotel ${hotelId} was not found`);
      }
      await this.cache.set(key, live, CacheProvider.LITEAPI, DETAIL_TTL_MS);
      return { data: this.toDetail(live.data), meta: { source: 'liteapi', stale: false } };
    } catch (error) {
      if (cached?.value.data) {
        return { data: this.toDetail(cached.value.data), meta: { source: 'cache', stale: true } };
      }
      throw error;
    }
  }

  async getRates(hotelId: string, query: HotelRatesDto) {
    const currency = query.currency ?? 'USD';
    const adults = query.adults ?? 2;
    const guestNationality = query.guestNationality ?? 'US';
    const key = AppCacheService.hashKey([
      'liteapi',
      'rates',
      hotelId,
      query.checkin,
      query.checkout,
      currency,
      adults,
      guestNationality,
    ]);

    const cached = await this.cache.get<LiteApiRatesResponse>(key);
    if (cached && !cached.stale) {
      return this.toRatesResult(
        hotelId,
        query,
        currency,
        cached.value,
        'cache',
        false,
      );
    }

    try {
      const live = await this.liteapi.getRates({
        hotelId,
        checkin: query.checkin,
        checkout: query.checkout,
        currency,
        adults,
        guestNationality,
      });
      await this.cache.set(key, live, CacheProvider.LITEAPI, RATES_TTL_MS);
      return this.toRatesResult(hotelId, query, currency, live, 'liteapi', false);
    } catch (error) {
      if (cached) {
        return this.toRatesResult(
          hotelId,
          query,
          currency,
          cached.value,
          'cache',
          true,
        );
      }
      throw error;
    }
  }

  private toSearchResult(
    payload: LiteApiListResponse,
    source: 'liteapi' | 'cache',
    stale: boolean,
  ) {
    const data = (payload.data ?? [])
      .map((hotel) => this.toSummary(hotel))
      .filter((hotel): hotel is HotelSummary => hotel !== null);

    return {
      data,
      meta: {
        source,
        stale,
        unavailable: data.length === 0,
        total: payload.total ?? data.length,
        disclaimer: 'Prices are indicative reference points, not bookable quotes.',
      },
    };
  }

  private toRatesResult(
    hotelId: string,
    query: HotelRatesDto,
    currency: string,
    payload: LiteApiRatesResponse,
    source: 'liteapi' | 'cache',
    stale: boolean,
  ) {
    const hotelRates = payload.data?.find((row) => row.hotelId === hotelId) ?? payload.data?.[0];
    const rates = this.extractRates(hotelRates, currency);

    return {
      data: {
        hotelId,
        checkin: query.checkin,
        checkout: query.checkout,
        currency,
        rates,
      },
      meta: {
        source,
        stale,
        unavailable: rates.length === 0,
        disclaimer: 'Prices are indicative reference points, not bookable quotes.',
      },
    };
  }

  private toSummary(hotel: LiteApiHotel): HotelSummary | null {
    if (!hotel.id || !hotel.name) {
      return null;
    }

    const href = `/api/hotels/${hotel.id}`;
    return {
      id: hotel.id,
      name: hotel.name,
      city: hotel.city ?? null,
      country: hotel.country ?? null,
      address: hotel.address ?? null,
      latitude: hotel.latitude ?? null,
      longitude: hotel.longitude ?? null,
      starRating: hotel.starRating ?? hotel.stars ?? null,
      rating: hotel.rating ?? null,
      reviewCount: hotel.reviewCount ?? null,
      chain: hotel.chain ?? null,
      thumbnail: hotel.thumbnail ?? hotel.main_photo ?? null,
      mainPhoto: hotel.main_photo ?? hotel.thumbnail ?? null,
      provider: 'liteapi',
      href,
      links: {
        self: href,
        rates: `${href}/rates`,
        map: this.toMapUrl(hotel),
      },
    };
  }

  private toMapUrl(hotel: LiteApiHotel): string | null {
    if (hotel.latitude != null && hotel.longitude != null) {
      return `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`;
    }

    const query = [hotel.name, hotel.address, hotel.city, hotel.country]
      .filter(Boolean)
      .join(', ');
    if (!query) {
      return null;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  private toDetail(hotel?: LiteApiHotel): HotelDetail {
    const summary = hotel ? this.toSummary(hotel) : null;
    if (!summary) {
      throw new NotFoundException('Hotel was not found');
    }

    const images = (hotel?.hotelImages ?? [])
      .filter((image): image is { url: string; caption?: string } => Boolean(image.url))
      .map((image) => ({ url: image.url, caption: image.caption ?? null }));

    const amenities =
      hotel?.hotelFacilities ??
      hotel?.facilities
        ?.map((facility) => facility.name)
        .filter((name): name is string => Boolean(name)) ??
      [];

    return {
      ...summary,
      description: hotel?.hotelDescription ?? null,
      amenities,
      images,
    };
  }

  private extractRates(
    hotelRates: LiteApiHotelRates | undefined,
    fallbackCurrency: string,
  ): HotelRate[] {
    const rates: HotelRate[] = [];

    for (const room of hotelRates?.roomTypes ?? []) {
      for (const rate of room.rates ?? []) {
        const money = rate.retailRate?.total?.[0];
        if (money?.amount === undefined) {
          continue;
        }
        rates.push({
          name: rate.name ?? null,
          board: rate.boardName ?? rate.boardType ?? null,
          maxOccupancy: rate.maxOccupancy ?? rate.adultCount ?? null,
          price: money.amount,
          currency: (money.currency ?? fallbackCurrency).toUpperCase(),
        });
      }
    }

    return rates.sort((a, b) => a.price - b.price);
  }
}
