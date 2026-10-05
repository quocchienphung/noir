import { chromium } from 'playwright';
const targets = [
  ['/', 'MENU', 'header[data-framer-name="Menu Start"] a', 'button[aria-controls="nd-menu"]'],
  ['/', 'hero next', 'button[aria-label="Next"]', 'button[aria-label="Next project"]'],
  ['/', 'testi next', '[data-framer-name="Testimonials"] button[aria-label="Next"]', 'button[aria-label="Next testimonial"]'],
  ['/', 'About link', 'a[href="./about"]', 'main a[href="/about"]'],
  ['/', 'subscribe', 'footer button, [data-framer-name="Footer"] button', 'footer button[type="submit"]'],
  ['/', 'back to top', '[data-framer-name="Back to Top"], [data-framer-name*="Back"]', 'footer button:not([type="submit"])'],
  ['/', 'footer link', '[data-framer-name="Footer"] a[href="./projects"]', 'footer a[href="/projects"]'],
  ['/contact', 'send', 'form button', 'main form button[type="submit"]'],
  ['/contact', 'input', 'form input', 'main form input'],
  ['/news', 'read article', 'a[href*="news/"]:not([data-framer-name])', 'main article a[data-cursor="read-article"] ~ div a, main article a[href^="/news/"]:not([tabindex])'],
];
const browser = await chromium.launch({ channel: 'chrome' });
for (const [p, label, refSel, locSel] of targets) {
  const out = [];
  for (const [base, sel] of [['https://norda.framer.website', refSel], ['http://localhost:3000', locSel]]) {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3300);
    try {
      const el = page.locator(sel).filter({ visible: true }).last();
      await el.scrollIntoViewIfNeeded({ timeout: 5000 });
      const box = await el.boundingBox();
      await page.mouse.move(5, 5); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
      await page.waitForTimeout(600);
      out.push(await page.evaluate(([x, y]) => {
        const loc = document.querySelector('[data-variant][aria-hidden="true"]');
        if (loc) return 'variant=' + loc.dataset.variant;
        const near = [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); if (cs.position !== 'fixed' && cs.position !== 'absolute') return false; const r = e.getBoundingClientRect(); return r.width >= 10 && r.width <= 220 && r.height >= 10 && r.height <= 80 && Math.abs(r.left + r.width / 2 - x) < 120 && Math.abs(r.top + r.height / 2 - y) < 80 && e.getAttribute('data-framer-name') && /None|Black|White|View|Read|Dot|Default|Award/i.test(e.getAttribute('data-framer-name')); });
        return near.map(e => e.getAttribute('data-framer-name') + (getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)' ? '(bg ' + getComputedStyle(e).backgroundColor + ')' : '')).join(',') || 'none found';
      }, [box.x + box.width / 2, box.y + box.height / 2]));
    } catch (e) { out.push('ERR ' + String(e.message).slice(0, 60)); }
    await page.context().close();
  }
  console.log(label.padEnd(14), '| ref', out[0], '| loc', out[1]);
}
await browser.close();
