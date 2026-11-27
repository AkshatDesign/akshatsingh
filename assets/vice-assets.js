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
  heightCanvasToNormalTexture,
  makeArtDecoFacadeTextures,
  makeSkyscraperGlassTextures,
  makeLobbyGlassTexture,
  makeAwningTexture,
  makeNeonSignTexture,
  makeContactShadowTexture,
  makeLicensePlateTexture,
  makeWoodPlankTexture,
  makeWoodPlankNormalMap,
  makeCarnivalStripesTexture,
  makeClothNormalTexture,
  makeDenimFabricTexture,
  makeSoftParticleTexture,
  getWorldPBRTextures
} from './vice-env.js?v=18';

export const PAINTS = [
  { name: 'Rosso Vice',      swatch: '#C8142E', color: 0xbf122c, metalness: 0.62, roughness: 0.16, caliper: 0xf0c248, rim: 0xd8c494, underglow: 0xe63554 },
  { name: 'Miami Pearl',     swatch: '#EAE6F0', color: 0xe2dde8, metalness: 0.42, roughness: 0.18, caliper: 0xd91848, rim: 0xc8ceda, underglow: 0x1ad6c4 },
  { name: 'Midnight Cobalt', swatch: '#1D4294', color: 0x1b3f8f, metalness: 0.72, roughness: 0.15, caliper: 0xf0c248, rim: 0xd6dce6, underglow: 0x21e6d1 },
  { name: 'Starfish Teal',   swatch: '#0E9E98', color: 0x0d948e, metalness: 0.64, roughness: 0.16, caliper: 0xff2e88, rim: 0xe2cc94, underglow: 0x21e6d1 }
];

/* Zero-dependency BufferGeometry merger for static draw-call batching */
export function mergeGeometries(geos) {
  const normalized = [];
  let totalVerts = 0;
  let hasUv = true;
  for (let i = 0; i < geos.length; i++) {
    const g = geos[i].index ? geos[i].toNonIndexed() : geos[i];
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) hasUv = false;
    totalVerts += g.attributes.position.count;
    normalized.push(g);
  }
  const pos = new Float32Array(totalVerts * 3);
  const norm = new Float32Array(totalVerts * 3);
  const uv = hasUv ? new Float32Array(totalVerts * 2) : null;
  let offset = 0;
  for (let i = 0; i < normalized.length; i++) {
    const g = normalized[i];
    const cnt = g.attributes.position.count;
    pos.set(g.attributes.position.array, offset * 3);
    norm.set(g.attributes.normal.array, offset * 3);
    if (uv) uv.set(g.attributes.uv.array, offset * 2);
    offset += cnt;
    g.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  if (uv) merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return merged;
}

/* ==========================================================================
   1. SCULPTED 1986 EXOTIC SUPERCAR (LIVE REFLECTION READY)
   ========================================================================== */
export function createSupercar(isSoftwareGl) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const pbr = getWorldPBRTextures(4);
  const p0 = PAINTS[0];
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: p0.color,
    metalness: Math.max(0.72, p0.metalness),
    roughness: Math.min(0.14, p0.roughness),
    normalMap: pbr.paintFlake.normalMap,
    normalScale: new THREE.Vector2(0.18, 0.18),
    clearcoat: 1.0,
    clearcoatRoughness: 0.032,
    envMapIntensity: 2.25
  });
  const carbonMat = new THREE.MeshPhysicalMaterial({ color: 0x16171f, metalness: 0.45, roughness: 0.34, clearcoat: 0.5, envMapIntensity: 1.4 });
  const darkVentMat = new THREE.MeshStandardMaterial({ color: 0x090a0e, metalness: 0.22, roughness: 0.78 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a1628,
    metalness: 0.28,
    roughness: 0.025,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    transparent: true,
    opacity: 0.48,
    envMapIntensity: 2.45
  });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0xb2703c, roughness: 0.50, metalness: 0.05 });
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x15161e, roughness: 0.68, metalness: 0.14 });
  const rotorMat = new THREE.MeshStandardMaterial({ color: 0xb8c2d2, metalness: 0.92, roughness: 0.20, envMapIntensity: 1.65 });
  const amberMat = new THREE.MeshStandardMaterial({ color: 0xffa624, emissive: 0xff8c14, emissiveIntensity: 1.35, roughness: 0.16 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf0f5fc, metalness: 0.98, roughness: 0.06, envMapIntensity: 2.15 });
  const rimMat = new THREE.MeshStandardMaterial({ color: p0.rim, metalness: 0.92, roughness: 0.12, envMapIntensity: 1.85 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: p0.caliper, metalness: 0.44, roughness: 0.24 });
  const tireMat = new THREE.MeshStandardMaterial({
    map: pbr.tireTread.map,
    normalMap: pbr.tireTread.normalMap,
    normalScale: new THREE.Vector2(1.35, 1.35),
    color: 0x22242a,
    metalness: 0.06,
    roughness: 0.78
  });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xd4142a, emissive: 0xf41832, emissiveIntensity: 1.45, roughness: 0.14 });
  const headLensMat = new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff0c8, emissiveIntensity: 1.65, roughness: 0.08 });
  const engineRedMat = new THREE.MeshStandardMaterial({ color: 0xc8142b, metalness: 0.64, roughness: 0.22, envMapIntensity: 1.4 });

  // Sculpted wedge lower monocoque (higher curveSegments & smooth organic bevels)
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
    depth: 1.72, bevelEnabled: true, bevelThickness: 0.13, bevelSize: 0.09, bevelSegments: 7, curveSegments: 24
  });
  bodyGeo.translate(0, 0, -0.86);
  bodyGeo.rotateY(Math.PI / 2);
  const mainBody = new THREE.Mesh(bodyGeo, paintMat);
  mainBody.castShadow = !isSoftwareGl;
  mainBody.receiveShadow = true;
  bodyGroup.add(mainBody);

  // Sculpted Widebody Rear Haunches & Curved Front Fenders
  const haunchShape = new THREE.Shape();
  haunchShape.moveTo(-2.18, 0.28);
  haunchShape.lineTo(-0.26, 0.26);
  haunchShape.lineTo(-0.16, 0.68);
  haunchShape.quadraticCurveTo(-1.15, 0.86, -2.18, 0.78);
  haunchShape.closePath();
  const haunchGeo = new THREE.ExtrudeGeometry(haunchShape, {
    depth: 0.22, bevelEnabled: true, bevelThickness: 0.075, bevelSize: 0.055, bevelSegments: 5, curveSegments: 16
  });
  haunchGeo.translate(0, 0, -0.11);
  haunchGeo.rotateY(Math.PI / 2);

  const fFenderShape = new THREE.Shape();
  fFenderShape.moveTo(0.76, 0.24);
  fFenderShape.lineTo(2.14, 0.24);
  fFenderShape.quadraticCurveTo(1.96, 0.62, 1.38, 0.68);
  fFenderShape.quadraticCurveTo(0.92, 0.70, 0.76, 0.56);
  fFenderShape.closePath();
  const fFenderGeo = new THREE.ExtrudeGeometry(fFenderShape, {
    depth: 0.16, bevelEnabled: true, bevelThickness: 0.055, bevelSize: 0.045, bevelSegments: 4, curveSegments: 14
  });
  fFenderGeo.translate(0, 0, -0.08);
  fFenderGeo.rotateY(Math.PI / 2);

  const archFlareGeo = new THREE.TorusGeometry(0.41, 0.048, 10, 22, Math.PI);
  archFlareGeo.rotateY(Math.PI / 2);

  for (const side of [-1, 1]) {
    const h = new THREE.Mesh(haunchGeo, paintMat);
    h.position.x = side * 0.92;
    h.castShadow = !isSoftwareGl;
    bodyGroup.add(h);

    const ff = new THREE.Mesh(fFenderGeo, paintMat);
    ff.position.x = side * 0.91;
    bodyGroup.add(ff);

    // Sculpted wheel-arch flares over front & rear wheels
    const fArch = new THREE.Mesh(archFlareGeo, carbonMat);
    fArch.position.set(side * 0.97, 0.34, -1.36);
    const rArch = new THREE.Mesh(archFlareGeo, carbonMat);
    rArch.scale.set(1.0, 1.08, 1.08);
    rArch.position.set(side * 1.02, 0.37, 1.34);
    bodyGroup.add(fArch, rArch);

    const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 2.38), carbonMat);
    skirt.position.set(side * 0.96, 0.19, 0.0);
    bodyGroup.add(skirt);

    // Side amber marker lens
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.14), amberMat);
    marker.position.set(side * 1.00, 0.42, -1.88);
    bodyGroup.add(marker);

    // Testarossa side intakes & strakes (right side fixed; left side splits cleanly with hinged driver door!)
    const duct = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 1.28), darkVentMat);
    duct.position.set(side * 0.99, 0.52, 0.48);
    bodyGroup.add(duct);
    for (let s = 0; s < 4; s++) {
      const strake = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.030, 1.32 - s * 0.08), paintMat);
      strake.position.set(side * 1.03, 0.40 + s * 0.085, 0.50 + s * 0.03);
      bodyGroup.add(strake);
    }

    // Right-side sculpted aero mirror (left mirror lives on hinged driverDoorPivot!)
    if (side > 0) {
      const mStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.14, 10), carbonMat);
      mStalk.rotation.z = -0.58; mStalk.position.set(0.93, 0.85, -0.54);
      const mPod = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.11, 6, 12), paintMat);
      mPod.rotation.z = Math.PI / 2; mPod.scale.set(0.85, 1.0, 1.1);
      mPod.position.set(1.03, 0.90, -0.54);
      bodyGroup.add(mStalk, mPod);
    }
  }

  // HINGED DRIVER-SIDE DOOR (Swings outward around front A-pillar hinge during enter/exit!)
  const driverDoorPivot = new THREE.Group();
  driverDoorPivot.position.set(-0.96, 0.54, -0.56);
  const doorSkin = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.44, 1.08), paintMat);
  doorSkin.position.set(0.01, 0.02, 0.54);
  const doorSillTrim = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.04, 1.04), carbonMat);
  doorSillTrim.position.set(0.0, -0.19, 0.54);
  const doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.16), chromeMat);
  doorHandle.position.set(-0.06, 0.14, 0.82);
  const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.34, 0.84), glassMat);
  doorGlass.position.set(0.07, 0.38, 0.52);
  doorGlass.rotation.z = -0.32;
  const dMirStalk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.14, 10), carbonMat);
  dMirStalk.rotation.z = 0.58; dMirStalk.position.set(-0.02, 0.31, 0.05);
  const dMirPod = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.11, 6, 12), paintMat);
  dMirPod.rotation.z = Math.PI / 2; dMirPod.scale.set(0.85, 1.0, 1.1);
  dMirPod.position.set(-0.10, 0.36, 0.05);
  driverDoorPivot.add(doorSkin, doorSillTrim, doorHandle, doorGlass, dMirStalk, dMirPod);
  bodyGroup.add(driverDoorPivot);

  // Full 3D Sculpted Cockpit Interior (Visible through translucent tinted glass & open door!)
  const cabinFloor = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.12, 1.48), dashMat);
  cabinFloor.position.set(0, 0.52, 0.04);
  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.24, 0.42), dashMat);
  dash.position.set(0, 0.80, -0.52);
  const binnacle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.40, 14), dashMat);
  binnacle.rotation.z = Math.PI / 2;
  binnacle.position.set(-0.38, 0.90, -0.52);
  const steerCol = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.26, 10), chromeMat);
  steerCol.rotation.x = Math.PI / 2 - 0.34;
  steerCol.position.set(-0.38, 0.86, -0.34);
  const steerWheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 10, 22), dashMat);
  steerWheel.position.set(-0.38, 0.89, -0.22);
  steerWheel.rotation.x = 0.34;
  const centerConsole = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 1.24), dashMat);
  centerConsole.position.set(0, 0.66, 0.06);
  const gearKnob = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), chromeMat);
  gearKnob.position.set(0, 0.84, -0.14);
  bodyGroup.add(cabinFloor, dash, binnacle, steerCol, steerWheel, centerConsole, gearKnob);
  for (const sx of [-0.39, 0.39]) {
    const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 0.48), leatherMat);
    cushion.position.set(sx, 0.62, 0.14);
    const seatBack = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.38, 6, 14), leatherMat);
    seatBack.scale.set(1.12, 1.0, 0.46);
    seatBack.position.set(sx, 0.92, 0.44);
    seatBack.rotation.x = -0.18;
    bodyGroup.add(cushion, seatBack);
  }

  // Visible Seated Protagonist Driver (shown through translucent glass when player drives!)
  const playerDriverMesh = new THREE.Group();
  const pdShirtMat = new THREE.MeshStandardMaterial({ color: 0x16b8b2, roughness: 0.72 });
  const pdSkinMat = new THREE.MeshStandardMaterial({ color: 0xe3ac84, roughness: 0.56 });
  const pdHairMat = new THREE.MeshStandardMaterial({ color: 0x1a141d, roughness: 0.72 });
  const pdShadeMat = new THREE.MeshPhysicalMaterial({ color: 0xff7b2e, metalness: 0.85, roughness: 0.10, clearcoat: 1.0 });
  const pdTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.22, 6, 12), pdShirtMat);
  pdTorso.scale.set(1.1, 1.0, 0.74);
  pdTorso.position.set(-0.38, 0.84, 0.20);
  pdTorso.rotation.x = -0.16;
  const pdHead = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 14), pdSkinMat);
  pdHead.position.set(-0.38, 1.08, 0.22);
  const pdHair = new THREE.Mesh(new THREE.SphereGeometry(0.122, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), pdHairMat);
  pdHair.position.set(-0.38, 1.11, 0.23);
  const pdShades = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.042, 0.04), pdShadeMat);
  pdShades.position.set(-0.38, 1.08, 0.11);
  const pdArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.28, 6, 10), pdSkinMat);
  pdArmL.rotation.x = Math.PI / 2 - 0.18; pdArmL.rotation.z = -0.18;
  pdArmL.position.set(-0.52, 0.90, -0.02);
  const pdArmR = pdArmL.clone();
  pdArmR.rotation.z = 0.18; pdArmR.position.x = -0.24;
  playerDriverMesh.add(pdTorso, pdHead, pdHair, pdShades, pdArmL, pdArmR);
  bodyGroup.add(playerDriverMesh);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.00, 0.08, 0.58), carbonMat);
  splitter.position.set(0, 0.185, -2.14);
  bodyGroup.add(splitter);
  const frontIntake = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.17, 0.13), darkVentMat);
  frontIntake.position.set(0, 0.27, -2.31);
  bodyGroup.add(frontIntake);
  // Twin Testarossa chrome front intake blades + golden Italian nose crest + sculpted hood NACA ducts
  for (const by of [0.24, 0.30]) {
    const frontBar = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.020, 0.14), chromeMat);
    frontBar.position.set(0, by, -2.32);
    bodyGroup.add(frontBar);
  }
  const noseBadge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.02), new THREE.MeshStandardMaterial({ color: 0xffcc22, metalness: 0.72, roughness: 0.20 }));
  noseBadge.position.set(0, 0.45, -2.26);
  noseBadge.rotation.x = -0.35;
  bodyGroup.add(noseBadge);
  for (const sx of [-0.42, 0.42]) {
    const hoodDuct = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.024, 0.38), darkVentMat);
    hoodDuct.position.set(sx, 0.675, -1.42);
    hoodDuct.rotation.x = 0.20;
    bodyGroup.add(hoodDuct);
  }

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.22, 0.36), carbonMat);
  diffuser.position.set(0, 0.24, 2.16);
  bodyGroup.add(diffuser);
  for (let i = -2; i <= 2; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.34), carbonMat);
    fin.position.set(i * 0.28, 0.21, 2.24);
    bodyGroup.add(fin);
  }

  // Sleek Wraparound Translucent Glass Greenhouse + Sculpted Roof Cap & A-Pillars
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.98, 0.76);
  cabinShape.lineTo(1.06, 0.72);
  cabinShape.lineTo(0.26, 1.19);
  cabinShape.lineTo(-0.56, 1.19);
  cabinShape.closePath();
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 1.50, bevelEnabled: true, bevelThickness: 0.075, bevelSize: 0.05, bevelSegments: 6, curveSegments: 18
  });
  cabinGeo.translate(0, 0, -0.75);
  cabinGeo.rotateY(Math.PI / 2);
  const cabin = new THREE.Mesh(cabinGeo, glassMat);
  bodyGroup.add(cabin);

  // Curved painted roof panel + A-pillars + Testarossa flying rear buttresses
  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.055, 0.88), paintMat);
  roofCap.position.set(0, 1.225, 0.14);
  bodyGroup.add(roofCap);
  for (const side of [-1, 1]) {
    const aPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.96, 10), paintMat);
    aPillar.position.set(side * 0.72, 0.97, -0.66);
    aPillar.rotation.x = 1.02;
    bodyGroup.add(aPillar);
    const buttress = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 1.40), paintMat);
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
    const intakePlenum = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.86, 10), chromeMat);
    intakePlenum.rotation.x = Math.PI / 2;
    intakePlenum.position.set(side, 0.98, 1.24);
    bodyGroup.add(intakePlenum);
  }
  for (let l = 0; l < 6; l++) {
    const louver = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.026, 0.1), carbonMat);
    louver.position.set(0, 0.99 - l * 0.025, 0.78 + l * 0.18);
    louver.rotation.x = 0.26;
    bodyGroup.add(louver);
  }

  // Sculpted Aerofoil Rear Wing
  const wingShape = new THREE.Shape();
  wingShape.moveTo(-0.18, 0.0);
  wingShape.quadraticCurveTo(0.0, 0.055, 0.20, 0.015);
  wingShape.quadraticCurveTo(0.02, -0.015, -0.18, 0.0);
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 2.08, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 3 });
  wingGeo.translate(0, 0, -1.04);
  wingGeo.rotateY(Math.PI / 2);
  const wingBlade = new THREE.Mesh(wingGeo, paintMat);
  wingBlade.position.set(0, 1.17, 2.02);
  wingBlade.castShadow = !isSoftwareGl;
  bodyGroup.add(wingBlade);
  for (const side of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.36, 0.22), paintMat);
    strut.position.set(side * 0.68, 0.98, 1.98);
    bodyGroup.add(strut);
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.22, 0.44), paintMat);
    endplate.position.set(side * 1.04, 1.15, 2.02);
    bodyGroup.add(endplate);
  }

  // Pop-up headlights with chrome reflector bowls & dual projector lenses
  const popPods = [];
  const headLights = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.66, 0.56, -1.86);
    const podHousing = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.35), paintMat);
    podHousing.position.set(0, 0.05, -0.14);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.11, 0.04), chromeMat);
    bezel.position.set(0, 0.048, -0.31);
    const lensL = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.03, 14), headLensMat);
    lensL.rotation.x = Math.PI / 2; lensL.position.set(-0.075, 0.048, -0.325);
    const lensR = lensL.clone(); lensR.position.x = 0.075;
    pivot.add(podHousing, bezel, lensL, lensR);
    bodyGroup.add(pivot);
    popPods.push(pivot);
  }
  const mainSpot = new THREE.SpotLight(0xfff0cc, 2.1, 28, 0.58, 0.88, 2.0);
  mainSpot.position.set(0, 0.64, -2.28);
  mainSpot.target.position.set(0, 0.0, -18);
  bodyGroup.add(mainSpot);
  bodyGroup.add(mainSpot.target);
  headLights.push(mainSpot);

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
    new THREE.MeshStandardMaterial({ map: makeLicensePlateTexture(), roughness: 0.42, metalness: 0.14 })
  );
  plate.position.set(0, 0.40, 2.34);
  bodyGroup.add(plate);

  // Quad Titanium Exhausts (clean chrome pipes — no fire/flames on vehicle)
  const nitroFlames = [];
  const flameOuterMat = new THREE.MeshBasicMaterial({ color: 0x21e6d1, transparent: true, opacity: 0, depthWrite: false });
  const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xffc660, transparent: true, opacity: 0, depthWrite: false });
  [-0.66, -0.50, 0.50, 0.66].forEach((ex) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.24, 16), chromeMat);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(ex, 0.22, 2.34);
    bodyGroup.add(pipe);
  });

  // Ground Contact Shadow
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

  // 4 High-Poly Deep-Dish Twin-5-Spoke Forged Alloy Wheels + Ventilated Brake Rotors & Calipers
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

    const outSign = wd.x > 0 ? 1 : -1;
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.16, 0.11), caliperMat);
    caliper.position.set(outSign * (wd.w * 0.30), 0.04, wd.front ? 0.14 : -0.14);
    knuckle.add(caliper);

    const spinGroup = new THREE.Group();
    knuckle.add(spinGroup);
    wheelSpinGroups.push(spinGroup);

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(wd.r, wd.r, wd.w, 36, 1, true), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = !isSoftwareGl;
    spinGroup.add(tire);

    const tireBead = new THREE.Mesh(new THREE.TorusGeometry(wd.r * 0.85, wd.r * 0.15, 14, 36), tireMat);
    tireBead.rotation.y = Math.PI / 2;
    tireBead.position.x = outSign * wd.w * 0.42;
    spinGroup.add(tireBead);

    const rimBarrel = new THREE.Mesh(new THREE.TorusGeometry(wd.r * 0.69, 0.028, 12, 32), chromeMat);
    rimBarrel.rotation.y = Math.PI / 2;
    rimBarrel.position.x = outSign * wd.w * 0.50;
    spinGroup.add(rimBarrel);

    // Open-ended outer rim cylinder so spokes, rotor & red caliper stay 100% visible!
    const rimLip = new THREE.Mesh(new THREE.CylinderGeometry(wd.r * 0.71, wd.r * 0.71, wd.w * 0.96, 32, 1, true), rimMat);
    rimLip.rotation.z = Math.PI / 2;
    spinGroup.add(rimLip);

    // Dark recessed wheel well drum behind the brake rotor
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(wd.r * 0.65, wd.r * 0.65, wd.w * 0.42, 24), darkVentMat);
    inner.rotation.z = Math.PI / 2;
    inner.position.x = -outSign * wd.w * 0.06;
    spinGroup.add(inner);

    // Metallic ventilated brake rotor clearly visible behind the twin-5 spokes
    const rotor = new THREE.Mesh(new THREE.CylinderGeometry(wd.r * 0.56, wd.r * 0.56, 0.036, 24), rotorMat);
    rotor.rotation.z = Math.PI / 2;
    rotor.position.x = outSign * (wd.w * 0.28);
    spinGroup.add(rotor);

    const outX = outSign * wd.w * 0.49;
    for (let s = 0; s < 5; s++) {
      const ang = (s / 5) * Math.PI * 2;
      for (const off of [-0.085, 0.085]) {
        const a2 = ang + off;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.032, wd.r * 0.64, 0.032), rimMat);
        spoke.position.set(outX, Math.cos(a2) * wd.r * 0.32, Math.sin(a2) * wd.r * 0.32);
        spoke.rotation.x = a2;
        spinGroup.add(spoke);
      }
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.055, 16), chromeMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.x = outX + outSign * 0.018;
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
    root, bodyGroup, driverDoorPivot, playerDriverMesh, wheelSpinGroups, frontSteerGroups, popPods,
    headLights, headLensMat, tailMat, brakeLight,
    paintMat, rimMat, chromeMat, caliperMat,
    flameOuterMat, flameCoreMat, nitroFlames, applyPaint, setDynamicEnvMap
  };
}

/* ==========================================================================
   2. SCULPTED 14-FROND 3D ARCHING TROPICAL PALM TREES & SHRUBS
   ========================================================================== */
export function buildArchingFrondGeometry(length, width, archLift, droop) {
  const segW = 4;
  const segL = 12;
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

export function buildMergedPalmGeometries(lowerFrondGeo, upperFrondGeo) {
  const height = 10.0;
  const curveAmt = 0.32;
  const segs = 10;
  const trunkParts = [];
  let y = 0;
  let x = 0;
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const rBot = 0.29 * (1 - t * 0.44);
    const rTop = 0.255 * (1 - t * 0.46);
    const segH = height / segs;
    const lean = curveAmt * (t * 0.38);
    const segGeo = new THREE.CylinderGeometry(rTop, rBot, segH + 0.08, 12);
    segGeo.rotateZ(-lean);
    segGeo.translate(x, y + segH * 0.5, 0);
    trunkParts.push(segGeo);
    y += segH * Math.cos(lean);
    x += segH * Math.sin(lean);
  }
  const trunkGeo = mergeGeometries(trunkParts);

  const collarParts = [];
  const col = new THREE.CylinderGeometry(0.18, 0.23, 0.68, 12);
  col.translate(x, y - 0.18, 0);
  collarParts.push(col);
  for (let c = 0; c < 4; c++) {
    const ang = (c / 4) * Math.PI * 2 + 0.4;
    const nut = new THREE.SphereGeometry(0.145, 10, 10);
    nut.translate(x + Math.cos(ang) * 0.22, y - 0.24, Math.sin(ang) * 0.22);
    collarParts.push(nut);
  }
  const collarGeo = mergeGeometries(collarParts);

  const frondParts = [];
  for (let f = 0; f < 9; f++) {
    const fg = lowerFrondGeo.clone();
    fg.translate(0, -0.05, 0);
    fg.rotateY((f / 9) * Math.PI * 2);
    fg.translate(x, y, 0);
    frondParts.push(fg);
  }
  for (let f = 0; f < 7; f++) {
    const fg = upperFrondGeo.clone();
    fg.translate(0, 0.09, 0);
    fg.rotateY((f / 7) * Math.PI * 2 + 0.35);
    fg.translate(x, y, 0);
    frondParts.push(fg);
  }
  const frondCrownGeo = mergeGeometries(frondParts);

  return { trunkGeo, collarGeo, frondCrownGeo };
}

export function createRealisticPalmTree(assets, height, curveAmt) {
  const g = new THREE.Group();
  const scale = height / 10.0;
  const trunk = new THREE.Mesh(assets.trunkGeo, assets.trunkMat);
  trunk.castShadow = assets.castShadow;
  g.add(trunk);
  g.add(new THREE.Mesh(assets.collarGeo, assets.collarMat));
  g.add(new THREE.Mesh(assets.frondCrownGeo, assets.frondMat));
  g.scale.setScalar(scale);
  return g;
}

/* ==========================================================================
   3. ARCHITECTURAL BUILDINGS (ART DECO HOTELS, MIDTOWN CONDOS, GLASS TOWERS)
   ========================================================================== */
export function createArtDecoHotel(cfg, maxAniso, isSoftwareGl) {
  const g = new THREE.Group();
  const style = cfg.style || 'artdeco';
  const enterable = cfg.enterable || null; // 'hotel' | 'club' | 'ammunation' | null
  const upperH = cfg.h - 4.6;
  const repX = Math.max(1, Math.round(cfg.w / 14));
  const repY = Math.max(1, Math.round(upperH / 12));
  const { map: facadeMap, emissiveMap: facadeEm, roughnessMap: facadeRough, normalMap: facadeNorm } = makeArtDecoFacadeTextures(
    cfg.base, cfg.trimHex, cfg.accentHex, cfg.seed, maxAniso, repX, repY
  );

  const wallMat = new THREE.MeshStandardMaterial({
    map: facadeMap,
    roughnessMap: facadeRough,
    normalMap: facadeNorm,
    normalScale: new THREE.Vector2(0.85, 0.85),
    emissive: new THREE.Color(0xffe6c4),
    emissiveMap: facadeEm,
    emissiveIntensity: style === 'warehouse' ? 0.25 : 0.68,
    roughness: style === 'warehouse' ? 0.72 : 0.84,
    metalness: style === 'warehouse' ? 0.34 : 0.08,
    envMapIntensity: 1.05
  });
  const stuccoMat = new THREE.MeshStandardMaterial({ color: cfg.base, roughness: 0.84, metalness: 0.04 });
  const trimMat = new THREE.MeshStandardMaterial({ color: cfg.trimHex, roughness: 0.58, metalness: 0.14 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x24222c, metalness: 0.72, roughness: 0.34 });
  const neonMat = new THREE.MeshStandardMaterial({ color: cfg.accent, emissive: cfg.accent, emissiveIntensity: 1.55, roughness: 0.2 });
  const terraMat = new THREE.MeshStandardMaterial({ color: 0xb84c2e, roughness: 0.78, metalness: 0.06 });
  const metalRoofMat = new THREE.MeshStandardMaterial({ color: 0x455064, roughness: 0.44, metalness: 0.58 });
  const atriumGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x1e4c68, emissive: 0x16384c, emissiveIntensity: 0.38, metalness: 0.36, roughness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.76 });
  const lobbyMat = new THREE.MeshStandardMaterial({
    map: makeLobbyGlassTexture(cfg.accentHex, maxAniso),
    emissive: 0xffd296,
    emissiveIntensity: 0.38,
    roughness: 0.22,
    metalness: 0.28,
    envMapIntensity: 1.15
  });
  const awningMat = new THREE.MeshStandardMaterial({ map: makeAwningTexture(cfg.accentHex), roughness: 0.84, side: THREE.DoubleSide });

  // Main upper architectural volume (sits cleanly above y = 4.6m ground floor so enterable lobbies are completely open!)
  const main = new THREE.Mesh(new THREE.BoxGeometry(cfg.d, upperH, cfg.w), wallMat);
  main.position.set(0, 4.6 + upperH * 0.5, 0);
  main.castShadow = !isSoftwareGl;
  main.receiveShadow = true;
  g.add(main);

  // Batch static architectural geometries by material
  const trimParts = [];
  const ironParts = [];
  const stuccoParts = [];
  const neonParts = [];
  const glassBlockParts = [];

  // GROUND FLOOR: Either TRUE HOLLOW WALK-IN 3D INTERIOR (for enterable buildings) or Glazed Storefront Lobby
  if (enterable) {
    const hd = cfg.d * 0.5;
    const hw = cfg.w * 0.5;
    const wallT = 0.55;
    const doorHalfW = 3.6; // Wide 7.2m open walk-in doorway on East (+X) street side!
    const intWallCol = enterable === 'club' ? 0x180c24 : (enterable === 'ammunation' ? 0x4d3422 : 0xf4e8dc);
    const intWallMat = new THREE.MeshStandardMaterial({ color: intWallCol, roughness: 0.72, side: THREE.DoubleSide });
    const ceilGlowMat = new THREE.MeshBasicMaterial({ color: enterable === 'club' ? 0xff4aa8 : (enterable === 'ammunation' ? 0xffe4b4 : 0xfff0d4) });

    // Back wall (-X), North wall (-Z), South wall (+Z), and Front flanking walls leaving center doorway wide open!
    const backW = new THREE.Mesh(new THREE.BoxGeometry(wallT, 4.6, cfg.w - 0.6), intWallMat);
    backW.position.set(-hd + 0.4, 2.3, 0);
    const northW = new THREE.Mesh(new THREE.BoxGeometry(cfg.d - 0.6, 4.6, wallT), intWallMat);
    northW.position.set(0, 2.3, -hw + 0.4);
    const southW = new THREE.Mesh(new THREE.BoxGeometry(cfg.d - 0.6, 4.6, wallT), intWallMat);
    southW.position.set(0, 2.3, hw - 0.4);
    g.add(backW, northW, southW);

    const sideSpan = Math.max(1.5, hw - doorHalfW - 0.5);
    const clearStoreGlass = new THREE.MeshPhysicalMaterial({ color: 0x8cd8ea, metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.28, depthWrite: false });
    for (const sgn of [-1, 1]) {
      const fz = sgn * (doorHalfW + sideSpan * 0.5);
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.6, sideSpan), clearStoreGlass);
      frontGlass.position.set(hd - 0.35, 2.5, fz);
      const frontBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, sideSpan), stuccoMat);
      frontBase.position.set(hd - 0.35, 0.42, fz);
      g.add(frontGlass, frontBase);
    }
    // Glowing Neon Doorframe Archway signaling WALK-IN ENTERABLE DOOR!
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, doorHalfW * 2 + 0.6), trimMat);
    lintel.position.set(hd - 0.2, 4.3, 0);
    const archNeonTop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, doorHalfW * 2 + 0.4), neonMat);
    archNeonTop.position.set(hd + 0.18, 4.05, 0);
    g.add(lintel, archNeonTop);
    for (const sgn of [-1, 1]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.2, 0.32), trimMat);
      jamb.position.set(hd - 0.2, 2.1, sgn * doorHalfW);
      const jambNeon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.9, 0.14), neonMat);
      jambNeon.position.set(hd + 0.12, 2.0, sgn * doorHalfW);
      g.add(jamb, jambNeon);
    }

    // Interior Ceiling & Recessed Lighting Panels
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(cfg.d - 1.0, cfg.w - 1.0), intWallMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 4.52, 0);
    g.add(ceil);
    for (const lz of [-cfg.w * 0.22, 0, cfg.w * 0.22]) {
      const lightPanel = new THREE.Mesh(new THREE.PlaneGeometry(cfg.d * 0.55, 1.15), ceilGlowMat);
      lightPanel.rotation.x = Math.PI / 2;
      lightPanel.position.set(0, 4.46, lz);
      g.add(lightPanel);
    }

    // Checkered / Patterned Interior Floor Texture
    const fc = document.createElement('canvas');
    fc.width = 256; fc.height = 256;
    const fctx = fc.getContext('2d');
    if (enterable === 'club') {
      const cols = ['#ff2e88', '#21e6d1', '#ffd36b', '#8b5cf6', '#160b24'];
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        fctx.fillStyle = cols[(x * 3 + y * 5) % cols.length];
        fctx.fillRect(x * 32 + 2, y * 32 + 2, 28, 28);
      }
    } else if (enterable === 'ammunation') {
      fctx.fillStyle = '#3d3632';
      fctx.fillRect(0, 0, 256, 256);
      fctx.fillStyle = '#504740';
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 0) fctx.fillRect(x * 32, y * 32, 32, 32);
      }
    } else {
      fctx.fillStyle = '#f6efe6';
      fctx.fillRect(0, 0, 256, 256);
      fctx.fillStyle = '#25b8b0';
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        if ((x + y) % 2 === 0) fctx.fillRect(x * 32, y * 32, 32, 32);
      }
    }
    const floorTex = new THREE.CanvasTexture(fc);
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(3, 5);
    const intFloorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      emissive: enterable === 'club' ? 0x6b2868 : 0x221c18,
      emissiveMap: enterable === 'club' ? floorTex : null,
      emissiveIntensity: enterable === 'club' ? 0.65 : 0.14,
      roughness: 0.22,
      metalness: 0.18
    });
    const intFloor = new THREE.Mesh(new THREE.PlaneGeometry(cfg.d - 0.8, cfg.w - 0.8), intFloorMat);
    intFloor.rotation.x = -Math.PI / 2;
    intFloor.position.set(0, 0.04, 0);
    g.add(intFloor);

    // Rich Interior Furnishings Unique to Each Enterable Building!
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e3f24, roughness: 0.45 });
    const velvetMat = new THREE.MeshStandardMaterial({ color: enterable === 'club' ? 0xb42478 : 0x169e98, roughness: 0.78 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd36b, metalness: 0.88, roughness: 0.20 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x222630, metalness: 0.82, roughness: 0.25 });

    if (enterable === 'hotel') {
      // Ocean View Hotel Reception Desk + Brass Lamp + Lounge Sofas + Indoor Palms + Grand Staircase!
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.15, 6.2), woodMat);
      desk.position.set(-hd + 2.8, 0.58, 0);
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.12, 6.4), trimMat);
      deskTop.position.set(-hd + 2.8, 1.18, 0);
      const deskSignTex = makeNeonSignTexture('OCEAN VIEW', 'SAFEHOUSE · FULL HEAL', '#FF2E88', maxAniso, false);
      const deskSign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.4), new THREE.MeshBasicMaterial({ map: deskSignTex }));
      deskSign.rotation.y = Math.PI / 2;
      deskSign.position.set(-hd + 0.75, 2.8, 0);
      g.add(desk, deskTop, deskSign);
      for (const sz of [-6.5, 6.5]) {
        const sofa = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 3.6), velvetMat);
        sofa.position.set(-1.5, 0.42, sz);
        const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.05, 3.6), velvetMat);
        sofaBack.position.set(-2.1, 0.82, sz);
        const tbl = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.48, 2.0), goldMat);
        tbl.position.set(0.35, 0.24, sz);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.34, 0.75, 10), terraMat);
        pot.position.set(3.2, 0.38, sz * 1.18);
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x1e8a52, roughness: 0.65 }));
        leaf.position.set(3.2, 1.45, sz * 1.18);
        g.add(sofa, sofaBack, tbl, pot, leaf);
      }
      // Grand staircase rising along North side
      for (let st = 0; st < 8; st++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 2.8), trimMat);
        step.position.set(-hd + 2.5 + st * 0.65, 0.22 + st * 0.45, -hw + 2.4);
        g.add(step);
      }
    } else if (enterable === 'club') {
      // Malibu Club Elevated DJ Booth + Twin Speaker Stacks + Cocktail Bar + Neon Beams!
      const djStage = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.85, 6.8), ironMat);
      djStage.position.set(-hd + 2.5, 0.42, 0);
      const djBooth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.25, 4.2), neonMat);
      djBooth.position.set(-hd + 3.4, 1.45, 0);
      const clubSignTex = makeNeonSignTexture('THE MALIBU', 'NIGHTCLUB · LIVE DJ', '#21E6D1', maxAniso, false);
      const clubSign = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), new THREE.MeshBasicMaterial({ map: clubSignTex }));
      clubSign.rotation.y = Math.PI / 2;
      clubSign.position.set(-hd + 0.75, 3.1, 0);
      g.add(djStage, djBooth, clubSign);
      for (const sz of [-4.2, 4.2]) {
        const spk = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.6, 1.4), ironMat);
        spk.position.set(-hd + 2.4, 2.1, sz);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 14), goldMat);
        cone.rotation.z = Math.PI / 2; cone.position.set(-hd + 3.1, 2.5, sz);
        g.add(spk, cone);
      }
      // Neon Cocktail Bar & Barstools along South side
      const bar = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.15, 1.2), woodMat);
      bar.position.set(0.5, 0.58, hw - 2.6);
      const barTop = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.12, 1.4), neonMat);
      barTop.position.set(0.5, 1.18, hw - 2.6);
      g.add(bar, barTop);
      for (let bx = -2.8; bx <= 3.8; bx += 1.6) {
        const stLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.78, 8), goldMat);
        stLeg.position.set(bx, 0.39, hw - 3.9);
        const stSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12), velvetMat);
        stSeat.position.set(bx, 0.80, hw - 3.9);
        g.add(stLeg, stSeat);
      }
      // Volumetric Neon Ceiling Spot Beams
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      for (const [bx, bz, tilt] of [[-1, -3, 0.25], [1, 3, -0.25], [0, 0, 0.12]]) {
        const beam = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.4, 12, 1, true), beamMat);
        beam.position.set(bx, 2.2, bz);
        beam.rotation.z = tilt;
        g.add(beam);
      }
    } else if (enterable === 'ammunation') {
      // Ammu-Nation Tactical Counter + Illuminated Wall Weapon Racks (3D Rifles, Shotguns, RPG!)
      const counter = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.12, 10.0), woodMat);
      counter.position.set(-hd + 4.2, 0.56, 0);
      const cGlass = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 9.8), clearStoreGlass);
      cGlass.position.set(-hd + 4.2, 1.32, 0);
      const ammuSignTex = makeNeonSignTexture('AMMU-NATION', 'FREE ARSENAL & ARMOR REFILL', '#FFD36B', maxAniso, false);
      const ammuSign = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.8), new THREE.MeshBasicMaterial({ map: ammuSignTex }));
      ammuSign.rotation.y = Math.PI / 2;
      ammuSign.position.set(-hd + 0.75, 3.4, 0);
      g.add(counter, cGlass, ammuSign);
      // Pegboard Wall Weapon Displays on Back Wall
      const rackMat = new THREE.MeshStandardMaterial({ color: 0x8b1e28, roughness: 0.65 });
      for (let rz = -7.5; rz <= 7.5; rz += 3.0) {
        const board = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.0, 2.3), rackMat);
        board.position.set(-hd + 0.8, 1.85, rz);
        const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 1.4), gunMat);
        w1.position.set(-hd + 0.98, 2.35, rz);
        const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 1.2), goldMat);
        w2.position.set(-hd + 0.98, 1.78, rz);
        const w3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.9), gunMat);
        w3.position.set(-hd + 0.98, 1.22, rz);
        g.add(board, w1, w2, w3);
      }
      // Side Ammo Crates
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x3b4d2b, roughness: 0.72 });
      for (const cz of [-hw + 2.4, hw - 2.4]) {
        const cr = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 1.4), crateMat);
        cr.position.set(1.5, 0.48, cz);
        g.add(cr);
      }
    }
  } else {
    // Non-enterable building ground-floor glazed lobby
    const lobby = new THREE.Mesh(new THREE.BoxGeometry(cfg.d - 1.2, 4.6, cfg.w - 1.2), lobbyMat);
    lobby.position.set(0, 2.3, 0);
    g.add(lobby);
  }

  // Architectural Style-Specific Secondary & Accent Geometry (Distinct Silhouettes Across Districts!)
  if (style === 'colonial') {
    // Little Havana & Little Haiti Spanish Colonial: Sloped Terracotta Roof + Arched Colonnade + Juliette Balconies!
    const roofH = 4.2;
    const pitchRoof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(cfg.d, cfg.w) * 0.72, roofH, 4), terraMat);
    pitchRoof.rotation.y = Math.PI / 4;
    pitchRoof.scale.set(cfg.d / Math.max(cfg.d, cfg.w), 1, cfg.w / Math.max(cfg.d, cfg.w));
    pitchRoof.position.set(0, cfg.h + roofH * 0.5, 0);
    g.add(pitchRoof);

    const eave = new THREE.BoxGeometry(cfg.d + 1.4, 0.42, cfg.w + 1.4);
    eave.translate(0, cfg.h + 0.15, 0);
    trimParts.push(eave);

    for (let i = 0; i < 6; i++) {
      const cz = -cfg.w * 0.44 + (i / 5) * (cfg.w * 0.88);
      const col = new THREE.CylinderGeometry(0.32, 0.36, 4.6, 10);
      col.translate(cfg.d * 0.5 + 0.35, 2.3, cz);
      trimParts.push(col);
    }
    const colonnadeBeam = new THREE.BoxGeometry(1.4, 0.55, cfg.w + 0.4);
    colonnadeBeam.translate(cfg.d * 0.5 + 0.35, 4.55, 0);
    trimParts.push(colonnadeBeam);

    // Individual Wrought-Iron Juliette Balconies
    for (let fy = 8.4; fy <= cfg.h - 2.0; fy += 4.0) {
      for (const bz of [-cfg.w * 0.28, 0, cfg.w * 0.28]) {
        const jSlab = new THREE.BoxGeometry(1.1, 0.22, 3.2); jSlab.translate(cfg.d * 0.5 + 0.5, fy, bz); trimParts.push(jSlab);
        const jRail = new THREE.BoxGeometry(0.08, 0.88, 3.1); jRail.translate(cfg.d * 0.5 + 1.0, fy + 0.46, bz); ironParts.push(jRail);
      }
    }
    const awning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, cfg.w * 0.86), awningMat);
    awning.position.set(cfg.d * 0.5 + 1.25, 3.8, 0);
    awning.rotation.z = -0.36;
    g.add(awning);
  } else if (style === 'midtown_tower') {
    // Midtown / West Bayside Modernist Tiered Setback Tower + Vertical Concrete Fins + Rooftop Glass Penthouse!
    const topTierH = Math.max(7, cfg.h * 0.28);
    const tier = new THREE.Mesh(new THREE.BoxGeometry(cfg.d * 0.72, topTierH, cfg.w * 0.72), wallMat);
    tier.position.set(0, cfg.h + topTierH * 0.5, 0);
    g.add(tier);
    const pentGlass = new THREE.Mesh(new THREE.BoxGeometry(cfg.d * 0.48, 3.6, cfg.w * 0.48), atriumGlassMat);
    pentGlass.position.set(0, cfg.h + topTierH + 1.8, 0);
    g.add(pentGlass);
    const mast = new THREE.CylinderGeometry(0.12, 0.26, 8.5, 8);
    mast.translate(0, cfg.h + topTierH + 7.5, 0);
    ironParts.push(mast);
    // Vertical Architectural Fins wrapping all 4 facades
    for (let fz = -cfg.w * 0.44; fz <= cfg.w * 0.44; fz += 5.2) {
      const fE = new THREE.BoxGeometry(0.75, upperH, 0.36); fE.translate(cfg.d * 0.5 + 0.22, 4.6 + upperH * 0.5, fz); trimParts.push(fE);
      const fW = new THREE.BoxGeometry(0.75, upperH, 0.36); fW.translate(-cfg.d * 0.5 - 0.22, 4.6 + upperH * 0.5, fz); trimParts.push(fW);
    }
    const crownBand = new THREE.BoxGeometry(cfg.d * 0.74, 0.32, cfg.w * 0.74);
    crownBand.translate(0, cfg.h + topTierH + 0.16, 0);
    neonParts.push(crownBand);
  } else if (style === 'mall_atrium') {
    // North Point Mall / Galleria: Barrel-Vaulted Glass Skylight Roof + Monumental Colonnade Entrance!
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(cfg.d * 0.42, cfg.d * 0.42, cfg.w * 0.88, 20, 1, false, 0, Math.PI), atriumGlassMat);
    vault.rotation.x = Math.PI / 2;
    vault.rotation.z = Math.PI / 2;
    vault.position.set(0, cfg.h, 0);
    g.add(vault);
    for (let az = -cfg.w * 0.42; az <= cfg.w * 0.42; az += 5.5) {
      const rib = new THREE.TorusGeometry(cfg.d * 0.43, 0.24, 8, 20, Math.PI);
      rib.translate(0, cfg.h, az);
      trimParts.push(rib);
    }
    for (let i = 0; i < 6; i++) {
      const cz = -cfg.w * 0.45 + (i / 5) * (cfg.w * 0.90);
      const pier = new THREE.BoxGeometry(1.1, cfg.h * 0.55, 1.1);
      pier.translate(cfg.d * 0.5 + 0.8, cfg.h * 0.275, cz);
      trimParts.push(pier);
    }
    const fascia = new THREE.BoxGeometry(1.6, 1.2, cfg.w + 1.2);
    fascia.translate(cfg.d * 0.5 + 0.8, cfg.h * 0.55, 0);
    neonParts.push(fascia);
  } else if (style === 'warehouse') {
    // Vice Port / Industrial Depot: Sawtooth Skylight Roof + Steel Loading Docks + Hazard Trim!
    for (let wz = -cfg.w * 0.35; wz <= cfg.w * 0.36; wz += cfg.w * 0.34) {
      const saw = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 4.2, cfg.d - 0.6, 3), metalRoofMat);
      saw.rotation.z = Math.PI / 2;
      saw.position.set(0, cfg.h + 1.8, wz);
      g.add(saw);
    }
    for (const bz of [-cfg.w * 0.26, cfg.w * 0.26]) {
      const rollDoor = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.8, 4.8), ironMat);
      rollDoor.position.set(cfg.d * 0.5 + 0.1, 1.9, bz);
      g.add(rollDoor);
    }
    const duct = new THREE.CylinderGeometry(0.65, 0.65, 4.0, 10);
    duct.translate(-cfg.d * 0.25, cfg.h + 2.0, -cfg.w * 0.25);
    ironParts.push(duct);
    const indTrim = new THREE.BoxGeometry(0.32, 0.38, cfg.w + 0.4);
    indTrim.translate(cfg.d * 0.5 + 0.2, cfg.h - 0.2, 0);
    neonParts.push(indTrim);
  } else {
    // Iconic Miami Beach Art Deco Hotel (Ocean Drive): Streamline Corner Turrets, Protruding Balconies, Ziggurat Crown!
    for (let i = 0; i < 6; i++) {
      const cz = -cfg.w * 0.45 + (i / 5) * (cfg.w * 0.90);
      if (enterable && Math.abs(cz) < 4.2) continue; // Keep enterable doorway 100% unobstructed!
      const colE = new THREE.CylinderGeometry(0.28, 0.34, 4.6, 8);
      colE.translate(cfg.d * 0.5 - 0.25, 2.3, cz);
      trimParts.push(colE);
      const colW = new THREE.CylinderGeometry(0.28, 0.34, 4.6, 8);
      colW.translate(-cfg.d * 0.5 + 0.25, 2.3, cz);
      trimParts.push(colW);
    }
    for (const az of [-cfg.w * 0.29, cfg.w * 0.29]) {
      const awning = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, cfg.w * 0.30), awningMat);
      awning.position.set(cfg.d * 0.5 + 0.95, 3.85, az);
      awning.rotation.z = -0.34;
      g.add(awning);
    }
    for (const side of [-1, 1]) {
      const cornerZ = side * (cfg.w * 0.48);
      const turret = new THREE.CylinderGeometry(1.65, 1.65, cfg.h + 1.0, 12);
      turret.translate(cfg.d * 0.45, (cfg.h + 1.0) * 0.5, cornerZ);
      stuccoParts.push(turret);
      const glStrip = new THREE.BoxGeometry(0.42, upperH - 1.2, 0.72);
      glStrip.translate(cfg.d * 0.45 + 1.56, 4.8 + upperH * 0.5, cornerZ);
      glassBlockParts.push(glStrip);
    }
    const floorStep = 3.8;
    for (let fy = 4.6; fy <= cfg.h - 1.5; fy += floorStep) {
      const slab = new THREE.BoxGeometry(1.35, 0.26, cfg.w * 0.82);
      slab.translate(cfg.d * 0.5 + 0.55, fy, 0);
      trimParts.push(slab);
      if (fy > 4.6) {
        const topRail = new THREE.BoxGeometry(0.08, 0.08, cfg.w * 0.80);
        topRail.translate(cfg.d * 0.5 + 1.15, fy + 0.92, 0);
        ironParts.push(topRail);
        const midRail = new THREE.BoxGeometry(0.05, 0.05, cfg.w * 0.80);
        midRail.translate(cfg.d * 0.5 + 1.15, fy + 0.48, 0);
        ironParts.push(midRail);
        for (let bz = -cfg.w * 0.38; bz <= cfg.w * 0.38; bz += 2.2) {
          const post = new THREE.BoxGeometry(0.06, 0.92, 0.06);
          post.translate(cfg.d * 0.5 + 1.15, fy + 0.46, bz);
          ironParts.push(post);
        }
      }
    }
    const parapet = new THREE.BoxGeometry(cfg.d + 0.4, 1.1, cfg.w + 0.4);
    parapet.translate(0, cfg.h + 0.55, 0);
    trimParts.push(parapet);
    const neonCrown = new THREE.BoxGeometry(0.18, 0.16, cfg.w + 0.55);
    neonCrown.translate(cfg.d * 0.5 + 0.26, cfg.h + 0.95, 0);
    neonParts.push(neonCrown);
    const step1 = new THREE.BoxGeometry(cfg.d * 0.72, 2.2, cfg.w * 0.56);
    step1.translate(0.6, cfg.h + 2.1, 0);
    stuccoParts.push(step1);
    const step2 = new THREE.BoxGeometry(cfg.d * 0.42, 2.4, cfg.w * 0.30);
    step2.translate(1.2, cfg.h + 4.1, 0);
    trimParts.push(step2);
    const fin = new THREE.BoxGeometry(1.1, cfg.h + 6.2, 0.58);
    fin.translate(cfg.d * 0.5 + 0.2, (cfg.h + 6.2) * 0.5, 0);
    trimParts.push(fin);
    const finNeon = new THREE.BoxGeometry(0.18, cfg.h + 6.4, 0.22);
    finNeon.translate(cfg.d * 0.5 + 0.82, (cfg.h + 6.4) * 0.5, 0);
    neonParts.push(finNeon);
  }

  // Entrance marquee canopy
  const canopy = new THREE.BoxGeometry(3.4, 0.44, 8.2);
  canopy.translate(cfg.d * 0.5 + 1.5, 4.65, 0);
  trimParts.push(canopy);
  const canopyGlow = new THREE.BoxGeometry(0.18, 0.18, 8.3);
  canopyGlow.translate(cfg.d * 0.5 + 3.25, 4.65, 0);
  neonParts.push(canopyGlow);

  // Rooftop HVAC unit
  const hvac = new THREE.BoxGeometry(2.8, 1.5, 3.4);
  hvac.translate(-2.4, cfg.h + 1.5, -cfg.w * 0.24);
  ironParts.push(hvac);

  // Sidewalk Café Patio Tables & Striped Umbrellas (kept clear of center doorway!)
  if (cfg.cafe) {
    const umbParts = [];
    for (const tz of [-cfg.w * 0.34, cfg.w * 0.34]) {
      const px = cfg.d * 0.5 + 2.2;
      const tTop = new THREE.CylinderGeometry(0.64, 0.64, 0.08, 10); tTop.translate(px, 0.98, tz); trimParts.push(tTop);
      const tLeg = new THREE.CylinderGeometry(0.06, 0.08, 0.82, 6); tLeg.translate(px, 0.57, tz); ironParts.push(tLeg);
      const uPole = new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6); uPole.translate(px, 1.46, tz); ironParts.push(uPole);
      const uTop = new THREE.ConeGeometry(1.5, 0.55, 8, 1, true); uTop.translate(px, 2.68, tz); umbParts.push(uTop);
    }
    const umbMat = new THREE.MeshStandardMaterial({ color: cfg.accent, roughness: 0.78, side: THREE.DoubleSide });
    g.add(new THREE.Mesh(mergeGeometries(umbParts), umbMat));
  }

  const glassBlockMat = new THREE.MeshStandardMaterial({
    color: 0xdff6fa, emissive: cfg.accent, emissiveIntensity: 0.48, roughness: 0.2, metalness: 0.25
  });
  if (trimParts.length) g.add(new THREE.Mesh(mergeGeometries(trimParts), trimMat));
  if (ironParts.length) g.add(new THREE.Mesh(mergeGeometries(ironParts), ironMat));
  if (stuccoParts.length) g.add(new THREE.Mesh(mergeGeometries(stuccoParts), stuccoMat));
  if (neonParts.length) g.add(new THREE.Mesh(mergeGeometries(neonParts), neonMat));
  if (glassBlockParts.length) g.add(new THREE.Mesh(mergeGeometries(glassBlockParts), glassBlockMat));

  // Rooftop Neon Sign & Projecting Blade Sign
  const signTex = makeNeonSignTexture(cfg.name, enterable ? `${cfg.sub} · WALK IN` : cfg.sub, cfg.accentHex, maxAniso, false);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.min(cfg.w * 0.68, 11.4), 2.6),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.92 })
  );
  sign.rotation.y = Math.PI / 2;
  sign.position.set(cfg.d * 0.5 + 0.88, cfg.h + 2.3, 0);
  g.add(sign);

  const bladeTex = makeNeonSignTexture(cfg.name, '', cfg.accentHex, maxAniso, true);
  const bladeMat = new THREE.MeshStandardMaterial({ map: bladeTex, emissive: 0xffffff, emissiveMap: bladeTex, emissiveIntensity: 0.95 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.9, 6.4, 0.36), [
    ironMat, ironMat, ironMat, ironMat, bladeMat, bladeMat
  ]);
  blade.position.set(cfg.d * 0.5 + 1.7, 9.4, cfg.w * 0.30);
  g.add(blade);
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
    emissiveIntensity: 0.72,
    metalness: 0.84,
    roughness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.85
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

function makeMarqueeBoardTexture(sr, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  // Warm cream backlit translucent theater cinema letterboard
  const bg = ctx.createLinearGradient(0, 0, 0, 128);
  bg.addColorStop(0, '#fff7e0');
  bg.addColorStop(0.5, '#ffefc2');
  bg.addColorStop(1, '#f4d99b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  // Subtle horizontal plastic letter tracks
  ctx.fillStyle = 'rgba(72, 42, 18, 0.14)';
  for (let y = 18; y < 120; y += 26) ctx.fillRect(10, y, 492, 2);
  // Outer vintage crimson/dark border
  ctx.strokeStyle = '#381822';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 120);
  // Bold vintage cinema letter tiles
  ctx.fillStyle = '#c4163c';
  ctx.font = '800 22px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`NOW SHOWING · FEATURE ${sr.num} · ${sr.district.toUpperCase()}`, 256, 38);
  ctx.fillStyle = '#140c18';
  ctx.font = '900 44px "Big Shoulders Display", sans-serif';
  ctx.fillText(sr.title.toUpperCase(), 256, 86);
  ctx.fillStyle = '#5a2232';
  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.fillText('DRIVE UP OR WALK IN · PRESS ENTER', 256, 112);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

function makeVerticalBladeTexture(sr, maxAniso) {
  const c = document.createElement('canvas');
  c.width = 160; c.height = 512;
  const ctx = c.getContext('2d');
  // Deep Miami Deco teal/plum steel sign face
  ctx.fillStyle = '#181024';
  ctx.fillRect(0, 0, 160, 512);
  ctx.strokeStyle = sr.accentHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 140, 492);
  ctx.strokeStyle = '#ffe599';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 120, 472);
  // Top number crest
  ctx.fillStyle = sr.accentHex;
  ctx.fillRect(26, 28, 108, 72);
  ctx.fillStyle = '#10061a';
  ctx.font = '900 54px "Big Shoulders Display", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(sr.num, 80, 82);
  // Vertical stacked vintage theater letters (never truncated mid-word)
  const raw = sr.title.toUpperCase();
  const bladeWord =
    raw.includes('FIXMY') ? 'FIXMYITCH' :
    raw.includes('MAGIC') ? 'MAGIC' :
    raw.includes('AGENTIC') ? 'AGENTIC' :
    raw.includes('AI') ? 'AI IMPACT' :
    raw.includes('JOURNEY') ? 'JOURNEY' :
    raw.replace(/\s+/g, '').slice(0, 8);
  const chars = bladeWord.replace(/\s+/g, '');
  const fontSize = chars.length >= 9 ? 36 : chars.length >= 7 ? 42 : 48;
  ctx.fillStyle = '#fff5dc';
  ctx.font = `900 ${fontSize}px "Big Shoulders Display", sans-serif`;
  const availH = 344;
  const stepY = Math.min(54, Math.floor(availH / Math.max(1, chars.length)));
  const totalH = (chars.length - 1) * stepY;
  const startY = Math.round(138 + (availH - totalH) * 0.5 + fontSize * 0.32);
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], 80, startY + i * stepY);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createCaseStudyShowroom(sr, textureLoader, maxAniso) {
  const g = new THREE.Group();

  // Authentic 1986 Miami Beach Art Deco Palette (Sun-warmed cream stucco, brushed brass, deep crimson carpet)
  const stuccoMat = new THREE.MeshStandardMaterial({ color: 0xf0e4d4, roughness: 0.78, metalness: 0.04 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xfaf4eb, roughness: 0.56, metalness: 0.06 });
  const darkBronzeMat = new THREE.MeshStandardMaterial({ color: 0x221b26, metalness: 0.72, roughness: 0.28, envMapIntensity: 1.15 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xdcb464, metalness: 0.88, roughness: 0.2, envMapIntensity: 1.3 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdde3ee, metalness: 0.9, roughness: 0.16, envMapIntensity: 1.35 });
  const neonMat = new THREE.MeshStandardMaterial({ color: sr.accent, emissive: sr.accent, emissiveIntensity: 1.55 });
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0x9e162e, roughness: 0.92, metalness: 0.02 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xb81a38, roughness: 0.72 });
  const bulbMatA = new THREE.MeshStandardMaterial({ color: 0xfff2c2, emissive: 0xffd268, emissiveIntensity: 1.65 });
  const bulbMatB = new THREE.MeshStandardMaterial({ color: 0xfff2c2, emissive: 0xffd268, emissiveIntensity: 0.45 });

  // 1. Grounded Art Deco Showcase Cinema / Studio Building Facade (Deep foundation skirt so it sits rock-solid on any terrain!)
  const deepSkirt = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.6, 15.2), darkBronzeMat);
  deepSkirt.position.set(-0.2, -1.78, 0);
  g.add(deepSkirt);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.36, 14.8), trimMat);
  plinth.position.set(-0.2, 0.18, 0);
  plinth.receiveShadow = true;
  g.add(plinth);
  // Subtle Vertical Skyline Spotlight Beacon rising above the Art Deco Crown (helps locate spread-out showrooms across Leonida!)
  const skyBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 1.35, 54, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: sr.accent, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide })
  );
  skyBeacon.position.set(-1.25, 38.5, 0);
  g.add(skyBeacon);

  // Main stepped cream-stucco Art Deco pavilion volume
  const mainWall = new THREE.Mesh(new THREE.BoxGeometry(4.4, 9.6, 13.8), stuccoMat);
  mainWall.position.set(-1.3, 5.0, 0);
  mainWall.castShadow = true;
  mainWall.receiveShadow = true;
  g.add(mainWall);

  // Stepped Art Deco Ziggurat Crown Parapet
  const crown1 = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.85, 14.3), trimMat);
  crown1.position.set(-1.25, 10.15, 0);
  const crown2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.05, 9.4), stuccoMat);
  crown2.position.set(-1.25, 11.05, 0);
  const crownCap = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.24, 9.7), neonMat);
  crownCap.position.set(-1.25, 11.65, 0);
  g.add(crown1, crown2, crownCap);

  // Fluted Art Deco Corner Pilasters + Horizontal Neon Deco Speed-Lines
  for (const pz of [-6.75, 6.75]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(4.85, 10.2, 0.72), trimMat);
    pil.position.set(-1.18, 5.2, pz);
    g.add(pil);
    const flute = new THREE.Mesh(new THREE.BoxGeometry(0.16, 9.4, 0.16), neonMat);
    flute.position.set(1.26, 5.1, pz);
    g.add(flute);
  }
  for (const hy of [1.1, 9.55]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 13.9), neonMat);
    stripe.position.set(0.95, hy, 0);
    g.add(stripe);
  }

  // 2. Massive Framed Outdoor Cinema Gallery Showcase (Mounted Solidly on Facade — Zero Floating Sci-Fi!)
  const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(0.42, 5.8, 10.8), darkBronzeMat);
  frameOuter.position.set(1.06, 6.45, 0);
  const frameBrass = new THREE.Mesh(new THREE.BoxGeometry(0.48, 6.02, 11.04), brassMat);
  frameBrass.position.set(0.98, 6.45, 0);
  g.add(frameBrass, frameOuter);

  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.42, roughness: 0.36, metalness: 0.04
  });
  textureLoader.load(sr.img, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    screenMat.map = tex;
    screenMat.emissiveMap = tex;
    screenMat.needsUpdate = true;
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 5.3), screenMat);
  screen.rotation.y = Math.PI / 2;
  screen.position.set(1.30, 6.45, 0);
  g.add(screen);

  // 4 Overhanging Brushed-Chrome Architectural Gallery Gooseneck Floodlamps
  const lampBulbMat = new THREE.MeshStandardMaterial({ color: 0xfff5d6, emissive: 0xffd98a, emissiveIntensity: 1.5 });
  for (const lz of [-3.6, -1.2, 1.2, 3.6]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.35, 8), chromeMat);
    arm.rotation.z = Math.PI / 2 - 0.18;
    arm.position.set(1.65, 9.55, lz);
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.34, 10), darkBronzeMat);
    hood.position.set(2.26, 9.42, lz);
    hood.rotation.z = -0.35;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), lampBulbMat);
    glow.position.set(2.22, 9.28, lz);
    g.add(arm, hood, glow);
  }

  // 3. Classic 1986 Curved Miami Cinema Marquee Canopy with Chasing Incandescent Bulbs!
  const marqueeBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.32, 11.4), darkBronzeMat);
  marqueeBody.position.set(2.5, 3.15, 0);
  g.add(marqueeBody);
  const marqueeRoofTrim = new THREE.Mesh(new THREE.BoxGeometry(3.36, 0.14, 11.6), brassMat);
  marqueeRoofTrim.position.set(2.5, 3.84, 0);
  const marqueeBotTrim = new THREE.Mesh(new THREE.BoxGeometry(3.36, 0.14, 11.6), brassMat);
  marqueeBotTrim.position.set(2.5, 2.46, 0);
  g.add(marqueeRoofTrim, marqueeBotTrim);

  // Backlit Theater Letterboard Marquee (Front + Both Sides so readable from up & down Ocean Drive!)
  const mqTex = makeMarqueeBoardTexture(sr, maxAniso);
  const mqMat = new THREE.MeshStandardMaterial({
    map: mqTex, emissive: 0xfff2d2, emissiveMap: mqTex, emissiveIntensity: 0.72, roughness: 0.4
  });
  const mqFront = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 1.12), mqMat);
  mqFront.rotation.y = Math.PI / 2;
  mqFront.position.set(4.12, 3.15, 0);
  g.add(mqFront);

  // Side marquee boards (readable approaching from North or South!)
  const mqSideTex = makeNeonSignTexture(`★ ${sr.num} · ${sr.title}`, 'NOW SHOWING · ENTER', sr.accentHex, maxAniso, false);
  const mqSideMat = new THREE.MeshStandardMaterial({
    map: mqSideTex, emissive: 0xffffff, emissiveMap: mqSideTex, emissiveIntensity: 0.85
  });
  const mqLeft = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.08), mqSideMat);
  mqLeft.position.set(2.5, 3.15, 5.72);
  const mqRight = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.08), mqSideMat);
  mqRight.rotation.y = Math.PI;
  mqRight.position.set(2.5, 3.15, -5.72);
  g.add(mqLeft, mqRight);

  // 24 Classic Chasing Incandescent Cinema Bulbs along Marquee Perimeter (Alternating A/B Banks!)
  const bulbGeo = new THREE.SphereGeometry(0.095, 8, 8);
  let bulbIdx = 0;
  for (let i = 0; i < 12; i++) {
    const bz = -5.2 + (i / 11) * 10.4;
    for (const by of [2.52, 3.78]) {
      const b = new THREE.Mesh(bulbGeo, bulbIdx % 2 === 0 ? bulbMatA : bulbMatB);
      b.position.set(4.15, by, bz);
      g.add(b);
      bulbIdx++;
    }
  }

  // Twin Brass Marquee Support Columns
  for (const cz of [-4.6, 4.6]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.45, 10), brassMat);
    col.position.set(3.55, 1.32, cz);
    g.add(col);
  }

  // 4. Iconic Vertical Miami Beach Art Deco Neon Blade Sign (Projects Out Over Curb — Visible From Blocks Away!)
  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(3.65, 8.6, 6.2);
  const bladeCore = new THREE.Mesh(new THREE.BoxGeometry(2.3, 7.6, 0.44), darkBronzeMat);
  const bladeTex = makeVerticalBladeTexture(sr, maxAniso);
  const bladeFaceMat = new THREE.MeshStandardMaterial({
    map: bladeTex, emissive: 0xffffff, emissiveMap: bladeTex, emissiveIntensity: 0.92
  });
  const bladeN = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 7.4), bladeFaceMat);
  bladeN.position.z = 0.24;
  const bladeS = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 7.4), bladeFaceMat);
  bladeS.rotation.y = Math.PI;
  bladeS.position.z = -0.24;
  // Steel mounting brackets connecting blade sign to Art Deco corner pilaster
  for (const by of [-2.4, 2.2]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 0.18), chromeMat);
    strut.position.set(-2.3, by, 0);
    bladeGroup.add(strut);
  }
  // Retro Art Deco Finial Spire atop Blade Sign
  const bladeSpire = new THREE.Mesh(new THREE.ConeGeometry(0.32, 2.1, 8), brassMat);
  bladeSpire.position.set(0, 4.8, 0);
  const bladeTopper = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), neonMat);
  bladeTopper.position.set(0, 6.1, 0);
  bladeGroup.add(bladeCore, bladeN, bladeS, bladeSpire, bladeTopper);
  g.add(bladeGroup);

  // 5. VIP Red-Carpet & Velvet-Rope Forecourt + Terracotta Palm Planters
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.05, 3.2), carpetMat);
  carpet.position.set(4.6, 0.22, 0);
  const carpetGoldN = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 0.14), brassMat);
  carpetGoldN.position.set(4.6, 0.225, 1.56);
  const carpetGoldS = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 0.14), brassMat);
  carpetGoldS.position.set(4.6, 0.225, -1.56);
  g.add(carpet, carpetGoldN, carpetGoldS);

  // 6 Brass Stanchion Posts & Draped Velvet Ropes framing the Red Carpet
  for (const sideZ of [-1.72, 1.72]) {
    for (const sx of [2.4, 4.6, 6.8]) {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 10), brassMat);
      base.position.set(sx, 0.22, sideZ);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.96, 8), brassMat);
      post.position.set(sx, 0.7, sideZ);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), brassMat);
      knob.position.set(sx, 1.2, sideZ);
      g.add(base, post, knob);
    }
    for (const rx of [3.5, 5.7]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.2, 8), ropeMat);
      rope.rotation.z = Math.PI / 2;
      rope.position.set(rx, 0.98, sideZ);
      g.add(rope);
    }
  }

  // Twin Warm Terracotta Planter Pots with Tropical Foliage flanking the Entrance
  const potMat = new THREE.MeshStandardMaterial({ color: 0xc46b48, roughness: 0.72 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x268248, roughness: 0.62 });
  for (const pz of [-3.5, 3.5]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.4, 0.85, 10), potMat);
    pot.position.set(2.1, 0.62, pz);
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), leafMat);
    bush.position.set(2.1, 1.48, pz);
    bush.scale.set(1.0, 1.25, 1.0);
    g.add(pot, bush);
  }

  // 6. Grounded VIP Valet Pull-In Bay + Classic GTA Vice City Spinning Gold Mission Star!
  const bayGeo = new THREE.PlaneGeometry(5.6, 11.4);
  bayGeo.rotateX(-Math.PI / 2);
  const bayC = document.createElement('canvas');
  bayC.width = 256; bayC.height = 512;
  const bctx = bayC.getContext('2d');
  bctx.clearRect(0, 0, 256, 512);
  bctx.strokeStyle = '#FFD36B';
  bctx.lineWidth = 10;
  bctx.setLineDash([24, 14]);
  bctx.strokeRect(16, 16, 224, 480);
  bctx.setLineDash([]);
  bctx.fillStyle = sr.accentHex;
  bctx.globalAlpha = 0.11;
  bctx.fillRect(20, 20, 216, 472);
  bctx.globalAlpha = 0.95;
  bctx.fillStyle = '#FFF5DC';
  bctx.font = '800 26px "JetBrains Mono", monospace';
  bctx.textAlign = 'center';
  bctx.save();
  bctx.translate(128, 256);
  bctx.rotate(-Math.PI / 2);
  bctx.fillText(`VIP VALET ${sr.num} · ENTER`, 0, 10);
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
  bay.position.set(8.6, 0.045, 0);
  g.add(bay);

  // Classic GTA Vice City Spinning Golden Star Mission Pickup right at the Red-Carpet Curb
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.82 : 0.36;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  starShape.closePath();
  const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2 });
  starGeo.center();
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffd35a, emissive: 0xffa824, emissiveIntensity: 0.85, metalness: 0.85, roughness: 0.18
  });
  const starMarker = new THREE.Mesh(starGeo, starMat);
  starMarker.position.set(7.6, 1.45, 0);
  g.add(starMarker);

  g.rotation.y = sr.rotY || 0;
  return { group: g, bulbMatA, bulbMatB, starMarker, starMat, bladeTopper };
}

/* ==========================================================================
   4. SCULPTED TRAFFIC COUPE (SHARED MERGED GEOMETRIES & MATERIALS)
   ========================================================================== */
let _trafficCache = null;
function makeTaxiCheckerTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f5c028';
  ctx.fillRect(0, 0, 128, 32);
  for (let x = 0; x < 128; x += 16) {
    ctx.fillStyle = (x / 16) % 2 === 0 ? '#111218' : '#ffffff';
    ctx.fillRect(x, 6, 16, 10);
    ctx.fillStyle = (x / 16) % 2 === 0 ? '#ffffff' : '#111218';
    ctx.fillRect(x, 16, 16, 10);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

function getTrafficCache() {
  if (_trafficCache) return _trafficCache;
  const extrudeBody = (pts, w = 1.72, bevel = 0.095) => {
    const sh = new THREE.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: w, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.85, bevelSegments: 6, curveSegments: 18 });
    g.translate(0, 0, -w * 0.5);
    g.rotateY(Math.PI / 2);
    return g;
  };

  // Sculpted High-Poly Lower Monocoques (ending cleanly at beltline so glossy glass greenhouse & A/B/C pillars shine!)
  const sedanBody = extrudeBody([
    [-2.24, 0.27], [2.22, 0.27], [2.30, 0.48], [2.16, 0.69], [1.26, 0.80], [-1.32, 0.82], [-2.22, 0.74], [-2.28, 0.44]
  ], 1.72, 0.10);
  const sedanGlass = extrudeBody([
    [-1.24, 0.80], [1.16, 0.78], [0.74, 1.27], [-0.74, 1.27]
  ], 1.56, 0.045);

  const coupeBody = extrudeBody([
    [-2.28, 0.23], [2.24, 0.23], [2.32, 0.45], [2.16, 0.64], [1.14, 0.76], [-1.48, 0.79], [-2.28, 0.72], [-2.32, 0.39]
  ], 1.80, 0.11);
  const coupeGlass = extrudeBody([
    [-1.36, 0.76], [1.04, 0.74], [0.46, 1.16], [-0.84, 1.16]
  ], 1.60, 0.045);

  const convBody = extrudeBody([
    [-2.22, 0.25], [2.22, 0.25], [2.28, 0.46], [2.14, 0.67], [1.28, 0.76], [0.85, 0.72], [-1.05, 0.72], [-1.45, 0.77], [-2.18, 0.71], [-2.26, 0.42]
  ], 1.76, 0.11);

  const suvBody = extrudeBody([
    [-2.28, 0.35], [2.24, 0.35], [2.32, 0.65], [2.22, 0.88], [1.30, 0.96], [-2.22, 0.95], [-2.30, 0.54]
  ], 1.86, 0.10);
  const suvGlass = extrudeBody([
    [-1.94, 0.95], [1.22, 0.94], [0.84, 1.60], [-1.88, 1.60]
  ], 1.72, 0.04);

  // Sleek Low-Profile Hood Power-Bulge (only applied on sporty coupe/muscle cars — flush & aerodynamic!)
  const hoodBulge = new THREE.BoxGeometry(0.76, 0.042, 0.96);
  hoodBulge.translate(0, 0.79, -1.46);
  const hoodSculptGeo = mergeGeometries([hoodBulge]);

  // High-Poly 28-segment Rounded Tires + Hollow Deep-Dish Twin-5-Spoke Alloy Wheels + Ventilated Brake Rotors!
  const wheelTireGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 28, 1, true);
  wheelTireGeo.rotateZ(Math.PI / 2);
  const wheelSidewall = new THREE.TorusGeometry(0.30, 0.064, 12, 28);
  wheelSidewall.rotateY(Math.PI / 2);
  wheelSidewall.translate(0.105, 0, 0);
  const wheelSidewallIn = wheelSidewall.clone();
  wheelSidewallIn.translate(-0.21, 0, 0);
  const wheelInnerDrum = new THREE.CylinderGeometry(0.24, 0.24, 0.11, 20);
  wheelInnerDrum.rotateZ(Math.PI / 2);
  const fullTireGeo = mergeGeometries([wheelTireGeo, wheelSidewall, wheelSidewallIn, wheelInnerDrum]);

  const wheelRotorGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.17, 22);
  wheelRotorGeo.rotateZ(Math.PI / 2);

  const rimLipOut = new THREE.TorusGeometry(0.244, 0.022, 10, 28);
  rimLipOut.rotateY(Math.PI / 2); rimLipOut.translate(0.132, 0, 0);
  const rimLipIn = new THREE.TorusGeometry(0.244, 0.022, 10, 28);
  rimLipIn.rotateY(Math.PI / 2); rimLipIn.translate(-0.132, 0, 0);
  const spokeGeos = [rimLipOut, rimLipIn];
  for (let s = 0; s < 5; s++) {
    const ang = (s / 5) * Math.PI * 2;
    for (const off of [-0.09, 0.09]) {
      const a2 = ang + off;
      for (const sx of [-0.125, 0.125]) {
        const sp = new THREE.BoxGeometry(0.026, 0.22, 0.025);
        sp.rotateX(a2);
        sp.translate(sx, Math.cos(a2) * 0.115, Math.sin(a2) * 0.115);
        spokeGeos.push(sp);
      }
    }
  }
  const wheelRimGeo = mergeGeometries(spokeGeos);
  const wheelHubGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.295, 16);
  wheelHubGeo.rotateZ(Math.PI / 2);

  // Sculpted Bumpers, Front Valance Air-Dam, Side Rocker Skirts, Recessed Wheel Wells & Aero Right Mirror
  const bF = new THREE.BoxGeometry(1.96, 0.15, 0.20); bF.translate(0, 0.34, -2.30);
  const bR = new THREE.BoxGeometry(1.96, 0.15, 0.20); bR.translate(0, 0.34, 2.30);
  const airDam = new THREE.BoxGeometry(1.76, 0.11, 0.16); airDam.translate(0, 0.22, -2.24);
  const skirtL = new THREE.BoxGeometry(0.10, 0.10, 2.18); skirtL.translate(-0.92, 0.22, 0.0);
  const skirtR = new THREE.BoxGeometry(0.10, 0.10, 2.18); skirtR.translate(0.92, 0.22, 0.0);
  const grille = new THREE.BoxGeometry(1.22, 0.24, 0.08); grille.translate(0, 0.50, -2.28);
  const plateCove = new THREE.BoxGeometry(0.56, 0.26, 0.05); plateCove.translate(0, 0.44, 2.34);
  const mirRPod = new THREE.CapsuleGeometry(0.045, 0.10, 6, 10); mirRPod.rotateZ(Math.PI / 2); mirRPod.translate(1.00, 0.87, -0.58);
  const mirRStalk = new THREE.BoxGeometry(0.12, 0.036, 0.045); mirRStalk.translate(0.92, 0.84, -0.58);
  const archGeoParts = [];
  for (const [ax, az] of [[-0.91, -1.32], [0.91, -1.32], [-0.91, 1.32], [0.91, 1.32]]) {
    const ar = new THREE.TorusGeometry(0.41, 0.042, 8, 20, Math.PI);
    ar.rotateY(Math.PI / 2);
    ar.translate(ax, 0.36, az);
    const well = new THREE.CylinderGeometry(0.39, 0.39, 0.14, 16, 1, false, 0, Math.PI);
    well.rotateZ(Math.PI / 2);
    well.translate(ax > 0 ? 0.84 : -0.84, 0.36, az);
    archGeoParts.push(ar, well);
  }

  // Chrome Trim: Dual Exhausts, Front Grille Slats + Emblem Badge, Headlight Bezels, Bumper Overriders, Side Beltline & Rear Trunk Strip
  const exhaustL = new THREE.CylinderGeometry(0.050, 0.054, 0.26, 14); exhaustL.rotateX(Math.PI / 2); exhaustL.translate(-0.56, 0.26, 2.34);
  const exhaustR = new THREE.CylinderGeometry(0.050, 0.054, 0.26, 14); exhaustR.rotateX(Math.PI / 2); exhaustR.translate(0.56, 0.26, 2.34);
  const slat1 = new THREE.BoxGeometry(1.18, 0.022, 0.09); slat1.translate(0, 0.56, -2.30);
  const slat2 = new THREE.BoxGeometry(1.18, 0.022, 0.09); slat2.translate(0, 0.50, -2.30);
  const slat3 = new THREE.BoxGeometry(1.18, 0.022, 0.09); slat3.translate(0, 0.44, -2.30);
  const badge = new THREE.OctahedronGeometry(0.055, 0); badge.scale(1.0, 1.0, 0.35); badge.translate(0, 0.50, -2.35);
  const beltTrimL = new THREE.BoxGeometry(0.032, 0.032, 3.72); beltTrimL.translate(-0.93, 0.62, 0.02);
  const beltTrimR = new THREE.BoxGeometry(0.032, 0.032, 3.72); beltTrimR.translate(0.93, 0.62, 0.02);
  const trunkStrip = new THREE.BoxGeometry(1.86, 0.032, 0.04); trunkStrip.translate(0, 0.69, 2.33);
  const bumperStripF = new THREE.BoxGeometry(1.98, 0.042, 0.04); bumperStripF.translate(0, 0.36, -2.40);
  const bumperStripR = new THREE.BoxGeometry(1.98, 0.042, 0.04); bumperStripR.translate(0, 0.36, 2.40);
  const bezParts = [];
  for (const sx of [-0.70, 0.70]) {
    const hb = new THREE.BoxGeometry(0.42, 0.19, 0.05); hb.translate(sx, 0.54, -2.29); bezParts.push(hb);
  }

  // Shared Sculpted 3D Interior Cabin Geometry (Contoured Capsule Bucket Seats + Headrests + Dash + Wheel!)
  const inDash = new THREE.BoxGeometry(1.50, 0.20, 0.38); inDash.translate(0, 0.78, -0.66);
  const inConsole = new THREE.BoxGeometry(0.22, 0.18, 1.16); inConsole.translate(0, 0.74, -0.02);
  const inWheel = new THREE.TorusGeometry(0.155, 0.022, 10, 20); inWheel.rotateX(0.32); inWheel.translate(-0.37, 0.92, -0.34);
  const makeBucketSeat = (sx) => {
    const back = new THREE.CapsuleGeometry(0.175, 0.32, 6, 14);
    back.scale(1.12, 1.0, 0.48); back.rotateX(-0.18); back.translate(sx, 0.90, 0.42);
    const head = new THREE.CapsuleGeometry(0.105, 0.08, 6, 12);
    head.scale(1.08, 0.92, 0.62); head.translate(sx, 1.14, 0.48);
    return [back, head];
  };
  const interiorGeo = mergeGeometries([inDash, inConsole, inWheel, ...makeBucketSeat(-0.38), ...makeBucketSeat(0.38)]);

  // Multi-Element Headlights, Amber Corner Turn Signals, Red Brake Taillights & White Reverse Lamps!
  const hlParts = [], tlParts = [], amberParts = [], revParts = [];
  for (const sx of [-0.66, 0.66]) {
    const hl = new THREE.BoxGeometry(0.30, 0.13, 0.06); hl.translate(sx, 0.54, -2.31); hlParts.push(hl);
    const tl = new THREE.BoxGeometry(0.40, 0.13, 0.06); tl.translate(sx, 0.58, 2.31); tlParts.push(tl);
    const ambF = new THREE.BoxGeometry(0.10, 0.11, 0.09); ambF.translate(sx > 0 ? 0.87 : -0.87, 0.54, -2.26); amberParts.push(ambF);
    const ambR = new THREE.BoxGeometry(0.12, 0.13, 0.07); ambR.translate(sx > 0 ? 0.87 : -0.87, 0.58, 2.29); amberParts.push(ambR);
    const rev = new THREE.BoxGeometry(0.14, 0.07, 0.06); rev.translate(sx > 0 ? 0.41 : -0.41, 0.56, 2.31); revParts.push(rev);
  }

  // Reusable seated NPC driver & Protagonist driver geometries (visible inside open convertibles & glass!)
  const drTorso = new THREE.CapsuleGeometry(0.155, 0.24, 6, 14); drTorso.scale(1.08, 1.0, 0.72); drTorso.translate(-0.37, 0.92, 0.18);
  const drArmL = new THREE.CapsuleGeometry(0.042, 0.26, 6, 10); drArmL.rotateX(Math.PI / 2 - 0.18); drArmL.translate(-0.50, 0.94, -0.08);
  const drArmR = new THREE.CapsuleGeometry(0.042, 0.26, 6, 10); drArmR.rotateX(Math.PI / 2 - 0.18); drArmR.translate(-0.24, 0.94, -0.08);
  const drHead  = new THREE.SphereGeometry(0.12, 16, 14); drHead.scale(0.92, 1.08, 0.96); drHead.translate(-0.37, 1.21, 0.20);
  const drHair  = new THREE.SphereGeometry(0.128, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58); drHair.translate(-0.37, 1.24, 0.21);
  const driverBodyGeo = mergeGeometries([drTorso, drArmL, drArmR]);
  const driverHeadGeo = mergeGeometries([drHead]);
  const driverHairGeo = mergeGeometries([drHair]);

  const pbr = getWorldPBRTextures(4);
  _trafficCache = {
    sedanBody, sedanGlass, coupeBody, coupeGlass, convBody, suvBody, suvGlass, hoodSculptGeo,
    wheelTireGeo: fullTireGeo, wheelRimGeo, wheelHubGeo, wheelRotorGeo, interiorGeo, driverBodyGeo, driverHeadGeo, driverHairGeo,
    trimGeo: mergeGeometries([bF, bR, airDam, skirtL, skirtR, grille, plateCove, mirRPod, mirRStalk, ...archGeoParts]),
    exhaustGeo: mergeGeometries([exhaustL, exhaustR, slat1, slat2, slat3, badge, beltTrimL, beltTrimR, trunkStrip, bumperStripF, bumperStripR, ...bezParts]),
    hlGeo: mergeGeometries(hlParts),
    tlGeo: mergeGeometries(tlParts),
    amberGeo: mergeGeometries(amberParts),
    revGeo: mergeGeometries(revParts),
    paintFlakeNorm: pbr.paintFlake.normalMap,
    glassMat: new THREE.MeshPhysicalMaterial({ color: 0x0b182c, metalness: 0.28, roughness: 0.025, clearcoat: 1.0, clearcoatRoughness: 0.02, transparent: true, opacity: 0.48, envMapIntensity: 2.35 }),
    tireMat: new THREE.MeshStandardMaterial({ map: pbr.tireTread.map, normalMap: pbr.tireTread.normalMap, normalScale: new THREE.Vector2(1.25, 1.25), color: 0x202228, roughness: 0.78, metalness: 0.06 }),
    darkMat: new THREE.MeshStandardMaterial({ color: 0x12141b, roughness: 0.72, metalness: 0.18 }),
    rotorMat: new THREE.MeshStandardMaterial({ color: 0xb6c0d0, metalness: 0.92, roughness: 0.22, envMapIntensity: 1.65 }),
    caliperMat: new THREE.MeshStandardMaterial({ color: 0xe22434, metalness: 0.42, roughness: 0.26 }),
    chromeMat: new THREE.MeshStandardMaterial({ color: 0xf2f6fc, metalness: 0.98, roughness: 0.06, envMapIntensity: 2.10 }),
    amberMat: new THREE.MeshStandardMaterial({ color: 0xffa624, emissive: 0xff8c14, emissiveIntensity: 1.15, roughness: 0.18 }),
    revMat: new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.20 }),
    leatherMat: new THREE.MeshStandardMaterial({ color: 0xa66638, roughness: 0.52, metalness: 0.05 }),
    driverSkinMat: new THREE.MeshStandardMaterial({ color: 0xdfaa82, roughness: 0.56 }),
    driverShirtMat: new THREE.MeshStandardMaterial({ color: 0xe64a84, roughness: 0.70 }),
    playerShirtMat: new THREE.MeshStandardMaterial({ color: 0x16b8b2, roughness: 0.68 }),
    driverHairMat: new THREE.MeshStandardMaterial({ color: 0x1c151f, roughness: 0.72 }),
    aviatorMat: new THREE.MeshPhysicalMaterial({ color: 0xff7b2e, metalness: 0.88, roughness: 0.08, clearcoat: 1.0 }),
    plateMat: new THREE.MeshStandardMaterial({ map: makeLicensePlateTexture(), roughness: 0.40, metalness: 0.14 }),
    taxiStripeMat: new THREE.MeshStandardMaterial({ map: makeTaxiCheckerTexture(), roughness: 0.40 }),
    taxiSignMat: new THREE.MeshStandardMaterial({ color: 0xffe46b, emissive: 0xffcc22, emissiveIntensity: 1.65 }),
    surfMat: new THREE.MeshPhysicalMaterial({ color: 0x21e6d1, roughness: 0.16, metalness: 0.18, clearcoat: 1.0 })
  };
  return _trafficCache;
}

const TRAFFIC_ARCHETYPES = {
  coupe:       { label: 'CHEETAH GT COUPE',    topSpeed: 47, accel: 25, grip: 1.05, wheelY: 0.35 },
  convertible: { label: 'OCEAN SPIDER',        topSpeed: 44, accel: 23, grip: 1.00, wheelY: 0.35 },
  muscle:      { label: 'SABRE TURBO',         topSpeed: 46, accel: 25, grip: 0.94, wheelY: 0.36 },
  taxi:        { label: 'VICE CITY CAB',       topSpeed: 40, accel: 21, grip: 0.96, wheelY: 0.36 },
  suv:         { label: 'BEACH RANCHER SUV',   topSpeed: 38, accel: 20, grip: 0.92, wheelY: 0.41 },
  sedan:       { label: 'OCEANIC SEDAN',       topSpeed: 41, accel: 21, grip: 0.96, wheelY: 0.36 }
};

export function createTrafficCar(colorHex, archetype = 'sedan') {
  const c = getTrafficCache();
  const spec = TRAFFIC_ARCHETYPES[archetype] || TRAFFIC_ARCHETYPES.sedan;
  const g = new THREE.Group();
  const bodyGroup = new THREE.Group();
  g.add(bodyGroup);

  const finalColor = archetype === 'taxi' ? 0xf5be22 : colorHex;
  const paint = new THREE.MeshPhysicalMaterial({
    color: finalColor,
    metalness: 0.72,
    roughness: 0.13,
    normalMap: c.paintFlakeNorm,
    normalScale: new THREE.Vector2(0.16, 0.16),
    clearcoat: 1.0,
    clearcoatRoughness: 0.036,
    envMapIntensity: 2.05
  });
  const headLensMat = new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffe8ae, emissiveIntensity: 1.55 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xd4162c, emissive: 0xf01832, emissiveIntensity: 1.42 });

  // Ground contact shadow
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 5.55), getContactShadowMat());
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.03;
  g.add(sh);

  const bodyGeo =
    archetype === 'coupe' || archetype === 'muscle' ? c.coupeBody :
    archetype === 'convertible' ? c.convBody :
    archetype === 'suv' ? c.suvBody :
    c.sedanBody;
  const bodyMesh = new THREE.Mesh(bodyGeo, paint);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyGroup.add(bodyMesh);
  if (archetype === 'coupe' || archetype === 'muscle') bodyGroup.add(new THREE.Mesh(c.hoodSculptGeo, paint));
  bodyGroup.add(new THREE.Mesh(c.trimGeo, c.darkMat));
  bodyGroup.add(new THREE.Mesh(c.exhaustGeo, c.chromeMat));
  bodyGroup.add(new THREE.Mesh(c.hlGeo, headLensMat));
  bodyGroup.add(new THREE.Mesh(c.tlGeo, tailMat));
  bodyGroup.add(new THREE.Mesh(c.amberGeo, c.amberMat));
  bodyGroup.add(new THREE.Mesh(c.revGeo, c.revMat));

  // Visible 3D Interior & Seated NPC Driver on ALL traffic cars (ejected visibly during carjacking!)
  const interiorMesh = new THREE.Mesh(c.interiorGeo, archetype === 'convertible' ? c.leatherMat : c.darkMat);
  if (archetype === 'suv') interiorMesh.position.y = 0.18;
  bodyGroup.add(interiorMesh);

  const driverMesh = new THREE.Group();
  const dTorso = new THREE.Mesh(c.driverBodyGeo, c.driverShirtMat);
  const dHead = new THREE.Mesh(c.driverHeadGeo, c.driverSkinMat);
  const dHair = new THREE.Mesh(c.driverHairGeo, c.driverHairMat);
  driverMesh.add(dTorso, dHead, dHair);
  if (archetype === 'suv') driverMesh.position.y = 0.18;
  bodyGroup.add(driverMesh);

  // Seated Protagonist Driver (toggled visible when player steals/drives this car!)
  const playerDriverMesh = new THREE.Group();
  const pdTorso = new THREE.Mesh(c.driverBodyGeo, c.playerShirtMat);
  const pdHead = new THREE.Mesh(c.driverHeadGeo, c.driverSkinMat);
  const pdHair = new THREE.Mesh(c.driverHairGeo, c.driverHairMat);
  const pdShades = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), c.aviatorMat);
  pdShades.position.set(-0.37, 1.21, 0.08);
  playerDriverMesh.add(pdTorso, pdHead, pdHair, pdShades);
  if (archetype === 'suv') playerDriverMesh.position.y = 0.18;
  playerDriverMesh.visible = false;
  bodyGroup.add(playerDriverMesh);

  // Rear Vice City License Plate
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.21), c.plateMat);
  plate.position.set(0, 0.44, 2.385);
  bodyGroup.add(plate);

  // HINGED DRIVER-SIDE DOOR on EVERY traffic car (swings wide open during carjack animation!)
  const isSuv = archetype === 'suv';
  const doorHingeX = isSuv ? -0.96 : -0.91;
  const doorHingeY = isSuv ? 0.68 : 0.56;
  const driverDoorPivot = new THREE.Group();
  driverDoorPivot.position.set(doorHingeX, doorHingeY, -0.52);
  const dPanel = new THREE.Mesh(new THREE.BoxGeometry(0.09, isSuv ? 0.52 : 0.42, 1.04), paint);
  dPanel.position.set(0, 0, 0.52);
  const dChromeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.030, 1.02), c.chromeMat);
  dChromeTrim.position.set(-0.01, 0.06, 0.52);
  const dHandle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.036, 0.15), c.chromeMat);
  dHandle.position.set(-0.055, 0.12, 0.80);
  const dMirror = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.10, 6, 10), paint);
  dMirror.rotation.z = Math.PI / 2;
  dMirror.position.set(-0.11, isSuv ? 0.30 : 0.28, 0.04);
  driverDoorPivot.add(dPanel, dChromeTrim, dHandle, dMirror);
  if (archetype !== 'convertible') {
    const dWin = new THREE.Mesh(new THREE.BoxGeometry(0.045, isSuv ? 0.48 : 0.38, 0.84), c.glassMat);
    dWin.position.set(0.05, isSuv ? 0.46 : 0.38, 0.52);
    dWin.rotation.z = -0.22;
    driverDoorPivot.add(dWin);
  }
  bodyGroup.add(driverDoorPivot);

  // Archetype-specific high-poly sculpted greenhouse, painted roof caps, A/B/C pillars & trim
  if (archetype === 'convertible') {
    const wsFrame = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.48, 0.08), c.chromeMat);
    wsFrame.position.set(0, 0.94, -0.78); wsFrame.rotation.x = -0.46;
    const ws = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.40, 0.09), c.glassMat);
    ws.position.set(0, 0.94, -0.78); ws.rotation.x = -0.46;
    bodyGroup.add(wsFrame, ws);
    // Dark recessed cockpit tub & sleek chrome twin sport roll-hoops behind bucket seats!
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.16, 1.56), c.darkMat);
    cabin.position.set(0, 0.72, 0.06);
    bodyGroup.add(cabin);
    for (const rx of [-0.38, 0.38]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.024, 10, 18, Math.PI), c.chromeMat);
      hoop.position.set(rx, 0.96, 0.68);
      bodyGroup.add(hoop);
    }
    const tonneau = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 1.38, 6, 12), c.leatherMat);
    tonneau.rotation.z = Math.PI / 2;
    tonneau.scale.set(0.65, 1.0, 1.2);
    tonneau.position.set(0, 0.84, 0.86);
    bodyGroup.add(tonneau);
  } else if (archetype === 'suv') {
    bodyGroup.add(new THREE.Mesh(c.suvGlass, c.glassMat));
    // Painted SUV roof panel + A/B/C pillars framing the windows!
    const suvRoof = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.08, 2.74), paint);
    suvRoof.position.set(0, 1.63, 0.52);
    bodyGroup.add(suvRoof);
    for (const sx of [-0.88, 0.88]) {
      const aPil = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.74, 0.09), paint);
      aPil.position.set(sx, 1.28, -0.96); aPil.rotation.x = 0.42;
      const bPil = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.68, 0.11), c.darkMat);
      bPil.position.set(sx, 1.28, 0.22);
      const cPil = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.68, 0.18), paint);
      cPil.position.set(sx, 1.28, 1.82);
      bodyGroup.add(aPil, bPil, cPil);
    }
    // Front chrome bull-bar on SUV
    const bullBar = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.032, 8, 16, Math.PI), c.chromeMat);
    bullBar.position.set(0, 0.46, -2.42);
    bodyGroup.add(bullBar);
    for (const sx of [-0.68, 0.68]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 10), c.chromeMat);
      rail.rotation.x = Math.PI / 2; rail.position.set(sx, 1.72, 0.35);
      bodyGroup.add(rail);
    }
    const board = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 1.82, 8, 16), c.surfMat);
    board.rotation.x = Math.PI / 2; board.scale.set(1.0, 1.0, 0.24);
    board.position.set(0.28, 1.79, 0.35);
    bodyGroup.add(board);
    const spare = new THREE.Mesh(c.wheelTireGeo, c.darkMat);
    spare.rotation.y = Math.PI / 2; spare.position.set(0, 0.90, 2.34);
    bodyGroup.add(spare);
  } else {
    const isSport = archetype === 'coupe' || archetype === 'muscle';
    bodyGroup.add(new THREE.Mesh(isSport ? c.coupeGlass : c.sedanGlass, c.glassMat));
    // Sculpted Painted Roof Cap + A/B/C Pillars (crisp authentic car greenhouse!)
    const roofY = isSport ? 1.21 : 1.32;
    const roofLen = isSport ? 1.36 : 1.54;
    const roofZ = isSport ? 0.20 : 0.02;
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.072, roofLen), paint);
    roofCap.position.set(0, roofY, roofZ);
    bodyGroup.add(roofCap);
    for (const sx of [-0.80, 0.80]) {
      const aPil = new THREE.Mesh(new THREE.BoxGeometry(0.064, isSport ? 0.56 : 0.62, 0.08), paint);
      aPil.position.set(sx, isSport ? 0.99 : 1.05, isSport ? -0.72 : -0.92);
      aPil.rotation.x = isSport ? 0.64 : 0.50;
      const bPil = new THREE.Mesh(new THREE.BoxGeometry(0.055, isSport ? 0.44 : 0.52, 0.08), c.darkMat);
      bPil.position.set(sx, isSport ? 0.98 : 1.05, isSport ? 0.16 : 0.04);
      const cPil = new THREE.Mesh(new THREE.BoxGeometry(0.072, isSport ? 0.58 : 0.64, 0.16), paint);
      cPil.position.set(sx, isSport ? 0.98 : 1.05, isSport ? 1.08 : 0.98);
      cPil.rotation.x = isSport ? -0.66 : -0.46;
      bodyGroup.add(aPil, bPil, cPil);
    }
    if (archetype === 'coupe') {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.055, 0.30), paint);
      wing.position.set(0, 0.99, 2.02);
      const stL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.18), c.darkMat); stL.position.set(-0.62, 0.85, 2.02);
      const stR = stL.clone(); stR.position.x = 0.62;
      bodyGroup.add(wing, stL, stR);
    } else if (archetype === 'muscle') {
      const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.085, 0.54), c.chromeMat);
      scoop.position.set(0, 0.835, -1.32);
      const scoopIntake = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.055, 0.04), c.darkMat);
      scoopIntake.position.set(0, 0.835, -1.595);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf7f5fa, roughness: 0.26 });
      for (const sx of [-0.16, 0.16]) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 4.18), stripeMat);
        stripe.position.set(sx, 0.79, -0.05);
        bodyGroup.add(stripe);
      }
      bodyGroup.add(scoop, scoopIntake);
    } else if (archetype === 'taxi') {
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.21, 0.28), c.taxiSignMat);
      sign.position.set(0, 1.42, 0.04);
      const stL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 3.7), c.taxiStripeMat); stL.position.set(-0.94, 0.56, 0);
      const stR = stL.clone(); stR.position.x = 0.94;
      bodyGroup.add(sign, stL, stR);
    }
  }

  // Articulated High-Poly Twin-5-Spoke Alloy Wheels + Visible Ventilated Brake Rotors & Red Calipers!
  const wheelSpinGroups = [];
  const frontSteerGroups = [];
  const rimMat = c.chromeMat.clone();
  const wheelScale = archetype === 'suv' ? 1.15 : 1.0;
  for (const [wx, wz, isFront] of [[-0.95, -1.32, true], [0.95, -1.32, true], [-0.95, 1.32, false], [0.95, 1.32, false]]) {
    const steerGrp = new THREE.Group();
    steerGrp.position.set(wx, spec.wheelY, wz);
    const outSign = wx > 0 ? 1 : -1;
    const cal = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.12, 0.09), c.caliperMat);
    cal.position.set(outSign * 0.095, 0.03, isFront ? 0.11 : -0.11);
    steerGrp.add(cal);
    const spinGrp = new THREE.Group();
    const tire = new THREE.Mesh(c.wheelTireGeo, c.tireMat);
    const rotor = new THREE.Mesh(c.wheelRotorGeo, c.rotorMat);
    const rim = new THREE.Mesh(c.wheelRimGeo, rimMat);
    const hub = new THREE.Mesh(c.wheelHubGeo, c.darkMat);
    spinGrp.add(tire, rotor, rim, hub);
    spinGrp.scale.setScalar(wheelScale);
    steerGrp.add(spinGrp);
    g.add(steerGrp);
    wheelSpinGroups.push(spinGrp);
    if (isFront) frontSteerGroups.push(steerGrp);
  }

  g.userData.carRig = {
    isHero: false,
    archetype,
    label: spec.label,
    topSpeed: spec.topSpeed,
    accel: spec.accel,
    grip: spec.grip,
    paintMat: paint,
    rimMat,
    baseColor: finalColor,
    bodyGroup,
    driverDoorPivot,
    wheelSpinGroups,
    frontSteerGroups,
    headLensMat,
    tailMat,
    driverMesh,
    playerDriverMesh
  };
  return g;
}

let _contactShadowMat = null;
export function getContactShadowMat() {
  if (_contactShadowMat) return _contactShadowMat;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  g.addColorStop(0, 'rgba(6, 3, 14, 0.56)');
  g.addColorStop(0.6, 'rgba(6, 3, 14, 0.26)');
  g.addColorStop(1, 'rgba(6, 3, 14, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  _contactShadowMat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
  return _contactShadowMat;
}

/* ==========================================================================
   5. SCULPTED ARTICULATED 3D GTA PEDESTRIANS (CITIZENS & MIAMI BEACH BIKINI)
   ========================================================================== */
const _faceMatCache = new Map();
const _npcFabricCache = new Map();

function getNpcFabricTexture(colorHex, pattern = 0) {
  const key = `${colorHex}_${pattern}`;
  if (_npcFabricCache.has(key)) return _npcFabricCache.get(key);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const hex = '#' + (colorHex >>> 0).toString(16).padStart(6, '0');
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle vertical cloth lighting fold & linen weave depth
  const fold = ctx.createLinearGradient(0, 0, 256, 0);
  fold.addColorStop(0, 'rgba(0,0,0,0.08)');
  fold.addColorStop(0.28, 'rgba(255,255,255,0.08)');
  fold.addColorStop(0.55, 'rgba(0,0,0,0.05)');
  fold.addColorStop(0.82, 'rgba(255,255,255,0.06)');
  fold.addColorStop(1, 'rgba(0,0,0,0.09)');
  ctx.fillStyle = fold;
  ctx.fillRect(0, 0, 256, 256);

  // Fine woven linen threads
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let y = 0; y < 256; y += 4) ctx.fillRect(0, y, 256, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.035)';
  for (let x = 0; x < 256; x += 6) ctx.fillRect(x, 0, 1, 256);

  if (pattern === 1) {
    // 80s Miami Resort Pinstripes
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let x = 8; x < 256; x += 18) ctx.fillRect(x, 0, 3, 256);
    ctx.fillStyle = 'rgba(10,12,24,0.12)';
    for (let x = 13; x < 256; x += 18) ctx.fillRect(x, 0, 2, 256);
  } else if (pattern === 2) {
    // Tropical Floral / Palm Resort Print
    for (let i = 0; i < 20; i++) {
      const px = (i * 73 + 18) % 256;
      const py = (i * 97 + 22) % 256;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((i % 6) * 0.52);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.24)' : 'rgba(15,40,55,0.22)';
      ctx.beginPath(); ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 10; i++) {
      const fx = (i * 89 + 40) % 256, fy = (i * 61 + 30) % 256;
      ctx.fillStyle = 'rgba(255,220,120,0.34)';
      ctx.beginPath(); ctx.arc(fx, fy, 6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (pattern === 3) {
    // Retro 80s Athletic Colorblock Chest Stripes
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.fillRect(0, 82, 256, 22);
    ctx.fillStyle = 'rgba(255,46,136,0.45)';
    ctx.fillRect(0, 108, 256, 12);
    ctx.fillStyle = 'rgba(33,230,209,0.42)';
    ctx.fillRect(0, 124, 256, 10);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  _npcFabricCache.set(key, tex);
  return tex;
}

function makeHairTexture(hairHex) {
  const key = 'hair_' + hairHex;
  if (_npcFabricCache.has(key)) return _npcFabricCache.get(key);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const col = new THREE.Color(hairHex);
  const baseHex = '#' + col.getHexString();
  const darkHex = '#' + col.clone().multiplyScalar(0.58).getHexString();
  const hiHex = '#' + col.clone().lerp(new THREE.Color(0xfff0dc), 0.28).getHexString();
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  // Layered anisotropic hair strands with subtle specular sheen band
  for (let i = 0; i < 340; i++) {
    const x = (i * 19.7) % 256;
    const w = 1.2 + (i % 3) * 0.9;
    ctx.strokeStyle = i % 5 === 0 ? hiHex : (i % 2 === 0 ? darkHex : baseHex);
    ctx.globalAlpha = i % 5 === 0 ? 0.34 : 0.45;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + Math.sin(i) * 8, 85, x - Math.cos(i) * 8, 170, x + Math.sin(i * 1.7) * 5, 256);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;
  const sheen = ctx.createLinearGradient(0, 48, 0, 140);
  sheen.addColorStop(0, 'rgba(255,244,230,0)');
  sheen.addColorStop(0.5, 'rgba(255,244,230,0.16)');
  sheen.addColorStop(1, 'rgba(255,244,230,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 48, 256, 92);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  _npcFabricCache.set(key, tex);
  return tex;
}

/* 512px Stylized Human Face Texture — Crisp, Natural Focused Eyes & Clean Chiseled Features */
function getFaceMaterial(skinHex, isFemale = false, facialHair = 0) {
  const key = `v3_${skinHex}_${isFemale ? 'f' : 'm'}_${facialHair}`;
  if (_faceMatCache.has(key)) return _faceMatCache.get(key);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  const baseCol = new THREE.Color(skinHex);
  const hex = '#' + baseCol.getHexString();
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 512, 512);

  // Clean sunlit warm facial plane shading (forehead highlight, crisp square-jaw & temple planes)
  const vertGrad = ctx.createLinearGradient(0, 80, 0, 450);
  vertGrad.addColorStop(0.0, 'rgba(255,244,230,0.12)');
  vertGrad.addColorStop(0.48, 'rgba(255,232,212,0.03)');
  vertGrad.addColorStop(0.80, 'rgba(54,24,16,0.14)');
  vertGrad.addColorStop(1.0, 'rgba(34,14,10,0.28)');
  ctx.fillStyle = vertGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle side-temple & jaw plane shading
  const sideGrad = ctx.createLinearGradient(140, 0, 372, 0);
  sideGrad.addColorStop(0.0, 'rgba(42,18,12,0.22)');
  sideGrad.addColorStop(0.22, 'rgba(42,18,12,0.04)');
  sideGrad.addColorStop(0.50, 'rgba(255,244,232,0.08)');
  sideGrad.addColorStop(0.78, 'rgba(42,18,12,0.04)');
  sideGrad.addColorStop(1.0, 'rgba(42,18,12,0.22)');
  ctx.fillStyle = sideGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft natural brow-to-eye shading (subtle, never dark raccoon circles!)
  for (const ex of [229, 283]) {
    const sock = ctx.createRadialGradient(ex, 244, 4, ex, 244, 18);
    sock.addColorStop(0, 'rgba(68,34,24,0.16)');
    sock.addColorStop(0.7, 'rgba(68,34,24,0.06)');
    sock.addColorStop(1, 'rgba(68,34,24,0)');
    ctx.fillStyle = sock;
    ctx.beginPath(); ctx.arc(ex, 244, 18, 0, Math.PI * 2); ctx.fill();
  }

  // Confident Squared Eyebrows (clean, sharp 80s action-hero brow line)
  ctx.fillStyle = isFemale ? '#2c1814' : '#1b110f';
  if (isFemale) {
    ctx.strokeStyle = '#2c1814';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(211, 229); ctx.quadraticCurveTo(228, 221, 244, 228); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(268, 228); ctx.quadraticCurveTo(284, 221, 301, 229); ctx.stroke();
  } else {
    // Crisp chiseled male eyebrows
    ctx.beginPath();
    ctx.moveTo(211, 232); ctx.lineTo(222, 226); ctx.lineTo(244, 229);
    ctx.lineTo(244, 235); ctx.lineTo(223, 232); ctx.lineTo(211, 236);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(301, 232); ctx.lineTo(290, 226); ctx.lineTo(268, 229);
    ctx.lineTo(268, 235); ctx.lineTo(289, 232); ctx.lineTo(301, 236);
    ctx.closePath(); ctx.fill();
  }

  // Natural Focused Eyes (clipped almond aperture, warm off-white sclera, upper-lid shadow, properly sized iris!)
  const irisColors = ['#3c2618', '#2a4d66', '#385838', '#4c3220'];
  const irisHex = irisColors[(skinHex + facialHair) % irisColors.length];
  for (const ex of [229, 283]) {
    const isLeft = ex < 256;
    const innerX = isLeft ? ex + 10.5 : ex - 10.5;
    const outerX = isLeft ? ex - 10.8 : ex + 10.8;
    const ey = 247;

    // Clipped natural eye aperture (slightly narrowed/focused, NEVER bug-eyed oval!)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(outerX, ey + 0.4);
    ctx.quadraticCurveTo(ex, ey - 6.4, innerX, ey + 0.6);
    ctx.quadraticCurveTo(ex, ey + 5.2, outerX, ey + 0.4);
    ctx.closePath();
    ctx.clip();

    // Warm natural sclera (off-white, never harsh neon white)
    const scleraGrad = ctx.createLinearGradient(0, ey - 6, 0, ey + 5);
    scleraGrad.addColorStop(0.0, '#c8beb4');
    scleraGrad.addColorStop(0.35, '#ece6de');
    scleraGrad.addColorStop(1.0, '#ded6cc');
    ctx.fillStyle = scleraGrad;
    ctx.fillRect(ex - 14, ey - 8, 28, 16);

    // Iris fills vertical opening cleanly (zero white ring above or below iris -> natural calm gaze!)
    ctx.fillStyle = '#181214';
    ctx.beginPath(); ctx.arc(ex, ey - 0.2, 5.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = irisHex;
    ctx.beginPath(); ctx.arc(ex, ey - 0.2, 4.3, 0, Math.PI * 2); ctx.fill();
    // Subtle lower iris warm light bounce
    ctx.fillStyle = 'rgba(255,220,185,0.22)';
    ctx.beginPath(); ctx.arc(ex, ey + 1.6, 2.2, 0, Math.PI * 2); ctx.fill();
    // Crisp dark pupil
    ctx.fillStyle = '#0b090d';
    ctx.beginPath(); ctx.arc(ex, ey - 0.2, 2.3, 0, Math.PI * 2); ctx.fill();
    // Upper eyelid cast shadow across top of sclera & iris (key to natural non-staring eyes!)
    ctx.fillStyle = 'rgba(28,14,10,0.34)';
    ctx.fillRect(ex - 14, ey - 7, 28, 3.6);
    // Clean tiny specular catchlight
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath(); ctx.arc(ex + 1.5, ey - 1.5, 1.15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Crisp upper lash line + subtle lower rim
    ctx.strokeStyle = '#1d1210';
    ctx.lineWidth = isFemale ? 2.8 : 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(outerX, ey + 0.4);
    ctx.quadraticCurveTo(ex, ey - 6.6, innerX, ey + 0.6);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(64,30,22,0.32)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(outerX + (isLeft ? 2 : -2), ey + 1.4);
    ctx.quadraticCurveTo(ex, ey + 5.0, innerX - (isLeft ? 2 : -2), ey + 1.4);
    ctx.stroke();

    // Subtle upper eyelid crease above lash line
    ctx.strokeStyle = 'rgba(66,30,20,0.34)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(outerX, ey - 3.6);
    ctx.quadraticCurveTo(ex, ey - 8.2, innerX, ey - 3.2);
    ctx.stroke();
  }

  // Subtle cheekbone warmth
  ctx.fillStyle = isFemale ? 'rgba(222, 82, 112, 0.22)' : 'rgba(165, 76, 58, 0.10)';
  ctx.beginPath(); ctx.ellipse(208, 282, 17, 10, 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(304, 282, 17, 10, -0.14, 0, Math.PI * 2); ctx.fill();

  // Clean Structured Nose Bridge + Nostrils
  ctx.fillStyle = 'rgba(54,24,16,0.12)';
  ctx.fillRect(246, 240, 4.5, 42);
  ctx.fillRect(261.5, 240, 4.5, 42);
  const noseHi = ctx.createLinearGradient(256, 236, 256, 285);
  noseHi.addColorStop(0, 'rgba(255,248,238,0.06)');
  noseHi.addColorStop(0.7, 'rgba(255,248,238,0.22)');
  noseHi.addColorStop(1, 'rgba(255,248,238,0.04)');
  ctx.fillStyle = noseHi;
  ctx.fillRect(253, 238, 6, 44);
  ctx.fillStyle = 'rgba(46,20,14,0.36)';
  ctx.beginPath(); ctx.ellipse(249, 286, 4.2, 2.2, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(263, 286, 4.2, 2.2, 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(46,20,14,0.15)';
  ctx.beginPath(); ctx.ellipse(256, 291, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill();

  // Subtle Sun-Tanned Stubble along square jaw or 80s Mustache
  if (!isFemale && facialHair === 1) {
    const stubGrad = ctx.createRadialGradient(256, 356, 12, 256, 356, 58);
    stubGrad.addColorStop(0, 'rgba(40,22,16,0.11)');
    stubGrad.addColorStop(0.68, 'rgba(40,22,16,0.06)');
    stubGrad.addColorStop(1, 'rgba(40,22,16,0)');
    ctx.fillStyle = stubGrad;
    ctx.beginPath(); ctx.ellipse(256, 356, 56, 36, 0, 0, Math.PI * 2); ctx.fill();
  } else if (!isFemale && facialHair === 2) {
    ctx.fillStyle = '#241614';
    ctx.beginPath();
    ctx.moveTo(234, 314); ctx.quadraticCurveTo(256, 302, 278, 314);
    ctx.quadraticCurveTo(256, 318, 234, 314);
    ctx.fill();
  }

  // Clean Confident Mouth / Lips (natural skin-blended tone on male hero, soft lipstick on female)
  ctx.fillStyle = 'rgba(48,20,14,0.12)';
  ctx.fillRect(253, 294, 6, 22);
  const upperLipCol = isFemale ? '#c43a5c' : '#9c5c50';
  const lowerLipCol = isFemale ? '#da5274' : '#ae6b5c';
  ctx.fillStyle = upperLipCol;
  ctx.beginPath();
  ctx.moveTo(237, 326);
  ctx.quadraticCurveTo(248, 320, 256, 323);
  ctx.quadraticCurveTo(264, 320, 275, 326);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lowerLipCol;
  ctx.beginPath();
  ctx.moveTo(238, 326);
  ctx.quadraticCurveTo(256, 336, 274, 326);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(48,18,14,0.46)';
  ctx.lineWidth = 1.7;
  ctx.beginPath(); ctx.moveTo(237, 326); ctx.quadraticCurveTo(256, 328, 275, 326); ctx.stroke();
  ctx.fillStyle = 'rgba(38,16,12,0.16)';
  ctx.beginPath(); ctx.ellipse(256, 346, 14, 3.5, 0, 0, Math.PI * 2); ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.54, metalness: 0.02 });
  _faceMatCache.set(key, mat);
  return mat;
}

/* ==========================================================================
   CONTINUOUS 13-BONE SKINNED-MESH ANATOMICAL HUMAN GENERATOR (GTA VICE CITY)
   - Zero Roblox boxes, zero detached tubes, zero ball-joint spheres!
   - Smooth GPU bone-weighted deformation across waist, shoulders, elbows, knees & ankles
   - 3D-sculpted human head (brow, recessed eye sockets, sculpted nose, cheekbones, jaw, lips)
   - Sculpted articulated hands (palm + angled thumb + curled fingers) & detailed sneakers
   ========================================================================== */
function smoothstep01(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// Helper: append an anatomically lofted, skin-weighted mesh tube into shared vertex/index/group buffers
// Slices MUST be ordered bottom-to-top (increasing y) for consistent outward-facing normals!
function appendSkinnedLoft(out, slices, radSegs, matIndex, skinFn, uvScaleU = 1, uvScaleV = 1, closeBottom = false, closeTop = false, squareness = 1.0) {
  const baseVert = out.pos.length / 3;
  const stride = radSegs + 1;
  const nRings = slices.length;

  for (let r = 0; r < nRings; r++) {
    const sl = slices[r];
    const vCoord = (r / Math.max(1, nRings - 1)) * uvScaleV;
    const fSign = sl.facing || -1; // -1 = -Z forward, +1 = +Z forward
    const sq = sl.squareness !== undefined ? sl.squareness : squareness;
    for (let s = 0; s <= radSegs; s++) {
      const u = s / radSegs;
      const th = u * Math.PI * 2;
      const ca = Math.cos(th);
      const sa = Math.sin(th);
      // Superellipse squaring: sq=1.0 is smooth ellipse, sq~0.42..0.55 is crisp chiseled squarish block!
      const cShape = sq < 0.99 ? Math.sign(ca) * Math.pow(Math.abs(ca), sq) : ca;
      const sShape = sq < 0.99 ? Math.sign(sa) * Math.pow(Math.abs(sa), sq) : sa;
      // Forward factor: +1 on character's front, -1 on character's back
      const fwd = sa * fSign;
      let rx = sl.rx;
      let rz = sl.rz;
      let dx = 0;
      let dz = 0;

      // Subtle anatomical shaping (toned down on squarish hero so planar surfaces stay crisp!)
      const anatScale = sq < 0.99 ? 0.35 : 1.0;
      if (sl.pectorals && fwd > 0) {
        const pec = Math.sin(Math.min(1, Math.abs(ca)) * Math.PI) * Math.pow(fwd, 1.35);
        dz += fSign * sl.pectorals * pec * anatScale;
      }
      if (sl.spineGroove && fwd < 0) {
        const groove = Math.exp(-ca * ca * 14.0) * (-fwd);
        dz += fSign * sl.spineGroove * groove * anatScale;
      }
      if (sl.glutes && fwd < 0) {
        const gl = (0.55 + 0.45 * Math.sin(Math.min(1, Math.abs(ca)) * Math.PI)) * Math.pow(-fwd, 1.25);
        dz -= fSign * sl.glutes * gl * anatScale;
      }
      if (sl.frontBulge && fwd > 0) {
        dz += fSign * sl.frontBulge * Math.pow(fwd, 1.4) * anatScale;
      }
      if (sl.backBulge && fwd < 0) {
        dz -= fSign * sl.backBulge * Math.pow(-fwd, 1.4) * anatScale;
      }

      const px = (sl.cx || 0) + cShape * rx + dx;
      const py = sl.y;
      const pz = (sl.cz || 0) + sShape * rz + dz;
      out.pos.push(px, py, pz);
      out.uv.push(u * uvScaleU, vCoord);
      const sk = skinFn(px, py, pz, r / Math.max(1, nRings - 1));
      out.si.push(sk[0], sk[1], sk[2], sk[3]);
      out.sw.push(sk[4], sk[5], sk[6], sk[7]);
    }
  }

  const grp = out.groups[matIndex];
  for (let r = 0; r < nRings - 1; r++) {
    for (let s = 0; s < radSegs; s++) {
      const a = baseVert + r * stride + s;
      const b = baseVert + (r + 1) * stride + s;
      const c = baseVert + (r + 1) * stride + (s + 1);
      const d = baseVert + r * stride + (s + 1);
      // Outward winding: (b-a) x (d-a) = (+dY) x (+dTheta) = +Normal!
      grp.push(a, b, d, b, c, d);
    }
  }

  if (closeBottom) {
    const sl0 = slices[0];
    const capIdx = out.pos.length / 3;
    const cx = sl0.cx || 0, cy = sl0.y, cz = sl0.cz || 0;
    out.pos.push(cx, cy, cz);
    out.uv.push(0.5, 0);
    const sk = skinFn(cx, cy, cz, 0);
    out.si.push(sk[0], sk[1], sk[2], sk[3]);
    out.sw.push(sk[4], sk[5], sk[6], sk[7]);
    for (let s = 0; s < radSegs; s++) {
      grp.push(capIdx, baseVert + s, baseVert + s + 1);
    }
  }
  if (closeTop) {
    const slN = slices[nRings - 1];
    const capIdx = out.pos.length / 3;
    const cx = slN.cx || 0, cy = slN.y, cz = slN.cz || 0;
    out.pos.push(cx, cy, cz);
    out.uv.push(0.5, 1);
    const sk = skinFn(cx, cy, cz, 1);
    out.si.push(sk[0], sk[1], sk[2], sk[3]);
    out.sw.push(sk[4], sk[5], sk[6], sk[7]);
    const topRing = baseVert + (nRings - 1) * stride;
    for (let s = 0; s < radSegs; s++) {
      grp.push(capIdx, topRing + s + 1, topRing + s);
    }
  }
}

// Helper: append a rigid bone-weighted sub-geometry (hand palm, thumb, fingers, sneaker) into the unified SkinnedMesh
function appendSkinnedSubGeo(out, geo, matIndex, boneIdx) {
  const nonIdx = geo.index ? geo.toNonIndexed() : geo;
  const pos = nonIdx.attributes.position;
  const uv = nonIdx.attributes.uv;
  const baseVert = out.pos.length / 3;
  const grp = out.groups[matIndex];
  for (let i = 0; i < pos.count; i++) {
    out.pos.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    out.uv.push(uv ? uv.getX(i) : 0.5, uv ? uv.getY(i) : 0.5);
    out.si.push(boneIdx, 0, 0, 0);
    out.sw.push(1, 0, 0, 0);
    grp.push(baseVert + i);
  }
  if (nonIdx !== geo) nonIdx.dispose();
}

// Build a unified continuous 13-Bone SkinnedMesh BufferGeometry for a GTA Vice City human archetype
// Material slots: 0 = skinMat, 1 = topMat (shirt/bikini), 2 = botMat (trousers/shorts), 3 = shoeMat, 4 = sole/accentMat
function buildSkinnedHumanBodyGeo(opts) {
  const {
    facing = -1,      // -1 = -Z forward (Player), +1 = +Z forward (NPC)
    isFemale = false,
    isBikini = false,
    longSleeve = false,
    shorts = false,
    skirt = false,
    hero = false
  } = opts;

  const out = { pos: [], uv: [], si: [], sw: [], groups: [[], [], [], [], []] };
  // Crisp athletic proportions — hero uses chiseled squarish silhouette across torso, arms & legs!
  const armX = isFemale ? 0.194 : (hero ? 0.252 : 0.224);
  const legX = isFemale ? 0.098 : (hero ? 0.120 : 0.110);
  const bScale = hero ? 1.12 : (isFemale ? 1.00 : 1.06);
  const torsoSq = hero ? 0.44 : 1.0;
  const limbSq = hero ? 0.48 : 1.0;

  // 1. CONTINUOUS SCULPTED PELVIS -> WAIST -> RIBCAGE -> PECTORALS -> TRAPEZIUS -> NECK (Bones 0=hips, 1=chest, 2=head)
  const torsoSkin = (px, py) => {
    if (py < 1.38) {
      const wChest = smoothstep01(0.84, 1.00, py);
      return [0, 1, 0, 0, 1 - wChest, wChest, 0, 0];
    }
    const wHead = smoothstep01(1.47, 1.57, py);
    return [1, 2, 0, 0, 1 - wHead, wHead, 0, 0];
  };

  if (isBikini) {
    const pelvSlices = [
      { y: 0.76, rx: 0.125, rz: 0.102, facing },
      { y: 0.82, rx: 0.192, rz: 0.136, glutes: 0.032, facing },
      { y: 0.88, rx: 0.208, rz: 0.140, glutes: 0.038, facing },
      { y: 0.94, rx: 0.186, rz: 0.124, glutes: 0.016, facing },
      { y: 0.97, rx: 0.160, rz: 0.110, facing }
    ];
    appendSkinnedLoft(out, pelvSlices, 22, 1, torsoSkin, 1, 1, true, false);
    const midSlices = [
      { y: 0.97, rx: 0.160, rz: 0.110, facing },
      { y: 1.04, rx: 0.138, rz: 0.104, spineGroove: 0.012, facing },
      { y: 1.11, rx: 0.148, rz: 0.112, spineGroove: 0.014, facing },
      { y: 1.19, rx: 0.172, rz: 0.124, pectorals: 0.038, spineGroove: 0.015, facing },
      { y: 1.26, rx: 0.184, rz: 0.128, pectorals: 0.052, spineGroove: 0.015, facing },
      { y: 1.33, rx: 0.184, rz: 0.120, pectorals: 0.028, spineGroove: 0.012, facing },
      { y: 1.40, rx: 0.192, rz: 0.108, facing },
      { y: 1.45, rx: 0.132, rz: 0.084, cz: -facing * 0.005, facing },
      { y: 1.49, rx: 0.062, rz: 0.058, cz: -facing * 0.010, facing },
      { y: 1.55, rx: 0.048, rz: 0.048, cz: -facing * 0.014, facing },
      { y: 1.62, rx: 0.038, rz: 0.040, cz: -facing * 0.016, facing }
    ];
    appendSkinnedLoft(out, midSlices, 22, 0, torsoSkin, 1, 1, false, false);
    const bTopSlices = [
      { y: 1.19, rx: 0.180, rz: 0.130, pectorals: 0.044, facing },
      { y: 1.26, rx: 0.192, rz: 0.134, pectorals: 0.058, facing },
      { y: 1.32, rx: 0.186, rz: 0.124, pectorals: 0.032, facing }
    ];
    appendSkinnedLoft(out, bTopSlices, 22, 1, torsoSkin, 1, 1, false, false);
  } else {
    // Pelvis / Trousers Waist / Flared 80s Resort Skirt (mat 2)
    const pelvSlices = isFemale ? (skirt ? [
      { y: 0.52, rx: 0.238, rz: 0.185, facing },
      { y: 0.64, rx: 0.222, rz: 0.168, facing },
      { y: 0.76, rx: 0.212, rz: 0.156, glutes: 0.028, facing },
      { y: 0.85, rx: 0.206, rz: 0.146, glutes: 0.026, facing },
      { y: 0.95, rx: 0.166, rz: 0.118, facing }
    ] : [
      { y: 0.76, rx: 0.130, rz: 0.106, facing },
      { y: 0.83, rx: 0.196, rz: 0.138, glutes: 0.032, facing },
      { y: 0.89, rx: 0.204, rz: 0.138, glutes: 0.028, facing },
      { y: 0.96, rx: 0.168, rz: 0.118, facing }
    ]) : (hero ? [
      { y: 0.75, rx: 0.176 * bScale, rz: 0.114 * bScale, facing },
      { y: 0.83, rx: 0.192 * bScale, rz: 0.128 * bScale, facing },
      { y: 0.89, rx: 0.194 * bScale, rz: 0.130 * bScale, facing },
      { y: 0.96, rx: 0.188 * bScale, rz: 0.124 * bScale, facing }
    ] : [
      { y: 0.75, rx: 0.132 * bScale, rz: 0.108 * bScale, facing },
      { y: 0.83, rx: 0.192 * bScale, rz: 0.138 * bScale, glutes: 0.026, facing },
      { y: 0.89, rx: 0.196 * bScale, rz: 0.140 * bScale, glutes: 0.022, facing },
      { y: 0.96, rx: 0.184 * bScale, rz: 0.132 * bScale, facing }
    ]);
    appendSkinnedLoft(out, pelvSlices, 24, 2, torsoSkin, 1, 1, !skirt, false, torsoSq);

    // Sculpted Shirt / Blazer Torso (mat 1) — squarish broad-shouldered boxy silhouette for hero!
    const upperSlices = isFemale ? [
      { y: 0.94, rx: 0.172, rz: 0.122, facing },
      { y: 1.03, rx: 0.150, rz: 0.114, spineGroove: 0.012, facing },
      { y: 1.13, rx: 0.166, rz: 0.124, pectorals: 0.028, spineGroove: 0.014, facing },
      { y: 1.24, rx: 0.190, rz: 0.134, pectorals: 0.048, spineGroove: 0.015, facing },
      { y: 1.34, rx: 0.196, rz: 0.128, pectorals: 0.026, spineGroove: 0.012, facing },
      { y: 1.41, rx: 0.202, rz: 0.118, facing },
      { y: 1.46, rx: 0.134, rz: 0.088, facing }
    ] : (hero ? [
      { y: 0.90, rx: 0.200 * bScale, rz: 0.132 * bScale, facing },
      { y: 0.99, rx: 0.196 * bScale, rz: 0.128 * bScale, facing },
      { y: 1.14, rx: 0.214 * bScale, rz: 0.138 * bScale, pectorals: 0.014, facing },
      { y: 1.28, rx: 0.232 * bScale, rz: 0.144 * bScale, pectorals: 0.018, facing },
      { y: 1.39, rx: 0.242 * bScale, rz: 0.142 * bScale, facing },
      { y: 1.44, rx: 0.234 * bScale, rz: 0.130 * bScale, facing },
      { y: 1.47, rx: 0.134 * bScale, rz: 0.090 * bScale, facing }
    ] : [
      { y: 0.90, rx: 0.198 * bScale, rz: 0.144 * bScale, facing },
      { y: 0.98, rx: 0.188 * bScale, rz: 0.136 * bScale, spineGroove: 0.012, facing },
      { y: 1.12, rx: 0.206 * bScale, rz: 0.148 * bScale, pectorals: 0.022, spineGroove: 0.016, facing },
      { y: 1.25, rx: 0.226 * bScale, rz: 0.156 * bScale, pectorals: 0.036, spineGroove: 0.018, facing },
      { y: 1.36, rx: 0.238 * bScale, rz: 0.150 * bScale, pectorals: 0.028, spineGroove: 0.014, facing },
      { y: 1.42, rx: 0.228 * bScale, rz: 0.132 * bScale, facing },
      { y: 1.47, rx: 0.136 * bScale, rz: 0.092 * bScale, facing }
    ]);
    appendSkinnedLoft(out, upperSlices, 24, 1, torsoSkin, 1.4, 1.0, false, hero, torsoSq);

    // Continuous Neck seamlessly rising & tucking inside skull base
    const neckSlices = [
      { y: 1.44, rx: 0.078 * bScale, rz: 0.070 * bScale, cz: -facing * 0.004, facing },
      { y: 1.49, rx: 0.062 * bScale, rz: 0.058 * bScale, cz: -facing * 0.008, facing },
      { y: 1.55, rx: 0.054 * bScale, rz: 0.052 * bScale, cz: -facing * 0.010, facing },
      { y: 1.63, rx: 0.044 * bScale, rz: 0.044 * bScale, cz: -facing * 0.012, facing }
    ];
    appendSkinnedLoft(out, neckSlices, 16, 0, torsoSkin, 1, 1, false, false, hero ? 0.65 : 1.0);
  }

  // 2. MUSCULAR / SLEEVED CONTINUOUS SKINNED ARMS (Squarish chiseled arms on hero!)
  const addArm = (sx, bUpper, bFore) => {
    const cx = sx * armX;
    const sc = isFemale ? 1.02 : (hero ? 1.24 : 1.18);
    const armSkin = (px, py) => {
      if (py > 1.35) {
        const wChest = smoothstep01(1.36, 1.45, py) * 0.44;
        return [bUpper, 1, 0, 0, 1 - wChest, wChest, 0, 0];
      }
      const wFore = smoothstep01(1.19, 1.09, py);
      return [bUpper, bFore, 0, 0, 1 - wFore, wFore, 0, 0];
    };

    const fullSlices = [
      { y: 0.89, cx, rx: 0.036 * sc, rz: 0.040 * sc, facing },                      // solid wrist
      { y: 0.94, cx, rx: 0.042 * sc, rz: 0.044 * sc, facing },                      // lower forearm
      { y: 1.02, cx, rx: 0.052 * sc, rz: 0.054 * sc, frontBulge: 0.007, facing },   // muscular forearm
      { y: 1.09, cx, rx: 0.056 * sc, rz: 0.056 * sc, facing },                      // upper forearm
      { y: 1.14, cx, rx: 0.052 * sc, rz: 0.052 * sc, facing },                      // elbow joint
      { y: 1.19, cx, rx: 0.056 * sc, rz: 0.058 * sc, facing },                      // lower bicep
      { y: 1.24, cx, rx: 0.064 * sc, rz: 0.066 * sc, frontBulge: 0.009, facing },   // mid bicep / sleeve cuff
      { y: 1.31, cx, rx: 0.070 * sc, rz: 0.072 * sc, frontBulge: 0.008, facing },   // upper bicep
      { y: 1.37, cx: cx - sx * 0.012, rx: 0.074 * sc, rz: 0.074 * sc, facing },     // broad deltoid cap
      { y: 1.42, cx: cx - sx * 0.032, rx: 0.066 * sc, rz: 0.066 * sc, facing },     // shoulder-chest overlap
      { y: 1.45, cx: cx - sx * 0.054, rx: 0.042 * sc, rz: 0.048 * sc, facing }      // deep clavicle anchor
    ];

    if (isBikini) {
      appendSkinnedLoft(out, fullSlices, 16, 0, armSkin, 1, 1, true, true, limbSq);
    } else if (longSleeve) {
      const jacketArm = fullSlices.map((sl, idx) => ({ ...sl, rx: sl.rx * (idx < 5 ? 1.14 : 1.10), rz: sl.rz * (idx < 5 ? 1.14 : 1.10) }));
      appendSkinnedLoft(out, jacketArm, 16, 1, armSkin, 1, 1, true, true, limbSq);
    } else {
      const bareSlices = fullSlices.slice(0, 7);
      const sleeveSlices = [
        { y: 1.22, cx, rx: 0.074 * sc, rz: 0.076 * sc, facing }, // substantial 80s Hawaiian/resort rolled sleeve cuff!
        ...fullSlices.slice(7).map((sl) => ({ ...sl, rx: sl.rx * 1.08, rz: sl.rz * 1.08 }))
      ];
      appendSkinnedLoft(out, bareSlices, 16, 0, armSkin, 1, 1, true, false, limbSq);
      appendSkinnedLoft(out, sleeveSlices, 16, 1, armSkin, 1, 1, true, true, limbSq);
    }

    // Solid Sculpted Human Fist / Hand (visible knuckles, palm & angled thumb!)
    const handY = 0.852;
    const palmGeo = new THREE.BoxGeometry(0.058 * sc, 0.078 * sc, 0.038 * sc, 2, 2, 1);
    palmGeo.translate(cx, handY, facing * 0.005);
    appendSkinnedSubGeo(out, palmGeo, 0, bFore);
    palmGeo.dispose();

    const fingersGeo = new THREE.BoxGeometry(0.056 * sc, 0.058 * sc, 0.030 * sc);
    fingersGeo.rotateX(facing * 0.34);
    fingersGeo.translate(cx, handY - 0.054 * sc, facing * 0.014);
    appendSkinnedSubGeo(out, fingersGeo, 0, bFore);
    fingersGeo.dispose();

    const thumbGeo = new THREE.CapsuleGeometry(0.013 * sc, 0.036 * sc, 4, 8);
    thumbGeo.rotateZ(sx * 0.42);
    thumbGeo.rotateX(facing * 0.35);
    thumbGeo.translate(cx - sx * 0.033 * sc, handY - 0.012 * sc, facing * 0.022);
    appendSkinnedSubGeo(out, thumbGeo, 0, bFore);
    thumbGeo.dispose();
  };
  addArm(-1, 3, 4);
  addArm(1, 5, 6);

  // 3. ATHLETIC CONTINUOUS SKINNED LEGS & FULL TAILORED DENIM / CHINOS (ZERO skinny stick legs!)
  const addLeg = (sx, bThigh, bShin, bAnkle) => {
    const cx = sx * legX;
    const sc = isFemale ? 1.04 : (hero ? 1.22 : 1.14);
    const legSkin = (px, py) => {
      if (py > 0.78) {
        const wHip = smoothstep01(0.79, 0.89, py) * 0.46;
        return [bThigh, 0, 0, 0, 1 - wHip, wHip, 0, 0];
      }
      if (py > 0.14) {
        const wShin = smoothstep01(0.50, 0.40, py);
        return [bThigh, bShin, 0, 0, 1 - wShin, wShin, 0, 0];
      }
      const wAnk = smoothstep01(0.11, 0.05, py);
      return [bShin, bAnkle, 0, 0, 1 - wAnk, wAnk, 0, 0];
    };

    const fullLeg = [
      { y: 0.06, cx, rx: 0.048 * sc, rz: 0.052 * sc, facing },                       // ankle
      { y: 0.14, cx, rx: 0.056 * sc, rz: 0.060 * sc, facing },                       // lower calf
      { y: 0.25, cx, rx: 0.068 * sc, rz: 0.074 * sc, backBulge: 0.014, facing },     // muscular calf peak
      { y: 0.35, cx, rx: 0.072 * sc, rz: 0.076 * sc, backBulge: 0.010, facing },     // upper calf
      { y: 0.41, cx, rx: 0.068 * sc, rz: 0.070 * sc, facing },                       // below knee
      { y: 0.45, cx, rx: 0.070 * sc, rz: 0.074 * sc, frontBulge: 0.009, facing },    // knee cap
      { y: 0.50, cx, rx: 0.078 * sc, rz: 0.082 * sc, frontBulge: 0.010, facing },    // lower quad
      { y: 0.62, cx, rx: 0.092 * sc, rz: 0.096 * sc, frontBulge: 0.012, facing },    // mid thigh
      { y: 0.74, cx, rx: 0.102 * sc, rz: 0.105 * sc, backBulge: 0.012, facing },     // upper thigh
      { y: 0.85, cx: cx - sx * 0.010, rx: 0.102 * sc, rz: 0.104 * sc, facing },      // hip blend
      { y: 0.89, cx: cx - sx * 0.020, rx: 0.082 * sc, rz: 0.086 * sc, facing }       // pelvis overlap
    ];

    if (isBikini || skirt) {
      appendSkinnedLoft(out, fullLeg, 18, 0, legSkin, 1, 1, true, true, limbSq);
    } else if (shorts) {
      appendSkinnedLoft(out, fullLeg.slice(0, 8), 18, 0, legSkin, 1, 1, true, false, limbSq);
      const shortSlices = [
        { y: 0.60, cx, rx: 0.102 * sc, rz: 0.105 * sc, facing },
        ...fullLeg.slice(8).map((sl) => ({ ...sl, rx: sl.rx * 1.06, rz: sl.rz * 1.06 }))
      ];
      appendSkinnedLoft(out, shortSlices, 18, 2, legSkin, 1, 1, true, true, limbSq);
    } else {
      // Full tailored 1986 denim jeans / Miami Vice relaxed linen trousers (squarish cut on hero!)
      const pantLeg = fullLeg.map((sl, idx) => ({
        ...sl,
        rx: sl.rx * (idx <= 2 ? 1.28 : 1.08),
        rz: sl.rz * (idx <= 2 ? 1.28 : 1.08)
      }));
      appendSkinnedLoft(out, pantLeg, 18, 2, legSkin, 1, 1.5, true, true, limbSq);
    }

    // Solid Sculpted 1986 Sneakers / Beach Sandals anchored to Ankle Bone!
    if (isBikini) {
      const footG = new THREE.CapsuleGeometry(0.040, 0.12, 5, 10);
      footG.rotateX(Math.PI / 2);
      footG.scale(1.06, 0.58, 1.0);
      footG.translate(cx, 0.036, facing * 0.044);
      appendSkinnedSubGeo(out, footG, 0, bAnkle);
      footG.dispose();
      const sandSole = new THREE.BoxGeometry(0.096, 0.024, 0.23);
      sandSole.translate(cx, 0.013, facing * 0.044);
      appendSkinnedSubGeo(out, sandSole, 1, bAnkle);
      sandSole.dispose();
    } else if (hero) {
      // Crisp squarish 1986 retro high-top sneakers matching hero's blocky stylized silhouette
      const sUpper = new THREE.BoxGeometry(0.118 * sc, 0.076, 0.244 * sc);
      sUpper.translate(cx, 0.062, facing * 0.044);
      appendSkinnedSubGeo(out, sUpper, 3, bAnkle);
      sUpper.dispose();

      const sToe = new THREE.BoxGeometry(0.114 * sc, 0.048, 0.088 * sc);
      sToe.translate(cx, 0.048, facing * 0.132 * sc);
      appendSkinnedSubGeo(out, sToe, 3, bAnkle);
      sToe.dispose();

      const sSole = new THREE.BoxGeometry(0.126 * sc, 0.030, 0.280 * sc);
      sSole.translate(cx, 0.015, facing * 0.050);
      appendSkinnedSubGeo(out, sSole, 4, bAnkle);
      sSole.dispose();

      const stripe = new THREE.BoxGeometry(0.128 * sc, 0.020, 0.140);
      stripe.translate(cx, 0.058, facing * 0.026);
      appendSkinnedSubGeo(out, stripe, 4, bAnkle);
      stripe.dispose();
    } else {
      const sUpper = new THREE.CapsuleGeometry(0.056 * sc, 0.145 * sc, 6, 12);
      sUpper.rotateX(Math.PI / 2);
      sUpper.scale(1.06, 0.74, 1.0);
      sUpper.translate(cx, 0.050, facing * 0.046);
      appendSkinnedSubGeo(out, sUpper, 3, bAnkle);
      sUpper.dispose();

      const sSole = new THREE.BoxGeometry(0.124 * sc, 0.030, 0.270 * sc);
      sSole.translate(cx, 0.015, facing * 0.046);
      appendSkinnedSubGeo(out, sSole, 4, bAnkle);
      sSole.dispose();
    }
  };
  addLeg(-1, 7, 8, 9);
  addLeg(1, 10, 11, 12);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(out.si, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(out.sw, 4));

  const flatIndices = [];
  for (let m = 0; m < out.groups.length; m++) {
    const start = flatIndices.length;
    const gIdx = out.groups[m];
    for (let k = 0; k < gIdx.length; k++) flatIndices.push(gIdx[k]);
    if (gIdx.length > 0) geo.addGroup(start, gIdx.length, m);
  }
  geo.setIndex(flatIndices);
  geo.computeVertexNormals();
  return geo;
}

/* 3D-Sculpted Human Head — Chiseled Squarish Hero Silhouette (flat undistorted eye plane + square jaw!) */
function buildSculptedHeadGeo(isFemale = false, facing = -1, isHero = false) {
  const segU = 32, segV = 24;
  const pos = [], uv = [], indices = [];
  const rxBase = isFemale ? 0.104 : (isHero ? 0.118 : 0.114);
  const ryBase = isFemale ? 0.130 : (isHero ? 0.138 : 0.138);
  const rzBase = isFemale ? 0.116 : (isHero ? 0.120 : 0.125);

  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV; // 0 = top crown, 1 = bottom chin
    const theta = v * Math.PI;
    const st = Math.sin(theta);
    const ny = Math.cos(theta); // +1 top -> -1 bottom

    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU; // 0.5 = dead-center of face!
      const phi = u * Math.PI * 2;
      const ang = (u - 0.5) * Math.PI * 2; // 0 at center of face, +/-PI at back of skull
      const nxRaw = -Math.sin(phi);
      const nzRaw = Math.cos(phi); // -1 at front before facing sign

      let x, y, z;
      if (isHero) {
        // Superellipse / Squircle Boxy Stylized Head: crisp flat face plane, square jaw, beveled temples & flat top!
        const stSq = Math.pow(Math.max(0, st), 0.56);
        const nySq = Math.sign(ny) * Math.pow(Math.abs(ny), 0.72);
        const nxSq = Math.sign(nxRaw) * Math.pow(Math.abs(nxRaw), 0.54);
        const nzSq = Math.sign(nzRaw) * Math.pow(Math.abs(nzRaw), 0.54);

        x = nxSq * stSq * rxBase;
        y = nySq * ryBase;
        z = nzSq * stSq * rzBase;

        // Strong chiseled square jawline (minimal inward taper, bold square jaw corners)
        if (ny < 0.0) {
          const jFrac = Math.min(1, -ny / 0.90);
          x *= (1.0 - jFrac * 0.09);
          const chinBlock = Math.exp(-Math.pow(ang / 0.50, 2)) * Math.exp(-Math.pow((ny + 0.72) / 0.22, 2));
          z -= chinBlock * 0.008;
        }
        // Subtle structured brow ridge above flat eye plane (NO concave eye dimples that warp eyes!)
        const browBar = Math.exp(-Math.pow(ang / 0.62, 2)) * Math.exp(-Math.pow((ny - 0.22) / 0.09, 2));
        z -= browBar * 0.007;
        // Clean sculpted blocky wedge nose
        const noseBridge = Math.exp(-Math.pow(ang / 0.11, 2)) * smoothstep01(-0.24, -0.08, ny) * (1 - smoothstep01(0.06, 0.20, ny));
        const noseTip = Math.exp(-Math.pow(ang / 0.11, 2)) * Math.exp(-Math.pow((ny + 0.14) / 0.085, 2));
        z -= noseBridge * 0.011 + noseTip * 0.014;
        // Crisp square-cut side ears
        const ear = Math.exp(-Math.pow((Math.abs(ang) - 1.57) / 0.14, 2)) * Math.exp(-Math.pow((ny + 0.03) / 0.22, 2));
        x += Math.sign(nxRaw || 1) * ear * 0.014;
      } else {
        const nxUnit = nxRaw * st;
        const nzUnit = nzRaw * st;
        x = nxUnit * rxBase;
        y = ny * ryBase;
        z = nzUnit * rzBase;

        if (ny < 0.0) {
          const jFrac = Math.min(1, -ny / 0.88);
          const taper = isFemale ? (1.0 - jFrac * 0.34) : (1.0 - jFrac * 0.24);
          x *= taper;
          if (!isFemale) {
            const jawAngle = Math.exp(-Math.pow((Math.abs(ang) - 0.72) / 0.32, 2)) * Math.exp(-Math.pow((ny + 0.44) / 0.24, 2));
            x += Math.sign(nxUnit) * jawAngle * 0.014;
          }
          const chin = Math.exp(-Math.pow(ang / 0.32, 2)) * Math.exp(-Math.pow((ny + 0.74) / 0.18, 2));
          z -= chin * (isFemale ? 0.011 : 0.017);
        } else {
          const backSkull = Math.max(0, nzUnit) * Math.exp(-Math.pow((ny - 0.18) / 0.48, 2));
          z += backSkull * 0.014;
        }

        // Subtle brow & gentle eye plane (reduced indentation so NPC eyes never warp either!)
        const eyeMask = Math.exp(-Math.pow((Math.abs(ang) - 0.34) / 0.18, 2)) * Math.exp(-Math.pow((ny - 0.05) / 0.13, 2));
        z += eyeMask * 0.004;
        const browMask = Math.exp(-Math.pow((Math.abs(ang) - 0.34) / 0.26, 2)) * Math.exp(-Math.pow((ny - 0.21) / 0.10, 2));
        z -= browMask * (isFemale ? 0.005 : 0.009);

        const noseBridge = Math.exp(-Math.pow(ang / 0.115, 2)) * smoothstep01(-0.24, -0.10, ny) * (1 - smoothstep01(0.06, 0.22, ny));
        const noseTip = Math.exp(-Math.pow(ang / 0.11, 2)) * Math.exp(-Math.pow((ny + 0.14) / 0.095, 2));
        const nostril = Math.exp(-Math.pow((Math.abs(ang) - 0.13) / 0.065, 2)) * Math.exp(-Math.pow((ny + 0.17) / 0.065, 2));
        z -= noseBridge * 0.014 + noseTip * 0.019 + nostril * 0.008;
        y -= noseTip * 0.004;

        const cheek = Math.exp(-Math.pow((Math.abs(ang) - 0.56) / 0.22, 2)) * Math.exp(-Math.pow((ny + 0.12) / 0.16, 2));
        z -= cheek * 0.008;
        x += Math.sign(nxUnit) * cheek * 0.007;

        const upLip = Math.exp(-Math.pow(ang / 0.22, 2)) * Math.exp(-Math.pow((ny + 0.39) / 0.055, 2));
        const loLip = Math.exp(-Math.pow(ang / 0.20, 2)) * Math.exp(-Math.pow((ny + 0.49) / 0.055, 2));
        const cleft = Math.exp(-Math.pow(ang / 0.22, 2)) * Math.exp(-Math.pow((ny + 0.44) / 0.025, 2));
        z -= upLip * 0.009 + loLip * 0.008 - cleft * 0.004;

        const ear = Math.exp(-Math.pow((Math.abs(ang) - 1.58) / 0.14, 2)) * Math.exp(-Math.pow((ny + 0.04) / 0.20, 2));
        x += Math.sign(nxUnit) * ear * 0.016;
      }

      if (facing > 0) { x = -x; z = -z; }
      pos.push(x, y, z);
      uv.push(u, 1.0 - v);
    }
  }

  const stride = segU + 1;
  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* Sculpted Layered 1980s Hair Mesh (Contours seamlessly to both squarish hero skull and NPCs!) */
function buildSculptedHairGeo(style, facing = -1, isHero = false) {
  const segU = 28, segV = 18;
  const pos = [], uv = [], indices = [];
  const maxTheta =
    style === 'longWave' ? Math.PI * 0.94 :
    style === 'mullet'   ? Math.PI * 0.92 :
    style === 'bob'      ? Math.PI * 0.78 :
    style === 'afro'     ? Math.PI * 0.74 :
    style === 'buzz'     ? Math.PI * 0.58 :
    Math.PI * 0.64;

  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV;
    const theta = v * maxTheta;
    const st = Math.sin(theta);
    const ny = Math.cos(theta);

    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU;
      const phi = u * Math.PI * 2;
      const ang = (u - 0.5) * Math.PI * 2; // 0 = front forehead, +/-PI = back nape
      const absA = Math.abs(ang);
      const nxRaw = -Math.sin(phi);
      const nzRaw = Math.cos(phi);
      const stShape = isHero ? Math.pow(Math.max(0, st), 0.58) : st;
      const nyShape = isHero ? Math.sign(ny) * Math.pow(Math.abs(ny), 0.74) : ny;
      const nxU = (isHero ? Math.sign(nxRaw) * Math.pow(Math.abs(nxRaw), 0.58) : nxRaw) * stShape;
      const nzU = (isHero ? Math.sign(nzRaw) * Math.pow(Math.abs(nzRaw), 0.58) : nzRaw) * stShape;

      // Pull hair cleanly back off the face (so hair NEVER clips eyes/forehead!)
      const frontRecede = Math.exp(-Math.pow(absA / 0.85, 2));
      let rX = isHero ? 0.130 : 0.124;
      let rY = isHero ? 0.152 : 0.150;
      let rZ = isHero ? 0.136 : 0.138;
      let yOff = 0.010;
      let zOff = 0.014;

      if (style === 'buzz') {
        rX = isHero ? 0.126 : 0.120; rY = isHero ? 0.147 : 0.145; rZ = isHero ? 0.131 : 0.133; yOff = 0.005; zOff = 0.008;
      } else if (style === 'slick') {
        rX = isHero ? 0.129 : 0.123; rY = isHero ? 0.150 : 0.149; rZ = isHero ? 0.139 : 0.141; yOff = 0.008; zOff = 0.016;
      } else if (style === 'afro') {
        rX = 0.172; rY = 0.188; rZ = 0.172; yOff = 0.036; zOff = 0.016;
      }

      // Organic sculpted hair wave ridges
      const waveAmp = style === 'buzz' ? 0.0012 : (style === 'afro' ? 0.0075 : (style === 'slick' ? 0.0028 : 0.0055));
      const wave = Math.sin(ang * 7.0 + v * 4.5) * waveAmp + Math.cos(ang * 13.0 - v * 3.0) * (waveAmp * 0.55);

      let x = nxU * (rX + wave);
      let y = nyShape * rY + yOff;
      let z = nzU * (rZ + wave) + zOff;

      // Push hairline upward over forehead & open face window cleanly
      if (frontRecede > 0.05 && ny < 0.56) {
        const lift = style === 'afro' ? 0.175 : (style === 'pompadour' ? 0.148 : 0.128);
        const pushBack = style === 'afro' ? 0.082 : 0.048;
        y += frontRecede * (0.56 - ny) * lift;
        z += frontRecede * (0.56 - ny) * pushBack;
      }

      if (style === 'tommy' || style === 'pompadour') {
        // Authentic thick swept-back 1980s Ray Liotta / Tommy Vercetti crown & feathered sides!
        const topVol = Math.exp(-Math.pow((ny - 0.66) / 0.36, 2)) * (0.55 + 0.45 * frontRecede);
        y += topVol * (style === 'pompadour' ? 0.042 : 0.030);
        z -= topVol * (style === 'pompadour' ? 0.026 : 0.015);
        // Subtle 80s side-sweep fullness above ears + tapered back nape
        const sideSweep = Math.exp(-Math.pow((absA - 1.55) / 0.52, 2)) * Math.exp(-Math.pow((ny - 0.18) / 0.40, 2));
        x += Math.sign(nxU) * sideSweep * 0.012;
        const sideburn = Math.exp(-Math.pow((absA - 1.38) / 0.24, 2)) * smoothstep01(0.42, 0.88, v);
        y -= sideburn * 0.038;
      } else if (style === 'slick') {
        // Smooth executive swept-back crown & crisp tapered nape
        const sweep = Math.exp(-Math.pow((ny - 0.58) / 0.42, 2));
        y += sweep * 0.014;
        z += sweep * 0.018;
      } else if (style === 'afro') {
        // Voluminous rounded 70s/80s disco crown with organic curl texture (eyes & shades 100% clear)
        const crownBoost = smoothstep01(0.05, 0.72, ny);
        const sideBoost = smoothstep01(0.65, 1.35, absA);
        const puff = (0.65 * crownBoost + 0.35 * sideBoost) * (1.0 - frontRecede * 0.55);
        const curl = Math.sin(ang * 11.0 + ny * 14.0) * 0.005 + Math.cos(ang * 17.0 - ny * 19.0) * 0.004;
        x += Math.sign(nxU || 1) * Math.abs(nxU) * (puff * 0.018 + curl);
        y += crownBoost * 0.014 + curl;
        z += Math.max(0, nzU) * (puff * 0.018 + curl);
      } else if (style === 'mullet') {
        // Business-in-front feathered top + flowing 80s layered back drape strictly behind ears
        const topVol = Math.exp(-Math.pow((ny - 0.68) / 0.34, 2)) * (0.5 + 0.5 * frontRecede);
        y += topVol * 0.026;
        z -= topVol * 0.014;
        const backMask = smoothstep01(1.45, 2.05, absA) * smoothstep01(0.44, 0.85, v);
        if (backMask > 0.001) {
          const drop = (v - 0.44) * 1.9;
          y -= backMask * drop * 0.145;
          z += backMask * (0.038 + drop * 0.044 + Math.sin(drop * 6.0 + ang * 4.0) * 0.007);
          x *= 1.0 + backMask * drop * 0.18;
        } else if (v > 0.62 && absA < 1.45) {
          // Keep front & sides cleanly above ears like a true mullet
          y += (v - 0.62) * 0.165;
        }
      } else if (style === 'longWave') {
        if (absA > 0.78 && v > 0.48) {
          const drop = (v - 0.48) * 2.0;
          y -= drop * 0.175;
          x *= 1.0 + drop * 0.26;
          z += drop * 0.042 + Math.sin(drop * 7.0 + ang * 3.0) * 0.008;
        }
      } else if (style === 'bob') {
        if (absA > 0.85 && v > 0.52) {
          const drop = (v - 0.52) * 2.0;
          y -= drop * 0.075;
          x *= 1.0 + drop * 0.16;
        }
      }

      if (facing > 0) { x = -x; z = -z; }
      pos.push(x, y, z);
      uv.push(u * 2.0, v * 1.4);
    }
  }

  const stride = segU + 1;
  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * stride + iu;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Create a fresh 13-Bone Skeleton matching the exact rest-pose coordinates of buildSkinnedHumanBodyGeo
function createHumanSkeleton(isFemale = false, hero = false) {
  const armX = isFemale ? 0.194 : (hero ? 0.252 : 0.224);
  const legX = isFemale ? 0.098 : (hero ? 0.120 : 0.110);

  const hips   = new THREE.Bone(); hips.name = 'hips';   hips.position.set(0, 0.88, 0);
  const chest  = new THREE.Bone(); chest.name = 'chest'; chest.position.set(0, 0.04, 0); // world y=0.92
  const head   = new THREE.Bone(); head.name = 'head';   head.position.set(0, 0.64, 0); // world y=1.56
  hips.add(chest);
  chest.add(head);

  const armL   = new THREE.Bone(); armL.name = 'armL';     armL.position.set(-armX, 0.48, 0); // world y=1.40
  const elbowL = new THREE.Bone(); elbowL.name = 'elbowL'; elbowL.position.set(0, -0.26, 0);  // world y=1.14
  armL.add(elbowL);
  chest.add(armL);

  const armR   = new THREE.Bone(); armR.name = 'armR';     armR.position.set(armX, 0.48, 0);  // world y=1.40
  const elbowR = new THREE.Bone(); elbowR.name = 'elbowR'; elbowR.position.set(0, -0.26, 0);  // world y=1.14
  armR.add(elbowR);
  chest.add(armR);

  const legL   = new THREE.Bone(); legL.name = 'legL';     legL.position.set(-legX, -0.02, 0); // world y=0.86
  const kneeL  = new THREE.Bone(); kneeL.name = 'kneeL';   kneeL.position.set(0, -0.41, 0);    // world y=0.45
  const ankleL = new THREE.Bone(); ankleL.name = 'ankleL'; ankleL.position.set(0, -0.39, 0);   // world y=0.06
  legL.add(kneeL);
  kneeL.add(ankleL);
  hips.add(legL);

  const legR   = new THREE.Bone(); legR.name = 'legR';     legR.position.set(legX, -0.02, 0);  // world y=0.86
  const kneeR  = new THREE.Bone(); kneeR.name = 'kneeR';   kneeR.position.set(0, -0.41, 0);    // world y=0.45
  const ankleR = new THREE.Bone(); ankleR.name = 'ankleR'; ankleR.position.set(0, -0.39, 0);   // world y=0.06
  legR.add(kneeR);
  kneeR.add(ankleR);
  hips.add(legR);

  armL.userData.elbow = elbowL;
  armR.userData.elbow = elbowR;
  legL.userData.knee = kneeL;
  legL.userData.ankle = ankleL;
  legR.userData.knee = kneeR;
  legR.userData.ankle = ankleR;

  const bones = [hips, chest, head, armL, elbowL, armR, elbowR, legL, kneeL, ankleL, legR, kneeR, ankleR];
  const skeleton = new THREE.Skeleton(bones);
  return { skeleton, bones, hips, chest, head, armL, elbowL, armR, elbowR, legL, kneeL, ankleL, legR, kneeR, ankleR };
}

let _humanGeoCache = null;
function getHumanGeoCache() {
  if (_humanGeoCache) return _humanGeoCache;
  const shadesLens = new THREE.CylinderGeometry(0.030, 0.030, 0.012, 14);
  shadesLens.rotateX(Math.PI / 2);
  shadesLens.scale(1.24, 0.78, 1.0);

  _humanGeoCache = {
    // Shared Athletic SkinnedMesh Body Archetypes (ZERO stick figures!)
    heroBody:       buildSkinnedHumanBodyGeo({ facing: -1, isFemale: false, isBikini: false, longSleeve: false, shorts: false, hero: true }),
    npcMaleShort:   buildSkinnedHumanBodyGeo({ facing:  1, isFemale: false, isBikini: false, longSleeve: false, shorts: false, hero: false }),
    npcMaleBlazer:  buildSkinnedHumanBodyGeo({ facing:  1, isFemale: false, isBikini: false, longSleeve: true,  shorts: false, hero: false }),
    npcMaleJog:     buildSkinnedHumanBodyGeo({ facing:  1, isFemale: false, isBikini: false, longSleeve: false, shorts: true,  hero: false }),
    npcFemaleBikini:buildSkinnedHumanBodyGeo({ facing:  1, isFemale: true,  isBikini: true,  longSleeve: false, shorts: true,  hero: false }),
    npcFemaleStreet:buildSkinnedHumanBodyGeo({ facing:  1, isFemale: true,  isBikini: false, longSleeve: false, skirt:  true,  hero: false }),

    // Shared 3D-Sculpted Heads (Squarish chiseled hero head + NPC heads)
    headHero:       buildSculptedHeadGeo(false, -1, true),
    headMaleNpc:    buildSculptedHeadGeo(false,  1, false),
    headFemaleNpc:  buildSculptedHeadGeo(true,   1, false),

    // Shared Sculpted Multi-Wave 80s Hairstyles (Hero cuts tailored to squarish skull!)
    hairTommyHero:  buildSculptedHairGeo('tommy',     -1, true),
    hairBuzzHero:   buildSculptedHairGeo('buzz',      -1, true),
    hairSlickHero:  buildSculptedHairGeo('slick',     -1, true),
    hairAfroHero:   buildSculptedHairGeo('afro',      -1, true),
    hairMulletHero: buildSculptedHairGeo('mullet',    -1, true),
    hairTommyNpc:   buildSculptedHairGeo('tommy',      1, false),
    hairPompNpc:    buildSculptedHairGeo('pompadour',  1, false),
    hairWaveNpc:    buildSculptedHairGeo('longWave',   1, false),
    hairBobNpc:     buildSculptedHairGeo('bob',        1, false),

    // Accessories
    ponytail:       new THREE.ConeGeometry(0.052, 0.25, 14),
    sunhatBrim:     new THREE.CylinderGeometry(0.27, 0.30, 0.020, 28),
    sunhatCrown:    new THREE.CylinderGeometry(0.118, 0.136, 0.095, 22),
    shadesLens,
    blazerLapel:    new THREE.CylinderGeometry(0.068, 0.054, 0.39, 12),
    belt:           new THREE.CylinderGeometry(0.184, 0.184, 0.044, 24)
  };
  return _humanGeoCache;
}

export function createPedestrian(spec, sharedGeos, splatMat, starMat, pedMats) {
  const hg = getHumanGeoCache();
  const clothNorm = makeClothNormalTexture();
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const isBikini = Boolean(spec.bikini);
  const styleIdx = Math.abs(Math.floor((spec.phase || 0) * 10));
  const isFemale = isBikini || (!spec.blazer && !spec.jog && styleIdx % 4 === 1);
  const pattern = isBikini ? 0 : (styleIdx % 4);
  const facialHair = isFemale ? 0 : (styleIdx % 5 === 0 ? 1 : (styleIdx % 5 === 2 ? 2 : 0));

  const skinMat = pedMats ? pedMats.get('s_' + spec.skin, () => new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.54 })) : new THREE.MeshStandardMaterial({ color: spec.skin, roughness: 0.54 });
  const topMat = pedMats ? pedMats.get(`t_${spec.shirt}_${pattern}`, () => new THREE.MeshStandardMaterial({
    map: getNpcFabricTexture(spec.shirt, pattern),
    normalMap: clothNorm, normalScale: new THREE.Vector2(0.45, 0.45), roughness: 0.74
  })) : new THREE.MeshStandardMaterial({ map: getNpcFabricTexture(spec.shirt, pattern), normalMap: clothNorm, normalScale: new THREE.Vector2(0.45, 0.45), roughness: 0.74 });
  const botMat = pedMats ? pedMats.get('b_' + spec.pants, () => new THREE.MeshStandardMaterial({
    map: makeDenimFabricTexture('#' + (spec.pants >>> 0).toString(16).padStart(6, '0')),
    normalMap: clothNorm, normalScale: new THREE.Vector2(0.50, 0.50), roughness: 0.80
  })) : new THREE.MeshStandardMaterial({ color: spec.pants, normalMap: clothNorm, normalScale: new THREE.Vector2(0.50, 0.50), roughness: 0.80 });
  const hairMat = pedMats ? pedMats.get('h_' + spec.hair, () => new THREE.MeshStandardMaterial({
    map: makeHairTexture(spec.hair), roughness: 0.76, metalness: 0.04, side: THREE.DoubleSide
  })) : new THREE.MeshStandardMaterial({ map: makeHairTexture(spec.hair), roughness: 0.76, side: THREE.DoubleSide });
  const shoeMat = pedMats ? pedMats.get('sh_' + (spec.shoe || 0xf2eff6), () => new THREE.MeshStandardMaterial({ color: spec.shoe || 0xf2eff6, roughness: 0.40 })) : new THREE.MeshStandardMaterial({ color: spec.shoe || 0xf2eff6, roughness: 0.40 });
  const soleMat = pedMats ? pedMats.get('sole', () => new THREE.MeshStandardMaterial({ color: 0xf4f2f8, roughness: 0.65 })) : new THREE.MeshStandardMaterial({ color: 0xf4f2f8, roughness: 0.65 });
  const teeMat = pedMats ? pedMats.get('tee', () => new THREE.MeshStandardMaterial({ color: 0xf4f0f8, normalMap: clothNorm, normalScale: new THREE.Vector2(0.32, 0.32), roughness: 0.78 })) : new THREE.MeshStandardMaterial({ color: 0xf4f0f8, roughness: 0.78 });
  const shadesMat = pedMats ? pedMats.get('shades', () => new THREE.MeshPhysicalMaterial({ color: 0x101422, metalness: 0.86, roughness: 0.10, clearcoat: 1.0 })) : new THREE.MeshPhysicalMaterial({ color: 0x101422, metalness: 0.86, roughness: 0.10, clearcoat: 1.0 });
  const hatMat = pedMats ? pedMats.get('hat', () => new THREE.MeshStandardMaterial({ color: 0xf4e2c2, roughness: 0.84 })) : new THREE.MeshStandardMaterial({ color: 0xf4e2c2, roughness: 0.84 });
  const faceMat = getFaceMaterial(spec.skin, isFemale, facialHair);

  // Pick continuous SkinnedMesh archetype + 13-Bone Skeleton
  const bodyGeo = isBikini
    ? hg.npcFemaleBikini
    : (isFemale ? hg.npcFemaleStreet : (spec.blazer ? hg.npcMaleBlazer : (spec.jog ? hg.npcMaleJog : hg.npcMaleShort)));
  const rig = createHumanSkeleton(isFemale, false);
  const skinnedBody = new THREE.SkinnedMesh(bodyGeo, [skinMat, topMat, botMat, shoeMat, soleMat]);
  skinnedBody.castShadow = true;
  skinnedBody.receiveShadow = true;
  skinnedBody.frustumCulled = false;
  skinnedBody.add(rig.hips);
  rig.hips.updateMatrixWorld(true);
  skinnedBody.bind(rig.skeleton);
  body.add(skinnedBody);

  // Subtle tailored belt & Miami Vice open blazer tee mounted directly on Bones
  if (!isBikini) {
    const belt = new THREE.Mesh(hg.belt, shadesMat);
    belt.scale.set(isFemale ? 0.86 : 0.98, 0.92, isFemale ? 0.60 : 0.68);
    belt.position.set(0, 0.055, 0);
    rig.hips.add(belt);
    if (spec.blazer) {
      const tee = new THREE.Mesh(hg.blazerLapel, teeMat);
      tee.scale.set(0.95, 1.0, 0.36);
      tee.position.set(0, 0.28, 0.116);
      rig.chest.add(tee);
    }
  }

  // Sculpted 3D Head + Multi-Wave 80s Hair + Shades mounted directly on Head Bone (clean chin overlap over neck!)
  const headY = isFemale ? 0.098 : 0.104;
  const headMesh = new THREE.Mesh(isFemale ? hg.headFemaleNpc : hg.headMaleNpc, faceMat);
  headMesh.position.set(0, headY, 0);
  rig.head.add(headMesh);

  const hairGeo = isFemale
    ? (styleIdx % 2 === 0 ? hg.hairWaveNpc : hg.hairBobNpc)
    : (styleIdx % 2 === 0 ? hg.hairTommyNpc : hg.hairPompNpc);
  const hairMesh = new THREE.Mesh(hairGeo, hairMat);
  hairMesh.position.set(0, headY, 0);
  rig.head.add(hairMesh);

  if (isFemale && styleIdx % 3 === 2) {
    const pony = new THREE.Mesh(hg.ponytail, hairMat);
    pony.position.set(0, headY - 0.01, -0.145);
    pony.rotation.x = -0.45;
    rig.head.add(pony);
  }
  if (isBikini && styleIdx % 3 === 0) {
    const brim = new THREE.Mesh(hg.sunhatBrim, hatMat); brim.position.set(0, headY + 0.115, 0);
    const crown = new THREE.Mesh(hg.sunhatCrown, hatMat); crown.position.set(0, headY + 0.160, 0);
    rig.head.add(brim, crown);
  }
  if (spec.shades) {
    const sL = new THREE.Mesh(hg.shadesLens, shadesMat); sL.position.set(-0.044, headY + 0.008, 0.115);
    const sR = new THREE.Mesh(hg.shadesLens, shadesMat); sR.position.set(0.044, headY + 0.008, 0.115);
    const sBr = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.012), shadesMat); sBr.position.set(0, headY + 0.014, 0.118);
    rig.head.add(sL, sR, sBr);
  }

  // Ground contact shadow
  const pedShadow = new THREE.Mesh(sharedGeos.shadow, getContactShadowMat());
  pedShadow.rotation.x = -Math.PI / 2;
  pedShadow.position.y = 0.025;
  root.add(pedShadow);

  // Splat decal & dizzy stars (when squished or knocked out)
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
    root, body, skinnedBody,
    hips: rig.hips, chest: rig.chest, headGroup: rig.head,
    armL: rig.armL, armR: rig.armR, legL: rig.legL, legR: rig.legR,
    splat, stars, pedShadow,
    bikini: isBikini,
    baseScale: spec.scale,
    axis: spec.axis || 'z',
    speed: spec.speed,
    dir: spec.dir,
    jog: spec.jog,
    phase: spec.phase,
    x: spec.x,
    z: spec.z,
    homeX: spec.x,
    homeZ: spec.z,
    y: spec.y,
    minPos: spec.minPos ?? -1110,
    maxPos: spec.maxPos ?? 350,
    state: 'walk',
    stateTimer: 0,
    hp: 3,
    vx: 0, vy: 0, vz: 0,
    spinX: 0, spinZ: 0
  };
}

/* ==========================================================================
   6. CONTINUOUS SKINNED 1986 VICE CITY PROTAGONIST + 6 DETAILED 3D WEAPONS
   ========================================================================== */
export function createPlayerCharacter() {
  const hg = getHumanGeoCache();
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // Procedural 512px Iconic Tommy Vercetti Teal Hawaiian Palm-Print Silk Shirt + Cloth Normal Map + Tailored Chinos
  const clothNorm = makeClothNormalTexture();
  const sc = document.createElement('canvas');
  sc.width = 512; sc.height = 512;
  const sctx = sc.getContext('2d');
  const sGrad = sctx.createLinearGradient(0, 0, 0, 512);
  sGrad.addColorStop(0, '#1ad0c8');
  sGrad.addColorStop(0.5, '#12b4ae');
  sGrad.addColorStop(1, '#0c8e8d');
  sctx.fillStyle = sGrad;
  sctx.fillRect(0, 0, 512, 512);
  // Subtle tailored fabric fold creases & linen weave
  const foldG = sctx.createLinearGradient(0, 0, 512, 0);
  foldG.addColorStop(0, 'rgba(0,0,0,0.12)');
  foldG.addColorStop(0.25, 'rgba(255,255,255,0.09)');
  foldG.addColorStop(0.5, 'rgba(0,0,0,0.06)');
  foldG.addColorStop(0.75, 'rgba(255,255,255,0.09)');
  foldG.addColorStop(1, 'rgba(0,0,0,0.12)');
  sctx.fillStyle = foldG;
  sctx.fillRect(0, 0, 512, 512);
  sctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let y = 0; y < 512; y += 4) sctx.fillRect(0, y, 512, 1);
  // Crisp Miami tropical palm fronds & coral hibiscus blossoms
  for (let i = 0; i < 46; i++) {
    const px = (i * 113) % 512;
    const py = (i * 157) % 512;
    const ang = (i % 7) * 0.45;
    sctx.save();
    sctx.translate(px, py);
    sctx.rotate(ang);
    sctx.fillStyle = i % 2 === 0 ? '#09636e' : '#0f7f7a';
    sctx.beginPath(); sctx.ellipse(0, 0, 28, 9, 0, 0, Math.PI * 2); sctx.fill();
    sctx.strokeStyle = 'rgba(220,255,248,0.24)';
    sctx.lineWidth = 1.5;
    sctx.beginPath(); sctx.moveTo(-24, 0); sctx.lineTo(24, 0); sctx.stroke();
    sctx.restore();
  }
  for (let i = 0; i < 22; i++) {
    const fx = (i * 139 + 34) % 512, fy = (i * 97 + 44) % 512;
    sctx.fillStyle = i % 3 === 0 ? '#ff5c94' : '#ff8c66';
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      sctx.beginPath(); sctx.arc(fx + Math.cos(a) * 8, fy + Math.sin(a) * 8, 6.5, 0, Math.PI * 2); sctx.fill();
    }
    sctx.fillStyle = '#ffe066';
    sctx.beginPath(); sctx.arc(fx, fy, 4.5, 0, Math.PI * 2); sctx.fill();
  }
  const shirtTex = new THREE.CanvasTexture(sc);
  shirtTex.colorSpace = THREE.SRGBColorSpace;
  shirtTex.wrapS = shirtTex.wrapT = THREE.RepeatWrapping;

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdc9f74, roughness: 0.56, metalness: 0.02 });
  const faceMat = getFaceMaterial(0xdc9f74, false, 1); // Sun-tanned GTA 5 HD Tommy Vercetti face!
  const shirtMat = new THREE.MeshStandardMaterial({ map: shirtTex, normalMap: clothNorm, normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.66, metalness: 0.04 });
  const pantMat = new THREE.MeshStandardMaterial({ map: makeDenimFabricTexture('#264570'), normalMap: clothNorm, normalScale: new THREE.Vector2(0.62, 0.62), roughness: 0.78 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8f6fa, roughness: 0.34 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0x1e1c28, roughness: 0.72 });
  const hairMat = new THREE.MeshStandardMaterial({ map: makeHairTexture(0x18131d), roughness: 0.68, metalness: 0.08, side: THREE.DoubleSide });
  // Authentic 1986 Miami Vice Ray-Ban Teardrop Aviators: deep smoked charcoal-emerald lenses + slim gold wire!
  const aviatorGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x091318, metalness: 0.42, roughness: 0.10, clearcoat: 0.92, clearcoatRoughness: 0.06, envMapIntensity: 0.85 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xe8bc52, metalness: 0.94, roughness: 0.16, envMapIntensity: 1.8 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x2b1a14, roughness: 0.44 });

  // 1. Unified Continuous 13-Bone SkinnedMesh Hero Body (ZERO detached tubes or ball joints!)
  const rig = createHumanSkeleton(false, true);
  // Set YXZ Euler order on chest & arms so baseball bat swings & horizontal torso torque compose cleanly!
  rig.chest.rotation.order = 'YXZ';
  rig.armR.rotation.order = 'YXZ';
  rig.armL.rotation.order = 'YXZ';

  const skinnedBody = new THREE.SkinnedMesh(hg.heroBody, [skinMat, shirtMat, pantMat, shoeMat, soleMat]);
  skinnedBody.castShadow = true;
  skinnedBody.frustumCulled = false;
  skinnedBody.add(rig.hips);
  rig.hips.updateMatrixWorld(true);
  skinnedBody.bind(rig.skeleton);
  body.add(skinnedBody);

  // Squarish Leather Belt, Brushed Brass Buckle Frame mounted to Hips Bone
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.428, 0.046, 0.284), leatherMat);
  belt.position.set(0, 0.055, 0);
  rig.hips.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.058, 0.024), goldMat);
  buckle.position.set(0, 0.055, -0.144);
  const buckleInner = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.032, 0.028), leatherMat);
  buckleInner.position.set(0, 0.055, -0.145);
  const buckleProng = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.030), goldMat);
  buckleProng.position.set(0.008, 0.055, -0.147);
  rig.hips.add(buckle, buckleInner, buckleProng);

  // Layered Outfit: Crisp White Crewneck Undershirt + Folded Cuban Resort Shirt Lapels + Buttons + Pocket
  const undershirtMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.78, metalness: 0.02 });
  const pearlBtnMat = new THREE.MeshStandardMaterial({ color: 0xfff8ec, roughness: 0.28, metalness: 0.12 });
  const darkDialMat = new THREE.MeshStandardMaterial({ color: 0x0b162a, roughness: 0.14, metalness: 0.65 });
  const shoeStripeMat = new THREE.MeshStandardMaterial({ color: 0x21e6d1, roughness: 0.36, metalness: 0.12 });

  // Clean squarish upper chest / collar core + white crewneck undershirt
  const chestFill = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.115, 0.168), skinMat);
  chestFill.position.set(0, 0.512, -0.012);
  rig.chest.add(chestFill);

  const underV = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.140, 0.115), undershirtMat);
  underV.position.set(0, 0.466, -0.054);
  underV.rotation.x = 0.04;
  rig.chest.add(underV);

  // Tailored Draped Hawaiian Shirt Collar + Sculpted Folded Cuban Lapels (Left & Right)
  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.019, 10, 22), shirtMat);
  collarRing.rotation.x = Math.PI / 2 + 0.18;
  collarRing.scale.set(1.06, 0.96, 1.0);
  collarRing.position.set(0, 0.538, -0.008);
  rig.chest.add(collarRing);

  const lapelGeo = new THREE.BoxGeometry(0.068, 0.155, 0.018);
  const lapelL = new THREE.Mesh(lapelGeo, shirtMat);
  lapelL.position.set(-0.062, 0.452, -0.118);
  lapelL.rotation.set(-0.14, 0.24, -0.34);
  const lapelR = new THREE.Mesh(lapelGeo, shirtMat);
  lapelR.position.set(0.062, 0.452, -0.118);
  lapelR.rotation.set(-0.14, -0.24, 0.34);
  rig.chest.add(lapelL, lapelR);

  // Shirt Front Placket Buttons + Left Chest Pocket with Fold Trim
  for (let b = 0; b < 3; b++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 10), pearlBtnMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0.006, 0.31 - b * 0.085, -0.132);
    rig.chest.add(btn);
  }
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.078, 0.010), shirtMat);
  pocket.position.set(-0.095, 0.345, -0.128);
  pocket.rotation.y = 0.16;
  rig.chest.add(pocket);

  // Heavy 18K Gold Cuban Link Chain + Sculpted Circular Medallion Pendant
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.088, 0.010, 10, 24), goldMat);
  chain.rotation.x = Math.PI / 2 + 0.42;
  chain.position.set(0, 0.498, -0.044);
  const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.006, 14), goldMat);
  pendant.rotation.x = Math.PI / 2 + 0.18;
  pendant.position.set(0, 0.422, -0.128);
  rig.chest.add(chain, pendant);

  // Crisp Rolled Short-Sleeve Cuff Rings on Upper Arms
  const cuffGeo = new THREE.TorusGeometry(0.064, 0.011, 8, 16);
  cuffGeo.rotateX(Math.PI / 2);
  const cuffL = new THREE.Mesh(cuffGeo, shirtMat);
  cuffL.position.set(0, -0.158, 0);
  const cuffR = cuffL.clone();
  rig.armL.add(cuffL);
  rig.armR.add(cuffR);

  // Luxury Chunky Gold Wristwatch with Navy Bezel Dial & Crown on Left Forearm
  const watchBand = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.026, 16), goldMat);
  watchBand.position.set(0, -0.214, 0);
  const watchFace = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.012, 16), darkDialMat);
  watchFace.rotation.z = Math.PI / 2;
  watchFace.position.set(-0.036, -0.214, -0.008);
  const watchBezel = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.004, 8, 16), goldMat);
  watchBezel.rotation.y = Math.PI / 2;
  watchBezel.position.set(-0.041, -0.214, -0.008);
  rig.elbowL.add(watchBand, watchFace, watchBezel);

  // Retro 1986 High-Top Sneaker Side Stripes on Ankles
  for (const ank of [rig.ankleL, rig.ankleR]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.018, 0.115), shoeStripeMat);
    stripe.position.set(0, -0.052, -0.035);
    ank.add(stripe);
  }

  // 2. Sculpted 3D Head + 7 Switchable 3D Hairstyles (Barber Shop) + Detailed Gold-Framed Vice Aviators
  const heroHeadY = 0.104;
  const hMesh = new THREE.Mesh(hg.headHero, faceMat);
  hMesh.scale.setScalar(1.02);
  hMesh.position.set(0, heroHeadY, 0);
  rig.head.add(hMesh);

  const hairGroups = {};
  const makeHairGroup = (id) => {
    const grp = new THREE.Group();
    grp.visible = id === 'tommy';
    rig.head.add(grp);
    hairGroups[id] = grp;
    return grp;
  };

  // (1) Classic 80s Swept Pompadour (Default Tommy Vercetti)
  {
    const gH = makeHairGroup('tommy');
    const hairMesh = new THREE.Mesh(hg.hairTommyHero, hairMat);
    hairMesh.scale.setScalar(1.02);
    hairMesh.position.set(0, heroHeadY, 0);
    const quiff = new THREE.Mesh(new THREE.SphereGeometry(0.064, 14, 10), hairMat);
    quiff.scale.set(1.22, 0.42, 0.88);
    quiff.position.set(-0.008, heroHeadY + 0.122, -0.056);
    quiff.rotation.set(0.24, 0.12, -0.10);
    gH.add(hairMesh, quiff);
    for (const sx of [-1, 1]) {
      const sb = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.048, 0.026), hairMat);
      sb.position.set(sx * 0.112, heroHeadY - 0.004, -0.018);
      gH.add(sb);
    }
  }

  // (2) Tactical Buzz Fade (Precision Skull-Contoured Close Cut — zero scalp poke-through!)
  {
    const gH = makeHairGroup('buzz');
    const buzzMesh = new THREE.Mesh(hg.hairBuzzHero, hairMat);
    buzzMesh.scale.setScalar(1.02);
    buzzMesh.position.set(0, heroHeadY, 0);
    gH.add(buzzMesh);
  }

  // (3) Disco Crown Afro (Clean Sculpted 80s Halo — face, eyes & aviators 100% clear!)
  {
    const gH = makeHairGroup('afro');
    const afroMesh = new THREE.Mesh(hg.hairAfroHero, hairMat);
    afroMesh.scale.setScalar(1.02);
    afroMesh.position.set(0, heroHeadY, 0);
    gH.add(afroMesh);
  }

  // (4) Neon Punk Mohawk (Shaved Fade Base + Continuous Skull-Hugging Sculpted Crest Fin!)
  {
    const gH = makeHairGroup('mohawk');
    const fadeBase = new THREE.Mesh(hg.hairBuzzHero, hairMat);
    fadeBase.scale.setScalar(1.015);
    fadeBase.position.set(0, heroHeadY, 0);
    gH.add(fadeBase);
    const finShape = new THREE.Shape();
    // 2D (x2d = forward -Z, y2d = up +Y) following the exact skull arc from hairline to nape
    finShape.moveTo(0.068, 0.106);
    finShape.quadraticCurveTo(0.095, 0.168, 0.072, 0.205);
    finShape.quadraticCurveTo(0.010, 0.224, -0.058, 0.212);
    finShape.quadraticCurveTo(-0.132, 0.194, -0.172, 0.120);
    finShape.quadraticCurveTo(-0.175, 0.040, -0.132, -0.028);
    finShape.lineTo(-0.102, -0.015);
    finShape.quadraticCurveTo(-0.112, 0.070, -0.065, 0.122);
    finShape.quadraticCurveTo(0.005, 0.138, 0.068, 0.106);
    finShape.closePath();
    const finGeo = new THREE.ExtrudeGeometry(finShape, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.009,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 14
    });
    finGeo.translate(0, 0, -0.016);
    finGeo.rotateY(Math.PI / 2);
    const finMesh = new THREE.Mesh(finGeo, hairMat);
    finMesh.scale.setScalar(1.02);
    finMesh.position.set(0, heroHeadY, 0);
    gH.add(finMesh);
  }

  // (5) Sunset Beach Mullet (Sculpted Feathered Top + Flowing Layered Back Drape Behind Ears!)
  {
    const gH = makeHairGroup('mullet');
    const mulletMesh = new THREE.Mesh(hg.hairMulletHero, hairMat);
    mulletMesh.scale.setScalar(1.02);
    mulletMesh.position.set(0, heroHeadY, 0);
    gH.add(mulletMesh);
  }

  // (6) Island Locs / Dreads (Contoured Crown + Curved Bezier Tube Locs Strictly Behind Face!)
  {
    const gH = makeHairGroup('dreads');
    const crownCap = new THREE.Mesh(hg.hairBuzzHero, hairMat);
    crownCap.scale.setScalar(1.025);
    crownCap.position.set(0, heroHeadY + 0.004, 0);
    gH.add(crownCap);
    // 11 gracefully curved locs strictly behind the front hairline (|ang| >= 72 deg from nose)
    const locAngles = [
      -1.26, -1.58, -1.92, -2.26, -2.62, Math.PI,
       2.62,  2.26,  1.92,  1.58,  1.26
    ];
    for (let i = 0; i < locAngles.length; i++) {
      const a = locAngles[i];
      const sx = Math.sin(a);
      const sz = -Math.cos(a); // +Z is back, -Z is front
      const lenDrop = 0.095 + (i % 3) * 0.022 + (Math.abs(a) > 2.1 ? 0.028 : 0);
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(sx * 0.088, heroHeadY + 0.130, sz * 0.088 + 0.010),
        new THREE.Vector3(sx * 0.146, heroHeadY + 0.082, sz * 0.152 + 0.014),
        new THREE.Vector3(sx * 0.142, heroHeadY - lenDrop, sz * 0.160 + 0.018)
      );
      const locMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.0145, 7, false), hairMat);
      gH.add(locMesh);
    }
  }

  // (7) Miami Executive Slick-Back (Clean Contoured Swept-Back Hairline!)
  {
    const gH = makeHairGroup('slick');
    const slickMesh = new THREE.Mesh(hg.hairSlickHero, hairMat);
    slickMesh.scale.setScalar(1.02);
    slickMesh.position.set(0, heroHeadY, 0);
    gH.add(slickMesh);
  }

  // Grounded soft contact shadow under protagonist sneakers (eliminates floating look!)
  const heroShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.92), getContactShadowMat());
  heroShadow.rotation.x = -Math.PI / 2;
  heroShadow.position.y = 0.025;
  root.add(heroShadow);

  // Sculpted Ray-Ban Teardrop Aviator Sunglasses seated flush against nose bridge & brow
  const tearShape = new THREE.Shape();
  tearShape.moveTo(-0.032, 0.020);
  tearShape.quadraticCurveTo(0.0, 0.026, 0.032, 0.018);
  tearShape.quadraticCurveTo(0.038, -0.008, 0.016, -0.024);
  tearShape.quadraticCurveTo(-0.014, -0.028, -0.032, -0.006);
  tearShape.closePath();
  const tearLensGeo = new THREE.ExtrudeGeometry(tearShape, { depth: 0.006, bevelEnabled: false, curveSegments: 14 });
  const tearFrameGeo = new THREE.ExtrudeGeometry(tearShape, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.0018, bevelSize: 0.0028, bevelSegments: 2, curveSegments: 14 });

  const browBar = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.004, 0.006), goldMat);
  browBar.position.set(0, heroHeadY + 0.028, -0.126);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.004, 0.006), goldMat);
  bridge.position.set(0, heroHeadY + 0.016, -0.128);

  // Place dark smoked lenses cleanly in front of the flat squarish face plane so gold rim outlines dark glass!
  const lensL = new THREE.Mesh(tearLensGeo, aviatorGlassMat);
  lensL.position.set(-0.042, heroHeadY + 0.008, -0.1295);
  lensL.rotation.y = 0.06;
  const frameL = new THREE.Mesh(tearFrameGeo, goldMat);
  frameL.position.set(-0.042, heroHeadY + 0.008, -0.1250);
  frameL.rotation.y = 0.06;

  const lensR = new THREE.Mesh(tearLensGeo, aviatorGlassMat);
  lensR.scale.x = -1;
  lensR.position.set(0.042, heroHeadY + 0.008, -0.1295);
  lensR.rotation.y = -0.06;
  const frameR = new THREE.Mesh(tearFrameGeo, goldMat);
  frameR.scale.x = -1;
  frameR.position.set(0.042, heroHeadY + 0.008, -0.1250);
  frameR.rotation.y = -0.06;

  const templeGeo = new THREE.BoxGeometry(0.004, 0.0045, 0.124);
  const templeL = new THREE.Mesh(templeGeo, goldMat);
  templeL.position.set(-0.106, heroHeadY + 0.018, -0.066);
  templeL.rotation.y = 0.08;
  const templeR = new THREE.Mesh(templeGeo, goldMat);
  templeR.position.set(0.106, heroHeadY + 0.018, -0.066);
  templeR.rotation.y = -0.08;
  const shadesGroup = new THREE.Group();
  shadesGroup.add(browBar, bridge, frameL, frameR, lensL, lensR, templeL, templeR);
  rig.head.add(shadesGroup);

  // Dynamic Barber & Boutique Customization API (Hairstyles, Hair Dye, 7 Outfits & Shades)
  const outfitTexCache = { hawaiian: shirtTex };
  const pantTexCache = { hawaiian: pantMat.map };
  const makeCustomShirtTex = (id) => {
    if (outfitTexCache[id]) return outfitTexCache[id];
    const oc = document.createElement('canvas');
    oc.width = 512; oc.height = 512;
    const octx = oc.getContext('2d');
    if (id === 'miami_suit') {
      const g = octx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, '#faf7f2'); g.addColorStop(1, '#e6e0d6');
      octx.fillStyle = g; octx.fillRect(0, 0, 512, 512);
      octx.strokeStyle = 'rgba(180,170,160,0.22)';
      for (let x = 0; x < 512; x += 12) { octx.beginPath(); octx.moveTo(x, 0); octx.lineTo(x, 512); octx.stroke(); }
    } else if (id === 'black_tux') {
      const g = octx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, '#1a1b24'); g.addColorStop(1, '#0e0f16');
      octx.fillStyle = g; octx.fillRect(0, 0, 512, 512);
      octx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let x = 0; x < 512; x += 16) octx.fillRect(x, 0, 2, 512);
    } else if (id === 'street_pink') {
      const g = octx.createLinearGradient(0, 0, 512, 512);
      g.addColorStop(0, '#161426'); g.addColorStop(0.55, '#2b1038'); g.addColorStop(1, '#121828');
      octx.fillStyle = g; octx.fillRect(0, 0, 512, 512);
      octx.fillStyle = '#ff2e88';
      for (let y = 24; y < 512; y += 96) octx.fillRect(0, y, 512, 18);
      octx.fillStyle = '#21e6d1';
      for (let y = 46; y < 512; y += 96) octx.fillRect(0, y, 512, 9);
    } else if (id === 'gold_boss') {
      const g = octx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, '#7c1830'); g.addColorStop(1, '#4c0d1e');
      octx.fillStyle = g; octx.fillRect(0, 0, 512, 512);
      octx.strokeStyle = 'rgba(244,196,78,0.45)'; octx.lineWidth = 4;
      for (let i = 0; i < 36; i++) {
        const px = (i * 97) % 512, py = (i * 131) % 512;
        octx.beginPath(); octx.arc(px, py, 18, 0, Math.PI * 2); octx.stroke();
      }
    } else if (id === 'tactical') {
      octx.fillStyle = '#38462c'; octx.fillRect(0, 0, 512, 512);
      const camoCols = ['#2a3522', '#4c5a3b', '#202819', '#5a5038'];
      for (let i = 0; i < 64; i++) {
        octx.fillStyle = camoCols[i % camoCols.length];
        octx.beginPath();
        octx.ellipse((i * 89) % 512, (i * 127) % 512, 34 + (i % 4) * 10, 18 + (i % 3) * 8, i * 0.5, 0, Math.PI * 2);
        octx.fill();
      }
    } else {
      // sunset_surf
      const g = octx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, '#ff6e48'); g.addColorStop(0.5, '#ff3d7f'); g.addColorStop(1, '#ffb347');
      octx.fillStyle = g; octx.fillRect(0, 0, 512, 512);
      octx.fillStyle = 'rgba(255,255,255,0.16)';
      for (let y = 0; y < 512; y += 32) octx.fillRect(0, y, 512, 6);
    }
    const t = new THREE.CanvasTexture(oc);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    outfitTexCache[id] = t;
    return t;
  };
  const makeCustomPantTex = (id, hex) => {
    if (pantTexCache[id]) return pantTexCache[id];
    const t = makeDenimFabricTexture(hex);
    pantTexCache[id] = t;
    return t;
  };
  const hairTexCache = { '#18131d': hairMat.map };
  const setHairstyle = (styleId = 'tommy', colorHex = '#18131d') => {
    const validId = hairGroups[styleId] ? styleId : 'tommy';
    for (const k of Object.keys(hairGroups)) hairGroups[k].visible = (k === validId);
    const key = String(colorHex || '#18131d').toLowerCase();
    if (!hairTexCache[key]) {
      const numeric = parseInt(key.replace('#', ''), 16);
      hairTexCache[key] = makeHairTexture(Number.isFinite(numeric) ? numeric : 0x18131d);
    }
    hairMat.map = hairTexCache[key];
    hairMat.needsUpdate = true;
  };
  const OUTFIT_SPECS = {
    hawaiian:    { pant: '#264570', under: 0xf4f1ea, shoe: 0xf8f6fa, stripe: 0x21e6d1, chain: true  },
    miami_suit:  { pant: '#f0ece4', under: 0xff4c96, shoe: 0xf6f3ee, stripe: 0xff2e88, chain: true  },
    black_tux:   { pant: '#151720', under: 0xfafafa, shoe: 0x14151c, stripe: 0xe8bc52, chain: false },
    street_pink: { pant: '#232634', under: 0x21e6d1, shoe: 0x1e202c, stripe: 0xff2e88, chain: true  },
    gold_boss:   { pant: '#e5d8c0', under: 0x1a141c, shoe: 0x4b2a1c, stripe: 0xe8bc52, chain: true  },
    tactical:    { pant: '#282c24', under: 0x222620, shoe: 0x1e1d1a, stripe: 0x556046, chain: false },
    sunset_surf: { pant: '#c9b48a', under: 0xfff6e8, shoe: 0xf8f6fa, stripe: 0xff6e48, chain: true  }
  };
  const setOutfit = (outfitId = 'hawaiian') => {
    const id = OUTFIT_SPECS[outfitId] ? outfitId : 'hawaiian';
    const spec = OUTFIT_SPECS[id];
    shirtMat.map = makeCustomShirtTex(id);
    shirtMat.needsUpdate = true;
    pantMat.map = makeCustomPantTex(id, spec.pant);
    pantMat.needsUpdate = true;
    undershirtMat.color.setHex(spec.under);
    shoeMat.color.setHex(spec.shoe);
    shoeStripeMat.color.setHex(spec.stripe);
    chain.visible = spec.chain;
    pendant.visible = spec.chain;
  };
  const setShades = (mode = 'aviator') => {
    shadesGroup.visible = mode !== 'none';
    if (mode === 'pink') {
      aviatorGlassMat.color.setHex(0x5a0d38);
      goldMat.color.setHex(0xf4c860);
    } else if (mode === 'dark') {
      aviatorGlassMat.color.setHex(0x05070c);
      goldMat.color.setHex(0x303642);
    } else {
      aviatorGlassMat.color.setHex(0x091318);
      goldMat.color.setHex(0xe8bc52);
    }
  };

  // 3. 6 Detailed 3D Equippable Weapons mounted directly inside Sculpted Right Hand (elbowR Bone)
  const gunMetal = new THREE.MeshStandardMaterial({ color: 0x2b303c, metalness: 0.85, roughness: 0.24 });
  const gunChrome = new THREE.MeshStandardMaterial({ color: 0xdce2ee, metalness: 0.92, roughness: 0.14 });
  const gunDark  = new THREE.MeshStandardMaterial({ color: 0x15171e, metalness: 0.45, roughness: 0.52 });
  const woodMat  = new THREE.MeshStandardMaterial({ color: 0x8a542c, roughness: 0.58 });
  const batWoodMat = new THREE.MeshStandardMaterial({ color: 0xd9a86c, roughness: 0.42, metalness: 0.08 });
  const batBandMat = new THREE.MeshStandardMaterial({ color: 0xff2e88, roughness: 0.35, metalness: 0.25 });
  const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3f4c2f, metalness: 0.35, roughness: 0.56 });
  const warheadMat = new THREE.MeshStandardMaterial({ color: 0xc92b2b, metalness: 0.45, roughness: 0.34 });
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffe488, transparent: true, opacity: 0.94 });

  const weaponMount = new THREE.Group();
  weaponMount.position.set(0, -0.265, -0.015);
  rig.elbowR.add(weaponMount);

  // (a) Anatomically Gripped GTA Vice City Baseball Bat (handle seated deep inside clenched palm + curved 3D swing trail!)
  const batGrp = new THREE.Group();
  const batPivot = new THREE.Group();
  batPivot.rotation.x = 1.24;
  batPivot.position.set(0, 0.025, -0.012);
  const batKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.028, 12), gunDark);
  batKnob.position.set(0, 0.11, 0);
  const batGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.022, 0.28, 12), gunDark);
  batGrip.position.set(0, -0.03, 0);
  const batTaper = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.034, 0.24, 14), batWoodMat);
  batTaper.position.set(0, -0.28, 0);
  const batBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.044, 0.46, 16), batWoodMat);
  batBarrel.position.set(0, -0.63, 0);
  const batStripe = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.043, 0.06, 16), batBandMat);
  batStripe.position.set(0, -0.74, 0);
  const batTip = new THREE.Mesh(new THREE.SphereGeometry(0.044, 14, 10), batWoodMat);
  batTip.scale.set(1, 0.65, 1);
  batTip.position.set(0, -0.86, 0);
  batPivot.add(batKnob, batGrip, batTaper, batBarrel, batStripe, batTip);

  // Curved Gradient Additive 3D Motion-Blur Swing Arc Ribbon (flashes cleanly during high-velocity bat swings!)
  const trailC = document.createElement('canvas');
  trailC.width = 128; trailC.height = 128;
  const tctx = trailC.getContext('2d');
  const tg = tctx.createLinearGradient(0, 0, 128, 0);
  tg.addColorStop(0.0, 'rgba(255, 224, 150, 0.0)');
  tg.addColorStop(0.55, 'rgba(255, 210, 130, 0.35)');
  tg.addColorStop(0.88, 'rgba(255, 244, 210, 0.85)');
  tg.addColorStop(1.0, 'rgba(255, 255, 255, 0.95)');
  tctx.fillStyle = tg;
  tctx.fillRect(0, 0, 128, 128);
  const trailTex = new THREE.CanvasTexture(trailC);
  const batTrailMat = new THREE.MeshBasicMaterial({
    map: trailTex, color: 0xffe6a8, transparent: true, opacity: 0.0,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
  });
  const batTrail = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.66), batTrailMat);
  batTrail.position.set(-0.34, -0.56, 0);
  batTrail.rotation.y = Math.PI * 0.08;
  batPivot.add(batTrail);

  batGrp.add(batPivot);
  batGrp.visible = false;
  weaponMount.add(batGrp);

  // (b) Chrome 9mm Pistol
  const pistolGrp = new THREE.Group();
  const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.14, 0.072), gunDark);
  pGrip.position.set(0, -0.02, 0.05);
  const pSlide = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.28, 0.074), gunChrome);
  pSlide.position.set(0, -0.12, -0.01);
  pistolGrp.add(pGrip, pSlide);
  pistolGrp.visible = false;
  weaponMount.add(pistolGrp);

  // (c) Vice Uzi SMG
  const smgGrp = new THREE.Group();
  const uBody = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.34, 0.112), gunDark);
  uBody.position.set(0, -0.12, -0.02);
  const uBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.22, 8), gunMetal);
  uBarrel.position.set(0, -0.36, -0.02);
  const uMag = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.075, 0.28), gunMetal);
  uMag.position.set(0, -0.06, 0.14);
  smgGrp.add(uBody, uBarrel, uMag);
  smgGrp.visible = false;
  weaponMount.add(smgGrp);

  // (d) 12-Gauge Pump Shotgun
  const shotgunGrp = new THREE.Group();
  const sRec = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.32, 0.108), gunMetal);
  sRec.position.set(0, -0.10, -0.02);
  const sBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.62, 8), gunMetal);
  sBarrel.position.set(0, -0.52, -0.045);
  const sTube = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.50, 8), gunDark);
  sTube.position.set(0, -0.46, 0.005);
  const sPump = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.24, 8), woodMat);
  sPump.position.set(0, -0.46, 0.005);
  const sStock = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.28, 0.108), woodMat);
  sStock.position.set(0, 0.18, 0.01);
  shotgunGrp.add(sRec, sBarrel, sTube, sPump, sStock);
  shotgunGrp.visible = false;
  weaponMount.add(shotgunGrp);

  // (e) Vice M4 Assault Rifle
  const rifleGrp = new THREE.Group();
  const rBody = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.48, 0.108), gunDark);
  rBody.position.set(0, -0.16, -0.02);
  const rBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.44, 8), gunMetal);
  rBarrel.position.set(0, -0.56, -0.03);
  const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.11, 0.20), gunMetal);
  rMag.position.set(0, -0.22, 0.11);
  const rHandle = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.22, 0.06), gunDark);
  rHandle.position.set(0, -0.12, -0.09);
  const rStock = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.24, 0.108), gunDark);
  rStock.position.set(0, 0.15, -0.01);
  rifleGrp.add(rBody, rBarrel, rMag, rHandle, rStock);
  rifleGrp.visible = false;
  weaponMount.add(rifleGrp);

  // (f) RPG-7 Bazooka
  const bazookaGrp = new THREE.Group();
  const bTube = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.074, 1.28, 12), oliveMat);
  bTube.position.set(0.04, -0.12, -0.06);
  const bWood = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.34, 12), woodMat);
  bWood.position.set(0.04, 0.08, -0.06);
  const bFlare = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.126, 0.22, 12), gunDark);
  bFlare.position.set(0.04, 0.58, -0.06);
  const bWarhead = new THREE.Mesh(new THREE.ConeGeometry(0.116, 0.36, 12), warheadMat);
  bWarhead.rotation.x = Math.PI;
  bWarhead.position.set(0.04, -0.90, -0.06);
  const bGrip = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.14, 0.14), gunDark);
  bGrip.position.set(0.04, -0.08, 0.05);
  bazookaGrp.add(bTube, bWood, bFlare, bWarhead, bGrip);
  bazookaGrp.visible = false;
  weaponMount.add(bazookaGrp);

  // Shared muzzle flash cone
  const muzzleFlash = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.38, 7), flashMat);
  muzzleFlash.rotation.x = Math.PI;
  muzzleFlash.position.set(0, -0.35, -0.02);
  muzzleFlash.visible = false;
  weaponMount.add(muzzleFlash);

  const weapons = { bat: batGrp, batPivot, batTrail, batTrailMat, pistol: pistolGrp, smg: smgGrp, shotgun: shotgunGrp, rifle: rifleGrp, bazooka: bazookaGrp, muzzleFlash };
  const setWeapon = (id) => {
    batGrp.visible = id === 'bat';
    pistolGrp.visible = id === 'pistol';
    smgGrp.visible = id === 'smg';
    shotgunGrp.visible = id === 'shotgun';
    rifleGrp.visible = id === 'rifle';
    bazookaGrp.visible = id === 'bazooka';
    muzzleFlash.position.y =
      id === 'bazooka' ? -1.04 :
      id === 'shotgun' ? -0.88 :
      id === 'rifle' ? -0.84 :
      id === 'smg' ? -0.52 : -0.32;
    muzzleFlash.position.x = id === 'bazooka' ? 0.04 : 0;
  };

  // Ground contact shadow
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), getContactShadowMat());
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  root.add(shadow);

  root.visible = false;
  return {
    root, body, skinnedBody,
    hips: rig.hips, chest: rig.chest, head: rig.head,
    armL: rig.armL, armR: rig.armR, elbowL: rig.elbowL, elbowR: rig.elbowR,
    legL: rig.legL, legR: rig.legR, kneeL: rig.kneeL, kneeR: rig.kneeR,
    weapons, setWeapon, setHairstyle, setOutfit, setShades
  };
}

/* ==========================================================================
   7. UNIQUE VICE CITY LANDMARKS (FERRIS WHEEL, FOUNTAIN, TIKI BAR, VOLLEYBALL, ARCHES)
   ========================================================================== */
export function createFerrisWheel(pinkNeon, cyanNeon, goldNeon) {
  const root = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xeef0f6, metalness: 0.78, roughness: 0.22, envMapIntensity: 1.3 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x222636, metalness: 0.68, roughness: 0.32 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x1b3650, metalness: 0.2, roughness: 0.08, clearcoat: 1.0 });

  const R = 19.5;
  const hubY = 23.8;

  // Dual Cross-Braced A-Frame Support Towers
  for (const sx of [-2.8, 2.8]) {
    for (const sz of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.52, 27.2, 16), steelMat);
      leg.position.set(sx, hubY * 0.5, sz * 5.6);
      leg.rotation.x = sz * 0.38;
      root.add(leg);
    }
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6.2, 12), darkSteel);
    brace.rotation.x = Math.PI / 2; brace.position.set(sx, 11.5, 0);
    root.add(brace);
  }
  // Stepped Boarding Deck & Illuminated Queue Arch
  const base = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.8, 24), darkSteel);
  base.position.y = 0.4;
  root.add(base);
  const baseNeon = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.16, 24.2), cyanNeon);
  baseNeon.position.y = 0.84;
  root.add(baseNeon);

  // Rotating High-Poly Wheel Assembly
  const wheel = new THREE.Group();
  wheel.position.set(0, hubY, 0);
  root.add(wheel);

  // Triple Concentric Truss Rims + Neon Chasing Rings (64-seg smooth tori!)
  for (const sx of [-1.45, 1.45]) {
    const rimOuter = new THREE.Mesh(new THREE.TorusGeometry(R, 0.30, 14, 64), steelMat);
    rimOuter.rotation.y = Math.PI / 2; rimOuter.position.x = sx;
    const rimInner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.68, 0.16, 10, 48), steelMat);
    rimInner.rotation.y = Math.PI / 2; rimInner.position.x = sx;
    const glowRim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.55, 0.14, 10, 64), sx < 0 ? pinkNeon : cyanNeon);
    glowRim.rotation.y = Math.PI / 2; glowRim.position.x = sx;
    wheel.add(rimOuter, rimInner, glowRim);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 6.2, 24), goldNeon);
  hub.rotation.z = Math.PI / 2;
  const hubCapL = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.2, 24), pinkNeon);
  hubCapL.rotation.z = Math.PI / 2; hubCapL.position.x = -3.6;
  const hubCapR = new THREE.Mesh(new THREE.ConeGeometry(2.0, 1.2, 24), cyanNeon);
  hubCapR.rotation.z = -Math.PI / 2; hubCapR.position.x = 3.6;
  wheel.add(hub, hubCapL, hubCapR);

  // 16 Rounded Gondola Cabins with Glazed Windows & Warm Canopy Roofs
  const gondolas = [];
  const cabinColors = [0xff2e88, 0x21e6d1, 0xffd36b, 0xff7b2e];
  const cabinMats = cabinColors.map((c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.24, metalness: 0.25, clearcoat: 0.85 }));
  const spokeGeo = new THREE.CylinderGeometry(0.085, 0.085, R * 2, 10);
  const cabinBaseGeo = new THREE.CylinderGeometry(1.05, 0.85, 1.15, 14);
  const cabinGlassGeo = new THREE.CylinderGeometry(1.02, 1.02, 0.82, 14);
  const cabinRoofGeo = new THREE.ConeGeometry(1.24, 0.52, 14);
  const hangerGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.05, 8);

  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    if (i < 8) {
      for (const sx of [-1.25, 1.25]) {
        const sp = new THREE.Mesh(spokeGeo, i % 2 === 0 ? steelMat : goldNeon);
        sp.position.x = sx;
        sp.rotation.x = ang;
        wheel.add(sp);
      }
    }
    const gWrap = new THREE.Group();
    gWrap.position.set(0, Math.sin(ang) * R, Math.cos(ang) * R);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.9, 8), darkSteel);
    bar.rotation.z = Math.PI / 2;
    const hng = new THREE.Mesh(hangerGeo, darkSteel);
    hng.position.y = -0.52;
    const cMat = cabinMats[i % cabinMats.length];
    const cabBody = new THREE.Mesh(cabinBaseGeo, cMat);
    cabBody.position.y = -1.75;
    const cabWin = new THREE.Mesh(cabinGlassGeo, glassMat);
    cabWin.position.y = -1.12;
    const cabTop = new THREE.Mesh(cabinRoofGeo, cMat);
    cabTop.position.y = -0.58;
    gWrap.add(bar, hng, cabBody, cabWin, cabTop);
    wheel.add(gWrap);
    gondolas.push(gWrap);
  }

  return { root, wheel, gondolas };
}

export function createFountainPlaza(cyanNeon) {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xebe3d8, roughness: 0.72 });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x16b8c4, emissive: 0x107a8a, emissiveIntensity: 0.55, roughness: 0.14, metalness: 0.25
  });

  // Paved circular plaza + outer stone rim
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(13.5, 14.0, 0.16, 28), stoneMat);
  plaza.position.y = 0.08;
  g.add(plaza);
  const basinWall = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.55, 8, 28), stoneMat);
  basinWall.rotation.x = Math.PI / 2;
  basinWall.position.y = 0.55;
  g.add(basinWall);
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(6.0, 6.0, 0.48, 28), waterMat);
  pool.position.y = 0.38;
  g.add(pool);
  const ringGlow = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.09, 6, 28), cyanNeon);
  ringGlow.rotation.x = Math.PI / 2;
  ringGlow.position.y = 0.65;
  g.add(ringGlow);

  // Tiered Art Deco center sculpture
  const stem1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 2.2, 14), stoneMat);
  stem1.position.y = 1.4;
  const bowl1 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 1.3, 0.55, 16), stoneMat);
  bowl1.position.y = 2.6;
  const stem2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 1.8, 12), stoneMat);
  stem2.position.y = 3.6;
  const bowl2 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 0.42, 14), stoneMat);
  bowl2.position.y = 4.6;
  const jet = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 10), new THREE.MeshBasicMaterial({ color: 0xaaf8ff, transparent: true, opacity: 0.68 }));
  jet.position.y = 5.9;
  g.add(stem1, bowl1, stem2, bowl2, jet);

  return { group: g, jet };
}

export function createTikiBeachBar(pinkNeon, cyanNeon, maxAniso) {
  const g = new THREE.Group();
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x9b6d3c, roughness: 0.85 });
  const thatchMat = new THREE.MeshStandardMaterial({ color: 0xc99c58, roughness: 0.94 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x5c3a24, roughness: 0.75 });

  // Deck & counter
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.3, 9.6), counterMat);
  deck.position.y = 0.15;
  g.add(deck);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.15, 6.8), bambooMat);
  bar.position.set(-1.8, 0.85, 0);
  g.add(bar);
  const barGlow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 6.9), cyanNeon);
  barGlow.position.set(-2.45, 1.32, 0);
  g.add(barGlow);

  // 4 Bamboo corner posts + sloped thatched roof
  for (const [px, pz] of [[-2.8, -4.0], [2.8, -4.0], [-2.8, 4.0], [2.8, 4.0]]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.6, 8), bambooMat);
    post.position.set(px, 1.95, pz);
    g.add(post);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.4, 4), thatchMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(0.95, 1, 1.25);
  roof.position.y = 4.9;
  g.add(roof);

  // Barstools facing Ocean Drive
  for (let bz = -2.4; bz <= 2.4; bz += 1.2) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 6), bambooMat);
    leg.position.set(-3.0, 0.66, bz);
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 10), pinkNeon);
    seat.position.set(-3.0, 1.04, bz);
    g.add(leg, seat);
  }

  const signTex = makeNeonSignTexture('VICE TIKI BAR', 'SUNSET DRINKS · BEACH CLUB', '#FF2E88', maxAniso, false);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(5.6, 1.3),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.9 })
  );
  sign.rotation.y = -Math.PI / 2;
  sign.position.set(-3.1, 3.35, 0);
  g.add(sign);
  return g;
}

export function createVolleyballCourt() {
  const g = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0xdccbb2, roughness: 0.82 });
  const tapeMat = new THREE.MeshBasicMaterial({ color: 0xff2e88 });
  const netMat = new THREE.MeshBasicMaterial({ color: 0xf4f4f8, wireframe: true, transparent: true, opacity: 0.65 });

  // Court boundary tape
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 14), tapeMat); l1.position.set(-4, 0.02, 0);
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 14), tapeMat); l2.position.set(4, 0.02, 0);
  const l3 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.03, 0.12), tapeMat); l3.position.set(0, 0.02, -7);
  const l4 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.03, 0.12), tapeMat); l4.position.set(0, 0.02, 7);
  g.add(l1, l2, l3, l4);

  // Net posts & mesh net
  for (const sx of [-4.2, 4.2]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.7, 6), postMat);
    p.position.set(sx, 1.35, 0);
    g.add(p);
  }
  const net = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 1.1, 14, 4), netMat);
  net.position.set(0, 2.05, 0);
  g.add(net);
  return g;
}

export function createDistrictArch(title, sub, accentHex, poleMat, neonMat, maxAniso) {
  const g = new THREE.Group();
  for (const sx of [-9.4, 9.4]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.85, 9.8, 1.0), poleMat);
    pillar.position.set(sx, 4.9, 0);
    g.add(pillar);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 9.0, 0.16), neonMat);
    glow.position.set(sx + (sx > 0 ? -0.45 : 0.45), 4.8, 0.52);
    g.add(glow);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(19.6, 1.3, 1.0), poleMat);
  beam.position.set(0, 9.5, 0);
  g.add(beam);
  const tex = makeNeonSignTexture(title, sub, accentHex, maxAniso, false);
  const signMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.88 });
  const signF = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 2.0), signMat);
  signF.position.set(0, 9.6, 0.54);
  const signB = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 2.0), signMat);
  signB.rotation.y = Math.PI;
  signB.position.set(0, 9.6, -0.54);
  g.add(signF, signB);
  return g;
}

/* ==========================================================================
   8. 3D COLLECTIBLE PILES OF CASH (STACKED BUNDLES OF $100 BILLS + GLOW RING)
   ========================================================================== */
let _cashCache = null;
function getCashCache() {
  if (_cashCache) return _cashCache;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2dc46a';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#125c30';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 112);
  ctx.strokeStyle = '#9ef7be';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 220, 92);
  // Crisp gold/cream currency strap across center of bill bundle
  ctx.fillStyle = '#ffe599';
  ctx.fillRect(102, 0, 52, 128);
  ctx.strokeStyle = '#c4962c';
  ctx.lineWidth = 3;
  ctx.strokeRect(102, 0, 52, 128);
  // Bold "$" emblem on strap + corner "100" marks
  ctx.fillStyle = '#0e4a24';
  ctx.font = '900 54px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('$', 128, 82);
  ctx.fillStyle = '#0f4d28';
  ctx.font = '800 22px "JetBrains Mono", monospace';
  ctx.fillText('100', 48, 44);
  ctx.fillText('100', 208, 102);

  const billTex = new THREE.CanvasTexture(c);
  billTex.colorSpace = THREE.SRGBColorSpace;

  const billTopMat = new THREE.MeshStandardMaterial({
    map: billTex, color: 0xffffff, emissive: 0x16803d, emissiveIntensity: 0.45, roughness: 0.42, metalness: 0.08
  });

  // Stacked green bill edges with gold center strap (makes cash stacks pop from low car camera!)
  const eC = document.createElement('canvas');
  eC.width = 256; eC.height = 64;
  const ectx = eC.getContext('2d');
  ectx.fillStyle = '#1f994e';
  ectx.fillRect(0, 0, 256, 64);
  for (let ly = 4; ly < 64; ly += 8) {
    ectx.fillStyle = ly % 16 === 4 ? '#4ce082' : '#146b34';
    ectx.fillRect(0, ly, 256, 3);
  }
  ectx.fillStyle = '#ffd966';
  ectx.fillRect(102, 0, 52, 64);
  ectx.strokeStyle = '#a87c18';
  ectx.lineWidth = 3;
  ectx.strokeRect(102, 0, 52, 64);
  const edgeTex = new THREE.CanvasTexture(eC);
  edgeTex.colorSpace = THREE.SRGBColorSpace;
  const billEdgeMat = new THREE.MeshStandardMaterial({
    map: edgeTex, color: 0xffffff, emissive: 0x146e34, emissiveIntensity: 0.35, roughness: 0.55
  });
  const billEndMat = new THREE.MeshStandardMaterial({
    color: 0x24a857, emissive: 0x12662f, emissiveIntensity: 0.32, roughness: 0.55
  });
  const stackMaterials = [billEndMat, billEndMat, billTopMat, billTopMat, billEdgeMat, billEdgeMat];

  const bundleGeo = new THREE.BoxGeometry(0.96, 0.28, 0.50);
  const ringGeo = new THREE.TorusGeometry(1.12, 0.075, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x2ee88a, emissive: 0x2ee88a, emissiveIntensity: 1.35, roughness: 0.2
  });

  // Floating emerald "$" badge above pile
  const sC = document.createElement('canvas');
  sC.width = 128; sC.height = 128;
  const sctx = sC.getContext('2d');
  sctx.clearRect(0, 0, 128, 128);
  sctx.fillStyle = 'rgba(14, 74, 38, 0.86)';
  sctx.beginPath(); sctx.arc(64, 64, 52, 0, Math.PI * 2); sctx.fill();
  sctx.strokeStyle = '#34E89E'; sctx.lineWidth = 6; sctx.stroke();
  sctx.fillStyle = '#E8FFF2';
  sctx.font = '900 72px "JetBrains Mono", monospace';
  sctx.textAlign = 'center';
  sctx.fillText('$', 64, 88);
  const badgeTex = new THREE.CanvasTexture(sC);
  badgeTex.colorSpace = THREE.SRGBColorSpace;
  const badgeMat = new THREE.SpriteMaterial({ map: badgeTex, transparent: true, depthWrite: false });

  _cashCache = { bundleGeo, stackMaterials, ringGeo, ringMat, badgeMat };
  return _cashCache;
}

export function createCashPileMesh() {
  const c = getCashCache();
  const root = new THREE.Group();
  const pile = new THREE.Group();

  // Juicy 3-tier stacked pyramid of 6 crisp bundled $100 stacks!
  const tiers = [
    { x: -0.34, y: 0.12, z:  0.22, ry:  0.18 },
    { x:  0.34, y: 0.12, z:  0.20, ry: -0.22 },
    { x:  0.00, y: 0.12, z: -0.26, ry:  0.06 },
    { x: -0.20, y: 0.36, z: -0.02, ry: -0.34 },
    { x:  0.24, y: 0.36, z:  0.04, ry:  0.28 },
    { x:  0.02, y: 0.60, z:  0.00, ry:  0.12 }
  ];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const m = new THREE.Mesh(c.bundleGeo, c.stackMaterials);
    m.position.set(t.x, t.y, t.z);
    m.rotation.y = t.ry;
    pile.add(m);
  }
  root.add(pile);

  // Glowing emerald pickup ring + floating "$" emblem so cash piles pop from far away!
  const ring = new THREE.Mesh(c.ringGeo, c.ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.06;
  root.add(ring);

  const badge = new THREE.Sprite(c.badgeMat);
  badge.scale.set(0.95, 0.95, 1);
  badge.position.set(0, 1.48, 0);
  root.add(badge);

  return { root, pile, ring, badge };
}

/* ==========================================================================
   9. GLOWING 3D GTA WEAPON PICKUP STASHES AROUND VICE CITY
   ========================================================================== */
export function createWeaponPickupMesh(wepId, accentHex = '#FF2E88', label = 'WEAPON') {
  const root = new THREE.Group();
  const accentCol = new THREE.Color(accentHex);

  const ringMat = new THREE.MeshBasicMaterial({ color: accentCol, transparent: true, opacity: 0.86, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.05, 24), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  root.add(ring);

  const icon = new THREE.Group();
  icon.position.y = 1.12;
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x262a34, metalness: 0.85, roughness: 0.22, emissive: accentCol, emissiveIntensity: 0.35 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ee, metalness: 0.92, roughness: 0.16, emissive: accentCol, emissiveIntensity: 0.28 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5228, roughness: 0.55 });

  if (wepId === 'bat') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.095, 1.35, 10), chromeMat);
    b.rotation.z = 0.72; icon.add(b);
  } else if (wepId === 'bazooka') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.55, 10), new THREE.MeshStandardMaterial({ color: 0x455632, metalness: 0.4, roughness: 0.45, emissive: accentCol, emissiveIntensity: 0.25 }));
    tube.rotation.z = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 10), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff3b3b, emissiveIntensity: 0.45 }));
    tip.rotation.z = -Math.PI / 2; tip.position.x = 0.92;
    icon.add(tube, tip);
  } else if (wepId === 'shotgun') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.28, 8), gunMat);
    b.rotation.z = Math.PI / 2; b.position.x = 0.16;
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.10), woodMat);
    st.position.set(-0.48, -0.05, 0);
    icon.add(b, st);
  } else if (wepId === 'smg') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.12), gunMat);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.46, 0.09), chromeMat);
    mag.position.set(-0.04, -0.26, 0);
    icon.add(body, mag);
  } else {
    // Rifle / Pistol stylized pickup
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.10), gunMat);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.65, 8), chromeMat);
    bar.rotation.z = Math.PI / 2; bar.position.x = 0.62;
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.34, 0.08), chromeMat);
    mag.position.set(0.06, -0.22, 0);
    icon.add(body, bar, mag);
  }
  root.add(icon);

  // Floating Crisp Weapon Name Sprite
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(12, 6, 24, 0.88)';
  ctx.fillRect(10, 10, 236, 44);
  ctx.strokeStyle = '#' + accentCol.getHexString();
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 44);
  ctx.fillStyle = '#fff5ee';
  ctx.font = '800 24px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label.toUpperCase(), 128, 40);
  const lTex = new THREE.CanvasTexture(c);
  lTex.colorSpace = THREE.SRGBColorSpace;
  const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: lTex, transparent: true, depthWrite: false }));
  badge.scale.set(2.1, 0.52, 1);
  badge.position.set(0, 2.02, 0);
  root.add(badge);

  return { root, icon, item: icon, ring, badge };
}

/* ==========================================================================
   10. HIGH-POLY AIRCRAFT, AIRPORT TERMINAL, LUXURY YACHT & CARNIVAL FAIR PIER
   ========================================================================== */
/* Realistic Aviation Livery Texture aligned to LatheGeometry UV space (X = circumference, Y = nose-to-tail!) */
function makeAirlinerBodyTexture(accentHex = '#FF2E88', maxAniso = 4, airlineTitle = 'VICE AIRLINES') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 1024;
  const ctx = c.getContext('2d');
  // Gloss white upper crown + brushed silver-aluminum belly (Lathe u=0.0/1.0 is +X flank, u=0.5 is -X flank, u=0.25/0.75 top/bottom)
  ctx.fillStyle = '#f4f5f9';
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle aluminum fuselage skin panel rings & vertical seam lines
  ctx.strokeStyle = 'rgba(110, 122, 142, 0.16)';
  ctx.lineWidth = 1.5;
  for (let y = 90; y < 940; y += 34) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }
  // Dark gray nose radome cap at top (v=1 -> y=0..65) and metallic tail cone at bottom
  ctx.fillStyle = '#252b38';
  ctx.fillRect(0, 0, 512, 34);
  const bellyGrad = ctx.createLinearGradient(0, 0, 128, 0);
  bellyGrad.addColorStop(0, '#c0c8d6');
  bellyGrad.addColorStop(0.5, '#96a0b2');
  bellyGrad.addColorStop(1, '#c0c8d6');
  // Belly sits around u ≈ 0.75 (x = 320..448) after rotateX(+PI/2)
  ctx.fillStyle = bellyGrad;
  ctx.fillRect(324, 90, 120, 840);

  // Paint crisp lengthwise cheatline stripes & oval cabin window rows along BOTH flanks (x ≈ 0/512 and x ≈ 256!)
  const drawFlank = (cx, dir) => {
    // Dual retro 1986 Miami airline cheatlines running nose-to-tail
    ctx.fillStyle = accentHex;
    ctx.fillRect(cx + dir * 8, 95, 16, 825);
    ctx.fillStyle = '#21e6d1';
    ctx.fillRect(cx + dir * 26, 110, 8, 795);

    // Cabin Passenger Oval Windows with metallic frames & warm cabin glow
    for (let y = 210; y < 810; y += 22) {
      if (Math.abs(y - 470) < 28) continue; // Over-wing emergency exit gap
      ctx.fillStyle = '#a8b4c4';
      ctx.beginPath(); ctx.ellipse(cx - dir * 12, y, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#182b44';
      ctx.beginPath(); ctx.ellipse(cx - dir * 12, y, 6.2, 3.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255, 228, 175, 0.55)';
      ctx.beginPath(); ctx.ellipse(cx - dir * 13, y, 3.2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Forward & Aft Boarding Doors with safety outline
    ctx.strokeStyle = '#333b4a';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - dir * 24, 156, 30, 38);
    ctx.strokeRect(cx - dir * 24, 830, 28, 36);

    // Rotated Airline Title running cleanly lengthwise above windows
    ctx.save();
    ctx.translate(cx - dir * 32, 330);
    ctx.rotate(dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    ctx.fillStyle = '#161b2c';
    ctx.font = '900 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(airlineTitle, 0, 0);
    ctx.restore();
  };
  drawFlank(256, 1);
  drawFlank(24, -1);
  drawFlank(488, 1);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = maxAniso;
  return tex;
}

export function createAirlinerJet(accentHex = '#FF2E88', maxAniso = 4) {
  const root = new THREE.Group();
  const accentCol = new THREE.Color(accentHex);

  const fuselageTex = makeAirlinerBodyTexture(accentHex, maxAniso, 'VICE AIRLINES');
  const hullMat = new THREE.MeshPhysicalMaterial({ map: fuselageTex, metalness: 0.28, roughness: 0.22, clearcoat: 0.92, clearcoatRoughness: 0.08, envMapIntensity: 1.4 });
  const wingMat = new THREE.MeshPhysicalMaterial({ color: 0xe2e6ee, metalness: 0.52, roughness: 0.24, clearcoat: 0.65, envMapIntensity: 1.35 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdce2ec, metalness: 0.94, roughness: 0.14, envMapIntensity: 1.5 });
  const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x1b202a, metalness: 0.78, roughness: 0.34 });
  const accentMat = new THREE.MeshPhysicalMaterial({ color: accentCol, metalness: 0.35, roughness: 0.24, clearcoat: 0.9 });
  const cockpitMat = new THREE.MeshPhysicalMaterial({ color: 0x0a1628, metalness: 0.42, roughness: 0.05, clearcoat: 1.0, envMapIntensity: 2.0 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x15151c, roughness: 0.88 });
  const navRed = new THREE.MeshBasicMaterial({ color: 0xff2846 });
  const navGreen = new THREE.MeshBasicMaterial({ color: 0x22ff88 });
  const strobeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending });

  // Sculpted High-Poly Lathe Fuselage (Length 38m, Radius 2.2m, aerodynamic nose cone & upswept tail!)
  const fusePts = [
    new THREE.Vector2(0.01, -18.8),
    new THREE.Vector2(0.55, -18.0),
    new THREE.Vector2(1.42, -16.2),
    new THREE.Vector2(2.08, -13.6),
    new THREE.Vector2(2.20, -10.4),
    new THREE.Vector2(2.20,  9.8),
    new THREE.Vector2(1.88, 13.8),
    new THREE.Vector2(1.10, 17.2),
    new THREE.Vector2(0.36, 19.0),
    new THREE.Vector2(0.01, 19.3)
  ];
  const fuseGeo = new THREE.LatheGeometry(fusePts, 32);
  fuseGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuseGeo, hullMat);
  fuselage.position.y = 4.45;
  root.add(fuselage);

  // Sculpted Wing-Root Belly Fairing + Radar Nose Tip + Dorsal VHF Antennas
  const bellyFairing = new THREE.Mesh(new THREE.CapsuleGeometry(1.85, 11.0, 8, 16), wingMat);
  bellyFairing.rotation.x = Math.PI / 2;
  bellyFairing.scale.set(1.24, 1.0, 0.52);
  bellyFairing.position.set(0, 3.05, 0.2);
  const ant1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.72), accentMat);
  ant1.position.set(0, 6.95, -5.5);
  const ant2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.55), wingMat);
  ant2.position.set(0, 6.85, 5.2);
  root.add(bellyFairing, ant1, ant2);

  // Multi-Pane Framed Cockpit Windshield (6 realistic Boeing-style flight deck glass panes + center mullion!)
  const cockpit = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.94, 1.32, 24, 1, false, -Math.PI * 0.40, Math.PI * 0.80), cockpitMat);
  cockpit.rotation.x = Math.PI / 2;
  cockpit.position.set(0, 5.22, -15.3);
  root.add(cockpit);
  for (const ang of [-0.52, -0.20, 0, 0.20, 0.52]) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.92, 0.14), wingMat);
    mullion.position.set(Math.sin(ang) * 1.72, 5.45, -15.45 - Math.cos(ang) * 0.62);
    mullion.rotation.y = ang;
    mullion.rotation.x = -0.35;
    root.add(mullion);
  }

  // Swept Beveled Airfoil Main Wings + Flap-Track Fairings + Blended Sharklet Winglets
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, -3.6);
  wingShape.lineTo(18.2, 4.8);
  wingShape.lineTo(18.2, 6.4);
  wingShape.lineTo(0, 3.8);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.44, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 4 });
  wingGeo.rotateX(Math.PI / 2);

  const fanMeshes = [];
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(wingGeo, wingMat);
    w.scale.x = side;
    w.position.set(side * 1.6, 3.85, -1.6);
    w.rotation.z = side * 0.065;
    root.add(w);

    // 3 Under-wing Aerodynamic Flap-Track Canoes per wing!
    for (const [fx, fz] of [[5.2, 2.2], [9.6, 3.6], [13.8, 4.9]]) {
      const ftk = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 2.2, 6, 10), wingMat);
      ftk.rotation.x = Math.PI / 2;
      ftk.position.set(side * fx, 3.55 + fx * 0.055, fz);
      root.add(ftk);
    }

    // Blended Swept Sharklet Winglet
    const wlet = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.55, 1.65), accentMat);
    wlet.position.set(side * 19.65, 5.85, 3.9);
    wlet.rotation.z = -side * 0.24;
    wlet.rotation.x = -0.18;
    root.add(wlet);

    const nav = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), side < 0 ? navRed : navGreen);
    nav.position.set(side * 19.75, 5.0, 3.3);
    root.add(nav);

    // Detailed High-Bypass Turbofan Engine Nacelle + Dark Intake Depth + Spinning Fan Blades + Titanium Core Exhaust
    const eng = new THREE.Group();
    eng.position.set(side * 7.4, 2.74, -1.6);
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(1.16, 1.04, 4.4, 26), wingMat);
    nacelle.rotation.x = Math.PI / 2;
    const cowlingStripe = new THREE.Mesh(new THREE.CylinderGeometry(1.17, 1.15, 0.55, 26), accentMat);
    cowlingStripe.rotation.x = Math.PI / 2;
    cowlingStripe.position.z = -1.2;
    const intakeLip = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.13, 12, 26), chromeMat);
    intakeLip.position.z = -2.2;
    const darkDuct = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 0.96, 0.5, 20), darkMetalMat);
    darkDuct.rotation.x = Math.PI / 2;
    darkDuct.position.z = -1.98;
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.68, 1.25, 20), darkMetalMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.z = 2.45;
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.45, 3.0), wingMat);
    pylon.position.set(0, 1.0, 0.35);
    const fan = new THREE.Group();
    fan.position.z = -1.85;
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.68, 14), chromeMat);
    spinner.rotation.x = -Math.PI / 2;
    fan.add(spinner);
    for (let b = 0; b < 12; b++) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.13, 0.04), chromeMat);
      bl.rotation.z = (b / 12) * Math.PI * 2;
      fan.add(bl);
    }
    const exhaustCone = new THREE.Mesh(new THREE.ConeGeometry(0.78, 3.0, 12), engineGlowMat);
    exhaustCone.rotation.x = Math.PI / 2;
    exhaustCone.position.z = 3.6;
    eng.add(nacelle, cowlingStripe, intakeLip, darkDuct, nozzle, pylon, fan, exhaustCone);
    root.add(eng);
    fanMeshes.push(fan);
  }

  // Tall Swept Vertical Tailfin with Airline Stripe + Horizontal Stabilizers + APU Exhaust
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(6.2, 0);
  tailShape.lineTo(8.8, 8.0);
  tailShape.lineTo(5.4, 8.0);
  tailShape.closePath();
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.38, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 3 });
  tailGeo.translate(0, 0, -0.19);
  tailGeo.rotateY(Math.PI / 2);
  const vTail = new THREE.Mesh(tailGeo, accentMat);
  vTail.position.set(0, 5.55, 18.0);
  const tailStripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 5.8, 0.9), new THREE.MeshBasicMaterial({ color: 0x21e6d1 }));
  tailStripe.position.set(0, 9.6, 12.6);
  tailStripe.rotation.x = 0.32;
  root.add(vTail, tailStripe);

  const hStabShape = new THREE.Shape();
  hStabShape.moveTo(0, -1.4);
  hStabShape.lineTo(7.0, 1.9);
  hStabShape.lineTo(7.0, 2.9);
  hStabShape.lineTo(0, 1.6);
  hStabShape.closePath();
  const hStabGeo = new THREE.ExtrudeGeometry(hStabShape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3 });
  hStabGeo.rotateX(Math.PI / 2);
  for (const side of [-1, 1]) {
    const hs = new THREE.Mesh(hStabGeo, wingMat);
    hs.scale.x = side;
    hs.position.set(side * 0.8, 5.15, 15.0);
    root.add(hs);
  }

  // Detailed Retractable Tricycle Landing Gear (Struts, Gear Bay Doors, Dual/Quad Bogie Wheels + Chrome Hubs!)
  const gearGroup = new THREE.Group();
  const makeBogie = (x, z, wheels = 2) => {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 3.1, 12), chromeMat);
    strut.position.set(x, 1.85, z);
    const brace = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), darkMetalMat);
    brace.position.set(x, 2.2, z + 0.75);
    brace.rotation.x = 0.65;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.2, 1.8), wingMat);
    door.position.set(x + (x >= 0 ? 0.45 : -0.45), 2.5, z);
    gearGroup.add(strut, brace, door);
    for (let w = 0; w < wheels; w++) {
      const off = (w - (wheels - 1) * 0.5) * 0.56;
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.36, 18), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(x + off, 0.58, z);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.38, 14), chromeMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(x + off, 0.58, z);
      gearGroup.add(tire, hub);
    }
  };
  makeBogie(0, -13.2, 2);
  makeBogie(-4.5, 1.6, 2);
  makeBogie(4.5, 1.6, 2);
  root.add(gearGroup);

  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), strobeMat);
  strobe.position.set(0, 13.7, 18.2);
  root.add(strobe);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(36, 40), getContactShadowMat());
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  root.add(shadow);

  return { root, fanMeshes, gearGroup, strobe, engineGlowMat, shadow };
}

/* FLYABLE HERO VICE LEARJET 86 — Detailed Sculpted Business Jet with Livery, Retractable Gear, Afterburners & Seated Pilot! */
export function createPrivateLearjet(accentHex = 0x21e6d1, maxAniso = 4) {
  const root = new THREE.Group();
  const hexStr = '#' + (accentHex >>> 0).toString(16).padStart(6, '0');
  const jetTex = makeAirlinerBodyTexture(hexStr, maxAniso, 'VICE EXECUTIVE');
  const bodyMat = new THREE.MeshPhysicalMaterial({ map: jetTex, metalness: 0.34, roughness: 0.18, clearcoat: 1.0, clearcoatRoughness: 0.06, envMapIntensity: 1.6 });
  const wingMat = new THREE.MeshPhysicalMaterial({ color: 0xf4f5fa, metalness: 0.45, roughness: 0.20, clearcoat: 0.9, envMapIntensity: 1.5 });
  const accentMat = new THREE.MeshPhysicalMaterial({ color: accentHex, metalness: 0.45, roughness: 0.22, clearcoat: 0.9 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0c1a2e, metalness: 0.36, roughness: 0.05, clearcoat: 1.0, transparent: true, opacity: 0.62 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f2, metalness: 0.94, roughness: 0.14 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x161922, roughness: 0.72, metalness: 0.42 });
  const afterburnerMat = new THREE.MeshBasicMaterial({ color: 0x38f0ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false });
  const navRed = new THREE.MeshBasicMaterial({ color: 0xff2846 });
  const navGreen = new THREE.MeshBasicMaterial({ color: 0x22ff88 });

  const pts = [
    new THREE.Vector2(0.01, -8.4),
    new THREE.Vector2(0.42, -7.4),
    new THREE.Vector2(0.95, -5.4),
    new THREE.Vector2(1.02, 3.8),
    new THREE.Vector2(0.66, 6.4),
    new THREE.Vector2(0.01, 7.9)
  ];
  const fGeo = new THREE.LatheGeometry(pts, 28);
  fGeo.rotateX(Math.PI / 2);
  const fuse = new THREE.Mesh(fGeo, bodyMat);
  fuse.position.y = 1.98;
  root.add(fuse);

  // Framed Panoramic Cockpit Canopy + Seated Tommy Pilot (shown while flying!)
  const ws = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.92, 1.35, 20, 1, false, -Math.PI * 0.42, Math.PI * 0.84), glassMat);
  ws.rotation.x = Math.PI / 2; ws.position.set(0, 2.34, -5.65);
  root.add(ws);

  const pilotMesh = new THREE.Group();
  const pTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.32, 6, 12), new THREE.MeshStandardMaterial({ color: 0x16b8b2, roughness: 0.7 }));
  pTorso.position.set(0, 2.15, -5.35);
  const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), new THREE.MeshStandardMaterial({ color: 0xe3ac84, roughness: 0.54 }));
  pHead.position.set(0, 2.52, -5.35);
  const pHair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), new THREE.MeshStandardMaterial({ color: 0x1c1520, roughness: 0.75 }));
  pHair.position.set(0, 2.56, -5.33);
  pilotMesh.add(pTorso, pHead, pHair);
  pilotMesh.visible = false;
  root.add(pilotMesh);

  // Swept Airfoil Wings + Wingtip Tip-Tanks + Nav Lights + Rear Fuselage Twin Jet Engines + Afterburners!
  const wShape = new THREE.Shape();
  wShape.moveTo(0, -1.7); wShape.lineTo(8.0, 1.9); wShape.lineTo(8.0, 3.0); wShape.lineTo(0, 1.6); wShape.closePath();
  const wGeo = new THREE.ExtrudeGeometry(wShape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 3 });
  wGeo.rotateX(Math.PI / 2);
  const fanMeshes = [];
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(wGeo, wingMat);
    w.scale.x = side; w.position.set(side * 0.72, 1.54, -0.4);
    w.rotation.z = side * 0.04;
    root.add(w);
    const tip = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 2.0, 8, 14), accentMat);
    tip.rotation.x = Math.PI / 2; tip.position.set(side * 8.72, 1.62, 1.9);
    const nav = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), side < 0 ? navRed : navGreen);
    nav.position.set(side * 8.92, 1.68, 1.2);
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 2.9, 20), accentMat);
    pod.rotation.x = Math.PI / 2; pod.position.set(side * 1.32, 2.32, 4.2);
    const intake = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.06, 10, 20), chromeMat);
    intake.position.set(side * 1.32, 2.32, 2.75);
    const fan = new THREE.Group();
    fan.position.set(side * 1.32, 2.32, 2.9);
    for (let b = 0; b < 8; b++) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 0.03), chromeMat);
      bl.rotation.z = (b / 8) * Math.PI * 2;
      fan.add(bl);
    }
    root.add(tip, nav, pod, intake, fan);
    fanMeshes.push(fan);
  }

  // Sculpted Swept T-Tail Stabilizer
  const vFinShape = new THREE.Shape();
  vFinShape.moveTo(0, 0); vFinShape.lineTo(2.6, 0); vFinShape.lineTo(3.8, 3.4); vFinShape.lineTo(2.1, 3.4); vFinShape.closePath();
  const vFinGeo = new THREE.ExtrudeGeometry(vFinShape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2 });
  vFinGeo.translate(0, 0, -0.11); vFinGeo.rotateY(Math.PI / 2);
  const vFin = new THREE.Mesh(vFinGeo, accentMat);
  vFin.position.set(0, 2.45, 7.6);
  const tTop = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 1.25), wingMat);
  tTop.position.set(0, 5.78, 6.65);
  root.add(vFin, tTop);

  // Retractable Landing Gear Group (folds smoothly when airborne!)
  const gearGroup = new THREE.Group();
  for (const [gx, gz] of [[0, -5.6], [-2.2, 0.8], [2.2, 0.8]]) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.42, 10), chromeMat); st.position.set(gx, 0.92, gz);
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16), darkMat); wh.rotation.z = Math.PI / 2; wh.position.set(gx, 0.34, gz);
    const hb = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.26, 12), chromeMat); hb.rotation.z = Math.PI / 2; hb.position.set(gx, 0.34, gz);
    gearGroup.add(st, wh, hb);
  }
  root.add(gearGroup);

  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  strobe.position.set(0, 5.95, 6.85);
  root.add(strobe);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(17, 18), getContactShadowMat());
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; root.add(shadow);

  return { root, gearGroup, fanMeshes, afterburnerMat, pilotMesh, strobe, shadow, label: 'VICE LEARJET 86', topSpeed: 98, takeoffSpeed: 24, climbRate: 24 };
}

/* FLYABLE VICE STUNT TURBOPROP (Dodo-Cessna Style with Detailed Fuselage, Retractable-style Gear, Pilot & Spinning Prop!) */
export function createPropPlane(accentHex = 0xffd36b) {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xfaf6f0, roughness: 0.24, metalness: 0.22, clearcoat: 0.85, envMapIntensity: 1.4 });
  const accentMat = new THREE.MeshPhysicalMaterial({ color: accentHex, roughness: 0.28, metalness: 0.28, clearcoat: 0.85 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x162b44, roughness: 0.06, metalness: 0.35, clearcoat: 1.0, transparent: true, opacity: 0.62 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 0.72 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdce2ec, metalness: 0.92, roughness: 0.14 });

  // Sculpted Lathe Fuselage + Side Livery Stripes
  const pts = [
    new THREE.Vector2(0.01, -3.5),
    new THREE.Vector2(0.54, -3.0),
    new THREE.Vector2(0.84, -1.6),
    new THREE.Vector2(0.86, 1.2),
    new THREE.Vector2(0.46, 4.2),
    new THREE.Vector2(0.18, 5.8),
    new THREE.Vector2(0.01, 6.0)
  ];
  const fGeo = new THREE.LatheGeometry(pts, 22);
  fGeo.rotateX(Math.PI / 2);
  const fuse = new THREE.Mesh(fGeo, bodyMat);
  fuse.position.y = 1.65;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.24, 6.2), accentMat);
  stripe.position.set(0, 1.65, 0.6);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.86, 2.2), glassMat);
  canopy.position.set(0, 2.22, -0.3);
  const highWing = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.24, 1.95), accentMat);
  highWing.position.set(0, 2.74, -0.35);
  const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.1, 1.45), accentMat);
  vTail.position.set(0, 2.85, 5.3);
  vTail.rotation.x = -0.22;
  const hTail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.16, 0.95), bodyMat);
  hTail.position.set(0, 1.95, 5.45);
  root.add(fuse, stripe, canopy, highWing, vTail, hTail);

  const pilotMesh = new THREE.Group();
  const pTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.20, 0.28, 6, 12), new THREE.MeshStandardMaterial({ color: 0x16b8b2, roughness: 0.7 }));
  pTorso.position.set(0, 1.95, -0.3);
  const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), new THREE.MeshStandardMaterial({ color: 0xe3ac84, roughness: 0.54 }));
  pHead.position.set(0, 2.30, -0.3);
  pilotMesh.add(pTorso, pHead);
  pilotMesh.visible = false;
  root.add(pilotMesh);

  const gearGroup = new THREE.Group();
  for (const sx of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), chromeMat);
    strut.position.set(sx * 1.95, 1.92, -0.35); strut.rotation.z = sx * 0.78;
    root.add(strut);
    const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.25, 8), chromeMat);
    gear.position.set(sx * 1.12, 0.88, -0.75); gear.rotation.z = -sx * 0.35;
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 16), darkMat);
    tire.rotation.z = Math.PI / 2; tire.position.set(sx * 1.32, 0.34, -0.75);
    gearGroup.add(gear, tire);
  }
  const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 8), chromeMat);
  noseStrut.position.set(0, 0.85, -2.95);
  const noseTire = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.20, 14), darkMat);
  noseTire.rotation.z = Math.PI / 2; noseTire.position.set(0, 0.26, -2.95);
  gearGroup.add(noseStrut, noseTire);
  root.add(gearGroup);

  const propHub = new THREE.Group();
  propHub.position.set(0, 1.65, -3.55);
  const noseCone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.52, 14), accentMat);
  noseCone.rotation.x = -Math.PI / 2;
  propHub.add(noseCone);
  for (let b = 0; b < 3; b++) {
    const bl = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.15, 0.04), darkMat);
    bl.rotation.z = (b / 3) * Math.PI * 2;
    propHub.add(bl);
  }
  root.add(propHub);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(13, 12), getContactShadowMat());
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; root.add(shadow);

  return { root, propHub, gearGroup, pilotMesh, shadow, label: 'VICE STUNT PROP', topSpeed: 68, takeoffSpeed: 19, climbRate: 18 };
}

/* ENTERABLE MULTI-SIDED DETAILED ESCOBAR INT'L AIRPORT TERMINAL (Open Walk-Through Departure Hall -> Runway Apron!) */
export function createAirportTerminal(maxAniso = 4) {
  const root = new THREE.Group();
  const stuccoMat = new THREE.MeshStandardMaterial({ color: 0xf0eae2, roughness: 0.58 });
  const concMat = new THREE.MeshStandardMaterial({ color: 0xd6d2cc, roughness: 0.72 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a364e, metalness: 0.50, roughness: 0.34 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x265c78, emissive: 0x103044, emissiveIntensity: 0.32, metalness: 0.32, roughness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.44, depthWrite: false });
  const accentPink = new THREE.MeshStandardMaterial({ color: 0xff2e88, emissive: 0xff2e88, emissiveIntensity: 1.45 });
  const accentCyan = new THREE.MeshStandardMaterial({ color: 0x21e6d1, emissive: 0x21e6d1, emissiveIntensity: 1.45 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xd6dce8, metalness: 0.76, roughness: 0.24 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b202c, roughness: 0.62, metalness: 0.35 });

  // 1. Polished Checkered Marble Interior Concourse Floor (68m x 20m, top Y = 0.06)
  const fc = document.createElement('canvas');
  fc.width = 256; fc.height = 256;
  const fctx = fc.getContext('2d');
  fctx.fillStyle = '#e8e4dc';
  fctx.fillRect(0, 0, 256, 256);
  fctx.fillStyle = '#c8d6dc';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    if ((x + y) % 2 === 0) fctx.fillRect(x * 32, y * 32, 32, 32);
  }
  const floorTex = new THREE.CanvasTexture(fc);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(12, 4);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.22, metalness: 0.16 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(68, 0.12, 20), floorMat);
  floor.position.set(0, 0.02, 0);
  floor.receiveShadow = true;
  root.add(floor);

  // 2. Open Walk-Through Architectural Walls (BOTH Street-Side -Z AND Runway-Side +Z have panoramic glass & 12m open entrances!)
  const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(1.0, 11.2, 20), stuccoMat);
  sideWallL.position.set(-33.5, 5.6, 0);
  const sideWallR = sideWallL.clone(); sideWallR.position.x = 33.5;
  root.add(sideWallL, sideWallR);

  // North (-Z Street) & South (+Z Runway) Panoramic Glass Curtain Walls with wide 12m OPEN CENTER PASSAGE!
  for (const zSign of [-1, 1]) {
    const fz = zSign * 9.8;
    // Left & Right glazed curtain wings (x = -33..-6 and x = +6..+33)
    for (const sx of [-1, 1]) {
      const wingGlass = new THREE.Mesh(new THREE.BoxGeometry(27, 8.2, 0.35), glassMat);
      wingGlass.position.set(sx * 19.5, 5.3, fz);
      const wingBase = new THREE.Mesh(new THREE.BoxGeometry(27, 1.2, 0.7), concMat);
      wingBase.position.set(sx * 19.5, 0.6, fz);
      const wingHeader = new THREE.Mesh(new THREE.BoxGeometry(27, 1.8, 0.8), stuccoMat);
      wingHeader.position.set(sx * 19.5, 10.3, fz);
      root.add(wingGlass, wingBase, wingHeader);
    }
    // Center 12m Open Sliding Glass Entrance Header & Neon Portal!
    const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(12, 6.2, 0.85), stuccoMat);
    doorHeader.position.set(0, 8.1, fz);
    const doorGlassTop = new THREE.Mesh(new THREE.BoxGeometry(11.6, 4.4, 0.4), glassMat);
    doorGlassTop.position.set(0, 7.6, fz + zSign * 0.28);
    const portalGlow = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.24, 0.24), zSign < 0 ? accentCyan : accentPink);
    portalGlow.position.set(0, 5.05, fz + zSign * 0.48);
    root.add(doorHeader, doorGlassTop, portalGlow);

    // Architectural Steel Mullion Columns every 7m (clear of the 12m open center entrance!)
    for (let mx = -30; mx <= 30; mx += 6) {
      if (Math.abs(mx) < 5.5) continue;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 11.4, 12), metalMat);
      col.position.set(mx, 5.7, fz + zSign * 0.35);
      root.add(col);
    }
  }

  // 3. Street-Side (-Z) Grand Departures Portico Canopy (so airport looks iconic from Ocean Drive!)
  const portico = new THREE.Mesh(new THREE.BoxGeometry(38, 0.75, 7.5), roofMat);
  portico.position.set(0, 5.4, -13.6);
  const porticoGlow = new THREE.Mesh(new THREE.BoxGeometry(38.2, 0.22, 0.22), accentCyan);
  porticoGlow.position.set(0, 5.35, -17.4);
  root.add(portico, porticoGlow);
  for (const px of [-16, -7, 7, 16]) {
    const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 5.4, 12), metalMat);
    pCol.position.set(px, 2.7, -16.8);
    root.add(pCol);
  }
  const depSignTex = makeNeonSignTexture("ESCOBAR INT'L · DEPARTURES", 'WALK IN · RUNWAY ACCESS & FLYABLE JETS', '#FF2E88', maxAniso, false);
  const depSign = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 2.8),
    new THREE.MeshStandardMaterial({ map: depSignTex, emissive: 0xffffff, emissiveMap: depSignTex, emissiveIntensity: 0.92, side: THREE.DoubleSide })
  );
  depSign.position.set(0, 7.3, -17.35);
  depSign.rotation.y = Math.PI;
  root.add(depSign);

  // 4. Sweeping Cantilevered Modernist Wave Roof + Ceiling Light Strips + Rooftop Sign
  const roof = new THREE.Mesh(new THREE.BoxGeometry(74, 1.35, 25), roofMat);
  roof.position.set(0, 11.8, 0.6);
  const neonTrimN = new THREE.Mesh(new THREE.BoxGeometry(74.2, 0.26, 0.26), accentCyan);
  neonTrimN.position.set(0, 11.5, -11.95);
  const neonTrimS = new THREE.Mesh(new THREE.BoxGeometry(74.2, 0.26, 0.26), accentCyan);
  neonTrimS.position.set(0, 11.5, 13.15);
  const neonTrimS2 = new THREE.Mesh(new THREE.BoxGeometry(74.2, 0.26, 0.26), accentPink);
  neonTrimS2.position.set(0, 12.25, 13.15);
  root.add(roof, neonTrimN, neonTrimS, neonTrimS2);

  // Warm Interior Skylight Light Strips across Concourse Ceiling
  const ceilGlow = new THREE.MeshBasicMaterial({ color: 0xf4f8ff });
  for (let lx = -24; lx <= 24; lx += 12) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.6), ceilGlow);
    strip.rotation.x = Math.PI / 2;
    strip.position.set(lx, 11.05, 0);
    root.add(strip);
  }

  // 5. DETAILED WALK-IN CONCOURSE INTERIOR (Check-In Desks, Giant Departures Board, Lounge Seating, Baggage Carousel!)
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x26354d, roughness: 0.44, metalness: 0.25 });
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x21e6d1 });
  // 4 Vice Airlines Check-In Desks (West Wing)
  for (let i = 0; i < 4; i++) {
    const cx = -26 + i * 5.2;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.15, 1.6), deskMat);
    counter.position.set(cx, 0.62, -3.5);
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 0.45), screenMat);
    monitor.position.set(cx, 1.44, -3.5);
    root.add(counter, monitor);
  }

  // Giant Illuminated Split-Flap Flight Departures Board hanging over Center Hall
  const boardC = document.createElement('canvas');
  boardC.width = 512; boardC.height = 192;
  const bctx = boardC.getContext('2d');
  bctx.fillStyle = '#0d1322';
  bctx.fillRect(0, 0, 512, 192);
  bctx.strokeStyle = '#21e6d1'; bctx.lineWidth = 4; bctx.strokeRect(4, 4, 504, 184);
  bctx.fillStyle = '#ffd36b'; bctx.font = '700 22px "JetBrains Mono", monospace';
  bctx.fillText('ESCOBAR INTL · FLIGHT DEPARTURES', 24, 38);
  bctx.font = '700 17px "JetBrains Mono", monospace';
  const rows = [
    ['VC-103  LIBERTY CITY     GATE A1  BOARDING', '#21e6d1'],
    ['VC-086  SAN ANDREAS      GATE A2  ON TIME ', '#ffffff'],
    ['VC-404  LOS SANTOS       GATE B1  ON TIME ', '#ffffff'],
    ['VIP-01  VICE LEARJET     APRON E  FLY NOW!', '#ff2e88']
  ];
  rows.forEach(([txt, col], idx) => {
    bctx.fillStyle = col;
    bctx.fillText(txt, 24, 78 + idx * 28);
  });
  const boardTex = new THREE.CanvasTexture(boardC);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const depBoard = new THREE.Mesh(new THREE.BoxGeometry(11.5, 4.0, 0.45), [
    darkMat, darkMat, darkMat, darkMat,
    new THREE.MeshBasicMaterial({ map: boardTex }),
    new THREE.MeshBasicMaterial({ map: boardTex })
  ]);
  depBoard.position.set(0, 6.2, 0);
  root.add(depBoard);

  // Airport Lounge Seating Rows & Baggage Claim Carousel (East Wing)
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x1d4e78, roughness: 0.58 });
  for (const bx of [12, 22]) {
    for (const bz of [-4.2, 3.2]) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.55, 0.95), seatMat);
      bench.position.set(bx, 0.45, bz);
      const back = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.75, 0.16), seatMat);
      back.position.set(bx, 0.85, bz - 0.42);
      root.add(bench, back);
    }
  }
  const carousel = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.55, 10, 24), darkMat);
  carousel.rotation.x = Math.PI / 2;
  carousel.scale.set(1.5, 0.85, 1.0);
  carousel.position.set(-18, 0.42, 4.2);
  root.add(carousel);
  const bagCols = [0xff2e88, 0x21e6d1, 0xffd36b, 0x3b82f6];
  bagCols.forEach((col, i) => {
    const a = (i / 4) * Math.PI * 2;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.48, 0.52), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 }));
    bag.position.set(-18 + Math.cos(a) * 3.8, 0.88, 4.2 + Math.sin(a) * 2.2);
    root.add(bag);
  });

  // Security Scanner Archway at Runway Boarding Exit (+Z)
  for (const sx of [-2.4, 2.4]) {
    const sPost = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.6, 0.75), metalMat);
    sPost.position.set(sx, 1.3, 6.8);
    root.add(sPost);
  }
  const sTop = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.35, 0.78), accentCyan);
  sTop.position.set(0, 2.65, 6.8);
  root.add(sTop);

  // Rooftop Glowing "VICE INT'L AIRPORT" Sign (Double-Sided!)
  const signTex = makeNeonSignTexture("VICE INT'L AIRPORT", 'ESCOBAR TERMINAL · CONCOURSE A–B', '#21E6D1', maxAniso, false);
  const signBack = new THREE.Mesh(new THREE.BoxGeometry(28, 4.6, 0.65), roofMat);
  signBack.position.set(0, 15.0, 0);
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(27.2, 4.1),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.92, side: THREE.DoubleSide })
  );
  signFace.position.set(0, 15.0, 0.4);
  const signFaceBack = signFace.clone();
  signFaceBack.position.z = -0.4; signFaceBack.rotation.y = Math.PI;
  root.add(signBack, signFace, signFaceBack);

  // Two Extended Articulated Boarding Skybridge Jetways + Illuminated GATE A1 / GATE A2 Airside Signs!
  const gateLabels = ['GATE A1', 'GATE A2'];
  [-19, 19].forEach((jx, gi) => {
    const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 5.2, 18), metalMat);
    rotunda.position.set(jx, 5.4, 11.4);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.9, 16.5), metalMat);
    bridge.position.set(jx, 4.85, 19.6);
    const bridgeWin = new THREE.Mesh(new THREE.BoxGeometry(2.78, 1.15, 14.0), glassMat);
    bridgeWin.position.set(jx, 5.0, 19.6);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 4.2, 10), roofMat);
    leg.position.set(jx, 2.1, 25.8);
    const gSignTex = makeNeonSignTexture(gateLabels[gi], 'VICE AIRWAYS · BOARDING', gi === 0 ? '#FF2E88' : '#21E6D1', maxAniso, false);
    const gSign = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 1.35),
      new THREE.MeshStandardMaterial({ map: gSignTex, emissive: 0xffffff, emissiveMap: gSignTex, emissiveIntensity: 0.95 })
    );
    gSign.position.set(jx, 9.2, 10.25);
    root.add(rotunda, bridge, bridgeWin, leg, gSign);
  });

  // Interior Duty-Free Kiosk + VIP Sky Lounge Sofas (East Wing inside walk-through terminal)
  const dutyCounter = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.15, 1.4), new THREE.MeshStandardMaterial({ color: 0x1c2538, roughness: 0.35, metalness: 0.35 }));
  dutyCounter.position.set(22, 0.58, 4.6);
  const dutyTop = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 1.6), accentCyan);
  dutyTop.position.set(22, 1.2, 4.6);
  const dutySignTex = makeNeonSignTexture('DUTY FREE', 'VICE INTL BOUTIQUE', '#FFD36B', maxAniso, false);
  const dutySign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 1.1),
    new THREE.MeshStandardMaterial({ map: dutySignTex, emissive: 0xffffff, emissiveMap: dutySignTex, emissiveIntensity: 0.9, side: THREE.DoubleSide })
  );
  dutySign.position.set(22, 3.1, 4.6);
  root.add(dutyCounter, dutyTop, dutySign);

  // Rooftop HVAC Chiller Units + Twin Satellite Radar Domes
  for (const hx of [-24, 24]) {
    const hvac = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.6, 3.2), metalMat);
    hvac.position.set(hx, 13.0, -3.5);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.15, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.35 }));
    dome.position.set(hx, 12.2, 4.2);
    root.add(hvac, dome);
  }

  // Curbside Arrivals Crosswalk Stripes outside Street-Side Concourse (-Z)
  const cwMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ea, roughness: 0.78 });
  for (let c = -3; c <= 3; c++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 4.2), cwMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(c * 1.85, 0.05, -13.2);
    root.add(stripe);
  }

  return root;
}

/* Detailed Realistic Escobar Int'l Airport ATC Control Tower with Angled Observation Cab & Rotating Radar Dish */
export function createAirportControlTower() {
  const g = new THREE.Group();
  const concMat = new THREE.MeshStandardMaterial({ color: 0xe6e2da, roughness: 0.68 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x263042, roughness: 0.48, metalness: 0.42 });
  const cabGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x164a46, emissive: 0x14524a, emissiveIntensity: 0.48, metalness: 0.38, roughness: 0.06, clearcoat: 1.0 });
  const neonMat = new THREE.MeshStandardMaterial({ color: 0x21e6d1, emissive: 0x21e6d1, emissiveIntensity: 1.5 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2846 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(9.6, 5.0, 9.6), concMat);
  base.position.y = 2.5;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 4.0, 18.0, 8), concMat);
  shaft.position.y = 14.0;
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 3.6, 2.6, 8), darkMat);
  deck.position.y = 23.6;
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 5.2, 3.8, 8), cabGlassMat);
  cab.position.y = 26.8;
  const cabRoof = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 6.4, 1.1, 8), darkMat);
  cabRoof.position.y = 29.2;
  const cabTrim = new THREE.Mesh(new THREE.TorusGeometry(6.5, 0.16, 8, 16), neonMat);
  cabTrim.rotation.x = Math.PI / 2; cabTrim.position.y = 28.9;
  const rail = new THREE.Mesh(new THREE.TorusGeometry(5.9, 0.08, 8, 16), concMat);
  rail.rotation.x = Math.PI / 2; rail.position.y = 25.4;
  g.add(base, shaft, deck, cab, cabRoof, cabTrim, rail);

  // Rotating Rooftop Aviation Radar Assembly + Red Obstruction Beacons
  const radar = new THREE.Group();
  radar.position.y = 31.0;
  const rMast = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.30, 2.4, 10), darkMat);
  const rDish = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.15, 0.22), concMat);
  rDish.position.y = 1.25;
  const rRed = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), beaconMat);
  rRed.position.y = 2.25;
  radar.add(rMast, rDish, rRed);
  g.add(radar);

  return { root: g, radar };
}

export function createAirportSupportVehicle(kind = 'fuel') {
  const g = new THREE.Group();
  const yellowMat = new THREE.MeshPhysicalMaterial({ color: 0xf4be24, roughness: 0.28, metalness: 0.25, clearcoat: 0.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e7f0, metalness: 0.92, roughness: 0.16 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x181a22, roughness: 0.82 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x122438, roughness: 0.08, clearcoat: 1.0 });

  if (kind === 'fuel') {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.1), yellowMat); cab.position.set(0, 1.5, -3.1);
    const ws = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.15), glassMat); ws.position.set(0, 2.0, -4.15);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 5.8, 22), chromeMat);
    tank.rotation.x = Math.PI / 2; tank.position.set(0, 1.75, 1.1);
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 7.6), darkMat); chassis.position.set(0, 0.65, 0);
    g.add(cab, ws, tank, chassis);
    for (const [wx, wz] of [[-1.08, -2.9], [1.08, -2.9], [-1.08, 1.6], [1.08, 1.6], [-1.08, 3.0], [1.08, 3.0]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.34, 16), darkMat); t.rotation.z = Math.PI / 2; t.position.set(wx, 0.46, wz); g.add(t);
    }
  } else {
    // Baggage Tug + Luggage Cart with colorful suitcases
    const tug = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 2.4), yellowMat); tug.position.set(0, 0.78, -2.2);
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 2.8), darkMat); cart.position.set(0, 0.48, 1.2);
    const hitch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), darkMat); hitch.rotation.x = Math.PI / 2; hitch.position.set(0, 0.48, -0.6);
    g.add(tug, cart, hitch);
    const bagCols = [0xff2e88, 0x21e6d1, 0x3b82f6, 0xe87b28, 0xa855f7];
    for (let b = 0; b < 5; b++) {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.46, 0.44), new THREE.MeshStandardMaterial({ color: bagCols[b], roughness: 0.55 }));
      bag.position.set((b % 2 === 0 ? -0.34 : 0.34), 0.82 + Math.floor(b / 3) * 0.46, 0.4 + (b % 3) * 0.72);
      g.add(bag);
    }
    for (const [wx, wz] of [[-0.78, -2.9], [0.78, -2.9], [-0.78, -1.5], [0.78, -1.5], [-0.78, 0.4], [0.78, 0.4], [-0.78, 2.0], [0.78, 2.0]]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.20, 14), darkMat); t.rotation.z = Math.PI / 2; t.position.set(wx, 0.28, wz); g.add(t);
    }
  }
  return g;
}

export function createLuxuryYacht(accentHex = 0x21e6d1) {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshPhysicalMaterial({ color: 0xf7f5fa, roughness: 0.22, metalness: 0.16, clearcoat: 0.95 });
  const teakMat = new THREE.MeshStandardMaterial({ color: 0x9b6b43, roughness: 0.72 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0e2238, metalness: 0.35, roughness: 0.06, clearcoat: 1.0 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xffe49c, emissive: 0xffd274, emissiveIntensity: 1.35 });
  const accentMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.28, metalness: 0.25 });

  // Pointed-bow sculpted horizontal yacht hull profile
  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, -10.5);
  hullShape.quadraticCurveTo(2.7, -5.5, 2.6, 2.0);
  hullShape.lineTo(2.3, 9.2);
  hullShape.lineTo(-2.3, 9.2);
  hullShape.lineTo(-2.6, 2.0);
  hullShape.quadraticCurveTo(-2.7, -5.5, 0, -10.5);
  const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 1.85, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.18, bevelSegments: 4, curveSegments: 18 });
  hullGeo.rotateX(Math.PI / 2);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 1.65;
  g.add(hull);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.14, 14.2), teakMat);
  deck.position.set(0, 1.88, 1.2);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.15, 0.22, 12.6), accentMat);
  stripe.position.set(0, 1.48, 2.4);
  const lowerCab = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.65, 9.8), hullMat);
  lowerCab.position.set(0, 2.65, 1.6);
  const cabWin = new THREE.Mesh(new THREE.BoxGeometry(3.92, 0.65, 8.6), glassMat);
  cabWin.position.set(0, 2.72, 1.4);
  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 6.2), hullMat);
  upperDeck.position.set(0, 4.05, 2.1);
  const radarArch = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.16, 10, 24, Math.PI), hullMat);
  radarArch.position.set(0, 4.65, 3.6);
  const warmGlow = new THREE.Mesh(new THREE.BoxGeometry(3.95, 0.22, 7.2), glowMat);
  warmGlow.position.set(0, 2.25, 1.8);
  g.add(deck, stripe, lowerCab, cabWin, upperDeck, radarArch, warmGlow);
  return g;
}

export function createCarnivalPier(pinkNeon, cyanNeon, goldNeon, maxAniso = 4) {
  const root = new THREE.Group();
  const woodTex = makeWoodPlankTexture(maxAniso, 28, 8);
  const woodNorm = makeWoodPlankNormalMap(maxAniso, 28, 8);
  const deckMat = new THREE.MeshStandardMaterial({ map: woodTex, normalMap: woodNorm, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.78 });
  const pilingMat = new THREE.MeshStandardMaterial({ color: 0x4b392c, roughness: 0.92 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xf4eee8, roughness: 0.52 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xdce2ec, metalness: 0.78, roughness: 0.24 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd36b, metalness: 0.82, roughness: 0.22 });
  const warmBulbMat = new THREE.MeshBasicMaterial({ color: 0xffe49c });

  // 1. Wide Walkable & Drivable Wooden Boardwalk Pier (X = 0..124, Z = -18..+18, top Y = 0.16!)
  const pierLen = 124;
  const pierW = 36;
  const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(pierLen, 0.56, pierW), deckMat);
  mainDeck.position.set(pierLen * 0.5, -0.12, 0);
  mainDeck.receiveShadow = true;
  root.add(mainDeck);

  // Heavy Timber Ocean Pilings underneath
  const pilingGeo = new THREE.CylinderGeometry(0.36, 0.42, 6.2, 12);
  const pilingCoords = [];
  for (let px = 8; px <= pierLen - 4; px += 12) {
    for (const pz of [-16.5, -6, 6, 16.5]) pilingCoords.push([px, pz]);
  }
  const pilingInst = new THREE.InstancedMesh(pilingGeo, pilingMat, pilingCoords.length);
  const dObj = new THREE.Object3D();
  pilingCoords.forEach(([px, pz], i) => {
    dObj.position.set(px, -3.1, pz); dObj.rotation.set(0, 0, 0); dObj.scale.set(1, 1, 1); dObj.updateMatrix();
    pilingInst.setMatrixAt(i, dObj.matrix);
  });
  pilingInst.instanceMatrix.needsUpdate = true;
  root.add(pilingInst);

  // Perimeter White Boardwalk Railings + Neon Curb Trim
  for (const side of [-1, 1]) {
    const rz = side * (pierW * 0.5 - 0.35);
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(pierLen, 0.14, 0.18), railMat);
    topRail.position.set(pierLen * 0.5, 1.18, rz);
    const midRail = new THREE.Mesh(new THREE.BoxGeometry(pierLen, 0.10, 0.14), railMat);
    midRail.position.set(pierLen * 0.5, 0.72, rz);
    const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(pierLen, 0.10, 0.10), side < 0 ? pinkNeon : cyanNeon);
    neonStrip.position.set(pierLen * 0.5, 0.32, rz + side * 0.18);
    root.add(topRail, midRail, neonStrip);
  }
  const endRail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, pierW), railMat);
  endRail.position.set(pierLen - 0.35, 1.18, 0);
  root.add(endRail);

  // 2. Iconic Glowing Neon "VICE PIER · CARNIVAL" Grand Entrance Arch (X = 5)
  for (const sz of [-12, 12]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 9.6, 16), railMat);
    col.position.set(5, 4.8, sz);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.10, 10, 20), pinkNeon);
    ring.rotation.x = Math.PI / 2; ring.position.set(5, 8.2, sz);
    root.add(col, ring);
  }
  const archSpan = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.6, 25.5), new THREE.MeshStandardMaterial({ color: 0x1b1430, roughness: 0.45 }));
  archSpan.position.set(5, 9.6, 0);
  const archTex = makeNeonSignTexture('VICE PIER CARNIVAL', 'FERRIS WHEEL · COASTER · CAROUSEL · MIDWAY', '#FF2E88', maxAniso, false);
  const archFaceMat = new THREE.MeshStandardMaterial({ map: archTex, emissive: 0xffffff, emissiveMap: archTex, emissiveIntensity: 0.96, side: THREE.DoubleSide });
  const archFaceW = new THREE.Mesh(new THREE.PlaneGeometry(24.2, 3.1), archFaceMat);
  archFaceW.rotation.y = -Math.PI / 2; archFaceW.position.set(4.42, 9.6, 0);
  const archFaceE = archFaceW.clone();
  archFaceE.rotation.y = Math.PI / 2; archFaceE.position.set(5.58, 9.6, 0);
  root.add(archSpan, archFaceW, archFaceE);

  // 3. Overhead Criss-Crossing Warm Festival Edison Bulb Garlands along Midway
  const bulbGeo = new THREE.SphereGeometry(0.16, 8, 8);
  const bulbPositions = [];
  for (let gx = 16; gx <= 96; gx += 16) {
    for (const sz of [-14.5, 14.5]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.2, 10), pilingMat);
      pole.position.set(gx, 3.6, sz);
      root.add(pole);
    }
    for (let b = 0; b <= 10; b++) {
      const t = b / 10;
      const bz = -14.5 + t * 29;
      const sag = Math.sin(t * Math.PI) * 1.35;
      bulbPositions.push([gx, 6.95 - sag, bz]);
    }
  }
  const bulbInst = new THREE.InstancedMesh(bulbGeo, warmBulbMat, bulbPositions.length);
  bulbPositions.forEach(([bx, by, bz], i) => {
    dObj.position.set(bx, by, bz); dObj.rotation.set(0, 0, 0); dObj.scale.set(1, 1, 1); dObj.updateMatrix();
    bulbInst.setMatrixAt(i, dObj.matrix);
  });
  bulbInst.instanceMatrix.needsUpdate = true;
  root.add(bulbInst);

  // 4. Five Detailed Art-Deco Striped Carnival Midway Booths & Stalls (Finished Front & Back — ZERO dark black cubes!)
  const booths = [
    { x: 20, title: 'RING TOSS',    sub: 'WIN PRIZES',   cA: '#ff2e88', cB: '#fff6e8', wall: 0xf7ead8 },
    { x: 34, title: 'COTTON CANDY', sub: 'PINK & BLUE',  cA: '#21e6d1', cB: '#fff6e8', wall: 0xe6f6f4 },
    { x: 48, title: 'NEON ARCADE',  sub: 'MINI-GAMES',   cA: '#9b5de5', cB: '#ffd36b', wall: 0xf2eaf9 },
    { x: 62, title: 'VICE GELATO',  sub: 'BEACH CONES',  cA: '#ff7b2e', cB: '#fff6e8', wall: 0xfcf0e4 },
    { x: 76, title: 'HOT DOGS',     sub: 'BOARDWALK',    cA: '#e6294f', cB: '#fff6e8', wall: 0xfbeae6 }
  ];
  const shelfWoodMat = new THREE.MeshStandardMaterial({ color: 0x7a4c2d, roughness: 0.68 });
  const warmIntMat = new THREE.MeshBasicMaterial({ color: 0xffe4a8 });
  const plushCols = [0xff4d9a, 0x21e6d1, 0xffd36b, 0x9b5de5, 0xff7b2e];
  booths.forEach((b, bi) => {
    const bg = new THREE.Group();
    bg.position.set(b.x, 0.16, 12.6);
    const stripeMat = new THREE.MeshStandardMaterial({ map: makeCarnivalStripesTexture(b.cA, b.cB, maxAniso), roughness: 0.56 });
    const wallMat = new THREE.MeshStandardMaterial({ color: b.wall, roughness: 0.66 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.32, 3.8), stripeMat);
    counter.position.y = 0.66;
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.12, 4.05), shelfWoodMat);
    counterTop.position.y = 1.36;
    // Finished sunlit cream wood-paneled rear facade with neon trim & decorative striped wainscoting
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.8, 0.34), wallMat);
    backWall.position.set(0, 1.9, 1.72);
    const backTrim = new THREE.Mesh(new THREE.BoxGeometry(7.35, 0.22, 0.42), bi % 2 === 0 ? pinkNeon : cyanNeon);
    backTrim.position.set(0, 3.68, 1.72);
    // Interior warm shelf + colorful carnival plush prizes visible inside open stall
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.12, 0.45), shelfWoodMat);
    shelf.position.set(0, 2.15, 1.32);
    const intLamp = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 0.28), warmIntMat);
    intLamp.position.set(0, 3.55, 0.2);
    bg.add(counter, counterTop, backWall, backTrim, shelf, intLamp);
    for (let p = 0; p < 5; p++) {
      const plush = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 10, 8),
        new THREE.MeshStandardMaterial({ color: plushCols[(bi + p) % plushCols.length], roughness: 0.58 })
      );
      plush.position.set(-2.2 + p * 1.1, 2.42, 1.32);
      bg.add(plush);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.7, 2.2, 4), stripeMat);
    roof.rotation.y = Math.PI / 4; roof.position.y = 4.9;
    const signT = makeNeonSignTexture(b.title, b.sub, b.cA, maxAniso, false);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 1.25), new THREE.MeshStandardMaterial({ map: signT, emissive: 0xffffff, emissiveMap: signT, emissiveIntensity: 0.92 }));
    sign.rotation.y = Math.PI; sign.position.set(0, 3.35, -1.96);
    bg.add(roof, sign);
    for (const px of [-3.35, 3.35]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.8, 10), railMat);
      post.position.set(px, 1.9, -1.75); bg.add(post);
    }
    root.add(bg);
  });

  // 4b. Dedicated Oceanfront Vice Pier Shooting Gallery Pavilion (North Deck X = 74, Z = -15.2 -> World X = 91.5, Z = -445.2!)
  const sgBooth = new THREE.Group();
  sgBooth.position.set(74, 0.16, -15.2);
  const sgCounter = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.15, 1.2), new THREE.MeshStandardMaterial({ map: makeCarnivalStripesTexture('#ff2e88', '#ffd36b', maxAniso), roughness: 0.52 }));
  sgCounter.position.y = 0.58;
  const sgTop = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.12, 1.45), shelfWoodMat);
  sgTop.position.y = 1.20;
  for (const px of [-4.8, 4.8]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 4.4, 12), railMat);
    p.position.set(px, 2.2, 0);
    sgBooth.add(p);
  }
  const sgMarqueeBox = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.5, 0.65), new THREE.MeshStandardMaterial({ color: 0x1a1230, roughness: 0.4 }));
  sgMarqueeBox.position.set(0, 4.6, 0);
  const sgTex = makeNeonSignTexture('PIER SHOOTING GALLERY', 'MINI-GAME · PRESS [E] TO PLAY', '#FFD36B', maxAniso, false);
  const sgMat = new THREE.MeshStandardMaterial({ map: sgTex, emissive: 0xffffff, emissiveMap: sgTex, emissiveIntensity: 0.96, side: THREE.DoubleSide });
  const sgSignS = new THREE.Mesh(new THREE.PlaneGeometry(10.4, 1.25), sgMat);
  sgSignS.position.set(0, 4.6, 0.35);
  const sgSignN = sgSignS.clone(); sgSignN.rotation.y = Math.PI; sgSignN.position.z = -0.35;
  sgBooth.add(sgCounter, sgTop, sgMarqueeBox, sgSignS, sgSignN);
  root.add(sgBooth);

  // 5. Animated Classic Carnival Carousel / Merry-Go-Round (X = 36, Z = -9.5)
  const carousel = new THREE.Group();
  carousel.position.set(36, 0.16, -9.5);
  const cBase = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 7.2, 0.55, 32), new THREE.MeshStandardMaterial({ color: 0x5c1a38, roughness: 0.45 }));
  cBase.position.y = 0.28;
  const cCanopyMat = new THREE.MeshStandardMaterial({ map: makeCarnivalStripesTexture('#ff2e88', '#fff5e4', maxAniso), roughness: 0.48 });
  const cRoof = new THREE.Mesh(new THREE.ConeGeometry(7.4, 3.4, 24), cCanopyMat);
  cRoof.position.y = 6.2;
  const cRing = new THREE.Mesh(new THREE.TorusGeometry(7.1, 0.18, 10, 36), goldNeon);
  cRing.rotation.x = Math.PI / 2; cRing.position.y = 4.55;
  const cCore = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4.6, 20), goldMat);
  cCore.position.y = 2.6;
  carousel.add(cBase, cRoof, cRing, cCore);

  const carouselSpin = new THREE.Group();
  carousel.add(carouselSpin);
  const carouselHorses = [];
  const horseCols = [0xffffff, 0xff82b2, 0x7ef4ea, 0xffe08a];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 10), goldMat);
    pole.position.set(Math.cos(a) * 4.8, 2.5, Math.sin(a) * 4.8);
    carouselSpin.add(pole);

    const horse = new THREE.Group();
    horse.position.set(Math.cos(a) * 4.8, 1.75, Math.sin(a) * 4.8);
    horse.rotation.y = -a;
    const hMat = new THREE.MeshPhysicalMaterial({ color: horseCols[i % horseCols.length], roughness: 0.25, clearcoat: 0.8 });
    const hBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.92, 8, 14), hMat);
    hBody.rotation.x = Math.PI / 2;
    const hNeck = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.48, 6, 12), hMat);
    hNeck.position.set(0, 0.42, 0.56); hNeck.rotation.x = 0.42;
    const hHead = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.34, 6, 10), hMat);
    hHead.position.set(0, 0.68, 0.80); hHead.rotation.x = 1.15;
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.48), pinkNeon);
    saddle.position.y = 0.26;
    horse.add(hBody, hNeck, hHead, saddle);
    carouselSpin.add(horse);
    carouselHorses.push({ mesh: horse, phase: i * 0.9 });
  }
  root.add(carousel);

  // 6. Animated Wave Swinger / Flying Chairs Ride (X = 68, Z = -9.5)
  const swinger = new THREE.Group();
  swinger.position.set(68, 0.16, -9.5);
  const swPillar = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.65, 9.2, 20), new THREE.MeshStandardMaterial({ color: 0xfff0df, roughness: 0.42 }));
  swPillar.position.y = 4.6;
  const swBase = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.8, 0.55, 24), cyanNeon);
  swBase.position.y = 0.28;
  swinger.add(swPillar, swBase);

  const swingerTop = new THREE.Group();
  swingerTop.position.y = 9.4;
  const swCrown = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.2, 24), new THREE.MeshStandardMaterial({ map: makeCarnivalStripesTexture('#21e6d1', '#ffd36b', maxAniso), roughness: 0.45 }));
  swCrown.position.y = 1.1;
  const swTrim = new THREE.Mesh(new THREE.TorusGeometry(5.55, 0.16, 10, 32), pinkNeon);
  swTrim.rotation.x = Math.PI / 2;
  swingerTop.add(swCrown, swTrim);
  const swChains = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * 4.8, 0, Math.sin(a) * 4.8);
    pivot.rotation.y = -a;
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.8, 6), steelMat);
    chain.position.y = -2.4;
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.62), i % 2 === 0 ? pinkNeon : goldMat);
    chair.position.y = -4.9;
    pivot.add(chain, chair);
    swingerTop.add(pivot);
    swChains.push(pivot);
  }
  swinger.add(swingerTop);
  root.add(swinger);

  // 7. High-Poly Giant Illuminated Ferris Wheel on the Ocean End of Pier (X = 104, Z = 0)
  const ferrisWheel = createFerrisWheel(pinkNeon, cyanNeon, goldNeon);
  ferrisWheel.root.position.set(104, 0.16, 0);
  root.add(ferrisWheel.root);

  // 8. Animated Oceanfront Roller Coaster ("VICE CYCLONE") along North Side of Pier
  const coasterPts = [
    new THREE.Vector3(24, 3.6, -15.6),
    new THREE.Vector3(44, 15.8, -16.8),
    new THREE.Vector3(64, 7.2, -16.2),
    new THREE.Vector3(82, 18.4, -15.8),
    new THREE.Vector3(96, 8.8, -16.8),
    new THREE.Vector3(98, 4.2, -12.6),
    new THREE.Vector3(74, 9.6, -13.4),
    new THREE.Vector3(48, 5.2, -13.6)
  ];
  const coasterCurve = new THREE.CatmullRomCurve3(coasterPts, true, 'catmullrom', 0.45);
  const trackMat = new THREE.MeshPhysicalMaterial({ color: 0xff2e88, metalness: 0.65, roughness: 0.25, clearcoat: 0.8 });
  const trackTube = new THREE.Mesh(new THREE.TubeGeometry(coasterCurve, 120, 0.28, 10, true), trackMat);
  root.add(trackTube);
  // Coaster Wooden Trestle Support Columns
  const trestleMat = new THREE.MeshStandardMaterial({ color: 0xebe4da, roughness: 0.72 });
  for (let i = 0; i < 24; i++) {
    const pt = coasterCurve.getPointAt(i / 24);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, pt.y, 8), trestleMat);
    col.position.set(pt.x, pt.y * 0.5, pt.z);
    root.add(col);
  }
  // 3-Car Illuminated Neon Roller Coaster Train!
  const coasterCars = [];
  for (let c = 0; c < 3; c++) {
    const car = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.85, 2.3), c === 0 ? cyanNeon : goldMat);
    hull.position.y = 0.55;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.5, 1.4), new THREE.MeshStandardMaterial({ color: 0x1a1526, roughness: 0.6 }));
    seat.position.y = 0.88;
    car.add(hull, seat);
    root.add(car);
    coasterCars.push(car);
  }

  return {
    root,
    ferrisWheel,
    carouselSpin,
    carouselHorses,
    swingerTop,
    swChains,
    coasterCurve,
    coasterCars
  };
}

/* ==========================================================================
   GTA 5 LSIA-INSPIRED ESCOBAR INT'L AIRPORT UPGRADES
   (Runway 09/27 FAA Markings & Taxiways, Aviation Fuel Farm, Security Gatehouse,
    Open-Bay Maintenance Hangar #2 & Mobile Boarding Airstairs)
   ========================================================================== */
export function createAirportRunwayMarkings(maxAniso = 4) {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f5f8, roughness: 0.72, polygonOffset: true, polygonOffsetFactor: -1 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf5c828, roughness: 0.68, polygonOffset: true, polygonOffsetFactor: -1 });
  const blueLightMat = new THREE.MeshBasicMaterial({ color: 0x38b6ff });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.5, metalness: 0.55 });

  // 1. Threshold Piano-Key Bars at West End (Runway 09, X ≈ -260) and East End (Runway 27, X ≈ -26)
  for (const endX of [-260, -26]) {
    for (let k = -4; k <= 4; k++) {
      if (k === 0) continue;
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 1.25), whiteMat);
      bar.rotation.x = -Math.PI / 2;
      bar.position.set(endX, 0.055, 114 + k * 2.25);
      g.add(bar);
    }
    // Bold Painted FAA Runway Number Decals ("09" / "27")
    const numC = document.createElement('canvas');
    numC.width = 256; numC.height = 256;
    const nctx = numC.getContext('2d');
    nctx.clearRect(0, 0, 256, 256);
    nctx.fillStyle = 'rgba(246,248,252,0.92)';
    nctx.font = '900 148px sans-serif';
    nctx.textAlign = 'center';
    nctx.textBaseline = 'middle';
    nctx.fillText(endX < -100 ? '09' : '27', 128, 134);
    const numTex = new THREE.CanvasTexture(numC);
    numTex.colorSpace = THREE.SRGBColorSpace;
    numTex.anisotropy = Math.min(maxAniso, 8);
    const numPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10.5, 10.5),
      new THREE.MeshBasicMaterial({ map: numTex, transparent: true, depthWrite: false })
    );
    numPlane.rotation.x = -Math.PI / 2;
    numPlane.rotation.z = endX < -100 ? -Math.PI / 2 : Math.PI / 2;
    numPlane.position.set(endX < -100 ? -242 : -44, 0.06, 114);
    g.add(numPlane);

    // Aiming-Point Touchdown Blocks
    for (const sz of [-5.5, 5.5]) {
      const aim = new THREE.Mesh(new THREE.PlaneGeometry(15.0, 2.3), whiteMat);
      aim.rotation.x = -Math.PI / 2;
      aim.position.set(endX < -100 ? -218 : -68, 0.055, 114 + sz);
      g.add(aim);
    }
  }

  // 2. Crisp Runway Centerline Dashes (X = -204 to -82) & Side Edge Lines
  for (let x = -204; x <= -82; x += 15) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.65), whiteMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.055, 114);
    g.add(dash);
  }
  for (const ez of [102.4, 125.6]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(252, 0.45), whiteMat);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(-143, 0.055, ez);
    g.add(edge);
  }

  // 3. Yellow Taxiway Centerlines + Hold-Short Double Bars connecting Apron & Hangars to Runway 09/27
  const mainTaxi = new THREE.Mesh(new THREE.PlaneGeometry(236, 0.52), yellowMat);
  mainTaxi.rotation.x = -Math.PI / 2;
  mainTaxi.position.set(-142, 0.054, 92.5);
  g.add(mainTaxi);

  const blueLights = [];
  for (const tx of [-232, -196, -152, -46]) {
    const conn = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 22.0), yellowMat);
    conn.rotation.x = -Math.PI / 2;
    conn.position.set(tx, 0.054, 91.0);
    g.add(conn);
    // Double Hold-Short Bars before Runway 09/27 edge
    for (const hz of [98.4, 99.3]) {
      const hs = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 0.36), yellowMat);
      hs.rotation.x = -Math.PI / 2;
      hs.position.set(tx, 0.056, hz);
      g.add(hs);
    }
    // Glowing Blue Taxiway Edge Lights along connector shoulders
    for (const bx of [tx - 5.2, tx + 5.2]) {
      for (const bz of [84, 91, 97.5]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.45, 6), postMat);
        post.position.set(bx, 0.22, bz);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), blueLightMat);
        bulb.position.set(bx, 0.50, bz);
        g.add(post, bulb);
        blueLights.push(bulb);
      }
    }
  }

  // 4. Approach Light Gantries (ALS) off West Runway Threshold (X = -276, -284)
  for (const gx of [-276, -284]) {
    const barFrame = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 16.0), postMat);
    barFrame.position.set(gx, 1.5, 114);
    g.add(barFrame);
    for (let z = -7; z <= 7; z += 3.5) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.5, 6), postMat);
      leg.position.set(gx, 0.75, 114 + z);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: gx < -280 ? 0xff465a : 0xfff8dc }));
      lamp.position.set(gx, 1.8, 114 + z);
      g.add(leg, lamp);
    }
  }

  return { root: g, blueLights };
}

export function createAirportFuelFarm(maxAniso = 4) {
  const g = new THREE.Group();
  const tankMat = new THREE.MeshStandardMaterial({ color: 0xedf1f7, roughness: 0.36, metalness: 0.42 });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x21e6d1, roughness: 0.4, metalness: 0.28 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.38, metalness: 0.55 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x384152, roughness: 0.48, metalness: 0.65 });
  const yellMat = new THREE.MeshStandardMaterial({ color: 0xffc428, roughness: 0.45 });

  // Concrete containment bund pad
  const pad = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.32, 11.5), new THREE.MeshStandardMaterial({ color: 0x5c6270, roughness: 0.88 }));
  pad.position.set(0, 0.16, 0);
  g.add(pad);

  // Twin Cylindrical Aviation Fuel Storage Tanks ("VICE JET-A1")
  const signTex = makeNeonSignTexture('VICE JET-A1', 'AVIATION FUEL FARM', '#FFD36B', maxAniso, false);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.75 });
  for (const tx of [-4.6, 4.6]) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 6.2, 24), tankMat);
    tank.position.set(tx, 3.35, 0);
    tank.castShadow = true;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.4, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.35), tankMat);
    dome.position.set(tx, 5.2, 0);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.45, 0.55, 24), bandMat);
    band.position.set(tx, 5.4, 0);
    const sFace = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.35), signMat);
    sFace.position.set(tx, 3.5, 3.46);
    g.add(tank, dome, band, sFace);
  }

  // Overhead Catwalk Bridge + Red Fuel Manifold Pipes + Yellow Safety Bollards
  const walk = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.2, 1.15), steelMat);
  walk.position.set(0, 6.55, 0);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 11.0, 10), pipeMat);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(0, 1.2, 4.2);
  g.add(walk, pipe);
  for (let bx = -8.5; bx <= 8.5; bx += 3.4) {
    const boll = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.0, 8), yellMat);
    boll.position.set(bx, 0.65, 5.3);
    g.add(boll);
  }
  return g;
}

export function createAirportGatehouse(maxAniso = 4) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe6eaf2, roughness: 0.55 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e2638, roughness: 0.42, metalness: 0.45 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x164a4c, roughness: 0.1, metalness: 0.35, clearcoat: 0.9 });
  const fencePostMat = new THREE.MeshStandardMaterial({ color: 0x6c7585, roughness: 0.5, metalness: 0.7 });
  const fenceMeshMat = new THREE.MeshStandardMaterial({ color: 0x9aa4b4, roughness: 0.6, metalness: 0.6, transparent: true, opacity: 0.42, side: THREE.DoubleSide });

  // Security Booth + Canopy + Raised Striped Barrier Arm (Open for Vehicle Access!)
  const booth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 2.8), wallMat);
  booth.position.set(0, 1.4, 0);
  const win = new THREE.Mesh(new THREE.BoxGeometry(3.26, 1.1, 2.86), glassMat);
  win.position.set(0, 1.8, 0);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.45, 5.0), roofMat);
  canopy.position.set(5.2, 4.3, 0);
  const farPost = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.3, 0.45), roofMat);
  farPost.position.set(11.6, 2.15, 0);
  const signTex = makeNeonSignTexture("ESCOBAR INT'L", 'AUTHORIZED APRON ACCESS', '#FF2E88', maxAniso, false);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 1.25),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.95, side: THREE.DoubleSide })
  );
  sign.position.set(5.2, 5.2, -2.55);
  sign.rotation.y = Math.PI;
  const signFront = sign.clone();
  signFront.position.z = 2.55;
  signFront.rotation.y = 0;

  // Raised Red/White Barrier Arm (70 deg open so cars pass right under!)
  const armBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.05, 0.42), new THREE.MeshStandardMaterial({ color: 0xffc428, roughness: 0.4 }));
  armBase.position.set(2.0, 0.52, 0);
  const armPivot = new THREE.Group();
  armPivot.position.set(2.0, 0.96, 0);
  armPivot.rotation.z = 1.18;
  for (let s = 0; s < 5; s++) {
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: s % 2 === 0 ? 0xff2e4c : 0xffffff, roughness: 0.35 })
    );
    seg.position.set(0.6 + s * 1.15, 0, 0);
    armPivot.add(seg);
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffaa28 }));
  beacon.position.set(0, 3.05, 0);

  // Flanking Perimeter Security Fence Wings (West & East)
  for (const seg of [{ x: -34, len: 64 }, { x: 26, len: 28 }]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(seg.len, 3.2), fenceMeshMat);
    panel.position.set(seg.x, 1.6, 0);
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(seg.len, 0.1, 0.1), fencePostMat);
    topRail.position.set(seg.x, 3.2, 0);
    g.add(panel, topRail);
    for (let px = seg.x - seg.len * 0.5; px <= seg.x + seg.len * 0.5; px += 8) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 6), fencePostMat);
      p.position.set(px, 1.7, 0);
      g.add(p);
    }
  }

  g.add(booth, win, canopy, farPost, sign, signFront, armBase, armPivot, beacon);
  return g;
}

export function createAirportHangarTwo(maxAniso = 4) {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd9e0ec, roughness: 0.5, metalness: 0.3 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e2c44, roughness: 0.42, metalness: 0.45, side: THREE.DoubleSide });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x3b404c, roughness: 0.84 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffc428, roughness: 0.6 });

  const roof = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 11.5, 26, 22, 1, false, 0, Math.PI), roofMat);
  roof.rotation.z = Math.PI / 2;
  roof.position.set(0, 9.5, 0);
  const back = new THREE.Mesh(new THREE.BoxGeometry(26, 9.5, 1.1), wallMat);
  back.position.set(0, 4.75, -10.8);
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 9.5, 22), wallMat);
  sideL.position.set(-12.5, 4.75, 0);
  const sideR = sideL.clone();
  sideR.position.x = 12.5;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24.4, 21.4), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.05, 0);

  // Yellow Maintenance Safety Bay Stripes + Neon Light Strips + Illuminated Banner
  for (const sx of [-7.2, 7.2]) {
    const st = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 18.5), stripeMat);
    st.rotation.x = -Math.PI / 2;
    st.position.set(sx, 0.07, 0);
    g.add(st);
  }
  const lampBar = new THREE.Mesh(new THREE.BoxGeometry(18, 0.24, 1.0), new THREE.MeshBasicMaterial({ color: 0xfff5dc }));
  lampBar.position.set(0, 11.2, 0);
  const hSignTex = makeNeonSignTexture('HANGAR #2', 'VICE AIRWAYS MAINTENANCE', '#21E6D1', maxAniso, false);
  const hSign = new THREE.Mesh(
    new THREE.PlaneGeometry(14.5, 2.5),
    new THREE.MeshStandardMaterial({ map: hSignTex, emissive: 0xffffff, emissiveMap: hSignTex, emissiveIntensity: 0.92 })
  );
  hSign.position.set(0, 12.2, 11.4);

  // Maintenance Scaffolding & Red Tool Cabinet along Back Wall
  const scaffMat = new THREE.MeshStandardMaterial({ color: 0x2684d4, roughness: 0.45, metalness: 0.55 });
  const scaff = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 1.8), scaffMat);
  scaff.position.set(-6.5, 1.9, -8.8);
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.6, 1.0), new THREE.MeshStandardMaterial({ color: 0xd92c3a, roughness: 0.35, metalness: 0.45 }));
  cabinet.position.set(6.5, 0.8, -9.2);

  g.add(roof, back, sideL, sideR, floor, lampBar, hSign, scaff, cabinet);
  return g;
}

export function createBoardingAirstairs() {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.45, metalness: 0.25 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x21e6d1, roughness: 0.4 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.85 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.48, 4.4), bodyMat);
  base.position.set(0, 0.45, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 4.2), accentMat);
  stripe.position.set(0, 0.48, 0);
  g.add(base, stripe);
  for (let s = 0; s < 10; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 0.36), bodyMat);
    step.position.set(0, 0.72 + s * 0.28, 1.8 - s * 0.36);
    g.add(step);
  }
  const topPlat = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.16, 1.25), bodyMat);
  topPlat.position.set(0, 3.55, -1.9);
  for (const sx of [-0.78, 0.78]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 4.3), bodyMat);
    rail.position.set(sx, 2.4, 0);
    rail.rotation.x = 0.64;
    g.add(rail);
  }
  for (const wx of [-0.82, 0.82]) {
    for (const wz of [-1.4, 1.4]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 10), wheelMat);
      wh.rotation.z = Math.PI / 2;
      wh.position.set(wx, 0.26, wz);
      g.add(wh);
    }
  }
  g.add(topPlat);
  return g;
}

/* ==========================================================================
   GTA 5 MOUNT CHILIAD-INSPIRED ROADABLE MOUNTAIN RANGE ("MOUNT VICE · 66M")
   - High-Resolution Vertex-Colored Displaced Heightfield Terrain Mesh
   - Smooth Paved 3D Switchback Mountain Highway Ribbon + Double Yellow Lines
   - Metallic W-Beam Hairpin Guardrails + Yellow/Black Chevron Signs
   - Instanced Alpine Pine Forest + Granite Mountain Boulders
   - Mount Vice Summit Overlook Deck, Skyline Binoculars, Red/White Broadcast
     Radio Tower & Summit Stunt / Parachute Launch Ramp!
   ========================================================================== */
export function createMountViceRange(getTerrainHeight, closestMountainRoad, roadPoints, maxAniso = 4) {
  const root = new THREE.Group();

  // 1. Optimized High-Craft Displaced Mount Vice Multi-Biome Terrain Mesh (X = -515..55, Z = -1115..-1495)
  // Road corridor recessed cleanly -0.24m below asphalt so terrain NEVER clips or pokes through the loop highway!
  const pbr = getWorldPBRTextures(maxAniso);
  const minX = -515, maxX = 55;
  const minZ = -1495, maxZ = -1115;
  const segX = 136, segZ = 102;
  const w = maxX - minX, d = maxZ - minZ;

  const tGeo = new THREE.PlaneGeometry(w, d, segX, segZ);
  tGeo.rotateX(-Math.PI / 2);
  const posAttr = tGeo.attributes.position;
  const mvHeights = new Float32Array(posAttr.count);
  const colors = new Float32Array(posAttr.count * 3);

  const cFoot   = new THREE.Color(0x366e32);
  const cChap   = new THREE.Color(0x5a7638);
  const cForest = new THREE.Color(0x2c572b);
  const cCliff  = new THREE.Color(0x886850);
  const cSlate  = new THREE.Color(0x61554c);
  const cPeak   = new THREE.Color(0x6d7a47);
  const cGravel = new THREE.Color(0x6c6256);
  const cTmp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const lx = posAttr.getX(i);
    const lz = posAttr.getZ(i);
    const wx = (minX + maxX) * 0.5 + lx;
    const wz = (minZ + maxZ) * 0.5 + lz;
    let h = getTerrainHeight(wx, wz);

    const roadHit = closestMountainRoad(wx, wz);
    if (roadHit.dist < 8.4) {
      const recess = roadHit.dist < 7.0 ? 0.24 : 0.24 * (1 - (roadHit.dist - 7.0) / 1.4);
      h = Math.max(-0.2, h - recess);
    }
    posAttr.setY(i, h);
    mvHeights[i] = h;

    const hDx = getTerrainHeight(wx + 2.2, wz) - getTerrainHeight(wx - 2.2, wz);
    const hDz = getTerrainHeight(wx, wz + 2.2) - getTerrainHeight(wx, wz - 2.2);
    const slope = Math.min(1, Math.hypot(hDx, hDz) / 3.4);
    const elev = Math.max(0, Math.min(1, h / 118));

    if (elev < 0.22) cTmp.copy(cFoot).lerp(cChap, elev / 0.22);
    else if (elev < 0.56) cTmp.copy(cChap).lerp(cForest, (elev - 0.22) / 0.34);
    else if (elev < 0.84) cTmp.copy(cForest).lerp(cPeak, (elev - 0.56) / 0.28);
    else cTmp.copy(cPeak).lerp(new THREE.Color(0x9ca4aa), (elev - 0.84) / 0.16 * 0.52);

    if (slope > 0.25) {
      const cliffMix = Math.min(0.90, (slope - 0.25) * 1.75);
      const strata = 0.5 + 0.5 * Math.sin(h * 0.44 + wx * 0.05 + wz * 0.03);
      cTmp.lerp(strata > 0.5 ? cCliff : cSlate, cliffMix);
    }
    if (roadHit.dist < 11.2) {
      const shMix = Math.max(0, 1 - Math.max(0, roadHit.dist - 7.0) / 4.2);
      cTmp.lerp(cGravel, shMix * 0.62);
    }
    const grain = (Math.sin(wx * 0.13 + wz * 0.09) * Math.cos(wz * 0.19 - wx * 0.07)) * 0.052;
    colors[i * 3]     = Math.max(0, Math.min(1, cTmp.r + grain));
    colors[i * 3 + 1] = Math.max(0, Math.min(1, cTmp.g + grain));
    colors[i * 3 + 2] = Math.max(0, Math.min(1, cTmp.b + grain));
  }
  tGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  tGeo.computeVertexNormals();
  const mvStride = segX + 1;
  const sampleMeshHeight = (wx, wz) => {
    const fx = ((wx - minX) / w) * segX;
    const fz = ((wz - minZ) / d) * segZ;
    if (fx < 0 || fx >= segX || fz < 0 || fz >= segZ) return -999;
    const ix = Math.floor(fx), iz = Math.floor(fz);
    const u = fx - ix, v = fz - iz;
    const a = iz * mvStride + ix, b = (iz + 1) * mvStride + ix;
    const ya = mvHeights[a], yb = mvHeights[b], yc = mvHeights[b + 1], yd = mvHeights[a + 1];
    return (u + v <= 1) ? (ya + u * (yd - ya) + v * (yb - ya)) : (yc + (1 - u) * (yb - yc) + (1 - v) * (yd - yc));
  };

  const rockTex = pbr.granite.map.clone();
  rockTex.repeat.set(42, 30);
  rockTex.needsUpdate = true;
  const rockNorm = pbr.granite.normalMap.clone();
  rockNorm.repeat.set(42, 30);
  rockNorm.needsUpdate = true;

  const terrainMesh = new THREE.Mesh(
    tGeo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: rockTex,
      normalMap: rockNorm,
      normalScale: new THREE.Vector2(1.2, 1.2),
      roughness: 0.90,
      metalness: 0.03
    })
  );
  terrainMesh.position.set((minX + maxX) * 0.5, 0.0, (minZ + maxZ) * 0.5);
  terrainMesh.receiveShadow = true;
  root.add(terrainMesh);

  // 2. SOLID ENGINEERED 3D FULL-LOOP SWITCHBACK MOUNTAIN HIGHWAY (ZERO DEAD ENDS!)
  const roadC = document.createElement('canvas');
  roadC.width = 512; roadC.height = 512;
  const rdCtx = roadC.getContext('2d');
  rdCtx.fillStyle = '#252832';
  rdCtx.fillRect(0, 0, 512, 512);
  const laneG = rdCtx.createLinearGradient(0, 0, 512, 0);
  laneG.addColorStop(0.0, 'rgba(18,20,26,0.3)');
  laneG.addColorStop(0.24, 'rgba(65,70,82,0.22)');
  laneG.addColorStop(0.5, 'rgba(18,20,26,0.25)');
  laneG.addColorStop(0.76, 'rgba(65,70,82,0.22)');
  laneG.addColorStop(1.0, 'rgba(18,20,26,0.3)');
  rdCtx.fillStyle = laneG;
  rdCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 10000; i++) {
    const g = 28 + Math.floor(Math.random() * 34);
    rdCtx.fillStyle = `rgb(${g},${g + 2},${g + 6})`;
    rdCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  rdCtx.fillStyle = '#f2f4fa';
  rdCtx.fillRect(22, 0, 12, 512);
  rdCtx.fillRect(478, 0, 12, 512);
  rdCtx.fillStyle = '#f8c828';
  rdCtx.fillRect(243, 0, 9, 512);
  rdCtx.fillRect(260, 0, 9, 512);
  const roadTex = new THREE.CanvasTexture(roadC);
  roadTex.wrapS = THREE.ClampToEdgeWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.colorSpace = THREE.SRGBColorSpace;
  roadTex.anisotropy = Math.min(maxAniso, 16);
  const roadNorm = heightCanvasToNormalTexture(roadC, 1.5, Math.min(maxAniso, 16), 1, 1);
  roadNorm.wrapS = THREE.ClampToEdgeWrapping;

  const rPos = [], rUv = [], rIdx = [];
  const skirtPos = [], skirtUv = [], skirtIdx = [];
  const railPos = [], railIdx = [];
  const halfW = 6.8;
  const skirtDrop = 3.8;
  let distAccum = 0;
  const guardrailPosts = [];
  const chevronSigns = [];

  for (let i = 0; i < roadPoints.length; i++) {
    const cur = roadPoints[i];
    const prev = roadPoints[Math.max(0, i - 1)];
    const next = roadPoints[Math.min(roadPoints.length - 1, i + 1)];
    if (i > 0) distAccum += Math.hypot(cur.x - prev.x, cur.z - prev.z);

    const tx = next.x - prev.x;
    const tz = next.z - prev.z;
    const tLen = Math.hypot(tx, tz) || 1;
    const nx = -tz / tLen;
    const nz = tx / tLen;

    const lx = cur.x - nx * halfW, lz = cur.z - nz * halfW;
    const rx = cur.x + nx * halfW, rz = cur.z + nz * halfW;
    const deckY = cur.y + 0.08;

    rPos.push(lx, deckY, lz, rx, deckY, rz);
    rUv.push(0, distAccum * 0.07, 1, distAccum * 0.07);

    const lxOut = cur.x - nx * (halfW + 1.8), lzOut = cur.z - nz * (halfW + 1.8);
    const rxOut = cur.x + nx * (halfW + 1.8), rzOut = cur.z + nz * (halfW + 1.8);
    skirtPos.push(
      lx, deckY - 0.02, lz,       lxOut, deckY - skirtDrop, lzOut,
      rx, deckY - 0.02, rz,       rxOut, deckY - skirtDrop, rzOut
    );
    skirtUv.push(
      distAccum * 0.16, 0, distAccum * 0.16, 1,
      distAccum * 0.16, 0, distAccum * 0.16, 1
    );

    if (i < roadPoints.length - 1) {
      const base = i * 2;
      rIdx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      const sb = i * 4;
      skirtIdx.push(sb, sb + 4, sb + 1, sb + 1, sb + 4, sb + 5);
      skirtIdx.push(sb + 2, sb + 3, sb + 6, sb + 3, sb + 7, sb + 6);
    }

    const hl = getTerrainHeight(cur.x - nx * (halfW + 7.5), cur.z - nz * (halfW + 7.5));
    const hr = getTerrainHeight(cur.x + nx * (halfW + 7.5), cur.z + nz * (halfW + 7.5));
    const side = hl <= hr ? -1 : 1;
    const gx = cur.x + nx * side * (halfW + 0.22);
    const gz = cur.z + nz * side * (halfW + 0.22);
    railPos.push(gx, deckY + 0.56, gz, gx, deckY + 0.88, gz);
    if (i > 4 && i < roadPoints.length - 5 && deckY > 4.5) {
      if (guardrailPosts.length > 0 && guardrailPosts[guardrailPosts.length - 1].side === side && guardrailPosts[guardrailPosts.length - 1].i === i - 1) {
        const rb = (i - 1) * 2;
        railIdx.push(rb, rb + 1, rb + 2, rb + 1, rb + 3, rb + 2);
      }
      guardrailPosts.push({ i, side, x: gx, y: deckY, z: gz, yaw: Math.atan2(tx, tz) });
      if (i % 12 === 0) {
        chevronSigns.push({ x: gx + nx * side * 0.45, y: deckY, z: gz + nz * side * 0.45, yaw: Math.atan2(-tx, -tz) });
      }
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rUv, 2));
  roadGeo.setIndex(rIdx);
  roadGeo.computeVertexNormals();
  const roadMesh = new THREE.Mesh(
    roadGeo,
    new THREE.MeshStandardMaterial({
      map: roadTex,
      normalMap: roadNorm,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughness: 0.74,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })
  );
  roadMesh.receiveShadow = true;
  root.add(roadMesh);

  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
  skirtGeo.setAttribute('uv', new THREE.Float32BufferAttribute(skirtUv, 2));
  skirtGeo.setIndex(skirtIdx);
  skirtGeo.computeVertexNormals();
  const skirtMesh = new THREE.Mesh(
    skirtGeo,
    new THREE.MeshStandardMaterial({
      map: pbr.concrete.map,
      normalMap: pbr.concrete.normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      color: 0x8c8780,
      roughness: 0.88,
      metalness: 0.05,
      side: THREE.DoubleSide
    })
  );
  skirtMesh.receiveShadow = true;
  root.add(skirtMesh);

  const grMat = new THREE.MeshStandardMaterial({ color: 0xc2cad6, roughness: 0.36, metalness: 0.78, side: THREE.DoubleSide });
  if (railIdx.length > 0) {
    const railGeo = new THREE.BufferGeometry();
    railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3));
    railGeo.setIndex(railIdx);
    railGeo.computeVertexNormals();
    root.add(new THREE.Mesh(railGeo, grMat));
  }
  const grPostGeo = new THREE.BoxGeometry(0.14, 0.92, 0.14);
  const grPostInst = new THREE.InstancedMesh(grPostGeo, grMat, Math.max(1, guardrailPosts.length));
  const dObj = new THREE.Object3D();
  guardrailPosts.forEach((gp, idx) => {
    dObj.position.set(gp.x, gp.y + 0.45, gp.z);
    dObj.rotation.set(0, gp.yaw, 0);
    dObj.scale.set(1, 1, 1);
    dObj.updateMatrix();
    grPostInst.setMatrixAt(idx, dObj.matrix);
  });
  grPostInst.instanceMatrix.needsUpdate = true;
  grPostInst.computeBoundingSphere();
  root.add(grPostInst);

  // TWO Grand Timber Trailhead Arches (East Entry at Ocean Dr + West Loop Return at Vice Hollow / Little Haiti!)
  const archWoodMat = new THREE.MeshStandardMaterial({
    map: pbr.bark.map,
    normalMap: pbr.bark.normalMap,
    normalScale: new THREE.Vector2(1.2, 1.2),
    color: 0x8c6444,
    roughness: 0.82
  });
  const circleColliders = [];
  const buildTrailArch = (pt, title, subtitle) => {
    const grp = new THREE.Group();
    grp.position.set(pt.x, pt.y, pt.z);
    for (const sx of [-7.8, 7.8]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 7.8, 12), archWoodMat);
      p.position.set(sx, 3.9, 0);
      grp.add(p);
      circleColliders.push({ x: pt.x + sx, z: pt.z, r: 0.56 });
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(16.8, 1.85, 0.72), archWoodMat);
    beam.position.set(0, 7.5, 0);
    const signTex = makeNeonSignTexture(title, subtitle, '#FFD36B', maxAniso, false);
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 0.86, side: THREE.DoubleSide });
    const signS = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 1.45), signMat);
    signS.position.set(0, 7.5, 0.39);
    const signN = signS.clone(); signN.rotation.y = Math.PI; signN.position.z = -0.39;
    grp.add(beam, signS, signN);
    root.add(grp);
  };
  buildTrailArch(roadPoints[1], 'MOUNT VICE SCENIC LOOP', 'EAST PASS · 118M CLOUD SUMMIT TO VICE HOLLOW');
  buildTrailArch(roadPoints[roadPoints.length - 2], 'MOUNT VICE WEST LOOP', 'THROUGH VICE HOLLOW TO 118M PEAK · NO DEAD END');

  // Yellow/Black Hairpin Chevron Warning Signs
  const chevC = document.createElement('canvas');
  chevC.width = 128; chevC.height = 128;
  const cctx = chevC.getContext('2d');
  cctx.fillStyle = '#ffd228';
  cctx.fillRect(0, 0, 128, 128);
  cctx.fillStyle = '#141418';
  cctx.beginPath();
  cctx.moveTo(42, 18); cctx.lineTo(82, 18); cctx.lineTo(106, 64); cctx.lineTo(82, 110); cctx.lineTo(42, 110); cctx.lineTo(66, 64);
  cctx.closePath(); cctx.fill();
  const chevTex = new THREE.CanvasTexture(chevC);
  chevTex.colorSpace = THREE.SRGBColorSpace;
  const chevMat = new THREE.MeshStandardMaterial({ map: chevTex, roughness: 0.42, side: THREE.DoubleSide });
  chevronSigns.forEach((cs) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), grMat);
    post.position.set(cs.x, cs.y + 1.1, cs.z);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.98), chevMat);
    board.position.set(cs.x, cs.y + 2.08, cs.z);
    board.rotation.y = cs.yaw;
    root.add(post, board);
  });

  // 3. Instanced REALISTIC TEXTURED 4-Tier Alpine Pines & Cracked Granite Boulders!
  const treeCoords = [];
  const rockCoords = [];
  let seed = 4219;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  for (let i = 0; i < 640; i++) {
    const tx = minX + 18 + rand() * (w - 36);
    const tz = minZ + 22 + rand() * (d - 34);
    if (tx > -464 && tx < -296 && tz > -1262 && tz < -1126) continue;
    const ty = getTerrainHeight(tx, tz);
    if (ty < 1.0 || ty > 106.0) continue;
    if (closestMountainRoad(tx, tz).dist < 11.4) continue;
    if (Math.hypot(tx + 228, tz + 1432) < 25) continue;
    treeCoords.push({ x: tx, y: ty, z: tz, s: 0.78 + rand() * 0.82, ry: rand() * Math.PI * 2, leanX: (rand() - 0.5) * 0.08, leanZ: (rand() - 0.5) * 0.08, shade: rand() });
  }
  for (let i = 0; i < 190; i++) {
    const rx = minX + 18 + rand() * (w - 36);
    const rz = minZ + 20 + rand() * (d - 30);
    if (rx > -464 && rx < -296 && rz > -1262 && rz < -1126) continue;
    const ry = getTerrainHeight(rx, rz);
    if (ry < 1.6) continue;
    if (closestMountainRoad(rx, rz).dist < 12.0) continue;
    if (Math.hypot(rx + 228, rz + 1432) < 24) continue;
    rockCoords.push({ x: rx, y: ry, z: rz, sx: 1.2 + rand() * 2.8, sy: 0.75 + rand() * 1.6, sz: 1.2 + rand() * 2.8, r: rand() * 6, shade: rand() });
  }

  const trunkMat = new THREE.MeshStandardMaterial({
    map: pbr.bark.map,
    normalMap: pbr.bark.normalMap,
    normalScale: new THREE.Vector2(1.45, 1.45),
    color: 0xb6957a,
    roughness: 0.94
  });
  const pineBaseMat = new THREE.MeshStandardMaterial({
    map: pbr.pineNeedle.map,
    normalMap: pbr.pineNeedle.normalMap,
    normalScale: new THREE.Vector2(1.35, 1.35),
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.02
  });
  const trunkInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.48, 4.6, 8), trunkMat, Math.max(1, treeCoords.length));
  const tier1Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(2.95, 4.4, 9), pineBaseMat, Math.max(1, treeCoords.length));
  const tier2Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(2.28, 3.9, 9), pineBaseMat, Math.max(1, treeCoords.length));
  const tier3Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(1.58, 3.3, 9), pineBaseMat, Math.max(1, treeCoords.length));
  const tier4Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(0.90, 2.5, 8), pineBaseMat, Math.max(1, treeCoords.length));
  const pineColors = [new THREE.Color(0x3a6e42), new THREE.Color(0x467e4a), new THREE.Color(0x54854a), new THREE.Color(0x387456), new THREE.Color(0x5c8b4e)];
  const pColTmp = new THREE.Color();

  treeCoords.forEach((t, idx) => {
    dObj.rotation.set(t.leanX, t.ry, t.leanZ);
    dObj.scale.set(t.s, t.s, t.s);
    dObj.position.set(t.x, t.y + 0.95 * t.s, t.z); dObj.updateMatrix(); trunkInst.setMatrixAt(idx, dObj.matrix);
    dObj.position.set(t.x, t.y + 3.55 * t.s, t.z); dObj.updateMatrix(); tier1Inst.setMatrixAt(idx, dObj.matrix);
    dObj.position.set(t.x, t.y + 5.75 * t.s, t.z); dObj.updateMatrix(); tier2Inst.setMatrixAt(idx, dObj.matrix);
    dObj.position.set(t.x, t.y + 7.70 * t.s, t.z); dObj.updateMatrix(); tier3Inst.setMatrixAt(idx, dObj.matrix);
    dObj.position.set(t.x, t.y + 9.35 * t.s, t.z); dObj.updateMatrix(); tier4Inst.setMatrixAt(idx, dObj.matrix);
    const baseC = pineColors[idx % pineColors.length];
    pColTmp.copy(baseC).multiplyScalar(0.84 + t.shade * 0.30);
    tier1Inst.setColorAt(idx, pColTmp);
    pColTmp.multiplyScalar(1.07);
    tier2Inst.setColorAt(idx, pColTmp);
    pColTmp.multiplyScalar(1.06);
    tier3Inst.setColorAt(idx, pColTmp);
    tier4Inst.setColorAt(idx, pColTmp);
  });
  [trunkInst, tier1Inst, tier2Inst, tier3Inst, tier4Inst].forEach((im) => {
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
    root.add(im);
  });

  const boulderInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1.0, 1),
    new THREE.MeshStandardMaterial({
      map: pbr.granite.map,
      normalMap: pbr.granite.normalMap,
      normalScale: new THREE.Vector2(1.5, 1.5),
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.04
    }),
    Math.max(1, rockCoords.length)
  );
  const rockPalette = [new THREE.Color(0x9a8f84), new THREE.Color(0xb0a190), new THREE.Color(0x827d77), new THREE.Color(0xa29888)];
  rockCoords.forEach((r, idx) => {
    dObj.position.set(r.x, r.y - r.sy * 0.24, r.z);
    dObj.rotation.set(r.r * 0.4, r.r, r.r * 0.25);
    dObj.scale.set(r.sx, r.sy, r.sz);
    dObj.updateMatrix();
    boulderInst.setMatrixAt(idx, dObj.matrix);
    boulderInst.setColorAt(idx, rockPalette[idx % rockPalette.length]);
  });
  boulderInst.instanceMatrix.needsUpdate = true;
  if (boulderInst.instanceColor) boulderInst.instanceColor.needsUpdate = true;
  boulderInst.computeBoundingSphere();
  root.add(boulderInst);

  // 4. Mount Vice Towering 118m Cloud-Wrapped Summit Overlook Deck (-228, -1432) — Loop highway glides right through it!
  const sx = -228, sz = -1432, sy = 118.0;
  const deckWoodTex = makeWoodPlankTexture(maxAniso);
  const deckWoodNorm = makeWoodPlankNormalMap(maxAniso, 6, 6);
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckWoodTex,
    normalMap: deckWoodNorm,
    normalScale: new THREE.Vector2(1.1, 1.1),
    color: 0xa67a52,
    roughness: 0.76
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    map: pbr.stoneBrick.map,
    normalMap: pbr.stoneBrick.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3),
    color: 0x9e978e,
    roughness: 0.88
  });
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(18.5, 20.5, 2.2, 28), stoneMat);
  deck.position.set(sx, sy - 1.02, sz);
  const woodTop = new THREE.Mesh(new THREE.CylinderGeometry(17.5, 17.5, 0.22, 28), deckMat);
  woodTop.position.set(sx, sy + 0.02, sz);
  root.add(deck, woodTop);

  const mSignTex = makeNeonSignTexture('MOUNT VICE SUMMIT', 'ELEV 118M · CLOUD OVERLOOK · LOOP', '#FFD36B', maxAniso, false);
  const mSignBoard = new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.2, 0.36), archWoodMat);
  mSignBoard.position.set(sx - 11.5, sy + 2.8, sz - 11.0);
  mSignBoard.rotation.y = 0.52;
  const mSignFace = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 1.85),
    new THREE.MeshStandardMaterial({ map: mSignTex, emissive: 0xffffff, emissiveMap: mSignTex, emissiveIntensity: 0.92 })
  );
  mSignFace.position.set(sx - 11.36, sy + 2.8, sz - 10.78);
  mSignFace.rotation.y = 0.52;
  root.add(mSignBoard, mSignFace);

  const towerGrp = new THREE.Group();
  towerGrp.position.set(sx + 14.5, sy, sz - 12.5);
  const redMat = new THREE.MeshStandardMaterial({ color: 0xe8323e, roughness: 0.38, metalness: 0.52 });
  const whtMat = new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.38, metalness: 0.42 });
  for (let seg = 0; seg < 7; seg++) {
    const rBot = 2.6 - seg * 0.31;
    const rTop = 2.6 - (seg + 1) * 0.31;
    const tSeg = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, 4.6, 4), seg % 2 === 0 ? redMat : whtMat);
    tSeg.position.y = 2.3 + seg * 4.6;
    towerGrp.add(tSeg);
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.24, 7.5, 8), whtMat);
  spire.position.y = 35.8;
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2842 });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), beaconMat);
  beacon.position.y = 39.8;
  towerGrp.add(spire, beacon);
  root.add(towerGrp);

  // 5. GTA San Andreas Mount Chiliad Drifting 3D Mountain Mist & Cloud Banks wrapping upper ridges!
  const mistClouds = new THREE.Group();
  const mistTex = makeSoftParticleTexture();
  const mistMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    color: 0xe6effa,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mistPlaneGeo = new THREE.PlaneGeometry(145, 58);
  for (let m = 0; m < 18; m++) {
    const ang = (m / 18) * Math.PI * 2;
    const tier = m % 3;
    const rad = tier === 0 ? 155 : (tier === 1 ? 102 : 52);
    const alt = tier === 0 ? 58 : (tier === 1 ? 86 : 112);
    const puff = new THREE.Mesh(mistPlaneGeo, mistMat);
    puff.position.set(sx + Math.cos(ang) * rad, alt + (m % 2) * 5, sz + Math.sin(ang) * rad);
    puff.rotation.x = -Math.PI / 2 + ((m % 3) - 1) * 0.14;
    puff.rotation.z = ang;
    puff.userData.baseX = puff.position.x;
    puff.userData.phase = m * 0.7;
    mistClouds.add(puff);
  }
  root.add(mistClouds);

  circleColliders.push(
    { x: sx + 14.5, z: sz - 12.5, r: 2.8 },
    { x: sx - 11.5, z: sz - 11.0, r: 2.2 }
  );
  treeCoords.forEach((t) => {
    circleColliders.push({ x: t.x, z: t.z, r: 0.62 * t.s });
  });
  rockCoords.forEach((r) => {
    circleColliders.push({ x: r.x, z: r.z, r: Math.max(r.sx, r.sz) * 0.96 });
  });

  return { root, beacon, mistClouds, summit: { x: sx, y: sy, z: sz }, circleColliders, sampleMeshHeight };
}

/* ==========================================================================
   SEPARATE WESTERN MOUNTAIN RANGE — "SIERRA WEST · REDROCK PEAKS"
   - Completely separate western mountain region (X = -885..-496, Z = -760..+240)
   - Warm GTA San Andreas Redrock Canyon & Redwood-Pine Biome with PBR Normal Maps
   - Full Continuous ZERO-DEAD-END Loop Highway (Vice Port North <-> 50m Redrock
     Overlook <-> Vice Port South) with Guardrails, Arches & Solid Colliders!
   ========================================================================== */
export function createSierraWestRange(getTerrainHeight, closestWestRoad, roadPoints, maxAniso = 4) {
  const root = new THREE.Group();
  const pbr = getWorldPBRTextures(maxAniso);
  const circleColliders = [];

  const minX = -885, maxX = -496;
  const minZ = -760, maxZ = 240;
  const segX = 104, segZ = 148;
  const w = maxX - minX, d = maxZ - minZ;

  const tGeo = new THREE.PlaneGeometry(w, d, segX, segZ);
  tGeo.rotateX(-Math.PI / 2);
  const posAttr = tGeo.attributes.position;
  const swHeights = new Float32Array(posAttr.count);
  const colors = new Float32Array(posAttr.count * 3);

  // Warm Western Canyon / Redrock / Sagebrush / Redwood Biome Palette
  const cSage   = new THREE.Color(0x5c6e3a);
  const cOchre  = new THREE.Color(0x9a7048);
  const cTerra  = new THREE.Color(0x9e5438);
  const cCanyon = new THREE.Color(0x764230);
  const cRedwd  = new THREE.Color(0x3a5832);
  const cMesa   = new THREE.Color(0xb6865e);
  const cGravel = new THREE.Color(0x786858);
  const cTmp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const lx = posAttr.getX(i);
    const lz = posAttr.getZ(i);
    const wx = (minX + maxX) * 0.5 + lx;
    const wz = (minZ + maxZ) * 0.5 + lz;
    let h = getTerrainHeight(wx, wz);

    const roadHit = closestWestRoad(wx, wz);
    if (roadHit.dist < 8.4) {
      const recess = roadHit.dist < 7.0 ? 0.24 : 0.24 * (1 - (roadHit.dist - 7.0) / 1.4);
      h = Math.max(-0.2, h - recess);
    }
    posAttr.setY(i, h);
    swHeights[i] = h;

    const hDx = getTerrainHeight(wx + 2.4, wz) - getTerrainHeight(wx - 2.4, wz);
    const hDz = getTerrainHeight(wx, wz + 2.4) - getTerrainHeight(wx, wz - 2.4);
    const slope = Math.min(1, Math.hypot(hDx, hDz) / 3.6);
    const elev = Math.max(0, Math.min(1, h / 96));

    if (elev < 0.25) cTmp.copy(cSage).lerp(cRedwd, elev / 0.25);
    else if (elev < 0.58) cTmp.copy(cRedwd).lerp(cOchre, (elev - 0.25) / 0.33);
    else cTmp.copy(cOchre).lerp(cMesa, (elev - 0.58) / 0.42);

    if (slope > 0.24) {
      const cliffMix = Math.min(0.92, (slope - 0.24) * 1.85);
      const strata = 0.5 + 0.5 * Math.sin(h * 0.72 + wz * 0.04);
      cTmp.lerp(strata > 0.5 ? cTerra : cCanyon, cliffMix);
    }
    if (roadHit.dist < 11.4) {
      const shMix = Math.max(0, 1 - Math.max(0, roadHit.dist - 7.0) / 4.4);
      cTmp.lerp(cGravel, shMix * 0.65);
    }
    const grain = (Math.sin(wx * 0.11 - wz * 0.08) * Math.cos(wz * 0.16 + wx * 0.06)) * 0.05;
    colors[i * 3]     = Math.max(0, Math.min(1, cTmp.r + grain));
    colors[i * 3 + 1] = Math.max(0, Math.min(1, cTmp.g + grain));
    colors[i * 3 + 2] = Math.max(0, Math.min(1, cTmp.b + grain));
  }
  tGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  tGeo.computeVertexNormals();
  const swStride = segX + 1;
  const sampleMeshHeight = (wx, wz) => {
    const fx = ((wx - minX) / w) * segX;
    const fz = ((wz - minZ) / d) * segZ;
    if (fx < 0 || fx >= segX || fz < 0 || fz >= segZ) return -999;
    const ix = Math.floor(fx), iz = Math.floor(fz);
    const u = fx - ix, v = fz - iz;
    const a = iz * swStride + ix, b = (iz + 1) * swStride + ix;
    const ya = swHeights[a], yb = swHeights[b], yc = swHeights[b + 1], yd = swHeights[a + 1];
    return (u + v <= 1) ? (ya + u * (yd - ya) + v * (yb - ya)) : (yc + (1 - u) * (yb - yc) + (1 - v) * (yd - yc));
  };

  const swRockTex = pbr.redrock.map.clone();
  swRockTex.repeat.set(28, 68);
  swRockTex.needsUpdate = true;
  const swRockNorm = pbr.redrock.normalMap.clone();
  swRockNorm.repeat.set(28, 68);
  swRockNorm.needsUpdate = true;
  const terrainMesh = new THREE.Mesh(
    tGeo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: swRockTex,
      normalMap: swRockNorm,
      normalScale: new THREE.Vector2(1.45, 1.45),
      roughness: 0.90,
      metalness: 0.03
    })
  );
  terrainMesh.position.set((minX + maxX) * 0.5, 0.0, (minZ + maxZ) * 0.5);
  terrainMesh.receiveShadow = true;
  root.add(terrainMesh);

  // Engineered 2-Lane Scenic Redrock Loop Highway + Textured Embankment Skirts + W-Beam Guardrails!
  const roadC = document.createElement('canvas');
  roadC.width = 512; roadC.height = 512;
  const rdCtx = roadC.getContext('2d');
  rdCtx.fillStyle = '#2b292e';
  rdCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const g = 34 + Math.floor(Math.random() * 32);
    rdCtx.fillStyle = `rgb(${g + 4},${g + 2},${g})`;
    rdCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  rdCtx.fillStyle = '#f4efe6';
  rdCtx.fillRect(22, 0, 12, 512);
  rdCtx.fillRect(478, 0, 12, 512);
  rdCtx.fillStyle = '#f8c224';
  rdCtx.fillRect(243, 0, 9, 512);
  rdCtx.fillRect(260, 0, 9, 512);
  const roadTex = new THREE.CanvasTexture(roadC);
  roadTex.wrapS = THREE.ClampToEdgeWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.colorSpace = THREE.SRGBColorSpace;
  roadTex.anisotropy = Math.min(maxAniso, 16);
  const roadNorm = heightCanvasToNormalTexture(roadC, 1.4, Math.min(maxAniso, 16), 1, 1);
  roadNorm.wrapS = THREE.ClampToEdgeWrapping;

  const rPos = [], rUv = [], rIdx = [];
  const skirtPos = [], skirtUv = [], skirtIdx = [];
  const railPos = [], railIdx = [];
  const halfW = 6.8, skirtDrop = 4.0;
  let distAccum = 0;
  const guardrailPosts = [];

  for (let i = 0; i < roadPoints.length; i++) {
    const cur = roadPoints[i];
    const prev = roadPoints[Math.max(0, i - 1)];
    const next = roadPoints[Math.min(roadPoints.length - 1, i + 1)];
    if (i > 0) distAccum += Math.hypot(cur.x - prev.x, cur.z - prev.z);

    const tx = next.x - prev.x, tz = next.z - prev.z;
    const tLen = Math.hypot(tx, tz) || 1;
    const nx = -tz / tLen, nz = tx / tLen;

    const lx = cur.x - nx * halfW, lz = cur.z - nz * halfW;
    const rx = cur.x + nx * halfW, rz = cur.z + nz * halfW;
    const deckY = cur.y + 0.08;

    rPos.push(lx, deckY, lz, rx, deckY, rz);
    rUv.push(0, distAccum * 0.07, 1, distAccum * 0.07);

    const lxOut = cur.x - nx * (halfW + 1.9), lzOut = cur.z - nz * (halfW + 1.9);
    const rxOut = cur.x + nx * (halfW + 1.9), rzOut = cur.z + nz * (halfW + 1.9);
    skirtPos.push(
      lx, deckY - 0.02, lz, lxOut, deckY - skirtDrop, lzOut,
      rx, deckY - 0.02, rz, rxOut, deckY - skirtDrop, rzOut
    );
    skirtUv.push(distAccum * 0.16, 0, distAccum * 0.16, 1, distAccum * 0.16, 0, distAccum * 0.16, 1);

    if (i < roadPoints.length - 1) {
      const base = i * 2;
      rIdx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      const sb = i * 4;
      skirtIdx.push(sb, sb + 4, sb + 1, sb + 1, sb + 4, sb + 5);
      skirtIdx.push(sb + 2, sb + 3, sb + 6, sb + 3, sb + 7, sb + 6);
    }

    const hl = getTerrainHeight(cur.x - nx * (halfW + 7.5), cur.z - nz * (halfW + 7.5));
    const hr = getTerrainHeight(cur.x + nx * (halfW + 7.5), cur.z + nz * (halfW + 7.5));
    const side = hl <= hr ? -1 : 1;
    const gx = cur.x + nx * side * (halfW + 0.22);
    const gz = cur.z + nz * side * (halfW + 0.22);
    railPos.push(gx, deckY + 0.56, gz, gx, deckY + 0.88, gz);
    if (i > 4 && i < roadPoints.length - 5 && deckY > 4.2) {
      if (guardrailPosts.length > 0 && guardrailPosts[guardrailPosts.length - 1].side === side && guardrailPosts[guardrailPosts.length - 1].i === i - 1) {
        const rb = (i - 1) * 2;
        railIdx.push(rb, rb + 1, rb + 2, rb + 1, rb + 3, rb + 2);
      }
      guardrailPosts.push({ i, side, x: gx, y: deckY, z: gz, yaw: Math.atan2(tx, tz) });
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rUv, 2));
  roadGeo.setIndex(rIdx);
  roadGeo.computeVertexNormals();
  const roadMesh = new THREE.Mesh(
    roadGeo,
    new THREE.MeshStandardMaterial({
      map: roadTex,
      normalMap: roadNorm,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughness: 0.75,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })
  );
  roadMesh.receiveShadow = true;
  root.add(roadMesh);

  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
  skirtGeo.setAttribute('uv', new THREE.Float32BufferAttribute(skirtUv, 2));
  skirtGeo.setIndex(skirtIdx);
  skirtGeo.computeVertexNormals();
  root.add(new THREE.Mesh(
    skirtGeo,
    new THREE.MeshStandardMaterial({
      map: pbr.concrete.map,
      normalMap: pbr.concrete.normalMap,
      color: 0xa27e66,
      roughness: 0.88,
      side: THREE.DoubleSide
    })
  ));

  const grMat = new THREE.MeshStandardMaterial({ color: 0xc2cad6, roughness: 0.36, metalness: 0.78, side: THREE.DoubleSide });
  if (railIdx.length > 0) {
    const railGeo = new THREE.BufferGeometry();
    railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3));
    railGeo.setIndex(railIdx);
    railGeo.computeVertexNormals();
    root.add(new THREE.Mesh(railGeo, grMat));
  }
  const dObj = new THREE.Object3D();
  const grPostInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.92, 0.14), grMat, Math.max(1, guardrailPosts.length));
  guardrailPosts.forEach((gp, idx) => {
    dObj.position.set(gp.x, gp.y + 0.45, gp.z);
    dObj.rotation.set(0, gp.yaw, 0);
    dObj.scale.set(1, 1, 1);
    dObj.updateMatrix();
    grPostInst.setMatrixAt(idx, dObj.matrix);
  });
  grPostInst.instanceMatrix.needsUpdate = true;
  grPostInst.computeBoundingSphere();
  root.add(grPostInst);

  // TWO Entrance Arches (North & South Entries from Vice Port West — ZERO DEAD ENDS!)
  const archWoodMat = new THREE.MeshStandardMaterial({
    map: pbr.bark.map,
    normalMap: pbr.bark.normalMap,
    color: 0x926242,
    roughness: 0.82
  });
  const buildWestArch = (ax, az, title, sub) => {
    const ay = getTerrainHeight(ax, az);
    const grp = new THREE.Group();
    grp.position.set(ax, ay, az);
    grp.rotation.y = Math.PI / 2;
    for (const sz of [-7.8, 7.8]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 7.8, 10), archWoodMat);
      post.position.set(sz, 3.9, 0);
      grp.add(post);
      circleColliders.push({ x: ax, z: az + sz, r: 0.58 });
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(16.8, 1.85, 0.72), archWoodMat);
    beam.position.set(0, 7.5, 0);
    const tex = makeNeonSignTexture(title, sub, '#FF8A2A', maxAniso, false);
    const sMat = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.85, side: THREE.DoubleSide });
    const f1 = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 1.45), sMat); f1.position.set(0, 7.5, 0.39);
    const f2 = f1.clone(); f2.rotation.y = Math.PI; f2.position.z = -0.39;
    grp.add(beam, f1, f2);
    root.add(grp);
  };
  buildWestArch(-504, -540, 'SIERRA WEST PASS', 'NORTH ENTRY · REDROCK PEAKS LOOP');
  buildWestArch(-504, -60,  'SIERRA WEST PASS', 'SOUTH ENTRY · BACK TO VICE PORT');

  // Instanced Redwood Pines & Redrock Canyon Boulders (All PBR Textured + Solid Colliders!)
  const treeCoords = [];
  const rockCoords = [];
  let seed = 7351;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  for (let i = 0; i < 420; i++) {
    const tx = minX + 24 + rand() * (w - 44);
    const tz = minZ + 28 + rand() * (d - 56);
    const ty = getTerrainHeight(tx, tz);
    if (ty < 1.2 || ty > 86) continue;
    if (closestWestRoad(tx, tz).dist < 11.8) continue;
    if (Math.hypot(tx + 772, tz + 210) < 26) continue;
    treeCoords.push({ x: tx, y: ty, z: tz, s: 0.92 + rand() * 0.95, ry: rand() * Math.PI * 2, shade: rand() });
  }
  for (let i = 0; i < 180; i++) {
    const rx = minX + 22 + rand() * (w - 42);
    const rz = minZ + 24 + rand() * (d - 48);
    const ry = getTerrainHeight(rx, rz);
    if (ry < 1.5) continue;
    if (closestWestRoad(rx, rz).dist < 12.2) continue;
    if (Math.hypot(rx + 772, rz + 210) < 24) continue;
    rockCoords.push({ x: rx, y: ry, z: rz, sx: 1.5 + rand() * 3.4, sy: 1.0 + rand() * 2.2, sz: 1.5 + rand() * 3.4, r: rand() * 6 });
  }

  const trunkMat = new THREE.MeshStandardMaterial({
    map: pbr.bark.map,
    normalMap: pbr.bark.normalMap,
    normalScale: new THREE.Vector2(1.4, 1.4),
    color: 0x9e5c3c, // Warm Sierra Redwood bark
    roughness: 0.94
  });
  const pineMat = new THREE.MeshStandardMaterial({
    map: pbr.pineNeedle.map,
    normalMap: pbr.pineNeedle.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3),
    color: 0xffffff,
    roughness: 0.86
  });
  const trunkInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.56, 5.2, 8), trunkMat, Math.max(1, treeCoords.length));
  const t1Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(3.0, 4.8, 9), pineMat, Math.max(1, treeCoords.length));
  const t2Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(2.3, 4.2, 9), pineMat, Math.max(1, treeCoords.length));
  const t3Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 3.4, 8), pineMat, Math.max(1, treeCoords.length));
  const rwCols = [new THREE.Color(0x3a6a38), new THREE.Color(0x4d763e), new THREE.Color(0x2f5e36), new THREE.Color(0x5b7a3c)];
  const tmpC = new THREE.Color();
  treeCoords.forEach((t, idx) => {
    dObj.rotation.set(0, t.ry, 0);
    dObj.scale.set(t.s, t.s, t.s);
    dObj.position.set(t.x, t.y + 0.65 * t.s, t.z); dObj.updateMatrix(); trunkInst.setMatrixAt(idx, dObj.matrix);
    dObj.position.set(t.x, t.y + 3.85 * t.s, t.z); dObj.updateMatrix(); t1Inst.setMatrixAt(idx, dObj.matrix);
    dObj.position.set(t.x, t.y + 6.25 * t.s, t.z); dObj.updateMatrix(); t2Inst.setMatrixAt(idx, dObj.matrix);
    dObj.position.set(t.x, t.y + 8.35 * t.s, t.z); dObj.updateMatrix(); t3Inst.setMatrixAt(idx, dObj.matrix);
    tmpC.copy(rwCols[idx % rwCols.length]).multiplyScalar(0.84 + t.shade * 0.28);
    t1Inst.setColorAt(idx, tmpC);
    tmpC.multiplyScalar(1.07);
    t2Inst.setColorAt(idx, tmpC);
    t3Inst.setColorAt(idx, tmpC);
    circleColliders.push({ x: t.x, z: t.z, r: 0.68 * t.s });
  });
  [trunkInst, t1Inst, t2Inst, t3Inst].forEach((im) => {
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.computeBoundingSphere();
    root.add(im);
  });

  const boulderInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1.0, 1),
    new THREE.MeshStandardMaterial({
      map: pbr.granite.map,
      normalMap: pbr.granite.normalMap,
      normalScale: new THREE.Vector2(1.5, 1.5),
      color: 0xffffff,
      roughness: 0.92
    }),
    Math.max(1, rockCoords.length)
  );
  const redRockPalette = [new THREE.Color(0xb46d4c), new THREE.Color(0xc2855e), new THREE.Color(0x96583e), new THREE.Color(0xaa7b58)];
  rockCoords.forEach((r, idx) => {
    dObj.position.set(r.x, r.y - r.sy * 0.26, r.z);
    dObj.rotation.set(r.r * 0.35, r.r, r.r * 0.2);
    dObj.scale.set(r.sx, r.sy, r.sz);
    dObj.updateMatrix();
    boulderInst.setMatrixAt(idx, dObj.matrix);
    boulderInst.setColorAt(idx, redRockPalette[idx % redRockPalette.length]);
    circleColliders.push({ x: r.x, z: r.z, r: Math.max(r.sx, r.sz) * 0.96 });
  });
  boulderInst.instanceMatrix.needsUpdate = true;
  if (boulderInst.instanceColor) boulderInst.instanceColor.needsUpdate = true;
  boulderInst.computeBoundingSphere();
  root.add(boulderInst);

  // Towering Redrock Summit Overlook Deck at (-772, -210, y=96m) facing East over Vice City Skyline!
  const sx = -772, sz = -210, sy = 96.0;
  const deckWoodTex = makeWoodPlankTexture(maxAniso);
  const deckWoodNorm = makeWoodPlankNormalMap(maxAniso, 6, 6);
  const deckMat = new THREE.MeshStandardMaterial({
    map: deckWoodTex, normalMap: deckWoodNorm, color: 0xb27e50, roughness: 0.76
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    map: pbr.stoneBrick.map, normalMap: pbr.stoneBrick.normalMap, color: 0xb88464, roughness: 0.88
  });
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(16.5, 18.5, 2.2, 24), stoneMat);
  deck.position.set(sx, sy - 1.02, sz);
  const woodTop = new THREE.Mesh(new THREE.CylinderGeometry(15.5, 15.5, 0.22, 24), deckMat);
  woodTop.position.set(sx, sy + 0.02, sz);
  root.add(deck, woodTop);

  const sSignTex = makeNeonSignTexture('SIERRA WEST PEAKS', 'ELEV 96M · HIGH REDROCK LOOP', '#FF8A2A', maxAniso, false);
  const sSignBoard = new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.2, 0.36), archWoodMat);
  sSignBoard.position.set(sx - 10.5, sy + 2.8, sz);
  sSignBoard.rotation.y = Math.PI / 2;
  const sSignFace = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 1.85),
    new THREE.MeshStandardMaterial({ map: sSignTex, emissive: 0xffffff, emissiveMap: sSignTex, emissiveIntensity: 0.92 })
  );
  sSignFace.position.set(sx - 10.28, sy + 2.8, sz);
  sSignFace.rotation.y = Math.PI / 2;
  root.add(sSignBoard, sSignFace);

  // Canyon Relay Tower & Blinking Orange Beacon
  const towerGrp = new THREE.Group();
  towerGrp.position.set(sx - 11.5, sy, sz - 11.5);
  const orMat = new THREE.MeshStandardMaterial({ color: 0xff6b24, roughness: 0.4, metalness: 0.48 });
  const whtMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.4, metalness: 0.42 });
  for (let seg = 0; seg < 6; seg++) {
    const tSeg = new THREE.Mesh(new THREE.CylinderGeometry(2.2 - (seg + 1) * 0.28, 2.2 - seg * 0.28, 4.4, 4), seg % 2 === 0 ? orMat : whtMat);
    tSeg.position.y = 2.2 + seg * 4.4;
    towerGrp.add(tSeg);
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.68, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff6b24 }));
  beacon.position.y = 27.6;
  towerGrp.add(beacon);
  root.add(towerGrp);

  // High-Altitude Sierra Canyon Drifting 3D Cloud & Mist Layers!
  const mistClouds = new THREE.Group();
  const mistTex = makeSoftParticleTexture();
  const mistMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    color: 0xf2e4d8,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mistGeo = new THREE.PlaneGeometry(132, 54);
  for (let m = 0; m < 14; m++) {
    const ang = (m / 14) * Math.PI * 2;
    const tier = m % 3;
    const rad = tier === 0 ? 128 : (tier === 1 ? 82 : 44);
    const alt = tier === 0 ? 48 : (tier === 1 ? 72 : 91);
    const puff = new THREE.Mesh(mistGeo, mistMat);
    puff.position.set(sx + Math.cos(ang) * rad, alt + (m % 2) * 4, sz + Math.sin(ang) * rad);
    puff.rotation.x = -Math.PI / 2 + ((m % 3) - 1) * 0.12;
    puff.rotation.z = ang;
    puff.userData.baseX = puff.position.x;
    puff.userData.phase = m * 0.9;
    mistClouds.add(puff);
  }
  root.add(mistClouds);

  circleColliders.push(
    { x: sx - 11.5, z: sz - 11.5, r: 2.6 },
    { x: sx - 10.5, z: sz, r: 2.2 }
  );

  return { root, beacon, mistClouds, summit: { x: sx, y: sy, z: sz }, circleColliders, sampleMeshHeight };
}





