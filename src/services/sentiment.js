import OpenAI from 'openai';

/**
 * Sentiment analysis service using OpenAI GPT-4o-mini
 */

let openai = null;

/**
 * Initialize OpenAI client
 */
export function initOpenAI(apiKey = process.env.OPENAI_API_KEY) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  openai = new OpenAI({ apiKey });
  return openai;
}

/**
 * Get the OpenAI client instance
 */
function getOpenAIClient() {
  if (!openai) {
    initOpenAI();
  }
  return openai;
}

/**
 * Analyze sentiment of text content
 * @param {string[]} texts - Array of text content to analyze
 * @returns {Promise<object>} Sentiment result with score and label
 */
export async function analyzeSentiment(texts) {
  if (!texts || texts.length === 0) {
    return { score: 0, label: 'Neutral', confidence: 0 };
  }

  const client = getOpenAIClient();

  // Limit text length to avoid token limits
  const combinedText = texts
    .slice(0, 50) // Max 50 pieces of content
    .map(t => t.slice(0, 500)) // Max 500 chars each
    .join('\n---\n')
    .slice(0, 10000); // Total max 10k chars

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis expert. Analyze the overall sentiment of the provided text content.

Return a JSON object with:
- score: A number from -1 (very negative) to +1 (very positive), with 0 being neutral
- label: "Negative", "Neutral", or "Positive"
- confidence: A number from 0 to 1 indicating how confident you are
- summary: A brief 1-sentence summary of the overall tone

Be objective and consider the business/social media context.`,
        },
        {
          role: 'user',
          content: `Analyze the sentiment of these social media posts/comments:\n\n${combinedText}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content);

    return {
      score: Math.max(-1, Math.min(1, result.score || 0)),
      label: result.label || categorizeScore(result.score),
      confidence: result.confidence || 0.5,
      summary: result.summary || '',
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error.message);
    return { score: 0, label: 'Neutral', confidence: 0, error: error.message };
  }
}

/**
 * Analyze sentiment for all scraped accounts
 * @param {Array} scrapedData - Array of scraped account data
 * @returns {Promise<Array>} Array of accounts with sentiment analysis
 */
export async function analyzeAllSentiment(scrapedData) {
  const results = [];

  for (const account of scrapedData) {
    console.log(`Analyzing sentiment for ${account.platform}/${account.handle}`);

    // Analyze content sentiment (the account's own posts)
    const contentSentiment = await analyzeSentiment(account.postCaptions || []);

    // Analyze audience sentiment (comments/replies)
    const audienceSentiment = await analyzeSentiment(account.audienceComments || []);

    results.push({
      platform: account.platform,
      handle: account.handle,
      type: account.type,
      contentSentiment,
      audienceSentiment,
    });

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

/**
 * Calculate aggregate sentiment across all accounts
 * @param {Array} sentimentResults - Array of sentiment analysis results
 * @returns {object} Aggregate sentiment scores
 */
export function calculateAggregateSentiment(sentimentResults) {
  const validContentScores = sentimentResults
    .filter(r => r.contentSentiment && r.contentSentiment.confidence > 0)
    .map(r => r.contentSentiment.score);

  const validAudienceScores = sentimentResults
    .filter(r => r.audienceSentiment && r.audienceSentiment.confidence > 0)
    .map(r => r.audienceSentiment.score);

  const avgContentScore = validContentScores.length > 0
    ? validContentScores.reduce((a, b) => a + b, 0) / validContentScores.length
    : 0;

  const avgAudienceScore = validAudienceScores.length > 0
    ? validAudienceScores.reduce((a, b) => a + b, 0) / validAudienceScores.length
    : 0;

  return {
    contentSentiment: {
      score: Math.round(avgContentScore * 100) / 100,
      label: categorizeScore(avgContentScore),
      sampleSize: validContentScores.length,
    },
    audienceSentiment: {
      score: Math.round(avgAudienceScore * 100) / 100,
      label: categorizeScore(avgAudienceScore),
      sampleSize: validAudienceScores.length,
    },
  };
}

/**
 * Categorize a sentiment score into a label
 * @param {number} score - Sentiment score (-1 to 1)
 * @returns {string} "Negative", "Neutral", or "Positive"
 */
function categorizeScore(score) {
  if (score >= 0.2) return 'Positive';
  if (score <= -0.2) return 'Negative';
  return 'Neutral';
}

/**
 * Compare sentiment between two periods
 * @param {object} currentSentiment - Current period sentiment
 * @param {object} previousSentiment - Previous period sentiment
 * @returns {object} Sentiment comparison with trend
 */
export function compareSentiment(currentSentiment, previousSentiment) {
  if (!previousSentiment) {
    return {
      contentTrend: 'stable',
      audienceTrend: 'stable',
      contentChange: 0,
      audienceChange: 0,
    };
  }

  const contentChange = currentSentiment.contentSentiment.score -
    (previousSentiment.contentSentiment?.score || 0);
  const audienceChange = currentSentiment.audienceSentiment.score -
    (previousSentiment.audienceSentiment?.score || 0);

  return {
    contentTrend: getTrend(contentChange),
    audienceTrend: getTrend(audienceChange),
    contentChange: Math.round(contentChange * 100) / 100,
    audienceChange: Math.round(audienceChange * 100) / 100,
  };
}

/**
 * Get trend direction based on change
 * @param {number} change - Score change
 * @returns {string} "improving", "stable", or "declining"
 */
function getTrend(change) {
  if (change >= 0.1) return 'improving';
  if (change <= -0.1) return 'declining';
  return 'stable';
}
