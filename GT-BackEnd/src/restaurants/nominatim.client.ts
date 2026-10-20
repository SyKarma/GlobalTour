import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import type { GeocodedPlace, NominatimHit } from './nominatim.types';
import type {
  OverpassElement,
  OverpassElementType,
  OverpassResponse,
} from './overpass.types';

const DEFAULT_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT =
  'GlobalTour/1.0 (travel comparison; OSM Nominatim geocoding)';
const MIN_INTERVAL_MS = 1100;

/** Words Nominatim understands for each OpenStreetMap amenity type. */
const AMENITY_PHRASES: Record<string, string> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  fast_food: 'fast food',
  car_rental: 'car rental',
  car_sharing: 'car sharing',
};

const EXTRA_TAGS = [
  'cuisine',
  'website',
  'contact:website',
  'phone',
  'contact:phone',
  'opening_hours',
  'brand',
  'operator',
  'diet:vegetarian',
  'diet:vegan',
  'takeaway',
  'delivery',
  'outdoor_seating',
  'wheelchair',
];

export type NearbyAmenityParams = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  amenities: string[];
};

export type GeocodeParams = {
  cityName: string;
  countryCode?: string;
};

@Injectable()
export class NominatimClient {
  private readonly baseUrl: string;
  private lastRequestAt = 0;

  constructor(
    private readonly http: HttpClientService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.baseUrl = (
      config.get('NOMINATIM_BASE_URL', { infer: true }) ?? DEFAULT_BASE_URL
    ).replace(/\/$/, '');
  }

  async geocode(params: GeocodeParams): Promise<GeocodedPlace | null> {
    const cityName = params.cityName.trim();
    const countryCode = params.countryCode?.trim().toLowerCase();

    const structured = await this.search({
      city: cityName,
      countrycodes: countryCode,
      featureType: 'settlement',
    });
    const fromStructured = this.pick(structured, cityName, countryCode);
    if (fromStructured) {
      return fromStructured;
    }

    const query = countryCode ? `${cityName}, ${countryCode}` : cityName;
    const fallback = await this.search({
      q: query,
      countrycodes: countryCode,
    });
    return this.pick(fallback, cityName, countryCode);
  }

  /**
   * Backup for when every Overpass mirror is down: asks Nominatim for each
   * amenity type inside a box around the city and returns the places in
   * the same shape Overpass uses, so the rest of the code does not change.
   * It brings fewer details than Overpass, but the search is not empty.
   */
  async searchAmenitiesNear(
    params: NearbyAmenityParams,
  ): Promise<OverpassResponse> {
    const { latitude, longitude, radiusMeters } = params;
    const latDelta = radiusMeters / 111_320;
    const lonDelta =
      radiusMeters /
      (111_320 * Math.max(0.2, Math.cos((latitude * Math.PI) / 180)));
    const viewbox = [
      longitude - lonDelta,
      latitude + latDelta,
      longitude + lonDelta,
      latitude - latDelta,
    ]
      .map((value) => value.toFixed(6))
      .join(',');

    const elements = new Map<string, OverpassElement>();

    for (const amenity of params.amenities) {
      const phrase = AMENITY_PHRASES[amenity];
      if (!phrase) {
        continue;
      }

      const hits = await this.search({
        q: phrase,
        viewbox,
        bounded: '1',
        extratags: '1',
        limit: '40',
      });

      for (const hit of hits ?? []) {
        const element = toElement(hit, amenity);
        if (!element) {
          continue;
        }
        const lat = element.lat ?? element.center?.lat ?? NaN;
        const lon = element.lon ?? element.center?.lon ?? NaN;
        if (
          distanceMeters(latitude, longitude, lat, lon) > radiusMeters * 1.05
        ) {
          continue;
        }
        elements.set(`${element.type}-${element.id}`, element);
      }
    }

    return { elements: [...elements.values()] };
  }

  /** Backup for the detail page when Overpass is down. */
  async lookupElement(
    type: OverpassElementType,
    osmId: number,
  ): Promise<OverpassElement | null> {
    const url = new URL(`${this.baseUrl}/lookup`);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('extratags', '1');
    url.searchParams.set('osm_ids', `${type[0].toUpperCase()}${osmId}`);

    await this.throttle();
    const hits = await this.http.getJson<NominatimHit[]>(url.toString(), {
      timeoutMs: 12_000,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en',
      },
    });

    const hit = hits?.[0];
    return hit ? toElement(hit, hit.type ?? '') : null;
  }

  private async search(
    params: Record<string, string | undefined>,
  ): Promise<NominatimHit[]> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }

    await this.throttle();
    return this.http.getJson<NominatimHit[]>(url.toString(), {
      timeoutMs: 12_000,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en',
      },
    });
  }

  private pick(
    hits: NominatimHit[] | undefined,
    cityName: string,
    countryCode?: string,
  ): GeocodedPlace | null {
    for (const hit of hits ?? []) {
      const latitude = Number(hit.lat);
      const longitude = Number(hit.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      const code = hit.address?.country_code?.toUpperCase() ?? null;
      if (countryCode && code && code !== countryCode.toUpperCase()) {
        continue;
      }

      return {
        latitude,
        longitude,
        name:
          hit.name?.trim() ||
          hit.address?.city ||
          hit.address?.town ||
          hit.address?.village ||
          hit.address?.municipality ||
          cityName,
        displayName: hit.display_name?.trim() || cityName,
        countryName: hit.address?.country ?? null,
        countryCode: code,
      };
    }
    return null;
  }

  private async throttle(): Promise<void> {
    if (process.env.JEST_WORKER_ID) {
      return;
    }
    const wait = MIN_INTERVAL_MS - (Date.now() - this.lastRequestAt);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    this.lastRequestAt = Date.now();
  }
}

function toElement(
  hit: NominatimHit,
  amenity: string,
): OverpassElement | null {
  const type = hit.osm_type as OverpassElementType | undefined;
  const id = Number(hit.osm_id);
  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  const name = hit.name?.trim();

  if (
    (type !== 'node' && type !== 'way' && type !== 'relation') ||
    !Number.isFinite(id) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !name
  ) {
    return null;
  }
  // Keep only real places of the requested kind (not streets or towns
  // that merely contain the word).
  if (hit.category && hit.category !== 'amenity') {
    return null;
  }
  if (amenity && hit.type && hit.type !== amenity) {
    return null;
  }

  const tags: Record<string, string> = {
    name,
    amenity: hit.type ?? amenity,
  };
  const address = hit.address ?? {};
  if (address.road) {
    tags['addr:street'] = address.road;
  }
  if (address.house_number) {
    tags['addr:housenumber'] = address.house_number;
  }
  const city =
    address.city ?? address.town ?? address.village ?? address.municipality;
  if (city) {
    tags['addr:city'] = city;
  }
  if (address.postcode) {
    tags['addr:postcode'] = address.postcode;
  }
  for (const key of EXTRA_TAGS) {
    const value = hit.extratags?.[key];
    if (value) {
      tags[key] = value;
    }
  }

  return type === 'node'
    ? { type, id, lat, lon, tags }
    : { type, id, center: { lat, lon }, tags };
}

function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) {
    return Infinity;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
