import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [OutboxService, PrismaService],
  exports: [OutboxService],
})
export class EventsModule {}
