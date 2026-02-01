import { ApifyClient } from 'apify-client';

/**
 * Apify API wrapper for running scraper actors
 */

let client = null;

/**
 * Initialize the Apify client
 */
export function initApifyClient(token = process.env.APIFY_TOKEN) {
  if (!token) {
    throw new Error('APIFY_TOKEN is required');
  }
  client = new ApifyClient({ token });
  return client;
}

/**
 * Get the Apify client instance
 */
export function getApifyClient() {
  if (!client) {
    initApifyClient();
  }
  return client;
}

/**
 * Run an Apify actor and wait for results
 * @param {string} actorId - The actor ID (e.g., 'apify/instagram-profile-scraper')
 * @param {object} input - Input configuration for the actor
 * @param {object} options - Additional options
 * @returns {Promise<Array>} - Array of results from the actor
 */
export async function runActor(actorId, input, options = {}) {
  const apifyClient = getApifyClient();

  const { timeoutSecs = 300, memoryMbytes = 1024 } = options;

  console.log(`Running actor: ${actorId}`);

  try {
    const run = await apifyClient.actor(actorId).call(input, {
      timeoutSecs,
      memoryMbytes,
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    console.log(`Actor ${actorId} completed with ${items.length} results`);

    return items;
  } catch (error) {
    console.error(`Error running actor ${actorId}:`, error.message);
    throw error;
  }
}

/**
 * Run an actor with retry logic
 * @param {string} actorId - The actor ID
 * @param {object} input - Input configuration
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise<Array>} - Array of results
 */
export async function runActorWithRetry(actorId, input, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await runActor(actorId, input);
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${maxRetries} failed for ${actorId}: ${error.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Actor IDs for each platform
 */
export const ACTOR_IDS = {
  instagram: 'apify/instagram-profile-scraper',
  tiktok: 'clockworks/tiktok-scraper',
  youtube: 'streamers/youtube-channel-scraper',
  twitter: 'apidojo/tweet-scraper',
  linkedin: 'anchor/linkedin-profile-scraper',
  reddit: 'trudax/reddit-scraper',
  webScraper: 'apify/web-scraper',
};
