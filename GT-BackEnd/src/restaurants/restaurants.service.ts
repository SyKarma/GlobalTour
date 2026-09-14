import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppCacheService } from '../common/cache/app-cache.service';
import { CacheProvider } from '../database/enums';
import { DestinationsService } from '../destinations/destinations.service';
import { SearchRestaurantsDto } from './dto/search-restaurants.dto';
import { NominatimClient } from './nominatim.client';
import type { GeocodedPlace } from './nominatim.types';
import { OverpassClient } from './overpass.client';
import {
  FOOD_AMENITIES,
  OverpassElement,
  OverpassElementType,
  OverpassResponse,
  OverpassTags,
} from './overpass.types';

const LIST_TTL_MS = 24 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 24 * 60 * 60 * 1000;
const OSM_ID = /^(node|way|relation)-(\d+)$/;
const ATTRIBUTION = '© OpenStreetMap contributors';

const TYPE_LABEL: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  fast_food: 'Fast food',
};

export type RestaurantLinks = {
  self: string;
  maps: string | null;
  website: string | null;
};

export type RestaurantSummary = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  cuisine: string[];
  primaryType: string | null;
  types: string[];
  openNow: boolean | null;
  provider: 'openstreetmap';
  href: string;
  links: RestaurantLinks;
};

export type RestaurantDetail = RestaurantSummary & {
  phone: string | null;
  internationalPhone: string | null;
  editorialSummary: string | null;
  weekdayHours: string[];
};

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(
    private readonly overpass: OverpassClient,
    private readonly nominatim: NominatimClient,
    private readonly destinations: DestinationsService,
    private readonly cache: AppCacheService,
  ) {}

  async search(query: SearchRestaurantsDto) {
    const radiusMeters = query.radius ?? 4000;
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
      'nearby',
      'v4',
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
        amenities: [...FOOD_AMENITIES],
      });
      await this.cache.set(key, live, CacheProvider.OVERPASS, LIST_TTL_MS);
      return this.toSearchResult(live, area, query, 'overpass', false);
    } catch (error) {
      if (cached) {
        this.logger.warn('Serving restaurant search from stale cache');
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
        },
      };
    }

    try {
      const live = await this.overpass.getElement(parsed.type, parsed.id);
      if (!live) {
        throw new NotFoundException(`Restaurant ${placeId} was not found`);
      }
      await this.cache.set(key, live, CacheProvider.OVERPASS, DETAIL_TTL_MS);
      return {
        data: this.toDetail(live),
        meta: {
          source: 'overpass' as const,
          stale: false,
          attribution: ATTRIBUTION,
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
          },
        };
      }
      throw error;
    }
  }

  private async resolvePlace(
    query: SearchRestaurantsDto,
  ): Promise<GeocodedPlace> {
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

  private async catalogIata(
    query: SearchRestaurantsDto,
  ): Promise<string | null> {
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
    query: SearchRestaurantsDto,
    source: 'overpass' | 'cache',
    stale: boolean,
  ) {
    const limit = query.limit ?? 20;
    const radiusMeters = query.radius ?? 4000;
    const matched = (payload.elements ?? [])
      .map((element) => this.toSummary(element))
      .filter((place): place is RestaurantSummary => place !== null)
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
          cuisine: query.cuisine ?? null,
          q: query.q ?? null,
          hasWebsite: query.hasWebsite === true,
        },
        attribution: ATTRIBUTION,
      },
    };
  }

  private toSummary(element: OverpassElement): RestaurantSummary | null {
    const tags = element.tags ?? {};
    const name = (tags.name ?? tags['name:en'] ?? '').trim();
    if (!name || !Number.isFinite(element.id)) {
      return null;
    }

    const id = `${element.type}-${element.id}`;
    const href = `/api/restaurants/${id}`;
    const { latitude, longitude } = coordinatesOf(element);
    const website = tags.website ?? tags['contact:website'] ?? null;
    const cuisine = cuisineOf(tags);
    const amenity = tags.amenity ?? null;

    return {
      id,
      name,
      address: addressOf(tags),
      latitude,
      longitude,
      rating: null,
      reviewCount: null,
      priceLevel: null,
      cuisine,
      primaryType: amenity ? (TYPE_LABEL[amenity] ?? amenity) : null,
      types: typesOf(tags),
      openNow: null,
      provider: 'openstreetmap',
      href,
      links: {
        self: href,
        maps: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        website,
      },
    };
  }

  private toDetail(element: OverpassElement): RestaurantDetail {
    const summary = this.toSummary(element);
    if (!summary) {
      throw new NotFoundException('Restaurant was not found');
    }

    const tags = element.tags ?? {};
    const phone = tags.phone ?? tags['contact:phone'] ?? null;
    const hours = tags.opening_hours?.trim();
    const cuisineLabel = cuisineOf(tags).join(', ').replace(/_/g, ' ');
    const description = tags.description?.trim();

    return {
      ...summary,
      phone,
      internationalPhone: tags['contact:phone'] ?? phone,
      editorialSummary:
        description ?? (cuisineLabel ? `Cuisine: ${cuisineLabel}` : null),
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

function typesOf(tags: OverpassTags): string[] {
  const types = [tags.amenity, ...cuisineOf(tags)]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  return [...new Set(types)];
}

function cuisineOf(tags: OverpassTags): string[] {
  return (tags.cuisine ?? '')
    .split(';')
    .map((value) =>
      value
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_'),
    )
    .filter((value) => value.length > 0);
}

function matchesFilters(
  place: RestaurantSummary,
  query: SearchRestaurantsDto,
): boolean {
  if (query.type && !place.types.includes(query.type)) {
    return false;
  }
  if (query.cuisine && !place.cuisine.includes(query.cuisine)) {
    return false;
  }
  if (query.q && !place.name.toLowerCase().includes(query.q.toLowerCase())) {
    return false;
  }
  if (query.hasWebsite === true && !place.links.website) {
    return false;
  }
  return true;
}

function completeness(place: RestaurantSummary): number {
  let score = 0;
  if (place.links.website) score += 2;
  if (place.address) score += 1;
  if (place.primaryType === 'Restaurant') score += 1;
  if (place.types.length > 1) score += 1;
  return score;
}
