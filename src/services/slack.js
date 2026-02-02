/**
 * Slack service for sending notifications
 * Supports both webhook URLs and bot tokens
 */

/**
 * Send a message to Slack
 * Supports webhook URL or bot token authentication
 * @param {string} message - The message content
 * @param {object} options - Additional options
 */
export async function sendSlackMessage(message, options = {}) {
  const webhookUrl = options.webhookUrl || process.env.SLACK_WEBHOOK_URL;
  const botToken = options.botToken || process.env.SLACK_BOT_TOKEN;
  const channel = options.channel || process.env.SLACK_CHANNEL || '#general';

  // Prefer webhook if available, otherwise use bot token
  if (webhookUrl) {
    return sendViaWebhook(webhookUrl, message, options);
  } else if (botToken) {
    return sendViaBotToken(botToken, channel, message, options);
  } else {
    throw new Error('SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN is required');
  }
}

/**
 * Send message via webhook
 */
async function sendViaWebhook(webhookUrl, message, options = {}) {
  const payload = {
    text: message,
    ...options.additionalFields,
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} - ${errorText}`);
  }

  console.log('Slack message sent via webhook');
  return true;
}

/**
 * Send message via bot token (Slack API)
 */
async function sendViaBotToken(botToken, channel, message, options = {}) {
  const payload = {
    channel,
    text: message,
  };

  // Add blocks if provided
  if (options.additionalFields?.blocks) {
    payload.blocks = options.additionalFields.blocks;
  }

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${botToken}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(`Slack API error: ${result.error}`);
  }

  console.log('Slack message sent via bot token');
  return true;
}

/**
 * Send a formatted report to Slack
 * Simple format: total numbers + top 3 channels
 * @param {string} report - The full report content (not used in simple format)
 * @param {string} sheetUrl - URL to the Google Sheet
 * @param {object} data - Raw data for generating simple report
 */
export async function sendSlackReport(report, sheetUrl = '', data = null) {
  // If we have raw data, generate simple summary
  let simpleReport;

  if (data && data.rawData) {
    const accounts = data.rawData;
    const totalImpressions = accounts.reduce((sum, a) => sum + (a.impressions || 0), 0);

    // Get top 3 by impressions
    const sorted = [...accounts]
      .filter(a => a.impressions > 0)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 3);

    const top3Text = sorted
      .map((a, i) => `${i + 1}. @${a.handle} (${a.platform}) - ${a.impressions.toLocaleString()}`)
      .join('\n');

    simpleReport = `*Total Impressions This Week:* ${totalImpressions.toLocaleString()}\n\n*Top 3 Channels:*\n${top3Text}`;
  } else {
    // Fallback to extracting from report text
    const totalMatch = report.match(/TOTAL IMPRESSIONS:\s*([\d,]+)/i);
    const total = totalMatch ? totalMatch[1] : 'N/A';
    simpleReport = `*Total Impressions This Week:* ${total}`;
  }

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Weekly Social Media Report',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: simpleReport,
      },
    },
  ];

  if (sheetUrl) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${sheetUrl}|View Full Data>`,
      },
    });
  }

  await sendSlackMessage('Weekly Social Media Report', {
    additionalFields: { blocks },
  });
}

/**
 * Send a simple notification to Slack
 */
export async function sendSlackNotification(title, message, type = 'info') {
  const emojis = {
    success: ':white_check_mark:',
    warning: ':warning:',
    error: ':x:',
    info: ':information_source:',
  };

  const emoji = emojis[type] || emojis.info;
  await sendSlackMessage(`${emoji} *${title}*\n${message}`);
}

/**
 * Send error notification to Slack
 */
export async function sendSlackError(error, context = '') {
  const message = [
    `*Error during:* ${context || 'Weekly report generation'}`,
    `*Message:* ${error.message}`,
    `*Time:* ${new Date().toISOString()}`,
  ].join('\n');

  try {
    await sendSlackNotification('Report Generation Failed', message, 'error');
  } catch (slackError) {
    console.error('Failed to send Slack error notification:', slackError.message);
  }
}
