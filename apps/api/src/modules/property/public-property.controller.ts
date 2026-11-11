import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { PropertyService } from './property.service';
import { SearchPropertyQueryDto, RecordPropertyViewRequestDto } from './dto/property.dto';
import { TokenService } from '../auth/token.service';
import { TenantType } from '@rental-peshawar/shared-types';

@Controller('properties')
export class PublicPropertyController {
  constructor(
    private readonly propertyService: PropertyService,
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

  @Get()
  async search(@Query() query: SearchPropertyQueryDto, @Req() req: Request) {
    const currentUser = this.extractUserFromRequest(req);
    return this.propertyService.searchPublic(query, currentUser);
  }

  @Get('featured')
  async getFeatured(
    @Query('limit') limit: string,
    @Query('tenantType') tenantType: TenantType,
    @Req() req: Request,
  ) {
    const currentUser = this.extractUserFromRequest(req);
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const effectiveTenantType = currentUser?.tenantType || tenantType;
    return this.propertyService.getFeatured(parsedLimit, effectiveTenantType);
  }

  @Get('recent')
  async getRecent(
    @Query('limit') limit: string,
    @Query('tenantType') tenantType: TenantType,
    @Req() req: Request,
  ) {
    const currentUser = this.extractUserFromRequest(req);
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const effectiveTenantType = currentUser?.tenantType || tenantType;
    return this.propertyService.getRecent(parsedLimit, effectiveTenantType);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async recordView(
    @Param('id') id: string,
    @Body() dto: RecordPropertyViewRequestDto,
    @Req() req: Request,
  ) {
    const currentUser = this.extractUserFromRequest(req);
    const clientIp = req.ip || req.socket?.remoteAddress;
    return this.propertyService.recordView(id, dto, currentUser?.sub, clientIp);
  }

  @Get(':id')
  async getDetail(@Param('id') id: string, @Req() req: Request) {
    const currentUser = this.extractUserFromRequest(req);
    return this.propertyService.findPublicById(id, currentUser);
  }
}
