/* ==========================================================================
   VICE CITY 3D — SKY, GOLDEN-HOUR REFLECTION ENV, OCEAN & PBR TEXTURES (v4)
   - Mathematically guaranteed non-black radiant sun (zero acos() NaN bugs)
   - Vivid Golden-Hour Miami PMREM environment for crisp car/glass/road reflections
   - World-scale architectural PBR textures (Art Deco, glass skyscrapers, asphalt)
   ========================================================================== */
import * as THREE from 'https://esm.sh/three@0.187.0';

export const SUN_DIR = new THREE.Vector3(0.72, 0.24, -0.65).normalize();

export function createGoldenHourEnvironment(renderer) {
  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(60, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uSunDir: { value: SUN_DIR }
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec3 uSunDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 zenith  = vec3(0.08, 0.24, 0.56);
        vec3 midSky  = vec3(0.28, 0.44, 0.72);
        vec3 horizon = vec3(1.00, 0.58, 0.34);
        vec3 ocean   = vec3(0.06, 0.24, 0.34);
        vec3 ground  = vec3(0.14, 0.11, 0.18);

        vec3 col;
        if (h >= 0.0) {
          col = mix(horizon, midSky, smoothstep(0.0, 0.28, h));
          col = mix(col, zenith, smoothstep(0.24, 0.85, h));
        } else {
          vec3 lowBase = mix(ground, ocean, smoothstep(-0.1, 0.35, d.x));
          col = mix(horizon * 0.58, lowBase, smoothstep(0.0, -0.35, h));
        }

        // Bright sun reflection specular for clearcoat paint & building glass
        float sd = max(dot(d, uSunDir), 0.0);
        col += vec3(1.0, 0.86, 0.58) * pow(sd, 10.0) * 0.95;
        col += vec3(1.0, 0.96, 0.82) * smoothstep(0.992, 0.998, sd) * 2.2;

        // Subtle urban neon & sunset reflection bands on sides
        float westBand = smoothstep(0.2, 0.9, -d.x) * (1.0 - smoothstep(0.0, 0.35, abs(h)));
        col += vec3(0.45, 0.16, 0.32) * westBand * 0.55;
        float eastBand = smoothstep(0.2, 0.9, d.x) * (1.0 - smoothstep(0.0, 0.35, abs(h)));
        col += vec3(0.14, 0.46, 0.50) * eastBand * 0.45;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  // Add subtle architectural city silhouette cards inside PMREM so car & glass reflect skyline contrast
  const cardMat = new THREE.MeshBasicMaterial({ color: 0x201830 });
  const glowCardMat = new THREE.MeshBasicMaterial({ color: 0xffb878 });
  for (let i = 0; i < 14; i++) {
    const ang = (i / 14) * Math.PI * 2;
    const h = 4 + (i % 4) * 3.5;
    const m = new THREE.Mesh(new THREE.BoxGeometry(5, h, 1), i % 3 === 0 ? glowCardMat : cardMat);
    m.position.set(Math.cos(ang) * 38, h * 0.3 - 3, Math.sin(ang) * 38);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.02);
  skyGeo.dispose();
  skyMat.dispose();
  cardMat.dispose();
  glowCardMat.dispose();
  pmrem.dispose();
  return rt.texture;
}

export function createViceSkyDome() {
  const geo = new THREE.SphereGeometry(950, 48, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: SUN_DIR }
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform float uTime;
      uniform vec3 uSunDir;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.02;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vDir);
        float h = clamp(dir.y, 0.0, 1.0);

        // Rich Miami Golden-Hour Sunset Sky (Deep Cerulean -> Warm Lavender -> Coral Gold Horizon)
        vec3 colHorizon = vec3(0.98, 0.54, 0.36);
        vec3 colLower   = vec3(0.76, 0.40, 0.50);
        vec3 colMid     = vec3(0.24, 0.42, 0.72);
        vec3 colZenith  = vec3(0.08, 0.19, 0.46);

        vec3 sky = mix(colHorizon, colLower, smoothstep(0.0, 0.16, h));
        sky = mix(sky, colMid, smoothstep(0.12, 0.44, h));
        sky = mix(sky, colZenith, smoothstep(0.38, 0.90, h));

        // Safe dot-product atmospheric Mie scattering & radiant non-black Sun disc (ZERO acos!)
        float sunDot = clamp(dot(dir, uSunDir), 0.0, 1.0);
        sky += vec3(1.00, 0.64, 0.32) * pow(sunDot, 5.0) * 0.42;
        sky += vec3(1.00, 0.78, 0.46) * pow(sunDot, 28.0) * 0.55;
        sky += vec3(1.00, 0.92, 0.72) * pow(sunDot, 160.0) * 0.65;

        // Crisp luminous golden-white sun disc
        float sunDisc = smoothstep(0.9962, 0.9984, sunDot) * smoothstep(-0.02, 0.03, dir.y);
        vec3 sunColor = mix(vec3(1.00, 0.84, 0.46), vec3(1.00, 0.98, 0.88), smoothstep(0.9970, 0.9992, sunDot));
        sky = mix(sky, sunColor * 1.38, sunDisc);

        // Volumetric sunlit coastal clouds
        if (h > 0.035) {
          vec2 cUv = dir.xz / (h + 0.24) * 1.25 + vec2(uTime * 0.006, -uTime * 0.003);
          float cl = fbm(cUv * 1.45);
          float cl2 = fbm(cUv * 2.8 + vec2(3.1, 1.7));
          float density = smoothstep(0.47, 0.78, cl * 0.72 + cl2 * 0.28);
          float mask = density * smoothstep(0.035, 0.16, h) * (1.0 - smoothstep(0.55, 0.92, h));
          vec3 cloudShadow = vec3(0.32, 0.28, 0.48);
          vec3 cloudRim    = vec3(1.00, 0.76, 0.54);
          vec3 cloudLit    = mix(cloudShadow, cloudRim, clamp(pow(sunDot, 1.6) * 0.85 + 0.25, 0.0, 1.0));
          sky = mix(sky, cloudLit, mask * 0.64);
        }

        // Horizon mist blend below y = 0
        float below = smoothstep(-0.06, 0.02, dir.y);
        sky = mix(vec3(0.28, 0.24, 0.36), sky, below);

        gl_FragColor = vec4(sky, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

export function createAtlanticOcean() {
  const geo = new THREE.PlaneGeometry(1100, 1600, 100, 140);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: SUN_DIR },
      uFogColor: { value: new THREE.Color(0x6e546d) },
      uFogDensity: { value: 0.0018 }
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float w1 = sin(wp.x * 0.15 + uTime * 1.3) * 0.18;
        float w2 = cos(wp.z * 0.12 - uTime * 1.0) * 0.14;
        float w3 = sin((wp.x + wp.z) * 0.08 + uTime * 0.8) * 0.10;
        wp.y += (w1 + w2 + w3) * smoothstep(26.0, 48.0, wp.x);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec3 vWorldPos;

      void main() {
        float nx = cos(vWorldPos.x * 0.38 + uTime * 1.7) * 0.12
                 + cos(vWorldPos.x * 1.15 - vWorldPos.z * 0.35 + uTime * 2.4) * 0.07;
        float nz = sin(vWorldPos.z * 0.32 - uTime * 1.4) * 0.12
                 + sin(vWorldPos.z * 0.92 + vWorldPos.x * 0.38 + uTime * 1.9) * 0.07;
        vec3 N = normalize(vec3(nx, 1.0, nz));
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 R = reflect(-V, N);

        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.4);
        vec3 deepWater   = vec3(0.04, 0.20, 0.34);
        vec3 shallowTurq = vec3(0.08, 0.56, 0.62);
        vec3 skyReflect  = mix(vec3(0.95, 0.56, 0.38), vec3(0.24, 0.44, 0.72), clamp(R.y * 2.2, 0.0, 1.0));

        float beachDist  = max(0.0, vWorldPos.x - 28.0);
        float islandDist = max(0.0, length(vWorldPos.xz - vec2(152.0, -300.0)) - 35.0);
        float shoreMask  = max(1.0 - smoothstep(0.0, 30.0, beachDist), 1.0 - smoothstep(0.0, 28.0, islandDist));
        vec3 col = mix(deepWater, shallowTurq, shoreMask * 0.78);
        col = mix(col, skyReflect, clamp(fresnel * 0.68 + 0.12, 0.0, 0.82));

        // Sparkling golden sun reflection trail across the water
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 110.0);
        float broadSpec = pow(max(dot(N, H), 0.0), 16.0);
        col += vec3(1.00, 0.90, 0.62) * spec * 1.55;
        col += vec3(1.00, 0.62, 0.38) * broadSpec * 0.32;

        // Animated shoreline surf foam
        float waveOff = sin(vWorldPos.z * 0.16 + uTime * 1.5) * 1.5;
        float foam = max(
          smoothstep(34.5 + waveOff, 29.0 + waveOff, vWorldPos.x),
          smoothstep(41.5 + waveOff, 35.0 + waveOff, length(vWorldPos.xz - vec2(152.0, -300.0)))
        );
        float crest = smoothstep(0.05, 0.48, sin(vWorldPos.x * 1.3 - uTime * 2.3 + waveOff));
        col = mix(col, vec3(0.95, 0.94, 0.96), clamp(foam * (0.48 + 0.42 * crest), 0.0, 0.85));

        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(490, -0.75, -295);
  return mesh;
}

/* ==========================================================================
   HIGH-RESOLUTION PROCEDURAL PBR TEXTURES
   ========================================================================== */
export function makeAsphaltTextures(maxAniso, repeatY = 8) {
  const size = 1024;
  const colC = document.createElement('canvas');
  colC.width = colC.height = size;
  const ctx = colC.getContext('2d');

  // Realistic sunlit dark charcoal tarmac (NOT purple!)
  ctx.fillStyle = '#2b2d34';
  ctx.fillRect(0, 0, size, size);

  // Fine mineral stone aggregate
  for (let i = 0; i < 36000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 32 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Subtle asphalt patch repairs & tire wear tracks
  for (const cx of [0.26, 0.74]) {
    const g = ctx.createLinearGradient(size * (cx - 0.14), 0, size * (cx + 0.14), 0);
    g.addColorStop(0, 'rgba(14,15,19,0)');
    g.addColorStop(0.5, 'rgba(14,15,19,0.36)');
    g.addColorStop(1, 'rgba(14,15,19,0)');
    ctx.fillStyle = g;
    ctx.fillRect(size * (cx - 0.14), 0, size * 0.28, size);
  }

  // Concrete storm gutter edging
  ctx.fillStyle = '#4e5058';
  ctx.fillRect(0, 0, size * 0.032, size);
  ctx.fillRect(size * 0.968, 0, size * 0.032, size);

  // Manhole covers & subtle road seams
  ctx.fillStyle = 'rgba(18, 20, 24, 0.55)';
  for (let y = 128; y < size; y += 256) ctx.fillRect(size * 0.032, y, size * 0.936, 3);
  ctx.fillStyle = '#3c3f48';
  ctx.beginPath(); ctx.arc(size * 0.13, size * 0.34, 18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1b1d22'; ctx.lineWidth = 3; ctx.stroke();

  // Double warm yellow center divider
  ctx.fillStyle = '#E5B23E';
  ctx.fillRect(size * 0.484, 0, size * 0.011, size);
  ctx.fillRect(size * 0.505, 0, size * 0.011, size);

  // Solid white curb lines + crisp dashed lane dividers
  ctx.fillStyle = 'rgba(236, 238, 242, 0.85)';
  ctx.fillRect(size * 0.044, 0, size * 0.011, size);
  ctx.fillRect(size * 0.945, 0, size * 0.011, size);
  ctx.fillStyle = 'rgba(236, 238, 242, 0.72)';
  for (let y = 26; y < size; y += 170) {
    ctx.fillRect(size * 0.265, y, size * 0.009, 82);
    ctx.fillRect(size * 0.726, y, size * 0.009, 82);
  }

  // Realistic satin-asphalt roughness map (longitudinal tire polish + micro grain — ZERO blotchy white spots!)
  const roughC = document.createElement('canvas');
  roughC.width = roughC.height = 512;
  const rctx = roughC.getContext('2d');
  rctx.fillStyle = '#d4d4d4';
  rctx.fillRect(0, 0, 512, 512);
  // Subtle smoother tire tracks along driving lanes
  for (const cx of [0.20, 0.33, 0.67, 0.80]) {
    const g = rctx.createLinearGradient(512 * (cx - 0.06), 0, 512 * (cx + 0.06), 0);
    g.addColorStop(0, 'rgba(212,212,212,0)');
    g.addColorStop(0.5, 'rgba(138,138,138,0.65)');
    g.addColorStop(1, 'rgba(212,212,212,0)');
    rctx.fillStyle = g;
    rctx.fillRect(512 * (cx - 0.06), 0, 512 * 0.12, 512);
  }
  for (let i = 0; i < 6500; i++) {
    const v = 165 + Math.floor(Math.random() * 65);
    rctx.fillStyle = `rgb(${v},${v},${v})`;
    rctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }

  const bumpC = document.createElement('canvas');
  bumpC.width = bumpC.height = 512;
  const bctx = bumpC.getContext('2d');
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 18000; i++) {
    const v = 86 + Math.floor(Math.random() * 82);
    bctx.fillStyle = `rgb(${v},${v},${v})`;
    bctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  const map = new THREE.CanvasTexture(colC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, repeatY);
  map.anisotropy = maxAniso;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(1, Math.max(1, Math.round(repeatY * 0.8)));
  roughnessMap.anisotropy = maxAniso;

  const bumpMap = new THREE.CanvasTexture(bumpC);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, Math.max(1, Math.round(repeatY * 1.6)));

  return { map, roughnessMap, bumpMap };
}

export function makeIntersectionTexture(maxAniso) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#282a31';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 14000; i++) {
    const v = 30 + Math.floor(Math.random() * 30);
    ctx.fillStyle = `rgb(${v},${v + 1},${v + 3})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  // Crisp white crosswalk zebra bars on all 4 sides of the intersection square
  ctx.fillStyle = 'rgba(235, 237, 242, 0.82)';
  for (let i = 72; i <= 424; i += 36) {
    ctx.fillRect(i, 12, 18, 52);         // North
    ctx.fillRect(i, size - 64, 18, 52);  // South
    ctx.fillRect(12, i, 52, 18);         // West
    ctx.fillRect(size - 64, i, 52, 18);  // East
  }
  // Stop bars
  ctx.fillStyle = 'rgba(240, 240, 244, 0.72)';
  ctx.fillRect(68, 72, 184, 7);
  ctx.fillRect(260, size - 79, 184, 7);
  ctx.fillRect(72, 260, 7, 184);
  ctx.fillRect(size - 79, 68, 7, 184);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeSidewalkTexture(maxAniso, rx = 8, ry = 20) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  // Sun-warmed Miami limestone/terrazzo sidewalk concrete
  ctx.fillStyle = '#c8bfb6';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8000; i++) {
    const v = 168 + Math.floor(Math.random() * 44);
    ctx.fillStyle = `rgba(${v + 8},${v + 2},${v - 6},0.35)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }
  ctx.strokeStyle = 'rgba(72, 64, 60, 0.42)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeGrassTexture(maxAniso, rx = 6, ry = 10) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#36683c';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const g = 75 + Math.floor(Math.random() * 62);
    ctx.fillStyle = `rgb(${Math.floor(g * 0.56)},${g},${Math.floor(g * 0.52)})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeSandTexture(maxAniso) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#dfc39e';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16000; i++) {
    const v = 190 + Math.floor(Math.random() * 52);
    ctx.fillStyle = `rgba(${v},${Math.floor(v * 0.87)},${Math.floor(v * 0.7)},0.45)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 48);
  tex.anisotropy = maxAniso;
  return tex;
}

export function makePalmBarkTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#786254';
  ctx.fillRect(0, 0, 128, 256);
  for (let y = 0; y < 256; y += 14) {
    ctx.fillStyle = '#4e3c32';
    ctx.fillRect(0, y, 128, 4);
    ctx.fillStyle = '#927a68';
    ctx.fillRect(0, y + 4, 128, 3);
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,240,220,0.08)' : 'rgba(22,12,8,0.16)';
    ctx.fillRect(Math.random() * 128, Math.random() * 256, 4, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
}

export function makePalmFrondTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);

  const stemGrad = ctx.createLinearGradient(0, 506, 0, 12);
  stemGrad.addColorStop(0, '#5a8e42');
  stemGrad.addColorStop(1, '#32723f');
  ctx.strokeStyle = stemGrad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(256, 506);
  ctx.lineTo(256, 14);
  ctx.stroke();

  const pairs = 28;
  for (let i = 0; i < pairs; i++) {
    const t = i / (pairs - 1);
    const y = 478 - t * 452;
    const envelope = Math.sin(Math.pow(t, 0.78) * Math.PI * 0.94 + 0.14);
    const len = 34 + envelope * 204;
    const sweepUp = 22 + t * 34;
    const bladeW = 10 + (1 - Math.abs(t - 0.45)) * 7;

    for (const side of [-1, 1]) {
      const grad = ctx.createLinearGradient(256, y, 256 + side * len, y - sweepUp);
      if (i % 2 === 0) {
        grad.addColorStop(0, '#2b7844');
        grad.addColorStop(0.55, '#429e52');
        grad.addColorStop(1, '#226238');
      } else {
        grad.addColorStop(0, '#226538');
        grad.addColorStop(0.55, '#358847');
        grad.addColorStop(1, '#1a502e');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(256, y + 4);
      ctx.quadraticCurveTo(256 + side * len * 0.52, y - sweepUp * 0.65 - bladeW * 0.6, 256 + side * len, y - sweepUp);
      ctx.quadraticCurveTo(256 + side * len * 0.48, y - sweepUp * 0.35 + bladeW * 0.65, 256, y - 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* World-Scale Repeatable Art Deco Stucco & Recessed Window Tile (4 floors x 6 bays = 16m x 14m) */
export function makeArtDecoFacadeTextures(baseHex, trimHex, accentHex, seed, maxAniso, repeatX = 1, repeatY = 1) {
  const size = 1024;
  const colC = document.createElement('canvas');
  colC.width = colC.height = size;
  const ctx = colC.getContext('2d');

  const emC = document.createElement('canvas');
  emC.width = emC.height = size;
  const ectx = emC.getContext('2d');
  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, size, size);

  const roughC = document.createElement('canvas');
  roughC.width = roughC.height = 512;
  const rctx = roughC.getContext('2d');
  rctx.fillStyle = '#d8d8d8'; // matte stucco
  rctx.fillRect(0, 0, 512, 512);

  // Sun-warmed Miami Art Deco plaster stucco
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 11000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,250,242,0.055)' : 'rgba(30,18,22,0.045)';
    ctx.fillRect(Math.random() * size, Math.random() * size, 3, 3);
  }

  // Horizontal Art Deco speed-lines & floor belt courses
  const rows = 4;
  const cols = 6;
  const rowH = size / rows;
  const colW = size / cols;

  for (let r = 0; r < rows; r++) {
    const y0 = r * rowH;
    ctx.fillStyle = trimHex;
    ctx.fillRect(0, y0, size, 16);
    ctx.fillStyle = 'rgba(28,16,32,0.24)';
    ctx.fillRect(0, y0 + 16, size, 12);
    // Subtle decorative Art Deco triple groove
    ctx.fillStyle = accentHex;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, y0 + 5, size, 4);
    ctx.globalAlpha = 1;
  }

  let s = seed * 211 + 41;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const wx = col * colW + 26;
      const wy = r * rowH + 54;
      const ww = colW - 52;
      const wh = rowH - 86;

      // Deep architectural window recess shadow + stone sill
      ctx.fillStyle = 'rgba(22, 16, 30, 0.55)';
      ctx.fillRect(wx - 8, wy - 8, ww + 16, wh + 14);
      ctx.fillStyle = trimHex;
      ctx.fillRect(wx - 12, wy + wh + 4, ww + 24, 12);

      // Glossy glass region in roughness map!
      rctx.fillStyle = '#242424';
      rctx.fillRect(wx * 0.5, wy * 0.5, ww * 0.5, wh * 0.5);

      const lit = rnd();
      if (lit > 0.42) {
        const g = ctx.createLinearGradient(wx, wy, wx, wy + wh);
        if (lit > 0.74) { g.addColorStop(0, '#FFF1C8'); g.addColorStop(1, '#F29A4B'); }
        else if (lit > 0.56) { g.addColorStop(0, '#C8F4F2'); g.addColorStop(1, '#449EA6'); }
        else { g.addColorStop(0, '#FFD4E6'); g.addColorStop(1, '#C45B84'); }
        ctx.fillStyle = g;
        ctx.fillRect(wx, wy, ww, wh);
        ectx.fillStyle = g;
        ectx.fillRect(wx, wy, ww, wh);

        // Venetian blinds + curtains
        const blindsH = Math.floor(wh * (0.22 + rnd() * 0.42));
        ctx.fillStyle = 'rgba(30, 18, 36, 0.32)';
        ectx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        for (let b = 6; b < blindsH; b += 12) {
          ctx.fillRect(wx, wy + b, ww, 4);
          ectx.fillRect(wx, wy + b, ww, 4);
        }
      } else {
        // Reflective sunset sky tint in unlit glass windows
        const dg = ctx.createLinearGradient(wx, wy, wx, wy + wh);
        dg.addColorStop(0, '#446894');
        dg.addColorStop(0.55, '#2b3e62');
        dg.addColorStop(1, '#6e4c62');
        ctx.fillStyle = dg;
        ctx.fillRect(wx, wy, ww, wh);
      }

      // Crisp aluminum mullions
      ctx.fillStyle = '#e8e2dc';
      ctx.fillRect(wx + ww * 0.5 - 3, wy, 6, wh);
      ctx.fillRect(wx, wy + wh * 0.54, ww, 5);
      ectx.fillStyle = '#000000';
      ectx.fillRect(wx + ww * 0.5 - 3, wy, 6, wh);
      ectx.fillRect(wx, wy + wh * 0.54, ww, 5);
    }
  }

  const map = new THREE.CanvasTexture(colC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.anisotropy = maxAniso;

  const emissiveMap = new THREE.CanvasTexture(emC);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.repeat.set(repeatX, repeatY);
  emissiveMap.anisotropy = maxAniso;

  const roughnessMap = new THREE.CanvasTexture(roughC);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeatX, repeatY);

  return { map, emissiveMap, roughnessMap };
}

/* World-Scale Reflective Glass Curtain-Wall Skyscraper Texture (8 floors x 8 bays) */
export function makeSkyscraperGlassTextures(tintHex, mullionHex, seed, maxAniso, repeatX = 1, repeatY = 2) {
  const size = 1024;
  const colC = document.createElement('canvas');
  colC.width = colC.height = size;
  const ctx = colC.getContext('2d');

  const emC = document.createElement('canvas');
  emC.width = emC.height = size;
  const ectx = emC.getContext('2d');
  ectx.fillStyle = '#000000';
  ectx.fillRect(0, 0, size, size);

  ctx.fillStyle = tintHex;
  ctx.fillRect(0, 0, size, size);

  let s = seed * 317 + 19;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  const rows = 8;
  const cols = 8;
  const rh = size / rows;
  const cw = size / cols;

  for (let r = 0; r < rows; r++) {
    const floorLit = rnd() > 0.35;
    for (let c = 0; c < cols; c++) {
      const x = c * cw;
      const y = r * rh;
      // Spandrel structural floor slab band
      ctx.fillStyle = mullionHex;
      ctx.fillRect(x, y, cw, 28);
      // Glass panel
      const g = ctx.createLinearGradient(x, y + 28, x, y + rh);
      if (floorLit && rnd() > 0.38) {
        const warm = rnd() > 0.3;
        g.addColorStop(0, warm ? '#FFEAB8' : '#BCEEF5');
        g.addColorStop(1, warm ? '#C88042' : '#4C8FA6');
        ctx.fillStyle = g;
        ctx.fillRect(x + 6, y + 30, cw - 12, rh - 34);
        ectx.fillStyle = g;
        ectx.fillRect(x + 6, y + 30, cw - 12, rh - 34);
      } else {
        g.addColorStop(0, '#5a82a8');
        g.addColorStop(0.5, tintHex);
        g.addColorStop(1, '#31445c');
        ctx.fillStyle = g;
        ctx.fillRect(x + 6, y + 30, cw - 12, rh - 34);
      }
      // Vertical steel mullions
      ctx.fillStyle = mullionHex;
      ctx.fillRect(x, y, 8, rh);
    }
  }

  const map = new THREE.CanvasTexture(colC);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.anisotropy = maxAniso;

  const emissiveMap = new THREE.CanvasTexture(emC);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.repeat.set(repeatX, repeatY);
  emissiveMap.anisotropy = maxAniso;

  return { map, emissiveMap };
}

export function makeLobbyGlassTexture(accentHex, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#5a3a52');
  g.addColorStop(0.45, '#FFCC8A');
  g.addColorStop(1, '#A4583C');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  for (let x = 76; x <= 440; x += 120) {
    const cg = ctx.createRadialGradient(x, 54, 4, x, 54, 72);
    cg.addColorStop(0, 'rgba(255,252,230,0.96)');
    cg.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(x - 72, 0, 144, 130);
  }
  ctx.fillStyle = '#1e1828';
  for (let x = 0; x <= 512; x += 64) ctx.fillRect(x - 4, 0, 8, 256);
  ctx.fillRect(0, 44, 512, 8);
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, 512, 7);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeAwningTexture(stripeHex) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = (x / 32) % 2 === 0 ? stripeHex : '#FAF4EC';
    ctx.fillRect(x, 0, 32, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

export function makeNeonSignTexture(title, subtitle, accentHex, maxAniso, vertical = false) {
  const c = document.createElement('canvas');
  c.width = vertical ? 220 : 768;
  c.height = vertical ? 768 : 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#140c24';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, c.width - 20, c.height - 20);
  ctx.shadowColor = accentHex;
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#FFF8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (vertical) {
    const letters = title.toUpperCase().replace(/\s+/g, '');
    const step = (c.height - 96) / Math.max(letters.length, 1);
    ctx.font = `900 ${Math.min(72, Math.floor(step * 0.88))}px "Big Shoulders Display", "Barlow Condensed", sans-serif`;
    for (let i = 0; i < letters.length; i++) ctx.fillText(letters[i], c.width / 2, 54 + step * (i + 0.5));
  } else {
    ctx.font = '900 70px "Big Shoulders Display", "Barlow Condensed", sans-serif';
    ctx.fillText(title.toUpperCase(), 384, subtitle ? 76 : 98);
    if (subtitle) {
      ctx.shadowBlur = 8;
      ctx.fillStyle = accentHex;
      ctx.font = '600 25px "JetBrains Mono", monospace';
      ctx.fillText(subtitle.toUpperCase(), 384, 142);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeSoftParticleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeContactShadowTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 256, 20, 128, 256, 220);
  g.addColorStop(0, 'rgba(0,0,0,0.86)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.44)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);
  return new THREE.CanvasTexture(c);
}

export function makeSplatDecalTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 56);
  g.addColorStop(0, 'rgba(185, 22, 48, 0.78)');
  g.addColorStop(0.65, 'rgba(130, 14, 34, 0.45)');
  g.addColorStop(1, 'rgba(130, 14, 34, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 36 + ((i * 19) % 18);
    const px = 64 + Math.cos(a) * r;
    const py = 64 + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeLicensePlateTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#1CC7BA');
  g.addColorStop(0.55, '#F4EEEB');
  g.addColorStop(1, '#E67B28');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#120824';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.fillStyle = '#120824';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('VICE BEACH', 128, 30);
  ctx.font = '900 54px "Big Shoulders Display", sans-serif';
  ctx.fillText('AKSHAT 86', 128, 92);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
