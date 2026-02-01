# Cliqk Social Media Analytics Tracker

Automated weekly scraping of 38 social media accounts across 7 platforms, with sentiment analysis and delivery via email + Slack. Runs every Sunday at 2pm PST via GitHub Actions.

## Features

- **Multi-Platform Scraping**: Instagram, TikTok, YouTube, X/Twitter, LinkedIn, Reddit, Beehiiv
- **TikTok Video Analysis**: Transcribes recent videos and analyzes hooks + virality potential using AI
- **Sentiment Analysis**: Analyzes both your content tone and audience reception using OpenAI
- **Week-over-Week Comparison**: Tracks impression changes and trends
- **Automated Delivery**: Email reports to team + Slack notifications
- **Google Sheets Storage**: Historical data tracking and raw metrics

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  GitHub Actions │────▶│  Apify API   │────▶│  Raw Data       │
│  (Scheduler)    │     │  (Scrapers)  │     │                 │
└────────┬────────┘     └──────────────┘     └────────┬────────┘
         │                                            │
         │              ┌──────────────┐              │
         │              │  Sentiment   │◀─────────────┘
         │              │  Analysis    │
         │              └──────┬───────┘
         │                     │
         ▼                     ▼
┌─────────────────┐     ┌──────────────┐
│  Google Sheets  │◀────│  Data        │
│  (Storage)      │     │  Processor   │
└────────┬────────┘     └──────────────┘
         │
         ├──────────────────────────────┐
         ▼                              ▼
┌─────────────────┐              ┌──────────────┐
│  Email Report   │              │  Slack       │
│  (mycliqk.com)  │              │  (Webhook)   │
└─────────────────┘              └──────────────┘
```

## Setup Instructions

### 1. Apify Account

1. Sign up at [apify.com](https://apify.com)
2. Go to Settings → Integrations
3. Copy your API token
4. Subscribe to these actors (many have free tiers):
   - `apify/instagram-profile-scraper`
   - `clockworks/tiktok-scraper`
   - `streamers/youtube-channel-scraper`
   - `apidojo/tweet-scraper`
   - `anchor/linkedin-profile-scraper`
   - `trudax/reddit-scraper`
   - `apify/web-scraper`

### 2. Google Cloud Setup (for Sheets)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing mycliqk.com project)
3. Enable the **Google Sheets API**
4. Create a Service Account:
   - Go to IAM & Admin → Service Accounts
   - Create new service account
   - Download the JSON key file
5. Base64 encode the credentials:
   ```bash
   base64 -i your-service-account.json
   ```
6. Create a Google Sheet with 4 tabs:
   - `Raw Data`
   - `Summary`
   - `Sentiment`
   - `Video Analysis`
7. Share the Google Sheet with your service account email (found in the JSON file)

### 3. OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Uses GPT-4o-mini (~$0.15 per 1M input tokens)

### 4. Google Workspace Email (mycliqk.com)

1. Log into your mycliqk.com Google Workspace admin
2. For the sending account, enable 2-Step Verification
3. Generate an App Password:
   - Go to myaccount.google.com → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Save the 16-character password

### 5. Slack Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create a new app (or use existing)
3. Enable Incoming Webhooks
4. Create a webhook for your target channel
5. Copy the webhook URL

### 6. GitHub Repository Setup

1. Create a new repository
2. Push this code to the repository
3. Add secrets in Settings → Secrets and variables → Actions:

| Secret Name | Description |
|-------------|-------------|
| `APIFY_TOKEN` | Your Apify API token |
| `GOOGLE_CREDENTIALS` | Base64-encoded service account JSON |
| `GOOGLE_SHEET_ID` | The ID from your Google Sheet URL |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `GMAIL_USER` | Your mycliqk.com email address |
| `GMAIL_APP_PASSWORD` | The 16-character app password |
| `EMAIL_RECIPIENTS` | Comma-separated list of emails |
| `SLACK_WEBHOOK_URL` | Your Slack webhook URL |

## Local Development

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd social-media-tracker
   ```

2. Install system dependencies (for TikTok video transcription):
   ```bash
   # macOS
   brew install yt-dlp ffmpeg

   # Ubuntu/Debian
   sudo apt-get install ffmpeg
   pip install yt-dlp
   ```

3. Install npm dependencies:
   ```bash
   npm install
   ```

4. Create `.env` file from template:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. Run locally:
   ```bash
   npm start
   ```

## Accounts Tracked (38 Total)

### Instagram (9)
cliqkbait, myacliqk, mycliqk, cliqkclips, cliqkcreators, shawn_reddy, cliqkbrandon, iliasanwar_, rohancliqk

### TikTok (3)
@cliqkcreators, @cliqkclips, @cliqkbrandon

### YouTube (3)
@cliqkclips, @cliqkcreators, @iliasanwar_

### X/Twitter (6)
mycliqk, iliasanwar_, rohangurram, screddysai, pavankumarny, myacliqk

### LinkedIn (15)
- **Profiles**: pavankumarny, wilmanchan, charles-legard-2953a2201, marvin-ford-b99623186, charana-athauda-784a24177, shawnreddy, brandon-garcia-530629369, gary-sargeant07, alvin-qingkai-pan, hriday-narang, armaan-hossain
- **Company Page**: mycliqk
- **Newsletter**: 7188317004687200258

### Reddit (2)
u/Sufficient_Bat_4056, u/Tight-Quarter-6898

### Beehiiv (1)
cliqkdaily.beehiiv.com

## Report Format

```
📊 Weekly Social Media Report
Week of January 31, 2026

TOTAL IMPRESSIONS: X,XXX,XXX (↑ +X.X% from last week)

BY PLATFORM:
• Instagram (9): XXX,XXX (+X%)
• TikTok (3): XXX,XXX (+X%)
• YouTube (3): XXX,XXX (+X%)
• X/Twitter (6): XXX,XXX (+X%)
• LinkedIn (15): XXX,XXX (+X%)
• Reddit (2): XXX,XXX (+X%)

SENTIMENT ANALYSIS:
• Your Content: Positive (score: 0.XX)
• Audience Comments: Positive (score: 0.XX)
• Week-over-Week: ↑ Improving

TIKTOK VIDEO ANALYSIS (Last 7 Days):
• @cliqkcreators: 3 videos analyzed
  🔥 Hook Score: 7.5/10 | 🚀 Virality: 8.2/10
  Best video: "Strong opening hook with clear value proposition"
  Tip: Add a stronger call-to-action at the end
• @cliqkclips: 2 videos analyzed
  👍 Hook Score: 6.0/10 | 📈 Virality: 5.8/10
  Tip: Start with a more attention-grabbing first 3 seconds

TOP PERFORMERS:
1. @account - XXX,XXX impressions
2. @account - XXX,XXX impressions
3. @account - XXX,XXX impressions

NEEDS ATTENTION:
• @account - down X% this week

Full data: [Google Sheet Link]
```

## TikTok Video Analysis

For each TikTok account, the system:

1. **Fetches recent videos** (last 7 days) using yt-dlp
2. **Transcribes audio** by extracting auto-generated captions (free) or via Whisper API
3. **Analyzes the hook** (first ~10 seconds) for attention-grabbing effectiveness
4. **Scores virality potential** based on content structure, emotional triggers, and shareability
5. **Provides improvement tips** specific to each video

Scores are 1-10:
- **Hook Score**: How well the opening grabs attention
- **Virality Score**: Overall potential for shares and engagement

Based on [tiktok-transcribe](https://github.com/ajsai47/tiktok-transcribe).

## Schedule

- **When**: Every Sunday at 2:00 PM PST
- **Cron**: `0 22 * * 0` (10pm UTC = 2pm PST)
- **Manual trigger**: Use "Run workflow" in GitHub Actions

## Cost Estimates

| Service | Monthly Cost |
|---------|--------------|
| Apify | $5-20 |
| OpenAI | $1-5 |
| Google Sheets | Free |
| Gmail | Free |
| Slack | Free |
| GitHub Actions | Free |
| **Total** | **~$10-30/month** |

## Troubleshooting

### LinkedIn Data Limited
LinkedIn is highly restrictive with scraping. Impression data may not be available - falls back to engagement metrics.

### Beehiiv Data Limited
Full newsletter metrics require Beehiiv dashboard export. The scraper collects what's publicly available.

### Rate Limits
If you hit rate limits, the system includes retry logic with exponential backoff.

### Email Not Sending
1. Verify 2FA is enabled on the Google Workspace account
2. Ensure the App Password is correct (16 characters, no spaces)
3. Check that "Less secure app access" is not required (App Passwords bypass this)

## Modifying Accounts

Edit `src/config/accounts.js` to add, remove, or modify tracked accounts.

## License

MIT
