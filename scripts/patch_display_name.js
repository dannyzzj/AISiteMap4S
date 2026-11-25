const fs=require('fs');
let s=fs.readFileSync('scripts/build_data.js','utf8');
s=s.replace("    name: p.name || p['addr:housename'] || p['name:zh'] || '',\n    nameEn: p['name:en'] || '',", "    name: p.name || p['addr:housename'] || p['name:zh'] || '',\n    displayName: p['addr:housename'] || p.name || p['name:zh'] || p['addr:street'] || '',\n    nameEn: p['name:en'] || '',");
fs.writeFileSync('scripts/build_data.js',s);
