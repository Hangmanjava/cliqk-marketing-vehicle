/**
 * Lambda handlers for social-media-tracker automations
 */

import { runDailyTweetSuggestions } from './services/tweet-suggester.js';
import { runFullHealthCheck } from './services/apify-health-check.js';

// Import the main weekly report function
import { generateWeeklyReport } from './index.js';

// Import LinkedIn reminder functions
import { sendInitialRequest, sendReminder } from './linkedin-reminder.js';

/**
 * Daily Tweet Suggestions Handler
 */
export async function dailyTweetsHandler(event) {
  console.log('Starting daily tweet suggestions...');

  try {
    const result = await runDailyTweetSuggestions();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Daily tweet suggestions generated',
        suggestions: result.suggestions?.length || 0
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * Apify Health Check Handler
 */
export async function healthCheckHandler(event) {
  console.log('Starting Apify health check...');

  try {
    const results = await runFullHealthCheck();

    const criticalFailures = Object.entries(results.platforms)
      .filter(([_, result]) => result.status === 'failed')
      .map(([platform]) => platform);

    return {
      statusCode: criticalFailures.length > 0 ? 500 : 200,
      body: JSON.stringify({
        message: 'Health check completed',
        criticalFailures,
        results
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * Weekly Report Handler
 */
export async function weeklyReportHandler(event) {
  console.log('Starting weekly social media report...');

  try {
    await generateWeeklyReport();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Weekly report generated and sent'
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * LinkedIn Initial Request Handler
 */
export async function linkedinInitialHandler(event) {
  console.log('Starting LinkedIn initial request...');

  try {
    await sendInitialRequest();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'LinkedIn initial request sent'
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * LinkedIn Reminder Handler
 */
export async function linkedinReminderHandler(event) {
  console.log('Starting LinkedIn reminder...');

  try {
    await sendReminder();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'LinkedIn reminder sent'
      })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * Main handler - routes to specific handler based on event.job
 */
export async function handler(event) {
  const job = event.job || 'weekly-report';

  console.log(`Running job: ${job}`);

  switch (job) {
    case 'daily-tweets':
      return dailyTweetsHandler(event);
    case 'health-check':
      return healthCheckHandler(event);
    case 'weekly-report':
      return weeklyReportHandler(event);
    case 'linkedin-initial':
      return linkedinInitialHandler(event);
    case 'linkedin-reminder':
      return linkedinReminderHandler(event);
    default:
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Unknown job: ${job}` })
      };
  }
}
