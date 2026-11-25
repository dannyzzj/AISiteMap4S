const fs=require('fs'); let app=fs.readFileSync('app.js','utf8');
app=app.replace(
`  const NIGHT_LIGHT = {
    sun: 0.0, fill: 0.0, hemi: 0.13, ambient: 0.045,
    exposure: 0.68, sunColor: 0x9fb8cc, fog: 0x010409,
    hemiSky: 0x213247, hemiGround: 0x03070b
  };`,
`  const NIGHT_LIGHT = {
    sun: 0.28, fill: 0.0, hemi: 0.08, ambient: 0.03,
    exposure: 0.72, sunColor: 0x8fb7e8, fog: 0x071525,
    fogNear: Math.max(W, H) * 0.62, fogFar: Math.max(W, H) * 2.7,
    hemiSky: 0x1b3551, hemiGround: 0x02050a
  };`
);
app=app.replace(
`    sun.castShadow = false;
    fill.intensity = cfg.fill;
    hemi.intensity = cfg.hemi;
    ambient.intensity = cfg.ambient;
    hemi.color.setHex(cfg.hemiSky);
    hemi.groundColor.setHex(cfg.hemiGround);
    renderer.toneMappingExposure = cfg.exposure;
    renderer.shadowMap.enabled = false;
    shadowCatcher.visible = false;
    nightDim.visible = false;
    nightLightingGroup.visible = false;
    scene.background = new THREE.Color(cfg.fog);
    scene.environment = null;
    scene.fog.color.setHex(cfg.fog);
`,
`    sun.castShadow = false;
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
`
);
fs.writeFileSync('app.js',app);
