#!/usr/bin/env node
/**
 * Daily Tweet Suggestions Runner
 * CLI entry point for GitHub Actions
 * Runs for all configured team members (Ilias and Rohan)
 */

import { runDailyTweetSuggestionsForAll, TEAM_MEMBERS } from '../services/tweet-suggester.js';

async function main() {
  const teamNames = Object.values(TEAM_MEMBERS).map(p => `@${p.twitterHandle}`).join(', ');

  console.log('═'.repeat(60));
  console.log('  🐦 DAILY TWEET SUGGESTIONS');
  console.log(`  Team: ${teamNames}`);
  console.log('═'.repeat(60));
  console.log(`  Started at: ${new Date().toISOString()}`);
  console.log('═'.repeat(60));
  console.log('');

  try {
    const { results, errors } = await runDailyTweetSuggestionsForAll();

    console.log('');
    console.log('═'.repeat(60));
    console.log('  ✅ COMPLETED');
    console.log(`  Successful: ${results.length} team members`);
    results.forEach(r => {
      console.log(`    - ${r.person}: ${r.suggestions?.length || 0} suggestions`);
    });

    if (errors.length > 0) {
      console.log(`  Failed: ${errors.length} team members`);
      errors.forEach(e => {
        console.log(`    - ${e.person}: ${e.error}`);
      });
    }
    console.log('═'.repeat(60));

    // Exit with error if any failed
    process.exit(errors.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('  ❌ FAILED');
    console.error(`  Error: ${error.message}`);
    console.error('═'.repeat(60));

    // Log full error for debugging
    if (process.env.DEBUG) {
      console.error('\nFull error:', error);
    }

    process.exit(1);
  }
}

main();
