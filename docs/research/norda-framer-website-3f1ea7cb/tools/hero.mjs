import { chromium, openPage } from './lib.mjs';
const [,, w] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', +w);
await page.waitForTimeout(2000);
const dump = () => page.evaluate(() => {
  const ss = document.querySelector('[data-framer-name^="Slideshow"]');
  return [...ss.querySelectorAll('ul > li > div')].map(slide => {
    const r = slide.getBoundingClientRect();
    const as = [...slide.querySelectorAll('a')].map(a => {
      const img = a.querySelector('img'); const sec = a.querySelector('section');
      const info = a.querySelector('[data-framer-name="Info"]');
      return `${a.getAttribute('href')} img=${img && img.currentSrc.split('/').pop().split('?')[0]} mask=${sec && (sec.style.mask || sec.style.webkitMask || '').slice(0, 90)} cs=${sec && getComputedStyle(sec).clipPath} info="${info && info.innerText.replace(/\n+/g, ' ')}" op=${getComputedStyle(a).opacity}`;
    });
    return `slide ${slide.getAttribute('data-framer-name')} x=${Math.round(r.x)} hidden=${slide.getAttribute('aria-hidden')}\n   ` + as.join('\n   ');
  }).join('\n');
});
console.log(await dump());
await page.locator('[data-framer-name^="Slideshow"] button').nth(1).click();
await page.waitForTimeout(250);
console.log('--- 250ms after next'); console.log(await dump());
await page.waitForTimeout(1500);
console.log('--- settled'); console.log(await dump());
await browser.close();
