import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailerService } from './mailer.service';
import { JwtAuthGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';
import {
  UserEntity,
  RefreshTokenEntity,
  AuthActionTokenEntity,
  OauthIdentityEntity,
} from '../../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RefreshTokenEntity,
      AuthActionTokenEntity,
      OauthIdentityEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret && config.get<string>('NODE_ENV') === 'production') {
          throw new Error('JWT_SECRET must be set in production');
        }
        return {
          secret: secret ?? 'dev-only-secret-replace-me',
          signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
