import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CloudinaryWebhookService } from './cloudinary-webhook.service';

@Controller('webhooks/cloudinary')
export class CloudinaryWebhookController {
    constructor(
        private readonly cloudinaryWebhookService: CloudinaryWebhookService,
    ) { }

    @Post('upload')
    @HttpCode(200)
    async handleUpload(@Body() body: unknown) {
        // Cloudinary sends a rich JSON payload; we keep typing loose here
        return this.cloudinaryWebhookService.handleUpload(body as any);
    }
}


