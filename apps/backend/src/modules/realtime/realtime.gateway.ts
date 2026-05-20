import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

/**
 * Live-departures WebSocket gateway.
 *
 * Subscribe message:  { type: "subscribe", stopIds: ["de:berlin:hbf", ...] }
 * Server emits:       "departure:update" on the matching room.
 *
 * If REDIS_URL is set, @socket.io/redis-adapter is attached so a multi-
 * pod deployment fan-outs across pods. Without Redis the gateway runs
 * single-instance but still works for dev.
 */
@WebSocketGateway({ namespace: '/live', cors: { origin: true, credentials: true } })
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  private readonly logger = new Logger(RealtimeGateway.name);
  @WebSocketServer() server!: Server;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('REDIS_URL');
    if (!url || !this.server) return;
    try {
      const pub = new Redis(url);
      const sub = pub.duplicate();
      this.server.adapter(createAdapter(pub, sub));
      this.logger.log('Socket.IO Redis adapter attached.');
    } catch (e) {
      this.logger.warn(`Redis adapter not attached: ${(e as Error).message}`);
    }
  }

  handleConnection(client: Socket) {
    this.logger.debug(`live socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`live socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { stopIds: string[] },
  ): { ok: true; rooms: string[] } {
    const rooms = (body?.stopIds ?? []).map((id) => `stop:${id}`);
    rooms.forEach((r) => client.join(r));
    return { ok: true, rooms };
  }

  @SubscribeMessage('unsubscribe')
  unsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { stopIds: string[] },
  ): { ok: true } {
    for (const id of body?.stopIds ?? []) client.leave(`stop:${id}`);
    return { ok: true };
  }
}
