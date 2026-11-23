/* ==========================================================================
   VICE CITY 3D — SKY, GOLDEN-HOUR REFLECTION ENV, OCEAN & PBR TEXTURES (v4)
   - Mathematically guaranteed non-black radiant sun (zero acos() NaN bugs)
   - Vivid Golden-Hour Miami PMREM environment for crisp car/glass/road reflections
   - World-scale architectural PBR textures (Art Deco, glass skyscrapers, asphalt)
   ========================================================================== */
import * as THREE from 'https://esm.sh/three@0.187.0';

export const SUN_DIR = new THREE.Vector3(0.72, 0.24, -0.65).normalize();

/* Fast Sobel Tangent-Space Normal Map Generator (Linear NoColorSpace — AAA per-pixel micro-relief!) */
export function heightCanvasToNormalTexture(heightCanvas, strength = 2.4, maxAniso = 4, rx = 1, ry = 1) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext('2d');
  const src = srcCtx.getImageData(0, 0, w, h).data;
  const outC = document.createElement('canvas');
  outC.width = w;
  outC.height = h;
  const outCtx = outC.getContext('2d');
  const outImg = outCtx.createImageData(w, h);
  const dst = outImg.data;

  const sample = (x, y) => {
    const xx = (x + w) % w;
    const yy = (y + h) % h;
    return src[(yy * w + xx) * 4] * (1 / 255);
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t  = sample(x,     y - 1);
      const tr = sample(x + 1, y - 1);
      const l  = sample(x - 1, y);
      const r  = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b  = sample(x,     y + 1);
      const br = sample(x + 1, y + 1);

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;
      const invLen = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx *= invLen; ny *= invLen; nz *= invLen;

      const idx = (y * w + x) * 4;
      dst[idx]     = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  outCtx.putImageData(outImg, 0, 0);
  const tex = new THREE.CanvasTexture(outC);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = maxAniso;
  return tex;
}

export function createGoldenHourEnvironment(renderer) {
  const envScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(60, 40, 24);
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
        vec3 zenith  = vec3(0.06, 0.20, 0.52);
        vec3 midSky  = vec3(0.24, 0.42, 0.74);
        vec3 horizon = vec3(1.12, 0.62, 0.34);
        vec3 ocean   = vec3(0.05, 0.24, 0.36);
        vec3 ground  = vec3(0.10, 0.09, 0.14);

        vec3 col;
        if (h >= 0.0) {
          col = mix(horizon, midSky, smoothstep(0.0, 0.26, h));
          col = mix(col, zenith, smoothstep(0.22, 0.84, h));
        } else {
          vec3 lowBase = mix(ground, ocean, smoothstep(-0.1, 0.35, d.x));
          col = mix(horizon * 0.62, lowBase, smoothstep(0.0, -0.32, h));
        }

        // Crisp HDR sun disc + golden studio rim specular for car clearcoat & skyscraper glass
        float sd = max(dot(d, uSunDir), 0.0);
        col += vec3(1.05, 0.84, 0.54) * pow(sd, 9.0) * 1.15;
        col += vec3(1.4, 1.25, 1.0) * smoothstep(0.988, 0.997, sd) * 3.2;

        // Vivid Miami Beach neon & coastal bounce reflections along horizon
        float westBand = smoothstep(0.15, 0.9, -d.x) * (1.0 - smoothstep(0.0, 0.32, abs(h)));
        col += vec3(0.68, 0.18, 0.44) * westBand * 0.72;
        float eastBand = smoothstep(0.15, 0.9, d.x) * (1.0 - smoothstep(0.0, 0.32, abs(h)));
        col += vec3(0.14, 0.58, 0.64) * eastBand * 0.62;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  envScene.add(new THREE.Mesh(skyGeo, skyMat));

  // Architectural skyline reflection cards + Miami neon light bars inside PMREM for crisp car paint reflections
  const cardMat = new THREE.MeshBasicMaterial({ color: 0x161224 });
  const glowWarmMat = new THREE.MeshBasicMaterial({ color: 0xffc47e });
  const glowCyanMat = new THREE.MeshBasicMaterial({ color: 0x38f2e4 });
  const glowPinkMat = new THREE.MeshBasicMaterial({ color: 0xff3b94 });
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * Math.PI * 2;
    const h = 4.5 + (i % 5) * 3.4;
    const mat = i % 5 === 0 ? glowWarmMat : i % 5 === 2 ? glowPinkMat : i % 5 === 4 ? glowCyanMat : cardMat;
    const m = new THREE.Mesh(new THREE.BoxGeometry(i % 2 === 0 ? 4.6 : 1.4, h, 1), mat);
    m.position.set(Math.cos(ang) * 36, h * 0.28 - 2.6, Math.sin(ang) * 36);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.015);
  skyGeo.dispose();
  skyMat.dispose();
  cardMat.dispose();
  glowWarmMat.dispose();
  glowCyanMat.dispose();
  glowPinkMat.dispose();
  pmrem.dispose();
  return rt.texture;
}

export function createViceSkyDome() {
  const geo = new THREE.SphereGeometry(1750, 48, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: SUN_DIR.clone() },
      uHorizon: { value: new THREE.Color(0xfa8a5c) },
      uLower:   { value: new THREE.Color(0xc26680) },
      uMid:     { value: new THREE.Color(0x3d6bb8) },
      uZenith:  { value: new THREE.Color(0x143075) },
      uSunGlow: { value: new THREE.Color(0xffb866) },
      uNightMix: { value: 0.0 },
      uRainDark: { value: 0.0 },
      uLightning: { value: 0.0 }
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
      uniform vec3 uHorizon;
      uniform vec3 uLower;
      uniform vec3 uMid;
      uniform vec3 uZenith;
      uniform vec3 uSunGlow;
      uniform float uNightMix;
      uniform float uRainDark;
      uniform float uLightning;

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
        vec3 sDir = normalize(uSunDir);

        vec3 sky = mix(uHorizon, uLower, smoothstep(0.0, 0.16, h));
        sky = mix(sky, uMid, smoothstep(0.12, 0.44, h));
        sky = mix(sky, uZenith, smoothstep(0.38, 0.90, h));

        // Safe dot-product atmospheric Mie scattering & radiant non-black Sun/Moon disc
        float sunDot = clamp(dot(dir, sDir), 0.0, 1.0);
        float dayFade = (1.0 - uRainDark * 0.72);
        sky += uSunGlow * pow(sunDot, 5.0) * 0.42 * (1.0 - uNightMix * 0.65) * dayFade;
        sky += uSunGlow * pow(sunDot, 28.0) * 0.55 * (1.0 - uNightMix * 0.55) * dayFade;
        sky += vec3(1.00, 0.94, 0.80) * pow(sunDot, 160.0) * 0.62 * dayFade;

        float sunDisc = smoothstep(0.9962, 0.9984, sunDot) * smoothstep(-0.02, 0.03, dir.y) * (1.0 - uRainDark * 0.85);
        vec3 discCol = mix(
          mix(vec3(1.00, 0.84, 0.46), vec3(1.00, 0.98, 0.88), smoothstep(0.9970, 0.9992, sunDot)) * 1.38,
          vec3(0.86, 0.92, 1.00) * 1.25,
          uNightMix
        );
        sky = mix(sky, discCol, sunDisc);

        // Twinkling Miami Night Starfield (visible when uNightMix > 0.15 and clear)
        if (uNightMix > 0.12 && h > 0.08 && uRainDark < 0.75) {
          vec2 stUv = floor(dir.xz / (h + 0.35) * 190.0);
          float starRnd = hash(stUv);
          if (starRnd > 0.992) {
            float twk = 0.6 + 0.4 * sin(uTime * 3.5 + starRnd * 90.0);
            sky += vec3(0.85, 0.92, 1.0) * twk * uNightMix * (1.0 - uRainDark) * smoothstep(0.08, 0.35, h);
          }
        }

        // Layered volumetric backlit Miami clouds with golden sunset silver-lining
        if (h > 0.028) {
          vec2 cUv = dir.xz / (h + 0.22) * 1.18 + vec2(uTime * 0.007, -uTime * 0.0035);
          float cl  = fbm(cUv * 1.35);
          float cl2 = fbm(cUv * 2.95 + vec2(3.1, 1.7));
          float cl3 = fbm(cUv * 5.6 - vec2(1.4, 2.2));
          float shape = cl * 0.58 + cl2 * 0.28 + cl3 * 0.14;
          float thresh = mix(0.45, 0.28, uRainDark);
          float density = smoothstep(thresh, 0.78, shape);
          float edgeGlow = smoothstep(thresh - 0.04, thresh + 0.12, shape) * (1.0 - smoothstep(thresh + 0.10, 0.74, shape));
          float mask = density * smoothstep(0.028, 0.14, h) * (1.0 - smoothstep(0.56, 0.92, h));
          vec3 cloudShadow = mix(vec3(0.28, 0.24, 0.44), vec3(0.08, 0.10, 0.17), max(uNightMix, uRainDark));
          vec3 cloudRim    = mix(uSunGlow * 1.18, vec3(0.32, 0.36, 0.46), max(uNightMix * 0.75, uRainDark * 0.85));
          vec3 cloudLit    = mix(cloudShadow, cloudRim, clamp(pow(sunDot, 1.45) * 0.88 + 0.22, 0.0, 1.0));
          cloudLit += vec3(1.0, 0.82, 0.55) * edgeGlow * pow(sunDot, 3.0) * 0.65 * (1.0 - uNightMix) * (1.0 - uRainDark);
          sky = mix(sky, cloudLit, mask * mix(0.72, 0.92, uRainDark));
        }

        // Rain overcast darkening + dramatic Storm Lightning Flash
        sky = mix(sky, sky * vec3(0.42, 0.46, 0.54), uRainDark * 0.62);
        sky += vec3(0.76, 0.86, 1.0) * uLightning * 0.85;

        // Horizon mist blend below y = 0
        float below = smoothstep(-0.06, 0.02, dir.y);
        sky = mix(uHorizon * 0.35, sky, below);

        gl_FragColor = vec4(sky, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

export function createAtlanticOcean() {
  const geo = new THREE.PlaneGeometry(4400, 4600, 140, 160);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: SUN_DIR.clone() },
      uFogColor: { value: new THREE.Color(0x6e546d) },
      uFogDensity: { value: 0.00145 },
      uSkyTint: { value: new THREE.Color(0xf28f61) },
      uNightMix: { value: 0.0 }
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float w1 = sin(wp.x * 0.11 + wp.z * 0.05 + uTime * 1.25) * 0.22;
        float w2 = cos(wp.z * 0.09 - wp.x * 0.07 - uTime * 0.98) * 0.16;
        float w3 = sin((wp.x * 0.8 + wp.z * 0.6) * 0.075 + uTime * 0.82) * 0.12;
        float eastWave = smoothstep(26.0, 52.0, wp.x);
        float westWave = smoothstep(-498.0, -528.0, wp.x);
        float southWave = smoothstep(355.0, 390.0, wp.z);
        float northWave = smoothstep(-1490.0, -1525.0, wp.z);
        wp.y += (w1 + w2 + w3) * max(max(eastWave, westWave), max(southWave, northWave));
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform vec3 uSkyTint;
      uniform float uNightMix;
      varying vec3 vWorldPos;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      float waveHeight(vec2 p, float t) {
        mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
        float h = 0.0;
        float amp = 0.42;
        vec2 q = p * 0.068;
        for (int i = 0; i < 5; i++) {
          float dirT = t * (0.45 + float(i) * 0.24);
          h += (vnoise(q + vec2(dirT, -dirT * 0.68)) - 0.5) * amp;
          q = rot * q * 1.94 + vec2(11.3, 7.1);
          amp *= 0.52;
        }
        return h;
      }

      void main() {
        vec2 wp = vWorldPos.xz;
        float eps = 0.55;
        float hC = waveHeight(wp, uTime);
        float hX = waveHeight(wp + vec2(eps, 0.0), uTime);
        float hZ = waveHeight(wp + vec2(0.0, eps), uTime);
        // Subtle distance fade on micro-ripples prevents horizon aliasing
        float dist = length(cameraPosition - vWorldPos);
        float detailFade = 1.0 - smoothstep(140.0, 950.0, dist);
        vec3 N = normalize(vec3((hC - hX) * (1.25 * detailFade + 0.28), 1.0, (hC - hZ) * (1.25 * detailFade + 0.28)));
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 R = reflect(-V, N);

        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.6);
        vec3 deepWater   = mix(vec3(0.015, 0.14, 0.30), vec3(0.008, 0.04, 0.12), uNightMix);
        vec3 midAtlantic = mix(vec3(0.025, 0.34, 0.50), vec3(0.015, 0.11, 0.22), uNightMix);
        vec3 shallowTurq = mix(vec3(0.06, 0.70, 0.72), vec3(0.025, 0.22, 0.32), uNightMix);
        vec3 skyReflect  = mix(uSkyTint * 1.10, vec3(0.16, 0.42, 0.78) * (1.0 - uNightMix * 0.62), clamp(R.y * 1.9, 0.0, 1.0));

        float beachDist   = max(0.0, vWorldPos.x - 28.0);
        float westBayDist = max(0.0, -502.0 - vWorldPos.x);
        float island1Dist = max(0.0, length(vWorldPos.xz - vec2(152.0, -300.0)) - 35.0);
        float island2Dist = max(0.0, length(vWorldPos.xz - vec2(156.0, -620.0)) - 36.0);
        float island3Dist = max(0.0, length(vWorldPos.xz - vec2(164.0, -940.0)) - 42.0);
        float shoreMask = max(
          max(1.0 - smoothstep(0.0, 42.0, beachDist), 1.0 - smoothstep(0.0, 36.0, westBayDist)),
          max(1.0 - smoothstep(0.0, 32.0, island1Dist), max(1.0 - smoothstep(0.0, 32.0, island2Dist), 1.0 - smoothstep(0.0, 34.0, island3Dist)))
        );
        float midMask = clamp(1.0 - smoothstep(35.0, 220.0, beachDist), 0.0, 1.0);
        float caustic = vnoise(wp * 0.26 + vec2(uTime * 0.6, -uTime * 0.45));
        vec3 waterBody = mix(deepWater, midAtlantic, midMask * 0.75);
        vec3 col = mix(waterBody, shallowTurq + vec3(0.05, 0.13, 0.11) * caustic * shoreMask, shoreMask * 0.88);
        // Subsurface emerald wave-crest scatter
        col += vec3(0.03, 0.26, 0.28) * clamp(hC * 1.8 + 0.2, 0.0, 1.0) * (1.0 - uNightMix * 0.75) * 0.32;
        col = mix(col, skyReflect, clamp(fresnel * 0.78 + 0.10, 0.0, 0.88));

        // Crisp sun/moon sparkle path across organic wave facets
        vec3 H = normalize(normalize(uSunDir) + V);
        float specSharp = pow(max(dot(N, H), 0.0), 260.0);
        float specMid   = pow(max(dot(N, H), 0.0), 54.0);
        float broadSpec = pow(max(dot(N, H), 0.0), 14.0);
        vec3 specCol = mix(vec3(1.08, 0.94, 0.66), vec3(0.76, 0.90, 1.00), uNightMix);
        col += specCol * specSharp * mix(2.55, 1.25, uNightMix);
        col += specCol * specMid * mix(0.76, 0.34, uNightMix);
        col += uSkyTint * broadSpec * mix(0.32, 0.14, uNightMix);

        // Organic frothy shoreline surf foam (East Beach, Carnival Pier pilings, Starfish, Vice Key, Prawn Island)
        float waveOff = (vnoise(vec2(vWorldPos.z * 0.05, uTime * 0.45)) - 0.5) * 3.2;
        float foam = max(
          smoothstep(35.5 + waveOff, 29.0 + waveOff, vWorldPos.x) * step(18.0, vWorldPos.x),
          max(
            smoothstep(41.5 + waveOff, 35.0 + waveOff, length(vWorldPos.xz - vec2(152.0, -300.0))),
            max(
              smoothstep(42.5 + waveOff, 36.0 + waveOff, length(vWorldPos.xz - vec2(156.0, -620.0))),
              smoothstep(48.5 + waveOff, 42.0 + waveOff, length(vWorldPos.xz - vec2(164.0, -940.0)))
            )
          )
        );
        float foamTex = smoothstep(0.32, 0.76, vnoise(wp * 0.45 - vec2(uTime * 0.9, 0.0)) * 0.65 + (0.5 + 0.5 * sin(vWorldPos.x * 1.15 - uTime * 2.1 + waveOff)) * 0.35);
        col = mix(col, vec3(0.95, 0.97, 0.99), clamp(foam * (0.42 + 0.52 * foamTex), 0.0, 0.88));

        float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(140, -0.78, -520);
  return mesh;
}

/* Iconic GTA Vice City RenderWare Soft 2D Light Corona Texture for Streetlamps & Neon */
export function makeCoronaGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
  g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  g.addColorStop(0.18, 'rgba(255,244,220,0.82)');
  g.addColorStop(0.45, 'rgba(255,205,155,0.30)');
  g.addColorStop(0.75, 'rgba(255,160,120,0.08)');
  g.addColorStop(1.0, 'rgba(255,140,120,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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

  // Realistic coastal satin-asphalt roughness map (tire-worn specular tracks + humid sheen + micro grain)
  const roughC = document.createElement('canvas');
  roughC.width = roughC.height = 512;
  const rctx = roughC.getContext('2d');
  rctx.fillStyle = '#c8c8c8';
  rctx.fillRect(0, 0, 512, 512);
  // Smoother polished tire tracks that catch golden-hour sun & neon reflections
  for (const cx of [0.19, 0.34, 0.66, 0.81]) {
    const g = rctx.createLinearGradient(512 * (cx - 0.07), 0, 512 * (cx + 0.07), 0);
    g.addColorStop(0, 'rgba(200,200,200,0)');
    g.addColorStop(0.5, 'rgba(92,92,92,0.78)');
    g.addColorStop(1, 'rgba(200,200,200,0)');
    rctx.fillStyle = g;
    rctx.fillRect(512 * (cx - 0.07), 0, 512 * 0.14, 512);
  }
  for (let i = 0; i < 8500; i++) {
    const v = 135 + Math.floor(Math.random() * 90);
    rctx.fillStyle = `rgb(${v},${v},${v})`;
    rctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  // High-detail asphalt height canvas -> converted to true tangent-space Normal Map!
  const bumpC = document.createElement('canvas');
  bumpC.width = bumpC.height = 512;
  const bctx = bumpC.getContext('2d');
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 28000; i++) {
    const v = 72 + Math.floor(Math.random() * 110);
    bctx.fillStyle = `rgb(${v},${v},${v})`;
    bctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  // Subtle transverse expansion seams & hairline asphalt cracks in height map
  bctx.strokeStyle = '#383838';
  bctx.lineWidth = 2;
  for (let y = 64; y < 512; y += 128) {
    bctx.beginPath(); bctx.moveTo(16, y); bctx.lineTo(496, y); bctx.stroke();
  }
  for (let k = 0; k < 6; k++) {
    let cx = 60 + k * 74, cy = (k * 89) % 440;
    bctx.beginPath(); bctx.moveTo(cx, cy);
    for (let s = 0; s < 5; s++) { cx += (Math.random() - 0.5) * 24; cy += 14 + Math.random() * 16; bctx.lineTo(cx, cy); }
    bctx.stroke();
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

  const normalMap = heightCanvasToNormalTexture(bumpC, 1.85, maxAniso, 2, Math.max(1, Math.round(repeatY * 1.6)));

  return { map, roughnessMap, bumpMap, normalMap };
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
  // Sun-warmed Miami limestone/travertine pavers with subtle tone variance per slab
  ctx.fillStyle = '#c9bfb3';
  ctx.fillRect(0, 0, 512, 512);
  for (let gx = 0; gx < 512; gx += 64) {
    for (let gy = 0; gy < 512; gy += 64) {
      const tint = ((gx * 7 + gy * 13) % 19) - 9;
      ctx.fillStyle = `rgb(${201 + tint},${191 + tint},${179 + tint})`;
      ctx.fillRect(gx + 2, gy + 2, 60, 60);
      // Subtle bevel highlight on top-left & shadow on bottom-right of each travertine tile
      ctx.fillStyle = 'rgba(255,250,242,0.16)';
      ctx.fillRect(gx + 2, gy + 2, 60, 2);
      ctx.fillRect(gx + 2, gy + 2, 2, 60);
      ctx.fillStyle = 'rgba(56,48,42,0.16)';
      ctx.fillRect(gx + 2, gy + 60, 60, 2);
      ctx.fillRect(gx + 60, gy + 2, 2, 60);
    }
  }
  for (let i = 0; i < 12000; i++) {
    const v = 162 + Math.floor(Math.random() * 52);
    ctx.fillStyle = `rgba(${v + 8},${v + 2},${v - 8},0.28)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  ctx.strokeStyle = 'rgba(66, 58, 52, 0.46)';
  ctx.lineWidth = 2.5;
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

export function makeSidewalkNormalMap(maxAniso, rx = 8, ry = 20) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b4b4b4';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) {
    const v = 160 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  ctx.strokeStyle = '#242424';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  return heightCanvasToNormalTexture(c, 2.2, maxAniso, rx, ry);
}

export function makeGrassTexture(maxAniso, rx = 6, ry = 10) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#315d34';
  ctx.fillRect(0, 0, 512, 512);
  // Subtle manicured coastal park mower bands + organic sun-dappled turf patches
  for (let x = 0; x < 512; x += 64) {
    ctx.fillStyle = (x / 64) % 2 === 0 ? 'rgba(130, 185, 88, 0.08)' : 'rgba(18, 42, 22, 0.08)';
    ctx.fillRect(x, 0, 64, 512);
  }
  for (let i = 0; i < 240; i++) {
    const px = Math.random() * 512, py = Math.random() * 512, r = 10 + Math.random() * 28;
    const g = ctx.createRadialGradient(px, py, 1, px, py, r);
    g.addColorStop(0, i % 3 === 0 ? 'rgba(96, 138, 60, 0.22)' : 'rgba(26, 62, 30, 0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  // Fine grass blades & sunlit clover highlights
  for (let i = 0; i < 18000; i++) {
    const bx = Math.random() * 512, by = Math.random() * 512;
    const g = 68 + Math.floor(Math.random() * 76);
    ctx.fillStyle = `rgb(${Math.floor(g * 0.56)},${g},${Math.floor(g * 0.44)})`;
    ctx.fillRect(bx, by, 1.5, 4);
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
  ctx.fillStyle = '#e0c59c';
  ctx.fillRect(0, 0, 512, 512);
  // Subtle wind-blown beach dune ripples
  for (let y = 0; y < 512; y += 16) {
    const grad = ctx.createLinearGradient(0, y, 0, y + 16);
    grad.addColorStop(0, 'rgba(255,244,224,0.12)');
    grad.addColorStop(0.5, 'rgba(165,130,90,0.09)');
    grad.addColorStop(1, 'rgba(255,244,224,0.05)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 512, 16);
  }
  for (let i = 0; i < 22000; i++) {
    const v = 188 + Math.floor(Math.random() * 56);
    ctx.fillStyle = `rgba(${v},${Math.floor(v * 0.86)},${Math.floor(v * 0.68)},0.48)`;
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

  // Architectural Relief Normal Map (recessed window jambs, sills, Deco belt grooves & stucco micro-grain)
  const hC = document.createElement('canvas');
  hC.width = hC.height = 256;
  const hctx = hC.getContext('2d');
  hctx.fillStyle = '#a8a8a8';
  hctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3600; i++) {
    const v = 152 + Math.floor(Math.random() * 26);
    hctx.fillStyle = `rgb(${v},${v},${v})`;
    hctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const hRow = 256 / rows, hCol = 256 / cols;
  for (let r = 0; r < rows; r++) {
    const y0 = r * hRow;
    hctx.fillStyle = '#ececec';
    hctx.fillRect(0, y0, 256, 4);
    for (let col = 0; col < cols; col++) {
      const wx = col * hCol + 6.5, wy = r * hRow + 13.5, ww = hCol - 13, wh = hRow - 21.5;
      hctx.fillStyle = '#303030';
      hctx.fillRect(wx, wy, ww, wh);
      hctx.fillStyle = '#f2f2f2';
      hctx.fillRect(wx - 2, wy + wh + 1, ww + 4, 3);
      hctx.fillStyle = '#989898';
      hctx.fillRect(wx + ww * 0.5 - 1, wy, 2, wh);
      hctx.fillRect(wx, wy + wh * 0.54, ww, 2);
    }
  }
  const normalMap = heightCanvasToNormalTexture(hC, 2.4, maxAniso, repeatX, repeatY);

  return { map, emissiveMap, roughnessMap, normalMap };
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

export function makeWoodPlankTexture(maxAniso, rx = 24, ry = 8) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6c513e';
  ctx.fillRect(0, 0, size, size);

  const planks = 8;
  const pw = size / planks;
  for (let i = 0; i < planks; i++) {
    const shade = 92 + ((i * 29) % 28);
    ctx.fillStyle = `rgb(${shade + 22}, ${shade - 4}, ${shade - 22})`;
    ctx.fillRect(i * pw + 2, 0, pw - 4, size);
    // Fine wood grain fibers
    ctx.strokeStyle = 'rgba(34, 22, 14, 0.22)';
    ctx.lineWidth = 1.5;
    for (let g = 0; g < 18; g++) {
      const gx = i * pw + 5 + Math.random() * (pw - 10);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + 3, size * 0.33, gx - 3, size * 0.66, gx, size);
      ctx.stroke();
    }
    // Plank seam + nail heads
    ctx.fillStyle = '#2a1d15';
    ctx.fillRect(i * pw, 0, 3, size);
    const jointY = ((i * 157) % 380) + 64;
    ctx.fillRect(i * pw, jointY, pw, 3);
    ctx.fillStyle = '#382a20';
    ctx.beginPath();
    ctx.arc(i * pw + 12, jointY - 12, 2.5, 0, Math.PI * 2);
    ctx.arc(i * pw + pw - 12, jointY - 12, 2.5, 0, Math.PI * 2);
    ctx.arc(i * pw + 12, jointY + 14, 2.5, 0, Math.PI * 2);
    ctx.arc(i * pw + pw - 12, jointY + 14, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeTarmacTexture(maxAniso, rx = 14, ry = 8) {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#292b34';
  ctx.fillRect(0, 0, size, size);

  // Concrete apron expansion joints
  ctx.strokeStyle = 'rgba(14, 15, 20, 0.55)';
  ctx.lineWidth = 3;
  for (let p = 0; p < size; p += 128) {
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
  }
  // Fine stone aggregate & subtle jet-fuel/tire weathering
  for (let i = 0; i < 16000; i++) {
    const v = 30 + Math.floor(Math.random() * 34);
    ctx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = 'rgba(12, 13, 18, 0.24)';
    ctx.fillRect(Math.random() * size, Math.random() * size, 28 + Math.random() * 72, 4 + Math.random() * 6);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = maxAniso;
  return tex;
}

export function makeCarnivalStripesTexture(colA = '#ff2e88', colB = '#fff5e4', maxAniso = 4) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  const stripes = 8;
  const w = 256 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? colA : colB;
    ctx.fillRect(i * w, 0, w, 128);
  }
  // Decorative scalloped valance gold trim along bottom
  ctx.fillStyle = '#ffd36b';
  ctx.fillRect(0, 114, 256, 14);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

let _woodNormalCache = null;
export function makeWoodPlankNormalMap(maxAniso = 4, rx = 24, ry = 8) {
  if (_woodNormalCache) {
    const clone = _woodNormalCache.clone();
    clone.repeat.set(rx, ry);
    clone.needsUpdate = true;
    return clone;
  }
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b8b8b8';
  ctx.fillRect(0, 0, 256, 256);
  const planks = 8, pw = 256 / planks;
  for (let i = 0; i < planks; i++) {
    ctx.strokeStyle = 'rgba(130,130,130,0.45)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 10; g++) {
      const gx = i * pw + 3 + (g / 10) * (pw - 6);
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 256); ctx.stroke();
    }
    ctx.fillStyle = '#181818';
    ctx.fillRect(i * pw, 0, 2, 256);
    const jy = ((i * 79) % 190) + 32;
    ctx.fillRect(i * pw, jy, pw, 2);
  }
  _woodNormalCache = heightCanvasToNormalTexture(c, 2.5, maxAniso, rx, ry);
  return _woodNormalCache;
}

let _clothNormalCache = null;
export function makeClothNormalTexture() {
  if (_clothNormalCache) return _clothNormalCache;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);
  // Crisp woven linen/denim cross-hatch + soft fabric drape folds
  for (let y = 0; y < 128; y += 2) {
    for (let x = 0; x < 128; x += 2) {
      const weave = ((x + y) % 4 === 0) ? 148 : 112;
      const fold = Math.sin(y * 0.14 + Math.sin(x * 0.08) * 1.4) * 16;
      const v = Math.max(30, Math.min(225, Math.round(weave + fold)));
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  _clothNormalCache = heightCanvasToNormalTexture(c, 1.45, 2, 3, 3);
  return _clothNormalCache;
}

let _denimTexCache = null;
export function makeDenimFabricTexture(baseHex = '#e9e4dc') {
  if (_denimTexCache && baseHex === '#e9e4dc') return _denimTexCache;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  // Subtle diagonal twill weave + vertical trouser crease shading
  ctx.strokeStyle = 'rgba(28, 24, 34, 0.065)';
  ctx.lineWidth = 1;
  for (let i = -256; i < 512; i += 4) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
  }
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(20,16,28,0.05)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  if (baseHex === '#e9e4dc') _denimTexCache = tex;
  return tex;
}


