import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard, type AuthedRequest } from './jwt.guard';

class SignupDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() locale?: string;
}
class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}
class RefreshDto {
  @IsString() refreshToken!: string;
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
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() email?: string | null;
  @IsOptional() @IsString() displayName?: string | null;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  reset(@Body() dto: ResetDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  verify(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Post('oauth')
  oauth(@Body() dto: OauthDto) {
    return this.auth.oauthSignIn(dto);
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
  changePassword(@Req() req: AuthedRequest, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(req.user.sub, dto);
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
  deleteAccount(@Req() req: AuthedRequest, @Body() dto: DeleteAccountDto) {
    return this.auth.deleteAccount(req.user.sub, dto);
  }
}
