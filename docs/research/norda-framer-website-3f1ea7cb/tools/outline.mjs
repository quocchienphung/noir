// Usage: node outline.mjs <path> <width> <outfile> [maxDepth]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, p, w, out, md] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w > 800 ? 900 : 844 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle', timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } await new Promise(r => setTimeout(r, 1500)); scrollTo(0,0); await new Promise(r => setTimeout(r, 800)); });
const res = await page.evaluate((maxDepth) => {
  const lines = [];
  const pick = ['display','position','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','padding','gap','gridTemplateColumns','flexDirection','justifyContent','alignItems','opacity','transform','overflow','borderTop','borderBottom','borderRadius','textTransform','zIndex','objectFit','maxWidth','mixBlendMode'];
  const defaults = { display:'block', position:'static', opacity:'1', transform:'none', overflow:'visible', padding:'0px', gap:'normal', backgroundColor:'rgba(0, 0, 0, 0)', zIndex:'auto', borderRadius:'0px', textTransform:'none', mixBlendMode:'normal', maxWidth:'none', gridTemplateColumns:'none', flexDirection:'row', justifyContent:'normal', alignItems:'normal', objectFit:'fill', borderTop:'0px none rgb(0, 0, 0)', borderBottom:'0px none rgb(0, 0, 0)' };
  const textProps = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','textTransform'];
  function walk(el, depth) {
    if (depth > maxDepth) return;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    const name = el.getAttribute('data-framer-name');
    const tag = el.tagName.toLowerCase();
    if (['script','style','link','meta','noscript'].includes(tag)) return;
    const directText = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    const isText = el.matches('[data-framer-component-type="RichTextContainer"], h1,h2,h3,h4,h5,h6,p') ;
    const st = [];
    for (const k of pick) { const v = cs[k]; if (defaults[k] === v) continue; if (textProps.includes(k) && !isText && !directText) continue; if (k==='fontSize'||k==='lineHeight') { if(!isText && !directText) continue; } st.push(`${k}=${v}`); }
    const attrs = [];
    if (el.getAttribute('href')) attrs.push('href=' + el.getAttribute('href'));
    if (tag === 'img') attrs.push('img=' + (el.currentSrc || el.src).split('?')[0].split('/').pop() + ` nat=${el.naturalWidth}x${el.naturalHeight}`);
    if (tag === 'video') attrs.push('video=' + (el.currentSrc||el.src));
    if (el.getAttribute('aria-label')) attrs.push('aria=' + el.getAttribute('aria-label'));
    if (cs.display === 'none' || cs.visibility === 'hidden') attrs.push('HIDDEN');
    let text = '';
    if (isText) text = (el.innerText ?? el.textContent ?? "").replace(/\s+/g, ' ').trim();
    else if (directText) text = directText;
    lines.push(`${'  '.repeat(depth)}<${tag}${name ? ' "' + name + '"' : ''}> [${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}] ${attrs.join(' ')} {${st.join('; ')}}${text ? ' TEXT: ' + text : ''}`);
    if (isText) return;
    for (const c of el.children) walk(c, depth + 1);
  }
  walk(document.querySelector('#main') || document.body, 0);
  return lines.join('\n');
}, +(md || 30));
fs.writeFileSync(out, res);
await browser.close();
