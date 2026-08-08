const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Praashu\\.gemini\\antigravity-ide\\brain\\4e9aa678-db90-4101-a9c9-7fcd2fac1b2e';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE ERROR] ${err.toString()}`));

  console.log('Navigating to http://localhost:8080...');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  const stateBefore = await page.evaluate(() => {
    const title = document.querySelector('#heroTitle')?.textContent;
    const progressText = document.querySelector('#heroProgressText')?.textContent;
    const progressWidth = document.querySelector('#heroProgress')?.style.width;
    const btnText = document.querySelector('#heroPlayBtn')?.innerText;
    return { title, progressText, progressWidth, btnText };
  });

  console.log('State BEFORE click:', JSON.stringify(stateBefore, null, 2));
  const pathBefore = path.join(ARTIFACT_DIR, 'hero_before_click.png');
  await page.screenshot({ path: pathBefore });

  console.log('Clicking #heroPlayBtn...');
  await page.click('#heroPlayBtn');
  await new Promise(r => setTimeout(r, 1000));

  const stateAfter1 = await page.evaluate(() => {
    const title = document.querySelector('#heroTitle')?.textContent;
    const progressText = document.querySelector('#heroProgressText')?.textContent;
    const progressWidth = document.querySelector('#heroProgress')?.style.width;
    const btnText = document.querySelector('#heroPlayBtn')?.innerText;
    return { title, progressText, progressWidth, btnText };
  });
  console.log('State AFTER click 1:', JSON.stringify(stateAfter1, null, 2));
  const pathAfter1 = path.join(ARTIFACT_DIR, 'hero_after_click1.png');
  await page.screenshot({ path: pathAfter1 });

  console.log('Clicking #heroPlayBtn second time...');
  await page.click('#heroPlayBtn');
  await new Promise(r => setTimeout(r, 1000));

  const stateAfter2 = await page.evaluate(() => {
    const title = document.querySelector('#heroTitle')?.textContent;
    const progressText = document.querySelector('#heroProgressText')?.textContent;
    const progressWidth = document.querySelector('#heroProgress')?.style.width;
    const btnText = document.querySelector('#heroPlayBtn')?.innerText;
    return { title, progressText, progressWidth, btnText };
  });
  console.log('State AFTER click 2:', JSON.stringify(stateAfter2, null, 2));
  const pathAfter2 = path.join(ARTIFACT_DIR, 'hero_after_click2.png');
  await page.screenshot({ path: pathAfter2 });

  console.log('\n--- CONSOLE LOGS ---');
  console.log(consoleLogs.join('\n'));

  await browser.close();
  console.log('Done!');
})();
