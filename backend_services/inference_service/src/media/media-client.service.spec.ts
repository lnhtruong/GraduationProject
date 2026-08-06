import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import type { AxiosResponse } from 'axios';
import { MediaClientService } from './media-client.service';

describe('MediaClientService', () => {
  let service: MediaClientService;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaClientService,
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://media_service.internal:8003'),
          },
        },
      ],
    }).compile();

    service = module.get(MediaClientService);
  });

  it('resolves the video srt_raw_url when the video exists', async () => {
    httpService.get.mockReturnValue(
      of({
        data: { id: 42, srt_raw_url: 'https://cdn.example.com/subs/42.srt' },
      } as AxiosResponse),
    );

    const result = await service.getVideoById(42);

    expect(result).toEqual({
      id: 42,
      srt_raw_url: 'https://cdn.example.com/subs/42.srt',
    });
  });

  it('resolves null when the video does not exist', async () => {
    httpService.get.mockReturnValue(
      throwError(() => ({ isAxiosError: true, response: { status: 404 } })),
    );

    const result = await service.getVideoById(999);

    expect(result).toBeNull();
  });
});
