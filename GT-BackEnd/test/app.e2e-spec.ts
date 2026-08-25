import { afterAll, beforeAll, describe, it } from '@jest/globals';
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

  afterAll(async () => {
    await app.close();
  });
});
