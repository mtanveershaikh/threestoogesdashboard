// Browser smoke test: serves the demo build (sample data) and walks the app in real Chrome.
// Run with `npm run e2e`. Set CHROME_PATH if Chrome is not in a standard place.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = fileURLToPath(new URL('../dist/demo/browser/', import.meta.url));
const AXE = readFileSync(fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };

const chromePath = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => p && existsSync(p));
if (!chromePath) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(2); }
if (!existsSync(ROOT)) { console.error('Run `npm run build:demo` first.'); process.exit(2); }

// Static server with the single-page-app fallback that Firebase Hosting provides.
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(ROOT, path);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const failures = [];
const check = (ok, message) => { console.log(`${ok ? '  ok ' : ' FAIL'}  ${message}`); if (!ok) failures.push(message); };
const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });

async function open(path, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base + path, { waitUntil: 'networkidle0' });
  return { page, errors };
}

// 1. Every page: no errors, a heading, no sideways scroll, no accessibility violations.
const routes = ['/', '/bots/breakout', '/bots/pullback', '/bots/reversion', '/bots/nope', '/signed-out', '/styleguide', '/?scenario=backtest', '/bots/breakout?scenario=backtest', '/trades', '/trades?bot=pullback&result=win', '/reports', '/reports?view=month', '/reports?scenario=backtest', '/trades?q=zzzz'];
for (const width of [1360, 390]) {
  for (const route of routes) {
    const { page, errors } = await open(route, width);
    await page.evaluate(AXE);
    const axe = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const h1s = await page.$$eval('h1', (e) => e.length);
    const label = `${String(width).padStart(4)}px ${route}`;
    check(errors.length === 0, `${label}: no console or page errors${errors.length ? ` (${errors[0]})` : ''}`);
    check(h1s === 1, `${label}: exactly one h1 (found ${h1s})`);
    check(!overflow, `${label}: no sideways scroll`);
    check(axe.violations.length === 0, `${label}: no accessibility violations${axe.violations.length ? ` (${axe.violations.map((v) => v.id).join(', ')})` : ''}`);
    await page.close();
  }
}

// 2. Sample data is always labeled.
{
  const { page } = await open('/', 1360);
  check(!!(await page.$('app-sample-data-badge .badge')), 'demo build shows the Sample data badge');
  await page.close();
}

// 3. Clicking through: card name, switcher, current-bot marker, back link.
{
  const { page } = await open('/', 1360);
  const click = async (selector, text) => {
    const h = await page.evaluateHandle((s, t) => [...document.querySelectorAll(s)].find((e) => e.textContent.trim() === t), selector, text);
    await h.asElement().click();
    await new Promise((r) => setTimeout(r, 600));
  };
  const where = async () => `${new URL(page.url()).pathname} ${await page.$eval('h1', (e) => e.textContent)}`;
  await click('app-bot-card h3 a', 'Nawaz'); check((await where()) === '/bots/reversion Nawaz', 'overview card name opens Nawaz');
  await click('nav.switcher a', 'Waseem'); check((await where()) === '/bots/pullback Waseem', 'switcher opens Waseem');
  check((await page.$eval('nav.switcher a.active', (e) => `${e.textContent.trim()} ${e.getAttribute('aria-current')}`)) === 'Waseem page', 'switcher marks only the current bot');
  await click('a.more', 'See all trades for Waseem →');
  check(new URL(page.url()).pathname + new URL(page.url()).search === '/trades?bot=pullback', 'See all trades opens the Trades page for that bot');
  check((await page.$$eval('tbody tr', (r) => r.length)) === 18, 'and shows all 18 of that bot\'s trades, not just the latest ten');
  await page.goBack();
  await new Promise((r) => setTimeout(r, 500));
  await click('a.back', '← Back to overview'); check((await where()) === '/ Performance overview', 'back link returns to the overview');
  await page.close();
}

// 3b. Chart range toggle works from the keyboard and says which range is on.
{
  const { page, errors } = await open('/', 1360);
  const pressed = () => page.$$eval('.range button', (b) => b.map((x) => `${x.textContent.trim()}=${x.getAttribute('aria-pressed')}`).join(' '));
  check((await pressed()) === '8 weeks=true All time=false', 'range toggle starts on 8 weeks');
  await page.focus('.range button:nth-child(2)');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 400));
  check((await pressed()) === '8 weeks=false All time=true', 'Enter on All time switches the range');
  check(errors.length === 0, 'switching the range causes no errors');
  await page.close();
}

// 3b2. Trades page: typing in the search box filters the table and the URL, Clear filters undoes it.
{
  const { page, errors } = await open('/trades', 1360);
  const rowCount = () => page.$$eval('tbody tr', (r) => r.length);
  check((await rowCount()) === 50, 'Trades page lists all 50 sample trades');
  await page.type('input[type="search"]', 'drft');
  await new Promise((r) => setTimeout(r, 500));
  check((await rowCount()) === 1, 'typing a ticker narrows the table to that trade');
  check(new URL(page.url()).search === '?q=drft', 'the filter is in the URL, so the view can be shared');
  await page.click('.filters .clear');
  await new Promise((r) => setTimeout(r, 500));
  check((await rowCount()) === 50 && new URL(page.url()).search === '', 'Clear filters brings every trade back');
  check(errors.length === 0, 'filtering causes no errors');
  await page.close();
}

// 3b3. Reports page: Monthly switches the table and the URL, and the weeks add up.
{
  const { page, errors } = await open('/reports', 1360);
  const firstCells = () => page.$$eval('tbody tr td:first-child', (c) => c.map((x) => x.textContent.trim()));
  check((await firstCells()).length === 9, 'Reports starts weekly with nine weeks');
  await page.evaluate(() => [...document.querySelectorAll('.range button')].find((b) => b.textContent.trim() === 'Monthly').click());
  await new Promise((r) => setTimeout(r, 500));
  check(JSON.stringify(await firstCells()) === JSON.stringify(['October 2026', 'September 2026', 'August 2026']), 'Monthly shows three months');
  check(new URL(page.url()).search === '?view=month', 'the period is in the URL');
  check(errors.length === 0, 'switching the period causes no errors');
  await page.close();
}

// 3c. Download report builds a CSV in the browser (nothing is sent anywhere).
{
  const { page, errors } = await open('/bots/breakout', 1360);
  await page.evaluate(() => {
    window.__saved = [];
    const original = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => { blob.arrayBuffer().then((b) => window.__saved.push(Array.from(new Uint8Array(b)))); return original(blob); };
  });
  await page.click('button.download');
  await new Promise((r) => setTimeout(r, 500));
  const saved = await page.evaluate(() => window.__saved);
  check(saved.length === 1, 'Download report saves one file');
  const bytes = saved[0] ?? [];
  check(bytes.slice(0, 3).join() === '239,187,191', 'the file starts with a UTF-8 byte-order mark, so Excel reads it correctly');
  const text = Buffer.from(bytes.slice(3)).toString('utf8');
  check(text.startsWith('Report,Wasif,Generated,'), 'the file starts with the bot name and the day');
  check(text.includes('Average per trade (R),0.21,0.28'), 'the file has the paper and backtest averages as plain numbers');
  check(errors.length === 0, 'downloading causes no errors');
  await page.close();
}

// 4. Keyboard: skip link first, it moves focus into the page, and every tab stop has a visible focus ring and a name.
{
  const { page } = await open('/', 1360);
  await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.activeElement?.classList.contains('skip-link')), 'first Tab stop is the skip link');
  await page.keyboard.press('Enter');
  check(await page.evaluate(() => document.activeElement?.id === 'main'), 'skip link moves focus to the main content');

  await page.close();
  const fresh = await open('/', 1360);
  const stops = [];
  for (let i = 0; i < 80; i++) {
    await fresh.page.keyboard.press('Tab');
    const stop = await fresh.page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        name: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('alt') || '').trim().slice(0, 40),
        ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        scrollRegion: el.getAttribute('role') === 'region',
      };
    });
    if (!stop) break;
    stops.push(stop);
  }
  check(stops.length >= 8, `keyboard reaches the page controls (${stops.length} tab stops)`);
  const noRing = stops.filter((s) => !s.ring);
  check(noRing.length === 0, `every tab stop shows a focus ring${noRing.length ? ` (missing on: ${noRing.map((s) => s.name || s.tag).join(', ')})` : ''}`);
  const unnamed = stops.filter((s) => !s.name && !s.scrollRegion);
  check(unnamed.length === 0, `every tab stop has an accessible name${unnamed.length ? ` (${unnamed.length} without)` : ''}`);
  await fresh.page.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll browser checks passed');
process.exit(failures.length ? 1 : 0);
