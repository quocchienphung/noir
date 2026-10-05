import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.goto('http://127.0.0.1:3200/privacy-policy', { waitUntil: 'networkidle' });
const r = await page.evaluate(async () => {
  const out = [];
  for (const sizes of ['342px', 'max(342px, calc((80vh + 300px) * 1.5))', 'calc(max(100vw - 48px, (80vh + 300px) * 1.5))', '(min-width: 810px) 50vw, max(calc(100vw - 48px), calc((80vh + 300px) * 1.5))']) {
    const img = new Image();
    img.sizes = sizes;
    img.srcset = '/a.jpg?w=390 390w, /a.jpg?w=640 640w, /a.jpg?w=1080 1080w, /a.jpg?w=1440 1440w, /a.jpg?w=1920 1920w';
    document.body.appendChild(img);
    await new Promise(r => setTimeout(r, 50));
    out.push(`${sizes} -> ${img.currentSrc.split('?')[1]}`);
    img.remove();
  }
  return out.join('\n');
});
console.log(r);
await browser.close();
