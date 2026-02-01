import { runActorWithRetry, ACTOR_IDS } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';

/**
 * Scrape Instagram profile data using Apify
 */

/**
 * Scrape all Instagram accounts
 * @returns {Promise<Array>} Array of account data with impressions and content
 */
export async function scrapeInstagram() {
  const results = [];

  for (const account of accounts.instagram) {
    try {
      console.log(`Scraping Instagram: @${account.handle}`);

      const data = await runActorWithRetry(ACTOR_IDS.instagram, {
        usernames: [account.handle],
        resultsLimit: 12, // Last 12 posts
        addParentData: true,
      });

      if (data && data.length > 0) {
        const profileData = data[0];

        // Calculate total impressions from recent posts
        // Instagram doesn't expose impressions publicly, so we estimate from engagement
        const posts = data.filter(item => item.type === 'post' || item.likesCount !== undefined);
        const totalLikes = posts.reduce((sum, post) => sum + (post.likesCount || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);

        // Estimate impressions based on engagement (rough estimate: engagement is ~3-5% of impressions)
        const estimatedImpressions = Math.round((totalLikes + totalComments) * 25);

        // Collect post captions for sentiment analysis
        const postCaptions = posts
          .map(post => post.caption || '')
          .filter(caption => caption.length > 0);

        // Collect comments for sentiment analysis
        const comments = posts
          .flatMap(post => post.latestComments || [])
          .map(comment => comment.text || '')
          .filter(text => text.length > 0);

        results.push({
          platform: 'instagram',
          handle: account.handle,
          url: account.url,
          followers: profileData.followersCount || 0,
          following: profileData.followingCount || 0,
          posts: profileData.postsCount || 0,
          impressions: estimatedImpressions,
          engagement: totalLikes + totalComments,
          likes: totalLikes,
          comments: totalComments,
          postCaptions,
          audienceComments: comments,
          scrapedAt: new Date().toISOString(),
        });
      } else {
        results.push(createEmptyResult('instagram', account));
      }
    } catch (error) {
      console.error(`Failed to scrape Instagram @${account.handle}:`, error.message);
      results.push(createEmptyResult('instagram', account, error.message));
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
    followers: 0,
    impressions: 0,
    engagement: 0,
    postCaptions: [],
    audienceComments: [],
    error,
    scrapedAt: new Date().toISOString(),
  };
}
