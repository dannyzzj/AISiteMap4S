const fs = require('fs');
const path = require('path');
const root = process.cwd();
const src = path.join(root, 'data', 'tianan_cyberpark.geojson');
const geo = JSON.parse(fs.readFileSync(src, 'utf8'));
const bbox = { west: 114.0218, south: 22.5298, east: 114.0308, north: 22.5395 };
const center = { lon: (bbox.west + bbox.east) / 2, lat: (bbox.south + bbox.north) / 2 };
const metersPerDegLat = 110540;
const metersPerDegLon = 111320 * Math.cos(center.lat * Math.PI / 180);
const widthMeters = (bbox.east - bbox.west) * metersPerDegLon;
const heightMeters = (bbox.north - bbox.south) * metersPerDegLat;

function cleanCoord(c) { return [Number(c[0].toFixed(7)), Number(c[1].toFixed(7))]; }
function rings(feature) {
  const g = feature.geometry;
  if (!g) return [];
  if (g.type === 'Polygon') return g.coordinates.map(r => r.map(cleanCoord));
  if (g.type === 'MultiPolygon') return g.coordinates.map(p => p[0].map(cleanCoord));
  if (g.type === 'LineString') return [g.coordinates.map(cleanCoord)];
  if (g.type === 'MultiLineString') return g.coordinates.map(r => r.map(cleanCoord));
  return [];
}
function classify(p) {
  if (p.building) return 'building';
  if (p.highway) return 'highway';
  if (p.landuse) return 'landuse';
  if (p.leisure) return 'leisure';
  if (p.natural) return 'natural';
  if (p.waterway) return 'waterway';
  if (p.railway) return 'railway';
  return 'other';
}
function heightOf(p, id) {
  if (p.height) { const m = String(p.height).match(/[\d.]+/); if (m) return Number(m[0]); }
  if (p['building:levels']) { const m = String(p['building:levels']).match(/[\d.]+/); if (m) return Number(m[0]) * 3.2 + 1.2; }
  const type = p.building || '';
  let seed = 0; for (const ch of String(id)) seed = (seed * 33 + ch.charCodeAt(0)) | 0;
  const base = /apartments|residential/.test(type) ? 38 : /commercial|office|retail/.test(type) ? 32 : 22;
  return base + Math.abs(seed % 17);
}
const features = [], buildings = [], roads = [], areas = [];
for (const f of geo.features) {
  const p = f.properties || {};
  const kind = classify(p);
  if (kind === 'other') continue;
  const rs = rings(f);
  if (!rs.length) continue;
  const item = {
    id: f.id || p['@id'],
    kind,
    name: p.name || p['addr:housename'] || p['name:zh'] || '',
    displayName: p['addr:housename'] || p.name || p['name:zh'] || p['addr:street'] || '',
    nameEn: p['name:en'] || '',
    subtype: p.building || p.highway || p.landuse || p.leisure || p.natural || p.waterway || p.railway || '',
    levels: p['building:levels'] ? Number(p['building:levels']) : null,
    layer: p.layer ? Number(p.layer) : 0,
    bridge: p.bridge === 'yes' || p.bridge === 'true',
    tunnel: p.tunnel === 'yes' || p.tunnel === 'true',
    lanes: p.lanes ? Number(p.lanes) : null,
    surface: p.surface || '',
    height: kind === 'building' ? heightOf(p, f.id) : null,
    rings: rs
  };
  features.push(item);
  if (kind === 'building') buildings.push(item);
  else if (kind === 'highway') roads.push(item);
  else areas.push(item);
}
const park = features.find(f => f.id === 'way/1305353889');
const web = {
  meta: {
    location: '广东省深圳市福田区车公庙天安数码城',
    locationEn: "Tian'an Cyber Park, Chegongmiao, Futian, Shenzhen",
    center, bbox, widthMeters: Number(widthMeters.toFixed(1)), heightMeters: Number(heightMeters.toFixed(1)),
    dataTimestamp: geo.timestamp || null,
    buildingCount: buildings.length,
    roadCount: roads.length,
    areaCount: areas.length,
    source: 'OpenStreetMap contributors (ODbL); Esri World Imagery'
  },
  parkBoundary: park ? park.rings[0] : [],
  buildings,
  roads,
  areas: features.filter(f => f.kind !== 'building' && f.kind !== 'highway')
};
fs.writeFileSync(path.join(root,'data','map_data.json'), JSON.stringify(web));
fs.writeFileSync(path.join(root,'data','map_data.js'), 'window.MAP_DATA = ' + JSON.stringify(web) + ';\n');

// World file in geographic degrees for the satellite PNG.
const dx = (bbox.east - bbox.west) / 2400;
const dy = (bbox.north - bbox.south) / 2400;
const worldfile = [dx, 0, 0, -dy, bbox.west + dx/2, bbox.north - dy/2].map(v => v.toFixed(12)).join('\n') + '\n';
fs.writeFileSync(path.join(root,'assets','satellite.pgw'), worldfile);
fs.writeFileSync(path.join(root,'assets','satellite.wld'), worldfile);

// Build a standards-compliant OSM XML file for BlenderGIS import.
const nodeMap = new Map(); const nodes = []; const ways = []; let nextNode = -1, nextWay = -1;
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function nodeRef(lon,lat) {
  const key = lon.toFixed(7) + ',' + lat.toFixed(7);
  if (nodeMap.has(key)) return nodeMap.get(key);
  const id = nextNode--; nodeMap.set(key,id); nodes.push(`  <node id="${id}" lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"/>`);
  return id;
}
for (const item of features) {
  for (const ring of item.rings) {
    if (ring.length < 2) continue;
    const ids = ring.map(c => nodeRef(c[0],c[1]));
    const id = nextWay--;
    ways.push(`  <way id="${id}">\n${ids.map(n=>`    <nd ref="${n}"/>`).join('\n')}\n    <tag k="name" v="${esc(item.name || item.nameEn || item.id)}"/>\n    <tag k="${item.kind}" v="${esc(item.subtype || 'yes')}"/>\n${item.kind==='building'&&item.height?`    <tag k="height" v="${item.height.toFixed(1)}"/>\n`:''}  </way>`);
  }
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<osm version="0.6" generator="Codex BlenderGIS export">\n  <bounds minlat="${bbox.south}" minlon="${bbox.west}" maxlat="${bbox.north}" maxlon="${bbox.east}"/>\n${nodes.join('\n')}\n${ways.join('\n')}\n</osm>\n`;
fs.writeFileSync(path.join(root,'data','tianan_cyberpark.osm'), xml);
console.log(JSON.stringify({features:features.length,buildings:buildings.length,roads:roads.length,areas:areas.length,nodes:nodes.length,ways:ways.length,widthMeters,heightMeters},null,2));
