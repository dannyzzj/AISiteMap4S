const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('<div class="metric"><b id="metricBuildings">--</b><span>建筑</span></div>', '<div class="metric"><b id="metricBuildings">--</b><span>出席</span></div>');
html = html.replace('<div class="metric"><b id="metricRoads">--</b><span>道路</span></div>', '<div class="metric"><b id="metricRoads">--</b><span>在场</span></div>');
html = html.replace('<div class="metric"><b id="metricArea">--</b><span>范围 m</span></div>', '<div class="metric"><b id="metricArea">2</b><span>超时未出</span></div>');
fs.writeFileSync('index.html', html);
let app = fs.readFileSync('app.js', 'utf8');
app = app.replace("document.getElementById('metricArea').textContent = `${Math.round(W)} × ${Math.round(H)}`;", "document.getElementById('metricArea').textContent = '2';");
fs.writeFileSync('app.js', app);
