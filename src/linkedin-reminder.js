import 'dotenv/config';

import { initEmailService, sendEmail } from './services/email.js';
import { google } from 'googleapis';

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd4cCK4zjzUkuELNycsMJ6bIv2p67vqSud1iBJNVLhPu0b6ag/viewform';

// LinkedIn team members who need to submit impressions
const LINKEDIN_TEAM = [
  { name: 'Pavan', email: 'pavan@mycliqk.com' },
  { name: 'Wilman', email: 'wilman@mycliqk.com' },
  { name: 'Charles', email: 'charles@mycliqk.com' },
  { name: 'Marvin', email: 'marvin@mycliqk.com' },
  { name: 'Charana', email: 'charana@mycliqk.com' },
  { name: 'Shawn', email: 'shawn@mycliqk.com' },
  { name: 'Brandon', email: 'brandon@mycliqk.com' },
  { name: 'Gary', email: 'gary@mycliqk.com' },
  { name: 'Alvin', email: 'alvin@mycliqk.com' },
  { name: 'Hriday', email: 'hriday@mycliqk.com' },
  { name: 'Armaan', email: 'armaan@mycliqk.com' },
];

/**
 * Get list of people who have submitted the form this week
 * Uses Google Sheets API to check form responses
 */
async function getSubmittedEmails() {
  try {
    // Form responses are linked to a Google Sheet
    const responseSheetId = process.env.LINKEDIN_FORM_RESPONSE_SHEET_ID;
    if (!responseSheetId) {
      console.log('No LINKEDIN_FORM_RESPONSE_SHEET_ID set, cannot check submissions');
      return [];
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get form responses
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: responseSheetId,
      range: 'Form Responses 1!A:C', // Timestamp, Email, Impressions
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return []; // Only header row

    // Get start of current week (last Saturday 9am PST)
    const now = new Date();
    const saturdayThisWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysSinceSaturday = (dayOfWeek + 1) % 7; // Saturday = 6, so this calculates days since Saturday
    saturdayThisWeek.setDate(now.getDate() - daysSinceSaturday);
    saturdayThisWeek.setHours(9, 0, 0, 0);

    // Filter responses from this week
    const submittedEmails = [];
    for (let i = 1; i < rows.length; i++) {
      const [timestamp, email] = rows[i];
      const submissionDate = new Date(timestamp);
      if (submissionDate >= saturdayThisWeek) {
        submittedEmails.push(email.toLowerCase());
      }
    }

    return submittedEmails;
  } catch (error) {
    console.error('Error checking form submissions:', error.message);
    return [];
  }
}

/**
 * Send initial request email (Saturday morning)
 */
async function sendInitialRequest() {
  console.log('='.repeat(60));
  console.log('LinkedIn Impressions - Initial Request Email');
  console.log(`Sending at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  await initEmailService();

  const subject = 'Action Required: Submit Your LinkedIn Impressions';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">LinkedIn Impressions Request</h1>
      </div>

      <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #374151;">Hi team,</p>

        <p style="font-size: 16px; color: #374151;">
          It's time to submit your LinkedIn impressions for the weekly report!
        </p>

        <p style="font-size: 16px; color: #374151;">
          Please add up your total LinkedIn post impressions from the <strong>last 7 days</strong> and submit them using the form below.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${FORM_URL}"
             style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
                    color: white;
                    padding: 16px 32px;
                    border-radius: 24px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 16px;
                    display: inline-block;">
            Submit LinkedIn Impressions
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          <strong>How to find your impressions:</strong><br>
          1. Go to your LinkedIn profile<br>
          2. Click on "Analytics" or view your recent posts<br>
          3. Add up the impressions from all posts in the last 7 days<br>
          4. Submit the total in the form
        </p>

        <p style="font-size: 14px; color: #6b7280;">
          <strong>Deadline:</strong> Sunday at 1pm PST (before the weekly report goes out at 2pm)
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          This is an automated message from the Cliqk Social Media Analytics system.
        </p>
      </div>
    </div>
  `;

  const recipients = LINKEDIN_TEAM.map(t => t.email);

  try {
    await sendEmail({
      to: recipients.join(', '),
      subject,
      html,
    });
    console.log(`✅ Initial request sent to ${recipients.length} team members`);
  } catch (error) {
    console.error('❌ Failed to send initial request:', error.message);
    throw error;
  }
}

/**
 * Send reminder email (Sunday morning) - only to those who haven't submitted
 */
async function sendReminder() {
  console.log('='.repeat(60));
  console.log('LinkedIn Impressions - Reminder Email');
  console.log(`Sending at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  await initEmailService();

  // Check who has already submitted
  const submittedEmails = await getSubmittedEmails();
  console.log(`Already submitted: ${submittedEmails.length} team members`);

  // Filter to those who haven't submitted
  const needsReminder = LINKEDIN_TEAM.filter(
    t => !submittedEmails.includes(t.email.toLowerCase())
  );

  if (needsReminder.length === 0) {
    console.log('✅ Everyone has submitted their LinkedIn impressions!');
    return;
  }

  console.log(`Sending reminder to ${needsReminder.length} team members...`);

  const subject = 'Reminder: LinkedIn Impressions Due Soon!';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #DC2626 0%, #F87171 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Reminder: LinkedIn Impressions Needed</h1>
      </div>

      <div style="padding: 24px; background: #f9fafb; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; color: #374151;">Hey there,</p>

        <p style="font-size: 16px; color: #374151;">
          We haven't received your LinkedIn impressions yet for this week's report.
        </p>

        <p style="font-size: 16px; color: #374151; background: #FEF3C7; padding: 12px; border-radius: 8px; border-left: 4px solid #F59E0B;">
          The weekly report goes out at <strong>2pm PST today</strong>. Please submit your impressions as soon as possible!
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${FORM_URL}"
             style="background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
                    color: white;
                    padding: 16px 32px;
                    border-radius: 24px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 16px;
                    display: inline-block;">
            Submit LinkedIn Impressions Now
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          <strong>Quick reminder - How to find your impressions:</strong><br>
          1. Go to your LinkedIn profile<br>
          2. Click on "Analytics" or view your recent posts<br>
          3. Add up the impressions from all posts in the last 7 days<br>
          4. Submit the total in the form
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          This is an automated reminder from the Cliqk Social Media Analytics system.
        </p>
      </div>
    </div>
  `;

  const recipients = needsReminder.map(t => t.email);

  try {
    await sendEmail({
      to: recipients.join(', '),
      subject,
      html,
    });
    console.log(`✅ Reminder sent to: ${needsReminder.map(t => t.name).join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to send reminder:', error.message);
    throw error;
  }
}

// Main execution
const mode = process.argv[2] || 'initial';

if (mode === 'initial') {
  sendInitialRequest().catch(err => {
    console.error(err);
    process.exit(1);
  });
} else if (mode === 'reminder') {
  sendReminder().catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  console.error('Usage: node src/linkedin-reminder.js [initial|reminder]');
  process.exit(1);
}
