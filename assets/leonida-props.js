/* ==========================================================================
   LEONIDA REAL-WORLD PBR TEXTURES, TOLL PLAZAS, ROAD SIGNS, TRAFFIC LIGHTS,
   GAS STATIONS, BILLBOARDS, SUBURBAN NEIGHBORHOODS, BOULDERS & HIGHWAY TRAFFIC
   ========================================================================== */
import * as THREE from 'https://esm.sh/three@0.187.0';

// ============================================================================
// 1. REAL-TIME SOBEL HEIGHT-TO-NORMAL MAP GENERATOR (LINEAR DATA TEXTURE!)
// ============================================================================
export function makeNormalFromHeightCanvas(heightCanvas, strength = 2.4, repeatX = 1, repeatY = 1, maxAniso = 4) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  const out = new Uint8Array(w * h * 4);

  const sample = (x, y) => {
    const cx = ((x % w) + w) % w;
    const cy = ((y % h) + h) % h;
    return src[(cy * w + cx) * 4] / 255.0;
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

      const dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dY = (bl + 2 * b + br) - (tl + 2 * t + tr);
      let nx = -dX * strength;
      let ny = -dY * strength;
      let nz = 1.0;
      const inv = 1.0 / Math.hypot(nx, ny, nz);
      nx *= inv; ny *= inv; nz *= inv;

      const idx = (y * w + x) * 4;
      out[idx]     = Math.round((nx * 0.5 + 0.5) * 255);
      out[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      out[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(8, maxAniso);
  tex.needsUpdate = true;
  return tex;
}

function finalizeColorTex(canvas, rx = 1, ry = 1, maxAniso = 4) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

function finalizeLinearTex(canvas, rx = 1, ry = 1, maxAniso = 4) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

// ============================================================================
// 1b. SHARED 34 SATIRICAL GTA-STYLE 16:9 BILLBOARD IMAGES & REALISTIC BUILDER
// ============================================================================
export const BILLBOARD_IMAGE_URLS = [
  '/assets/aistudio/01_deadbull_4d55fd8f.webp',
  '/assets/aistudio/02_rotflix_watching_008214ce.webp',
  '/assets/aistudio/03_rotflix_binge_1539a056.webp',
  '/assets/aistudio/04_sugar_shock_391589cd.webp',
  '/assets/aistudio/05_amaze_con_3bd12881.webp',
  '/assets/aistudio/06_just_gourd_it_ed88b09f.webp',
  '/assets/aistudio/07_drip_kart_334fce90.webp',
  '/assets/aistudio/08_insta_brag_07e1f55c.webp',
  '/assets/aistudio/09_gainz_gym_f0422090.webp',
  '/assets/aistudio/10_edison_motors_42b55d45.webp',
  '/assets/aistudio/11_edison_drives_itself_0876ad7b.webp',
  '/assets/aistudio/12_chai_bros_ed68d5db.webp',
  '/assets/aistudio/13_swiggity_82aec5dc.webp',
  '/assets/aistudio/14_nomato_b380a32f.webp',
  '/assets/aistudio/15_zapto_45ab4da5.webp',
  '/assets/aistudio/16_cluck_bucket_e3b0b6c8.webp',
  '/assets/aistudio/17_pay_dayum_9ba708a6.webp',
  '/assets/aistudio/18_loot_bouton_e514c98e.webp',
  '/assets/aistudio/19_els_pawn_4eb48f54.webp',
  '/assets/aistudio/20_slacker_1d772427.webp',
  '/assets/aistudio/21_kred_bab25d64.webp',
  '/assets/aistudio/22_crazy_cals_cars_22a34d57.webp',
  '/assets/aistudio/23_strawberry_15_pro_sweet_00da151b.webp',
  '/assets/aistudio/24_strawberry_15_pro_seeds_d0b301bb.webp',
  '/assets/aistudio/25_clownkings_burger_ec41fce5.webp',
  '/assets/aistudio/26_strawberry_iberry_duo_oct23_69e2efcd.webp',
  '/assets/aistudio/27_strawberry_iberry_duo_harvest_a79bd4a8.webp',
  '/assets/aistudio/28_numb_zac_3d90021f.webp',
  '/assets/aistudio/38_shinjuku_future_pod_53523216.webp',
  '/assets/aistudio/41_capsule_hotel_mirai_1837d6d7.webp',
  '/assets/aistudio/42_ryujin_whisky_ab2729b1.webp',
  '/assets/aistudio/46_valraise_the_movie_deedf71e.webp',
  '/assets/aistudio/49_lumiere_seoul_dewy_glow_ab82ce0d.webp',
  '/assets/aistudio/56_rouge_obsession_seoul_876a903c.webp'
];

let _cachedBillboardMats = null;
let _sharedBbSteelMat = null;
let _sharedBbDarkMat = null;
let _sharedBbConcreteMat = null;
let _sharedBbLampMat = null;

export function getImageBillboardMaterials(maxAniso = 4) {
  if (_cachedBillboardMats) return _cachedBillboardMats;
  const loader = new THREE.TextureLoader();
  const stats = { total: BILLBOARD_IMAGE_URLS.length, loaded: 0, errors: 0 };
  if (typeof window !== 'undefined') window.__VICE_BILLBOARD_STATS__ = stats;

  _cachedBillboardMats = BILLBOARD_IMAGE_URLS.map((url) => {
    const tex = loader.load(
      url,
      () => { stats.loaded++; },
      undefined,
      () => { stats.errors++; }
    );
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, Math.max(1, maxAniso));
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: tex,
      emissiveIntensity: 0.42,
      roughness: 0.44,
      metalness: 0.04
    });
  });
  return _cachedBillboardMats;
}

export function buildImageBillboardMesh(mat, opts = {}) {
  const width = opts.width || 14.4;
  const height = opts.height || (width * 9) / 16; // Strict 16:9 aspect ratio
  const rooftop = Boolean(opts.rooftop);
  const poleHeight = opts.poleHeight !== undefined ? opts.poleHeight : (rooftop ? 2.8 : 9.2);
  const doubleSided = opts.doubleSided !== undefined ? opts.doubleSided : !rooftop;

  if (!_sharedBbSteelMat) {
    _sharedBbSteelMat = new THREE.MeshStandardMaterial({ color: 0x8a939e, metalness: 0.78, roughness: 0.34 });
    _sharedBbDarkMat = new THREE.MeshStandardMaterial({ color: 0x1a1d24, metalness: 0.62, roughness: 0.42 });
    _sharedBbConcreteMat = new THREE.MeshStandardMaterial({ color: 0xbab4a8, metalness: 0.04, roughness: 0.88 });
    _sharedBbLampMat = new THREE.MeshBasicMaterial({ color: 0xfff3d4 });
  }
  const steelMat = opts.steelMat || _sharedBbSteelMat;
  const darkMat = opts.darkMat || _sharedBbDarkMat;
  const concreteMat = opts.concreteMat || _sharedBbConcreteMat;
  const lampMat = opts.lampMat || _sharedBbLampMat;

  const g = new THREE.Group();
  const boardCenterY = poleHeight + height * 0.5;
  const boardBottomY = poleHeight;
  const boardTopY = poleHeight + height;
  const colSpan = width * 0.30;

  if (rooftop) {
    // Steel rooftop A-frame truss with diagonal rear braces & base anchor plates
    const uprightH = poleHeight + height * 0.55;
    for (const sx of [-colSpan, 0, colSpan]) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.24, 2.2), darkMat);
      foot.position.set(sx, 0.12, -0.55);
      const upright = new THREE.Mesh(new THREE.BoxGeometry(0.28, uprightH, 0.28), steelMat);
      upright.position.set(sx, uprightH * 0.5, -0.18);
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.18, uprightH * 0.92, 0.18), steelMat);
      brace.position.set(sx, uprightH * 0.44, -1.25);
      brace.rotation.x = 0.36;
      g.add(foot, upright, brace);
    }
    const tieBeam = new THREE.Mesh(new THREE.BoxGeometry(colSpan * 2.15, 0.26, 0.26), steelMat);
    tieBeam.position.set(0, poleHeight - 0.18, -0.18);
    g.add(tieBeam);
  } else {
    // Heavy galvanized steel twin highway/avenue support columns + concrete plinths + cross-girder
    const colH = poleHeight + height * 0.38;
    const legGeo = new THREE.CylinderGeometry(0.32, 0.42, colH, 10);
    const footGeo = new THREE.BoxGeometry(1.38, 0.82, 1.38);
    for (const sx of [-colSpan, colSpan]) {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(sx, colH * 0.5, 0);
      const foot = new THREE.Mesh(footGeo, concreteMat);
      foot.position.set(sx, 0.41, 0);
      g.add(leg, foot);
    }
    const girder = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.48, 0.58), darkMat);
    girder.position.set(0, boardBottomY - 0.32, 0);
    g.add(girder);
  }

  // Dark steel perimeter cabinet & recessed bevel trim
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(width + 0.66, height + 0.66, 0.54), darkMat);
  cabinet.position.set(0, boardCenterY, 0);
  g.add(cabinet);

  // Crisp 16:9 illuminated artwork face(s) offset cleanly from cabinet to avoid z-fighting
  const faceGeo = new THREE.PlaneGeometry(width, height);
  const frontFace = new THREE.Mesh(faceGeo, mat);
  frontFace.position.set(0, boardCenterY, 0.29);
  g.add(frontFace);
  if (doubleSided) {
    const backFace = new THREE.Mesh(faceGeo, mat);
    backFace.position.set(0, boardCenterY, -0.29);
    backFace.rotation.y = Math.PI;
    g.add(backFace);
  }

  // Maintenance catwalk plank + tubular safety railing + 4 overhead floodlights per illuminated side
  const litSides = doubleSided ? [1, -1] : [1];
  const armGeo = new THREE.BoxGeometry(0.10, 0.10, 1.55);
  const hoodGeo = new THREE.BoxGeometry(0.72, 0.20, 0.34);
  const bulbGeo = new THREE.BoxGeometry(0.58, 0.08, 0.22);
  const postGeo = new THREE.BoxGeometry(0.08, 0.96, 0.08);
  const catwalkGeo = new THREE.BoxGeometry(width + 0.3, 0.12, 0.95);
  const railGeo = new THREE.BoxGeometry(width + 0.3, 0.07, 0.07);

  for (const s of litSides) {
    const catwalk = new THREE.Mesh(catwalkGeo, steelMat);
    catwalk.position.set(0, boardBottomY - 0.46, s * 0.78);
    const railTop = new THREE.Mesh(railGeo, steelMat);
    railTop.position.set(0, boardBottomY + 0.46, s * 1.22);
    const railMid = new THREE.Mesh(railGeo, steelMat);
    railMid.position.set(0, boardBottomY + 0.02, s * 1.22);
    g.add(catwalk, railTop, railMid);

    for (let pi = -2; pi <= 2; pi++) {
      const post = new THREE.Mesh(postGeo, steelMat);
      post.position.set(pi * (width * 0.23), boardBottomY + 0.02, s * 1.22);
      g.add(post);
    }

    // 4 cantilevered overhead floodlight fixtures illuminating the billboard face
    for (let li = 0; li < 4; li++) {
      const lx = (-0.375 + li * 0.25) * width;
      const arm = new THREE.Mesh(armGeo, darkMat);
      arm.position.set(lx, boardTopY + 0.38, s * 0.96);
      const hood = new THREE.Mesh(hoodGeo, darkMat);
      hood.position.set(lx, boardTopY + 0.29, s * 1.66);
      hood.rotation.x = s * 0.42;
      const bulb = new THREE.Mesh(bulbGeo, lampMat);
      bulb.position.set(lx, boardTopY + 0.20, s * 1.63);
      bulb.rotation.x = s * 0.42;
      g.add(arm, hood, bulb);
    }
  }

  return g;
}

// ============================================================================
// 2. AAA PROCEDURAL PBR TEXTURE SETS (ALBEDO + NORMAL + ROUGHNESS FOR EVERYTHING!)
// ============================================================================
export function createLeonidaPBRMaterials(maxAniso = 4) {
  // --- A. TERRAIN & ROCKY MOUNTAIN STRATA PBR ---
  const tCol = document.createElement('canvas'); tCol.width = 256; tCol.height = 256;
  const tHgt = document.createElement('canvas'); tHgt.width = 256; tHgt.height = 256;
  const tRgh = document.createElement('canvas'); tRgh.width = 256; tRgh.height = 256;
  const tc = tCol.getContext('2d'), th = tHgt.getContext('2d'), tr = tRgh.getContext('2d');
  // Soft organic meadow & soil micro-texture (zero harsh blocky squares!)
  tc.fillStyle = '#9aa88c'; tc.fillRect(0, 0, 256, 256);
  th.fillStyle = '#808080'; th.fillRect(0, 0, 256, 256);
  tr.fillStyle = '#ebebeb'; tr.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = (i * 89) % 256;
    const y = (i * 157 + Math.floor(i / 32) * 19) % 256;
    const rad = 6 + (i % 14);
    const bright = (i % 2 === 0);
    tc.fillStyle = bright ? 'rgba(218,228,195,0.08)' : 'rgba(34,54,32,0.08)';
    tc.beginPath(); tc.arc(x, y, rad, 0, Math.PI * 2); tc.fill();
    th.fillStyle = bright ? 'rgba(154,154,154,0.16)' : 'rgba(104,104,104,0.16)';
    th.beginPath(); th.arc(x, y, rad, 0, Math.PI * 2); th.fill();
  }
  for (let i = 0; i < 4500; i++) {
    const x = (i * 73) % 256;
    const y = (i * 197 + Math.floor(i / 256) * 29) % 256;
    const v = ((i * 37) % 40) - 20;
    tc.fillStyle = v > 0 ? 'rgba(220,232,198,0.055)' : 'rgba(24,42,24,0.065)';
    tc.fillRect(x, y, 2, 2);
    const hv = Math.max(96, Math.min(160, 128 + v));
    th.fillStyle = `rgb(${hv},${hv},${hv})`;
    th.fillRect(x, y, 2, 2);
    const rv = Math.max(210, Math.min(252, 234 - v));
    tr.fillStyle = `rgb(${rv},${rv},${rv})`;
    tr.fillRect(x, y, 2, 2);
  }
  // Subtle sedimentary rock strata lines for mountain peaks
  tc.strokeStyle = 'rgba(36, 42, 34, 0.11)'; th.strokeStyle = 'rgba(84, 84, 84, 0.45)';
  tc.lineWidth = 2; th.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const sy = i * 21 + (i % 3) * 4;
    tc.beginPath(); th.beginPath();
    tc.moveTo(0, sy); th.moveTo(0, sy);
    tc.bezierCurveTo(85, sy + 5, 170, sy - 5, 256, sy);
    th.bezierCurveTo(85, sy + 5, 170, sy - 5, 256, sy);
    tc.stroke(); th.stroke();
  }
  const terrainMat = new THREE.MeshStandardMaterial({
    map: finalizeColorTex(tCol, 145, 200, maxAniso),
    normalMap: makeNormalFromHeightCanvas(tHgt, 1.35, 145, 200, maxAniso),
    normalScale: new THREE.Vector2(0.42, 0.42),
    roughnessMap: finalizeLinearTex(tRgh, 145, 200, maxAniso),
    vertexColors: true,
    roughness: 0.96,
    metalness: 0.01
  });

  // --- B. ROCK BOULDER & CLIFF GRANITE PBR ---
  const rockMat = new THREE.MeshStandardMaterial({
    map: finalizeColorTex(tCol, 2, 2, maxAniso),
    normalMap: makeNormalFromHeightCanvas(tHgt, 2.2, 2, 2, maxAniso),
    normalScale: new THREE.Vector2(0.75, 0.75),
    color: 0x7b7872,
    roughness: 0.92,
    metalness: 0.03
  });

  // --- C. 512x512 WEATHERED ASPHALT HIGHWAY PBR (Fine Aggregate, Tire Wear, Drainage Grates, Cat's Eyes!) ---
  const hCol = document.createElement('canvas'); hCol.width = 512; hCol.height = 512;
  const hHgt = document.createElement('canvas'); hHgt.width = 512; hHgt.height = 512;
  const hRgh = document.createElement('canvas'); hRgh.width = 512; hRgh.height = 512;
  const hc = hCol.getContext('2d'), hh = hHgt.getContext('2d'), hr = hRgh.getContext('2d');
  hc.fillStyle = '#292d35'; hc.fillRect(0, 0, 512, 512);
  hh.fillStyle = '#808080'; hh.fillRect(0, 0, 512, 512);
  hr.fillStyle = '#d4d4d4'; hr.fillRect(0, 0, 512, 512);
  // Subtle oil & tire-polished wheel tracks in all 4 lanes
  for (const tx of [92, 172, 340, 420]) {
    const grd = hc.createLinearGradient(tx - 24, 0, tx + 24, 0);
    grd.addColorStop(0, 'rgba(12,14,20,0)');
    grd.addColorStop(0.5, 'rgba(12,14,20,0.34)');
    grd.addColorStop(1, 'rgba(12,14,20,0)');
    hc.fillStyle = grd; hc.fillRect(tx - 24, 0, 48, 512);
    hr.fillStyle = '#888888'; hr.fillRect(tx - 16, 0, 32, 512);
  }
  // Multi-scale realistic crushed basalt aggregate grain
  for (let i = 0; i < 16000; i++) {
    const x = (i * 79 + (i >> 9) * 37) % 512;
    const y = (i * 193 + (i >> 8) * 53) % 512;
    const bright = (i % 3 === 0);
    hc.fillStyle = bright ? 'rgba(218,224,235,0.06)' : 'rgba(6,8,12,0.095)';
    hc.fillRect(x, y, 2, 2);
    hh.fillStyle = bright ? '#929292' : '#707070';
    hh.fillRect(x, y, 2, 2);
  }
  // Patched asphalt repair strips & realistic black tar seal cracks
  hc.fillStyle = 'rgba(22, 25, 32, 0.35)';
  hc.fillRect(72, 110, 62, 92);
  hc.fillRect(348, 310, 74, 86);
  hc.strokeStyle = 'rgba(8, 10, 14, 0.62)'; hc.lineWidth = 2.2;
  hh.strokeStyle = '#484848'; hh.lineWidth = 2.4;
  for (let c = 0; c < 5; c++) {
    const sx = 64 + c * 96;
    hc.beginPath(); hh.beginPath();
    hc.moveTo(sx, 0); hh.moveTo(sx, 0);
    hc.lineTo(sx + 16, 165); hh.lineTo(sx + 16, 165);
    hc.lineTo(sx - 12, 340); hh.lineTo(sx - 12, 340);
    hc.lineTo(sx + 8, 512); hh.lineTo(sx + 8, 512);
    hc.stroke(); hh.stroke();
  }
  // Beveled concrete edge curbs with expansion joints + storm drain grates!
  hc.fillStyle = '#abaeb5'; hc.fillRect(0, 0, 28, 512); hc.fillRect(484, 0, 28, 512);
  hc.fillStyle = '#c8cbd2'; hc.fillRect(24, 0, 4, 512); hc.fillRect(484, 0, 4, 512);
  hh.fillStyle = '#c4c4c4'; hh.fillRect(0, 0, 28, 512); hh.fillRect(484, 0, 28, 512);
  hc.fillStyle = '#5c6068'; hh.fillStyle = '#585858';
  for (let y = 0; y < 512; y += 64) {
    hc.fillRect(0, y, 28, 3); hc.fillRect(484, y, 28, 3);
    hh.fillRect(0, y, 28, 3); hh.fillRect(484, y, 28, 3);
  }
  // Storm drain grates along gutter edge
  for (const gy of [96, 352]) {
    for (const gx of [30, 464]) {
      hc.fillStyle = '#181c22'; hc.fillRect(gx, gy, 16, 28);
      hc.fillStyle = '#555d68';
      for (let bar = 0; bar < 6; bar++) hc.fillRect(gx + 2, gy + 3 + bar * 4, 12, 2);
    }
  }
  // Crisp white outer shoulder lines
  hc.fillStyle = '#eff3f8'; hc.fillRect(38, 0, 9, 512); hc.fillRect(465, 0, 9, 512);
  // Double amber highway centerlines + raised retro-reflective cat's-eye studs
  hc.fillStyle = '#f2b83a'; hc.fillRect(244, 0, 8, 512); hc.fillRect(260, 0, 8, 512);
  hc.fillStyle = '#fff5b8';
  for (let y = 48; y < 512; y += 128) hc.fillRect(252, y, 8, 12);
  // Dashed lane dividers with subtle wear
  hc.fillStyle = 'rgba(242, 246, 252, 0.88)';
  for (let y = 20; y < 512; y += 104) {
    hc.fillRect(136, y, 6, 48);
    hc.fillRect(370, y, 6, 48);
  }
  const highwayMat = new THREE.MeshStandardMaterial({
    map: finalizeColorTex(hCol, 1, 1, maxAniso),
    normalMap: makeNormalFromHeightCanvas(hHgt, 1.1, 1, 1, maxAniso),
    normalScale: new THREE.Vector2(0.32, 0.32),
    roughnessMap: finalizeLinearTex(hRgh, 1, 1, maxAniso),
    roughness: 0.90,
    metalness: 0.04,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });

  // --- D. CLEAN 4-WAY INTERSECTION & ZEBRA CROSSWALK PAD (ZERO Z-FIGHTING!) ---
  const iCol = document.createElement('canvas'); iCol.width = 256; iCol.height = 256;
  const ic = iCol.getContext('2d');
  ic.fillStyle = '#292d36'; ic.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3600; i++) {
    ic.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.07)';
    ic.fillRect((i * 59) % 256, (i * 97) % 256, 2, 2);
  }
  // White stop bars & zebra crosswalks on all 4 approaches
  ic.fillStyle = '#eef2f6';
  for (let s = 38; s <= 212; s += 20) {
    ic.fillRect(s, 8, 10, 24);
    ic.fillRect(s, 224, 10, 24);
    ic.fillRect(8, s, 24, 10);
    ic.fillRect(224, s, 24, 10);
  }
  ic.fillRect(36, 38, 184, 5);
  ic.fillRect(36, 213, 184, 5);
  ic.fillRect(38, 36, 5, 184);
  ic.fillRect(213, 36, 5, 184);
  const intersectionMat = new THREE.MeshStandardMaterial({
    map: finalizeColorTex(iCol, 1, 1, maxAniso),
    normalMap: makeNormalFromHeightCanvas(hHgt, 0.9, 1, 1, maxAniso),
    normalScale: new THREE.Vector2(0.25, 0.25),
    roughness: 0.88,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3
  });

  // --- E. BRUSHED & RIVETED INDUSTRIAL STEEL METAL PBR ---
  const mCol = document.createElement('canvas'); mCol.width = 256; mCol.height = 256;
  const mHgt = document.createElement('canvas'); mHgt.width = 256; mHgt.height = 256;
  const mRgh = document.createElement('canvas'); mRgh.width = 256; mRgh.height = 256;
  const mc = mCol.getContext('2d'), mh = mHgt.getContext('2d'), mr = mRgh.getContext('2d');
  mc.fillStyle = '#9aa4b2'; mc.fillRect(0, 0, 256, 256);
  mh.fillStyle = '#808080'; mh.fillRect(0, 0, 256, 256);
  mr.fillStyle = '#606060'; mr.fillRect(0, 0, 256, 256);
  // Horizontal anisotropic brush streaks
  for (let y = 0; y < 256; y++) {
    const shade = 140 + ((y * 37) % 36);
    mc.fillStyle = `rgb(${shade},${shade + 4},${shade + 10})`;
    mc.fillRect(0, y, 256, 1);
    const rv = 70 + ((y * 23) % 45);
    mr.fillStyle = `rgb(${rv},${rv},${rv})`;
    mr.fillRect(0, y, 256, 1);
  }
  // Corrugated steel ribs / plate seams + bolts
  for (let x = 0; x < 256; x += 32) {
    mc.fillStyle = 'rgba(20, 28, 38, 0.35)'; mc.fillRect(x, 0, 3, 256);
    mh.fillStyle = '#323232'; mh.fillRect(x, 0, 3, 256);
    mh.fillStyle = '#d4d4d4'; mh.fillRect(x + 3, 0, 3, 256);
    for (let y = 16; y < 256; y += 48) {
      mc.fillStyle = '#dce4ec'; mc.fillRect(x + 8, y, 3, 3);
      mh.fillStyle = '#ffffff'; mh.fillRect(x + 8, y, 3, 3);
    }
  }
  const metalColorTex = finalizeColorTex(mCol, 2, 2, maxAniso);
  const metalNormTex = makeNormalFromHeightCanvas(mHgt, 1.4, 2, 2, maxAniso);
  const metalRoughTex = finalizeLinearTex(mRgh, 2, 2, maxAniso);

  const brushedSteelMat = new THREE.MeshStandardMaterial({
    map: metalColorTex, normalMap: metalNormTex, normalScale: new THREE.Vector2(0.4, 0.4), roughnessMap: metalRoughTex,
    color: 0xc8d2de, metalness: 0.72, roughness: 0.38, envMapIntensity: 1.25
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    map: metalColorTex, normalMap: metalNormTex, normalScale: new THREE.Vector2(0.4, 0.4), roughnessMap: metalRoughTex,
    color: 0x485260, metalness: 0.68, roughness: 0.46, envMapIntensity: 1.15
  });
  const craneOrangeMetalMat = new THREE.MeshStandardMaterial({
    map: metalColorTex, normalMap: metalNormTex, normalScale: new THREE.Vector2(0.4, 0.4), roughnessMap: metalRoughTex,
    color: 0xe66824, metalness: 0.56, roughness: 0.46, envMapIntensity: 1.15
  });

  // --- F. POURED ARCHITECTURAL CONCRETE PBR ---
  const cCol = document.createElement('canvas'); cCol.width = 256; cCol.height = 256;
  const cHgt = document.createElement('canvas'); cHgt.width = 256; cHgt.height = 256;
  const cc = cCol.getContext('2d'), ch = cHgt.getContext('2d');
  cc.fillStyle = '#bab7b0'; cc.fillRect(0, 0, 256, 256);
  ch.fillStyle = '#808080'; ch.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const x = (i * 61) % 256, y = (i * 113) % 256;
    cc.fillStyle = i % 2 === 0 ? 'rgba(255,255,250,0.06)' : 'rgba(30,28,24,0.08)';
    cc.fillRect(x, y, 2, 2);
    ch.fillStyle = i % 2 === 0 ? '#989898' : '#686868';
    ch.fillRect(x, y, 2, 2);
  }
  cc.strokeStyle = 'rgba(40,40,38,0.28)'; ch.strokeStyle = '#383838';
  for (let y = 0; y < 256; y += 64) {
    cc.beginPath(); cc.moveTo(0, y); cc.lineTo(256, y); cc.stroke();
    ch.beginPath(); ch.moveTo(0, y); ch.lineTo(256, y); ch.stroke();
  }
  for (let x = 0; x < 256; x += 64) {
    cc.beginPath(); cc.moveTo(x, 0); cc.lineTo(x, 256); cc.stroke();
    ch.beginPath(); ch.moveTo(x, 0); ch.lineTo(x, 256); ch.stroke();
  }
  const concreteMat = new THREE.MeshStandardMaterial({
    map: finalizeColorTex(cCol, 2, 2, maxAniso),
    normalMap: makeNormalFromHeightCanvas(cHgt, 2.2, 2, 2, maxAniso),
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.88,
    metalness: 0.05
  });

  // --- G. ARCHITECTURAL FACADE PBR SETS (WITH REAL WINDOW/BRICK/LOG NORMAL & ROUGHNESS!) ---
  const buildFacadePBR = (style) => {
    const fc = document.createElement('canvas'); fc.width = 256; fc.height = 512;
    const fh = document.createElement('canvas'); fh.width = 256; fh.height = 512;
    const fr = document.createElement('canvas'); fr.width = 256; fr.height = 512;
    const ctx = fc.getContext('2d'), hctx = fh.getContext('2d'), rctx = fr.getContext('2d');

    hctx.fillStyle = '#c8c8c8'; hctx.fillRect(0, 0, 256, 512);
    rctx.fillStyle = '#d4d4d4'; rctx.fillRect(0, 0, 256, 512);

    if (style === 'artdeco') {
      ctx.fillStyle = '#f1e6d8'; ctx.fillRect(0, 0, 256, 512);
      // Stucco plaster grain
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(60,40,30,0.06)';
        ctx.fillRect((i * 47) % 256, (i * 89) % 512, 2, 2);
      }
      for (let row = 0; row < 12; row++) {
        const y = row * 42;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, y, 256, 8);
        hctx.fillStyle = '#ffffff'; hctx.fillRect(0, y, 256, 8);
        ctx.fillStyle = 'rgba(40, 30, 50, 0.18)'; ctx.fillRect(0, y + 8, 256, 3);
        for (let col = 0; col < 6; col++) {
          const x = col * 42 + 6;
          // Recessed reflective ocean glass window
          ctx.fillStyle = ((row + col) % 4 === 0) ? '#8ae3ee' : '#233852';
          ctx.fillRect(x, y + 13, 30, 23);
          ctx.fillStyle = 'rgba(255,248,220,0.30)';
          ctx.fillRect(x, y + 13, 30, 6);
          hctx.fillStyle = '#383838'; hctx.fillRect(x, y + 13, 30, 23);
          rctx.fillStyle = '#262626'; rctx.fillRect(x, y + 13, 30, 23); // glossy glass!
        }
      }
      return new THREE.MeshStandardMaterial({
        map: finalizeColorTex(fc, 1, 1, maxAniso),
        normalMap: makeNormalFromHeightCanvas(fh, 2.2, 1, 1, maxAniso),
        roughnessMap: finalizeLinearTex(fr, 1, 1, maxAniso),
        roughness: 0.72, metalness: 0.14, envMapIntensity: 1.15
      });
    }
    if (style === 'glass') {
      ctx.fillStyle = '#182638'; ctx.fillRect(0, 0, 256, 512);
      rctx.fillStyle = '#242424'; rctx.fillRect(0, 0, 256, 512); // glossy mirrored facade
      for (let row = 0; row < 16; row++) {
        const y = row * 32;
        ctx.fillStyle = '#3c5674'; ctx.fillRect(0, y, 256, 5);
        hctx.fillStyle = '#f0f0f0'; hctx.fillRect(0, y, 256, 5);
        rctx.fillStyle = '#a0a0a0'; rctx.fillRect(0, y, 256, 5);
        for (let col = 0; col < 8; col++) {
          const x = col * 32 + 3;
          const warm = ((row * 5 + col * 11) % 7) === 0;
          const grad = ctx.createLinearGradient(x, y + 6, x, y + 28);
          grad.addColorStop(0, warm ? '#ffe4a8' : '#5e96c4');
          grad.addColorStop(1, warm ? '#d89b42' : '#244768');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y + 6, 26, 23);
          ctx.fillStyle = 'rgba(255,255,255,0.22)';
          ctx.fillRect(x + 2, y + 7, 10, 8);
          hctx.fillStyle = '#505050'; hctx.fillRect(x, y + 6, 26, 23);
        }
      }
      return new THREE.MeshStandardMaterial({
        map: finalizeColorTex(fc, 1, 1, maxAniso),
        normalMap: makeNormalFromHeightCanvas(fh, 2.0, 1, 1, maxAniso),
        roughnessMap: finalizeLinearTex(fr, 1, 1, maxAniso),
        roughness: 0.28, metalness: 0.68, envMapIntensity: 1.5
      });
    }
    if (style === 'brick') {
      ctx.fillStyle = '#9c523e'; ctx.fillRect(0, 0, 256, 512);
      // Individual staggered masonry bricks + deep mortar joints
      for (let y = 0; y < 512; y += 10) {
        const off = ((y / 10) % 2) * 16;
        for (let x = -16; x < 256; x += 32) {
          const shade = ((x * 7 + y * 13) % 28) - 14;
          ctx.fillStyle = `rgb(${156 + shade},${82 + Math.round(shade * 0.6)},${62 + Math.round(shade * 0.5)})`;
          ctx.fillRect(x + off + 1, y + 1, 30, 8);
          hctx.fillStyle = '#dcdcdc';
          hctx.fillRect(x + off + 1, y + 1, 30, 8);
        }
        ctx.fillStyle = 'rgba(210, 198, 182, 0.45)'; ctx.fillRect(0, y, 256, 1.5);
        hctx.fillStyle = '#303030'; hctx.fillRect(0, y, 256, 2);
      }
      for (let row = 0; row < 8; row++) {
        const y = row * 64;
        ctx.fillStyle = '#d4c9b8'; ctx.fillRect(0, y, 256, 7);
        hctx.fillStyle = '#ffffff'; hctx.fillRect(0, y, 256, 7);
        for (let col = 0; col < 4; col++) {
          const x = col * 64 + 12;
          ctx.fillStyle = '#e5dac8'; ctx.fillRect(x - 3, y + 14, 46, 38);
          ctx.fillStyle = ((row + col) % 3 === 0) ? '#ffe09b' : '#202e40';
          ctx.fillRect(x, y + 17, 40, 32);
          hctx.fillStyle = '#282828'; hctx.fillRect(x, y + 17, 40, 32);
          rctx.fillStyle = '#2c2c2c'; rctx.fillRect(x, y + 17, 40, 32);
        }
      }
      return new THREE.MeshStandardMaterial({
        map: finalizeColorTex(fc, 1, 1, maxAniso),
        normalMap: makeNormalFromHeightCanvas(fh, 2.8, 1, 1, maxAniso),
        roughnessMap: finalizeLinearTex(fr, 1, 1, maxAniso),
        roughness: 0.86, metalness: 0.05
      });
    }
    if (style === 'shop') {
      ctx.fillStyle = '#ede3d4'; ctx.fillRect(0, 0, 256, 512);
      for (let i = 0; i < 3200; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(50,40,30,0.06)';
        ctx.fillRect((i * 43) % 256, (i * 91) % 512, 2, 2);
      }
      // Upper floor framed windows
      for (let col = 0; col < 4; col++) {
        const x = col * 64 + 12;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 3, 56, 46, 76);
        ctx.fillStyle = '#273d58'; ctx.fillRect(x, 60, 40, 68);
        ctx.fillStyle = '#f8f2ea'; ctx.fillRect(x + 18, 60, 4, 68); ctx.fillRect(x, 92, 40, 4);
        hctx.fillStyle = '#323232'; hctx.fillRect(x, 60, 40, 68);
        rctx.fillStyle = '#222222'; rctx.fillRect(x, 60, 40, 68);
      }
      // Sign fascia band + brick lower pilasters + wide display windows
      ctx.fillStyle = '#1b1e2e'; ctx.fillRect(0, 218, 256, 54);
      ctx.fillStyle = '#33465e'; ctx.fillRect(0, 290, 256, 222);
      ctx.fillStyle = '#fff0c4';
      ctx.fillRect(14, 310, 82, 148); ctx.fillRect(160, 310, 82, 148);
      ctx.fillStyle = '#8ce4ee'; ctx.fillRect(108, 322, 40, 182);
      rctx.fillStyle = '#1a1a1a';
      rctx.fillRect(14, 310, 82, 148); rctx.fillRect(160, 310, 82, 148); rctx.fillRect(108, 322, 40, 182);
      return new THREE.MeshStandardMaterial({
        map: finalizeColorTex(fc, 1, 1, maxAniso),
        normalMap: makeNormalFromHeightCanvas(fh, 2.1, 1, 1, maxAniso),
        roughnessMap: finalizeLinearTex(fr, 1, 1, maxAniso),
        roughness: 0.72, metalness: 0.12, envMapIntensity: 1.1
      });
    }
    if (style === 'timber') {
      ctx.fillStyle = '#784a2b'; ctx.fillRect(0, 0, 256, 512);
      for (let y = 0; y < 512; y += 16) {
        ctx.fillStyle = 'rgba(26, 12, 4, 0.36)'; ctx.fillRect(0, y, 256, 3);
        ctx.fillStyle = 'rgba(255, 220, 180, 0.10)'; ctx.fillRect(0, y + 3, 256, 4);
        hctx.fillStyle = '#202020'; hctx.fillRect(0, y, 256, 3);
        hctx.fillStyle = '#ececec'; hctx.fillRect(0, y + 4, 256, 8);
      }
      for (let col = 0; col < 3; col++) {
        const x = col * 84 + 16;
        ctx.fillStyle = '#3b2110'; ctx.fillRect(x - 4, 140, 56, 76);
        ctx.fillStyle = '#ffd98a'; ctx.fillRect(x, 144, 48, 68);
        hctx.fillStyle = '#282828'; hctx.fillRect(x, 144, 48, 68);
        rctx.fillStyle = '#202020'; rctx.fillRect(x, 144, 48, 68);
      }
      return new THREE.MeshStandardMaterial({
        map: finalizeColorTex(fc, 1, 1, maxAniso),
        normalMap: makeNormalFromHeightCanvas(fh, 3.0, 1, 1, maxAniso),
        roughnessMap: finalizeLinearTex(fr, 1, 1, maxAniso),
        roughness: 0.88, metalness: 0.03
      });
    }
    // Suburban / Key West clapboard siding with framed shutters & warm windows
    ctx.fillStyle = '#f4f0e6'; ctx.fillRect(0, 0, 256, 512);
    for (let y = 0; y < 512; y += 14) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, y, 256, 2);
      hctx.fillStyle = '#484848'; hctx.fillRect(0, y, 256, 2);
      hctx.fillStyle = '#dcdcdc'; hctx.fillRect(0, y + 2, 256, 12);
    }
    for (let row = 0; row < 2; row++) {
      const y = 72 + row * 210;
      for (let col = 0; col < 3; col++) {
        const x = col * 82 + 18;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 5, y - 5, 54, 88);
        ctx.fillStyle = (row === 1 && col === 1) ? '#ffd990' : '#2a5668';
        ctx.fillRect(x, y, 44, 78);
        hctx.fillStyle = '#2c2c2c'; hctx.fillRect(x, y, 44, 78);
        rctx.fillStyle = '#222222'; rctx.fillRect(x, y, 44, 78);
      }
    }
    return new THREE.MeshStandardMaterial({
      map: finalizeColorTex(fc, 1, 1, maxAniso),
      normalMap: makeNormalFromHeightCanvas(fh, 2.2, 1, 1, maxAniso),
      roughnessMap: finalizeLinearTex(fr, 1, 1, maxAniso),
      roughness: 0.78, metalness: 0.05
    });
  };

  return {
    terrainMat,
    rockMat,
    highwayMat,
    intersectionMat,
    brushedSteelMat,
    darkMetalMat,
    craneOrangeMetalMat,
    concreteMat,
    artDecoMat: buildFacadePBR('artdeco'),
    glassMat: buildFacadePBR('glass'),
    brickMat: buildFacadePBR('brick'),
    shopMat: buildFacadePBR('shop'),
    timberMat: buildFacadePBR('timber'),
    clapMat: buildFacadePBR('clapboard')
  };
}

// ============================================================================
// 3. ROAD SIGNS, TRAFFIC SIGN BOARDS & BILLBOARD CANVAS TEXTURES
// ============================================================================
function makeRoadSignTex(kind, line1 = '', line2 = '') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');

  if (kind === 'STOP') {
    ctx.fillStyle = '#c81d25';
    ctx.beginPath();
    const r = 114, cx = 128, cy = 128;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 72px "Big Shoulders Display", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STOP', 128, 152);
  } else if (kind === 'SPEED') {
    ctx.fillStyle = '#f6f8fa'; ctx.fillRect(18, 6, 220, 244);
    ctx.strokeStyle = '#12161c'; ctx.lineWidth = 10; ctx.strokeRect(26, 14, 204, 228);
    ctx.fillStyle = '#12161c';
    ctx.textAlign = 'center';
    ctx.font = '800 34px "Barlow Condensed", Arial, sans-serif';
    ctx.fillText('SPEED', 128, 64);
    ctx.fillText('LIMIT', 128, 102);
    ctx.font = '900 112px "Big Shoulders Display", Impact, sans-serif';
    ctx.fillText(line1 || '65', 128, 214);
  } else if (kind === 'WARN') {
    ctx.fillStyle = '#f7be16';
    ctx.beginPath();
    ctx.moveTo(128, 10); ctx.lineTo(246, 128); ctx.lineTo(128, 246); ctx.lineTo(10, 128);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#121418'; ctx.lineWidth = 10; ctx.stroke();
    ctx.fillStyle = '#121418';
    ctx.textAlign = 'center';
    ctx.font = '900 42px "Big Shoulders Display", Impact, sans-serif';
    ctx.fillText(line1 || 'TOLL', 128, 122);
    ctx.font = '800 32px "Barlow Condensed", Arial, sans-serif';
    ctx.fillText(line2 || 'AHEAD $25', 128, 162);
  } else if (kind === 'SHIELD') {
    // Classic Red-White-Blue Interstate Shield
    ctx.fillStyle = '#14499e';
    ctx.beginPath();
    ctx.roundRect(18, 22, 220, 214, 34); ctx.fill();
    ctx.fillStyle = '#c81d25';
    ctx.fillRect(18, 22, 220, 62);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 10;
    ctx.strokeRect(22, 26, 212, 206);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    ctx.font = '800 28px "Barlow Condensed", Arial, sans-serif';
    ctx.fillText('INTERSTATE', 128, 64);
    ctx.font = '900 104px "Big Shoulders Display", Impact, sans-serif';
    ctx.fillText(line1 || '97', 128, 198);
  } else {
    // Green Highway Directional Board
    ctx.fillStyle = '#0c5e3a'; ctx.fillRect(6, 26, 244, 204);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 8; ctx.strokeRect(14, 34, 228, 188);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    ctx.font = '900 44px "Big Shoulders Display", Arial, sans-serif';
    ctx.fillText(line1 || 'EXIT ↗', 128, 114);
    ctx.fillStyle = '#ffd36b';
    ctx.font = '800 30px "Barlow Condensed", Arial, sans-serif';
    ctx.fillText(line2 || 'NEXT 1 MI', 128, 168);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBillboardTex(headline, subline, bg1, bg2, accent) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 224;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 512, 224);
  g.addColorStop(0, bg1); g.addColorStop(1, bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 224);
  // Diagonal retro graphic stripes
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.moveTo(320, 0); ctx.lineTo(512, 0); ctx.lineTo(512, 224); ctx.lineTo(240, 224);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = accent; ctx.lineWidth = 10; ctx.strokeRect(10, 10, 492, 204);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px "Big Shoulders Display", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(headline, 256, 114);
  ctx.fillStyle = accent;
  ctx.font = '800 30px "Barlow Condensed", Arial, sans-serif';
  ctx.fillText(subline, 256, 168);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeTollCanopyTex(label, feeText) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0e4d34'; ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#f5be3b'; ctx.fillRect(0, 0, 512, 14); ctx.fillRect(0, 114, 512, 14);
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
  ctx.font = '900 44px "Big Shoulders Display", Impact, sans-serif';
  ctx.fillText(label, 256, 62);
  ctx.fillStyle = '#ffd866';
  ctx.font = '800 28px "JetBrains Mono", monospace';
  ctx.fillText(feeText, 256, 100);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================================
// 4. INTERACTIVE HIGHWAY TOLL TAX PLAZAS (WITH ANIMATED BOOM BARRIERS!)
// ============================================================================
function buildTollPlaza(spec, y, pbr, addBoxCollider) {
  const grp = new THREE.Group();
  grp.position.set(spec.x, y, spec.z);
  grp.rotation.y = spec.yaw;

  // Ground foundation plinth so toll plaza sits flush even on sloped approaches
  const pad = new THREE.Mesh(new THREE.BoxGeometry(28, 3.0, 18), pbr.concreteMat);
  pad.position.set(0, -1.45, 0);
  grp.add(pad);

  // Overhead Brushed-Steel + Illuminated Green Turnpike Canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(27.5, 2.2, 8.6), pbr.brushedSteelMat);
  canopy.position.set(0, 7.6, 0);
  grp.add(canopy);

  const signTex = makeTollCanopyTex(spec.title, `TOLL TAX $${spec.fee} · E-PASS / CASH`);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex, emissive: 0x1aa86a, emissiveMap: signTex, emissiveIntensity: 0.42, roughness: 0.35
  });
  const frontBoard = new THREE.Mesh(new THREE.BoxGeometry(26.2, 2.0, 0.25), signMat);
  frontBoard.position.set(0, 7.6, 4.35);
  const backBoard = frontBoard.clone();
  backBoard.position.z = -4.35;
  backBoard.rotation.y = Math.PI;
  grp.add(frontBoard, backBoard);

  // 3 Concrete Toll Booth Islands (Left outer, Center divider, Right outer) -> creates TWO wide 7.8m drive-through lanes!
  const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf7be16, roughness: 0.45, metalness: 0.15 });
  const boothGlass = new THREE.MeshStandardMaterial({ color: 0x3b789c, roughness: 0.14, metalness: 0.72, envMapIntensity: 1.5 });
  const islandXs = [-11.5, 0, 11.5];

  islandXs.forEach((ix) => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, 12.0), pbr.concreteMat);
    curb.position.set(ix, 0.4, 0);
    // Yellow/Black crash bullnoses at front & back
    const noseF = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 1.1, 8), hazardMat);
    noseF.position.set(ix, 0.55, 6.0);
    const noseB = noseF.clone(); noseB.position.z = -6.0;
    // Brushed Steel Toll Collector Booth + Panoramic Glass
    const booth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 4.2), pbr.brushedSteelMat);
    booth.position.set(ix, 2.5, 0);
    const bWin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.5, 3.2), boothGlass);
    bWin.position.set(ix, 3.2, 0);
    // Support column up to canopy
    const col = new THREE.Mesh(new THREE.BoxGeometry(1.1, 6.6, 1.1), pbr.darkMetalMat);
    col.position.set(ix, 3.4, 0);
    grp.add(curb, noseF, noseB, booth, bWin, col);

    // Solid world-space collider only on the outer & center toll islands (driving lanes at x = ±5.75 are 100% open!)
    if (addBoxCollider) {
      const cos = Math.cos(spec.yaw), sin = Math.sin(spec.yaw);
      const wx = spec.x + ix * cos;
      const wz = spec.z - ix * sin;
      addBoxCollider(wx - 1.35, wx + 1.35, wz - 1.35, wz + 1.35);
    }
  });

  // Lane Overhead Signal Lamps (Green open / Red closed) + Mechanical Red/White Striped Boom Gates!
  const lampMatL = new THREE.MeshBasicMaterial({ color: 0x22ff88 });
  const lampMatR = new THREE.MeshBasicMaterial({ color: 0x22ff88 });
  const lampL = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), lampMatL);
  lampL.position.set(-5.75, 6.1, 4.2);
  const lampR = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), lampMatR);
  lampR.position.set(5.75, 6.1, 4.2);
  grp.add(lampL, lampR);

  // Two animated boom gate arms (pivoting up cleanly when car approaches!)
  const gatePivots = [];
  const armRed = new THREE.MeshStandardMaterial({ color: 0xe62b35, roughness: 0.4 });
  const armWhite = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.4 });
  [[-1.2, -1], [1.2, 1]].forEach(([px, dir]) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.25, 0.55), hazardMat);
    box.position.set(px, 0.75, 2.0);
    grp.add(box);
    const piv = new THREE.Group();
    piv.position.set(px, 1.25, 2.0);
    for (let s = 0; s < 5; s++) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.14), s % 2 === 0 ? armRed : armWhite);
      seg.position.set(dir * (0.9 + s * 1.5), 0, 0);
      piv.add(seg);
    }
    grp.add(piv);
    gatePivots.push({ piv, dir });
  });

  return {
    grp,
    id: spec.id,
    title: spec.title,
    x: spec.x,
    z: spec.z,
    fee: spec.fee,
    gatePivots,
    lampMats: [lampMatL, lampMatR],
    openRatio: 0,
    cooldown: 0
  };
}

// ============================================================================
// 5. FULL ROADSIDE GAS STATIONS (CANOPY, PUMPS, PRICE PYLON & 24H MART!)
// ============================================================================
function buildGasStation(x, y, z, yaw, brandName, accentHex, pbr, addBoxCollider) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = yaw;

  // Concrete station forecourt apron + deep foundation skirt
  const apron = new THREE.Mesh(new THREE.BoxGeometry(32, 3.4, 24), pbr.concreteMat);
  apron.position.set(0, -1.55, 0);
  grp.add(apron);

  // Illuminated Gas Canopy over 2 fuel islands
  const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, 11), pbr.brushedSteelMat);
  canopyRoof.position.set(-4, 5.6, 2);
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(18.3, 0.48, 11.3),
    new THREE.MeshStandardMaterial({ color: accentHex, emissive: accentHex, emissiveIntensity: 0.45, roughness: 0.3 })
  );
  trim.position.set(-4, 5.9, 2);
  grp.add(canopyRoof, trim);

  for (const [cx, cz] of [[-11, -2], [3, -2], [-11, 6], [3, 6]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 5.4, 8), pbr.brushedSteelMat);
    p.position.set(cx, 2.7, cz);
    grp.add(p);
  }
  // 4 Detailed Multi-Part Fuel Dispensers (nozzle, hose loop, safety bollards & digital LCD)
  const pumpMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.38, metalness: 0.32 });
  const bollardMat = new THREE.MeshStandardMaterial({ color: 0xf7be16, roughness: 0.45, metalness: 0.15 });
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1b1e26, roughness: 0.55, metalness: 0.5 });
  const ledDownMat = new THREE.MeshBasicMaterial({ color: 0xfff6e0 });
  for (const [lx, lz] of [[-8, 0], [-4, 0], [0, 0], [-8, 4], [-4, 4], [0, 4]]) {
    const down = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.9), ledDownMat);
    down.position.set(lx, 4.98, lz);
    grp.add(down);
  }
  for (const px of [-8, -5, -1, 2]) {
    const island = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.26, 3.5), pbr.concreteMat);
    island.position.set(px, 0.22, 2);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.85, 0.72), pumpMat);
    pump.position.set(px, 1.2, 2);
    const pumpTop = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.28, 0.80), pbr.brushedSteelMat);
    pumpTop.position.set(px, 2.18, 2);
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.52, 0.76), new THREE.MeshBasicMaterial({ color: 0xc8ffea }));
    scr.position.set(px, 1.52, 2);
    const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 6), nozzleMat);
    hose.position.set(px + 0.52, 1.25, 2);
    const bolF = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.95, 7), bollardMat);
    bolF.position.set(px, 0.65, 3.45);
    const bolB = bolF.clone(); bolB.position.z = 0.55;
    grp.add(island, pump, pumpTop, scr, hose, bolF, bolB);
  }

  // 24H Convenience Mart behind pumps (with rooftop AC unit, ice chest & glowing entry door)
  const mart = new THREE.Mesh(new THREE.BoxGeometry(11.5, 5.2, 10.5), pbr.shopMat);
  mart.position.set(9.5, 2.7, -4.5);
  const martTrim = new THREE.Mesh(new THREE.BoxGeometry(11.9, 0.75, 10.9), pumpMat);
  martTrim.position.set(9.5, 5.5, -4.5);
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.15, 2.0), pbr.brushedSteelMat);
  hvac.position.set(10.5, 6.25, -5.2);
  const iceBox = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.25, 0.95), new THREE.MeshStandardMaterial({ color: 0xeaf4fc, roughness: 0.35 }));
  iceBox.position.set(6.5, 0.72, 1.15);
  grp.add(mart, martTrim, hvac, iceBox);

  // Tall Neon Fuel Price Pylon Sign
  const pylonPole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 10.5, 8), pbr.darkMetalMat);
  pylonPole.position.set(-13.5, 5.25, 9.5);
  const priceTex = makeBillboardTex(brandName, 'REG $1.89 · PREM $2.29 · 24H', '#101c30', '#1c0f2e', '#FFD36B');
  const priceBox = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 3.0, 0.55),
    new THREE.MeshStandardMaterial({ map: priceTex, emissive: 0xffd36b, emissiveMap: priceTex, emissiveIntensity: 0.45 })
  );
  priceBox.position.set(-13.5, 9.6, 9.5);
  grp.add(pylonPole, priceBox);

  if (addBoxCollider) {
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const mx = x + 9.5 * cos - (-4.5) * sin;
    const mz = z + 9.5 * sin + (-4.5) * cos;
    addBoxCollider(mx - 6.2, mx + 6.2, mz - 5.6, mz + 5.6);
  }
  return grp;
}

// ============================================================================
// 6. REALISTIC 4-WAY CANTILEVER TRAFFIC SIGNAL GANTRY (HOODED LENSES, STREET BLADE & WALK BOX!)
// ============================================================================
function makeStreetBladeTex(streetName) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0e693c'; ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(4, 4, 248, 56);
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
  ctx.font = '800 24px "Barlow Condensed", sans-serif';
  ctx.fillText(streetName, 128, 41);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildTrafficSignal(x, y, z, yaw, pbr, streetName = 'LEONIDA BLVD') {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = yaw;

  const housingMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.48, metalness: 0.35 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.6 });

  // Concrete anchor pedestal + tapered galvanized mast pole + diagonal brace + cantilever arm
  const basePed = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.65, 8), pbr.concreteMat);
  basePed.position.y = 0.32;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.23, 7.2, 10), pbr.darkMetalMat);
  pole.position.y = 3.6;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, 8.6, 8), pbr.darkMetalMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(4.1, 6.9, 0);
  const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), pbr.brushedSteelMat);
  brace.rotation.z = -Math.PI / 4;
  brace.position.set(0.85, 6.1, 0);

  // Illuminated Green Street Name Sign Blade on mast arm!
  const bladeTex = makeStreetBladeTex(streetName);
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.55, 0.12),
    new THREE.MeshStandardMaterial({ map: bladeTex, emissive: 0x124d2c, emissiveMap: bladeTex, emissiveIntensity: 0.32, roughness: 0.35 })
  );
  blade.position.set(2.35, 6.95, 0.16);

  // Pedestrian WALK / DON'T WALK signal box mounted on vertical pole!
  const pedBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.38), housingMat);
  pedBox.position.set(0.28, 2.75, 0);
  const pedFace = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.42), new THREE.MeshBasicMaterial({ color: 0xff7722 }));
  pedFace.position.set(0.28, 2.75, 0.20);

  // Dual 3-light signal heads along the mast arm (with dark sun-visor hoods & glowing lenses!)
  const redMat = new THREE.MeshBasicMaterial({ color: 0x441111 });
  const yelMat = new THREE.MeshBasicMaterial({ color: 0x443311 });
  const grnMat = new THREE.MeshBasicMaterial({ color: 0x22ff77 });
  for (const hx of [4.8, 7.4]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.76, 2.1, 0.56), housingMat);
    head.position.set(hx, 6.0, 0);
    const backplate = new THREE.Mesh(new THREE.BoxGeometry(0.96, 2.3, 0.08), visorMat);
    backplate.position.set(hx, 6.0, -0.22);
    grp.add(head, backplate);
    const bulbs = [[6.62, redMat], [6.0, yelMat], [5.38, grnMat]];
    bulbs.forEach(([by, mat]) => {
      const bF = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), mat);
      bF.position.set(hx, by, 0.28);
      const bB = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 8), mat);
      bB.position.set(hx, by, -0.28);
      const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 8, 1, true, 0, Math.PI), visorMat);
      hood.rotation.z = Math.PI / 2;
      hood.rotation.y = Math.PI / 2;
      hood.position.set(hx, by + 0.04, 0.36);
      grp.add(bF, bB, hood);
    });
  }

  grp.add(basePed, pole, arm, brace, blade, pedBox, pedFace);
  return { grp, redMat, yelMat, grnMat, pedMat: pedFace.material };
}

// ============================================================================
// 7. MASTER BUILDER FOR ALL REAL-LIFE LEONIDA INFRASTRUCTURE & FILLER
// ============================================================================
export function buildLeonidaRealWorld({
  root,
  pbr,
  LEONIDA_PROJ,
  LEONIDA_PLACES,
  LEONIDA_HIGHWAYS,
  TOWN_GRID_DEFS,
  isInCoreViceFootprint,
  isInLegacyMountains,
  getLandFactor,
  closestLeonidaHighway,
  getLeonidaElevation,
  addBoxCollider,
  addCircleCollider,
  seeded,
  showroomSpots = []
}) {
  const dummy = new THREE.Object3D();
  const cTmp = new THREE.Color();
  let extraBuildings = 0;

  const isNearShowroom = (x, z, pad = 24) => {
    for (let i = 0; i < showroomSpots.length; i++) {
      if (Math.hypot(x - showroomSpots[i].x, z - showroomSpots[i].z) < pad) return true;
    }
    return false;
  };

  // --- 1. CLEAN 4-WAY CROSSWALK INTERSECTION PADS & FULL 4-WAY TRAFFIC LIGHTS EVERYWHERE! ---
  const townStreetNames = [
    'GELLHORN BLVD', 'WANING SANDS DR', 'AMBROSIA AVE', 'CAPRI PKWY',
    'TEQUESTA BLVD', 'EMERALD SPRINGS RD', 'KEY LENTO WAY'
  ];
  const trafficSignals = [];
  const hydrantSpots = [];
  const benchSpots = [];
  const binSpots = [];

  TOWN_GRID_DEFS.forEach((tg, gi) => {
    const stName = townStreetNames[gi % townStreetNames.length];
    for (let ci = 0; ci < tg.cols.length; ci++) {
      for (let ri = 0; ri < tg.rows.length; ri++) {
        const ix = tg.cx + tg.cols[ci];
        const iz = tg.cz + tg.rows[ri];
        const hwHit = closestLeonidaHighway(ix, iz);
        const roadBaseY = hwHit.dist < 14 ? hwHit.roadY + 0.22 : getLeonidaElevation(ix, iz) + 0.04;
        const pad = new THREE.Mesh(new THREE.PlaneGeometry(16.5, 16.5), pbr.intersectionMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(ix, roadBaseY, iz);
        root.add(pad);

        // Place full 2-axis opposing traffic light gantries at center & key avenue intersections!
        const isPrimaryInt = (ci === 1 && ri === 1) || (ci === 1 && ri === 0) || (ci === 0 && ri === 1);
        if (isPrimaryInt) {
          const sigNS = buildTrafficSignal(ix - 8.4, roadBaseY - 0.16, iz - 8.4, 0, pbr, stName);
          const sigEW = buildTrafficSignal(ix + 8.4, roadBaseY - 0.16, iz + 8.4, Math.PI / 2, pbr, stName);
          root.add(sigNS.grp, sigEW.grp);
          trafficSignals.push({ ...sigNS, phase: gi * 2.1 + ci * 1.4, axis: 0 });
          trafficSignals.push({ ...sigEW, phase: gi * 2.1 + ci * 1.4, axis: 1 });
          if (addCircleCollider) {
            addCircleCollider(ix - 8.4, iz - 8.4, 0.45);
            addCircleCollider(ix + 8.4, iz + 8.4, 0.45);
          }
        }
        // Minor Real-Life Street Furniture on every intersection corner (Hydrants, Benches, Trash Bins!)
        if (!isNearShowroom(ix + 9.2, iz - 9.2, 18)) {
          hydrantSpots.push({ x: ix + 9.2, y: roadBaseY - 0.12, z: iz - 9.2 });
        }
        if (!isNearShowroom(ix - 9.6, iz + 12.5, 18)) {
          benchSpots.push({ x: ix - 9.6, y: roadBaseY - 0.12, z: iz + 12.5, yaw: Math.PI / 2 });
          binSpots.push({ x: ix - 9.6, y: roadBaseY - 0.12, z: iz + 10.2 });
        }
      }
    }
  });

  // Add working Highway Crossroad Traffic Signals at Belville, Evergreen Plaza & Leaf Links Entrance!
  [
    { x: -580, z: -1520, name: 'BELVILLE PKWY' },
    { x: -40,  z: -1860, name: 'EVERGREEN PLAZA' },
    { x: 150,  z: -1480, name: 'LEAF LINKS DR' },
    { x: -1340, z: 640,  name: 'GRASSRIVERS RD' }
  ].forEach((hj, idx) => {
    const hwHit = closestLeonidaHighway(hj.x, hj.z);
    const ry = hwHit.roadY + 0.08;
    const sigA = buildTrafficSignal(hj.x - 9.5, ry, hj.z - 9.5, 0, pbr, hj.name);
    const sigB = buildTrafficSignal(hj.x + 9.5, ry, hj.z + 9.5, Math.PI, pbr, hj.name);
    root.add(sigA.grp, sigB.grp);
    trafficSignals.push({ ...sigA, phase: idx * 3.1, axis: 0 });
    trafficSignals.push({ ...sigB, phase: idx * 3.1, axis: 0 });
  });

  // --- 2. SIX INTERACTIVE HIGHWAY TOLL TAX PLAZAS ($25 TOLL · ANIMATED BOOM GATES!) ---
  // Every plaza is snapped dead-center onto a straight segment of its highway!
  const tollSpecs = [
    { id: 'toll-i97',   x: 150,   z: -1355, yaw: 0,                  title: 'I-97 NORTH TURNPIKE',     fee: 25 },
    { id: 'toll-i297',  x: -580,  z: -1360, yaw: 0,                  title: 'I-297 HEARTLAND TOLL',    fee: 25 },
    { id: 'toll-i404',  x: -940,  z: -810,  yaw: Math.PI / 2 - 0.055,title: 'I-404 CROSSTOWN TOLL',    fee: 25 },
    { id: 'toll-us35',  x: -1800, z: -70,   yaw: -0.447,             title: 'US-35 WEST COAST TOLL',   fee: 25 },
    { id: 'toll-sr82',  x: -192,  z: 445,   yaw: 0,                  title: 'SR-82 MARIANA TOLL',      fee: 25 },
    { id: 'toll-us1a',  x: 0,     z: 485,   yaw: 0,                  title: 'US-1A OVERSEAS BRIDGE',   fee: 25 }
  ];
  const tollPlazas = tollSpecs.map((ts) => {
    const ty = getLeonidaElevation(ts.x, ts.z);
    const tp = buildTollPlaza(ts, ty, pbr, addBoxCollider);
    root.add(tp.grp);
    return tp;
  });

  // --- 3. ROADSIDE TRAFFIC SIGNS & HIGHWAY SIGN BOARDS ALONG EVERY ROAD! ---
  const signTextures = [
    makeRoadSignTex('SPEED', '65'),
    makeRoadSignTex('SPEED', '45'),
    makeRoadSignTex('STOP'),
    makeRoadSignTex('WARN', 'TOLL', 'AHEAD $25'),
    makeRoadSignTex('WARN', 'CURVE', 'SLOW 45'),
    makeRoadSignTex('SHIELD', '97'),
    makeRoadSignTex('SHIELD', '404'),
    makeRoadSignTex('EXIT', 'SERVICES', 'GAS · FOOD')
  ];
  const signMats = signTextures.map((tex) => new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.34, metalness: 0.28, envMapIntensity: 1.2
  }));

  const signPosts = [];
  const signBoardsByType = signMats.map(() => []);

  for (let hi = 0; hi < LEONIDA_HIGHWAYS.length; hi++) {
    const hw = LEONIDA_HIGHWAYS[hi];
    const pts = hw.pts;
    const stride = hw.isTownRoad ? 4 : 9;
    for (let i = 2; i < pts.length - 2; i += stride) {
      const p = pts[i];
      if (isInCoreViceFootprint(p.x, p.z)) continue;
      const nxt = pts[Math.min(pts.length - 1, i + 1)];
      const tx = nxt.x - p.x, tz = nxt.z - p.z;
      const tLen = Math.hypot(tx, tz) || 1;
      const rx = -tz / tLen, rz = tx / tLen;
      const side = (i % 2 === 0) ? 1 : -1;
      const sx = p.x + rx * (hw.width * 0.5 + 2.3) * side;
      const sz = p.z + rz * (hw.width * 0.5 + 2.3) * side;
      if (getLandFactor(sx, sz) < 0.31) continue;
      const sy = getLeonidaElevation(sx, sz);
      const yaw = Math.atan2(tx, tz) + (side > 0 ? Math.PI : 0);
      const typeIdx = hw.isTownRoad
        ? (i % 3 === 0 ? 2 : 1) // STOP & SPEED 45 inside towns
        : ((hi * 3 + i) % signMats.length);
      signPosts.push({ x: sx, y: sy, z: sz, yaw });
      signBoardsByType[typeIdx].push({ x: sx, y: sy + 3.2, z: sz, yaw });
    }
  }

  if (signPosts.length > 0) {
    const postInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.08, 0.10, 3.6, 6),
      pbr.brushedSteelMat,
      signPosts.length
    );
    signPosts.forEach((sp, i) => {
      dummy.position.set(sp.x, sp.y + 1.8, sp.z);
      dummy.rotation.set(0, sp.yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      postInst.setMatrixAt(i, dummy.matrix);
    });
    postInst.instanceMatrix.needsUpdate = true;
    postInst.computeBoundingSphere();
    root.add(postInst);

    const boardGeo = new THREE.BoxGeometry(1.55, 1.55, 0.08);
    signBoardsByType.forEach((arr, ti) => {
      if (!arr.length) return;
      const inst = new THREE.InstancedMesh(boardGeo, signMats[ti], arr.length);
      arr.forEach((b, i) => {
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(0, b.yaw, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      root.add(inst);
    });
  }

  // --- 4. FORTY-SIX GIANT 16:9 ILLUMINATED HIGHWAY BILLBOARDS (ALL 34 PARODY ADS!) ---
  const imageBillMats = getImageBillboardMaterials(4);
  const bbLocations = [];
  for (let hi = 0; hi < Math.min(12, LEONIDA_HIGHWAYS.length); hi++) {
    const hw = LEONIDA_HIGHWAYS[hi];
    if (hw.isTownRoad) continue;
    const pts = hw.pts;
    for (let i = 8; i < pts.length - 8; i += 14) {
      const p = pts[i];
      if (isInCoreViceFootprint(p.x, p.z)) continue;
      const nxt = pts[Math.min(pts.length - 1, i + 1)];
      const tx = nxt.x - p.x, tz = nxt.z - p.z;
      const tLen = Math.hypot(tx, tz) || 1;
      const rx = -tz / tLen, rz = tx / tLen;
      const side = (bbLocations.length % 2 === 0) ? 1 : -1;
      const bx = p.x + rx * 21 * side;
      const bz = p.z + rz * 21 * side;
      if (getLandFactor(bx, bz) < 0.34) continue;
      if (closestLeonidaHighway(bx, bz).dist < 14) continue;
      if (isNearShowroom(bx, bz, 22)) continue;
      if (bbLocations.some((o) => Math.hypot(o.x - bx, o.z - bz) < 92)) continue;
      const by = getLeonidaElevation(bx, bz);
      if (by > 55) continue;
      bbLocations.push({ x: bx, y: by, z: bz, yaw: Math.atan2(tx, tz) + (side > 0 ? Math.PI * 0.86 : 0.14) });
      if (bbLocations.length >= 46) break;
    }
    if (bbLocations.length >= 46) break;
  }
  bbLocations.forEach((bb, idx) => {
    const mat = imageBillMats[(idx + 12) % imageBillMats.length];
    const g = buildImageBillboardMesh(mat, {
      width: 14.4,
      height: 8.1,
      poleHeight: 9.0,
      doubleSided: true,
      rooftop: false,
      steelMat: pbr.brushedSteelMat,
      darkMat: pbr.darkMetalMat,
      concreteMat: pbr.concreteMat
    });
    g.position.set(bb.x, bb.y, bb.z);
    g.rotation.y = bb.yaw;
    root.add(g);
    if (addCircleCollider) addCircleCollider(bb.x, bb.z, 2.6);
  });

  // --- 5. EIGHT ROADSIDE GAS STATIONS & 24H MINI-MARTS ALONG INTERSTATES! ---
  const gasSpecs = [
    { x: 112,   z: -1690, yaw: Math.PI / 2,  brand: 'RON OIL',   col: 0xff6b2b },
    { x: -535,  z: -1660, yaw: -Math.PI / 2, brand: 'VICE FUEL', col: 0x21e6d1 },
    { x: -1160, z: -1805, yaw: 0,            brand: 'GLOBE OIL', col: 0xff2e88 },
    { x: -1260, z: -878,  yaw: 0,            brand: 'RON OIL',   col: 0xff6b2b },
    { x: -1860, z: -1020, yaw: -Math.PI / 2, brand: 'VICE FUEL', col: 0x21e6d1 },
    { x: -1845, z: -195,  yaw: -Math.PI / 2, brand: 'XERO GAS',  col: 0xffc83b },
    { x: -640,  z: 705,   yaw: Math.PI,      brand: 'GLOBE OIL', col: 0xff2e88 },
    { x: -245,  z: 735,   yaw: Math.PI / 2,  brand: 'VICE FUEL', col: 0x21e6d1 }
  ];
  gasSpecs.forEach((gs) => {
    const gy = getLeonidaElevation(gs.x, gs.z);
    root.add(buildGasStation(gs.x, gy, gs.z, gs.yaw, gs.brand, gs.col, pbr, addBoxCollider));
    extraBuildings += 2;
  });

  // --- 6. FILL THE COUNTRYSIDE WITH 280+ REAL-LIFE SUBURBAN HOMES, WAREHOUSES & MOTELS! ---
  const houseSpots = [];
  const warehouseSpots = [];
  const houseColors = [0xf7e3d4, 0xd8f2e8, 0xfce0ec, 0xfff0c8, 0xdce8fa, 0xe8dfd0, 0xf5d4c4];
  const roofColors = [0x6e3a2e, 0x3b4452, 0x8e4c36, 0x2d5e58, 0x5c4638];

  // Cluster neighborhoods cleanly near towns & along highways so the entire map feels inhabited!
  const neighborhoodHubs = [
    { cx: 55,    cz: -1720, r: 170, count: 24, kind: 'suburb' },  // Waning Sands / Evergreen Suburbs
    { cx: -320,  cz: -2140, r: 180, count: 22, kind: 'suburb' },  // Millport Homes
    { cx: -610,  cz: -1480, r: 210, count: 28, kind: 'suburb' },  // Belville Suburbs
    { cx: -960,  cz: -1620, r: 210, count: 26, kind: 'suburb' },  // Ambrosia Residential
    { cx: -1400, cz: -1440, r: 220, count: 22, kind: 'suburb' },  // Emerald Lake Estates
    { cx: -1420, cz: -960,  r: 180, count: 20, kind: 'suburb' },  // Emerald Springs Homes
    { cx: -1960, cz: -1120, r: 230, count: 32, kind: 'suburb' },  // Port Gellhorn Suburbs
    { cx: -1900, cz: -490,  r: 190, count: 18, kind: 'warehouse' }, // Gellhorn Industrial / Farm
    { cx: -1820, cz: 160,   r: 190, count: 22, kind: 'suburb' },  // Capri Villas
    { cx: -420,  cz: 690,   r: 200, count: 26, kind: 'suburb' },  // Tequesta Suburbs
    { cx: -1020, cz: 700,   r: 210, count: 18, kind: 'warehouse' }, // Vice Power / Industrial Park
    { cx: -760,  cz: 1020,  r: 160, count: 16, kind: 'suburb' },  // Mariana Homes
    { cx: -1240, cz: -1180, r: 280, count: 24, kind: 'suburb' },  // Central Heartland Farms & Estates
    { cx: -1620, cz: -660,  r: 240, count: 22, kind: 'suburb' }   // West Plains Ranches
  ];

  let hSeed = 1;
  neighborhoodHubs.forEach((hub) => {
    for (let k = 0; k < hub.count * 2; k++) {
      hSeed++;
      const ang = seeded(hSeed * 3.7) * Math.PI * 2;
      const dist = 28 + Math.sqrt(seeded(hSeed * 7.1)) * hub.r;
      const hx = hub.cx + Math.cos(ang) * dist;
      const hz = hub.cz + Math.sin(ang) * dist;
      if (isInCoreViceFootprint(hx, hz) || isInLegacyMountains(hx, hz)) continue;
      if (getLandFactor(hx, hz) < 0.35) continue;
      const hwHit = closestLeonidaHighway(hx, hz);
      if (hwHit.dist < hwHit.width * 0.5 + 15) continue; // strict road clearance!
      // Keep clear of golf greens, runways & speedways
      let blocked = false;
      for (let p = 0; p < LEONIDA_PLACES.length; p++) {
        const pl = LEONIDA_PLACES[p];
        const minR = (pl.kind === 'golf' || pl.kind === 'airport' || pl.kind === 'raceway') ? 130 : (pl.kind === 'prison' ? 90 : 42);
        if (Math.hypot(hx - pl.x, hz - pl.z) < minR) { blocked = true; break; }
      }
      if (blocked) continue;
      // Avoid crowding another house
      const list = hub.kind === 'warehouse' ? warehouseSpots : houseSpots;
      let tooClose = false;
      for (let j = Math.max(0, list.length - 40); j < list.length; j++) {
        if (Math.hypot(hx - list[j].x, hz - list[j].z) < 22) { tooClose = true; break; }
      }
      if (tooClose) continue;
      if (isNearShowroom(hx, hz, 26)) continue;
      const hy = getLeonidaElevation(hx, hz);
      if (hy < 0.35 || hy > 38) continue;
      list.push({
        x: hx, y: hy, z: hz,
        yaw: Math.floor(seeded(hSeed * 13.3) * 4) * (Math.PI / 2),
        w: hub.kind === 'warehouse' ? (16 + seeded(hSeed * 5.3) * 10) : (9.5 + seeded(hSeed * 5.3) * 4.5),
        h: hub.kind === 'warehouse' ? (7.5 + seeded(hSeed * 9.1) * 3.5) : (4.8 + seeded(hSeed * 9.1) * 3.4),
        d: hub.kind === 'warehouse' ? (12 + seeded(hSeed * 11.7) * 8) : (8.0 + seeded(hSeed * 11.7) * 3.6),
        col: houseColors[hSeed % houseColors.length],
        roofCol: roofColors[hSeed % roofColors.length]
      });
      if (addBoxCollider) addBoxCollider(hx - 6, hx + 6, hz - 5, hz + 5);
      if (list.length >= (hub.kind === 'warehouse' ? 65 : 280)) break;
    }
  });

  // Render Ultra-Detailed Multi-Part Instanced Suburban Ranch Homes (Plinth + Clapboard Walls + Porch + Front Door + Pitched Roof + Brick Chimney!)
  if (houseSpots.length > 0) {
    const plinthInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.06, 3.2, 1.14), pbr.concreteMat, houseSpots.length);
    const bodyInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), pbr.clapMat, houseSpots.length);
    const roofGeo = new THREE.ConeGeometry(0.84, 0.58, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofInst = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ roughness: 0.84, metalness: 0.06 }), houseSpots.length);
    const porchRoofInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.24, 0.28), pbr.darkMetalMat, houseSpots.length);
    const doorInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.44, 0.08), new THREE.MeshStandardMaterial({ color: 0x5c3422, roughness: 0.65 }), houseSpots.length);
    const chimInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.10, 0.42, 0.10), pbr.brickMat, houseSpots.length);

    houseSpots.forEach((b, i) => {
      const cos = Math.cos(b.yaw), sin = Math.sin(b.yaw);
      dummy.position.set(b.x, b.y - 1.45, b.z);
      dummy.rotation.set(0, b.yaw, 0);
      dummy.scale.set(b.w, 1, b.d);
      dummy.updateMatrix();
      plinthInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(b.x, b.y + b.h * 0.5 + 0.1, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      bodyInst.setMatrixAt(i, dummy.matrix);
      cTmp.setHex(b.col); bodyInst.setColorAt(i, cTmp);

      dummy.position.set(b.x, b.y + b.h + b.h * 0.29 + 0.1, b.z);
      dummy.scale.set(b.w * 1.14, b.h, b.d * 1.14);
      dummy.updateMatrix();
      roofInst.setMatrixAt(i, dummy.matrix);
      cTmp.setHex(b.roofCol); roofInst.setColorAt(i, cTmp);

      // Front awning/porch overhang + wooden front door + brick roof chimney
      const fz = b.d * 0.54;
      dummy.position.set(b.x + sin * fz, b.y + b.h * 0.56 + 0.1, b.z + cos * fz);
      dummy.scale.set(b.w, 1, b.d);
      dummy.updateMatrix();
      porchRoofInst.setMatrixAt(i, dummy.matrix);

      const dz = b.d * 0.505;
      dummy.position.set(b.x + sin * dz, b.y + b.h * 0.23 + 0.1, b.z + cos * dz);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      doorInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(b.x + cos * b.w * 0.28, b.y + b.h + b.h * 0.34, b.z - sin * b.w * 0.28);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.updateMatrix();
      chimInst.setMatrixAt(i, dummy.matrix);
    });
    [plinthInst, bodyInst, roofInst, porchRoofInst, doorInst, chimInst].forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      root.add(m);
    });
    extraBuildings += houseSpots.length;
  }

  // Render Minor Real-Life Street Furniture (Red Fire Hydrants, Wooden-Slat Benches, Trash Bins & Utility Poles!)
  if (hydrantSpots.length > 0) {
    const hydRed = new THREE.MeshStandardMaterial({ color: 0xd9252d, roughness: 0.35, metalness: 0.45 });
    const hydBody = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.20, 0.85, 8), hydRed, hydrantSpots.length);
    const hydCap = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 8, 6), pbr.brushedSteelMat, hydrantSpots.length);
    hydrantSpots.forEach((h, i) => {
      dummy.position.set(h.x, h.y + 0.42, h.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      hydBody.setMatrixAt(i, dummy.matrix);
      dummy.position.set(h.x, h.y + 0.86, h.z); dummy.updateMatrix();
      hydCap.setMatrixAt(i, dummy.matrix);
    });
    hydBody.instanceMatrix.needsUpdate = true; hydCap.instanceMatrix.needsUpdate = true;
    hydBody.computeBoundingSphere(); hydCap.computeBoundingSphere();
    root.add(hydBody, hydCap);
  }
  if (benchSpots.length > 0) {
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5430, roughness: 0.78 });
    const bSeat = new THREE.InstancedMesh(new THREE.BoxGeometry(2.1, 0.14, 0.62), woodMat, benchSpots.length);
    const bBack = new THREE.InstancedMesh(new THREE.BoxGeometry(2.1, 0.52, 0.12), woodMat, benchSpots.length);
    const bLegs = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.48, 0.54), pbr.darkMetalMat, benchSpots.length);
    benchSpots.forEach((b, i) => {
      dummy.rotation.set(0, b.yaw, 0); dummy.scale.set(1, 1, 1);
      dummy.position.set(b.x, b.y + 0.48, b.z); dummy.updateMatrix(); bSeat.setMatrixAt(i, dummy.matrix);
      dummy.position.set(b.x - Math.sin(b.yaw) * 0.26, b.y + 0.80, b.z - Math.cos(b.yaw) * 0.26); dummy.updateMatrix(); bBack.setMatrixAt(i, dummy.matrix);
      dummy.position.set(b.x, b.y + 0.24, b.z); dummy.updateMatrix(); bLegs.setMatrixAt(i, dummy.matrix);
    });
    [bSeat, bBack, bLegs].forEach((m) => { m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); root.add(m); });
  }
  if (binSpots.length > 0) {
    const binInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.32, 0.28, 0.95, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e5c40, roughness: 0.52, metalness: 0.38 }),
      binSpots.length
    );
    binSpots.forEach((b, i) => {
      dummy.position.set(b.x, b.y + 0.48, b.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      binInst.setMatrixAt(i, dummy.matrix);
    });
    binInst.instanceMatrix.needsUpdate = true; binInst.computeBoundingSphere(); root.add(binInst);
  }
  // Wooden Roadside Utility Poles with Crossbars along Rural Highways!
  const utilPoles = [];
  for (let hi = 0; hi < Math.min(10, LEONIDA_HIGHWAYS.length); hi++) {
    const hw = LEONIDA_HIGHWAYS[hi];
    if (hw.isTownRoad) continue;
    for (let i = 4; i < hw.pts.length - 4; i += 7) {
      const p = hw.pts[i], nxt = hw.pts[Math.min(hw.pts.length - 1, i + 1)];
      if (isInCoreViceFootprint(p.x, p.z) || isInLegacyMountains(p.x, p.z)) continue;
      const tx = nxt.x - p.x, tz = nxt.z - p.z;
      const len = Math.hypot(tx, tz) || 1;
      const ux = p.x + (-tz / len) * (hw.width * 0.5 + 4.4);
      const uz = p.z + (tx / len) * (hw.width * 0.5 + 4.4);
      if (getLandFactor(ux, uz) < 0.34 || isNearShowroom(ux, uz, 20)) continue;
      const uy = getLeonidaElevation(ux, uz);
      if (uy < 0.3 || uy > 55) continue;
      utilPoles.push({ x: ux, y: uy, z: uz, yaw: Math.atan2(tx, tz) });
    }
  }
  if (utilPoles.length > 0) {
    const uWood = new THREE.MeshStandardMaterial({ color: 0x5c4330, roughness: 0.90 });
    const uPost = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.20, 9.6, 7), uWood, utilPoles.length);
    const uCross = new THREE.InstancedMesh(new THREE.BoxGeometry(2.8, 0.16, 0.16), uWood, utilPoles.length);
    utilPoles.forEach((u, i) => {
      dummy.rotation.set(0, u.yaw, 0); dummy.scale.set(1, 1, 1);
      dummy.position.set(u.x, u.y + 4.6, u.z); dummy.updateMatrix(); uPost.setMatrixAt(i, dummy.matrix);
      dummy.position.set(u.x, u.y + 8.8, u.z); dummy.updateMatrix(); uCross.setMatrixAt(i, dummy.matrix);
    });
    uPost.instanceMatrix.needsUpdate = true; uCross.instanceMatrix.needsUpdate = true;
    uPost.computeBoundingSphere(); uCross.computeBoundingSphere();
    root.add(uPost, uCross);
  }

  // Render Instanced Corrugated Steel Industrial Warehouses
  if (warehouseSpots.length > 0) {
    const whInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), pbr.brushedSteelMat, warehouseSpots.length);
    const whRoof = new THREE.InstancedMesh(new THREE.BoxGeometry(1.04, 0.8, 1.04), pbr.darkMetalMat, warehouseSpots.length);
    warehouseSpots.forEach((b, i) => {
      dummy.position.set(b.x, b.y + b.h * 0.5 - 0.3, b.z);
      dummy.rotation.set(0, b.yaw, 0);
      dummy.scale.set(b.w, b.h + 0.8, b.d);
      dummy.updateMatrix();
      whInst.setMatrixAt(i, dummy.matrix);
      cTmp.setHex(i % 2 === 0 ? 0xb8c2cc : 0xc8b8a4); whInst.setColorAt(i, cTmp);

      dummy.position.set(b.x, b.y + b.h + 0.35, b.z);
      dummy.scale.set(b.w, 1, b.d);
      dummy.updateMatrix();
      whRoof.setMatrixAt(i, dummy.matrix);
    });
    [whInst, whRoof].forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      root.add(m);
    });
    extraBuildings += warehouseSpots.length;
  }

  // --- 7. MUNICIPAL WATER TOWERS & HIGH-VOLTAGE STEEL POWER PYLONS ---
  [
    [-1860, -1380], [-890, -1690], [-640, -1550], [-450, 720]
  ].forEach(([wx, wz]) => {
    const wy = getLeonidaElevation(wx, wz);
    const wt = new THREE.Group();
    wt.position.set(wx, wy, wz);
    for (let l = 0; l < 4; l++) {
      const a = (l / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 22, 6), pbr.brushedSteelMat);
      leg.position.set(Math.cos(a) * 3.8, 11, Math.sin(a) * 3.8);
      wt.add(leg);
    }
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.2, 7.5, 16), pbr.brushedSteelMat);
    tank.position.y = 24.5;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(5.8, 3.2, 16), pbr.darkMetalMat);
    cap.position.y = 29.8;
    wt.add(tank, cap);
    root.add(wt);
    if (addCircleCollider) addCircleCollider(wx, wz, 5.5);
  });

  // High-Voltage Power Pylons marching across the countryside from Vice Power Station!
  const pylonCoords = [];
  for (let i = 0; i < 14; i++) {
    const px = -920 - i * 65;
    const pz = 680 - i * 110;
    if (getLandFactor(px, pz) > 0.34 && closestLeonidaHighway(px, pz).dist > 16) {
      pylonCoords.push({ x: px, y: getLeonidaElevation(px, pz), z: pz });
    }
  }
  if (pylonCoords.length > 0) {
    const towerGeo = new THREE.CylinderGeometry(1.1, 3.2, 28, 4);
    towerGeo.translate(0, 14, 0);
    const armGeo = new THREE.BoxGeometry(12.5, 0.85, 0.85);
    armGeo.translate(0, 23, 0);
    const pTowers = new THREE.InstancedMesh(towerGeo, pbr.brushedSteelMat, pylonCoords.length);
    const pArms = new THREE.InstancedMesh(armGeo, pbr.brushedSteelMat, pylonCoords.length);
    pylonCoords.forEach((p, i) => {
      dummy.position.set(p.x, p.y - 0.5, p.z);
      dummy.rotation.set(0, 0.52, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pTowers.setMatrixAt(i, dummy.matrix);
      pArms.setMatrixAt(i, dummy.matrix);
      if (addCircleCollider) addCircleCollider(p.x, p.z, 3.0);
    });
    pTowers.instanceMatrix.needsUpdate = true; pArms.instanceMatrix.needsUpdate = true;
    pTowers.computeBoundingSphere(); pArms.computeBoundingSphere();
    root.add(pTowers, pArms);
  }

  // --- 8. 850+ INSTANCED ROCKY GRANITE BOULDERS & 1,400+ TROPICAL SHRUBS / BUSHES ---
  const widthX = LEONIDA_PROJ.maxX - LEONIDA_PROJ.minX;
  const depthZ = LEONIDA_PROJ.maxZ - LEONIDA_PROJ.minZ;
  const rockPts = [], bushPts = [];

  for (let i = 0; i < 2400; i++) {
    const wx = LEONIDA_PROJ.minX + 60 + seeded(i * 4.7 + 71) * (widthX - 120);
    const wz = LEONIDA_PROJ.minZ + 60 + seeded(i * 6.3 + 93) * (depthZ - 120);
    if (isInCoreViceFootprint(wx, wz) || isInLegacyMountains(wx, wz)) continue;
    if (getLandFactor(wx, wz) < 0.34) continue;
    const hwHit = closestLeonidaHighway(wx, wz);
    if (hwHit.dist < hwHit.width * 0.5 + 10) continue;
    let blocked = false;
    for (let j = 0; j < LEONIDA_PLACES.length; j++) {
      const pl = LEONIDA_PLACES[j];
      const clearR = (pl.kind === 'airport' || pl.kind === 'raceway' || pl.kind === 'golf') ? 130 : 52;
      if (Math.hypot(wx - pl.x, wz - pl.z) < clearR) { blocked = true; break; }
    }
    if (blocked) continue;
    const wy = getLeonidaElevation(wx, wz);
    if (wy < 0.25) continue;

    if ((wy > 14 || i % 3 === 0) && rockPts.length < 750) {
      const s = (wy > 22 ? 2.4 : 1.1) + seeded(i * 9.7) * 2.6;
      rockPts.push({ x: wx, y: wy, z: wz, sx: s * (0.9 + seeded(i * 2.1) * 0.5), sy: s * 0.65, sz: s, r: seeded(i * 15.1) * Math.PI * 2, isRed: Math.hypot(wx + 1820, wz + 1960) < 320 });
    } else if (bushPts.length < 1300) {
      bushPts.push({ x: wx, y: wy, z: wz, s: 0.7 + seeded(i * 8.3) * 1.1, r: seeded(i * 17.3) * Math.PI * 2 });
    }
  }

  // Dense roadside forest underbrush & fern clusters hugging rural highways through empty lands!
  const ruralHwList = LEONIDA_HIGHWAYS.filter((hw) => !hw.isTownRoad && hw.pts.length > 6);
  let rbSeed = 0;
  for (let h = 0; h < ruralHwList.length; h++) {
    const hw = ruralHwList[h];
    for (let k = 1; k < hw.pts.length - 1; k += 2) {
      const p0 = hw.pts[k];
      const p1 = hw.pts[Math.min(hw.pts.length - 1, k + 1)];
      if (isInCoreViceFootprint(p0.x, p0.z) || isInLegacyMountains(p0.x, p0.z)) continue;
      if (getLandFactor(p0.x, p0.z) < 0.36) continue;
      const dx = p1.x - p0.x, dz = p1.z - p0.z;
      const len = Math.hypot(dx, dz) || 1;
      const rx = -dz / len, rz = dx / len;
      for (const side of [-1, 1]) {
        for (let row = 0; row < 2; row++) {
          rbSeed++;
          const lat = hw.width * 0.5 + 6.8 + row * 9.5 + seeded(rbSeed * 5.3) * 6.5;
          const bx = p0.x + rx * side * lat + (seeded(rbSeed * 7.1) - 0.5) * 6.0;
          const bz = p0.z + rz * side * lat + (seeded(rbSeed * 11.7) - 0.5) * 6.0;
          if (isInCoreViceFootprint(bx, bz) || isInLegacyMountains(bx, bz)) continue;
          if (getLandFactor(bx, bz) < 0.36) continue;
          const hit = closestLeonidaHighway(bx, bz);
          if (hit.dist < hit.width * 0.5 + 5.8) continue;
          let inTown = false;
          for (let j = 0; j < LEONIDA_PLACES.length; j++) {
            const pl = LEONIDA_PLACES[j];
            const cr = (pl.kind === 'airport' || pl.kind === 'raceway' || pl.kind === 'golf') ? 132 : (pl.kind === 'toll' ? 36 : 62);
            if (Math.hypot(bx - pl.x, bz - pl.z) < cr) { inTown = true; break; }
          }
          if (inTown) continue;
          const by = getLeonidaElevation(bx, bz);
          if (by < 0.25 || by > 108) continue;
          bushPts.push({ x: bx, y: by, z: bz, s: 0.95 + seeded(rbSeed * 13.9) * 1.35, r: seeded(rbSeed * 19.1) * Math.PI * 2 });
        }
      }
    }
  }

  if (rockPts.length > 0) {
    const rInst = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.4, 1), pbr.rockMat, rockPts.length);
    rockPts.forEach((b, i) => {
      dummy.position.set(b.x, b.y + b.sy * 0.35, b.z);
      dummy.rotation.set(0.2, b.r, 0.15);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.updateMatrix();
      rInst.setMatrixAt(i, dummy.matrix);
      cTmp.setHex(b.isRed ? 0xa66244 : (i % 2 === 0 ? 0x807e78 : 0x6a6b68));
      rInst.setColorAt(i, cTmp);
      if (addCircleCollider && b.sx >= 1.25) {
        addCircleCollider(b.x, b.z, Math.max(b.sx, b.sz) * 1.15);
      }
    });
    rInst.instanceMatrix.needsUpdate = true;
    if (rInst.instanceColor) rInst.instanceColor.needsUpdate = true;
    rInst.computeBoundingSphere();
    root.add(rInst);
  }

  if (bushPts.length > 0) {
    const bGeo = new THREE.IcosahedronGeometry(1.5, 1);
    bGeo.scale(1.25, 0.72, 1.25);
    const bInst = new THREE.InstancedMesh(bGeo, new THREE.MeshStandardMaterial({ color: 0x3b763c, roughness: 0.88 }), bushPts.length);
    bushPts.forEach((b, i) => {
      dummy.position.set(b.x, b.y + b.s * 0.45, b.z);
      dummy.rotation.set(0, b.r, 0);
      dummy.scale.setScalar(b.s);
      dummy.updateMatrix();
      bInst.setMatrixAt(i, dummy.matrix);
      cTmp.setHSL(0.28 + (i % 7) * 0.012, 0.44, 0.24 + (i % 5) * 0.032);
      bInst.setColorAt(i, cTmp);
    });
    bInst.instanceMatrix.needsUpdate = true;
    if (bInst.instanceColor) bInst.instanceColor.needsUpdate = true;
    bInst.computeBoundingSphere();
    root.add(bInst);
  }

  // --- 8B. MOUNT KALAGA ALPINE GONDOLA ROPEWAY (148M LUMMOX COUNTY SUMMIT!) ---
  const kalagaRopeway = buildMountainRopeway({
    root,
    id: 'mt-kalaga',
    title: 'MT. KALAGA SKYWAY',
    subtitle: '148M ALPINE GONDOLA',
    startPos: { x: -1052, z: -2176 },
    endPos: { x: -1062, z: -2328 },
    numPylons: 3,
    numCabins: 6,
    clearanceY: 13.5,
    speed: 0.042,
    getHeight: getLeonidaElevation,
    pbr,
    addCircleCollider,
    addBoxCollider
  });

  // --- 9. 64 LIVE ANIMATED HIGHWAY TRAFFIC VEHICLES CRUISING ALL LEONIDA INTERSTATES! ---
  const trafficCars = [];
  const carColors = [
    0xd63638, 0x2674c8, 0xf2b838, 0xe8ecf2, 0x26a68a,
    0x7c38a8, 0xff6b2b, 0x2d8a4e, 0xe84393, 0x3a4b5c, 0xc8a464
  ];
  const carCabinMat = new THREE.MeshStandardMaterial({ color: 0x1a2634, roughness: 0.16, metalness: 0.72 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.85 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff6cc });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2838 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xd6dce5, metalness: 0.85, roughness: 0.22 });
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x262a34, roughness: 0.45, metalness: 0.4 });
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.88 });
  const paintMats = carColors.map((hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.24, metalness: 0.56, envMapIntensity: 1.3 }));

  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 8);
  const rimGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.28, 7);
  const majorRoutes = LEONIDA_HIGHWAYS.filter((hw) => !hw.isTownRoad && hw.pts.length > 6);
  const totalCars = 64;
  // Build weighted route assignments proportional to route length so long highways get dense traffic!
  const routePool = [];
  majorRoutes.forEach((hw) => {
    const slots = Math.max(3, Math.round(hw.pts.length / 26));
    for (let s = 0; s < slots; s++) routePool.push(hw);
  });

  for (let i = 0; i < totalCars; i++) {
    const hw = routePool[i % routePool.length];
    const kind = i % 4; // 0: sedan, 1: SUV, 2: pickup truck, 3: sports coupe
    const car = new THREE.Group();
    const paint = paintMats[i % paintMats.length];

    if (kind === 1) {
      // Tall SUV
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.90, 4.65), paint);
      body.position.y = 0.82;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.78, 3.05), carCabinMat);
      cabin.position.set(0, 1.56, -0.35);
      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.10, 2.85), paint);
      roofCap.position.set(0, 1.98, -0.35);
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.08, 2.2), bumperMat);
      rack.position.set(0, 2.08, -0.35);
      car.add(body, cabin, roofCap, rack);
    } else if (kind === 2) {
      // Pickup Truck
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.86, 4.95), paint);
      body.position.y = 0.80;
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.90, 0.74, 1.75), carCabinMat);
      cab.position.set(0, 1.54, 0.45);
      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.84, 0.10, 1.58), paint);
      roofCap.position.set(0, 1.94, 0.45);
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.16, 1.95), bedMat);
      bed.position.set(0, 1.24, -1.35);
      car.add(body, cab, roofCap, bed);
    } else if (kind === 3) {
      // Low Sports Coupe
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.68, 4.45), paint);
      body.position.y = 0.66;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.56, 2.05), carCabinMat);
      cabin.position.set(0, 1.22, -0.18);
      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.07, 1.65), paint);
      roofCap.position.set(0, 1.52, -0.18);
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.10, 0.34), bumperMat);
      spoiler.position.set(0, 1.18, -2.02);
      car.add(body, cabin, roofCap, spoiler);
    } else {
      // Classic Sedan
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.78, 4.45), paint);
      body.position.y = 0.72;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.64, 2.25), carCabinMat);
      cabin.position.set(0, 1.36, -0.15);
      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.08, 1.85), paint);
      roofCap.position.set(0, 1.70, -0.15);
      car.add(body, cabin, roofCap);
    }

    const lenHalf = kind === 2 ? 2.48 : (kind === 1 ? 2.32 : 2.22);
    const bFront = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.26, 0.24), bumperMat); bFront.position.set(0, 0.44, lenHalf);
    const bRear = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.26, 0.24), bumperMat); bRear.position.set(0, 0.44, -lenHalf);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.26, 0.08), rimMat); grille.position.set(0, 0.72, lenHalf + 0.02);
    const hl = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.20, 0.10), headMat); hl.position.set(0, 0.78, lenHalf - 0.02);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.22, 0.10), tailMat); tl.position.set(0, 0.78, -(lenHalf - 0.02));
    car.add(bFront, bRear, grille, hl, tl);

    const wb = kind === 2 ? 1.54 : 1.38;
    for (const [wx, wz] of [[-1.04, wb], [1.04, wb], [-1.04, -wb], [1.04, -wb]]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2; w.position.set(wx, 0.36, wz);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2; rim.position.set(wx, 0.36, wz);
      car.add(w, rim);
    }
    root.add(car);

    // Compute real world-space speed converted into normalized polyline t-speed (16-26 m/s!)
    const routeLenEst = Math.max(180, hw.pts.length * 18);
    const speedMps = 16.5 + (i % 5) * 2.4;
    const dir = i % 2 === 0 ? 1 : -1;
    trafficCars.push({
      mesh: car,
      pts: hw.pts,
      t: 0.05 + ((i * 0.6180339887) % 0.90),
      dir,
      speed: speedMps / routeLenEst,
      laneOffset: dir * (hw.width >= 15.5 ? (3.1 + (i % 2) * 1.4) : 3.2)
    });
  }

  // --- 10. LIVE PER-FRAME UPDATE (ANIMATED TOLL GATES, TRAFFIC LIGHTS, ROPEWAY & HIGHWAY TRAFFIC!) ---
  let sigClock = 0;
  function update(dt, actorPos, actorSpeedKmh, isDriving, onTollEvent, elapsed = 0, nightMix = 0) {
    sigClock += dt;

    // Animate Mount Kalaga Alpine Gondola Ropeway!
    if (kalagaRopeway) {
      kalagaRopeway.update(dt, elapsed || sigClock, nightMix);
    }

    // Synchronized 4-Way N-S / E-W Town Intersection Traffic Light Phases (Green -> Yellow -> All-Red -> Cross!)
    for (let i = 0; i < trafficSignals.length; i++) {
      const s = trafficSignals[i];
      const cyc = (sigClock + s.phase) % 14;
      const isNS = (s.axis || 0) === 0;
      const green = isNS ? (cyc < 5.5) : (cyc >= 7.0 && cyc < 12.5);
      const yellow = isNS ? (cyc >= 5.5 && cyc < 6.8) : (cyc >= 12.5 && cyc < 13.8);
      s.grnMat.color.setHex(green ? 0x22ff77 : 0x0b2c18);
      s.yelMat.color.setHex(yellow ? 0xffcc22 : 0x362a08);
      s.redMat.color.setHex((!green && !yellow) ? 0xff2838 : 0x380c10);
      if (s.pedMat) s.pedMat.color.setHex(green ? 0xffffff : 0xff5522);
    }

    // Animate Highway Toll Boom Barriers + Live Toll Tax Deduction / Evasion Trigger!
    for (let i = 0; i < tollPlazas.length; i++) {
      const tp = tollPlazas[i];
      if (tp.cooldown > 0) tp.cooldown = Math.max(0, tp.cooldown - dt);
      const dist = actorPos ? Math.hypot(actorPos.x - tp.x, actorPos.z - tp.z) : 999;
      const shouldOpen = dist < 24;
      const targetOpen = shouldOpen ? 1 : 0;
      tp.openRatio = THREE.MathUtils.damp(tp.openRatio, targetOpen, 7.5, dt);
      const ang = tp.openRatio * 1.32;
      for (let g = 0; g < tp.gatePivots.length; g++) {
        const gp = tp.gatePivots[g];
        gp.piv.rotation.z = gp.dir * ang;
      }
      const lampHex = tp.openRatio > 0.35 ? 0x22ff88 : 0xffcc22;
      tp.lampMats[0].color.setHex(lampHex);
      tp.lampMats[1].color.setHex(lampHex);

      // Trigger toll tax when player drives directly through the toll gantry!
      if (isDriving && dist < 9.5 && tp.cooldown <= 0) {
        tp.cooldown = 16.0;
        if (typeof onTollEvent === 'function') {
          onTollEvent({
            id: tp.id,
            title: tp.title,
            fee: tp.fee,
            speedKmh: actorSpeedKmh
          });
        }
      }
    }

    // Move Live Highway Traffic along ALL Leonida Interstates (with road slope pitch + player brake courtesy!)
    for (let i = 0; i < trafficCars.length; i++) {
      const tc = trafficCars[i];
      let stepScale = 1.0;
      if (actorPos && tc.mesh.visible) {
        const adx = tc.mesh.position.x - actorPos.x;
        const adz = tc.mesh.position.z - actorPos.z;
        if (adx * adx + adz * adz < 81) stepScale = 0.25;
      }
      tc.t += tc.dir * tc.speed * stepScale * dt;
      if (tc.t > 0.96) { tc.t = 0.96; tc.dir = -1; tc.laneOffset = -tc.laneOffset; }
      else if (tc.t < 0.04) { tc.t = 0.04; tc.dir = 1; tc.laneOffset = -tc.laneOffset; }

      const fIdx = tc.t * (tc.pts.length - 1);
      const idx = Math.floor(fIdx);
      const frac = fIdx - idx;
      const a = tc.pts[idx];
      const b = tc.pts[Math.min(tc.pts.length - 1, idx + 1)];
      const px = a.x + (b.x - a.x) * frac;
      const pz = a.z + (b.z - a.z) * frac;
      if (isInCoreViceFootprint(px, pz)) {
        tc.mesh.visible = false;
        continue;
      }
      const dx = (b.x - a.x) * tc.dir;
      const dz = (b.z - a.z) * tc.dir;
      const dy = (b.y - a.y) * tc.dir;
      const len = Math.hypot(dx, dz) || 1;
      const rx = -dz / len, rz = dx / len;
      const fx = px + rx * tc.laneOffset;
      const fz = pz + rz * tc.laneOffset;
      if (actorPos) {
        const cdx = fx - actorPos.x, cdz = fz - actorPos.z;
        const vis = (cdx * cdx + cdz * cdz) < 230400; // 480m highway visibility range
        tc.mesh.visible = vis;
        if (!vis) continue;
      } else {
        tc.mesh.visible = true;
      }
      const fy = (a.y + (b.y - a.y) * frac) + 0.16;
      tc.mesh.position.set(fx, fy, fz);
      tc.mesh.rotation.order = 'YXZ';
      tc.mesh.rotation.y = Math.atan2(dx, dz);
      tc.mesh.rotation.x = THREE.MathUtils.clamp(-Math.atan2(dy, len), -0.32, 0.32);
    }
  }

  return {
    tollPlazasCount: tollPlazas.length,
    trafficSignalsCount: trafficSignals.length,
    signsCount: signPosts.length,
    billboardsCount: bbLocations.length,
    gasStationsCount: gasSpecs.length,
    extraBuildings,
    rocksCount: rockPts.length,
    bushesCount: bushPts.length,
    trafficCount: trafficCars.length,
    kalagaRopeway,
    update
  };
}

// ============================================================================
// 11. ANIMATED 3D MOUNTAIN ROPEWAY / AERIAL GONDOLA BUILDER (MOUNT VICE & KALAGA!)
//     Multi-part concrete & steel stations, rotating bullwheels, grounded steel
//     lattice pylons with roller sheaves, twin taut haul cables, & animated
//     panoramic glass gondola cabins with subtle wind sway & warm night lights!
// ============================================================================
function makeRopewaySignTex(title, subtitle) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 512, 128);
  g.addColorStop(0, '#12263a');
  g.addColorStop(1, '#1e4664');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#ffbe3b';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 502, 118);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 62);
  ctx.fillStyle = '#ffcf5c';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, 256, 100);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function buildMountainRopeway({
  root,
  id = 'ropeway',
  title = 'ALPINE SKYWAY',
  subtitle = 'PANORAMIC GONDOLA',
  startPos,
  endPos,
  numPylons = 4,
  numCabins = 6,
  clearanceY = 14.5,
  speed = 0.036,
  getHeight,
  pbr = null,
  addCircleCollider = null,
  addBoxCollider = null
}) {
  const grp = new THREE.Group();
  const sx = startPos.x, sz = startPos.z;
  const ex = endPos.x, ez = endPos.z;
  const sy = getHeight(sx, sz);
  const ey = getHeight(ex, ez);
  const dx = ex - sx, dz = ez - sz;
  const horizSpan = Math.hypot(dx, dz) || 1;
  const fwdX = dx / horizSpan, fwdZ = dz / horizSpan;
  const rightX = -fwdZ, rightZ = fwdX; // lateral right axis for twin cables
  const yaw = Math.atan2(dx, dz);
  const gauge = 3.2; // half-spacing between uphill (+gauge) & downhill (-gauge) cables

  const steelMat = (pbr && pbr.brushedSteelMat) || new THREE.MeshStandardMaterial({ color: 0x62707d, metalness: 0.72, roughness: 0.34 });
  const darkSteelMat = (pbr && pbr.darkMetalMat) || new THREE.MeshStandardMaterial({ color: 0x262e38, metalness: 0.76, roughness: 0.38 });
  const concreteMat = (pbr && pbr.concreteMat) || new THREE.MeshStandardMaterial({ color: 0x8e9296, roughness: 0.90 });
  const timberMat = (pbr && pbr.timberMat) || new THREE.MeshStandardMaterial({ color: 0x7a4e2e, roughness: 0.84 });
  const safetyYellowMat = new THREE.MeshStandardMaterial({ color: 0xf4b828, roughness: 0.42, metalness: 0.25 });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x1e2228, metalness: 0.82, roughness: 0.32 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x8ad8f8, roughness: 0.10, metalness: 0.65, transparent: true, opacity: 0.62 });
  const signMat = new THREE.MeshStandardMaterial({
    map: makeRopewaySignTex(title, subtitle),
    roughness: 0.42,
    emissive: 0x22384c,
    emissiveIntensity: 0.45
  });

  // 1. Compute cable anchor points (Base Station -> Pylon 1..N -> Summit Station)
  const nodes = [];
  const baseCableY = sy + 7.2;
  const summitCableY = ey + 7.2;
  nodes.push({ x: sx, z: sz, groundY: sy, cableY: baseCableY, isStation: true });
  for (let i = 1; i <= numPylons; i++) {
    const t = i / (numPylons + 1);
    const px = sx + dx * t;
    const pz = sz + dz * t;
    const gy = getHeight(px, pz);
    const linearY = baseCableY + (summitCableY - baseCableY) * t;
    // Guarantee generous clearance above terrain & mountain switchbacks beneath the span!
    let maxUnderY = gy;
    for (let s = -2; s <= 2; s++) {
      const sampleT = THREE.MathUtils.clamp(t + (s * 0.04), 0.03, 0.97);
      const uy = getHeight(sx + dx * sampleT, sz + dz * sampleT);
      if (uy > maxUnderY) maxUnderY = uy;
    }
    const cableY = Math.max(linearY + 2.5, maxUnderY + clearanceY);
    nodes.push({ x: px, z: pz, groundY: gy, cableY, isStation: false });
  }
  nodes.push({ x: ex, z: ez, groundY: ey, cableY: summitCableY, isStation: true });

  // Smooth intermediate pylon heights slightly so cable profile flows naturally
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < nodes.length - 1; i++) {
      const avg = (nodes[i - 1].cableY + nodes[i + 1].cableY) * 0.5;
      if (nodes[i].cableY < avg - 4.0) nodes[i].cableY = avg - 4.0;
    }
  }

  // 2. Build Base & Summit Terminal Stations with Rotating Bullwheels!
  const bullwheels = [];
  const stationLights = [];
  function buildStation(node, isSummit) {
    const st = new THREE.Group();
    st.position.set(node.x, node.groundY, node.z);
    st.rotation.y = yaw + (isSummit ? Math.PI : 0);

    // Deep concrete foundation pier extending 24m into mountain slope so ZERO floating gap on steep cliffs!
    const pier = new THREE.Mesh(new THREE.BoxGeometry(11.6, 24.0, 12.8), concreteMat);
    pier.position.set(0, -10.6, 0);
    st.add(pier);

    // Boarding platform deck + yellow safety edge strip + front access steps
    const deck = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.55, 13.4), concreteMat);
    deck.position.set(0, 1.45, 0);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.08, 0.45), safetyYellowMat);
    stripe.position.set(0, 1.75, 6.2);
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.55, 1.2), concreteMat);
    step1.position.set(0, 0.95, 7.1);
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.55, 1.2), concreteMat);
    step2.position.set(0, 0.42, 8.1);
    st.add(deck, stripe, step1, step2);

    // 4 Structural Steel Portal Columns
    for (const [cx, cz] of [[-5.1, -5.4], [5.1, -5.4], [-5.1, 4.6], [5.1, 4.6]]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.40, 7.6, 8), darkSteelMat);
      col.position.set(cx, 5.2, cz);
      st.add(col);
    }

    // Elevated Machinery Truss & Sloped Alpine Timber-Steel Roof Canopy
    const truss = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.65, 11.4), steelMat);
    truss.position.set(0, 8.9, -0.4);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(13.0, 0.42, 13.6), timberMat);
    roof.position.set(0, 9.6, -0.4);
    roof.rotation.x = 0.08;
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.22, 13.8), darkSteelMat);
    roofCap.position.set(0, 9.88, -0.4);
    roofCap.rotation.x = 0.08;
    st.add(truss, roof, roofCap);

    // Glowing Station Fascia Sign (visible from approach & cable!)
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.1, 0.28), signMat);
    signBoard.position.set(0, 8.6, 5.8);
    const signBack = signBoard.clone();
    signBack.position.set(0, 8.6, -6.4);
    signBack.rotation.y = Math.PI;
    st.add(signBoard, signBack);

    // Rotating Horizontal Bullwheel (exact radius = gauge so cables wrap tangentially!)
    const bw = new THREE.Group();
    bw.position.set(0, 7.2, -1.2);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(gauge, 0.24, 10, 28), safetyYellowMat);
    rim.rotation.x = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.84, 1.3, 12), darkSteelMat);
    bw.add(rim, hub);
    for (let sp = 0; sp < 6; sp++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(gauge * 1.95, 0.18, 0.20), steelMat);
      spoke.rotation.y = (sp * Math.PI) / 6;
      bw.add(spoke);
    }
    st.add(bw);
    bullwheels.push(bw);

    // Operator Control Booth + Warm Platform Lamp
    const booth = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.0, 3.2), darkSteelMat);
    booth.position.set(-4.2, 3.2, -3.2);
    const boothWin = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.35, 2.2), glassMat);
    boothWin.position.set(-4.2, 3.6, -3.0);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe4a0 });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.18, 0.36), lampMat);
    lamp.position.set(0, 8.35, 2.2);
    stationLights.push(lampMat);
    st.add(booth, boothWin, lamp);

    grp.add(st);
    if (addCircleCollider) addCircleCollider(node.x, node.z, 5.2);
  }
  buildStation(nodes[0], false);
  buildStation(nodes[nodes.length - 1], true);

  // 3. Build Grounded Intermediate Steel Lattice Support Pylons + Roller Sheaves!
  const sheaveGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.22, 10);
  for (let i = 1; i < nodes.length - 1; i++) {
    const n = nodes[i];
    const pyl = new THREE.Group();
    pyl.position.set(n.x, n.groundY, n.z);
    pyl.rotation.y = yaw;

    const towerH = Math.max(8.5, n.cableY - n.groundY);
    // Concrete footing embedded into mountain slope
    const footing = new THREE.Mesh(new THREE.BoxGeometry(4.4, 6.0, 4.4), concreteMat);
    footing.position.y = -2.2;
    pyl.add(footing);

    // Tapered Twin Steel A-Frame Legs + Cross Bracing
    const legH = towerH + 0.6;
    const legGeo = new THREE.CylinderGeometry(0.24, 0.46, legH, 8);
    const legL = new THREE.Mesh(legGeo, steelMat);
    legL.position.set(-1.05, legH * 0.5, 0);
    legL.rotation.z = -0.065;
    const legR = new THREE.Mesh(legGeo, steelMat);
    legR.position.set(1.05, legH * 0.5, 0);
    legR.rotation.z = 0.065;
    pyl.add(legL, legR);

    // Horizontal & Diagonal Lattice Braces
    const braceLevels = Math.max(3, Math.floor(towerH / 4.2));
    for (let b = 1; b < braceLevels; b++) {
      const bt = b / braceLevels;
      const by = bt * towerH;
      const bw = 2.6 * (1 - bt * 0.45);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.20, 0.22), darkSteelMat);
      bar.position.y = by;
      const diag = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.15, 0.14, 0.16), darkSteelMat);
      diag.position.y = by - (towerH / braceLevels) * 0.45;
      diag.rotation.z = (b % 2 === 0 ? 1 : -1) * 0.55;
      pyl.add(bar, diag);
    }

    // Overhead Steel Cross-Arm + Maintenance Catwalk + Dual Roller Sheave Batteries!
    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(gauge * 2 + 1.8, 0.52, 0.72), darkSteelMat);
    crossArm.position.y = towerH;
    const catwalk = new THREE.Mesh(new THREE.BoxGeometry(gauge * 2 + 2.4, 0.14, 1.2), safetyYellowMat);
    catwalk.position.set(0, towerH - 0.52, -0.5);
    pyl.add(crossArm, catwalk);

    for (const side of [-1, 1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 3.6), steelMat);
      beam.position.set(side * gauge, towerH + 0.24, 0);
      pyl.add(beam);
      for (const szOff of [-1.25, -0.42, 0.42, 1.25]) {
        const wheel = new THREE.Mesh(sheaveGeo, safetyYellowMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * gauge, towerH + 0.18, szOff);
        pyl.add(wheel);
      }
    }

    grp.add(pyl);
    if (addCircleCollider) addCircleCollider(n.x, n.z, 2.3);
  }

  // 4. Span Twin Taut Steel Cables (Uphill & Downhill Tracks) across All Nodes!
  const _pA = new THREE.Vector3();
  const _pB = new THREE.Vector3();
  const _mid = new THREE.Vector3();
  const _dir = new THREE.Vector3();
  const _up = new THREE.Vector3(0, 1, 0);

  for (const side of [-1, 1]) {
    const ox = rightX * side * gauge;
    const oz = rightZ * side * gauge;
    for (let i = 0; i < nodes.length - 1; i++) {
      _pA.set(nodes[i].x + ox, nodes[i].cableY, nodes[i].z + oz);
      _pB.set(nodes[i + 1].x + ox, nodes[i + 1].cableY, nodes[i + 1].z + oz);
      const segLen = _pA.distanceTo(_pB);
      _mid.copy(_pA).add(_pB).multiplyScalar(0.5);
      _dir.copy(_pB).sub(_pA).normalize();

      // Primary haul cable + upper track cable for crisp silhouette from afar
      for (const yOff of [0, 0.34]) {
        const cMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, segLen, 6), cableMat);
        cMesh.position.set(_mid.x, _mid.y + yOff, _mid.z);
        cMesh.quaternion.setFromUnitVectors(_up, _dir);
        grp.add(cMesh);
      }
    }
  }

  // 5. Build Animated Multi-Part Panoramic Glass Gondola Cabins!
  const cabinColors = [0xe63946, 0xffbe0b, 0x00b4d8, 0xff6b35, 0x2ec4b6, 0x3a86ff];
  const gondolas = [];
  const cabinLightMats = [];

  for (let i = 0; i < numCabins; i++) {
    const cab = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({
      color: cabinColors[i % cabinColors.length],
      roughness: 0.28,
      metalness: 0.45
    });

    // Cable Grip Clamp + Curved Steel Hanger Arm
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.34, 0.95), darkSteelMat);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.35, 7), steelMat);
    arm.position.y = -1.18;
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.28), darkSteelMat);
    yoke.position.y = -2.28;

    // Gondola Body Pivot (sways gently beneath cable!)
    const bodyGrp = new THREE.Group();
    bodyGrp.position.y = -2.35;

    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.28, 3.05), paint);
    cabRoof.position.y = -0.14;
    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(2.22, 1.38, 2.92), glassMat);
    cabGlass.position.y = -0.96;
    const cabLower = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.92, 3.06), paint);
    cabLower.position.y = -2.08;
    const cabBumper = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.16, 3.14), darkSteelMat);
    cabBumper.position.y = -2.56;

    // Corner Steel Mullions framing panoramic windows
    for (const [mx, mz] of [[-1.12, -1.46], [1.12, -1.46], [-1.12, 1.46], [1.12, 1.46]]) {
      const mul = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.42, 0.12), darkSteelMat);
      mul.position.set(mx, -0.96, mz);
      bodyGrp.add(mul);
    }

    // Warm Interior Ceiling Lamp (illuminates cabin cleanly at sunset & night!)
    const intLightMat = new THREE.MeshBasicMaterial({ color: 0xffe099 });
    const intLamp = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.10, 1.5), intLightMat);
    intLamp.position.y = -0.34;
    cabinLightMats.push(intLightMat);

    // Interior bench seats
    const benchL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.36, 2.3), timberMat);
    benchL.position.set(-0.78, -2.05, 0);
    const benchR = benchL.clone();
    benchR.position.x = 0.78;

    bodyGrp.add(cabRoof, cabGlass, cabLower, cabBumper, intLamp, benchL, benchR);
    cab.add(grip, arm, yoke, bodyGrp);
    grp.add(cab);

    gondolas.push({
      mesh: cab,
      bodyGrp,
      t: i / numCabins, // [0..1) closed loop: 0..0.5 uphill (+gauge), 0.5..1.0 downhill (-gauge)
      phase: i * 1.37
    });
  }

  root.add(grp);

  // Helper: evaluate exact 3D cable point along polyline nodes for u in [0..1]
  function sampleCablePath(u, side, outPos) {
    const f = THREE.MathUtils.clamp(u, 0, 1) * (nodes.length - 1);
    const idx = Math.min(nodes.length - 2, Math.floor(f));
    const frac = f - idx;
    const n0 = nodes[idx];
    const n1 = nodes[idx + 1];
    // Slight realistic catenary sag in the middle of each span
    const sag = Math.sin(frac * Math.PI) * 1.15;
    outPos.set(
      n0.x + (n1.x - n0.x) * frac + rightX * side * gauge,
      n0.cableY + (n1.cableY - n0.cableY) * frac - sag,
      n0.z + (n1.z - n0.z) * frac + rightZ * side * gauge
    );
  }

  const _cPos = new THREE.Vector3();
  function update(dt, elapsed = 0, nightMix = 0) {
    // Rotate base & summit bullwheels
    for (let i = 0; i < bullwheels.length; i++) {
      bullwheels[i].rotation.y += dt * 1.15;
    }

    // Advance every gondola smoothly around the continuous closed cable loop!
    for (let i = 0; i < gondolas.length; i++) {
      const g = gondolas[i];
      g.t = (g.t + dt * speed) % 1.0;

      if (g.t < 0.46) {
        // Ascending track (+gauge)
        const u = g.t / 0.46;
        sampleCablePath(u, 1, _cPos);
        g.mesh.position.copy(_cPos);
        g.mesh.rotation.y = yaw;
      } else if (g.t < 0.50) {
        // Turning smoothly around Summit Bullwheel (+gauge -> -gauge)
        const turnAng = ((g.t - 0.46) / 0.04) * Math.PI;
        const cLat = Math.cos(turnAng) * gauge;
        const cFwd = Math.sin(turnAng) * gauge;
        const top = nodes[nodes.length - 1];
        g.mesh.position.set(
          top.x + rightX * cLat + fwdX * cFwd,
          top.cableY,
          top.z + rightZ * cLat + fwdZ * cFwd
        );
        g.mesh.rotation.y = yaw - turnAng;
      } else if (g.t < 0.96) {
        // Descending track (-gauge)
        const u = 1.0 - (g.t - 0.50) / 0.46;
        sampleCablePath(u, -1, _cPos);
        g.mesh.position.copy(_cPos);
        g.mesh.rotation.y = yaw + Math.PI;
      } else {
        // Turning smoothly around Base Bullwheel (-gauge -> +gauge)
        const turnAng = ((g.t - 0.96) / 0.04) * Math.PI;
        const cLat = -Math.cos(turnAng) * gauge;
        const cFwd = -Math.sin(turnAng) * gauge;
        const bot = nodes[0];
        g.mesh.position.set(
          bot.x + rightX * cLat + fwdX * cFwd,
          bot.cableY,
          bot.z + rightZ * cLat + fwdZ * cFwd
        );
        g.mesh.rotation.y = yaw + Math.PI - turnAng;
      }

      // Natural alpine wind pendulum sway!
      g.bodyGrp.rotation.z = Math.sin(elapsed * 1.45 + g.phase) * 0.048;
      g.bodyGrp.rotation.x = Math.cos(elapsed * 1.05 + g.phase) * 0.025;
    }

    // Brighten cabin interior lamps at dusk/night
    const warmCol = nightMix > 0.35 ? 0xffe49e : 0xc8d8e6;
    for (let i = 0; i < cabinLightMats.length; i++) {
      cabinLightMats[i].color.setHex(warmCol);
    }
  }

  // Initial placement so frame 0 renders perfectly
  update(0, 0, 0);

  return {
    id,
    title,
    root: grp,
    gondolas,
    basePos: { x: sx, y: sy, z: sz },
    summitPos: { x: ex, y: ey, z: ez },
    baseBoardPos: { x: sx - fwdX * 8.2, y: getHeight(sx - fwdX * 8.2, sz - fwdZ * 8.2), z: sz - fwdZ * 8.2 },
    summitBoardPos: { x: ex + fwdX * 8.2, y: getHeight(ex + fwdX * 8.2, ez + fwdZ * 8.2), z: ez + fwdZ * 8.2 },
    update
  };
}

