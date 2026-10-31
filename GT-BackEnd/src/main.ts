import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createOriginChecker } from './common/allowed-origins';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  app.setGlobalPrefix('api');

  // Only HTTPS in production: any plain HTTP request is redirected.
  // Railway/Vercel terminate TLS and tell us the original protocol in
  // X-Forwarded-Proto ("trust proxy" is enabled above).
  if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      // The platform health check calls the service directly over HTTP.
      if (req.secure || req.path === '/api/health') {
        next();
        return;
      }
      res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
    });
  }

  app.use(
    helmet({
      strictTransportSecurity: {
        maxAge: 63_072_000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );
  app.use(cookieParser());
  const isAllowedOrigin = createOriginChecker({
    corsOrigin: config.get('CORS_ORIGIN', { infer: true }),
    frontendUrl: config.get('FRONTEND_URL', { infer: true }),
    isProduction: process.env.NODE_ENV === 'production',
  });

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GlobalTour API')
    .setDescription(
      'Travel comparison API. Prices are indicative reference points, not bookable quotes.',
    )
    .setVersion('0.1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
  });

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
}

void bootstrap();
