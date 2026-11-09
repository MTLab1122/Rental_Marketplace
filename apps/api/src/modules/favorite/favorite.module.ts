import { Module } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { FavoriteController } from './favorite.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuditService } from '../../common/audit/audit.service';
import { TokenService } from '../auth/token.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FavoriteController],
  providers: [FavoriteService, AuditService, TokenService],
  exports: [FavoriteService],
})
export class FavoriteModule {}
