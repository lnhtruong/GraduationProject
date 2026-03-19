import { Logger } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({
    namespace: 'media',
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(WebsocketGateway.name);

    @WebSocketServer()
    server: Server;

    constructor(private readonly websocketService: WebsocketService) {
        // Thiết lập server cho service
        setTimeout(() => {
            this.websocketService.setServer(this.server);
        }, 0);
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
}
