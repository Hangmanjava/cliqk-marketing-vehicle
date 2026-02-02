import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

/**
 * Firebase/Firestore integration for storing social media data
 * Project: cliqk-social-vehicle (424036189290)
 */

let db = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initFirebase() {
  if (getApps().length > 0) {
    db = getFirestore();
    return db;
  }

  // Try to load service account from environment or file
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Parse from environment variable (for GitHub Actions)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Load from file path
    const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } else {
    // Try default locations
    const defaultPaths = [
      path.join(process.cwd(), 'firebase-service-account.json'),
      path.join(process.cwd(), 'service-account.json'),
      '/Users/shawnreddy/projects/MCPs/tools/firebase-service-account.json',
    ];

    for (const filePath of defaultPaths) {
      if (fs.existsSync(filePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`Loaded Firebase credentials from: ${filePath}`);
        break;
      }
    }
  }

  if (!serviceAccount) {
    throw new Error(
      'Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT env var or place firebase-service-account.json in project root.'
    );
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: 'cliqk-social-vehicle',
  });

  db = getFirestore();
  console.log('Firebase initialized successfully');
  return db;
}

/**
 * Get Firestore database instance
 */
export function getDb() {
  if (!db) {
    initFirebase();
  }
  return db;
}

/**
 * Save weekly report data to Firestore
 * @param {object} reportData - The full weekly report data
 */
export async function saveWeeklyReport(reportData) {
  const db = getDb();
  const weekId = getWeekId(new Date());

  const reportDoc = {
    weekId,
    ...reportData,
    createdAt: FieldValue.serverTimestamp(),
  };

  // Save to weekly-reports collection
  await db.collection('weekly-reports').doc(weekId).set(reportDoc);
  console.log(`Saved weekly report: ${weekId}`);

  return weekId;
}

/**
 * Save individual platform data for real-time dashboard
 * @param {string} platform - Platform name (instagram, tiktok, etc.)
 * @param {Array} accounts - Array of account data
 */
export async function savePlatformData(platform, accounts) {
  const db = getDb();
  const batch = db.batch();
  const weekId = getWeekId(new Date());

  for (const account of accounts) {
    const docId = `${platform}-${account.handle}`;
    const docRef = db.collection('accounts').doc(docId);

    batch.set(docRef, {
      ...account,
      platform,
      weekId,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    // Also save to history for trending
    const historyRef = db
      .collection('accounts')
      .doc(docId)
      .collection('history')
      .doc(weekId);

    batch.set(historyRef, {
      ...account,
      weekId,
      scrapedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Saved ${accounts.length} ${platform} accounts to Firestore`);
}

/**
 * Save aggregated summary data
 * @param {object} summary - Summary with totals by platform
 */
export async function saveSummary(summary) {
  const db = getDb();
  const weekId = getWeekId(new Date());

  await db.collection('summaries').doc(weekId).set({
    weekId,
    ...summary,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Also update latest summary for dashboard
  await db.collection('summaries').doc('latest').set({
    weekId,
    ...summary,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Saved summary for week: ${weekId}`);
}

/**
 * Save sentiment analysis data
 * @param {object} sentiment - Sentiment analysis results
 */
export async function saveSentimentData(sentiment) {
  const db = getDb();
  const weekId = getWeekId(new Date());

  await db.collection('sentiment').doc(weekId).set({
    weekId,
    ...sentiment,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Saved sentiment data for week: ${weekId}`);
}

/**
 * Save video analysis data (TikTok hooks/virality)
 * @param {Array} analyses - Array of video analysis results
 */
export async function saveVideoAnalyses(analyses) {
  const db = getDb();
  const weekId = getWeekId(new Date());
  const batch = db.batch();

  for (const analysis of analyses) {
    const docId = `${weekId}-${analysis.handle}`;
    const docRef = db.collection('video-analyses').doc(docId);

    batch.set(docRef, {
      weekId,
      ...analysis,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Saved ${analyses.length} video analyses to Firestore`);
}

/**
 * Get week ID in format YYYY-WW
 */
function getWeekId(date) {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Push all scraped data to Firebase
 * @param {object} data - All scraped data
 */
export async function pushToFirebase(data) {
  const {
    instagram = [],
    tiktok = [],
    youtube = [],
    twitter = [],
    linkedin = [],
    reddit = [],
    beehiiv = [],
    summary = {},
    sentiment = {},
    videoAnalyses = [],
  } = data;

  try {
    initFirebase();

    // Save platform data in parallel
    await Promise.all([
      savePlatformData('instagram', instagram),
      savePlatformData('tiktok', Array.isArray(tiktok) ? tiktok : tiktok.profileData || []),
      savePlatformData('youtube', youtube),
      savePlatformData('twitter', twitter),
      savePlatformData('linkedin', linkedin),
      savePlatformData('reddit', reddit),
      savePlatformData('beehiiv', beehiiv),
    ]);

    // Save summary and sentiment
    if (Object.keys(summary).length > 0) {
      await saveSummary(summary);
    }

    if (Object.keys(sentiment).length > 0) {
      await saveSentimentData(sentiment);
    }

    // Save video analyses
    const tiktokAnalyses = tiktok.videoAnalyses || videoAnalyses || [];
    if (tiktokAnalyses.length > 0) {
      await saveVideoAnalyses(tiktokAnalyses);
    }

    // Save full weekly report
    await saveWeeklyReport(data);

    console.log('All data pushed to Firebase successfully');
    return true;
  } catch (error) {
    console.error('Failed to push to Firebase:', error.message);
    throw error;
  }
}
