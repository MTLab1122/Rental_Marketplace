import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConversationService } from './conversation.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ConversationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ConversationGateway.name);
  private readonly onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly conversationService: ConversationService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from auth handshake, query or header
      let token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        client.handshake.headers?.authorization;

      if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
      }

      if (!token) {
        this.logger.warn(`WebSocket connection rejected: No token provided (socket: ${client.id})`);
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (!payload || !payload.sub) {
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      const userId = payload.sub;

      // Track online presence
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      // Join direct user room
      client.join(`user:${userId}`);

      // Broadcast user online event
      this.server.emit('user:online', { userId, timestamp: new Date().toISOString() });

      this.logger.log(`WebSocket client authenticated: ${client.id} (user: ${userId})`);
    } catch (err) {
      this.logger.warn(
        `WebSocket authentication failed for socket ${client.id}: ${(err as Error).message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.onlineUsers.has(userId)) {
      const userSockets = this.onlineUsers.get(userId)!;
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.onlineUsers.delete(userId);
        this.server.emit('user:offline', { userId, timestamp: new Date().toISOString() });
      }
    }
    this.logger.log(`WebSocket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.conversationId)
      return { success: false, error: 'Unauthorized or missing conversationId' };

    try {
      // Server-side participant verification before joining room
      await this.conversationService.verifyParticipant(data.conversationId, userId);
      const roomName = `conversation:${data.conversationId}`;
      client.join(roomName);

      this.logger.log(`User ${userId} joined room ${roomName}`);
      return { success: true, room: roomName };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.conversationId || !data.content) {
      return { success: false, error: 'Invalid message payload' };
    }

    try {
      // 1. Persist message in PostgreSQL
      const message = await this.conversationService.sendMessage(
        data.conversationId,
        userId,
        data.content,
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

      // 2. Emit to conversation room
      const roomName = `conversation:${data.conversationId}`;
      this.server.to(roomName).emit('message:new', messagePayload);

      return { success: true, data: messagePayload };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.conversationId) return { success: false };

    try {
      const result = await this.conversationService.markAsRead(data.conversationId, userId);

      const roomName = `conversation:${data.conversationId}`;
      this.server.to(roomName).emit('message:read', {
        conversationId: data.conversationId,
        userId,
        readAt: result.readAt,
      });

      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId || !data.conversationId) return;

    const roomName = `conversation:${data.conversationId}`;
    client.to(roomName).emit('typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: data.isTyping,
    });
  }

  /**
   * Helper to emit message:new from REST controller when message is posted via HTTP.
   */
  emitNewMessage(conversationId: string, message: any) {
    const roomName = `conversation:${conversationId}`;
    if (this.server) {
      this.server.to(roomName).emit('message:new', message);
    }
  }

  /**
   * Helper to emit message:read from REST controller.
   */
  emitMessageRead(conversationId: string, userId: string, readAt: string) {
    const roomName = `conversation:${conversationId}`;
    if (this.server) {
      this.server.to(roomName).emit('message:read', {
        conversationId,
        userId,
        readAt,
      });
    }
  }
}
