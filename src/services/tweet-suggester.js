/**
 * Tweet Suggester Service
 * Generates daily tweet suggestions for @iliasanwar_ based on style analysis
 */

import OpenAI from 'openai';

const DASHBOARD_DATA_URL = 'https://www.cliqksocials.com/data.json';
const TARGET_HANDLE = 'iliasanwar_';

/**
 * Initialize OpenAI client
 */
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * Fetch Ilias's Twitter data from the deployed dashboard
 */
export async function fetchIliasData() {
  console.log('📥 Fetching data from dashboard...');

  const response = await fetch(DASHBOARD_DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${response.status}`);
  }

  const data = await response.json();

  // Find Ilias's Twitter account
  const iliasAccount = data.accounts?.find(
    acc => acc.platform === 'twitter' && acc.handle === TARGET_HANDLE
  );

  if (!iliasAccount) {
    throw new Error(`Twitter account @${TARGET_HANDLE} not found in dashboard data`);
  }

  // Also get data from other platforms for context
  const allIliasAccounts = data.accounts?.filter(
    acc => acc.handle === TARGET_HANDLE || acc.handle?.toLowerCase().includes('ilias')
  );

  console.log(`✅ Found @${TARGET_HANDLE} with ${iliasAccount.postCaptions?.length || 0} recent tweets`);

  return {
    twitter: iliasAccount,
    allPlatforms: allIliasAccounts,
    generatedAt: data.generatedAt
  };
}

/**
 * Analyze tweet style patterns
 */
export function analyzeStyle(tweets) {
  if (!tweets || tweets.length === 0) {
    return {
      avgLength: 240,
      usesHashtags: false,
      usesEmojis: false,
      usesQuestions: false,
      usesLinks: true,
      tone: 'professional',
      topics: ['distribution', 'creators', 'growth']
    };
  }

  const analysis = {
    avgLength: 0,
    usesHashtags: false,
    usesEmojis: false,
    usesQuestions: false,
    usesLinks: false,
    hashtagCount: 0,
    emojiCount: 0,
    questionCount: 0,
    linkCount: 0,
    topics: [],
    tone: 'professional'
  };

  let totalLength = 0;

  tweets.forEach(tweet => {
    if (!tweet) return;

    totalLength += tweet.length;

    // Check for hashtags
    const hashtags = tweet.match(/#\w+/g);
    if (hashtags) {
      analysis.usesHashtags = true;
      analysis.hashtagCount += hashtags.length;
    }

    // Check for emojis (simplified check)
    const emojis = tweet.match(/[\u{1F300}-\u{1F9FF}]/gu);
    if (emojis) {
      analysis.usesEmojis = true;
      analysis.emojiCount += emojis.length;
    }

    // Check for questions
    if (tweet.includes('?')) {
      analysis.usesQuestions = true;
      analysis.questionCount++;
    }

    // Check for links
    if (tweet.includes('http') || tweet.includes('link')) {
      analysis.usesLinks = true;
      analysis.linkCount++;
    }
  });

  analysis.avgLength = Math.round(totalLength / tweets.length);

  // Extract common topics from tweets
  const topicKeywords = [
    'distribution', 'creator', 'content', 'growth', 'viral', 'cliqk',
    'social', 'media', 'marketing', 'audience', 'engagement', 'brand',
    'building', 'strategy', 'analytics', 'data'
  ];

  const tweetText = tweets.join(' ').toLowerCase();
  analysis.topics = topicKeywords.filter(topic => tweetText.includes(topic));

  // Determine tone
  const professionalWords = ['strategy', 'growth', 'data', 'analytics', 'roi'];
  const casualWords = ['lol', 'tbh', 'ngl', 'fr', 'lowkey'];

  const profCount = professionalWords.filter(w => tweetText.includes(w)).length;
  const casualCount = casualWords.filter(w => tweetText.includes(w)).length;

  analysis.tone = profCount > casualCount ? 'professional' : 'conversational';

  return analysis;
}

/**
 * Fetch current trending topics and news
 */
async function fetchCurrentContext() {
  console.log('📰 Fetching current trends and news...');

  try {
    // Fetch tech/creator economy news
    const response = await fetch('https://newsapi.org/v2/everything?q=creator+economy+OR+social+media+marketing&sortBy=publishedAt&pageSize=5&apiKey=demo', {
      headers: { 'User-Agent': 'CliqkBot/1.0' }
    });

    if (response.ok) {
      const data = await response.json();
      return data.articles?.slice(0, 3).map(a => a.title).join('; ') || '';
    }
  } catch (e) {
    // Fallback to general context
  }

  // Fallback: current date context
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = now.getFullYear();

  return `Current: ${month} ${year}. Hot topics: AI tools for creators, short-form video dominance, algorithm changes, creator monetization, brand deals vs owned audience.`;
}

/**
 * Generate 5 tweet suggestions using OpenAI
 */
export async function generateSuggestions(iliasData, styleProfile) {
  console.log('🤖 Generating tweet suggestions with AI...');

  const openai = getOpenAIClient();
  const currentContext = await fetchCurrentContext();

  const recentTweets = iliasData.twitter.postCaptions?.slice(0, 10).join('\n\n') || 'No recent tweets available';

  const prompt = `You are ghostwriting tweets for Ilias (@iliasanwar_), founder of Cliqk - a social media analytics tool.

## CRITICAL: Sound like Ilias, NOT like AI
- NO generic motivational fluff ("unlock your potential", "game-changer", "here's the thing")
- NO numbered lists or "Thread 🧵" formats unless he actually uses them
- NO excessive emojis or hashtags
- Write like a real person texting a friend about business
- Be specific, not vague. Use real numbers, real examples, real observations.

## Ilias's ACTUAL recent tweets (copy his exact voice):
${recentTweets}

## His style patterns:
- Length: AIM FOR 200-280 CHARACTERS. Develop the thought fully, don't be too brief.
- Tone: ${styleProfile.tone}, direct, no fluff
- Topics: ${styleProfile.topics.join(', ') || 'distribution, content, creators'}
- He runs Cliqk (social media analytics for creators)
- ${styleProfile.usesEmojis ? 'Sometimes uses emojis' : 'Rarely uses emojis'}
- ${styleProfile.usesHashtags ? 'Sometimes uses hashtags' : 'Almost never uses hashtags'}

## Current events to potentially reference:
${currentContext}

## His account context:
- ${iliasData.twitter.followers?.toLocaleString() || '~1.3K'} followers, ${iliasData.twitter.impressions?.toLocaleString() || '100K+'} impressions
- Building in public, growing Cliqk
- Audience: creators, founders, marketers

## Generate 5 tweets that sound EXACTLY like Ilias wrote them:

1. **Contrarian take** - Challenge something everyone believes about content/social
2. **Specific insight** - Something he noticed from Cliqk data or his own experience (make up a believable specific stat)
3. **Question** - Genuine question he'd ask his audience (not engagement bait)
4. **Real observation** - Something happening right now in creator/social space
5. **Personal update style** - How he'd share a Cliqk win or learning

IMPORTANT:
- Each tweet must sound like it came from his keyboard, not ChatGPT
- Reference specific things (platforms, features, numbers) not vague concepts
- If you can't tell it apart from his real tweets, you did it right
- TWEETS MUST BE 200-280 CHARACTERS. Short tweets under 150 chars are rejected. Develop the idea fully.

## Output JSON:
{
  "suggestions": [
    {
      "type": "Contrarian Take",
      "tweet": "exact tweet text",
      "why": "why this matches his style and would perform",
      "charCount": 123
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert Twitter ghostwriter. Always respond with valid JSON matching the requested format.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.8,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content);

  console.log(`✅ Generated ${result.suggestions?.length || 0} tweet suggestions`);

  return result.suggestions || [];
}

/**
 * Format suggestions for Slack
 */
export function formatForSlack(suggestions, iliasData) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York'
  });

  const typeEmojis = {
    'Hot Take': '🔥',
    'Value Tip': '💡',
    'Engagement Hook': '💬',
    'Observation': '👀',
    'Thread Starter': '🧵'
  };

  let message = `*🐦 Daily Tweet Suggestions for @${TARGET_HANDLE}*\n`;
  message += `_Generated: ${dateStr} ET_\n`;
  message += `_Based on ${iliasData.twitter.postCaptions?.length || 0} recent tweets_\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  suggestions.forEach((suggestion, index) => {
    const emoji = typeEmojis[suggestion.type] || '📝';
    message += `*${emoji} Option ${index + 1}: ${suggestion.type}*\n`;
    message += `\`\`\`${suggestion.tweet}\`\`\`\n`;
    message += `_💡 Why: ${suggestion.why}_\n`;
    message += `_(${suggestion.charCount || suggestion.tweet.length} chars)_\n\n`;

    if (index < suggestions.length - 1) {
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `_Copy any tweet above and post to X/Twitter!_`;

  return message;
}

/**
 * Send direct message to Ilias via Slack Bot API
 */
export async function sendToSlack(message) {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const iliasUserId = 'U09LPE3QR97'; // Ilias's Slack Member ID

  if (!botToken) {
    throw new Error('SLACK_BOT_TOKEN environment variable is required');
  }

  console.log('📤 Sending DM to Ilias via Slack...');

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${botToken}`
    },
    body: JSON.stringify({
      channel: iliasUserId, // Sending to user ID creates a DM
      text: message,
      unfurl_links: false,
      unfurl_media: false
    })
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(`Slack API failed: ${result.error}`);
  }

  console.log('✅ DM sent to Ilias successfully!');
}

/**
 * Main function - run the full pipeline
 */
export async function runDailyTweetSuggestions() {
  console.log('\n🚀 Starting Daily Tweet Suggestions Pipeline\n');
  console.log('━'.repeat(50));

  try {
    // Step 1: Fetch Ilias's data
    const iliasData = await fetchIliasData();

    // Step 2: Analyze style
    const styleProfile = analyzeStyle(iliasData.twitter.postCaptions);
    console.log('📊 Style analysis complete:', {
      avgLength: styleProfile.avgLength,
      tone: styleProfile.tone,
      topics: styleProfile.topics.slice(0, 5)
    });

    // Step 3: Generate suggestions
    const suggestions = await generateSuggestions(iliasData, styleProfile);

    if (!suggestions || suggestions.length === 0) {
      throw new Error('No suggestions generated');
    }

    // Step 4: Format for Slack
    const slackMessage = formatForSlack(suggestions, iliasData);

    // Step 5: Send to Slack
    await sendToSlack(slackMessage);

    console.log('\n━'.repeat(50));
    console.log('✅ Daily tweet suggestions sent successfully!\n');

    return { success: true, suggestions };

  } catch (error) {
    console.error('\n❌ Error in tweet suggestion pipeline:', error.message);
    throw error;
  }
}
