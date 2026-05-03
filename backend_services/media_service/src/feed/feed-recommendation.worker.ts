import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FeedService } from './feed.service';

@Injectable()
export class FeedRecommendationWorker {
  private readonly logger = new Logger(FeedRecommendationWorker.name);

  constructor(private readonly feedService: FeedService) {}

  @Cron('*/10 * * * * *')
  async handlePrecompute(): Promise<void> {
    try {
      this.logger.log('Cronning precompute');

      await this.feedService.precomputeRecommendedForActiveUsers();
    } catch (error) {
      this.logger.error('Failed to precompute recommended feeds', error);
    }
  }
}
