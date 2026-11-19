import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationService } from './recommendation.service';
import {
  QueryRecommendationsDto,
  QuerySimilarDto,
  QueryNearbyDto,
  QueryTrendingDto,
} from './dto/recommendation.dto';
import { TokenService } from '../auth/token.service';
import { TenantType } from '@rental-peshawar/shared-types';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly tokenService: TokenService,
  ) {}

  private extractUserFromRequest(req: Request) {
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
      return {
        sub: payload.sub,
        roles: payload.roles,
        tenantType: payload.tenantType as TenantType | undefined,
      };
    } catch {
      return undefined;
    }
  }

  @Get('for-you')
  async getForYou(@Query() query: QueryRecommendationsDto, @Req() req: Request) {
    const currentUser = this.extractUserFromRequest(req);
    const tenantType = query.tenantType || currentUser?.tenantType;

    return this.recommendationService.getForYou(
      currentUser?.sub,
      tenantType,
      query.limit || 10,
      query.sessionId,
    );
  }

  @Get('similar/:propertyId')
  async getSimilar(
    @Param('propertyId') propertyId: string,
    @Query() query: QuerySimilarDto,
    @Req() req: Request,
  ) {
    const currentUser = this.extractUserFromRequest(req);
    return this.recommendationService.getSimilar(propertyId, currentUser, query.limit || 6);
  }

  @Get('nearby')
  async getNearby(@Query() query: QueryNearbyDto, @Req() req: Request) {
    const currentUser = this.extractUserFromRequest(req);
    return this.recommendationService.getNearby(
      query.localityId,
      query.latitude,
      query.longitude,
      currentUser,
      query.limit || 6,
    );
  }

  @Get('trending')
  async getTrending(@Query() query: QueryTrendingDto, @Req() req: Request) {
    const currentUser = this.extractUserFromRequest(req);
    return this.recommendationService.getTrending(currentUser, query.localityId, query.limit || 6);
  }

  @Get('recently-viewed')
  async getRecentlyViewed(
    @Query('sessionId') sessionId: string,
    @Query('limit') limit: string,
    @Req() req: Request,
  ) {
    const currentUser = this.extractUserFromRequest(req);
    return this.recommendationService.getRecentlyViewed(
      currentUser?.sub,
      sessionId,
      currentUser,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
