import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FeedService } from './feed.service';

/**
 * Background workers that keep recommendation / trending caches warm.
 *
 * Previously the precompute job fired every 10 seconds, which on a single Redis
 * instance was both wasteful (most ticks found no work to do) and dangerous
 * (overlapping runs hammered the DB). The new schedule:
 *
 *   • Personalised recommendations  → every 60 seconds, locked
 *   • Public trending list          → every 5 minutes,  locked
 *
 * Both jobs are guarded by a local in-flight flag PLUS a Redis lock inside
 * the service, so even in a multi-replica deploy only one replica computes
 * at a time.
 */
@Injectable()
export class FeedRecommendationWorker {
  private readonly logger = new Logger(FeedRecommendationWorker.name);
  private isPrecomputing = false;
  private isRefreshingTrending = false;

  constructor(private readonly feedService: FeedService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePrecompute(): Promise<void> {
    if (this.isPrecomputing) {
      this.logger.debug('Precompute already in-flight, skipping tick');
      return;
    }
    this.isPrecomputing = true;
    const start = Date.now();
    try {
      const result = await this.feedService.precomputeRecommendedForActiveUsers({
        concurrency: 8,
        maxBatch: 500,
      });
      const duration = Date.now() - start;
      if (result.processed > 0 || result.skipped > 0) {
        this.logger.log(
          `Precompute done — processed=${result.processed} skipped=${result.skipped} duration=${duration}ms`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to precompute recommended feeds', error as Error);
    } finally {
      this.isPrecomputing = false;
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTrendingRefresh(): Promise<void> {
    if (this.isRefreshingTrending) {
      this.logger.debug('Trending refresh already in-flight, skipping tick');
      return;
    }
    this.isRefreshingTrending = true;
    const start = Date.now();
    try {
      const result = await this.feedService.refreshTrendingCache();
      const duration = Date.now() - start;
      if ('count' in result) {
        this.logger.log(
          `Trending cache refreshed — items=${result.count} duration=${duration}ms`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to refresh trending cache', error as Error);
    } finally {
      this.isRefreshingTrending = false;
    }
  }
}
