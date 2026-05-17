import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  // OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('Wayra API')
    .setDescription('Multimodal transit, routing, realtime and fares — Europe & North Africa.')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  const port = Number(process.env.BACKEND_PORT ?? 4000);
  await app.listen(port, process.env.BACKEND_HOST ?? '0.0.0.0');
  Logger.log(`🚆 Wayra backend listening on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📚 Docs at http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();
