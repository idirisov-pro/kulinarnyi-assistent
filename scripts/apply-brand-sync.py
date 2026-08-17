from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
  <title id="title">Кулинарный ассистент</title>
  <desc id="desc">Ингредиенты опускаются в тарелку: лист, гриб и продукт с тремя точками.</desc>
  <rect width="512" height="512" rx="92" fill="#f5f0e6"/>
  <g fill="#2f6345" stroke="#2f6345" stroke-linecap="round" stroke-linejoin="round">
    <!-- leaf -->
    <path d="M143 130c-30 5-53 28-52 59 1 31 25 56 57 58 10-33 4-73-5-117z" stroke="none"/>
    <path d="M111 162c24 18 45 42 61 72" fill="none" stroke-width="8"/>
    <!-- mushroom -->
    <path d="M213 165c0-36 29-65 65-65s65 29 65 65H213z" stroke="none"/>
    <path d="M260 162h36l10 75c2 15-9 28-24 28h-8c-15 0-26-13-24-28z" stroke="none"/>
    <!-- ingredient tile -->
    <rect x="355" y="126" width="88" height="88" rx="22" stroke="none" transform="rotate(14 399 170)"/>
    <g fill="#f5f0e6" stroke="none">
      <circle cx="382" cy="153" r="6"/>
      <circle cx="405" cy="174" r="6"/>
      <circle cx="419" cy="147" r="6"/>
    </g>
    <!-- dotted trajectories -->
    <path d="M154 258c12 29 16 58 12 89" fill="none" stroke-width="7" stroke-dasharray="2 18"/>
    <path d="M278 282c0 24-1 45-3 68" fill="none" stroke-width="7" stroke-dasharray="2 18"/>
    <path d="M389 246c-9 34-17 62-30 91" fill="none" stroke-width="7" stroke-dasharray="2 18"/>
    <!-- plate / bowl -->
    <path d="M111 349c29 20 83 32 145 32s116-12 145-32" fill="none" stroke-width="15"/>
    <path d="M105 360c8 83 72 117 151 117s143-34 151-117c-40 26-95 39-151 39s-111-13-151-39z" stroke="none"/>
    <path d="M93 352c0-16 73-30 163-30s163 14 163 30-73 30-163 30S93 368 93 352z" fill="#f5f0e6" stroke-width="13"/>
  </g>
</svg>
'''
(ROOT / 'icons' / 'icon.svg').write_text(svg, encoding='utf-8')

# index.html
p = ROOT / 'index.html'
text = p.read_text(encoding='utf-8')
text = text.replace('<meta property="og:url" content="https://idirisov-pro.github.io/kulinarnyi-assistent/" />', '<meta property="og:url" content="https://idirisov-pro.github.io/kulinarnyi-assistent/" />\n  <meta property="og:image" content="https://idirisov-pro.github.io/kulinarnyi-assistent/icons/icon.svg?v=brand2" />')
text = text.replace('<meta name="twitter:card" content="summary" />', '<meta name="twitter:card" content="summary" />\n  <meta name="twitter:image" content="https://idirisov-pro.github.io/kulinarnyi-assistent/icons/icon.svg?v=brand2" />')
text = text.replace('manifest.webmanifest?v=3.0-preview.5', 'manifest.webmanifest?v=3.0-preview.5-brand2')
text = text.replace('<link rel="icon" href="icons/icon-192.png" />', '<link rel="icon" type="image/svg+xml" href="icons/icon.svg?v=brand2" />')
text = text.replace('<div class="brand-mini" aria-label="Кулинарный ассистент"><span class="brand-dot"></span><span>Кулинарный ассистент</span></div>', '<div class="brand-mini" aria-label="Кулинарный ассистент"><img class="brand-mark" src="icons/icon.svg?v=brand2" alt="" width="32" height="32" /><span>Кулинарный ассистент</span></div>')
p.write_text(text, encoding='utf-8')

# preview4.css
p = ROOT / 'preview4.css'
text = p.read_text(encoding='utf-8')
text = text.replace('.brand-dot { width:11px; height:11px; border-radius:50%; background:var(--accent); box-shadow:0 0 0 5px rgba(47,102,72,.10); }', '.brand-mark { width:32px; height:32px; display:block; flex:0 0 auto; border-radius:9px; }')
text = text.replace('  .brand-mini span:last-child { display:none; }', '  .brand-mini span:last-child { display:none; }\n  .brand-mark { width:34px; height:34px; border-radius:10px; }')
p.write_text(text, encoding='utf-8')

# manifest.webmanifest
p = ROOT / 'manifest.webmanifest'
text = p.read_text(encoding='utf-8')
text = re.sub(r'"icons": \[.*?\n  \]', '"icons": [\n    { "src": "icons/icon.svg?v=brand2", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }\n  ]', text, flags=re.S)
p.write_text(text, encoding='utf-8')

# service-worker.js
p = ROOT / 'service-worker.js'
text = p.read_text(encoding='utf-8')
text = text.replace("culinary-assistant-v3-preview-5-public-beta-1", "culinary-assistant-v3-preview-5-public-beta-brand-2")
text = text.replace("'./manifest.webmanifest?v=3.0-preview.5',", "'./manifest.webmanifest?v=3.0-preview.5-brand2',")
text = text.replace("  './icons/icon-192.png',\n  './icons/icon-512.png'", "  './icons/icon.svg?v=brand2',\n  './icons/icon-192.png',\n  './icons/icon-512.png'")
p.write_text(text, encoding='utf-8')
