import { next } from '@vercel/edge';

// These are common bots from WhatsApp, Facebook, X/Twitter, Google, etc.
const botUserAgents = [
  'facebookexternalhit',
  'whatsapp',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'telegrambot',
  'discordbot',
  'googlebot',
  'bingbot'
];

export default async function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = botUserAgents.some(bot => userAgent.toLowerCase().includes(bot));

  // If a bot is accessing a blog or event page, redirect internally to our OG generator API
  if (isBot && (url.pathname.startsWith('/blog/') || url.pathname.startsWith('/eventos/'))) {
    const originalPath = url.pathname;
    url.pathname = '/api/og';
    url.searchParams.set('path', originalPath);
    return fetch(url);
  }

  return next();
}

export const config = {
  matcher: ['/blog/:path*', '/eventos/:path*']
};
