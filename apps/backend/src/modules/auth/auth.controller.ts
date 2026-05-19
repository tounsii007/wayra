import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard, type AuthedRequest } from './jwt.guard';
import { TotpService } from './totp.service';

class SignupDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() locale?: string;
}
class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
  @IsOptional() @IsString() totp?: string;
}
class RefreshDto {
  @IsOptional() @IsString() refreshToken?: string;
}
class ForgotDto {
  @IsEmail() email!: string;
}
class ResetDto {
  @IsString() token!: string;
  @IsString() @MinLength(8) newPassword!: string;
}
class VerifyEmailDto {
  @IsString() token!: string;
}
class UpdateProfileDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() homeCountry?: string;
}
class ChangePasswordDto {
  @IsString() currentPassword!: string;
  @IsString() @MinLength(8) newPassword!: string;
}
class DeleteAccountDto {
  @IsString() password!: string;
}
class OauthDto {
  @IsIn(['google', 'apple']) provider!: 'google' | 'apple';
  @IsString() idToken!: string;
}
class TotpCodeDto {
  @IsString() code!: string;
}

function ctxFromReq(req: Request) {
  return {
    ip: (req.ip ?? (req.headers['x-forwarded-for'] as string | undefined) ?? null) as string | null,
    userAgent: (req.headers['user-agent'] ?? null) as string | null,
  };
}

const REFRESH_COOKIE = 'wayra_rt';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 30 * 24 * 3600_000,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly totp: TotpService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.signup(dto, ctxFromReq(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
    return result;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, ctxFromReq(req));
    if ('totpRequired' in result) return result;
    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
    return result;
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = dto.refreshToken ?? (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    if (!token) throw new BadRequestException({ code: 'missing_refresh', message: 'No refresh token.' });
    const result = await this.auth.refresh(token, ctxFromReq(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
    return result;
  }

  @Post('logout')
  async logout(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = dto.refreshToken ?? (req.cookies?.[REFRESH_COOKIE] as string | undefined);
    if (token) await this.auth.logout(token, ctxFromReq(req));
    res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTS);
    return { ok: true };
  }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotDto, @Req() req: Request) {
    return this.auth.requestPasswordReset(dto.email, ctxFromReq(req));
  }

  @Post('reset-password')
  reset(@Body() dto: ResetDto, @Req() req: Request) {
    return this.auth.resetPassword(dto.token, dto.newPassword, ctxFromReq(req));
  }

  @Post('verify-email')
  verify(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Post('oauth')
  async oauth(@Body() dto: OauthDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.oauthSignIn(dto, ctxFromReq(req));
    res.cookie(REFRESH_COOKIE, result.refreshToken, REFRESH_COOKIE_OPTS);
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@Req() req: AuthedRequest, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/password')
  changePassword(
    @Req() req: AuthedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(req.user.sub, dto, ctxFromReq(req));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/verify-email/resend')
  resendVerify(@Req() req: AuthedRequest) {
    return this.auth.resendEmailVerification(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(
    @Req() req: AuthedRequest,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.deleteAccount(req.user.sub, dto, ctxFromReq(req));
    res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTS);
    return result;
  }

  // ---------- 2FA ----------

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/totp/setup')
  totpSetup(@Req() req: AuthedRequest) {
    return this.totp.setup(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/totp/enable')
  totpEnable(@Req() req: AuthedRequest, @Body() dto: TotpCodeDto) {
    return this.totp.enable(req.user.sub, dto.code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('me/totp/disable')
  totpDisable(@Req() req: AuthedRequest, @Body() dto: TotpCodeDto) {
    return this.totp.disable(req.user.sub, dto.code);
  }
}
