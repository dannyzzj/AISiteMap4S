const fs = require('fs');
let app = fs.readFileSync('app.js', 'utf8');

app = app.replace(
  "  renderer.toneMappingExposure = 1.08;\n",
  "  renderer.toneMappingExposure = 1.08;\n  renderer.shadowMap.enabled = false;\n  renderer.shadowMap.type = THREE.PCFSoftShadowMap;\n"
);

app = app.replace(
  "  const sun = new THREE.DirectionalLight(0xfff0d0, 2.15);\n  sun.position.set(-W * 0.55, Math.max(W, H) * 1.1, H * 0.72);\n  scene.add(sun);\n",
  `  const sun = new THREE.DirectionalLight(0xfff2d9, 3.8);
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
`
);

const skyInsert = `
  function createDaySkyTexture() {
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');
    const sky = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
    sky.addColorStop(0.0, '#1478d0');
    sky.addColorStop(0.34, '#43a4ea');
    sky.addColorStop(0.66, '#a9dcff');
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
`;
app = app.replace("  const satelliteGroup = new THREE.Group();", skyInsert + "\n  const satelliteGroup = new THREE.Group();");

app = app.replace(
  "  satelliteGroup.add(ground);\n",
  `  satelliteGroup.add(ground);

  // Shadow-only helper for the daytime lighting rig. It never alters the existing
  // satellite, road, building, or label geometry/materials.
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.ShadowMaterial({ color: 0x08131d, opacity: 0.34, transparent: true })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -0.7;
  shadowCatcher.receiveShadow = true;
  shadowCatcher.renderOrder = 1;
  shadowCatcher.visible = false;
  scene.add(shadowCatcher);
`
);

app = app.replace(
  "    mesh.castShadow = false;\n    mesh.receiveShadow = false;\n",
  "    mesh.castShadow = true;\n    mesh.receiveShadow = true;\n"
);

app = app.replace(
  `  const DAY_LIGHT = {
    sun: 2.15, fill: 0.55, hemi: 1.45, ambient: 0.55,
    exposure: 1.08, background: 0x07131f, fog: 0x07131f,
    hemiSky: 0xb8e9ff, hemiGround: 0x1a2730
  };
  const NIGHT_LIGHT = {
    sun: 0.0, fill: 0.0, hemi: 0.13, ambient: 0.045,
    exposure: 0.68, background: 0x010409, fog: 0x010409,
    hemiSky: 0x213247, hemiGround: 0x03070b
  };

  function setLighting(mode) {
    const daylight = mode === 'day';
    const cfg = daylight ? DAY_LIGHT : NIGHT_LIGHT;
    sun.intensity = cfg.sun;
    fill.intensity = cfg.fill;
    hemi.intensity = cfg.hemi;
    ambient.intensity = cfg.ambient;
    hemi.color.setHex(cfg.hemiSky);
    hemi.groundColor.setHex(cfg.hemiGround);
    renderer.toneMappingExposure = cfg.exposure;
    scene.background.setHex(cfg.background);
    scene.fog.color.setHex(cfg.fog);
    baseUnder.material.color.setHex(daylight ? 0x061019 : 0x010307);
    setActive('btnDay', daylight);
    setActive('btnNight', !daylight);
  }
`,
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

  function setLighting(mode) {
    const daylight = mode === 'day';
    const cfg = daylight ? DAY_LIGHT : NIGHT_LIGHT;
    sun.intensity = cfg.sun;
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
    setActive('btnDay', daylight);
    setActive('btnNight', !daylight);
  }
`
);

app = app.replace(
  "  buildReady = true;\n  tryFinishLoading();",
  "  setLighting('day');\n\n  buildReady = true;\n  tryFinishLoading();"
);

fs.writeFileSync('app.js', app);
