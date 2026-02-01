import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * Google OAuth2 authentication service
 * Uses Cliqk Google credentials
 */

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
];

// Path to Cliqk Google token (contains credentials + tokens)
const CLIQK_TOKEN_PATH = '/Users/shawnreddy/projects/MCPs/tools/linear-weekly-digest/tokens/cliqk-google-token.json';

let oauth2Client = null;

/**
 * Initialize OAuth2 client
 */
export async function initGoogleAuth() {
  // Try environment variables first (for GitHub Actions)
  if (process.env.GOOGLE_CREDENTIALS) {
    return initFromEnvironment();
  }

  // Use Cliqk token file
  return initFromCliqkToken();
}

/**
 * Initialize from environment variables (for GitHub Actions)
 */
async function initFromEnvironment() {
  const credentials = process.env.GOOGLE_CREDENTIALS;

  let credentialsJson;
  try {
    credentialsJson = JSON.parse(Buffer.from(credentials, 'base64').toString('utf-8'));
  } catch {
    try {
      credentialsJson = JSON.parse(credentials);
    } catch {
      throw new Error('Invalid GOOGLE_CREDENTIALS format');
    }
  }

  // Service account
  if (credentialsJson.type === 'service_account') {
    const auth = new google.auth.GoogleAuth({
      credentials: credentialsJson,
      scopes: SCOPES,
    });
    oauth2Client = await auth.getClient();
    console.log('Initialized Google Auth with service account');
    return oauth2Client;
  }

  // OAuth2 with refresh token
  if (credentialsJson.refresh_token) {
    oauth2Client = new google.auth.OAuth2(
      credentialsJson.client_id,
      credentialsJson.client_secret,
      credentialsJson.redirect_uri
    );
    oauth2Client.setCredentials({
      access_token: credentialsJson.access_token,
      refresh_token: credentialsJson.refresh_token,
    });
    console.log('Initialized Google Auth with OAuth2 from environment');
    return oauth2Client;
  }

  throw new Error('Unknown credentials format');
}

/**
 * Initialize from Cliqk token file
 */
async function initFromCliqkToken() {
  if (!fs.existsSync(CLIQK_TOKEN_PATH)) {
    throw new Error(`Cliqk Google token not found at ${CLIQK_TOKEN_PATH}`);
  }

  const tokenData = JSON.parse(fs.readFileSync(CLIQK_TOKEN_PATH, 'utf8'));

  oauth2Client = new google.auth.OAuth2(
    tokenData.client_id,
    tokenData.client_secret,
    tokenData.redirect_uri
  );

  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
  });

  console.log('Initialized Google Auth from Cliqk token');
  return oauth2Client;
}

/**
 * Get the OAuth2 client
 */
export function getAuthClient() {
  if (!oauth2Client) {
    throw new Error('Google Auth not initialized. Call initGoogleAuth first.');
  }
  return oauth2Client;
}
