/**
 * Social media accounts to track (38 total)
 */

export const accounts = {
  instagram: [
    { handle: 'cliqkbait', url: 'https://www.instagram.com/cliqkbait/' },
    { handle: 'myacliqk', url: 'https://www.instagram.com/myacliqk/' },
    { handle: 'mycliqk', url: 'https://www.instagram.com/mycliqk/' },
    { handle: 'cliqkclips', url: 'https://www.instagram.com/cliqkclips/' },
    { handle: 'cliqkcreators', url: 'https://www.instagram.com/cliqkcreators/' },
    { handle: 'shawn_reddy', url: 'https://www.instagram.com/shawn_reddy/' },
    { handle: 'cliqkbrandon', url: 'https://www.instagram.com/cliqkbrandon/' },
    { handle: 'iliasanwar_', url: 'https://www.instagram.com/iliasanwar_/' },
    { handle: 'rohancliqk', url: 'https://www.instagram.com/rohancliqk/' },
  ],

  tiktok: [
    { handle: 'cliqkcreators', url: 'https://www.tiktok.com/@cliqkcreators' },
    { handle: 'cliqkclips', url: 'https://www.tiktok.com/@cliqkclips' },
    { handle: 'cliqkbrandon', url: 'https://www.tiktok.com/@cliqkbrandon' },
  ],

  youtube: [
    { handle: 'cliqkclips', url: 'https://www.youtube.com/@cliqkclips' },
    { handle: 'cliqkcreators', url: 'https://www.youtube.com/@cliqkcreators' },
    { handle: 'iliasanwar_', url: 'https://www.youtube.com/@iliasanwar_' },
  ],

  twitter: [
    { handle: 'mycliqk', url: 'https://twitter.com/mycliqk' },
    { handle: 'iliasanwar_', url: 'https://twitter.com/iliasanwar_' },
    { handle: 'rohangurram', url: 'https://twitter.com/rohangurram' },
    { handle: 'screddysai', url: 'https://twitter.com/screddysai' },
    { handle: 'pavankumarny', url: 'https://twitter.com/pavankumarny' },
    { handle: 'myacliqk', url: 'https://twitter.com/myacliqk' },
  ],

  linkedin: {
    profiles: [
      { handle: 'pavankumarny', url: 'https://www.linkedin.com/in/pavankumarny/' },
      { handle: 'wilmanchan', url: 'https://www.linkedin.com/in/wilmanchan/' },
      { handle: 'charles-legard-2953a2201', url: 'https://www.linkedin.com/in/charles-legard-2953a2201/' },
      { handle: 'marvin-ford-b99623186', url: 'https://www.linkedin.com/in/marvin-ford-b99623186/' },
      { handle: 'charana-athauda-784a24177', url: 'https://www.linkedin.com/in/charana-athauda-784a24177/' },
      { handle: 'shawnreddy', url: 'https://www.linkedin.com/in/shawnreddy/' },
      { handle: 'brandon-garcia-530629369', url: 'https://www.linkedin.com/in/brandon-garcia-530629369/' },
      { handle: 'gary-sargeant07', url: 'https://www.linkedin.com/in/gary-sargeant07/' },
      { handle: 'alvin-qingkai-pan', url: 'https://www.linkedin.com/in/alvin-qingkai-pan/' },
      { handle: 'hriday-narang', url: 'https://www.linkedin.com/in/hriday-narang/' },
      { handle: 'armaan-hossain', url: 'https://www.linkedin.com/in/armaan-hossain/' },
    ],
    pages: [
      { handle: 'mycliqk', url: 'https://www.linkedin.com/company/mycliqk/', companyId: '110902777' },
    ],
    newsletters: [
      { handle: 'cliqk-newsletter', newsletterId: '7188317004687200258' },
    ],
  },

  reddit: [
    { handle: 'Sufficient_Bat_4056', url: 'https://www.reddit.com/user/Sufficient_Bat_4056/' },
    { handle: 'Tight-Quarter-6898', url: 'https://www.reddit.com/user/Tight-Quarter-6898/' },
  ],

  beehiiv: [
    { handle: 'cliqkdaily', url: 'https://cliqkdaily.beehiiv.com' },
  ],
};

/**
 * Get total account count
 */
export function getTotalAccountCount() {
  return (
    accounts.instagram.length +
    accounts.tiktok.length +
    accounts.youtube.length +
    accounts.twitter.length +
    accounts.linkedin.profiles.length +
    accounts.linkedin.pages.length +
    accounts.linkedin.newsletters.length +
    accounts.reddit.length +
    accounts.beehiiv.length
  );
}

/**
 * Get platform display names
 */
export const platformNames = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'X/Twitter',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  beehiiv: 'Beehiiv',
};
