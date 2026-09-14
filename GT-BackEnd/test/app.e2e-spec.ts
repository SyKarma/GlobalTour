import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ data: { status: 'ok' } });
  });

  it('/api/currency/convert (GET) rejects missing amount', () => {
    return request(app.getHttpServer())
      .get('/api/currency/convert')
      .query({ from: 'USD', to: 'EUR' })
      .expect(400);
  });

  it('/api/flights/search (GET) rejects missing origin', () => {
    return request(app.getHttpServer())
      .get('/api/flights/search')
      .query({ destination: 'BCN' })
      .expect(400);
  });

  it('/api/hotels/search (GET) rejects missing city', () => {
    return request(app.getHttpServer())
      .get('/api/hotels/search')
      .query({ countryCode: 'ES' })
      .expect(400);
  });

  it('/api/restaurants/search (GET) rejects missing cityName', () => {
    return request(app.getHttpServer())
      .get('/api/restaurants/search')
      .expect(400);
  });

  it('/api/restaurants/search (GET) rejects an invalid type', () => {
    return request(app.getHttpServer())
      .get('/api/restaurants/search')
      .query({ cityName: 'San Jose', countryCode: 'CR', type: 'hotel' })
      .expect(400);
  });

  it('/api/cars/search (GET) rejects missing cityName', () => {
    return request(app.getHttpServer()).get('/api/cars/search').expect(400);
  });

  it('/api/auth/me (GET) returns 401 for guests', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('/api/auth/google (GET) returns 503 when OAuth is not configured', () => {
    return request(app.getHttpServer()).get('/api/auth/google').expect(503);
  });

  it('/api/auth/logout (POST) clears the session cookie', () => {
    return request(app.getHttpServer())
      .post('/api/auth/logout')
      .expect(200)
      .expect({ data: { loggedOut: true } });
  });

  it('/api/dashboard (GET) is public and returns chart aggregates', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .query({ days: 7 })
      .expect(200);

    expect(response.body.data.summary.totalSearches).toEqual(
      expect.any(Number),
    );
    expect(response.body.data.topDestinations).toEqual(expect.any(Array));
    expect(response.body.data.topOrigins).toEqual(expect.any(Array));
    expect(response.body.data.topCountries).toEqual(expect.any(Array));
    expect(response.body.data.topRoutes).toEqual(expect.any(Array));
    expect(response.body.data.topRestaurantCities).toEqual(expect.any(Array));
    expect(response.body.data.topCarCities).toEqual(expect.any(Array));
    expect(response.body.data.topRestaurantCuisines).toEqual(expect.any(Array));
    expect(response.body.data.topRestaurantTypes).toEqual(expect.any(Array));
    expect(response.body.data.topCarTypes).toEqual(expect.any(Array));
    expect(response.body.data.summary.byType).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ searchType: 'restaurant' }),
        expect.objectContaining({ searchType: 'car' }),
      ]),
    );
    expect(response.body.data.volumeByDay).toHaveLength(7);
    expect(response.body.data.travelMonths).toEqual(expect.any(Array));
    expect(response.body.meta.cached).toEqual(expect.any(Boolean));
  });

  it('/api/dashboard (GET) rejects an invalid lookback window', () => {
    return request(app.getHttpServer())
      .get('/api/dashboard')
      .query({ days: 0 })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
