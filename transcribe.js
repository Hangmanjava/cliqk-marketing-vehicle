#!/usr/bin/env node
/**
 * TikTok Video Transcriber
 * Usage: node transcribe.js "https://www.tiktok.com/t/ZThy3xKMN/"
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const OUTPUT_DIR = './output/tiktok';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get yt-dlp path
function getYtdlpPath() {
  const paths = [
    process.env.YTDLP_PATH,
    '/Users/shawnreddy/Library/Python/3.9/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp',
    `${process.env.HOME}/.local/bin/yt-dlp`,
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
  throw new Error('yt-dlp not found. Run: ./install-ytdlp.sh');
}

// Parse VTT to plain text
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

// Transcribe using Whisper API
async function transcribeWithWhisper(audioPath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for Whisper transcription');
  }

  const openai = new OpenAI({ apiKey });

  console.log('Transcribing with Whisper API...');
  const response = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'text',
  });

  return response;
}

// Main transcription function
async function transcribeVideo(url) {
  const ytdlp = getYtdlpPath();
  console.log(`\nTranscribing: ${url}`);

  // Get video ID and info
  let videoId, title;
  try {
    const info = execSync(`${ytdlp} --print id --print title "${url}" 2>/dev/null`, {
      encoding: 'utf8',
      timeout: 30000,
    }).trim().split('\n');
    videoId = info[0];
    title = info[1] || 'Unknown';
    console.log(`Video: ${title} (${videoId})`);
  } catch (e) {
    console.error('Failed to get video info:', e.message);
    return null;
  }

  // Try to get captions first (free)
  try {
    console.log('Checking for captions...');
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

      if (transcript && transcript.length > 10) {
        console.log(`Got captions (${transcript.length} chars)`);
        return { videoId, title, transcript, method: 'captions' };
      }
    }
    console.log('No usable captions found');
  } catch (e) {
    console.log('Caption extraction failed');
  }

  // Fall back to Whisper transcription (download video, Whisper accepts video files)
  try {
    console.log('Downloading video for Whisper...');
    const videoPath = path.join(OUTPUT_DIR, `${videoId}.mp4`);

    // Download video (Whisper API accepts mp4 directly)
    execSync(
      `${ytdlp} -f "best[ext=mp4]" -o "${videoPath}" "${url}" 2>&1`,
      { encoding: 'utf8', timeout: 120000 }
    );

    // Check for the actual downloaded file (yt-dlp might add extension)
    const files = fs.readdirSync(OUTPUT_DIR);
    const videoFile = files.find(f => f.startsWith(videoId) && (f.endsWith('.mp4') || f.endsWith('.webm')));

    if (videoFile) {
      const actualPath = path.join(OUTPUT_DIR, videoFile);
      const transcript = await transcribeWithWhisper(actualPath);
      fs.unlinkSync(actualPath);
      console.log(`Whisper transcription complete (${transcript.length} chars)`);
      return { videoId, title, transcript, method: 'whisper' };
    }
  } catch (e) {
    console.error('Whisper transcription failed:', e.message);
  }

  return { videoId, title, transcript: null, method: 'failed' };
}

// CLI entry point
async function main() {
  const url = process.argv[2];

  if (!url) {
    console.log('Usage: node transcribe.js "https://www.tiktok.com/..."');
    process.exit(1);
  }

  const result = await transcribeVideo(url);

  if (result?.transcript) {
    console.log('\n--- TRANSCRIPT ---');
    console.log(result.transcript);
    console.log('------------------\n');
  } else {
    console.log('\nNo transcript available');
  }
}

main().catch(console.error);

export { transcribeVideo, getYtdlpPath };
