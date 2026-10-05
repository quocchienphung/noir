// Hover the same controls on the local site and print the follower variant (compare with cursortree results).
import { chromium } from 'playwright';
const checks = [
  ['/', 'logo', 'a[aria-label="Nordå — home"]', 'none'],
  ['/', 'MENU', 'button[aria-controls="nd-menu"]', 'none'],
  ['/', 'hero slide', 'li[aria-hidden="false"] a[data-cursor="view-project"]', 'view-project'],
  ['/', 'hero arrow', 'button[aria-label="Next project"]', 'none'],
  ['/', 'intro text', 'main h2', 'dot'],
  ['/', 'counters', 'main [class*=counterRow]', 'dot'],
  ['/', 'About link', 'main a[href="/about"]', 'none'],
  ['/', 'awards title', '#nd-awards-title', 'dot-white'],
  ['/', 'award row', 'li[data-cursor="award-1"]', 'award-1'],
  ['/', 'accordion', 'li[data-cursor="dot"] button', 'dot'],
  ['/', 'read article img', 'a[data-cursor="read-article"]', 'read-article'],
  ['/', 'read article link', 'main a[href^="/news/"]:not([tabindex])', 'none'],
  ['/', 'testimonial quote', 'section[aria-label="Testimonials"] li[aria-hidden="false"] p', 'dot'],
  ['/', 'testimonial arrow', 'button[aria-label="Next testimonial"]', 'none'],
  ['/', 'footer title', 'footer h2', 'dot-white'],
  ['/', 'footer form', 'footer form input', 'none'],
  ['/', 'sitemap link', 'footer nav a', 'none'],
  ['/', 'back to top', 'footer button:not([type=submit])', 'none'],
  ['/projects', 'scroll link', 'a[href="#main-container"]', 'none'],
  ['/projects', 'archive row', '#nd-archive-title', 'dot'],
  ['/about', 'team card', '#meet-the-team a', 'none'],
  ['/about', 'job row', '#job-openings ~ ul a, main ul a[href^="/jobs/"]', 'none'],
  ['/contact', 'input', 'main form input', 'none'],
  ['/contact', 'send', 'main form button[type=submit]', 'dot'],
  ['/jobs/3d-artist', 'hero apply', '[class*=heroApply]', 'none'],
  ['/jobs/3d-artist', 'portrait', 'section[aria-label="Quote"] a', 'none'],
  ['/news', 'card link', 'main article a:not([tabindex])', 'dot'],
];
const browser = await chromium.launch({ channel: 'chrome' });
let fails = 0;
for (const [p, label, sel, want] of checks) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('http://localhost:3000' + p, { waitUntil: 'networkidle' });
  try {
    const el = page.locator(sel).filter({ visible: true }).first();
    await el.scrollIntoViewIfNeeded({ timeout: 5000 });
    await page.waitForTimeout(500);
    const b = await el.boundingBox();
    await page.mouse.move(3, 3); await page.mouse.move(b.x + Math.min(b.width / 2, 40), b.y + Math.min(b.height / 2, 20), { steps: 4 });
    await page.waitForTimeout(250);
    const v = await page.evaluate(() => document.querySelector('[data-variant][aria-hidden="true"]').dataset.variant);
    const ok = v === want; if (!ok) fails++;
    console.log(ok ? 'ok  ' : 'FAIL', label.padEnd(18), v, ok ? '' : `(want ${want})`);
  } catch (e) { fails++; console.log('ERR ', label, String(e.message).slice(0, 60)); }
  await page.context().close();
}
console.log('fails', fails);
await browser.close();
