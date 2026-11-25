const fs=require('fs'); let app=fs.readFileSync('app.js','utf8');
app=app.replace(/sizeAttenuation:\s*true,\s*\n\s*transparent:\s*true,\s*\n\s*opacity,\s*\n\s*vertexColors:\s*true,\s*\n\s*alphaTest:\s*0\.015,\s*\n\s*depthWrite:\s*false,\s*\n\s*blending:\s*THREE\.AdditiveBlending/, `sizeAttenuation: false,
      transparent: true,
      opacity,
      vertexColors: true,
      alphaTest: 0.015,
      depthWrite: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending`);
app=app.replace(/points\.renderOrder = 5;\s*\n\s*nightLightingGroup\.add\(points\);\s*\n\s*return points;/, `points.renderOrder = 5;
    nightLightingGroup.add(points);
    const haloMaterial = material.clone();
    haloMaterial.size = size * 2.6;
    haloMaterial.opacity = opacity * 0.16;
    const halo = new THREE.Points(geometry, haloMaterial);
    halo.renderOrder = 4;
    nightLightingGroup.add(halo);
    return points;`);
fs.writeFileSync('app.js',app);
