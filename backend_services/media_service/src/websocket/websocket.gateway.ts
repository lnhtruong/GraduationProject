import { Logger } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({
    namespace: '/media',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(WebsocketGateway.name);

    @WebSocketServer()
    server: Namespace;

    constructor(private readonly websocketService: WebsocketService) { }

    afterInit(server: Namespace) {
        this.websocketService.setServer(server);
        this.logger.log('WebSocket namespace /media initialized');
    }

    handleConnection(client: Socket) {
        const userId = client.handshake.query.userId;
        this.logger.log(`Client ${client.id} connected with userId: ${userId}`);

        if (userId) {
            // Join vào room user cụ thể: user:123
            client.join(`user:${userId}`);
            this.logger.log(`Client ${client.id} joined room user:${userId}`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client ${client.id} disconnected`);
    }

    /**
     * Nghe sự kiện client gửi lên để kiểm tra kết nối
     */
    @SubscribeMessage('ping')
    handlePing(client: Socket): string {
        client.emit('pong');
        return 'pong';
    }

    @SubscribeMessage('subscribe:user')
    handleSubscribeUser(client: Socket, payload: { userId?: string | number }): string {
        const userId = payload?.userId;
        if (!userId) {
            this.logger.warn(`Client ${client.id} subscribe:user missing userId`);
            return 'missing_user_id';
        }

        client.join(`user:${userId}`);
        this.logger.log(`Client ${client.id} subscribed room user:${userId}`);
        client.emit('subscribed', { room: `user:${userId}` });
        return 'ok';
    }
}
