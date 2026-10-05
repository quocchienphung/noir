import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [1440, 1024, 390]) for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  console.log(w, base.slice(8, 18), await page.evaluate(() => {
    const sec = document.querySelector('[data-framer-name="Testimonials"]') || document.querySelector('section[aria-label="Testimonials"]');
    const seen = new Set(); const out = [];
    for (const q of sec.querySelectorAll('h3, p')) {
      const t = q.textContent.trim(); if (!t.startsWith('“') || !q.checkVisibility()) continue;
      const k = t.slice(0, 18); if (seen.has(k)) continue; seen.add(k);
      const r = q.getBoundingClientRect(); const cs = getComputedStyle(q);
      out.push(`${k.slice(1, 12)} w${Math.round(r.width)} h${Math.round(r.height)} ${cs.fontSize}/${cs.lineHeight} maxw:${cs.maxWidth} parentW:${Math.round(q.parentElement.getBoundingClientRect().width)}`);
    }
    return out.join(' | ');
  }));
  await page.context().close();
}
await browser.close();
