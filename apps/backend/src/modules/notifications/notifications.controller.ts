import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

class PrefsDto {
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsObject() channels?: Record<string, boolean>;
}

class WebPushDto {
  @IsString() endpoint!: string;
  @IsOptional() @IsString() p256dh?: string;
  @IsOptional() @IsString() auth?: string;
}

class ExpoPushDto {
  @IsString() token!: string;
  @IsIn(['ios', 'android']) platform!: 'ios' | 'android';
}

class UnsubscribeDto {
  @IsString() endpoint!: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get('preferences')
  get(@Req() req: AuthedRequest) {
    return this.svc.getPreferences(req.user.sub);
  }

  @Patch('preferences')
  update(@Req() req: AuthedRequest, @Body() dto: PrefsDto) {
    return this.svc.updatePreferences(req.user.sub, dto as never);
  }

  @Post('subscriptions/web')
  addWeb(@Req() req: AuthedRequest, @Body() dto: WebPushDto) {
    return this.svc.addWebPushSubscription(req.user.sub, dto);
  }

  @Post('subscriptions/expo')
  addExpo(@Req() req: AuthedRequest, @Body() dto: ExpoPushDto) {
    return this.svc.addExpoSubscription(req.user.sub, dto);
  }

  @Delete('subscriptions')
  remove(@Body() dto: UnsubscribeDto) {
    return this.svc.removeSubscription(dto.endpoint);
  }
}
