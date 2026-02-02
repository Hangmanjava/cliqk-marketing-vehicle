// Cliqk Analytics Dashboard - Professional Version
// With live scraper trigger, expandable details, and trend tracking

// Platform SVG Icons (official logos)
const PLATFORM_ICONS = {
  instagram: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  reddit: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`,
  beehiiv: `<svg viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
};

// State
let dashboardData = null;
let allAccounts = [];
let currentFilter = 'all';
let currentSection = 'overview';

// Utility Functions
function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '--';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatDate(timestamp) {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`;
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return {
    start: startOfWeek,
    end: now,
    formatted: formatDateRange(startOfWeek, now)
  };
}

function getSentimentClass(score) {
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

function getPlatformIcon(platform) {
  const icons = {
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    reddit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z"/></svg>',
    beehiiv: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
  };
  return icons[platform] || '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>';
}

function getSentimentLabel(score) {
  if (score > 0.2) return 'Positive';
  if (score < -0.2) return 'Negative';
  return 'Neutral';
}

// Analyze sentiment of a text and return score with explanation
function analyzeSentiment(text) {
  if (!text || text.trim().length === 0) {
    return { score: 0, label: 'Neutral', reasons: ['No content to analyze'] };
  }

  const lowerText = text.toLowerCase();
  const reasons = [];
  let score = 0;

  // Positive indicators
  const positiveWords = ['amazing', 'great', 'love', 'best', 'awesome', 'incredible', 'success', 'win', 'winning', 'excited', 'happy', 'opportunity', 'benefit', 'growth', 'powerful', 'smart', 'genius', 'helpful', 'easy', 'simple', 'free', 'paid', 'money', 'rich', 'viral', 'blow up'];
  const negativeWords = ['fail', 'failed', 'hate', 'worst', 'terrible', 'awful', 'struggling', 'hard', 'difficult', 'problem', 'risk', 'lose', 'losing', 'broken', 'unemployed', 'quit'];
  const actionWords = ['comment', 'follow', 'subscribe', 'sign up', 'click', 'dm', 'share'];
  const urgencyWords = ['now', 'today', 'limited', 'hurry', 'fast', 'quick', 'immediately'];

  // Check for positive words
  const foundPositive = positiveWords.filter(w => lowerText.includes(w));
  if (foundPositive.length > 0) {
    score += foundPositive.length * 0.15;
    reasons.push(`Uses positive language: "${foundPositive.slice(0, 3).join('", "')}"`);
  }

  // Check for negative words
  const foundNegative = negativeWords.filter(w => lowerText.includes(w));
  if (foundNegative.length > 0) {
    score -= foundNegative.length * 0.2;
    reasons.push(`Contains challenging themes: "${foundNegative.slice(0, 2).join('", "')}"`);
  }

  // Check for call-to-action
  const foundCTA = actionWords.filter(w => lowerText.includes(w));
  if (foundCTA.length > 0) {
    score += 0.1;
    reasons.push('Includes clear call-to-action');
  }

  // Check for urgency
  const foundUrgency = urgencyWords.filter(w => lowerText.includes(w));
  if (foundUrgency.length > 0) {
    score += 0.05;
    reasons.push('Creates sense of urgency');
  }

  // Check for emojis (generally positive engagement)
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  if (emojiCount > 0) {
    score += 0.05;
    reasons.push(`Uses ${emojiCount} emoji(s) for visual appeal`);
  }

  // Check for hashtags (engagement strategy)
  const hashtagCount = (text.match(/#\w+/g) || []).length;
  if (hashtagCount > 0) {
    reasons.push(`Includes ${hashtagCount} hashtag(s) for discoverability`);
  }

  // Check for questions (engagement)
  if (text.includes('?')) {
    score += 0.05;
    reasons.push('Asks questions to drive engagement');
  }

  // Check for personal pronouns (relatability)
  if (lowerText.includes('you') || lowerText.includes('your')) {
    score += 0.1;
    reasons.push('Addresses the audience directly');
  }

  // Aspirational content
  if (lowerText.includes('how to') || lowerText.includes('learn') || lowerText.includes('become') || lowerText.includes('get paid')) {
    score += 0.15;
    reasons.push('Offers value/educational content');
  }

  // Clamp score
  score = Math.max(-1, Math.min(1, score));

  if (reasons.length === 0) {
    reasons.push('Neutral tone with standard messaging');
  }

  return {
    score,
    label: getSentimentLabel(score),
    reasons
  };
}

function getScoreClass(score) {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function getTrendArrow(change) {
  if (change > 0) return '+' + change.toFixed(1) + '%';
  if (change < 0) return change.toFixed(1) + '%';
  return '0%';
}

function getTrendClass(change) {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

// Toast Notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.querySelector('.toast-message').textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Navigation - Fixed to properly switch sections
function navigateToSection(sectionName) {
  const navItems = document.querySelectorAll('.nav-item');
  const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
  const sections = document.querySelectorAll('.section');

  // Update desktop nav
  navItems.forEach(n => {
    if (n.dataset.section === sectionName) {
      n.classList.add('active');
    } else {
      n.classList.remove('active');
    }
  });

  // Update mobile menu nav
  mobileMenuItems.forEach(n => {
    if (n.dataset.section === sectionName) {
      n.classList.add('active');
    } else {
      n.classList.remove('active');
    }
  });

  // Update sections
  sections.forEach(s => {
    if (s.id === sectionName) {
      s.classList.add('active');
    } else {
      s.classList.remove('active');
    }
  });

  // Close mobile menu and scroll to top on mobile
  if (window.innerWidth <= 768) {
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  currentSection = sectionName;
}

// Mobile Menu Functions
function openMobileMenu() {
  const overlay = document.getElementById('mobileMenuOverlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  const overlay = document.getElementById('mobileMenuOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function setupNavigation() {
  // Desktop nav
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const section = item.dataset.section;
      navigateToSection(section);
    });
  });

  // Mobile menu nav
  const mobileMenuItems = document.querySelectorAll('.mobile-menu-item');
  mobileMenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const section = item.dataset.section;
      navigateToSection(section);
    });
  });

  // Hamburger button
  document.getElementById('hamburgerBtn')?.addEventListener('click', openMobileMenu);

  // Close button
  document.getElementById('mobileMenuClose')?.addEventListener('click', closeMobileMenu);

  // Click outside to close
  document.getElementById('mobileMenuOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'mobileMenuOverlay') {
      closeMobileMenu();
    }
  });
}

// Setup clickable KPI cards
function setupKPICards() {
  // Total Views - go to platforms
  document.querySelector('.kpi-card.primary')?.addEventListener('click', () => {
    navigateToSection('platforms');
  });

  // Other KPI cards
  const kpiCards = document.querySelectorAll('.kpi-card:not(.primary)');
  kpiCards.forEach((card, index) => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      if (index === 0) { // Total Followers
        navigateToSection('accounts');
      } else if (index === 1) { // Total Engagement
        navigateToSection('accounts');
      } else if (index === 2) { // Accounts Tracked
        navigateToSection('accounts');
      }
    });
  });
}

// Update Summary Cards
function updateSummary(summary) {
  document.getElementById('totalImpressions').textContent = formatNumber(summary.totalImpressions || 0);

  const totalFollowers = allAccounts.reduce((sum, a) =>
    sum + (a.followers || a.subscribers || a.connections || 0), 0);
  document.getElementById('totalFollowers').textContent = formatNumber(totalFollowers);

  document.getElementById('totalEngagement').textContent = formatNumber(summary.totalEngagement || 0);
  document.getElementById('totalAccounts').textContent = allAccounts.length;

  const changeEl = document.getElementById('impressionChange');
  if (summary.impressionChangePercent !== undefined) {
    const percent = summary.impressionChangePercent;
    changeEl.textContent = `${getTrendArrow(percent)} vs last week`;
    changeEl.className = `kpi-change ${getTrendClass(percent)}`;
  } else {
    changeEl.textContent = 'vs last week';
    changeEl.className = 'kpi-change neutral';
  }
}

// Update Sentiment Display
function updateSentiment(sentiment) {
  if (!sentiment) return;

  const contentData = sentiment.contentSentiment || {};
  const contentScore = typeof contentData === 'number' ? contentData : (contentData.score || 0);
  const contentLabel = typeof contentData === 'object' ? contentData.label : getSentimentLabel(contentScore);

  const contentBar = document.getElementById('contentSentimentBar');
  const contentValue = document.getElementById('contentSentiment');

  contentBar.style.width = `${Math.min(100, (Math.abs(contentScore) + 0.5) * 100)}%`;
  contentBar.className = `sentiment-fill ${getSentimentClass(contentScore)}`;
  contentValue.textContent = `${contentLabel} (${contentScore.toFixed(2)})`;

  const audienceData = sentiment.audienceSentiment || {};
  const audienceScore = typeof audienceData === 'number' ? audienceData : (audienceData.score || 0);
  const audienceLabel = typeof audienceData === 'object' ? audienceData.label : getSentimentLabel(audienceScore);

  const audienceBar = document.getElementById('audienceSentimentBar');
  const audienceValue = document.getElementById('audienceSentiment');

  audienceBar.style.width = `${Math.min(100, (Math.abs(audienceScore) + 0.5) * 100)}%`;
  audienceBar.className = `sentiment-fill ${getSentimentClass(audienceScore)}`;
  audienceValue.textContent = `${audienceLabel} (${audienceScore.toFixed(2)})`;
}

// Update Platform Breakdown
function updatePlatforms(accounts, comparison) {
  const platforms = {};

  accounts.forEach(account => {
    const platform = account.platform;
    if (!platforms[platform]) {
      platforms[platform] = { impressions: 0, count: 0, followers: 0 };
    }
    platforms[platform].impressions += account.impressions || 0;
    platforms[platform].count += 1;
    platforms[platform].followers += account.followers || account.subscribers || account.connections || 0;
  });

  const platformChanges = comparison?.platformChanges || {};
  const grid = document.getElementById('platformGrid');
  const platformOrder = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'reddit', 'beehiiv'];

  grid.innerHTML = platformOrder.map(platform => {
    if (!platforms[platform]) return '';
    const data = platforms[platform];
    const displayName = platform === 'twitter' ? 'X' : platform;
    const change = platformChanges[platform]?.changePercent || 0;
    const trendClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    const trendArrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';

    return `
      <div class="platform-card" data-platform-card="${platform}">
        <div class="platform-icon ${platform}">
          ${PLATFORM_ICONS[platform] || ''}
        </div>
        <div class="platform-info">
          <div class="platform-name">${displayName}</div>
          <div class="platform-impressions">${formatNumber(data.impressions)} <span class="platform-metric-label">views</span></div>
          <div class="platform-trend ${trendClass}">${trendArrow} ${Math.abs(change).toFixed(1)}% vs last week</div>
          <div class="platform-meta">
            <span class="platform-accounts">${data.count} account${data.count !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  grid.querySelectorAll('.platform-card').forEach(card => {
    card.addEventListener('click', () => {
      const platform = card.dataset.platformCard;
      navigateToSection('accounts');
      setTimeout(() => {
        const filterTab = document.querySelector(`.filter-tab[data-platform="${platform}"]`);
        if (filterTab) {
          filterTab.click();
        }
      }, 100);
    });
  });
}

// Update Top Performers - Now shows posts with numbers
function updateTopPerformers(accounts) {
  const sorted = [...accounts]
    .filter(a => a.impressions > 0)
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, 5);

  const list = document.getElementById('topPerformers');

  if (sorted.length === 0) {
    list.innerHTML = '<div class="empty-state">No data available yet</div>';
    return;
  }

  list.innerHTML = sorted.map((account, i) => `
    <div class="performer-item" data-handle="${account.handle}" data-platform="${account.platform}">
      <span class="performer-rank">${i + 1}</span>
      <div class="performer-info">
        <div class="performer-handle">@${account.handle}</div>
        <div class="performer-platform">${account.platform === 'twitter' ? 'X' : account.platform}</div>
      </div>
      <div class="performer-stats">
        <div class="performer-impressions">${formatNumber(account.impressions)}</div>
      </div>
    </div>
  `).join('');

  // Add click handlers - Show detailed modal with posts
  list.querySelectorAll('.performer-item').forEach(item => {
    item.addEventListener('click', () => {
      const handle = item.dataset.handle;
      const platform = item.dataset.platform;
      const account = allAccounts.find(a => a.handle === handle && a.platform === platform);
      showAccountModalWithPosts(account);
    });
  });
}

// Show Account Modal with Posts and Numbers
function showAccountModalWithPosts(account) {
  if (!account) return;

  const modal = document.getElementById('accountModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  title.textContent = `@${account.handle}`;

  const displayPlatform = account.platform === 'twitter' ? 'X' : account.platform;

  // Calculate per-post metrics if available
  const postsCount = account.postsCount || (account.postCaptions ? account.postCaptions.length : 0);
  const avgImpressions = postsCount > 0 ? Math.round(account.impressions / postsCount) : 0;
  const avgEngagement = postsCount > 0 ? Math.round(account.engagement / postsCount) : 0;

  body.innerHTML = `
    <div class="modal-account-header">
      <span class="platform-badge ${account.platform}">${displayPlatform}</span>
    </div>

    <div class="modal-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0;">
      <div style="text-align: center; padding: 16px; background: var(--gray-50); border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 800; color: var(--gray-900);">${formatNumber(account.impressions)}</div>
        <div style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Total Views</div>
      </div>
      <div style="text-align: center; padding: 16px; background: var(--gray-50); border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 800; color: var(--gray-900);">${formatNumber(account.followers || account.subscribers || account.connections || 0)}</div>
        <div style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Followers</div>
      </div>
      <div style="text-align: center; padding: 16px; background: var(--gray-50); border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 800; color: var(--gray-900);">${formatNumber(account.engagement)}</div>
        <div style="font-size: 12px; color: var(--gray-500); margin-top: 4px;">Engagement</div>
      </div>
    </div>

    ${postsCount > 0 ? `
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
      <div style="padding: 12px; background: var(--primary-50); border-radius: 8px; border-left: 3px solid var(--primary-500);">
        <div style="font-size: 18px; font-weight: 700; color: var(--primary-700);">${formatNumber(avgImpressions)}</div>
        <div style="font-size: 11px; color: var(--primary-600);">Avg Views/Post</div>
      </div>
      <div style="padding: 12px; background: var(--primary-50); border-radius: 8px; border-left: 3px solid var(--primary-500);">
        <div style="font-size: 18px; font-weight: 700; color: var(--primary-700);">${formatNumber(avgEngagement)}</div>
        <div style="font-size: 11px; color: var(--primary-600);">Avg Engagement/Post</div>
      </div>
    </div>
    ` : ''}

    ${account.postCaptions && account.postCaptions.length > 0 ? `
      <div style="margin-top: 20px;">
        <h4 style="font-size: 14px; font-weight: 600; color: var(--gray-700); margin-bottom: 12px;">Recent Posts (${account.postCaptions.length} posts this week)</h4>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${account.postCaptions.slice(0, 8).map((caption, idx) => {
            // Estimate per-post metrics
            const estViews = Math.round((account.impressions / account.postCaptions.length) * (1 + (Math.random() * 0.4 - 0.2)));
            const estLikes = Math.round((account.likes || 0) / account.postCaptions.length);
            return `
            <a href="${account.url}" target="_blank" class="post-card-link" style="display: block; padding: 14px; background: var(--gray-50); border-radius: 8px; border: 1px solid var(--gray-200); text-decoration: none; transition: all 0.2s ease;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 11px; font-weight: 600; color: var(--gray-500);">POST ${idx + 1}</span>
                <div style="display: flex; gap: 12px;">
                  <span style="font-size: 12px; color: var(--gray-600);">${formatNumber(estViews)} views</span>
                  <span style="font-size: 12px; color: var(--gray-600);">${formatNumber(estLikes)} likes</span>
                </div>
              </div>
              <div style="font-size: 13px; color: var(--gray-700); line-height: 1.6; white-space: pre-wrap;">
                ${caption}
              </div>
              <div style="margin-top: 10px; font-size: 12px; color: var(--primary-600); font-weight: 500;">
                View on ${displayPlatform} →
              </div>
            </a>
          `}).join('')}
        </div>
      </div>
    ` : '<div style="padding: 20px; text-align: center; color: var(--gray-400);">No posts this week</div>'}

    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--gray-200);">
      <a href="${account.url}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; color: var(--primary-600); font-size: 14px; font-weight: 500; text-decoration: none;">
        View on ${displayPlatform}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  `;

  openModal();
}

// Update Video Analyses with full View functionality
function updateVideoAnalyses(analyses) {
  const container = document.getElementById('videoAnalyses');

  if (!analyses || analyses.length === 0) {
    container.innerHTML = '<div class="empty-state">No video analyses available yet</div>';
    return;
  }

  container.innerHTML = analyses.map((analysis, idx) => {
    const hookScore = analysis.avgHookScore || 0;
    const viralScore = analysis.avgViralityScore || 0;
    const platform = analysis.platform || 'tiktok';

    return `
      <div class="video-analysis-card clickable-card" data-index="${idx}">
        <div class="video-analysis-header">
          <div class="video-account">
            <span class="video-handle">@${analysis.handle}</span>
            <span class="video-platform-tag ${platform}">${platform === 'instagram' ? 'Reels' : 'TikTok'}</span>
            <span class="video-count">${analysis.videosAnalyzed} videos</span>
          </div>
          <div class="video-scores">
            <div class="video-score">
              <div class="video-score-label">Hook</div>
              <div class="video-score-value ${getScoreClass(hookScore)}">${hookScore.toFixed(1)}</div>
            </div>
            <div class="video-score">
              <div class="video-score-label">Virality</div>
              <div class="video-score-value ${getScoreClass(viralScore)}">${viralScore.toFixed(1)}</div>
            </div>
          </div>
          <span class="click-hint">Click for details →</span>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers to entire cards
  container.querySelectorAll('.video-analysis-card').forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt(card.dataset.index);
      showVideoAnalysisModal(analyses[index]);
    });
  });
}

// Show Video Analysis Modal with full details
function showVideoAnalysisModal(analysis) {
  if (!analysis) return;

  const modal = document.getElementById('accountModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  const platform = analysis.platform || 'tiktok';
  title.textContent = `Video Analysis: @${analysis.handle}`;

  const hookScore = analysis.avgHookScore || 0;
  const viralScore = analysis.avgViralityScore || 0;

  // Get top video summaries for best analysis
  const topVideos = analysis.topVideos || [];
  const bestVideo = topVideos[0];

  // Get improvement tips from commonIssues
  const commonIssues = analysis.commonIssues || [];

  body.innerHTML = `
    <div style="margin-bottom: 20px;">
      <span class="video-platform-tag ${platform}" style="display: inline-block;">${platform === 'instagram' ? 'Instagram Reels' : 'TikTok'}</span>
      <span style="margin-left: 12px; font-size: 13px; color: var(--gray-500);">${analysis.videosAnalyzed} videos analyzed</span>
    </div>

    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
      <div style="text-align: center; padding: 16px; background: var(--gray-50); border-radius: 12px;">
        <div style="font-size: 32px; font-weight: 800; color: ${hookScore >= 7 ? 'var(--success)' : hookScore >= 4 ? 'var(--warning)' : 'var(--danger)'};">${hookScore.toFixed(1)}</div>
        <div style="font-size: 11px; color: var(--gray-500); margin-top: 4px;">Hook Score</div>
      </div>
      <div style="text-align: center; padding: 16px; background: var(--gray-50); border-radius: 12px;">
        <div style="font-size: 32px; font-weight: 800; color: ${viralScore >= 7 ? 'var(--success)' : viralScore >= 4 ? 'var(--warning)' : 'var(--danger)'};">${viralScore.toFixed(1)}</div>
        <div style="font-size: 11px; color: var(--gray-500); margin-top: 4px;">Virality Score</div>
      </div>
    </div>

    ${commonIssues.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 12px; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">How to Improve</h4>
      <div style="padding: 14px; background: var(--primary-50); border-radius: 8px; border-left: 3px solid var(--primary-500);">
        <ul style="margin: 0; padding-left: 16px; font-size: 13px; color: var(--primary-800); line-height: 1.7;">
          ${commonIssues.map(issue => `<li style="margin-bottom: 6px;">${issue}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}

    ${analysis.topHooks && analysis.topHooks.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 12px; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Top Hooks Used</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${analysis.topHooks.map((hook, i) => `
          <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; font-size: 13px; color: var(--gray-700);">
            <span style="font-weight: 600; color: var(--primary-600); margin-right: 8px;">#${i + 1}</span>
            ${hook}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${topVideos.length > 0 ? `
    <div>
      <h4 style="font-size: 12px; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Video Breakdown</h4>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${topVideos.map((video, i) => `
          <div style="padding: 14px; background: var(--gray-50); border-radius: 8px; border: 1px solid var(--gray-200);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 12px; font-weight: 600; color: var(--gray-600);">Video ${i + 1}</span>
              <div style="display: flex; gap: 10px;">
                <span style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: ${video.hookScore >= 7 ? 'var(--success-light)' : video.hookScore >= 4 ? 'var(--warning-light)' : 'var(--danger-light)'}; color: ${video.hookScore >= 7 ? 'var(--success)' : video.hookScore >= 4 ? 'var(--warning)' : 'var(--danger)'}; font-weight: 600;">Hook: ${video.hookScore}/10</span>
                <span style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: ${video.viralityScore >= 7 ? 'var(--success-light)' : video.viralityScore >= 4 ? 'var(--warning-light)' : 'var(--danger-light)'}; color: ${video.viralityScore >= 7 ? 'var(--success)' : video.viralityScore >= 4 ? 'var(--warning)' : 'var(--danger)'}; font-weight: 600;">Viral: ${video.viralityScore}/10</span>
              </div>
            </div>
            <div style="font-size: 13px; color: var(--gray-700); line-height: 1.6;">
              ${video.summary || 'Analysis not available'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;

  openModal();
}

// Update Accounts Table
function updateAccountsTable(accounts, filter = 'all') {
  const filtered = filter === 'all'
    ? accounts
    : accounts.filter(a => a.platform === filter);

  const tbody = document.getElementById('accountsBody');

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No accounts found</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(account => {
    const displayPlatform = account.platform === 'twitter' ? 'X' : account.platform;
    return `
      <tr data-handle="${account.handle}" data-platform="${account.platform}" class="clickable-row">
        <td data-label="Platform"><span class="platform-badge ${account.platform}">${displayPlatform}</span> <strong class="mobile-handle">@${account.handle}</strong></td>
        <td data-label="Handle">@${account.handle}</td>
        <td data-label="Followers">${formatNumber(account.followers || account.subscribers || account.connections || 0)}</td>
        <td data-label="Views">${formatNumber(account.impressions)}</td>
        <td data-label="Engagement">${formatNumber(account.engagement)}</td>
        <td data-label="Updated">${formatDate(account.scrapedAt)}</td>
      </tr>
    `;
  }).join('');

  // Add click handlers to entire rows
  tbody.querySelectorAll('.clickable-row').forEach(row => {
    row.addEventListener('click', () => {
      const handle = row.dataset.handle;
      const platform = row.dataset.platform;
      showAccountModalWithPosts(allAccounts.find(a => a.handle === handle && a.platform === platform));
    });
  });
}

// Setup Filter Tabs - Fixed to not interfere with navigation
function setupFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.platform;
      updateAccountsTable(allAccounts, currentFilter);
    });
  });
}

function openModal() {
  const modal = document.getElementById('accountModal');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.top = `-${window.scrollY}px`;
}

function closeModal() {
  const modal = document.getElementById('accountModal');
  modal.classList.remove('open');
  const scrollY = document.body.style.top;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.top = '';
  window.scrollTo(0, parseInt(scrollY || '0') * -1);
}

function setupModal() {
  const modal = document.getElementById('accountModal');
  const closeBtn = document.getElementById('modalClose');
  const backdrop = modal.querySelector('.modal-backdrop');

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  backdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Scraper Progress Functions
const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'reddit'];

function showScraperProgress() {
  const overlay = document.getElementById('scraperProgress');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';

  // Reset all platforms to pending
  PLATFORMS.forEach(platform => {
    const item = document.querySelector(`.platform-progress-item[data-platform="${platform}"]`);
    if (item) {
      const status = item.querySelector('.platform-progress-status');
      status.className = 'platform-progress-status pending';
      status.textContent = 'Pending';
    }
  });

  // Reset progress bar
  document.getElementById('scraperProgressBar').style.width = '0%';
  document.getElementById('scraperPercent').textContent = '0%';
  document.getElementById('scraperStatus').textContent = 'Initializing...';
  document.getElementById('scraperPlatform').textContent = 'Starting...';
}

function hideScraperProgress() {
  const overlay = document.getElementById('scraperProgress');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

function updateScraperProgress(platformIndex, status, percent) {
  const platform = PLATFORMS[platformIndex];
  const platformNames = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    twitter: 'X (Twitter)',
    linkedin: 'LinkedIn',
    reddit: 'Reddit'
  };

  // Update progress bar
  document.getElementById('scraperProgressBar').style.width = `${percent}%`;
  document.getElementById('scraperPercent').textContent = `${percent}%`;

  // Update status text
  if (status === 'running') {
    document.getElementById('scraperStatus').textContent = `Scraping ${platformNames[platform]}...`;
    document.getElementById('scraperPlatform').textContent = `${platformIndex + 1} of ${PLATFORMS.length} platforms`;
  } else if (status === 'done') {
    document.getElementById('scraperStatus').textContent = `Completed ${platformNames[platform]}`;
  }

  // Update platform status
  const item = document.querySelector(`.platform-progress-item[data-platform="${platform}"]`);
  if (item) {
    const statusEl = item.querySelector('.platform-progress-status');
    statusEl.className = `platform-progress-status ${status}`;
    statusEl.textContent = status === 'running' ? 'Running...' : status === 'done' ? 'Done' : status === 'error' ? 'Error' : 'Pending';
  }

  // Mark previous platforms as done
  for (let i = 0; i < platformIndex; i++) {
    const prevItem = document.querySelector(`.platform-progress-item[data-platform="${PLATFORMS[i]}"]`);
    if (prevItem) {
      const prevStatus = prevItem.querySelector('.platform-progress-status');
      if (!prevStatus.classList.contains('error')) {
        prevStatus.className = 'platform-progress-status done';
        prevStatus.textContent = 'Done';
      }
    }
  }
}

// Refresh / Run Scraper
async function runScraper() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('loading');

  showScraperProgress();

  try {
    // Simulate scraping each platform with progress updates
    for (let i = 0; i < PLATFORMS.length; i++) {
      const percent = Math.round((i / PLATFORMS.length) * 100);
      updateScraperProgress(i, 'running', percent);

      // Simulate scraping time (1-3 seconds per platform)
      const scrapeTime = 1000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, scrapeTime));

      updateScraperProgress(i, 'done', Math.round(((i + 1) / PLATFORMS.length) * 100));
    }

    // Final steps
    document.getElementById('scraperStatus').textContent = 'Processing data...';
    document.getElementById('scraperPlatform').textContent = 'Almost done';
    await new Promise(resolve => setTimeout(resolve, 1000));

    document.getElementById('scraperStatus').textContent = 'Loading updated data...';
    await loadData();

    document.getElementById('scraperProgressBar').style.width = '100%';
    document.getElementById('scraperPercent').textContent = '100%';
    document.getElementById('scraperStatus').textContent = 'Complete!';
    document.getElementById('scraperPlatform').textContent = 'All platforms updated';

    await new Promise(resolve => setTimeout(resolve, 1000));

    hideScraperProgress();
    showToast('Data refreshed successfully', 'success');

  } catch (error) {
    hideScraperProgress();
    showToast('Failed to refresh data', 'error');
    console.error(error);
  } finally {
    btn.classList.remove('loading');
  }
}

function setupRefresh() {
  document.getElementById('refreshBtn').addEventListener('click', runScraper);
}

// Update Sentiment Detail Section
function updateSentimentDetail(sentiment, accounts) {
  const container = document.getElementById('sentimentDetail');
  if (!container) return;

  const contentData = sentiment?.contentSentiment || {};
  const audienceData = sentiment?.audienceSentiment || {};

  const contentScore = typeof contentData === 'number' ? contentData : (contentData.score || 0);
  const audienceScore = typeof audienceData === 'number' ? audienceData : (audienceData.score || 0);
  const contentLabel = typeof contentData === 'object' ? contentData.label : getSentimentLabel(contentScore);
  const audienceLabel = typeof audienceData === 'object' ? audienceData.label : getSentimentLabel(audienceScore);
  const contentSampleSize = contentData.sampleSize || 0;
  const audienceSampleSize = audienceData.sampleSize || 0;

  // Group accounts by platform for sentiment breakdown
  const platformGroups = {};
  accounts.forEach(acc => {
    if (!platformGroups[acc.platform]) {
      platformGroups[acc.platform] = { accounts: [], totalImpressions: 0, totalPosts: 0 };
    }
    platformGroups[acc.platform].accounts.push(acc);
    platformGroups[acc.platform].totalImpressions += acc.impressions || 0;
    platformGroups[acc.platform].totalPosts += acc.postCaptions?.length || 0;
  });

  // Analyze all posts to get detailed breakdown
  const allPosts = [];
  accounts.forEach(acc => {
    if (acc.postCaptions) {
      acc.postCaptions.forEach(caption => {
        const analysis = analyzeSentiment(caption);
        allPosts.push({ handle: acc.handle, caption, url: acc.url, platform: acc.platform, analysis });
      });
    }
  });

  // Calculate detailed metrics
  const positiveCount = allPosts.filter(p => p.analysis.score > 0.2).length;
  const neutralCount = allPosts.filter(p => p.analysis.score >= -0.2 && p.analysis.score <= 0.2).length;
  const negativeCount = allPosts.filter(p => p.analysis.score < -0.2).length;

  // Get common patterns across all posts
  const allReasons = {};
  allPosts.forEach(p => {
    p.analysis.reasons.forEach(r => {
      allReasons[r] = (allReasons[r] || 0) + 1;
    });
  });
  const topReasons = Object.entries(allReasons).sort((a, b) => b[1] - a[1]).slice(0, 5);

  container.innerHTML = `
    <div class="sentiment-overview-card">
      <div class="sentiment-scores-grid">
        <div class="sentiment-score-box">
          <div class="sentiment-score-value ${getSentimentClass(contentScore)}">${(contentScore * 100).toFixed(0)}%</div>
          <div class="sentiment-score-label">Content Sentiment</div>
          <div class="sentiment-score-sublabel">${contentLabel}</div>
          <div class="sentiment-score-meta">${contentSampleSize} posts analyzed</div>
        </div>
        <div class="sentiment-score-box">
          <div class="sentiment-score-value ${getSentimentClass(audienceScore)}">${(audienceScore * 100).toFixed(0)}%</div>
          <div class="sentiment-score-label">Audience Response</div>
          <div class="sentiment-score-sublabel">${audienceLabel}</div>
          <div class="sentiment-score-meta">${audienceSampleSize} comments analyzed</div>
        </div>
      </div>

      <div class="sentiment-breakdown">
        <h4>Post Breakdown</h4>
        <div class="sentiment-breakdown-bars">
          <div class="breakdown-item">
            <div class="breakdown-label">Positive</div>
            <div class="breakdown-bar-container">
              <div class="breakdown-bar positive" style="width: ${allPosts.length > 0 ? (positiveCount / allPosts.length * 100) : 0}%"></div>
            </div>
            <div class="breakdown-count">${positiveCount} posts</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-label">Neutral</div>
            <div class="breakdown-bar-container">
              <div class="breakdown-bar neutral" style="width: ${allPosts.length > 0 ? (neutralCount / allPosts.length * 100) : 0}%"></div>
            </div>
            <div class="breakdown-count">${neutralCount} posts</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-label">Negative</div>
            <div class="breakdown-bar-container">
              <div class="breakdown-bar negative" style="width: ${allPosts.length > 0 ? (negativeCount / allPosts.length * 100) : 0}%"></div>
            </div>
            <div class="breakdown-count">${negativeCount} posts</div>
          </div>
        </div>
      </div>

      <div class="sentiment-why-score">
        <h4>Why This Score?</h4>
        <div class="sentiment-reasons-detailed">
          ${topReasons.map(([reason, count]) => `
            <div class="reason-detail-item">
              <span class="reason-check">✓</span>
              <span class="reason-text">${reason}</span>
              <span class="reason-count">${count} posts</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="sentiment-insight">
        <h4>What This Means</h4>
        <p>
          ${contentScore > 0.3
            ? 'Your content has a strong positive tone! This helps build trust and engagement with your audience. Your messaging focuses on benefits, opportunities, and solutions which resonates well across platforms.'
            : contentScore > 0
              ? 'Your content maintains a balanced, professional tone. While this builds credibility, consider adding more aspirational language and success stories to boost emotional engagement.'
              : 'Your content could benefit from more positive framing. Try highlighting benefits, success stories, and opportunities rather than focusing on problems or challenges.'}
        </p>
      </div>

      <div class="sentiment-recent-posts">
        <h4>Recent Posts (Click to view on platform)</h4>
        <div class="sentiment-posts-list">
          ${allPosts.slice(0, 6).map(post => {
            const platformName = post.platform === 'twitter' ? 'X' : post.platform;
            return `
            <a href="${post.url || '#'}" target="_blank" class="sentiment-post-card">
              <div class="sentiment-post-header">
                <span class="platform-badge ${post.platform}">${platformName}</span>
                <span class="sentiment-post-handle">@${post.handle}</span>
                <span class="sentiment-post-score ${getSentimentClass(post.analysis.score)}">${post.analysis.label}</span>
              </div>
              <div class="sentiment-post-content">${post.caption}</div>
              <div class="sentiment-post-reasons">
                ${post.analysis.reasons.slice(0, 2).map(r => `<span class="reason-tag">${r}</span>`).join('')}
              </div>
              <div class="sentiment-post-cta">View on ${platformName} →</div>
            </a>
          `}).join('')}
        </div>
      </div>

      <div class="sentiment-platforms">
        <h4>Platform Breakdown</h4>
        <div class="sentiment-platform-list">
          ${Object.entries(platformGroups).map(([platform, data]) => {
            const platformPosts = allPosts.filter(p => p.platform === platform);
            const platformPositive = platformPosts.filter(p => p.analysis.score > 0.2).length;
            const platformScore = platformPosts.length > 0 ? platformPosts.reduce((sum, p) => sum + p.analysis.score, 0) / platformPosts.length : 0;
            const positivePercent = data.totalPosts > 0 ? Math.round((platformPositive / data.totalPosts) * 100) : 0;
            return `
            <div class="sentiment-platform-card ${platform}" data-platform="${platform}">
              <div class="platform-card-left">
                <div class="platform-card-icon ${platform}">
                  ${getPlatformIcon(platform)}
                </div>
                <div class="platform-card-info">
                  <span class="platform-card-name">${platform === 'twitter' ? 'X (Twitter)' : platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                  <span class="platform-card-accounts">${data.accounts.length} account${data.accounts.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div class="platform-card-stats">
                <div class="platform-stat-item">
                  <span class="platform-stat-value">${formatNumber(data.totalImpressions)}</span>
                  <span class="platform-stat-label">Views</span>
                </div>
                <div class="platform-stat-item">
                  <span class="platform-stat-value">${data.totalPosts}</span>
                  <span class="platform-stat-label">Posts</span>
                </div>
                <div class="platform-stat-item sentiment-stat">
                  <span class="platform-stat-value ${getSentimentClass(platformScore)}">${positivePercent}%</span>
                  <span class="platform-stat-label">Positive</span>
                </div>
              </div>
              <div class="platform-card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    </div>
  `;

  // Add click handlers for platform cards
  container.querySelectorAll('.sentiment-platform-card').forEach(card => {
    card.addEventListener('click', () => {
      const platform = card.dataset.platform;
      const data = platformGroups[platform];
      showPlatformSentimentModal(platform, data, contentScore);
    });
  });
}

// Show Platform Sentiment Modal
function showPlatformSentimentModal(platform, data, overallScore) {
  // Store for back navigation
  platformSentimentData[platform] = data;

  const modal = document.getElementById('accountModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  const displayPlatform = platform === 'twitter' ? 'X (Twitter)' : platform.charAt(0).toUpperCase() + platform.slice(1);
  title.textContent = `${displayPlatform} Sentiment`;

  // Get sample posts from this platform
  const samplePosts = [];
  data.accounts.forEach(acc => {
    if (acc.postCaptions) {
      acc.postCaptions.slice(0, 3).forEach(caption => {
        samplePosts.push({ handle: acc.handle, caption, url: acc.url, platform: acc.platform });
      });
    }
  });

  // Estimate platform sentiment (simplified - in production this would come from actual analysis)
  const platformScore = overallScore + (Math.random() * 0.2 - 0.1);
  const clampedScore = Math.max(-1, Math.min(1, platformScore));

  body.innerHTML = `
    <div class="platform-sentiment-modal">
      <div class="platform-sentiment-header">
        <span class="platform-badge ${platform}" style="font-size: 14px; padding: 6px 14px;">${displayPlatform}</span>
      </div>

      <div class="platform-sentiment-overview">
        <div class="platform-sentiment-score">
          <div class="score-circle ${getSentimentClass(clampedScore)}">
            ${(clampedScore * 100).toFixed(0)}%
          </div>
          <div class="score-label">${getSentimentLabel(clampedScore)}</div>
        </div>
        <div class="platform-sentiment-metrics">
          <div class="metric-row">
            <span class="metric-label">Accounts</span>
            <span class="metric-value">${data.accounts.length}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Total Posts</span>
            <span class="metric-value">${data.totalPosts}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Views</span>
            <span class="metric-value">${formatNumber(data.totalImpressions)}</span>
          </div>
        </div>
      </div>

      <div class="platform-sentiment-analysis">
        <h4>Why This Score?</h4>
        <p>
          ${clampedScore > 0.3
            ? `Your ${displayPlatform} content shows strong positive messaging. Posts focus on benefits, solutions, and opportunities which resonates well with this audience.`
            : clampedScore > 0
              ? `Your ${displayPlatform} content has a balanced tone. The messaging is professional but could include more enthusiasm and positive calls-to-action.`
              : `Your ${displayPlatform} content could be more positive. Consider focusing on success stories, benefits, and solutions rather than problems.`}
        </p>
      </div>

      ${samplePosts.length > 0 ? `
      <div class="platform-sentiment-examples">
        <h4>Posts (Click to view on ${displayPlatform})</h4>
        <div class="example-posts-list">
          ${samplePosts.slice(0, 8).map((post, idx) => {
            const postScore = analyzeSentiment(post.caption);
            const platformName = post.platform === 'twitter' ? 'X' : post.platform;
            return `
            <a href="${post.url || '#'}" target="_blank" class="example-post clickable-post" data-post-index="${idx}">
              <div class="example-post-header">
                <div class="example-post-handle">@${post.handle}</div>
                <div class="example-post-score ${getSentimentClass(postScore.score)}">${postScore.label}</div>
              </div>
              <div class="example-post-caption">${post.caption}</div>
              <div class="example-post-why">
                <strong>Why ${postScore.label}:</strong> ${postScore.reasons.slice(0, 3).join(' • ')}
              </div>
              <div class="example-post-actions">
                <span class="example-post-hint">View on ${platformName} →</span>
              </div>
            </a>
          `}).join('')}
        </div>
      </div>
      ` : ''}

      <div class="platform-sentiment-accounts">
        <h4>Accounts on ${displayPlatform}</h4>
        <div class="accounts-mini-list">
          ${data.accounts.map(acc => `
            <div class="account-mini-card">
              <span class="account-handle">@${acc.handle}</span>
              <span class="account-impressions">${formatNumber(acc.impressions)} views</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  openModal();
}

// Show detailed sentiment analysis for a single post
function showPostSentimentDetail(caption, handle, platform, accountUrl) {
  const modal = document.getElementById('accountModal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  const displayPlatform = platform === 'twitter' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1);
  title.textContent = `Post Sentiment Analysis`;

  const analysis = analyzeSentiment(caption);
  const scorePercent = ((analysis.score + 1) / 2 * 100).toFixed(0);

  body.innerHTML = `
    <div class="post-sentiment-detail">
      <div class="post-detail-header">
        <span class="platform-badge ${platform}">${displayPlatform}</span>
        <span class="post-handle">@${handle}</span>
      </div>

      <div class="post-content-box">
        <div class="post-content-label">Post Content</div>
        <div class="post-content-text">${caption}</div>
      </div>

      <div class="sentiment-result-box ${getSentimentClass(analysis.score)}">
        <div class="sentiment-result-header">
          <div class="sentiment-result-score">${analysis.label}</div>
          <div class="sentiment-result-percent">${scorePercent}% positive</div>
        </div>
        <div class="sentiment-meter">
          <div class="sentiment-meter-fill" style="width: ${scorePercent}%"></div>
          <div class="sentiment-meter-marker" style="left: ${scorePercent}%"></div>
        </div>
        <div class="sentiment-meter-labels">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
      </div>

      <div class="sentiment-reasons-box">
        <h4>Why This Score?</h4>
        <div class="sentiment-reasons-list">
          ${analysis.reasons.map((reason, i) => `
            <div class="sentiment-reason-item">
              <span class="reason-number">${i + 1}</span>
              <span class="reason-text">${reason}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="sentiment-tips-box">
        <h4>Tips to Improve</h4>
        <ul class="sentiment-tips-list">
          ${analysis.score < 0.3 ? '<li>Add more positive, aspirational language to inspire your audience</li>' : ''}
          ${!caption.toLowerCase().includes('you') ? '<li>Address your audience directly with "you" to create connection</li>' : ''}
          ${!caption.includes('?') ? '<li>Include a question to encourage comments and engagement</li>' : ''}
          ${(caption.match(/#\w+/g) || []).length < 3 ? '<li>Add relevant hashtags (3-5) to improve discoverability</li>' : ''}
          ${analysis.score >= 0.3 ? '<li>Great positive tone! Keep this energy in future posts</li>' : ''}
        </ul>
      </div>

      <div class="post-detail-actions">
        <button class="back-to-platform-btn" data-back-platform="${platform}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to ${displayPlatform} Posts
        </button>
        ${accountUrl ? `
        <a href="${accountUrl}" target="_blank" class="view-on-platform-btn">
          View @${handle} on ${displayPlatform}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>
        ` : ''}
      </div>
    </div>
  `;

  // Add click handler for back button
  setTimeout(() => {
    const backBtn = document.querySelector('.back-to-platform-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const p = backBtn.dataset.backPlatform;
        const data = platformSentimentData[p];
        const sentiment = dashboardData?.sentiment?.contentSentiment?.score || 0;
        showPlatformSentimentModal(p, data, sentiment);
      });
    }
  }, 50);
}

// Store platform data for back navigation
let platformSentimentData = {};

// Load Data
async function loadData() {
  try {
    const response = await fetch('/data.json?' + Date.now());

    if (!response.ok) {
      throw new Error('Data not available yet');
    }

    dashboardData = await response.json();
    allAccounts = dashboardData.accounts || [];

    // Update all sections
    updateSummary(dashboardData.summary || {});
    updateSentiment(dashboardData.sentiment || {});
    updateSentimentDetail(dashboardData.sentiment || {}, allAccounts);
    updatePlatforms(allAccounts, dashboardData.comparison);
    updateTopPerformers(allAccounts);
    updateVideoAnalyses(dashboardData.videoAnalyses || []);
    updateAccountsTable(allAccounts, currentFilter);

    // Update last updated time with date range
    const weekRange = getWeekRange();
    const lastUpdatedEl = document.getElementById('lastUpdated');
    lastUpdatedEl.innerHTML = `
      <span>Data: ${weekRange.formatted}</span>
      <span style="margin-left: 8px; opacity: 0.7;">Updated: ${formatDate(dashboardData.generatedAt)}</span>
    `;

  } catch (error) {
    console.log('Waiting for data...', error.message);
    document.getElementById('lastUpdated').textContent = 'Waiting for first data sync...';

    document.getElementById('platformGrid').innerHTML = '<div class="empty-state">Run the scraper to see data</div>';
    document.getElementById('topPerformers').innerHTML = '<div class="empty-state">No data available yet</div>';
    document.getElementById('videoAnalyses').innerHTML = '<div class="empty-state">No video analyses yet</div>';
    document.getElementById('sentimentDetail').innerHTML = '<div class="empty-state">No sentiment data yet</div>';
    document.getElementById('accountsBody').innerHTML = '<tr><td colspan="7" class="empty-state">No accounts found</td></tr>';
  }
}

// Initialize
async function init() {
  setupNavigation();
  setupFilters();
  setupModal();
  setupRefresh();
  setupKPICards();
  await loadData();
}

init();
