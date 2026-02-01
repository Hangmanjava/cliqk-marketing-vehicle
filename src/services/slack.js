/**
 * Slack webhook service for sending notifications
 */

/**
 * Send a message to Slack via webhook
 * @param {string} message - The message content
 * @param {object} options - Additional options
 */
export async function sendSlackMessage(message, options = {}) {
  const webhookUrl = options.webhookUrl || process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL is required');
  }

  const payload = {
    text: message,
    ...options.additionalFields,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack webhook failed: ${response.status} - ${errorText}`);
    }

    console.log('Slack message sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send Slack message:', error.message);
    throw error;
  }
}

/**
 * Send a formatted report to Slack
 * @param {string} report - The report content (markdown)
 * @param {string} sheetUrl - URL to the Google Sheet
 */
export async function sendSlackReport(report, sheetUrl = '') {
  // Slack uses mrkdwn format, which is slightly different from markdown
  // Convert some common patterns
  const slackFormatted = report
    // Convert markdown bold to Slack bold
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    // Convert markdown links to Slack links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');

  // Build the message with blocks for better formatting
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 Weekly Social Media Report',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: slackFormatted,
      },
    },
  ];

  // Add link to Google Sheet if provided
  if (sheetUrl) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📄 <${sheetUrl}|View Full Data in Google Sheets>`,
      },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Generated on ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST`,
      },
    ],
  });

  await sendSlackMessage('Weekly Social Media Report', {
    additionalFields: { blocks },
  });
}

/**
 * Send a simple notification to Slack
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Type: 'success', 'warning', 'error'
 */
export async function sendSlackNotification(title, message, type = 'info') {
  const emojis = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
  };

  const emoji = emojis[type] || emojis.info;

  await sendSlackMessage(`${emoji} *${title}*\n${message}`);
}

/**
 * Send error notification to Slack
 * @param {Error} error - The error object
 * @param {string} context - Context about what was happening
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
    // Don't throw if Slack notification fails
    console.error('Failed to send Slack error notification:', slackError.message);
  }
}
