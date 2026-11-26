/* ==========================================================================
   VICE CITY 3D — EXTENDED OPEN WORLD MODULE (v1)
   - Two-Wheelers (PCJ-600 Superbike, Sanchez Dirt Bike, Faggio Scooter)
   - VCPD Police Cruiser + Flashing Lightbar + Rhino Tank (PANZER)
   - Airport Security Barricades & Map-Edge Roadblocks
   - Countryside Village ("Vice Hollow") + Deep Pine Forest ("Vice Pines")
   - Animated 3D Wildlife (Deer, Wild Boar, Street/Village Dogs, Flamingos)
   - Upgraded Malibu Club Interior (Spinning Disco Ball, Pulsing Dance Floor,
     Animated Club Dancers, Neon Bar, Velvet Rope VIP Entrance & Bouncer)
   - Authentic GTA Vice City Complete Cheat Code Registry
   ========================================================================== */
import * as THREE from 'https://esm.sh/three@0.187.0';
import {
  makeNeonSignTexture,
  makeContactShadowTexture,
  makeWoodPlankTexture,
  makeWoodPlankNormalMap,
  makeCarnivalStripesTexture,
  getWorldPBRTextures
} from './vice-env.js?v=18';

function makeHazardStripeTexture(bg = '#f4f5f8', stripe = '#e83424', label = '') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = stripe;
  for (let x = -128; x < 640; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 32, 0);
    ctx.lineTo(x - 16, 128);
    ctx.lineTo(x - 48, 128);
    ctx.closePath();
    ctx.fill();
  }
  if (label) {
    ctx.fillStyle = 'rgba(14, 16, 24, 0.88)';
    ctx.fillRect(96, 30, 320, 68);
    ctx.strokeStyle = '#ffd36b';
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 34, 312, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 26px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 65);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makePoliceDoorTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f4f6fa';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#186a46';
  ctx.fillRect(0, 0, 256, 18);
  ctx.fillRect(0, 110, 256, 18);
  ctx.fillStyle = '#14583a';
  ctx.font = '900 44px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VCPD', 128, 56);
  ctx.fillStyle = '#212630';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('POLICE · 911', 128, 92);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ==========================================================================
   1. TWO-WHEELERS: PCJ-600 SUPERBIKE, SANCHEZ DIRT BIKE & FAGGIO SCOOTER
   ========================================================================== */
export function createMotorcycle(kind = 'pcj600', colorHex = 0xff2e88) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const isScooter = kind === 'faggio';
  const isDirt = kind === 'sanchez';

  const pbr = getWorldPBRTextures(4);
  const paintMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: 0.14,
    metalness: 0.62,
    normalMap: pbr.paintFlake.normalMap,
    normalScale: new THREE.Vector2(0.16, 0.16),
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 2.15
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1e28, roughness: 0.44, metalness: 0.72, envMapIntensity: 1.4 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf2f6fc, roughness: 0.08, metalness: 0.98, envMapIntensity: 2.2 });
  const seatMat = new THREE.MeshStandardMaterial({ color: isScooter ? 0x3b2c26 : 0x18191f, roughness: 0.68 });
  const tireMat = new THREE.MeshStandardMaterial({
    map: pbr.tireTread.map,
    normalMap: pbr.tireTread.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3),
    color: 0x202228,
    roughness: 0.80,
    metalness: 0.05
  });
  const rimMat = new THREE.MeshStandardMaterial({ color: isDirt ? 0xdce2ec : 0xcbd4e2, roughness: 0.16, metalness: 0.92, envMapIntensity: 1.8 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff8de });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2238, emissive: 0xff162e, emissiveIntensity: 1.5, roughness: 0.16 });

  const wheelR = isScooter ? 0.24 : (isDirt ? 0.35 : 0.33);
  const tireTube = isScooter ? 0.08 : (isDirt ? 0.095 : 0.09);
  const wheelZ = isScooter ? 0.66 : (isDirt ? 0.82 : 0.80);

  const wheelSpinGroups = [];
  const frontSteerGroups = [];

  const makeBikeWheel = (zPos, isFront) => {
    const steerGrp = new THREE.Group();
    steerGrp.position.set(0, wheelR, zPos);
    const spinGrp = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.TorusGeometry(wheelR - tireTube * 0.45, tireTube, 10, 22), tireMat);
    tire.rotation.y = Math.PI / 2;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(wheelR * 0.62, wheelR * 0.62, 0.09, 14), rimMat);
    hub.rotation.z = Math.PI / 2;
    const brakeDisc = new THREE.Mesh(new THREE.CylinderGeometry(wheelR * 0.44, wheelR * 0.44, 0.12, 12), chromeMat);
    brakeDisc.rotation.z = Math.PI / 2;
    spinGrp.add(tire, hub, brakeDisc);
    // Spokes so spin is super crisp visually
    for (let s = 0; s < 5; s++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.06, wheelR * 1.15, 0.035), frameMat);
      sp.rotation.x = (s / 5) * Math.PI;
      spinGrp.add(sp);
    }
    steerGrp.add(spinGrp);
    bodyGroup.add(steerGrp);
    wheelSpinGroups.push(spinGrp);
    if (isFront) frontSteerGroups.push(steerGrp);
  };

  makeBikeWheel(-wheelZ, true);
  makeBikeWheel(wheelZ, false);

  // Ground contact shadow
  const shd = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 2.55),
    new THREE.MeshBasicMaterial({ map: makeContactShadowTexture(), transparent: true, opacity: 0.56, depthWrite: false })
  );
  shd.rotation.x = -Math.PI / 2;
  shd.position.y = 0.025;
  root.add(shd);

  // Chassis & Engine Block
  if (isScooter) {
    // Classic 1986 Vice City Faggio Vespa-style Scooter
    const floorboard = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.08, 0.85), frameMat);
    floorboard.position.set(0, 0.28, 0.02);
    const rearCowl = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.88), paintMat);
    rearCowl.position.set(0, 0.54, 0.46);
    const frontShield = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.18), paintMat);
    frontShield.position.set(0, 0.64, -0.46);
    frontShield.rotation.x = 0.22;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.72), seatMat);
    seat.position.set(0, 0.81, 0.36);
    const headPod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 14), paintMat);
    headPod.rotation.x = Math.PI / 2;
    headPod.position.set(0, 1.05, -0.52);
    const headLens = new THREE.Mesh(new THREE.CircleGeometry(0.095, 14), headMat);
    headLens.rotation.y = Math.PI;
    headLens.position.set(0, 1.05, -0.595);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), tailMat);
    tail.position.set(0, 0.66, 0.91);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.68, 8), chromeMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.04, -0.46);
    bodyGroup.add(floorboard, rearCowl, frontShield, seat, headPod, headLens, tail, bar);
  } else {
    // PCJ-600 Superbike or Sanchez Dirt Bike
    const engine = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.44, 0.58), frameMat);
    engine.position.set(0, 0.48, 0.02);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(isDirt ? 0.34 : 0.44, isDirt ? 0.26 : 0.32, 0.68), paintMat);
    tank.position.set(0, isDirt ? 0.86 : 0.82, -0.14);
    tank.rotation.x = 0.14;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.13, 0.76), seatMat);
    seat.position.set(0, isDirt ? 0.84 : 0.76, 0.38);
    seat.rotation.x = -0.06;
    const tailCowl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.64), paintMat);
    tailCowl.position.set(0, isDirt ? 0.82 : 0.78, 0.68);
    tailCowl.rotation.x = 0.22;
    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.08), tailMat);
    tailLight.position.set(0, isDirt ? 0.88 : 0.84, 1.0);
    bodyGroup.add(engine, tank, seat, tailCowl, tailLight);

    // Twin Front Forks + Steering Stem
    for (const sx of [-0.14, 0.14]) {
      const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.82, 8), chromeMat);
      fork.position.set(sx, 0.66, -0.64);
      fork.rotation.x = -0.34;
      bodyGroup.add(fork);
    }

    // Sport Fairing + Tinted Windscreen (PCJ-600) OR High Front Fender (Sanchez Dirt Bike)
    if (isDirt) {
      const fender = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.05, 0.52), paintMat);
      fender.position.set(0, 0.76, -0.84);
      fender.rotation.x = 0.18;
      const numPlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.08), new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.4 }));
      numPlate.position.set(0, 0.98, -0.64);
      numPlate.rotation.x = -0.25;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.06), headMat);
      head.position.set(0, 0.96, -0.69);
      bodyGroup.add(fender, numPlate, head);
    } else {
      const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.54), paintMat);
      fairing.position.set(0, 0.76, -0.58);
      fairing.rotation.x = -0.26;
      const sideFairL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.74), paintMat);
      sideFairL.position.set(-0.22, 0.54, -0.24);
      const sideFairR = sideFairL.clone(); sideFairR.position.x = 0.22;
      const screen = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.28, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x121826, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.78 })
      );
      screen.position.set(0, 1.02, -0.58);
      screen.rotation.x = -0.68;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.08), headMat);
      head.position.set(0, 0.80, -0.86);
      bodyGroup.add(fairing, sideFairL, sideFairR, screen, head);
    }

    // Handlebars + Chrome Exhaust Pipes
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, isDirt ? 0.78 : 0.68, 8), frameMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, isDirt ? 1.06 : 0.98, -0.44);
    bodyGroup.add(bar);
    for (const sx of isDirt ? [0.22] : [-0.22, 0.22]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.84, 10), chromeMat);
      pipe.rotation.x = Math.PI / 2 - 0.18;
      pipe.position.set(sx, 0.44, 0.48);
      bodyGroup.add(pipe);
    }
  }

  // Visible Rider Seat Anchor (Tommy sits here when riding!)
  const riderSeat = new THREE.Group();
  riderSeat.position.set(0, isScooter ? 0.56 : 0.58, 0.24);
  bodyGroup.add(riderSeat);

  const label = isScooter ? 'FAGGIO SCOOTER' : (isDirt ? 'SANCHEZ DIRT BIKE' : 'PCJ-600 SUPERBIKE');
  const rig = {
    root,
    bodyGroup,
    wheelSpinGroups,
    frontSteerGroups,
    tailMat,
    riderSeat,
    isBike: true,
    bikeKind: kind,
    label,
    topSpeed: isScooter ? 30 : (isDirt ? 44 : 56),
    accel: isScooter ? 18 : (isDirt ? 26 : 32),
    grip: isDirt ? 0.96 : 0.92
  };
  root.userData.carRig = rig;
  return rig;
}

/* ==========================================================================
   2. VCPD POLICE CRUISER (1986 VICE CITY LIVERY + FLASHING RED/BLUE BAR!)
   ========================================================================== */
export function createPoliceCruiser(maxAniso = 4) {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const greenMat = new THREE.MeshPhysicalMaterial({ color: 0x1a6e4a, roughness: 0.22, metalness: 0.34, clearcoat: 0.9 });
  const whiteMat = new THREE.MeshPhysicalMaterial({ color: 0xf4f6fa, roughness: 0.2, metalness: 0.22, clearcoat: 0.88 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.65, metalness: 0.45 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe6edf4, roughness: 0.14, metalness: 0.95 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x162230, roughness: 0.1, metalness: 0.55, transparent: true, opacity: 0.72 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2036, emissive: 0xff162c, emissiveIntensity: 1.25 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff8dc });

  const shd = new THREE.Mesh(
    new THREE.PlaneGeometry(2.55, 5.15),
    new THREE.MeshBasicMaterial({ map: makeContactShadowTexture(), transparent: true, opacity: 0.62, depthWrite: false })
  );
  shd.rotation.x = -Math.PI / 2;
  shd.position.y = 0.025;
  root.add(shd);

  // Lower body (front/rear VCPD green, center doors crisp white)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.56, 1.55), greenMat);
  hood.position.set(0, 0.66, -1.48);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.58, 1.32), greenMat);
  trunk.position.set(0, 0.68, 1.54);
  const centerBody = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.58, 1.58), whiteMat);
  centerBody.position.set(0, 0.67, 0.08);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.54, 1.98), whiteMat);
  cabin.position.set(0, 1.22, 0.14);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.46, 0.12), glassMat);
  windshield.position.set(0, 1.18, -0.84);
  windshield.rotation.x = -0.44;
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.44, 0.12), glassMat);
  rearGlass.position.set(0, 1.18, 1.14);
  rearGlass.rotation.x = 0.4;
  const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.38, 1.54), glassMat);
  sideGlass.position.set(0, 1.20, 0.14);

  // VCPD Door Emblem Decals
  const doorTex = makePoliceDoorTexture();
  doorTex.anisotropy = Math.min(maxAniso, 8);
  const doorMat = new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.35 });
  const doorL = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.46), doorMat);
  doorL.rotation.y = -Math.PI / 2;
  doorL.position.set(-0.98, 0.68, 0.08);
  const doorR = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.46), doorMat);
  doorR.rotation.y = Math.PI / 2;
  doorR.position.set(0.98, 0.68, 0.08);

  // Steel Push Bullbar + Bumpers + Headlights & Taillights
  const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.44, 0.18), darkMat);
  bullbar.position.set(0, 0.54, -2.38);
  const fBump = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.18, 0.22), chromeMat);
  fBump.position.set(0, 0.38, -2.28);
  const rBump = fBump.clone(); rBump.position.z = 2.24;
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.24, 0.08), darkMat);
  grille.position.set(0, 0.68, -2.26);
  const hL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.06), headMat);
  hL.position.set(-0.74, 0.68, -2.27);
  const hR = hL.clone(); hR.position.x = 0.74;
  const tL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.06), tailMat);
  tL.position.set(-0.68, 0.72, 2.21);
  const tR = tL.clone(); tR.position.x = 0.68;

  // Iconic Roof Emergency Lightbar (Alternating Flashing Red & Blue Lenses!)
  const barMount = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.08, 0.26), darkMat);
  barMount.position.set(0, 1.53, 0.02);
  const redLightMat = new THREE.MeshStandardMaterial({ color: 0xff2238, emissive: 0xff162e, emissiveIntensity: 2.2 });
  const blueLightMat = new THREE.MeshStandardMaterial({ color: 0x2288ff, emissive: 0x1678ff, emissiveIntensity: 2.2 });
  const redLens = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.24), redLightMat);
  redLens.position.set(-0.36, 1.64, 0.02);
  const blueLens = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.24), blueLightMat);
  blueLens.position.set(0.36, 1.64, 0.02);
  const centerSpeaker = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.22), chromeMat);
  centerSpeaker.position.set(0, 1.63, 0.02);

  bodyGroup.add(
    hood, trunk, centerBody, cabin, windshield, rearGlass, sideGlass,
    doorL, doorR, bullbar, fBump, rBump, grille, hL, hR, tL, tR,
    barMount, redLens, blueLens, centerSpeaker
  );

  // 4 Wheels
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x16171c, roughness: 0.9 });
  const hubMat = new THREE.MeshStandardMaterial({ color: 0xd6dde8, roughness: 0.2, metalness: 0.85 });
  const wheelSpinGroups = [];
  const frontSteerGroups = [];
  for (const [wx, wz, isF] of [[-0.95, -1.36, true], [0.95, -1.36, true], [-0.95, 1.34, false], [0.95, 1.34, false]]) {
    const sg = new THREE.Group();
    sg.position.set(wx, 0.36, wz);
    const sp = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 16), tireMat);
    tire.rotation.z = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 12), hubMat);
    rim.rotation.z = Math.PI / 2;
    sp.add(tire, rim);
    sg.add(sp);
    bodyGroup.add(sg);
    wheelSpinGroups.push(sp);
    if (isF) frontSteerGroups.push(sg);
  }

  const rig = {
    root,
    bodyGroup,
    wheelSpinGroups,
    frontSteerGroups,
    tailMat,
    redLightMat,
    blueLightMat,
    isPolice: true,
    label: 'VCPD CRUISER',
    topSpeed: 48,
    accel: 24,
    grip: 0.94
  };
  root.userData.carRig = rig;
  return rig;
}

/* ==========================================================================
   3. RHINO MILITARY TANK (CLASSIC "PANZER" CHEAT CODE!)
   ========================================================================== */
export function createRhinoTank() {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const oliveMat = new THREE.MeshStandardMaterial({ color: 0x4b573b, roughness: 0.72, metalness: 0.28 });
  const darkOlive = new THREE.MeshStandardMaterial({ color: 0x353e2b, roughness: 0.78, metalness: 0.32 });
  const treadMat = new THREE.MeshStandardMaterial({ color: 0x1d1f24, roughness: 0.92, metalness: 0.35 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.85, 1.15, 5.4), oliveMat);
  hull.position.set(0, 1.05, 0);
  const glacis = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.72, 1.25), darkOlive);
  glacis.position.set(0, 0.92, -2.55);
  glacis.rotation.x = 0.45;
  const turret = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.85, 2.45), oliveMat);
  turret.position.set(0, 2.02, -0.15);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 4.2, 12), darkOlive);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 2.08, -3.15);
  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.42, 12), treadMat);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 2.08, -5.2);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.16, 12), darkOlive);
  hatch.position.set(0.38, 2.50, 0.25);

  // Twin armored treads + bogie wheels
  const wheelSpinGroups = [];
  for (const tx of [-1.42, 1.42]) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 5.35), treadMat);
    track.position.set(tx, 0.52, 0);
    bodyGroup.add(track);
    for (let wz = -2.0; wz <= 2.0; wz += 1.0) {
      const sp = new THREE.Group();
      sp.position.set(tx, 0.44, wz);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.68, 12), darkOlive);
      w.rotation.z = Math.PI / 2;
      sp.add(w);
      bodyGroup.add(sp);
      wheelSpinGroups.push(sp);
    }
  }
  bodyGroup.add(hull, glacis, turret, barrel, muzzle, hatch);

  const rig = {
    root,
    bodyGroup,
    wheelSpinGroups,
    frontSteerGroups: [],
    isTank: true,
    label: 'RHINO TANK',
    topSpeed: 34,
    accel: 16,
    grip: 0.98
  };
  root.userData.carRig = rig;
  return rig;
}

/* ==========================================================================
   4. AIRPORT SECURITY BARRICADES & MAP-EDGE ROADBLOCK BARRICADES
   ========================================================================== */
export function createBarricadeWall(x1, z1, x2, z2, kind = 'roadblock', getTerrainHeight = null) {
  const group = new THREE.Group();
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, dz);
  const count = Math.max(1, Math.round(len / (kind === 'airport' ? 6.5 : 5.4)));
  const segLen = len / count;

  const isAirport = kind === 'airport';
  const stripeTex = makeHazardStripeTexture(
    isAirport ? '#f5f6fa' : '#ffd838',
    isAirport ? '#e83828' : '#1b1d24',
    isAirport ? 'RESTRICTED AIRFIELD' : 'ROAD CLOSED · VICE EDGE'
  );
  const pbr = getWorldPBRTextures(4);
  const concreteMat = new THREE.MeshStandardMaterial({
    map: pbr.concrete.map,
    normalMap: pbr.concrete.normalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    color: 0xc8ccd2,
    roughness: 0.88
  });
  const signMat = new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.42 });
  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x7e8896, roughness: 0.45, metalness: 0.72, transparent: true, opacity: 0.58, side: THREE.DoubleSide
  });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x626c78, roughness: 0.35, metalness: 0.82 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: isAirport ? 0xff3042 : 0xffaa18 });

  const beacons = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const mx = x1 + dx * t;
    const mz = z1 + dz * t;
    const my = getTerrainHeight ? getTerrainHeight(mx, mz) : 0;

    const seg = new THREE.Group();
    seg.position.set(mx, my, mz);
    seg.rotation.y = yaw;

    // Solid Concrete Jersey Barrier Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.96, segLen - 0.14), concreteMat);
    base.position.y = 0.48;
    seg.add(base);

    // Striped High-Visibility Reflective Hazard Plank
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.52, segLen - 0.24), signMat);
    rail.position.y = isAirport ? 1.24 : 1.18;
    seg.add(rail);

    if (isAirport) {
      // Tall Steel Chain-Link Airport Perimeter Fence + Barbed-Wire Top Rail
      const fence = new THREE.Mesh(new THREE.PlaneGeometry(segLen, 2.35), fenceMat);
      fence.rotation.y = Math.PI / 2;
      fence.position.y = 2.25;
      const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, segLen, 6), postMat);
      topBar.rotation.x = Math.PI / 2;
      topBar.position.y = 3.42;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.45, 8), postMat);
      post.position.set(0, 1.72, segLen * 0.48);
      seg.add(fence, topBar, post);
    }

    // Flashing Hazard Beacon every other segment
    if (i % 2 === 0) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), beaconMat);
      b.position.set(0, isAirport ? 3.58 : 1.62, 0);
      seg.add(b);
      beacons.push(b);
    }
    group.add(seg);
  }

  // Exact world-aligned AABB collider covering the full barrier wall
  const pad = 0.85;
  const collider = {
    minX: Math.min(x1, x2) - pad,
    maxX: Math.max(x1, x2) + pad,
    minZ: Math.min(z1, z2) - pad,
    maxZ: Math.max(z1, z2) + pad
  };
  return { group, collider, beacons };
}

/* ==========================================================================
   5. VICE HOLLOW COUNTRYSIDE COMMUNITY VILLAGE (NW Valley: X=-448..-306, Z=-1236..-1148)
   - Authentic GTA San Andreas Countryside Community: Cobblestone Plaza,
     Carved Fieldstone Wishing Well, Bell Chapel & Town Hall, Hank's Country
     Diner & Store w/ Striped Awning, Rusty's Gas Station, Clapboard Cottages
     facing INWARD toward Main Street, Red Barn + Corrugated Silo + Water Tower,
     Split-Rail Fences, Vintage Lanterns, Shade Trees & Living Villagers!
   ========================================================================== */
export function createCountrysideVillage(getTerrainHeight, maxAniso = 4) {
  const root = new THREE.Group();
  const boxColliders = [];
  const circleColliders = [];
  const npcSpawns = [];
  const pbr = getWorldPBRTextures(maxAniso);

  const valleyY = getTerrainHeight(-382, -1192);

  // Shared PBR Materials (Zero flat untextured surfaces!)
  const woodTex = makeWoodPlankTexture(maxAniso);
  const woodNorm = makeWoodPlankNormalMap(maxAniso, 4, 4);
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex, normalMap: woodNorm, normalScale: new THREE.Vector2(1.0, 1.0), color: 0xba8858, roughness: 0.80
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    map: woodTex, normalMap: woodNorm, color: 0x6c482e, roughness: 0.84
  });
  const barnRedMat = new THREE.MeshStandardMaterial({
    map: pbr.clapboard.map, normalMap: pbr.clapboard.normalMap, normalScale: new THREE.Vector2(1.2, 1.2), color: 0xb2332c, roughness: 0.78
  });
  const clapMats = [
    new THREE.MeshStandardMaterial({ map: pbr.clapboard.map, normalMap: pbr.clapboard.normalMap, normalScale: new THREE.Vector2(1.15, 1.15), color: 0xf4eadb, roughness: 0.82 }), // Warm Cream
    new THREE.MeshStandardMaterial({ map: pbr.clapboard.map, normalMap: pbr.clapboard.normalMap, normalScale: new THREE.Vector2(1.15, 1.15), color: 0xd6e2cf, roughness: 0.82 }), // Country Sage
    new THREE.MeshStandardMaterial({ map: pbr.clapboard.map, normalMap: pbr.clapboard.normalMap, normalScale: new THREE.Vector2(1.15, 1.15), color: 0xf0deb8, roughness: 0.82 }), // Butter Yellow
    new THREE.MeshStandardMaterial({ map: pbr.clapboard.map, normalMap: pbr.clapboard.normalMap, normalScale: new THREE.Vector2(1.15, 1.15), color: 0xebd3c2, roughness: 0.82 }), // Warm Peach
    new THREE.MeshStandardMaterial({ map: pbr.clapboard.map, normalMap: pbr.clapboard.normalMap, normalScale: new THREE.Vector2(1.15, 1.15), color: 0xd6c6b2, roughness: 0.82 })  // Cedar Sand
  ];
  const roofMats = [
    new THREE.MeshStandardMaterial({ map: pbr.shingles.map, normalMap: pbr.shingles.normalMap, normalScale: new THREE.Vector2(1.35, 1.35), color: 0xa84b36, roughness: 0.78 }), // Terracotta Shingles
    new THREE.MeshStandardMaterial({ map: pbr.shingles.map, normalMap: pbr.shingles.normalMap, normalScale: new THREE.Vector2(1.35, 1.35), color: 0x4b5866, roughness: 0.74 }), // Slate Shingles
    new THREE.MeshStandardMaterial({ map: pbr.shingles.map, normalMap: pbr.shingles.normalMap, normalScale: new THREE.Vector2(1.35, 1.35), color: 0x76543a, roughness: 0.82 })  // Cedar Shakes
  ];
  const stoneMat = new THREE.MeshStandardMaterial({
    map: pbr.stoneBrick.map, normalMap: pbr.stoneBrick.normalMap, normalScale: new THREE.Vector2(1.4, 1.4), color: 0xb6afa4, roughness: 0.88
  });
  const cobbleMat = new THREE.MeshStandardMaterial({
    map: pbr.cobble.map, normalMap: pbr.cobble.normalMap, normalScale: new THREE.Vector2(1.3, 1.3), color: 0xc8c0b4, roughness: 0.84,
    polygonOffset: true, polygonOffsetFactor: -2
  });
  const dirtMat = new THREE.MeshStandardMaterial({
    map: pbr.dirtRoad.map, normalMap: pbr.dirtRoad.normalMap, normalScale: new THREE.Vector2(1.15, 1.15), color: 0xb89d7c, roughness: 0.92,
    polygonOffset: true, polygonOffsetFactor: -1
  });
  const hayMat = new THREE.MeshStandardMaterial({
    map: pbr.hay.map, normalMap: pbr.hay.normalMap, normalScale: new THREE.Vector2(1.3, 1.3), color: 0xe6c462, roughness: 0.94
  });
  const siloMat = new THREE.MeshStandardMaterial({
    map: pbr.corrugated.map, normalMap: pbr.corrugated.normalMap, normalScale: new THREE.Vector2(1.2, 1.2), color: 0xbec5ce, roughness: 0.46, metalness: 0.62
  });
  const winGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a4, emissive: 0xffb84c, emissiveIntensity: 0.88, roughness: 0.22
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xfbf6ee, roughness: 0.66 });
  const shutterMat = new THREE.MeshStandardMaterial({ color: 0x2f5a46, roughness: 0.72 });
  const awningTex = makeCarnivalStripesTexture('#c4322b', '#faf2e4', maxAniso);
  const awningMat = new THREE.MeshStandardMaterial({ map: awningTex, roughness: 0.72, side: THREE.DoubleSide });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.42, metalness: 0.76 });
  const lanternGlowMat = new THREE.MeshStandardMaterial({ color: 0xfff0c4, emissive: 0xffc662, emissiveIntensity: 1.8 });

  // 1. Lush Textured Grass Meadow Floor Across the Entire Village Valley
  const vGrassMap = pbr.grass.map.clone();
  vGrassMap.repeat.set(16, 12);
  vGrassMap.needsUpdate = true;
  const vGrassNorm = pbr.grass.normalMap.clone();
  vGrassNorm.repeat.set(16, 12);
  vGrassNorm.needsUpdate = true;
  const valleyMeadow = new THREE.Mesh(
    new THREE.PlaneGeometry(134, 86),
    new THREE.MeshStandardMaterial({
      map: vGrassMap, normalMap: vGrassNorm, normalScale: new THREE.Vector2(1.1, 1.1),
      color: 0x8db676, roughness: 0.94, polygonOffset: true, polygonOffsetFactor: -1
    })
  );
  valleyMeadow.rotation.x = -Math.PI / 2;
  valleyMeadow.position.set(-378, valleyY + 0.03, -1192);
  valleyMeadow.receiveShadow = true;
  root.add(valleyMeadow);

  // 2. Textured Dirt/Gravel Main Street + Central Cobblestone Community Plaza!
  const mainLane = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 124), dirtMat);
  mainLane.rotation.x = -Math.PI / 2;
  mainLane.rotation.z = Math.PI / 2;
  mainLane.position.set(-378, valleyY + 0.06, -1192);
  mainLane.receiveShadow = true;
  root.add(mainLane);

  // Central Cobblestone Village Square at (-382, -1192)
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(14.8, 15.4, 0.16, 32), cobbleMat);
  plaza.position.set(-382, valleyY + 0.05, -1192);
  plaza.receiveShadow = true;
  root.add(plaza);
  const plazaCurb = new THREE.Mesh(new THREE.TorusGeometry(15.0, 0.24, 8, 36), stoneMat);
  plazaCurb.rotation.x = Math.PI / 2;
  plazaCurb.position.set(-382, valleyY + 0.14, -1192);
  root.add(plazaCurb);

  // Carved Fieldstone Wishing Well & Village Fountain in Plaza Center (with Solid Collider!)
  const wellX = -382, wellZ = -1192;
  const wellGrp = new THREE.Group();
  wellGrp.position.set(wellX, valleyY + 0.12, wellZ);
  const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.35, 1.15, 16), stoneMat);
  wellBase.position.y = 0.58;
  const wellWater = new THREE.Mesh(
    new THREE.CylinderGeometry(1.72, 1.72, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0x26d8d4, emissive: 0x10767a, emissiveIntensity: 0.45, roughness: 0.14, metalness: 0.2 })
  );
  wellWater.position.y = 0.96;
  wellGrp.add(wellBase, wellWater);
  for (const sx of [-1.45, 1.45]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8), darkWoodMat);
    post.position.set(sx, 2.2, 0);
    wellGrp.add(post);
  }
  const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(2.55, 1.45, 4), roofMats[0]);
  wellRoof.position.y = 3.95;
  wellRoof.rotation.y = Math.PI / 4;
  wellGrp.add(wellRoof);
  root.add(wellGrp);
  circleColliders.push({ x: wellX, z: wellZ, r: 2.5 });

  // 4 Wooden Park Benches + Flower Planters around the Community Square
  const flowerCols = [0xff4b7d, 0xffd24c, 0x9b6cff, 0xff7a36];
  for (let b = 0; b < 4; b++) {
    const ang = b * (Math.PI / 2) + Math.PI / 4;
    const bx = wellX + Math.cos(ang) * 9.8;
    const bz = wellZ + Math.sin(ang) * 9.8;
    const bench = new THREE.Group();
    bench.position.set(bx, valleyY + 0.12, bz);
    bench.rotation.y = -ang + Math.PI / 2;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.58), woodMat); seat.position.y = 0.52;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.52, 0.10), woodMat); back.position.set(0, 0.84, -0.24);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.52), ironMat); legL.position.set(-0.92, 0.26, 0);
    const legR = legL.clone(); legR.position.x = 0.92;
    bench.add(seat, back, legL, legR);
    root.add(bench);
    circleColliders.push({ x: bx, z: bz, r: 0.95 });

    // Stone Flower Planter flanking each bench
    const fx = wellX + Math.cos(ang + 0.34) * 11.4;
    const fz = wellZ + Math.sin(ang + 0.34) * 11.4;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.65, 0.65, 10), stoneMat);
    pot.position.set(fx, valleyY + 0.44, fz);
    const bush = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.68, 1),
      new THREE.MeshStandardMaterial({ map: pbr.oakFoliage.map, color: 0x4c8c42, roughness: 0.85 })
    );
    bush.position.set(fx, valleyY + 0.95, fz);
    const bloom = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.32, 0),
      new THREE.MeshStandardMaterial({ color: flowerCols[b], roughness: 0.65 })
    );
    bloom.position.set(fx + 0.22, valleyY + 1.25, fz - 0.12);
    root.add(pot, bush, bloom);
    circleColliders.push({ x: fx, z: fz, r: 0.82 });
  }

  // 8 Warm Vintage Village Street Lanterns along Main Street & Plaza
  const lanternCoords = [
    [-424, -1185], [-400, -1185], [-364, -1185], [-334, -1185],
    [-424, -1199], [-400, -1199], [-364, -1199], [-334, -1199]
  ];
  lanternCoords.forEach(([lx, lz]) => {
    const ly = getTerrainHeight(lx, lz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 4.4, 8), ironMat);
    pole.position.set(lx, ly + 2.2, lz);
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), lanternGlowMat);
    lamp.position.set(lx, ly + 4.52, lz);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.25, 6), ironMat);
    cap.position.set(lx, ly + 4.82, lz);
    root.add(pole, lamp, cap);
    circleColliders.push({ x: lx, z: lz, r: 0.34 });
  });

  // Welcome Timber Arch into Vice Hollow Community (South Entry at Z = -1148)
  const vSignTex = makeNeonSignTexture('VICE HOLLOW', 'COUNTRYSIDE COMMUNITY · EST. 1954', '#FFD36B', maxAniso, false);
  const archX = -384, archZ = -1148;
  const archY = getTerrainHeight(archX, archZ);
  for (const sx of [-7.8, 7.8]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 6.2, 10), darkWoodMat);
    post.position.set(archX + sx, archY + 3.1, archZ);
    root.add(post);
    circleColliders.push({ x: archX + sx, z: archZ, r: 0.5 });
  }
  const archBoard = new THREE.Mesh(
    new THREE.BoxGeometry(16.4, 1.85, 0.42),
    new THREE.MeshStandardMaterial({ map: vSignTex, emissive: 0xffffff, emissiveMap: vSignTex, emissiveIntensity: 0.62 })
  );
  archBoard.position.set(archX, archY + 6.0, archZ);
  root.add(archBoard);

  // 3. Textured Community Architecture — EVERY Building Faces INWARD Toward Main Street & Plaza!
  // South Row (z ~ -1172): rot = Math.PI -> Front (+Z local) faces NORTH (-Z world) onto Main Street!
  // North Row (z ~ -1214): rot = 0       -> Front (+Z local) faces SOUTH (+Z world) onto Main Street!
  const buildings = [
    { x: -416, z: -1172, w: 13.6, d: 9.6, h: 4.9, rot: Math.PI, style: 'diner',   clapIdx: 2, roofIdx: 0 },
    { x: -346, z: -1172, w: 12.6, d: 9.2, h: 4.8, rot: Math.PI, style: 'garage',  clapIdx: 4, roofIdx: 1 },
    { x: -322, z: -1173, w: 10.6, d: 8.6, h: 4.4, rot: Math.PI, style: 'cottage', clapIdx: 1, roofIdx: 2 },
    { x: -432, z: -1214, w: 14.4, d: 11.2, h: 6.4, rot: 0,      style: 'barn',    clapIdx: 0, roofIdx: 1 },
    { x: -404, z: -1214, w: 10.8, d: 8.6, h: 4.4, rot: 0,       style: 'cottage', clapIdx: 3, roofIdx: 0 },
    { x: -382, z: -1219, w: 12.2, d: 10.8, h: 5.8, rot: 0,      style: 'chapel',  clapIdx: 0, roofIdx: 1 },
    { x: -356, z: -1214, w: 11.0, d: 8.8, h: 4.5, rot: 0,       style: 'cottage', clapIdx: 1, roofIdx: 2 },
    { x: -326, z: -1212, w: 10.8, d: 8.4, h: 4.3, rot: 0,       style: 'cottage', clapIdx: 2, roofIdx: 0 }
  ];

  buildings.forEach((c) => {
    const gy = getTerrainHeight(c.x, c.z);
    const grp = new THREE.Group();
    grp.position.set(c.x, gy, c.z);
    grp.rotation.y = c.rot;

    // Fieldstone Foundation + Textured Clapboard Walls
    const base = new THREE.Mesh(new THREE.BoxGeometry(c.w + 0.5, 0.72, c.d + 0.5), stoneMat);
    base.position.y = 0.34;
    const wallMat = c.style === 'barn' ? barnRedMat : clapMats[c.clapIdx % clapMats.length];
    const walls = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, c.d), wallMat);
    walls.position.y = c.h * 0.5 + 0.62;
    walls.castShadow = false;
    walls.receiveShadow = true;
    grp.add(base, walls);

    // White Corner Trim Pilasters (Crisp Architectural Framing!)
    for (const cx of [-c.w * 0.5, c.w * 0.5]) {
      for (const cz of [-c.d * 0.5, c.d * 0.5]) {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.28, c.h + 0.1, 0.28), trimMat);
        pil.position.set(cx, c.h * 0.5 + 0.62, cz);
        grp.add(pil);
      }
    }

    // Textured Shingled Pitched Gable Roof (2 Sloped Planes so shingle UVs align perfectly!)
    const rh = c.style === 'barn' ? 3.8 : (c.style === 'chapel' ? 3.4 : 2.6);
    const overW = c.w * 0.5 + 0.85;
    const slopeLen = Math.hypot(overW, rh);
    const slopeAng = Math.atan2(rh, overW);
    const roofMat = roofMats[c.roofIdx % roofMats.length];
    for (const sgn of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(slopeLen, 0.24, c.d + 1.4), roofMat);
      panel.position.set(sgn * overW * 0.5, c.h + 0.64 + rh * 0.5, 0);
      panel.rotation.z = -sgn * slopeAng;
      grp.add(panel);
    }
    // Gable Triangular End Walls (front & back, matching clapboard)
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-c.w * 0.5, 0); gableShape.lineTo(0, rh); gableShape.lineTo(c.w * 0.5, 0); gableShape.closePath();
    const gableGeo = new THREE.ShapeGeometry(gableShape);
    const gFront = new THREE.Mesh(gableGeo, wallMat); gFront.position.set(0, c.h + 0.62, c.d * 0.5 + 0.01);
    const gBack = new THREE.Mesh(gableGeo, wallMat); gBack.position.set(0, c.h + 0.62, -c.d * 0.5 - 0.01); gBack.rotation.y = Math.PI;
    grp.add(gFront, gBack);

    // Textured Fieldstone Chimney
    if (c.style !== 'garage') {
      const chim = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.0, 1.1), stoneMat);
      chim.position.set(c.w * 0.28, c.h + rh * 0.72 + 0.5, -c.d * 0.16);
      grp.add(chim);
    }

    // Covered Front Timber Porch + Columns + Steps + Multi-Pane Windows with Shutters!
    const porchDepth = c.style === 'diner' ? 3.2 : (c.style === 'garage' ? 4.4 : 2.4);
    const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.86, 0.42, porchDepth), woodMat);
    porchDeck.position.set(0, 0.36, c.d * 0.5 + porchDepth * 0.5);
    grp.add(porchDeck);

    // Porch Roof / Awning + Support Columns
    const canopyMat = c.style === 'diner' ? awningMat : roofMat;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(c.w * 0.88, 0.18, porchDepth + 0.35), canopyMat);
    canopy.position.set(0, 3.62, c.d * 0.5 + porchDepth * 0.52);
    canopy.rotation.x = 0.16;
    grp.add(canopy);
    for (const px of [-c.w * 0.39, -c.w * 0.14, c.w * 0.14, c.w * 0.39]) {
      if (Math.abs(px) < 1.6 && c.style === 'garage') continue;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 3.15, 8), trimMat);
      col.position.set(px, 2.02, c.d * 0.5 + porchDepth - 0.18);
      grp.add(col);
    }

    // Front Door + Illuminated Windows with Wooden Shutters & Flower Boxes
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.55, 0.16), darkWoodMat);
    door.position.set(0, 1.92, c.d * 0.5 + 0.05);
    const doorTrim = new THREE.Mesh(new THREE.BoxGeometry(1.72, 2.75, 0.12), trimMat);
    doorTrim.position.set(0, 1.94, c.d * 0.5 + 0.03);
    grp.add(doorTrim, door);

    for (const wx of [-c.w * 0.30, c.w * 0.30]) {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.65, 0.16), trimMat);
      winFrame.position.set(wx, 2.65, c.d * 0.5 + 0.04);
      const winPane = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.32, 0.20), winGlowMat);
      winPane.position.set(wx, 2.65, c.d * 0.5 + 0.06);
      const shL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.60, 0.12), shutterMat);
      shL.position.set(wx - 1.15, 2.65, c.d * 0.5 + 0.07);
      const shR = shL.clone(); shR.position.x = wx + 1.15;
      grp.add(winFrame, winPane, shL, shR);
    }
    // Side Elevation Windows with Trim & Shutters (Zero blank walls on cottages, diner & chapel!)
    if (c.style !== 'barn') {
      const sideZs = c.d >= 9.4 ? [-c.d * 0.24, c.d * 0.24] : [0];
      for (const sgn of [-1, 1]) {
        for (const wz of sideZs) {
          const sFrame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.58, 1.75), trimMat);
          sFrame.position.set(sgn * (c.w * 0.5 + 0.04), 2.65, wz);
          const sPane = new THREE.Mesh(new THREE.BoxGeometry(0.20, 1.26, 1.42), winGlowMat);
          sPane.position.set(sgn * (c.w * 0.5 + 0.06), 2.65, wz);
          const sSh1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.54, 0.42), shutterMat);
          sSh1.position.set(sgn * (c.w * 0.5 + 0.07), 2.65, wz - 1.08);
          const sSh2 = sSh1.clone(); sSh2.position.z = wz + 1.08;
          grp.add(sFrame, sPane, sSh1, sSh2);
        }
      }
    }

    // Special Community Landmark Details
    if (c.style === 'chapel') {
      // Tall White Bell Steeple + Golden Bell + Town Hall Clock!
      const belfry = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 3.2), clapMats[0]);
      belfry.position.set(0, c.h + rh + 1.4, c.d * 0.22);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(2.35, 4.8, 4), roofMats[1]);
      spire.position.set(0, c.h + rh + 5.8, c.d * 0.22);
      spire.rotation.y = Math.PI / 4;
      const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.16, 16), new THREE.MeshStandardMaterial({ color: 0xfff7e2, emissive: 0xffd27a, emissiveIntensity: 0.45 }));
      clock.rotation.x = Math.PI / 2;
      clock.position.set(0, c.h + rh + 1.6, c.d * 0.22 + 1.62);
      const chSignTex = makeNeonSignTexture('VICE HOLLOW', 'TOWN HALL & CHAPEL', '#FFD36B', maxAniso, false);
      const chSign = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.35), new THREE.MeshBasicMaterial({ map: chSignTex }));
      chSign.position.set(0, 4.4, c.d * 0.5 + 0.16);
      grp.add(belfry, spire, clock, chSign);
    } else if (c.style === 'diner') {
      const storeTex = makeNeonSignTexture("HANK'S COUNTRY DINER", 'GENERAL STORE · COFFEE & PIE', '#21E6D1', maxAniso, false);
      const storeSign = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 1.65), new THREE.MeshStandardMaterial({ map: storeTex, emissive: 0xffffff, emissiveMap: storeTex, emissiveIntensity: 0.65 }));
      storeSign.position.set(0, c.h + 0.55, c.d * 0.5 + 0.22);
      grp.add(storeSign);
      // 2 Outdoor Picnic Tables on Front Porch/Patio
      for (const tx of [-3.4, 3.4]) {
        const tbl = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.1), woodMat);
        tbl.position.set(tx, 1.1, c.d * 0.5 + 2.0);
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 0.7), darkWoodMat);
        leg.position.set(tx, 0.72, c.d * 0.5 + 2.0);
        grp.add(tbl, leg);
      }
    } else if (c.style === 'garage') {
      const gasTex = makeNeonSignTexture("RUSTY'S GAS & AUTO", '24H RURAL FUEL · REPAIRS', '#FF8A2A', maxAniso, false);
      const gasSign = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 1.5), new THREE.MeshStandardMaterial({ map: gasTex, emissive: 0xffffff, emissiveMap: gasTex, emissiveIntensity: 0.65 }));
      gasSign.position.set(0, c.h + 0.48, c.d * 0.5 + 0.22);
      grp.add(gasSign);
      // 2 Retro Red Gas Pumps on Fuel Island!
      const pumpRed = new THREE.MeshStandardMaterial({ color: 0xd62e2a, roughness: 0.36, metalness: 0.4 });
      for (const px of [-2.0, 2.0]) {
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.85, 0.65), pumpRed);
        pump.position.set(px, 1.48, c.d * 0.5 + 2.4);
        const dial = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.7), winGlowMat);
        dial.position.set(px, 1.92, c.d * 0.5 + 2.4);
        grp.add(pump, dial);
      }
    } else if (c.style === 'barn') {
      // Classic White X-Brace Double Barn Doors
      const bDoor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.8, 0.2), barnRedMat);
      bDoor.position.set(0, 2.52, c.d * 0.5 + 0.08);
      const x1 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 0.26), trimMat);
      x1.position.set(0, 2.52, c.d * 0.5 + 0.1); x1.rotation.z = 0.74;
      const x2 = x1.clone(); x2.rotation.z = -0.74;
      grp.add(bDoor, x1, x2);
    } else if (c.style === 'cottage') {
      // White Split-Rail Front Yard Fence Flanking Each Cottage
      for (const side of [-1, 1]) {
        const rail1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 0.10), trimMat);
        rail1.position.set(side * (c.w * 0.34), 0.92, c.d * 0.5 + 3.4);
        const rail2 = rail1.clone(); rail2.position.y = 0.52;
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), trimMat);
        p1.position.set(side * (c.w * 0.34 - 1.7), 0.55, c.d * 0.5 + 3.4);
        const p2 = p1.clone(); p2.position.x = side * (c.w * 0.34 + 1.7);
        grp.add(rail1, rail2, p1, p2);
      }
    }

    root.add(grp);
    // Exact Solid Box Collider covering full building + porch footprint!
    const frontSign = c.rot === 0 ? 1 : -1;
    boxColliders.push({
      minX: c.x - c.w * 0.5 - 0.65,
      maxX: c.x + c.w * 0.5 + 0.65,
      minZ: c.z - c.d * 0.5 - (frontSign < 0 ? porchDepth + 0.4 : 0.6),
      maxZ: c.z + c.d * 0.5 + (frontSign > 0 ? porchDepth + 0.4 : 0.6)
    });
    npcSpawns.push({
      x: c.x + (frontSign * 1.4),
      z: c.z + frontSign * (c.d * 0.5 + porchDepth + 2.4)
    });
  });

  // Extra Plaza Community NPC Spawns (around the Wishing Well & Diner!)
  npcSpawns.push(
    { x: wellX - 5.8, z: wellZ + 3.2 },
    { x: wellX + 6.2, z: wellZ - 2.8 }
  );

  // 4. Corrugated Steel Farm Grain Silo + Wooden Water Tower + Textured Woven Straw Hay Bales!
  const siloX = -442, siloZ = -1214;
  const siloY = getTerrainHeight(siloX, siloZ);
  const siloBody = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.65, 11.4, 18), siloMat);
  siloBody.position.set(siloX, siloY + 5.7, siloZ);
  const siloDome = new THREE.Mesh(new THREE.SphereGeometry(2.65, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), siloMat);
  siloDome.position.set(siloX, siloY + 11.4, siloZ);
  root.add(siloBody, siloDome);
  circleColliders.push({ x: siloX, z: siloZ, r: 2.85 });

  const wtX = -442, wtZ = -1178;
  const wtY = getTerrainHeight(wtX, wtZ);
  const wtTank = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 3.8, 16), woodMat);
  wtTank.position.set(wtX, wtY + 10.2, wtZ);
  const wtRoof = new THREE.Mesh(new THREE.ConeGeometry(2.95, 2.1, 16), roofMats[1]);
  wtRoof.position.set(wtX, wtY + 13.1, wtZ);
  root.add(wtTank, wtRoof);
  for (const [lx, lz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 8.6, 8), darkWoodMat);
    leg.position.set(wtX + lx, wtY + 4.3, wtZ + lz);
    root.add(leg);
  }
  circleColliders.push({ x: wtX, z: wtZ, r: 2.85 });

  // Textured Cylindrical Woven Straw Hay Bales
  for (const [hx, hz, hyaw] of [[-419, -1224, 0.3], [-416.5, -1225.2, 1.1], [-439, -1202, 0.7], [-436.5, -1203.5, 0.1]]) {
    const hy = getTerrainHeight(hx, hz);
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.88, 1.5, 12), hayMat);
    bale.rotation.z = Math.PI / 2;
    bale.rotation.y = hyaw;
    bale.position.set(hx, hy + 0.85, hz);
    root.add(bale);
    circleColliders.push({ x: hx, z: hz, r: 0.98 });
  }

  // 5. Lush Village Shade Oaks Framing the Community Yards (Textured Bark + Broadleaf Canopy!)
  const vTrunkMat = new THREE.MeshStandardMaterial({ map: pbr.bark.map, normalMap: pbr.bark.normalMap, color: 0x9b7a5e, roughness: 0.92 });
  const vOakMat = new THREE.MeshStandardMaterial({ map: pbr.oakFoliage.map, normalMap: pbr.oakFoliage.normalMap, color: 0x629648, roughness: 0.84 });
  const shadeTrees = [
    [-442, -1160], [-364, -1158], [-312, -1162], [-310, -1196],
    [-312, -1224], [-340, -1226], [-394, -1228], [-446, -1194]
  ];
  shadeTrees.forEach(([tx, tz], i) => {
    const ty = getTerrainHeight(tx, tz);
    const s = 0.88 + (i % 3) * 0.16;
    const trk = new THREE.Mesh(new THREE.CylinderGeometry(0.26 * s, 0.46 * s, 4.2 * s, 8), vTrunkMat);
    trk.position.set(tx, ty + 2.0 * s, tz);
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(3.1 * s, 1), vOakMat);
    crown.position.set(tx, ty + 5.2 * s, tz);
    root.add(trk, crown);
    circleColliders.push({ x: tx, z: tz, r: 0.62 * s });
  });

  return { root, boxColliders, circleColliders, npcSpawns };
}

/* ==========================================================================
   6. DEEP PINE & WOODLAND FOREST ("VICE PINES" — WEST/NW WILDERNESS!)
   - Upgraded with Realistic PBR Bark, Pine Needle, Broadleaf Oak, Meadow Grass
     & Cracked Granite Boulder Textures + Normal Maps + 100% Solid Colliders!
   ========================================================================== */
export function createPineForest(getTerrainHeight, closestMountainRoad, maxAniso = 4) {
  const root = new THREE.Group();
  const circleColliders = [];
  const pbr = getWorldPBRTextures(maxAniso);

  // Rich Textured Woodland Meadow & Moss Floor (X = -488..-360, Z = -1125..-950)
  const fGrassMap = pbr.grass.map.clone();
  fGrassMap.repeat.set(16, 22);
  fGrassMap.needsUpdate = true;
  const fGrassNorm = pbr.grass.normalMap.clone();
  fGrassNorm.repeat.set(16, 22);
  fGrassNorm.needsUpdate = true;
  const forestFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(132, 182),
    new THREE.MeshStandardMaterial({
      map: fGrassMap,
      normalMap: fGrassNorm,
      normalScale: new THREE.Vector2(1.25, 1.25),
      color: 0x6f985c,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -1
    })
  );
  forestFloor.rotation.x = -Math.PI / 2;
  forestFloor.position.set(-428, 0.045, -1036);
  forestFloor.receiveShadow = true;
  root.add(forestFloor);

  const pines = [];
  const oaks = [];
  const logs = [];
  const boulders = [];
  let seed = 8831;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  for (let i = 0; i < 250; i++) {
    const x = -486 + rand() * 124;
    const z = -1132 + rand() * 186;
    if (Math.abs(x + 384) < 12.8) continue;
    if (Math.abs(x + 480) < 12.8) continue;
    if (Math.abs(z + 1020) < 12.8 || Math.abs(z + 940) < 11.5) continue;
    if (closestMountainRoad && closestMountainRoad(x, z).dist < 12) continue;
    const y = getTerrainHeight(x, z);
    const s = 0.85 + rand() * 0.78;
    if (rand() < 0.68) {
      pines.push({ x, y, z, s, ry: rand() * 6.28, shade: rand() });
    } else {
      oaks.push({ x, y, z, s, ry: rand() * 6.28, shade: rand() });
    }
    circleColliders.push({ x, z, r: 0.68 * s });
  }

  for (let i = 0; i < 36; i++) {
    const x = -480 + rand() * 112;
    const z = -1122 + rand() * 164;
    if (Math.abs(x + 384) < 14 || Math.abs(x + 480) < 14) continue;
    if (Math.abs(z + 1020) < 13 || Math.abs(z + 940) < 12) continue;
    const y = getTerrainHeight(x, z);
    const sx = 1.1 + rand() * 1.9, sy = 0.7 + rand() * 1.1, sz = 1.1 + rand() * 1.9;
    boulders.push({ x, y, z, sx, sy, sz, ry: rand() * 6.28 });
    circleColliders.push({ x, z, r: Math.max(sx, sz) * 0.72 });
  }

  for (let i = 0; i < 16; i++) {
    const x = -476 + rand() * 102;
    const z = -1118 + rand() * 150;
    if (Math.abs(x + 384) < 14) continue;
    const y = getTerrainHeight(x, z);
    logs.push({ x, y, z, ry: rand() * Math.PI, len: 3.4 + rand() * 2.4 });
    circleColliders.push({ x, z, r: 1.2 });
  }

  const dObj = new THREE.Object3D();
  const trunkMat = new THREE.MeshStandardMaterial({
    map: pbr.bark.map,
    normalMap: pbr.bark.normalMap,
    normalScale: new THREE.Vector2(1.4, 1.4),
    color: 0xb28f72,
    roughness: 0.94
  });
  const pineLeafMat = new THREE.MeshStandardMaterial({
    map: pbr.pineNeedle.map,
    normalMap: pbr.pineNeedle.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3),
    color: 0xffffff,
    roughness: 0.86
  });
  const oakLeafMat = new THREE.MeshStandardMaterial({
    map: pbr.oakFoliage.map,
    normalMap: pbr.oakFoliage.normalMap,
    normalScale: new THREE.Vector2(1.3, 1.3),
    color: 0xffffff,
    roughness: 0.84
  });

  if (pines.length > 0) {
    const tInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.44, 4.2, 8), trunkMat, pines.length);
    const c1Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(3.1, 4.8, 9), pineLeafMat, pines.length);
    const c2Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(2.35, 4.1, 9), pineLeafMat, pines.length);
    const c3Inst = new THREE.InstancedMesh(new THREE.ConeGeometry(1.5, 3.2, 8), pineLeafMat, pines.length);
    const cols = [new THREE.Color(0x3a6f42), new THREE.Color(0x467f4a), new THREE.Color(0x52884c), new THREE.Color(0x387454)];
    const tmp = new THREE.Color();
    pines.forEach((p, i) => {
      dObj.rotation.set(0, p.ry, 0);
      dObj.scale.set(p.s, p.s, p.s);
      dObj.position.set(p.x, p.y + 1.9 * p.s, p.z); dObj.updateMatrix(); tInst.setMatrixAt(i, dObj.matrix);
      dObj.position.set(p.x, p.y + 4.5 * p.s, p.z); dObj.updateMatrix(); c1Inst.setMatrixAt(i, dObj.matrix);
      dObj.position.set(p.x, p.y + 6.9 * p.s, p.z); dObj.updateMatrix(); c2Inst.setMatrixAt(i, dObj.matrix);
      dObj.position.set(p.x, p.y + 9.0 * p.s, p.z); dObj.updateMatrix(); c3Inst.setMatrixAt(i, dObj.matrix);
      tmp.copy(cols[i % cols.length]).multiplyScalar(0.84 + p.shade * 0.28);
      c1Inst.setColorAt(i, tmp); c2Inst.setColorAt(i, tmp); c3Inst.setColorAt(i, tmp);
    });
    [tInst, c1Inst, c2Inst, c3Inst].forEach((im) => {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      root.add(im);
    });
  }

  if (oaks.length > 0) {
    const oTrk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.52, 4.0, 8), trunkMat, oaks.length);
    const oCan = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(3.2, 1), oakLeafMat, oaks.length);
    const oakCols = [new THREE.Color(0x5a8f46), new THREE.Color(0x6e9e4c), new THREE.Color(0x4e8242), new THREE.Color(0x7aa24a)];
    oaks.forEach((o, i) => {
      dObj.rotation.set(0, o.ry, 0);
      dObj.scale.set(o.s, o.s, o.s);
      dObj.position.set(o.x, o.y + 1.9 * o.s, o.z); dObj.updateMatrix(); oTrk.setMatrixAt(i, dObj.matrix);
      dObj.position.set(o.x, o.y + 5.2 * o.s, o.z); dObj.updateMatrix(); oCan.setMatrixAt(i, dObj.matrix);
      oCan.setColorAt(i, oakCols[i % oakCols.length]);
    });
    [oTrk, oCan].forEach((im) => {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
      root.add(im);
    });
  }

  if (boulders.length > 0) {
    const rockInst = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1.0, 1),
      new THREE.MeshStandardMaterial({
        map: pbr.granite.map,
        normalMap: pbr.granite.normalMap,
        normalScale: new THREE.Vector2(1.4, 1.4),
        color: 0x9b948a,
        roughness: 0.92
      }),
      boulders.length
    );
    boulders.forEach((b, i) => {
      dObj.position.set(b.x, b.y + b.sy * 0.32, b.z);
      dObj.rotation.set(0.2, b.ry, 0.15);
      dObj.scale.set(b.sx, b.sy, b.sz);
      dObj.updateMatrix();
      rockInst.setMatrixAt(i, dObj.matrix);
    });
    rockInst.instanceMatrix.needsUpdate = true;
    rockInst.computeBoundingSphere();
    root.add(rockInst);
  }

  logs.forEach((lg) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, lg.len, 8), trunkMat);
    m.rotation.z = Math.PI / 2;
    m.rotation.y = lg.ry;
    m.position.set(lg.x, lg.y + 0.34, lg.z);
    root.add(m);
  });

  return { root, circleColliders };
}

/* ==========================================================================
   7. ARTICULATED ANIMATED 3D WILDLIFE (DEER, BOAR, VILLAGE DOG, FLAMINGO)
   ========================================================================== */
export function createWildlifeAnimal(kind = 'deer') {
  const root = new THREE.Group();
  const legs = [];

  const shd = new THREE.Mesh(
    new THREE.PlaneGeometry(kind === 'flamingo' ? 0.7 : 1.35, kind === 'flamingo' ? 0.7 : 1.8),
    new THREE.MeshBasicMaterial({ map: makeContactShadowTexture(), transparent: true, opacity: 0.48, depthWrite: false })
  );
  shd.rotation.x = -Math.PI / 2;
  shd.position.y = 0.02;
  root.add(shd);

  const bodyGrp = new THREE.Group();
  root.add(bodyGrp);
  let headGrp = new THREE.Group();
  let tailMesh = null;

  if (kind === 'deer') {
    const coatMat = new THREE.MeshStandardMaterial({ color: 0xa47246, roughness: 0.85 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xdecbb0, roughness: 0.88 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xd8cdb8, roughness: 0.72 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x1e1a18, roughness: 0.45 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.30, 0.86, 6, 10), coatMat);
    torso.rotation.x = Math.PI / 2;
    torso.position.set(0, 1.05, 0);
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.88), bellyMat);
    belly.position.set(0, 0.82, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.56, 8), coatMat);
    neck.position.set(0, 1.38, -0.52);
    neck.rotation.x = -0.36;
    bodyGrp.add(torso, belly, neck);

    headGrp.position.set(0, 1.64, -0.66);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.44), coatMat);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.16), noseMat);
    snout.position.set(0, -0.02, -0.26);
    headGrp.add(skull, snout);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), coatMat);
      ear.position.set(sx * 0.15, 0.14, 0.08);
      ear.rotation.z = -sx * 0.65;
      const antlerMain = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.42, 6), antlerMat);
      antlerMain.position.set(sx * 0.12, 0.28, 0.02);
      antlerMain.rotation.z = -sx * 0.42;
      const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.22, 5), antlerMat);
      tine.position.set(sx * 0.22, 0.36, -0.06);
      tine.rotation.x = -0.45;
      headGrp.add(ear, antlerMain, tine);
    }
    bodyGrp.add(headGrp);

    tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.14), bellyMat);
    tailMesh.position.set(0, 1.12, 0.66);
    bodyGrp.add(tailMesh);

    for (const [lx, lz] of [[-0.17, -0.42], [0.17, -0.42], [-0.17, 0.42], [0.17, 0.42]]) {
      const piv = new THREE.Group();
      piv.position.set(lx, 0.92, lz);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.92, 7), coatMat);
      leg.position.y = -0.46;
      piv.add(leg);
      bodyGrp.add(piv);
      legs.push(piv);
    }
  } else if (kind === 'boar') {
    const boarMat = new THREE.MeshStandardMaterial({ color: 0x4c3a2e, roughness: 0.92 });
    const tuskMat = new THREE.MeshStandardMaterial({ color: 0xf4ecd8, roughness: 0.45 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.66, 6, 10), boarMat);
    torso.rotation.x = Math.PI / 2;
    torso.position.set(0, 0.56, 0);
    bodyGrp.add(torso);

    headGrp.position.set(0, 0.62, -0.54);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.44), boarMat);
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 8), new THREE.MeshStandardMaterial({ color: 0x76544a, roughness: 0.78 }));
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.04, -0.26);
    headGrp.add(skull, snout);
    for (const sx of [-0.12, 0.12]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.18, 6), tuskMat);
      tusk.position.set(sx, -0.02, -0.26);
      tusk.rotation.z = -Math.sign(sx) * 0.4;
      tusk.rotation.x = -0.35;
      headGrp.add(tusk);
    }
    bodyGrp.add(headGrp);

    for (const [lx, lz] of [[-0.2, -0.32], [0.2, -0.32], [-0.2, 0.34], [0.2, 0.34]]) {
      const piv = new THREE.Group();
      piv.position.set(lx, 0.44, lz);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.44, 7), boarMat);
      leg.position.y = -0.22;
      piv.add(leg);
      bodyGrp.add(piv);
      legs.push(piv);
    }
  } else if (kind === 'dog') {
    const furColors = [0xc88c48, 0x3b2e26, 0xe2d2b4, 0x865432];
    const furMat = new THREE.MeshStandardMaterial({ color: furColors[Math.floor(Math.random() * furColors.length)], roughness: 0.85 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0xff2e88, roughness: 0.4 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.52, 5, 8), furMat);
    torso.rotation.x = Math.PI / 2;
    torso.position.set(0, 0.48, 0);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 12), collarMat);
    collar.position.set(0, 0.56, -0.34);
    bodyGrp.add(torso, collar);

    headGrp.position.set(0, 0.64, -0.44);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.28), furMat);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.16), furMat);
    snout.position.set(0, -0.04, -0.18);
    headGrp.add(skull, snout);
    for (const sx of [-0.11, 0.11]) {
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.08), furMat);
      ear.position.set(sx, 0.08, 0.02);
      headGrp.add(ear);
    }
    bodyGrp.add(headGrp);

    tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.34, 6), furMat);
    tailMesh.position.set(0, 0.60, 0.42);
    tailMesh.rotation.x = 0.68;
    bodyGrp.add(tailMesh);

    for (const [lx, lz] of [[-0.12, -0.26], [0.12, -0.26], [-0.12, 0.26], [0.12, 0.26]]) {
      const piv = new THREE.Group();
      piv.position.set(lx, 0.42, lz);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.034, 0.42, 6), furMat);
      leg.position.y = -0.21;
      piv.add(leg);
      bodyGrp.add(piv);
      legs.push(piv);
    }
  } else {
    // Iconic Vice City Pink Flamingo!
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff62a4, roughness: 0.62 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0xf48cb4, roughness: 0.6 });
    const beakMat = new THREE.MeshStandardMaterial({ color: 0x1e1d22, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), pinkMat);
    body.scale.set(0.85, 0.9, 1.35);
    body.position.set(0, 0.92, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.68, 8), pinkMat);
    neck.position.set(0, 1.28, -0.22);
    neck.rotation.x = -0.24;
    headGrp.position.set(0, 1.62, -0.32);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), pinkMat);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.18, 6), beakMat);
    beak.rotation.x = -Math.PI * 0.72;
    beak.position.set(0, -0.04, -0.10);
    headGrp.add(skull, beak);
    bodyGrp.add(body, neck, headGrp);
    for (const lx of [-0.07, 0.07]) {
      const piv = new THREE.Group();
      piv.position.set(lx, 0.78, 0);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.78, 6), legMat);
      leg.position.y = -0.39;
      piv.add(leg);
      bodyGrp.add(piv);
      legs.push(piv);
    }
  }

  return { root, bodyGrp, headGrp, tailMesh, legs, kind };
}

/* ==========================================================================
   8. THE MALIBU CLUB — REBUILT FROM SCRATCH (90% GTA VICE CITY / SCARFACE
      BABYLON CLUB INSPIRED — STANDALONE STREAMLINE MODERNE EXTERIOR + LUSH
      2-LEVEL ENTERABLE DISCO INTERIOR, 5-PIECE STAGE BAND, VOLUMETRIC BEAMS,
      CURVED GLOSSY COCKTAIL BAR, CHECKERBOARD FLOOR & CEILING + VIP BALCONY!)
   ========================================================================== */
export function createMalibuClubBuilding(maxAniso = 4) {
  const root = new THREE.Group();
  const pbr = getWorldPBRTextures(maxAniso);

  // Dimensions: 26m wide (X: -13..+13) x 24m deep (Z: -12..+12) x 11m tall
  // Wide Open Double Doors on EAST wall (x = +13, z = -3.4..+3.4) facing Ocean Drive!
  const W = 26, D = 24, H = 11.2, t = 0.85;
  const hw = W * 0.5, hd = D * 0.5;

  const stuccoMat = new THREE.MeshStandardMaterial({
    map: pbr.concrete.map,
    normalMap: pbr.concrete.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    color: 0xf6ece4,
    roughness: 0.62,
    metalness: 0.04
  });
  const darkClubWallMat = new THREE.MeshStandardMaterial({
    color: 0x140a24,
    roughness: 0.52,
    metalness: 0.16,
    envMapIntensity: 1.2
  });
  const trimTealMat = new THREE.MeshStandardMaterial({ color: 0x16c8be, roughness: 0.28, metalness: 0.35 });
  const neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xff2e88 });
  const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x21e6d1 });
  const neonGoldMat = new THREE.MeshBasicMaterial({ color: 0xffd36b });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeef4fc, roughness: 0.10, metalness: 0.96, envMapIntensity: 2.0 });
  const velvetRedMat = new THREE.MeshStandardMaterial({ color: 0xa41236, roughness: 0.72 });
  const glassBlockMat = new THREE.MeshPhysicalMaterial({
    color: 0x62f4ea,
    emissive: 0x197074,
    emissiveIntensity: 0.55,
    roughness: 0.14,
    metalness: 0.15,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.82
  });

  // 1. GLOSSY REFLECTIVE NIGHTCLUB FLOOR + STREAMLINE MODERNE SHELL
  const floorMat = new THREE.MeshPhysicalMaterial({
    map: pbr.malibuFloor.map,
    normalMap: pbr.malibuFloor.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    color: 0x3b2658,
    roughness: 0.16,
    metalness: 0.22,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.8
  });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 1.4, 0.24, D + 1.4), floorMat);
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  root.add(floor);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 1.0, 0.7, D + 1.0), stuccoMat);
  roof.position.y = H + 0.35;
  roof.castShadow = true;
  root.add(roof);

  // Outer stucco / inner dark purple-black club walls (leaving wide 6.8m walk-in East opening!)
  const addWall = (w, h, d, x, y, z) => {
    const ext = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stuccoMat);
    ext.position.set(x, y, z);
    ext.castShadow = true;
    ext.receiveShadow = true;
    root.add(ext);
    const inn = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.1, w - 0.18), Math.max(0.1, h - 0.1), Math.max(0.1, d - 0.18)), darkClubWallMat);
    inn.position.set(x + (x > 0 ? -0.14 : x < 0 ? 0.14 : 0), y, z + (z > 0 ? -0.14 : z < 0 ? 0.14 : 0));
    root.add(inn);
  };
  addWall(t, H, D, -hw + t * 0.5, H * 0.5, 0);              // West back wall (behind concert stage)
  addWall(W, H, t, 0, H * 0.5, -hd + t * 0.5);              // North wall
  addWall(W, H, t, 0, H * 0.5,  hd - t * 0.5);              // South wall (behind cocktail bar)
  addWall(t, H, 8.6, hw - t * 0.5, H * 0.5, -hd + 4.3);     // East wall North wing
  addWall(t, H, 8.6, hw - t * 0.5, H * 0.5,  hd - 4.3);     // East wall South wing
  addWall(t, H - 4.6, 6.8, hw - t * 0.5, 4.6 + (H - 4.6) * 0.5, 0); // East lintel over wide VIP doorway

  // Iconic Streamline Moderne Art-Deco Curved Entrance Rotunda Tower + Glass Block Windows + Neon Rooflines
  const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, H + 2.8, 20, 1, false, -Math.PI * 0.4, Math.PI * 0.8), stuccoMat);
  rotunda.position.set(hw - 0.4, (H + 2.8) * 0.5, -hd + 3.2);
  const rotundaGlass = new THREE.Mesh(new THREE.CylinderGeometry(3.72, 3.72, 5.2, 16, 1, false, -Math.PI * 0.36, Math.PI * 0.72), glassBlockMat);
  rotundaGlass.position.set(hw - 0.35, 5.4, -hd + 3.2);
  root.add(rotunda, rotundaGlass);

  // Art-Deco Horizontal Neon Speed-Stripes wrapping the Malibu exterior
  for (const [ry, nMat] of [[H + 0.75, neonPinkMat], [H + 0.15, neonCyanMat], [4.9, neonPinkMat]]) {
    const eTube = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, D + 1.2), nMat);
    eTube.position.set(hw + 0.55, ry, 0);
    const nTube = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.16, 0.18), nMat);
    nTube.position.set(0, ry, -hd - 0.55);
    const sTube = nTube.clone(); sTube.position.z = hd + 0.55;
    root.add(eTube, nTube, sTube);
  }
  // Curved entrance canopy + huge glowing "THE MALIBU" Vice City Marquee Sign facing Ocean Drive (+X)
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.42, 9.2), stuccoMat);
  canopy.position.set(hw + 1.8, 4.75, 0);
  const canopyRim = new THREE.Mesh(new THREE.BoxGeometry(4.55, 0.16, 9.35), neonCyanMat);
  canopyRim.position.set(hw + 1.8, 4.98, 0);
  root.add(canopy, canopyRim);

  const marqueeTex = makeNeonSignTexture('THE MALIBU CLUB', 'VICE BEACH VIP · LIVE BAND & BAR', '#FF2E88', maxAniso, false);
  const marqueeMat = new THREE.MeshStandardMaterial({ map: marqueeTex, emissive: 0xffffff, emissiveMap: marqueeTex, emissiveIntensity: 1.35 });
  const marqueeBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 14.5), new THREE.MeshStandardMaterial({ color: 0x160a24, roughness: 0.4 }));
  marqueeBox.position.set(hw + 0.45, 7.8, 0);
  const marqueeFace = new THREE.Mesh(new THREE.PlaneGeometry(14.0, 2.8), marqueeMat);
  marqueeFace.rotation.y = Math.PI / 2;
  marqueeFace.position.set(hw + 0.78, 7.8, 0);
  root.add(marqueeBox, marqueeFace);

  // Exterior VIP Red Carpet + Gold Velvet Rope Stanchions
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 5.4), velvetRedMat);
  carpet.position.set(hw + 2.2, 0.08, 0);
  root.add(carpet);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf4c44e, roughness: 0.2, metalness: 0.94, envMapIntensity: 1.8 });
  for (const rz of [-3.1, 3.1]) {
    for (const rx of [hw + 0.8, hw + 2.8, hw + 4.8]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.09, 1.05, 8), goldMat);
      post.position.set(rx, 0.54, rz);
      root.add(post);
    }
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 4.0, 8), velvetRedMat);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(hw + 2.8, 0.84, rz);
    root.add(rope);
  }

  // 2. INTERIOR ANIMATED RGB CHECKERBOARD DANCEFLOOR + MATCHING ILLUMINATED CEILING GRID!
  const palette = [0xff2e88, 0x21e6d1, 0xffd36b, 0x9b5de5, 0xff6b35];
  const tileGeo = new THREE.PlaneGeometry(1.48, 1.48);
  tileGeo.rotateX(-Math.PI / 2);
  const ceilTileGeo = new THREE.PlaneGeometry(1.48, 1.48);
  ceilTileGeo.rotateX(Math.PI / 2);
  const tiles = [];
  for (let gx = 0; gx < 7; gx++) {
    for (let gz = 0; gz < 7; gz++) {
      const col = palette[(gx + gz) % palette.length];
      const fMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.82 });
      const fm = new THREE.Mesh(tileGeo, fMat);
      fm.position.set(-2.2 + gx * 1.56, 0.16, -4.68 + gz * 1.56);
      root.add(fm);
      tiles.push({ mesh: fm, phase: gx * 0.65 + gz * 0.85, baseIdx: (gx + gz) % palette.length });

      // Matching luminous checkerboard disco ceiling panel above the dancefloor!
      if ((gx + gz) % 2 === 0) {
        const cm = new THREE.Mesh(ceilTileGeo, fMat);
        cm.position.set(-2.2 + gx * 1.56, H - 0.18, -4.68 + gz * 1.56);
        root.add(cm);
      }
    }
  }

  // 3. ELEVATED CONCERT STAGE (West Side) WITH 5 COSTUMED BAND PERFORMERS (GTA VICE CITY VILLAGE PEOPLE HOMAGE!)
  const stageBase = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.25, 13.6), new THREE.MeshStandardMaterial({ color: 0x1e1032, roughness: 0.35, metalness: 0.25 }));
  stageBase.position.set(-hw + 4.0, 0.62, 0);
  const stageTrim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 13.7), neonPinkMat);
  stageTrim.position.set(-hw + 7.35, 1.24, 0);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 5.4), new THREE.MeshStandardMaterial({ map: marqueeTex, emissive: 0xffffff, emissiveMap: marqueeTex, emissiveIntensity: 0.95 }));
  backdrop.rotation.y = Math.PI / 2;
  backdrop.position.set(-hw + 1.02, 4.4, 0);
  root.add(stageBase, stageTrim, backdrop);

  // Stage Speaker Stacks & DJ Turntable Desk
  const spkMat = new THREE.MeshStandardMaterial({ color: 0x12131a, roughness: 0.65, metalness: 0.35 });
  for (const sz of [-5.8, 5.8]) {
    const stack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 1.6), spkMat);
    stack.position.set(-hw + 5.8, 2.85, sz);
    const woofer = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 14), neonCyanMat);
    woofer.rotation.z = Math.PI / 2;
    woofer.position.set(-hw + 6.52, 2.2, sz);
    root.add(stack, woofer);
  }

  // 4. SPINNING MIRRORED DISCO BALL + VOLUMETRIC SWEEPING SPOTLIGHT CONES + CLUB LIGHTING
  const discoPivot = new THREE.Group();
  discoPivot.position.set(2.4, H - 2.1, 0);
  const discoBall = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.85, 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.06, metalness: 1.0, flatShading: true, envMapIntensity: 2.5 })
  );
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), chromeMat);
  rod.position.y = 1.1;
  const beamConfigs = [
    { col: 0xff2e88, x:  2.2, z:  1.4, rz: -0.44, rx:  0.22 },
    { col: 0x21e6d1, x: -2.2, z: -1.4, rz:  0.44, rx: -0.22 },
    { col: 0xffd36b, x:  1.6, z: -2.1, rz: -0.32, rx: -0.36 },
    { col: 0x9b5de5, x: -1.6, z:  2.1, rz:  0.32, rx:  0.36 }
  ];
  beamConfigs.forEach((bc) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2.6, 8.8, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: bc.col, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    cone.position.set(bc.x, -4.1, bc.z);
    cone.rotation.set(bc.rx, 0, bc.rz);
    discoPivot.add(cone);
  });
  discoPivot.add(discoBall, rod);
  root.add(discoPivot);

  // Rich interior club mood point lights (pink stage wash + turquoise bar wash)
  const stageLight = new THREE.PointLight(0xff3b94, 18, 22, 1.4);
  stageLight.position.set(-4.0, 6.2, 0);
  const barLight = new THREE.PointLight(0x21e6d1, 14, 20, 1.4);
  barLight.position.set(3.5, 4.8, 7.5);
  root.add(stageLight, barLight);

  // 5. SLEEK CURVED GLOSSY COCKTAIL BAR (South Side) + BACKLIT BOTTLE WALL + CHROME STOOLS
  const barCounter = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 1.18, 1.25),
    new THREE.MeshPhysicalMaterial({ color: 0x241438, roughness: 0.16, metalness: 0.25, clearcoat: 1.0 })
  );
  barCounter.position.set(2.2, 0.65, hd - 3.6);
  const barTop = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.12, 1.42), trimTealMat);
  barTop.position.set(2.2, 1.26, hd - 3.6);
  const barNeon = new THREE.Mesh(new THREE.BoxGeometry(11.7, 0.08, 0.08), neonCyanMat);
  barNeon.position.set(2.2, 0.22, hd - 4.24);
  root.add(barCounter, barTop, barNeon);

  const bottleShelf = new THREE.Mesh(new THREE.BoxGeometry(10.8, 3.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x160b26, roughness: 0.45 }));
  bottleShelf.position.set(2.2, 2.2, hd - 1.15);
  root.add(bottleShelf);
  for (let b = 0; b < 18; b++) {
    const bt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.08, 0.42, 8),
      new THREE.MeshBasicMaterial({ color: palette[b % palette.length] })
    );
    bt.position.set(-2.6 + b * 0.56, 1.75 + (b % 3) * 0.62, hd - 1.42);
    root.add(bt);
  }
  for (let st = 0; st < 7; st++) {
    const sx = -2.3 + st * 1.5;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.24, 0.78, 10), chromeMat);
    leg.position.set(sx, 0.42, hd - 4.75);
    const cush = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.14, 12), velvetRedMat);
    cush.position.set(sx, 0.84, hd - 4.75);
    root.add(leg, cush);
  }

  // 6. UPPER VIP MEZZANINE BALCONY (North & South Galleries with Glowing Neon Railings & Booths!)
  const mezMat = new THREE.MeshStandardMaterial({ color: 0x1c1130, roughness: 0.45, metalness: 0.25 });
  const northMez = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.42, 4.4), mezMat);
  northMez.position.set(1.8, 5.2, -hd + 2.6);
  const northRail = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.10, 0.10), neonPinkMat);
  northRail.position.set(1.8, 6.35, -hd + 4.75);
  const southMez = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.42, 4.4), mezMat);
  southMez.position.set(1.8, 5.2, hd - 2.6);
  const southRail = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.10, 0.10), neonCyanMat);
  southRail.position.set(1.8, 6.35, hd - 4.75);
  root.add(northMez, northRail, southMez, southRail);
  for (let px = -5.8; px <= 9.2; px += 3.0) {
    const pN = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 5.1, 10), chromeMat);
    pN.position.set(px, 2.6, -hd + 4.6);
    const pS = pN.clone(); pS.position.z = hd - 4.6;
    root.add(pN, pS);
  }

  // 7. ANIMATED 5-MAN STAGE BAND + 18 LIVELY CLUB DANCERS (RGB FLOOR & VIP BALCONIES) + BARTENDER!
  const dancers = [];
  const skinTones = [0xdca47e, 0xc6865c, 0x8d5524, 0xf1c27d, 0xe0ac69, 0x6f4325];
  const hairCols = [0x1a1412, 0x3b2416, 0xd8a848, 0x8c2a1e, 0x16121a, 0xff2e88];
  const buildClubPerson = (x, y, z, yaw, shirtHex, pantsHex, hatHex, isStage, style = 0, skinIdx = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    const pSkin = new THREE.MeshStandardMaterial({ color: skinTones[skinIdx % skinTones.length], roughness: 0.58 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsHex, roughness: 0.72 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.52 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.45 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairCols[(skinIdx + style) % hairCols.length], roughness: 0.66 });

    const legL = new THREE.Group();
    legL.position.set(-0.10, 0.80, 0);
    const legLM = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.056, 0.76, 8), pantsMat);
    legLM.position.y = -0.38;
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.22), shoeMat);
    shoeL.position.set(0, -0.76, 0.04);
    legL.add(legLM, shoeL);

    const legR = new THREE.Group();
    legR.position.set(0.10, 0.80, 0);
    const legRM = legLM.clone();
    const shoeR = shoeL.clone();
    legR.add(legRM, shoeR);

    const upper = new THREE.Group();
    upper.position.y = 0.84;
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.20), pantsMat);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.54, 10), shirtMat);
    torso.scale.set(1.12, 1.0, 0.72);
    torso.position.y = 0.34;
    const head = new THREE.Group();
    head.position.y = 0.76;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), pSkin);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.142, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
    hair.position.set(0, 0.03, -0.01);
    head.add(skull, hair);
    if (hatHex) {
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.14, 10), new THREE.MeshStandardMaterial({ color: hatHex, roughness: 0.48 }));
      hat.position.y = 0.14;
      head.add(hat);
    }

    const armL = new THREE.Group();
    armL.position.set(-0.25, 0.54, 0);
    const armLM = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.040, 0.52, 8), pSkin);
    armLM.position.y = -0.24;
    armL.add(armLM);

    const armR = new THREE.Group();
    armR.position.set(0.25, 0.54, 0);
    const armRM = armLM.clone();
    armR.add(armRM);

    upper.add(hips, torso, head, armL, armR);
    g.add(legL, legR, upper);
    root.add(g);
    dancers.push({
      group: g, upper, head, armL, armR, legL, legR,
      baseX: x, baseY: y, baseZ: z, baseYaw: yaw,
      phase: dancers.length * 1.13, isDJ: isStage, style
    });
  };

  // Iconic 5-Piece Stage Band (Cowboy, Biker, Construction Hardhat, Sailor, Officer — facing +X dancefloor!)
  buildClubPerson(-hw + 4.4, 1.25, -4.0, Math.PI / 2, 0xc87432, 0x243b68, 0x6b3a1e, true, 0, 0);
  buildClubPerson(-hw + 4.7, 1.25, -2.0, Math.PI / 2, 0x1a1a22, 0x16161c, 0x18181f, true, 1, 1);
  buildClubPerson(-hw + 5.0, 1.25,  0.0, Math.PI / 2, 0xe87b22, 0x264478, 0xffd228, true, 2, 2);
  buildClubPerson(-hw + 4.7, 1.25,  2.0, Math.PI / 2, 0xf2f4f8, 0xf0f2f6, 0xffffff, true, 0, 3);
  buildClubPerson(-hw + 4.4, 1.25,  4.0, Math.PI / 2, 0x1d3b72, 0x14264a, 0x112040, true, 1, 4);

  // 14 Energetic Animated Club Dancers across the Illuminated RGB Dancefloor!
  const floorCrowd = [
    [-1.4, -3.4, -0.8, 0xff2e88, 0xf4f4f8, 0, 0],
    [ 0.6, -2.6, -1.2, 0x21e6d1, 0x1c2030, 1, 1],
    [ 3.4, -3.2, -2.1, 0xffd36b, 0x26324d, 2, 2],
    [ 5.6, -2.4, -2.4, 0xf460a8, 0xf4efe8, 3, 3],
    [-1.8, -0.6,  0.6, 0xff6b35, 0x1e202c, 1, 4],
    [ 0.2,  0.8, -1.5, 0x9b5de5, 0xf2e8dc, 0, 5],
    [ 4.2, -0.4,  2.8, 0x34e89e, 0x1b2434, 2, 0],
    [ 6.0,  0.6, -2.8, 0xff2e88, 0x202230, 3, 2],
    [-1.2,  2.8,  1.2, 0x21e6d1, 0xf5f0ea, 2, 3],
    [ 1.4,  3.4,  0.5, 0xffb84d, 0x1d3557, 0, 1],
    [ 3.8,  2.6,  2.4, 0xff4fa0, 0x181c2c, 1, 4],
    [ 5.8,  3.2,  2.9, 0x6ce5ff, 0x242038, 3, 5],
    [ 0.8, -4.4, -0.4, 0xe85dff, 0xf4f2ec, 1, 2],
    [ 4.4,  4.2,  2.1, 0xffd36b, 0x18263e, 2, 0]
  ];
  floorCrowd.forEach(([dx, dz, dyaw, sh, pa, st, sk]) => {
    buildClubPerson(dx, 0.16, dz, dyaw, sh, pa, null, false, st, sk);
  });

  // 4 VIP Balcony Dancers grooving along North & South Neon Mezzanines
  buildClubPerson(-1.2, 5.41, -hd + 3.8, 0,       0xff2e88, 0xf4f4f8, null, false, 1, 1);
  buildClubPerson( 3.6, 5.41, -hd + 3.8, 0.2,     0x21e6d1, 0x1a1e2c, null, false, 2, 4);
  buildClubPerson(-0.8, 5.41,  hd - 3.8, Math.PI, 0xffd36b, 0x22283a, null, false, 0, 2);
  buildClubPerson( 4.2, 5.41,  hd - 3.8, Math.PI, 0x9b5de5, 0xf2ece4, null, false, 3, 5);

  // Bartender behind the Cocktail Bar
  buildClubPerson(2.2, 0.16, hd - 2.3, Math.PI, 0xf4f6fa, 0x141620, null, true, 0, 0);

  // Glowing Center Dancefloor Ring showing player where to press [E] to Dance
  const danceSpotRing = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.38, 28),
    new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false })
  );
  danceSpotRing.rotation.x = -Math.PI / 2;
  danceSpotRing.position.set(2.3, 0.19, 0.0);
  root.add(danceSpotRing);

  // Hollow perimeter colliders in local building space (leaving wide 6.8m East entrance completely open!)
  const localColliders = [
    { minX: -hw, maxX: -hw + t, minZ: -hd, maxZ: hd },          // West wall
    { minX: -hw, maxX: hw, minZ: -hd, maxZ: -hd + t },          // North wall
    { minX: -hw, maxX: hw, minZ: hd - t, maxZ: hd },            // South wall
    { minX: hw - t, maxX: hw, minZ: -hd, maxZ: -3.4 },          // East North wing
    { minX: hw - t, maxX: hw, minZ:  3.4, maxZ: hd },           // East South wing
    { minX: -3.8, maxX: 8.2, minZ: hd - 4.3, maxZ: hd - 2.9 }   // Cocktail bar counter (solid!)
  ];

  return { root, discoPivot, tiles, dancers, danceSpotRing, palette, localColliders, W, D };
}

/* ==========================================================================
   9. NORTH POINT MALL — HUGE ENTERABLE 2-STORY GTA VICE CITY SHOPPING MALL!
      - 68m x 54m x 16.5m Walkable 2-Story H-Shaped Concourse
      - Barrel-Vaulted Glass Skylight Roof + Reflective Terrazzo Marble Floor
      - Wrap-Around 2nd Floor Mezzanine Balconies + Pedestrian Skybridge +
        Walkable Central Escalators
      - Centerpiece Tiered Marble Fountain + Indoor Palm Planters
      - North Atrium Charity Raffle Turntable with Spinning Pearl Infernus!
      - 8 Neon 1986 Storefronts: AMMU-NATION, VICE FOOD COURT, GASH, VINYL
        COUNTDOWN, TARBRUSH COFFEE, TOOLED UP, JOCKSPORT & SPRUNK MACHINES!
   ========================================================================== */
export function createNorthPointMall(maxAniso = 4) {
  const root = new THREE.Group();
  const pbr = getWorldPBRTextures(maxAniso);

  // Footprint: 68m wide (X: -34..+34) x 54m deep (Z: -27..+27) x 16.2m tall
  // Wide Open East Entrance (+X, z: -5.5..+5.5) directly off Ocean Drive + South Entrance (+Z, x: -5.5..+5.5)!
  const W = 68, D = 54, H = 15.8, t = 1.1;
  const hw = W * 0.5, hd = D * 0.5;

  const extPastelMat = new THREE.MeshStandardMaterial({
    map: pbr.concrete.map,
    normalMap: pbr.concrete.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    color: 0xf4dfd4, // Iconic GTA Vice City warm peach-cream mall stucco!
    roughness: 0.68
  });
  const extTealBandMat = new THREE.MeshStandardMaterial({ color: 0x1abbb4, roughness: 0.34, metalness: 0.22 });
  const extPinkBandMat = new THREE.MeshStandardMaterial({ color: 0xf0568e, roughness: 0.34, metalness: 0.18 });
  const interiorWallMat = new THREE.MeshStandardMaterial({ color: 0xf6ece0, roughness: 0.64 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeff5fc, roughness: 0.10, metalness: 0.96, envMapIntensity: 2.1 });
  const glassRailMat = new THREE.MeshPhysicalMaterial({
    color: 0xbef4f2,
    roughness: 0.06,
    metalness: 0.12,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.42,
    envMapIntensity: 2.0
  });
  const skylightMat = new THREE.MeshPhysicalMaterial({
    color: 0xdaf4ff,
    emissive: 0xffe0b8,
    emissiveIntensity: 0.26,
    roughness: 0.08,
    metalness: 0.12,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide
  });

  // 1. ULTRA-GLOSSY REFLECTIVE 1980s TERRAZZO MARBLE FLOOR
  const marbleFloorMat = new THREE.MeshPhysicalMaterial({
    map: pbr.terrazzoMarble.map,
    normalMap: pbr.terrazzoMarble.normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    color: 0xffffff,
    roughness: 0.14,
    metalness: 0.12,
    clearcoat: 0.95,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.95
  });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.28, D + 1.2), marbleFloorMat);
  floor.position.y = 0.02;
  floor.receiveShadow = true;
  root.add(floor);

  // 2. SOLID EXTERIOR WALLS WITH WIDE WALK-IN EAST (+X) & SOUTH (+Z) GLASS ATRIUM ENTRANCES
  const addMallWall = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), extPastelMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
  };
  addMallWall(t, H, D, -hw + t * 0.5, H * 0.5, 0);               // West wall
  addMallWall(W, H, t, 0, H * 0.5, -hd + t * 0.5);               // North wall
  // East wall with wide 11m open entrance facing Ocean Drive (z = -5.5..+5.5, height 6.4m)
  addMallWall(t, H, 21.5, hw - t * 0.5, H * 0.5, -hd + 10.75);
  addMallWall(t, H, 21.5, hw - t * 0.5, H * 0.5,  hd - 10.75);
  addMallWall(t, H - 6.4, 11.0, hw - t * 0.5, 6.4 + (H - 6.4) * 0.5, 0);
  // South wall with wide 11m open entrance (x = -5.5..+5.5, height 6.4m)
  addMallWall(28.5, H, t, -hw + 14.25, H * 0.5, hd - t * 0.5);
  addMallWall(28.5, H, t,  hw - 14.25, H * 0.5, hd - t * 0.5);
  addMallWall(11.0, H - 6.4, t, 0, 6.4 + (H - 6.4) * 0.5, hd - t * 0.5);

  // Pastel Art-Deco Exterior Stripe Bands + Entrance Glass Canopies + Huge Glowing "NORTH POINT MALL" Marquees!
  const bandE = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, D + 0.4), extTealBandMat);
  bandE.position.set(hw + 0.16, H - 1.4, 0);
  const bandS = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 1.2, 0.35), extTealBandMat);
  bandS.position.set(0, H - 1.4, hd + 0.16);
  const bandPinkE = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, D + 0.4), extPinkBandMat);
  bandPinkE.position.set(hw + 0.16, H - 2.6, 0);
  const bandPinkS = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.55, 0.35), extPinkBandMat);
  bandPinkS.position.set(0, H - 2.6, hd + 0.16);
  root.add(bandE, bandS, bandPinkE, bandPinkS);

  const mallSignTex = makeNeonSignTexture('NORTH POINT MALL', '2-STORY SHOPPING ATRIUM · ENTER FREE', '#21E6D1', maxAniso, false);
  const mallSignMat = new THREE.MeshStandardMaterial({ map: mallSignTex, emissive: 0xffffff, emissiveMap: mallSignTex, emissiveIntensity: 1.25 });
  const signE = new THREE.Mesh(new THREE.PlaneGeometry(24, 4.4), mallSignMat);
  signE.rotation.y = Math.PI / 2;
  signE.position.set(hw + 0.35, 11.4, 0);
  const signS = new THREE.Mesh(new THREE.PlaneGeometry(24, 4.4), mallSignMat);
  signS.position.set(0, 11.4, hd + 0.35);
  root.add(signE, signS);

  // 3. SOARING ARCHED BARREL-VAULTED GLASS SKYLIGHT ROOF + STRUCTURAL STEEL RIBS
  const roofSideN = new THREE.Mesh(new THREE.BoxGeometry(W, 0.8, 14), extPastelMat);
  roofSideN.position.set(0, H + 0.4, -hd + 7);
  const roofSideS = roofSideN.clone(); roofSideS.position.z = hd - 7;
  root.add(roofSideN, roofSideS);

  const skylightVault = new THREE.Mesh(new THREE.CylinderGeometry(13.2, 13.2, W - 2, 20, 1, true, 0, Math.PI), skylightMat);
  skylightVault.rotation.z = Math.PI / 2;
  skylightVault.position.set(0, H - 0.1, 0);
  root.add(skylightVault);
  for (let rx = -28; rx <= 28; rx += 7) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(13.1, 0.22, 8, 22, Math.PI), chromeMat);
    rib.rotation.y = Math.PI / 2;
    rib.position.set(rx, H - 0.1, 0);
    root.add(rib);
  }

  // Bright warm-daylight atrium point lights illuminating marble reflections & storefronts
  for (const [lx, lz, col] of [[-16, 0, 0xfff0d4], [0, 0, 0xfff4e0], [16, 0, 0xfff0d4], [-14, -14, 0xffe4f0], [14, 14, 0xd8fff8]]) {
    const pt = new THREE.PointLight(col, 24, 38, 1.35);
    pt.position.set(lx, 12.2, lz);
    root.add(pt);
  }

  // 4. WRAP-AROUND 2ND FLOOR MEZZANINE BALCONIES + CENTRAL PEDESTRIAN SKYBRIDGE + DUAL ESCALATORS!
  const mezY = 6.2;
  const mezN = new THREE.Mesh(new THREE.BoxGeometry(W - 2.4, 0.55, 11.5), interiorWallMat);
  mezN.position.set(0, mezY, -hd + 6.8);
  const mezS = mezN.clone(); mezS.position.z = hd - 6.8;
  const mezW = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.55, D - 24), interiorWallMat);
  mezW.position.set(-hw + 6.8, mezY, 0);
  const mezE = mezW.clone(); mezE.position.x = hw - 6.8;
  const skyBridge = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.55, D - 24), interiorWallMat);
  skyBridge.position.set(0, mezY, 0);
  root.add(mezN, mezS, mezW, mezE, skyBridge);

  // Glass & Chrome Mezzanine Balcony Railings + Neon Pink/Cyan Rim Accent Strips
  const addRail = (len, x, y, z, rotY = 0) => {
    const g = new THREE.Mesh(new THREE.BoxGeometry(len, 1.15, 0.10), glassRailMat);
    g.position.set(x, y + 0.85, z); g.rotation.y = rotY;
    const top = new THREE.Mesh(new THREE.BoxGeometry(len, 0.10, 0.16), chromeMat);
    top.position.set(x, y + 1.44, z); top.rotation.y = rotY;
    const neon = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.12), new THREE.MeshBasicMaterial({ color: rotY === 0 ? 0x21e6d1 : 0xff2e88 }));
    neon.position.set(x, y - 0.18, z); neon.rotation.y = rotY;
    root.add(g, top, neon);
  };
  addRail(W - 24, 0, mezY, -hd + 12.5, 0);
  addRail(W - 24, 0, mezY,  hd - 12.5, 0);
  addRail(D - 24, -hw + 12.5, mezY, 0, Math.PI / 2);
  addRail(D - 24,  hw - 12.5, mezY, 0, Math.PI / 2);
  addRail(D - 24, -3.3, mezY, 0, Math.PI / 2);
  addRail(D - 24,  3.3, mezY, 0, Math.PI / 2);

  // Dual Central Diagonal Escalators connecting Ground Concourse <-> 2nd Floor Balconies
  for (const [ex, ez, dir] of [[-7.2, -10.5, 1], [7.2, 10.5, -1]]) {
    const esc = new THREE.Group();
    esc.position.set(ex, 0.15, ez);
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.36, 12.2), new THREE.MeshStandardMaterial({ color: 0x3a404c, roughness: 0.42, metalness: 0.72 }));
    ramp.position.set(0, mezY * 0.5, 0);
    ramp.rotation.x = dir * -0.50;
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 12.4), glassRailMat);
    sideL.position.set(-1.32, mezY * 0.5 + 0.65, 0); sideL.rotation.x = dir * -0.50;
    const sideR = sideL.clone(); sideR.position.x = 1.32;
    esc.add(ramp, sideL, sideR);
    root.add(esc);
  }

  // 5. CENTERPIECE TIERED MARBLE ATRIUM FOUNTAIN + INDOOR TROPICAL PALM PLANTERS
  const fountain = new THREE.Group();
  fountain.position.set(11.5, 0.16, 0);
  const fRim = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 0.85, 24), interiorWallMat);
  fRim.position.y = 0.42;
  const fWater = new THREE.Mesh(
    new THREE.CylinderGeometry(3.9, 3.9, 0.12, 24),
    new THREE.MeshPhysicalMaterial({ color: 0x1be0d8, emissive: 0x0a5a66, emissiveIntensity: 0.45, roughness: 0.08, clearcoat: 1.0 })
  );
  fWater.position.y = 0.76;
  const fPed = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.15, 2.4, 16), interiorWallMat);
  fPed.position.y = 1.25;
  const fBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 0.7, 0.55, 18), interiorWallMat);
  fBowl.position.y = 2.45;
  const fountainSpray = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 2.1, 14, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9cf6ff, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  fountainSpray.position.y = 3.55;
  fountain.add(fRim, fWater, fPed, fBowl, fountainSpray);
  root.add(fountain);

  // Indoor Mall Palm Planters
  const trunkMat = new THREE.MeshStandardMaterial({ map: pbr.bark.map, color: 0x8a6c50, roughness: 0.9 });
  const frondMat = new THREE.MeshStandardMaterial({ color: 0x2f8a48, roughness: 0.72, side: THREE.DoubleSide });
  for (const [px, pz] of [[-18, -9], [-18, 9], [20, -9], [20, 9], [-6, 12], [6, -12]]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.95, 12), interiorWallMat);
    pot.position.set(px, 0.62, pz);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 5.4, 8), trunkMat);
    tr.position.set(px, 3.6, pz);
    root.add(pot, tr);
    for (let f = 0; f < 6; f++) {
      const ang = (f / 6) * Math.PI * 2;
      const fr = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 4), frondMat);
      fr.position.set(px + Math.cos(ang) * 0.9, 6.2, pz + Math.sin(ang) * 0.9);
      fr.rotation.set(Math.sin(ang) * 1.15, ang, -Math.cos(ang) * 1.15);
      root.add(fr);
    }
  }

  // 6. ICONIC CHARITY RAFFLE TURNTABLE WITH SPINNING PRISTINE PEARL INFERNUS SUPERCAR (West Atrium)!
  const raffleGroup = new THREE.Group();
  raffleGroup.position.set(-14.5, 0.16, 0);
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.0, 0.55, 28), new THREE.MeshStandardMaterial({ color: 0x1a1528, roughness: 0.28, metalness: 0.5 }));
  dais.position.y = 0.28;
  const daisNeon = new THREE.Mesh(new THREE.TorusGeometry(4.65, 0.08, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
  daisNeon.rotation.x = Math.PI / 2; daisNeon.position.y = 0.55;
  raffleGroup.add(dais, daisNeon);

  const raffleCar = new THREE.Group();
  raffleCar.position.y = 0.58;
  raffleCar.scale.setScalar(1.25);
  const pearlMat = new THREE.MeshPhysicalMaterial({ color: 0xfaf8ff, metalness: 0.72, roughness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.03, envMapIntensity: 2.5 });
  const rGlass = new THREE.MeshPhysicalMaterial({ color: 0x0b1628, metalness: 0.35, roughness: 0.04, clearcoat: 1.0, envMapIntensity: 2.3 });
  const rBody = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.56, 4.45), pearlMat);
  rBody.position.y = 0.52;
  const rNose = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.36, 1.25), pearlMat);
  rNose.position.set(0, 0.44, -2.12);
  rNose.rotation.x = 0.14;
  const rCab = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.46, 1.96), rGlass);
  rCab.position.set(0, 0.94, 0.14);
  const rWing = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.08, 0.34), pearlMat);
  rWing.position.set(0, 1.12, 1.96);
  const rHeadL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.10), new THREE.MeshBasicMaterial({ color: 0xe6ffff }));
  rHeadL.position.set(-0.62, 0.56, -2.72);
  const rHeadR = rHeadL.clone(); rHeadR.position.x = 0.62;
  const rTail = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.12, 0.10), new THREE.MeshBasicMaterial({ color: 0xff2244 }));
  rTail.position.set(0, 0.64, 2.24);
  raffleCar.add(rBody, rNose, rCab, rWing, rHeadL, rHeadR, rTail);
  const rTireMat = new THREE.MeshStandardMaterial({ color: 0x181920, roughness: 0.8 });
  for (const [wx, wz] of [[-1.0, -1.36], [1.0, -1.36], [-1.0, 1.36], [1.0, 1.36]]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 16), rTireMat);
    wh.rotation.z = Math.PI / 2; wh.position.set(wx, 0.36, wz);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.30, 12), chromeMat);
    rim.rotation.z = Math.PI / 2; rim.position.set(wx, 0.36, wz);
    raffleCar.add(wh, rim);
  }
  raffleGroup.add(raffleCar);
  root.add(raffleGroup);

  // 7. 8 ILLUMINATED 1986 VICE CITY STOREFRONTS (Ground & 2nd Floor) + SPRUNK VENDING MACHINES!
  const storeSpecs = [
    { name: 'AMMU-NATION',      sub: 'WEAPONS & BODY ARMOR', x: -18, z: -hd + 1.5, ry: 0,           col: '#FF3B4E', y: 0 },
    { name: 'VICE FOOD COURT',  sub: 'PIZZA · BURGERS · 100% HP', x: 0, z: -hd + 1.5, ry: 0,       col: '#FFD36B', y: 0 },
    { name: 'GASH FASHION',     sub: '1986 MIAMI STREETWEAR', x: 18,  z: -hd + 1.5, ry: 0,         col: '#FF2E88', y: 0 },
    { name: 'VINYL COUNTDOWN',  sub: 'RECORDS & CASSETTES',  x: -18,  z:  hd - 1.5, ry: Math.PI,   col: '#21E6D1', y: 0 },
    { name: 'TARBRUSH COFFEE',  sub: 'ESPRESSO & PASTRIES',  x:  18,  z:  hd - 1.5, ry: Math.PI,   col: '#FF8A2A', y: 0 },
    { name: 'TOOLED UP',        sub: 'HARDWARE & TOOLS',     x: -hw + 1.5, z: -12,  ry: Math.PI/2, col: '#FFD36B', y: 0 },
    { name: 'JOCKSPORT',        sub: 'PRO ATHLETIC GEAR',    x: -hw + 1.5, z:  12,  ry: Math.PI/2, col: '#21E6D1', y: 0 },
    { name: 'VICE ARCADE 86',   sub: 'UPPER LEVEL · OPEN',   x:  18,  z: -hd + 1.5, ry: 0,         col: '#9B5DE5', y: mezY }
  ];
  storeSpecs.forEach((st) => {
    const grp = new THREE.Group();
    grp.position.set(st.x, st.y, st.z);
    grp.rotation.y = st.ry;
    const tex = makeNeonSignTexture(st.name, st.sub, st.col, maxAniso, false);
    const sFace = new THREE.Mesh(
      new THREE.PlaneGeometry(11.4, 2.15),
      new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.15 })
    );
    sFace.position.set(0, 4.45, 0.25);
    const winGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(10.8, 3.2),
      new THREE.MeshPhysicalMaterial({ color: 0xffe6cc, emissive: 0x4a3552, emissiveIntensity: 0.45, roughness: 0.12, metalness: 0.2, clearcoat: 1.0 })
    );
    winGlass.position.set(0, 1.75, 0.12);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.05, 0.85), new THREE.MeshStandardMaterial({ color: 0x2a1f38, roughness: 0.35 }));
    counter.position.set(0, 0.54, 1.1);
    grp.add(sFace, winGlass, counter);
    root.add(grp);
  });

  // Glowing Green SPRUNK Vending Machines along Concourse Pillars
  const sprunkMat = new THREE.MeshStandardMaterial({ color: 0x22c852, emissive: 0x146e2e, emissiveIntensity: 0.55, roughness: 0.25 });
  for (const [vx, vz] of [[-8.5, -16], [8.5, -16], [-8.5, 16], [8.5, 16]]) {
    const vm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.85), sprunkMat);
    vm.position.set(vx, 1.24, vz);
    root.add(vm);
  }

  // 8. ANIMATED STROLLING MALL SHOPPERS INSIDE THE ATRIUM!
  const shoppers = [];
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdfa880, roughness: 0.58 });
  const shopperDefs = [
    { x: -10, z: -6, shirt: 0xff4c96, pants: 0xf4f2f8, axis: 'x', dir: 1, range: 16 },
    { x:  12, z:  6, shirt: 0x21e6d1, pants: 0x264478, axis: 'x', dir: -1, range: 16 },
    { x:  -4, z: 12, shirt: 0xffd36b, pants: 0x1e222e, axis: 'x', dir: 1, range: 14 },
    { x:   4, z: -12,shirt: 0x9b5de5, pants: 0xf2e8dc, axis: 'x', dir: -1, range: 14 },
    { x:  22, z:  0, shirt: 0xff7b2e, pants: 0x283a54, axis: 'z', dir: 1, range: 12 },
    { x: -24, z:  0, shirt: 0x38d88a, pants: 0x1e202c, axis: 'z', dir: -1, range: 12 }
  ];
  shopperDefs.forEach((sd, idx) => {
    const g = new THREE.Group();
    g.position.set(sd.x, 0.16, sd.z);
    const pantsMat = new THREE.MeshStandardMaterial({ color: sd.pants, roughness: 0.72 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: sd.shirt, roughness: 0.60 });
    const hairColors = [0x1c1410, 0x5c3a1e, 0xd4a44a, 0x261a16, 0x8a4622, 0x18141c];
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColors[idx % hairColors.length], roughness: 0.68 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xf4f2f8, roughness: 0.42 });
    for (const sx of [-0.095, 0.095]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.054, 0.76, 8), pantsMat);
      leg.position.set(sx, 0.41, 0);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.21), shoeMat);
      shoe.position.set(sx, 0.04, 0.04);
      g.add(leg, shoe);
    }
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.15, 0.19), pantsMat);
    hips.position.y = 0.82;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.52, 10), shirtMat);
    torso.scale.set(1.10, 1.0, 0.72);
    torso.position.y = 1.16;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), skinMat);
    head.position.y = 1.56;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.138, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.60), hairMat);
    hair.position.set(0, 1.59, -0.01);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.038, 0.48, 8), skinMat);
    armL.position.set(-0.24, 1.12, 0);
    const armR = armL.clone(); armR.position.x = 0.24;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.12), new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0xff2e88 : 0x21e6d1, roughness: 0.45 }));
    bag.position.set(0.28, 0.66, 0);
    g.add(hips, torso, head, hair, armL, armR, bag);
    root.add(g);
    shoppers.push({ group: g, baseX: sd.x, baseZ: sd.z, axis: sd.axis, dir: sd.dir, range: sd.range, phase: idx * 1.3 });
  });

  // Hollow perimeter colliders leaving wide 11m East & South glass atrium entrances completely walkable!
  const localColliders = [
    { minX: -hw, maxX: -hw + t, minZ: -hd, maxZ: hd },          // West wall
    { minX: -hw, maxX: hw, minZ: -hd, maxZ: -hd + t },          // North wall
    { minX: hw - t, maxX: hw, minZ: -hd, maxZ: -5.5 },          // East North wing
    { minX: hw - t, maxX: hw, minZ:  5.5, maxZ: hd },           // East South wing
    { minX: -hw, maxX: -5.5, minZ: hd - t, maxZ: hd },          // South West wing
    { minX:  5.5, maxX: hw, minZ: hd - t, maxZ: hd }            // South East wing
  ];

  return { root, raffleCar, shoppers, fountainSpray, localColliders, W, D };
}

export function createMalibuClubExtras(maxAniso = 4) {
  return createMalibuClubBuilding(maxAniso);
}

/* ==========================================================================
   10. OCEAN VIEW HOTEL — TRUE 2-STORY WALKABLE SAFEHOUSE (GROUND LOBBY +
       WALKABLE GRAND STAIRCASE + 1ST FLOOR PRIVATE SUITE: BED, TV, FOOD, WARDROBE!)
   ========================================================================== */
export function createOceanViewSafehouse(maxAniso = 4) {
  const root = new THREE.Group();
  const pbr = getWorldPBRTextures(maxAniso);

  // Footprint: D=16 (X: -8..+8), W=24 (Z: -12..+12), H=16.5 (2 playable floors + Art Deco roof crown)
  const D = 16, W = 24, H = 16.5, t = 0.7;
  const hd = D * 0.5, hw = W * 0.5;
  const floor1Y = 4.44; // Local 1st floor height (+0.16 world = 4.60m!)
  const ceilY = 9.15;

  const extMat = new THREE.MeshStandardMaterial({
    map: pbr.concrete.map, normalMap: pbr.concrete.normalMap, normalScale: new THREE.Vector2(0.5, 0.5),
    color: 0xf4e4d6, roughness: 0.62
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xfaf6f0, roughness: 0.42 });
  const suiteWallMat = new THREE.MeshStandardMaterial({
    color: 0xf6dcd4, roughness: 0.68, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
  const lobbyWallMat = new THREE.MeshStandardMaterial({
    color: 0xefe6da, roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
  const ceilPlasterMat = new THREE.MeshStandardMaterial({ color: 0xf7f2ea, roughness: 0.58 });
  const neonPink = new THREE.MeshBasicMaterial({ color: 0xff2e88 });
  const neonCyan = new THREE.MeshBasicMaterial({ color: 0x21e6d1 });
  const neonGold = new THREE.MeshBasicMaterial({ color: 0xffd36b });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x704022, roughness: 0.44 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x442412, roughness: 0.46 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xeec052, metalness: 0.9, roughness: 0.2, envMapIntensity: 1.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe6eef6, metalness: 0.92, roughness: 0.14 });
  const velvetTeal = new THREE.MeshStandardMaterial({ color: 0x169e98, roughness: 0.76 });
  const velvetPink = new THREE.MeshStandardMaterial({ color: 0xe63b82, roughness: 0.74 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x86d8f0, transparent: true, opacity: 0.28, roughness: 0.08, metalness: 0.15, depthWrite: false });

  // Ground Lobby Checkered Marble Floor (raised slightly + polygonOffset so it NEVER Z-fights with sidewalk!)
  const lc = document.createElement('canvas'); lc.width = 256; lc.height = 256;
  const lctx = lc.getContext('2d');
  for (let gx = 0; gx < 8; gx++) {
    for (let gy = 0; gy < 8; gy++) {
      lctx.fillStyle = (gx + gy) % 2 === 0 ? '#f3ebe0' : '#1b9496';
      lctx.fillRect(gx * 32, gy * 32, 32, 32);
    }
  }
  const lobbyTex = new THREE.CanvasTexture(lc);
  lobbyTex.colorSpace = THREE.SRGBColorSpace;
  lobbyTex.wrapS = lobbyTex.wrapT = THREE.RepeatWrapping;
  lobbyTex.repeat.set(3, 4);
  const lobbyFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(D - 1.2, W - 1.2),
    new THREE.MeshStandardMaterial({
      map: lobbyTex, roughness: 0.26, metalness: 0.12,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    })
  );
  lobbyFloor.rotation.x = -Math.PI / 2;
  lobbyFloor.position.y = 0.055;
  root.add(lobbyFloor);

  // Exterior Perimeter Shell Walls (West, North, South, East with Open Lobby Door & 1st-Floor Ocean Panorama Window)
  const backW = new THREE.Mesh(new THREE.BoxGeometry(t, H, W), extMat);
  backW.position.set(-hd + t * 0.5, H * 0.5, 0);
  const northW = new THREE.Mesh(new THREE.BoxGeometry(D - t * 2, H, t), extMat);
  northW.position.set(0, H * 0.5, -hw + t * 0.5);
  const southW = new THREE.Mesh(new THREE.BoxGeometry(D - t * 2, H, t), extMat);
  southW.position.set(0, H * 0.5, hw - t * 0.5);
  // East Wall Wings (Ground floor doorway open z: -3.2..+3.2, y: 0..4.05; 1st floor panoramic ocean window z: -3.2..+3.2, y: 5.50..8.45)
  const eastN = new THREE.Mesh(new THREE.BoxGeometry(t, H, hw - 3.2), extMat);
  eastN.position.set(hd - t * 0.5, H * 0.5, -hw + (hw - 3.2) * 0.5);
  const eastS = new THREE.Mesh(new THREE.BoxGeometry(t, H, hw - 3.2), extMat);
  eastS.position.set(hd - t * 0.5, H * 0.5, hw - (hw - 3.2) * 0.5);
  const eastLintel = new THREE.Mesh(new THREE.BoxGeometry(t, 1.45, 6.4), extMat);
  eastLintel.position.set(hd - t * 0.5, 4.775, 0);
  const eastTop = new THREE.Mesh(new THREE.BoxGeometry(t, H - 8.45, 6.4), extMat);
  eastTop.position.set(hd - t * 0.5, 8.45 + (H - 8.45) * 0.5, 0);
  const suiteWindow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.95, 6.32), glassMat);
  suiteWindow.position.set(hd - 0.35, 6.975, 0);
  // Crisp Art Deco doorway & window frame trim
  const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(t + 0.14, 0.18, 6.6), trimMat);
  doorFrameTop.position.set(hd - t * 0.5, 4.02, 0);
  const winFrameSill = new THREE.Mesh(new THREE.BoxGeometry(t + 0.16, 0.14, 6.6), trimMat);
  winFrameSill.position.set(hd - t * 0.5, 5.50, 0);
  const winFrameHead = new THREE.Mesh(new THREE.BoxGeometry(t + 0.16, 0.14, 6.6), trimMat);
  winFrameHead.position.set(hd - t * 0.5, 8.45, 0);
  root.add(backW, northW, southW, eastN, eastS, eastLintel, eastTop, suiteWindow, doorFrameTop, winFrameSill, winFrameHead);

  // Interior Warm Pastel Wallpaper Liners (cleanly offset 0.12m inside shell with polygonOffset -> ZERO Z-fighting!)
  const innerBack = new THREE.Mesh(new THREE.PlaneGeometry(W - t * 2 - 0.12, ceilY), suiteWallMat);
  innerBack.rotation.y = Math.PI / 2;
  innerBack.position.set(-hd + t + 0.12, ceilY * 0.5, 0);
  const innerSouth = new THREE.Mesh(new THREE.PlaneGeometry(D - t * 2 - 0.12, ceilY), lobbyWallMat);
  innerSouth.rotation.y = Math.PI;
  innerSouth.position.set(0, ceilY * 0.5, hw - t - 0.12);
  const innerNorth = new THREE.Mesh(new THREE.PlaneGeometry(D - t * 2 - 0.12, ceilY), lobbyWallMat);
  innerNorth.position.set(0, ceilY * 0.5, -hw + t + 0.12);
  const innerEastN = new THREE.Mesh(new THREE.PlaneGeometry(hw - 3.2 - t - 0.08, ceilY), lobbyWallMat);
  innerEastN.rotation.y = -Math.PI / 2;
  innerEastN.position.set(hd - t - 0.12, ceilY * 0.5, -hw + t + (hw - 3.2 - t) * 0.5);
  const innerEastS = new THREE.Mesh(new THREE.PlaneGeometry(hw - 3.2 - t - 0.08, ceilY), lobbyWallMat);
  innerEastS.rotation.y = -Math.PI / 2;
  innerEastS.position.set(hd - t - 0.12, ceilY * 0.5, hw - t - (hw - 3.2 - t) * 0.5);
  const suiteCeil = new THREE.Mesh(new THREE.BoxGeometry(D - t * 1.4, 0.42, W - t * 1.4), ceilPlasterMat);
  suiteCeil.position.set(0, ceilY + 0.21, 0);
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(D + 0.8, 0.8, W + 0.8), trimMat);
  roofSlab.position.set(0, H + 0.3, 0);
  root.add(innerBack, innerSouth, innerNorth, innerEastN, innerEastS, suiteCeil, roofSlab);

  // Iconic Art Deco Ocean View Facade Canopy, Separated Juliet Balcony, Neon Stripes & Glowing Marquee (ZERO overlap!)
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.26, 9.2), trimMat);
  canopy.position.set(hd + 1.7, 3.96, 0);
  const canopyNeon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 9.35), neonPink);
  canopyNeon.position.set(hd + 3.44, 3.96, 0);
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.8, 12.6), trimMat);
  parapet.position.set(hd - 0.2, H + 1.4, 0);
  const ovMarqueeTex = makeNeonSignTexture('OCEAN VIEW HOTEL', 'SAFEHOUSE · ROOM 101 UPSTAIRS', '#FF2E88', maxAniso, false);
  const ovMarquee = new THREE.Mesh(
    new THREE.PlaneGeometry(13.8, 2.6),
    new THREE.MeshStandardMaterial({ map: ovMarqueeTex, emissive: 0xffffff, emissiveMap: ovMarqueeTex, emissiveIntensity: 1.35 })
  );
  ovMarquee.rotation.y = Math.PI / 2;
  ovMarquee.position.set(hd + 0.22, 11.4, 0);
  // Exterior 1st-floor Juliet Balcony cleanly elevated at y = 5.34 (well above canopy at y = 3.96!)
  const balconySlab = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.22, 7.2), trimMat);
  balconySlab.position.set(hd + 0.82, 5.34, 0);
  const balconyRail = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 7.2), neonCyan);
  balconyRail.position.set(hd + 1.58, 6.26, 0);
  const balconyGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.78, 7.1), glassMat);
  balconyGlass.position.set(hd + 1.58, 5.82, 0);
  for (const ry of [H + 0.2, 9.55]) {
    const nLine = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, W + 0.4), ry > 12 ? neonPink : neonCyan);
    nLine.position.set(hd + 0.16, ry, 0);
    root.add(nLine);
  }
  root.add(canopy, canopyNeon, parapet, ovMarquee, balconySlab, balconyRail, balconyGlass);

  // --- GROUND FLOOR LOBBY: Reception Desk, Lounge Sofas, Ceiling Soffit & TRUE WALKABLE GRAND STAIRCASE ---
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.15, 6.4), woodMat);
  desk.position.set(-hd + 2.8, 0.58, 2.2);
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.12, 6.6), trimMat);
  deskTop.position.set(-hd + 2.8, 1.18, 2.2);
  const lobbySignTex = makeNeonSignTexture('OCEAN VIEW', 'SAFEHOUSE SUITE · STAIRS ↑', '#21E6D1', maxAniso, false);
  const lobbySign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.35), new THREE.MeshBasicMaterial({ map: lobbySignTex }));
  lobbySign.rotation.y = Math.PI / 2;
  lobbySign.position.set(-hd + 0.96, 2.85, 2.2);
  root.add(desk, deskTop, lobbySign);

  const sofaL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.72, 4.2), velvetTeal);
  sofaL.position.set(1.2, 0.36, 7.6);
  const sofaBackL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.05, 0.35), velvetTeal);
  sofaBackL.position.set(1.2, 0.72, 9.5);
  const tblL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.42, 1.1), goldMat);
  tblL.position.set(1.2, 0.21, 5.8);
  root.add(sofaL, sofaBackL, tblL);

  // Walkable Grand Staircase along North wall (z: -10.8..-7.6, rising East x=+4.2 -> West x=-4.6, y: 0..4.44)
  // Built with SOLID architectural risers underneath so players cannot walk under & clip through the stairs!
  const stairCarpet = new THREE.MeshStandardMaterial({ color: 0xb82458, roughness: 0.84 });
  const numSteps = 16;
  for (let s = 0; s < numSteps; s++) {
    const f = (s + 0.5) / numSteps;
    const sx = 4.2 - f * 8.8;
    const sy = ((s + 1) / numSteps) * floor1Y;
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.62, sy, 3.2), trimMat);
    step.position.set(sx, sy * 0.5, -9.2);
    const run = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 2.2), stairCarpet);
    run.position.set(sx, sy + 0.02, -9.2);
    root.add(step, run);
  }
  // Solid stair landing support pillar under the West upper landing (x: -7.1..-4.4, z: -11.1..-7.4)
  const underLanding = new THREE.Mesh(new THREE.BoxGeometry(2.75, floor1Y - 0.14, 3.65), lobbyWallMat);
  underLanding.position.set(-5.78, (floor1Y - 0.14) * 0.5, -9.25);
  root.add(underLanding);

  // Angled Brass Stair Handrail + Vertical Newel Posts
  const stairRail = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 10.1, 10), goldMat);
  stairRail.rotation.z = Math.atan2(floor1Y, 8.8) + Math.PI / 2;
  stairRail.position.set(-0.2, floor1Y * 0.5 + 0.92, -7.52);
  root.add(stairRail);
  for (let p = 0; p <= 4; p++) {
    const pf = p / 4;
    const px = 4.2 - pf * 8.8;
    const py = pf * floor1Y;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.95, 8), goldMat);
    post.position.set(px, py + 0.48, -7.52);
    root.add(post);
  }

  // --- 1ST FLOOR PRIVATE SAFEHOUSE SUITE (y = 4.44 local / 4.60 world) ---
  const wc = document.createElement('canvas'); wc.width = 256; wc.height = 256;
  const wctx = wc.getContext('2d');
  wctx.fillStyle = '#8b5a34'; wctx.fillRect(0, 0, 256, 256);
  for (let py = 0; py < 256; py += 16) {
    wctx.fillStyle = py % 32 === 0 ? '#9c683e' : '#7b4e2c';
    wctx.fillRect(0, py, 256, 14);
    wctx.fillStyle = 'rgba(35,18,8,0.35)';
    wctx.fillRect(0, py + 14, 256, 2);
  }
  const woodFloorTex = new THREE.CanvasTexture(wc);
  woodFloorTex.colorSpace = THREE.SRGBColorSpace;
  woodFloorTex.wrapS = woodFloorTex.wrapT = THREE.RepeatWrapping;
  woodFloorTex.repeat.set(4, 5);
  const suiteFloorMat = new THREE.MeshStandardMaterial({ map: woodFloorTex, roughness: 0.42 });

  // Main Suite Deck (z: -7.2..+11.2, x: -7.2..+7.2) + West Stair Landing (x: -7.2..-4.4, z: -11.2..-7.2)
  const deckMain = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.24, 18.4), suiteFloorMat);
  deckMain.position.set(0, floor1Y - 0.12, 2.0);
  // Crisp white lobby ceiling soffit underneath deckMain so downstairs lobby looks bright & finished!
  const lobbyCeil = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.08, 18.3), ceilPlasterMat);
  lobbyCeil.position.set(0, floor1Y - 0.28, 2.0);
  const deckLand = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.24, 4.1), suiteFloorMat);
  deckLand.position.set(-5.78, floor1Y - 0.12, -9.2);
  // Full-Width Stairwell Brass & Glass Safety Railing along z = -7.25 from landing (-4.3) all the way to East wall (+7.2)!
  const railLen = 11.5;
  const railCx = -4.3 + railLen * 0.5;
  const wellRail = new THREE.Mesh(new THREE.BoxGeometry(railLen, 0.08, 0.08), goldMat);
  wellRail.position.set(railCx, floor1Y + 0.96, -7.25);
  const wellGlass = new THREE.Mesh(new THREE.BoxGeometry(railLen, 0.88, 0.06), glassMat);
  wellGlass.position.set(railCx, floor1Y + 0.48, -7.25);
  root.add(deckMain, lobbyCeil, deckLand, wellRail, wellGlass);
  for (let rx = -4.2; rx <= 7.0; rx += 2.2) {
    const rPost = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.96, 8), goldMat);
    rPost.position.set(rx, floor1Y + 0.48, -7.25);
    root.add(rPost);
  }

  // Suite Welcome Plaque facing top of stairs
  const suiteTitleTex = makeNeonSignTexture('ROOM 101 · SAFEHOUSE', 'SLEEP · WATCH TV · EAT · WARDROBE', '#FF2E88', maxAniso, false);
  const suiteTitle = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 1.25), new THREE.MeshBasicMaterial({ map: suiteTitleTex }));
  suiteTitle.position.set(-1.2, floor1Y + 3.0, -hw + 0.96);
  root.add(suiteTitle);

  // 1) KING-SIZED BED (West-South corner: local (-5.0, floor1Y, +6.6))
  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.45, 3.2), darkWoodMat);
  bedFrame.position.set(-5.0, floor1Y + 0.22, 6.6);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.36, 3.0), new THREE.MeshStandardMaterial({ color: 0xf8f4ee, roughness: 0.78 }));
  mattress.position.set(-5.0, floor1Y + 0.58, 6.6);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.39, 3.06), velvetTeal);
  blanket.position.set(-4.42, floor1Y + 0.60, 6.6);
  const blanketTrim = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.40, 3.08), velvetPink);
  blanketTrim.position.set(-5.65, floor1Y + 0.60, 6.6);
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.55, 3.4), darkWoodMat);
  headboard.position.set(-6.92, floor1Y + 0.82, 6.6);
  for (const pz of [5.85, 7.35]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 1.05), new THREE.MeshStandardMaterial({ color: 0xfff8f2, roughness: 0.85 }));
    pil.position.set(-6.32, floor1Y + 0.86, pz);
    root.add(pil);
  }
  for (const nz of [4.3, 8.9]) {
    const ns = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 0.85), woodMat);
    ns.position.set(-6.45, floor1Y + 0.36, nz);
    const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.32, 10), goldMat);
    lBase.position.set(-6.45, floor1Y + 0.88, nz);
    const lShade = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 0.28, 12), new THREE.MeshBasicMaterial({ color: 0xffe4a8 }));
    lShade.position.set(-6.45, floor1Y + 1.12, nz);
    root.add(ns, lBase, lShade);
  }
  root.add(bedFrame, mattress, blanket, blanketTrim, headboard);

  // 2) 1986 RETRO CRT TV + MEDIA CONSOLE + PLUSH LOUNGE SOFA (South-East area)
  const tvConsole = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.78, 3.2), darkWoodMat);
  tvConsole.position.set(5.9, floor1Y + 0.39, 7.6);
  const tvBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.08, 1.48), new THREE.MeshStandardMaterial({ color: 0x222028, roughness: 0.42 }));
  tvBody.position.set(5.9, floor1Y + 1.32, 7.6);
  const tvScreenMat = new THREE.MeshStandardMaterial({
    color: 0x123842, emissive: 0x21e6d1, emissiveIntensity: 0.85, roughness: 0.22
  });
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.82), tvScreenMat);
  tvScreen.rotation.y = -Math.PI / 2;
  tvScreen.position.set(5.38, floor1Y + 1.34, 7.6);
  const vcr = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.95), new THREE.MeshStandardMaterial({ color: 0x161820, metalness: 0.4, roughness: 0.35 }));
  vcr.position.set(5.85, floor1Y + 0.86, 6.25);
  // Plush Lounge Sofa facing TV + Coffee Table cleanly positioned so TV ring has wide open floor space!
  const loungeSofa = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.62, 3.5), velvetPink);
  loungeSofa.position.set(1.25, floor1Y + 0.31, 7.8);
  const loungeBack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.02, 3.5), velvetPink);
  loungeBack.position.set(0.74, floor1Y + 0.72, 7.8);
  const coffeeTbl = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.42, 2.0), woodMat);
  coffeeTbl.position.set(4.15, floor1Y + 0.21, 7.8);
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 4.6),
    new THREE.MeshStandardMaterial({
      color: 0x1c7a86, roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(3.2, floor1Y + 0.025, 7.6);
  root.add(tvConsole, tvBody, tvScreen, vcr, loungeSofa, loungeBack, coffeeTbl, rug);

  // 3) KITCHENETTE & DINING TABLE LOADED WITH FOOD (Pizza, Burger, Sprunk Cans, Fridge!)
  const kitchenCounter = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.02, 4.6), trimMat);
  kitchenCounter.position.set(6.2, floor1Y + 0.51, -1.2);
  const fridge = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.15, 1.25), chromeMat);
  fridge.position.set(6.2, floor1Y + 1.08, -4.3);
  const dineTable = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 2.7), woodMat);
  dineTable.position.set(3.8, floor1Y + 0.84, -0.4);
  for (const [lx, lz] of [[3.0, -1.45], [4.6, -1.45], [3.0, 0.65], [4.6, 0.65]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.84, 8), darkWoodMat);
    leg.position.set(lx, floor1Y + 0.42, lz);
    root.add(leg);
  }
  const pizzaBox = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.07, 0.68), new THREE.MeshStandardMaterial({ color: 0xe6d4b6, roughness: 0.7 }));
  pizzaBox.position.set(3.75, floor1Y + 0.94, -0.95);
  const pizzaPie = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 14), new THREE.MeshStandardMaterial({ color: 0xe89c34, roughness: 0.55 }));
  pizzaPie.position.set(3.75, floor1Y + 0.99, -0.95);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.20, 0.03, 14), trimMat);
  plate.position.set(3.85, floor1Y + 0.92, 0.15);
  const burger = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xc87834, roughness: 0.62 }));
  burger.position.set(3.85, floor1Y + 0.99, 0.15);
  const sprunkA = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.16, 10), new THREE.MeshStandardMaterial({ color: 0x22d864, metalness: 0.5, roughness: 0.25 }));
  sprunkA.position.set(3.35, floor1Y + 0.98, -0.15);
  const sprunkB = sprunkA.clone(); sprunkB.position.set(3.52, floor1Y + 0.98, 0.42);
  root.add(kitchenCounter, fridge, dineTable, pizzaBox, pizzaPie, plate, burger, sprunkA, sprunkB);

  // 4) WALK-IN SAFEHOUSE WARDROBE CLOSET (West Wall: local (-6.6, floor1Y, -1.8))
  const wardFrame = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.55, 3.2), darkWoodMat);
  wardFrame.position.set(-6.65, floor1Y + 1.28, -1.8);
  const wardMirror = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.1), new THREE.MeshStandardMaterial({ color: 0xcceeff, metalness: 0.95, roughness: 0.06 }));
  wardMirror.rotation.y = Math.PI / 2;
  wardMirror.position.set(-6.04, floor1Y + 1.32, -1.8);
  const wardSignTex = makeNeonSignTexture('WARDROBE', 'CHANGE OUTFITS [E]', '#FFD36B', maxAniso, false);
  const wardSign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.68), new THREE.MeshBasicMaterial({ map: wardSignTex }));
  wardSign.rotation.y = Math.PI / 2;
  wardSign.position.set(-6.04, floor1Y + 2.95, -1.8);
  root.add(wardFrame, wardMirror, wardSign);

  // Glowing Interactive Floor Rings for all 4 Upstairs Suite Activities (100% Unobstructed Open Floor!)
  const stationDefs = [
    { id: 'sleep',    label: 'Sleep in Bed (+6h · Full HP)',     lx: -2.0, lz:  6.6, col: 0x21e6d1 },
    { id: 'tv',       label: 'Watch Vice-O-Vision TV',           lx:  2.7, lz:  7.8, col: 0xff2e88 },
    { id: 'food',     label: 'Eat Meal (+45 HP · +25 Armor)',    lx:  1.7, lz: -0.4, col: 0xffd36b },
    { id: 'wardrobe', label: 'Open Safehouse Wardrobe',          lx: -4.5, lz: -1.8, col: 0x9b5de5 }
  ];
  const stationRings = [];
  stationDefs.forEach((st) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 0.94, 24),
      new THREE.MeshBasicMaterial({
        color: st.col, transparent: true, opacity: 0.86, side: THREE.DoubleSide,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(st.lx, floor1Y + 0.06, st.lz);
    root.add(ring);
    stationRings.push(ring);
  });

  // Warm Interior Lighting (Ground Lobby + 1st Floor Private Suite)
  const lobbyLight = new THREE.PointLight(0xffeed4, 14, 20, 1.35);
  lobbyLight.position.set(0, 3.55, 1.5);
  const suiteLight = new THREE.PointLight(0xffdfc4, 18, 24, 1.25);
  suiteLight.position.set(0, floor1Y + 3.7, 2.2);
  root.add(lobbyLight, suiteLight);

  // Hollow perimeter colliders leaving wide 6.4m East doorway completely open!
  const localColliders = [
    { minX: -hd, maxX: -hd + t + 0.12, minZ: -hw, maxZ: hw },
    { minX: -hd, maxX: hd, minZ: -hw, maxZ: -hw + t + 0.12 },
    { minX: -hd, maxX: hd, minZ: hw - t - 0.12, maxZ: hw },
    { minX: hd - t - 0.12, maxX: hd, minZ: -hw, maxZ: -3.2 },
    { minX: hd - t - 0.12, maxX: hd, minZ:  3.2, maxZ: hw }
  ];

  return { root, floor1Y, tvScreenMat, stationDefs, stationRings, localColliders, W, D };
}

/* ==========================================================================
   11. WALK-IN BARBER SHOP (SPINNING HELICAL BARBER POLES + 3 HYDRAULIC CHAIRS + MIRRORS!)
   ========================================================================== */
export function createBarberShopBuilding(maxAniso = 4, title = 'VICE CUTS BARBER', accentHex = '#21E6D1') {
  const root = new THREE.Group();
  const pbr = getWorldPBRTextures(maxAniso);
  const D = 14, W = 17, H = 7.6, t = 0.65;
  const hd = D * 0.5, hw = W * 0.5;
  const accentNum = parseInt(accentHex.replace('#', ''), 16) || 0x21e6d1;

  const wallMat = new THREE.MeshStandardMaterial({ map: pbr.concrete.map, color: 0xf4eee8, roughness: 0.64 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x16243a, roughness: 0.36, metalness: 0.25 });
  const neonMat = new THREE.MeshBasicMaterial({ color: accentNum });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeef5fc, metalness: 0.94, roughness: 0.12, envMapIntensity: 1.8 });
  const leatherRed = new THREE.MeshStandardMaterial({ color: 0xb81e36, roughness: 0.42 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c341d, roughness: 0.46 });
  const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xd0eeff, metalness: 0.96, roughness: 0.05 });

  // Black & White Classic Barber Checkerboard Floor
  const fc = document.createElement('canvas'); fc.width = 256; fc.height = 256;
  const fctx = fc.getContext('2d');
  for (let gx = 0; gx < 8; gx++) {
    for (let gy = 0; gy < 8; gy++) {
      fctx.fillStyle = (gx + gy) % 2 === 0 ? '#f4f2ee' : '#181a24';
      fctx.fillRect(gx * 32, gy * 32, 32, 32);
    }
  }
  const fTex = new THREE.CanvasTexture(fc);
  fTex.colorSpace = THREE.SRGBColorSpace;
  fTex.wrapS = fTex.wrapT = THREE.RepeatWrapping;
  fTex.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(D - 0.6, W - 0.6), new THREE.MeshStandardMaterial({ map: fTex, roughness: 0.25 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.04;
  root.add(floor);

  // Hollow Walls + Roof (Wide 5.8m East entrance facing Ocean Drive!)
  const backW = new THREE.Mesh(new THREE.BoxGeometry(t, H, W), wallMat); backW.position.set(-hd + t * 0.5, H * 0.5, 0);
  const northW = new THREE.Mesh(new THREE.BoxGeometry(D, H, t), wallMat); northW.position.set(0, H * 0.5, -hw + t * 0.5);
  const southW = new THREE.Mesh(new THREE.BoxGeometry(D, H, t), wallMat); southW.position.set(0, H * 0.5, hw - t * 0.5);
  const eastN = new THREE.Mesh(new THREE.BoxGeometry(t, H, hw - 2.9), wallMat); eastN.position.set(hd - t * 0.5, H * 0.5, -hw + (hw - 2.9) * 0.5);
  const eastS = new THREE.Mesh(new THREE.BoxGeometry(t, H, hw - 2.9), wallMat); eastS.position.set(hd - t * 0.5, H * 0.5, hw - (hw - 2.9) * 0.5);
  const eastTop = new THREE.Mesh(new THREE.BoxGeometry(t, H - 4.0, 5.8), wallMat); eastTop.position.set(hd - t * 0.5, 4.0 + (H - 4.0) * 0.5, 0);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(D + 0.6, 0.55, W + 0.6), trimMat); roof.position.set(0, H + 0.26, 0);
  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.32, W - 0.8), trimMat); awning.position.set(hd + 1.15, 4.15, 0);
  const awningNeon = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.14, W - 0.6), neonMat); awningNeon.position.set(hd + 1.15, 4.36, 0);
  root.add(backW, northW, southW, eastN, eastS, eastTop, roof, awning, awningNeon);

  // Neon Marquee Sign
  const signTex = makeNeonSignTexture(title, 'HAIRCUTS · FADES · STYLING [E]', accentHex, maxAniso, false);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(12.2, 2.2),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.35 })
  );
  signMesh.rotation.y = Math.PI / 2;
  signMesh.position.set(hd + 0.2, 6.0, 0);
  root.add(signMesh);

  // Twin Spinning Helical Red-White-Blue Barber Poles flanking the Entrance!
  const pc = document.createElement('canvas'); pc.width = 128; pc.height = 128;
  const pctx = pc.getContext('2d');
  pctx.fillStyle = '#ffffff'; pctx.fillRect(0, 0, 128, 128);
  for (let i = -2; i < 6; i++) {
    pctx.fillStyle = i % 2 === 0 ? '#e6243a' : '#1858d6';
    pctx.beginPath();
    pctx.moveTo(i * 44, 0); pctx.lineTo(i * 44 + 18, 0);
    pctx.lineTo(i * 44 + 146, 128); pctx.lineTo(i * 44 + 128, 128);
    pctx.closePath(); pctx.fill();
  }
  const poleTex = new THREE.CanvasTexture(pc);
  poleTex.colorSpace = THREE.SRGBColorSpace;
  poleTex.wrapS = poleTex.wrapT = THREE.RepeatWrapping;
  const poleMat = new THREE.MeshStandardMaterial({ map: poleTex, roughness: 0.2, metalness: 0.1 });
  const barberPoles = [];
  for (const pz of [-3.5, 3.5]) {
    const capT = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), chromeMat);
    capT.position.set(hd + 0.42, 3.25, pz);
    const capB = capT.clone(); capB.position.y = 1.65;
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 1.55, 16), poleMat);
    cyl.position.set(hd + 0.42, 2.45, pz);
    root.add(capT, capB, cyl);
    barberPoles.push(cyl);
  }

  // Interior: Grooming Counter + 3 Backlit Mirrors + 3 Hydraulic Chrome/Red Leather Barber Chairs!
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.92, 12.6), woodMat);
  counter.position.set(-hd + 1.25, 0.46, 0);
  root.add(counter);
  for (const cz of [-4.0, 0.0, 4.0]) {
    const mFrame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.2, 2.6), chromeMat);
    mFrame.position.set(-hd + 0.78, 2.35, cz);
    const mGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.95), mirrorMat);
    mGlass.rotation.y = Math.PI / 2;
    mGlass.position.set(-hd + 0.87, 2.35, cz);
    // Hydraulic Barber Chair
    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.10, 14), chromeMat);
    cBase.position.set(-hd + 3.4, 0.08, cz);
    const cStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.56, 10), chromeMat);
    cStem.position.set(-hd + 3.4, 0.36, cz);
    const cSeat = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.18, 0.82), leatherRed);
    cSeat.position.set(-hd + 3.4, 0.68, cz);
    const cBack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.82), leatherRed);
    cBack.position.set(-hd + 3.78, 1.15, cz);
    const cFoot = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.65), chromeMat);
    cFoot.position.set(-hd + 2.86, 0.34, cz);
    root.add(mFrame, mGlass, cBase, cStem, cSeat, cBack, cFoot);
  }
  // Glowing Haircut Interaction Ring
  const shopRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.32, 24),
    new THREE.MeshBasicMaterial({ color: accentNum, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false })
  );
  shopRing.rotation.x = -Math.PI / 2;
  shopRing.position.set(0.2, 0.08, 0);
  const intLight = new THREE.PointLight(0xfff0dc, 14, 18, 1.3);
  intLight.position.set(0, 5.2, 0);
  root.add(shopRing, intLight);

  const localColliders = [
    { minX: -hd, maxX: -hd + t + 0.1, minZ: -hw, maxZ: hw },
    { minX: -hd, maxX: hd, minZ: -hw, maxZ: -hw + t + 0.1 },
    { minX: -hd, maxX: hd, minZ: hw - t - 0.1, maxZ: hw },
    { minX: hd - t - 0.1, maxX: hd, minZ: -hw, maxZ: -2.9 },
    { minX: hd - t - 0.1, maxX: hd, minZ:  2.9, maxZ: hw }
  ];
  return { root, barberPoles, shopRing, localColliders, W, D };
}

/* ==========================================================================
   12. WALK-IN CLOTHES STORE (MANNEQUIN DISPLAY WINDOWS + NEON APPAREL RACKS + MIRROR!)
   ========================================================================== */
export function createClothesStoreBuilding(maxAniso = 4, title = 'VICE COUTURE', accentHex = '#FF2E88') {
  const root = new THREE.Group();
  const pbr = getWorldPBRTextures(maxAniso);
  const D = 14.5, W = 18.5, H = 8.2, t = 0.65;
  const hd = D * 0.5, hw = W * 0.5;
  const accentNum = parseInt(accentHex.replace('#', ''), 16) || 0xff2e88;

  const wallMat = new THREE.MeshStandardMaterial({ map: pbr.concrete.map, color: 0xf6ece4, roughness: 0.6 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x241432, roughness: 0.34, metalness: 0.25 });
  const neonMat = new THREE.MeshBasicMaterial({ color: accentNum });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf0f6fc, metalness: 0.94, roughness: 0.12, envMapIntensity: 1.8 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf4c44e, metalness: 0.92, roughness: 0.18 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x9de6ff, transparent: true, opacity: 0.24, roughness: 0.08, depthWrite: false });
  const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xd8f0ff, metalness: 0.96, roughness: 0.05 });

  // Warm Terrazzo Boutique Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(D - 0.6, W - 0.6),
    new THREE.MeshStandardMaterial({ color: 0xf2e6da, roughness: 0.26, metalness: 0.1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.04;
  root.add(floor);

  // Hollow Walls + Storefront Showcase Windows + Roof
  const backW = new THREE.Mesh(new THREE.BoxGeometry(t, H, W), wallMat); backW.position.set(-hd + t * 0.5, H * 0.5, 0);
  const northW = new THREE.Mesh(new THREE.BoxGeometry(D, H, t), wallMat); northW.position.set(0, H * 0.5, -hw + t * 0.5);
  const southW = new THREE.Mesh(new THREE.BoxGeometry(D, H, t), wallMat); southW.position.set(0, H * 0.5, hw - t * 0.5);
  const eastN = new THREE.Mesh(new THREE.BoxGeometry(t, H, hw - 3.2), wallMat); eastN.position.set(hd - t * 0.5, H * 0.5, -hw + (hw - 3.2) * 0.5);
  const eastS = new THREE.Mesh(new THREE.BoxGeometry(t, H, hw - 3.2), wallMat); eastS.position.set(hd - t * 0.5, H * 0.5, hw - (hw - 3.2) * 0.5);
  const eastTop = new THREE.Mesh(new THREE.BoxGeometry(t, H - 4.2, 6.4), wallMat); eastTop.position.set(hd - t * 0.5, 4.2 + (H - 4.2) * 0.5, 0);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(D + 0.6, 0.55, W + 0.6), trimMat); roof.position.set(0, H + 0.26, 0);
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.34, W - 0.6), trimMat); canopy.position.set(hd + 1.2, 4.35, 0);
  const canopyNeon = new THREE.Mesh(new THREE.BoxGeometry(2.92, 0.14, W - 0.4), neonMat); canopyNeon.position.set(hd + 1.2, 4.56, 0);
  root.add(backW, northW, southW, eastN, eastS, eastTop, roof, canopy, canopyNeon);

  // Glowing Neon Boutique Marquee
  const signTex = makeNeonSignTexture(title, 'DESIGNER OUTFITS · SUITS & SHADES [E]', accentHex, maxAniso, false);
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(13.2, 2.3),
    new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.38 })
  );
  signMesh.rotation.y = Math.PI / 2;
  signMesh.position.set(hd + 0.2, 6.3, 0);
  root.add(signMesh);

  // Exterior Illuminated Storefront Mannequins on Pedestals
  const manColors = [0xff2e88, 0x21e6d1, 0xfaf7f2, 0xffd36b];
  for (let m = 0; m < 2; m++) {
    const mz = m === 0 ? -5.8 : 5.8;
    const boxGlass = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.2, 3.8), glassMat);
    boxGlass.position.set(hd + 0.65, 1.8, mz);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 0.45, 14), trimMat);
    ped.position.set(hd + 0.55, 0.24, mz);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.72, 12), new THREE.MeshStandardMaterial({ color: manColors[m], roughness: 0.45 }));
    torso.position.set(hd + 0.55, 1.38, mz);
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.68, 10), new THREE.MeshStandardMaterial({ color: 0xf2eee8, roughness: 0.55 }));
    legs.position.set(hd + 0.55, 0.78, mz);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), goldMat);
    head.position.set(hd + 0.55, 1.88, mz);
    root.add(boxGlass, ped, torso, legs, head);
  }

  // Interior Chrome Clothing Racks with Hanging Colorful Apparel + Dressing Mirror + Cashier Counter
  const rackCols = [0xff2e88, 0x21e6d1, 0xffd36b, 0x9b5de5, 0x16a89c, 0xf4f2ee, 0xff6e48];
  for (const rz of [-6.2, 6.2]) {
    const rPoleA = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.85, 8), chromeMat); rPoleA.position.set(-3.6, 0.94, rz);
    const rPoleB = rPoleA.clone(); rPoleB.position.x = 2.4;
    const rBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 6.0, 8), chromeMat);
    rBar.rotation.z = Math.PI / 2; rBar.position.set(-0.6, 1.82, rz);
    root.add(rPoleA, rPoleB, rBar);
    for (let h = 0; h < 7; h++) {
      const shirt = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.88, 0.62),
        new THREE.MeshStandardMaterial({ color: rackCols[(h + (rz > 0 ? 3 : 0)) % rackCols.length], roughness: 0.6 })
      );
      shirt.position.set(-3.0 + h * 0.8, 1.32, rz);
      root.add(shirt);
    }
  }
  // Full-length Back-Wall Dressing Mirror & Boutique Counter
  const dMirror = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 3.2), mirrorMat);
  dMirror.rotation.y = Math.PI / 2;
  dMirror.position.set(-hd + 0.8, 2.0, 0);
  const dFrame = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.45, 4.1), neonMat);
  dFrame.position.set(-hd + 0.72, 2.0, 0);
  const cashier = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.05, 3.6), trimMat);
  cashier.position.set(-hd + 2.2, 0.54, -5.2);
  const shopRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.32, 24),
    new THREE.MeshBasicMaterial({ color: accentNum, transparent: true, opacity: 0.84, side: THREE.DoubleSide, depthWrite: false })
  );
  shopRing.rotation.x = -Math.PI / 2;
  shopRing.position.set(0.2, 0.08, 0);
  const intLight = new THREE.PointLight(0xfff0f6, 14, 18, 1.3);
  intLight.position.set(0, 5.4, 0);
  root.add(dMirror, dFrame, cashier, shopRing, intLight);

  const localColliders = [
    { minX: -hd, maxX: -hd + t + 0.1, minZ: -hw, maxZ: hw },
    { minX: -hd, maxX: hd, minZ: -hw, maxZ: -hw + t + 0.1 },
    { minX: -hd, maxX: hd, minZ: hw - t - 0.1, maxZ: hw },
    { minX: hd - t - 0.1, maxX: hd, minZ: -hw, maxZ: -3.2 },
    { minX: hd - t - 0.1, maxX: hd, minZ:  3.2, maxZ: hw }
  ];
  return { root, shopRing, localColliders, W, D };
}

/* ==========================================================================
   9. AUTHENTIC GTA VICE CITY COMPLETE CHEAT CODE REGISTRY
   ========================================================================== */
export const VICE_CHEAT_CODES = [
  // Health, Armor, Wanted & Money
  { code: 'ASPIRINE',                  action: 'health',       label: 'FULL HEALTH RESTORED' },
  { code: 'HESOYAM',                   action: 'hesoyam',      label: 'FULL HEALTH + ARMOR + $250,000' },
  { code: 'PRECIOUSPROTECTION',        action: 'armor',        label: '100% BODY ARMOR' },
  { code: 'LEAVEMEALONE',              action: 'clearwanted',  label: 'WANTED LEVEL CLEARED' },
  { code: 'YOUWONTTAKEMEALIVE',        action: 'raisewanted',  label: '+2 WANTED STARS · VCPD DISPATCHED' },
  { code: 'ICANTTAKEITANYMORE',        action: 'wasted',       label: 'WASTED · HOSPITAL RESPAWN' },

  // Weapon Sets
  { code: 'THUGSTOOLS',                action: 'thugstools',   label: 'THUG WEAPON SET EQUIPPED' },
  { code: 'PROFESSIONALTOOLS',         action: 'protools',     label: 'PROFESSIONAL WEAPONS + FULL AMMO' },
  { code: 'NUTTERTOOLS',               action: 'nuttertools',  label: 'HEAVY ARSENAL + RPG BAZOOKA' },

  // Vehicle Spawns
  { code: 'PANZER',                    action: 'spawn_tank',   label: 'RHINO TANK SPAWNED' },
  { code: 'GETTHEREFAST',              action: 'spawn_sabre',  label: 'SABRE TURBO SPAWNED' },
  { code: 'GETTHEREVERYFASTINDEED',    action: 'spawn_hotring',label: 'HOTRING RACER SPAWNED' },
  { code: 'GETTHEREAMAZINGLYFAST',     action: 'spawn_infernus',label: 'INFERNUS HYPERCAR SPAWNED' },
  { code: 'THELASTRIDE',               action: 'spawn_hearse', label: 'ROMERO HEARSE SPAWNED' },
  { code: 'ROCKANDROLLCAR',            action: 'spawn_limo',   label: 'LOVE FIST LIMO SPAWNED' },
  { code: 'BETTERTHANWALKING',         action: 'spawn_caddy',  label: 'CADDY GOLF CART SPAWNED' },
  { code: 'TRAVELINSTYLE',             action: 'spawn_banger', label: 'BLOODRING BANGER SPAWNED' },
  { code: 'RUBBISHCAR',                action: 'spawn_trash',  label: 'TRASHMASTER SPAWNED' },
  { code: 'PCJ',                       action: 'spawn_pcj',    label: 'PCJ-600 SUPERBIKE SPAWNED' },
  { code: 'SANCHEZ',                   action: 'spawn_sanchez',label: 'SANCHEZ DIRT BIKE SPAWNED' },
  { code: 'FAGGIO',                    action: 'spawn_faggio', label: 'FAGGIO SCOOTER SPAWNED' },

  // Vehicle Physics & Chaos
  { code: 'COMEFLYWITHME',             action: 'flyingcars',   label: 'FLYING CARS MODE' },
  { code: 'SEAWAYS',                   action: 'seaways',      label: 'DRIVE ON WATER (SEAWAYS)' },
  { code: 'BIGBANG',                   action: 'bigbang',      label: 'BIG BANG · NEARBY VEHICLES BLOWN' },
  { code: 'GREENLIGHT',                action: 'greenlight',   label: 'ALL TRAFFIC LIGHTS GREEN' },
  { code: 'GRIPISEVERYTHING',          action: 'grip',         label: 'PERFECT HANDLING + SPACE CAR HOP' },
  { code: 'AHAIRDRESSERSCAR',          action: 'pinkcars',     label: 'ALL TRAFFIC PAINTED HOT PINK' },
  { code: 'IWANTITPAINTEDBLACK',       action: 'blackcars',    label: 'ALL TRAFFIC PAINTED MATTE BLACK' },
  { code: 'MIAMITRAFFIC',              action: 'fasttraffic',  label: 'AGGRESSIVE FAST TRAFFIC' },

  // Time & Simulation Speed
  { code: 'BOOOOOORING',               action: 'slowmo',       label: 'SLOW MOTION TOGGLED' },
  { code: 'ONSPEED',                   action: 'fastmo',       label: 'FAST MOTION TOGGLED' },
  { code: 'LIFEISPASSINGMEBY',         action: 'fastclock',    label: 'FAST CLOCK TOGGLED' },

  // Pedestrian Chaos
  { code: 'FIGHTFIGHTFIGHT',           action: 'riot',         label: 'PEDESTRIAN RIOT ACTIVATED' },
  { code: 'NOBODYLIKESME',             action: 'hostilepeds',  label: 'HOSTILE CITIZENS ACTIVATED' },
  { code: 'OURGODGIVENRIGHTTOBEARARMS',action: 'armedpeds',    label: 'ARMED CITIZENS ACTIVATED' },
  { code: 'FANNYMAGNET',               action: 'fannymagnet',  label: 'FANNY MAGNET · CROWD FOLLOWS YOU' },

  // Weather & Atmosphere
  { code: 'ALOVELYDAY',                action: 'weather_sunset',label: 'CLEAR SUNSET WEATHER' },
  { code: 'APLEASANTDAY',              action: 'weather_noon',  label: 'BRIGHT NOON SUNSHINE' },
  { code: 'ABITDRIEG',                 action: 'weather_night', label: 'MIDNIGHT NEON SKY' },
  { code: 'CATSANDDOGS',               action: 'weather_rain',  label: 'TROPICAL RAINSTORM' },
  { code: 'CANTSEEATHING',             action: 'weather_fog',   label: 'HEAVY SAN ANDREAS FOG' }
];
