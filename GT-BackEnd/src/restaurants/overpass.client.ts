import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import {
  OverpassElement,
  OverpassElementType,
  OverpassResponse,
} from './overpass.types';

const DEFAULT_MIRRORS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const USER_AGENT = 'GlobalTour/1.0 (travel comparison; OSM Overpass POIs)';
const SEARCH_TIMEOUT_MS = 12_000;
const DETAIL_TIMEOUT_MS = 10_000;
const FETCH_CAP = 80;
/** If the preferred mirror is this slow, also ask the other mirrors. */
const HEDGE_AFTER_MS = 4_000;
const AMENITY_TAG = /^[a-z0-9_]+$/;
const BUSY_MESSAGE = 'OpenStreetMap Overpass is busy. Try again in a moment.';

export type NearbySearchParams = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  amenities: string[];
};

@Injectable()
export class OverpassClient {
  private readonly logger = new Logger(OverpassClient.name);
  private readonly endpoints: string[];
  private preferredIndex = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly http: HttpClientService,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    const configured = config
      .get('OVERPASS_BASE_URL', { infer: true })
      ?.replace(/\/$/, '');
    this.endpoints = unique([configured, ...DEFAULT_MIRRORS]);
  }

  async searchNearby(params: NearbySearchParams): Promise<OverpassResponse> {
    const lat = params.latitude.toFixed(6);
    const lon = params.longitude.toFixed(6);
    const radius = Math.round(params.radiusMeters);
    const amenities = sanitizeAmenities(params.amenities);
    const amenityRegex = amenities.join('|');
    const around = `(around:${radius},${lat},${lon})`;

    return this.run(
      `[out:json][timeout:15];\n(\n  node["amenity"~"^(${amenityRegex})$"]${around};\n  way["amenity"~"^(${amenityRegex})$"]${around};\n);\nout center tags ${FETCH_CAP};`,
      SEARCH_TIMEOUT_MS,
    );
  }

  async getElement(
    type: OverpassElementType,
    osmId: number,
  ): Promise<OverpassElement | null> {
    const payload = await this.run(
      `[out:json][timeout:10];\n${type}(${osmId});\nout center tags;`,
      DETAIL_TIMEOUT_MS,
    );
    return payload.elements?.[0] ?? null;
  }

  private run(query: string, timeoutMs: number): Promise<OverpassResponse> {
    const next = this.queue.then(
      () => this.runOnce(query, timeoutMs),
      () => this.runOnce(query, timeoutMs),
    );
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  /**
   * Ask the mirror that answered last time first. If it has not answered
   * after a few seconds (or fails), ask the other mirrors at the same time
   * and keep the first good answer. Before, each mirror was tried in turn
   * with a long timeout, so one slow mirror could block a search for more
   * than a minute.
   */
  private runOnce(
    query: string,
    timeoutMs: number,
  ): Promise<OverpassResponse> {
    const [preferred, ...others] = this.mirrors();

    return new Promise<OverpassResponse>((resolve, reject) => {
      let settled = false;
      let pending = 0;
      let othersStarted = others.length === 0;
      const errors: unknown[] = [];

      const finishWithError = () => {
        if (settled || pending > 0 || !othersStarted) {
          return;
        }
        settled = true;
        clearTimeout(hedgeTimer);
        const fatal = errors.find((error) => !isRetryable(error));
        if (fatal) {
          reject(fatal);
          return;
        }
        this.logger.warn(
          `All Overpass mirrors failed: ${errors
            .map((error) =>
              error instanceof Error ? error.message : 'unknown error',
            )
            .join(' | ')}`,
        );
        reject(new ServiceUnavailableException(BUSY_MESSAGE));
      };

      const start = (endpoint: string) => {
        pending += 1;
        this.ask(endpoint, query, timeoutMs).then(
          (payload) => {
            pending -= 1;
            if (settled) {
              return;
            }
            settled = true;
            clearTimeout(hedgeTimer);
            this.remember(endpoint);
            resolve(payload);
          },
          (error: unknown) => {
            pending -= 1;
            errors.push(error);
            if (!settled && !isRetryable(error)) {
              settled = true;
              clearTimeout(hedgeTimer);
              reject(error);
              return;
            }
            this.logger.warn(`Overpass ${endpoint} failed`);
            if (endpoint === preferred) {
              startOthers();
            }
            finishWithError();
          },
        );
      };

      const startOthers = () => {
        if (othersStarted || settled) {
          return;
        }
        othersStarted = true;
        others.forEach(start);
      };

      const hedgeTimer = setTimeout(startOthers, HEDGE_AFTER_MS);
      start(preferred);
    });
  }

  private async ask(
    endpoint: string,
    query: string,
    timeoutMs: number,
  ): Promise<OverpassResponse> {
    const payload = await this.http.postForm<OverpassResponse>(
      endpoint,
      { data: query },
      {
        timeoutMs,
        headers: { 'User-Agent': USER_AGENT },
      },
    );

    if (payload.remark && /error|timed out|timeout/i.test(payload.remark)) {
      throw new ServiceUnavailableException('OpenStreetMap Overpass timed out');
    }

    return payload;
  }

  private mirrors(): string[] {
    const start = this.preferredIndex % this.endpoints.length;
    return [...this.endpoints.slice(start), ...this.endpoints.slice(0, start)];
  }

  private remember(endpoint: string) {
    const index = this.endpoints.indexOf(endpoint);
    if (index >= 0) {
      this.preferredIndex = index;
    }
  }
}

function unique(urls: Array<string | undefined>): string[] {
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

function sanitizeAmenities(amenities: string[]): string[] {
  const cleaned = [
    ...new Set(
      amenities
        .map((amenity) => amenity.trim().toLowerCase())
        .filter((amenity) => AMENITY_TAG.test(amenity)),
    ),
  ];
  if (cleaned.length === 0) {
    throw new ServiceUnavailableException('Overpass amenity list is empty');
  }
  return cleaned;
}

function isRetryable(error: unknown): boolean {
  return error instanceof ServiceUnavailableException;
}
