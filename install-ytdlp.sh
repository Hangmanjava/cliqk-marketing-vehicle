#!/bin/bash
# Install yt-dlp for TikTok video transcription

echo "Installing yt-dlp..."

# Try pip3 first
if command -v pip3 &> /dev/null; then
    pip3 install --user yt-dlp
    echo "yt-dlp installed via pip3"
elif command -v pip &> /dev/null; then
    pip install --user yt-dlp
    echo "yt-dlp installed via pip"
elif command -v brew &> /dev/null; then
    brew install yt-dlp
    echo "yt-dlp installed via brew"
else
    echo "Please install yt-dlp manually: pip install yt-dlp"
    exit 1
fi

# Verify installation
export PATH="$PATH:$HOME/Library/Python/3.9/bin:$HOME/.local/bin"
if yt-dlp --version; then
    echo "yt-dlp installed successfully!"
else
    echo "yt-dlp installation may require adding to PATH"
fi
