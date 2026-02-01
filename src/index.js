import 'dotenv/config';

import { initApifyClient } from './services/apify-client.js';
import {
  initGoogleSheets,
  initializeSheetHeaders,
  appendRawData,
  updateSummarySheet,
  updateSentimentSheet,
  updateVideoAnalysisSheet,
  getLastWeekSummary,
} from './services/google-sheets.js';
import { initOpenAI, analyzeAllSentiment, calculateAggregateSentiment, compareSentiment } from './services/sentiment.js';
import { initEmailService, sendReportEmail } from './services/email.js';
import { sendSlackReport, sendSlackError } from './services/slack.js';

import { scrapeInstagram } from './scrapers/instagram.js';
import { scrapeTikTok } from './scrapers/tiktok.js';
import { scrapeYouTube } from './scrapers/youtube.js';
import { scrapeTwitter } from './scrapers/twitter.js';
import { scrapeLinkedIn } from './scrapers/linkedin.js';
import { scrapeReddit } from './scrapers/reddit.js';
import { scrapeBeehiiv } from './scrapers/beehiiv.js';

import { calculateTotals, calculateWeekOverWeek } from './utils/week-comparison.js';
import { generateReport } from './utils/report-generator.js';

/**
 * Main entry point for the social media tracker
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Cliqk Social Media Analytics - Weekly Report Generator');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  let tiktokVideoAnalyses = [];

  try {
    // Initialize services
    console.log('\n📦 Initializing services...');
    initApifyClient();
    await initGoogleSheets();
    initOpenAI();
    await initEmailService();

    // Initialize sheet headers if needed
    await initializeSheetHeaders();

    // Scrape all platforms
    console.log('\n🔍 Scraping social media accounts...');
    const allScrapedData = [];

    // Run scrapers sequentially to avoid rate limits
    console.log('\n--- Instagram ---');
    const instagramData = await scrapeInstagram();
    allScrapedData.push(...instagramData);

    console.log('\n--- TikTok ---');
    const tiktokResult = await scrapeTikTok();
    // TikTok now returns { profileData, videoAnalyses }
    allScrapedData.push(...tiktokResult.profileData);
    tiktokVideoAnalyses = tiktokResult.videoAnalyses || [];

    console.log('\n--- YouTube ---');
    const youtubeData = await scrapeYouTube();
    allScrapedData.push(...youtubeData);

    console.log('\n--- Twitter ---');
    const twitterData = await scrapeTwitter();
    allScrapedData.push(...twitterData);

    console.log('\n--- LinkedIn ---');
    const linkedinData = await scrapeLinkedIn();
    allScrapedData.push(...linkedinData);

    console.log('\n--- Reddit ---');
    const redditData = await scrapeReddit();
    allScrapedData.push(...redditData);

    console.log('\n--- Beehiiv ---');
    const beehiivData = await scrapeBeehiiv();
    allScrapedData.push(...beehiivData);

    console.log(`\n✅ Scraped ${allScrapedData.length} accounts total`);
    if (tiktokVideoAnalyses.length > 0) {
      const totalVideos = tiktokVideoAnalyses.reduce((sum, a) => sum + a.videosAnalyzed, 0);
      console.log(`✅ Analyzed ${totalVideos} TikTok videos for hooks & virality`);
    }

    // Save raw data to Google Sheets
    console.log('\n📊 Saving raw data to Google Sheets...');
    await appendRawData(allScrapedData);

    // Save video analysis data
    if (tiktokVideoAnalyses.length > 0) {
      await updateVideoAnalysisSheet(tiktokVideoAnalyses);
    }

    // Analyze sentiment
    console.log('\n🧠 Analyzing sentiment...');
    const sentimentResults = await analyzeAllSentiment(allScrapedData);
    const aggregateSentiment = calculateAggregateSentiment(sentimentResults);

    // Save sentiment data
    await updateSentimentSheet(sentimentResults);

    // Calculate totals
    console.log('\n📈 Calculating metrics...');
    const totals = calculateTotals(allScrapedData);

    // Get last week's data for comparison
    const lastWeekSummary = await getLastWeekSummary();
    const comparison = calculateWeekOverWeek(totals, lastWeekSummary);
    const sentimentComparison = compareSentiment(aggregateSentiment, lastWeekSummary?.sentiment);

    // Update summary sheet
    const summaryData = {
      ...totals,
      impressionChange: comparison.totalImpressionChange,
      impressionChangePercent: comparison.totalImpressionChangePercent,
      contentSentiment: aggregateSentiment.contentSentiment,
      audienceSentiment: aggregateSentiment.audienceSentiment,
    };
    await updateSummarySheet(summaryData);

    // Generate report
    console.log('\n📝 Generating report...');
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.GOOGLE_SHEET_ID}`;
    const reportData = {
      totals,
      comparison,
      sentiment: aggregateSentiment,
      sentimentComparison,
      rawData: allScrapedData,
      tiktokVideoAnalyses,
      sheetUrl,
    };
    const report = generateReport(reportData);

    console.log('\n' + '-'.repeat(60));
    console.log(report);
    console.log('-'.repeat(60));

    // Send email
    console.log('\n📧 Sending email report...');
    await sendReportEmail(report);

    // Send Slack notification
    console.log('\n💬 Sending Slack notification...');
    await sendSlackReport(report, sheetUrl);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Weekly report completed successfully!');
    console.log(`Finished at: ${new Date().toISOString()}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during report generation:', error);

    // Try to send error notification to Slack
    try {
      await sendSlackError(error, 'Weekly report generation');
    } catch {
      // Ignore Slack errors
    }

    process.exit(1);
  }
}

// Run main function
main();
