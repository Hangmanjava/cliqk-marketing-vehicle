/**
 * Week-over-week comparison utilities
 */

/**
 * Calculate week-over-week changes
 * @param {object} currentData - Current week's aggregated data
 * @param {object} lastWeekData - Last week's aggregated data
 * @returns {object} Comparison results
 */
export function calculateWeekOverWeek(currentData, lastWeekData) {
  if (!lastWeekData) {
    return {
      totalImpressionChange: 0,
      totalImpressionChangePercent: 0,
      platformChanges: {},
      trend: 'stable',
      isFirstWeek: true,
    };
  }

  // Calculate total impression change
  const totalImpressionChange = currentData.totalImpressions - lastWeekData.totalImpressions;
  const totalImpressionChangePercent = lastWeekData.totalImpressions > 0
    ? (totalImpressionChange / lastWeekData.totalImpressions) * 100
    : 0;

  // Calculate per-platform changes
  const platformChanges = {};
  const platforms = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'reddit', 'beehiiv'];

  for (const platform of platforms) {
    const current = currentData.byPlatform[platform]?.impressions || 0;
    const previous = lastWeekData.byPlatform?.[platform]?.impressions || 0;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    platformChanges[platform] = {
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 10) / 10,
      trend: getTrendDirection(change, previous),
    };
  }

  return {
    totalImpressionChange,
    totalImpressionChangePercent: Math.round(totalImpressionChangePercent * 10) / 10,
    platformChanges,
    trend: getTrendDirection(totalImpressionChange, lastWeekData.totalImpressions),
    isFirstWeek: false,
  };
}

/**
 * Get trend direction symbol
 * @param {number} change - The change value
 * @param {number} baseline - The baseline value
 * @returns {string} Trend direction: '↑', '↓', or '→'
 */
export function getTrendDirection(change, baseline) {
  if (baseline === 0) return '→';

  const percentChange = (change / baseline) * 100;

  if (percentChange >= 2) return '↑';
  if (percentChange <= -2) return '↓';
  return '→';
}

/**
 * Format change for display
 * @param {number} change - The change value
 * @param {number} changePercent - The percentage change
 * @returns {string} Formatted string like "+10,000 (+5.2%)"
 */
export function formatChange(change, changePercent) {
  const sign = change >= 0 ? '+' : '';
  const formattedChange = formatNumber(change);
  const formattedPercent = `${sign}${changePercent.toFixed(1)}%`;

  return `${sign}${formattedChange} (${formattedPercent})`;
}

/**
 * Format a number with commas
 * @param {number} num - The number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}

/**
 * Calculate top performers from scraped data
 * @param {Array} data - Array of scraped account data
 * @param {number} count - Number of top performers to return
 * @returns {Array} Top performing accounts
 */
export function getTopPerformers(data, count = 3) {
  return data
    .filter(account => !account.error && account.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, count)
    .map(account => ({
      platform: account.platform,
      handle: account.handle,
      impressions: account.impressions,
      formattedImpressions: formatNumber(account.impressions),
    }));
}

/**
 * Find accounts that need attention (declining performance)
 * @param {Array} currentData - Current week's data
 * @param {object} comparison - Week-over-week comparison
 * @returns {Array} Accounts needing attention
 */
export function getAccountsNeedingAttention(currentData, comparison) {
  if (comparison.isFirstWeek) {
    return [];
  }

  // Find accounts with significant declines
  const needsAttention = [];

  for (const [platform, changes] of Object.entries(comparison.platformChanges)) {
    if (changes.changePercent <= -10 && changes.previous > 0) {
      needsAttention.push({
        platform,
        changePercent: changes.changePercent,
        message: `${platform} down ${Math.abs(changes.changePercent)}% this week`,
      });
    }
  }

  return needsAttention;
}

/**
 * Aggregate data by platform
 * @param {Array} data - Array of scraped account data
 * @returns {object} Aggregated data by platform
 */
export function aggregateByPlatform(data) {
  const byPlatform = {};

  for (const account of data) {
    const platform = account.platform;

    if (!byPlatform[platform]) {
      byPlatform[platform] = {
        impressions: 0,
        engagement: 0,
        accounts: 0,
        accountList: [],
      };
    }

    byPlatform[platform].impressions += account.impressions || 0;
    byPlatform[platform].engagement += account.engagement || 0;
    byPlatform[platform].accounts += 1;
    byPlatform[platform].accountList.push(account.handle);
  }

  return byPlatform;
}

/**
 * Calculate total metrics from scraped data
 * @param {Array} data - Array of scraped account data
 * @returns {object} Total metrics
 */
export function calculateTotals(data) {
  const byPlatform = aggregateByPlatform(data);

  let totalImpressions = 0;
  let totalEngagement = 0;
  let totalAccounts = 0;

  for (const platform of Object.values(byPlatform)) {
    totalImpressions += platform.impressions;
    totalEngagement += platform.engagement;
    totalAccounts += platform.accounts;
  }

  return {
    totalImpressions,
    totalEngagement,
    totalAccounts,
    byPlatform,
  };
}
