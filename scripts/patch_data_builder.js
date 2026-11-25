const fs = require('fs');
let s = fs.readFileSync('scripts/build_data.js','utf8');
s = s.replace("    levels: p['building:levels'] ? Number(p['building:levels']) : null,", "    levels: p['building:levels'] ? Number(p['building:levels']) : null,\n    layer: p.layer ? Number(p.layer) : 0,\n    bridge: p.bridge === 'yes' || p.bridge === 'true',\n    tunnel: p.tunnel === 'yes' || p.tunnel === 'true',\n    lanes: p.lanes ? Number(p.lanes) : null,\n    surface: p.surface || '',");
fs.writeFileSync('scripts/build_data.js', s);
