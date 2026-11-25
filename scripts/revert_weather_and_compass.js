const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
html=html.replace('position: fixed; z-index: 5; top: 78px; right: 25px; display: flex; gap: 9px; align-items: center;', 'position: fixed; z-index: 5; top: 24px; right: 25px; display: flex; gap: 9px; align-items: center;');
html=html.replace(/\s*\.env-status \{[\s\S]*?body\.light-ui \.status-divider \{[^\r\n]*\}\s*/, '\n    ');
html=html.replace('      .env-status { top: 64px; left: 16px; right: 16px; max-width: none; }\n      .env-weather { flex: 1; }\n      #weatherText { max-width: none; }\n      .metric-row { top: 122px; right: 16px; }', '      .metric-row { top: 16px; right: 16px; }');
html=html.replace(/\s*<section class="env-status"[\s\S]*?<\/section>\s*/, '\n  ');
html=html.replace('  </div>\n<nav class="toolbar" aria-label="地图工具">', '  </div>\n\n  <div class="compass" aria-hidden="true"></div>\n\n  <nav class="toolbar" aria-label="地图工具">');
const compassCss=`
    .compass {
      position: fixed; z-index: 4; right: 28px; top: 102px; width: 58px; height: 58px; border-radius: 50%;
      border: 1px solid rgba(103,232,255,.17); background: rgba(4,17,29,.45); display: grid; place-items: center;
      color: #8bb4c7; font-size: 10px; letter-spacing: .18em; backdrop-filter: blur(10px); pointer-events: none;
    }
    .compass::before { content: "N"; position: absolute; top: 5px; color: var(--accent); font-size: 10px; }
    .compass::after { content: ""; width: 1px; height: 25px; background: linear-gradient(var(--accent), rgba(103,232,255,.06)); transform: translateY(3px); }
    body.light-ui .compass { background: rgba(246, 252, 255, 0.58); border-color: rgba(31, 138, 170, 0.26); color: #466879; }
`;
html=html.replace(/(\s*@media \(max-width: 720px\) \{)/, compassCss+'$1');
html=html.replace('      .topbar { top: 16px; left: 16px; }', '      .topbar { top: 16px; left: 16px; }\n      .compass { right: 20px; top: 83px; width: 48px; height: 48px; }');
fs.writeFileSync('index.html',html);

let app=fs.readFileSync('app.js','utf8');
app=app.replace(/\s*const currentDate = document\.getElementById\('currentDate'\);[\s\S]*?setInterval\(loadHKOWeather, 10 \* 60 \* 1000\);\s*/, '\n\n');
fs.writeFileSync('app.js',app);
