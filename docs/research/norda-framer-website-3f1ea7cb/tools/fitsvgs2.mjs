import { chromium } from 'playwright';
const routes = (process.argv[2] || '/projects,/news,/about,/contact').split(',');
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [1440, 1024, 390]) for (const p of routes) {
  const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
  await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
  console.log(w, p, await page.evaluate(() => [...document.querySelectorAll('svg')].filter(s => s.textContent.trim().length > 3 && s.checkVisibility() && s.getBoundingClientRect().width > 150 && s.getBoundingClientRect().top < 900).map(s => {
    const cs = getComputedStyle(s); const r = s.getBoundingClientRect();
    const t = s.querySelector('text, foreignObject *'); const tcs = t ? getComputedStyle(t) : null;
    let anc = []; for (let e = s.parentElement, i = 0; e && i < 3; e = e.parentElement, i++) { const er = e.getBoundingClientRect(); const ecs = getComputedStyle(e); anc.push(`${e.getAttribute('data-framer-name') || e.tagName} ${Math.round(er.left)},${Math.round(er.top)} ${Math.round(er.width)}x${Math.round(er.height)} pad ${ecs.padding} disp ${ecs.display}`); }
    return `vb ${s.getAttribute('viewBox')} rect ${r.left.toFixed(1)},${r.top.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)} style[left ${cs.left} top ${cs.top} w ${cs.width} h ${cs.height} pos ${cs.position} tf ${cs.transform}] text: fs ${tcs?.fontSize} ls ${tcs?.letterSpacing} lh ${tcs?.lineHeight} || ${anc.join(' < ')}`;
  }).join('\n   ')));
  await page.context().close();
}
await browser.close();
