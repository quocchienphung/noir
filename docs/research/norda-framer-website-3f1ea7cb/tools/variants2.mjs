import { chromium } from 'playwright';
const targets = [
  ['/', 'MENU', 'header[data-framer-name="Menu Start"] a', 0],
  ['/', 'hero next', 'button[aria-label="Next"]', 0],
  ['/', 'testi next', '[data-framer-name="Testimonials"] button[aria-label="Next"]', 0],
  ['/', 'About link', 'a[href="./about"]', 1],
  ['/', 'accordion', '[data-framer-name="Desktop Closed"]', 0],
  ['/', 'subscribe', '[data-framer-name="Footer"] button', 0],
  ['/', 'footer link', '[data-framer-name="Footer"] a[href="./projects"]', 0],
  ['/', 'hero image', '[data-framer-name="Hero"] a, a[href="./projects/verve-tower"]', 0],
  ['/contact', 'send', 'form button', 0],
  ['/contact', 'input', 'form input', 0],
  ['/contact', 'maps', 'a[href="https://maps.google.com/"]', 0],
  ['/about', 'team card', 'a[href*="team/erik"]', 0],
  ['/jobs/3d-artist', 'apply', 'a[href^="mailto"]', 0],
];
const browser = await chromium.launch({ channel: 'chrome' });
for (const [p, label, sel, nth] of targets) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3300);
  try {
    const el = page.locator(sel).filter({ visible: true }).nth(nth);
    await el.scrollIntoViewIfNeeded({ timeout: 5000 });
    const box = await el.boundingBox();
    await page.mouse.move(5, 5); await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 30), { steps: 6 });
    await page.waitForTimeout(700);
    const r = await page.evaluate(([x, y]) => {
      // visible, painted boxes centred near the pointer inside fixed layers
      const hits = [...document.querySelectorAll('body *')].filter(e => {
        const r = e.getBoundingClientRect(); if (r.width < 8 || r.width > 260 || r.height < 8 || r.height > 120) return false;
        if (Math.abs(r.left + r.width / 2 - x) > 140 || Math.abs(r.top + r.height / 2 - y) > 90) return false;
        let f = e, fixed = false; while (f) { if (getComputedStyle(f).position === 'fixed') { fixed = true; break; } f = f.parentElement; }
        if (!fixed) return false;
        const cs = getComputedStyle(e); if (+cs.opacity < 0.05 || !e.checkVisibility({ opacityProperty: true })) return false;
        return cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || (e.children.length === 0 && e.textContent.trim());
      });
      return hits.slice(0, 4).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); let n = e, name = ''; while (n && !name) { name = n.getAttribute && n.getAttribute('data-framer-name') || ''; n = n.parentElement; } return `[${name}] ${Math.round(r.width)}x${Math.round(r.height)} bg ${cs.backgroundColor} "${e.children.length ? '' : e.textContent.trim().slice(0, 14)}" blend ${cs.mixBlendMode}`; }).join(' ; ') || 'nothing painted';
    }, [box.x + box.width / 2, box.y + Math.min(box.height / 2, 30)]);
    console.log(label.padEnd(12), r);
  } catch (e) { console.log(label.padEnd(12), 'ERR', String(e.message).slice(0, 80)); }
  await page.context().close();
}
await browser.close();
