const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Ask everyone their username on guest mode
html = html.replace(
  `onclick="document.getElementById('authOverlay').style.display='none'; localStorage.setItem('cinepulse_username', 'Guest');"`,
  `onclick="const u = prompt('Enter a username for your local session:', 'Guest'); if(u) { localStorage.setItem('cinepulse_username', u); document.getElementById('authOverlay').style.display='none'; if(window.updateProfileDisplay) window.updateProfileDisplay(u); }"`
);

// Fix hardcoded 14-day streak to use dynamic value on load
html = html.replace(
  `<div class="profile-streak">🔥 14-day streak</div>`,
  `<div class="profile-streak" id="profileStreakDisplay">🔥 Day 1 - start your streak!</div>`
);

fs.writeFileSync('index.html', html);
console.log('Patched index.html successfully.');
