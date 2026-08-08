import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const api = fs.readFileSync('api.js', 'utf8');

console.log('====================================================');
console.log('CINEPULSE COMPREHENSIVE AUDIT & LOGIC CHECK');
console.log('====================================================\n');

// 1. Audit DOM IDs
const idsInHtml = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);
console.log(`[DOM AUDIT] Found ${idsInHtml.length} unique IDs in index.html.`);

const missingInHtml = [];
const jsSelectors = [...js.matchAll(/\$\(['"]#([^'"\s\.,:\[\]]+)/g)].map(m => m[1]);
jsSelectors.forEach(id => {
  if (!idsInHtml.includes(id)) {
    missingInHtml.push(id);
  }
});
console.log('[DOM AUDIT] Selectors in app.js missing from index.html:', [...new Set(missingInHtml)]);

// 2. Check for unused IDs in index.html
const unhandledIds = idsInHtml.filter(id => !js.includes(id));
console.log('[DOM AUDIT] HTML IDs not referenced in JS:', unhandledIds);

// 3. Matrix filter pills in HTML vs logic
const pillsInHtml = [...html.matchAll(/data-filter=["']([^"']+)["']/g)].map(m => m[1]);
console.log('\n[PILLS AUDIT] Matrix filter pills in HTML:', pillsInHtml);

// 4. Check for onclick attributes in HTML
const onclicks = [...html.matchAll(/onclick=["']([^"']+)["']/g)].map(m => m[1]);
console.log('\n[EVENT AUDIT] Inline onclick handlers in HTML:', onclicks);

// 5. Check if onclick functions exist in JS
const missingOnclicks = onclicks.filter(fnCall => {
  const fnName = fnCall.split('(')[0].trim();
  return !js.includes(`function ${fnName}`) && !js.includes(`const ${fnName}`) && !js.includes(`${fnName} =`);
});
console.log('[EVENT AUDIT] Inline onclick functions missing in JS:', missingOnclicks);
