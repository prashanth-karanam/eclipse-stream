const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
  `                <div class="custom-option" data-value="embed-su">Embed.su (Fast HD)</div>
                <div class="custom-option" data-value="superembed">SuperEmbed (Multi)</div>`,
  `                <div class="custom-option" data-value="embed-su">Embed.su (Fast HD)</div>
                <div class="custom-option" data-value="vidsrc-cc">VidSrc CC (Unblocked IST)</div>
                <div class="custom-option" data-value="vidsrc-in">VidSrc IN (Unblocked IST)</div>
                <div class="custom-option" data-value="superembed">SuperEmbed (Multi)</div>`
);

fs.writeFileSync('index.html', html);
console.log('Patched index.html for servers.');
