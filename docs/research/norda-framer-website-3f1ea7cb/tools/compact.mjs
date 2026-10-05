// node compact.mjs <path> <width> <outfile> [rootSelector]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, p, w, out, rootSel] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle', timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); } await new Promise(r => setTimeout(r, 1500)); scrollTo(0,0); await new Promise(r => setTimeout(r, 1000)); });
const res = await page.evaluate(({ rootSel, vw }) => {
  const out = [];
  const fam = f => f.split(',')[0].replace(/"/g, '');
  const vis = el => { if (getComputedStyle(el).display === 'contents') return true; const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; if (r.right < 0 || r.left > vw) return false; let e = el; while (e && e !== document.body) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; e = e.parentElement; } return true; };
  const cls = el => [...el.classList].filter(c => /^framer-[a-z0-9]{5,}$/i.test(c) && !/framer-(text|image|styles|page)/.test(c)).slice(0, 2).join('.');
  const box = el => { const r = el.getBoundingClientRect(); return `[${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}]`; };
  function lay(cs) { const s = []; if (cs.position !== 'static' && cs.position !== 'relative') s.push(cs.position); if (cs.display === 'flex') s.push(`flex-${cs.flexDirection === 'column' ? 'col' : 'row'} gap${cs.gap} j:${cs.justifyContent} a:${cs.alignItems}`); if (cs.display === 'grid') s.push(`grid cols(${cs.gridTemplateColumns}) gap${cs.gap}`); if (cs.padding !== '0px') s.push(`pad(${cs.padding})`); if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') s.push(`bg ${cs.backgroundColor}`); if (cs.opacity !== '1') s.push(`op${cs.opacity}`); if (cs.transform !== 'none') s.push(`tf ${cs.transform}`); if (cs.borderRadius !== '0px') s.push(`r${cs.borderRadius}`); if (cs.mixBlendMode !== 'normal') s.push(`blend ${cs.mixBlendMode}`); const bt = cs.borderTopWidth !== '0px' ? `bt ${cs.borderTopWidth} ${cs.borderTopColor}` : ''; const bb = cs.borderBottomWidth !== '0px' ? `bb ${cs.borderBottomWidth} ${cs.borderBottomColor}` : ''; if (bt) s.push(bt); if (bb) s.push(bb); if (cs.zIndex !== 'auto') s.push('z' + cs.zIndex); return s.join(' '); }
  function typo(el) { const cs = getComputedStyle(el); return `${fam(cs.fontFamily)} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} ${cs.color}${cs.textTransform !== 'none' ? ' ' + cs.textTransform : ''}${cs.textAlign !== 'start' ? ' ta-' + cs.textAlign : ''}${cs.textDecorationLine !== 'none' ? ' td-' + cs.textDecorationLine : ''}`; }
  function walk(el, depth) {
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'link'].includes(tag)) return;
    if (!vis(el) && tag !== 'video') return;
    const name = el.getAttribute('data-framer-name');
    const isRT = el.getAttribute('data-framer-component-type') === 'RichTextContainer' || /^(h[1-6]|p)$/.test(tag);
    const cs = getComputedStyle(el);
    let d = depth;
    if (isRT) {
      const t = el.querySelector('.framer-text') || el;
      const txt = (el.innerText || '').replace(/\n+/g, ' ⏎ ').trim();
      if (txt) out.push(`${'  '.repeat(depth)}T ${box(el)} ${typo(t)} ${cls(el)} :: ${txt}`);
      return;
    }
    if (tag === 'img') { out.push(`${'  '.repeat(depth)}IMG ${box(el)} ${(el.currentSrc || el.src).split('/').pop()} nat${el.naturalWidth}x${el.naturalHeight} fit:${cs.objectFit} pos:${cs.objectPosition} alt="${el.alt}"`); return; }
    if (tag === 'video') { out.push(`${'  '.repeat(depth)}VIDEO ${box(el)} ${el.currentSrc} auto${el.autoplay} loop${el.loop} muted${el.muted} fit:${cs.objectFit}`); return; }
    if (tag === 'svg') { out.push(`${'  '.repeat(depth)}SVG ${box(el)} ${name || ''} ${lay(cs)} fill=${cs.fill} color=${cs.color}`); return; }
    if (tag === 'input' || tag === 'textarea' || tag === 'button' || tag === 'select') { out.push(`${'  '.repeat(depth)}${tag.toUpperCase()} ${box(el)} type=${el.type} name=${el.name} ph="${el.placeholder || ''}" ${typo(el)} ${lay(cs)} :: ${(el.innerText||el.value||'').trim()}`); }
    const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (name || tag === 'a' || tag === 'section' || tag === 'header' || tag === 'footer' || tag === 'main' || tag === 'nav' || tag === 'form' || own || (cs.backgroundImage !== 'none')) {
      const extra = [];
      if (tag === 'a') extra.push('href=' + el.getAttribute('href'));
      if (cs.backgroundImage !== 'none') extra.push('bgimg=' + cs.backgroundImage.slice(0, 120));
      if (own) extra.push(`own="${own.slice(0, 80)}" ${typo(el)}`);
      out.push(`${'  '.repeat(depth)}${tag}${name ? ' "' + name + '"' : ''} ${box(el)} ${lay(cs)} ${cls(el)} ${extra.join(' ')}`);
      d = depth + 1;
    }
    for (const c of el.children) walk(c, d);
  }
  const root = rootSel ? document.querySelector(rootSel) : (document.querySelector('#main') || document.body);
  walk(root, 0);
  return out.join('\n');
}, { rootSel, vw: +w });
fs.writeFileSync(out, res);
await browser.close();
