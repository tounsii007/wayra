import { Logger } from '@nestjs/common';
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

/**
 * Live-departures WebSocket gateway.
 *
 * Subscribe message:  { type: "subscribe", stopIds: ["de:berlin:hbf", ...] }
 * Server emits:       "departure:update" with a Departure payload whenever
 *                     a GTFS-RT trip update affects one of the subscribed stops.
 */
@WebSocketGateway({ namespace: '/live', cors: true })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);
  @WebSocketServer() server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`live socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`live socket disconnected: ${client.id}`);
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
}
