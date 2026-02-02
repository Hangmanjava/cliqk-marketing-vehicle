#!/usr/bin/env node

/**
 * Run Apify Actor Health Check
 * Tests all scrapers and generates a report
 */

import { runFullHealthCheck, generateUpdatedActorIds } from '../services/apify-health-check.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🏥 Starting Apify Actor Health Check...\n');

  try {
    // Run the health check
    const results = await runFullHealthCheck();

    // Generate timestamp for report filename
    const timestamp = new Date().toISOString().split('T')[0];
    const reportDir = path.join(process.cwd(), 'reports');

    // Ensure reports directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save the full report
    const reportPath = path.join(reportDir, `apify-health-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

    // Generate updated actor IDs if there are changes
    const updatedActorIds = generateUpdatedActorIds();
    console.log('\n📝 Recommended ACTOR_IDS:');
    console.log(JSON.stringify(updatedActorIds, null, 2));

    // Check for critical failures
    const criticalFailures = Object.entries(results.platforms)
      .filter(([_, result]) => result.status === 'failed')
      .map(([platform]) => platform);

    if (criticalFailures.length > 0) {
      console.log(`\n⚠️ CRITICAL: ${criticalFailures.length} platform(s) have no working actors:`);
      criticalFailures.forEach(platform => console.log(`  - ${platform}`));
      process.exit(1);
    }

    // Check for actors that needed fallback
    const fallbackActors = Object.entries(results.platforms)
      .filter(([_, result]) => result.source !== 'primary' && result.status === 'ok')
      .map(([platform, result]) => ({ platform, actorId: result.actorId }));

    if (fallbackActors.length > 0) {
      console.log(`\n⚠️ WARNING: ${fallbackActors.length} platform(s) using backup/store actors:`);
      fallbackActors.forEach(({ platform, actorId }) =>
        console.log(`  - ${platform}: ${actorId}`)
      );
    }

    console.log('\n✅ Health check completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
    process.exit(1);
  }
}

main();
