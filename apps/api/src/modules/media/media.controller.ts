import { Controller, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { GetUploadUrlRequestDto, CompleteUploadRequestDto } from './dto/media.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  async getUploadUrl(
    @Body() dto: GetUploadUrlRequestDto,
    @CurrentUser() user: { sub: string; roles: string[] },
  ) {
    return this.mediaService.getUploadUrl(user.sub, dto, user.roles);
  }

  @Post('complete-upload')
  async completeUpload(
    @Body() dto: CompleteUploadRequestDto,
    @CurrentUser() user: { sub: string; roles: string[] },
  ) {
    return this.mediaService.completeUpload(user.sub, dto, user.roles);
  }

  @Delete(':id')
  async deleteMedia(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles: string[] },
  ) {
    return this.mediaService.deleteMedia(user.sub, id, user.roles);
  }
}
