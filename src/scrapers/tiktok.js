import { runActorWithRetry } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';
import {
  getRecentVideos,
  transcribeVideos,
  cleanupOutput,
} from '../services/video-transcribe.js';
import {
  analyzeVideos,
  summarizeAccountAnalysis,
} from '../services/video-analysis.js';

/**
 * Scrape TikTok profile data using Apify + video transcription & analysis
 * Actor: clockworks/tiktok-scraper
 */

const ACTOR_ID = 'clockworks/tiktok-scraper';

// Filter posts from the last 7 days
const DAYS_TO_SCRAPE = 7;

/**
 * Check if a timestamp is within the last N days
 */
function isWithinDays(timestamp, days) {
  if (!timestamp) return false;
  // TikTok uses Unix timestamps (seconds)
  const postDate = new Date(timestamp * 1000);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return postDate >= cutoff;
}

/**
 * Scrape all TikTok accounts with video analysis
 * @returns {Promise<object>} Object with scraped data and video analyses
 */
export async function scrapeTikTok() {
  const results = [];
  const videoAnalyses = [];

  for (const account of accounts.tiktok) {
    try {
      console.log(`Scraping TikTok: @${account.handle}`);

      const data = await runActorWithRetry(ACTOR_ID, {
        profiles: [account.handle],
        resultsPerPage: 30, // Get more posts to filter by date
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      });

      if (data && data.length > 0) {
        // Get author info from first item
        const authorMeta = data[0]?.authorMeta || {};

        // Filter videos from the last 7 days
        const recentVideos = data.filter(item =>
          isWithinDays(item.createTime || item.createTimeISO, DAYS_TO_SCRAPE)
        );

        console.log(`  📅 Found ${recentVideos.length}/${data.length} videos in last ${DAYS_TO_SCRAPE} days`);

        // Calculate totals from recent videos
        let totalPlays = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;

        const postCaptions = [];

        for (const item of recentVideos) {
          if (item.playCount !== undefined) {
            totalPlays += item.playCount || 0;
            totalLikes += item.diggCount || 0;
            totalComments += item.commentCount || 0;
            totalShares += item.shareCount || 0;

            if (item.text) {
              postCaptions.push(item.text);
            }
          }
        }

        results.push({
          platform: 'tiktok',
          handle: account.handle,
          url: account.url,
          followers: authorMeta.fans || 0,
          following: authorMeta.following || 0,
          impressions: totalPlays, // TikTok plays = impressions
          engagement: totalLikes + totalComments + totalShares,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
          postCaptions,
          audienceComments: [],
          scrapedAt: new Date().toISOString(),
        });

        console.log(`  ✓ ${account.handle}: ${totalPlays.toLocaleString()} plays, ${authorMeta.fans?.toLocaleString()} followers`);

        // Analyze videos for hooks/virality
        try {
          const accountAnalysis = await analyzeAccountVideos(account);
          if (accountAnalysis) {
            videoAnalyses.push(accountAnalysis);
          }
        } catch (e) {
          console.log(`  ⚠ Video analysis skipped: ${e.message}`);
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
    videoAnalyses,
  };
}

/**
 * Analyze videos for a single TikTok account
 */
async function analyzeAccountVideos(account) {
  try {
    const recentVideos = await getRecentVideos(account.url, 5);

    if (recentVideos.length === 0) {
      return summarizeAccountAnalysis(account.handle, [], 'tiktok');
    }

    console.log(`    Analyzing ${recentVideos.length} videos for @${account.handle}...`);

    const transcriptions = await transcribeVideos(recentVideos, { verbose: false });

    const videosWithTranscripts = recentVideos.map((video, i) => ({
      ...video,
      ...transcriptions[i],
      platform: 'tiktok',
    }));

    const transcribedVideos = videosWithTranscripts.filter(v => v.transcript);

    if (transcribedVideos.length === 0) {
      console.log(`    No transcripts available for @${account.handle}'s videos`);
      return summarizeAccountAnalysis(account.handle, [], 'tiktok');
    }

    console.log(`    Transcribed ${transcribedVideos.length}/${recentVideos.length} videos`);

    const analyses = await analyzeVideos(transcribedVideos);
    return summarizeAccountAnalysis(account.handle, analyses, 'tiktok');
  } catch (error) {
    console.error(`    Video analysis failed for @${account.handle}:`, error.message);
    return summarizeAccountAnalysis(account.handle, [], 'tiktok');
  }
}

function createEmptyResult(account, error = null) {
  return {
    platform: 'tiktok',
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
