import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import type { AxiosResponse } from 'axios';
import { AppService } from './app.service';
import { HIGHLIGHT_COLAB_POOL, MASCOT_COLAB_POOL } from './colab/colab.module';
import { JobRegistryService } from './colab/job-registry.service';
import { QuotaService } from './quota/quota.service';
import { MediaClientService } from './media/media-client.service';

describe('AppService.createHighlightReelLink', () => {
  let service: AppService;
  let mediaClient: { getVideoById: jest.Mock };
  let httpService: { post: jest.Mock; get: jest.Mock };
  let highlightPool: { pickHealthy: jest.Mock };

  beforeEach(async () => {
    mediaClient = { getVideoById: jest.fn() };
    httpService = { post: jest.fn(), get: jest.fn() };
    highlightPool = { pickHealthy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: HIGHLIGHT_COLAB_POOL, useValue: highlightPool },
        { provide: MASCOT_COLAB_POOL, useValue: { pickHealthy: jest.fn() } },
        { provide: JobRegistryService, useValue: { bind: jest.fn() } },
        {
          provide: QuotaService,
          useValue: {
            reserve: jest.fn().mockResolvedValue(0),
            refund: jest.fn(),
            rememberJob: jest.fn(),
            peek: jest.fn(),
          },
        },
        { provide: MediaClientService, useValue: mediaClient },
      ],
    }).compile();

    service = module.get(AppService);
  });

  it('rejects with 400 when keep_ranges is present but video_id is missing', async () => {
    await expect(
      service.createHighlightReelLink({
        video_url: 'https://example.com/v.mp4',
        keep_ranges: [{ start_index: 1, end_index: 2 }],
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects with 400 when the referenced video has no saved subtitle file', async () => {
    mediaClient.getVideoById.mockResolvedValue({ id: 5, srt_raw_url: null });

    await expect(
      service.createHighlightReelLink({
        video_url: 'https://example.com/v.mp4',
        video_id: 5,
        remove_ranges: [{ start_index: 1, end_index: 2 }],
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("forwards the video's saved srt_raw_url as srt_url, overriding any client-supplied value", async () => {
    mediaClient.getVideoById.mockResolvedValue({
      id: 7,
      srt_raw_url: 'https://cdn.example.com/subs/7.srt',
    });
    highlightPool.pickHealthy.mockResolvedValue('https://colab.example.ngrok.io');
    httpService.post.mockReturnValue(
      of({ data: { job_id: 'abc', status: 'pending' } } as AxiosResponse),
    );

    await service.createHighlightReelLink({
      video_url: 'https://example.com/v.mp4',
      video_id: 7,
      remove_ranges: [{ start_index: 1, end_index: 2 }],
      srt_url: 'https://stale-client-supplied-value.example.com/old.srt',
    });

    const [, forwardedBody] = httpService.post.mock.calls[0];
    expect(forwardedBody).toMatchObject({
      srt_url: 'https://cdn.example.com/subs/7.srt',
    });
  });

  it('forwards the request unchanged, without checking the video, when no keep_ranges/remove_ranges are given', async () => {
    highlightPool.pickHealthy.mockResolvedValue('https://colab.example.ngrok.io');
    httpService.post.mockReturnValue(
      of({ data: { job_id: 'xyz', status: 'pending' } } as AxiosResponse),
    );

    await service.createHighlightReelLink({
      video_url: 'https://example.com/v.mp4',
      topic: 'photosynthesis',
    });

    expect(mediaClient.getVideoById).not.toHaveBeenCalled();
    const [, forwardedBody] = httpService.post.mock.calls[0];
    expect(forwardedBody).toEqual(
      expect.objectContaining({
        video_url: 'https://example.com/v.mp4',
        topic: 'photosynthesis',
      }),
    );
    expect(forwardedBody).not.toHaveProperty('srt_url');
  });
});
