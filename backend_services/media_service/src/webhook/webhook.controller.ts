import { Body, Controller, HttpCode, Post, Headers, BadRequestException } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhooks')
export class WebhookController {
    constructor(
        private readonly cloudinaryWebhookService: WebhookService,
    ) { }

    // Webhook cho Cloudinary (Giữ nguyên của bạn)
    @Post('cloudinary/upload')
    @HttpCode(200)
    async handleCloudinary(@Body() body: any) {
        return this.cloudinaryWebhookService.handleUpload(body);
    }

    @Post('ai-model/result')
    @HttpCode(200) 
    async handleAiResult(
        @Body() body: any,
        @Headers('upstash-signature') signature: string, // Header dùng để verify từ QStash
    ) {
        // 1. (Optional) Verify signature ở đây để đảm bảo đúng là từ QStash
        if (!body) throw new BadRequestException('Empty body');

        console.log('Received AI Result:', body);

        // 2. Xử lý logic (ví dụ: cập nhật DB, bắn Socket.io cho Client)
        return this.cloudinaryWebhookService.handleAIResult(body);
    }
}