#!/usr/bin/env node
/**
 * Daily Tweet Suggestions Runner
 * CLI entry point for GitHub Actions
 */

import { runDailyTweetSuggestions } from '../services/tweet-suggester.js';

async function main() {
  console.log('═'.repeat(60));
  console.log('  🐦 DAILY TWEET SUGGESTIONS FOR @iliasanwar_');
  console.log('═'.repeat(60));
  console.log(`  Started at: ${new Date().toISOString()}`);
  console.log('═'.repeat(60));
  console.log('');

  try {
    const result = await runDailyTweetSuggestions();

    console.log('');
    console.log('═'.repeat(60));
    console.log('  ✅ COMPLETED SUCCESSFULLY');
    console.log(`  Generated ${result.suggestions?.length || 0} tweet suggestions`);
    console.log('═'.repeat(60));

    process.exit(0);

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
