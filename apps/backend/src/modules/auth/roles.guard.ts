import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthedRequest } from './jwt.guard';

export const ROLES_KEY = 'wayra:roles';

/** Decorator: `@Roles('admin')` on a route */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest & { user?: { role?: string } }>();
    const role = req.user?.role ?? 'user';
    if (!required.includes(role)) {
      throw new ForbiddenException({
        code: 'forbidden',
        message: `Requires role: ${required.join(' or ')}`,
      });
    }
    return true;
  }
}
