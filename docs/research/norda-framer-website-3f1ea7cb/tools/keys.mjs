import crypto from 'node:crypto';
export const SITE_KEY = 'norda-framer-website-3f1ea7cb';
export function pageKey(pathname) {
  const h = crypto.createHash('sha256').update(pathname).digest('hex').slice(0, 8);
  if (pathname === '/') return `root-${h}`;
  const slug = decodeURIComponent(pathname).split('/').filter(Boolean)
    .map(s => s.normalize('NFKD').replace(/ø/g,'o').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .join('--');
  return `${slug}-${h}`;
}
