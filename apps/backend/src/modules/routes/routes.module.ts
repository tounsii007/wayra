import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { OtpRoutingProvider } from './otp-routing.provider';
import { ROUTING_PROVIDER, type RoutingProvider } from './routing-provider';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [PlacesModule, ConfigModule],
  controllers: [RoutesController],
  providers: [
    RoutesService,
    OtpRoutingProvider,
    {
      provide: ROUTING_PROVIDER,
      inject: [ConfigService, RoutesService, OtpRoutingProvider],
      useFactory: (
        config: ConfigService,
        mock: RoutesService,
        otp: OtpRoutingProvider,
      ): RoutingProvider => {
        const which = (config.get<string>('ROUTING_PROVIDER') ?? 'mock').toLowerCase();
        if (which === 'otp' && config.get<string>('OTP_URL')) return otp;
        // Fall back to the mock (which is the existing preference-aware engine).
        return {
          name: 'mock',
          plan: (req) => mock.plan(req),
        };
      },
    },
  ],
  exports: [RoutesService, ROUTING_PROVIDER],
})
export class RoutesModule {}
