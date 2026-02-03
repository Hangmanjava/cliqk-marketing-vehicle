/**
 * Tweet Suggester Service
 * Generates daily tweet suggestions based on style analysis
 * Supports multiple team members
 */

import OpenAI from 'openai';

const DASHBOARD_DATA_URL = 'https://www.cliqksocials.com/data.json';

// Team member configurations
export const TEAM_MEMBERS = {
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

// Default to Ilias for backwards compatibility
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
 * Fetch Twitter data from the deployed dashboard for a specific person
 */
export async function fetchPersonData(person) {
  const handle = person.twitterHandle;
  console.log(`📥 Fetching data for @${handle} from dashboard...`);

  const response = await fetch(DASHBOARD_DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data: ${response.status}`);
  }

  const data = await response.json();

  // Find the person's Twitter account
  const twitterAccount = data.accounts?.find(
    acc => acc.platform === 'twitter' && acc.handle === handle
  );

  if (!twitterAccount) {
    throw new Error(`Twitter account @${handle} not found in dashboard data`);
  }

  // Also get data from other platforms for context
  const allAccounts = data.accounts?.filter(
    acc => acc.handle === handle || acc.handle?.toLowerCase().includes(person.name.toLowerCase())
  );

  console.log(`✅ Found @${handle} with ${twitterAccount.postCaptions?.length || 0} recent tweets`);

  return {
    twitter: twitterAccount,
    allPlatforms: allAccounts,
    generatedAt: data.generatedAt
  };
}

/**
 * Fetch Ilias's Twitter data from the deployed dashboard (backwards compatible)
 */
export async function fetchIliasData() {
  return fetchPersonData(TEAM_MEMBERS.ilias);
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
 * Generate 5 tweet suggestions using OpenAI for a specific person
 */
export async function generateSuggestionsForPerson(personData, styleProfile, person) {
  console.log(`🤖 Generating tweet suggestions for ${person.name} with AI...`);

  const openai = getOpenAIClient();
  const currentContext = await fetchCurrentContext();

  const recentTweets = personData.twitter.postCaptions?.slice(0, 10).join('\n\n') || 'No recent tweets available';

  const prompt = `You are ghostwriting tweets for ${person.name} (@${person.twitterHandle}), ${person.role}.

## CRITICAL: Sound like ${person.name}, NOT like AI
- NO generic motivational fluff ("unlock your potential", "game-changer", "here's the thing")
- NO numbered lists or "Thread 🧵" formats unless they actually use them
- NO excessive emojis or hashtags
- Write like a real person texting a friend about business
- Be specific, not vague. Use real numbers, real examples, real observations.

## ${person.name}'s ACTUAL recent tweets (copy their exact voice):
${recentTweets}

## Their style patterns:
- Length: AIM FOR 200-280 CHARACTERS. Develop the thought fully, don't be too brief.
- Tone: ${styleProfile.tone}, direct, no fluff
- Topics: ${styleProfile.topics.join(', ') || person.topics.join(', ')}
- ${person.context}
- ${styleProfile.usesEmojis ? 'Sometimes uses emojis' : 'Rarely uses emojis'}
- ${styleProfile.usesHashtags ? 'Sometimes uses hashtags' : 'Almost never uses hashtags'}

## Current events to potentially reference:
${currentContext}

## Their account context:
- ${personData.twitter.followers?.toLocaleString() || '~1K'} followers, ${personData.twitter.impressions?.toLocaleString() || '50K+'} impressions
- Building in public
- Audience: founders, builders, tech enthusiasts

## Generate 5 tweets that sound EXACTLY like ${person.name} wrote them:

1. **Contrarian take** - Challenge something everyone believes about content/social/tech
2. **Specific insight** - Something they noticed from data or their own experience (make up a believable specific stat)
3. **Question** - Genuine question they'd ask their audience (not engagement bait)
4. **Real observation** - Something happening right now in tech/creator space
5. **Personal update style** - How they'd share a win or learning

IMPORTANT:
- Each tweet must sound like it came from their keyboard, not ChatGPT
- Reference specific things (platforms, features, numbers) not vague concepts
- If you can't tell it apart from their real tweets, you did it right
- TWEETS MUST BE 200-280 CHARACTERS. Short tweets under 150 chars are rejected. Develop the idea fully.

## Output JSON:
{
  "suggestions": [
    {
      "type": "Contrarian Take",
      "tweet": "exact tweet text",
      "why": "why this matches their style and would perform",
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
 * Generate 5 tweet suggestions using OpenAI (backwards compatible - for Ilias)
 */
export async function generateSuggestions(iliasData, styleProfile) {
  return generateSuggestionsForPerson(iliasData, styleProfile, TEAM_MEMBERS.ilias);
}

/**
 * Format suggestions for Slack for a specific person
 */
export function formatForSlackPerson(suggestions, personData, person) {
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
    'Contrarian Take': '🔥',
    'Value Tip': '💡',
    'Specific Insight': '💡',
    'Engagement Hook': '💬',
    'Question': '💬',
    'Observation': '👀',
    'Real Observation': '👀',
    'Thread Starter': '🧵',
    'Personal Update Style': '✨'
  };

  let message = `*🐦 Daily Tweet Suggestions for @${person.twitterHandle}*\n`;
  message += `_Generated: ${dateStr} ET_\n`;
  message += `_Based on ${personData.twitter.postCaptions?.length || 0} recent tweets_\n\n`;
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
 * Format suggestions for Slack (backwards compatible - for Ilias)
 */
export function formatForSlack(suggestions, iliasData) {
  return formatForSlackPerson(suggestions, iliasData, TEAM_MEMBERS.ilias);
}

/**
 * Send direct message to a specific person via Slack Bot API
 */
export async function sendToSlackPerson(message, person) {
  const botToken = process.env.SLACK_BOT_TOKEN;

  if (!botToken) {
    throw new Error('SLACK_BOT_TOKEN environment variable is required');
  }

  console.log(`📤 Sending DM to ${person.name} via Slack...`);

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${botToken}`
    },
    body: JSON.stringify({
      channel: person.slackUserId, // Sending to user ID creates a DM
      text: message,
      unfurl_links: false,
      unfurl_media: false
    })
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(`Slack API failed for ${person.name}: ${result.error}`);
  }

  console.log(`✅ DM sent to ${person.name} successfully!`);
}

/**
 * Send direct message to Ilias via Slack Bot API (backwards compatible)
 */
export async function sendToSlack(message) {
  return sendToSlackPerson(message, TEAM_MEMBERS.ilias);
}

/**
 * Run the full pipeline for a specific person
 */
export async function runDailyTweetSuggestionsForPerson(person) {
  console.log(`\n🚀 Starting Daily Tweet Suggestions Pipeline for ${person.name}\n`);
  console.log('━'.repeat(50));

  try {
    // Step 1: Fetch person's data
    const personData = await fetchPersonData(person);

    // Step 2: Analyze style
    const styleProfile = analyzeStyle(personData.twitter.postCaptions);
    console.log('📊 Style analysis complete:', {
      avgLength: styleProfile.avgLength,
      tone: styleProfile.tone,
      topics: styleProfile.topics.slice(0, 5)
    });

    // Step 3: Generate suggestions
    const suggestions = await generateSuggestionsForPerson(personData, styleProfile, person);

    if (!suggestions || suggestions.length === 0) {
      throw new Error(`No suggestions generated for ${person.name}`);
    }

    // Step 4: Format for Slack
    const slackMessage = formatForSlackPerson(suggestions, personData, person);

    // Step 5: Send to Slack
    await sendToSlackPerson(slackMessage, person);

    console.log('\n━'.repeat(50));
    console.log(`✅ Daily tweet suggestions sent to ${person.name} successfully!\n`);

    return { success: true, person: person.name, suggestions };

  } catch (error) {
    console.error(`\n❌ Error in tweet suggestion pipeline for ${person.name}:`, error.message);
    throw error;
  }
}

/**
 * Run the full pipeline for all team members
 */
export async function runDailyTweetSuggestionsForAll() {
  console.log('\n🚀 Starting Daily Tweet Suggestions Pipeline for ALL Team Members\n');
  console.log('═'.repeat(60));

  const results = [];
  const errors = [];

  for (const [key, person] of Object.entries(TEAM_MEMBERS)) {
    try {
      const result = await runDailyTweetSuggestionsForPerson(person);
      results.push(result);
    } catch (error) {
      console.error(`Failed for ${person.name}:`, error.message);
      errors.push({ person: person.name, error: error.message });
    }
  }

  console.log('\n═'.repeat(60));
  console.log(`✅ Completed: ${results.length} successful, ${errors.length} failed`);
  console.log('═'.repeat(60));

  return { results, errors };
}

/**
 * Main function - run the full pipeline (backwards compatible - runs for all)
 */
export async function runDailyTweetSuggestions() {
  return runDailyTweetSuggestionsForAll();
}
