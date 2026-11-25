const fs=require('fs');
let h=fs.readFileSync('index.html','utf8');
h=h.replace(/\s*<div class="compass" aria-hidden="true"><\/div>\s*/, '\n');
h=h.replace(/\s*\.compass \{[\s\S]*?\.compass::after \{[^\r\n]*\}\s*/, '\n    ');
h=h.replace(/\s*\.compass \{ right: 20px; top: 83px; width: 48px; height: 48px; \}\s*/, '\n      ');
h=h.replace(/\s*body\.light-ui \.compass \{[^\r\n]*\}\s*/, '\n    ');
fs.writeFileSync('index.html',h);
