import { chromium, openPage } from './lib.mjs';
import fs from 'node:fs';
const [,, p, file] = process.argv;
const keys = Object.keys(JSON.parse(fs.readFileSync(file, 'utf8')));
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, p, 1440);
console.log(await page.evaluate((keys) => keys.map(k => { const els = [...document.querySelectorAll('.framer-' + k + ', [data-framer-appear-id="' + k + '"]')]; return k + ' => ' + els.map(e => { const r = e.getBoundingClientRect(); return `${e.tagName} "${e.getAttribute('data-framer-name') || ''}" [${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}] "${(e.innerText || '').replace(/\s+/g, ' ').slice(0, 40)}"`; }).join(' ; '); }).join('\n'), keys));
await browser.close();
