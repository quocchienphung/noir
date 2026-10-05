import { firefox } from 'playwright';
const browser = await firefox.launch();
for (const [p, w] of [['/privacy-policy', 390], ['/jobs/3d-artist', 1440], ['/jobs/3d-artist', 390], ['/team/erik-lindholm', 1440]]) {
  const hs = [];
  for (const base of ['https://norda.framer.website', 'http://127.0.0.1:3200']) {
    const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
    await page.goto(base + p, { waitUntil: 'networkidle', timeout: 120000 });
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
    hs.push(await page.evaluate(() => document.documentElement.scrollHeight));
    await page.context().close();
  }
  console.log(w, p, 'firefox ref', hs[0], 'local', hs[1], 'Δ', hs[1] - hs[0]);
}
await browser.close();
