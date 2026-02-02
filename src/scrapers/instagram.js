import { runActorWithRetry } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';
import {
  transcribeVideo,
  transcribeVideos,
  cleanupOutput,
} from '../services/video-transcribe.js';
import {
  analyzeVideos,
  summarizeAccountAnalysis,
} from '../services/video-analysis.js';

/**
 * Scrape Instagram profile data using Apify + video analysis for Reels
 * Actor: apify/instagram-scraper
 */

const ACTOR_ID = 'apify/instagram-scraper';

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
 * Get Reel URLs from Instagram posts
 */
function getReelUrls(posts, maxReels = 5) {
  const reels = posts
    .filter(post => {
      // Check if it's a video/reel
      const isVideo = post.type === 'Video' ||
                      post.videoUrl ||
                      post.isVideo ||
                      (post.displayUrl && post.videoViewCount);
      return isVideo;
    })
    .slice(0, maxReels)
    .map(post => ({
      url: post.url || `https://www.instagram.com/reel/${post.shortCode}/`,
      shortCode: post.shortCode,
      viewCount: post.videoViewCount || post.videoPlayCount || 0,
      likeCount: post.likesCount || 0,
    }));

  return reels;
}

/**
 * Analyze Reels for a single Instagram account
 */
async function analyzeAccountReels(account, posts) {
  try {
    // Get reel URLs from recent posts
    const reels = getReelUrls(posts, 5);

    if (reels.length === 0) {
      return summarizeAccountAnalysis(account.handle, [], 'instagram');
    }

    console.log(`    Analyzing ${reels.length} Reels for @${account.handle}...`);

    // Transcribe reels
    const transcriptions = await transcribeVideos(
      reels.map(r => r.url),
      { verbose: false }
    );

    // Merge transcriptions with reel data
    const reelsWithTranscripts = reels.map((reel, i) => ({
      ...reel,
      ...transcriptions[i],
      platform: 'instagram',
    }));

    const transcribedReels = reelsWithTranscripts.filter(r => r.transcript);

    if (transcribedReels.length === 0) {
      console.log(`    No transcripts available for @${account.handle}'s Reels`);
      return summarizeAccountAnalysis(account.handle, [], 'instagram');
    }

    console.log(`    Transcribed ${transcribedReels.length}/${reels.length} Reels`);

    // Analyze the transcribed reels
    const analyses = await analyzeVideos(transcribedReels);
    return summarizeAccountAnalysis(account.handle, analyses, 'instagram');

  } catch (error) {
    console.error(`    Reel analysis failed for @${account.handle}:`, error.message);
    return summarizeAccountAnalysis(account.handle, [], 'instagram');
  }
}

/**
 * Scrape all Instagram accounts with optional Reel analysis
 * @param {object} options - Options
 * @param {boolean} options.analyzeReels - Whether to analyze Reels (default: true)
 * @returns {Promise<object>} Object with profileData and reelAnalyses
 */
export async function scrapeInstagram(options = {}) {
  const { analyzeReels = true } = options;
  const results = [];
  const reelAnalyses = [];

  for (const account of accounts.instagram) {
    try {
      console.log(`Scraping Instagram: @${account.handle}`);

      const data = await runActorWithRetry(ACTOR_ID, {
        directUrls: [account.url],
        resultsType: 'details',
        resultsLimit: 30, // Get more posts to filter by date
      });

      if (data && data.length > 0) {
        const profile = data[0];

        // Calculate impressions from posts in the last 7 days
        const allPosts = profile.latestPosts || [];
        const posts = allPosts.filter(post =>
          isWithinDays(post.timestamp || post.takenAt || post.createdAt, DAYS_TO_SCRAPE)
        );

        console.log(`  📅 Found ${posts.length}/${allPosts.length} posts in last ${DAYS_TO_SCRAPE} days`);

        let totalImpressions = 0;
        let totalLikes = 0;
        let totalComments = 0;

        for (const post of posts) {
          const likes = post.likesCount || 0;
          const comments = post.commentsCount || 0;
          const videoViews = post.videoViewCount || 0;

          totalLikes += likes;
          totalComments += comments;

          // Use video views if available, otherwise estimate from engagement
          if (videoViews > 0) {
            totalImpressions += videoViews;
          } else {
            // Estimate: engagement is ~3-5% of impressions
            totalImpressions += Math.round((likes + comments) * 25);
          }
        }

        // Collect post captions for sentiment analysis
        const postCaptions = posts
          .map(post => post.caption || '')
          .filter(caption => caption.length > 0);

        results.push({
          platform: 'instagram',
          handle: account.handle,
          url: account.url,
          followers: profile.followersCount || 0,
          following: profile.followsCount || 0,
          postsCount: profile.postsCount || 0,
          impressions: totalImpressions,
          engagement: totalLikes + totalComments,
          likes: totalLikes,
          comments: totalComments,
          postCaptions,
          audienceComments: [],
          scrapedAt: new Date().toISOString(),
        });

        console.log(`  ✓ ${account.handle}: ${totalImpressions.toLocaleString()} impressions, ${profile.followersCount?.toLocaleString()} followers`);

        // Analyze Reels if enabled
        if (analyzeReels) {
          try {
            const reelAnalysis = await analyzeAccountReels(account, posts);
            if (reelAnalysis && reelAnalysis.videosAnalyzed > 0) {
              reelAnalyses.push(reelAnalysis);
            }
          } catch (e) {
            console.log(`  ⚠ Reel analysis skipped: ${e.message}`);
          }
        }
      } else {
        results.push(createEmptyResult(account));
      }
    } catch (error) {
      console.error(`  ✗ Failed @${account.handle}:`, error.message);
      results.push(createEmptyResult(account, error.message));
    }
  }

  // Clean up temporary files
  try {
    cleanupOutput();
  } catch (e) {
    // Ignore cleanup errors
  }

  return {
    profileData: results,
    reelAnalyses,
  };
}

function createEmptyResult(account, error = null) {
  return {
    platform: 'instagram',
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
