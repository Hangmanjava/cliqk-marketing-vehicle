import { google } from 'googleapis';
import { initGoogleAuth, getAuthClient } from './google-auth.js';

/**
 * Google Sheets API integration for storing and retrieving data
 */

let sheets = null;

/**
 * Initialize Google Sheets client
 */
export async function initGoogleSheets() {
  await initGoogleAuth();
  const auth = getAuthClient();
  sheets = google.sheets({ version: 'v4', auth });
  console.log('Google Sheets client initialized');
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
 * Update the sentiment sheet with per-platform sentiment data (aggregated)
 * @param {Array} sentimentData - Array of sentiment results per account
 */
export async function updateSentimentSheet(sentimentData) {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  const weekDate = getWeekStartDate();

  // Aggregate sentiment by platform
  const platformSentiment = {};

  for (const item of sentimentData) {
    const platform = item.platform;
    if (!platformSentiment[platform]) {
      platformSentiment[platform] = {
        contentScores: [],
        audienceScores: [],
        accountCount: 0,
      };
    }

    platformSentiment[platform].accountCount++;

    if (item.contentSentiment?.score !== undefined) {
      platformSentiment[platform].contentScores.push(item.contentSentiment.score);
    }
    if (item.audienceSentiment?.score !== undefined) {
      platformSentiment[platform].audienceScores.push(item.audienceSentiment.score);
    }
  }

  // Calculate averages and create rows
  const rows = Object.entries(platformSentiment).map(([platform, data]) => {
    const avgContentScore = data.contentScores.length > 0
      ? data.contentScores.reduce((a, b) => a + b, 0) / data.contentScores.length
      : 0;
    const avgAudienceScore = data.audienceScores.length > 0
      ? data.audienceScores.reduce((a, b) => a + b, 0) / data.audienceScores.length
      : 0;

    const contentLabel = avgContentScore > 0.2 ? 'Positive' : avgContentScore < -0.2 ? 'Negative' : 'Neutral';
    const audienceLabel = avgAudienceScore > 0.2 ? 'Positive' : avgAudienceScore < -0.2 ? 'Negative' : 'Neutral';

    return [
      weekDate,
      platform,
      data.accountCount, // Number of accounts in this platform
      Math.round(avgContentScore * 100) / 100,
      contentLabel,
      Math.round(avgAudienceScore * 100) / 100,
      audienceLabel,
    ];
  });

  await sheetsClient.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sentiment!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: rows,
    },
  });

  console.log(`Updated Sentiment sheet with ${rows.length} platform rows`);
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
 * Create sheets if they don't exist
 */
async function ensureSheetsExist() {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  const requiredSheets = ['Raw Data', 'Summary', 'Sentiment', 'Video Analysis'];

  try {
    // Get existing sheets
    const spreadsheet = await sheetsClient.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);

    // Find sheets that need to be created
    const sheetsToCreate = requiredSheets.filter(name => !existingSheets.includes(name));

    if (sheetsToCreate.length > 0) {
      console.log(`Creating sheets: ${sheetsToCreate.join(', ')}`);

      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: sheetsToCreate.map(title => ({
            addSheet: {
              properties: { title },
            },
          })),
        },
      });

      console.log('Sheets created successfully');
    }
  } catch (error) {
    console.error('Error ensuring sheets exist:', error.message);
    throw error;
  }
}

/**
 * Initialize sheet headers if they don't exist
 */
export async function initializeSheetHeaders() {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  // First ensure all required sheets exist
  await ensureSheetsExist();

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

  // Sentiment headers (aggregated by platform)
  const sentimentHeaders = [
    'Week', 'Platform', 'Accounts', 'Content Score', 'Content Label',
    'Audience Score', 'Audience Label'
  ];

  // Video Analysis headers
  const videoAnalysisHeaders = [
    'Week', 'Platform', 'Handle', 'Type', 'Videos', 'Hook Score',
    'Virality Score', 'URL', 'Hook Text', 'Notes'
  ];

  try {
    // Add headers to each sheet
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Raw Data!A1:M1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rawDataHeaders] },
    });

    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Summary!A1:P1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [summaryHeaders] },
    });

    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Sentiment!A1:G1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [sentimentHeaders] },
    });

    await sheetsClient.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Video Analysis!A1:J1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [videoAnalysisHeaders] },
    });

    console.log('Sheet headers initialized');
  } catch (error) {
    console.error('Error initializing headers:', error.message);
    throw error;
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

/**
 * Get LinkedIn impressions from the form responses (first sheet)
 * The form collects: Timestamp, Email, Name, LinkedIn Handle, Impressions
 * @returns {Promise<Array>} Array of { name, handle, impressions, email, timestamp }
 */
export async function getLinkedInFormResponses() {
  const sheetsClient = getSheetsClient();
  const sheetId = getSheetId();

  try {
    // Get all sheets to find the first one (form responses)
    const spreadsheet = await sheetsClient.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const firstSheet = spreadsheet.data.sheets[0]?.properties?.title;
    if (!firstSheet) {
      console.log('No sheets found in spreadsheet');
      return [];
    }

    console.log(`Reading LinkedIn data from sheet: "${firstSheet}"`);

    // Read data from first sheet
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${firstSheet}'!A:Z`,
    });

    const rows = response.data.values || [];

    if (rows.length < 2) {
      console.log('No LinkedIn form responses found');
      return [];
    }

    // Get header row to understand column positions
    const headers = rows[0].map(h => h?.toString().toLowerCase().trim() || '');

    // Find relevant columns
    const timestampCol = headers.findIndex(h => h.includes('timestamp') || h.includes('date') || h.includes('time'));
    const emailCol = headers.findIndex(h => h.includes('email'));
    const nameCol = headers.findIndex(h => h.includes('name') && !h.includes('username'));

    // LinkedIn column could be the impressions (if named "linkedin") or a separate "impressions" column
    let impressionsCol = headers.findIndex(h => h.includes('impression') || h.includes('views'));
    if (impressionsCol === -1) {
      // Check if there's a column named just "linkedin" which likely contains impressions
      impressionsCol = headers.findIndex(h => h === 'linkedin');
    }

    // Handle column is separate from impressions
    const handleCol = headers.findIndex(h => h.includes('handle') || h.includes('username'));

    console.log(`  Found columns - timestamp:${timestampCol}, email:${emailCol}, name:${nameCol}, handle:${handleCol}, impressions:${impressionsCol}`);

    // Get start of current week (Saturday when form is sent)
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Saturday is day 6, so calculate days since last Saturday
    const daysSinceSaturday = (dayOfWeek + 1) % 7;
    const saturdayThisWeek = new Date(now);
    saturdayThisWeek.setDate(now.getDate() - daysSinceSaturday);
    saturdayThisWeek.setHours(0, 0, 0, 0);

    // Get start of last week (for fallback if no current week data)
    const saturdayLastWeek = new Date(saturdayThisWeek);
    saturdayLastWeek.setDate(saturdayLastWeek.getDate() - 7);

    const results = [];
    const resultsLastWeek = [];

    // Process data rows (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      const timestamp = timestampCol >= 0 ? row[timestampCol] : null;
      let submissionDate = null;

      if (timestamp) {
        submissionDate = new Date(timestamp);
      }

      // Parse impressions - handle various formats
      const impressionsValue = impressionsCol >= 0 ? row[impressionsCol] : null;
      let impressions = 0;

      if (impressionsValue) {
        // Remove non-numeric characters except digits
        const numericStr = impressionsValue.toString().replace(/[^0-9]/g, '');
        impressions = parseInt(numericStr, 10) || 0;

        // If it looks like a URL or name (no valid number), set to 0
        if (impressionsValue.includes('http') || impressionsValue.includes('linkedin.com')) {
          impressions = 0;
        }
      }

      const entry = {
        timestamp: timestamp || '',
        email: (emailCol >= 0 ? row[emailCol] : '').trim(),
        name: (nameCol >= 0 ? row[nameCol] : '').trim(),
        handle: handleCol >= 0 ? row[handleCol] : '',
        impressions,
      };

      // Categorize by week
      if (submissionDate && submissionDate >= saturdayThisWeek) {
        results.push(entry);
      } else if (submissionDate && submissionDate >= saturdayLastWeek) {
        resultsLastWeek.push(entry);
      }
    }

    // If no current week data, use last week's data
    if (results.length === 0 && resultsLastWeek.length > 0) {
      console.log(`  No current week submissions, using last week's data (${resultsLastWeek.length} entries)`);
      return resultsLastWeek;
    }

    console.log(`  Found ${results.length} LinkedIn submissions this week`);
    return results;
  } catch (error) {
    console.error('Error reading LinkedIn form responses:', error.message);
    return [];
  }
}
