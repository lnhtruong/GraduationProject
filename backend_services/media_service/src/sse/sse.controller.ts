import { Controller, Param, ParseIntPipe, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { SseService } from './sse.service';

@Controller('sse')
export class SseController {
    constructor(private readonly sseService: SseService) { }

    @Sse('users/:userId/events')
    streamByUser(@Param('userId', ParseIntPipe) userId: number): Observable<MessageEvent> {
        return this.sseService.subscribeByUserId(userId);
    }
}
