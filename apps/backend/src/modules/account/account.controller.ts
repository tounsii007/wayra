import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { JwtAuthGuard, type AuthedRequest } from '../auth/jwt.guard';

@ApiTags('account')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('favorites')
  listFavorites(@Req() req: AuthedRequest) {
    return this.account.listFavorites(req.user.sub);
  }

  @Post('favorites')
  addFavorite(
    @Req() req: AuthedRequest,
    @Body() body: { kind: 'home' | 'work' | 'custom'; placeId: string; label?: string },
  ) {
    return this.account.addFavorite(req.user.sub, body);
  }

  @Delete('favorites/:id')
  removeFavorite(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.account.removeFavorite(req.user.sub, id);
  }

  @Get('routes')
  listRoutes(@Req() req: AuthedRequest) {
    return this.account.listSavedRoutes(req.user.sub);
  }

  @Post('routes')
  saveRoute(
    @Req() req: AuthedRequest,
    @Body() body: { label?: string; data: Record<string, unknown>; notify?: boolean },
  ) {
    return this.account.saveRoute(req.user.sub, body);
  }

  @Delete('routes/:id')
  removeRoute(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.account.removeSavedRoute(req.user.sub, id);
  }
}
