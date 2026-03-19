/**
 * Hướng dẫn sử dụng WebSocket cho client
 * 
 * Cài đặt socket.io client:
 * npm install socket.io-client
 */

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useVideoWebSocket = (userId: number) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [videoCompleted, setVideoCompleted] = useState(null);
    const [videoError, setVideoError] = useState(null);
    const [videoProgress, setVideoProgress] = useState(0);

    useEffect(() => {
        // Kết nối tới WebSocket server
        const newSocket = io('http://localhost:3002', {
            // Thay đổi URL nếu cần
            namespace: '/media',
            query: {
                userId: userId.toString(),
            },
            transports: ['websocket', 'polling'],
        });

        // Khi kết nối thành công
        newSocket.on('connect', () => {
            console.log('Connected to WebSocket:', newSocket.id);
        });

        // Nhận thông báo video hoàn thành
        newSocket.on('video:completed', (data) => {
            console.log('Video completed:', data);
            setVideoCompleted(data.data);
        });

        // Nhận thông báo lỗi
        newSocket.on('video:error', (data) => {
            console.error('Video error:', data);
            setVideoError(data.error);
        });

        // Nhận thông báo tiến độ
        newSocket.on('video:progress', (data) => {
            console.log('Video progress:', data);
            setVideoProgress(data.progress);
        });

        // Gửi ping để kiểm tra kết nối
        newSocket.on('pong', () => {
            console.log('Pong received');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [userId]);

    return {
        socket,
        videoCompleted,
        videoError,
        videoProgress,
    };
};

/**
 * Cách sử dụng trong component:
 * 
 * function MyComponent() {
 *     const { videoCompleted, videoError, videoProgress } = useVideoWebSocket(userId);
 * 
 *     useEffect(() => {
 *         if (videoCompleted) {
 *             // Xử lý video hoàn thành
 *             console.log('Video URL:', videoCompleted.url);
 *             toast.success('Video đã xử lý xong!');
 *         }
 *     }, [videoCompleted]);
 * 
 *     useEffect(() => {
 *         if (videoError) {
 *             toast.error(videoError.message);
 *         }
 *     }, [videoError]);
 * 
 *     return (
 *         <div>
 *             {videoProgress > 0 && <ProgressBar value={videoProgress} />}
 *         </div>
 *     );
 * }
 */
