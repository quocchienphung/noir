import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const p of ['/', '/contact', '/about']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('http://127.0.0.1:3200' + p, { waitUntil: 'networkidle' });
  const rows = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const e = document.activeElement; if (!e || e === document.body) return null;
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      const visible = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      return { tag: e.tagName, label: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('name') || '').trim().replace(/\s+/g, ' ').slice(0, 24), visible, onscreen: r.width > 0 && r.height > 0 };
    });
    if (r) rows.push(r);
  }
  const bad = rows.filter(r => !r.visible || !r.onscreen);
  console.log(`${p}: ${rows.length} focus stops, ${bad.length} without visible focus style or box` + bad.slice(0, 8).map(b => `\n   ${b.tag} "${b.label}" visible=${b.visible} onscreen=${b.onscreen}`).join(''));
  await page.context().close();
}
await browser.close();
