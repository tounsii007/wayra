import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { initSentry } from './common/observability';

async function bootstrap() {
  if (initSentry()) {
    Logger.log('Sentry initialised.', 'Observability');
  }

  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: allowedOrigins.length === 1 && allowedOrigins[0] === '*' ? true : allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  // CSP tightened — the backend serves JSON, never HTML; default-src 'none' is
  // safest. Swagger UI is the one exception and it self-hosts its assets.
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          baseUri: ["'none'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          // Swagger UI ships inline scripts + remote font: scope to /docs only.
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
        },
      },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: isProd
        ? { maxAge: 63072000, includeSubDomains: true, preload: true }
        : false,
    }),
  );
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }),
  );

  // Trust the first reverse proxy hop so req.ip + secure cookie detection work.
  const httpAdapter = app.getHttpAdapter();
  const expressInstance = httpAdapter.getInstance() as { set?: (k: string, v: unknown) => void };
  expressInstance.set?.('trust proxy', 1);

  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Wayra API')
    .setDescription('Multimodal transit, routing, realtime, fares, AI — EU & North Africa.')
    .setVersion('0.6')
    .addBearerAuth()
    .addCookieAuth('wayra_rt')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  const port = Number(process.env.BACKEND_PORT ?? 4000);
  await app.listen(port, process.env.BACKEND_HOST ?? '0.0.0.0');
  Logger.log(`🚆 Wayra backend on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📚 Docs at http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();
