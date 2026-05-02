import { chromium } from '/Users/dewi/code/email-drafter/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:8000/6', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const result = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href^="/courses/"]'));
  return links
    .filter((a) => a.href.match(/courses\/(agi-strategy|technical-ai-safety|ai-governance|biosecurity)$/))
    .map((a) => ({
      href: a.getAttribute('href'),
      paragraphCount: a.querySelectorAll('p').length,
      paragraphs: Array.from(a.querySelectorAll('p')).map((p) => p.textContent?.trim().slice(0, 80)),
    }));
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
