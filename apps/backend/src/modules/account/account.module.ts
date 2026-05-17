import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import {
  FavoritePlaceEntity,
  SavedRouteEntity,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([FavoritePlaceEntity, SavedRouteEntity]), AuthModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
