import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import {
  AdminUserQueryDto,
  SuspendUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from '../dto/admin.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminUserService.findUsers(query);
  }

  @Get(':id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminUserService.findUserById(id);
  }

  @Patch(':id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminUserService.updateUserStatus(id, dto.isSuspended, dto.reason, user.sub);
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: { sub: string; roles: string[] },
  ) {
    return this.adminUserService.updateUserRole(
      id,
      dto.role,
      user.sub,
      user.roles || ['SUPER_ADMIN'],
    );
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.adminUserService.suspendUser(id, user.sub, dto.reason);
  }

  @Post(':id/unsuspend')
  @HttpCode(HttpStatus.OK)
  async unsuspendUser(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.adminUserService.unsuspendUser(id, user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async deleteUser(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: string[] }) {
    return this.adminUserService.deleteUser(id, user.sub, user.roles || ['SUPER_ADMIN']);
  }
}
