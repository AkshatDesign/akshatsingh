/* ==========================================================================
   VICE CITY 3D — HIGH-DETAIL COMPOSITE 3D ASSET BUILDERS (v4)
   - Sculpted 1986 Supercar with live reflection-ready clearcoat PBR paint
   - 3 Distinct Architectural Building Archetypes (Art Deco Hotels with 3D
     Balconies & Striped Awnings, Midtown Terraced Condos, Downtown Glass
     Curtain-Wall Skyscrapers with Helipads & Spires) + 5 Portfolio Showrooms
   - 14-Frond 3D Arching Palm Trees, Sculpted Traffic Coupes & GTA Pedestrians
   ========================================================================== */
import * as THREE from 'https://esm.sh/three@0.187.0';
import {
  makeArtDecoFacadeTextures,
  makeSkyscraperGlassTextures,
  makeLobbyGlassTexture,
  makeAwningTexture,
  makeNeonSignTexture,
  makeContactShadowTexture,
  makeLicensePlateTexture
} from './vice-env.js?v=7';

export const PAINTS = [
  { name: 'Rosso Vice',      swatch: '#C8142E', color: 0xbf122c, metalness: 0.62, roughness: 0.16, caliper: 0xf0c248, rim: 0xd8c494, underglow: 0xe63554 },
  { name: 'Miami Pearl',     swatch: '#EAE6F0', color: 0xe2dde8, metalness: 0.42, roughness: 0.18, caliper: 0xd91848, rim: 0xc8ceda, underglow: 0x1ad6c4 },
  { name: 'Midnight Cobalt', swatch: '#1D4294', color: 0x1b3f8f, metalness: 0.72, roughness: 0.15, caliper: 0xf0c248, rim: 0xd6dce6, underglow: 0x21e6d1 },
  { name: 'Starfish Teal',   swatch: '#0E9E98', color: 0x0d948e, metalness: 0.64, roughness: 0.16, caliper: 0xff2e88, rim: 0xe2cc94, underglow: 0x21e6d1 }
];

/* ==========================================================================
   1. SCULPTED 1986 EXOTIC SUPERCAR (LIVE REFLECTION READY)
   ========================================================================== */
export function createSupercar(isSoftwareGl) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const p0 = PAINTS[0];
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: p0.color,
    metalness: p0.metalness,
    roughness: p0.roughness,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.25
  });
  const carbonMat = new THREE.MeshStandardMaterial({ color: 0x181720, metalness: 0.35, roughness: 0.46 });
  const darkVentMat = new THREE.MeshStandardMaterial({ color: 0x0b0b10, metalness: 0.15, roughness: 0.85 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d1626,
    metalness: 0.25,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.55
  });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdce2ec, metalness: 0.94, roughness: 0.12, envMapIntensity: 1.35 });
  const rimMat = new THREE.MeshStandardMaterial({ color: p0.rim, metalness: 0.86, roughness: 0.20, envMapIntensity: 1.2 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: p0.caliper, metalness: 0.34, roughness: 0.36 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x14141a, metalness: 0.04, roughness: 0.88 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xc81428, emissive: 0xe61830, emissiveIntensity: 1.15, roughness: 0.22 });
  const headLensMat = new THREE.MeshStandardMaterial({ color: 0xfff4da, emissive: 0xffefc6, emissiveIntensity: 1.35, roughness: 0.14 });
  const engineRedMat = new THREE.MeshStandardMaterial({ color: 0xc2142b, metalness: 0.55, roughness: 0.32 });

  // Sculpted wedge lower monocoque (stops cleanly at beltline so dark reflective glass greenhouse shines!)
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-2.18, 0.24);
  bodyShape.lineTo(2.24, 0.22);
  bodyShape.lineTo(2.28, 0.40);
  bodyShape.quadraticCurveTo(1.78, 0.66, 0.96, 0.74);
  bodyShape.lineTo(-1.82, 0.80);
  bodyShape.lineTo(-2.22, 0.78);
  bodyShape.lineTo(-2.24, 0.34);
  bodyShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 1.72, bevelEnabled: true, bevelThickness: 0.11, bevelSize: 0.08, bevelSegments: 4
  });
  bodyGeo.translate(0, 0, -0.86);
  bodyGeo.rotateY(Math.PI / 2);
  const mainBody = new THREE.Mesh(bodyGeo, paintMat);
  mainBody.castShadow = !isSoftwareGl;
  mainBody.receiveShadow = true;
  bodyGroup.add(mainBody);

  // Widebody rear haunches
  const haunchShape = new THREE.Shape();
  haunchShape.moveTo(-2.18, 0.28);
  haunchShape.lineTo(-0.28, 0.26);
  haunchShape.lineTo(-0.18, 0.68);
  haunchShape.quadraticCurveTo(-1.15, 0.84, -2.18, 0.78);
  haunchShape.closePath();
  const haunchGeo = new THREE.ExtrudeGeometry(haunchShape, {
    depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3
  });
  haunchGeo.translate(0, 0, -0.11);
  haunchGeo.rotateY(Math.PI / 2);
  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(haunchGeo, paintMat);
    h.position.x = side * 0.92;
    h.castShadow = !isSoftwareGl;
    bodyGroup.add(h);
  }

  // Front fenders, carbon aero splitter, side skirts & finned rear diffuser
  const fenderGeo = new THREE.BoxGeometry(0.18, 0.38, 1.24);
  for (const side of [-1, 1]) {
    const f = new THREE.Mesh(fenderGeo, paintMat);
    f.position.set(side * 0.91, 0.44, -1.42);
    bodyGroup.add(f);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 2.38), carbonMat);
    skirt.position.set(side * 0.96, 0.2, 0.0);
    bodyGroup.add(skirt);
    // Testarossa side strakes
    const duct = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 1.28), darkVentMat);
    duct.position.set(side * 0.99, 0.52, 0.48);
    bodyGroup.add(duct);
    for (let s = 0; s < 4; s++) {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.032, 1.32 - s * 0.08), paintMat);
      strake.position.set(side * 1.03, 0.40 + s * 0.085, 0.50 + s * 0.03);
      bodyGroup.add(strake);
    }
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.09, 0.14), paintMat);
    mirror.position.set(side * 0.96, 0.88, -0.54);
    bodyGroup.add(mirror);
  }

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.08, 0.56), carbonMat);
  splitter.position.set(0, 0.19, -2.14);
  bodyGroup.add(splitter);
  const frontIntake = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.16, 0.12), darkVentMat);
  frontIntake.position.set(0, 0.27, -2.31);
  bodyGroup.add(frontIntake);

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.22, 0.36), carbonMat);
  diffuser.position.set(0, 0.24, 2.16);
  bodyGroup.add(diffuser);
  for (let i = -2; i <= 2; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.34), carbonMat);
    fin.position.set(i * 0.28, 0.21, 2.24);
    bodyGroup.add(fin);
  }

  // Sleek Wraparound Dark Reflective Glass Greenhouse + Painted Roof Cap & Flying Buttresses!
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.98, 0.76);
  cabinShape.lineTo(1.06, 0.72);
  cabinShape.lineTo(0.26, 1.19);
  cabinShape.lineTo(-0.56, 1.19);
  cabinShape.closePath();
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 1.54, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 3
  });
  cabinGeo.translate(0, 0, -0.77);
  cabinGeo.rotateY(Math.PI / 2);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  bodyGroup.add(cabin);

  // Sleek painted roof panel & Testarossa flying rear buttresses framing the dark glass engine bay
  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.88), paintMat);
  roofCap.position.set(0, 1.22, 0.14);
  bodyGroup.add(roofCap);
  for (const side of [-1, 1]) {
    const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 1.38), paintMat);
    buttress.position.set(side * 0.72, 1.02, 1.15);
    buttress.rotation.x = -0.26;
    bodyGroup.add(buttress);
  }

  // Rear V12 engine bay & louvers
  const engineWell = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.16, 1.14), darkVentMat);
  engineWell.position.set(0, 0.87, 1.24);
  bodyGroup.add(engineWell);
  for (const side of [-0.26, 0.26]) {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.92), engineRedMat);
    bank.position.set(side, 0.92, 1.24);
    bodyGroup.add(bank);
  }
  for (let l = 0; l < 6; l++) {
    const louver = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.026, 0.1), carbonMat);
    louver.position.set(0, 0.99 - l * 0.025, 0.78 + l * 0.18);
    louver.rotation.x = 0.26;
    bodyGroup.add(louver);
  }

  // Elevated rear wing
  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.06, 0.36), paintMat);
  wingBlade.position.set(0, 1.18, 2.02);
  wingBlade.rotation.x = 0.09;
  wingBlade.castShadow = !isSoftwareGl;
  bodyGroup.add(wingBlade);
  for (const side of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.36, 0.22), paintMat);
    strut.position.set(side * 0.68, 0.98, 1.98);
    bodyGroup.add(strut);
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22, 0.44), paintMat);
    endplate.position.set(side * 1.04, 1.15, 2.02);
    bodyGroup.add(endplate);
  }

  // Pop-up headlights + warm SpotLights
  const popPods = [];
  const headLights = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.66, 0.56, -1.86);
    const podHousing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.34), paintMat);
    podHousing.position.set(0, 0.05, -0.14);
    pivot.add(podHousing);
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.09, 0.04), headLensMat);
    lens.position.set(0, 0.045, -0.31);
    pivot.add(lens);
    bodyGroup.add(pivot);
    popPods.push(pivot);

    const spot = new THREE.SpotLight(0xfff0cc, 1.35, 22, 0.42, 0.90, 2.0);
    spot.position.set(side * 0.66, 0.60, -2.28);
    spot.target.position.set(side * 0.80, 0.0, -18);
    bodyGroup.add(spot);
    bodyGroup.add(spot.target);
    headLights.push(spot);
  }

  // Slatted Rear Taillights + License Plate
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.17, 0.08), tailMat);
  tailBar.position.set(0, 0.62, 2.28);
  bodyGroup.add(tailBar);
  for (let i = -1; i <= 1; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.022, 0.11), darkVentMat);
    slat.position.set(0, 0.62 + i * 0.055, 2.29);
    bodyGroup.add(slat);
  }
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.22),
    new THREE.MeshStandardMaterial({ map: makeLicensePlateTexture(), roughness: 0.46, metalness: 0.12 })
  );
  plate.position.set(0, 0.40, 2.34);
  bodyGroup.add(plate);

  // Quad Titanium Exhausts + Nitro Flames
  const nitroFlames = [];
  const flameOuterMat = new THREE.MeshBasicMaterial({ color: 0x21e6d1, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xffc660, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  [-0.66, -0.50, 0.50, 0.66].forEach((ex) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.22, 14), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(ex, 0.22, 2.34);
    bodyGroup.add(pipe);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.072, 0.88, 10), flameOuterMat);
    flame.rotation.x = Math.PI / 2;
    flame.position.set(ex, 0.22, 2.80);
    bodyGroup.add(flame);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.46, 8), flameCoreMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(ex, 0.22, 2.62);
    bodyGroup.add(core);
    nitroFlames.push(flame, core);
  });

  // Ground Contact Shadow (Clean offset above road so ZERO Z-fighting)
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.75, 5.45),
    new THREE.MeshBasicMaterial({
      map: makeContactShadowTexture(), transparent: true, opacity: 0.78, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.035;
  root.add(contactShadow);

  const brakeLight = new THREE.PointLight(0xe61932, 0.6, 5.4, 2.0);
  brakeLight.position.set(0, 0.58, 2.65);
  bodyGroup.add(brakeLight);

  // 4 Multi-Part Deep-Dish 5-Spoke Alloy Wheels + Calipers
  const wheelSpinGroups = [];
  const frontSteerGroups = [];
  [
    { x: -0.95, z: -1.36, r: 0.34, w: 0.28, front: true },
    { x:  0.95, z: -1.36, r: 0.34, w: 0.28, front: true },
    { x: -1.00, z:  1.34, r: 0.37, w: 0.35, front: false },
    { x:  1.00, z:  1.34, r: 0.37, w: 0.35, front: false }
  ].forEach((wd) => {
    const knuckle = new THREE.Group();
    knuckle.position.set(wd.x, wd.r, wd.z);
    root.add(knuckle);
    if (wd.front) frontSteerGroups.push(knuckle);

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.12), caliperMat);
    caliper.position.set(wd.x > 0 ? 0.02 : -0.02, 0.04, wd.front ? 0.14 : -0.14);
    knuckle.add(caliper);

    const spinGroup = new THREE.Group();
    knuckle.add(spinGroup);
    wheelSpinGroups.push(spinGroup);

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(wd.r, wd.r, wd.w, 24), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = !isSoftwareGl;
    spinGroup.add(tire);

    const rimLip = new THREE.Mesh(new THREE.CylinderGeometry(wd.r * 0.72, wd.r * 0.72, wd.w + 0.015, 20), rimMat);
    rimLip.rotation.z = Math.PI / 2;
    spinGroup.add(rimLip);

    const inner = new THREE.Mesh(new THREE.CylinderGeometry(wd.r * 0.62, wd.r * 0.62, wd.w + 0.02, 16), darkVentMat);
    inner.rotation.z = Math.PI / 2;
    spinGroup.add(inner);

    const outX = wd.x > 0 ? wd.w * 0.44 : -wd.w * 0.44;
    for (let s = 0; s < 5; s++) {
      const ang = (s / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.03, wd.r * 0.62, 0.055), rimMat);
      spoke.position.set(outX, Math.cos(ang) * wd.r * 0.30, Math.sin(ang) * wd.r * 0.30);
      spoke.rotation.x = ang;
      spinGroup.add(spoke);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), chromeMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.x = outX + (wd.x > 0 ? 0.015 : -0.015);
    spinGroup.add(hub);
  });

  function applyPaint(idx) {
    const p = PAINTS[idx % PAINTS.length];
    paintMat.color.setHex(p.color);
    paintMat.metalness = p.metalness;
    paintMat.roughness = p.roughness;
    caliperMat.color.setHex(p.caliper);
    rimMat.color.setHex(p.rim);
  }

  function setDynamicEnvMap(cubeTex) {
    paintMat.envMap = cubeTex;
    glassMat.envMap = cubeTex;
    chromeMat.envMap = cubeTex;
    paintMat.needsUpdate = true;
    glassMat.needsUpdate = true;
    chromeMat.needsUpdate = true;
  }

  return {
    root, bodyGroup, wheelSpinGroups, frontSteerGroups, popPods,
    headLights, headLensMat, tailMat, brakeLight,
    flameOuterMat, flameCoreMat, nitroFlames, applyPaint, setDynamicEnvMap
  };
}

/* ==========================================================================
   2. SCULPTED 14-FROND 3D ARCHING TROPICAL PALM TREES & SHRUBS
   ========================================================================== */
export function buildArchingFrondGeometry(length, width, archLift, droop) {
  const segW = 2;
  const segL = 9;
  const geo = new THREE.BufferGeometry();
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= segL; j++) {
    const t = j / segL;
    const z = t * length;
    const centerY = Math.sin(t * Math.PI * 0.66) * archLift - Math.pow(t, 2.05) * droop;
    const halfW = (width * 0.5) * Math.sin(Math.pow(t, 0.7) * Math.PI * 0.92 + 0.12);
    for (let i = 0; i <= segW; i++) {
      const u = (i / segW) * 2 - 1;
      const x = u * halfW;
      const vFold = -Math.abs(u) * (0.24 + t * 0.14);
      positions.push(x, centerY + vFold, z);
      uvs.push(i / segW, t);
    }
  }
  for (let j = 0; j < segL; j++) {
    for (let i = 0; i < segW; i++) {
      const a = j * (segW + 1) + i;
      const b = a + 1;
      const c = a + (segW + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createRealisticPalmTree(assets, height, curveAmt) {
  const g = new THREE.Group();
  const segs = 9;
  let y = 0;
  let x = 0;
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const rBot = 0.28 * (1 - t * 0.44);
    const rTop = 0.25 * (1 - t * 0.46);
    const segH = height / segs;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, segH + 0.08, 8), assets.trunkMat);
    const lean = curveAmt * (t * 0.38);
    seg.position.set(x, y + segH * 0.5, 0);
    seg.rotation.z = -lean;
    seg.castShadow = assets.castShadow;
    g.add(seg);
    y += segH * Math.cos(lean);
    x += segH * Math.sin(lean);
  }
  const crown = new THREE.Group();
  crown.position.set(x, y, 0);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.65, 8), assets.collarMat);
  collar.position.y = -0.18;
  crown.add(collar);
  for (let c = 0; c < 3; c++) {
    const ang = (c / 3) * Math.PI * 2 + 0.4;
    const nut = new THREE.Mesh(assets.coconutGeo, assets.coconutMat);
    nut.position.set(Math.cos(ang) * 0.22, -0.24, Math.sin(ang) * 0.22);
    crown.add(nut);
  }
  for (let f = 0; f < 8; f++) {
    const fWrap = new THREE.Group();
    fWrap.rotation.y = (f / 8) * Math.PI * 2;
    const frond = new THREE.Mesh(assets.lowerFrondGeo, assets.frondMat);
    frond.position.y = -0.05;
    fWrap.add(frond);
    crown.add(fWrap);
  }
  for (let f = 0; f < 6; f++) {
    const fWrap = new THREE.Group();
    fWrap.rotation.y = (f / 6) * Math.PI * 2 + 0.35;
    const frond = new THREE.Mesh(assets.upperFrondGeo, assets.frondMat);
    frond.position.y = 0.08;
    fWrap.add(frond);
    crown.add(fWrap);
  }
  g.add(crown);
  g.userData.crown = crown;
  return g;
}

/* ==========================================================================
   3. ARCHITECTURAL BUILDINGS (ART DECO HOTELS, MIDTOWN CONDOS, GLASS TOWERS)
   ========================================================================== */
export function createArtDecoHotel(cfg, maxAniso, isSoftwareGl) {
  const g = new THREE.Group();
  const upperH = cfg.h - 4.4;
  const repX = Math.max(1, Math.round(cfg.w / 14));
  const repY = Math.max(1, Math.round(upperH / 12));
  const { map: facadeMap, emissiveMap: facadeEm, roughnessMap: facadeRough } = makeArtDecoFacadeTextures(
    cfg.base, cfg.trimHex, cfg.accentHex, cfg.seed, maxAniso, repX, repY
  );

  const wallMat = new THREE.MeshStandardMaterial({
    map: facadeMap,
    roughnessMap: facadeRough,
    emissive: new THREE.Color(0xffe6c4),
    emissiveMap: facadeEm,
    emissiveIntensity: 0.65,
    roughness: 0.85,
    metalness: 0.08,
    envMapIntensity: 0.9
  });
  const stuccoMat = new THREE.MeshStandardMaterial({ color: cfg.base, roughness: 0.86, metalness: 0.03 });
  const trimMat = new THREE.MeshStandardMaterial({ color: cfg.trimHex, roughness: 0.62, metalness: 0.12 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x24222c, metalness: 0.72, roughness: 0.34 });
  const neonMat = new THREE.MeshStandardMaterial({ color: cfg.accent, emissive: cfg.accent, emissiveIntensity: 1.55, roughness: 0.2 });
  const lobbyMat = new THREE.MeshStandardMaterial({
    map: makeLobbyGlassTexture(cfg.accentHex, maxAniso),
    emissive: 0xffd296,
    emissiveIntensity: 0.38,
    roughness: 0.22,
    metalness: 0.28,
    envMapIntensity: 1.15
  });
  const awningMat = new THREE.MeshStandardMaterial({ map: makeAwningTexture(cfg.accentHex), roughness: 0.84, side: THREE.DoubleSide });

  // Main upper stucco & window volume
  const main = new THREE.Mesh(new THREE.BoxGeometry(cfg.d, upperH, cfg.w), wallMat);
  main.position.set(0, 4.4 + upperH * 0.5, 0);
  main.castShadow = !isSoftwareGl;
  main.receiveShadow = true;
  g.add(main);

  // Recessed glazed ground-floor lobby & stone colonnade on BOTH East & West facades
  const lobby = new THREE.Mesh(new THREE.BoxGeometry(cfg.d - 1.2, 4.4, cfg.w - 1.2), lobbyMat);
  lobby.position.set(0, 2.2, 0);
  g.add(lobby);

  for (let i = 0; i < 6; i++) {
    const cz = -cfg.w * 0.45 + (i / 5) * (cfg.w * 0.90);
    const colE = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 4.4, 12), trimMat);
    colE.position.set(cfg.d * 0.5 - 0.25, 2.2, cz);
    g.add(colE);
    const colW = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 4.4, 12), trimMat);
    colW.position.set(-cfg.d * 0.5 + 0.25, 2.2, cz);
    g.add(colW);
  }

  // Striped fabric café awnings along storefront
  for (const az of [-cfg.w * 0.29, cfg.w * 0.29]) {
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, cfg.w * 0.32), awningMat);
    awning.position.set(cfg.d * 0.5 + 0.95, 3.65, az);
    awning.rotation.z = -0.34;
    g.add(awning);
  }

  // Curved Streamline Moderne corner turrets + glass-block vertical light strips
  const glassBlockMat = new THREE.MeshStandardMaterial({
    color: 0xdff6fa, emissive: cfg.accent, emissiveIntensity: 0.48, roughness: 0.2, metalness: 0.25
  });
  for (const side of [-1, 1]) {
    const cornerZ = side * (cfg.w * 0.48);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, cfg.h + 1.0, 16), stuccoMat);
    turret.position.set(cfg.d * 0.45, (cfg.h + 1.0) * 0.5, cornerZ);
    g.add(turret);
    const glStrip = new THREE.Mesh(new THREE.BoxGeometry(0.42, upperH - 1.2, 0.72), glassBlockMat);
    glStrip.position.set(cfg.d * 0.45 + 1.56, 4.6 + upperH * 0.5, cornerZ);
    g.add(glStrip);
  }

  // Real 3D protruding balconies + wrought-iron balustrades on every floor!
  const floorStep = 3.8;
  for (let fy = 4.4; fy <= cfg.h - 1.5; fy += floorStep) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.26, cfg.w * 0.82), trimMat);
    slab.position.set(cfg.d * 0.5 + 0.55, fy, 0);
    g.add(slab);
    if (fy > 4.4) {
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, cfg.w * 0.80), ironMat);
      topRail.position.set(cfg.d * 0.5 + 1.15, fy + 0.92, 0);
      g.add(topRail);
      const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, cfg.w * 0.80), ironMat);
      midRail.position.set(cfg.d * 0.5 + 1.15, fy + 0.48, 0);
      g.add(midRail);
      for (let bz = -cfg.w * 0.38; bz <= cfg.w * 0.38; bz += 2.2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.92, 0.06), ironMat);
        post.position.set(cfg.d * 0.5 + 1.15, fy + 0.46, bz);
        g.add(post);
      }
    }
  }

  // Rooftop stepped Art Deco ziggurat parapet, crown neon, eyebrow canopy & HVAC units
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(cfg.d + 0.4, 1.1, cfg.w + 0.4), trimMat);
  parapet.position.set(0, cfg.h + 0.55, 0);
  g.add(parapet);
  const neonCrown = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, cfg.w + 0.55), neonMat);
  neonCrown.position.set(cfg.d * 0.5 + 0.26, cfg.h + 0.95, 0);
  g.add(neonCrown);

  const step1 = new THREE.Mesh(new THREE.BoxGeometry(cfg.d * 0.72, 2.2, cfg.w * 0.56), stuccoMat);
  step1.position.set(0.6, cfg.h + 2.1, 0);
  g.add(step1);
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(cfg.d * 0.42, 2.4, cfg.w * 0.30), trimMat);
  step2.position.set(1.2, cfg.h + 4.1, 0);
  g.add(step2);

  // Center Art Deco vertical spire fin
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.1, cfg.h + 6.2, 0.58), trimMat);
  fin.position.set(cfg.d * 0.5 + 0.2, (cfg.h + 6.2) * 0.5, 0);
  g.add(fin);
  const finNeon = new THREE.Mesh(new THREE.BoxGeometry(0.18, cfg.h + 6.4, 0.22), neonMat);
  finNeon.position.set(cfg.d * 0.5 + 0.82, (cfg.h + 6.4) * 0.5, 0);
  g.add(finNeon);

  // Entrance marquee canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.44, 7.2), trimMat);
  canopy.position.set(cfg.d * 0.5 + 1.4, 4.45, 0);
  g.add(canopy);
  const canopyGlow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 7.3), neonMat);
  canopyGlow.position.set(cfg.d * 0.5 + 3.05, 4.45, 0);
  g.add(canopyGlow);

  // Rooftop Neon Sign & Projecting Blade Sign
  const signTex = makeNeonSignTexture(cfg.name, cfg.sub, cfg.accentHex, maxAniso, false);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(cfg.w * 0.68, 11.2), 2.5),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.92 })
  );
  sign.rotation.y = Math.PI / 2;
  sign.position.set(cfg.d * 0.5 + 0.85, cfg.h + 2.3, 0);
  g.add(sign);

  const bladeTex = makeNeonSignTexture(cfg.name, '', cfg.accentHex, maxAniso, true);
  const bladeMat = new THREE.MeshStandardMaterial({ map: bladeTex, emissive: 0xffffff, emissiveMap: bladeTex, emissiveIntensity: 0.95 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.9, 6.4, 0.36), [
    ironMat, ironMat, ironMat, ironMat, bladeMat, bladeMat
  ]);
  blade.position.set(cfg.d * 0.5 + 1.7, 9.4, cfg.w * 0.30);
  g.add(blade);

  // Rooftop HVAC unit
  const hvac = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.5, 3.4), ironMat);
  hvac.position.set(-2.4, cfg.h + 1.5, -cfg.w * 0.24);
  g.add(hvac);

  // Sidewalk Café Patio Tables, Chairs & Striped Umbrellas
  if (cfg.cafe) {
    const umbMat = new THREE.MeshStandardMaterial({ color: cfg.accent, roughness: 0.78, side: THREE.DoubleSide });
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xf4efe8, roughness: 0.5 });
    for (const tz of [-cfg.w * 0.30, cfg.w * 0.30]) {
      const patio = new THREE.Group();
      const tTop = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.08, 12), tableMat); tTop.position.y = 0.82; patio.add(tTop);
      const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.82, 8), ironMat); tLeg.position.y = 0.41; patio.add(tLeg);
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), ironMat); uPole.position.y = 1.3; patio.add(uPole);
      const uTop = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 8, 1, true), umbMat); uTop.position.y = 2.52; patio.add(uTop);
      patio.position.set(cfg.d * 0.5 + 2.2, 0.16, tz);
      g.add(patio);
    }
  }
  return g;
}

export function createGlassSkyscraper(cfg, maxAniso, isSoftwareGl) {
  const g = new THREE.Group();
  const repX = Math.max(1, Math.round(cfg.w / 14));
  const repY = Math.max(2, Math.round(cfg.h / 18));
  const { map, emissiveMap } = makeSkyscraperGlassTextures(cfg.glassTint, cfg.mullionHex, cfg.seed, maxAniso, repX, repY);

  const glassMat = new THREE.MeshPhysicalMaterial({
    map,
    emissive: new THREE.Color(0xffe6c4),
    emissiveMap,
    emissiveIntensity: 0.68,
    metalness: 0.84,
    roughness: 0.12,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.55
  });
  const concreteMat = new THREE.MeshStandardMaterial({ color: cfg.mullionHex, roughness: 0.62, metalness: 0.25 });
  const accentMat = new THREE.MeshStandardMaterial({ color: cfg.accent, emissive: cfg.accent, emissiveIntensity: 1.5 });

  // Ground podium + lobby colonnade
  const podium = new THREE.Mesh(new THREE.BoxGeometry(cfg.d + 2.4, 6.4, cfg.w + 2.4), concreteMat);
  podium.position.set(0, 3.2, 0);
  podium.receiveShadow = true;
  g.add(podium);

  // Main reflective glass shaft (72% height)
  const h1 = cfg.h * 0.72;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(cfg.d, h1, cfg.w), glassMat);
  shaft.position.set(0, 6.4 + h1 * 0.5, 0);
  shaft.castShadow = !isSoftwareGl;
  shaft.receiveShadow = true;
  g.add(shaft);

  // Exterior corner structural steel ribs
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(1.1, h1 + 2, 1.1), concreteMat);
      rib.position.set(sx * (cfg.d * 0.5), 6.4 + h1 * 0.5, sz * (cfg.w * 0.5));
      g.add(rib);
    }
  }

  // Upper architectural setback tier (28% height)
  const h2 = cfg.h * 0.28;
  const upper = new THREE.Mesh(new THREE.BoxGeometry(cfg.d * 0.74, h2, cfg.w * 0.74), glassMat);
  upper.position.set(0, 6.4 + h1 + h2 * 0.5, 0);
  g.add(upper);

  // Illuminated crown rim + helipad + communication spire
  const crownY = 6.4 + h1 + h2;
  const crownTrim = new THREE.Mesh(new THREE.BoxGeometry(cfg.d * 0.78, 0.75, cfg.w * 0.78), accentMat);
  crownTrim.position.set(0, crownY + 0.35, 0);
  g.add(crownTrim);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.52, 13.5, 8), concreteMat);
  spire.position.set(0, crownY + 7.2, 0);
  g.add(spire);

  // Glowing skyline brand signage on East facade
  const signTex = makeNeonSignTexture(cfg.name, cfg.sub, cfg.accentHex, maxAniso, false);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(cfg.w * 0.65, 14), 3.0),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.92 })
  );
  sign.rotation.y = Math.PI / 2;
  sign.position.set(cfg.d * 0.37 + 0.25, crownY - 2.4, 0);
  g.add(sign);

  return { group: g, beaconY: crownY + 14.2 };
}

export function createCaseStudyShowroom(sr, textureLoader, maxAniso) {
  const g = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e202c, metalness: 0.78, roughness: 0.24, envMapIntensity: 1.2 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd8cfc4, roughness: 0.72, metalness: 0.06 });
  const neonMat = new THREE.MeshStandardMaterial({ color: sr.accent, emissive: sr.accent, emissiveIntensity: 1.55 });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.56, 16.8), stoneMat);
  plinth.position.set(0, 0.28, 0);
  plinth.receiveShadow = true;
  g.add(plinth);
  const plinthStrip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 16.9), neonMat);
  plinthStrip.position.set(3.82, 0.52, 0);
  g.add(plinthStrip);

  const frameBack = new THREE.Mesh(new THREE.BoxGeometry(0.72, 7.6, 12.6), steelMat);
  frameBack.position.set(-1.1, 4.95, 0);
  g.add(frameBack);
  const topNeon = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 12.8), neonMat);
  topNeon.position.set(-0.70, 8.75, 0);
  g.add(topNeon);
  const botNeon = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 12.8), neonMat);
  botNeon.position.set(-0.70, 1.15, 0);
  g.add(botNeon);

  const screenMat = new THREE.MeshBasicMaterial({ color: 0xf0eef6 });
  textureLoader.load(sr.img, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    screenMat.map = tex;
    screenMat.needsUpdate = true;
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 6.8), screenMat);
  screen.rotation.y = Math.PI / 2;
  screen.position.set(-0.70, 4.95, 0);
  g.add(screen);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.38, 14.6), steelMat);
  canopy.position.set(0.8, 9.3, 0);
  g.add(canopy);
  for (const pz of [-6.6, 6.6]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 8.8, 12), steelMat);
    col.position.set(2.9, 4.9, pz);
    g.add(col);
  }

  const headerTex = makeNeonSignTexture(`${sr.num} · ${sr.title}`, sr.district, sr.accentHex, maxAniso, false);
  const headerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(10.8, 2.2),
    new THREE.MeshStandardMaterial({ map: headerTex, emissive: 0xffffff, emissiveMap: headerTex, emissiveIntensity: 0.9 })
  );
  headerMesh.rotation.y = Math.PI / 2;
  headerMesh.position.set(3.75, 10.6, 0);
  g.add(headerMesh);

  // Illuminated Drive-In Bay Decal
  const bayGeo = new THREE.PlaneGeometry(5.6, 13.8);
  bayGeo.rotateX(-Math.PI / 2);
  const bayC = document.createElement('canvas');
  bayC.width = 256; bayC.height = 512;
  const bctx = bayC.getContext('2d');
  bctx.clearRect(0, 0, 256, 512);
  bctx.strokeStyle = sr.accentHex;
  bctx.lineWidth = 10;
  bctx.strokeRect(14, 14, 228, 484);
  bctx.fillStyle = sr.accentHex;
  bctx.globalAlpha = 0.12;
  bctx.fillRect(18, 18, 220, 476);
  bctx.globalAlpha = 0.92;
  bctx.font = '700 26px "JetBrains Mono", monospace';
  bctx.textAlign = 'center';
  bctx.save();
  bctx.translate(128, 256);
  bctx.rotate(-Math.PI / 2);
  bctx.fillText(`SHOWROOM ${sr.num} · PULL IN`, 0, 8);
  bctx.restore();

  const bayTex = new THREE.CanvasTexture(bayC);
  bayTex.colorSpace = THREE.SRGBColorSpace;
  bayTex.anisotropy = maxAniso;
  const bay = new THREE.Mesh(
    bayGeo,
    new THREE.MeshBasicMaterial({
      map: bayTex, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    })
  );
  bay.position.set(7.2, 0.04, 0);
  g.add(bay);

  g.rotation.y = sr.rotY || 0;
  return g;
}

/* ==========================================================================
   4. SCULPTED TRAFFIC COUPE (WITH BUMP/STUN PHYSICS)
   ========================================================================== */
export function createTrafficCar(colorHex) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: colorHex, metalness: 0.52, roughness: 0.22, clearcoat: 0.9, envMapIntensity: 1.1
  });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x162236, metalness: 0.3, roughness: 0.08, envMapIntensity: 1.35 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.55 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcfd4de, metalness: 0.8, roughness: 0.25 });

  // Sculpted extruded sedan silhouette
  const shape = new THREE.Shape();
  shape.moveTo(-2.15, 0.26);
  shape.lineTo(2.15, 0.26);
  shape.lineTo(2.18, 0.68);
  shape.lineTo(1.20, 0.78);
  shape.lineTo(0.65, 1.24);
  shape.lineTo(-0.78, 1.24);
  shape.lineTo(-1.35, 0.80);
  shape.lineTo(-2.16, 0.74);
  shape.closePath();
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.66, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.07, bevelSegments: 2 });
  bodyGeo.translate(0, 0, -0.83);
  bodyGeo.rotateY(Math.PI / 2);
  g.add(new THREE.Mesh(bodyGeo, paint));

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.42, 1.72), glass);
  cab.position.set(0, 1.03, 0.06);
  g.add(cab);

  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.18, 0.16), trim); bumperF.position.set(0, 0.34, -2.20); g.add(bumperF);
  const bumperR = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.18, 0.16), trim); bumperR.position.set(0, 0.34, 2.20); g.add(bumperR);

  const hlMat = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffe4a8, emissiveIntensity: 1.2 });
  const tlMat = new THREE.MeshStandardMaterial({ color: 0xc8162c, emissive: 0xe61832, emissiveIntensity: 1.15 });
  for (const sx of [-0.66, 0.66]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.13, 0.06), hlMat); hl.position.set(sx, 0.56, -2.23); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.06), tlMat); tl.position.set(sx, 0.58, 2.23); g.add(tl);
  }
  for (const [wx, wz] of [[-0.92, -1.30], [0.92, -1.30], [-0.92, 1.30], [0.92, 1.30]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 14), tireMat);
    w.rotation.z = Math.PI / 2; w.position.set(wx, 0.33, wz); g.add(w);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.26, 12), rimMat);
    r.rotation.z = Math.PI / 2; r.position.set(wx, 0.33, wz); g.add(r);
  }
  return g;
}

/* ==========================================================================
   5. ARTICULATED 3D GTA PEDESTRIANS (WALK, CROSSWALK, PANIC, SQUISH & RAGDOLL)
   ========================================================================== */
export function createPedestrian(spec, sharedGeos, splatMat, starMat) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const skinMat = new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.74 });
  const topMat = new THREE.MeshStandardMaterial({ color: spec.shirt, roughness: 0.78 });
  const botMat = new THREE.MeshStandardMaterial({ color: spec.pants, roughness: 0.84 });
  const hairMat = new THREE.MeshStandardMaterial({ color: spec.hair, roughness: 0.86 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: spec.shoe, roughness: 0.68 });

  const torso = new THREE.Mesh(sharedGeos.torso, topMat);
  torso.position.y = 1.14;
  body.add(torso);
  if (spec.blazer) {
    const tee = new THREE.Mesh(sharedGeos.tee, new THREE.MeshStandardMaterial({ color: 0xf0ecf5, roughness: 0.82 }));
    tee.position.set(0, 1.15, 0.115);
    body.add(tee);
  }

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.56;
  headGroup.add(new THREE.Mesh(sharedGeos.head, skinMat));
  const hair = new THREE.Mesh(sharedGeos.hair, hairMat);
  hair.position.set(0, 0.055, -0.02);
  headGroup.add(hair);
  if (spec.shades) {
    const shades = new THREE.Mesh(sharedGeos.shades, new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.18, metalness: 0.6 }));
    shades.position.set(0, 0.01, 0.115);
    headGroup.add(shades);
  }
  body.add(headGroup);

  const armL = new THREE.Group();
  armL.position.set(-0.24, 1.38, 0);
  const aL = new THREE.Mesh(sharedGeos.arm, topMat); aL.position.y = -0.22; armL.add(aL);
  const hL = new THREE.Mesh(sharedGeos.hand, skinMat); hL.position.y = -0.47; armL.add(hL);
  body.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.24, 1.38, 0);
  const aR = new THREE.Mesh(sharedGeos.arm, topMat); aR.position.y = -0.22; armR.add(aR);
  const hR = new THREE.Mesh(sharedGeos.hand, skinMat); hR.position.y = -0.47; armR.add(hR);
  body.add(armR);

  const legL = new THREE.Group();
  legL.position.set(-0.10, 0.84, 0);
  const lL = new THREE.Mesh(sharedGeos.leg, botMat); lL.position.y = -0.38; legL.add(lL);
  const sL = new THREE.Mesh(sharedGeos.shoe, shoeMat); sL.position.set(0, -0.80, 0.04); legL.add(sL);
  body.add(legL);

  const legR = new THREE.Group();
  legR.position.set(0.10, 0.84, 0);
  const lR = new THREE.Mesh(sharedGeos.leg, botMat); lR.position.y = -0.38; legR.add(lR);
  const sR = new THREE.Mesh(sharedGeos.shoe, shoeMat); sR.position.set(0, -0.80, 0.04); legR.add(sR);
  body.add(legR);

  // Splat decal & dizzy stars (visible only when squished!)
  const splat = new THREE.Mesh(sharedGeos.splat, splatMat);
  splat.rotation.x = -Math.PI / 2;
  splat.position.y = 0.04;
  splat.visible = false;
  root.add(splat);

  const stars = new THREE.Group();
  stars.position.y = 0.42;
  stars.visible = false;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const st = new THREE.Mesh(sharedGeos.star, starMat);
    st.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    stars.add(st);
  }
  root.add(stars);

  root.scale.setScalar(spec.scale);
  return {
    root, body, headGroup, armL, armR, legL, legR, splat, stars,
    baseScale: spec.scale,
    axis: spec.axis || 'z', // 'z' (sidewalk walker) or 'x' (crosswalk crosser)
    speed: spec.speed,
    dir: spec.dir,
    jog: spec.jog,
    phase: spec.phase,
    x: spec.x,
    z: spec.z,
    homeX: spec.x,
    homeZ: spec.z,
    y: spec.y,
    minPos: spec.minPos ?? -610,
    maxPos: spec.maxPos ?? 24,
    // GTA physics state: 'walk' | 'panic' | 'ragdoll' | 'squished'
    state: 'walk',
    stateTimer: 0,
    vx: 0, vy: 0, vz: 0,
    spinX: 0, spinZ: 0
  };
}
