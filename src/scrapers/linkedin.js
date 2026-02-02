/**
 * LinkedIn scraper
 * Reads impressions from Google Form responses (first sheet in the document)
 * Team members submit their LinkedIn impressions weekly via the form
 */

import { getLinkedInFormResponses } from '../services/google-sheets.js';

// LinkedIn accounts to track
const LINKEDIN_ACCOUNTS = [
  { handle: 'pavankumarny', url: 'https://www.linkedin.com/in/pavankumarny/', name: 'Pavan Kumar', email: 'pavan@mycliqk.com' },
  { handle: 'charles-legard-2953a2201', url: 'https://www.linkedin.com/in/charles-legard-2953a2201/', name: 'Charles Legard', email: 'charles@mycliqk.com' },
  { handle: 'marvin-ford-b99623186', url: 'https://www.linkedin.com/in/marvin-ford-b99623186/', name: 'Marvin Ford', email: 'marvin@mycliqk.com' },
  { handle: 'charana-athauda-784a24177', url: 'https://www.linkedin.com/in/charana-athauda-784a24177/', name: 'Charana Athauda', email: 'charana@mycliqk.com' },
  { handle: 'shawnreddy', url: 'https://www.linkedin.com/in/shawnreddy/', name: 'Shawn Reddy', email: 'shawn@mycliqk.com' },
  { handle: 'brandon-garcia-530629369', url: 'https://www.linkedin.com/in/brandon-garcia-530629369/', name: 'Brandon Garcia', email: 'brandon@mycliqk.com' },
  { handle: 'gary-sargeant07', url: 'https://www.linkedin.com/in/gary-sargeant07/', name: 'Gary Sargeant', email: 'gary@mycliqk.com' },
  { handle: 'alvin-qingkai-pan', url: 'https://www.linkedin.com/in/alvin-qingkai-pan/', name: 'Alvin Pan', email: 'alvin@mycliqk.com' },
  { handle: 'hriday-narang', url: 'https://www.linkedin.com/in/hriday-narang/', name: 'Hriday Narang', email: 'hriday@mycliqk.com' },
  { handle: 'armaan-hossain', url: 'https://www.linkedin.com/in/armaan-hossain/', name: 'Armaan Hossain', email: 'armaan@mycliqk.com' },
  { handle: 'rohangurram', url: 'https://www.linkedin.com/in/rohangurram/', name: 'Rohan Gurram', email: 'rohan@mycliqk.com' },
];

// Company page
const LINKEDIN_COMPANY = {
  handle: 'mycliqk',
  url: 'https://www.linkedin.com/company/mycliqk/',
  name: 'Cliqk',
};

/**
 * Match form response to account by name, email, or handle
 */
function matchResponseToAccount(response, account) {
  const responseName = response.name?.toLowerCase().trim() || '';
  const responseEmail = response.email?.toLowerCase().trim() || '';
  const responseHandle = response.handle?.toLowerCase().trim() || '';

  const accountName = account.name?.toLowerCase() || '';
  const accountEmail = account.email?.toLowerCase() || '';
  const accountHandle = account.handle?.toLowerCase() || '';

  // Match by email (most reliable)
  if (responseEmail && accountEmail && responseEmail.includes(accountEmail.split('@')[0])) {
    return true;
  }

  // Match by name
  if (responseName && accountName) {
    const nameParts = accountName.split(' ');
    if (nameParts.some(part => responseName.includes(part))) {
      return true;
    }
  }

  // Match by handle
  if (responseHandle && accountHandle && responseHandle.includes(accountHandle)) {
    return true;
  }

  return false;
}

/**
 * Scrape LinkedIn - reads impressions from form responses
 */
export async function scrapeLinkedIn() {
  console.log('Reading LinkedIn impressions from form responses...');

  // Get form responses from the first sheet
  const formResponses = await getLinkedInFormResponses();

  const results = [];
  let totalImpressions = 0;
  let submittedCount = 0;

  // Add profile accounts with matched impressions
  for (const account of LINKEDIN_ACCOUNTS) {
    // Find matching form response
    const matchedResponse = formResponses.find(r => matchResponseToAccount(r, account));

    const impressions = matchedResponse?.impressions || 0;
    if (impressions > 0) {
      submittedCount++;
      totalImpressions += impressions;
    }

    results.push({
      platform: 'linkedin',
      type: 'profile',
      handle: account.handle,
      name: account.name,
      url: account.url,
      impressions,
      engagement: 0,
      followers: 0,
      submitted: !!matchedResponse,
      scrapedAt: new Date().toISOString(),
    });

    if (matchedResponse) {
      console.log(`  ✓ ${account.name}: ${impressions.toLocaleString()} impressions`);
    }
  }

  // Add company page (no form data for this typically)
  results.push({
    platform: 'linkedin',
    type: 'company',
    handle: LINKEDIN_COMPANY.handle,
    name: LINKEDIN_COMPANY.name,
    url: LINKEDIN_COMPANY.url,
    impressions: 0,
    engagement: 0,
    followers: 0,
    submitted: false,
    scrapedAt: new Date().toISOString(),
  });

  const notSubmitted = LINKEDIN_ACCOUNTS.length - submittedCount;

  console.log(`  📊 LinkedIn Total: ${totalImpressions.toLocaleString()} impressions from ${submittedCount} submissions`);
  if (notSubmitted > 0) {
    console.log(`  ⚠️ ${notSubmitted} team members haven't submitted yet`);
  }

  return results;
}

// Export accounts for reference
export { LINKEDIN_ACCOUNTS, LINKEDIN_COMPANY };
