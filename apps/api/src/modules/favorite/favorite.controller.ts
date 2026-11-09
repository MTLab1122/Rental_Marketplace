import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantType } from '@rental-peshawar/shared-types';

@Controller()
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('properties/:id/favorite')
  @HttpCode(HttpStatus.OK)
  async addFavorite(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; tenantType?: TenantType },
  ) {
    return this.favoriteService.addFavorite(user.sub, id, user);
  }

  @Delete('properties/:id/favorite')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.favoriteService.removeFavorite(user.sub, id);
  }

  @Get('favorites')
  async getFavorites(@CurrentUser() user: { sub: string; tenantType?: TenantType }) {
    return this.favoriteService.getUserFavorites(user.sub, user);
  }

  @Get('favorites/ids')
  async getFavoriteIds(@CurrentUser() user: { sub: string }) {
    return this.favoriteService.getUserFavoriteIds(user.sub);
  }
}
