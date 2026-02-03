import { runActorWithRetry } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';

/**
 * Scrape X/Twitter profile data using Apify
 * Actor: apidojo/tweet-scraper
 */

const ACTOR_ID = 'apidojo/tweet-scraper';

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
 * Scrape all Twitter accounts
 * @returns {Promise<Array>} Array of account data with impressions and content
 */
export async function scrapeTwitter() {
  const results = [];

  for (const account of accounts.twitter) {
    try {
      console.log(`Scraping Twitter: @${account.handle}`);

      const data = await runActorWithRetry(ACTOR_ID, {
        searchTerms: [`from:${account.handle} -filter:retweets`],
        maxItems: 50, // Get more tweets to filter by date
        addUserInfo: true,
      });

      if (data && data.length > 0) {
        // Get author info from first tweet
        const author = data[0]?.author || {};

        // Filter tweets from the last 7 days, excluding retweets
        const recentTweets = data.filter(tweet => {
          if (!isWithinDays(tweet.createdAt || tweet.date || tweet.timestamp, DAYS_TO_SCRAPE)) return false;
          // Exclude retweets
          const text = tweet.fullText || tweet.text || '';
          if (tweet.isRetweet || tweet.retweetedTweet || text.startsWith('RT @')) return false;
          return true;
        });

        console.log(`  📅 Found ${recentTweets.length}/${data.length} original tweets in last ${DAYS_TO_SCRAPE} days (retweets excluded)`);

        // Calculate totals from recent tweets
        let totalViews = 0;
        let totalLikes = 0;
        let totalRetweets = 0;
        let totalReplies = 0;

        const postCaptions = [];

        for (const tweet of recentTweets) {
          totalViews += tweet.viewCount || 0;
          totalLikes += tweet.likeCount || 0;
          totalRetweets += tweet.retweetCount || 0;
          totalReplies += tweet.replyCount || 0;

          if (tweet.text || tweet.fullText) {
            postCaptions.push(tweet.fullText || tweet.text);
          }
        }

        results.push({
          platform: 'twitter',
          handle: account.handle,
          url: account.url,
          followers: author.followers || 0,
          following: author.following || 0,
          impressions: totalViews, // Twitter views = impressions
          engagement: totalLikes + totalRetweets + totalReplies,
          likes: totalLikes,
          retweets: totalRetweets,
          replies: totalReplies,
          postCaptions,
          audienceComments: [],
          scrapedAt: new Date().toISOString(),
        });

        console.log(`  ✓ ${account.handle}: ${totalViews.toLocaleString()} views, ${author.followers?.toLocaleString()} followers`);
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
    platform: 'twitter',
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
