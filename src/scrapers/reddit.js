import { runActorWithRetry, ACTOR_IDS } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';

/**
 * Scrape Reddit user data using Apify
 */

/**
 * Scrape all Reddit accounts
 * @returns {Promise<Array>} Array of account data with impressions and content
 */
export async function scrapeReddit() {
  const results = [];

  for (const account of accounts.reddit) {
    try {
      console.log(`Scraping Reddit: u/${account.handle}`);

      const data = await runActorWithRetry(ACTOR_IDS.reddit, {
        startUrls: [{ url: account.url }],
        maxItems: 50,
        scrapeComments: true,
      });

      if (data && data.length > 0) {
        // Find user data
        const userData = data.find(item => item.karma !== undefined) || {};

        // Get posts and comments
        const posts = data.filter(item => item.type === 'post' || item.score !== undefined);
        const totalScore = posts.reduce((sum, post) => sum + (post.score || post.ups || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.numComments || post.num_comments || 0), 0);

        // Reddit doesn't expose view counts publicly
        // Estimate impressions from upvotes (rough estimate: ~2% upvote rate)
        const estimatedImpressions = Math.round(totalScore * 50);

        // Collect post titles and content for sentiment analysis
        const postCaptions = posts
          .map(post => `${post.title || ''} ${post.selftext || post.body || ''}`.trim())
          .filter(text => text.length > 0);

        // Collect comment replies
        const comments = posts
          .flatMap(post => post.comments || [])
          .map(comment => comment.body || '')
          .filter(text => text.length > 0)
          .slice(0, 100);

        results.push({
          platform: 'reddit',
          handle: account.handle,
          url: account.url,
          karma: userData.karma || userData.total_karma || totalScore,
          impressions: estimatedImpressions,
          engagement: totalScore + totalComments,
          upvotes: totalScore,
          comments: totalComments,
          postCaptions,
          audienceComments: comments,
          scrapedAt: new Date().toISOString(),
        });
      } else {
        results.push(createEmptyResult('reddit', account));
      }
    } catch (error) {
      console.error(`Failed to scrape Reddit u/${account.handle}:`, error.message);
      results.push(createEmptyResult('reddit', account, error.message));
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
    karma: 0,
    impressions: 0,
    engagement: 0,
    postCaptions: [],
    audienceComments: [],
    error,
    scrapedAt: new Date().toISOString(),
  };
}
