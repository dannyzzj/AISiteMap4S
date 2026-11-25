const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');

const nightSky = `
  function createNightSkyTexture() {
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
    sky.addColorStop(0.0, '#01040c');
    sky.addColorStop(0.45, '#061426');
    sky.addColorStop(0.76, '#0b2138');
    sky.addColorStop(1.0, '#183348');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

    const moon = ctx.createRadialGradient(210, 118, 3, 210, 118, 92);
    moon.addColorStop(0.0, 'rgba(226, 242, 255, 0.95)');
    moon.addColorStop(0.12, 'rgba(188, 218, 244, 0.58)');
    moon.addColorStop(0.46, 'rgba(125, 174, 224, 0.10)');
    moon.addColorStop(1.0, 'rgba(125, 174, 224, 0)');
    ctx.fillStyle = moon;
    ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

    for (let i = 0; i < 260; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * skyCanvas.width;
      const y = (Math.sin(i * 78.233 + 3.1) * 23758.5453 % 1 + 1) % 1 * skyCanvas.height * 0.62;
      const r = 0.45 + ((i * 7) % 5) * 0.22;
      const alpha = 0.22 + ((i * 17) % 11) * 0.055;
      ctx.fillStyle = 'rgba(205, 229, 255, ' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(skyCanvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  const nightSkyTexture = createNightSkyTexture();
`;
app = app.replace("  const daySkyTexture = createDaySkyTexture();\n", "  const daySkyTexture = createDaySkyTexture();\n" + nightSky);

app = app.replace(
  "  scene.add(shadowCatcher);\n",
  `  scene.add(shadowCatcher);

  const nightDim = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.1, H * 1.1),
    new THREE.MeshBasicMaterial({ color: 0x020814, transparent: true, opacity: 0.78, depthWrite: false, side: THREE.DoubleSide })
  );
  nightDim.rotation.x = -Math.PI / 2;
  nightDim.position.y = -0.66;
  nightDim.renderOrder = 1;
  nightDim.visible = false;
  scene.add(nightDim);
`
);

const nightLights = `
  // Night lighting rig. These are additive light/atmosphere helpers only; they do
  // not alter any existing building, road, label geometry, transform, or material.
  function createGlowTexture() {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 64;
    glowCanvas.height = 64;
    const ctx = glowCanvas.getContext('2d');
    const glow = ctx.createRadialGradient(32, 32, 1, 32, 32, 31);
    glow.addColorStop(0.0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.18, 'rgba(255,247,210,0.95)');
    glow.addColorStop(0.48, 'rgba(255,221,145,0.30)');
    glow.addColorStop(1.0, 'rgba(255,205,110,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(glowCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  const nightLightingGroup = new THREE.Group();
  nightLightingGroup.name = 'night-lighting';
  nightLightingGroup.visible = false;
  scene.add(nightLightingGroup);
  const glowTexture = createGlowTexture();

  function addNightPoints(positions, colors, size, opacity) {
    if (!positions.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      map: glowTexture,
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      vertexColors: true,
      alphaTest: 0.015,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    points.renderOrder = 5;
    nightLightingGroup.add(points);
    return points;
  }

  function ringSample(ring, t) {
    const lengths = [];
    let total = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const a = project(ring[i]);
      const b = project(ring[i + 1]);
      const len = Math.hypot(b.x - a.x, b.z - a.z);
      lengths.push(len);
      total += len;
    }
    let target = t * total;
    for (let i = 0; i < lengths.length; i++) {
      if (target <= lengths[i] || i === lengths.length - 1) {
        const a = project(ring[i]);
        const b = project(ring[i + 1]);
        const f = lengths[i] ? clamp(target / lengths[i], 0, 1) : 0;
        return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
      }
      target -= lengths[i];
    }
    return project(ring[0]);
  }

  const windowPositions = [];
  const windowColors = [];
  for (let bi = 0; bi < D.buildings.length; bi++) {
    const building = D.buildings[bi];
    const ring = building.rings && building.rings[0];
    const height = Number(building.height) || 0;
    if (!ring || ring.length < 3 || height < 12) continue;
    const floors = clamp(Math.floor(height / 10), 2, 9);
    const lightsPerFloor = height > 90 ? 4 : 3;
    const center = ring.reduce((acc, coord) => {
      const p = project(coord);
      acc.x += p.x; acc.z += p.z; return acc;
    }, { x: 0, z: 0 });
    center.x /= ring.length;
    center.z /= ring.length;
    for (let level = 0; level < floors; level++) {
      const y = 5.0 + (height - 7.0) * (level + 0.45) / floors;
      for (let k = 0; k < lightsPerFloor; k++) {
        const seed = (bi * 19 + level * 13 + k * 7) % 31;
        const p = ringSample(ring, (seed / 31 + k / lightsPerFloor * 0.31) % 1);
        const dx = p.x - center.x;
        const dz = p.z - center.z;
        const len = Math.hypot(dx, dz) || 1;
        windowPositions.push(p.x + dx / len * 0.55, y, p.z + dz / len * 0.55);
        const warm = (seed + level) % 7 !== 0;
        if (warm) windowColors.push(1.0, 0.70 + (seed % 4) * 0.035, 0.30);
        else windowColors.push(0.66, 0.83, 1.0);
      }
    }
  }
  addNightPoints(windowPositions, windowColors, 5.2, 0.86);

  const streetPositions = [];
  const streetColors = [];
  const streetLampCandidates = [];
  for (let ri = 0; ri < D.roads.length; ri++) {
    const road = D.roads[ri];
    if (!/motorway|trunk|primary|secondary|tertiary|residential|service|living_street/.test(road.subtype || '')) continue;
    const ring = road.rings && road.rings[0];
    if (!ring || ring.length < 2) continue;
    for (let i = 0; i < ring.length - 1; i++) {
      if ((ri * 3 + i) % 9 !== 0) continue;
      const a = project(ring[i]);
      const b = project(ring[i + 1]);
      if (Math.hypot(b.x - a.x, b.z - a.z) < 15) continue;
      streetLampCandidates.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 });
    }
  }
  const streetStep = Math.max(1, Math.floor(streetLampCandidates.length / 18));
  const selectedStreetLamps = [];
  for (let i = 0; i < streetLampCandidates.length && selectedStreetLamps.length < 18; i += streetStep) {
    selectedStreetLamps.push(streetLampCandidates[i]);
  }
  selectedStreetLamps.forEach((p, i) => {
    const warm = i % 3 !== 0;
    streetPositions.push(p.x, 8.6, p.z);
    if (warm) streetColors.push(1.0, 0.76, 0.40);
    else streetColors.push(0.78, 0.90, 1.0);
    if (i % 2 === 0) {
      const light = new THREE.PointLight(warm ? 0xffc46b : 0xd7ecff, warm ? 150 : 115, 145, 2);
      light.position.set(p.x, 10.0, p.z);
      nightLightingGroup.add(light);
    }
  });
  addNightPoints(streetPositions, streetColors, 8.5, 0.96);

  const boundaryPositions = [];
  const boundaryColors = [];
  if (D.parkBoundary && D.parkBoundary.length) {
    D.parkBoundary.forEach((coord, i) => {
      const p = project(coord);
      boundaryPositions.push(p.x, 4.2, p.z);
      if (i % 3 === 0) boundaryColors.push(0.62, 0.86, 1.0);
      else boundaryColors.push(1.0, 0.72, 0.34);
      if (i % 6 === 0) {
        const light = new THREE.PointLight(i % 12 === 0 ? 0xd7ecff : 0xffc46b, 34, 62, 2);
        light.position.set(p.x, 5.5, p.z);
        nightLightingGroup.add(light);
      }
    });
  }
  addNightPoints(boundaryPositions, boundaryColors, 6.2, 0.90);

  const beaconPositions = [];
  const beaconColors = [];
  D.buildings
    .filter((building) => (building.height || 0) > 75 && building.rings && building.rings[0])
    .slice(0, 24)
    .forEach((building, i) => {
      const p = project(building.rings[0][0]);
      beaconPositions.push(p.x, (building.height || 75) + 2.5, p.z);
      if (i % 3 === 0) beaconColors.push(1.0, 0.22, 0.18);
      else if (i % 3 === 1) beaconColors.push(0.30, 0.88, 1.0);
      else beaconColors.push(0.42, 1.0, 0.52);
    });
  addNightPoints(beaconPositions, beaconColors, 7.2, 0.95);

  // Warm pools of light around larger occupied buildings.
  D.buildings
    .filter((building) => (building.height || 0) > 24 && building.rings && building.rings[0])
    .sort((a, b) => (b.height || 0) - (a.height || 0))
    .slice(0, 7)
    .forEach((building, i) => {
      const ring = building.rings[0];
      const p = project(ring[0]);
      const light = new THREE.PointLight(i % 2 === 0 ? 0xffb85c : 0xffd28a, 95, 120, 2);
      light.position.set(p.x, Math.min(32, (building.height || 24) * 0.35), p.z);
      nightLightingGroup.add(light);
    });
`;
app = app.replace("  scene.add(boundaryGroup);\n", "  scene.add(boundaryGroup);\n" + nightLights);

app = app.replace(
`  const DAY_LIGHT = {
    sun: 3.8, fill: 0.18, hemi: 0.85, ambient: 0.22,
    exposure: 1.05, fov: 48, sunColor: 0xfff2d9,
    fog: 0xbfd7e5, hemiSky: 0xd8f1ff, hemiGround: 0x6b5948
  };
  const NIGHT_LIGHT = {
    sun: 0.0, fill: 0.0, hemi: 0.13, ambient: 0.045,
    exposure: 0.68, background: 0x010409, fog: 0x010409,
    hemiSky: 0x213247, hemiGround: 0x03070b
  };
`,
`  const DAY_LIGHT = {
    sun: 3.8, fill: 0.18, hemi: 0.85, ambient: 0.22,
    exposure: 1.05, sunColor: 0xfff2d9, fog: 0xbfd7e5,
    fogNear: Math.max(W, H) * 1.05, fogFar: Math.max(W, H) * 3.1,
    hemiSky: 0xd8f1ff, hemiGround: 0x6b5948
  };
  const NIGHT_LIGHT = {
    sun: 0.22, fill: 0.0, hemi: 0.065, ambient: 0.022,
    exposure: 0.72, sunColor: 0x8fb7e8, fog: 0x071525,
    fogNear: Math.max(W, H) * 0.62, fogFar: Math.max(W, H) * 2.7,
    hemiSky: 0x1b3551, hemiGround: 0x02050a
  };
`
);

app = app.replace(
`    sun.intensity = cfg.sun;
    sun.color.setHex(daylight ? DAY_LIGHT.sunColor : 0x9fb8cc);
    fill.intensity = cfg.fill;
    hemi.intensity = cfg.hemi;
    ambient.intensity = cfg.ambient;
    hemi.color.setHex(cfg.hemiSky);
    hemi.groundColor.setHex(cfg.hemiGround);
    renderer.toneMappingExposure = cfg.exposure;
    renderer.shadowMap.enabled = daylight;
    shadowCatcher.visible = daylight;
    if (daylight) {
      scene.background = daySkyTexture;
      scene.environment = daySkyTexture;
    } else {
      scene.background = new THREE.Color(NIGHT_LIGHT.background);
      scene.environment = null;
    }
    scene.fog.color.setHex(cfg.fog);
`,
`    sun.intensity = cfg.sun;
    sun.color.setHex(cfg.sunColor);
    sun.castShadow = daylight;
    fill.intensity = cfg.fill;
    hemi.intensity = cfg.hemi;
    ambient.intensity = cfg.ambient;
    hemi.color.setHex(cfg.hemiSky);
    hemi.groundColor.setHex(cfg.hemiGround);
    renderer.toneMappingExposure = cfg.exposure;
    renderer.shadowMap.enabled = daylight;
    shadowCatcher.visible = daylight;
    nightDim.visible = !daylight;
    nightLightingGroup.visible = !daylight;
    if (daylight) {
      scene.background = daySkyTexture;
      scene.environment = daySkyTexture;
    } else {
      scene.background = nightSkyTexture;
      scene.environment = null;
    }
    scene.fog.color.setHex(cfg.fog);
    scene.fog.near = cfg.fogNear;
    scene.fog.far = cfg.fogFar;
`
);

fs.writeFileSync('app.js', app);
