const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');
app = app.replace(
  "  scene.add(new THREE.AmbientLight(0x5c7d95, 0.55));",
  "  const ambient = new THREE.AmbientLight(0x5c7d95, 0.55);\n  scene.add(ambient);"
);
const marker = "  document.getElementById('btnPerspective').addEventListener('click', perspectiveView);";
const lightingCode = `  const DAY_LIGHT = {\n    sun: 2.15, fill: 0.55, hemi: 1.45, ambient: 0.55,\n    exposure: 1.08, background: 0x07131f, fog: 0x07131f,\n    hemiSky: 0xb8e9ff, hemiGround: 0x1a2730\n  };\n  const NIGHT_LIGHT = {\n    sun: 0.0, fill: 0.0, hemi: 0.13, ambient: 0.045,\n    exposure: 0.68, background: 0x010409, fog: 0x010409,\n    hemiSky: 0x213247, hemiGround: 0x03070b\n  };\n\n  function setLighting(mode) {\n    const daylight = mode === 'day';\n    const cfg = daylight ? DAY_LIGHT : NIGHT_LIGHT;\n    sun.intensity = cfg.sun;\n    fill.intensity = cfg.fill;\n    hemi.intensity = cfg.hemi;\n    ambient.intensity = cfg.ambient;\n    hemi.color.setHex(cfg.hemiSky);\n    hemi.groundColor.setHex(cfg.hemiGround);\n    renderer.toneMappingExposure = cfg.exposure;\n    scene.background.setHex(cfg.background);\n    scene.fog.color.setHex(cfg.fog);\n    baseUnder.material.color.setHex(daylight ? 0x061019 : 0x010307);\n    setActive('btnDay', daylight);\n    setActive('btnNight', !daylight);\n  }\n\n  document.getElementById('btnDay').addEventListener('click', () => setLighting('day'));\n  document.getElementById('btnNight').addEventListener('click', () => setLighting('night'));\n\n`;
if (!app.includes(marker)) throw new Error('perspective marker not found');
app = app.replace(marker, lightingCode + marker);
fs.writeFileSync('app.js', app);
