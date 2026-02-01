import { runActorWithRetry, ACTOR_IDS } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';

/**
 * Scrape X/Twitter profile data using Apify
 */

/**
 * Scrape all Twitter accounts
 * @returns {Promise<Array>} Array of account data with impressions and content
 */
export async function scrapeTwitter() {
  const results = [];

  for (const account of accounts.twitter) {
    try {
      console.log(`Scraping Twitter: @${account.handle}`);

      const data = await runActorWithRetry(ACTOR_IDS.twitter, {
        handles: [account.handle],
        tweetsDesired: 20,
        addUserInfo: true,
      });

      if (data && data.length > 0) {
        // Find user info
        const userData = data.find(item => item.user)?.user || {};

        // Get tweet data
        const tweets = data.filter(item => item.full_text || item.text);
        const totalImpressions = tweets.reduce((sum, tweet) => {
          // Twitter API may include impression_count in some responses
          return sum + (tweet.impression_count || tweet.view_count || 0);
        }, 0);
        const totalLikes = tweets.reduce((sum, tweet) => sum + (tweet.favorite_count || 0), 0);
        const totalRetweets = tweets.reduce((sum, tweet) => sum + (tweet.retweet_count || 0), 0);
        const totalReplies = tweets.reduce((sum, tweet) => sum + (tweet.reply_count || 0), 0);

        // If no impression data, estimate from engagement
        const estimatedImpressions = totalImpressions > 0
          ? totalImpressions
          : Math.round((totalLikes + totalRetweets + totalReplies) * 50);

        // Collect tweet text for sentiment analysis
        const postCaptions = tweets
          .map(tweet => tweet.full_text || tweet.text || '')
          .filter(text => text.length > 0);

        // Collect replies for sentiment analysis
        const replies = tweets
          .flatMap(tweet => tweet.replies || [])
          .map(reply => reply.full_text || reply.text || '')
          .filter(text => text.length > 0);

        results.push({
          platform: 'twitter',
          handle: account.handle,
          url: account.url,
          followers: userData.followers_count || 0,
          following: userData.friends_count || 0,
          impressions: estimatedImpressions,
          engagement: totalLikes + totalRetweets + totalReplies,
          likes: totalLikes,
          retweets: totalRetweets,
          replies: totalReplies,
          postCaptions,
          audienceComments: replies,
          scrapedAt: new Date().toISOString(),
        });
      } else {
        results.push(createEmptyResult('twitter', account));
      }
    } catch (error) {
      console.error(`Failed to scrape Twitter @${account.handle}:`, error.message);
      results.push(createEmptyResult('twitter', account, error.message));
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
