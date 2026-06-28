import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StudentJwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    try {
      const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
      if (payload.role !== 'STUDENT') throw new UnauthorizedException();
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('جلسة غير صالحة');
    }
  }

  private extractToken(request: { headers: { authorization?: string } }) {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(private jwt: JwtService, private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('ADMIN_JWT_SECRET') || this.config.get('JWT_SECRET'),
      });
      if (payload.role !== 'ADMIN') throw new UnauthorizedException();
      request.admin = payload;
      return true;
    } catch {
      throw new UnauthorizedException('جلسة غير صالحة');
    }
  }

  private extractToken(request: { headers: { authorization?: string } }) {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
