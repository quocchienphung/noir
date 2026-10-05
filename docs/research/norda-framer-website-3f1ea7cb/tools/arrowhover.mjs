import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [base, sel] of [['https://norda.framer.website', '[data-framer-name="Testimonials"] button[aria-label="Next"]'], ['https://norda.framer.website', 'button[aria-label="Next"]'], ['http://localhost:3000', 'button[aria-label="Next testimonial"]'], ['http://localhost:3000', 'button[aria-label="Next project"]']]) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const b = page.locator(sel).first();
  await b.scrollIntoViewIfNeeded();
  const box = await b.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  await page.waitForTimeout(700);
  const r = await page.evaluate(([x, y]) => {
    const fixed = [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); if (cs.position !== 'fixed' && cs.position !== 'absolute') return false; const r = e.getBoundingClientRect(); return r.width >= 10 && r.width <= 30 && r.height >= 10 && r.height <= 30 && Math.abs(r.left + r.width / 2 - x) < 30 && Math.abs(r.top + r.height / 2 - y) < 30 && +cs.opacity > 0.05 && e.checkVisibility(); });
    return fixed.map(e => `${e.tagName} ${e.getAttribute('data-framer-name') || String(e.className).slice(0, 30)} op${getComputedStyle(e).opacity} bg ${getComputedStyle(e).backgroundColor} blend ${getComputedStyle(e).mixBlendMode}`).join(' | ') || 'no dot';
  }, [box.x + box.width / 2, box.y + box.height / 2]);
  console.log(base.slice(8, 18), sel.slice(-30), r);
  await page.screenshot({ path: `arrowhover-${base.includes('local') ? 'loc' : 'ref'}-${sel.includes('Testimonials') || sel.includes('testimonial') ? 't' : 'h'}.png`, clip: { x: box.x - 80, y: box.y - 20, width: box.width + 120, height: box.height + 40 } });
  await page.context().close();
}
await browser.close();
