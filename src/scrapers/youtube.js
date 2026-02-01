import { runActorWithRetry, ACTOR_IDS } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';

/**
 * Scrape YouTube channel data using Apify
 */

/**
 * Scrape all YouTube accounts
 * @returns {Promise<Array>} Array of account data with impressions and content
 */
export async function scrapeYouTube() {
  const results = [];

  for (const account of accounts.youtube) {
    try {
      console.log(`Scraping YouTube: @${account.handle}`);

      const data = await runActorWithRetry(ACTOR_IDS.youtube, {
        channelUrls: [account.url],
        maxVideos: 12,
        maxComments: 50,
      });

      if (data && data.length > 0) {
        // Find channel info
        const channelData = data.find(item => item.subscriberCount !== undefined) || data[0];

        // Get video data
        const videos = data.filter(item => item.viewCount !== undefined);
        const totalViews = videos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
        const totalLikes = videos.reduce((sum, video) => sum + (video.likeCount || 0), 0);
        const totalComments = videos.reduce((sum, video) => sum + (video.commentCount || 0), 0);

        // Collect video titles and descriptions for sentiment analysis
        const postCaptions = videos
          .map(video => `${video.title || ''} ${video.description || ''}`.trim())
          .filter(text => text.length > 0);

        // Collect comments for sentiment analysis
        const comments = videos
          .flatMap(video => video.comments || [])
          .map(comment => comment.text || comment.content || '')
          .filter(text => text.length > 0)
          .slice(0, 100); // Limit to 100 comments

        results.push({
          platform: 'youtube',
          handle: account.handle,
          url: account.url,
          subscribers: channelData.subscriberCount || 0,
          impressions: totalViews, // YouTube views = impressions
          engagement: totalLikes + totalComments,
          likes: totalLikes,
          comments: totalComments,
          videoCount: videos.length,
          postCaptions,
          audienceComments: comments,
          scrapedAt: new Date().toISOString(),
        });
      } else {
        results.push(createEmptyResult('youtube', account));
      }
    } catch (error) {
      console.error(`Failed to scrape YouTube @${account.handle}:`, error.message);
      results.push(createEmptyResult('youtube', account, error.message));
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
