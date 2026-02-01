import { google } from 'googleapis';

/**
 * Google Sheets API integration for storing and retrieving data
 */

let sheets = null;
let auth = null;

/**
 * Initialize Google Sheets client with service account credentials
 */
export async function initGoogleSheets(credentials = process.env.GOOGLE_CREDENTIALS) {
  if (!credentials) {
    throw new Error('GOOGLE_CREDENTIALS is required');
  }

  // Credentials can be base64 encoded JSON or raw JSON
  let credentialsJson;
  try {
    // Try base64 decode first
    credentialsJson = JSON.parse(Buffer.from(credentials, 'base64').toString('utf-8'));
  } catch {
    // If that fails, try parsing as raw JSON
    try {
      credentialsJson = JSON.parse(credentials);
    } catch {
      throw new Error('Invalid GOOGLE_CREDENTIALS format - must be base64 encoded or raw JSON');
    }
  }

  auth = new google.auth.GoogleAuth({
    credentials: credentialsJson,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

/**
 * Get the Google Sheets client instance
 */
export function getSheetsClient() {
  if (!sheets) {
    throw new Error('Google Sheets client not initialized. Call initGoogleSheets first.');
  }
  return sheets;
}

/**
 * Get the sheet ID from environment
 */
function getSheetId() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error('GOOGLE_SHEET_ID is required');
  }
  return sheetId;
}

/**
 * Append raw data to the "Raw Data" sheet
 * @param {Array} data - Array of scraped account data
 */
export async function appendRawData(data) {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  const weekDate = getWeekStartDate();

  // Prepare rows for insertion
  const rows = data.map(item => [
    weekDate,
    item.platform,
    item.type || 'account',
    item.handle,
    item.url || '',
    item.impressions || 0,
    item.engagement || 0,
    item.followers || item.subscribers || item.connections || 0,
    item.likes || item.reactions || item.upvotes || 0,
    item.comments || 0,
    item.shares || item.retweets || 0,
    item.error || '',
    item.scrapedAt,
  ]);

  // Append to "Raw Data" sheet
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Raw Data!A:M',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows,
    },
  });

  console.log(`Appended ${rows.length} rows to Raw Data sheet`);
}

/**
 * Update the summary sheet with aggregated data
 * @param {object} summary - Summary data object
 */
export async function updateSummarySheet(summary) {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  const weekDate = getWeekStartDate();

  // Summary row format
  const summaryRow = [
    weekDate,
    summary.totalImpressions,
    summary.totalEngagement,
    summary.impressionChange,
    summary.impressionChangePercent,
    summary.byPlatform.instagram?.impressions || 0,
    summary.byPlatform.tiktok?.impressions || 0,
    summary.byPlatform.youtube?.impressions || 0,
    summary.byPlatform.twitter?.impressions || 0,
    summary.byPlatform.linkedin?.impressions || 0,
    summary.byPlatform.reddit?.impressions || 0,
    summary.byPlatform.beehiiv?.impressions || 0,
    summary.contentSentiment?.score || 0,
    summary.contentSentiment?.label || 'N/A',
    summary.audienceSentiment?.score || 0,
    summary.audienceSentiment?.label || 'N/A',
  ];

  // Append to "Summary" sheet
  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Summary!A:P',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [summaryRow],
    },
  });

  console.log('Updated Summary sheet');
}

/**
 * Update the sentiment sheet with per-account sentiment data
 * @param {Array} sentimentData - Array of sentiment results
 */
export async function updateSentimentSheet(sentimentData) {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  const weekDate = getWeekStartDate();

  const rows = sentimentData.map(item => [
    weekDate,
    item.platform,
    item.handle,
    item.contentSentiment?.score || 0,
    item.contentSentiment?.label || 'N/A',
    item.audienceSentiment?.score || 0,
    item.audienceSentiment?.label || 'N/A',
  ]);

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sentiment!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows,
    },
  });

  console.log(`Updated Sentiment sheet with ${rows.length} rows`);
}

/**
 * Update the video analysis sheet with TikTok hook/virality data
 * @param {Array} videoAnalyses - Array of video analysis results per account
 */
export async function updateVideoAnalysisSheet(videoAnalyses) {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  const weekDate = getWeekStartDate();

  const rows = [];

  for (const analysis of videoAnalyses) {
    // Add summary row for account
    rows.push([
      weekDate,
      'tiktok',
      analysis.handle,
      'summary',
      analysis.videosAnalyzed,
      analysis.avgHookScore || 0,
      analysis.avgViralityScore || 0,
      '', // URL
      '', // Hook text
      analysis.commonIssues?.join('; ') || '',
    ]);

    // Add individual video rows
    if (analysis.topVideos) {
      for (const video of analysis.topVideos) {
        rows.push([
          weekDate,
          'tiktok',
          analysis.handle,
          'video',
          1,
          video.hookScore || 0,
          video.viralityScore || 0,
          video.url || '',
          '', // Hook text would go here
          video.summary || '',
        ]);
      }
    }
  }

  if (rows.length === 0) {
    console.log('No video analysis data to save');
    return;
  }

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Video Analysis!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows,
    },
  });

  console.log(`Updated Video Analysis sheet with ${rows.length} rows`);
}

/**
 * Get last week's summary data for comparison
 * @returns {object|null} Last week's summary or null if not found
 */
export async function getLastWeekSummary() {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Summary!A:P',
    });

    const rows = response.data.values || [];

    if (rows.length < 2) {
      return null; // No previous data (only header or empty)
    }

    // Get the last row (most recent week)
    const lastRow = rows[rows.length - 1];

    return {
      weekDate: lastRow[0],
      totalImpressions: parseFloat(lastRow[1]) || 0,
      totalEngagement: parseFloat(lastRow[2]) || 0,
      byPlatform: {
        instagram: { impressions: parseFloat(lastRow[5]) || 0 },
        tiktok: { impressions: parseFloat(lastRow[6]) || 0 },
        youtube: { impressions: parseFloat(lastRow[7]) || 0 },
        twitter: { impressions: parseFloat(lastRow[8]) || 0 },
        linkedin: { impressions: parseFloat(lastRow[9]) || 0 },
        reddit: { impressions: parseFloat(lastRow[10]) || 0 },
        beehiiv: { impressions: parseFloat(lastRow[11]) || 0 },
      },
    };
  } catch (error) {
    console.error('Error fetching last week summary:', error.message);
    return null;
  }
}

/**
 * Get raw data for a specific week
 * @param {string} weekDate - Week start date (YYYY-MM-DD)
 * @returns {Array} Array of raw data rows
 */
export async function getRawDataForWeek(weekDate) {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Raw Data!A:M',
    });

    const rows = response.data.values || [];

    // Filter rows for the specified week
    return rows.filter(row => row[0] === weekDate);
  } catch (error) {
    console.error('Error fetching raw data:', error.message);
    return [];
  }
}

/**
 * Initialize sheet headers if they don't exist
 */
export async function initializeSheetHeaders() {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  // Raw Data headers
  const rawDataHeaders = [
    'Week', 'Platform', 'Type', 'Handle', 'URL', 'Impressions', 'Engagement',
    'Followers', 'Likes', 'Comments', 'Shares', 'Error', 'Scraped At'
  ];

  // Summary headers
  const summaryHeaders = [
    'Week', 'Total Impressions', 'Total Engagement', 'Impression Change',
    'Change %', 'Instagram', 'TikTok', 'YouTube', 'Twitter', 'LinkedIn',
    'Reddit', 'Beehiiv', 'Content Sentiment Score', 'Content Sentiment Label',
    'Audience Sentiment Score', 'Audience Sentiment Label'
  ];

  // Sentiment headers
  const sentimentHeaders = [
    'Week', 'Platform', 'Handle', 'Content Score', 'Content Label',
    'Audience Score', 'Audience Label'
  ];

  // Video Analysis headers
  const videoAnalysisHeaders = [
    'Week', 'Platform', 'Handle', 'Type', 'Videos', 'Hook Score',
    'Virality Score', 'URL', 'Hook Text', 'Notes'
  ];

  try {
    // Check if headers exist, if not add them
    const rawCheck = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Raw Data!A1:M1',
    });

    if (!rawCheck.data.values || rawCheck.data.values.length === 0) {
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Raw Data!A1:M1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rawDataHeaders] },
      });
    }

    const summaryCheck = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Summary!A1:P1',
    });

    if (!summaryCheck.data.values || summaryCheck.data.values.length === 0) {
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Summary!A1:P1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [summaryHeaders] },
      });
    }

    const sentimentCheck = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sentiment!A1:G1',
    });

    if (!sentimentCheck.data.values || sentimentCheck.data.values.length === 0) {
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Sentiment!A1:G1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [sentimentHeaders] },
      });
    }

    // Video Analysis sheet
    try {
      const videoCheck = await sheetsClient.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Video Analysis!A1:J1',
      });

      if (!videoCheck.data.values || videoCheck.data.values.length === 0) {
        await sheetsClient.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: 'Video Analysis!A1:J1',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [videoAnalysisHeaders] },
        });
      }
    } catch {
      // Sheet might not exist yet - that's okay
    }

    console.log('Sheet headers initialized');
  } catch (error) {
    console.error('Error initializing headers:', error.message);
    // Headers might not exist if sheets aren't created yet
    // This is expected on first run
  }
}

/**
 * Get the start date of the current week (Sunday)
 * @returns {string} Date in YYYY-MM-DD format
 */
function getWeekStartDate() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  return startOfWeek.toISOString().split('T')[0];
}
