(() => {
  'use strict';

  const D = window.MAP_DATA;
  const THREE = window.THREE;
  const canvas = document.getElementById('scene');
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loadingText');
  const errorBox = document.getElementById('errorBox');
  const hoverCard = document.getElementById('hoverCard');
  const infoEyebrow = document.getElementById('infoEyebrow');
  const infoTitle = document.getElementById('infoTitle');
  const infoDetail = document.getElementById('infoDetail');

  function fail(message) {
    errorBox.style.display = 'block';
    errorBox.textContent = message;
    loadingText.textContent = '载入失败';
  }

  if (!D || !THREE) {
    fail('地图数据或 Three.js 运行库未加载，请确认 assets 与 data 文件夹完整。');
    return;
  }

  const b = D.meta.bbox;
  const c = D.meta.center;
  const cosLat = Math.cos(c.lat * Math.PI / 180);
  const M_LON = 111320 * cosLat;
  const M_LAT = 110540;
  const W = D.meta.widthMeters;
  const H = D.meta.heightMeters;

  function project(coord) {
    return {
      x: (coord[0] - c.lon) * M_LON,
      z: -(coord[1] - c.lat) * M_LAT
    };
  }

  function toPoint(coord, y = 0) {
    const p = project(coord);
    return new THREE.Vector3(p.x, y, p.z);
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07131f);
  scene.fog = new THREE.Fog(0x07131f, Math.max(W, H) * 1.05, Math.max(W, H) * 3.1);

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.5, 6500);
  const HOME_POS = new THREE.Vector3(W * 0.48, Math.max(W, H) * 0.62, H * 0.66);
  const HOME_TARGET = new THREE.Vector3(0, 26, 22);
  camera.position.copy(HOME_POS).multiplyScalar(1.45);
  camera.lookAt(HOME_TARGET);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.target.copy(HOME_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 90;
  controls.maxDistance = 2400;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minPolarAngle = 0.03;
  controls.screenSpacePanning = false;
  controls.autoRotateSpeed = 0.42;

  const hemi = new THREE.HemisphereLight(0xb8e9ff, 0x1a2730, 1.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d9, 3.8);
  sun.position.set(-W * 0.55, Math.max(W, H) * 1.1, H * 0.72);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -W * 0.78;
  sun.shadow.camera.right = W * 0.78;
  sun.shadow.camera.top = H * 0.78;
  sun.shadow.camera.bottom = -H * 0.78;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = Math.max(W, H) * 3.2;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.85;
  sun.shadow.radius = 4;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);
  scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0x6dd7ff, 0.55);
  fill.position.set(W * 0.8, 340, -H * 0.65);
  scene.add(fill);
  const ambient = new THREE.AmbientLight(0x5c7d95, 0.55);
  scene.add(ambient);


  function createDaySkyTexture() {
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
    sky.addColorStop(0.0, '#0759a8');
    sky.addColorStop(0.30, '#0876cc');
    sky.addColorStop(0.58, '#2a99e8');
    sky.addColorStop(0.78, '#89d0ff');
    sky.addColorStop(1.0, '#dcecf3');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

    const glow = ctx.createRadialGradient(760, 118, 4, 760, 118, 180);
    glow.addColorStop(0.0, 'rgba(255, 252, 232, 0.98)');
    glow.addColorStop(0.16, 'rgba(255, 244, 207, 0.62)');
    glow.addColorStop(0.52, 'rgba(255, 236, 190, 0.15)');
    glow.addColorStop(1.0, 'rgba(255, 236, 190, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

    const texture = new THREE.CanvasTexture(skyCanvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  const daySkyTexture = createDaySkyTexture();

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

  const satelliteGroup = new THREE.Group();
  satelliteGroup.name = 'satellite-imagery';
  scene.add(satelliteGroup);

  const baseUnder = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.24, H * 1.24),
    new THREE.MeshBasicMaterial({ color: 0x061019 })
  );
  baseUnder.rotation.x = -Math.PI / 2;
  baseUnder.position.y = -2.2;
  satelliteGroup.add(baseUnder);

  let textureReady = false;
  let buildReady = false;
  const loader = new THREE.TextureLoader();
  const satelliteTex = loader.load(
    'assets/satellite.jpg',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      textureReady = true;
      tryFinishLoading();
    },
    undefined,
    () => {
      fail('卫星影像未能载入，建筑与道路仍可查看。请确认 assets/satellite.png 存在。');
      textureReady = true;
      tryFinishLoading();
    }
  );
  satelliteTex.colorSpace = THREE.SRGBColorSpace;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: satelliteTex, color: 0xffffff, toneMapped: false })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.8;
  ground.renderOrder = -10;
  satelliteGroup.add(ground);

  // Shadow-only helper for the daytime lighting rig. It never alters the existing
  // satellite, road, building, or label geometry/materials.
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.ShadowMaterial({ color: 0x08131d, opacity: 0.45, transparent: true })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.7;
  shadowCatcher.receiveShadow = true;
  shadowCatcher.renderOrder = 1;
  shadowCatcher.visible = false;
  scene.add(shadowCatcher);

  const nightDim = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.1, H * 1.1),
    new THREE.MeshBasicMaterial({ color: 0x020814, transparent: true, opacity: 0.70, depthWrite: false, side: THREE.DoubleSide })
  );
  nightDim.rotation.x = -Math.PI / 2;
  nightDim.position.y = -0.66;
  nightDim.renderOrder = 1;
  nightDim.visible = false;
  scene.add(nightDim);

  const areaGroup = new THREE.Group();
  areaGroup.name = 'gis-areas';
  scene.add(areaGroup);
  const buildingGroup = new THREE.Group();
  buildingGroup.name = 'gis-buildings';
  scene.add(buildingGroup);
  const roadGroup = new THREE.Group();
  roadGroup.name = 'gis-roads';
  scene.add(roadGroup);
  const labelGroup = new THREE.Group();
  labelGroup.name = 'gis-labels';
  scene.add(labelGroup);
  const boundaryGroup = new THREE.Group();
  boundaryGroup.name = 'park-boundary';
  scene.add(boundaryGroup);

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
      sizeAttenuation: false,
      transparent: true,
      opacity,
      vertexColors: true,
      alphaTest: 0.015,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    points.renderOrder = 5;
    nightLightingGroup.add(points);
    const haloMaterial = material.clone();
    haloMaterial.size = size * 2.6;
    haloMaterial.opacity = opacity * 0.16;
    const halo = new THREE.Points(geometry, haloMaterial);
    halo.renderOrder = 4;
    nightLightingGroup.add(halo);
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
      const light = new THREE.PointLight(warm ? 0xffc46b : 0xd7ecff, warm ? 320 : 260, 150, 2);
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
        const light = new THREE.PointLight(i % 12 === 0 ? 0xd7ecff : 0xffc46b, 70, 68, 2);
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
      const light = new THREE.PointLight(i % 2 === 0 ? 0xffb85c : 0xffd28a, 240, 135, 2);
      light.position.set(p.x, Math.min(32, (building.height || 24) * 0.35), p.z);
      nightLightingGroup.add(light);
    });

  function ringToShape(ring) {
    if (!ring || ring.length < 3) return null;
    const shape = new THREE.Shape();
    ring.forEach((coord, index) => {
      const p = project(coord);
      if (index === 0) shape.moveTo(p.x, -p.z);
      else shape.lineTo(p.x, -p.z);
    });
    shape.closePath();
    return shape;
  }

  function flatPolygon(ring, color, opacity, y = 0.25) {
    const shape = ringToShape(ring);
    if (!shape) return null;
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    return mesh;
  }

  const areaColors = {
    water: [0x24718f, 0.24],
    grass: [0x2f7f52, 0.18],
    forest: [0x205d3f, 0.2],
    park: [0x48a66a, 0.17],
    garden: [0x58b277, 0.16],
    golf_course: [0x2d8351, 0.14],
    recreation_ground: [0x3b9660, 0.15],
    commercial: [0x3a7ea8, 0.035]
  };

  for (const area of D.areas) {
    if (area.kind === 'railway') continue;
    const ring = area.rings && area.rings[0];
    if (!ring || ring.length < 3) continue;
    const key = area.subtype || area.kind;
    let style = areaColors[key];
    if (!style) {
      if (area.kind === 'natural' && key === 'water') style = areaColors.water;
      else if (area.kind === 'leisure') style = areaColors.park;
      else if (area.kind === 'landuse' && /grass|forest|meadow/.test(key)) style = areaColors.grass;
      else style = [0x6c86a0, 0.025];
    }
    const m = flatPolygon(ring, style[0], style[1], 0.18);
    if (m) areaGroup.add(m);
  }

  // A subtle translucent park footprint.
  if (D.parkBoundary && D.parkBoundary.length) {
    const parkFill = flatPolygon(D.parkBoundary, 0x38d9ff, 0.055, 0.34);
    if (parkFill) boundaryGroup.add(parkFill);
  }

  function buildingColor(building) {
    const t = clamp((building.height || 20) / 180, 0, 1);
    const color = new THREE.Color();
    color.setHSL(0.56 - t * 0.035, 0.18 + t * 0.16, 0.43 + t * 0.22);
    return color;
  }

  const buildingMeshes = [];
  const pickables = [];

  for (const building of D.buildings) {
    const shape = ringToShape(building.rings[0]);
    if (!shape) continue;
    const height = Math.max(4, Number(building.height) || 20);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 1,
      steps: 1
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: buildingColor(building),
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0x000000,
      emissiveIntensity: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = 0.15;
    mesh.userData.kind = 'building';
    mesh.userData.feature = building;
    buildingGroup.add(mesh);
    buildingMeshes.push(mesh);
    pickables.push(mesh);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 30),
      new THREE.LineBasicMaterial({ color: 0xd4efff, transparent: true, opacity: 0.17 })
    );
    edges.position.copy(mesh.position);
    edges.userData.buildingMesh = mesh;
    buildingGroup.add(edges);
    mesh.userData.edgeLine = edges;
  }

  const roadWidths = {
    motorway: 18, motorway_link: 10, trunk: 17, trunk_link: 9,
    primary: 14, primary_link: 8, secondary: 11, secondary_link: 7,
    tertiary: 9, tertiary_link: 6, residential: 6.2, living_street: 5.2,
    unclassified: 5.7, service: 4.1, pedestrian: 3.2, footway: 1.6,
    cycleway: 1.8, path: 1.35, steps: 1.4
  };

  function roadClass(kind) {
    if (/motorway|trunk/.test(kind)) return 'arterial';
    if (/primary|secondary|tertiary/.test(kind)) return 'major';
    if (/footway|cycleway|path|steps|pedestrian/.test(kind)) return 'path';
    return 'local';
  }

  function buildRoadGeometry(predicate) {
    const positions = [];
    const indices = [];
    for (const road of D.roads) {
      if (!predicate(road)) continue;
      const ring = road.rings && road.rings[0];
      if (!ring || ring.length < 2) continue;
      const width = roadWidths[road.subtype] || 5;
      const y = 0.7 + clamp(Number(road.layer) || 0, 0, 4) * 2.2;
      let base = positions.length / 3;
      for (let i = 0; i < ring.length - 1; i++) {
        const p1 = project(ring[i]);
        const p2 = project(ring[i + 1]);
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);
        if (len < 0.2) continue;
        const nx = -dz / len * width / 2;
        const nz = dx / len * width / 2;
        positions.push(
          p1.x + nx, y, p1.z + nz,
          p1.x - nx, y, p1.z - nz,
          p2.x - nx, y, p2.z - nz,
          p2.x + nx, y, p2.z + nz
        );
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
        base += 4;
      }
    }
    if (!positions.length) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const roadStyles = {
    arterial: { color: 0x7ebcff, opacity: 0.52 },
    major: { color: 0x62a6dc, opacity: 0.35 },
    local: { color: 0xc0ddf0, opacity: 0.14 },
    path: { color: 0x8fffc8, opacity: 0.12 }
  };

  for (const cls of ['arterial', 'major', 'local', 'path']) {
    const geometry = buildRoadGeometry((road) => roadClass(road.subtype) === cls);
    if (!geometry) continue;
    const style = roadStyles[cls];
    const material = new THREE.MeshBasicMaterial({
      color: style.color,
      transparent: true,
      opacity: style.opacity,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 2;
    roadGroup.add(mesh);
  }

  // Thin center lines on the two most important road classes.
  for (const cls of ['arterial', 'major']) {
    const points = [];
    for (const road of D.roads) {
      if (roadClass(road.subtype) !== cls) continue;
      const ring = road.rings && road.rings[0];
      if (!ring || ring.length < 2) continue;
      for (let i = 0; i < ring.length - 1; i++) {
        const p1 = project(ring[i]);
        const p2 = project(ring[i + 1]);
        points.push(new THREE.Vector3(p1.x, 1.35, p1.z), new THREE.Vector3(p2.x, 1.35, p2.z));
      }
    }
    if (!points.length) continue;
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      color: cls === 'arterial' ? 0xffe3a1 : 0xb8e4ff,
      transparent: true,
      opacity: cls === 'arterial' ? 0.5 : 0.24,
      depthWrite: false
    }));
    roadGroup.add(line);
  }

  function closedBoundaryPoints(ring, y) {
    const points = [];
    for (const coord of ring) points.push(toPoint(coord, y));
    if (points.length) points.push(points[0].clone());
    return points;
  }

  if (D.parkBoundary && D.parkBoundary.length) {
    const p1 = closedBoundaryPoints(D.parkBoundary, 2.2);
    const glow = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(p1),
      new THREE.LineBasicMaterial({ color: 0x21c9ff, transparent: true, opacity: 0.22, depthWrite: false })
    );
    boundaryGroup.add(glow);
    const edge = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(closedBoundaryPoints(D.parkBoundary, 2.6)),
      new THREE.LineBasicMaterial({ color: 0x68ecff, transparent: true, opacity: 0.98, depthWrite: false })
    );
    boundaryGroup.add(edge);

    const dots = D.parkBoundary.map((coord) => toPoint(coord, 3.0));
    const dotGeo = new THREE.BufferGeometry().setFromPoints(dots);
    const dotMat = new THREE.PointsMaterial({ color: 0x9ff8ff, size: 4.2, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false });
    boundaryGroup.add(new THREE.Points(dotGeo, dotMat));
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeLabel(text, subtitle, large = false) {
    const width = large ? 768 : 640;
    const height = large ? 224 : 160;
    const canvas2d = document.createElement('canvas');
    canvas2d.width = width;
    canvas2d.height = height;
    const ctx = canvas2d.getContext('2d');
    const pad = large ? 18 : 14;
    ctx.clearRect(0, 0, width, height);
    roundRect(ctx, pad, pad, width - pad * 2, height - pad * 2, large ? 28 : 22);
    ctx.fillStyle = 'rgba(4, 17, 29, 0.80)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(103, 232, 255, 0.54)';
    ctx.lineWidth = large ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(103, 232, 255, 0.92)';
    ctx.fillRect(pad + 12, height * 0.5 - (large ? 31 : 24), 5, large ? 62 : 48);
    ctx.fillStyle = '#f2fcff';
    ctx.font = `${large ? 700 : 600} ${large ? 58 : 48}px "Microsoft YaHei UI","Microsoft YaHei",sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, pad + 34, subtitle ? height * 0.44 : height * 0.5);
    if (subtitle) {
      ctx.fillStyle = '#82a9bd';
      ctx.font = `500 ${large ? 25 : 21}px "Microsoft YaHei UI","Microsoft YaHei",sans-serif`;
      ctx.fillText(subtitle, pad + 34, height * 0.69);
    }
    const tex = new THREE.CanvasTexture(canvas2d);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      opacity: 0.96
    }));
    const worldHeight = large ? 48 : 23;
    sprite.scale.set(worldHeight * width / height, worldHeight, 1);
    return sprite;
  }

  const parkLabel = makeLabel('天安数码城', 'TIAN’AN CYBER PARK', true);
  parkLabel.position.set(0, 116, 0);
  labelGroup.add(parkLabel);

  const labelCandidates = D.buildings
    .filter((x) => (x.displayName || x.name) && (x.height || 0) >= 45)
    .sort((a, b2) => (b2.height || 0) - (a.height || 0));
  const usedNames = new Set();
  for (const building of labelCandidates) {
    const name = building.displayName || building.name;
    if (!name || usedNames.has(name)) continue;
    usedNames.add(name);
    const p = project(building.rings[0][0]);
    const sprite = makeLabel(name, building.levels ? `${building.levels} 层` : '建筑地标');
    sprite.position.set(p.x, (building.height || 25) + 15, p.z);
    labelGroup.add(sprite);
    if (usedNames.size >= 11) break;
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(2, 2);
  let hovered = null;
  let selected = null;
  let pointerDown = null;

  function typeLabel(feature) {
    const t = feature.subtype || '';
    const labels = {
      commercial: '商业 / 办公', office: '办公', apartments: '住宅', residential: '住宅',
      retail: '商业', hotel: '酒店', yes: '建筑', school: '学校', hospital: '医疗'
    };
    return labels[t] || (t ? t : '建筑');
  }

  function setInfoBuilding(feature) {
    infoEyebrow.textContent = '建筑信息';
    infoTitle.textContent = feature.displayName || feature.name || '未命名建筑';
    const floorText = feature.levels ? `${feature.levels} 层` : '暂无层数';
    const heightText = feature.height ? `${Math.round(feature.height)} m` : '暂无高度';
    infoDetail.innerHTML = `<strong>类型</strong> ${escapeHtml(typeLabel(feature))}<br><strong>规模</strong> ${floorText} · 估算高度 ${heightText}`;
  }

  function highlightBuilding(mesh, hover) {
    if (!mesh) return;
    if (hover) {
      mesh.material.emissive.setHex(0x1a5d76);
      mesh.material.emissiveIntensity = 0.9;
      if (mesh.userData.edgeLine) mesh.userData.edgeLine.material.color.setHex(0x7df4ff);
    } else if (mesh !== selected) {
      mesh.material.emissive.setHex(0x000000);
      if (mesh.userData.edgeLine) mesh.userData.edgeLine.material.color.setHex(0xd4efff);
    }
  }

  function selectBuilding(mesh) {
    if (selected && selected !== mesh) {
      selected.material.emissive.setHex(0x000000);
      if (selected.userData.edgeLine) selected.userData.edgeLine.material.color.setHex(0xd4efff);
    }
    selected = mesh;
    if (selected) {
      selected.material.emissive.setHex(0x123d50);
      selected.material.emissiveIntensity = 0.8;
      if (selected.userData.edgeLine) selected.userData.edgeLine.material.color.setHex(0x8fffc8);
      setInfoBuilding(selected.userData.feature);
    }
  }

  function updateRaycast(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    const mesh = hit ? hit.object : null;
    if (mesh !== hovered) {
      highlightBuilding(hovered, false);
      hovered = mesh;
      highlightBuilding(hovered, true);
      canvas.style.cursor = hovered ? 'pointer' : 'grab';
    }
    if (hovered) {
      const f = hovered.userData.feature;
      const label = f.displayName || f.name || '未命名建筑';
      hoverCard.querySelector('b').textContent = label;
      hoverCard.querySelector('span').textContent = `${typeLabel(f)} · ${f.levels ? f.levels + ' 层' : '层数未知'} · ${Math.round(f.height || 0)} m`;
      hoverCard.style.left = `${event.clientX}px`;
      hoverCard.style.top = `${event.clientY}px`;
      hoverCard.classList.add('visible');
    } else {
      hoverCard.classList.remove('visible');
    }
  }

  canvas.addEventListener('pointermove', updateRaycast);
  canvas.addEventListener('pointerleave', () => {
    highlightBuilding(hovered, false);
    hovered = null;
    hoverCard.classList.remove('visible');
    canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('pointerdown', (event) => { pointerDown = { x: event.clientX, y: event.clientY }; });
  canvas.addEventListener('pointerup', (event) => {
    if (!pointerDown) return;
    const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
    pointerDown = null;
    if (moved < 5 && hovered) selectBuilding(hovered);
  });

  let cameraAnim = null;
  function moveCamera(position, target, duration = 1050) {
    cameraAnim = {
      start: performance.now(),
      duration,
      fromPos: camera.position.clone(),
      toPos: position.clone(),
      fromTarget: controls.target.clone(),
      toTarget: target.clone()
    };
  }

  function perspectiveView() {
    const distance = Math.max(W, H);
    moveCamera(new THREE.Vector3(distance * 0.47, distance * 0.57, distance * 0.67), new THREE.Vector3(0, 24, 18));
    setActive('btnPerspective', true); setActive('btnTop', false);
  }
  function topView() {
    moveCamera(new THREE.Vector3(0, Math.max(W, H) * 1.45, 0.01), new THREE.Vector3(0, 0, 0));
    setActive('btnPerspective', false); setActive('btnTop', true);
  }
  function resetView() {
    controls.autoRotate = false; setActive('btnRotate', false);
    moveCamera(HOME_POS, HOME_TARGET);
    setActive('btnPerspective', true); setActive('btnTop', false);
  }

  function setActive(id, active) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', active);
  }

  const DAY_LIGHT = {
    sun: 2.15, fill: 0.55, hemi: 1.45, ambient: 0.55,
    exposure: 1.08, sunColor: 0xfff0d0, fog: 0x07131f,
    hemiSky: 0xb8e9ff, hemiGround: 0x1a2730
  };
  const NIGHT_LIGHT = {
    sun: 0.28, fill: 0.0, hemi: 0.08, ambient: 0.03,
    exposure: 0.72, sunColor: 0x8fb7e8, fog: 0x071525,
    fogNear: Math.max(W, H) * 0.62, fogFar: Math.max(W, H) * 2.7,
    hemiSky: 0x1b3551, hemiGround: 0x02050a
  };

  function setLighting(mode) {
    const daylight = mode === 'day';
    const cfg = daylight ? DAY_LIGHT : NIGHT_LIGHT;
    sun.intensity = cfg.sun;
    sun.color.setHex(cfg.sunColor);
    sun.castShadow = false;
    fill.intensity = cfg.fill;
    hemi.intensity = cfg.hemi;
    ambient.intensity = cfg.ambient;
    hemi.color.setHex(cfg.hemiSky);
    hemi.groundColor.setHex(cfg.hemiGround);
    renderer.toneMappingExposure = cfg.exposure;
    renderer.shadowMap.enabled = false;
    shadowCatcher.visible = false;
    nightDim.visible = !daylight;
    nightLightingGroup.visible = !daylight;
    if (daylight) {
      scene.background = new THREE.Color(cfg.fog);
      scene.environment = null;
    } else {
      scene.background = nightSkyTexture;
      scene.environment = null;
    }
    scene.fog.color.setHex(cfg.fog);
    if (!daylight) {
      scene.fog.near = NIGHT_LIGHT.fogNear;
      scene.fog.far = NIGHT_LIGHT.fogFar;
    }
    setActive('btnDay', daylight);
    setActive('btnNight', !daylight);
  }

  document.getElementById('btnDay').addEventListener('click', () => setLighting('day'));
  document.getElementById('btnNight').addEventListener('click', () => setLighting('night'));

  document.getElementById('btnPerspective').addEventListener('click', perspectiveView);
  document.getElementById('btnTop').addEventListener('click', topView);
  document.getElementById('btnReset').addEventListener('click', resetView);
  document.getElementById('btnRotate').addEventListener('click', (e) => {
    controls.autoRotate = !controls.autoRotate;
    e.currentTarget.classList.toggle('active', controls.autoRotate);
  });
  document.getElementById('btnBuildings').addEventListener('click', (e) => {
    buildingGroup.visible = !buildingGroup.visible;
    e.currentTarget.classList.toggle('active', buildingGroup.visible);
  });
  document.getElementById('btnRoads').addEventListener('click', (e) => {
    roadGroup.visible = !roadGroup.visible;
    e.currentTarget.classList.toggle('active', roadGroup.visible);
  });
  document.getElementById('btnLabels').addEventListener('click', (e) => {
    labelGroup.visible = !labelGroup.visible;
    e.currentTarget.classList.toggle('active', labelGroup.visible);
  });
  document.getElementById('btnSatellite').addEventListener('click', (e) => {
    satelliteGroup.visible = !satelliteGroup.visible;
    e.currentTarget.classList.toggle('active', satelliteGroup.visible);
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', onResize);

  function tryFinishLoading() {
    if (textureReady && buildReady) {
      loadingText.textContent = '就绪';
      setTimeout(() => loading.classList.add('hidden'), 280);
    }
  }

  const clock = new THREE.Clock();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.06);

    if (cameraAnim) {
      const t = clamp((now - cameraAnim.start) / cameraAnim.duration, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(cameraAnim.fromPos, cameraAnim.toPos, e);
      controls.target.lerpVectors(cameraAnim.fromTarget, cameraAnim.toTarget, e);
      if (t >= 1) cameraAnim = null;
    }

    controls.update();
    renderer.render(scene, camera);
  }

  const currentDate = document.getElementById('currentDate');
  const currentClock = document.getElementById('currentClock');
  const weatherIcon = document.getElementById('weatherIcon');
  const weatherText = document.getElementById('weatherText');
  const hkoLabel = document.getElementById('hkoLabel');
  const envStatus = document.querySelector('.env-status');

  const HKO_FALLBACK = {
    temperature: 21,
    humidity: 70,
    summary: '多云，有一两阵微雨',
    updateTime: '2026-11-19T16:02:00+08:00',
    cached: true
  };

  const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
  });
  const clockFormatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });

  function updateSystemClock() {
    const now = new Date();
    currentDate.textContent = dateFormatter.format(now).replace(/(周[一二三四五六日])/, (match) => ' ' + match);
    currentClock.textContent = clockFormatter.format(now);
  }

  function weatherSymbol(summary) {
    if (/雷/.test(summary)) return '⛈️';
    if (/雨/.test(summary)) return '🌧️';
    if (/晴/.test(summary)) return '☀️';
    if (/云|阴/.test(summary)) return '⛅';
    return '🌤️';
  }

  function paintHKOWeather(data, cached = false) {
    const temp = Number.isFinite(Number(data.temperature)) ? Math.round(Number(data.temperature)) : '--';
    const humidity = Number.isFinite(Number(data.humidity)) ? Math.round(Number(data.humidity)) : '--';
    const summary = data.summary || '天气预告暂不可用';
    weatherIcon.textContent = weatherSymbol(summary);
    weatherText.innerHTML = `<strong>${temp}°C</strong> · 湿度 ${humidity}% · ${escapeHtml(summary)}`;
    const updated = data.updateTime ? new Date(data.updateTime) : new Date();
    weatherText.title = `香港天文台｜更新于 ${updated.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`;
    hkoLabel.textContent = cached ? '香港天文台 · 缓存天气' : '香港天文台 · 今日天气';
    envStatus.dataset.weatherSource = cached ? 'hko-cache' : 'hko-live';
  }

  async function loadHKOWeather() {
    const base = 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php';
    try {
      const [rhrResponse, forecastResponse] = await Promise.all([
        fetch(base + '?dataType=rhrread&lang=sc', { cache: 'no-store' }),
        fetch(base + '?dataType=flw&lang=sc', { cache: 'no-store' })
      ]);
      if (!rhrResponse.ok || !forecastResponse.ok) throw new Error('HKO request failed');
      const [rhr, forecast] = await Promise.all([rhrResponse.json(), forecastResponse.json()]);
      const tempRows = rhr.temperature?.data || [];
      const tempRow = tempRows.find((row) => row.place === '香港天文台') || tempRows[0] || {};
      const humidityRows = rhr.humidity?.data || [];
      const humidityRow = humidityRows.find((row) => row.place === '香港天文台') || humidityRows[0] || {};
      const summary = String(forecast.forecastDesc || forecast.generalSituation || '').split(/[。！？]/)[0];
      paintHKOWeather({
        temperature: tempRow.value,
        humidity: humidityRow.value,
        summary: summary || '天气预告暂不可用',
        updateTime: rhr.updateTime || forecast.updateTime
      }, false);
    } catch (error) {
      paintHKOWeather(HKO_FALLBACK, true);
    }
  }

  updateSystemClock();
  setInterval(updateSystemClock, 1000);
  paintHKOWeather(HKO_FALLBACK, true);
  loadHKOWeather();
  setInterval(loadHKOWeather, 10 * 60 * 1000);

document.getElementById('metricBuildings').textContent = D.meta.buildingCount;
  document.getElementById('metricRoads').textContent = '18';
  document.getElementById('metricArea').textContent = '2';
  const metricAreaCard = document.getElementById('metricAreaCard');
  const metricAreaElement = document.getElementById('metricArea');
  const syncTimeoutAlert = () => {
    const value = Number(metricAreaElement.textContent);
    metricAreaCard.classList.toggle('metric-alert', Number.isFinite(value) && value > 0);
  };
  new MutationObserver(syncTimeoutAlert).observe(metricAreaElement, { childList: true, characterData: true, subtree: true });
  syncTimeoutAlert();
  document.getElementById('infoTitle').textContent = D.meta.location;
  const overviewEyebrow = infoEyebrow.textContent;
  const overviewTitle = infoTitle.textContent;
  const overviewDetail = `拖拽旋转 · 滚轮缩放 · 右键平移<br>场景含 <strong>${D.meta.buildingCount}</strong> 个建筑体块、<strong>${D.meta.roadCount}</strong> 条道路；卫星实景覆盖约 <strong>${(W * H / 1000000).toFixed(2)} km²</strong>。`;
  infoDetail.innerHTML = overviewDetail;

  const metricCards = Array.from(document.querySelectorAll('.metric[data-metric]'));
  let selectedMetricCard = null;

  function restoreOverview() {
    infoEyebrow.textContent = overviewEyebrow;
    infoTitle.textContent = overviewTitle;
    infoDetail.innerHTML = overviewDetail;
  }

  function activateMetricCard(card) {
    const isSame = selectedMetricCard === card;
    metricCards.forEach((item) => {
      item.classList.remove('metric-selected');
      item.setAttribute('aria-pressed', 'false');
    });
    if (isSame) {
      selectedMetricCard = null;
      restoreOverview();
    } else {
      selectedMetricCard = card;
      card.classList.add('metric-selected');
      card.setAttribute('aria-pressed', 'true');
      const value = card.querySelector('b')?.textContent?.trim() || '';
      const label = card.querySelector('span')?.textContent?.trim() || '';
      infoEyebrow.textContent = '指标详情';
      infoTitle.textContent = label;
      infoDetail.innerHTML = `当前数值 <strong>${escapeHtml(value)}</strong><br>点击同一卡片可取消选中并返回园区总览。`;
    }
    card.classList.remove('metric-clicked');
    void card.offsetWidth;
    card.classList.add('metric-clicked');
    setTimeout(() => card.classList.remove('metric-clicked'), 280);
    const value = card.querySelector('b')?.textContent?.trim() || '';
    const label = card.querySelector('span')?.textContent?.trim() || '';
    window.dispatchEvent(new CustomEvent('metriccardclick', { detail: { metric: card.dataset.metric, label, value } }));
  }

  function clearMetricSelection(card) {
    if (selectedMetricCard !== card) return;
    selectedMetricCard = null;
    card.classList.remove('metric-selected');
    card.setAttribute('aria-pressed', 'false');
    restoreOverview();
  }

  metricCards.forEach((card) => {
    card.addEventListener('click', () => activateMetricCard(card));
    card.addEventListener('mouseleave', () => clearMetricSelection(card));
    card.addEventListener('blur', () => clearMetricSelection(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateMetricCard(card);
      }
    });
  });

  const themeButton = document.getElementById('btnTheme');
  const themeLabel = document.getElementById('themeLabel');
  function setUiTheme(theme, persist = true) {
    const light = theme === 'light';
    document.body.classList.toggle('light-ui', light);
    themeButton.classList.toggle('active', light);
    themeButton.setAttribute('aria-pressed', String(light));
    themeLabel.textContent = light ? '深色' : '亮色';
    if (persist) {
      try { localStorage.setItem('tianan-ui-theme', light ? 'light' : 'dark'); } catch (error) {}
    }
  }
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('tianan-ui-theme') || 'dark'; } catch (error) {}
  setUiTheme(savedTheme, false);
  themeButton.addEventListener('click', () => {
    setUiTheme(document.body.classList.contains('light-ui') ? 'dark' : 'light');
  });

  setLighting('day');

  buildReady = true;
  tryFinishLoading();
  setTimeout(() => { if (!textureReady) { textureReady = true; tryFinishLoading(); } }, 7000);

  requestAnimationFrame((now) => {
    animate(now);
    setTimeout(() => {
      moveCamera(HOME_POS, HOME_TARGET, 1650);
    }, 180);
  });
})();







