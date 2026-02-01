import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * Google OAuth2 authentication service
 * Uses credentials from google-mcp or environment variables
 */

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
];

// Default paths for google-mcp credentials
const GOOGLE_MCP_DIR = path.join(
  process.env.HOME || '',
  'Library/Application Support/google-mcp'
);
const CREDENTIALS_PATH = path.join(GOOGLE_MCP_DIR, 'credentials.json');
const TOKENS_PATH = path.join(GOOGLE_MCP_DIR, 'tokens.json');

let oauth2Client = null;

/**
 * Initialize OAuth2 client from google-mcp credentials or environment
 */
export async function initGoogleAuth() {
  // Try environment variables first (for GitHub Actions)
  if (process.env.GOOGLE_CREDENTIALS) {
    return initFromEnvironment();
  }

  // Fall back to google-mcp local credentials
  return initFromLocalCredentials();
}

/**
 * Initialize from environment variables (service account or OAuth)
 */
async function initFromEnvironment() {
  const credentials = process.env.GOOGLE_CREDENTIALS;

  let credentialsJson;
  try {
    // Try base64 decode first
    credentialsJson = JSON.parse(Buffer.from(credentials, 'base64').toString('utf-8'));
  } catch {
    try {
      credentialsJson = JSON.parse(credentials);
    } catch {
      throw new Error('Invalid GOOGLE_CREDENTIALS format');
    }
  }

  // Check if it's a service account
  if (credentialsJson.type === 'service_account') {
    const auth = new google.auth.GoogleAuth({
      credentials: credentialsJson,
      scopes: SCOPES,
    });
    oauth2Client = await auth.getClient();
    console.log('Initialized Google Auth with service account');
    return oauth2Client;
  }

  // OAuth2 credentials from environment
  if (credentialsJson.web || credentialsJson.installed) {
    const creds = credentialsJson.web || credentialsJson.installed;
    oauth2Client = new google.auth.OAuth2(
      creds.client_id,
      creds.client_secret,
      creds.redirect_uris?.[0]
    );

    // Need refresh token from environment
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refreshToken) {
      throw new Error('GOOGLE_REFRESH_TOKEN required for OAuth2 credentials');
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    console.log('Initialized Google Auth with OAuth2 from environment');
    return oauth2Client;
  }

  throw new Error('Unknown credentials format');
}

/**
 * Initialize from local google-mcp credentials
 */
async function initFromLocalCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Google credentials not found at ${CREDENTIALS_PATH}`);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const creds = credentials.web || credentials.installed;

  oauth2Client = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    creds.redirect_uris?.[0]
  );

  // Load existing tokens
  if (fs.existsSync(TOKENS_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);

    // Check if we need additional scopes
    const currentScopes = tokens.scope?.split(' ') || [];
    const needsSheets = !currentScopes.some(s => s.includes('spreadsheets'));

    if (needsSheets) {
      console.log('\n⚠️  Google tokens missing spreadsheets scope.');
      console.log('Run this to re-authorize with all scopes:');
      console.log('  node src/services/google-auth.js\n');
    }

    console.log('Initialized Google Auth from local credentials');
    return oauth2Client;
  }

  throw new Error('No tokens found. Run authorization flow first.');
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

/**
 * Generate authorization URL for new tokens
 */
export function getAuthUrl() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const creds = credentials.web || credentials.installed;

  const client = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    'http://localhost:3000/oauth/callback'
  );

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCode(code) {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const creds = credentials.web || credentials.installed;

  const client = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    'http://localhost:3000/oauth/callback'
  );

  const { tokens } = await client.getToken(code);

  // Save tokens
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
  console.log('Tokens saved to', TOKENS_PATH);

  return tokens;
}

// CLI for authorization flow
if (process.argv[1]?.endsWith('google-auth.js')) {
  const args = process.argv.slice(2);

  if (args[0] === '--code') {
    // Exchange code for tokens
    exchangeCode(args[1])
      .then(tokens => {
        console.log('Authorization successful!');
        console.log('Scopes:', tokens.scope);
      })
      .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
      });
  } else {
    // Generate auth URL
    console.log('\n🔐 Google Authorization Required\n');
    console.log('1. Open this URL in your browser:\n');
    console.log(getAuthUrl());
    console.log('\n2. After authorizing, you\'ll be redirected to a URL like:');
    console.log('   http://localhost:3000/oauth/callback?code=XXXXXX\n');
    console.log('3. Copy the code and run:');
    console.log('   node src/services/google-auth.js --code YOUR_CODE\n');
  }
}
