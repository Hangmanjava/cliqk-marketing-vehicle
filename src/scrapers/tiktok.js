import { runActorWithRetry, ACTOR_IDS } from '../services/apify-client.js';
import { accounts } from '../config/accounts.js';
import {
  getRecentVideos,
  transcribeVideos,
  cleanupOutput,
} from '../services/tiktok-transcribe.js';
import {
  analyzeVideos,
  summarizeAccountAnalysis,
} from '../services/video-analysis.js';

/**
 * Scrape TikTok profile data using Apify + video transcription & analysis
 */

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

      // Get profile data via Apify
      const data = await runActorWithRetry(ACTOR_IDS.tiktok, {
        profiles: [account.handle],
        resultsPerPage: 12,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      });

      let profileResult;

      if (data && data.length > 0) {
        // Find profile data
        const profileData = data.find(item => item.authorMeta) || data[0];

        // Get video data
        const videos = data.filter(item => item.playCount !== undefined);
        const totalViews = videos.reduce((sum, video) => sum + (video.playCount || 0), 0);
        const totalLikes = videos.reduce((sum, video) => sum + (video.diggCount || 0), 0);
        const totalComments = videos.reduce((sum, video) => sum + (video.commentCount || 0), 0);
        const totalShares = videos.reduce((sum, video) => sum + (video.shareCount || 0), 0);

        // Collect video descriptions for sentiment analysis
        const postCaptions = videos
          .map(video => video.text || '')
          .filter(text => text.length > 0);

        profileResult = {
          platform: 'tiktok',
          handle: account.handle,
          url: account.url,
          followers: profileData.authorMeta?.fans || 0,
          following: profileData.authorMeta?.following || 0,
          impressions: totalViews,
          engagement: totalLikes + totalComments + totalShares,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
          postCaptions,
          audienceComments: [],
          scrapedAt: new Date().toISOString(),
        };
      } else {
        profileResult = createEmptyResult('tiktok', account);
      }

      results.push(profileResult);

      // Now get recent videos and analyze them
      console.log(`  Fetching recent videos for @${account.handle}...`);
      const accountAnalysis = await analyzeAccountVideos(account);
      if (accountAnalysis) {
        videoAnalyses.push(accountAnalysis);
      }

    } catch (error) {
      console.error(`Failed to scrape TikTok @${account.handle}:`, error.message);
      results.push(createEmptyResult('tiktok', account, error.message));
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
 * @param {object} account - Account config
 * @returns {Promise<object>} Account video analysis summary
 */
async function analyzeAccountVideos(account) {
  try {
    // Get recent videos (last 7 days)
    console.log(`  Getting recent videos for @${account.handle}...`);
    const recentVideos = await getRecentVideos(account.url, 5);

    if (recentVideos.length === 0) {
      console.log(`  No recent videos found for @${account.handle}`);
      return summarizeAccountAnalysis(account.handle, []);
    }

    console.log(`  Found ${recentVideos.length} recent videos, transcribing...`);

    // Transcribe videos
    const transcriptions = await transcribeVideos(recentVideos, { verbose: false });

    // Merge transcriptions with video data
    const videosWithTranscripts = recentVideos.map((video, i) => ({
      ...video,
      ...transcriptions[i],
    }));

    // Filter to only videos with transcripts
    const transcribedVideos = videosWithTranscripts.filter(v => v.transcript);
    console.log(`  Transcribed ${transcribedVideos.length}/${recentVideos.length} videos`);

    if (transcribedVideos.length === 0) {
      return summarizeAccountAnalysis(account.handle, []);
    }

    // Analyze hook and virality
    console.log(`  Analyzing hooks and virality...`);
    const analyses = await analyzeVideos(transcribedVideos);

    // Generate summary
    return summarizeAccountAnalysis(account.handle, analyses);

  } catch (error) {
    console.error(`  Video analysis failed for @${account.handle}:`, error.message);
    return summarizeAccountAnalysis(account.handle, []);
  }
}

/**
 * Legacy function for backwards compatibility
 * Returns just the profile data
 */
export async function scrapeTikTokProfiles() {
  const result = await scrapeTikTok();
  return result.profileData;
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
