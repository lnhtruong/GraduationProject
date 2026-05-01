import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

interface UserStream {
    subject: Subject<MessageEvent>;
    subscribers: number;
}

@Injectable()
export class SseService {
    private readonly logger = new Logger(SseService.name);
    private readonly streams = new Map<string, UserStream>();

    private buildUserKey(userId: number): string {
        return `user:${userId}`;
    }

    private getOrCreateStream(userId: number): UserStream {
        const key = this.buildUserKey(userId);
        const existing = this.streams.get(key);

        if (existing) {
            return existing;
        }

        const stream: UserStream = {
            subject: new Subject<MessageEvent>(),
            subscribers: 0,
        };

        this.streams.set(key, stream);
        this.logger.debug(`Created SSE stream for ${key}`);
        return stream;
    }

    private emitDemoEventsForTesting(userId: number): void {
        setTimeout(() => {
            this.notifyVideoCompleted(userId, {
                url: 'https://example.com/demo-video-completed.mp4',
                type: 'highlight',
                duration: 45,
            });
        }, 2000);

        setTimeout(() => {
            this.notifyUploadCompleted(userId, {
                id: 999001,
                url: 'https://example.com/demo-upload-completed.mp4',
                type: 'highlight',
                duration: 52,
                name: 'demo-upload-video',
            });
        }, 4000);

        setTimeout(() => {
            this.notifyVideoError(userId, {
                id: 'demo-error-001',
                message: 'Demo SSE error event for testing',
                reason: 'test-sequence',
            });
        }, 6000);
    }

    subscribeByUserId(userId: number): Observable<MessageEvent> {
        const key = this.buildUserKey(userId);
        const stream = this.getOrCreateStream(userId);

        return new Observable<MessageEvent>((observer) => {
            stream.subscribers += 1;
            this.logger.log(`SSE subscribe ${key} (connections=${stream.subscribers})`);

            const sub = stream.subject.subscribe(observer);
            this.emitDemoEventsForTesting(userId);

            return () => {
                sub.unsubscribe();
                stream.subscribers = Math.max(0, stream.subscribers - 1);
                this.logger.log(`SSE unsubscribe ${key} (connections=${stream.subscribers})`);

                if (stream.subscribers === 0) {
                    stream.subject.complete();
                    this.streams.delete(key);
                    this.logger.debug(`Removed idle SSE stream ${key}`);
                }
            };
        });
    }

    emitToUser(userId: number, event: MessageEvent): void {
        const key = this.buildUserKey(userId);
        const stream = this.streams.get(key);

        if (!stream) {
            this.logger.debug(`Skip SSE emit ${key} - no active connections`);
            return;
        }

        stream.subject.next(event);
    }

    notifyVideoCompleted(userId: number, videoData: { url: string; type: string; duration?: number }): void {
        this.emitToUser(userId, {
            type: 'video:completed',
            data: {
                success: true,
                data: videoData,
                timestamp: new Date().toISOString(),
            },
        });
    }

    notifyUploadCompleted(userId: number, videoData: {
        id: number;
        url: string;
        type: string;
        duration?: number;
        name?: string;
    }): void {
        this.emitToUser(userId, {
            type: 'upload-video:completed',
            data: {
                success: true,
                data: videoData,
                timestamp: new Date().toISOString(),
            },
        });
    }

    notifyVideoError(userId: number, error: { id?: string; message: string; reason?: string }): void {
        this.emitToUser(userId, {
            type: 'video:error',
            data: {
                success: false,
                error,
                timestamp: new Date().toISOString(),
            },
        });
    }

    notifyVideoProgress(userId: number, videoId: number, progress: number): void {
        this.emitToUser(userId, {
            type: 'video:progress',
            data: {
                videoId,
                progress,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
