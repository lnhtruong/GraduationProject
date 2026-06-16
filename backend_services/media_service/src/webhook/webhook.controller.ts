import {
    BadRequestException,
    Body,
    Controller,
    HttpCode,
    Post,
    Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WebhookService } from './webhook.service';
import { BunnyService } from 'src/bunny/bunny.service';

@Controller('webhooks')
export class WebhookController {
    constructor(
        private readonly cloudinaryWebhookService: WebhookService,
        private readonly bunnyService: BunnyService,
    ) { }

    @Post('cloudinary/upload')
    @HttpCode(200)
    async handleCloudinary(@Body() body: any) {
        return this.cloudinaryWebhookService.handleUpload(body);
    }

    @Post('ai-model/result')
    @HttpCode(200)
    async handleAiResult(@Req() req: RawBodyRequest<Request>) {
        const rawBody = req.rawBody;

        // Debug log để chẩn đoán 400 (đa số do gateway proxy chưa forward raw bytes)
        console.log(
            '[webhooks/ai-model/result] incoming',
            'rawBodyBytes=', rawBody?.length ?? 'undefined',
            'contentType=', req.headers['content-type'],
            'sig=', req.headers['upstash-signature'] ? 'present' : 'missing',
        );

        // Verify QStash native signature (Receiver.verify). Throws 401 on missing/invalid.
        await this.cloudinaryWebhookService.verifyAiWebhook(rawBody, req.headers);

        let payload: Record<string, unknown>;
        try {
            payload = JSON.parse(rawBody!.toString('utf8')) as Record<string, unknown>;
        } catch (e) {
            const preview = rawBody ? rawBody.toString('utf8').slice(0, 200) : '<empty>';
            throw new BadRequestException(`Invalid JSON body — first 200 chars: ${preview}`);
        }

        return this.cloudinaryWebhookService.handleAIResult(payload as any);
    }

    @Post('bunny-stream')
    @HttpCode(200)
    async bunnyWebhook(@Req() req: RawBodyRequest<Request>) {
        const rawBody = req.rawBody;

        console.log(
            '[webhooks/bunny-stream] incoming',
            'rawBytes=',
            rawBody?.length ?? 0,
            'sig=',
            req.headers['x-bunnystream-signature'] ? 'present' : 'missing',
            'ver=',
            req.headers['x-bunnystream-signature-version'],
        );

        this.bunnyService.verifyBunnyStreamWebhook(rawBody, req.headers);

        let payload: Record<string, unknown>;
        try {
            payload = JSON.parse(rawBody!.toString('utf8')) as Record<string, unknown>;
        } catch {
            throw new BadRequestException('Invalid JSON body');
        }

        console.log('[webhooks/bunny-stream] parsed payload:', JSON.stringify(payload));

        return this.cloudinaryWebhookService.handleBunnyStream(payload);
    }
}
