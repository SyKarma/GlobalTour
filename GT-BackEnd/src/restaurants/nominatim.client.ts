import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import type { GeocodedPlace, NominatimHit } from './nominatim.types';

const DEFAULT_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT =
  'GlobalTour/1.0 (travel comparison; OSM Nominatim geocoding)';
const MIN_INTERVAL_MS = 1100;

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
