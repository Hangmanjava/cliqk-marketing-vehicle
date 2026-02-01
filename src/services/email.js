import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { getAuthClient } from './google-auth.js';

/**
 * Email service using Google OAuth2
 * Configured for mycliqk.com Google Workspace
 */

let transporter = null;

/**
 * Initialize email transporter with OAuth2
 */
export async function initEmailService() {
  const auth = getAuthClient();
  const accessToken = await auth.getAccessToken();

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER || 'shawn@mycliqk.com',
      clientId: auth._clientId,
      clientSecret: auth._clientSecret,
      refreshToken: auth.credentials.refresh_token,
      accessToken: accessToken.token,
    },
  });

  console.log('Email service initialized with OAuth2');
  return transporter;
}

/**
 * Get the email transporter instance
 */
function getTransporter() {
  if (!transporter) {
    throw new Error('Email service not initialized. Call initEmailService first.');
  }
  return transporter;
}

/**
 * Send the weekly report email
 * @param {string} report - The report content (markdown)
 * @param {object} options - Email options
 */
export async function sendReportEmail(report, options = {}) {
  const mailer = getTransporter();

  const recipients = options.recipients ||
    process.env.EMAIL_RECIPIENTS ||
    '';

  if (!recipients) {
    throw new Error('No email recipients specified');
  }

  const recipientList = recipients.split(',').map(e => e.trim()).filter(Boolean);

  if (recipientList.length === 0) {
    throw new Error('No valid email recipients');
  }

  const weekDate = getWeekDateString();
  const htmlReport = convertMarkdownToHtml(report);

  const mailOptions = {
    from: process.env.GMAIL_USER || 'shawn@mycliqk.com',
    to: recipientList.join(', '),
    subject: `Weekly Social Media Report - ${weekDate}`,
    text: report,
    html: htmlReport,
  };

  try {
    const result = await mailer.sendMail(mailOptions);
    console.log(`Email sent successfully to ${recipientList.length} recipients`);
    console.log('Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    throw error;
  }
}

/**
 * Convert markdown to simple HTML
 */
function convertMarkdownToHtml(markdown) {
  let html = markdown
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #1a1a1a; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #333; margin-top: 25px; }
    h3 { color: #555; }
    li { margin: 5px 0; }
    a { color: #007bff; }
    .positive { color: #28a745; }
    .negative { color: #dc3545; }
    .neutral { color: #6c757d; }
  </style>
</head>
<body>
  <p>${html}</p>
</body>
</html>
  `.trim();
}

/**
 * Get formatted date string for the current week
 */
function getWeekDateString() {
  const now = new Date();
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return now.toLocaleDateString('en-US', options);
}

/**
 * Verify email configuration is working
 */
export async function verifyEmailConfig() {
  try {
    const mailer = getTransporter();
    await mailer.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error.message);
    return false;
  }
}
