import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { DiscoveryEventsService } from './discovery-events.service';
import {
  PropertyImpressionRequestDto,
  PropertyClickRequestDto,
  SearchQueryEventRequestDto,
} from './dto/events.dto';
import { TokenService } from '../auth/token.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly discoveryEventsService: DiscoveryEventsService,
    private readonly tokenService: TokenService,
  ) {}

  private extractUserId(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies['accessToken']) {
      token = req.cookies['accessToken'];
    }

    if (!token) return undefined;

    try {
      const payload = this.tokenService.verifyAccessToken(token);
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  @Post('property-impression')
  @HttpCode(HttpStatus.OK)
  async recordImpression(@Body() dto: PropertyImpressionRequestDto, @Req() req: Request) {
    const userId = this.extractUserId(req);
    const sessionId = (req.headers['x-session-id'] as string) || dto.sessionId;
    return this.discoveryEventsService.recordImpression(userId, sessionId, dto);
  }

  @Post('property-click')
  @HttpCode(HttpStatus.OK)
  async recordClick(@Body() dto: PropertyClickRequestDto, @Req() req: Request) {
    const userId = this.extractUserId(req);
    const sessionId = (req.headers['x-session-id'] as string) || dto.sessionId;
    return this.discoveryEventsService.recordClick(userId, sessionId, dto);
  }

  @Post('search-query')
  @HttpCode(HttpStatus.OK)
  async recordSearchQuery(@Body() dto: SearchQueryEventRequestDto, @Req() req: Request) {
    const userId = this.extractUserId(req);
    const sessionId = (req.headers['x-session-id'] as string) || dto.sessionId;
    return this.discoveryEventsService.recordSearchQuery(userId, sessionId, dto);
  }
}
