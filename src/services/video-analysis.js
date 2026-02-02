import OpenAI from 'openai';

/**
 * Video content analysis service using OpenAI
 * Analyzes TikTok and Instagram Reels for hooks and virality potential
 */

let openai = null;

/**
 * Initialize OpenAI client
 */
function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

/**
 * Analyze a video's hook and virality potential
 * @param {object} video - Video data with transcript
 * @returns {Promise<object>} Analysis result
 */
export async function analyzeVideoContent(video) {
  if (!video.transcript) {
    return {
      videoId: video.videoId,
      url: video.url,
      platform: video.platform || 'unknown',
      analyzed: false,
      reason: 'No transcript available',
    };
  }

  const client = getOpenAIClient();
  const platform = video.platform || 'tiktok';
  const platformName = platform === 'instagram' ? 'Instagram Reel' : 'TikTok';

  // Extract the hook (first ~50 words or first 15 seconds worth)
  const words = video.transcript.split(' ');
  const hookText = words.slice(0, 50).join(' ');
  const fullText = video.transcript;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a viral content expert specializing in ${platformName} and short-form video. Analyze video transcripts for their hook effectiveness and virality potential.

Your analysis should be practical and actionable. Focus on:
1. Hook Analysis: How well does the opening grab attention? Does it create curiosity or promise value?
2. Content Structure: Is there a clear narrative or payoff?
3. Virality Factors: Does it evoke emotion, teach something, or have shareability?
4. Improvement Suggestions: Specific, actionable tips.

Return a JSON object with these fields:
- hookScore: 1-10 rating of the hook's effectiveness
- hookAnalysis: Brief analysis of what works/doesn't work in the hook
- viralityScore: 1-10 rating of overall viral potential
- viralityFactors: Array of factors that help/hurt virality
- contentType: Category (educational, entertainment, storytelling, promotional, etc.)
- emotionalTrigger: Primary emotion the content evokes
- improvements: Array of 1-3 specific suggestions to improve
- summary: One sentence overall assessment`,
        },
        {
          role: 'user',
          content: `Analyze this ${platformName} video:

HOOK (first ~10 seconds):
"${hookText}"

FULL TRANSCRIPT:
"${fullText}"

${video.viewCount ? `Views: ${video.viewCount.toLocaleString()}` : ''}
${video.likeCount ? `Likes: ${video.likeCount.toLocaleString()}` : ''}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.5,
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    return {
      videoId: video.videoId,
      url: video.url,
      platform,
      analyzed: true,
      hook: hookText,
      ...analysis,
    };
  } catch (error) {
    console.error(`Analysis failed for ${video.videoId}:`, error.message);
    return {
      videoId: video.videoId,
      url: video.url,
      platform,
      analyzed: false,
      error: error.message,
    };
  }
}

/**
 * Analyze multiple videos
 * @param {Array} videos - Array of video data with transcripts
 * @returns {Promise<Array>} Array of analysis results
 */
export async function analyzeVideos(videos) {
  const results = [];

  for (const video of videos) {
    console.log(`  Analyzing video: ${video.videoId || video.url}`);
    const analysis = await analyzeVideoContent(video);
    results.push(analysis);

    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Generate a summary of video analyses for an account
 * @param {string} handle - Account handle
 * @param {Array} analyses - Array of video analyses
 * @param {string} platform - Platform name (tiktok or instagram)
 * @returns {object} Summary statistics
 */
export function summarizeAccountAnalysis(handle, analyses, platform = 'tiktok') {
  const analyzed = analyses.filter(a => a.analyzed);

  if (analyzed.length === 0) {
    return {
      handle,
      platform,
      videosAnalyzed: 0,
      avgHookScore: 0,
      avgViralityScore: 0,
      topVideos: [],
      commonIssues: [],
      topHooks: [],
    };
  }

  const avgHookScore = analyzed.reduce((sum, a) => sum + (a.hookScore || 0), 0) / analyzed.length;
  const avgViralityScore = analyzed.reduce((sum, a) => sum + (a.viralityScore || 0), 0) / analyzed.length;

  // Find top performing hooks
  const topVideos = analyzed
    .sort((a, b) => (b.hookScore || 0) - (a.hookScore || 0))
    .slice(0, 3)
    .map(v => ({
      url: v.url,
      hookScore: v.hookScore,
      viralityScore: v.viralityScore,
      summary: v.summary,
    }));

  // Collect top hooks
  const topHooks = analyzed
    .filter(a => a.hook && a.hookScore >= 7)
    .slice(0, 3)
    .map(a => a.hook.substring(0, 100));

  // Collect all improvements as common issues
  const allImprovements = analyzed.flatMap(a => a.improvements || []);
  const improvementCounts = {};
  for (const imp of allImprovements) {
    const key = imp.toLowerCase().slice(0, 50);
    improvementCounts[key] = (improvementCounts[key] || 0) + 1;
  }
  const commonIssues = Object.entries(improvementCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([issue]) => issue);

  // Content type breakdown
  const contentTypes = {};
  for (const a of analyzed) {
    if (a.contentType) {
      contentTypes[a.contentType] = (contentTypes[a.contentType] || 0) + 1;
    }
  }

  return {
    handle,
    platform,
    videosAnalyzed: analyzed.length,
    avgHookScore: Math.round(avgHookScore * 10) / 10,
    avgViralityScore: Math.round(avgViralityScore * 10) / 10,
    topVideos,
    topHooks,
    commonIssues,
    contentTypes,
  };
}

/**
 * Generate report section for video analysis (both TikTok and Instagram)
 * @param {Array} accountSummaries - Array of account summaries
 * @returns {string} Markdown report section
 */
export function generateVideoAnalysisReport(accountSummaries) {
  const lines = [];

  // Group by platform
  const tiktokSummaries = accountSummaries.filter(s => s.platform === 'tiktok');
  const instagramSummaries = accountSummaries.filter(s => s.platform === 'instagram');

  if (tiktokSummaries.length > 0) {
    lines.push('**TIKTOK VIDEO ANALYSIS:**');
    lines.push('');
    lines.push(...formatPlatformAnalysis(tiktokSummaries));
  }

  if (instagramSummaries.length > 0) {
    if (tiktokSummaries.length > 0) lines.push('');
    lines.push('**INSTAGRAM REELS ANALYSIS:**');
    lines.push('');
    lines.push(...formatPlatformAnalysis(instagramSummaries));
  }

  return lines.join('\n');
}

function formatPlatformAnalysis(summaries) {
  const lines = [];

  for (const summary of summaries) {
    if (summary.videosAnalyzed === 0) {
      lines.push(`• @${summary.handle}: No videos analyzed this week`);
      continue;
    }

    const hookEmoji = summary.avgHookScore >= 7 ? '🔥' : summary.avgHookScore >= 5 ? '👍' : '⚠️';
    const viralEmoji = summary.avgViralityScore >= 7 ? '🚀' : summary.avgViralityScore >= 5 ? '📈' : '📉';

    lines.push(`• @${summary.handle}: ${summary.videosAnalyzed} videos`);
    lines.push(`  ${hookEmoji} Hook Score: ${summary.avgHookScore}/10 | ${viralEmoji} Virality: ${summary.avgViralityScore}/10`);

    if (summary.topVideos.length > 0 && summary.topVideos[0].summary) {
      lines.push(`  Best: "${summary.topVideos[0].summary}"`);
    }

    if (summary.commonIssues.length > 0) {
      lines.push(`  Tips: ${summary.commonIssues[0]}`);
    }

    lines.push('');
  }

  return lines;
}
