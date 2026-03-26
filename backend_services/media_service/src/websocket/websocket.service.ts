import { Injectable, Logger } from "@nestjs/common";
import { Namespace, Server } from "socket.io";

@Injectable()
export class WebsocketService {
    private readonly logger = new Logger(WebsocketService.name);
    private server?: Server | Namespace;

    private isRoomMap(value: unknown): value is Map<string, Set<string>> {
        return value instanceof Map;
    }

    private getRoomsMap(): Map<string, Set<string>> | undefined {
        if (!this.server) return undefined;

        try {
            // Namespace (when @WebSocketGateway uses namespace)
            const namespaceRooms = (this.server as Namespace).adapter?.rooms;
            if (this.isRoomMap(namespaceRooms)) return namespaceRooms;

            // Root Server fallback
            const serverRooms = (this.server as Server).sockets?.adapter?.rooms;
            if (this.isRoomMap(serverRooms)) return serverRooms;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Cannot access socket rooms map: ${message}`);
        }

        return undefined;
    }

    private getRoomSize(room: string): number {
        return this.getRoomsMap()?.get(room)?.size ?? 0;
    }

    setServer(server: Server | Namespace) {
        this.server = server;
    }

    /**
     * Gửi thông báo video hoàn thành cho user cụ thể
     */
    notifyVideoCompleted(userId: number, videoData: {
        // id: number;
        url: string;
        type: string;
        duration?: number;
    }) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized');
            return;
        }

        const room = `user:${userId}`;
        const roomSize = this.getRoomSize(room);
        this.logger.log(`Emitting video:completed to ${room} (clients=${roomSize})`);

        // Gửi tới user cụ thể
        this.server.to(room).emit('video:completed', {
            success: true,
            data: videoData,
            timestamp: new Date().toISOString(),
        });

        this.logger.log(
            `Notified user ${userId} about completed video with url ${videoData.url}`,
        );
    }

    notifyUploadCompleted(userId: number, videoData: {
        id: number;
        url: string;
        type: string;
        duration?: number;
    }) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized');
            return;
        }

        const room = `user:${userId}`;
        const roomSize = this.getRoomSize(room);
        this.logger.log(`Emitting upload-video:completed to ${room} (clients=${roomSize})`);

        // Gửi tới user cụ thể
        this.server.to(room).emit('upload-video :completed', {
            success: true,
            data: videoData,
            timestamp: new Date().toISOString(),
        });

        this.logger.log(
            `Notified user ${userId} about completed upload with url ${videoData.url}`,
        );
    }

    /**
     * Gửi thông báo lỗi tới user
     */
    notifyVideoError(userId: number, error: {
        id?: string;
        message: string;
        reason?: string;
    }) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized');
            return;
        }

        const room = `user:${userId}`;
        const roomSize = this.getRoomSize(room);
        this.logger.log(`Emitting video:error to ${room} (clients=${roomSize})`);

        this.server.to(room).emit('video:error', {
            success: false,
            error,
            timestamp: new Date().toISOString(),
        });

        this.logger.error(
            `Notified user ${userId} about video error: ${error.message}`,
        );
    }

    /**
     * Gửi tiến độ xử lý video
     */
    notifyVideoProgress(userId: number, videoId: number, progress: number) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized');
            return;
        }

        const room = `user:${userId}`;
        const roomSize = this.getRoomSize(room);
        this.logger.log(`Emitting video:progress to ${room} (clients=${roomSize})`);

        this.server.to(room).emit('video:progress', {
            videoId,
            progress,
            timestamp: new Date().toISOString(),
        });
    }
}