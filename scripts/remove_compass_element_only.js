const fs=require('fs'); let html=fs.readFileSync('index.html','utf8');
html=html.replace(/\s*<div class="compass" aria-hidden="true"><\/div>\s*/, '\n\n');
fs.writeFileSync('index.html',html);
