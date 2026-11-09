import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { ModerateImageRequestDto } from './dto/media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Patch(':id/moderate')
  async moderateImage(
    @Param('id') id: string,
    @Body() dto: ModerateImageRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.mediaService.moderateImage(id, user.sub, dto);
  }
}
