import { Injectable } from '@nestjs/common';
import { ApifyClient } from 'apify-client';

@Injectable()
export class ScraperService {
  private readonly client = new ApifyClient({ token: process.env.APIFY_API_TOKEN ?? '' });

  async scrapeGoogleReviews(url: string) {
    const run = await this.client.actor('compass/google-maps-reviews-scraper').call({
      startUrls: [{ url }],
      maxReviews: 500,
    });

    const dataset = await this.client
      .dataset(run.defaultDatasetId || run.id)
      .listItems();

    return dataset.items || [];
  }
}
