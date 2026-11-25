const fs = require('fs');
const html0 = fs.readFileSync('index.html','utf8');
const three = fs.readFileSync('assets/three.bundle.js','utf8');
const mapData = fs.readFileSync('data/map_data.js','utf8');
let app = fs.readFileSync('app.js','utf8');
const jpg = fs.readFileSync('assets/satellite.jpg').toString('base64');
const uri = 'data:image/jpeg;base64,' + jpg;
app = app.replace(/'assets\/satellite\.jpg'/g, () => JSON.stringify(uri));
for (const [name, content] of [['three', three], ['map', mapData], ['app', app]]) {
  if (/<\/script/i.test(content)) throw new Error(name + ' contains closing script tag');
}
let html = html0;
function inject(marker, content) {
  if (!html.includes(marker)) throw new Error('missing marker ' + marker);
  html = html.replace(marker, () => '  <script>\n' + content + '\n  </script>');
}
inject('  <script src="assets/three.bundle.js"></script>', three);
inject('  <script src="data/map_data.js"></script>', mapData);
inject('  <script src="app.js"></script>', app);
fs.writeFileSync('天安数码城_3D地图.html', html);
console.log(JSON.stringify({bytes: Buffer.byteLength(html), mb: (Buffer.byteLength(html)/1024/1024).toFixed(2)}));
