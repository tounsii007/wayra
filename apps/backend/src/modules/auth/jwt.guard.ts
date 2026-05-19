import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface AuthedRequest extends Request {
  user: { sub: string; email?: string; role?: string };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException({
        code: 'missing_token',
        message: 'Authorization required.',
      });
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email?: string; role?: string }>(token);
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException({ code: 'invalid_token', message: 'Invalid or expired token.' });
    }
  }
}
