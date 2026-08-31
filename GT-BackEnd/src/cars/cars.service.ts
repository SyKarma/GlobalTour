import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppCacheService } from '../common/cache/app-cache.service';
import { CacheProvider } from '../database/enums';
import { DestinationsService } from '../destinations/destinations.service';
import { NominatimClient } from '../restaurants/nominatim.client';
import type { GeocodedPlace } from '../restaurants/nominatim.types';
import { OverpassClient } from '../restaurants/overpass.client';
import type {
  OverpassElement,
  OverpassElementType,
  OverpassResponse,
  OverpassTags,
} from '../restaurants/overpass.types';
import { CAR_AMENITIES } from './car.types';
import { SearchCarsDto } from './dto/search-cars.dto';

const LIST_TTL_MS = 24 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 24 * 60 * 60 * 1000;
const OSM_ID = /^(node|way|relation)-(\d+)$/;
const ATTRIBUTION = '© OpenStreetMap contributors';
const DEFAULT_RADIUS = 8000;
const DISCLAIMER = 'Locations only. No rates, availability, or booking.';

const TYPE_LABEL: Record<string, string> = {
  car_rental: 'Car rental',
  car_sharing: 'Car sharing',
};

export type CarLinks = {
  self: string;
  maps: string | null;
  website: string | null;
};

export type CarSummary = {
  id: string;
  name: string;
  brand: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryType: string | null;
  types: string[];
  provider: 'openstreetmap';
  href: string;
  links: CarLinks;
};

export type CarDetail = CarSummary & {
  phone: string | null;
  internationalPhone: string | null;
  editorialSummary: string | null;
  weekdayHours: string[];
};

@Injectable()
export class CarsService {
  private readonly logger = new Logger(CarsService.name);

  constructor(
    private readonly overpass: OverpassClient,
    private readonly nominatim: NominatimClient,
    private readonly destinations: DestinationsService,
    private readonly cache: AppCacheService,
  ) {}

  async search(query: SearchCarsDto) {
    const radiusMeters = query.radius ?? DEFAULT_RADIUS;
    const place = await this.resolvePlace(query);
    const catalogIata = await this.catalogIata(query);
    const area = {
      cityIata: catalogIata,
      cityName: place.name,
      countryName: place.countryName,
      countryCode:
        place.countryCode ?? query.countryCode?.toUpperCase() ?? null,
      latitude: place.latitude,
      longitude: place.longitude,
    };

    const key = AppCacheService.hashKey([
      'overpass',
      'cars',
      'nearby',
      'v1',
      area.countryCode,
      query.cityName.trim().toLowerCase(),
      radiusMeters,
    ]);

    const cached = await this.cache.get<OverpassResponse>(key);
    if (cached && !cached.stale) {
      return this.toSearchResult(cached.value, area, query, 'cache', false);
    }

    try {
      const live = await this.overpass.searchNearby({
        latitude: area.latitude,
        longitude: area.longitude,
        radiusMeters,
        amenities: [...CAR_AMENITIES],
      });
      await this.cache.set(key, live, CacheProvider.OVERPASS, LIST_TTL_MS);
      return this.toSearchResult(live, area, query, 'overpass', false);
    } catch (error) {
      if (cached) {
        this.logger.warn('Serving car search from stale cache');
        return this.toSearchResult(cached.value, area, query, 'cache', true);
      }
      throw error;
    }
  }

  async getById(placeId: string) {
    const parsed = parseOsmId(placeId);
    if (!parsed) {
      throw new BadRequestException('Invalid OpenStreetMap id');
    }

    const key = AppCacheService.hashKey([
      'overpass',
      'cars',
      'element',
      'v1',
      parsed.type,
      parsed.id,
    ]);
    const cached = await this.cache.get<OverpassElement>(key);
    if (cached && !cached.stale) {
      return {
        data: this.toDetail(cached.value),
        meta: {
          source: 'cache' as const,
          stale: false,
          attribution: ATTRIBUTION,
          disclaimer: DISCLAIMER,
        },
      };
    }

    try {
      const live = await this.overpass.getElement(parsed.type, parsed.id);
      if (!live) {
        throw new NotFoundException(
          `Rental car location ${placeId} was not found`,
        );
      }
      await this.cache.set(key, live, CacheProvider.OVERPASS, DETAIL_TTL_MS);
      return {
        data: this.toDetail(live),
        meta: {
          source: 'overpass' as const,
          stale: false,
          attribution: ATTRIBUTION,
          disclaimer: DISCLAIMER,
        },
      };
    } catch (error) {
      if (cached) {
        return {
          data: this.toDetail(cached.value),
          meta: {
            source: 'cache' as const,
            stale: true,
            attribution: ATTRIBUTION,
            disclaimer: DISCLAIMER,
          },
        };
      }
      throw error;
    }
  }

  private async resolvePlace(query: SearchCarsDto): Promise<GeocodedPlace> {
    const cacheKey = AppCacheService.hashKey([
      'nominatim',
      'geocode',
      'v1',
      query.cityName.trim().toLowerCase(),
      query.countryCode?.toUpperCase() ?? '',
    ]);
    const cached = await this.cache.get<GeocodedPlace>(cacheKey);
    if (cached && !cached.stale) {
      return cached.value;
    }

    const live = await this.nominatim.geocode({
      cityName: query.cityName,
      countryCode: query.countryCode,
    });
    if (!live) {
      const label = query.countryCode
        ? `${query.cityName}, ${query.countryCode}`
        : query.cityName;
      throw new NotFoundException(`Place ${label} was not found`);
    }

    await this.cache.set(cacheKey, live, CacheProvider.OVERPASS, LIST_TTL_MS);
    return live;
  }

  private async catalogIata(query: SearchCarsDto): Promise<string | null> {
    try {
      const { data } = await this.destinations.getByCity(
        query.cityName,
        query.countryCode,
      );
      return data.cityIata;
    } catch {
      return null;
    }
  }

  private toSearchResult(
    payload: OverpassResponse,
    destination: {
      cityIata: string | null;
      cityName: string;
      countryName: string | null;
      countryCode: string | null;
    },
    query: SearchCarsDto,
    source: 'overpass' | 'cache',
    stale: boolean,
  ) {
    const limit = query.limit ?? 20;
    const radiusMeters = query.radius ?? DEFAULT_RADIUS;
    const matched = (payload.elements ?? [])
      .map((element) => this.toSummary(element))
      .filter((place): place is CarSummary => place !== null)
      .filter((place) => matchesFilters(place, query))
      .sort((left, right) => completeness(right) - completeness(left));

    const data = matched.slice(0, limit);

    return {
      data,
      meta: {
        source,
        stale,
        unavailable: data.length === 0,
        iata: destination.cityIata,
        cityName: destination.cityName,
        countryName: destination.countryName,
        countryCode: destination.countryCode,
        radiusMeters,
        matched: matched.length,
        filters: {
          type: query.type ?? null,
          q: query.q ?? null,
          hasWebsite: query.hasWebsite === true,
        },
        attribution: ATTRIBUTION,
        disclaimer: DISCLAIMER,
      },
    };
  }

  private toSummary(element: OverpassElement): CarSummary | null {
    const tags = element.tags ?? {};
    const amenity = tags.amenity ?? null;
    const brand = tags.brand?.trim() || tags.operator?.trim() || null;
    const name = (
      tags.name ??
      tags['name:en'] ??
      brand ??
      (amenity ? TYPE_LABEL[amenity] : null) ??
      ''
    ).trim();
    if (!name || !Number.isFinite(element.id)) {
      return null;
    }

    const id = `${element.type}-${element.id}`;
    const href = `/api/cars/${id}`;
    const { latitude, longitude } = coordinatesOf(element);
    const website = tags.website ?? tags['contact:website'] ?? null;

    return {
      id,
      name,
      brand,
      address: addressOf(tags),
      latitude,
      longitude,
      primaryType: amenity ? (TYPE_LABEL[amenity] ?? amenity) : null,
      types: amenity ? [amenity] : [],
      provider: 'openstreetmap',
      href,
      links: {
        self: href,
        maps: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        website,
      },
    };
  }

  private toDetail(element: OverpassElement): CarDetail {
    const summary = this.toSummary(element);
    if (!summary) {
      throw new NotFoundException('Rental car location was not found');
    }

    const tags = element.tags ?? {};
    const phone = tags.phone ?? tags['contact:phone'] ?? null;
    const hours = tags.opening_hours?.trim();
    const description = tags.description?.trim();

    return {
      ...summary,
      phone,
      internationalPhone: tags['contact:phone'] ?? phone,
      editorialSummary: description,
      weekdayHours: hours ? [hours] : [],
    };
  }
}

function parseOsmId(
  value: string,
): { type: OverpassElementType; id: number } | null {
  const match = OSM_ID.exec(value.trim());
  if (!match) {
    return null;
  }
  return {
    type: match[1] as OverpassElementType,
    id: Number(match[2]),
  };
}

function coordinatesOf(element: OverpassElement): {
  latitude: number | null;
  longitude: number | null;
} {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  return {
    latitude: lat ?? null,
    longitude: lon ?? null,
  };
}

function addressOf(tags: OverpassTags): string | null {
  if (tags['addr:full']) {
    return tags['addr:full'];
  }
  const parts = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
    tags['addr:city'],
    tags['addr:postcode'],
  ].filter((part): part is string => Boolean(part && part.length > 0));
  return parts.length > 0 ? parts.join(', ') : null;
}

function matchesFilters(place: CarSummary, query: SearchCarsDto): boolean {
  if (query.type && !place.types.includes(query.type)) {
    return false;
  }
  if (query.q) {
    const needle = query.q.toLowerCase();
    const haystack = `${place.name} ${place.brand ?? ''}`.toLowerCase();
    if (!haystack.includes(needle)) {
      return false;
    }
  }
  if (query.hasWebsite === true && !place.links.website) {
    return false;
  }
  return true;
}

function completeness(place: CarSummary): number {
  let score = 0;
  if (place.links.website) score += 2;
  if (place.address) score += 1;
  if (place.brand) score += 1;
  if (place.primaryType === 'Car rental') score += 1;
  return score;
}
