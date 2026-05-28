import { Injectable } from '@nestjs/common';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN!,
});

@Injectable()
export class ScraperService {
  async scrapeGoogleReviews(url: string) {
    const run = await client.actor('compass/google-maps-reviews-scraper').call({
      startUrls: [{ url }],
      maxReviews: 500,
    });

    const dataset = await client
      .dataset(run.defaultDatasetId || run.id)
      .listItems();

    return dataset.items || [];
  }
}
