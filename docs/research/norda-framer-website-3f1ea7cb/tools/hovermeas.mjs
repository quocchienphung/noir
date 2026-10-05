import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const probe = async (base, sel, parts) => {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const el = page.locator(sel).filter({ visible: true }).first();
  await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
  const read = () => page.evaluate(([sel, parts]) => {
    const root = [...document.querySelectorAll(sel)].find(e => e.checkVisibility());
    const R = root.getBoundingClientRect();
    return parts.map(([label, test]) => {
      const e = [...root.querySelectorAll('*')].find(x => x.checkVisibility() && new Function('e', 'return ' + test)(x));
      if (!e) return label + ':-';
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return `${label}: x${Math.round(r.left - R.left)} y${Math.round(r.top - R.top)} w${Math.round(r.width)} h${Math.round(r.height)} op${(+cs.opacity).toFixed(2)} bg ${cs.backgroundColor} tf ${cs.transform === 'none' ? '-' : cs.transform.slice(7, 40)}`;
    }).join(' | ');
  }, [sel, parts]);
  const before = await read();
  const b = await el.boundingBox();
  await page.mouse.move(b.x + 30, b.y + 30, { steps: 4 }); await page.waitForTimeout(900);
  const after = await read();
  await page.context().close();
  return `\n   rest : ${before}\n   hover: ${after}`;
};
const jobParts = [['title', "e.children.length===0 && /^Interior Designer$/.test(e.textContent.trim())"], ['arrowbox', "e.getBoundingClientRect().width>=30 && e.getBoundingClientRect().width<=48 && Math.abs(e.getBoundingClientRect().width-e.getBoundingClientRect().height)<3"], ['line', "e.getBoundingClientRect().height<=2 && e.getBoundingClientRect().width>500"]];
console.log('REF job', await probe('https://norda.framer.website', '[data-framer-name="Job List"]', jobParts));
console.log('LOC job', await probe('http://localhost:3000', 'main ul li:has(a[href^="/jobs/interior"])', jobParts));
const teamParts = [['name', "e.children.length===0 && /ERIK LINDHOLM|Erik Lindholm/.test(e.textContent.trim())"], ['img', "e.tagName==='IMG'"]];
console.log('REF team', await probe('https://norda.framer.website', 'a[href*="team/erik"]', teamParts));
console.log('LOC team', await probe('http://localhost:3000', '#meet-the-team a[href*="erik"]', teamParts));
await browser.close();
