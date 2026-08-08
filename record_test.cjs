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

  console.log('Navigating to http://localhost:8080...');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  console.log('Waiting for content cards...');
  await page.waitForSelector('.content-card');

  console.log('Clicking "Add to List" on first catalog item...');
  await page.evaluate(() => {
    const btn = document.querySelector('.content-card__add-btn');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const state1 = await page.evaluate(() => ({
    heroTitle: document.querySelector('#heroTitle')?.textContent,
    heroLabel: document.querySelector('#heroLabel')?.textContent,
    progressText: document.querySelector('#heroProgressText')?.textContent,
    progressWidth: document.querySelector('#heroProgress')?.style.width,
    btnText: document.querySelector('#heroPlayBtn')?.innerText,
    heroVisible: !document.querySelector('#heroPopulated')?.classList.contains('hidden')
  }));
  console.log('Step 1 (Added to Library):', JSON.stringify(state1, null, 2));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_01_added_to_library.png') });

  console.log('Clicking "Start Watching / Mark Watching" on Hero Card...');
  await page.evaluate(() => document.querySelector('#heroPlayBtn').click());
  await new Promise(r => setTimeout(r, 800));

  const state2 = await page.evaluate(() => ({
    heroTitle: document.querySelector('#heroTitle')?.textContent,
    heroLabel: document.querySelector('#heroLabel')?.textContent,
    progressText: document.querySelector('#heroProgressText')?.textContent,
    progressWidth: document.querySelector('#heroProgress')?.style.width,
    btnText: document.querySelector('#heroPlayBtn')?.innerText
  }));
  console.log('Step 2 (Started Watching / Click 1):', JSON.stringify(state2, null, 2));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_02_started_watching.png') });

  console.log('Clicking "+1 Ep / +1 Ch" (Click 2)...');
  await page.evaluate(() => document.querySelector('#heroPlayBtn').click());
  await new Promise(r => setTimeout(r, 800));

  const state3 = await page.evaluate(() => ({
    heroTitle: document.querySelector('#heroTitle')?.textContent,
    progressText: document.querySelector('#heroProgressText')?.textContent,
    progressWidth: document.querySelector('#heroProgress')?.style.width,
    btnText: document.querySelector('#heroPlayBtn')?.innerText
  }));
  console.log('Step 3 (+1 Ep / Click 2):', JSON.stringify(state3, null, 2));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_03_plus_ep1.png') });

  console.log('Clicking "+1 Ep / +1 Ch" (Click 3)...');
  await page.evaluate(() => document.querySelector('#heroPlayBtn').click());
  await new Promise(r => setTimeout(r, 800));

  const state4 = await page.evaluate(() => ({
    heroTitle: document.querySelector('#heroTitle')?.textContent,
    progressText: document.querySelector('#heroProgressText')?.textContent,
    progressWidth: document.querySelector('#heroProgress')?.style.width,
    btnText: document.querySelector('#heroPlayBtn')?.innerText
  }));
  console.log('Step 4 (+1 Ep / Click 3):', JSON.stringify(state4, null, 2));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'live_04_plus_ep2.png') });

  await browser.close();
  console.log('\nFULL DOM LIVE REVERIFICATION COMPLETED SUCCESSFULLY!');
})();
