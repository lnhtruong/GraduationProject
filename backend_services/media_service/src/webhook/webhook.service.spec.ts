/* eslint-disable @typescript-eslint/no-explicit-any */
import { getModelToken } from '@nestjs/sequelize';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import type { IncomingHttpHeaders } from 'http';

import { Video } from 'src/videos/video.model';
import { Image } from 'src/images_mascot/images.model';
import { BunnyService } from 'src/bunny/bunny.service';
import { NotificationService } from 'src/notifications/notification.service';

import { WebhookService } from './webhook.service';

const SECRET = 'test-secret';

describe('WebhookService — verifyAiWebhook (HMAC-SHA256)', () => {
  let service: WebhookService;

  const rawBody = Buffer.from(
    JSON.stringify({ job_id: 'job-1', status: 'completed', user_id: 42 }),
  );
  const validSignature = createHmac('sha256', SECRET).update(rawBody).digest('hex');

  beforeEach(async () => {
    process.env.INFERENCE_WEBHOOK_SECRET = SECRET;

    const passThroughModel = () => ({
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: getModelToken(Video), useValue: passThroughModel() },
        { provide: getModelToken(Image), useValue: passThroughModel() },
        { provide: NotificationService, useValue: { createAndEmit: jest.fn() } },
        { provide: BunnyService, useValue: {} },
        { provide: HttpService, useValue: { post: jest.fn() } },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  it('throws 401 Missing signature when no signature header is present', () => {
    const headers: IncomingHttpHeaders = {};
    expect(() => service.verifyAiWebhook(rawBody, headers)).toThrow(UnauthorizedException);
    expect(() => service.verifyAiWebhook(rawBody, headers)).toThrow('Missing signature');
  });

  it('throws 401 Invalid signature when the signature does not match', () => {
    const headers: IncomingHttpHeaders = { 'upstash-signature': 'deadbeef' };
    expect(() => service.verifyAiWebhook(rawBody, headers)).toThrow(UnauthorizedException);
    expect(() => service.verifyAiWebhook(rawBody, headers)).toThrow('Invalid signature');
  });

  it('passes when the signature is a valid HMAC of the raw body', () => {
    const headers: IncomingHttpHeaders = { 'upstash-signature': validSignature };
    expect(() => service.verifyAiWebhook(rawBody, headers)).not.toThrow();
  });
});
