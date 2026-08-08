const fs = require('fs');

const contentPath = 'C:\\Users\\Praashu\\.gemini\\antigravity-ide\\brain\\111d285c-7479-4154-93ad-6067a992d2bc\\.system_generated\\steps\\177\\content.md';
const outputPath = 'C:\\Users\\Praashu\\.gemini\\antigravity-ide\\brain\\111d285c-7479-4154-93ad-6067a992d2bc\\fmhy_sites.md';

const htmlContent = fs.readFileSync(contentPath, 'utf8');

const sites = [];
const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
let match;

while ((match = liRegex.exec(htmlContent)) !== null) {
    const liHtml = match[1];
    
    const linkMatch = liHtml.match(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/i);
    if (linkMatch) {
        const url = linkMatch[1];
        const name = linkMatch[2];
        
        if (url.startsWith('/') || url.includes('reddit.com') || url.includes('discord.gg') || url.includes('github.com')) {
            continue;
        }
        
        let textContent = liHtml.replace(/<[^>]+>/g, ' ');
        textContent = textContent.replace(/\s+/g, ' ').trim();
        
        if (textContent.includes('-') || textContent.includes('|')) {
            sites.push({ name, url, details: textContent });
        }
    }
}

const seen = new Set();
const uniqueSites = [];
for (const s of sites) {
    if (!seen.has(s.url)) {
        seen.add(s.url);
        uniqueSites.push(s);
    }
}

let output = "# FMHY Streaming Sites List\n\n";
output += "> [!IMPORTANT]\n";
output += "> **Technical Limitations**\n";
output += "> Per our approved implementation plan, this is a static extraction from the FMHY list. Deep scanning of servers/VPN requirements for hundreds of anti-bot protected sites is not technically feasible to fully automate.\n\n";
output += "| Name | URL | Details |\n";
output += "|---|---|---|\n";

for (const s of uniqueSites) {
    output += `| ${s.name} | ${s.url} | ${s.details} |\n`;
}

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Extracted ${uniqueSites.length} sites.`);
