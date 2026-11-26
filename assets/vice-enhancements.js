/* ==========================================================================
   VICE CITY 3D — ENHANCEMENTS MODULE (v1)
   - Composite 3D Watercraft (Vice Speedboat & Jet Ski) + Flyable Maverick Helicopter
   - Enterable Interiors: Pay 'n' Spray Mod Garage, Burger Shot 24/7 Diner,
     Ammu-Nation Gun Store + Indoor Shooting Range
   - Zero-GC Drift Skidmarks Pool, Tire Spray / Hood Smoke Helpers,
     3D GPS Street Chevron Arrows, Persistent Aerial Sky-Rings,
     Street Race Checkpoints & Taxi Fare Beacon
   ========================================================================== */
import * as THREE from 'https://esm.sh/three@0.187.0';

function makeNeonBannerTexture(title, subtitle, accent = '#21E6D1', bg = '#120822') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = accent;
  ctx.font = '900 48px "Barlow Condensed", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 54);
  ctx.fillStyle = '#FFF5EE';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText(subtitle, 256, 98);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* --------------------------------------------------------------------------
   1. COMPOSITE 3D SPEEDBOAT ("VICE SQUALLO") — 9 distinct parts, bottom-grounded
   -------------------------------------------------------------------------- */
export function createSpeedboat(hullColor = 0xffffff, stripeColor = 0xff2e88) {
  const root = new THREE.Group();

  const hullMat = new THREE.MeshPhysicalMaterial({
    color: hullColor,
    roughness: 0.22,
    metalness: 0.12,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14
  });
  const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.28, metalness: 0.25 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xe6dcc8, roughness: 0.72, metalness: 0.05 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe6eef8, roughness: 0.14, metalness: 0.92 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x16384c, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.72 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x262235, roughness: 0.85, metalness: 0.02 });
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x1e222e, roughness: 0.42, metalness: 0.65 });

  // Sculpted V-hull main body + tapered bow
  const hullBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.78, 4.6), hullMat);
  hullBody.position.set(0, 0.44, 0.25);
  root.add(hullBody);

  const bowGeo = new THREE.ConeGeometry(1.52, 2.55, 4);
  bowGeo.rotateY(Math.PI / 4);
  bowGeo.rotateX(-Math.PI / 2);
  bowGeo.scale(1.08, 0.52, 1.0);
  const bow = new THREE.Mesh(bowGeo, hullMat);
  bow.position.set(0, 0.48, -3.22);
  root.add(bow);

  // Racing side stripes
  for (const sx of [-1.19, 1.19]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 4.5), stripeMat);
    stripe.position.set(sx, 0.56, 0.15);
    root.add(stripe);
  }

  // Sun deck & cockpit interior
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 4.1), deckMat);
  deck.position.set(0, 0.84, 0.28);
  root.add(deck);

  // Wrap-around tinted sports windshield
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.52, 0.82), glassMat);
  ws.position.set(0, 1.12, -0.78);
  ws.rotation.x = 0.42;
  root.add(ws);

  // Twin bucket seats + rear bench + steering console
  const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.48, 0.55), seatMat);
  consoleBox.position.set(0, 1.06, -0.35);
  root.add(consoleBox);

  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 16), chromeMat);
  wheel.position.set(0.32, 1.24, -0.05);
  wheel.rotation.x = -0.35;
  root.add(wheel);

  for (const sx of [-0.46, 0.46]) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.52), stripeMat);
    seat.position.set(sx, 1.12, 0.58);
    root.add(seat);
  }

  const bench = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.42, 0.65), seatMat);
  bench.position.set(0, 1.06, 1.72);
  root.add(bench);

  // Chrome bow rail & dual outboard V6 engines
  const bowRail = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.03, 8, 16, Math.PI), chromeMat);
  bowRail.rotation.x = Math.PI / 2;
  bowRail.rotation.z = Math.PI;
  bowRail.position.set(0, 0.98, -2.15);
  root.add(bowRail);

  const propHubs = [];
  for (const sx of [-0.42, 0.42]) {
    const motor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.92, 0.62), motorMat);
    motor.position.set(sx, 0.72, 2.74);
    const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.64), stripeMat);
    cowl.position.set(sx, 1.12, 2.74);
    const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 6), chromeMat);
    prop.rotation.x = Math.PI / 2;
    prop.position.set(sx, 0.18, 3.05);
    root.add(motor, cowl, prop);
    propHubs.push(prop);
  }

  // Navigation bow light (red/green)
  const navL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2e4c }));
  navL.position.set(-0.92, 0.95, -1.65);
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0x21ff92 }));
  navR.position.set(0.92, 0.95, -1.65);
  root.add(navL, navR);

  const riderSeat = new THREE.Group();
  riderSeat.position.set(0.32, 1.05, 0.48);
  root.add(riderSeat);

  return { root, propHubs, riderSeat, isBoat: true, kind: 'speedboat', topSpeed: 34 };
}

/* --------------------------------------------------------------------------
   2. COMPOSITE 3D JET SKI ("VICE WAVE RUNNER") — nimble ocean craft
   -------------------------------------------------------------------------- */
export function createJetSki(bodyColor = 0x21e6d1) {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: bodyColor, roughness: 0.2, metalness: 0.18, clearcoat: 0.9 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1c28, roughness: 0.78, metalness: 0.12 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xff2e88, roughness: 0.35, metalness: 0.2 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.44, 2.55), bodyMat);
  hull.position.set(0, 0.28, 0);
  root.add(hull);

  const noseGeo = new THREE.ConeGeometry(0.68, 1.05, 4);
  noseGeo.rotateY(Math.PI / 4);
  noseGeo.rotateX(-Math.PI / 2);
  noseGeo.scale(1.05, 0.55, 1.0);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.position.set(0, 0.34, -1.72);
  root.add(nose);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.34, 1.08), accentMat);
  hood.position.set(0, 0.62, -0.58);
  hood.rotation.x = 0.24;
  root.add(hood);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.28, 1.15), darkMat);
  seat.position.set(0, 0.66, 0.42);
  root.add(seat);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.52, 8), darkMat);
  stem.position.set(0, 0.84, -0.42);
  stem.rotation.x = 0.25;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.76, 8), darkMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.06, -0.34);
  root.add(stem, bar);

  const riderSeat = new THREE.Group();
  riderSeat.position.set(0, 0.86, 0.28);
  root.add(riderSeat);

  return { root, propHubs: [], riderSeat, isBoat: true, kind: 'jetski', topSpeed: 39 };
}

/* --------------------------------------------------------------------------
   3. COMPOSITE 3D FLYABLE HELICOPTER ("VICE MAVERICK CHOPPER") — 11 parts
   -------------------------------------------------------------------------- */
export function createHelicopter(primaryColor = 0x21e6d1, stripeColor = 0xff2e88) {
  const root = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: primaryColor,
    roughness: 0.22,
    metalness: 0.42,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15
  });
  const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.3, metalness: 0.28 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x2b3140, roughness: 0.38, metalness: 0.78 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x161922, roughness: 0.45, metalness: 0.55 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x142b3c, roughness: 0.06, metalness: 0.12, transparent: true, opacity: 0.68 });

  // Twin landing skids + angled struts (grounded cleanly at Y = 0)
  for (const sx of [-1.22, 1.22]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 4.6, 10), metalMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(sx, 0.09, -0.15);
    root.add(skid);
    for (const sz of [-1.1, 0.9]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.05, 8), metalMat);
      strut.position.set(sx * 0.85, 0.55, sz);
      strut.rotation.z = sx > 0 ? 0.36 : -0.36;
      root.add(strut);
    }
  }

  // Fuselage cabin + rounded nose bubble
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.18, 1.56, 3.65), bodyMat);
  cabin.position.set(0, 1.72, -0.18);
  root.add(cabin);

  const noseBubble = new THREE.Mesh(new THREE.SphereGeometry(1.12, 18, 14), glassMat);
  noseBubble.scale.set(0.98, 0.72, 1.15);
  noseBubble.position.set(0, 1.66, -2.02);
  root.add(noseBubble);

  // Side accent stripes & cabin doors
  for (const sx of [-1.11, 1.11]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 3.6), stripeMat);
    st.position.set(sx, 1.46, -0.18);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 1.95), glassMat);
    win.position.set(sx, 1.96, -0.45);
    root.add(st, win);
  }

  // Top turbine cowling + dual exhaust pipes
  const engineCowling = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.66, 2.3), metalMat);
  engineCowling.position.set(0, 2.74, 0.12);
  root.add(engineCowling);

  // Tapered tail boom + horizontal stabilizer + vertical fin
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 5.2, 10), bodyMat);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 1.88, 3.95);
  root.add(boom);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.62, 0.88), stripeMat);
  tailFin.position.set(0, 2.28, 6.38);
  tailFin.rotation.x = -0.24;
  root.add(tailFin);

  const hStab = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.1, 0.54), bodyMat);
  hStab.position.set(0, 1.88, 5.25);
  root.add(hStab);

  // Main Rotor Mast + 4-Blade Spinning Rotor Group
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.72, 10), metalMat);
  mast.position.set(0, 3.32, -0.15);
  root.add(mast);

  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 3.66, -0.15);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12), metalMat);
  mainRotor.add(hub);
  for (let b = 0; b < 4; b++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 4.9), bladeMat);
    blade.rotation.y = (b * Math.PI) / 2;
    blade.position.set(Math.sin((b * Math.PI) / 2) * 2.45, 0, Math.cos((b * Math.PI) / 2) * 2.45);
    mainRotor.add(blade);
  }
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(4.85, 28),
    new THREE.MeshBasicMaterial({ color: 0xdce6f5, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false })
  );
  disc.rotation.x = -Math.PI / 2;
  mainRotor.add(disc);
  root.add(mainRotor);

  // Tail Rotor (spins around X)
  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.22, 2.52, 6.45);
  for (let b = 0; b < 2; b++) {
    const tb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.25, 0.12), bladeMat);
    tb.rotation.x = (b * Math.PI) / 2;
    tailRotor.add(tb);
  }
  root.add(tailRotor);

  // Searchlight & Anti-Collision Strobe
  const searchBulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), new THREE.MeshBasicMaterial({ color: 0xfff4d0 }));
  searchBulb.position.set(0, 0.96, -2.25);
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2442 }));
  strobe.position.set(0, 3.12, 6.42);
  root.add(searchBulb, strobe);

  // Pilot silhouette inside glass bubble
  const pilotMesh = new THREE.Group();
  const pTorso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.28), new THREE.MeshStandardMaterial({ color: 0x21e6d1, roughness: 0.7 }));
  pTorso.position.set(0, 1.48, -0.98);
  const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 10), new THREE.MeshStandardMaterial({ color: 0x1a1e2a, roughness: 0.35 }));
  pHead.position.set(0, 1.92, -0.98);
  pilotMesh.add(pTorso, pHead);
  pilotMesh.visible = false;
  root.add(pilotMesh);

  // Soft contact shadow
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(3.8, 20),
    new THREE.MeshBasicMaterial({ color: 0x05020c, transparent: true, opacity: 0.45, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.04;
  root.add(shadow);

  return {
    root,
    mainRotor,
    tailRotor,
    strobe,
    pilotMesh,
    shadow,
    isHeli: true,
    label: 'VICE MAVERICK CHOPPER',
    topSpeed: 54,
    takeoffSpeed: 0,
    climbRate: 22
  };
}

/* --------------------------------------------------------------------------
   4. ENTERABLE PAY 'N' SPRAY MOD GARAGE (Drive-in / Walk-in Bay)
   -------------------------------------------------------------------------- */
export function createPayNSprayBuilding(maxAniso = 4) {
  const root = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xded9d2, roughness: 0.76, metalness: 0.08 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xff8a2a, roughness: 0.42, metalness: 0.22 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x2c303a, roughness: 0.62, metalness: 0.18 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x262834, roughness: 0.8 });
  const redMetal = new THREE.MeshStandardMaterial({ color: 0xd92638, roughness: 0.35, metalness: 0.55 });
  const yellowMetal = new THREE.MeshStandardMaterial({ color: 0xffc83b, roughness: 0.38, metalness: 0.45 });

  // Open-East drive-in garage (14m deep X, 12m wide Z, 5.6m tall)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.03;
  root.add(floor);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.55, 12.6), roofMat);
  roof.position.set(0, 5.6, 0);
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.42, 12.8), trimMat);
  fascia.position.set(0, 5.95, 0);
  root.add(roof, fascia);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.65, 5.4, 12), wallMat);
  backWall.position.set(-6.7, 2.7, 0);
  const sideN = new THREE.Mesh(new THREE.BoxGeometry(14, 5.4, 0.65), wallMat);
  sideN.position.set(0, 2.7, -5.7);
  const sideS = sideN.clone();
  sideS.position.z = 5.7;
  root.add(backWall, sideN, sideS);

  // Front pillars leaving wide 8.6m drive-in bay on +X face
  for (const pz of [-4.95, 4.95]) {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(0.75, 5.4, 1.5), wallMat);
    pil.position.set(6.65, 2.7, pz);
    root.add(pil);
  }
  const header = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.15, 11.4), trimMat);
  header.position.set(6.65, 4.95, 0);
  root.add(header);

  // Neon Pay 'n' Spray Roof Sign
  const signTex = makeNeonBannerTexture("PAY 'N' SPRAY", 'REPAIR · PAINT · UNDERGLOW', '#FF8A2A', '#1A0B24');
  signTex.anisotropy = maxAniso;
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 1.75, 9.4),
    new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.72, roughness: 0.35 })
  );
  sign.position.set(7.05, 6.75, 0);
  root.add(sign);

  // Interior Hydraulic Car Lift, Tool Cabinets & Paint Spray Booth Lights
  for (const lz of [-2.4, 2.4]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.32, 3.6, 0.32), yellowMetal);
    post.position.set(-1.2, 1.8, lz);
    root.add(post);
  }
  const toolBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.35, 3.4), redMetal);
  toolBox.position.set(-5.6, 0.68, -2.5);
  const compressor = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.45, 12), yellowMetal);
  compressor.rotation.z = Math.PI / 2;
  compressor.position.set(-5.6, 0.55, 2.8);
  root.add(toolBox, compressor);

  const boothLight = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.14, 1.6), new THREE.MeshBasicMaterial({ color: 0xfff8e6 }));
  boothLight.position.set(0, 5.22, 0);
  root.add(boothLight);

  const localColliders = [
    { minX: -7.1, maxX: -6.3, minZ: -6.1, maxZ: 6.1 },
    { minX: -7.1, maxX: 7.1, minZ: -6.1, maxZ: -5.3 },
    { minX: -7.1, maxX: 7.1, minZ: 5.3, maxZ: 6.1 }
  ];
  return { root, localColliders };
}

/* --------------------------------------------------------------------------
   5. ENTERABLE BURGER SHOT 24/7 DINER (Walk-In Interior + Menu Counter)
   -------------------------------------------------------------------------- */
export function createBurgerShotBuilding(maxAniso = 4) {
  const root = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfff0dc, roughness: 0.74 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xe6323a, roughness: 0.36, metalness: 0.18 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc83b, roughness: 0.35, metalness: 0.25 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xd9cfc2, roughness: 0.52 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x262936, roughness: 0.45, metalness: 0.22 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 11.4), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.03;
  root.add(floor);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.55, 12.2), redMat);
  roof.position.set(0, 4.9, 0);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.35, 12.5), goldMat);
  trim.position.set(0, 5.32, 0);
  root.add(roof, trim);

  const backW = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.8, 11.8), wallMat);
  backW.position.set(-6.5, 2.4, 0);
  const sideN = new THREE.Mesh(new THREE.BoxGeometry(13.6, 4.8, 0.6), wallMat);
  sideN.position.set(0, 2.4, -5.6);
  const sideS = sideN.clone();
  sideS.position.z = 5.6;
  root.add(backW, sideN, sideS);

  // Front glass-flanked doorway open on +X (Z in -2.2..+2.2)
  for (const fz of [-4.0, 4.0]) {
    const fw = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.8, 3.2), wallMat);
    fw.position.set(6.5, 2.4, fz);
    root.add(fw);
  }
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.35, 4.8), redMat);
  fTop.position.set(6.5, 4.15, 0);
  root.add(fTop);

  // Giant Sculpted Rooftop Burger Sculpture!
  const burgerGroup = new THREE.Group();
  burgerGroup.position.set(2.2, 5.6, 0);
  const bunMat = new THREE.MeshStandardMaterial({ color: 0xe69c4c, roughness: 0.65 });
  const pattyMat = new THREE.MeshStandardMaterial({ color: 0x4e2618, roughness: 0.85 });
  const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x3ec44e, roughness: 0.72 });
  const botBun = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.45, 0.42, 18), bunMat);
  botBun.position.y = 0.22;
  const patty = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.38, 18), pattyMat);
  patty.position.y = 0.64;
  const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.66, 0.16, 18), lettuceMat);
  lettuce.position.y = 0.92;
  const topBun = new THREE.Mesh(new THREE.SphereGeometry(1.58, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), bunMat);
  topBun.position.y = 0.98;
  burgerGroup.add(botBun, patty, lettuce, topBun);
  root.add(burgerGroup);

  // Illuminated Banner Sign
  const signTex = makeNeonBannerTexture('BURGER SHOT 24/7', 'BLEEDER BURGERS · FULL HEALTH', '#FFD36B', '#6A0E16');
  signTex.anisotropy = maxAniso;
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 1.55, 8.8),
    new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.68, roughness: 0.35 })
  );
  sign.position.set(6.95, 5.95, 0);
  root.add(sign);

  // Interior Order Counter, Menu Board & Diner Booths
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.15, 7.6), counterMat);
  counter.position.set(-2.6, 0.58, 0);
  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 7.8), redMat);
  counterTop.position.set(-2.6, 1.18, 0);
  root.add(counter, counterTop);

  for (const bz of [-3.6, 3.6]) {
    const tbl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.82, 1.0), goldMat);
    tbl.position.set(2.2, 0.41, bz);
    root.add(tbl);
  }
  const ceilLight = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.12, 1.8), new THREE.MeshBasicMaterial({ color: 0xfff5d8 }));
  ceilLight.position.set(0.4, 4.55, 0);
  root.add(ceilLight);

  const localColliders = [
    { minX: -6.9, maxX: -6.1, minZ: -6.0, maxZ: 6.0 },
    { minX: -6.9, maxX: 6.9, minZ: -6.0, maxZ: -5.2 },
    { minX: -6.9, maxX: 6.9, minZ: 5.2, maxZ: 6.0 },
    { minX: 6.1, maxX: 6.9, minZ: -5.8, maxZ: -2.2 },
    { minX: 6.1, maxX: 6.9, minZ: 2.2, maxZ: 5.8 }
  ];
  return { root, localColliders, burgerSpin: burgerGroup };
}

/* --------------------------------------------------------------------------
   6. ENTERABLE AMMU-NATION GUN STORE + INDOOR SHOOTING RANGE BAY
   -------------------------------------------------------------------------- */
export function createAmmuNationBuilding(maxAniso = 4) {
  const root = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b3d46, roughness: 0.78, metalness: 0.15 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd82632, roughness: 0.42, metalness: 0.25 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x262830, roughness: 0.68 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5d3d24, roughness: 0.72 });
  const targetMat = new THREE.MeshStandardMaterial({ color: 0xfff3e0, roughness: 0.6 });
  const bullMat = new THREE.MeshBasicMaterial({ color: 0xff2e55 });

  // 16m deep (X), 12m wide (Z) with front shop + back indoor shooting range lanes!
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.03;
  root.add(floor);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(16.6, 0.55, 12.6), wallMat);
  roof.position.set(0, 5.1, 0);
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.42, 12.8), trimMat);
  fascia.position.set(0, 5.48, 0);
  root.add(roof, fascia);

  const backW = new THREE.Mesh(new THREE.BoxGeometry(0.65, 5.0, 12), wallMat);
  backW.position.set(-7.7, 2.5, 0);
  const sideN = new THREE.Mesh(new THREE.BoxGeometry(16, 5.0, 0.65), wallMat);
  sideN.position.set(0, 2.5, -5.7);
  const sideS = sideN.clone();
  sideS.position.z = 5.7;
  root.add(backW, sideN, sideS);

  for (const fz of [-4.0, 4.0]) {
    const fw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5.0, 3.6), wallMat);
    fw.position.set(7.7, 2.5, fz);
    root.add(fw);
  }
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 4.8), trimMat);
  fTop.position.set(7.7, 4.3, 0);
  root.add(fTop);

  // Neon Ammu-Nation Sign
  const signTex = makeNeonBannerTexture('AMMU-NATION', 'ARMOR · AMMO · SHOOTING RANGE', '#FF3B4E', '#120C14');
  signTex.anisotropy = maxAniso;
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 1.65, 9.6),
    new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.72, roughness: 0.35 })
  );
  sign.position.set(8.15, 6.2, 0);
  root.add(sign);

  // Gun Counter + Weapon Rack Wall
  const counter = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.15, 4.8), woodMat);
  counter.position.set(2.2, 0.58, -2.6);
  root.add(counter);

  // Indoor Shooting Range Lanes & 4 Animated Targets in Back Bay (-7..-1 on X)
  const rangeBench = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 5.4), woodMat);
  rangeBench.position.set(0.4, 0.52, 2.2);
  root.add(rangeBench);

  const rangeTargets = [];
  for (let t = 0; t < 4; t++) {
    const tg = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.35, 0.85), targetMat);
    const ring = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), bullMat);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(0.08, 0.14, 0);
    tg.add(board, ring);
    const baseZ = -3.4 + t * 2.25;
    tg.position.set(-6.4 + (t % 2) * 1.1, 1.75, baseZ);
    root.add(tg);
    rangeTargets.push({ group: tg, baseZ, phase: t * 1.4, active: true, hitCooldown: 0 });
  }

  const ceilLight = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.12, 1.8), new THREE.MeshBasicMaterial({ color: 0xffe8e0 }));
  ceilLight.position.set(0, 4.72, 0);
  root.add(ceilLight);

  const localColliders = [
    { minX: -8.1, maxX: -7.3, minZ: -6.1, maxZ: 6.1 },
    { minX: -8.1, maxX: 8.1, minZ: -6.1, maxZ: -5.3 },
    { minX: -8.1, maxX: 8.1, minZ: 5.3, maxZ: 6.1 },
    { minX: 7.3, maxX: 8.1, minZ: -6.0, maxZ: -2.2 },
    { minX: 7.3, maxX: 8.1, minZ: 2.2, maxZ: 6.0 }
  ];
  return { root, localColliders, rangeTargets };
}

/* --------------------------------------------------------------------------
   7. ZERO-GC DRIFT SKIDMARKS POOL (Ring Buffer of Grounded Asphalt Quads)
   -------------------------------------------------------------------------- */
export class SkidmarkPool {
  constructor(scene, maxMarks = 110) {
    this.maxMarks = maxMarks;
    this.idx = 0;
    const geo = new THREE.PlaneGeometry(0.42, 1.45);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x0b0a10,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    this.inst = new THREE.InstancedMesh(geo, mat, maxMarks);
    this.inst.frustumCulled = false;
    this._dummy = new THREE.Object3D();
    this._dummy.position.set(0, -999, 0);
    this._dummy.scale.set(0.001, 0.001, 0.001);
    this._dummy.updateMatrix();
    for (let i = 0; i < maxMarks; i++) {
      this.inst.setMatrixAt(i, this._dummy.matrix);
    }
    this.inst.instanceMatrix.needsUpdate = true;
    scene.add(this.inst);
  }

  stampPair(x, y, z, yaw, trackHalf = 0.82) {
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    for (const side of [-1, 1]) {
      const mx = x - fx * 1.25 + rx * side * trackHalf;
      const mz = z - fz * 1.25 + rz * side * trackHalf;
      this._dummy.position.set(mx, y + 0.045, mz);
      this._dummy.rotation.set(0, yaw, 0);
      this._dummy.scale.set(1, 1, 1);
      this._dummy.updateMatrix();
      this.inst.setMatrixAt(this.idx, this._dummy.matrix);
      this.idx = (this.idx + 1) % this.maxMarks;
    }
    this.inst.instanceMatrix.needsUpdate = true;
  }
}

/* --------------------------------------------------------------------------
   8. 3D FLOATING GPS STREET CHEVRON ARROWS (Points along active route)
   -------------------------------------------------------------------------- */
export class RouteChevronGuide {
  constructor(scene, count = 6) {
    this.group = new THREE.Group();
    this.chevrons = [];
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.0);
    shape.lineTo(0.85, -0.45);
    shape.lineTo(0.45, -0.45);
    shape.lineTo(0, 0.35);
    shape.lineTo(-0.45, -0.45);
    shape.lineTo(-0.85, -0.45);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff2e88,
      transparent: true,
      opacity: 0.84,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.visible = false;
      this.group.add(m);
      this.chevrons.push(m);
    }
    scene.add(this.group);
  }

  hide() {
    for (let i = 0; i < this.chevrons.length; i++) this.chevrons[i].visible = false;
  }

  update(actor, target, getSurfaceY, elapsed) {
    let ax, ay, az, tx, tz, surfFn, t;
    if (typeof actor === 'number') {
      ax = actor;
      ay = target;
      az = getSurfaceY;
      tx = elapsed;
      tz = arguments[4];
      t = arguments[5] || 0;
      surfFn = null;
    } else {
      if (!target || !actor) {
        this.hide();
        return;
      }
      ax = actor.x;
      ay = actor.y || 0;
      az = actor.z;
      tx = target.x;
      tz = target.z;
      surfFn = typeof getSurfaceY === 'function' ? getSurfaceY : null;
      t = elapsed || 0;
    }
    const dx = tx - ax;
    const dz = tz - az;
    const dist = Math.hypot(dx, dz);
    if (dist < 10) {
      this.hide();
      return;
    }
    const nx = dx / dist;
    const nz = dz / dist;
    const yaw = Math.atan2(-nx, -nz);
    const flow = (t * 14) % 10;
    for (let i = 0; i < this.chevrons.length; i++) {
      const m = this.chevrons[i];
      const stepD = 9 + i * 10 + flow;
      if (stepD >= dist - 3) {
        m.visible = false;
        continue;
      }
      const px = ax + nx * stepD;
      const pz = az + nz * stepD;
      const baseY = surfFn ? surfFn(px, pz, false) : ay;
      const py = baseY + 0.42 + Math.sin(t * 5 + i) * 0.08;
      m.position.set(px, py, pz);
      m.rotation.set(0, yaw, 0);
      m.visible = true;
    }
  }
}

/* --------------------------------------------------------------------------
   9. PERSISTENT AERIAL SKY-RINGS & RACE / TAXI BEACON HELPERS
   -------------------------------------------------------------------------- */
export function createSkyRings(scene) {
  const defs = [
    { x: 52,   y: 34, z: -260, label: 'Ocean Beach Ring' },
    { x: 145,  y: 44, z: -430, label: 'Carnival Pier Ring' },
    { x: 152,  y: 48, z: -620, label: 'Vice Key Ring' },
    { x: -108, y: 38, z: 114,  label: 'Escobar Runway Ring' },
    { x: -228, y: 98, z: -1380, label: 'Mount Vice Peak Ring' },
    { x: -50,  y: 42, z: -1018, label: 'North Point Sky Ring' },
    { x: -340, y: 46, z: -460, label: 'Downtown Skyline Ring' },
    { x: -760, y: 82, z: -210, label: 'Sierra West Canyon Ring' }
  ];
  const geo = new THREE.TorusGeometry(9.5, 0.55, 10, 28);
  const rings = [];
  defs.forEach((d, idx) => {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.86 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(d.x, d.y, d.z);
    mesh.rotation.y = (idx % 2) * 0.75;
    scene.add(mesh);
    rings.push({ ...d, mesh, mat, cooldown: 0 });
  });
  return rings;
}

export function createMissionBeacon(scene) {
  const group = new THREE.Group();
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffe44d, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false });
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xffe44d, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.6, 28), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.12;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.8, 38, 16, 1, true), beamMat);
  beam.position.y = 19;
  group.add(ring, beam);
  group.visible = false;
  scene.add(group);
  return { group, ring, beam, ringMat, beamMat, cylMat: beamMat };
}

/* --------------------------------------------------------------------------
   10. STREET RACE CIRCUIT WAYPOINTS (Leonida Grand Prix Loop)
   -------------------------------------------------------------------------- */
export const STREET_RACE_GATES = [
  { x: 0,    z: -160 },
  { x: 0,    z: -360 },
  { x: 0,    z: -560 },
  { x: 0,    z: -780 },
  { x: -120, z: -840 },
  { x: -240, z: -640 },
  { x: -240, z: -380 },
  { x: -240, z: -120 },
  { x: -120, z: 0 },
  { x: 0,    z: 0 }
];

/* --------------------------------------------------------------------------
   11. TAXI FARE PASSENGER DESTINATIONS
   -------------------------------------------------------------------------- */
export const TAXI_FARE_SPOTS = [
  { name: 'Ocean View Hotel', x: -6, z: -48 },
  { name: 'The Malibu Club', x: -6, z: -344 },
  { name: 'Vice Carnival Pier', x: 10, z: -430 },
  { name: 'North Point Mall', x: -6, z: -1018 },
  { name: "Escobar Int'l Terminal", x: -108, z: 22 },
  { name: 'Downtown Financial Plaza', x: -240, z: -420 },
  { name: 'Starfish Island Estates', x: 146, z: -300 },
  { name: 'Washington Beach Strip', x: -120, z: -220 },
  { name: 'Burger Shot 24/7', x: -50, z: -262 },
  { name: "Pay 'n' Spray Garage", x: -50, z: -182 }
];

/* --------------------------------------------------------------------------
   12. PORTFOLIO SCAVENGER HUNT UNLOCK TIERS
   -------------------------------------------------------------------------- */
export const SCAVENGER_UNLOCKS = [
  { req: 1, count: 1, id: 'mod-pack',    title: 'Pay \'n\' Spray VIP Mod Pack', desc: 'Free Neon Underglow & Carbon GT Wing at Pay \'n\' Spray' },
  { req: 3, count: 3, id: 'hypercar',    title: 'Infernus Apex V12 Hypercar',   desc: 'Summon the 215 MPH Apex Hypercar anytime via Phone Mechanic' },
  { req: 5, count: 5, id: 'vip-chopper', title: 'Gold Chrome & VIP Chopper',    desc: 'Unlocks Gold Chrome paint, Maverick Chopper delivery & $2,500 bonus' }
];
