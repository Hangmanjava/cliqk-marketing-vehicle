import { ApifyClient } from 'apify-client';
import { getWorkingActorForPlatform, testActor } from './apify-health-check.js';

/**
 * Apify API wrapper for running scraper actors
 */

let client = null;
let actorOverrides = {}; // Runtime overrides for failed actors

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
 * Set an actor override (used when an actor fails and needs replacement)
 */
export function setActorOverride(platform, actorId) {
  actorOverrides[platform] = actorId;
  console.log(`  📝 Actor override set for ${platform}: ${actorId}`);
}

/**
 * Get the active actor for a platform (with override support)
 */
export function getActiveActor(platform) {
  return actorOverrides[platform] || ACTOR_IDS[platform];
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

  console.log(`Running actor: ${actorId}`);

  try {
    // Note: Don't pass timeout/memory options - they cause errors with some actors
    const run = await apifyClient.actor(actorId).call(input);

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
 * Run an actor with automatic fallback to alternative actors
 * @param {string} platform - The platform name (instagram, tiktok, etc.)
 * @param {object} input - Input configuration for the actor
 * @param {object} options - Additional options
 * @returns {Promise<Array>} - Array of results from the actor
 */
export async function runActorWithFallback(platform, input, options = {}) {
  // Get the current active actor for this platform
  let actorId = getActiveActor(platform);

  try {
    // Try the primary/current actor
    return await runActorWithRetry(actorId, input, 2);
  } catch (primaryError) {
    console.log(`⚠️ Primary actor ${actorId} failed, searching for alternative...`);

    try {
      // Find a working alternative
      const workingActor = await getWorkingActorForPlatform(platform);

      if (workingActor && workingActor !== actorId) {
        console.log(`  🔄 Trying alternative actor: ${workingActor}`);
        setActorOverride(platform, workingActor);

        // Try the alternative
        const results = await runActorWithRetry(workingActor, input, 2);
        console.log(`  ✅ Alternative actor ${workingActor} succeeded!`);
        return results;
      }
    } catch (fallbackError) {
      console.log(`  ❌ Fallback also failed: ${fallbackError.message}`);
    }

    // If all else fails, throw the original error
    throw primaryError;
  }
}

/**
 * Actor IDs for each platform
 */
export const ACTOR_IDS = {
  instagram: 'apify/instagram-scraper',
  tiktok: 'clockworks/tiktok-scraper',
  youtube: 'streamers/youtube-channel-scraper',
  twitter: 'apidojo/tweet-scraper',
  linkedin: 'curious_coder/linkedin-profile-scraper',
  reddit: 'trudax/reddit-scraper',
  webScraper: 'apify/web-scraper',
};
