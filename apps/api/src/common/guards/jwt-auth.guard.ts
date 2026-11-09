import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../../modules/auth/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is missing. Please log in.');
    }

    const payload = this.tokenService.verifyAccessToken(token);
    (request as any).user = payload;

    return true;
  }

  private extractTokenFromRequest(request: Request): string | null {
    // 1. Authorization header (Bearer token)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 2. HTTP-only cookie
    if (request.cookies && request.cookies['accessToken']) {
      return request.cookies['accessToken'];
    }

    return null;
  }
}
