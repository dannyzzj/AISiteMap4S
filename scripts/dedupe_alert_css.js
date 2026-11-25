const fs=require('fs'); let html=fs.readFileSync('index.html','utf8');
html=html.replace(/\n      \.metric\.metric-alert \{[\s\S]*?\.metric\.metric-alert span \{ color: #fff0e6; \}\n      \.toolbar \{/, '\n      .toolbar {');
fs.writeFileSync('index.html',html);
