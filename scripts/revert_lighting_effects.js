const fs=require('fs'); let app=fs.readFileSync('app.js','utf8');
const old=`  const DAY_LIGHT = {
    sun: 3.8, fill: 0.18, hemi: 0.85, ambient: 0.22,
    exposure: 1.05, sunColor: 0xfff2d9, fog: 0xbfd7e5,
    fogNear: Math.max(W, H) * 1.05, fogFar: Math.max(W, H) * 3.1,
    hemiSky: 0xd8f1ff, hemiGround: 0x6b5948
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
    setActive('btnDay', daylight);
    setActive('btnNight', !daylight);
  }
`;
const neu=`  const DAY_LIGHT = {
    sun: 2.15, fill: 0.55, hemi: 1.45, ambient: 0.55,
    exposure: 1.08, sunColor: 0xfff0d0, fog: 0x07131f,
    hemiSky: 0xb8e9ff, hemiGround: 0x1a2730
  };
  const NIGHT_LIGHT = {
    sun: 0.0, fill: 0.0, hemi: 0.13, ambient: 0.045,
    exposure: 0.68, sunColor: 0x9fb8cc, fog: 0x010409,
    hemiSky: 0x213247, hemiGround: 0x03070b
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
    nightDim.visible = false;
    nightLightingGroup.visible = false;
    scene.background = new THREE.Color(cfg.fog);
    scene.environment = null;
    scene.fog.color.setHex(cfg.fog);
    setActive('btnDay', daylight);
    setActive('btnNight', !daylight);
  }
`;
if(!app.includes(old)) throw new Error('lighting block not found');
app=app.replace(old,neu); fs.writeFileSync('app.js',app);
