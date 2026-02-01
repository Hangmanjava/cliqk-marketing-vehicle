import { runActorWithRetry, ACTOR_IDS } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';

/**
 * Scrape LinkedIn profile and page data using Apify
 * Note: LinkedIn is highly restrictive - data may be limited
 */

/**
 * Scrape all LinkedIn accounts (profiles, pages, newsletters)
 * @returns {Promise<Array>} Array of account data with impressions and content
 */
export async function scrapeLinkedIn() {
  const results = [];

  // Scrape profiles
  for (const account of accounts.linkedin.profiles) {
    try {
      console.log(`Scraping LinkedIn profile: ${account.handle}`);

      const data = await runActorWithRetry(ACTOR_IDS.linkedin, {
        profileUrls: [account.url],
        scrapeCompany: false,
      });

      if (data && data.length > 0) {
        const profileData = data[0];

        // LinkedIn doesn't expose impression data publicly
        // We can only get connection count and some basic info
        const connections = profileData.connectionCount || profileData.connections || 0;

        // Recent activity if available
        const posts = profileData.posts || profileData.activities || [];
        const totalReactions = posts.reduce((sum, post) => sum + (post.reactions || post.likes || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);

        // Estimate impressions from engagement (LinkedIn avg engagement ~2-3%)
        const estimatedImpressions = Math.round((totalReactions + totalComments) * 40);

        // Collect post content for sentiment analysis
        const postCaptions = posts
          .map(post => post.text || post.content || '')
          .filter(text => text.length > 0);

        results.push({
          platform: 'linkedin',
          type: 'profile',
          handle: account.handle,
          url: account.url,
          connections,
          impressions: estimatedImpressions,
          engagement: totalReactions + totalComments,
          reactions: totalReactions,
          comments: totalComments,
          postCaptions,
          audienceComments: [], // Comments not easily accessible
          scrapedAt: new Date().toISOString(),
        });
      } else {
        results.push(createEmptyResult('linkedin', 'profile', account));
      }
    } catch (error) {
      console.error(`Failed to scrape LinkedIn profile ${account.handle}:`, error.message);
      results.push(createEmptyResult('linkedin', 'profile', account, error.message));
    }
  }

  // Scrape company pages
  for (const account of accounts.linkedin.pages) {
    try {
      console.log(`Scraping LinkedIn page: ${account.handle}`);

      // Company pages may require different actor or approach
      const data = await runActorWithRetry(ACTOR_IDS.linkedin, {
        companyUrls: [account.url],
      });

      if (data && data.length > 0) {
        const pageData = data[0];

        const followers = pageData.followersCount || pageData.followers || 0;
        const posts = pageData.posts || [];
        const totalReactions = posts.reduce((sum, post) => sum + (post.reactions || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
        const estimatedImpressions = Math.round((totalReactions + totalComments) * 40);

        const postCaptions = posts
          .map(post => post.text || post.content || '')
          .filter(text => text.length > 0);

        results.push({
          platform: 'linkedin',
          type: 'page',
          handle: account.handle,
          url: account.url,
          companyId: account.companyId,
          followers,
          impressions: estimatedImpressions,
          engagement: totalReactions + totalComments,
          reactions: totalReactions,
          comments: totalComments,
          postCaptions,
          audienceComments: [],
          scrapedAt: new Date().toISOString(),
        });
      } else {
        results.push(createEmptyResult('linkedin', 'page', account));
      }
    } catch (error) {
      console.error(`Failed to scrape LinkedIn page ${account.handle}:`, error.message);
      results.push(createEmptyResult('linkedin', 'page', account, error.message));
    }
  }

  // Scrape newsletters (limited data available)
  for (const account of accounts.linkedin.newsletters) {
    try {
      console.log(`Scraping LinkedIn newsletter: ${account.handle}`);

      // Newsletter data is very limited via scraping
      // This would typically need manual entry or LinkedIn API access
      results.push({
        platform: 'linkedin',
        type: 'newsletter',
        handle: account.handle,
        newsletterId: account.newsletterId,
        subscribers: 0, // Not available via scraping
        impressions: 0,
        engagement: 0,
        postCaptions: [],
        audienceComments: [],
        note: 'Newsletter data requires manual entry or LinkedIn API access',
        scrapedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to scrape LinkedIn newsletter ${account.handle}:`, error.message);
      results.push(createEmptyResult('linkedin', 'newsletter', account, error.message));
    }
  }

  return results;
}

/**
 * Create an empty result for failed scrapes
 */
function createEmptyResult(platform, type, account, error = null) {
  return {
    platform,
    type,
    handle: account.handle,
    url: account.url,
    connections: 0,
    followers: 0,
    impressions: 0,
    engagement: 0,
    postCaptions: [],
    audienceComments: [],
    error,
    scrapedAt: new Date().toISOString(),
  };
}
