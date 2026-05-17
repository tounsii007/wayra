import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { entities } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities,
        // Schema is owned by the SQL init scripts; never let TypeORM rewrite it.
        synchronize: false,
        logging: config.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
        autoLoadEntities: false,
        // Graceful when DB is unreachable in dev — services fall back to in-memory samples.
        retryAttempts: 3,
        retryDelay: 1500,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
