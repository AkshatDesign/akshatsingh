/* ==========================================================================
   THE GREAT STATE OF LEONIDA — ARCHITECTURAL 3D OPEN WORLD (v2)
   - Zero static map image: 100% custom procedural GTA-style vector map & radar
     generated directly from the real 3D coastline, highways, town street grids,
     golf course fairways, lakes, runways & landmarks!
   - Every single highway seamlessly connects straight out of Vice City's 6x10
     avenue grid (Ocean Dr, Downtown Hwy, Vice Port Expy) with ZERO dead ends.
   - Distinct architectural districts:
     * Leaf Links Championship Golf Course (fairways, greens, flags, bunkers,
       water hazards, cart paths, Mediterranean clubhouse & golf carts)
     * Retail Shopping Plazas & Streetfront Shops (striped awnings, neon shop
       signs, sidewalks, lamps)
     * Art Deco Resorts, Glass Office Towers, Key West Stilted Beach Cottages,
       Alpine Log Cabins, Red Barns & Silos, Shipping Port Cranes & Containers,
       Twin Hyperbolic Power Plant Cooling Towers, Banked Oval Speedways,
       Leonida State Prison & 3 Regional Airfields!
   ========================================================================== */
import * as THREE from 'https://esm.sh/three@0.187.0';
import { createLeonidaPBRMaterials, buildLeonidaRealWorld } from './leonida-props.js?v=7';

// Continuous playable open-world bounds (~2.82 km x 4.40 km = ~12.4 km²)
export const LEONIDA_PROJ = {
  minX: -2420,
  maxX: 460,
  minZ: -2520,
  maxZ: 1920
};

// Keep existing detailed Vice City core & legacy mountains completely untouched!
export function isInCoreViceFootprint(x, z) {
  return x > -496 && x < 215 && z > -1112 && z < 362;
}

export function isInLegacyMountains(x, z) {
  const inMountVice = z <= -1106 && z >= -1498 && x >= -506 && x <= 44;
  const inSierraWest = x <= -492 && x >= -886 && z >= -760 && z <= 240;
  return inMountVice || inSierraWest;
}

// ============================================================================
// 1. CONTINUOUS LANDMASS, LAKES & ISLANDS (COHESIVE PENINSULA + KEYS ARCHIPELAGO)
// ============================================================================
// Elliptical land lobes [cx, cz, rx, rz, weight]
const LAND_LOBES = [
  // Core Vice-Dale Mainland & Beaches
  [-200,  -360, 460, 880, 1.0],
  // East-Central / Leonard County & Waning Sands Peninsula
  [-120, -1620, 480, 620, 0.96],
  [-480, -1760, 540, 560, 0.98],
  // North / Lummox County & Mount Kalaga Wilderness
  [-1120, -2060, 720, 440, 1.0],
  [-1680, -1960, 480, 420, 0.94],
  // Central Heartland (Ambrosia, Emerald Springs, Buckskin, Prison)
  [-1160, -1180, 680, 640, 0.98],
  [-1580,  -880, 620, 560, 0.98],
  // West Coast / Kelly County (Port Gellhorn, Wild Hog, Dairy Farm, Capri)
  [-1980, -1240, 410, 460, 0.98],
  [-1840,  -460, 460, 540, 0.96],
  [-1900,   180, 360, 340, 0.95],
  // South / Mariana County (Grassrivers, Vice Power, Tequesta, Bobcat Key)
  [-1180,   640, 720, 420, 0.96],
  [-320,    660, 520, 340, 0.96],
  [-920,   1140, 480, 250, 0.92],
  // Leonida Keys Tropical Island Chain (connected by US-1A Overseas Highway Bridges!)
  [-140,   1020, 175, 115, 0.96], // Corsair Key
  [-440,   1360, 245, 130, 0.98], // Key Lento
  [-980,   1580, 210, 115, 0.96], // Maroon Key
  [-1540,  1660, 270, 135, 0.98]  // Mile Zero Naval Air Station Island
];

// Freshwater Lakes & Coastal Bays carved out cleanly [cx, cz, rx, rz, name]
export const LEONIDA_LAKES = [
  { cx: -680,  cz: -1940, rx: 235, rz: 195, name: 'Lake Leonida' },
  { cx: -1360, cz: -1380, rx: 95,  rz: 80,  name: 'Emerald Lake' },
  { cx: -1160, cz:   940, rx: 115, rz: 85,  name: 'Cottonmouth Lagoon' }
];

export function getLandFactor(x, z) {
  if (isInCoreViceFootprint(x, z) || isInLegacyMountains(x, z)) return 1.0;

  let best = 0;
  for (let i = 0; i < LAND_LOBES.length; i++) {
    const [cx, cz, rx, rz, w] = LAND_LOBES[i];
    const dx = (x - cx) / rx;
    const dz = (z - cz) / rz;
    const d2 = dx * dx + dz * dz;
    if (d2 < 2.2) {
      const val = Math.exp(-d2 * 1.15) * w;
      if (val > best) best = val;
    }
  }
  // Natural organic coastal contour variation
  best += (Math.sin(x * 0.0052) * Math.cos(z * 0.0048) + Math.sin((x + z) * 0.0031) * 0.5) * 0.045;

  // Carve inland lakes
  for (let i = 0; i < LEONIDA_LAKES.length; i++) {
    const lk = LEONIDA_LAKES[i];
    const dx = (x - lk.cx) / lk.rx;
    const dz = (z - lk.cz) / lk.rz;
    const d2 = dx * dx + dz * dz;
    if (d2 < 1.35) {
      const cut = Math.exp(-d2 * 2.2);
      best *= (1.0 - cut * 1.4);
    }
  }
  return best;
}

// ============================================================================
// 2. ALL NAMED LEONIDA DISTRICTS, TOWNS & LANDMARKS (CLEANLY LAID OUT)
//    Every single one sits directly on a paved road/highway with rich 3D detail!
// ============================================================================
export const LEONIDA_PLACES = [
  // --- VICE-DALE & COASTAL EAST ---
  { id: 'i97-toll',          name: 'I-97 North Toll Plaza ($25)',county: 'Vice-Dale County', kind: 'toll',       x: 154.5, z: -1332, radius: 90,  yaw: 0,           note: 'Leonida Turnpike Toll Tax & E-Pass' },
  { id: 'leaf-links',        name: 'Leaf Links Golf Club',       county: 'Vice-Dale County', kind: 'golf',       x: 150,   z: -1480, radius: 190, yaw: 0,           note: '18-hole championship fairways & clubhouse' },
  { id: 'waning-sands',      name: 'Waning Sands Beachfront',    county: 'Leonard County',   kind: 'resort',     x: 120,   z: -1940, radius: 165, yaw: 0,           note: 'Art Deco hotels, boardwalk & surf shops' },
  { id: 'evergreen-plaza',   name: 'Evergreen Shopping Plaza',   county: 'Leonard County',   kind: 'shops',      x: -40,   z: -1860, radius: 120, yaw: Math.PI/2,   note: 'Neon strip mall, diner & boutiques' },
  { id: 'millport',          name: 'Millport Harbor',            county: 'Leonard County',   kind: 'port',       x: -240,  z: -2240, radius: 150, yaw: Math.PI/2,   note: 'Northern Atlantic docks & seafood shops' },

  // --- LAKE LEONIDA & HEARTLAND ---
  { id: 'belville',          name: 'Belville Suburbs',           county: 'Leonard County',   kind: 'town',       x: -580,  z: -1520, radius: 135, yaw: 0,           note: 'Suburban avenues, shops & cafes' },
  { id: 'lake-leonida',      name: 'Lake Leonida Shoreline',     county: 'Leonard County',   kind: 'lakeshore',  x: -410,  z: -1940, radius: 180, yaw: Math.PI/2,   note: 'Scenic freshwater lake, piers & cabins' },
  { id: 'ambrosia',          name: 'Ambrosia Downtown & Mill',   county: 'Leonard County',   kind: 'town',       x: -960,  z: -1760, radius: 165, yaw: Math.PI/2,   note: 'Heartland main street & Allied Sugar Mill' },
  { id: 'ambrosia-raceway',  name: 'Ambrosia Motorsport Park',   county: 'Leonard County',   kind: 'raceway',    x: -1260, z: -1760, radius: 155, yaw: 0,           note: 'Banked oval track, grandstands & pits' },

  // --- LUMMOX COUNTY & MOUNT KALAGA (FAR NORTH) ---
  { id: 'mount-kalaga',      name: 'Mount Kalaga National Park', county: 'Lummox County',    kind: 'mountain',   x: -1080, z: -2160, radius: 220, yaw: 0,           note: 'Alpine highway overlook & 148m summit' },
  { id: 'bonanza',           name: 'Bonanza Timber Town',        county: 'Lummox County',    kind: 'alpine',     x: -1480, z: -2240, radius: 145, yaw: Math.PI/2,   note: 'Log cabins, lumber mill & general store' },
  { id: 'grayson',           name: 'Grayson & Manifest Canyon',  county: 'Lummox County',    kind: 'alpine',     x: -1820, z: -1960, radius: 150, yaw: 0,           note: 'Redrock canyon overlook & lodge shops' },

  // --- KELLY COUNTY & PORT GELLHORN (WEST COAST) ---
  { id: 'buckskin-swamp',    name: 'Buckskin Cypress Swamp',     county: 'Kelly County',     kind: 'swamp',      x: -1120, z: -820,  radius: 150, yaw: Math.PI/2,   note: 'Cypress wetlands & stilt fishing shacks' },
  { id: 'emerald-springs',   name: 'Emerald Springs Village',    county: 'Kelly County',     kind: 'shops',      x: -1420, z: -860,  radius: 145, yaw: Math.PI/2,   note: 'Crossroads diner, pawn shop & boutiques' },
  { id: 'leonida-prison',    name: 'Leonida State Prison',       county: 'Kelly County',     kind: 'prison',     x: -1680, z: -940,  radius: 140, yaw: Math.PI/2,   note: 'Max-security walls, watchtowers & yard' },
  { id: 'port-gellhorn',     name: 'Port Gellhorn Downtown',     county: 'Kelly County',     kind: 'city',       x: -1960, z: -1280, radius: 210, yaw: 0,           note: 'West coast city grid, shops & cargo port' },
  { id: 'wild-hog-airfield', name: 'Wild Hog Coastal Airfield',  county: 'Kelly County',     kind: 'airport',    x: -2180, z: -1100, radius: 155, yaw: -Math.PI/2,  note: 'Paved runway, hangar & flyable plane' },
  { id: 'howe-dairy',        name: 'Howe Dairy Farm & Ranch',    county: 'Kelly County',     kind: 'farm',       x: -1900, z: -660,  radius: 145, yaw: 0,           note: 'Red wooden barns, grain silos & pastures' },
  { id: 'gellhorn-raceway',  name: 'Gellhorn Oval Speedway',     county: 'Kelly County',     kind: 'raceway',    x: -1680, z: -320,  radius: 155, yaw: 0,           note: 'High-speed banked NASCAR oval & stands' },
  { id: 'capri',             name: 'Capri Resort & Marina',      county: 'Kelly County',     kind: 'resort',     x: -1920, z: 180,   radius: 165, yaw: 0,           note: 'Gulf resort towers, promenade & shops' },

  // --- MARIANA COUNTY & SOUTHSIDE ---
  { id: 'grassrivers',       name: 'Grassrivers Bayou',          county: 'Mariana County',   kind: 'swamp',      x: -1340, z: 640,   radius: 165, yaw: -Math.PI/2,  note: 'Sawgrass marshes, airboat docks & shacks' },
  { id: 'vice-power',        name: 'Vice Power Station',         county: 'Mariana County',   kind: 'power',      x: -920,  z: 760,   radius: 145, yaw: -Math.PI/2,  note: 'Twin hyperbolic cooling towers & plant' },
  { id: 'tequesta',          name: 'Tequesta Shopping District', county: 'Vice-Dale County', kind: 'shops',      x: -360,  z: 640,   radius: 155, yaw: -Math.PI/2,  note: 'Waterfront plaza, strip malls & cafes' },
  { id: 'bobcat-key',        name: 'Bobcat Key Airport',         county: 'Mariana County',   kind: 'airport',    x: -820,  z: 1160,  radius: 155, yaw: -Math.PI/2,  note: 'Coastal runway, ATC tower & charter jet' },
  { id: 'pelican-bay',       name: 'Pelican Bay Village',        county: 'Mariana County',   kind: 'keys',       x: -1280, z: 1160,  radius: 130, yaw: Math.PI/2,   note: 'Stilted seafood shacks & marina docks' },

  // --- LEONIDA KEYS (US-1A OVERSEAS HIGHWAY BRIDGES) ---
  { id: 'corsair-key',       name: 'Corsair Key Resort',         county: 'Leonida Keys',     kind: 'keys',       x: -140,  z: 1020,  radius: 130, yaw: 0,           note: 'First Overseas Highway island & marina' },
  { id: 'key-lento',         name: 'Key Lento Village & Shops',  county: 'Leonida Keys',     kind: 'keys',       x: -440,  z: 1360,  radius: 165, yaw: Math.PI/4,   note: 'Pastel Key West cottages, Tiki bars & surf' },
  { id: 'maroon-key',        name: 'Maroon Key Lighthouse',      county: 'Leonida Keys',     kind: 'keys',       x: -980,  z: 1580,  radius: 140, yaw: Math.PI/2,   note: 'Tropical island bridgeway & beach huts' },
  { id: 'mile-zero',         name: 'Mile Zero Naval Air Station',county: 'Leonida Keys',     kind: 'airport',    x: -1540, z: 1660,  radius: 165, yaw: Math.PI/2,   note: 'Southernmost ocean runway & naval jet' }
];

// ============================================================================
// 3. CONNECTED MASTER INTERSTATE & TOWN ROAD NETWORK (ZERO DEAD ENDS!)
//    Every highway anchors directly into Vice City's exact avenues & streets!
// ============================================================================
function samplePolyline(ctrlPts, spacing = 18) {
  const out = [];
  for (let i = 0; i < ctrlPts.length - 1; i++) {
    const [x0, z0] = ctrlPts[i];
    const [x1, z1] = ctrlPts[i + 1];
    const dist = Math.hypot(x1 - x0, z1 - z0);
    const steps = Math.max(2, Math.ceil(dist / spacing));
    for (let s = 0; s < steps; s++) {
      if (i > 0 && s === 0) continue;
      const t = s / steps;
      out.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, y: 0 });
    }
  }
  const last = ctrlPts[ctrlPts.length - 1];
  out.push({ x: last[0], z: last[1], y: 0 });
  return out;
}

function makeHighway(id, label, width, ctrlPts, isTownRoad = false) {
  const pts = samplePolyline(ctrlPts, isTownRoad ? 14 : 18);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].x < minX) minX = pts[i].x;
    if (pts[i].x > maxX) maxX = pts[i].x;
    if (pts[i].z < minZ) minZ = pts[i].z;
    if (pts[i].z > maxZ) maxZ = pts[i].z;
  }
  const pad = width + 42;
  return {
    id, label, width, isTownRoad, pts,
    bbox: { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad }
  };
}

// Primary State Interstates & Scenic Loops (anchored to Vice City exact junctions!)
const PRIMARY_HIGHWAYS = [
  // 1. I-97 NORTH COASTAL FREEWAY: Ocean Dr (0,-1100) -> Leaf Links Golf -> Waning Sands -> Millport -> Mount Kalaga
  makeHighway('I-97', 'I-97 Atlantic Coastal Fwy', 16.0, [
    [0, -1100], [95, -1160], [150, -1320], [150, -1480], [140, -1720],
    [120, -1940], [30, -2120], [-240, -2240], [-660, -2240], [-1080, -2160]
  ]),
  // 2. I-297 LAKE LEONIDA & HEARTLAND LOOP: Vice Port North (-480,-1100) -> Belville -> Ambrosia -> Raceway -> Lake Leonida -> Millport
  makeHighway('I-297', 'I-297 Heartland Loop', 15.0, [
    [-480, -1100], [-580, -1240], [-580, -1520], [-680, -1680],
    [-960, -1760], [-1260, -1760], [-1260, -1980], [-1080, -2160]
  ]),
  // 3. LAKE LEONIDA EAST SHORELINE BLVD: Belville -> Lake Leonida East -> Evergreen Plaza -> Waning Sands
  makeHighway('SR-70', 'Lake Leonida Blvd', 14.0, [
    [-580, -1520], [-410, -1740], [-410, -1940], [-240, -2060], [-240, -2240]
  ]),
  makeHighway('SR-72', 'Evergreen Beach Pkwy', 14.0, [
    [-410, -1860], [-40, -1860], [120, -1940]
  ]),
  // 4. SR-628 MOUNT KALAGA ALPINE LOOP: Mount Kalaga -> Bonanza -> Grayson Canyon -> Port Gellhorn
  makeHighway('SR-628', 'Mount Kalaga Scenic Hwy', 14.0, [
    [-1080, -2160], [-1480, -2240], [-1820, -1960], [-1960, -1620], [-1960, -1280]
  ]),
  // 5. I-404 CROSSTOWN EXPRESSWAY: Vice West (-480,-780) -> Buckskin -> Emerald Springs -> Prison -> Port Gellhorn -> Wild Hog Airfield
  makeHighway('I-404', 'I-404 Crosstown Expy', 16.0, [
    [-480, -780], [-760, -800], [-1120, -820], [-1420, -860],
    [-1680, -940], [-1960, -1100], [-1960, -1280], [-2180, -1240], [-2180, -1100]
  ]),
  // 6. CR-183 HEARTLAND NORTH-SOUTH: Ambrosia Raceway -> Emerald Springs -> Gellhorn Speedway
  makeHighway('CR-183', 'CR-183 Heartland Hwy', 14.0, [
    [-1260, -1760], [-1360, -1260], [-1420, -860], [-1560, -560], [-1680, -320]
  ]),
  // 7. US-35 WEST COAST & SOUTHSIDE HWY: Port Gellhorn -> Dairy Farm -> Gellhorn Speedway -> Capri -> Grassrivers -> Vice Power -> Tequesta -> Vice Port South (-480,+340)
  makeHighway('US-35', 'US-35 West Coast Hwy', 15.5, [
    [-1960, -1280], [-1940, -960], [-1900, -660], [-1680, -320],
    [-1920, 180], [-1720, 480], [-1340, 640], [-920, 760],
    [-580, 660], [-360, 640], [-480, 460], [-480, 340]
  ]),
  // 8. SR-82 SOUTHSIDE & BOBCAT AIRPORT LOOP: Downtown Hwy South (-192,+340) -> Tequesta -> Bobcat Key Airport -> Pelican Bay -> Grassrivers
  makeHighway('SR-82', 'SR-82 Mariana Coastal Rd', 14.0, [
    [-192, 340], [-192, 520], [-360, 640], [-580, 920],
    [-820, 1160], [-1280, 1160], [-1340, 880], [-1340, 640]
  ]),
  // 9. US-1A OVERSEAS HIGHWAY (ICONIC KEYS OCEAN BRIDGES!): Ocean Dr South (0,+340) -> Tequesta -> Corsair Key -> Key Lento -> Maroon Key -> Mile Zero Naval Air Station
  makeHighway('US-1A', 'US-1A Overseas Highway', 15.0, [
    [0, 340], [0, 620], [-140, 820], [-140, 1020], [-260, 1220],
    [-440, 1360], [-720, 1490], [-980, 1580], [-1260, 1640], [-1540, 1660]
  ]),
  // Connector from Tequesta (-360,640) directly to US-1A (0,620)
  makeHighway('SR-90', 'Southside Causeway', 14.0, [
    [-360, 640], [-180, 630], [0, 620]
  ]),
  // Connector from Bobcat Key Airport (-820,1160) straight onto Key Lento (-440,1360)
  makeHighway('SR-94', 'Bobcat Keys Bridge', 13.0, [
    [-820, 1160], [-620, 1260], [-440, 1360]
  ])
];

// Paved Local Town Street Grids (real cross-streets right inside every major city & shopping district!)
const TOWN_GRID_DEFS = [
  // Port Gellhorn 3x3 Downtown Grid
  { cx: -1960, cz: -1280, cols: [-72, 0, 72], rows: [-72, 0, 72] },
  // Waning Sands Beachfront Grid
  { cx: 120,   cz: -1940, cols: [-56, 0, 56], rows: [-64, 0, 64] },
  // Ambrosia Downtown Grid
  { cx: -960,  cz: -1760, cols: [-56, 0, 56], rows: [-56, 0, 56] },
  // Capri Resort Grid
  { cx: -1920, cz: 180,   cols: [-56, 0, 56], rows: [-56, 0, 56] },
  // Tequesta Shopping Grid
  { cx: -360,  cz: 640,   cols: [-60, 0, 60], rows: [-48, 0, 48] },
  // Emerald Springs Village Crossroad
  { cx: -1420, cz: -860,  cols: [-52, 0, 52], rows: [-48, 0, 48] },
  // Key Lento Island Village Boulevard
  { cx: -440,  cz: 1360,  cols: [-52, 0, 52], rows: [-38, 0, 38] }
];

const TOWN_ROADS = [];
TOWN_GRID_DEFS.forEach((tg, gi) => {
  const minR = tg.rows[0], maxR = tg.rows[tg.rows.length - 1];
  const minC = tg.cols[0], maxC = tg.cols[tg.cols.length - 1];
  tg.cols.forEach((dx, ci) => {
    TOWN_ROADS.push(makeHighway(`TG_${gi}_C${ci}`, 'Town Ave', 11.5, [
      [tg.cx + dx, tg.cz + minR], [tg.cx + dx, tg.cz + maxR]
    ], true));
  });
  tg.rows.forEach((dz, ri) => {
    TOWN_ROADS.push(makeHighway(`TG_${gi}_R${ri}`, 'Town St', 11.5, [
      [tg.cx + minC, tg.cz + dz], [tg.cx + maxC, tg.cz + dz]
    ], true));
  });
});

export const LEONIDA_HIGHWAYS = [...PRIMARY_HIGHWAYS, ...TOWN_ROADS];

// ============================================================================
// 4. TERRAIN ELEVATION & SMOOTH BRIDGE / MOUNTAIN / FLAT-TOWN GRADING
// ============================================================================
export function getRawLandElevation(x, z) {
  const land = getLandFactor(x, z);
  if (land < 0.28) {
    return -3.2 + (land / 0.28) * 2.4;
  }
  const coastT = Math.min(1, (land - 0.28) / 0.16);
  const smoothCoast = coastT * coastT * (3 - 2 * coastT);
  let h = 0.25 + smoothCoast * 1.15; // Crisp 1.4m coastal plain

  // 1. MOUNT KALAGA ALPINE PEAK (Towering 148m granite peak north of scenic overlook!)
  const dKalagaPeak = ((x + 1080) / 290) ** 2 + ((z + 2340) / 185) ** 2;
  if (dKalagaPeak < 3.6) {
    const ridgeNoise = (Math.sin(x * 0.018) * Math.cos(z * 0.018) + Math.sin((x + z) * 0.011) * 0.5) * 7.5;
    h += Math.exp(-dKalagaPeak) * 145.0 + Math.exp(-dKalagaPeak * 0.7) * Math.max(0, ridgeNoise);
  }
  // Mount Kalaga Scenic Ridge (highway climbs smoothly to ~46m overlook right beside the 148m summit!)
  const dKalagaBench = ((x + 1080) / 340) ** 2 + ((z + 2160) / 210) ** 2;
  if (dKalagaBench < 3.2) {
    h += Math.exp(-dKalagaBench) * 34.0;
  }
  // Bonanza & Grayson Alpine Foothills
  const dBonanza = ((x + 1500) / 280) ** 2 + ((z + 2240) / 210) ** 2;
  if (dBonanza < 3.0) h += Math.exp(-dBonanza) * 26.0;
  const dGrayson = ((x + 1840) / 260) ** 2 + ((z + 1960) / 220) ** 2;
  if (dGrayson < 3.0) h += Math.exp(-dGrayson) * 38.0;

  // 2. Flatten every town, golf course, airport, speedway, prison & shopping district to crisp level ground!
  for (let i = 0; i < LEONIDA_PLACES.length; i++) {
    const pl = LEONIDA_PLACES[i];
    if (pl.kind === 'mountain') continue;
    const dist = Math.hypot(x - pl.x, z - pl.z);
    const flatR = pl.kind === 'golf' ? 235 : (pl.kind === 'airport' || pl.kind === 'city' ? 195 : 155);
    if (dist < flatR) {
      const t = Math.min(1, (flatR - dist) / (flatR * 0.42));
      const b = t * t * (3 - 2 * t);
      const targetH = pl.kind === 'swamp' ? 0.55 : (pl.kind === 'alpine' ? Math.min(h, 18.0) : 1.35);
      h = THREE.MathUtils.lerp(h, targetH, b);
    }
  }

  // Gentle natural meadow undulation outside flat zones
  h += Math.sin(x * 0.008) * Math.cos(z * 0.0085) * 0.45 * smoothCoast;
  return h;
}

// Precompute smooth highway deck heights (auto-elevating +4.6m concrete bridges over ocean straits!)
for (let hi = 0; hi < LEONIDA_HIGHWAYS.length; hi++) {
  const hw = LEONIDA_HIGHWAYS[hi];
  const rawY = new Float32Array(hw.pts.length);
  for (let i = 0; i < hw.pts.length; i++) {
    const p = hw.pts[i];
    if (isInCoreViceFootprint(p.x, p.z)) {
      rawY[i] = 0.08;
    } else {
      const lh = getRawLandElevation(p.x, p.z);
      rawY[i] = lh < 0.30 ? 4.6 : Math.max(0.55, Math.min(122.0, lh + 0.14));
    }
  }
  for (let pass = 0; pass < 4; pass++) {
    const copy = Float32Array.from(rawY);
    for (let i = 1; i < rawY.length - 1; i++) {
      rawY[i] = copy[i - 1] * 0.25 + copy[i] * 0.5 + copy[i + 1] * 0.25;
    }
  }
  for (let i = 0; i < hw.pts.length; i++) hw.pts[i].y = rawY[i];
}

export function closestLeonidaHighway(x, z) {
  let bestDistSq = Infinity;
  let bestY = 0;
  let bestWidth = 14;
  let bestId = null;
  let bestLabel = '';

  for (let hi = 0; hi < LEONIDA_HIGHWAYS.length; hi++) {
    const hw = LEONIDA_HIGHWAYS[hi];
    const bb = hw.bbox;
    if (x < bb.minX || x > bb.maxX || z < bb.minZ || z > bb.maxZ) continue;
    const pts = hw.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const abx = b.x - a.x;
      const abz = b.z - a.z;
      const lenSq = abx * abx + abz * abz;
      const t = lenSq > 1e-4 ? THREE.MathUtils.clamp(((x - a.x) * abx + (z - a.z) * abz) / lenSq, 0, 1) : 0;
      const dx = x - (a.x + abx * t);
      const dz = z - (a.z + abz * t);
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestY = a.y + (b.y - a.y) * t;
        bestWidth = hw.width;
        bestId = hw.id;
        bestLabel = hw.label;
      }
    }
  }
  return { dist: Math.sqrt(bestDistSq), roadY: bestY, width: bestWidth, id: bestId, label: bestLabel };
}

export function getLeonidaElevation(x, z) {
  if (isInCoreViceFootprint(x, z)) return 0;
  const roadHit = closestLeonidaHighway(x, z);
  const halfW = roadHit.width * 0.56;
  if (roadHit.dist <= halfW) return roadHit.roadY + 0.25;

  let h = getRawLandElevation(x, z);
  if (roadHit.dist < halfW + 42 && h > -0.15) {
    const rt = THREE.MathUtils.clamp((halfW + 42 - roadHit.dist) / 42, 0, 1);
    const rb = rt * rt * (3 - 2 * rt);
    h = THREE.MathUtils.lerp(h, roadHit.roadY, rb);
  }
  return Math.max(-0.55, h);
}

export function getLeonidaZone(x, z) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < LEONIDA_PLACES.length; i++) {
    const pl = LEONIDA_PLACES[i];
    const d = Math.hypot(x - pl.x, z - pl.z) - pl.radius * 0.55;
    if (d < bestD) { bestD = d; best = pl; }
  }
  if (!best) return { zone: 'State of Leonida', street: 'Leonida', county: 'Leonida' };

  const hwHit = closestLeonidaHighway(x, z);
  if (hwHit.dist < 15 && hwHit.id && !hwHit.id.startsWith('TG_')) {
    return {
      zone: `${best.county} · ${hwHit.id} (${best.name})`,
      street: `${hwHit.id} · ${best.name}`,
      county: best.county
    };
  }
  return {
    zone: `${best.county} · ${best.name}`,
    street: best.name,
    county: best.county
  };
}

// ============================================================================
// 5. CUSTOM PROCEDURAL GTA-STYLE VECTOR MAP CANVAS (ZERO STATIC MAP PICTURE!)
//    Draws the exact 3D coastline, lakes, Leaf Links golf course, highways,
//    town street grids, speedways, runways, mountains & district labels!
// ============================================================================
export function createLeonidaVectorMapCanvas(width = 640, height = 840) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const spanX = LEONIDA_PROJ.maxX - LEONIDA_PROJ.minX;
  const spanZ = LEONIDA_PROJ.maxZ - LEONIDA_PROJ.minZ;
  const toXY = (wx, wz) => [
    ((wx - LEONIDA_PROJ.minX) / spanX) * width,
    ((wz - LEONIDA_PROJ.minZ) / spanZ) * height
  ];

  // 1. Pixel-accurate Coastline, Bathymetry, Beaches, Mountains, Swamp & Golf Terrain Raster
  const img = ctx.createImageData(width, height);
  const data = img.data;
  for (let py = 0; py < height; py++) {
    const wz = LEONIDA_PROJ.minZ + (py / height) * spanZ;
    for (let px = 0; px < width; px++) {
      const wx = LEONIDA_PROJ.minX + (px / width) * spanX;
      const idx = (py * width + px) * 4;
      const inCore = isInCoreViceFootprint(wx, wz);
      const lf = getLandFactor(wx, wz);

      let r = 13, g = 46, b = 74; // Deep Atlantic / Gulf ocean
      if (inCore) {
        if (wx > 30 && wx < 120 && Math.abs(wz + 430) > 22) {
          r = 16; g = 68; b = 96; // Biscayne Bay turquoise channel
        } else if (wx > 14 && wx <= 30) {
          r = 210; g = 180; b = 128; // Ocean Beach sand
        } else {
          r = 46; g = 50; b = 68; // Vice City urban blocks
        }
      } else if (lf < 0.24) {
        r = 12; g = 44; b = 72; // Deep ocean
      } else if (lf < 0.28) {
        r = 22; g = 96; b = 126; // Coastal turquoise shallows
      } else if (lf < 0.34) {
        r = 208; g = 182; b = 132; // Golden sand beaches
      } else {
        const elev = getRawLandElevation(wx, wz);
        // Golf Course bright emerald turf
        if (Math.hypot(wx - 150, wz + 1480) < 185) {
          r = 54; g = 148; b = 74;
        } else if (elev > 90) {
          r = 166; g = 172; b = 178; // Mount Kalaga alpine granite peak
        } else if (elev > 42) {
          r = 104; g = 102; b = 96; // Rocky mountain ridges
        } else if (elev > 16) {
          r = 72; g = 106; b = 70; // Pine highlands
        } else if (Math.hypot(wx + 1340, wz - 640) < 230 || Math.hypot(wx + 1120, wz + 820) < 190) {
          r = 48; g = 96; b = 68; // Grassrivers & Buckskin wetlands
        } else {
          r = 66; g = 114; b = 72; // Lush Leonida mainland
        }
      }
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // 2. Subtle Tactical Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < width; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke(); }
  for (let gy = 0; gy < height; gy += 48) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke(); }

  // 3. Freshwater Lakes (crisp turquoise fill + lighter shoreline rim)
  LEONIDA_LAKES.forEach((lk) => {
    const [lx, ly] = toXY(lk.cx, lk.cz);
    const rx = (lk.rx / spanX) * width;
    const ry = (lk.rz / spanZ) * height;
    ctx.fillStyle = '#1b8fb0';
    ctx.beginPath(); ctx.ellipse(lx, ly, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d4bc8c';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 4. Leaf Links Golf Course Fairways & Ponds
  const [gx0, gy0] = toXY(150, -1480);
  ctx.fillStyle = '#47b862';
  ctx.beginPath(); ctx.ellipse(gx0, gy0, (165 / spanX) * width, (140 / spanZ) * height, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#259ec4';
  ctx.beginPath(); ctx.ellipse(gx0 - 10, gy0 + 6, 7, 5, 0, 0, Math.PI * 2); ctx.fill();

  // 5. Urban District Pads, Airfield Runways & Oval Speedways
  LEONIDA_PLACES.forEach((pl) => {
    const [px, py] = toXY(pl.x, pl.z);
    if (pl.kind === 'city' || pl.kind === 'town' || pl.kind === 'resort' || pl.kind === 'shops' || pl.kind === 'port') {
      ctx.fillStyle = 'rgba(54, 58, 76, 0.85)';
      const r = Math.max(9, (pl.radius * 0.65 / spanX) * width);
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    } else if (pl.kind === 'raceway') {
      ctx.strokeStyle = '#d8dce8';
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.ellipse(px, py, 14, 9, 0, 0, Math.PI * 2); ctx.stroke();
    } else if (pl.kind === 'airport') {
      ctx.strokeStyle = '#ffd36b';
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(px - 16, py); ctx.lineTo(px + 16, py); ctx.stroke();
    } else if (pl.kind === 'prison') {
      ctx.fillStyle = '#626672';
      ctx.fillRect(px - 10, py - 10, 20, 20);
      ctx.strokeStyle = '#ff6278';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(px - 10, py - 10, 20, 20);
    }
  });

  // 6. Vice City 6x10 Street Grid & Causeways
  const viceAves = [0, -96, -192, -288, -384, -480];
  const viceCross = [340, 180, 20, -140, -300, -460, -620, -780, -940, -1100];
  ctx.strokeStyle = 'rgba(220, 224, 236, 0.72)';
  ctx.lineWidth = 2.0;
  viceAves.forEach((ax) => {
    const [x1, y1] = toXY(ax, 340);
    const [x2, y2] = toXY(ax, -1100);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });
  viceCross.forEach((cz) => {
    const [x1, y1] = toXY(-480, cz);
    const [x2, y2] = toXY(0, cz);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });
  [-300, -620, -940].forEach((bz) => {
    const [x1, y1] = toXY(0, bz);
    const [x2, y2] = toXY(160, bz);
    ctx.strokeStyle = '#21e6d1';
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  });

  // 7. Town Street Grids (crisp pale grey urban lines)
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  TOWN_ROADS.forEach((hw) => {
    ctx.strokeStyle = 'rgba(218, 222, 234, 0.78)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    hw.pts.forEach((pt, idx) => {
      const [mx, my] = toXY(pt.x, pt.z);
      if (idx === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    });
    ctx.stroke();
  });

  // 8. Primary State Interstates & Ocean Bridges (GTA-style double-outlined golden-cream highways!)
  PRIMARY_HIGHWAYS.forEach((hw) => {
    ctx.strokeStyle = '#181d2c';
    ctx.lineWidth = hw.width >= 15 ? 5.6 : 4.4;
    ctx.beginPath();
    hw.pts.forEach((pt, idx) => {
      const [mx, my] = toXY(pt.x, pt.z);
      if (idx === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    });
    ctx.stroke();

    ctx.strokeStyle = hw.id === 'US-1A' ? '#ffd36b' : (hw.id.startsWith('I-') ? '#f8d27c' : '#e6e8f0');
    ctx.lineWidth = hw.width >= 15 ? 3.2 : 2.4;
    ctx.beginPath();
    hw.pts.forEach((pt, idx) => {
      const [mx, my] = toXY(pt.x, pt.z);
      if (idx === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    });
    ctx.stroke();
  });

  // 9. Clean Map Typography Labels (Counties + Key Destinations)
  ctx.textAlign = 'center';
  ctx.font = '800 10px "JetBrains Mono", monospace';
  const labels = [
    ['MOUNT KALAGA', -1060, -2115, '#eef4f8'],
    ['BONANZA', -1540, -2155, '#e2efe6'],
    ['MILLPORT', -240, -2290, '#e2efe6'],
    ['LAKE LEONIDA', -680, -1940, '#b5f3ff'],
    ['WANING SANDS', 120, -2015, '#ffe5b8'],
    ['LEAF LINKS GOLF', 150, -1540, '#b9ffc4'],
    ['AMBROSIA', -960, -1835, '#fff5ee'],
    ['PORT GELLHORN', -1960, -1370, '#fff5ee'],
    ['STATE PRISON', -1680, -1010, '#ffb4be'],
    ['EMERALD SPRINGS', -1420, -930, '#e8f5ea'],
    ['DAIRY FARM', -1900, -720, '#f5e2c6'],
    ['SPEEDWAY', -1680, -395, '#ffd36b'],
    ['CAPRI RESORT', -1920, 105, '#ffe5b8'],
    ['VICE CITY', -220, -360, '#ff89bc'],
    ['GRASSRIVERS', -1340, 560, '#b9f5cb'],
    ['POWER PLANT', -920, 690, '#ffd8b0'],
    ['TEQUESTA', -360, 565, '#ffe5b8'],
    ['BOBCAT AIRPORT', -820, 1090, '#ffd36b'],
    ['CORSAIR KEY', -140, 965, '#b5f3ff'],
    ['KEY LENTO', -440, 1300, '#b5f3ff'],
    ['MAROON KEY', -980, 1525, '#b5f3ff'],
    ['MILE ZERO NAS', -1540, 1600, '#ffd36b']
  ];
  labels.forEach(([txt, wx, wz, col]) => {
    const [lx, ly] = toXY(wx, wz);
    ctx.fillStyle = 'rgba(8, 12, 24, 0.85)';
    ctx.fillText(txt, lx + 1, ly + 1);
    ctx.fillStyle = col;
    ctx.fillText(txt, lx, ly);
  });

  // 10. Gold Toll Plaza ($) Badges on the Vector Map
  [[150, -1355], [-580, -1360], [-940, -810], [-1800, -70], [-192, 445], [0, 485]].forEach(([tx, tz]) => {
    const [mx, my] = toXY(tx, tz);
    ctx.fillStyle = '#0e4d34';
    ctx.beginPath(); ctx.arc(mx, my, 6.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#ffd36b';
    ctx.font = '900 8px "JetBrains Mono", monospace';
    ctx.fillText('$', mx, my + 2.8);
  });

  return canvas;
}

// ============================================================================
// 6. PROCEDURAL PBR CANVAS TEXTURES (SRGBColorSpace + Anisotropy!)
// ============================================================================
function makeTerrainTex(maxAniso = 4) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8b997e';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 10000; i++) {
    const x = (i * 73) % 512;
    const y = (i * 197 + Math.floor(i / 512) * 31) % 512;
    const v = ((i * 29) % 44) - 22;
    ctx.fillStyle = v > 0 ? `rgba(255,255,240,${(v / 260).toFixed(3)})` : `rgba(12,24,14,${(-v / 230).toFixed(3)})`;
    ctx.fillRect(x, y, 3, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(95, 135);
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

function makeHighwayTex(maxAniso = 4) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  // Dark weathered asphalt with concrete curb shoulders
  ctx.fillStyle = '#262933';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const x = (i * 53) % 256, y = (i * 101) % 256;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(x, y, 2, 2);
  }
  // Raised concrete edge shoulders
  ctx.fillStyle = '#a8aab2';
  ctx.fillRect(0, 0, 12, 256);
  ctx.fillRect(244, 0, 12, 256);
  // Crisp white outer lane lines
  ctx.fillStyle = '#eef2f6';
  ctx.fillRect(16, 0, 5, 256);
  ctx.fillRect(235, 0, 5, 256);
  // Double amber highway centerlines
  ctx.fillStyle = '#f5be49';
  ctx.fillRect(122, 0, 4, 256);
  ctx.fillRect(130, 0, 4, 256);
  // Dashed lane dividers
  ctx.fillStyle = 'rgba(240, 244, 250, 0.72)';
  for (let y = 12; y < 256; y += 52) {
    ctx.fillRect(68, y, 3, 24);
    ctx.fillRect(185, y, 3, 24);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

function makeGolfFairwayTex(maxAniso = 4) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  // Classic striped championship mowed fairway bands!
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#3c9a46' : '#4ab152';
    ctx.fillRect(i * 32, 0, 32, 512);
  }
  for (let i = 0; i < 6000; i++) {
    const x = (i * 97) % 512, y = (i * 131) % 512;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,220,0.05)' : 'rgba(10,40,14,0.06)';
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

function makeFacadeTex(style, maxAniso = 4) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const ctx = c.getContext('2d');

  if (style === 'artdeco') {
    ctx.fillStyle = '#f2e8dc';
    ctx.fillRect(0, 0, 256, 512);
    // Horizontal Art Deco pastel bands + rounded ocean balconies
    for (let row = 0; row < 12; row++) {
      const y = row * 42;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, y, 256, 7);
      for (let col = 0; col < 6; col++) {
        const x = col * 42 + 6;
        ctx.fillStyle = ((row + col) % 4 === 0) ? '#9be8f2' : '#263a52';
        ctx.fillRect(x, y + 12, 30, 24);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(x, y + 12, 30, 5);
      }
    }
  } else if (style === 'glass') {
    ctx.fillStyle = '#1c2b3e';
    ctx.fillRect(0, 0, 256, 512);
    for (let row = 0; row < 16; row++) {
      const y = row * 32;
      ctx.fillStyle = '#334d6e';
      ctx.fillRect(0, y, 256, 4);
      for (let col = 0; col < 8; col++) {
        const x = col * 32 + 3;
        const warm = ((row * 5 + col * 11) % 7) === 0;
        ctx.fillStyle = warm ? '#ffd996' : '#3a6b96';
        ctx.fillRect(x, y + 6, 26, 22);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x, y + 6, 12, 10);
      }
    }
  } else if (style === 'brick') {
    ctx.fillStyle = '#a85a46';
    ctx.fillRect(0, 0, 256, 512);
    // Subtle brick courses
    ctx.fillStyle = 'rgba(40, 16, 12, 0.22)';
    for (let y = 0; y < 512; y += 8) ctx.fillRect(0, y, 256, 1);
    for (let row = 0; row < 8; row++) {
      const y = row * 64;
      ctx.fillStyle = '#d4c8b8';
      ctx.fillRect(0, y, 256, 6);
      for (let col = 0; col < 4; col++) {
        const x = col * 64 + 12;
        ctx.fillStyle = '#e8dfd2';
        ctx.fillRect(x - 3, y + 14, 46, 38);
        ctx.fillStyle = ((row + col) % 3 === 0) ? '#ffe2a4' : '#223042';
        ctx.fillRect(x, y + 17, 40, 32);
      }
    }
  } else if (style === 'shop') {
    // Ground-floor wide retail storefront + warm upper plaster!
    ctx.fillStyle = '#eee4d6';
    ctx.fillRect(0, 0, 256, 512);
    // Upper floor windows
    for (let col = 0; col < 4; col++) {
      const x = col * 64 + 12;
      ctx.fillStyle = '#2c415c';
      ctx.fillRect(x, 60, 40, 68);
      ctx.fillStyle = '#f8f2ea';
      ctx.fillRect(x + 18, 60, 4, 68);
      ctx.fillRect(x, 92, 40, 4);
    }
    // Sign fascia band
    ctx.fillStyle = '#1e2030';
    ctx.fillRect(0, 220, 256, 52);
    // Ground-floor bright retail glass display windows & central entry door!
    ctx.fillStyle = '#334860';
    ctx.fillRect(0, 290, 256, 222);
    ctx.fillStyle = '#fff0c8';
    ctx.fillRect(14, 310, 82, 146);
    ctx.fillRect(160, 310, 82, 146);
    ctx.fillStyle = '#8fe8f0';
    ctx.fillRect(108, 324, 40, 180);
  } else if (style === 'timber') {
    ctx.fillStyle = '#7a4d2e';
    ctx.fillRect(0, 0, 256, 512);
    for (let y = 0; y < 512; y += 16) {
      ctx.fillStyle = 'rgba(30, 14, 6, 0.32)';
      ctx.fillRect(0, y, 256, 3);
      ctx.fillStyle = 'rgba(255, 220, 180, 0.08)';
      ctx.fillRect(0, y + 3, 256, 3);
    }
    for (let col = 0; col < 3; col++) {
      const x = col * 84 + 16;
      ctx.fillStyle = '#3d2212';
      ctx.fillRect(x - 4, 140, 56, 76);
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(x, 144, 48, 68);
    }
  } else {
    // Key West clapboard siding
    ctx.fillStyle = '#f2f0e6';
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let y = 0; y < 512; y += 14) ctx.fillRect(0, y, 256, 2);
    for (let row = 0; row < 2; row++) {
      const y = 70 + row * 210;
      for (let col = 0; col < 3; col++) {
        const x = col * 82 + 18;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 4, y - 4, 52, 86);
        ctx.fillStyle = '#2d5c6e';
        ctx.fillRect(x, y, 44, 78);
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = Math.min(8, maxAniso);
  return tex;
}

function makeShopSignTex(title, bgHex, accentHex) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 112);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 54px "Big Shoulders Display", "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title.toUpperCase(), 256, 84);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHighwaySignTex(title, subtitle) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 144;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0d5e3c';
  ctx.fillRect(0, 0, 512, 144);
  ctx.strokeStyle = '#f4f8f5';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 128);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 40px "Barlow Condensed", "Arial Narrow", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title.toUpperCase(), 256, 70);
  ctx.fillStyle = '#ffd36b';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText(subtitle.toUpperCase(), 256, 112);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ============================================================================
// 7. COMPOSITE ARCHITECTURAL PREFABS (SHOPS, GOLF CLUB, BARNS, COTTAGES, ETC.)
// ============================================================================
function buildShopRowBlock(x, y, z, yaw, shopConfigs, shopMat, addBoxCollider) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = yaw;

  const totalW = shopConfigs.length * 14 + 2;
  const depth = 13;

  // Grounded deep concrete sidewalk plinth so shops NEVER float on terrain slopes!
  const walk = new THREE.Mesh(
    new THREE.BoxGeometry(totalW + 2.8, 3.4, depth + 5.0),
    new THREE.MeshStandardMaterial({ color: 0xc8c4bc, roughness: 0.88 })
  );
  walk.position.set(0, -1.42, 1.2);
  grp.add(walk);

  shopConfigs.forEach((cfg, idx) => {
    const sx = (idx - (shopConfigs.length - 1) * 0.5) * 14;
    const h = cfg.h || 8.2;

    // 1. Main Storefront Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(13.4, h, depth), shopMat);
    body.position.set(sx, h * 0.5 + 0.25, 0);
    grp.add(body);

    // 2. Stepped Parapet Roofline Trim
    const parapet = new THREE.Mesh(
      new THREE.BoxGeometry(13.8, 1.1, depth + 0.4),
      new THREE.MeshStandardMaterial({ color: cfg.trim || 0xff2e88, roughness: 0.45 })
    );
    parapet.position.set(sx, h + 0.7, 0);
    grp.add(parapet);

    // 3. Angled Striped Retail Awning Overhang
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(12.2, 0.35, 2.8),
      new THREE.MeshStandardMaterial({ color: cfg.awning || 0x21e6d1, roughness: 0.72 })
    );
    awning.position.set(sx, 3.85, depth * 0.5 + 1.15);
    awning.rotation.x = 0.26;
    grp.add(awning);

    // 4. Illuminated Storefront Signboard
    const signTex = makeShopSignTex(cfg.name, cfg.signBg || '#18142b', cfg.trimHex || '#21E6D1');
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 2.1, 0.35),
      new THREE.MeshStandardMaterial({
        map: signTex,
        emissive: new THREE.Color(cfg.trim || 0x21e6d1),
        emissiveMap: signTex,
        emissiveIntensity: 0.55,
        roughness: 0.3
      })
    );
    sign.position.set(sx, 5.5, depth * 0.5 + 0.2);
    grp.add(sign);
  });

  // Solid bounding box collider rotated into world space
  if (addBoxCollider) {
    const cos = Math.abs(Math.cos(yaw)), sin = Math.abs(Math.sin(yaw));
    const hw = (totalW * cos + depth * sin) * 0.5;
    const hd = (totalW * sin + depth * cos) * 0.5;
    addBoxCollider(x - hw, x + hw, z - hd, z + hd);
  }
  return grp;
}

function buildGolfCourseDistrict(cx, cz, maxAniso, addBoxCollider, addCircleCollider) {
  const grp = new THREE.Group();
  const baseY = getRawLandElevation(cx, cz);

  // 1. Expansive Mowed Emerald Fairway Carpet (striped PBR turf!)
  const fairwayGeo = new THREE.CircleGeometry(175, 48);
  fairwayGeo.rotateX(-Math.PI / 2);
  const fairwayMat = new THREE.MeshStandardMaterial({
    map: makeGolfFairwayTex(maxAniso),
    roughness: 0.88,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1
  });
  const fairwayMesh = new THREE.Mesh(fairwayGeo, fairwayMat);
  fairwayMesh.position.set(cx, baseY + 0.05, cz);
  fairwayMesh.scale.set(1.08, 1, 0.92);
  fairwayMesh.receiveShadow = true;
  grp.add(fairwayMesh);

  // 2. Winding White Golf Cart Path Ring
  const cartPts = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    cartPts.push(new THREE.Vector3(cx + Math.cos(a) * 112, baseY + 0.13, cz + Math.sin(a) * 95));
  }
  const cartCurve = new THREE.CatmullRomCurve3(cartPts, true);
  const cartSamples = cartCurve.getPoints(96);
  const cpPos = [], cpIdx = [];
  for (let i = 0; i < cartSamples.length; i++) {
    const p = cartSamples[i];
    const nxt = cartSamples[(i + 1) % cartSamples.length];
    const tx = nxt.x - p.x, tz = nxt.z - p.z;
    const l = Math.hypot(tx, tz) || 1;
    const rx = -tz / l * 2.1, rz = tx / l * 2.1;
    cpPos.push(p.x - rx, p.y, p.z - rz, p.x + rx, p.y, p.z + rz);
    if (i > 0) {
      const k = i * 2;
      cpIdx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  }
  const cpGeo = new THREE.BufferGeometry();
  cpGeo.setAttribute('position', new THREE.Float32BufferAttribute(cpPos, 3));
  cpGeo.setIndex(cpIdx);
  cpGeo.computeVertexNormals();
  grp.add(new THREE.Mesh(cpGeo, new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.84, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 })));

  // 3. Six Bright Putting Greens, Sand Bunkers & Red Flagsticks!
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x5ee06a, roughness: 0.72, polygonOffset: true, polygonOffsetFactor: -2 });
  const bunkerMat = new THREE.MeshStandardMaterial({ color: 0xebd29a, roughness: 0.94, polygonOffset: true, polygonOffsetFactor: -2 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f8, metalness: 0.6, roughness: 0.3 });
  const flagMat = new THREE.MeshStandardMaterial({ color: 0xff2e4c, emissive: 0x881020, emissiveIntensity: 0.35, roughness: 0.5, side: THREE.DoubleSide });

  const holes = [
    [-70, -68], [55, -75], [115, -8], [72, 74], [-42, 82], [-112, 16]
  ];
  holes.forEach(([dx, dz]) => {
    const gx = cx + dx, gz = cz + dz;
    const grn = new THREE.Mesh(new THREE.CircleGeometry(15, 22), greenMat);
    grn.rotation.x = -Math.PI / 2;
    grn.position.set(gx, baseY + 0.16, gz);
    grp.add(grn);

    // Sand Trap Bunker beside green
    const bnk = new THREE.Mesh(new THREE.CircleGeometry(9.5, 18), bunkerMat);
    bnk.rotation.x = -Math.PI / 2;
    bnk.scale.set(1.4, 0.78, 1);
    bnk.position.set(gx + 16, baseY + 0.14, gz + 9);
    grp.add(bnk);

    // Flagstick & Red Pennant Flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.8, 6), poleMat);
    pole.position.set(gx, baseY + 2.5, gz);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0), flagMat);
    flag.position.set(gx + 0.85, baseY + 4.3, gz);
    grp.add(pole, flag);
  });

  // 4. Two Shimmering Blue Golf Water Hazards
  const pondMat = new THREE.MeshStandardMaterial({ color: 0x1ea3c8, roughness: 0.16, metalness: 0.25, envMapIntensity: 1.25 });
  [[62, 14, 26, 18], [-64, -14, 24, 16]].forEach(([dx, dz, rx, rz]) => {
    const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 24), pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(rx, rz, 1);
    pond.position.set(cx + dx, baseY + 0.14, cz + dz);
    grp.add(pond);
  });

  // 5. Mediterranean Leaf Links Golf Clubhouse (Multi-Part Composite Hero Building!)
  const chX = cx - 44, chZ = cz - 122;
  const chGrp = new THREE.Group();
  chGrp.position.set(chX, baseY, chZ);

  const stuccoMat = new THREE.MeshStandardMaterial({ color: 0xf7ebd8, roughness: 0.76 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xc2553a, roughness: 0.68 });
  const colMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x3b789c, roughness: 0.18, metalness: 0.55 });

  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(34, 9.5, 18), stuccoMat);
  mainHall.position.y = 4.75;
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(12, 7.2, 14), stuccoMat);
  wingL.position.set(-22, 3.6, 1.5);
  const wingR = wingL.clone();
  wingR.position.x = 22;

  // Terracotta Pitched Hip Roofs
  const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(25, 5.8, 4), roofMat);
  mainRoof.rotation.y = Math.PI / 4;
  mainRoof.scale.set(1.15, 1, 0.72);
  mainRoof.position.y = 12.2;
  const wingRoofL = new THREE.Mesh(new THREE.ConeGeometry(10.5, 3.6, 4), roofMat);
  wingRoofL.rotation.y = Math.PI / 4;
  wingRoofL.position.set(-22, 9.0, 1.5);
  const wingRoofR = wingRoofL.clone();
  wingRoofR.position.x = 22;

  // Colonnaded Entry Portico + Panoramic Clubhouse Windows + Sign
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 6.2), roofMat);
  porticoRoof.position.set(0, 5.4, 11.5);
  for (const px of [-6.5, -2.2, 2.2, 6.5]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 5.2, 10), colMat);
    col.position.set(px, 2.6, 13.8);
    chGrp.add(col);
  }
  const clubWin = new THREE.Mesh(new THREE.BoxGeometry(28, 3.4, 18.2), glassMat);
  clubWin.position.y = 4.4;
  const clubSignTex = makeShopSignTex('LEAF LINKS GOLF CLUB', '#0e4a2b', '#FFD36B');
  const clubSign = new THREE.Mesh(
    new THREE.BoxGeometry(14, 2.4, 0.4),
    new THREE.MeshStandardMaterial({ map: clubSignTex, emissive: 0xffd36b, emissiveMap: clubSignTex, emissiveIntensity: 0.35 })
  );
  clubSign.position.set(0, 7.4, 14.3);

  chGrp.add(mainHall, wingL, wingR, mainRoof, wingRoofL, wingRoofR, porticoRoof, clubWin, clubSign);
  grp.add(chGrp);
  if (addBoxCollider) addBoxCollider(chX - 28, chX + 28, chZ - 10, chZ + 14);

  // 6. Parked Golf Carts outside Clubhouse!
  const cartBodyMat = new THREE.MeshStandardMaterial({ color: 0xf4f7f2, roughness: 0.35, metalness: 0.15 });
  const cartRoofMat = new THREE.MeshStandardMaterial({ color: 0x196e3c, roughness: 0.65 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, roughness: 0.85 });
  for (let i = 0; i < 4; i++) {
    const gc = new THREE.Group();
    gc.position.set(chX - 18 + i * 5.2, baseY, chZ + 20);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 2.4), cartBodyMat);
    base.position.y = 0.62;
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.14, 2.0), cartRoofMat);
    top.position.y = 1.92;
    for (const [px, pz] of [[-0.6, -0.8], [0.6, -0.8], [-0.6, 0.75], [0.6, 0.75]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 5), poleMat);
      p.position.set(px, 1.4, pz);
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 8), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(px * 1.15, 0.28, pz);
      gc.add(p, w);
    }
    gc.add(base, top);
    grp.add(gc);
    if (addCircleCollider) addCircleCollider(chX - 18 + i * 5.2, chZ + 20, 1.4);
  }

  return grp;
}

function buildKeyWestCottage(x, y, z, yaw, pastelHex, clapMat, addBoxCollider) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = yaw;

  const stiltMat = new THREE.MeshStandardMaterial({ color: 0x6b4e34, roughness: 0.88 });
  const wallMat = clapMat.clone();
  wallMat.color = new THREE.Color(pastelHex);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b6e7a, roughness: 0.48, metalness: 0.35 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xb8966e, roughness: 0.86 });

  // Stilts + raised timber deck
  for (const sx of [-4.2, 0, 4.2]) {
    for (const sz of [-3.4, 3.4]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.2, 0.45), stiltMat);
      st.position.set(sx, 1.1, sz);
      grp.add(st);
    }
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.35, 10.6), deckMat);
  deck.position.y = 2.25;
  const body = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.8, 7.6), wallMat);
  body.position.set(0, 4.8, -0.6);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.8, 3.2, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.12, 1, 0.92);
  roof.position.set(0, 8.7, -0.6);

  // Porch railing posts
  const rail = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.9, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }));
  rail.position.set(0, 2.85, 5.1);
  grp.add(deck, body, roof, rail);

  if (addBoxCollider) addBoxCollider(x - 6, x + 6, z - 5.5, z + 5.5);
  return grp;
}

function buildTimberCabin(x, y, z, yaw, timberMat, addBoxCollider) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);
  grp.rotation.y = yaw;

  const base = new THREE.Mesh(new THREE.BoxGeometry(10.5, 5.0, 8.4), timberMat);
  base.position.y = 2.5;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(8.2, 4.2, 4),
    new THREE.MeshStandardMaterial({ color: 0x3b2c24, roughness: 0.88 })
  );
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 1, 0.92);
  roof.position.y = 7.0;
  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 8.8, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x7a7670, roughness: 0.92 })
  );
  chimney.position.set(3.4, 4.4, -2.0);
  grp.add(base, roof, chimney);

  if (addBoxCollider) addBoxCollider(x - 5.5, x + 5.5, z - 4.5, z + 4.5);
  return grp;
}

// ============================================================================
// 8. BUILD ENTIRE 3D GREAT STATE OF LEONIDA (COHESIVE, VARIED, HIGH-FPS!)
// ============================================================================
export function buildLeonidaWorld(scene, baseGetTerrainHeight, maxAniso = 4, addBoxCollider, addCircleCollider, showroomSpots = []) {
  const root = new THREE.Group();
  root.name = 'StateOfLeonida';

  const seeded = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const isNearShowroom = (x, z, pad = 22) => {
    for (let i = 0; i < showroomSpots.length; i++) {
      if (Math.hypot(x - showroomSpots[i].x, z - showroomSpots[i].z) < pad) return true;
    }
    return false;
  };

  // --- A. HIGH-RES MULTI-BIOME TERRAIN MESH (200 x 260) + EXACT O(1) BARYCENTRIC HEIGHT SAMPLER! ---
  const segX = 200, segZ = 260;
  const widthX = LEONIDA_PROJ.maxX - LEONIDA_PROJ.minX;
  const depthZ = LEONIDA_PROJ.maxZ - LEONIDA_PROJ.minZ;
  const centerX = (LEONIDA_PROJ.minX + LEONIDA_PROJ.maxX) * 0.5;
  const centerZ = (LEONIDA_PROJ.minZ + LEONIDA_PROJ.maxZ) * 0.5;

  const tGeo = new THREE.PlaneGeometry(widthX, depthZ, segX, segZ);
  tGeo.rotateX(-Math.PI / 2);
  const posAttr = tGeo.attributes.position;
  const meshHeights = new Float32Array(posAttr.count);
  const colors = new Float32Array(posAttr.count * 3);
  const tmpCol = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const wx = posAttr.getX(i) + centerX;
    const wz = posAttr.getZ(i) + centerZ;
    if (isInCoreViceFootprint(wx, wz) || isInLegacyMountains(wx, wz)) {
      posAttr.setY(i, -2.8);
      meshHeights[i] = -2.8;
      tmpCol.setHex(0x284634);
    } else {
      const lf = getLandFactor(wx, wz);
      let y = getLeonidaElevation(wx, wz);
      const hw = closestLeonidaHighway(wx, wz);
      if (hw.dist < hw.width * 0.62) y -= 0.22;
      posAttr.setY(i, y);
      meshHeights[i] = y;

      if (lf < 0.30) tmpCol.setHex(0xc8b284);
      else if (lf < 0.36 && y < 2.2) tmpCol.setHex(0xe4c992); // Golden sand beaches
      else if (y > 95) tmpCol.setHex(0xc8cfd6); // Mount Kalaga alpine summit granite
      else if (y > 42) tmpCol.setHex(0x6e6a64); // Rocky mountain cliffs
      else if (Math.hypot(wx + 1820, wz + 1960) < 280 && y > 12) tmpCol.setHex(0xa86444); // Manifest Canyon redrock
      else if (Math.hypot(wx + 1340, wz - 640) < 260 || Math.hypot(wx + 1120, wz + 820) < 220) tmpCol.setHex(0x456f46); // Bayou wetlands
      else if (wz < -1800) tmpCol.setHex(0x3a643c); // Northern pine highlands
      else if (wz > 900) tmpCol.setHex(0x699b56); // Tropical Keys grass
      else tmpCol.setHex(0x52824b); // Subtropical plains
      tmpCol.multiplyScalar(0.93 + seeded(i) * 0.14);
    }
    colors[i * 3] = tmpCol.r;
    colors[i * 3 + 1] = tmpCol.g;
    colors[i * 3 + 2] = tmpCol.b;
  }
  tGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  tGeo.computeVertexNormals();
  tGeo.computeBoundingSphere();

  const strideX = segX + 1;
  const sampleMeshHeight = (wx, wz) => {
    const fx = ((wx - LEONIDA_PROJ.minX) / widthX) * segX;
    const fz = ((wz - LEONIDA_PROJ.minZ) / depthZ) * segZ;
    if (fx < 0 || fx >= segX || fz < 0 || fz >= segZ) return -999;
    const ix = Math.floor(fx), iz = Math.floor(fz);
    const u = fx - ix, v = fz - iz;
    const a = iz * strideX + ix;
    const b = (iz + 1) * strideX + ix;
    const c = b + 1;
    const d = a + 1;
    const ya = meshHeights[a], yb = meshHeights[b], yc = meshHeights[c], yd = meshHeights[d];
    return (u + v <= 1)
      ? (ya + u * (yd - ya) + v * (yb - ya))
      : (yc + (1 - u) * (yb - yc) + (1 - v) * (yd - yc));
  };

  // Generate AAA Procedural PBR Material Suite (Albedo + NormalMap + RoughnessMap for EVERYTHING!)
  const pbr = createLeonidaPBRMaterials(maxAniso);

  const terrainMesh = new THREE.Mesh(tGeo, pbr.terrainMat);
  terrainMesh.position.set(centerX, 0, centerZ);
  terrainMesh.receiveShadow = true;
  terrainMesh.frustumCulled = false;
  root.add(terrainMesh);

  // --- B. INLAND FRESHWATER LAKES (Lake Leonida, Emerald Lake, Cottonmouth Lagoon) ---
  const lakeMat = new THREE.MeshStandardMaterial({
    color: 0x1b96b8, roughness: 0.16, metalness: 0.28, envMapIntensity: 1.3
  });
  LEONIDA_LAKES.forEach((lk) => {
    const lGeo = new THREE.CircleGeometry(1, 36);
    lGeo.rotateX(-Math.PI / 2);
    const lMesh = new THREE.Mesh(lGeo, lakeMat);
    lMesh.scale.set(lk.rx, 1, lk.rz);
    lMesh.position.set(lk.cx, -0.10, lk.cz);
    root.add(lMesh);
  });

  // --- C. MERGED CONTINUOUS ASPHALT HIGHWAY & TOWN STREET NETWORK (1 DRAW CALL!) ---
  const hwPositions = [], hwNormals = [], hwUvs = [], hwIndices = [];
  const bridgePiers = [], bridgeRails = [], lampPosts = [];
  let vCursor = 0;

  for (let hi = 0; hi < LEONIDA_HIGHWAYS.length; hi++) {
    const hw = LEONIDA_HIGHWAYS[hi];
    const pts = hw.pts;
    const halfW = hw.width * 0.5;
    let distAccum = 0;

    for (let i = 0; i < pts.length; i++) {
      const curr = pts[i];
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      if (i > 0) distAccum += Math.hypot(curr.x - prev.x, curr.z - prev.z);

      const inCore = isInCoreViceFootprint(curr.x, curr.z);
      const tx = next.x - prev.x, tz = next.z - prev.z;
      const tLen = Math.hypot(tx, tz) || 1;
      const rx = -tz / tLen, rz = tx / tLen;
      const yDeck = inCore ? -0.32 : curr.y + 0.20;

      hwPositions.push(curr.x - rx * halfW, yDeck, curr.z - rz * halfW);
      hwPositions.push(curr.x + rx * halfW, yDeck, curr.z + rz * halfW);
      hwNormals.push(0, 1, 0, 0, 1, 0);
      hwUvs.push(0, distAccum / 16, 1, distAccum / 16);

      if (i > 0) {
        const prevInCore = isInCoreViceFootprint(prev.x, prev.z);
        if (!inCore || !prevInCore) {
          const a = vCursor - 2, b = vCursor - 1, c = vCursor, d = vCursor + 1;
          // Counter-clockwise winding viewed from +Y so asphalt road faces UP!
          hwIndices.push(a, b, c, b, d, c);
        }
      }
      vCursor += 2;

      if (!inCore) {
        const yaw = Math.atan2(tx, tz);
        const overWater = curr.y > 2.6 && getRawLandElevation(curr.x, curr.z) < 0.30;
        if (overWater && i % 2 === 0) {
          bridgePiers.push({ x: curr.x, y: curr.y, z: curr.z, yaw });
          bridgeRails.push({ x: curr.x - rx * (halfW + 0.35), y: curr.y + 0.65, z: curr.z - rz * (halfW + 0.35), yaw });
          bridgeRails.push({ x: curr.x + rx * (halfW + 0.35), y: curr.y + 0.65, z: curr.z + rz * (halfW + 0.35), yaw });
        } else if (hw.isTownRoad && i % 3 === 1) {
          lampPosts.push({ x: curr.x + rx * (halfW + 1.4), y: curr.y, z: curr.z + rz * (halfW + 1.4) });
        }
      }
    }
  }

  const hwGeo = new THREE.BufferGeometry();
  hwGeo.setAttribute('position', new THREE.Float32BufferAttribute(hwPositions, 3));
  hwGeo.setAttribute('normal', new THREE.Float32BufferAttribute(hwNormals, 3));
  hwGeo.setAttribute('uv', new THREE.Float32BufferAttribute(hwUvs, 2));
  hwGeo.setIndex(hwIndices);
  hwGeo.computeBoundingSphere();

  const hwMesh = new THREE.Mesh(hwGeo, pbr.highwayMat);
  hwMesh.receiveShadow = true;
  hwMesh.frustumCulled = false;
  root.add(hwMesh);

  // Seamless Asphalt Connector Aprons right at every Vice City Gateway Intersection!
  [[0, -1104], [-480, -1104], [-484, -780], [-484, 340], [-192, 344], [0, 344]].forEach(([ax, az]) => {
    const ap = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), pbr.intersectionMat);
    ap.rotation.x = -Math.PI / 2;
    ap.position.set(ax, 0.18, az);
    root.add(ap);
  });

  // Instanced Poured-Concrete Bridge Piers, Steel Guardrails & Brushed-Metal Street Lamps
  const dummy = new THREE.Object3D();
  if (bridgePiers.length > 0) {
    const pierInst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(11.5, 9.6, 2.4),
      pbr.concreteMat,
      bridgePiers.length
    );
    bridgePiers.forEach((bp, i) => {
      dummy.position.set(bp.x, bp.y - 4.85, bp.z);
      dummy.rotation.set(0, bp.yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pierInst.setMatrixAt(i, dummy.matrix);
    });
    pierInst.instanceMatrix.needsUpdate = true;
    pierInst.computeBoundingSphere();
    root.add(pierInst);
  }
  if (bridgeRails.length > 0) {
    const railInst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.65, 1.18, 36.0),
      pbr.brushedSteelMat,
      bridgeRails.length
    );
    bridgeRails.forEach((br, i) => {
      dummy.position.set(br.x, br.y, br.z);
      dummy.rotation.set(0, br.yaw, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      railInst.setMatrixAt(i, dummy.matrix);
    });
    railInst.instanceMatrix.needsUpdate = true;
    railInst.computeBoundingSphere();
    root.add(railInst);
  }
  if (lampPosts.length > 0) {
    const poleInst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.12, 0.18, 7.6, 6),
      pbr.darkMetalMat,
      lampPosts.length
    );
    const bulbInst = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.36, 7, 7),
      new THREE.MeshBasicMaterial({ color: 0xffe6a8 }),
      lampPosts.length
    );
    lampPosts.forEach((lp, i) => {
      dummy.position.set(lp.x, lp.y + 3.8, lp.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poleInst.setMatrixAt(i, dummy.matrix);
      dummy.position.set(lp.x, lp.y + 7.65, lp.z);
      dummy.updateMatrix();
      bulbInst.setMatrixAt(i, dummy.matrix);
    });
    poleInst.instanceMatrix.needsUpdate = true;
    bulbInst.instanceMatrix.needsUpdate = true;
    poleInst.computeBoundingSphere();
    bulbInst.computeBoundingSphere();
    root.add(poleInst, bulbInst);
  }

  // --- D. SHARED PBR ARCHITECTURAL MATERIALS (NORMAL + ROUGHNESS MAPS!) ---
  const artDecoMat = pbr.artDecoMat;
  const glassMat   = pbr.glassMat;
  const brickMat   = pbr.brickMat;
  const shopMat    = pbr.shopMat;
  const timberMat  = pbr.timberMat;
  const clapMat    = pbr.clapMat;

  // Collect varied instanced city buildings by style (Art Deco vs Glass Tower vs Brick Commercial)
  const artDecoList = [], glassList = [], brickList = [];
  const pushBuilding = (arr, x, z, w, h, d, colorHex, yaw = 0) => {
    const hwHit = closestLeonidaHighway(x, z);
    if (hwHit.dist < hwHit.width * 0.5 + Math.max(w, d) * 0.56) return; // NEVER overlap any road!
    if (isNearShowroom(x, z, 24)) return; // Keep spread-out Case Study Showrooms 100% clear!
    if (getLandFactor(x, z) < 0.31) return;
    const y = getLeonidaElevation(x, z);
    arr.push({ x, y, z, w, h, d, colorHex, yaw });
    if (addBoxCollider) addBoxCollider(x - w * 0.5, x + w * 0.5, z - d * 0.5, z + d * 0.5);
  };

  // --- E. LEAF LINKS CHAMPIONSHIP GOLF COURSE ---
  root.add(buildGolfCourseDistrict(150, -1480, maxAniso, addBoxCollider, addCircleCollider));

  // --- F. PROPERLY LAID-OUT SHOPPING STRIPS & RETAIL PLAZAS ---
  const shopPlazas = [
    // Waning Sands Beachfront Shopping Strip
    { x: 148, z: -1940, yaw: -Math.PI/2, shops: [
      { name: 'SURF & DIVE', awning: 0x21e6d1, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#0b2a36', h: 8.5 },
      { name: 'OCEAN CAFE',  awning: 0xff8a2a, trim: 0xff8a2a, trimHex: '#FF8A2A', signBg: '#2e1508', h: 8.0 },
      { name: 'VICE GELATO', awning: 0xff2e88, trim: 0xff2e88, trimHex: '#FF2E88', signBg: '#2e081d', h: 9.0 }
    ]},
    // Evergreen Shopping Plaza (South & North sides of SR-72!)
    { x: -40, z: -1834, yaw: Math.PI, shops: [
      { name: 'BURGER SHOT', awning: 0xff3b3b, trim: 0xffd36b, trimHex: '#FFD36B', signBg: '#3a0b0b', h: 8.5 },
      { name: 'BOUTIQUE 86', awning: 0xff2e88, trim: 0xff2e88, trimHex: '#FF2E88', signBg: '#24081c', h: 9.2 },
      { name: 'ARCADE ZONE', awning: 0x21e6d1, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#081e2c', h: 8.8 }
    ]},
    { x: -40, z: -1886, yaw: 0, shops: [
      { name: 'DONUT PALACE', awning: 0xff8a2a, trim: 0xffd36b, trimHex: '#FFD36B', signBg: '#2b1206', h: 8.4 },
      { name: 'VINYL RECORDS', awning: 0xa259ff, trim: 0xff2e88, trimHex: '#FF2E88', signBg: '#1c0c30', h: 9.0 },
      { name: 'VICE PHARMACY', awning: 0x28c76f, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#082418', h: 8.2 }
    ]},
    // Port Gellhorn Main Street Shops (East & West of Main Ave!)
    { x: -1936, z: -1275, yaw: -Math.PI/2, shops: [
      { name: 'PAWN & LOAN',  awning: 0xffc83b, trim: 0xffc83b, trimHex: '#FFC83B', signBg: '#261b06', h: 8.5 },
      { name: 'AUTO CUSTOMS', awning: 0x21e6d1, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#0a1c28', h: 9.0 },
      { name: 'SUNSET DINER', awning: 0xff2e88, trim: 0xff8a2a, trimHex: '#FF8A2A', signBg: '#2b0d1b', h: 8.0 }
    ]},
    { x: -1984, z: -1275, yaw: Math.PI/2, shops: [
      { name: 'LIQUOR MART',  awning: 0xff5a36, trim: 0xff8a2a, trimHex: '#FF8A2A', signBg: '#281008', h: 8.2 },
      { name: 'HARDWARE CO',  awning: 0x3b88ff, trim: 0x62b4ff, trimHex: '#62B4FF', signBg: '#0c1d38', h: 8.8 },
      { name: 'PIZZA STACK',  awning: 0x28c76f, trim: 0xffd36b, trimHex: '#FFD36B', signBg: '#122a16', h: 8.4 }
    ]},
    { x: -1936, z: -1336, yaw: -Math.PI/2, shops: [
      { name: 'GELLHORN BANK', awning: 0x4ca6ff, trim: 0x99d6ff, trimHex: '#99D6FF', signBg: '#0b1c36', h: 10.5 },
      { name: 'NEON CLUB',     awning: 0xff2e88, trim: 0xff2e88, trimHex: '#FF2E88', signBg: '#2b0820', h: 9.4 }
    ]},
    { x: -1984, z: -1336, yaw: Math.PI/2, shops: [
      { name: '24/7 MARKET',   awning: 0x28c76f, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#0a2618', h: 8.4 },
      { name: 'BARBER & CO',   awning: 0xff5a36, trim: 0xffd36b, trimHex: '#FFD36B', signBg: '#291208', h: 8.6 }
    ]},
    // Ambrosia Main Street
    { x: -960, z: -1732, yaw: Math.PI, shops: [
      { name: 'SUGAR BAKERY', awning: 0xff9a52, trim: 0xffd36b, trimHex: '#FFD36B', signBg: '#2a1608', h: 8.2 },
      { name: 'RODEO GEAR',   awning: 0xc24838, trim: 0xff8a2a, trimHex: '#FF8A2A', signBg: '#280e0a', h: 8.6 },
      { name: 'MOTOR PARTS',  awning: 0x21e6d1, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#0a202b', h: 8.0 }
    ]},
    // Emerald Springs Crossroads
    { x: -1420, z: -834, yaw: Math.PI, shops: [
      { name: 'SPRINGS CAFE', awning: 0x2ec4b6, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#082624', h: 7.8 },
      { name: 'BAIT & TACKLE',awning: 0xff9f1c, trim: 0xffd36b, trimHex: '#FFD36B', signBg: '#281b06', h: 7.6 }
    ]},
    // Tequesta Waterfront Strip Mall
    { x: -360, z: 612, yaw: 0, shops: [
      { name: 'MARINA GEAR',  awning: 0x21e6d1, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#08222e', h: 8.6 },
      { name: 'TACO LOCO',    awning: 0xff6b35, trim: 0xffd36b, trimHex: '#FFD36B', signBg: '#2e1206', h: 8.2 },
      { name: 'VICE MOTORS',  awning: 0xff2e88, trim: 0xff2e88, trimHex: '#FF2E88', signBg: '#29081b', h: 9.2 }
    ]},
    // Key Lento Island Surf & Tiki Row
    { x: -440, z: 1336, yaw: 0, shops: [
      { name: 'KEY SURF CO',  awning: 0x21e6d1, trim: 0x21e6d1, trimHex: '#21E6D1', signBg: '#08262e', h: 7.6 },
      { name: 'TIKI GRILL',   awning: 0xff8a2a, trim: 0xffd36b, trimHex: '#FFD36B', signBg: '#2e1606', h: 7.4 }
    ]}
  ];
  shopPlazas.forEach((sp) => {
    const y = getLeonidaElevation(sp.x, sp.z);
    root.add(buildShopRowBlock(sp.x, y, sp.z, sp.yaw, sp.shops, shopMat, addBoxCollider));
  });

  // --- G. ALIGNED CITY BLOCKS (ART DECO HOTELS, GLASS TOWERS, BRICK OFFICES) ---
  const decoPal = [0xffe4d6, 0xd8f5ec, 0xfce0ee, 0xfff2cc, 0xd8e8fa];
  const glassPal = [0x8ec4e8, 0xa8d4f0, 0x7cb0d8, 0xb8dcf2];
  const brickPal = [0xc98a74, 0xb87866, 0xd4a488, 0xa66e5e];

  // Populate clean blocks around every Town Street Grid (aligned strictly between streets!)
  TOWN_GRID_DEFS.forEach((tg, gi) => {
    for (let ci = 0; ci < tg.cols.length - 1; ci++) {
      for (let ri = 0; ri < tg.rows.length - 1; ri++) {
        const bx = tg.cx + (tg.cols[ci] + tg.cols[ci + 1]) * 0.5;
        const bz = tg.cz + (tg.rows[ri] + tg.rows[ri + 1]) * 0.5;
        const seed = gi * 31 + ci * 7 + ri * 13;
        const isResort = gi === 1 || gi === 3;
        const isBigCity = gi === 0 || gi === 1 || gi === 3;
        const isKeys = gi === 6;
        if (isKeys) {
          const hwHit = closestLeonidaHighway(bx, bz);
          if (hwHit.dist >= hwHit.width * 0.5 + 11) {
            const y = getLeonidaElevation(bx, bz);
            root.add(buildKeyWestCottage(bx, y, bz, (ri % 2) * Math.PI, decoPal[seed % decoPal.length], clapMat, addBoxCollider));
          }
        } else if (isResort) {
          pushBuilding(artDecoList, bx, bz, 22, 24 + (seed % 4) * 9, 18, decoPal[seed % decoPal.length]);
          if (isBigCity && (ci + ri) % 2 === 0) {
            pushBuilding(glassList, bx + 18, bz - 14, 16, 36 + (seed % 3) * 12, 16, glassPal[seed % glassPal.length]);
          }
        } else if (gi === 0) {
          // Port Gellhorn mixed Glass Downtown + Brick Commercial
          if ((ci + ri) % 2 === 0) pushBuilding(glassList, bx, bz, 20, 28 + (seed % 4) * 10, 18, glassPal[seed % glassPal.length]);
          else pushBuilding(brickList, bx, bz, 22, 14 + (seed % 3) * 6, 18, brickPal[seed % brickPal.length]);
        } else {
          pushBuilding(brickList, bx, bz, 18, 12 + (seed % 3) * 5, 16, brickPal[seed % brickPal.length]);
        }
      }
    }
  });

  // Extra Resort Towers & Waterfront Buildings flanking Waning Sands, Capri, Millport, Belville
  for (let i = 0; i < 6; i++) {
    pushBuilding(artDecoList, 168, -1840 - i * 42, 22, 26 + (i % 3) * 10, 18, decoPal[i % decoPal.length]);
    pushBuilding(artDecoList, -1980, 90 + i * 42, 22, 24 + (i % 3) * 9, 18, decoPal[(i + 2) % decoPal.length]);
    pushBuilding(brickList, -540, -1420 - i * 38, 16, 11 + (i % 2) * 5, 14, brickPal[i % brickPal.length]);
    pushBuilding(brickList, -200 - i * 34, -2200, 16, 13 + (i % 3) * 4, 14, brickPal[(i + 1) % brickPal.length]);
  }

  // Render the 3 Varied Architectural InstancedMeshes (Grounded Plinth + PBR Walls + Rooftop Parapet & HVAC!)
  const buildInstancedGroup = (list, mat) => {
    if (!list.length) return;
    const bGeo = new THREE.BoxGeometry(1, 1, 1);
    const bInst = new THREE.InstancedMesh(bGeo, mat, list.length);
    const roofInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.03, 1.0, 1.03), pbr.darkMetalMat, list.length);
    const hvacInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 2.2, 0.32), pbr.brushedSteelMat, list.length);
    const col = new THREE.Color();
    list.forEach((b, i) => {
      // Extend building body 2.2m below terrain height so it NEVER floats on slopes!
      const totalH = b.h + 2.2;
      dummy.position.set(b.x, b.y + b.h * 0.5 - 1.1, b.z);
      dummy.rotation.set(0, b.yaw, 0);
      dummy.scale.set(b.w, totalH, b.d);
      dummy.updateMatrix();
      bInst.setMatrixAt(i, dummy.matrix);
      col.setHex(b.colorHex);
      bInst.setColorAt(i, col);

      dummy.position.set(b.x, b.y + b.h + 0.5, b.z);
      dummy.scale.set(b.w, 1, b.d);
      dummy.updateMatrix();
      roofInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(b.x + b.w * 0.16, b.y + b.h + 1.9, b.z - b.d * 0.12);
      dummy.scale.set(b.w, 1, b.d);
      dummy.updateMatrix();
      hvacInst.setMatrixAt(i, dummy.matrix);
    });
    [bInst, roofInst, hvacInst].forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      root.add(m);
    });
  };
  buildInstancedGroup(artDecoList, artDecoMat);
  buildInstancedGroup(glassList, glassMat);
  buildInstancedGroup(brickList, brickMat);

  // --- H. KEY WEST STILTED COTTAGES & ALPINE TIMBER LOG CABINS ---
  const cottageSpots = [
    [-110, 1020, 0], [-175, 1035, Math.PI], [-140, 1068, Math.PI/2],
    [-390, 1392, 0], [-490, 1395, Math.PI], [-440, 1412, 0],
    [-950, 1545, 0], [-1015, 1615, Math.PI],
    [-1250, 1125, 0], [-1315, 1195, Math.PI],
    [-1310, 608, 0], [-1375, 672, Math.PI], // Grassrivers bayou stilt shacks
    [-1095, -788, 0], [-1150, -854, Math.PI] // Buckskin swamp shacks
  ];
  cottageSpots.forEach(([cx, cz, yaw], i) => {
    const y = getLeonidaElevation(cx, cz);
    root.add(buildKeyWestCottage(cx, y, cz, yaw, decoPal[i % decoPal.length], clapMat, addBoxCollider));
  });

  const cabinSpots = [
    [-1445, -2205, 0], [-1515, -2205, 0], [-1480, -2275, Math.PI],
    [-1785, -1930, 0], [-1855, -1990, Math.PI],
    [-1045, -2135, 0], [-1115, -2130, 0],
    [-445, -1910, Math.PI/2], [-445, -1975, Math.PI/2] // Lake Leonida lakeside cabins
  ];
  cabinSpots.forEach(([cx, cz, yaw]) => {
    const y = getLeonidaElevation(cx, cz);
    root.add(buildTimberCabin(cx, y, cz, yaw, timberMat, addBoxCollider));
  });

  // --- I. BESPOKE HERO LANDMARKS (PBR METAL CRANES, BARNS, SILOS, RACEWAYS, PRISON, POWER PLANT, AIRPORTS!) ---
  const darkMetal = pbr.darkMetalMat;
  const concreteMat = pbr.concreteMat;
  const tarmacMat = pbr.highwayMat;
  const redBarnMat = new THREE.MeshStandardMaterial({ color: 0xa82822, roughness: 0.78, normalMap: pbr.timberMat.normalMap });
  const silverSiloMat = pbr.brushedSteelMat;

  // 1) Port Gellhorn Deepwater Shipping Port (PBR Brushed-Metal Gantry Cranes & Corrugated Shipping Containers!)
  const portX = -2090, portZ = -1340;
  const portY = getLeonidaElevation(portX, portZ);
  const wharf = new THREE.Mesh(new THREE.BoxGeometry(110, 4.2, 90), concreteMat);
  wharf.position.set(portX, portY - 1.2, portZ);
  root.add(wharf);
  const craneMat = pbr.craneOrangeMetalMat;
  for (let c = 0; c < 3; c++) {
    const cz = portZ - 28 + c * 28;
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 26, 1.6), craneMat);
    leg1.position.set(portX - 30, portY + 13, cz - 5);
    const leg2 = leg1.clone(); leg2.position.z = cz + 5;
    const boom = new THREE.Mesh(new THREE.BoxGeometry(44, 2.2, 2.4), craneMat);
    boom.position.set(portX - 24, portY + 25, cz);
    root.add(leg1, leg2, boom);
    if (addBoxCollider) addBoxCollider(portX - 34, portX - 26, cz - 7, cz + 7);
  }
  const contColors = [0xd63638, 0x1e60a8, 0x229972, 0xe8a428];
  for (let i = 0; i < 16; i++) {
    const col = i % 4, row = Math.floor(i / 4);
    const cx = portX + 4 + col * 10, cz = portZ - 26 + row * 18;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 3.4, 12.2),
      new THREE.MeshStandardMaterial({ color: contColors[(col + row) % 4], roughness: 0.62, metalness: 0.28 })
    );
    box.position.set(cx, portY + 2.4, cz);
    root.add(box);
    if (addBoxCollider) addBoxCollider(cx - 4.2, cx + 4.2, cz - 6.2, cz + 6.2);
  }

  // 2) Howe Dairy Farm & Allied Sugar Mill (Red Wooden Barns & Silver Grain Silos!)
  [[ -1850, -660 ], [ -900, -1820 ]].forEach(([fx, fz]) => {
    const fy = getLeonidaElevation(fx, fz);
    const barn = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 14), redBarnMat);
    barn.position.set(fx, fy + 5, fz);
    const barnRoof = new THREE.Mesh(new THREE.ConeGeometry(15.5, 5.5, 4), new THREE.MeshStandardMaterial({ color: 0x3b3c42, roughness: 0.78 }));
    barnRoof.rotation.y = Math.PI / 4;
    barnRoof.scale.set(1.25, 1, 0.85);
    barnRoof.position.set(fx, fy + 12.6, fz);
    root.add(barn, barnRoof);
    for (let s = 0; s < 2; s++) {
      const sx = fx + 17 + s * 9.5;
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 17, 14), silverSiloMat);
      silo.position.set(sx, fy + 8.5, fz);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(3.8, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), silverSiloMat);
      dome.position.set(sx, fy + 17, fz);
      root.add(silo, dome);
      if (addCircleCollider) addCircleCollider(sx, fz, 4.1);
    }
    if (addBoxCollider) addBoxCollider(fx - 11.5, fx + 11.5, fz - 7.5, fz + 7.5);
  });

  // 3) Ambrosia Motorsport Park & Gellhorn Oval Speedway (Asphalt Oval + Grandstands + Start Gantry!)
  [[ -1260, -1660 ], [ -1560, -320 ]].forEach(([rx, rz]) => {
    const ry = getLeonidaElevation(rx, rz);
    const oval = new THREE.Mesh(new THREE.RingGeometry(52, 74, 44), tarmacMat);
    oval.rotation.x = -Math.PI / 2;
    oval.scale.set(1.32, 0.86, 1);
    oval.position.set(rx, ry + 0.14, rz);
    const infield = new THREE.Mesh(new THREE.CircleGeometry(52, 36), new THREE.MeshStandardMaterial({ color: 0x3f8c46, roughness: 0.9 }));
    infield.rotation.x = -Math.PI / 2;
    infield.scale.set(1.32, 0.86, 1);
    infield.position.set(rx, ry + 0.12, rz);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(72, 11, 14), new THREE.MeshStandardMaterial({ color: 0xd6d2dc, roughness: 0.65 }));
    stand.position.set(rx, ry + 5.5, rz - 78);
    const standRoof = new THREE.Mesh(new THREE.BoxGeometry(74, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xff2e88, roughness: 0.4 }));
    standRoof.position.set(rx, ry + 11.8, rz - 76);
    root.add(oval, infield, stand, standRoof);
    if (addBoxCollider) addBoxCollider(rx - 36, rx + 36, rz - 85, rz - 71);
  });

  // 4) Vice Power Station (Twin Hyperbolic Cooling Towers using LatheGeometry!)
  const pwrX = -920, pwrZ = 840;
  const pwrY = getLeonidaElevation(pwrX, pwrZ);
  const lathePts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const rad = 11.5 + Math.pow(t - 0.68, 2) * 28.0;
    lathePts.push(new THREE.Vector2(rad, t * 56));
  }
  const coolGeo = new THREE.LatheGeometry(lathePts, 24);
  for (const dx of [-24, 24]) {
    const ct = new THREE.Mesh(coolGeo, concreteMat);
    ct.position.set(pwrX + dx, pwrY, pwrZ);
    root.add(ct);
    if (addCircleCollider) addCircleCollider(pwrX + dx, pwrZ, 16);
  }
  const turbHall = new THREE.Mesh(new THREE.BoxGeometry(36, 14, 20), darkMetal);
  turbHall.position.set(pwrX, pwrY + 7, pwrZ - 32);
  root.add(turbHall);
  if (addBoxCollider) addBoxCollider(pwrX - 18, pwrX + 18, pwrZ - 42, pwrZ - 22);

  // 5) Leonida State Prison Compound (Walls + 4 Watchtowers + Cellblocks!)
  const prX = -1680, prZ = -1035;
  const prY = getLeonidaElevation(prX, prZ);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(112, 112), concreteMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(prX, prY + 0.1, prZ);
  root.add(yard);
  [[-54, -54], [54, -54], [-54, 54], [54, 54]].forEach(([dx, dz]) => {
    const wt = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 20, 8), concreteMat);
    wt.position.set(prX + dx, prY + 10, prZ + dz);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.8, 6.8), darkMetal);
    cab.position.set(prX + dx, prY + 21.5, prZ + dz);
    root.add(wt, cab);
    if (addCircleCollider) addCircleCollider(prX + dx, prZ + dz, 4.0);
  });
  for (const dz of [-18, 18]) {
    const block = new THREE.Mesh(new THREE.BoxGeometry(62, 11, 14), concreteMat);
    block.position.set(prX, prY + 5.5, prZ + dz);
    root.add(block);
    if (addBoxCollider) addBoxCollider(prX - 31, prX + 31, prZ + dz - 7, prZ + dz + 7);
  }

  // 6) Three Regional Airports (Paved Runways, Centerlines, Detailed Vaulted Hangars & ATC Towers — 100% CLEAR OF ALL ROADS!)
  const beaconRedMat = new THREE.MeshBasicMaterial({ color: 0xff2838 });
  const bayDarkMat = new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.92 });
  const taxiYellowMat = new THREE.MeshBasicMaterial({ color: 0xf4c430 });
  [
    {
      name: 'Wild Hog Airfield',
      rwyX: -2180, rwyZ: -1034, rwyLen: 220,
      atcX: -2238, atcZ: -1066,
      hangarX: -2126, hangarZ: -1066
    },
    {
      // Bobcat Key Airport: SR-82 arrives from NE (-580,920 -> -820,1160) & exits West (-1280,1160);
      // SR-94 exits SE (-820,1160 -> -620,1260). Entire SW apron (-970, 1236) is 100% clear of ALL highways!
      name: 'Bobcat Key Airport',
      rwyX: -970, rwyZ: 1236, rwyLen: 215,
      atcX: -904, atcZ: 1198,
      hangarX: -992, hangarZ: 1198
    },
    {
      name: 'Mile Zero Naval Air Station',
      rwyX: -1540, rwyZ: 1716, rwyLen: 220,
      atcX: -1596, atcZ: 1682,
      hangarX: -1540, hangarZ: 1612
    }
  ].forEach((ap) => {
    const ay = Math.max(0.28, getLeonidaElevation(ap.rwyX, ap.rwyZ));
    // Paved Runway + Threshold Bars + Dashed Centerline
    const rwy = new THREE.Mesh(new THREE.PlaneGeometry(ap.rwyLen, 26), tarmacMat);
    rwy.rotation.x = -Math.PI / 2;
    rwy.position.set(ap.rwyX, ay + 0.14, ap.rwyZ);
    root.add(rwy);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf4f4ec });
    const halfDash = Math.floor(ap.rwyLen * 0.42);
    for (let d = -halfDash; d <= halfDash; d += 18) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.0), dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(ap.rwyX + d, ay + 0.17, ap.rwyZ);
      root.add(dash);
    }
    // Yellow apron connector line from hangar to runway
    const taxi = new THREE.Mesh(new THREE.PlaneGeometry(2.0, Math.abs(ap.rwyZ - ap.hangarZ) - 10), taxiYellowMat);
    taxi.rotation.x = -Math.PI / 2;
    taxi.position.set(ap.hangarX, ay + 0.16, (ap.rwyZ + ap.hangarZ) * 0.5);
    root.add(taxi);

    // ATC Tower (only place if guaranteed clear of any highway!)
    const atcHit = closestLeonidaHighway(ap.atcX, ap.atcZ);
    if (atcHit.dist > atcHit.width * 0.5 + 10) {
      const atcY = Math.max(0.25, getLeonidaElevation(ap.atcX, ap.atcZ));
      const atc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.4, 22, 10), concreteMat);
      atc.position.set(ap.atcX, atcY + 11, ap.atcZ);
      const cab = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 4.2, 4.4, 10), glassMat);
      cab.position.set(ap.atcX, atcY + 23.8, ap.atcZ);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 0.7, 10), darkMetal);
      cap.position.set(ap.atcX, atcY + 26.3, ap.atcZ);
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 4.2, 6), darkMetal);
      ant.position.set(ap.atcX, atcY + 28.6, ap.atcZ);
      const bcn = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), beaconRedMat);
      bcn.position.set(ap.atcX, atcY + 30.8, ap.atcZ);
      root.add(atc, cab, cap, ant, bcn);
      if (addCircleCollider) addCircleCollider(ap.atcX, ap.atcZ, 5.0);
    }

    // Detailed Multi-Part Arched Aviation Hangar (guaranteed clear of any highway!)
    const hHit = closestLeonidaHighway(ap.hangarX, ap.hangarZ);
    if (hHit.dist > hHit.width * 0.5 + 16) {
      const hY = Math.max(0.25, getLeonidaElevation(ap.hangarX, ap.hangarZ));
      const hg = new THREE.Group();
      hg.position.set(ap.hangarX, hY, ap.hangarZ);
      const baseWalls = new THREE.Mesh(new THREE.BoxGeometry(26, 7.6, 18), concreteMat);
      baseWalls.position.y = 3.8;
      const archRoof = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.2, 26.4, 14, 1, false, 0, Math.PI), darkMetal);
      archRoof.rotation.z = Math.PI / 2;
      archRoof.scale.set(0.55, 1.0, 1.0);
      archRoof.position.y = 7.4;
      const doorFace = new THREE.Mesh(new THREE.BoxGeometry(17.5, 6.2, 0.4), bayDarkMat);
      doorFace.position.set(0, 3.1, ap.rwyZ > ap.hangarZ ? 9.05 : -9.05);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(26.3, 0.55, 18.3), taxiYellowMat);
      stripe.position.y = 7.1;
      const hBcn = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), beaconRedMat);
      hBcn.position.y = 12.6;
      hg.add(baseWalls, archRoof, doorFace, stripe, hBcn);
      root.add(hg);
      if (addBoxCollider) addBoxCollider(ap.hangarX - 13.5, ap.hangarX + 13.5, ap.hangarZ - 9.5, ap.hangarZ + 9.5);
    }
  });

  // 7) Mount Kalaga 148m Summit Observation Tower
  const mkX = -1080, mkZ = -2340;
  const mkY = getLeonidaElevation(mkX, mkZ);
  const obsTower = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 5.5, 24, 8), darkMetal);
  obsTower.position.set(mkX, mkY + 12, mkZ);
  const obsDeck = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 3.2, 8), glassMat);
  obsDeck.position.set(mkX, mkY + 25, mkZ);
  root.add(obsTower, obsDeck);

  // 8) Interstate Overhead Green Welcome Gantries at Every Major Highway Gateway!
  const gantrySpecs = [
    { x: 150,   z: -1360, yaw: 0,           title: 'LEAF LINKS GOLF', sub: 'I-97 NORTH · WANING SANDS' },
    { x: 120,   z: -1820, yaw: 0,           title: 'WANING SANDS',    sub: 'EVERGREEN SHOPPING PLAZA' },
    { x: -580,  z: -1360, yaw: 0,           title: 'LAKE LEONIDA',    sub: 'I-297 · AMBROSIA · RACEWAY' },
    { x: -1080, z: -2160, yaw: Math.PI/2,   title: 'MT. KALAGA PARK', sub: 'LUMMOX COUNTY · 148M PEAK' },
    { x: -960,  z: -810,  yaw: Math.PI/2,   title: 'PORT GELLHORN',   sub: 'I-404 WEST · KELLY COUNTY' },
    { x: -1900, z: -840,  yaw: 0,           title: 'HOWE DAIRY FARM', sub: 'US-35 SOUTH · CAPRI RESORT' },
    { x: -360,  z: 500,   yaw: 0,           title: 'TEQUESTA PLAZA',  sub: 'SR-82 · BOBCAT KEY AIRPORT' },
    { x: 0,     z: 500,   yaw: 0,           title: 'LEONIDA KEYS',    sub: 'US-1A OVERSEAS HIGHWAY' }
  ];
  gantrySpecs.forEach((gs) => {
    const gy = getLeonidaElevation(gs.x, gs.z);
    const gg = new THREE.Group();
    gg.position.set(gs.x, gy, gs.z);
    gg.rotation.y = gs.yaw;
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 10.5, 8), darkMetal);
    pL.position.set(-9.6, 5.25, 0);
    const pR = pL.clone(); pR.position.x = 9.6;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(20.2, 0.65, 0.65), darkMetal);
    bar.position.y = 10.2;
    const sTex = makeHighwaySignTex(gs.title, gs.sub);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(11.8, 3.3, 0.32),
      new THREE.MeshStandardMaterial({ map: sTex, roughness: 0.45 })
    );
    board.position.y = 9.4;
    gg.add(pL, pR, bar, board);
    root.add(gg);
  });

  // --- J. DENSE ROADSIDE FOREST CORRIDORS + MULTI-SPECIES WOODLANDS (PINES, LIVE OAKS & PALMS!) ---
  const pinePts = [], oakPts = [], palmPts = [];
  const isBlockedForTree = (wx, wz) => {
    for (let j = 0; j < LEONIDA_PLACES.length; j++) {
      const pl = LEONIDA_PLACES[j];
      const clearR = pl.kind === 'airport' || pl.kind === 'raceway' ? 136 : (pl.kind === 'golf' ? 148 : (pl.kind === 'toll' ? 36 : 66));
      if (Math.hypot(wx - pl.x, wz - pl.z) < clearR) return true;
    }
    return false;
  };
  const pushForestTree = (wx, wz, wy, seedVal, forceDenseMix = false) => {
    const item = {
      x: wx, y: wy, z: wz,
      s: 0.88 + seeded(seedVal * 11.3) * 0.64,
      r: seeded(seedVal * 19.7) * Math.PI * 2
    };
    const pick = seeded(seedVal * 29.3);
    if (wz < -1120 || wy > 14) {
      // Northern & alpine regions: dense conifers + broad-canopy oaks
      if (pick < 0.72) pinePts.push(item);
      else oakPts.push(item);
    } else if (wz > 920) {
      // Southern coastal keys & Mariana islands: lush palms + coastal oaks + slash pines
      if (pick < 0.56) palmPts.push(item);
      else if (pick < 0.84) oakPts.push(item);
      else pinePts.push(item);
    } else {
      // Central & western empty-land highways: towering Florida slash-pine & live-oak dense forest!
      if (forceDenseMix) {
        if (pick < 0.46) pinePts.push(item);
        else if (pick < 0.84) oakPts.push(item);
        else palmPts.push(item);
      } else {
        if (pick < 0.40) pinePts.push(item);
        else if (pick < 0.76) oakPts.push(item);
        else palmPts.push(item);
      }
    }
  };

  // J1. DENSE ROADSIDE FOREST CORRIDORS — 4 Staggered Rows Hugging BOTH Sides of Every Empty-Land Highway!
  let rfIdx = 0;
  for (let h = 0; h < PRIMARY_HIGHWAYS.length; h++) {
    const hw = PRIMARY_HIGHWAYS[h];
    for (let k = 0; k < hw.pts.length - 1; k++) {
      const p0 = hw.pts[k];
      const p1 = hw.pts[k + 1];
      if (isInCoreViceFootprint(p0.x, p0.z) || isInLegacyMountains(p0.x, p0.z)) continue;
      if (getLandFactor(p0.x, p0.z) < 0.36) continue;
      const dx = p1.x - p0.x, dz = p1.z - p0.z;
      const len = Math.hypot(dx, dz) || 1;
      const rx = -dz / len, rz = dx / len;
      const subSteps = len > 15 ? 2 : 1;
      for (let st = 0; st < subSteps; st++) {
        const frac = st / subSteps;
        const cx = p0.x + dx * frac;
        const cz = p0.z + dz * frac;
        for (const side of [-1, 1]) {
          // 4 staggered depth tiers from road verge (8.5m) deep into empty land (52m)!
          const tierDists = [hw.width * 0.5 + 8.5, hw.width * 0.5 + 17.5, hw.width * 0.5 + 29.0, hw.width * 0.5 + 43.0];
          for (let row = 0; row < tierDists.length; row++) {
            rfIdx++;
            if (row >= 2 && seeded(rfIdx * 3.7) > 0.78) continue;
            const lat = tierDists[row] + (seeded(rfIdx * 7.3) - 0.5) * 6.5;
            const along = (seeded(rfIdx * 13.1) - 0.5) * 8.5;
            const tx = cx + rx * side * lat + (dx / len) * along;
            const tz = cz + rz * side * lat + (dz / len) * along;
            if (isInCoreViceFootprint(tx, tz) || isInLegacyMountains(tx, tz)) continue;
            if (getLandFactor(tx, tz) < 0.35) continue;
            const hwHit = closestLeonidaHighway(tx, tz);
            if (hwHit.dist < hwHit.width * 0.5 + 7.2) continue;
            if (isBlockedForTree(tx, tz)) continue;
            const ty = getLeonidaElevation(tx, tz);
            if (ty < 0.28 || ty > 116) continue;
            pushForestTree(tx, tz, ty, rfIdx + 10000, true);
          }
        }
      }
    }
  }

  // J2. WIDE MAINLAND WOODLAND FILL (6,800 Candidates Filling Remaining Empty Land!)
  for (let i = 0; i < 6800; i++) {
    const wx = LEONIDA_PROJ.minX + 55 + seeded(i * 3.1 + 11) * (widthX - 110);
    const wz = LEONIDA_PROJ.minZ + 55 + seeded(i * 5.7 + 23) * (depthZ - 110);
    if (isInCoreViceFootprint(wx, wz) || isInLegacyMountains(wx, wz)) continue;
    if (getLandFactor(wx, wz) < 0.34) continue;
    const hwHit = closestLeonidaHighway(wx, wz);
    if (hwHit.dist < hwHit.width * 0.5 + 10.5) continue;
    if (isBlockedForTree(wx, wz)) continue;
    const wy = getLeonidaElevation(wx, wz);
    if (wy < 0.28 || wy > 116) continue;
    pushForestTree(wx, wz, wy, i, false);
  }

  const cTmp = new THREE.Color();
  if (pinePts.length > 0) {
    // 3-Tier Realistic Pine Silhouette (Lower boughs + Mid boughs + Crown spire + Bark trunk!)
    const tGeo2 = new THREE.CylinderGeometry(0.28, 0.55, 6.2, 6);
    tGeo2.translate(0, 3.1, 0);
    const tier1 = new THREE.ConeGeometry(4.2, 5.6, 7); tier1.translate(0, 6.4, 0);
    const tier2 = new THREE.ConeGeometry(3.2, 5.0, 7); tier2.translate(0, 9.8, 0);
    const tier3 = new THREE.ConeGeometry(2.0, 4.4, 7); tier3.translate(0, 13.0, 0);
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x5c3e28, normalMap: pbr.timberMat.normalMap, roughness: 0.94 });
    const needleMat = new THREE.MeshStandardMaterial({ color: 0x2e6135, roughness: 0.86 });

    const pTrunks = new THREE.InstancedMesh(tGeo2, barkMat, pinePts.length);
    const pT1 = new THREE.InstancedMesh(tier1, needleMat, pinePts.length);
    const pT2 = new THREE.InstancedMesh(tier2, needleMat, pinePts.length);
    const pT3 = new THREE.InstancedMesh(tier3, needleMat, pinePts.length);
    pinePts.forEach((t, i) => {
      dummy.position.set(t.x, t.y - 0.35, t.z);
      dummy.rotation.set(0, t.r, 0);
      dummy.scale.setScalar(t.s);
      dummy.updateMatrix();
      pTrunks.setMatrixAt(i, dummy.matrix);
      pT1.setMatrixAt(i, dummy.matrix);
      pT2.setMatrixAt(i, dummy.matrix);
      pT3.setMatrixAt(i, dummy.matrix);
      cTmp.setHSL(0.33 + (i % 7) * 0.009, 0.42, 0.21 + (i % 5) * 0.025);
      pT1.setColorAt(i, cTmp);
      cTmp.offsetHSL(0, 0.02, 0.03);
      pT2.setColorAt(i, cTmp);
      cTmp.offsetHSL(0, 0.02, 0.03);
      pT3.setColorAt(i, cTmp);
    });
    [pTrunks, pT1, pT2, pT3].forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      root.add(m);
    });
  }

  if (oakPts.length > 0) {
    // Broad-Canopy Subtropical Live Oak / Cypress Hardwood (Sturdy Trunk + 3 Overlapping Leafy Crowns!)
    const oakTrunkGeo = new THREE.CylinderGeometry(0.38, 0.68, 5.6, 6);
    oakTrunkGeo.translate(0, 2.8, 0);
    const crownA = new THREE.IcosahedronGeometry(4.2, 1);
    crownA.scale(1.18, 0.78, 1.12);
    crownA.translate(0, 7.6, 0);
    const crownB = new THREE.IcosahedronGeometry(3.2, 1);
    crownB.scale(1.1, 0.82, 1.05);
    crownB.translate(2.3, 6.9, 1.1);
    const crownC = new THREE.IcosahedronGeometry(3.0, 1);
    crownC.scale(1.05, 0.80, 1.12);
    crownC.translate(-2.1, 7.2, -1.2);

    const oakBarkMat = new THREE.MeshStandardMaterial({ color: 0x624934, normalMap: pbr.timberMat.normalMap, roughness: 0.94 });
    const oakLeafMat = new THREE.MeshStandardMaterial({ color: 0x356e34, roughness: 0.86 });
    const oTrunks = new THREE.InstancedMesh(oakTrunkGeo, oakBarkMat, oakPts.length);
    const oCA = new THREE.InstancedMesh(crownA, oakLeafMat, oakPts.length);
    const oCB = new THREE.InstancedMesh(crownB, oakLeafMat, oakPts.length);
    const oCC = new THREE.InstancedMesh(crownC, oakLeafMat, oakPts.length);
    oakPts.forEach((t, i) => {
      dummy.position.set(t.x, t.y - 0.35, t.z);
      dummy.rotation.set(0, t.r, 0);
      dummy.scale.setScalar(t.s);
      dummy.updateMatrix();
      oTrunks.setMatrixAt(i, dummy.matrix);
      oCA.setMatrixAt(i, dummy.matrix);
      oCB.setMatrixAt(i, dummy.matrix);
      oCC.setMatrixAt(i, dummy.matrix);
      cTmp.setHSL(0.27 + (i % 7) * 0.011, 0.44, 0.24 + (i % 5) * 0.028);
      oCA.setColorAt(i, cTmp);
      cTmp.offsetHSL(0.01, 0.02, 0.03);
      oCB.setColorAt(i, cTmp);
      cTmp.offsetHSL(-0.01, 0.02, -0.02);
      oCC.setColorAt(i, cTmp);
    });
    [oTrunks, oCA, oCB, oCC].forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      root.add(m);
    });
  }

  if (palmPts.length > 0) {
    // Realistic Tapered Palm Trunk + Radiating Multi-Frond Crown!
    const ptGeo = new THREE.CylinderGeometry(0.20, 0.44, 9.2, 6);
    ptGeo.translate(0, 4.6, 0);
    const frondGeo = new THREE.ConeGeometry(4.4, 2.2, 6, 1, true);
    frondGeo.scale(1.15, 0.65, 1.15);
    frondGeo.translate(0, 9.2, 0);
    const crownCapGeo = new THREE.ConeGeometry(2.8, 1.8, 6);
    crownCapGeo.translate(0, 10.1, 0);

    const palmBarkMat = new THREE.MeshStandardMaterial({ color: 0x826548, normalMap: pbr.timberMat.normalMap, roughness: 0.92 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x3a8c40, roughness: 0.80, side: THREE.DoubleSide });
    const palmTrunks = new THREE.InstancedMesh(ptGeo, palmBarkMat, palmPts.length);
    const palmFronds = new THREE.InstancedMesh(frondGeo, frondMat, palmPts.length);
    const palmCaps = new THREE.InstancedMesh(crownCapGeo, frondMat, palmPts.length);
    palmPts.forEach((t, i) => {
      dummy.position.set(t.x, t.y - 0.35, t.z);
      dummy.rotation.set(0.08, t.r, 0.06);
      dummy.scale.setScalar(t.s);
      dummy.updateMatrix();
      palmTrunks.setMatrixAt(i, dummy.matrix);
      palmFronds.setMatrixAt(i, dummy.matrix);
      palmCaps.setMatrixAt(i, dummy.matrix);
      cTmp.setHSL(0.29 + (i % 6) * 0.011, 0.48, 0.32 + (i % 5) * 0.028);
      palmFronds.setColorAt(i, cTmp);
      palmCaps.setColorAt(i, cTmp);
    });
    [palmTrunks, palmFronds, palmCaps].forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.computeBoundingSphere();
      root.add(m);
    });
  }

  // --- K. REAL-WORLD FILLER: TOLL PLAZAS, ROAD SIGNS, TRAFFIC LIGHTS, BILLBOARDS, GAS STATIONS, HOMES, ROCKS, TRAFFIC! ---
  const realWorld = buildLeonidaRealWorld({
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
    showroomSpots
  });

  scene.add(root);
  return {
    root,
    placesCount: LEONIDA_PLACES.length,
    highwaysCount: PRIMARY_HIGHWAYS.length,
    townRoadsCount: TOWN_ROADS.length,
    buildingsCount: artDecoList.length + glassList.length + brickList.length + shopPlazas.length * 3 + cottageSpots.length + cabinSpots.length + realWorld.extraBuildings,
    treesCount: pinePts.length + oakPts.length + palmPts.length,
    tollPlazasCount: realWorld.tollPlazasCount,
    trafficSignalsCount: realWorld.trafficSignalsCount,
    signsCount: realWorld.signsCount,
    billboardsCount: realWorld.billboardsCount,
    gasStationsCount: realWorld.gasStationsCount,
    rocksCount: realWorld.rocksCount,
    bushesCount: realWorld.bushesCount,
    trafficCount: realWorld.trafficCount,
    kalagaRopeway: realWorld.kalagaRopeway,
    sampleMeshHeight,
    update: realWorld.update
  };
}
