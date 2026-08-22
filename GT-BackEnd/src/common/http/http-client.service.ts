import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export type HttpClientOptions = {
  timeoutMs?: number;
  headers?: Record<string, string>;
};

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);

  async getJson<T>(url: string, options: HttpClientOptions = {}): Promise<T> {
    return this.requestJson<T>(url, { method: 'GET', ...options });
  }

  async postJson<T>(
    url: string,
    body: unknown,
    options: HttpClientOptions = {},
  ): Promise<T> {
    return this.requestJson<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  private async requestJson<T>(
    url: string,
    init: RequestInit & HttpClientOptions,
  ): Promise<T> {
    const timeoutMs = init.timeoutMs ?? 8_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: init.method,
        headers: {
          Accept: 'application/json',
          ...init.headers,
        },
        body: init.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`${response.status} ${url} ${body.slice(0, 200)}`);
        throw this.toHttpException(response.status, body);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      this.logger.warn(
        `Request failed ${url}: ${error instanceof Error ? error.message : error}`,
      );
      throw new ServiceUnavailableException('Upstream service unavailable');
    } finally {
      clearTimeout(timer);
    }
  }

  private toHttpException(status: number, body: string) {
    const message = this.parseMessage(body) ?? `Upstream request failed (${status})`;

    if (status === 404) {
      return new NotFoundException(message);
    }
    if (status === 400 || status === 422) {
      return new BadRequestException(message);
    }
    if (status === 401 || status === 403) {
      return new ServiceUnavailableException(
        'Upstream provider rejected the request',
      );
    }
    return new ServiceUnavailableException(message);
  }

  private parseMessage(body: string): string | null {
    try {
      const parsed = JSON.parse(body) as { message?: string };
      return parsed.message ?? null;
    } catch {
      return null;
    }
  }
}
