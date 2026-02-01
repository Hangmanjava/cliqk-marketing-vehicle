import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * TikTok video transcription service
 * Based on https://github.com/ajsai47/tiktok-transcribe
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.TIKTOK_OUTPUT_DIR || path.join(__dirname, '../../output/tiktok');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse VTT subtitle file to plain text
 * @param {string} vtt - VTT file contents
 * @returns {string} Plain text transcript
 */
function parseVTT(vtt) {
  const lines = vtt.split('\n');
  const textLines = [];
  let lastLine = '';

  for (const line of lines) {
    if (
      line.startsWith('WEBVTT') ||
      line.includes('-->') ||
      line.trim() === '' ||
      /^\d+$/.test(line.trim())
    ) {
      continue;
    }
    if (line.trim() !== lastLine.trim()) {
      textLines.push(line.trim());
      lastLine = line;
    }
  }

  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Get yt-dlp path (checks common locations)
 * @returns {string} Path to yt-dlp
 */
function getYtdlpPath() {
  const paths = [
    process.env.YTDLP_PATH,
    '/usr/local/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp',
    'yt-dlp', // System PATH
  ].filter(Boolean);

  for (const p of paths) {
    try {
      execSync(`${p} --version`, { encoding: 'utf8', stdio: 'pipe' });
      return p;
    } catch {
      continue;
    }
  }

  throw new Error('yt-dlp not found. Install with: brew install yt-dlp (Mac) or pip install yt-dlp');
}

/**
 * Transcribe a single TikTok video
 * @param {string} url - TikTok video URL
 * @param {object} options - Options
 * @returns {Promise<object>} Transcription result
 */
export async function transcribeVideo(url, options = {}) {
  const { verbose = false } = options;
  const ytdlp = getYtdlpPath();

  if (verbose) console.log(`Transcribing: ${url}`);

  // Get video ID
  let videoId;
  try {
    videoId = execSync(`${ytdlp} --print id "${url}" 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 30000,
    }).trim();
  } catch (e) {
    return { url, error: 'Failed to get video info', transcript: null };
  }

  // Try to get captions first (free)
  const subsPath = path.join(OUTPUT_DIR, `${videoId}.en.vtt`);
  const subsPathAlt = path.join(OUTPUT_DIR, `${videoId}.eng-US.vtt`);

  try {
    if (verbose) console.log('Checking for captions...');

    // Try multiple subtitle languages
    execSync(
      `${ytdlp} --write-subs --write-auto-subs --sub-lang "en.*,eng.*" --skip-download -o "${OUTPUT_DIR}/%(id)s" "${url}" 2>&1`,
      { encoding: 'utf8', timeout: 60000 }
    );

    // Check for any VTT file
    const files = fs.readdirSync(OUTPUT_DIR);
    const vttFile = files.find(f => f.startsWith(videoId) && f.endsWith('.vtt'));

    if (vttFile) {
      const vttPath = path.join(OUTPUT_DIR, vttFile);
      const vtt = fs.readFileSync(vttPath, 'utf8');
      const transcript = parseVTT(vtt);

      // Clean up
      fs.unlinkSync(vttPath);

      if (transcript && transcript.length > 0) {
        if (verbose) console.log(`Got transcript (${transcript.length} chars)`);
        return {
          url,
          videoId,
          transcript,
          method: 'captions',
        };
      }
    }
  } catch (e) {
    if (verbose) console.log('No captions found');
  }

  // If no captions, we could use Whisper API but that requires downloading
  // For now, return null transcript - can be enhanced later
  return {
    url,
    videoId,
    transcript: null,
    method: 'no-captions',
    note: 'Video has no captions. Would need Whisper API for transcription.',
  };
}

/**
 * Get video metadata from TikTok
 * @param {string} url - TikTok video URL
 * @returns {Promise<object>} Video metadata
 */
export async function getVideoMetadata(url) {
  const ytdlp = getYtdlpPath();

  try {
    const output = execSync(
      `${ytdlp} --dump-json "${url}" 2>/dev/null`,
      { encoding: 'utf8', timeout: 60000 }
    );

    const data = JSON.parse(output);

    return {
      id: data.id,
      title: data.title || data.description,
      description: data.description,
      duration: data.duration,
      viewCount: data.view_count,
      likeCount: data.like_count,
      commentCount: data.comment_count,
      uploadDate: data.upload_date,
      uploader: data.uploader,
      url: data.webpage_url,
    };
  } catch (e) {
    return { url, error: e.message };
  }
}

/**
 * Get recent videos from a TikTok profile (last 7 days)
 * @param {string} profileUrl - TikTok profile URL
 * @param {number} maxVideos - Maximum videos to fetch
 * @returns {Promise<Array>} Array of video URLs
 */
export async function getRecentVideos(profileUrl, maxVideos = 10) {
  const ytdlp = getYtdlpPath();

  try {
    // Get video list from profile
    const output = execSync(
      `${ytdlp} --flat-playlist --dump-json "${profileUrl}" 2>/dev/null | head -${maxVideos * 2}`,
      { encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
    );

    const videos = output
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Filter to last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentVideos = videos
      .filter(v => {
        if (!v.upload_date) return true; // Include if no date
        const uploadDate = parseUploadDate(v.upload_date);
        return uploadDate >= oneWeekAgo;
      })
      .slice(0, maxVideos);

    return recentVideos.map(v => ({
      id: v.id,
      url: v.url || `https://www.tiktok.com/@${v.uploader}/video/${v.id}`,
      title: v.title,
      uploadDate: v.upload_date,
    }));
  } catch (e) {
    console.error(`Failed to get videos from ${profileUrl}:`, e.message);
    return [];
  }
}

/**
 * Parse upload date from yt-dlp format (YYYYMMDD)
 * @param {string} dateStr - Date string
 * @returns {Date} Date object
 */
function parseUploadDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return new Date(0);
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return new Date(`${year}-${month}-${day}`);
}

/**
 * Transcribe multiple videos
 * @param {Array} videoUrls - Array of video URLs
 * @param {object} options - Options
 * @returns {Promise<Array>} Array of transcription results
 */
export async function transcribeVideos(videoUrls, options = {}) {
  const results = [];

  for (const url of videoUrls) {
    try {
      const result = await transcribeVideo(typeof url === 'string' ? url : url.url, options);
      results.push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      results.push({ url, error: e.message, transcript: null });
    }
  }

  return results;
}

/**
 * Clean up output directory
 */
export function cleanupOutput() {
  if (fs.existsSync(OUTPUT_DIR)) {
    const files = fs.readdirSync(OUTPUT_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(OUTPUT_DIR, file));
    }
  }
}
