import { Injectable, Logger } from "@nestjs/common";
import { Server } from "socket.io";

@Injectable()
export class WebsocketService {
    private readonly logger = new Logger(WebsocketService.name);
    private server: Server;

    setServer(server: Server) {
        this.server = server;
    }

    /**
     * Gửi thông báo video hoàn thành cho user cụ thể
     */
    notifyVideoCompleted(userId: number, videoData: {
        id: number;
        url: string;
        type: string;
        duration?: number;
    }) {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized');
            return;
        }

        // Gửi tới user cụ thể
        this.server.to(`user:${userId}`).emit('video:completed', {
            success: true,
            data: videoData,
            timestamp: new Date().toISOString(),
        });

        this.logger.log(
            `Notified user ${userId} about completed video ${videoData.id}`,
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

        this.server.to(`user:${userId}`).emit('video:error', {
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

        this.server.to(`user:${userId}`).emit('video:progress', {
            videoId,
            progress,
            timestamp: new Date().toISOString(),
        });
    }
}