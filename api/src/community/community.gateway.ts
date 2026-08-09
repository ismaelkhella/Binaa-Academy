import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { CommunityService } from './community.service';

interface AuthedSocket extends Socket {
  data: { user?: { sub: string; role: string } };
}

/**
 * Real-time community chat. Clients connect to the `/community` namespace with
 * their access token (auth.token or Authorization header), then `join` a
 * subject room. New messages posted via REST are broadcast to the room as
 * `message:new`; admin deletions as `message:deleted`.
 *
 * Access checks mirror the REST endpoints: JWT verified on connect, and
 * CommunityService.assertAccess (via joinRoom) on every room join.
 */
@WebSocketGateway({
  namespace: '/community',
  cors: { origin: true, credentials: true },
})
export class CommunityGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommunityGateway.name);

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private community: CommunityService,
  ) {}

  handleConnection(client: AuthedSocket) {
    const token = this.extractToken(client);
    if (!token) {
      client.emit('error', { code: 'AUTH_REQUIRED', message: 'مطلوب تسجيل الدخول' });
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
      if (payload.role !== 'STUDENT' && payload.role !== 'TEACHER') throw new Error('bad role');
      client.data.user = { sub: payload.sub, role: payload.role };
    } catch (e: any) {
      // TokenExpiredError => the client should refresh its token and reconnect.
      // Any other verification failure is an invalid session.
      const code = e?.name === 'TokenExpiredError' ? 'SESSION_EXPIRED' : 'SESSION_INVALID';
      client.emit('error', { code, message: 'جلسة غير صالحة' });
      client.disconnect(true);
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth as any)?.token;
    if (typeof authToken === 'string' && authToken) {
      return authToken.startsWith('Bearer ') ? authToken.slice(7) : authToken;
    }
    const header = client.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7);
    return null;
  }

  /** Join a subject room after verifying the same access rules as REST. */
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { subjectId?: string },
  ) {
    const user = client.data.user;
    const subjectId = body?.subjectId;
    if (!user) return { event: 'error', data: { code: 'SESSION_INVALID', message: 'جلسة غير صالحة' } };
    if (!subjectId) return { event: 'error', data: { message: 'subjectId مطلوب' } };
    try {
      await this.community.checkAccess(user.sub, user.role, subjectId);
      await client.join(this.room(subjectId));
      return { event: 'joined', data: { subjectId } };
    } catch (e: any) {
      return { event: 'error', data: { message: e?.message || 'لا يمكنك الوصول إلى هذا المجتمع', subjectId } };
    }
  }

  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { subjectId?: string },
  ) {
    if (body?.subjectId) await client.leave(this.room(body.subjectId));
    return { event: 'left', data: { subjectId: body?.subjectId } };
  }

  /** Called by CommunityService after a message is persisted. */
  broadcastNewMessage(subjectId: string, message: unknown) {
    this.server?.to(this.room(subjectId)).emit('message:new', message);
  }

  /** Called by CommunityService after an admin deletes a message. */
  broadcastDeletedMessage(subjectId: string, messageId: string) {
    this.server?.to(this.room(subjectId)).emit('message:deleted', { id: messageId, subjectId });
  }

  private room(subjectId: string) {
    return `subject:${subjectId}`;
  }
}
