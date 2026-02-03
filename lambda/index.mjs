/**
 * Cliqk Automations Lambda Handlers
 * Comprehensive social media automation for Cliqk
 *
 * Jobs:
 * - daily-tweets: Generate tweet suggestions
 * - daily-stats: Collect stats from all platforms
 * - weekly-report: Full weekly report with scraping & analysis
 * - linkedin-initial: Saturday initial request for LinkedIn impressions
 * - linkedin-reminder: Sunday reminder for those who haven't submitted
 * - health-check: Check Apify actor health
 */

import OpenAI from 'openai';
import { ApifyClient } from 'apify-client';
import { WebClient } from '@slack/web-api';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { google } from 'googleapis';

const s3 = new S3Client({ region: 'us-east-2' });
const STATS_BUCKET = 'cliqk-social-stats';

// ==================== CONFIGURATION ====================

const DASHBOARD_DATA_URL = 'https://www.cliqksocials.com/data.json';
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd4cCK4zjzUkuELNycsMJ6bIv2p67vqSud1iBJNVLhPu0b6ag/viewform';

// Team members for daily tweet suggestions
const TWEET_TEAM_MEMBERS = {
  ilias: {
    name: 'Ilias',
    twitterHandle: 'iliasanwar_',
    slackUserId: 'U09LPE3QR97',
    role: 'Co-Founder and CMO of Cliqk',
    topics: ['distribution', 'creators', 'growth', 'content', 'marketing'],
    context: 'He runs Cliqk (social media analytics for creators). Building in public, growing Cliqk. Audience: creators, founders, marketers.'
  },
  rohan: {
    name: 'Rohan',
    twitterHandle: 'rohangurram',
    slackUserId: 'U0963DX3S2K',
    role: 'Founder-led branding expert at Cliqk',
    topics: ['founder-led branding', 'personal brand', 'thought leadership', 'LinkedIn growth', 'executive presence'],
    context: 'He focuses on founder-led branding and helping founders grow their personal brand. Building in public. Audience: founders, CEOs, executives looking to build their personal brand.'
  }
};

// All accounts to track
const ACCOUNTS = {
  instagram: [
    { handle: 'cliqkbait' },
    { handle: 'myacliqk' },
    { handle: 'mycliqk' },
    { handle: 'cliqkclips' },
    { handle: 'cliqkcreators' },
    { handle: 'shawn_reddy' },
    { handle: 'cliqkbrandon' },
    { handle: 'iliasanwar_' },
    { handle: 'rohancliqk' },
  ],
  tiktok: [
    { handle: 'cliqkcreators' },
    { handle: 'cliqkclips' },
    { handle: 'cliqkbrandon' },
  ],
  youtube: [
    { handle: 'cliqkclips' },
    { handle: 'cliqkcreators' },
    { handle: 'iliasanwar_' },
    { handle: 'cliqkbrandon' },
  ],
  twitter: [
    { handle: 'mycliqk' },
    { handle: 'iliasanwar_' },
    { handle: 'rohangurram' },
    { handle: 'screddysai' },
    { handle: 'pavankumarny' },
    { handle: 'myacliqk' },
  ],
  reddit: [
    { handle: 'Sufficient_Bat_4056' },
    { handle: 'Tight-Quarter-6898' },
  ],
};

// LinkedIn team for impressions tracking
const LINKEDIN_TEAM = [
  { name: 'Pavan', email: 'pavan@mycliqk.com' },
  { name: 'Rohan', email: 'rohan@mycliqk.com' },
  { name: 'Charles', email: 'charles@mycliqk.com' },
  { name: 'Marvin', email: 'marvin@mycliqk.com' },
  { name: 'Charana', email: 'charana@mycliqk.com' },
  { name: 'Shawn', email: 'shawn@mycliqk.com' },
  { name: 'Brandon', email: 'brandon@mycliqk.com' },
  { name: 'Gary', email: 'gary@mycliqk.com' },
  { name: 'Alvin', email: 'alvin@mycliqk.com' },
  { name: 'Armaan', email: 'armaan@mycliqk.com' },
];

// ==================== GOOGLE AUTH ====================

let googleAuth = null;
let emailTransporter = null;

async function initGoogleAuth() {
  if (googleAuth) return googleAuth;

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}');

  googleAuth = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uri
  );

  googleAuth.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
  });

  console.log('Google Auth initialized');
  return googleAuth;
}

async function initEmailService() {
  // Email service now uses Gmail API directly
  console.log('Email service initialized (using Gmail API)');
  return true;
}

async function sendEmailViaGmailAPI(to, subject, html) {
  const auth = await initGoogleAuth();
  const gmail = google.gmail({ version: 'v1', auth });

  // Create email in RFC 2822 format
  const emailLines = [
    `To: ${to}`,
    `From: ${process.env.GMAIL_USER || 'shawn@mycliqk.com'}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html
  ];

  const email = emailLines.join('\r\n');
  const encodedEmail = Buffer.from(email).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });

  console.log(`Email sent: ${response.data.id}`);
  return response.data;
}

// ==================== DAILY TWEETS ====================

async function fetchPersonData(person) {
  console.log(`Fetching data for @${person.twitterHandle} from dashboard...`);
  const response = await fetch(DASHBOARD_DATA_URL);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

  const data = await response.json();
  const twitterAccount = data.accounts?.find(
    acc => acc.platform === 'twitter' && acc.handle === person.twitterHandle
  );

  if (!twitterAccount) throw new Error(`@${person.twitterHandle} not found`);
  console.log(`Found @${person.twitterHandle} with ${twitterAccount.postCaptions?.length || 0} tweets`);
  return { twitter: twitterAccount };
}

function analyzeStyle(tweets) {
  if (!tweets?.length) {
    return { avgLength: 240, tone: 'professional', topics: ['distribution', 'creators', 'growth'] };
  }

  const avgLength = tweets.reduce((sum, t) => sum + (t?.length || 0), 0) / tweets.length;
  const usesEmojis = tweets.some(t => /[\u{1F300}-\u{1F9FF}]/u.test(t || ''));
  const usesQuestions = tweets.some(t => t?.includes('?'));

  return {
    avgLength: Math.round(avgLength),
    usesEmojis,
    usesQuestions,
    tone: 'professional',
    topics: ['distribution', 'creators', 'growth', 'AI', 'marketing']
  };
}

async function generateTweetSuggestions(personData, person) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const tweets = personData.twitter.postCaptions || [];
  const style = analyzeStyle(tweets);

  const recentTweets = tweets.slice(0, 10).map((t, i) => `${i + 1}. ${t}`).join('\n');

  const prompt = `You are a social media expert helping @${person.twitterHandle} (${person.name}, ${person.role}) create engaging tweets.

STYLE ANALYSIS:
- Average length: ${style.avgLength} chars
- Uses emojis: ${style.usesEmojis}
- Asks questions: ${style.usesQuestions}
- Tone: ${style.tone}
- Topics: ${style.topics.join(', ') || person.topics.join(', ')}

CONTEXT:
${person.context}

RECENT TWEETS:
${recentTweets || 'No recent tweets available'}

Generate 5 tweet suggestions that:
1. Match ${person.name}'s writing style and voice exactly
2. Are about ${person.topics.slice(0, 3).join(', ')}, or building in public
3. Are LONGER and more detailed - aim for 220-280 characters each
4. Include specific insights, numbers, or actionable advice
5. Feel like real thoughts from a builder, not generic marketing speak
6. Can include line breaks for readability

Make each tweet substantive with a clear point of view. Avoid generic platitudes.

Format each suggestion on its own line, numbered 1-5.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 1000
  });

  const suggestions = response.choices[0].message.content
    .split('\n')
    .filter(line => /^\d+\./.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());

  return suggestions;
}

async function sendToSlackPerson(suggestions, person) {
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `Daily Tweet Suggestions for @${person.twitterHandle}` }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `Hey ${person.name}! Here are today's tweet suggestions based on your recent performance:` }
    },
    { type: 'divider' }
  ];

  suggestions.forEach((tweet, i) => {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${i + 1}.* ${tweet}\n_${tweet.length} characters_` }
    });
  });

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `Generated at ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST` }]
    }
  );

  // Send directly to the person via DM
  await slack.chat.postMessage({
    channel: person.slackUserId,
    blocks,
    text: 'Daily Tweet Suggestions'
  });
}

async function runDailyTweetsForPerson(person) {
  console.log(`Starting daily tweet suggestions for ${person.name}...`);
  const personData = await fetchPersonData(person);
  const suggestions = await generateTweetSuggestions(personData, person);
  console.log(`Generated ${suggestions.length} suggestions for ${person.name}`);
  await sendToSlackPerson(suggestions, person);
  console.log(`Sent to ${person.name} on Slack`);
  return { person: person.name, suggestions };
}

async function runDailyTweets() {
  console.log('Starting daily tweet suggestions for all team members...');
  const results = [];
  const errors = [];

  for (const [key, person] of Object.entries(TWEET_TEAM_MEMBERS)) {
    try {
      const result = await runDailyTweetsForPerson(person);
      results.push(result);
    } catch (error) {
      console.error(`Failed for ${person.name}:`, error.message);
      errors.push({ person: person.name, error: error.message });
    }
  }

  console.log(`Completed: ${results.length} successful, ${errors.length} failed`);
  return { results, errors };
}

// ==================== LINKEDIN IMPRESSIONS ====================

async function getSubmittedEmails() {
  try {
    const responseSheetId = process.env.LINKEDIN_FORM_RESPONSE_SHEET_ID;
    if (!responseSheetId) {
      console.log('No LINKEDIN_FORM_RESPONSE_SHEET_ID set');
      return [];
    }

    const auth = await initGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: responseSheetId,
      range: 'Form Responses 1!A:C',
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return [];

    // Get start of current week (last Saturday 9am PST)
    const now = new Date();
    const saturdayThisWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const daysSinceSaturday = (dayOfWeek + 1) % 7;
    saturdayThisWeek.setDate(now.getDate() - daysSinceSaturday);
    saturdayThisWeek.setHours(9, 0, 0, 0);

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

async function sendLinkedinInitial() {
  console.log('Sending LinkedIn initial request emails...');
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
                    color: white; padding: 16px 32px; border-radius: 24px;
                    text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Submit LinkedIn Impressions
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          <strong>Deadline:</strong> Sunday at 1pm PST (before the weekly report goes out at 2pm)
        </p>
      </div>
    </div>
  `;

  const recipients = LINKEDIN_TEAM.map(t => t.email);
  await sendEmailViaGmailAPI(recipients.join(', '), subject, html);

  console.log(`Initial request sent to ${recipients.length} team members`);
  return { sent: recipients.length };
}

async function sendLinkedinReminder() {
  console.log('Sending LinkedIn reminder emails...');
  await initEmailService();

  const submittedEmails = await getSubmittedEmails();
  console.log(`Already submitted: ${submittedEmails.length} team members`);

  const needsReminder = LINKEDIN_TEAM.filter(
    t => !submittedEmails.includes(t.email.toLowerCase())
  );

  if (needsReminder.length === 0) {
    console.log('Everyone has submitted their LinkedIn impressions!');
    return { sent: 0, message: 'All submitted' };
  }

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
                    color: white; padding: 16px 32px; border-radius: 24px;
                    text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Submit LinkedIn Impressions Now
          </a>
        </div>
      </div>
    </div>
  `;

  const recipients = needsReminder.map(t => t.email);
  await sendEmailViaGmailAPI(recipients.join(', '), subject, html);

  console.log(`Reminder sent to: ${needsReminder.map(t => t.name).join(', ')}`);
  return { sent: needsReminder.length, names: needsReminder.map(t => t.name) };
}

// ==================== WEEKLY REPORT ====================

async function scrapeAllPlatforms(client) {
  const results = [];
  const DAYS_TO_SCRAPE = 7;

  // Instagram
  console.log('Scraping Instagram...');
  for (const account of ACCOUNTS.instagram) {
    try {
      const run = await client.actor('apify/instagram-profile-scraper').call({
        usernames: [account.handle],
      }, { waitSecs: 60 });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      if (items.length > 0) {
        const profile = items[0];
        results.push({
          platform: 'instagram',
          handle: account.handle,
          followers: profile.followersCount || 0,
          following: profile.followsCount || 0,
          posts: profile.postsCount || 0,
          impressions: profile.postsData?.reduce((sum, p) => sum + (p.likesCount || 0), 0) || 0,
          engagement: profile.postsData?.reduce((sum, p) => sum + (p.likesCount || 0) + (p.commentsCount || 0), 0) || 0,
        });
        console.log(`  ${account.handle}: ${profile.followersCount} followers`);
      }
    } catch (e) {
      console.log(`  ${account.handle}: failed - ${e.message}`);
      results.push({ platform: 'instagram', handle: account.handle, error: e.message });
    }
  }

  // TikTok
  console.log('Scraping TikTok...');
  for (const account of ACCOUNTS.tiktok) {
    try {
      const run = await client.actor('clockworks/tiktok-scraper').call({
        profiles: [account.handle],
        resultsPerPage: 30,
      }, { waitSecs: 60 });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      if (items.length > 0) {
        const authorMeta = items[0]?.authorMeta || {};
        let totalPlays = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
        items.forEach(item => {
          totalPlays += item.playCount || 0;
          totalLikes += item.diggCount || 0;
          totalComments += item.commentCount || 0;
          totalShares += item.shareCount || 0;
        });
        results.push({
          platform: 'tiktok',
          handle: account.handle,
          followers: authorMeta.fans || 0,
          impressions: totalPlays,
          engagement: totalLikes + totalComments + totalShares,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
        });
        console.log(`  ${account.handle}: ${totalPlays} plays`);
      }
    } catch (e) {
      console.log(`  ${account.handle}: failed - ${e.message}`);
      results.push({ platform: 'tiktok', handle: account.handle, error: e.message });
    }
  }

  // YouTube
  console.log('Scraping YouTube...');
  for (const account of ACCOUNTS.youtube) {
    try {
      const run = await client.actor('streamers/youtube-channel-scraper').call({
        channelUrls: [`https://youtube.com/@${account.handle}`],
      }, { waitSecs: 60 });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      if (items.length > 0) {
        const channel = items[0];
        results.push({
          platform: 'youtube',
          handle: account.handle,
          subscribers: channel.subscriberCount || 0,
          views: channel.viewCount || 0,
          videos: channel.videoCount || 0,
        });
        console.log(`  ${account.handle}: ${channel.subscriberCount} subscribers`);
      }
    } catch (e) {
      console.log(`  ${account.handle}: failed - ${e.message}`);
      results.push({ platform: 'youtube', handle: account.handle, error: e.message });
    }
  }

  // Twitter
  console.log('Scraping Twitter...');
  for (const account of ACCOUNTS.twitter) {
    try {
      const run = await client.actor('apidojo/tweet-scraper').call({
        handles: [account.handle],
        maxTweets: 20,
      }, { waitSecs: 60 });
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      if (items.length > 0) {
        const profile = items[0].author || {};
        let totalImpressions = 0, totalEngagement = 0;
        items.forEach(item => {
          totalImpressions += item.viewCount || item.impressions || 0;
          totalEngagement += (item.likeCount || 0) + (item.replyCount || 0) + (item.retweetCount || 0);
        });
        results.push({
          platform: 'twitter',
          handle: account.handle,
          followers: profile.followers || 0,
          impressions: totalImpressions,
          engagement: totalEngagement,
        });
        console.log(`  ${account.handle}: ${totalImpressions} impressions`);
      }
    } catch (e) {
      console.log(`  ${account.handle}: failed - ${e.message}`);
      results.push({ platform: 'twitter', handle: account.handle, error: e.message });
    }
  }

  return results;
}

function calculateTotals(data) {
  const totals = {
    totalImpressions: 0,
    totalEngagement: 0,
    totalFollowers: 0,
    byPlatform: {},
  };

  data.forEach(item => {
    if (item.error) return;
    totals.totalImpressions += item.impressions || item.views || 0;
    totals.totalEngagement += item.engagement || 0;
    totals.totalFollowers += item.followers || item.subscribers || 0;

    if (!totals.byPlatform[item.platform]) {
      totals.byPlatform[item.platform] = { impressions: 0, engagement: 0, followers: 0 };
    }
    totals.byPlatform[item.platform].impressions += item.impressions || item.views || 0;
    totals.byPlatform[item.platform].engagement += item.engagement || 0;
    totals.byPlatform[item.platform].followers += item.followers || item.subscribers || 0;
  });

  return totals;
}

async function runWeeklyReport() {
  console.log('Starting weekly report...');
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

  // Scrape all platforms
  const scrapedData = await scrapeAllPlatforms(client);
  const totals = calculateTotals(scrapedData);

  // Get last week's data from S3 for comparison
  let lastWeekTotals = null;
  try {
    const lastWeekKey = getLastWeekKey();
    const data = await s3.send(new GetObjectCommand({
      Bucket: STATS_BUCKET,
      Key: lastWeekKey,
    }));
    const content = await data.Body.transformToString();
    lastWeekTotals = JSON.parse(content).totals;
  } catch (e) {
    console.log('No last week data available');
  }

  // Calculate changes
  let impressionChange = 'N/A', engagementChange = 'N/A';
  if (lastWeekTotals) {
    const impDiff = totals.totalImpressions - lastWeekTotals.totalImpressions;
    const impPct = lastWeekTotals.totalImpressions > 0
      ? ((impDiff / lastWeekTotals.totalImpressions) * 100).toFixed(1)
      : 0;
    impressionChange = `${impDiff >= 0 ? '+' : ''}${impDiff.toLocaleString()} (${impPct}%)`;

    const engDiff = totals.totalEngagement - lastWeekTotals.totalEngagement;
    const engPct = lastWeekTotals.totalEngagement > 0
      ? ((engDiff / lastWeekTotals.totalEngagement) * 100).toFixed(1)
      : 0;
    engagementChange = `${engDiff >= 0 ? '+' : ''}${engDiff.toLocaleString()} (${engPct}%)`;
  }

  // Save this week's data
  const weekKey = `weekly/${new Date().toISOString().split('T')[0]}.json`;
  await s3.send(new PutObjectCommand({
    Bucket: STATS_BUCKET,
    Key: weekKey,
    Body: JSON.stringify({ scrapedData, totals, timestamp: new Date().toISOString() }),
    ContentType: 'application/json',
  }));

  // Build Slack message
  const platformSummary = Object.entries(totals.byPlatform)
    .map(([platform, data]) => `*${platform}*: ${data.impressions.toLocaleString()} impressions, ${data.engagement.toLocaleString()} engagement`)
    .join('\n');

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Weekly Social Media Report' }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*` }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Total Impressions:* ${totals.totalImpressions.toLocaleString()}\n*Change:* ${impressionChange}` }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Total Engagement:* ${totals.totalEngagement.toLocaleString()}\n*Change:* ${engagementChange}` }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Total Followers:* ${totals.totalFollowers.toLocaleString()}` }
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*By Platform:*\n${platformSummary}` }
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `View dashboard: https://www.cliqksocials.com | Generated at ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST` }]
    }
  ];

  await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL || 'marketing',
    blocks,
    text: 'Weekly Social Media Report'
  });

  // Deploy to Vercel if token available
  if (process.env.VERCEL_TOKEN) {
    try {
      await deployDashboard(scrapedData, totals);
    } catch (e) {
      console.log('Vercel deploy skipped:', e.message);
    }
  }

  console.log('Weekly report complete');
  return { totals, accountsScraped: scrapedData.length };
}

function getLastWeekKey() {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return `weekly/${lastWeek.toISOString().split('T')[0]}.json`;
}

async function deployDashboard(accounts, summary) {
  // Create data.json content
  const dashboardData = {
    generatedAt: new Date().toISOString(),
    accounts: accounts.map(a => ({
      ...a,
      url: `https://${a.platform === 'twitter' ? 'x.com' : a.platform + '.com'}/${a.handle}`,
    })),
    summary,
  };

  // Save to S3 for dashboard to fetch
  await s3.send(new PutObjectCommand({
    Bucket: STATS_BUCKET,
    Key: 'dashboard/data.json',
    Body: JSON.stringify(dashboardData, null, 2),
    ContentType: 'application/json',
  }));

  console.log('Dashboard data saved to S3');
}

// ==================== DAILY STATS ====================

async function runDailyStats() {
  console.log('Starting daily stats collection...');
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

  const scrapedData = await scrapeAllPlatforms(client);
  const totals = calculateTotals(scrapedData);

  // Save to S3
  const date = new Date().toISOString().split('T')[0];
  const key = `daily/${date}.json`;
  await s3.send(new PutObjectCommand({
    Bucket: STATS_BUCKET,
    Key: key,
    Body: JSON.stringify({ scrapedData, totals, timestamp: new Date().toISOString() }),
    ContentType: 'application/json',
  }));

  // Send brief Slack notification
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const successCount = scrapedData.filter(a => !a.error).length;

  await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL || 'marketing',
    text: `Daily stats collected: ${successCount}/${scrapedData.length} accounts scraped. Total impressions: ${totals.totalImpressions.toLocaleString()}`,
  });

  console.log('Daily stats collection complete');
  return { totals, s3Key: key };
}

// ==================== HEALTH CHECK ====================

const PRIMARY_ACTORS = {
  instagram: 'apify/instagram-scraper',
  tiktok: 'clockworks/tiktok-scraper',
  youtube: 'streamers/youtube-channel-scraper',
  twitter: 'apidojo/tweet-scraper',
  reddit: 'trudax/reddit-scraper',
};

async function checkActorHealth(client, actorId) {
  try {
    const actor = await client.actor(actorId).get();
    if (!actor) return { actorId, status: 'not_found' };

    const runs = await client.actor(actorId).runs().list({ limit: 5 });
    const recentRuns = runs.items || [];

    if (recentRuns.length === 0) {
      return { actorId, status: 'no_runs', actor };
    }

    const successCount = recentRuns.filter(r => r.status === 'SUCCEEDED').length;
    const successRate = successCount / recentRuns.length;

    return {
      actorId,
      status: successRate >= 0.6 ? 'healthy' : 'degraded',
      successRate,
      recentRuns: recentRuns.length,
    };
  } catch (error) {
    return { actorId, status: 'error', error: error.message };
  }
}

async function runHealthCheck() {
  console.log('Starting Apify health check...');
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

  const results = { platforms: {}, timestamp: new Date().toISOString() };

  for (const [platform, actorId] of Object.entries(PRIMARY_ACTORS)) {
    console.log(`Checking ${platform}...`);
    const health = await checkActorHealth(client, actorId);
    results.platforms[platform] = health;
  }

  const failures = Object.entries(results.platforms)
    .filter(([_, r]) => r.status !== 'healthy')
    .map(([p]) => p);

  console.log(`Health check complete. Issues: ${failures.length}`);
  return { results, failures };
}

// ==================== MAIN HANDLER ====================

export async function handler(event) {
  const job = event.job || 'daily-tweets';
  console.log(`Running job: ${job}`);

  try {
    let result;

    switch (job) {
      case 'daily-tweets':
        result = await runDailyTweets();
        break;
      case 'daily-stats':
        result = await runDailyStats();
        break;
      case 'weekly-report':
        result = await runWeeklyReport();
        break;
      case 'linkedin-initial':
        result = await sendLinkedinInitial();
        break;
      case 'linkedin-reminder':
        result = await sendLinkedinReminder();
        break;
      case 'health-check':
        result = await runHealthCheck();
        break;
      default:
        return { statusCode: 400, body: JSON.stringify({ error: `Unknown job: ${job}` }) };
    }

    return { statusCode: 200, body: JSON.stringify({ job, result }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
