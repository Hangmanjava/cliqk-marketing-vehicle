import nodemailer from 'nodemailer';

/**
 * Google Workspace email service for sending reports
 * Configured for mycliqk.com domain
 */

let transporter = null;

/**
 * Initialize Google Workspace email transporter
 * For mycliqk.com Google Workspace accounts
 */
export function initEmailService(
  user = process.env.GMAIL_USER,
  appPassword = process.env.GMAIL_APP_PASSWORD
) {
  if (!user || !appPassword) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD are required');
  }

  // Google Workspace uses the same SMTP settings as Gmail
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass: appPassword,
    },
  });

  return transporter;
}

/**
 * Get the email transporter instance
 */
function getTransporter() {
  if (!transporter) {
    initEmailService();
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

  // Convert markdown to simple HTML
  const htmlReport = convertMarkdownToHtml(report);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientList.join(', '),
    subject: `📊 Weekly Social Media Report - ${weekDate}`,
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
 * @param {string} markdown - Markdown content
 * @returns {string} HTML content
 */
function convertMarkdownToHtml(markdown) {
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in basic HTML structure with styling
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
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
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
 * @returns {string} Formatted date string
 */
function getWeekDateString() {
  const now = new Date();
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  return now.toLocaleDateString('en-US', options);
}

/**
 * Verify email configuration is working
 * @returns {Promise<boolean>} True if configuration is valid
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
