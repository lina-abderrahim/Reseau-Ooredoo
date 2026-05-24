import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3001', credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, string> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connecté: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.userSockets.forEach((socketId, userId) => {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
      }
    });
    console.log(`Client déconnecté: ${client.id}`);
  }

  @SubscribeMessage('register')
  handleRegister(@MessageBody() userId: number, @ConnectedSocket() client: Socket) {
    this.userSockets.set(Number(userId), client.id);
    console.log(`User ${userId} enregistré`);
  }

  sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.userSockets.get(Number(userId));
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }
}