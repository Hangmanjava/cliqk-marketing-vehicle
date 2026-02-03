/**
 * Tweet Suggester Service
 * Generates daily tweet/post suggestions based on style analysis
 * Supports multiple team members
 * Pulls upcoming events from Luma calendar for event-based posts
 */

import OpenAI from 'openai';

const DASHBOARD_DATA_URL = 'https://www.cliqksocials.com/data.json';
const LUMA_CALENDAR_URL = 'https://api2.luma.com/ics/get?entity=calendar&id=cal-TxFaacoX3utLK3Q';

// Team member configurations
export const TEAM_MEMBERS = {
  ilias: {
    name: 'Ilias',
    twitterHandle: 'iliasanwar_',
    slackUserId: 'U09LPE3QR97',
    role: 'Co-Founder and CMO of Cliqk',
    topics: ['distribution', 'creators', 'growth', 'content', 'marketing', 'community', 'events', 'founder life'],
    context: 'He runs Cliqk (social media analytics for creators). Building in public, growing Cliqk. Hosts founder events and breakfast clubs in NYC. Audience: creators, founders, marketers. He writes long-form, story-driven posts on X - personal updates, founder reflections, and event promotions.',
    lumaCalendarUrl: LUMA_CALENDAR_URL
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
 * Fetch upcoming events from Luma calendar
 */
export async function fetchLumaEvents(person) {
  if (!person.lumaCalendarUrl) {
    return [];
  }

  console.log(`📅 Fetching Luma events for ${person.name}...`);

  try {
    const response = await fetch(person.lumaCalendarUrl);
    if (!response.ok) {
      console.log('⚠️ Could not fetch Luma calendar, skipping events');
      return [];
    }

    const icsText = await response.text();
    const events = parseICSEvents(icsText);

    // Filter to upcoming events (next 30 days)
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcoming = events
      .filter(e => e.date >= now && e.date <= thirtyDaysOut)
      .sort((a, b) => a.date - b.date);

    console.log(`✅ Found ${upcoming.length} upcoming events in next 30 days`);
    return upcoming;
  } catch (e) {
    console.log('⚠️ Error fetching Luma events:', e.message);
    return [];
  }
}

/**
 * Parse ICS calendar text into event objects
 */
function parseICSEvents(icsText) {
  const events = [];
  const eventBlocks = icsText.split('BEGIN:VEVENT');

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i].split('END:VEVENT')[0];

    const summary = block.match(/SUMMARY:(.*)/)?.[1]?.trim() || '';
    const dtstart = block.match(/DTSTART[^:]*:(.*)/)?.[1]?.trim() || '';
    const location = block.match(/LOCATION:(.*)/)?.[1]?.trim() || '';
    const description = block.match(/DESCRIPTION:(.*?)(?=\r?\n[A-Z])/s)?.[1]?.trim() || '';
    const url = block.match(/URL:(.*)/)?.[1]?.trim() || '';

    let date = null;
    if (dtstart) {
      // Parse YYYYMMDDTHHMMSSZ or YYYYMMDD format
      const cleaned = dtstart.replace(/[^0-9T]/g, '');
      if (cleaned.length >= 8) {
        const year = cleaned.substring(0, 4);
        const month = cleaned.substring(4, 6);
        const day = cleaned.substring(6, 8);
        const hour = cleaned.length >= 11 ? cleaned.substring(9, 11) : '00';
        const min = cleaned.length >= 13 ? cleaned.substring(11, 13) : '00';
        date = new Date(`${year}-${month}-${day}T${hour}:${min}:00Z`);
      }
    }

    if (summary && date && !isNaN(date.getTime())) {
      events.push({
        name: summary,
        date,
        location: location.replace(/\\,/g, ',').replace(/\\n/g, ' '),
        description: description.replace(/\\n/g, '\n').replace(/\\,/g, ',').substring(0, 300),
        url
      });
    }
  }

  return events;
}

/**
 * Analyze tweet style patterns
 */
export function analyzeStyle(tweets) {
  if (!tweets || tweets.length === 0) {
    return {
      avgLength: 800,
      usesHashtags: false,
      usesEmojis: true,
      usesQuestions: false,
      usesLinks: true,
      tone: 'conversational',
      topics: ['distribution', 'creators', 'growth', 'community', 'events']
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
 * Generate 5 tweet/post suggestions using OpenAI for a specific person
 */
export async function generateSuggestionsForPerson(personData, styleProfile, person) {
  console.log(`🤖 Generating post suggestions for ${person.name} with AI...`);

  const openai = getOpenAIClient();
  const currentContext = await fetchCurrentContext();

  // Fetch upcoming Luma events if available
  const upcomingEvents = await fetchLumaEvents(person);
  const eventsContext = upcomingEvents.length > 0
    ? upcomingEvents.map(e => {
        const dateStr = e.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        return `- "${e.name}" on ${dateStr}${e.location ? ` at ${e.location}` : ''}${e.url ? ` (${e.url})` : ''}`;
      }).join('\n')
    : 'No upcoming events found';

  const recentTweets = personData.twitter.postCaptions?.slice(0, 10).join('\n\n---\n\n') || 'No recent tweets available';

  const prompt = `You are ghostwriting long-form X (Twitter) posts for ${person.name} (@${person.twitterHandle}), ${person.role}.

## WRITING STYLE - THIS IS CRITICAL

These are NOT short tweets. These are long-form X posts. Study these two real examples of the EXACT style to replicate:

### EXAMPLE 1 - Personal Update / Founder Story:
"""
Little update:

3-months ago me + @sharifshameem wanted to do a simple experiment: build something together for 12 weeks, see if we liked working together, and if it felt right we'd go big and start a real company.

We built Tidbit, a new interface for Claude that focused on collaboration.

It went well. Got to revenue, paying teams, distribution on TikTok, all the good stuff.

3-months later:

We're not continuing with it, and are deciding to go our separate ways.

Not much drama. We really, really enjoyed working together. We proved we can ship fast and create momentum. It was a 10/10 time.

But we also learned this specific problem set (even though it is quite lucrative) isn't the one that gets either of us out of bed excited every morning.

We both have the personality where we could "force" obsession out of ourselves, but, just didn't feel right in this case.

And, in all honesty as individuals we're not super sure which problem sets we want to go after next.

So we're both taking some time, thinking, and going our separate directions for now. If we both feel a desire to work on the same problem set, we'll join forces again!

Overall, no regrets.

Last 3-months were magical. And it was cool to do it all alongside one of my best friends ❤️
"""

### EXAMPLE 2 - Event Promotion:
"""
We host a founder breakfast club every month

I don't say this combination of words often, but it is what I describe as an 'insanely awesome vibe.'

We invite ambitious founders across all disciplines:

- a Harvard alum turned pro bodybuilding turned founder
- a pro MLB player (Seattle Mariners) turned founder
- possibly the most well-connected person in the creator economy in the world
- Harvard phd building "AI computational drug discovery via cloud-native computing chemistry workflows" (Im too dumb to know what this means)
- 3x Ironman turned founder, now building agentic AI for women's health
 ... and many more

Our last one was on Friday with @rhobusiness & @thoropass  (we love them)

Four investors managed to sneak in too. See if you can spot them in the pics

Next one on Feb 26. DM me or see link below.
"""

## KEY STYLE RULES:
1. **LONG-FORM**: Each post should be 500-1500 characters. Multiple paragraphs. NOT short tweets.
2. **Line breaks between paragraphs** - lots of whitespace, easy to scan
3. **Conversational and personal** - like texting a friend, not writing a LinkedIn post
4. **Storytelling structure** - hook at top, story/details in middle, reflection or CTA at end
5. **Specific details** - real names, @handles, specific descriptions of people, concrete numbers
6. **Bullet points with dashes** for lists (not numbered lists)
7. **Sparse emoji** - 0-2 max, usually one at the very end (❤️ or similar)
8. **Self-deprecating humor** is good ("Im too dumb to know what this means")
9. **Honest and vulnerable** - share real feelings, not just wins
10. **NO hashtags, NO "Thread 🧵", NO generic motivational fluff**
11. **NO AI-sounding phrases** like "game-changer", "unlock", "here's the thing", "let me tell you"

## ${person.name}'s ACTUAL recent posts (study their voice):
${recentTweets}

## ${person.name}'s context:
- ${person.context}
- Topics: ${styleProfile.topics.join(', ') || person.topics.join(', ')}
- ${personData.twitter.followers?.toLocaleString() || '~1K'} followers
- ${styleProfile.usesEmojis ? 'Sometimes uses emojis (sparingly)' : 'Rarely uses emojis'}

## Current events/trends:
${currentContext}

## Upcoming events from ${person.name}'s Luma calendar:
${eventsContext}

## Generate 5 LONG-FORM posts that sound EXACTLY like ${person.name}:

1. **Personal Update / Founder Story** - Share a real-feeling update about building Cliqk, a lesson learned, a decision made, a pivot, a reflection. Multi-paragraph, honest, vulnerable. (Like Example 1 above)
2. **Event Promotion** - Promote an upcoming event from the Luma calendar (or a recurring event like breakfast club). Describe the types of people who attend with specific, colorful bullet points. Include a CTA. (Like Example 2 above)
3. **Contrarian / Hot Take** - Challenge a common belief in the creator/founder space. But do it in a long-form, thoughtful way with a story or specific example backing it up. Not just a one-liner.
4. **Behind the Scenes / Building in Public** - Share something specific about what's happening at Cliqk right now - a metric, a feature, a customer interaction, a team moment. Make it feel real and unpolished.
5. **Community / Relationships** - A post about the people around ${person.name} - co-founders, other founders, community members. Celebrate someone, share a story about a connection, or reflect on the value of community.

CRITICAL REQUIREMENTS:
- EVERY post MUST be 500-1500 characters. Posts under 400 characters are REJECTED.
- Use multiple paragraphs with line breaks between them
- Include specific details, names, @handles where natural
- Sound human and personal, NOT like AI generated content
- For the Event Promotion post: USE THE ACTUAL UPCOMING EVENTS from the Luma calendar data above

## Output JSON:
{
  "suggestions": [
    {
      "type": "Personal Update",
      "tweet": "full post text with line breaks using actual newline characters",
      "why": "why this would resonate with their audience",
      "charCount": 850
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert X/Twitter ghostwriter specializing in long-form, story-driven posts for founders. Always respond with valid JSON matching the requested format. Every post must be multi-paragraph and 500-1500 characters.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.85,
    max_tokens: 6000,
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content);

  console.log(`✅ Generated ${result.suggestions?.length || 0} post suggestions`);

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
    'Personal Update': '📝',
    'Personal Update / Founder Story': '📝',
    'Event Promotion': '🎪',
    'Contrarian Take': '🔥',
    'Contrarian / Hot Take': '🔥',
    'Hot Take': '🔥',
    'Behind the Scenes': '🛠️',
    'Behind the Scenes / Building in Public': '🛠️',
    'Building in Public': '🛠️',
    'Community / Relationships': '🤝',
    'Community': '🤝',
    'Value Tip': '💡',
    'Specific Insight': '💡',
    'Engagement Hook': '💬',
    'Question': '💬',
    'Observation': '👀',
    'Real Observation': '👀',
    'Thread Starter': '🧵',
    'Personal Update Style': '✨'
  };

  let message = `*📝 Daily Post Suggestions for @${person.twitterHandle}*\n`;
  message += `_Generated: ${dateStr} ET_\n`;
  message += `_Based on ${personData.twitter.postCaptions?.length || 0} recent posts + Luma events_\n\n`;
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
  message += `_Copy any post above and share on X!_`;

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
  console.log(`\n🚀 Starting Daily Post Suggestions Pipeline for ${person.name}\n`);
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

    // Log character counts to verify long-form output
    suggestions.forEach((s, i) => {
      const len = s.tweet?.length || 0;
      console.log(`  Post ${i + 1} (${s.type}): ${len} chars ${len < 400 ? '⚠️ SHORT' : '✅'}`);
    });

    // Step 4: Format for Slack
    const slackMessage = formatForSlackPerson(suggestions, personData, person);

    // Step 5: Send to Slack
    await sendToSlackPerson(slackMessage, person);

    console.log('\n━'.repeat(50));
    console.log(`✅ Daily post suggestions sent to ${person.name} successfully!\n`);

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
  console.log('\n🚀 Starting Daily Post Suggestions Pipeline for ALL Team Members\n');
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
