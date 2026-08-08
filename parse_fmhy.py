import re
import json

content_path = r"C:\Users\Praashu\.gemini\antigravity-ide\brain\111d285c-7479-4154-93ad-6067a992d2bc\.system_generated\steps\177\content.md"

with open(content_path, 'r', encoding='utf-8') as f:
    html_content = f.read()

sites = []

li_pattern = re.compile(r'<li[^>]*>(.*?)</li>', re.DOTALL | re.IGNORECASE)

for match in li_pattern.finditer(html_content):
    li_html = match.group(1)
    
    link_match = re.search(r'<a[^>]+href="([^"]+)"[^>]*>([^<]+)</a>', li_html)
    if link_match:
        url = link_match.group(1)
        name = link_match.group(2)
        
        if url.startswith('/') or 'reddit.com' in url or 'discord.gg' in url or 'github.com' in url:
            continue
            
        text_content = re.sub(r'<[^>]+>', ' ', li_html)
        text_content = re.sub(r'\s+', ' ', text_content).strip()
        
        if '-' in text_content or '|' in text_content:
            sites.append({
                'Name': name,
                'URL': url,
                'Details': text_content
            })

seen = set()
unique_sites = []
for s in sites:
    if s['URL'] not in seen:
        seen.add(s['URL'])
        unique_sites.append(s)

output = "# FMHY Streaming Sites List\n\n"
output += "*Note: As outlined in the implementation plan, this is a static extraction from the FMHY list. Deep scanning of servers/VPN requirements is not feasible.* \n\n"
output += "| Name | URL | Details |\n"
output += "|---|---|---|\n"

for s in unique_sites:
    output += f"| {s['Name']} | {s['URL']} | {s['Details']} |\n"

with open(r"C:\Users\Praashu\.gemini\antigravity-ide\brain\111d285c-7479-4154-93ad-6067a992d2bc\fmhy_sites.md", 'w', encoding='utf-8') as f:
    f.write(output)

print(f"Extracted {len(unique_sites)} sites.")
