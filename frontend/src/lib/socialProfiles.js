export const SOCIAL_CHANNELS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'x', label: 'X' },
  { key: 'youtube', label: 'YouTube' },
];

export function validSocialProfile(channel, value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const parts = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, '').split('/');
    const first = parts[0].toLowerCase();
    if (!first) return false;
    if (channel === 'instagram') return host === 'instagram.com' && parts.length === 1 && !['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct'].includes(first);
    if (channel === 'facebook') {
      if (!['facebook.com', 'm.facebook.com'].includes(host) || parts.length !== 1 || ['v', 'fbid', 'story_fbid'].some(key => url.searchParams.has(key))) return false;
      if (first === 'profile.php') return !!url.searchParams.get('id');
      return !['watch', 'photo', 'photo.php', 'posts', 'reel', 'reels', 'stories', 'share', 'sharer.php', 'permalink.php', 'story.php', 'events', 'groups'].includes(first);
    }
    if (channel === 'tiktok') return host === 'tiktok.com' && parts.length === 1 && first.startsWith('@') && first.length > 1;
    if (channel === 'x') return ['x.com', 'twitter.com'].includes(host) && parts.length === 1 && !['home', 'explore', 'i', 'intent', 'search', 'settings', 'messages'].includes(first);
    if (channel === 'youtube') return host === 'youtube.com' && ((parts.length === 1 && first.startsWith('@') && first.length > 1) || (parts.length === 2 && !!parts[1] && ['channel', 'c', 'user'].includes(first)));
  } catch { return false; }
  return false;
}

export function socialProfiles(settings = {}) {
  return SOCIAL_CHANNELS.map(channel => ({
    ...channel,
    href: settings[`social_${channel.key}_url`]?.trim(),
    description: settings[`social_${channel.key}_description`] || '',
  })).filter(channel => validSocialProfile(channel.key, channel.href));
}
