import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationGateway } from './conversation.gateway';
import {
  SendMessageRequestDto,
  BlockConversationRequestDto,
  ReportConversationRequestDto,
  GetMessagesQueryDto,
} from './dto/conversation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly conversationGateway: ConversationGateway,
  ) {}

  @Get()
  async getConversations(@CurrentUser('sub') userId: string) {
    const list = await this.conversationService.getUserConversations(userId);
    return { success: true, data: list };
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    const messages = await this.conversationService.getMessages(conversationId, userId, query);
    return { success: true, data: messages };
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser('sub') senderId: string,
    @Body() dto: SendMessageRequestDto,
  ) {
    const message = await this.conversationService.sendMessage(
      conversationId,
      senderId,
      dto.content,
    );

    const messagePayload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      isRead: message.isRead,
      readAt: message.readAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    };

    // Emit real-time WebSocket event to the room
    this.conversationGateway.emitNewMessage(conversationId, messagePayload);

    return { success: true, data: messagePayload };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') conversationId: string, @CurrentUser('sub') userId: string) {
    const result = await this.conversationService.markAsRead(conversationId, userId);

    // Emit real-time read receipt to the room
    this.conversationGateway.emitMessageRead(conversationId, userId, result.readAt);

    return { success: true, data: result };
  }

  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  async blockConversation(
    @Param('id') conversationId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: BlockConversationRequestDto,
  ) {
    const updated = await this.conversationService.blockConversation(
      conversationId,
      userId,
      dto.reason,
    );
    return { success: true, data: updated };
  }

  @Post(':id/report')
  @HttpCode(HttpStatus.CREATED)
  async reportConversation(
    @Param('id') conversationId: string,
    @CurrentUser('sub') reporterId: string,
    @Body() dto: ReportConversationRequestDto,
  ) {
    const report = await this.conversationService.reportConversation(
      conversationId,
      reporterId,
      dto,
    );
    return { success: true, data: report };
  }
}
