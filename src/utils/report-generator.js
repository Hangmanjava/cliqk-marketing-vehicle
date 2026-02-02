import { platformNames } from '../config/accounts.js';
import {
  formatNumber,
  formatChange,
  getTrendDirection,
  getTopPerformers,
  getAccountsNeedingAttention,
} from './week-comparison.js';

/**
 * Generate the weekly report in markdown format
 * @param {object} data - All aggregated data
 * @returns {string} Markdown formatted report
 */
export function generateReport(data) {
  const {
    totals,
    comparison,
    sentiment,
    sentimentComparison,
    allVideoAnalyses,
    rawData,
    sheetUrl,
  } = data;

  const weekDate = getWeekDateString();
  const lines = [];

  // Header
  lines.push('📊 Weekly Social Media Report');
  lines.push(`Week of ${weekDate}`);
  lines.push('');

  // Total Impressions
  const totalTrend = comparison.trend || '→';
  const totalChange = comparison.isFirstWeek
    ? ''
    : ` (${totalTrend} ${formatChangeShort(comparison.totalImpressionChangePercent)}% from last week)`;

  lines.push(`**TOTAL IMPRESSIONS:** ${formatNumber(totals.totalImpressions)}${totalChange}`);
  lines.push('');

  // By Platform
  lines.push('**BY PLATFORM:**');
  const platformOrder = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'reddit', 'beehiiv'];

  for (const platform of platformOrder) {
    const platformData = totals.byPlatform[platform];
    if (!platformData) continue;

    const name = platformNames[platform] || platform;
    const count = platformData.accounts;
    const impressions = formatNumber(platformData.impressions);

    let changeStr = '';
    if (!comparison.isFirstWeek && comparison.platformChanges[platform]) {
      const change = comparison.platformChanges[platform];
      changeStr = ` (${formatChangeShort(change.changePercent)}%)`;
    }

    lines.push(`• ${name} (${count}): ${impressions}${changeStr}`);
  }
  lines.push('');

  // Sentiment Analysis
  lines.push('**SENTIMENT ANALYSIS:**');

  if (sentiment) {
    const contentLabel = sentiment.contentSentiment?.label || 'N/A';
    const contentScore = sentiment.contentSentiment?.score?.toFixed(2) || '0.00';
    const audienceLabel = sentiment.audienceSentiment?.label || 'N/A';
    const audienceScore = sentiment.audienceSentiment?.score?.toFixed(2) || '0.00';

    lines.push(`• Your Content: ${contentLabel} (score: ${contentScore})`);
    lines.push(`• Audience Comments: ${audienceLabel} (score: ${audienceScore})`);

    if (sentimentComparison) {
      const trendMap = {
        improving: '↑ Improving',
        stable: '→ Stable',
        declining: '↓ Declining',
      };
      const contentTrend = trendMap[sentimentComparison.contentTrend] || '→ Stable';
      lines.push(`• Week-over-Week: ${contentTrend}`);
    }
  } else {
    lines.push('• Sentiment data not available');
  }
  lines.push('');

  // Video Analysis (TikTok + Instagram Reels)
  if (allVideoAnalyses && allVideoAnalyses.length > 0) {
    const tiktokAnalyses = allVideoAnalyses.filter(a => a.platform === 'tiktok' && a.videosAnalyzed > 0);
    const instagramAnalyses = allVideoAnalyses.filter(a => a.platform === 'instagram' && a.videosAnalyzed > 0);

    if (tiktokAnalyses.length > 0) {
      lines.push('**TIKTOK VIDEO ANALYSIS:**');
      for (const analysis of tiktokAnalyses) {
        lines.push(...formatVideoAnalysis(analysis));
      }
      lines.push('');
    }

    if (instagramAnalyses.length > 0) {
      lines.push('**INSTAGRAM REELS ANALYSIS:**');
      for (const analysis of instagramAnalyses) {
        lines.push(...formatVideoAnalysis(analysis));
      }
      lines.push('');
    }
  }

  // LinkedIn Submission Status
  const linkedInData = rawData?.filter(a => a.platform === 'linkedin') || [];
  const linkedInSubmitted = linkedInData.filter(a => a.submitted);
  const linkedInNotSubmitted = linkedInData.filter(a => !a.submitted && a.type === 'profile');

  if (linkedInData.length > 0) {
    const totalLinkedInImpressions = linkedInData.reduce((sum, a) => sum + (a.impressions || 0), 0);
    if (totalLinkedInImpressions > 0) {
      lines.push('**LINKEDIN SUBMISSIONS:**');
      lines.push(`• Total: ${formatNumber(totalLinkedInImpressions)} impressions from ${linkedInSubmitted.length} team members`);
      if (linkedInNotSubmitted.length > 0) {
        const names = linkedInNotSubmitted.slice(0, 3).map(a => a.name).join(', ');
        const more = linkedInNotSubmitted.length > 3 ? ` +${linkedInNotSubmitted.length - 3} more` : '';
        lines.push(`• Not yet submitted: ${names}${more}`);
      }
      lines.push('');
    }
  }

  // Top Performers
  const topPerformers = getTopPerformers(data.rawData || [], 3);
  if (topPerformers.length > 0) {
    lines.push('**TOP PERFORMERS:**');
    topPerformers.forEach((account, index) => {
      lines.push(`${index + 1}. @${account.handle} - ${account.formattedImpressions} impressions`);
    });
    lines.push('');
  }

  // Needs Attention
  const needsAttention = getAccountsNeedingAttention(data.rawData || [], comparison);
  if (needsAttention.length > 0) {
    lines.push('**NEEDS ATTENTION:**');
    for (const item of needsAttention) {
      lines.push(`• ${item.message}`);
    }
    lines.push('');
  }

  // Link to full data
  if (sheetUrl) {
    lines.push(`Full data: ${sheetUrl}`);
  }

  return lines.join('\n');
}

/**
 * Generate a shorter summary for Slack
 * @param {object} data - All aggregated data
 * @returns {string} Short summary
 */
export function generateSlackSummary(data) {
  const { totals, comparison, sentiment } = data;

  const weekDate = getWeekDateString();
  const lines = [];

  lines.push(`*Week of ${weekDate}*`);
  lines.push('');

  // Total
  const changeStr = comparison.isFirstWeek
    ? ''
    : ` (${formatChangeShort(comparison.totalImpressionChangePercent)}%)`;
  lines.push(`*Total Impressions:* ${formatNumber(totals.totalImpressions)}${changeStr}`);

  // Quick platform breakdown
  const platformSummary = [];
  const platformOrder = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'reddit'];

  for (const platform of platformOrder) {
    const platformData = totals.byPlatform[platform];
    if (platformData && platformData.impressions > 0) {
      const short = platform.charAt(0).toUpperCase() + platform.slice(1, 3);
      platformSummary.push(`${short}: ${formatNumber(platformData.impressions)}`);
    }
  }
  lines.push(platformSummary.join(' | '));

  // Sentiment one-liner
  if (sentiment?.contentSentiment) {
    const emoji = sentiment.contentSentiment.label === 'Positive' ? '😊' :
      sentiment.contentSentiment.label === 'Negative' ? '😟' : '😐';
    lines.push(`Sentiment: ${emoji} ${sentiment.contentSentiment.label}`);
  }

  return lines.join('\n');
}

/**
 * Format video analysis for report
 */
function formatVideoAnalysis(analysis) {
  const lines = [];
  const hookEmoji = analysis.avgHookScore >= 7 ? '🔥' : analysis.avgHookScore >= 5 ? '👍' : '⚠️';
  const viralEmoji = analysis.avgViralityScore >= 7 ? '🚀' : analysis.avgViralityScore >= 5 ? '📈' : '📉';

  lines.push(`• @${analysis.handle}: ${analysis.videosAnalyzed} videos`);
  lines.push(`  ${hookEmoji} Hook: ${analysis.avgHookScore}/10 | ${viralEmoji} Virality: ${analysis.avgViralityScore}/10`);

  if (analysis.topVideos?.length > 0 && analysis.topVideos[0].summary) {
    lines.push(`  Best: "${analysis.topVideos[0].summary}"`);
  }

  if (analysis.commonIssues?.length > 0) {
    lines.push(`  Tip: ${analysis.commonIssues[0]}`);
  }

  return lines;
}

/**
 * Format percentage change with sign
 * @param {number} percent - Percentage change
 * @returns {string} Formatted string like "+5.2" or "-3.1"
 */
function formatChangeShort(percent) {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}`;
}

/**
 * Get formatted date string for the current week
 * @returns {string} Formatted date string
 */
function getWeekDateString() {
  const now = new Date();
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return now.toLocaleDateString('en-US', options);
}

/**
 * Generate HTML report for email
 * @param {object} data - All aggregated data
 * @returns {string} HTML formatted report
 */
export function generateHtmlReport(data) {
  const markdown = generateReport(data);
  // The email service will handle markdown to HTML conversion
  return markdown;
}
