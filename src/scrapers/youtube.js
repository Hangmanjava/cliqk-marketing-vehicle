import { runActorWithRetry } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';

/**
 * Scrape YouTube channel data using Apify
 * Actor: streamers/youtube-channel-scraper
 */

const ACTOR_ID = 'streamers/youtube-channel-scraper';

// Filter posts from the last 7 days
const DAYS_TO_SCRAPE = 7;

/**
 * Check if a date is within the last N days
 */
function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const postDate = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return postDate >= cutoff;
}

/**
 * Scrape all YouTube accounts
 * @returns {Promise<Array>} Array of account data with impressions and content
 */
export async function scrapeYouTube() {
  const results = [];

  for (const account of accounts.youtube) {
    try {
      console.log(`Scraping YouTube: @${account.handle}`);

      const data = await runActorWithRetry(ACTOR_ID, {
        startUrls: [{ url: account.url }],
        maxResults: 30, // Get more videos to filter by date
        maxResultsShorts: 20,
      });

      if (data && data.length > 0) {
        // Get channel info from first item with subscriber data
        const channelData = data.find(item => item.numberOfSubscribers !== undefined) || data[0];

        // Filter videos from the last 7 days
        const recentVideos = data.filter(item =>
          item.viewCount !== undefined &&
          isWithinDays(item.uploadDate || item.publishedAt || item.date, DAYS_TO_SCRAPE)
        );

        console.log(`  📅 Found ${recentVideos.length}/${data.filter(i => i.viewCount !== undefined).length} videos in last ${DAYS_TO_SCRAPE} days`);

        // Calculate totals from recent videos
        let totalViews = 0;
        const postCaptions = [];

        for (const item of recentVideos) {
          totalViews += item.viewCount || 0;

          if (item.title) {
            postCaptions.push(item.title);
          }
        }

        results.push({
          platform: 'youtube',
          handle: account.handle,
          url: account.url,
          subscribers: channelData.numberOfSubscribers || 0,
          channelTotalViews: channelData.channelTotalViews || 0,
          impressions: totalViews, // YouTube views = impressions
          engagement: 0, // Likes not available in this scraper
          videoCount: channelData.channelTotalVideos || 0,
          postCaptions,
          audienceComments: [],
          scrapedAt: new Date().toISOString(),
        });

        console.log(`  ✓ ${account.handle}: ${totalViews.toLocaleString()} views, ${channelData.numberOfSubscribers?.toLocaleString()} subscribers`);
      } else {
        results.push(createEmptyResult(account));
      }
    } catch (error) {
      console.error(`  ✗ Failed @${account.handle}:`, error.message);
      results.push(createEmptyResult(account, error.message));
    }
  }

  return results;
}

function createEmptyResult(account, error = null) {
  return {
    platform: 'youtube',
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
