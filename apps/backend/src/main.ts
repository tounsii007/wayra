import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin:
        allowedOrigins.length === 1 && allowedOrigins[0] === '*' ? true : allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  app.use(helmet({ contentSecurityPolicy: false }));
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
