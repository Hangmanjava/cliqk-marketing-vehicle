import { ApifyClient } from 'apify-client';

/**
 * Apify Actor Health Check Service
 * Tests actors and automatically finds replacements for broken ones
 */

// Primary actors - the ones we prefer to use
const PRIMARY_ACTORS = {
  instagram: 'apify/instagram-scraper',
  tiktok: 'clockworks/tiktok-scraper',
  youtube: 'streamers/youtube-channel-scraper',
  twitter: 'apidojo/tweet-scraper',
  reddit: 'trudax/reddit-scraper',
};

// Backup actors - alternatives to try if primary fails
const BACKUP_ACTORS = {
  instagram: [
    'apify/instagram-profile-scraper',
    'zuzka/instagram-scraper',
    'microworlds/instagram-scraper',
  ],
  tiktok: [
    'microworlds/tiktok-scraper',
    'reGrip/tiktok-scraper-light',
    'emastra/tiktok-scraper',
  ],
  youtube: [
    'bernardo/youtube-scraper',
    'apify/youtube-scraper',
    'microworlds/youtube-scraper',
  ],
  twitter: [
    'apidojo/twitter-scraper-v2',
    'microworlds/twitter-scraper',
    'quacker/twitter-scraper',
  ],
  reddit: [
    'epctex/reddit-scraper',
    'apify/reddit-scraper',
  ],
};

// Search keywords for finding actors in Apify Store
const PLATFORM_SEARCH_KEYWORDS = {
  instagram: ['instagram scraper', 'instagram profile', 'instagram posts'],
  tiktok: ['tiktok scraper', 'tiktok profile', 'tiktok videos'],
  youtube: ['youtube channel', 'youtube scraper', 'youtube videos'],
  twitter: ['twitter scraper', 'tweet scraper', 'x scraper'],
  reddit: ['reddit scraper', 'reddit posts'],
};

let client = null;
let healthCheckResults = {};

/**
 * Initialize the health check client
 */
export function initHealthCheck(token = process.env.APIFY_TOKEN) {
  if (!token) {
    throw new Error('APIFY_TOKEN is required');
  }
  client = new ApifyClient({ token });
  return client;
}

/**
 * Test if an actor is available and working
 */
export async function testActor(actorId, platform) {
  if (!client) {
    initHealthCheck();
  }

  console.log(`  Testing actor: ${actorId}`);

  try {
    // Check if actor exists and get info
    const actorInfo = await client.actor(actorId).get();

    if (!actorInfo) {
      console.log(`    ❌ Actor not found: ${actorId}`);
      return { working: false, error: 'Actor not found' };
    }

    // Check if actor is public or we have access
    if (!actorInfo.isPublic && !actorInfo.isOwner) {
      console.log(`    ❌ No access to actor: ${actorId}`);
      return { working: false, error: 'No access' };
    }

    // Check if actor has been deprecated
    if (actorInfo.isDeprecated) {
      console.log(`    ⚠️ Actor is deprecated: ${actorId}`);
      return { working: false, error: 'Deprecated' };
    }

    // Check last build status
    const builds = await client.actor(actorId).builds().list({ limit: 1 });
    if (builds.items.length > 0) {
      const lastBuild = builds.items[0];
      if (lastBuild.status === 'FAILED') {
        console.log(`    ⚠️ Last build failed: ${actorId}`);
        return { working: false, error: 'Build failed' };
      }
    }

    // Check recent runs for success rate
    const runs = await client.actor(actorId).runs().list({ limit: 10 });
    if (runs.items.length > 0) {
      const successRate = runs.items.filter(r => r.status === 'SUCCEEDED').length / runs.items.length;
      if (successRate < 0.5) {
        console.log(`    ⚠️ Low success rate (${(successRate * 100).toFixed(0)}%): ${actorId}`);
        return { working: false, error: `Low success rate: ${(successRate * 100).toFixed(0)}%`, successRate };
      }
    }

    console.log(`    ✅ Actor is healthy: ${actorId}`);
    return {
      working: true,
      actorId,
      name: actorInfo.name,
      stats: actorInfo.stats,
    };
  } catch (error) {
    console.log(`    ❌ Error testing actor ${actorId}: ${error.message}`);
    return { working: false, error: error.message };
  }
}

/**
 * Search Apify Store for alternative actors
 */
export async function searchForActors(platform) {
  if (!client) {
    initHealthCheck();
  }

  const keywords = PLATFORM_SEARCH_KEYWORDS[platform] || [`${platform} scraper`];
  const foundActors = new Set();

  console.log(`  Searching Apify Store for ${platform} actors...`);

  for (const keyword of keywords) {
    try {
      const searchResults = await client.actors().list({
        limit: 10,
        search: keyword,
      });

      for (const actor of searchResults.items) {
        // Skip if already in our lists
        if (actor.username && actor.name) {
          const actorId = `${actor.username}/${actor.name}`;

          // Filter for relevant actors
          if (
            actor.stats?.totalRuns > 100 &&
            actor.stats?.publicActorRunsLast30Days > 10
          ) {
            foundActors.add(actorId);
          }
        }
      }
    } catch (error) {
      console.log(`    Warning: Search failed for "${keyword}": ${error.message}`);
    }
  }

  return Array.from(foundActors);
}

/**
 * Find a working actor for a platform
 */
export async function findWorkingActor(platform) {
  console.log(`\n🔍 Finding working actor for ${platform}...`);

  // Try primary actor first
  const primaryActor = PRIMARY_ACTORS[platform];
  if (primaryActor) {
    const primaryResult = await testActor(primaryActor, platform);
    if (primaryResult.working) {
      return { actorId: primaryActor, source: 'primary' };
    }
  }

  // Try backup actors
  const backups = BACKUP_ACTORS[platform] || [];
  for (const backupActor of backups) {
    const backupResult = await testActor(backupActor, platform);
    if (backupResult.working) {
      console.log(`  📦 Using backup actor: ${backupActor}`);
      return { actorId: backupActor, source: 'backup' };
    }
  }

  // Search for new actors in the store
  console.log(`  🔎 Searching Apify Store for alternatives...`);
  const storeActors = await searchForActors(platform);

  for (const storeActor of storeActors) {
    // Skip if it's already a primary or backup
    if (
      storeActor === PRIMARY_ACTORS[platform] ||
      (BACKUP_ACTORS[platform] || []).includes(storeActor)
    ) {
      continue;
    }

    const storeResult = await testActor(storeActor, platform);
    if (storeResult.working) {
      console.log(`  🆕 Found new working actor from store: ${storeActor}`);
      return { actorId: storeActor, source: 'store' };
    }
  }

  console.log(`  ❌ No working actor found for ${platform}`);
  return null;
}

/**
 * Run health check on all platforms
 */
export async function runFullHealthCheck() {
  console.log('\n========================================');
  console.log('🏥 Apify Actor Health Check');
  console.log('========================================\n');

  const results = {
    timestamp: new Date().toISOString(),
    platforms: {},
    recommendations: [],
  };

  for (const platform of Object.keys(PRIMARY_ACTORS)) {
    console.log(`\n📱 Checking ${platform.toUpperCase()}...`);

    const workingActor = await findWorkingActor(platform);

    if (workingActor) {
      results.platforms[platform] = {
        status: 'ok',
        actorId: workingActor.actorId,
        source: workingActor.source,
      };

      if (workingActor.source !== 'primary') {
        results.recommendations.push({
          platform,
          message: `Consider updating ${platform} actor from ${PRIMARY_ACTORS[platform]} to ${workingActor.actorId}`,
          action: 'update_actor',
          currentActor: PRIMARY_ACTORS[platform],
          suggestedActor: workingActor.actorId,
        });
      }
    } else {
      results.platforms[platform] = {
        status: 'failed',
        actorId: null,
        error: 'No working actor found',
      };

      results.recommendations.push({
        platform,
        message: `⚠️ CRITICAL: No working actor found for ${platform}`,
        action: 'manual_intervention',
      });
    }
  }

  healthCheckResults = results;

  // Print summary
  console.log('\n========================================');
  console.log('📊 Health Check Summary');
  console.log('========================================');

  for (const [platform, result] of Object.entries(results.platforms)) {
    const status = result.status === 'ok' ? '✅' : '❌';
    const source = result.source ? ` (${result.source})` : '';
    console.log(`${status} ${platform}: ${result.actorId || 'FAILED'}${source}`);
  }

  if (results.recommendations.length > 0) {
    console.log('\n📝 Recommendations:');
    for (const rec of results.recommendations) {
      console.log(`  - ${rec.message}`);
    }
  }

  return results;
}

/**
 * Get the best actor for a platform (with automatic fallback)
 */
export async function getWorkingActorForPlatform(platform) {
  // Check if we have recent health check results
  if (healthCheckResults.platforms?.[platform]?.actorId) {
    return healthCheckResults.platforms[platform].actorId;
  }

  // Find a working actor
  const result = await findWorkingActor(platform);
  return result?.actorId || PRIMARY_ACTORS[platform];
}

/**
 * Get current health check results
 */
export function getHealthCheckResults() {
  return healthCheckResults;
}

/**
 * Generate updated ACTOR_IDS based on health check
 */
export function generateUpdatedActorIds() {
  const updated = { ...PRIMARY_ACTORS };

  for (const [platform, result] of Object.entries(healthCheckResults.platforms || {})) {
    if (result.status === 'ok' && result.actorId) {
      updated[platform] = result.actorId;
    }
  }

  return updated;
}
