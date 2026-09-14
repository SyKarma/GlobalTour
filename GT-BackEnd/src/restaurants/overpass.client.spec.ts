import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from '../common/http/http-client.service';
import { EnvironmentVariables } from '../config/env.validation';
import { OverpassClient } from './overpass.client';

describe('OverpassClient', () => {
  const postForm = jest.fn<HttpClientService['postForm']>();
  let client: OverpassClient;

  beforeEach(() => {
    postForm.mockReset();
    postForm.mockResolvedValue({ elements: [] });
    client = new OverpassClient(
      { postForm } as unknown as HttpClientService,
      {
        get: (key: string) =>
          key === 'OVERPASS_BASE_URL'
            ? 'https://overpass-api.de/api/interpreter'
            : undefined,
      } as unknown as ConfigService<EnvironmentVariables, true>,
    );
  });

  it('posts a nearby food amenity query with a User-Agent', async () => {
    await client.searchNearby({
      latitude: 9.9281,
      longitude: -84.0907,
      radiusMeters: 4000,
      amenities: ['restaurant', 'cafe', 'fast_food'],
    });

    const [url, fields, options] = postForm.mock.calls[0] as [
      string,
      { data: string },
      { headers: Record<string, string> },
    ];
    expect(url).toBe('https://overpass-api.de/api/interpreter');
    expect(fields.data).toContain('amenity"~"^(restaurant|cafe|fast_food)$"');
    expect(fields.data).toContain('around:4000,9.928100,-84.090700');
    expect(options.headers['User-Agent']).toContain('GlobalTour');
  });

  it('fails over to another Overpass mirror after a 502 or 504', async () => {
    postForm
      .mockRejectedValueOnce(
        new ServiceUnavailableException('Upstream request failed (502)'),
      )
      .mockResolvedValueOnce({
        elements: [{ type: 'node', id: 1, tags: { name: 'Soda' } }],
      });

    const result = await client.searchNearby({
      latitude: 10.15,
      longitude: -85.45,
      radiusMeters: 5000,
      amenities: ['car_rental'],
    });

    expect(postForm).toHaveBeenCalledTimes(2);
    expect((postForm.mock.calls[0] as [string])[0]).toContain(
      'overpass-api.de',
    );
    expect((postForm.mock.calls[1] as [string])[0]).not.toContain(
      'overpass-api.de',
    );
    expect(result.elements?.[0]?.id).toBe(1);
  });

  it('retries the last working mirror first', async () => {
    postForm
      .mockRejectedValueOnce(
        new ServiceUnavailableException('Upstream request failed (502)'),
      )
      .mockResolvedValue({
        elements: [{ type: 'node', id: 2, tags: { name: 'Hertz' } }],
      });

    await client.searchNearby({
      latitude: 10.08,
      longitude: -84.47,
      radiusMeters: 8000,
      amenities: ['car_rental'],
    });
    postForm.mockClear();
    postForm.mockResolvedValue({
      elements: [{ type: 'node', id: 2, tags: { name: 'Hertz' } }],
    });

    await client.searchNearby({
      latitude: 10.08,
      longitude: -84.47,
      radiusMeters: 8000,
      amenities: ['car_rental'],
    });

    expect((postForm.mock.calls[0] as [string])[0]).toContain(
      'overpass.private.coffee',
    );
  });

  it('loads a single OSM element by type and id', async () => {
    postForm.mockResolvedValue({
      elements: [{ type: 'node', id: 42, tags: { name: 'Soda Tapia' } }],
    });

    const element = await client.getElement('node', 42);
    const [, fields] = postForm.mock.calls[0] as [string, { data: string }];
    expect(fields.data).toContain('node(42);');
    expect(element?.id).toBe(42);
  });

  it('treats Overpass timeout remarks as unavailable', async () => {
    postForm.mockResolvedValue({
      remark: 'runtime error: Query timed out',
      elements: [],
    });

    await expect(
      client.searchNearby({
        latitude: 9.9,
        longitude: -84.1,
        radiusMeters: 4000,
        amenities: ['restaurant'],
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(postForm.mock.calls.length).toBeGreaterThan(1);
  });

  it('runs Overpass queries one at a time', async () => {
    let inflight = 0;
    let maxInflight = 0;
    postForm.mockImplementation(async () => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((resolve) => setTimeout(resolve, 25));
      inflight -= 1;
      return { elements: [] };
    });

    await Promise.all([
      client.searchNearby({
        latitude: 10.08,
        longitude: -84.47,
        radiusMeters: 4000,
        amenities: ['restaurant'],
      }),
      client.searchNearby({
        latitude: 10.08,
        longitude: -84.47,
        radiusMeters: 8000,
        amenities: ['car_rental'],
      }),
    ]);

    expect(maxInflight).toBe(1);
    expect(postForm).toHaveBeenCalledTimes(2);
  });
});
