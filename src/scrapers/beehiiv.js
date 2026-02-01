import { runActorWithRetry, ACTOR_IDS } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';

/**
 * Scrape Beehiiv newsletter data using Apify web scraper
 * Note: Limited data available without authenticated access
 */

/**
 * Scrape all Beehiiv newsletters
 * @returns {Promise<Array>} Array of newsletter data
 */
export async function scrapeBeehiiv() {
  const results = [];

  for (const account of accounts.beehiiv) {
    try {
      console.log(`Scraping Beehiiv: ${account.handle}`);

      // Use generic web scraper for Beehiiv
      // This will have limited data without authentication
      const data = await runActorWithRetry(ACTOR_IDS.webScraper, {
        startUrls: [{ url: account.url }],
        pageFunction: async function pageFunction(context) {
          const { $, request } = context;

          // Try to extract any visible subscriber count or metrics
          const subscriberText = $('*:contains("subscriber")').text();
          const subscriberMatch = subscriberText.match(/(\d+[\d,]*)\s*subscriber/i);
          const subscribers = subscriberMatch
            ? parseInt(subscriberMatch[1].replace(/,/g, ''), 10)
            : 0;

          // Get newsletter titles/descriptions
          const titles = [];
          $('h1, h2, h3').each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 10 && text.length < 200) {
              titles.push(text);
            }
          });

          return {
            url: request.url,
            subscribers,
            titles,
            scrapedAt: new Date().toISOString(),
          };
        },
        maxPagesPerCrawl: 5,
      });

      if (data && data.length > 0) {
        const pageData = data[0];

        // Collect newsletter titles for sentiment analysis
        const postCaptions = pageData.titles || [];

        results.push({
          platform: 'beehiiv',
          handle: account.handle,
          url: account.url,
          subscribers: pageData.subscribers || 0,
          impressions: 0, // Not available without Beehiiv API/dashboard access
          engagement: 0,
          openRate: 0, // Not available without authenticated access
          clickRate: 0,
          postCaptions,
          audienceComments: [],
          note: 'Full metrics require Beehiiv dashboard export or API access',
          scrapedAt: new Date().toISOString(),
        });
      } else {
        results.push(createEmptyResult('beehiiv', account));
      }
    } catch (error) {
      console.error(`Failed to scrape Beehiiv ${account.handle}:`, error.message);
      results.push(createEmptyResult('beehiiv', account, error.message));
    }
  }

  return results;
}

/**
 * Create an empty result for failed scrapes
 */
function createEmptyResult(platform, account, error = null) {
  return {
    platform,
    handle: account.handle,
    url: account.url,
    subscribers: 0,
    impressions: 0,
    engagement: 0,
    postCaptions: [],
    audienceComments: [],
    error,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Manual data entry for Beehiiv (for cases where scraping doesn't work)
 * Users can call this with data from their Beehiiv dashboard
 */
export function createBeehiivManualEntry(handle, data) {
  return {
    platform: 'beehiiv',
    handle,
    url: `https://${handle}.beehiiv.com`,
    subscribers: data.subscribers || 0,
    impressions: data.impressions || data.totalOpens || 0,
    engagement: data.clicks || 0,
    openRate: data.openRate || 0,
    clickRate: data.clickRate || 0,
    postCaptions: data.recentSubjects || [],
    audienceComments: [],
    isManualEntry: true,
    scrapedAt: new Date().toISOString(),
  };
}
