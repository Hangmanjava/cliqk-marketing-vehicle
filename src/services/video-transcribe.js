import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Unified video transcription service for TikTok and Instagram Reels
 * Uses yt-dlp for downloading and OpenAI Whisper for transcription
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.VIDEO_OUTPUT_DIR || path.join(__dirname, '../../output/videos');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse VTT subtitle file to plain text
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
 */
function getYtdlpPath() {
  const paths = [
    process.env.YTDLP_PATH,
    '/Users/shawnreddy/Library/Python/3.9/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp',
    'yt-dlp',
  ].filter(Boolean);

  for (const p of paths) {
    try {
      execSync(`${p} --version`, { encoding: 'utf8', stdio: 'pipe' });
      return p;
    } catch {
      continue;
    }
  }

  throw new Error('yt-dlp not found. Install with: brew install yt-dlp or pip install yt-dlp');
}

/**
 * Parse upload date from yt-dlp format (YYYYMMDD)
 */
function parseUploadDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return new Date(0);
  const year = dateStr.slice(0, 4);
  const month = dateStr.slice(4, 6);
  const day = dateStr.slice(6, 8);
  return new Date(`${year}-${month}-${day}`);
}

/**
 * Detect platform from URL
 */
function detectPlatform(url) {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'unknown';
}

/**
 * Transcribe a single video (works for TikTok, Instagram Reels, YouTube Shorts)
 * @param {string} url - Video URL
 * @param {object} options - Options
 * @returns {Promise<object>} Transcription result
 */
export async function transcribeVideo(url, options = {}) {
  const { verbose = false } = options;
  const ytdlp = getYtdlpPath();
  const platform = detectPlatform(url);

  if (verbose) console.log(`Transcribing (${platform}): ${url}`);

  // Get video ID
  let videoId;
  try {
    videoId = execSync(`${ytdlp} --print id "${url}" 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 30000,
    }).trim();
  } catch (e) {
    return { url, platform, error: 'Failed to get video info', transcript: null };
  }

  // Try to get captions first (free)
  try {
    if (verbose) console.log('  Checking for captions...');

    execSync(
      `${ytdlp} --write-subs --write-auto-subs --sub-lang "en.*,eng.*" --skip-download -o "${OUTPUT_DIR}/%(id)s" "${url}" 2>&1`,
      { encoding: 'utf8', timeout: 60000 }
    );

    const files = fs.readdirSync(OUTPUT_DIR);
    const vttFile = files.find(f => f.startsWith(videoId) && f.endsWith('.vtt'));

    if (vttFile) {
      const vttPath = path.join(OUTPUT_DIR, vttFile);
      const vtt = fs.readFileSync(vttPath, 'utf8');
      const transcript = parseVTT(vtt);

      fs.unlinkSync(vttPath);

      if (transcript && transcript.length > 0) {
        if (verbose) console.log(`  Got transcript via captions (${transcript.length} chars)`);
        return {
          url,
          videoId,
          platform,
          transcript,
          method: 'captions',
        };
      }
    }
  } catch (e) {
    if (verbose) console.log('  No captions found');
  }

  // Fall back to Whisper transcription
  try {
    if (verbose) console.log('  Downloading video for Whisper...');

    const videoPath = path.join(OUTPUT_DIR, `${videoId}.mp4`);

    execSync(
      `${ytdlp} -f "best[ext=mp4]" -o "${videoPath}" "${url}" 2>&1`,
      { encoding: 'utf8', timeout: 120000 }
    );

    const files = fs.readdirSync(OUTPUT_DIR);
    const videoFile = files.find(f => f.startsWith(videoId) && (f.endsWith('.mp4') || f.endsWith('.webm')));

    if (videoFile) {
      const actualPath = path.join(OUTPUT_DIR, videoFile);

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      if (verbose) console.log('  Transcribing with Whisper API...');
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(actualPath),
        model: 'whisper-1',
        response_format: 'text',
      });

      fs.unlinkSync(actualPath);

      if (verbose) console.log(`  Whisper transcript (${response.length} chars)`);
      return {
        url,
        videoId,
        platform,
        transcript: response,
        method: 'whisper',
      };
    }
  } catch (e) {
    if (verbose) console.log('  Whisper transcription failed:', e.message);
  }

  return {
    url,
    videoId,
    platform,
    transcript: null,
    method: 'failed',
  };
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(url) {
  const ytdlp = getYtdlpPath();
  const platform = detectPlatform(url);

  try {
    const output = execSync(
      `${ytdlp} --dump-json "${url}" 2>/dev/null`,
      { encoding: 'utf8', timeout: 60000 }
    );

    const data = JSON.parse(output);

    return {
      id: data.id,
      platform,
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
    return { url, platform, error: e.message };
  }
}

/**
 * Get recent videos from a profile (TikTok or Instagram)
 * @param {string} profileUrl - Profile URL
 * @param {number} maxVideos - Maximum videos to fetch
 * @returns {Promise<Array>} Array of video data
 */
export async function getRecentVideos(profileUrl, maxVideos = 10) {
  const ytdlp = getYtdlpPath();
  const platform = detectPlatform(profileUrl);

  try {
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
        if (!v.upload_date) return true;
        const uploadDate = parseUploadDate(v.upload_date);
        return uploadDate >= oneWeekAgo;
      })
      .slice(0, maxVideos);

    return recentVideos.map(v => ({
      id: v.id,
      platform,
      url: v.url || v.webpage_url,
      title: v.title,
      uploadDate: v.upload_date,
    }));
  } catch (e) {
    console.error(`Failed to get videos from ${profileUrl}:`, e.message);
    return [];
  }
}

/**
 * Transcribe multiple videos
 */
export async function transcribeVideos(videoUrls, options = {}) {
  const results = [];

  for (const url of videoUrls) {
    try {
      const videoUrl = typeof url === 'string' ? url : url.url;
      const result = await transcribeVideo(videoUrl, options);
      results.push(result);

      // Rate limiting delay
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

// Re-export for backwards compatibility with TikTok scraper
export {
  transcribeVideo as transcribeTikTokVideo,
  getRecentVideos as getTikTokRecentVideos,
};
