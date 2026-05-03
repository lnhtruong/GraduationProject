import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FeedService } from './feed.service';

@Injectable()
export class FeedRecommendationWorker {
  private readonly logger = new Logger(FeedRecommendationWorker.name);

  constructor(private readonly feedService: FeedService) {}

  @Cron('*/5 * * * *')
  async handlePrecompute(): Promise<void> {
    try {
      await this.feedService.precomputeRecommendedForActiveUsers();
    } catch (error) {
      this.logger.error('Failed to precompute recommended feeds', error);
    }
  }
}
