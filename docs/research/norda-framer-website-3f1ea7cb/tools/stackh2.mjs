import { chromium } from 'playwright';
const [,, w = '1024', h = '900', ys = '0,1500,2500'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: +w, height: +h } })).newPage();
await page.goto('https://norda.framer.website/projects', { waitUntil: 'networkidle' });
for (const y of ys.split(',').map(Number)) {
  await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(700);
  console.log('scroll', y, await page.evaluate(() => [...document.querySelectorAll('a')].filter(x => (x.getAttribute('href') || '').includes('projects/') && x.getBoundingClientRect().height > 300 && x.checkVisibility()).map(x => {
    let s = x, chain = []; for (let i = 0; i < 4 && s; i++, s = s.parentElement) { const cs = getComputedStyle(s); chain.push(`${cs.position}${cs.position === 'sticky' ? '@' + cs.top : ''}${cs.transform !== 'none' ? ' tf' + cs.transform.replace('matrix', '') : ''} h${Math.round(s.getBoundingClientRect().height)}`); }
    return `\n   ${(x.getAttribute('href')).split('/').pop().slice(0, 6)} top ${Math.round(x.getBoundingClientRect().top)} :: ${chain.join(' < ')}`;
  }).join('')));
}
await browser.close();
