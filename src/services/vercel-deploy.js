import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DASHBOARD_PATH = path.join(process.cwd(), 'dashboard', 'public');
const DATA_FILE = path.join(DASHBOARD_PATH, 'data.json');
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || 'txQbygX6uJNaI5fHF240HMvH';

/**
 * Save dashboard data to JSON file
 */
export function saveDashboardData(data) {
  const dashboardData = {
    generatedAt: new Date().toISOString(),
    accounts: data.accounts || [],
    summary: data.summary || {},
    sentiment: data.sentiment || {},
    videoAnalyses: data.videoAnalyses || [],
    comparison: data.comparison || {},
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(dashboardData, null, 2));
  console.log(`Dashboard data saved to ${DATA_FILE}`);
  return DATA_FILE;
}

/**
 * Deploy dashboard to Vercel
 */
export async function deployToVercel() {
  console.log('Deploying dashboard to Vercel...');

  try {
    const result = execSync(
      `npx vercel ${DASHBOARD_PATH} --token ${VERCEL_TOKEN} --yes --prod 2>&1`,
      { encoding: 'utf-8', timeout: 120000 }
    );

    // Extract URL from output
    const urlMatch = result.match(/https:\/\/[^\s]+\.vercel\.app/);
    const deployUrl = urlMatch ? urlMatch[0] : null;

    console.log('Vercel deployment complete!');
    if (deployUrl) {
      console.log(`Dashboard URL: ${deployUrl}`);
    }

    return { success: true, url: deployUrl, output: result };
  } catch (error) {
    console.error('Vercel deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Save data and deploy to Vercel
 */
export async function saveAndDeploy(data) {
  saveDashboardData(data);
  return await deployToVercel();
}
