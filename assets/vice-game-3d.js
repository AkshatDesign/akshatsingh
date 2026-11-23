/* ==========================================================================
   VICE CITY 3D OPEN WORLD — DEFINITIVE EDITION ENGINE (v4)
   - Radiant Golden-Hour Miami Sky & Guaranteed Non-Black Sun (zero acos NaN)
   - Real-Time Dynamic CubeCamera Car Reflections + Golden-Hour PMREM Glass/Road
   - Non-Overlapping Zero-Z-Fighting Road Grid + Raised Limestone Curbs & Parks
   - 3-Point Oriented Car Hull Solid Collisions (ZERO clipping through solids!)
   - GTA-Style Pedestrian Squishing, Ragdoll Launches, Panic AI & 5-Star Wanted
   ========================================================================== */
import * as THREE from 'https://esm.sh/three@0.187.0';
import { EffectComposer } from 'https://esm.sh/three@0.187.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.187.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.187.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'https://esm.sh/three@0.187.0/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'https://esm.sh/three@0.187.0/examples/jsm/postprocessing/ShaderPass.js';

import {
  SUN_DIR,
  createGoldenHourEnvironment,
  createViceSkyDome,
  createAtlanticOcean,
  makeAsphaltTextures,
  makeIntersectionTexture,
  makeSidewalkTexture,
  makeSidewalkNormalMap,
  makeGrassTexture,
  makeSandTexture,
  makePalmBarkTexture,
  makePalmFrondTexture,
  makeSkyscraperGlassTextures,
  makeNeonSignTexture,
  makeSoftParticleTexture,
  makeSplatDecalTexture,
  makeTarmacTexture,
  makeCoronaGlowTexture
} from './vice-env.js?v=18';

import {
  PAINTS,
  mergeGeometries,
  getContactShadowMat,
  createSupercar,
  buildArchingFrondGeometry,
  buildMergedPalmGeometries,
  createArtDecoHotel,
  createGlassSkyscraper,
  createCaseStudyShowroom,
  createCashPileMesh,
  createTrafficCar,
  createPedestrian,
  createPlayerCharacter,
  createFerrisWheel,
  createFountainPlaza,
  createTikiBeachBar,
  createVolleyballCourt,
  createDistrictArch,
  createWeaponPickupMesh,
  createAirlinerJet,
  createPrivateLearjet,
  createPropPlane,
  createAirportTerminal,
  createAirportControlTower,
  createAirportSupportVehicle,
  createLuxuryYacht,
  createCarnivalPier,
  createAirportRunwayMarkings,
  createAirportFuelFarm,
  createAirportGatehouse,
  createAirportHangarTwo,
  createBoardingAirstairs,
  createMountViceRange
} from './vice-assets.js?v=20';

import { ViceAudioEngine, RADIO_STATIONS } from './vice-audio.js?v=15';

/* AAA Filmic Contrast, Warm Miami Highlight Grade & Subtle Optical Vignette (runs post-OutputPass in sRGB) */
const ViceAAAColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uContrast: { value: 1.12 },
    uSaturation: { value: 1.18 },
    uVignette: { value: 0.13 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uVignette;
    varying vec2 vUv;
    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 col = tex.rgb;
      // Authentic GTA Vice City Miami sunset filmic S-curve + warm peach highlights & twilight cyan/violet bounce
      col = (col - 0.5) * uContrast + 0.5;
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(luma), col, uSaturation);
      col += vec3(0.024, 0.011, -0.004) * smoothstep(0.50, 1.0, luma);
      col += vec3(0.004, 0.002, 0.018) * (1.0 - smoothstep(0.0, 0.38, luma));
      vec2 d = vUv - 0.5;
      float vig = 1.0 - dot(d, d) * uVignette * 2.1;
      col *= clamp(vig, 0.74, 1.0);
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), tex.a);
    }
  `
};

// 2.2x Expanded Vice City Open World Grid (6 Major Avenues x 10 Cross-Streets = ~1.07 km2 playable city!)
const AVENUES = [0, -96, -192, -288, -384, -480]; // Ocean Drive, Washington Ave, Downtown Hwy, West Bayside Blvd, Little Haiti Ave, Vice Port Expy
const CROSS_STREETS = [340, 180, 20, -140, -300, -460, -620, -780, -940, -1100];
const ROAD_W = 16.8;
const ROAD_H = ROAD_W * 0.5; // 8.4m half-width

const WEAPONS = [
  { id: 'fists',   key: '1', name: 'Fists',   cooldown: 0.28, dmg: 1,   range: 2.6,  auto: false, label: 'Fists (Melee)' },
  { id: 'bat',     key: '2', name: 'Bat',     cooldown: 0.36, dmg: 2.5, range: 3.3,  auto: false, label: 'Vice Baseball Bat' },
  { id: 'pistol',  key: '3', name: '9mm',     cooldown: 0.25, dmg: 2,   range: 64,   auto: false, label: 'Chrome 9mm Pistol' },
  { id: 'smg',     key: '4', name: 'Uzi',     cooldown: 0.085, dmg: 1.2, range: 58,  auto: true,  label: 'Vice Uzi SMG' },
  { id: 'shotgun', key: '5', name: 'Shotgun', cooldown: 0.62, dmg: 4.5, range: 34,   auto: false, label: '12-Gauge Shotgun' },
  { id: 'rifle',   key: '6', name: 'M4',      cooldown: 0.11, dmg: 1.6, range: 82,   auto: true,  label: 'Vice M4 Rifle' },
  { id: 'bazooka', key: '7', name: 'RPG',     cooldown: 0.92, dmg: 10,  range: 115,  auto: false, label: 'RPG Bazooka' }
];

const TIME_PRESETS = [
  {
    id: 'sunset', label: 'Sunset', icon: '☀',
    sunDir: new THREE.Vector3(0.42, 0.24, -0.87).normalize(),
    horizon: 0xfa8a5c, lower: 0xc26680, mid: 0x3d6bb8, zenith: 0x143075,
    sunGlow: 0xffb866, fog: 0x6e546d, skyTint: 0xf28f61,
    sunCol: 0xffce8f, sunInt: 2.55, hemiSky: 0x88b4e8, hemiGnd: 0x5c423e, hemiInt: 0.78,
    fillInt: 0.48, nightMix: 0.0, exposure: 1.12
  },
  {
    id: 'noon', label: 'Day', icon: '☼',
    sunDir: new THREE.Vector3(0.26, 0.84, -0.48).normalize(),
    horizon: 0x9ed8f5, lower: 0x62b4eb, mid: 0x2b82d6, zenith: 0x1252a8,
    sunGlow: 0xfff2cc, fog: 0x8eb8d6, skyTint: 0x8cd0f2,
    sunCol: 0xfff8e6, sunInt: 2.75, hemiSky: 0xcce8ff, hemiGnd: 0x76685a, hemiInt: 0.82,
    fillInt: 0.52, nightMix: 0.0, exposure: 1.08
  },
  {
    id: 'night', label: 'Night', icon: '☾',
    sunDir: new THREE.Vector3(-0.35, 0.52, -0.78).normalize(),
    horizon: 0x1e183a, lower: 0x14122e, mid: 0x0b0e24, zenith: 0x040614,
    sunGlow: 0x8cb8ff, fog: 0x141126, skyTint: 0x262854,
    sunCol: 0x8eb4f0, sunInt: 0.76, hemiSky: 0x3a4a82, hemiGnd: 0x1b1428, hemiInt: 0.56,
    fillInt: 0.34, nightMix: 1.0, exposure: 1.16
  },
  {
    id: 'dawn', label: 'Dawn', icon: '◐',
    sunDir: new THREE.Vector3(0.76, 0.19, -0.62).normalize(),
    horizon: 0xffa6b8, lower: 0xc87ea6, mid: 0x526cb0, zenith: 0x1c2b66,
    sunGlow: 0xffc4a8, fog: 0x826c8a, skyTint: 0xeba0b2,
    sunCol: 0xffd2b8, sunInt: 2.05, hemiSky: 0x9cb8f0, hemiGnd: 0x544458, hemiInt: 0.74,
    fillInt: 0.46, nightMix: 0.12, exposure: 1.10
  }
];

const WEATHER_PRESETS = [
  { id: 'clear', label: 'Clear', icon: '☀', rain: 0.0, fogMult: 1.0, dark: 0.0 },
  { id: 'rain',  label: 'Rain',  icon: '☂', rain: 0.72, fogMult: 1.65, dark: 0.58 },
  { id: 'storm', label: 'Storm', icon: '⚡', rain: 1.0, fogMult: 2.1, dark: 0.88 }
];

const WAYPOINTS = [
  { id: 'start', label: 'Ocean Dr', zone: 'Ocean Drive South', x: 3.2, z: 6, yaw: 0 },
  { id: 'fix-my-itch', label: '01 FixMyItch', zone: 'Ocean Beach', x: -4.2, z: -82, yaw: 0 },
  { id: 'magic-checkout', label: '02 Magic (Bridge)', zone: 'Starfish Island', x: 138, z: -300, yaw: -Math.PI / 2 },
  { id: 'agentic-payments', label: '03 Agentic', zone: 'Downtown Vice', x: -100.2, z: -220, yaw: 0 },
  { id: 'ai-launches', label: '04 AI Impact', zone: 'Vice Point', x: -4.2, z: -382, yaw: 0 },
  { id: 'pier', label: 'Carnival Pier', zone: 'Vice Pier Carnival', x: 24, z: -430, yaw: -Math.PI / 2 },
  { id: 'journey', label: '05 Journey', zone: 'Little Havana', x: -100.2, z: -538, yaw: 0 },
  { id: 'vice-key', label: 'Vice Key', zone: 'Vice Key Island', x: 144, z: -620, yaw: -Math.PI / 2 },
  { id: 'prawn-island', label: 'Prawn Studios', zone: 'Prawn Island', x: 148, z: -940, yaw: -Math.PI / 2 },
  { id: 'north-mall', label: 'North Vice Mall', zone: 'North Point', x: -4.2, z: -1020, yaw: 0 },
  { id: 'little-haiti', label: 'Little Haiti', zone: 'Little Haiti', x: -384, z: -380, yaw: 0 },
  { id: 'vice-port', label: 'Vice Port', zone: 'Vice Port Docks', x: -480, z: -140, yaw: 0 },
  { id: 'south-marina', label: 'South Marina', zone: 'Ocean Bay Marina', x: -4.2, z: 260, yaw: 0 },
  { id: 'ocean-view', label: 'Ocean View [IN]', zone: 'Ocean View Hotel', x: -13.0, z: -48, yaw: Math.PI / 2 },
  { id: 'ammunation', label: 'Ammu-Nation [IN]', zone: 'Ammu-Nation', x: -13.0, z: -190, yaw: Math.PI / 2 },
  { id: 'malibu-club', label: 'Malibu Club [IN]', zone: 'Malibu Club', x: -13.0, z: -344, yaw: Math.PI / 2 },
  { id: 'airport', label: 'Int’l Airport [FLY]', zone: "Vice Int'l Airport", x: -46, z: 66, yaw: 0 },
  { id: 'mount-vice', label: 'Mount Vice [66M]', zone: 'Mount Vice Summit', x: -228, z: -1422, yaw: Math.PI }
];

/* ==========================================================================
   GTA 5 MOUNT CHILIAD-INSPIRED ROADABLE MOUNTAIN RANGE ("MOUNT VICE")
   - Analytical O(1) Heightfield + Smooth Flat-Cross-Section Switchback Highway
   - Returns 0.0 everywhere south of Z = -1115 (100% safe for entire city grid!)
   ========================================================================== */
const MOUNT_VICE_ANCHORS = [
  { x: 0,    z: -1106, y: 0.0 },
  { x: -2,   z: -1146, y: 3.4 },
  { x: -20,  z: -1188, y: 10.2 },
  { x: -84,  z: -1218, y: 18.0 },
  { x: -184, z: -1236, y: 26.2 },
  { x: -290, z: -1262, y: 34.4 },
  { x: -332, z: -1302, y: 41.8 },
  { x: -252, z: -1336, y: 49.2 },
  { x: -146, z: -1356, y: 55.6 },
  { x: -144, z: -1398, y: 61.6 },
  { x: -198, z: -1426, y: 65.2 },
  { x: -228, z: -1432, y: 66.0 }
];
const MOUNT_VICE_CURVE = new THREE.CatmullRomCurve3(
  MOUNT_VICE_ANCHORS.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
  false,
  'catmullrom',
  0.42
);
const MOUNT_VICE_ROAD = MOUNT_VICE_CURVE.getSpacedPoints(140);

function closestMountainRoad(x, z) {
  let bestDistSq = Infinity;
  let bestY = 0;
  for (let i = 0; i < MOUNT_VICE_ROAD.length - 1; i++) {
    const a = MOUNT_VICE_ROAD[i];
    const b = MOUNT_VICE_ROAD[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const lenSq = abx * abx + abz * abz;
    const t = lenSq > 1e-6 ? THREE.MathUtils.clamp(((x - a.x) * abx + (z - a.z) * abz) / lenSq, 0, 1) : 0;
    const cx = a.x + abx * t;
    const cz = a.z + abz * t;
    const dx = x - cx;
    const dz = z - cz;
    const dSq = dx * dx + dz * dz;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestY = a.y + (b.y - a.y) * t;
    }
  }
  return { dist: Math.sqrt(bestDistSq), roadY: bestY };
}

function getTerrainHeight(x, z) {
  if (z >= -1106) return 0;

  // Exact continuous switchback roadbed terrace — zero bumps, zero sideways tilt!
  const roadHit = closestMountainRoad(x, z);
  if (roadHit.dist <= 7.6) {
    return Math.max(0, roadHit.roadY);
  }

  // Smooth transition apron from flat North Vice City (Z = -1106) into Mount Vice foothills
  const northT = THREE.MathUtils.clamp((-1106 - z) / 62, 0, 1);
  const apron = northT * northT * (3 - 2 * northT);

  // Main Mount Vice 66m Peak + West Alpine Ridge + East Coastal Bluff
  const dMainSq = ((x + 228) * (x + 228)) / (174 * 174) + ((z + 1432) * (z + 1432)) / (150 * 150);
  const dWestSq = ((x + 392) * (x + 392)) / (118 * 118) + ((z + 1358) * (z + 1358)) / (115 * 115);
  const dEastSq = ((x + 58)  * (x + 58))  / (96 * 96)   + ((z + 1318) * (z + 1318)) / (98 * 98);

  let h = Math.exp(-dMainSq) * 68.0 + Math.exp(-dWestSq) * 38.0 + Math.exp(-dEastSq) * 32.0;
  h += (Math.sin(x * 0.042) * Math.cos(z * 0.048) + Math.sin((x + z) * 0.025) * 0.7) * 3.8 * apron;
  h = Math.max(0, h * apron);

  // Flat circular Summit Overlook Plateau around (-228, -1432) at Y = 66m
  const dSummit = Math.hypot(x + 228, z + 1432);
  if (dSummit < 28) {
    const st = THREE.MathUtils.clamp((28 - dSummit) / 11, 0, 1);
    const sb = st * st * (3 - 2 * st);
    h = THREE.MathUtils.lerp(h, 66.0, sb);
  }

  // Smoothly blend hillside embankment out from the level engineered roadbed (7.6m -> 24.0m)
  if (roadHit.dist < 24.0) {
    const rt = THREE.MathUtils.clamp((24.0 - roadHit.dist) / 16.4, 0, 1);
    const rb = rt * rt * (3 - 2 * rt);
    h = THREE.MathUtils.lerp(h, roadHit.roadY, rb);
  }
  return Math.max(0, h);
}

/* Realistic Vice City Citizens for [E] Text-Based Conversation & Street Brawl AI */
const NPC_PROFILES = [
  {
    name: 'Marco Vance', role: 'Ocean Drive Local',
    greeting: "Hey pal! Watch the suede — Ocean Drive is wild tonight. You heading up Mount Vice or checking out the Pier?",
    tip: "Insider tip: head north past North Point Mall to hit the Mount Vice 66m switchback highway, or hit Escobar Int'l to fly the Learjet 86! Take $50 for gas.",
    chat: "Nothing beats a Vice sunset with Wave 103 blasting on the deck. Try the Vice Cyclone roller coaster down on Carnival Pier!",
    provoke: "Oh, you think you're tough in that Hawaiian shirt?! Put 'em up — I'm dropping you right here!"
  },
  {
    name: 'Elena Cruz', role: 'Vice Airways Crew',
    greeting: "Just got off shift at Escobar Int'l! Runway 09/27 is wide open and the Learjet 86 is fueled up on the East VIP apron.",
    tip: "Press [B] anytime for Mini-Games — the Sky Ring Stunt Flight pays $3,000 if you clear all 8 golden rings! Here's $50 toward your license.",
    chat: "We just finished upgrading the new Hangar #2 and Jet-A1 Fuel Farm over at the airport. You can walk straight through the terminal!",
    provoke: "Excuse me?! Don't test a Vice local — I've got a mean right hook!"
  },
  {
    name: 'Dante Reyes', role: 'Street Racer',
    greeting: "Yo! Nice ride earlier. Ever tried taking a supercar flat-out up the Mount Vice hairpins without kissing the guardrails?",
    tip: "Start the Mount Vice Hillclimb Race at the North Point trailhead or press [B] — 10 neon gates to the 66m summit pays $2,500! Here's $50 stake.",
    chat: "My buddy swears you can launch straight off the Mount Vice summit ramp and parachute all the way back to the mall.",
    provoke: "Big talk for a tourist! Step off the curb and let's see those hands!"
  },
  {
    name: 'Chloe Mercer', role: 'Carnival Pier Host',
    greeting: "Welcome to Vice Beach! The Giant Ferris Wheel, Vice Cyclone Coaster, and Vintage Carousel are all open for riders right now!",
    tip: "Walk right onto Carnival Pier at Ocean Drive and press [E] near any ride to hop aboard! Here's $50 in arcade prize cash.",
    chat: "From the top of the Ferris Wheel you can see all of Starfish Island, Downtown, and Mount Vice rising in the north!",
    provoke: "Did you just talk trash on my boardwalk?! You're about to catch a Vice City knuckle sandwich!"
  },
  {
    name: 'Viktor Morales', role: 'Ammu-Nation Regular',
    greeting: "Keep your eyes sharp out here. Streets get heated when folks start throwing punches around Ocean Beach.",
    tip: "Drop by Ammu-Nation on Ocean Drive to restock full Armor & Health, or launch the 30-second Shooting Range challenge for $1,500! Take $50.",
    chat: "If your wanted heat gets too high, duck inside Ocean View Hotel — clears your stars and patches you right up.",
    provoke: "You picked the wrong guy to mouth off to, pal! Let's brawl!"
  },
  {
    name: 'Sonia Delgado', role: 'Starfish Island Stylist',
    greeting: "Loving the retro aviators and Cuban shirt! Very Vice City. Are you exploring the portfolio cinemas or cruising the coast?",
    tip: "There are 40 cash piles scattered across the avenues, islands, and Carnival Pier — plus $2,500 waiting on the Mountain Hillclimb! Take $50.",
    chat: "Hit [T] to shift from sunset into neon midnight — the whole boardwalk and airport glow like a movie set.",
    provoke: "Whoa — watch your mouth before I ruin those fancy sunglasses!"
  }
];

const SHOWROOMS = [
  {
    id: 'fix-my-itch', num: '01', district: 'Ocean Beach', title: 'FixMyItch',
    stat: 'Awwwards Nominee · Framer Showcase · Razorpay',
    desc: 'Tactile interactive campaign transforming merchant payment friction into an award-winning product showcase.',
    img: '/assets/images/mockup-fix-my-itch.webp', url: '/fix-my-itch/',
    accent: 0xff2e88, accentHex: '#FF2E88', x: -17.0, z: -82, rotY: 0, parkX: -4.2, parkZ: -82
  },
  {
    id: 'magic-checkout', num: '02', district: 'Starfish Island', title: 'Magic Checkout',
    stat: '5x Faster Checkout · 12 Interactive Islands',
    desc: 'High-craft conversion showcase demonstrating 1-click checkout speed and intelligent RTO protection.',
    img: '/assets/images/mockup-magic-checkout-v3.webp', url: '/magic-checkout/',
    accent: 0x21e6d1, accentHex: '#21E6D1', x: 162, z: -300, rotY: Math.PI, parkX: 144, parkZ: -300
  },
  {
    id: 'agentic-payments', num: '03', district: 'Downtown Vice', title: 'Agentic Payments',
    stat: 'AI Agent MCP Protocol · Multi-Device Launch',
    desc: 'Product storytelling and interactive system launch for Razorpay’s autonomous AI-native commerce stack.',
    img: '/assets/images/mockup-agentic-payments.webp', url: '/razorpay-agentic-payments/',
    accent: 0xff8a2a, accentHex: '#FF8A2A', x: -113.0, z: -220, rotY: 0, parkX: -100.2, parkZ: -220
  },
  {
    id: 'ai-launches', num: '04', district: 'Vice Point', title: 'India AI Impact',
    stat: '4 Live AI Unveils · 14-Day Sprint · Summit',
    desc: 'Rapid-turnaround keynote launchpad unveiling four flagship AI payment products live at Bharat Mandapam.',
    img: '/assets/images/mockup-ai-launches.webp', url: '/razorpay-ai-launches/',
    accent: 0x21e6d1, accentHex: '#21E6D1', x: -17.0, z: -382, rotY: 0, parkX: -4.2, parkZ: -382
  },
  {
    id: 'journey', num: '05', district: 'Little Havana', title: 'Journey App',
    stat: 'Multi-City India Planner · Conflict Auto-Fix',
    desc: 'Calm mobile travel companion unifying multi-leg flights, stays, and live itinerary conflict resolution.',
    img: '/assets/images/journey-cover-v2.jpg', url: '/journey/',
    accent: 0xffd36b, accentHex: '#FFD36B', x: -113.0, z: -538, rotY: 0, parkX: -100.2, parkZ: -538
  }
];

const CONTACT_SHOWROOM = {
  id: 'contact', num: '★', district: 'Vice Beach Promenade', title: 'Akshat Singh',
  stat: 'Staff Product Designer · Razorpay · Bengaluru',
  desc: 'Staff Product Designer at Razorpay crafting interactive product storytelling, AI-native workflows, and high-conversion commerce systems.',
  img: '/assets/images/home-1.webp', url: 'mailto:akshat018singh@gmail.com',
  accent: 0xffd36b, accentHex: '#FFD36B', x: 24.5, z: -540, parkX: 11.5, parkZ: -540
};

const CAM_MODES = ['Chase', 'Low', 'Drone'];
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _tmpCol = new THREE.Color();
const _tmpCol2 = new THREE.Color();

function buildVintageSpeedoSVG() {
  const ticks = [];
  const labels = [];
  // Sweep from -130 deg (0 km/h) to +130 deg (280 km/h)
  for (let v = 0; v <= 280; v += 10) {
    const t = v / 280;
    const deg = -130 + t * 260;
    const rad = ((deg - 90) * Math.PI) / 180;
    const isMajor = v % 40 === 0;
    const isMid = v % 20 === 0 && !isMajor;
    const rOut = 88;
    const rIn = isMajor ? 74 : isMid ? 78 : 82;
    const x1 = (100 + Math.cos(rad) * rOut).toFixed(1);
    const y1 = (100 + Math.sin(rad) * rOut).toFixed(1);
    const x2 = (100 + Math.cos(rad) * rIn).toFixed(1);
    const y2 = (100 + Math.sin(rad) * rIn).toFixed(1);
    const col = v >= 220 ? '#FF465A' : (isMajor ? '#FFE4B5' : 'rgba(255,212,148,0.58)');
    const sw = isMajor ? 2.4 : isMid ? 1.5 : 1.0;
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`);
    if (isMajor) {
      const rl = 61;
      const lx = (100 + Math.cos(rad) * rl).toFixed(1);
      const ly = (100 + Math.sin(rad) * rl + 3.6).toFixed(1);
      labels.push(`<text x="${lx}" y="${ly}" text-anchor="middle" fill="${v >= 220 ? '#FF5C6C' : '#FFE4B5'}" font-family="Barlow Condensed, sans-serif" font-weight="800" font-size="13.5">${v}</text>`);
    }
  }
  return `
    <svg class="v3-dial-svg" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="v3DialBg" cx="50%" cy="44%" r="54%">
          <stop offset="0%" stop-color="#1f1924"/>
          <stop offset="72%" stop-color="#0f0b14"/>
          <stop offset="100%" stop-color="#07050a"/>
        </radialGradient>
        <linearGradient id="v3BrassCap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f2d59b"/>
          <stop offset="50%" stop-color="#9c7a42"/>
          <stop offset="100%" stop-color="#403018"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#v3DialBg)" stroke="rgba(255,220,165,0.22)" stroke-width="1.2"/>
      <circle cx="100" cy="100" r="91" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <!-- Redline danger arc (220-280 km/h) -->
      <path d="M 184.7 76.2 A 88 88 0 0 1 167.4 156.6" fill="none" stroke="rgba(255,58,86,0.34)" stroke-width="6.5" stroke-linecap="round"/>
      <!-- Inner subtle tachometer RPM arc -->
      <circle cx="100" cy="100" r="46" fill="none" stroke="rgba(255,214,153,0.10)" stroke-width="3.5" stroke-dasharray="208 290" stroke-dashoffset="0" transform="rotate(140 100 100)"/>
      <circle class="v3-rpm-arc" data-rpm-arc cx="100" cy="100" r="46" fill="none" stroke="#FFB84D" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="208 290" stroke-dashoffset="208" transform="rotate(140 100 100)"/>
      ${ticks.join('')}
      ${labels.join('')}
      <text x="100" y="87" text-anchor="middle" fill="rgba(255,212,148,0.52)" font-family="JetBrains Mono, monospace" font-size="6.8" letter-spacing="1.4">VEGLIA · KM/H</text>
      <!-- Sweeping vintage coral-orange needle -->
      <g class="v3-needle-wrap" data-needle>
        <polygon points="98.2,116 101.8,116 100.9,22 99.1,22" fill="#FF4B3E"/>
        <polygon points="99.3,100 100.7,100 100.3,24 99.7,24" fill="#FF9B71"/>
        <circle cx="100" cy="100" r="10.5" fill="url(#v3BrassCap)" stroke="#1b1410" stroke-width="1.5"/>
        <circle cx="100" cy="100" r="4.2" fill="#171216"/>
      </g>
    </svg>
  `;
}

function buildVintageTachSVG() {
  const ticks = [];
  const labels = [];
  for (let r = 0; r <= 9; r++) {
    const deg = -128 + (r / 9) * 256;
    const rad = ((deg - 90) * Math.PI) / 180;
    const isRed = r >= 7;
    const x1 = 60 + Math.cos(rad) * 44;
    const y1 = 60 + Math.sin(rad) * 44;
    const x2 = 60 + Math.cos(rad) * 51;
    const y2 = 60 + Math.sin(rad) * 51;
    ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${isRed ? '#FF3A56' : '#FFE4B5'}" stroke-width="1.8" stroke-linecap="round"/>`);
    const lx = 60 + Math.cos(rad) * 34.5;
    const ly = 60 + Math.sin(rad) * 34.5 + 3.0;
    labels.push(`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" fill="${isRed ? '#FF4B5C' : '#FFF0D4'}" font-family="JetBrains Mono, monospace" font-size="8.2" font-weight="800">${r}</text>`);
  }
  return `
    <svg class="v3-tach-svg" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,214,153,0.14)" stroke-width="1"/>
      <path d="M 103.5 34.5 A 50 50 0 0 1 99.4 90.8" fill="none" stroke="rgba(255,58,86,0.42)" stroke-width="4.5" stroke-linecap="round"/>
      ${ticks.join('')}
      ${labels.join('')}
      <text x="60" y="79" text-anchor="middle" fill="rgba(255,212,148,0.62)" font-family="JetBrains Mono, monospace" font-size="5.8" letter-spacing="0.8">RPM x1000</text>
      <g class="v3-tach-needle" data-tach-needle>
        <polygon points="58.7,69 61.3,69 60.5,14 59.5,14" fill="#FF4B3E"/>
        <circle cx="60" cy="60" r="6.5" fill="#c7b28a" stroke="#1b1410" stroke-width="1.2"/>
        <circle cx="60" cy="60" r="2.6" fill="#171216"/>
      </g>
    </svg>
  `;
}

let instance = null;

function detectSoftwareWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch (_) {
    return true;
  }
}

class ViceCity3DApp {
  constructor() {
    this.isSoftwareGl = detectSoftwareWebGL();
    this.isOpen = false;
    this.started = false;
    this.frameId = 0;
    this.frameCount = 0;
    this.paintIdx = 0;
    this.camIdx = 0;
    this.lightsOn = true;
    this.visited = new Set();
    this.activeShowroom = null;
    this.showroomAnims = [];
    this.projectsHubOpen = false;
    this.modalProjectIdx = 0;
    this.radioTuneRot = 0;
    this.autopilotQueue = [];
    this.autopilotPath = [];
    this.autopilotTarget = null;
    this.autopilotStuckTimer = 0;
    this.autopilotLastPos = { x: 3.2, z: 6.0 };
    this.autopilotReverseTimer = 0;
    this.autopilotReverseSteer = 0;
    this.fullMapOpen = false;

    // Pointer-Lock & Hover-and-Move Camera Look state (System OS Cursor Hidden)
    this.pointerLocked = false;
    this.orbitYawOffset = 0;
    this.orbitPitchOffset = 0;
    this.dragging = false;
    this.lastPtrX = 0;
    this.lastPtrY = 0;
    this.lastHoverX = null;
    this.lastHoverY = null;
    this.hoverNormX = 0;
    this.lastLookTime = 0;
    this.uiCursorX = -100;
    this.uiCursorY = -100;

    // On-Foot Roaming, Weapons Arsenal & GTA Combat State
    this.mode = 'car'; // 'car' | 'foot'
    this.weapon = 'fists'; // 'fists' | 'bat' | 'pistol' | 'smg' | 'shotgun' | 'rifle' | 'bazooka'
    this.fireCooldown = 0;
    this.fireHeld = false;
    this.muzzleFlashTimer = 0;
    this.crosshairPulseTimer = 0;
    this.rockets = [];
    this.explosions = [];
    this.debris = [];
    this.tracers = [];
    this.vehiclesDestroyed = 0;
    this.playerState = {
      x: 0.6, y: 0, z: 6.0, vx: 0, vy: 0, vz: 0, yaw: 0, speed: 0,
      turnLean: 0, landSquash: 0,
      walkPhase: 0, grounded: true, parachuting: false,
      attackTimer: 0, attackDur: 0.32, attackType: 'punch', attackCombo: 0,
      hitApplied: false, comboResetTimer: 0, combatGuardTimer: 0
    };
    this.koCount = 0;
    this.carjackAnim = null; // Cinematic 4-phase carjacking / door enter-exit sequence
    this.flyablePlanes = [];
    this.activePlane = null;
    this.enterableBuildings = [];
    this.doorBeacons = [];
    this.interiorPerks = [];
    this.parachuteMesh = null;

    // Dynamic Weather & Day/Night Cycle State
    this.timeIdx = 0; // 0: Sunset, 1: Day, 2: Night, 3: Dawn
    this.weatherIdx = 0; // 0: Clear, 1: Rain, 2: Storm
    this.envSunDir = SUN_DIR.clone();
    this.lightningFlash = 0;
    this.lightningCooldown = 5.0;
    this.rainLines = null;

    // Solid world collision geometry & interactive items
    this.boxColliders = [];
    this.circleColliders = [];
    this.tokens = [];
    this.tokensCollected = 0;
    this.weaponPickups = [];
    this.ramps = [];
    this.boostPads = [];
    this.knockables = [];
    this.heli = null;
    this.ferrisWheel = null;
    this.carnivalPier = null;
    this.flyingJet = null;
    this.parkedJets = [];
    this.propPlane = null;
    this.atcRadar = null;
    this.windsock = null;
    this.rwyLights = [];
    this.fountains = [];
    this.speedboats = [];
    this.navBeacon = null;
    this.navArrow = null;
    this.boostPadTimer = 0;
    this.impactCooldown = 0;
    this.camShake = 0;

    // GTA Wanted Stars, Player Health/Armor, WASTED, NPC Dialogue, Rides, Mount Vice & Mini-Games!
    this.playerHp = 100;
    this.playerArmor = 100;
    this.dmgFlashTimer = 0;
    this.wastedTimer = 0;
    this.activeDialogue = null;
    this.activeRide = null;
    this.pierRides = [];
    this.miniGameHubOpen = false;
    this.activeMiniGame = null;
    this.miniGamePads = [];
    this.mountVice = null;
    this.snapCameraNext = false;
    this.lastRadarInfo = '';
    this.squishCount = 0;
    this.streakCount = 0;
    this.streakTimer = 0;
    this.wantedStars = 0;
    this.wantedDecay = 0;
    this.cash = 0;
    this.odometerKm = 18.4;

    this.lastCubeX = 9999;
    this.lastCubeZ = 9999;
    this.lastCubeFrame = -999;
    this.lastHudKmh = -1;
    this.lastHudGear = '';
    this.lastHudZone = '';
    this.lastHudWp = '';
    this.lastOdoStr = '';
    this.lastNeedleDeg = -999;
    this.lastTachDeg = -999;
    this.lastRpmOffset = -1;
    this.lastAutoDist = -1;
    this.lastNavKey = '';
    this.audio = new ViceAudioEngine();
    this.carState = {
      x: 3.2, y: 0, z: 6.0, vy: 0, airborne: false, airTime: 0,
      yaw: 0, speed: 0, steer: 0,
      wheelSpin: 0, driftSlip: 0, pitch: 0, roll: 0, popAngle: 0.56
    };
    this.keys = { up: false, down: false, left: false, right: false, nitro: false, drift: false, dive: false };

    this.buildDOM();
    this.initWebGL();
    this.bindEvents();
    this.exposeQCHook();
  }

  exposeQCHook() {
    window.__VICE_QC__ = {
      _app: this,
      getState: () => ({
        isOpen: this.isOpen,
        started: this.started,
        mode: this.mode,
        weapon: this.weapon,
        timeOfDay: TIME_PRESETS[this.timeIdx].id,
        weather: WEATHER_PRESETS[this.weatherIdx].id,
        radioStation: this.audio.getRadioStation().name,
        isSoftwareGl: this.isSoftwareGl,
        kmh: Math.round(Math.abs(this.carState.speed) * 3.9),
        x: this.carState.x,
        y: this.carState.y,
        z: this.carState.z,
        car: { ...this.carState },
        player: { ...this.playerState },
        boxColliders: this.boxColliders.length,
        circleColliders: this.circleColliders.length,
        pedestrians: this.pedestrians ? this.pedestrians.length : 0,
        bikiniCount: this.pedestrians ? this.pedestrians.filter((p) => p.bikini).length : 0,
        rocketsActive: this.rockets.length,
        explosionsActive: this.explosions.length,
        debrisActive: this.debris.length,
        vehiclesDestroyed: this.vehiclesDestroyed,
        tokensTotal: this.tokens.length,
        tokensCollected: this.tokensCollected,
        cashPilesTotal: this.tokens.length,
        cashPilesCollected: this.tokensCollected,
        weaponPickups: this.weaponPickups.length,
        activeVehicle: this.activeVehicle ? this.activeVehicle.label : 'VICE SUPERCAR',
        parkedVehicles: this.parkedVehicles ? this.parkedVehicles.length : 0,
        trafficCount: this.traffic ? this.traffic.length : 0,
        showroomCount: this.showroomAnims.length,
        projectsHubOpen: this.projectsHubOpen,
        ramps: this.ramps.length,
        boostPads: this.boostPads.length,
        knockables: this.knockables.length,
        autopilotActive: this.autopilotQueue.length > 0,
        autopilotRemaining: this.autopilotQueue.length,
        fullMapOpen: this.fullMapOpen,
        squishCount: this.squishCount,
        koCount: this.koCount,
        hasAirportJets: Boolean(this.flyingJet && this.parkedJets && this.parkedJets.length >= 2),
        flyablePlanes: this.flyablePlanes ? this.flyablePlanes.length : 0,
        activePlane: this.activePlane ? {
          label: this.activePlane.label,
          x: Math.round(this.activePlane.x),
          y: Math.round(this.activePlane.y),
          z: Math.round(this.activePlane.z),
          speedKts: Math.round(this.activePlane.speed * 1.94),
          gearDown: this.activePlane.gearBlend > 0.5
        } : null,
        enterableCount: this.enterableBuildings ? this.enterableBuildings.length : 0,
        hasCarnivalPier: Boolean(this.carnivalPier),
        hasMountVice: Boolean(this.mountVice),
        playerHp: this.playerHp,
        playerArmor: this.playerArmor,
        dialogueOpen: Boolean(this.activeDialogue),
        activeRide: this.activeRide ? this.activeRide.id : null,
        activeMiniGame: this.activeMiniGame ? this.activeMiniGame.id : null,
        terrainHeight: getTerrainHeight(this.mode === 'foot' ? this.playerState.x : this.carState.x, this.mode === 'foot' ? this.playerState.z : this.carState.z),
        carjackActive: Boolean(this.carjackAnim),
        carjackPhase: this.carjackAnim ? Number(this.carjackAnim.t.toFixed(2)) : 0,
        pointerLocked: Boolean(this.pointerLocked),
        cursorHidden: this.el && this.el.stage ? getComputedStyle(this.el.stage).cursor === 'none' : false,
        wantedStars: this.wantedStars,
        cash: this.cash,
        zone: this.el.zone.textContent,
        renderInfo: this.renderer ? {
          calls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
          geometries: this.renderer.info.memory.geometries,
          textures: this.renderer.info.memory.textures
        } : null
      }),
      stealNearest: (instant = false) => {
        this.carjackAnim = null;
        if (this.mode !== 'foot') {
          this.setMode('foot');
          this.playerState.x = this.carState.x - 2.3;
          this.playerState.z = this.carState.z;
          this.player.root.position.set(this.playerState.x, 0, this.playerState.z);
        }
        let best = null, bestD = Infinity;
        for (let i = 0; i < this.traffic.length; i++) {
          const tc = this.traffic[i];
          const d = Math.hypot(tc.position.x - this.playerState.x, tc.position.z - this.playerState.z);
          if (d < bestD) { bestD = d; best = tc; }
        }
        if (best) {
          const rx = Math.cos(best.rotation.y), rz = -Math.sin(best.rotation.y);
          this.playerState.x = best.position.x - rx * 2.25;
          this.playerState.z = best.position.z - rz * 2.25;
          this.player.root.position.set(this.playerState.x, 0, this.playerState.z);
          if (instant) this.finishStealTrafficCar(best);
          else this.startCarjackAnim(best);
        }
        return best && best.userData && best.userData.carRig ? best.userData.carRig.label : (this.activeVehicle ? this.activeVehicle.label : null);
      },
      explodeNearestCar: () => {
        const act = this.mode === 'foot' ? this.playerState : this.carState;
        let best = null, bestD = Infinity;
        for (let i = 0; i < this.traffic.length; i++) {
          const tc = this.traffic[i];
          if (tc.userData.vehState === 'wrecked') continue;
          const d = Math.hypot(tc.position.x - act.x, tc.position.z - act.z);
          if (d < bestD) { bestD = d; best = tc; }
        }
        if (best) {
          this.detonateVehicle(best, 'M4 RIFLE');
          return { x: best.position.x, z: best.position.z, label: best.userData.carRig ? best.userData.carRig.label : 'CAR' };
        }
        return null;
      },
      shootNearestCar: (shots = 5) => {
        const act = this.mode === 'foot' ? this.playerState : this.carState;
        let best = null, bestD = Infinity;
        for (let i = 0; i < this.traffic.length; i++) {
          const tc = this.traffic[i];
          if (tc.userData.vehState === 'wrecked') continue;
          const d = Math.hypot(tc.position.x - act.x, tc.position.z - act.z);
          if (d < bestD) { bestD = d; best = tc; }
        }
        if (!best) return null;
        for (let s = 0; s < shots; s++) {
          if (best.userData.vehState === 'wrecked') break;
          this.damageVehicle(best, 22, best.position.x, 1.0, best.position.z, 0, -1, 'M4 RIFLE');
        }
        return {
          hp: best.userData.hp,
          vehState: best.userData.vehState,
          x: best.position.x,
          z: best.position.z
        };
      },
      step: (seconds = 0.5) => {
        const steps = Math.max(1, Math.ceil(seconds / 0.03));
        const dt = seconds / steps;
        for (let s = 0; s < steps; s++) this.update(dt, this.clock.getElapsedTime() + s * dt);
        this.renderFrame();
      },
      teleport: (x, z, yaw = 0, speed = 0) => {
        if (this.mode === 'foot') {
          this.playerState.x = x;
          this.playerState.z = z;
          this.playerState.y = 0;
          this.playerState.vy = 0;
          this.playerState.yaw = yaw;
        } else {
          this.carState.x = x;
          this.carState.y = 0;
          this.carState.vy = 0;
          this.carState.airborne = false;
          this.carState.z = z;
          this.carState.yaw = yaw;
          this.carState.speed = speed;
        }
        this.snapCameraNext = true;
        this.cancelAutopilot();
      },
      toggleVehicle: () => this.toggleVehicle(true),
      boardPlane: (idx = 0) => {
        const pl = this.flyablePlanes && this.flyablePlanes[idx];
        if (!pl) return false;
        this.started = true;
        this.el.startOv.hidden = true;
        this.enterPlane(pl);
        return pl.label;
      },
      setPlaneFlight: (x, y, z, yaw = 0, pitch = 0.08, roll = -0.22, speed = 64) => {
        if (!this.activePlane && this.flyablePlanes && this.flyablePlanes[0]) {
          this.started = true;
          this.el.startOv.hidden = true;
          this.enterPlane(this.flyablePlanes[0]);
        }
        const pl = this.activePlane;
        if (!pl) return false;
        pl.x = x; pl.y = y; pl.z = z;
        pl.yaw = yaw; pl.pitch = pitch; pl.roll = roll;
        pl.speed = speed; pl.throttle = 0.85;
        pl.gearBlend = y > 8 ? 0 : 1;
        this.syncPlaneTransform(pl, 0.016, this.clock.getElapsedTime());
        return true;
      },
      enterBuilding: (id) => {
        const b = this.enterableBuildings && this.enterableBuildings.find((eb) => eb.id === id);
        if (!b) return false;
        this.started = true;
        this.el.startOv.hidden = true;
        this.setMode('foot');
        this.playerState.x = b.insideX;
        this.playerState.z = b.insideZ;
        this.playerState.y = 0;
        this.playerState.yaw = b.insideYaw;
        this.orbitYawOffset = b.insideYaw;
        this.orbitPitchOffset = 0.05;
        this.player.root.position.set(b.insideX, 0, b.insideZ);
        this.player.root.rotation.y = b.insideYaw;
        return b.label;
      },
      meleeAttack: (type = 'punch') => this.triggerMeleeAttack(type),
      setWeapon: (id) => this.setWeapon(id),
      fireWeapon: () => this.fireWeapon(),
      setTimeOfDay: (idx) => this.setTimeOfDay(idx),
      setWeather: (idx) => this.setWeather(idx),
      cycleRadio: (delta = 1) => this.cycleRadio(delta),
      hoverLook: (dx, dy = 0) => this.applyHoverLook(dx, dy),
      fastTravelTo: (id) => {
        const wp = WAYPOINTS.find((w) => w.id === id);
        if (!wp) return false;
        this.fastTravelTo(wp);
        return true;
      },
      planAutopilotTo: (id) => {
        const wp = WAYPOINTS.find((w) => w.id === id);
        if (!wp) return false;
        this.started = true;
        this.el.startOv.hidden = true;
        this.planAutopilotTo(wp);
        return this.autopilotQueue.map((p) => ({ x: Math.round(p.x), z: Math.round(p.z) }));
      },
      openFullMap: () => this.openFullMap(),
      closeFullMap: () => this.closeFullMap(),
      openProjectsHub: () => this.openProjectsHub(),
      closeProjectsHub: () => this.closeProjectsHub(),
      talkNearestNpc: () => {
        this.started = true; this.el.startOv.hidden = true;
        if (this.mode !== 'foot') this.setMode('foot');
        const ped = this.findNearestTalkableNpc(80) || this.pedestrians[0];
        if (!ped) return false;
        this.playerState.x = ped.x - 1.9;
        this.playerState.z = ped.z + 1.4;
        this.playerState.y = getTerrainHeight(this.playerState.x, this.playerState.z);
        this.playerState.yaw = Math.atan2(-(ped.x - this.playerState.x), -(ped.z - this.playerState.z));
        this.orbitYawOffset = this.playerState.yaw;
        this.snapCameraNext = true;
        this.openNpcDialogue(ped);
        return ped.name;
      },
      triggerNpcFight: () => {
        this.started = true; this.el.startOv.hidden = true;
        if (this.mode !== 'foot') this.setMode('foot');
        this.closeNpcDialogue();
        const ped = this.findNearestTalkableNpc(80) || this.pedestrians[0];
        if (!ped) return false;
        this.playerState.x = ped.x - 1.65;
        this.playerState.z = ped.z + 1.1;
        this.playerState.y = getTerrainHeight(this.playerState.x, this.playerState.z);
        this.playerState.yaw = Math.atan2(-(ped.x - this.playerState.x), -(ped.z - this.playerState.z));
        this.orbitYawOffset = this.playerState.yaw;
        this.snapCameraNext = true;
        ped.fighter = true;
        ped.provoked = true;
        ped.state = 'fight';
        ped.stateTimer = 20.0;
        ped.attackTimer = 0.44;
        ped.attackCooldown = 0.6;
        ped.hitDealt = false;
        this.damagePlayer(14, ped);
        return ped.name;
      },
      boardRide: (rideId = 'coaster') => {
        this.started = true; this.el.startOv.hidden = true;
        const r = this.pierRides.find((pr) => pr.id === rideId) || this.pierRides[0];
        if (!r) return false;
        this.boardPierRide(r);
        return r.label;
      },
      exitRide: () => this.exitPierRide(),
      startMiniGame: (id = 'range') => {
        this.started = true; this.el.startOv.hidden = true;
        this.startMiniGame(id);
        return this.activeMiniGame ? this.activeMiniGame.id : null;
      },
      teleportMountainSummit: () => {
        this.started = true; this.el.startOv.hidden = true;
        this.closeNpcDialogue();
        this.closeMiniGameHub();
        if (this.mode === 'ride') this.exitPierRide();
        if (this.mode !== 'car') this.setMode('car');
        const pt = MOUNT_VICE_ROAD[MOUNT_VICE_ROAD.length - 18];
        const nextPt = MOUNT_VICE_ROAD[MOUNT_VICE_ROAD.length - 10];
        this.carState.x = pt.x;
        this.carState.z = pt.z;
        this.carState.y = getTerrainHeight(pt.x, pt.z) + 0.08;
        this.carState.vy = 0;
        this.carState.airborne = false;
        this.carState.yaw = Math.atan2(-(nextPt.x - pt.x), -(nextPt.z - pt.z));
        this.carState.speed = 14;
        this.orbitYawOffset = 0;
        this.orbitPitchOffset = 0.14;
        this.snapCameraNext = true;
        const vehMesh = this.activeVehicle ? this.activeVehicle.mesh : this.car.root;
        vehMesh.position.set(this.carState.x, this.carState.y, this.carState.z);
        vehMesh.rotation.y = this.carState.yaw;
        this.drawRadar();
        return { x: pt.x, y: this.carState.y, z: pt.z };
      },
      setCameraMode: (idx) => {
        this.camIdx = idx % CAM_MODES.length;
        this.el.camBtn.textContent = `Cam: ${CAM_MODES[this.camIdx]}`;
      },
      setOrbit: (yaw, pitch) => {
        this.orbitYawOffset = yaw;
        this.orbitPitchOffset = pitch;
      },
      stepSim: (dt = 0.016, steps = 1) => {
        for (let i = 0; i < steps; i++) this.update(dt, this.clock.getElapsedTime() + i * dt);
        this.renderFrame();
      },
      setKeys: (k) => Object.assign(this.keys, k)
    };
  }

  buildDOM() {
    const stage = document.createElement('div');
    stage.className = 'v3-stage';
    stage.setAttribute('role', 'dialog');
    stage.setAttribute('aria-label', 'Vice City 3D Open World');

    stage.innerHTML = `
      <div class="v3-mount" data-mount></div>
      <div class="v3-vignette"></div>
      <!-- In-Game Look-Through Reticle (Replaces OS System Cursor during Active 3D Look & Aim) -->
      <div class="v3-crosshair" data-crosshair>
        <span class="v3-reticle-ring"></span>
        <span class="v3-reticle-tick t"></span>
        <span class="v3-reticle-tick b"></span>
        <span class="v3-reticle-tick l"></span>
        <span class="v3-reticle-tick r"></span>
        <span class="v3-crosshair-dot"></span>
      </div>
      <!-- Custom In-Game Vice City UI Pointer (Replaces Native OS Arrow Over Menus & HUD) -->
      <div class="v3-ui-cursor" data-ui-cursor aria-hidden="true">
        <svg viewBox="0 0 26 26" fill="none">
          <path d="M3 2.5L21.5 11.2L13.4 13.8L10.8 22L3 2.5Z" fill="#0B0418" stroke="#21E6D1" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="11.2" cy="11.2" r="2.1" fill="#FF2E88"/>
        </svg>
      </div>
      <div class="v3-lock-tip" data-lock-tip>Click Road for 360° Free-Look · ESC Unlock</div>

      <!-- Live 3D-Projected Floating In-World Project Waypoint Markers -->
      <div class="v3-proj-pins" data-proj-pins>
        ${SHOWROOMS.map((sr) => `
          <button class="v3-proj-pin" type="button" data-proj-pin="${sr.id}" style="--pin-col:${sr.accentHex}" title="Click for GPS Auto-Drive to ${sr.title}">
            <span class="v3-pin-num">${sr.num}</span>
            <span class="v3-pin-txt">
              <span class="v3-pin-name">${sr.title}</span>
              <span class="v3-pin-dist" data-pin-dist="${sr.id}">--m</span>
            </span>
          </button>
        `).join('')}
      </div>

      <div class="v3-top">
        <div class="v3-brand">
          <div class="v3-kicker">Vice City Open World · Remastered 3D</div>
          <div class="v3-zone" data-zone>Ocean Drive South</div>
          <div class="v3-meta-line" data-progress>0 / 5 Projects · 0 / 40 Cash Piles</div>
          <!-- Exact Main Website 1986 Woodgrain & Brushed-Aluminum Car Radio (Tap LCD to Expand) -->
          <div class="v3-rad" data-radio-deck role="group" aria-label="In-car radio">
            <div class="v3-rad-in">
              <div class="v3-rad-top">
                <div class="v3-rad-k">
                  <div class="v3-knob" data-rad-vol role="slider" tabindex="0" aria-label="Power and volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="60" style="--r:27deg" title="Click Power · Drag or Scroll Volume"></div>
                  <small>Pwr · Vol</small>
                </div>
                <div class="v3-rad-lcd" data-rad-lcd title="Click to expand/fold radio deck (Press R to tune)">
                  <div class="v3-lcd-r">
                    <span class="v3-lcd-st">ST</span>
                    <span class="v3-lcd-f" data-rad-f>103.0</span>
                    <span class="v3-lcd-u">FM</span>
                    <span class="v3-rad-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
                  </div>
                  <div class="v3-lcd-n" data-rad-n>Wave 103 · paused</div>
                  <div class="v3-lcd-s" aria-hidden="true"><i class="v3-nd" data-rad-nd style="--np:75.6%"></i></div>
                </div>
                <div class="v3-rad-k">
                  <div class="v3-knob" data-rad-tune role="button" tabindex="0" aria-label="Tune: next station" title="Click or Scroll to Tune Station (R)"></div>
                  <small>Tune</small>
                </div>
              </div>
              <div class="v3-rad-bot">
                <div class="v3-rad-pre" role="group" aria-label="Station presets">
                  ${RADIO_STATIONS.map((st, i) => `<button class="v3-rad-p" type="button" data-rad-pre="${i}" aria-pressed="${i === 0 ? 'true' : 'false'}" aria-label="${st.name}">${i + 1}</button>`).join('')}
                </div>
                <div class="v3-rad-tape" aria-hidden="true"><i class="v3-reel"></i><i class="v3-reel"></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="v3-top-r">
          <div class="v3-top-tools">
            <button class="v3-env-chip mini" type="button" data-mg-btn title="Play GTA 5 Style Mini-Games (B)">🎮 <span>Mini-Games [B]</span></button>
            <button class="v3-env-chip proj" type="button" data-proj-btn title="Browse All 5 Projects & GPS Warp (P)">★ <span>Projects [P]</span></button>
            <button class="v3-env-chip" type="button" data-time-btn title="Cycle Time of Day (T)">☀ <span>Sunset</span></button>
            <button class="v3-env-chip" type="button" data-weather-btn title="Cycle Weather (Y)">☀ <span>Clear</span></button>
            <button class="v3-exit" type="button" data-close>Exit · ESC</button>
          </div>
          <!-- Remastered GTA Vice City Top-Right Status Cluster -->
          <div class="v3-gta-hud" aria-label="Vice City HUD Status">
            <div class="v3-gta-row">
              <div class="v3-gta-cash" data-cash>$0</div>
              <span class="v3-gta-wep-pill" data-gta-wep-pill>DRIVE-BY UZI</span>
            </div>
            <div class="v3-gta-row">
              <div class="v3-wanted" data-wanted title="GTA Wanted Level">
                <span class="star" data-s="1">★</span><span class="star" data-s="2">★</span><span class="star" data-s="3">★</span><span class="star" data-s="4">★</span><span class="star" data-s="5">★</span>
              </div>
            </div>
            <div class="v3-gta-bars">
              <div class="v3-bar-wrap">
                <div class="v3-bar-lbl"><span>HP</span><span data-hp-val>100</span></div>
                <div class="v3-bar-track"><div class="v3-bar-fill hp" data-hp-fill></div></div>
              </div>
              <div class="v3-bar-wrap">
                <div class="v3-bar-lbl"><span>ARMOR</span><span data-arm-val>100</span></div>
                <div class="v3-bar-track"><div class="v3-bar-fill arm" data-arm-fill></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="v3-dmg-flash" data-dmg-flash></div>
      <div class="v3-wasted" data-wasted>
        <div class="v3-wasted-title">WASTED</div>
        <div class="v3-wasted-sub">Respawning at Ocean View Hospital…</div>
      </div>

      <!-- GTA 5 Interactive Bottom-Center NPC Dialogue Box ([E] Conversation) -->
      <div class="v3-dlg" data-dlg role="dialog" aria-label="NPC Conversation">
        <div class="v3-dlg-head">
          <div class="v3-dlg-who">
            <span class="v3-dlg-name" data-dlg-name>Marco Vance</span>
            <span class="v3-dlg-role" data-dlg-role>Ocean Drive Local</span>
          </div>
          <button class="v3-dlg-close" type="button" data-dlg-close>Leave [E / ESC]</button>
        </div>
        <div class="v3-dlg-line" data-dlg-line>Hey pal! Welcome to Ocean Drive.</div>
        <div class="v3-dlg-choices">
          <button class="v3-dlg-choice" type="button" data-dlg-choice="0"><span class="v3-dlg-key">1</span><span>Ask for Local Tip (+$50)</span></button>
          <button class="v3-dlg-choice" type="button" data-dlg-choice="1"><span class="v3-dlg-key">2</span><span>Chat About Vice City</span></button>
          <button class="v3-dlg-choice taunt" type="button" data-dlg-choice="2"><span class="v3-dlg-key">3</span><span>Talk Trash (Start Brawl!)</span></button>
        </div>
      </div>

      <!-- Carnival Pier Active Ride HUD Banner -->
      <div class="v3-ride-bar" data-ride-bar>
        <div>
          <div class="v3-ride-title" data-ride-title>VICE CYCLONE COASTER</div>
          <div class="v3-ride-sub" data-ride-sub>Vice Carnival Pier · Move Mouse for 360° View</div>
        </div>
        <button class="v3-ride-exit" type="button" data-ride-exit>Exit Ride [E / F]</button>
      </div>

      <!-- Active Mini-Game Live Score & Timer HUD -->
      <div class="v3-mg-hud" data-mg-hud>
        <span class="v3-mg-name" data-mg-name>SHOOTING RANGE</span>
        <span class="v3-mg-stat" data-mg-stat>0 / 12 TARGETS</span>
        <span class="v3-mg-timer" data-mg-timer>30.0s</span>
        <button class="v3-ride-exit" type="button" data-mg-abort>Quit</button>
      </div>

      <div class="v3-combo" data-combo>SQUISH! <span>+$100</span></div>

      <!-- Top-Center Turn-by-Turn GPS Navigation Ribbon -->
      <div class="v3-nav-bar" data-nav-bar>
        <div class="v3-nav-arrow" data-nav-arrow>↑</div>
        <div class="v3-nav-info">
          <div class="v3-nav-dir" data-nav-dir>Head North on Ocean Drive</div>
          <div class="v3-nav-sub" data-nav-sub>GPS Auto-Drive · 120m</div>
        </div>
        <button class="v3-nav-tp" type="button" data-nav-tp title="Fast Travel directly to destination">Fast Travel</button>
        <button class="v3-auto-cancel" type="button" data-nav-cancel>Stop</button>
      </div>

      <!-- Upgraded Tactical Interactive Corner GPS Minimap (Click or Press G for Full City Map) -->
      <div class="v3-radar" data-radar-wrap title="Open Full Vice City GPS Map (G)">
        <div class="v3-radar-head">
          <span>VICE TACTICAL GPS</span>
          <strong>MAP [G]</strong>
        </div>
        <canvas width="212" height="184" data-radar></canvas>
        <div class="v3-radar-foot">
          <span data-radar-street>Ocean Drive</span>
          <span data-radar-info>40 Cash Piles</span>
        </div>
      </div>

      <!-- Realistic 1986 Italian Exotic Dual-Gauge Analog Instrument Binnacle -->
      <div class="v3-cluster" data-cluster aria-label="Vintage analog speedometer and tachometer">
        <div class="v3-binnacle-hood"></div>
        <div class="v3-gauge-tach">
          ${buildVintageTachSVG()}
        </div>
        <div class="v3-gauge-speedo">
          ${buildVintageSpeedoSVG()}
          <div class="v3-telltales">
            <span class="v3-lamp on-lights" data-lamp-lights>LGT</span>
            <span class="v3-lamp" data-lamp-nos>NOS</span>
            <span class="v3-lamp" data-lamp-auto>GPS</span>
          </div>
          <div class="v3-speed-readout" data-speed>0</div>
          <div class="v3-odo-box" title="Mechanical Rolling Odometer">
            <span data-odo-main>00018</span><span class="v3-odo-tenths" data-odo-dec>.4</span>
          </div>
          <div class="v3-cluster-gear">
            <span class="v3-gear-gate" data-gear>N</span>
          </div>
        </div>
      </div>

      <!-- Active Vehicle & Drive-By / Flight Badge -->
      <button class="v3-car-badge" type="button" data-car-badge title="Click or Left-Click on road to fire Drive-By Uzi">
        <strong data-car-name>VICE SUPERCAR</strong>
        <span data-car-sub>LMB · UZI DRIVE-BY</span>
      </button>

      <!-- Compact Horizontal Bottom-Right 1–7 Weapon Hotbar & Action Strip -->
      <div class="v3-foot-hud" data-foot-hud>
        <div class="v3-foot-head">
          <span data-foot-wep-lbl>FISTS (MELEE)</span>
          <strong data-foot-ko>0 KO</strong>
        </div>
        <div class="v3-weapon-bar" data-weapon-bar>
          ${WEAPONS.map((w, i) => `
            <button class="v3-wep-slot${i === 0 ? ' active' : ''}" type="button" data-wep="${w.id}" title="${w.label} (${w.key})">
              <span class="v3-wep-k">${w.key}</span>
              <span class="v3-wep-name">${w.name}</span>
            </button>
          `).join('')}
        </div>
        <div class="v3-foot-acts">
          <button class="v3-combat-btn" type="button" data-punch-btn>Punch [LMB]</button>
          <button class="v3-combat-btn kick" type="button" data-kick-btn>Kick [K]</button>
          <button class="v3-foot-car-btn" type="button" data-foot-car-btn>Steal / Car [F]</button>
        </div>
      </div>

      <div class="v3-car-prompt" data-car-prompt>Press F · Enter Vehicle</div>

      <div class="v3-showroom-bar" data-sr-bar>
        <div class="v3-sr-thumb"><img src="" alt="" data-sr-thumb referrerpolicy="no-referrer"></div>
        <div class="v3-sr-meta">
          <span class="v3-sr-sub" data-sr-sub></span>
          <span class="v3-sr-title" data-sr-title></span>
        </div>
        <div class="v3-sr-acts">
          <button class="v3-btn-ghost" type="button" data-sr-preview>Inspect · Enter</button>
          <a class="v3-btn-primary" href="#" data-sr-open>Open Case Study</a>
        </div>
      </div>

      <div class="v3-dock-wrap" data-dock-wrap>
        <div class="v3-auto-bar" data-auto-bar>
          <span data-auto-text>GPS Auto-Driving...</span>
          <button class="v3-auto-cancel" type="button" data-auto-cancel>Cancel</button>
        </div>
        <button class="v3-dock-toggle" type="button" data-dock-toggle>▾ Hide Controls</button>
        <div class="v3-dock">
          <div class="v3-route-row" data-waypoints>
            ${WAYPOINTS.map((w, i) => `<button class="v3-wp${i === 0 ? ' active' : ''}" type="button" data-wp="${w.id}">${w.label}</button>`).join('')}
          </div>
          <div class="v3-track"><div class="v3-track-fill" data-track-fill></div></div>
          <div class="v3-ctrl-row">
            <div class="v3-swatches">
              <span class="v3-sw-label">Finish</span>
              ${PAINTS.map((p, i) => `<button class="v3-swatch${i === 0 ? ' active' : ''}" type="button" data-paint="${i}" title="${p.name}" style="background:${p.swatch}"></button>`).join('')}
            </div>
            <div class="v3-keys-hint" data-keys-hint>WASD Drive · Mouse Hover Look · R Radio · T/Y Time &amp; Weather · F Exit Car</div>
            <div class="v3-tools">
              <button class="v3-tool-btn" type="button" data-veh-btn>Exit Car [F]</button>
              <button class="v3-tool-btn" type="button" data-map-btn>Map [G]</button>
              <button class="v3-tool-btn" type="button" data-cam>Cam: Chase</button>
              <button class="v3-tool-btn on" type="button" data-lights>Lights</button>
              <button class="v3-tool-btn" type="button" data-audio>Audio: Off</button>
            </div>
          </div>
        </div>
      </div>

      <div class="v3-touch" data-touch>
        <div class="v3-tgroup">
          <button class="v3-tbtn" type="button" data-hold="left">◀</button>
          <button class="v3-tbtn" type="button" data-hold="right">▶</button>
        </div>
        <div class="v3-tgroup">
          <button class="v3-tbtn" type="button" data-touch-veh>CAR</button>
          <button class="v3-tbtn" type="button" data-hold="down" data-touch-brk>BRK</button>
          <button class="v3-tbtn wide" type="button" data-hold="up" data-touch-go>DRIVE</button>
          <button class="v3-tbtn" type="button" data-hold="nitro" data-touch-act>NOS</button>
        </div>
      </div>

      <div class="v3-ov" data-start-ov>
        <div class="v3-start">
          <div class="v3-start-k">Akshat Singh · Interactive 3D Open World</div>
          <h2>Vice City Ocean Drive</h2>
          <p>Explore a massive 6×10 Vice City open world featuring Starfish Island, Vice Key Resort, Prawn Island Film Studios, Little Haiti, Vice Port Docks, South Marina &amp; Int’l Airport. Pull up to 5 Art Deco Showcase Cinemas, collect 40 Piles of Cash &amp; 10 Weapon Pickups, or hop out [F] to hijack ANY NPC car and unleash 7 Weapons [1–7]!</p>
          <button class="v3-start-btn" type="button" data-begin>Start Exploring</button>
          <div class="v3-start-keys">WASD Move · F Exit / Steal NPC Car · 1–7 Weapons · Click Fire / Drive-By · P Projects · R Radio · G Map</div>
        </div>
      </div>

      <!-- Interactive Full-Screen Vice City GPS Map Modal -->
      <div class="v3-ov" data-fullmap-ov hidden>
        <div class="v3-fullmap">
          <div class="v3-fullmap-canvas-wrap">
            <canvas width="520" height="520" data-fullmap-canvas></canvas>
            <div class="v3-fullmap-tip">Click anywhere on the map to set GPS Auto-Drive destination</div>
          </div>
          <div class="v3-fullmap-side">
            <div>
              <div class="v3-card-k">Vice City GPS Navigation</div>
              <h3>City Map</h3>
              <div class="v3-fullmap-list" data-fullmap-list style="margin-top:12px;">
                ${WAYPOINTS.filter((w) => w.id !== 'start').map((w) => `
                  <div class="v3-fm-row">
                    <button class="v3-fm-btn" type="button" data-fm-wp="${w.id}" title="Auto-Drive GPS route">
                      <div>
                        <div class="v3-fm-title">${w.label}</div>
                        <div class="v3-fm-sub">${w.zone}</div>
                      </div>
                      <span class="v3-fm-dist" data-fm-dist="${w.id}">--m</span>
                    </button>
                    <button class="v3-fm-tp" type="button" data-fm-tp="${w.id}" title="Fast Travel directly here">Go</button>
                  </div>
                `).join('')}
              </div>
            </div>
            <div>
              <div class="v3-fm-legend">
                <span>● Projects (01–05)</span>
                <span>💵 Piles of Cash</span>
                <span>◆ Weapon Pickups</span>
                <span>🚗 Parked Vehicles</span>
              </div>
              <div style="margin-top:12px; display:flex; justify-content:flex-end;">
                <button class="v3-card-close" type="button" data-fullmap-close>Close Map [G]</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Vice City Projects Mission Hub Modal ([P] Button) -->
      <div class="v3-ov" data-proj-hub-ov hidden>
        <div class="v3-proj-hub">
          <div class="v3-ph-head">
            <div>
              <div class="v3-card-k">Vice City Showcase Cinemas · 5 Featured Projects</div>
              <h3>Projects Mission Hub</h3>
            </div>
            <button class="v3-card-close" type="button" data-proj-hub-close>Close [P]</button>
          </div>
          <div class="v3-ph-grid">
            ${[...SHOWROOMS, CONTACT_SHOWROOM].map((sr) => `
              <div class="v3-ph-card" style="--card-col:${sr.accentHex}">
                <div class="v3-ph-img">
                  <img src="${sr.img}" alt="${sr.title}" referrerpolicy="no-referrer">
                  <span class="v3-ph-badge" data-ph-badge="${sr.id}">${sr.id === 'contact' ? '★ CONTACT' : `PROJECT ${sr.num}`}</span>
                  <span class="v3-ph-dist" data-ph-dist="${sr.id}">--m</span>
                </div>
                <div class="v3-ph-body">
                  <div class="v3-ph-dist-name">${sr.district}</div>
                  <div class="v3-ph-title">${sr.title}</div>
                  <div class="v3-ph-stat">${sr.stat}</div>
                  <div class="v3-ph-acts">
                    <button class="v3-ph-btn" type="button" data-ph-drive="${sr.id}">Auto-Drive</button>
                    <button class="v3-ph-btn go" type="button" data-ph-tp="${sr.id}">Warp</button>
                    <button class="v3-ph-btn open" type="button" data-ph-inspect="${sr.id}">Inspect</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- GTA 5 Inspired Vice Carnival Pier Mini-Games Launcher Modal ([B] Button) -->
      <div class="v3-ov" data-mg-ov hidden>
        <div class="v3-mg-modal">
          <div class="v3-ph-head">
            <div>
              <div class="v3-card-k">Vice Carnival Pier · Oceanfront Activities &amp; Challenges</div>
              <h3>Carnival Pier Mini-Games</h3>
            </div>
            <button class="v3-card-close" type="button" data-mg-close>Close [B]</button>
          </div>
          <div class="v3-mg-grid">
            <div class="v3-mg-card" style="--mg-col:#FF2E88">
              <div>
                <div class="v3-mg-tag">01 · Carnival Pier Pavilion</div>
                <h4>Pier Shooting Gallery</h4>
                <p>Step up to the oceanfront boardwalk gallery and blast floating neon carnival targets over the Atlantic in 30s.</p>
              </div>
              <div>
                <div class="v3-mg-prize">Gold Prize: $1,500</div>
                <button class="v3-mg-play" type="button" data-mg-start="range" style="margin-top:8px;">Play Gallery</button>
              </div>
            </div>
            <div class="v3-mg-card" style="--mg-col:#21E6D1">
              <div>
                <div class="v3-mg-tag">02 · Pier-to-Peak Challenge</div>
                <h4>Mountain Hillclimb</h4>
                <p>Launch from Vice Carnival Pier’s tour desk straight onto the Mount Vice 66m switchback highway through 10 neon gates.</p>
              </div>
              <div>
                <div class="v3-mg-prize">Gold Trophy: $2,500</div>
                <button class="v3-mg-play" type="button" data-mg-start="hillclimb" style="margin-top:8px;">Start Race</button>
              </div>
            </div>
            <div class="v3-mg-card" style="--mg-col:#FFD36B">
              <div>
                <div class="v3-mg-tag">03 · Carnival Pier Stunt Deck</div>
                <h4>Pier Sky-Ring Flight</h4>
                <p>Take off above the glowing Carnival Pier Ferris Wheel in the Learjet 86 through 8 golden coastal &amp; mountain rings.</p>
              </div>
              <div>
                <div class="v3-mg-prize">Ace Pilot Bonus: $3,000</div>
                <button class="v3-mg-play" type="button" data-mg-start="skyring" style="margin-top:8px;">Launch Jet</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="v3-ov" data-modal hidden>
        <div class="v3-card">
          <div class="v3-card-img"><img src="" alt="" data-m-img referrerpolicy="no-referrer"></div>
          <div class="v3-card-body">
            <div>
              <div class="v3-card-k" data-m-k></div>
              <h3 data-m-title></h3>
              <p data-m-desc></p>
              <div class="v3-card-stat" data-m-stat></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div class="v3-card-acts">
                <a class="v3-btn-primary" href="#" data-m-open>Open Full Case Study</a>
                <button class="v3-card-close" type="button" data-m-close>Resume Game</button>
              </div>
              <div class="v3-card-nav">
                <button class="v3-card-nav-btn" type="button" data-m-prev>← Prev</button>
                <button class="v3-card-nav-btn drive" type="button" data-m-drive-next>Auto-Drive Next</button>
                <button class="v3-card-nav-btn" type="button" data-m-next>Next →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(stage);
    this.el = {
      stage,
      mount: stage.querySelector('[data-mount]'),
      crosshair: stage.querySelector('[data-crosshair]'),
      uiCursor: stage.querySelector('[data-ui-cursor]'),
      lockTip: stage.querySelector('[data-lock-tip]'),
      gtaWepPill: stage.querySelector('[data-gta-wep-pill]'),
      zone: stage.querySelector('[data-zone]'),
      progress: stage.querySelector('[data-progress]'),
      radioDeck: stage.querySelector('[data-radio-deck]'),
      radVol: stage.querySelector('[data-rad-vol]'),
      radTune: stage.querySelector('[data-rad-tune]'),
      radLcd: stage.querySelector('[data-rad-lcd]'),
      radF: stage.querySelector('[data-rad-f]'),
      radN: stage.querySelector('[data-rad-n]'),
      radNd: stage.querySelector('[data-rad-nd]'),
      radPres: Array.from(stage.querySelectorAll('[data-rad-pre]')),
      projPins: stage.querySelector('[data-proj-pins]'),
      projPinBtns: Array.from(stage.querySelectorAll('[data-proj-pin]')),
      projBtn: stage.querySelector('[data-proj-btn]'),
      timeBtn: stage.querySelector('[data-time-btn]'),
      weatherBtn: stage.querySelector('[data-weather-btn]'),
      cluster: stage.querySelector('[data-cluster]'),
      speed: stage.querySelector('[data-speed]'),
      gear: stage.querySelector('[data-gear]'),
      needle: stage.querySelector('[data-needle]'),
      tachNeedle: stage.querySelector('[data-tach-needle]'),
      rpmArc: stage.querySelector('[data-rpm-arc]'),
      odoMain: stage.querySelector('[data-odo-main]'),
      odoDec: stage.querySelector('[data-odo-dec]'),
      lampLights: stage.querySelector('[data-lamp-lights]'),
      lampNos: stage.querySelector('[data-lamp-nos]'),
      lampAuto: stage.querySelector('[data-lamp-auto]'),
      carBadge: stage.querySelector('[data-car-badge]'),
      carName: stage.querySelector('[data-car-name]'),
      carSub: stage.querySelector('[data-car-sub]'),
      footHud: stage.querySelector('[data-foot-hud]'),
      footWepLbl: stage.querySelector('[data-foot-wep-lbl]'),
      footKo: stage.querySelector('[data-foot-ko]'),
      wepBtns: Array.from(stage.querySelectorAll('[data-wep]')),
      punchBtn: stage.querySelector('[data-punch-btn]'),
      kickBtn: stage.querySelector('[data-kick-btn]'),
      footCarBtn: stage.querySelector('[data-foot-car-btn]'),
      carPrompt: stage.querySelector('[data-car-prompt]'),
      navBar: stage.querySelector('[data-nav-bar]'),
      navArrow: stage.querySelector('[data-nav-arrow]'),
      navDir: stage.querySelector('[data-nav-dir]'),
      navSub: stage.querySelector('[data-nav-sub]'),
      navTp: stage.querySelector('[data-nav-tp]'),
      navCancel: stage.querySelector('[data-nav-cancel]'),
      wanted: stage.querySelector('[data-wanted]'),
      stars: Array.from(stage.querySelectorAll('[data-s]')),
      cash: stage.querySelector('[data-cash]'),
      hpFill: stage.querySelector('[data-hp-fill]'),
      hpVal: stage.querySelector('[data-hp-val]'),
      armFill: stage.querySelector('[data-arm-fill]'),
      armVal: stage.querySelector('[data-arm-val]'),
      dmgFlash: stage.querySelector('[data-dmg-flash]'),
      wasted: stage.querySelector('[data-wasted]'),
      dlg: stage.querySelector('[data-dlg]'),
      dlgName: stage.querySelector('[data-dlg-name]'),
      dlgRole: stage.querySelector('[data-dlg-role]'),
      dlgLine: stage.querySelector('[data-dlg-line]'),
      dlgClose: stage.querySelector('[data-dlg-close]'),
      dlgChoices: Array.from(stage.querySelectorAll('[data-dlg-choice]')),
      rideBar: stage.querySelector('[data-ride-bar]'),
      rideTitle: stage.querySelector('[data-ride-title]'),
      rideSub: stage.querySelector('[data-ride-sub]'),
      rideExit: stage.querySelector('[data-ride-exit]'),
      mgBtn: stage.querySelector('[data-mg-btn]'),
      mgOv: stage.querySelector('[data-mg-ov]'),
      mgClose: stage.querySelector('[data-mg-close]'),
      mgStarts: Array.from(stage.querySelectorAll('[data-mg-start]')),
      mgHud: stage.querySelector('[data-mg-hud]'),
      mgName: stage.querySelector('[data-mg-name]'),
      mgStat: stage.querySelector('[data-mg-stat]'),
      mgTimer: stage.querySelector('[data-mg-timer]'),
      mgAbort: stage.querySelector('[data-mg-abort]'),
      combo: stage.querySelector('[data-combo]'),
      radarWrap: stage.querySelector('[data-radar-wrap]'),
      radarCanvas: stage.querySelector('[data-radar]'),
      radarStreet: stage.querySelector('[data-radar-street]'),
      radarInfo: stage.querySelector('[data-radar-info]'),
      autoBar: stage.querySelector('[data-auto-bar]'),
      autoText: stage.querySelector('[data-auto-text]'),
      autoCancel: stage.querySelector('[data-auto-cancel]'),
      fullMapOv: stage.querySelector('[data-fullmap-ov]'),
      fullMapCanvas: stage.querySelector('[data-fullmap-canvas]'),
      fullMapClose: stage.querySelector('[data-fullmap-close]'),
      fmBtns: Array.from(stage.querySelectorAll('[data-fm-wp]')),
      fmTpBtns: Array.from(stage.querySelectorAll('[data-fm-tp]')),
      fmDists: Array.from(stage.querySelectorAll('[data-fm-dist]')),
      projHubOv: stage.querySelector('[data-proj-hub-ov]'),
      projHubClose: stage.querySelector('[data-proj-hub-close]'),
      phDriveBtns: Array.from(stage.querySelectorAll('[data-ph-drive]')),
      phTpBtns: Array.from(stage.querySelectorAll('[data-ph-tp]')),
      phInspectBtns: Array.from(stage.querySelectorAll('[data-ph-inspect]')),
      phDists: Array.from(stage.querySelectorAll('[data-ph-dist]')),
      phBadges: Array.from(stage.querySelectorAll('[data-ph-badge]')),
      vehBtn: stage.querySelector('[data-veh-btn]'),
      keysHint: stage.querySelector('[data-keys-hint]'),
      touchVeh: stage.querySelector('[data-touch-veh]'),
      touchGo: stage.querySelector('[data-touch-go]'),
      touchAct: stage.querySelector('[data-touch-act]'),
      mapBtn: stage.querySelector('[data-map-btn]'),
      srBar: stage.querySelector('[data-sr-bar]'),
      srThumb: stage.querySelector('[data-sr-thumb]'),
      srSub: stage.querySelector('[data-sr-sub]'),
      srTitle: stage.querySelector('[data-sr-title]'),
      srPreview: stage.querySelector('[data-sr-preview]'),
      srOpen: stage.querySelector('[data-sr-open]'),
      dockWrap: stage.querySelector('[data-dock-wrap]'),
      dockToggle: stage.querySelector('[data-dock-toggle]'),
      trackFill: stage.querySelector('[data-track-fill]'),
      wpBtns: Array.from(stage.querySelectorAll('[data-wp]')),
      paintBtns: Array.from(stage.querySelectorAll('[data-paint]')),
      camBtn: stage.querySelector('[data-cam]'),
      lightsBtn: stage.querySelector('[data-lights]'),
      audioBtn: stage.querySelector('[data-audio]'),
      startOv: stage.querySelector('[data-start-ov]'),
      beginBtn: stage.querySelector('[data-begin]'),
      closeBtn: stage.querySelector('[data-close]'),
      modal: stage.querySelector('[data-modal]'),
      mImg: stage.querySelector('[data-m-img]'),
      mK: stage.querySelector('[data-m-k]'),
      mTitle: stage.querySelector('[data-m-title]'),
      mDesc: stage.querySelector('[data-m-desc]'),
      mStat: stage.querySelector('[data-m-stat]'),
      mOpen: stage.querySelector('[data-m-open]'),
      mClose: stage.querySelector('[data-m-close]'),
      mPrev: stage.querySelector('[data-m-prev]'),
      mDriveNext: stage.querySelector('[data-m-drive-next]'),
      mNext: stage.querySelector('[data-m-next]')
    };
    this.radarCtx = this.el.radarCanvas.getContext('2d');
    this.fullMapCtx = this.el.fullMapCanvas.getContext('2d');
  }

  initWebGL() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6e546d);
    this.scene.fog = new THREE.FogExp2(0x6e546d, 0.00145);

    const w = window.innerWidth;
    const h = window.innerHeight;
    // Higher near plane (0.6) improves 24-bit depth-buffer precision; far 2200 keeps 1750m sky dome unclipped across the 6x10 map!
    this.camera = new THREE.PerspectiveCamera(56, w / h, 0.6, 2200);
    this.camera.position.set(7.5, 2.7, 15.5);

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: !this.isSoftwareGl,
        powerPreference: 'high-performance'
      });
    } catch (_) {
      this.renderer = new THREE.WebGLRenderer({ antialias: false });
      this.isSoftwareGl = true;
    }
    const dpr = this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.el.mount.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.stopLoop(); });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => { if (this.isOpen) this.startLoop(); });

    // Golden-Hour Sunset PMREM Environment Map (vivid sky/sun/city reflections across all glass, paint & road)
    try {
      this.scene.environment = createGoldenHourEnvironment(this.renderer);
      this.scene.environmentIntensity = 1.15;
    } catch (err) {
      console.warn('[ViceCity3D] PMREM environment fallback:', err);
    }

    // AAA Post-Processing Pipeline: RenderPass -> Bloom -> ACES OutputPass -> Filmic Color Grade & Vignette!
    this.composer = null;
    this.bloomPass = null;
    if (!this.isSoftwareGl) {
      try {
        const isWebGL2 = this.renderer.capabilities.isWebGL2;
        const rt = new THREE.WebGLRenderTarget(Math.round(w * dpr), Math.round(h * dpr), {
          type: THREE.HalfFloatType,
          samples: isWebGL2 && dpr < 1.5 ? 2 : 0
        });
        this.composer = new EffectComposer(this.renderer, rt);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(
          new THREE.Vector2(Math.max(1, Math.floor(w * 0.5)), Math.max(1, Math.floor(h * 0.5))),
          0.26, 0.36, 1.18
        );
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(new OutputPass());
        this.composer.addPass(new ShaderPass(ViceAAAColorGradeShader));
      } catch (err) {
        console.warn('[ViceCity3D] Post-processing composer fallback to direct render:', err);
        this.composer = null;
        this.bloomPass = null;
      }
    }

    const maxAniso = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 16);
    this.buildLighting();
    this.buildOpenWorld(maxAniso);

    this.car = createSupercar(this.isSoftwareGl);
    this.car.isHero = true;
    this.car.root.position.set(this.carState.x, 0, this.carState.z);
    const carSh = new THREE.Mesh(new THREE.PlaneGeometry(2.95, 5.75), getContactShadowMat());
    carSh.rotation.x = -Math.PI / 2;
    carSh.position.y = 0.035;
    this.car.root.add(carSh);
    this.scene.add(this.car.root);

    // Active drivable vehicle tracker + persistent parked vehicles for GTA carjacking!
    this.heroVehicle = {
      isHero: true,
      label: 'VICE SUPERCAR',
      mesh: this.car.root,
      rig: this.car,
      topSpeed: 52,
      nitroSpeed: 74,
      accel: 23,
      grip: 1.0,
      x: this.carState.x,
      y: 0,
      z: this.carState.z,
      yaw: this.carState.yaw
    };
    this.activeVehicle = this.heroVehicle;
    this.parkedVehicles = [];
    this.nearbyVehicleTarget = null;

    // Playable 1986 Vice City Protagonist (steps out on 'F' to roam, fight, steal cars & fly planes!)
    this.player = createPlayerCharacter();
    this.scene.add(this.player.root);

    // Vice City Neon Parachute Canopy (automatically deploys when bailing out of an airplane mid-air!)
    const paraGrp = new THREE.Group();
    const paraCanopyMat = new THREE.MeshStandardMaterial({ color: 0xff2e88, roughness: 0.65, side: THREE.DoubleSide });
    const paraStripeMat = new THREE.MeshStandardMaterial({ color: 0x21e6d1, roughness: 0.65, side: THREE.DoubleSide });
    const paraCanopy = new THREE.Mesh(new THREE.SphereGeometry(2.35, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), paraCanopyMat);
    paraCanopy.scale.set(1.22, 0.56, 0.88);
    paraCanopy.position.y = 3.85;
    paraGrp.add(paraCanopy);
    const paraCenterStripe = new THREE.Mesh(new THREE.SphereGeometry(2.37, 16, 10, Math.PI * 0.35, Math.PI * 0.30, 0, Math.PI * 0.48), paraStripeMat);
    paraCenterStripe.scale.set(1.22, 0.56, 0.88);
    paraCenterStripe.position.y = 3.85;
    paraGrp.add(paraCenterStripe);
    const cordMat = new THREE.MeshBasicMaterial({ color: 0xe8e4f0 });
    for (const sx of [-1.85, -0.75, 0.75, 1.85]) {
      for (const sz of [-0.75, 0.75]) {
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.55, 4), cordMat);
        cord.position.set(sx * 0.52, 2.55, sz * 0.45);
        cord.rotation.z = Math.atan2(sx, 2.4) * 0.72;
        cord.rotation.x = -Math.atan2(sz, 2.4) * 0.65;
        paraGrp.add(cord);
      }
    }
    paraGrp.visible = false;
    this.player.root.add(paraGrp);
    this.parachuteMesh = paraGrp;

    // 3D GPS Waypoint Sky Beam & Ground Ring (visible whenever a destination is active)
    const beaconGrp = new THREE.Group();
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x21e6d1, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 2.2, 62, 14, 1, true), beamMat);
    beam.position.y = 31;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 3.2, 28),
      new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    beaconGrp.add(beam, ring);
    beaconGrp.visible = false;
    this.scene.add(beaconGrp);
    this.navBeacon = { group: beaconGrp, beam, ring };

    // 3D Floating Overhead GPS Pointer Arrow (hovering above car or player during GPS navigation)
    const arrowGrp = new THREE.Group();
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0x21e6d1, emissive: 0x21e6d1, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.3
    });
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 4), arrowMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.55;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.72), arrowMat);
    shaft.position.z = 0.18;
    arrowGrp.add(tip, shaft);
    arrowGrp.visible = false;
    this.scene.add(arrowGrp);
    this.navArrow = arrowGrp;

    // Lightweight 64px Dynamic CubeCamera reflections on Player Supercar (updates only on movement!)
    this.cubeCamera = null;
    this.cubeRT = null;
    if (!this.isSoftwareGl) {
      try {
        this.cubeRT = new THREE.WebGLCubeRenderTarget(64, {
          generateMipmaps: true,
          minFilter: THREE.LinearMipmapLinearFilter
        });
        this.cubeCamera = new THREE.CubeCamera(0.6, 1050, this.cubeRT);
        this.scene.add(this.cubeCamera);
        this.car.setDynamicEnvMap(this.cubeRT.texture);
      } catch (err) {
        console.warn('[ViceCity3D] CubeCamera fallback to PMREM:', err);
        this.cubeCamera = null;
        this.cubeRT = null;
      }
    }

    this.buildRainSystem();
    if (!this.isSoftwareGl) {
      try { this.renderer.compile(this.scene, this.camera); } catch (_) {}
    }
    this.clock = new THREE.Clock();
  }

  buildLighting() {
    // Warm sunlit sky + coastal terracotta ground bounce (tighter ambient for deeper AAA shadow contrast)
    this.hemiLight = new THREE.HemisphereLight(0x88b8f0, 0x5c423e, 0.78);
    this.scene.add(this.hemiLight);

    // Golden-Hour Sun Directional Light aligned with SUN_DIR (Crisp 2048x2048 PCFSoft Shadows on GPU!)
    this.sunLight = new THREE.DirectionalLight(0xffce8f, 2.55);
    this.sunLight.position.copy(SUN_DIR).multiplyScalar(85);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 2048;
      this.sunLight.shadow.mapSize.height = 2048;
      this.sunLight.shadow.camera.near = 4;
      this.sunLight.shadow.camera.far = 215;
      const d = 64;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.00035;
      this.sunLight.shadow.normalBias = 0.022;
    }
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Cool sky fill light from the west so shaded building faces retain crisp architectural relief
    this.fillLight = new THREE.DirectionalLight(0x7caef0, 0.48);
    this.fillLight.position.set(-55, 32, 40);
    this.scene.add(this.fillLight);

    // Subtle Miami sunset coral-magenta rim light to sculpt car curves & characters
    this.rimLight = new THREE.DirectionalLight(0xff84a8, 0.38);
    this.rimLight.position.set(-42, 16, -64);
    this.scene.add(this.rimLight);
  }

  buildRainSystem() {
    // Single-draw-call GPU 3D Falling Rain Streaks (420 drops around active player/car)
    const count = 420;
    const positions = new Float32Array(count * 2 * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const rx = (Math.random() - 0.5) * 58;
      const ry = Math.random() * 28;
      const rz = (Math.random() - 0.5) * 58;
      const idx = i * 6;
      positions[idx] = rx; positions[idx + 1] = ry; positions[idx + 2] = rz;
      positions[idx + 3] = rx - 0.16; positions[idx + 4] = ry - 1.15; positions[idx + 5] = rz - 0.08;
      speeds[i] = 24 + Math.random() * 14;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xb8dcff, transparent: true, opacity: 0.42, depthWrite: false });
    const lines = new THREE.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.visible = false;
    this.scene.add(lines);
    this.rainLines = { mesh: lines, positions, speeds, count };
  }

  addBoxCollider(minX, maxX, minZ, maxZ) {
    this.boxColliders.push({ minX, maxX, minZ, maxZ });
  }

  addCircleCollider(x, z, r) {
    this.circleColliders.push({ x, z, r });
  }

  buildOpenWorld(maxAniso) {
    const texLoader = new THREE.TextureLoader();

    // 1. Sky Dome (follows camera every frame) & Reflective Atlantic Ocean
    this.skyDome = createViceSkyDome();
    this.scene.add(this.skyDome);

    this.ocean = createAtlanticOcean();
    this.scene.add(this.ocean);

    // 2. NON-OVERLAPPING ZERO-Z-FIGHTING ROAD NETWORK (y = 0.0)
    const interTex = makeIntersectionTexture(maxAniso);
    const interMat = new THREE.MeshStandardMaterial({
      map: interTex, roughness: 0.72, metalness: 0.06, envMapIntensity: 0.55
    });

    const nsTex = makeAsphaltTextures(maxAniso, 8);
    const nsRoadMat = new THREE.MeshStandardMaterial({
      map: nsTex.map, roughnessMap: nsTex.roughnessMap, normalMap: nsTex.normalMap,
      normalScale: new THREE.Vector2(0.36, 0.36), roughness: 0.74, metalness: 0.06, envMapIntensity: 0.72
    });

    const ewTex = makeAsphaltTextures(maxAniso, 4);
    const ewRoadMat = new THREE.MeshStandardMaterial({
      map: ewTex.map, roughnessMap: ewTex.roughnessMap, normalMap: ewTex.normalMap,
      normalScale: new THREE.Vector2(0.36, 0.36), roughness: 0.74, metalness: 0.06, envMapIntensity: 0.72
    });

    // 2a. Clean Intersection Squares (exact 16.8m x 16.8m at every Avenue x Cross-Street)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x262934, metalness: 0.78, roughness: 0.28 });
    this.trafficSignals = [];
    const sigRedMat = new THREE.MeshStandardMaterial({ color: 0xff2842, emissive: 0xff2842, emissiveIntensity: 1.6 });
    const sigYelMat = new THREE.MeshStandardMaterial({ color: 0xffc832, emissive: 0xffc832, emissiveIntensity: 1.5 });
    const sigGrnMat = new THREE.MeshStandardMaterial({ color: 0x22e69a, emissive: 0x22e69a, emissiveIntensity: 1.6 });
    const sigOffMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.6 });

    // Instanced intersection pads + instanced traffic gantries (108 draw calls -> 2 InstancedMeshes!)
    const interCount = AVENUES.length * CROSS_STREETS.length;
    const interGeo = new THREE.PlaneGeometry(ROAD_W, ROAD_W);
    interGeo.rotateX(-Math.PI / 2);
    const interInst = new THREE.InstancedMesh(interGeo, interMat, interCount);
    interInst.receiveShadow = true;

    const tlPostG = new THREE.CylinderGeometry(0.12, 0.16, 6.4, 8); tlPostG.translate(0, 3.2, 0);
    const tlArmG = new THREE.BoxGeometry(6.2, 0.15, 0.15); tlArmG.translate(-3.0, 6.2, 0);
    const tlBoxG = new THREE.BoxGeometry(0.46, 1.32, 0.36); tlBoxG.translate(-3.8, 5.5, 0);
    const tlGantryGeo = mergeGeometries([tlPostG, tlArmG, tlBoxG]);
    const tlGantryInst = new THREE.InstancedMesh(tlGantryGeo, poleMat, interCount);
    const bulbGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const iMat = new THREE.Matrix4();
    let interIdx = 0;

    AVENUES.forEach((ax) => {
      CROSS_STREETS.forEach((cz, ci) => {
        iMat.makeTranslation(ax, 0.0, cz);
        interInst.setMatrixAt(interIdx, iMat);

        const px = ax + ROAD_H + 1.0;
        const pz = cz - ROAD_H - 1.0;
        iMat.makeTranslation(px, 0.16, pz);
        tlGantryInst.setMatrixAt(interIdx, iMat);
        interIdx++;

        const lR = new THREE.Mesh(bulbGeo, sigOffMat); lR.position.set(px - 3.8, 6.06, pz + 0.19); this.scene.add(lR);
        const lY = new THREE.Mesh(bulbGeo, sigOffMat); lY.position.set(px - 3.8, 5.66, pz + 0.19); this.scene.add(lY);
        const lG = new THREE.Mesh(bulbGeo, sigOffMat); lG.position.set(px - 3.8, 5.26, pz + 0.19); this.scene.add(lG);
        this.addCircleCollider(px, pz, 0.32);
        this.trafficSignals.push({ lR, lY, lG, phase: (ci % 2) * 5.0 });
      });
    });
    interInst.instanceMatrix.needsUpdate = true;
    tlGantryInst.instanceMatrix.needsUpdate = true;
    this.scene.add(interInst, tlGantryInst);
    this.sigMats = { red: sigRedMat, yel: sigYelMat, grn: sigGrnMat, off: sigOffMat };

    // 2b. Non-Overlapping NS Avenue Road Segments strictly between intersections (Z = +214 to -814)
    AVENUES.forEach((ax) => {
      // South stub past CROSS_STREETS[0] = 180 (Z = 188.4 to 214)
      const stubS = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 25.6), nsRoadMat);
      stubS.rotation.x = -Math.PI / 2;
      stubS.position.set(ax, 0.0, CROSS_STREETS[0] + ROAD_H + 12.8);
      stubS.receiveShadow = true;
      this.scene.add(stubS);

      for (let i = 0; i < CROSS_STREETS.length - 1; i++) {
        const zA = CROSS_STREETS[i] - ROAD_H;
        const zB = CROSS_STREETS[i + 1] + ROAD_H;
        const len = zA - zB; // 143.2m
        const seg = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, len), nsRoadMat);
        seg.rotation.x = -Math.PI / 2;
        seg.position.set(ax, 0.0, (zA + zB) * 0.5);
        seg.receiveShadow = true;
        this.scene.add(seg);
      }

      // North stub past CROSS_STREETS[last] = -780 (Z = -788.4 to -814)
      const stubN = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 25.6), nsRoadMat);
      stubN.rotation.x = -Math.PI / 2;
      stubN.position.set(ax, 0.0, CROSS_STREETS[CROSS_STREETS.length - 1] - ROAD_H - 12.8);
      stubN.receiveShadow = true;
      this.scene.add(stubN);
    });

    // 2c. Non-Overlapping EW Cross-Street Segments strictly between Avenues
    CROSS_STREETS.forEach((cz) => {
      for (let i = 0; i < AVENUES.length - 1; i++) {
        const xA = AVENUES[i] - ROAD_H;
        const xB = AVENUES[i + 1] + ROAD_H;
        const len = xA - xB; // 79.2m
        const seg = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, len), ewRoadMat);
        seg.rotation.x = -Math.PI / 2;
        seg.rotation.z = Math.PI / 2;
        seg.position.set((xA + xB) * 0.5, 0.0, cz);
        seg.receiveShadow = true;
        this.scene.add(seg);
      }
    });

    // 3. RAISED CONCRETE SIDEWALKS, LIMESTONE CURBS & LANDSCAPED CITY BLOCKS (y = 0.16)
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: makeSidewalkTexture(maxAniso, 10, 22),
      normalMap: makeSidewalkNormalMap(maxAniso, 10, 22),
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.82,
      metalness: 0.03
    });
    const grassMat = new THREE.MeshStandardMaterial({ map: makeGrassTexture(maxAniso, 5, 10), roughness: 0.92 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xb6aea4, roughness: 0.82 });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d6e3a, roughness: 0.88 });

    // Build raised block islands between every avenue & cross-street (ZERO road overlap!)
    const blockRangesX = [
      { minX: -87.6, maxX: -8.4 },     // Between Ocean Drive & Washington Ave
      { minX: -183.6, maxX: -104.4 },  // Between Washington Ave & Downtown Hwy
      { minX: -279.6, maxX: -200.4 },  // Between Downtown Hwy & West Bayside Blvd
      { minX: -375.6, maxX: -296.4 },  // Between West Bayside Blvd & Little Haiti Ave
      { minX: -471.6, maxX: -392.4 }   // Between Little Haiti Ave & Vice Port Expressway
    ];
    blockRangesX.forEach((bx) => {
      const bw = bx.maxX - bx.minX;
      const cx = (bx.minX + bx.maxX) * 0.5;
      for (let i = 0; i < CROSS_STREETS.length - 1; i++) {
        // Leave Vice Int'l Airport Tarmac open & flat on Z = 28..171 (i === 1, since CROSS_STREETS[0]=340, [1]=180, [2]=20)!
        if (i === 1 && bx.minX > -285) continue;
        const zMax = CROSS_STREETS[i] - ROAD_H;
        const zMin = CROSS_STREETS[i + 1] + ROAD_H;
        const bd = zMax - zMin;
        const cz = (zMax + zMin) * 0.5;
        const block = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.32, bd), sidewalkMat);
        block.position.set(cx, 0.0, cz); // top surface = +0.16m crisp raised curb!
        block.receiveShadow = true;
        this.scene.add(block);

        // Landscaped tropical grass lawn park inset in city courtyards (except Vice Port shipping yards!)
        if (bw > 70 && bw < 85 && bx.minX > -390) {
          const lawn = new THREE.Mesh(new THREE.BoxGeometry(bw - 14, 0.06, bd - 18), grassMat);
          lawn.position.set(cx, 0.16, cz);
          lawn.receiveShadow = true;
          this.scene.add(lawn);
        }
      }
    });

    // West Bay Seawall Promenade along Vice Port Expressway (X = -496.5) so West Ocean edge looks crisp & solid!
    const westProm = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.32, 1506), sidewalkMat);
    westProm.position.set(-493.2, 0.0, -380);
    westProm.receiveShadow = true;
    this.scene.add(westProm);
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.15, 1506), new THREE.MeshStandardMaterial({ color: 0xc8c0b8, roughness: 0.80 }));
    westWall.position.set(-498.0, 0.56, -380);
    this.scene.add(westWall);

    // 3b. VICE CITY INTERNATIONAL AIRPORT (ESCOBAR TERMINAL, JETWAYS, 3 WIDEBODY JETS, VIP LEARJET, PROP PLANE & RUNWAY 09/27)
    const tarmacTex = makeTarmacTexture(maxAniso, 16, 9);
    const tarmacMat = new THREE.MeshStandardMaterial({ map: tarmacTex, roughness: 0.84, metalness: 0.08 });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(271, 0.12, 143), tarmacMat);
    apron.position.set(-144, -0.055, 100);
    apron.receiveShadow = true;
    this.scene.add(apron);

    const rwyStripeMat = new THREE.MeshBasicMaterial({ color: 0xf6eed8 });
    const rwyYellowMat = new THREE.MeshBasicMaterial({ color: 0xffc83b });
    // Main E-W Runway 09/27 centerline dashes at Z = 114 + Taxiway yellow lead-ins
    for (let rx = -264; rx <= -24; rx += 16) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 0.65), rwyStripeMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(rx, 0.02, 114);
      this.scene.add(dash);
    }
    for (const rz of [96, 132]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(256, 0.45), rwyYellowMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(-144, 0.02, rz);
      this.scene.add(edge);
    }
    // Taxiway lead-in lines from Terminal Apron (Z = 76) to Runway 09/27
    for (const tx of [-170, -108, -48]) {
      const tLine = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 34), rwyYellowMat);
      tLine.rotation.x = -Math.PI / 2;
      tLine.position.set(tx, 0.02, 82);
      this.scene.add(tLine);
    }
    for (const endX of [-268, -20]) {
      for (let k = -3; k <= 3; k++) {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.3), rwyStripeMat);
        bar.rotation.x = -Math.PI / 2;
        bar.position.set(endX, 0.02, 114 + k * 4.2);
        this.scene.add(bar);
      }
    }

    // Animated Blinking Runway Edge & PAPI Approach Guidance Lights
    this.rwyLights = [];
    const rwyBulbGeo = new THREE.SphereGeometry(0.28, 10, 8);
    const rwyStandGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.42, 8);
    for (let rx = -264; rx <= -24; rx += 24) {
      for (const rz of [94.8, 133.2]) {
        const isEnd = rx <= -248 || rx >= -40;
        const lMat = new THREE.MeshBasicMaterial({ color: isEnd ? 0x22ff88 : 0xffe48c });
        const bulb = new THREE.Mesh(rwyBulbGeo, lMat);
        bulb.position.set(rx, 0.44, rz);
        const stand = new THREE.Mesh(rwyStandGeo, poleMat);
        stand.position.set(rx, 0.21, rz);
        this.scene.add(stand, bulb);
        this.rwyLights.push({ mesh: bulb, mat: lMat, phase: (rx + 270) * 0.06, isEnd });
      }
    }
    // 4 Red/White PAPI Precision Approach Path Indicator boxes at West Threshold
    for (let p = 0; p < 4; p++) {
      const papiMat = new THREE.MeshBasicMaterial({ color: p < 2 ? 0xff2e4c : 0xffffff });
      const papi = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.55, 0.95), papiMat);
      papi.position.set(-272, 0.35, 100 + p * 2.2);
      this.scene.add(papi);
      this.rwyLights.push({ mesh: papi, mat: papiMat, phase: p * 0.8, isEnd: true });
    }

    // Enterable Multi-Sided Escobar Int'l Glass Airport Terminal + Check-In Hall + Departures Board + Dual Jetways!
    const terminal = createAirportTerminal(maxAniso);
    terminal.position.set(-108, 0, 42);
    this.scene.add(terminal);
    // Segmented open-doorway colliders leaving 12m wide walk-through concourse open at X = [-114..-102] on BOTH -Z (Street) & +Z (Runway)!
    this.addBoxCollider(-142.8, -141.2, 32, 52);    // West wall
    this.addBoxCollider(-74.8, -73.2, 32, 52);      // East wall
    this.addBoxCollider(-142, -114.2, 31.6, 33.2);  // Street-side West facade
    this.addBoxCollider(-101.8, -74, 31.6, 33.2);   // Street-side East facade
    this.addBoxCollider(-142, -114.2, 50.8, 52.4);  // Apron-side West facade
    this.addBoxCollider(-101.8, -74, 50.8, 52.4);   // Apron-side East facade
    this.enterableBuildings.push({
      id: 'airport-terminal', label: "ESCOBAR INT'L TERMINAL", kind: 'airport',
      doorX: -108, doorZ: 30.5, insideX: -108, insideZ: 39.5, insideYaw: Math.PI,
      perkX: -108, perkZ: 42.0, accent: 0x21e6d1, accentHex: '#21E6D1'
    });

    // 2 Parked High-Poly Vice Air Widebody Airliners Docked at Boarding Jetways!
    this.parkedJets = [];
    const parkedJetA = createAirlinerJet('#FF2E88', maxAniso);
    parkedJetA.root.position.set(-127, 0.02, 78);
    parkedJetA.root.rotation.y = Math.PI * 0.04;
    this.scene.add(parkedJetA.root);
    this.parkedJets.push(parkedJetA);
    this.addBoxCollider(-144, -110, 62, 92);

    const parkedJetB = createAirlinerJet('#21E6D1', maxAniso);
    parkedJetB.root.position.set(-88, 0.02, 78);
    parkedJetB.root.rotation.y = -Math.PI * 0.04;
    this.scene.add(parkedJetB.root);
    this.parkedJets.push(parkedJetB);
    this.addBoxCollider(-105, -71, 62, 92);

    // 1 Live Animated Vice Air Widebody Airliner (Takeoff Down Runway -> Climb -> City Scenic Orbit -> Approach & Landing!)
    this.flyingJet = createAirlinerJet('#FF8A2A', maxAniso);
    this.flyingJet.root.position.set(-252, 0.02, 114);
    this.flyingJet.root.rotation.y = -Math.PI / 2;
    this.flyingJet.cycleT = 0;
    this.scene.add(this.flyingJet.root);

    // FLYABLE AIRCRAFT #1: Vice Learjet 86 on East VIP Apron (Walk up & press [F] to fly across Vice City!)
    this.flyablePlanes = [];
    const learjetRig = createPrivateLearjet(0xff2e88, maxAniso);
    learjetRig.root.position.set(-46, 0.02, 78);
    learjetRig.root.rotation.y = Math.PI * 0.5; // Nose pointing West toward taxiway/runway
    this.scene.add(learjetRig.root);
    this.flyablePlanes.push({
      id: 'learjet', label: learjetRig.label || 'VICE LEARJET 86', kind: 'jet',
      rig: learjetRig, root: learjetRig.root,
      x: -46, y: 0.02, z: 78, yaw: Math.PI * 0.5, pitch: 0, roll: 0,
      speed: 0, throttle: 0, gearBlend: 1, resetTimer: 0,
      topSpeed: learjetRig.topSpeed || 98, takeoffSpeed: learjetRig.takeoffSpeed || 24, climbRate: learjetRig.climbRate || 24,
      homeX: -46, homeZ: 78, homeYaw: Math.PI * 0.5, radius: 5.4
    });

    // Enterable Open-Bay Arch Hangar #1 (Walk / Taxi Straight Inside!) + Interior Workshop Equipment
    const hangarMat = new THREE.MeshStandardMaterial({ color: 0xdce0ea, roughness: 0.52, metalness: 0.28 });
    const hangarRoof = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 30, 24, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x2c3852, roughness: 0.45, metalness: 0.4, side: THREE.DoubleSide }));
    hangarRoof.rotation.z = Math.PI / 2;
    hangarRoof.position.set(-232, 10, 52);
    const hangarBack = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 1.2), hangarMat);
    hangarBack.position.set(-232, 5, 40.5);
    const hangarSideL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 24), hangarMat);
    hangarSideL.position.set(-246.5, 5, 52);
    const hangarSideR = hangarSideL.clone();
    hangarSideR.position.x = -217.5;
    const hangarFloor = new THREE.Mesh(new THREE.PlaneGeometry(28.4, 23.4), new THREE.MeshStandardMaterial({ color: 0x424752, roughness: 0.82 }));
    hangarFloor.rotation.x = -Math.PI / 2;
    hangarFloor.position.set(-232, 0.05, 52);
    const hangarLightStrip = new THREE.Mesh(new THREE.BoxGeometry(22, 0.22, 1.2), new THREE.MeshBasicMaterial({ color: 0xfff5e0 }));
    hangarLightStrip.position.set(-232, 11.4, 52);
    // Hangar Workshop Tool Chests & Aviation Fuel Barrels along the back wall
    const toolRedMat = new THREE.MeshStandardMaterial({ color: 0xd82a38, roughness: 0.35, metalness: 0.45 });
    const drumBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e6ab8, roughness: 0.42, metalness: 0.4 });
    const toolChest = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.35, 0.9), toolRedMat);
    toolChest.position.set(-241, 0.72, 42.2);
    const workBench = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.0, 1.05), new THREE.MeshStandardMaterial({ color: 0x5c422c, roughness: 0.7 }));
    workBench.position.set(-232, 0.55, 42.2);
    for (let d = 0; d < 3; d++) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.05, 10), d === 1 ? toolRedMat : drumBlueMat);
      drum.position.set(-222 - d * 0.95, 0.55, 42.4);
      this.scene.add(drum);
    }
    this.scene.add(hangarRoof, hangarBack, hangarSideL, hangarSideR, hangarFloor, hangarLightStrip, toolChest, workBench);
    // U-shaped Hangar #1 colliders leaving entire South +Z bay wide open to walk/taxi inside!
    this.addBoxCollider(-247.5, -216.5, 39.6, 41.4); // Back wall
    this.addBoxCollider(-247.5, -245.7, 40.0, 64.0); // West wall
    this.addBoxCollider(-218.3, -216.5, 40.0, 64.0); // East wall
    this.enterableBuildings.push({
      id: 'airport-hangar', label: 'HANGAR #1 BAY', kind: 'hangar',
      doorX: -232, doorZ: 64.5, insideX: -232, insideZ: 54.0, insideYaw: 0,
      perkX: -232, perkZ: 48.0, accent: 0xffd36b, accentHex: '#FFD36B'
    });

    // FLYABLE AIRCRAFT #2: Vice Stunt Prop Plane Outside Hangar #1 (Press [F] to fly!)
    const propRig = createPropPlane(0xffd36b);
    this.propPlane = propRig;
    propRig.root.position.set(-196, 0.02, 78);
    propRig.root.rotation.y = -Math.PI * 0.5; // Nose pointing East down the tarmac/runway!
    this.scene.add(propRig.root);
    this.flyablePlanes.push({
      id: 'prop', label: propRig.label || 'VICE STUNT PROP', kind: 'prop',
      rig: propRig, root: propRig.root,
      x: -196, y: 0.02, z: 78, yaw: -Math.PI * 0.5, pitch: 0, roll: 0,
      speed: 0, throttle: 0, gearBlend: 1, resetTimer: 0,
      topSpeed: propRig.topSpeed || 68, takeoffSpeed: propRig.takeoffSpeed || 19, climbRate: propRig.climbRate || 18,
      homeX: -196, homeZ: 78, homeYaw: -Math.PI * 0.5, radius: 4.6
    });

    // Airport Ground Support Vehicles (Fuel Tanker Truck & Baggage Tug Carts)
    const fuelTruck = createAirportSupportVehicle('fuel');
    fuelTruck.position.set(-108, 0.02, 85);
    fuelTruck.rotation.y = 0.75;
    const tug1 = createAirportSupportVehicle('tug');
    tug1.position.set(-68, 0.02, 72);
    tug1.rotation.y = -0.45;
    const tug2 = createAirportSupportVehicle('tug');
    tug2.position.set(-156, 0.02, 74);
    tug2.rotation.y = 1.1;
    this.scene.add(fuelTruck, tug1, tug2);
    this.addCircleCollider(-108, 85, 3.6);

    // Detailed Multi-Tier ATC Control Tower with Panoramic Cab, Catwalk & Rotating Radar Dish
    const atcTower = createAirportControlTower();
    atcTower.root.position.set(-178, 0, 46);
    this.scene.add(atcTower.root);
    this.atcRadar = atcTower.radar;
    this.addCircleCollider(-178, 46, 5.2);

    // Animated Airport Orange/White Billowing Windsock near Runway Threshold
    const wsPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.4, 10), poleMat);
    wsPole.position.set(-42, 3.2, 92);
    this.windsock = new THREE.Group();
    this.windsock.position.set(-42, 6.2, 92);
    for (let s = 0; s < 4; s++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38 - s * 0.06, 0.32 - s * 0.06, 0.72, 12, 1, true),
        new THREE.MeshStandardMaterial({ color: s % 2 === 0 ? 0xff5a22 : 0xffffff, side: THREE.DoubleSide, roughness: 0.7 })
      );
      seg.rotation.z = -Math.PI / 2;
      seg.position.x = 0.4 + s * 0.68;
      this.windsock.add(seg);
    }
    this.scene.add(wsPole, this.windsock);

    // LSIA-Style Upgraded Escobar Int'l Airport: FAA Runway 09/27 Markings, Taxiway Blue Edge Lights,
    // Aviation Fuel Farm ("VICE JET-A1"), Security Gatehouse + Perimeter Fence, Hangar #2 & Boarding Airstairs!
    const rwyMarkings = createAirportRunwayMarkings(maxAniso);
    this.scene.add(rwyMarkings.root);

    const fuelFarm = createAirportFuelFarm(maxAniso);
    fuelFarm.position.set(-164, 0, 48);
    this.scene.add(fuelFarm);
    this.addBoxCollider(-174.5, -153.5, 41.5, 54.5);

    const gatehouse = createAirportGatehouse(maxAniso);
    gatehouse.position.set(-58, 0, 29);
    this.scene.add(gatehouse);
    this.addBoxCollider(-60, -56, 27.2, 30.8);

    const hangar2 = createAirportHangarTwo(maxAniso);
    hangar2.position.set(-24, 0, 52);
    this.scene.add(hangar2);
    // U-shaped colliders on Hangar #2 leaving entire South bay open to walk/taxi inside!
    this.addBoxCollider(-37.2, -10.8, 40.2, 42.0);
    this.addBoxCollider(-37.2, -35.6, 40.5, 63.0);
    this.addBoxCollider(-12.4, -10.8, 40.5, 63.0);
    this.enterableBuildings.push({
      id: 'airport-hangar2', label: 'HANGAR #2 MAINTENANCE', kind: 'hangar',
      doorX: -24, doorZ: 63.5, insideX: -24, insideZ: 54.0, insideYaw: 0,
      perkX: -24, perkZ: 48.0, accent: 0x21e6d1, accentHex: '#21E6D1'
    });

    const airstairs = createBoardingAirstairs();
    airstairs.position.set(-55, 0, 74);
    airstairs.rotation.y = 0.55;
    this.scene.add(airstairs);
    this.addCircleCollider(-55, 74, 2.2);

    // GTA 5 Mount Chiliad-Inspired Roadable Mount Vice Range (North of North Point Mall, Z = -1106..-1496!)
    this.mountVice = createMountViceRange(getTerrainHeight, closestMountainRoad, MOUNT_VICE_ROAD, maxAniso);
    this.scene.add(this.mountVice.root);
    // Seamless Asphalt Apron connecting Ocean Drive North straight onto Mount Vice Switchback Trailhead
    const mvConn = new THREE.Mesh(
      new THREE.PlaneGeometry(14.4, 24.0),
      new THREE.MeshStandardMaterial({ color: 0x262933, roughness: 0.84, polygonOffset: true, polygonOffsetFactor: -1 })
    );
    mvConn.rotation.x = -Math.PI / 2;
    mvConn.position.set(0, 0.04, -1108);
    this.scene.add(mvConn);

    // All 3 Glowing In-World GTA 5 Mini-Game Start Pads on VICE CARNIVAL PIER!
    const mgPadDefs = [
      { id: 'range', label: 'PIER SHOOTING GALLERY', x: 91.5, z: -441.8, col: 0xff2e88 },
      { id: 'hillclimb', label: 'PIER-TO-PEAK HILLCLIMB', x: 26.0, z: -430.0, col: 0x21e6d1 },
      { id: 'skyring', label: 'CARNIVAL PIER SKY-RING', x: 102.0, z: -421.0, col: 0xffd36b }
    ];
    mgPadDefs.forEach((pd, idx) => {
      const baseY = 0.24; // Flush on Carnival Pier boardwalk deck
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.65, 2.25, 28),
        new THREE.MeshBasicMaterial({ color: pd.col, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pd.x, baseY, pd.z);
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.8, 3.2, 18, 1, true),
        new THREE.MeshBasicMaterial({ color: pd.col, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
      );
      pillar.position.set(pd.x, baseY + 1.6, pd.z);
      this.scene.add(ring, pillar);
      this.miniGamePads.push({ ...pd, ring, pillar, phase: idx * 1.4 });
    });

    // East Oceanfront Raised Promenade Boardwalk (X = 8.4 to 17.6, clean open gaps at Starfish -300, Carnival Pier -430, Vice Key -620 & Prawn Island -940!)
    const promSegments = [
      { zMin: -291.6, zMax: 374.0 },
      { zMin: -412.0, zMax: -308.4 },
      { zMin: -611.6, zMax: -448.0 },
      { zMin: -931.6, zMax: -628.4 },
      { zMin: -1134.0, zMax: -948.4 }
    ];
    const sandMat = new THREE.MeshStandardMaterial({ map: makeSandTexture(maxAniso), roughness: 0.94 });
    const seawallMat = new THREE.MeshStandardMaterial({ color: 0xd4cbc0, roughness: 0.78 });
    const railMetal = new THREE.MeshStandardMaterial({ color: 0xe6e8ee, metalness: 0.76, roughness: 0.25 });

    promSegments.forEach((seg) => {
      const len = seg.zMax - seg.zMin;
      const cz = (seg.zMax + seg.zMin) * 0.5;
      const prom = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.32, len), sidewalkMat);
      prom.position.set(13.0, 0.0, cz);
      prom.receiveShadow = true;
      this.scene.add(prom);

      // Stone seawall + promenade railing (SOLID COLLIDER so car never falls into beach!)
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.05, len), seawallMat);
      sw.position.set(17.6, 0.52, cz);
      this.scene.add(sw);
      this.addBoxCollider(17.1, 18.2, seg.zMin, seg.zMax);

      // Sloped golden Miami sand beach
      const beach = new THREE.Mesh(new THREE.PlaneGeometry(24, len), sandMat);
      beach.rotation.x = -Math.PI / 2;
      beach.rotation.z = -0.048;
      beach.position.set(28.5, -0.22, cz);
      beach.receiveShadow = true;
      this.scene.add(beach);
    });

    // Instanced Beach Umbrellas & Lounge Chairs along Extended Golden Sand Coastline
    const beachColors = [0xff2e88, 0x21e6d1, 0xff9e32, 0x3b82f6, 0xffd36b];
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xf4f0ea, roughness: 0.72 });
    const umbPositions = [];
    for (let z = 344; z >= -1090; z -= 28) {
      if (Math.abs(z + 300) < 22 || Math.abs(z + 430) < 22 || Math.abs(z + 540) < 16 || Math.abs(z + 620) < 22 || Math.abs(z + 940) < 22) continue;
      umbPositions.push({ x: 23.5 + Math.sin(z) * 1.4, y: -0.15, z, color: beachColors[Math.abs(z) % beachColors.length] });
    }
    const umbPoles = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 6), railMetal, umbPositions.length);
    const umbTops = new THREE.InstancedMesh(
      new THREE.ConeGeometry(1.65, 0.55, 8, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, side: THREE.DoubleSide }),
      umbPositions.length
    );
    const umbBeds = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 0.16, 0.75), chairMat, umbPositions.length);
    const tmpCol = new THREE.Color();
    umbPositions.forEach((up, i) => {
      _dummy.rotation.set(0, 0, 0); _dummy.scale.set(1, 1, 1);
      _dummy.position.set(up.x, up.y + 1.15, up.z); _dummy.updateMatrix(); umbPoles.setMatrixAt(i, _dummy.matrix);
      _dummy.position.set(up.x, up.y + 2.25, up.z); _dummy.updateMatrix(); umbTops.setMatrixAt(i, _dummy.matrix);
      umbTops.setColorAt(i, tmpCol.setHex(up.color));
      _dummy.position.set(up.x, up.y + 0.25, up.z + 1.05); _dummy.updateMatrix(); umbBeds.setMatrixAt(i, _dummy.matrix);
    });
    umbTops.instanceColor.needsUpdate = true;
    this.scene.add(umbPoles, umbTops, umbBeds);

    // 4. STARFISH ISLAND CAUSEWAY BRIDGE (Z = -300, X = 8.4 -> 130) & PALM ISLAND
    const bridgeLen = 122;
    const bridgeCenterX = 8.4 + bridgeLen * 0.5;
    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 0.85, ROAD_W + 0.8), curbMat);
    bridgeDeck.position.set(bridgeCenterX, -0.44, -300);
    this.scene.add(bridgeDeck);

    const bridgeRoad = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, bridgeLen), ewRoadMat);
    bridgeRoad.rotation.x = -Math.PI / 2;
    bridgeRoad.rotation.z = Math.PI / 2;
    bridgeRoad.position.set(bridgeCenterX, 0.01, -300);
    bridgeRoad.receiveShadow = true;
    this.scene.add(bridgeRoad);

    const cyanNeon = new THREE.MeshStandardMaterial({ color: 0x21e6d1, emissive: 0x21e6d1, emissiveIntensity: 1.55 });
    const pinkNeon = new THREE.MeshStandardMaterial({ color: 0xff2e88, emissive: 0xff2e88, emissiveIntensity: 1.55 });
    for (const side of [-1, 1]) {
      const rz = -300 + side * 8.6;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 1.15, 0.52), curbMat);
      rail.position.set(bridgeCenterX, 0.58, rz);
      this.scene.add(rail);
      const railGlow = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 0.14, 0.14), cyanNeon);
      railGlow.position.set(bridgeCenterX, 1.22, rz);
      this.scene.add(railGlow);
      // Solid bridge side barriers!
      this.addBoxCollider(8.4, 130.4, rz - 0.4, rz + 0.4);
    }

    for (let bx = 28; bx <= 116; bx += 22) {
      for (const side of [-1, 1]) {
        const pierCol = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 6.2, 10), curbMat);
        pierCol.position.set(bx, -3.1, -300 + side * 7.8);
        this.scene.add(pierCol);
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.28, 9.6, 8), poleMat);
        pylon.position.set(bx, 4.8, -300 + side * 8.6);
        this.scene.add(pylon);
      }
      const arch = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 17.6), poleMat);
      arch.position.set(bx, 9.5, -300);
      this.scene.add(arch);
      const archNeon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 17.0), pinkNeon);
      archNeon.position.set(bx, 9.18, -300);
      this.scene.add(archNeon);
    }

    // Starfish Island Circular Palm Peninsula (Center X = 152, Z = -300, R = 36m)
    const islandSand = new THREE.Mesh(new THREE.CylinderGeometry(36, 41, 1.4, 44), sandMat);
    islandSand.position.set(152, -0.68, -300);
    this.scene.add(islandSand);

    const islandPlaza = new THREE.Mesh(new THREE.CylinderGeometry(28.5, 29, 0.14, 44), sidewalkMat);
    islandPlaza.position.set(152, -0.05, -300);
    islandPlaza.receiveShadow = true;
    this.scene.add(islandPlaza);

    const islandRing = new THREE.Mesh(new THREE.RingGeometry(25.2, 25.8, 48), cyanNeon);
    islandRing.rotation.x = -Math.PI / 2;
    islandRing.position.set(152, 0.04, -300);
    this.scene.add(islandRing);

    // Starfish Island Red-and-White Lighthouse (SOLID COLLIDER)
    const lh = new THREE.Group();
    const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.2, 18, 16), new THREE.MeshStandardMaterial({ color: 0xf4f0eb, roughness: 0.65 }));
    lhBase.position.y = 9; lh.add(lhBase);
    const lhStripe = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.75, 4.6, 16), new THREE.MeshStandardMaterial({ color: 0xd91c40, roughness: 0.55 }));
    lhStripe.position.y = 10; lh.add(lhStripe);
    const lhLantern = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.6, 14), new THREE.MeshStandardMaterial({ color: 0xfff2c6, emissive: 0xffd578, emissiveIntensity: 1.7 }));
    lhLantern.position.y = 19.2; lh.add(lhLantern);
    const lhRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.4, 14), poleMat);
    lhRoof.position.y = 21.6; lh.add(lhRoof);
    lh.position.set(177, 0, -300);
    this.scene.add(lh);
    this.addCircleCollider(177, -300, 3.4);

    // 4b. SECOND CAUSEWAY BRIDGE & NORTH VICE KEY RESORT ISLAND (Z = -620, X = 8.4 -> 130 -> Island at 156, -620)
    const bridge2Deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 0.85, ROAD_W + 0.8), curbMat);
    bridge2Deck.position.set(bridgeCenterX, -0.44, -620);
    this.scene.add(bridge2Deck);
    const bridge2Road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, bridgeLen), ewRoadMat);
    bridge2Road.rotation.x = -Math.PI / 2;
    bridge2Road.rotation.z = Math.PI / 2;
    bridge2Road.position.set(bridgeCenterX, 0.01, -620);
    bridge2Road.receiveShadow = true;
    this.scene.add(bridge2Road);
    for (const side of [-1, 1]) {
      const rz = -620 + side * 8.6;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 1.15, 0.52), curbMat);
      rail.position.set(bridgeCenterX, 0.58, rz);
      this.scene.add(rail);
      const railGlow = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 0.14, 0.14), pinkNeon);
      railGlow.position.set(bridgeCenterX, 1.22, rz);
      this.scene.add(railGlow);
      this.addBoxCollider(8.4, 130.4, rz - 0.4, rz + 0.4);
    }
    for (let bx = 28; bx <= 116; bx += 22) {
      for (const side of [-1, 1]) {
        const pierCol = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 6.2, 10), curbMat);
        pierCol.position.set(bx, -3.1, -620 + side * 7.8);
        this.scene.add(pierCol);
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.28, 9.6, 8), poleMat);
        pylon.position.set(bx, 4.8, -620 + side * 8.6);
        this.scene.add(pylon);
      }
      const arch = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 17.6), poleMat);
      arch.position.set(bx, 9.5, -620);
      this.scene.add(arch);
      const archNeon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 17.0), cyanNeon);
      archNeon.position.set(bx, 9.18, -620);
      this.scene.add(archNeon);
    }
    const vkSand = new THREE.Mesh(new THREE.CylinderGeometry(38, 43, 1.4, 44), sandMat);
    vkSand.position.set(156, -0.68, -620);
    this.scene.add(vkSand);
    const vkPlaza = new THREE.Mesh(new THREE.CylinderGeometry(30, 30.5, 0.14, 44), sidewalkMat);
    vkPlaza.position.set(156, -0.05, -620);
    vkPlaza.receiveShadow = true;
    this.scene.add(vkPlaza);
    const vkRing = new THREE.Mesh(new THREE.RingGeometry(26.5, 27.2, 48), pinkNeon);
    vkRing.rotation.x = -Math.PI / 2;
    vkRing.position.set(156, 0.04, -620);
    this.scene.add(vkRing);
    // Glowing Vice Key Helipad H + Neon Resort Sign
    const heliPad = new THREE.Mesh(new THREE.RingGeometry(7.2, 8.2, 32), cyanNeon);
    heliPad.rotation.x = -Math.PI / 2;
    heliPad.position.set(162, 0.05, -620);
    this.scene.add(heliPad);
    const hBarL = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 7.6), rwyYellowMat);
    hBarL.rotation.x = -Math.PI / 2; hBarL.position.set(159.4, 0.06, -620);
    const hBarR = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 7.6), rwyYellowMat);
    hBarR.rotation.x = -Math.PI / 2; hBarR.position.set(164.6, 0.06, -620);
    const hBarM = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.1), rwyYellowMat);
    hBarM.rotation.x = -Math.PI / 2; hBarM.position.set(162, 0.06, -620);
    this.scene.add(hBarL, hBarR, hBarM);
    const vkSignTex = makeNeonSignTexture('VICE KEY RESORT', 'NORTH ISLAND HELIPAD & MARINA', '#FF2E88', maxAniso, false);
    const vkSign = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 3.2),
      new THREE.MeshStandardMaterial({ map: vkSignTex, emissive: 0xffffff, emissiveMap: vkSignTex, emissiveIntensity: 0.92, side: THREE.DoubleSide })
    );
    vkSign.position.set(178, 5.2, -620);
    vkSign.rotation.y = -Math.PI / 2;
    this.scene.add(vkSign);

    // 4c. THIRD CAUSEWAY BRIDGE & PRAWN ISLAND FILM STUDIOS (Z = -940, X = 8.4 -> 130 -> Island at 164, -940, R = 42m!)
    const goldNeon = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xffb830, emissiveIntensity: 1.55 });
    const bridge3Deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 0.85, ROAD_W + 0.8), curbMat);
    bridge3Deck.position.set(bridgeCenterX, -0.44, -940);
    this.scene.add(bridge3Deck);
    const bridge3Road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, bridgeLen), ewRoadMat);
    bridge3Road.rotation.x = -Math.PI / 2;
    bridge3Road.rotation.z = Math.PI / 2;
    bridge3Road.position.set(bridgeCenterX, 0.01, -940);
    bridge3Road.receiveShadow = true;
    this.scene.add(bridge3Road);
    for (const side of [-1, 1]) {
      const rz = -940 + side * 8.6;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 1.15, 0.52), curbMat);
      rail.position.set(bridgeCenterX, 0.58, rz);
      this.scene.add(rail);
      const railGlow = new THREE.Mesh(new THREE.BoxGeometry(bridgeLen, 0.14, 0.14), goldNeon);
      railGlow.position.set(bridgeCenterX, 1.22, rz);
      this.scene.add(railGlow);
      this.addBoxCollider(8.4, 130.4, rz - 0.4, rz + 0.4);
    }
    for (let bx = 28; bx <= 116; bx += 22) {
      for (const side of [-1, 1]) {
        const pierCol = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 6.2, 10), curbMat);
        pierCol.position.set(bx, -3.1, -940 + side * 7.8);
        this.scene.add(pierCol);
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.28, 9.6, 8), poleMat);
        pylon.position.set(bx, 4.8, -940 + side * 8.6);
        this.scene.add(pylon);
      }
      const arch = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 17.6), poleMat);
      arch.position.set(bx, 9.5, -940);
      this.scene.add(arch);
      const archNeon = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 17.0), goldNeon);
      archNeon.position.set(bx, 9.18, -940);
      this.scene.add(archNeon);
    }
    const piSand = new THREE.Mesh(new THREE.CylinderGeometry(42, 47, 1.4, 48), sandMat);
    piSand.position.set(164, -0.68, -940);
    this.scene.add(piSand);
    const piPlaza = new THREE.Mesh(new THREE.CylinderGeometry(35, 35.6, 0.14, 48), sidewalkMat);
    piPlaza.position.set(164, -0.05, -940);
    piPlaza.receiveShadow = true;
    this.scene.add(piPlaza);
    const piRing = new THREE.Mesh(new THREE.RingGeometry(31.5, 32.3, 48), goldNeon);
    piRing.rotation.x = -Math.PI / 2;
    piRing.position.set(164, 0.04, -940);
    this.scene.add(piRing);
    // Prawn Island InterGlobal Film Studios Soundstages (Textured Corrugated Hangars + Stage Numbers + Roll-Up Bay Doors!)
    const makeStageWallTex = (stageNum, accentHex) => {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 320;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ddd3c8';
      ctx.fillRect(0, 0, 512, 320);
      // Corrugated studio ribs & base concrete plinth
      for (let x = 0; x < 512; x += 12) {
        ctx.fillStyle = 'rgba(40,34,48,0.08)';
        ctx.fillRect(x, 0, 4, 270);
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(x + 4, 0, 2, 270);
      }
      ctx.fillStyle = '#a89f96';
      ctx.fillRect(0, 268, 512, 52);
      // Accent horizontal Miami studio stripe
      ctx.fillStyle = accentHex;
      ctx.fillRect(0, 34, 512, 16);
      // Giant Roll-Up Studio Equipment Bay Door
      ctx.fillStyle = '#262b38';
      ctx.fillRect(190, 152, 132, 168);
      for (let y = 160; y < 318; y += 14) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(194, y, 124, 3);
      }
      ctx.strokeStyle = '#ffd36b';
      ctx.lineWidth = 4;
      ctx.strokeRect(190, 152, 132, 168);
      // Bold InterGlobal Stage Number Stencil
      ctx.fillStyle = '#1d1c28';
      ctx.font = '900 44px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`STAGE ${stageNum}`, 256, 114);
      ctx.font = '700 18px "JetBrains Mono", monospace';
      ctx.fillStyle = '#4e4656';
      ctx.fillText('INTERGLOBAL STUDIOS · VICE CITY', 256, 138);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      return tex;
    };
    const stageWallMat = new THREE.MeshStandardMaterial({ color: 0xe6dcd2, roughness: 0.72 });
    const stageRoofMat = new THREE.MeshStandardMaterial({ color: 0x3b4458, roughness: 0.48, metalness: 0.38 });
    const stageDoorDark = new THREE.MeshStandardMaterial({ color: 0x1a1e28, roughness: 0.65, metalness: 0.3 });
    [[-960, 1, '#FF2E88', pinkNeon], [-920, 2, '#21E6D1', cyanNeon]].forEach(([sz, num, hex, neon]) => {
      const stage = new THREE.Group();
      const sWallMat = new THREE.MeshStandardMaterial({ map: makeStageWallTex(num, hex), roughness: 0.68 });
      const sBox = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 12), sWallMat);
      sBox.position.y = 5;
      const sDome = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 16, 18, 1, false, 0, Math.PI), stageRoofMat);
      sDome.rotation.z = Math.PI / 2;
      sDome.position.y = 10;
      const sTrim = new THREE.Mesh(new THREE.BoxGeometry(16.25, 0.34, 12.25), neon);
      sTrim.position.y = 9.82;
      const sAwning = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 5.2), stageDoorDark);
      sAwning.position.set(-8.4, 5.4, 0);
      stage.add(sBox, sDome, sTrim, sAwning);
      stage.position.set(174, 0.04, sz);
      this.scene.add(stage);
      this.addBoxCollider(165.5, 182.5, sz - 6.4, sz + 6.4);
    });
    // Iconic Studio Water Tower on Prawn Island
    const wtTank = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 5.2, 18), stageWallMat);
    wtTank.position.set(188, 17.5, -940);
    const wtRoof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2.6, 18), stageRoofMat);
    wtRoof.position.set(188, 21.4, -940);
    this.scene.add(wtTank, wtRoof);
    for (const [lx, lz] of [[-1.9, -1.9], [1.9, -1.9], [-1.9, 1.9], [1.9, 1.9]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 15.2, 8), poleMat);
      leg.position.set(188 + lx, 7.6, -940 + lz);
      this.scene.add(leg);
    }
    this.addCircleCollider(188, -940, 3.4);
    const piSignTex = makeNeonSignTexture('PRAWN ISLAND', 'INTERGLOBAL FILM STUDIOS', '#FFD36B', maxAniso, false);
    const piSign = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 3.4),
      new THREE.MeshStandardMaterial({ map: piSignTex, emissive: 0xffffff, emissiveMap: piSignTex, emissiveIntensity: 0.95, side: THREE.DoubleSide })
    );
    piSign.position.set(182, 6.0, -940);
    piSign.rotation.y = -Math.PI / 2;
    this.scene.add(piSign);

    // 5. Arrival Gateway Arch over Ocean Drive (Z = -22, SOLID PILLAR COLLIDERS!)
    const archGroup = new THREE.Group();
    for (const sx of [-9.4, 9.4]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 10.6, 1.3), poleMat);
      pillar.position.set(sx, 5.3, 0); archGroup.add(pillar);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 9.8, 0.18), cyanNeon);
      strip.position.set(sx + (sx > 0 ? -0.52 : 0.52), 5.2, 0.62); archGroup.add(strip);
      this.addBoxCollider(sx - 0.6, sx + 0.6, -22 - 0.75, -22 + 0.75);
    }
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(19.8, 1.45, 1.25), poleMat);
    archBeam.position.set(0, 10.3, 0); archGroup.add(archBeam);
    const archSignTex = makeNeonSignTexture('VICE CITY · OCEAN DRIVE', 'MIAMI BEACH 1986 · OPEN WORLD', '#21E6D1', maxAniso, false);
    const archSign = new THREE.Mesh(
      new THREE.PlaneGeometry(14.5, 2.3),
      new THREE.MeshStandardMaterial({ map: archSignTex, emissive: 0xffffff, emissiveMap: archSignTex, emissiveIntensity: 0.88 })
    );
    archSign.position.set(0, 10.4, 0.66); archGroup.add(archSign);
    archGroup.position.set(0, 0, -22);
    this.scene.add(archGroup);

    // 6. Five 1986 Miami Art Deco Showcase Cinemas & VIP Red-Carpet Galleries
    SHOWROOMS.forEach((sr) => {
      const srObj = createCaseStudyShowroom(sr, texLoader, maxAniso);
      srObj.group.position.set(sr.x, 0.16, sr.z);
      this.scene.add(srObj.group);
      this.showroomAnims.push({ ...srObj, sr });
      // Exact collider around the Art Deco theater facade (leaving the Red Carpet & VIP Valet Bay open!)
      if (sr.rotY && Math.abs(sr.rotY) > 1.5) {
        this.addBoxCollider(sr.x - 1.8, sr.x + 3.8, sr.z - 7.4, sr.z + 7.4);
      } else {
        this.addBoxCollider(sr.x - 3.8, sr.x + 1.8, sr.z - 7.4, sr.z + 7.4);
      }
    });

    // 7. ARCHITECTURAL CITY: 5 DISTINCT ARCHITECTURAL STYLES + WALK-IN ENTERABLE INTERIORS!
    const hotelCatalog = [
      // Ocean Drive Beachfront Row (Art Deco + Spanish Colonial + 3 WALK-IN ENTERABLE LANDMARKS!)
      { x: -24.5, z: -48,  w: 24, h: 17, d: 15, base: '#EDE2D4', trimHex: '#FAF6F0', accent: 0xff2e88, accentHex: '#FF2E88', name: 'OCEAN VIEW',  sub: 'HOTEL · WALK IN',  seed: 1, cafe: true,  style: 'artdeco', enterable: 'hotel' },
      { x: -24.5, z: -116, w: 22, h: 16, d: 15, base: '#F2E0CC', trimHex: '#FFF6EC', accent: 0x0ec4b8, accentHex: '#0EC4B8', name: 'THE COLONY',  sub: 'SPANISH VILLAS',   seed: 2, cafe: true,  style: 'colonial' },
      { x: -24.5, z: -190, w: 26, h: 18, d: 15, base: '#E4DDD6', trimHex: '#FAF4EE', accent: 0xff3a4c, accentHex: '#FF3A4C', name: 'AMMU-NATION', sub: 'GUNS · WALK IN',   seed: 3, cafe: false, style: 'artdeco', enterable: 'ammunation' },
      { x: -24.5, z: -252, w: 26, h: 24, d: 15, base: '#E8DCE8', trimHex: '#F8F2FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'CLEVELANDER', sub: 'LOUNGE & SUITES',  seed: 4, cafe: true,  style: 'midtown_tower' },
      { x: -24.5, z: -344, w: 24, h: 20, d: 15, base: '#F2E4CC', trimHex: '#FFF9EC', accent: 0xe6a822, accentHex: '#E6A822', name: 'MALIBU CLUB', sub: 'CLUB · WALK IN',   seed: 5, cafe: true,  style: 'artdeco', enterable: 'club' },
      { x: -24.5, z: -424, w: 24, h: 18, d: 15, base: '#E8DEC8', trimHex: '#FFF8EC', accent: 0x18c4be, accentHex: '#18C4BE', name: 'CARLYLE',     sub: 'COLONIAL SUITES',  seed: 6, cafe: true,  style: 'colonial' },
      { x: -24.5, z: -512, w: 28, h: 24, d: 15, base: '#EED6DC', trimHex: '#FFF4F6', accent: 0xff2e88, accentHex: '#FF2E88', name: 'BREAKWATER',  sub: 'OCEAN FRONT',      seed: 7, cafe: true,  style: 'artdeco' },
      { x: -24.5, z: -574, w: 26, h: 17, d: 15, base: '#E6DFD2', trimHex: '#FAF7F2', accent: 0xff7a24, accentHex: '#FF7A24', name: 'BEACON',      sub: 'MIAMI COLONIAL',   seed: 8, cafe: true,  style: 'colonial' },

      // Midtown Towers & Glass Atriums (Between Ocean Drive & Washington Ave: X = -64)
      { x: -64, z: -60,  w: 36, h: 32, d: 24, base: '#E2D8CE', trimHex: '#F7F3EE', accent: 0x18c4be, accentHex: '#18C4BE', name: 'VICE PLAZA', sub: 'MIDTOWN TOWER', seed: 9,  cafe: false, style: 'midtown_tower' },
      { x: -64, z: -220, w: 38, h: 38, d: 24, base: '#DCE2EC', trimHex: '#F2F6FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'BISCAYNE',   sub: 'SETBACK TOWER', seed: 10, cafe: false, style: 'midtown_tower' },
      { x: -64, z: -380, w: 36, h: 22, d: 24, base: '#EDE0D2', trimHex: '#FFF8F0', accent: 0xe6a822, accentHex: '#E6A822', name: 'POINCIANA',  sub: 'GRAND ATRIUM',  seed: 11, cafe: false, style: 'mall_atrium' },
      { x: -64, z: -540, w: 38, h: 20, d: 24, base: '#D8E2E0', trimHex: '#F2F8F6', accent: 0x18c4be, accentHex: '#18C4BE', name: 'WASHINGTON', sub: 'SHOPPING MALL', seed: 12, cafe: false, style: 'mall_atrium' },

      // North Vice Point Heights & North Point Mall (Z = -650..-1080)
      { x: -24.5, z: -676, w: 26, h: 26, d: 15, base: '#F0DEE6', trimHex: '#FFF6FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'NORTH PALMS', sub: 'VICE HEIGHTS', seed: 17, cafe: true, style: 'midtown_tower' },
      { x: -24.5, z: -738, w: 26, h: 28, d: 15, base: '#D6ECE8', trimHex: '#F2FCFA', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'BAYSIDE CLUB', sub: 'PENTHOUSE',  seed: 18, cafe: true, style: 'artdeco' },
      { x: -24.5, z: -846, w: 28, h: 18, d: 15, base: '#F4DFCE', trimHex: '#FFF7EE', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'EL SWANKO',   sub: 'NORTH CASA',  seed: 26, cafe: true, style: 'colonial' },
      { x: -24.5, z: -904, w: 26, h: 24, d: 15, base: '#DCE8F0', trimHex: '#F4FAFF', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'LINKS VIEW',  sub: 'ESTATES',     seed: 27, cafe: true, style: 'midtown_tower' },
      { x: -24.5, z: -1018, w: 34, h: 22, d: 18, base: '#EFE0E8', trimHex: '#FFF5FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'NORTH MALL', sub: 'VICE POINT',  seed: 28, cafe: true, style: 'mall_atrium' },
      { x: -64,   z: -700, w: 38, h: 36, d: 24, base: '#EDE2D4', trimHex: '#FAF6F0', accent: 0xffd36b, accentHex: '#FFD36B', name: 'SUNSET ROYALE', sub: 'RESIDENCES', seed: 19, cafe: false, style: 'midtown_tower' },
      { x: -64,   z: -860, w: 38, h: 32, d: 24, base: '#D8E8E4', trimHex: '#F2FCFA', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'FAIRGROUND',  sub: 'NORTH TOWER', seed: 29, cafe: false, style: 'midtown_tower' },
      { x: -64,   z: -1020, w: 40, h: 24, d: 24, base: '#F0DFD0', trimHex: '#FFF8F0', accent: 0xffd36b, accentHex: '#FFD36B', name: 'VICE GALLERIA', sub: 'GRAND MALL', seed: 30, cafe: false, style: 'mall_atrium' },

      // South Ocean Bay Marina Hotels (Z = +200..+325)
      { x: -24.5, z: 240,  w: 28, h: 18, d: 15, base: '#E8E4D4', trimHex: '#FAF8EE', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'SOUTH MARINA', sub: 'YACHT CLUB', seed: 31, cafe: true, style: 'colonial' },
      { x: -24.5, z: 300,  w: 26, h: 18, d: 15, base: '#F0D6DC', trimHex: '#FFF2F6', accent: 0xff2e88, accentHex: '#FF2E88', name: 'POLE POSITION', sub: 'SOUTH BEACH', seed: 32, cafe: true, style: 'artdeco' },
      { x: -64,   z: 260,  w: 36, h: 22, d: 24, base: '#DDE4EC', trimHex: '#F2F6FA', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'OCEAN BAY',   sub: 'MARINA PLAZA', seed: 33, cafe: false, style: 'mall_atrium' },

      // West Bayside Boulevard District (Between Downtown Hwy & West Bayside Blvd: X = -240)
      { x: -240, z: 260,  w: 36, h: 18, d: 24, base: '#E6DDD2', trimHex: '#FAF6F0', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'AIRPORT INN',  sub: 'SOUTH BAY',     seed: 34, cafe: false, style: 'colonial' },
      { x: -240, z: -60,  w: 38, h: 22, d: 24, base: '#E4D8E8', trimHex: '#FAF2FC', accent: 0xff2e88, accentHex: '#FF2E88', name: 'BAYSIDE MALL', sub: 'WEST DISTRICT', seed: 20, cafe: false, style: 'mall_atrium' },
      { x: -240, z: -220, w: 38, h: 42, d: 24, base: '#D6E4EC', trimHex: '#F2F8FC', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'WEST HARBOR',  sub: 'CONDOMINIUMS',  seed: 21, cafe: false, style: 'midtown_tower' },
      { x: -240, z: -380, w: 36, h: 24, d: 24, base: '#F0DFCE', trimHex: '#FFF6EE', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'VICE ARENA',   sub: 'STADIUM PLAZA', seed: 22, cafe: false, style: 'mall_atrium' },
      { x: -240, z: -540, w: 38, h: 18, d: 24, base: '#D6DCE0', trimHex: '#EEF2F6', accent: 0xffd36b, accentHex: '#FFD36B', name: 'PALM STUDIO',  sub: 'SOUNDSTAGE',    seed: 23, cafe: false, style: 'warehouse' },
      { x: -240, z: -700, w: 38, h: 36, d: 24, base: '#E8DCE6', trimHex: '#FAF4F8', accent: 0xff2e88, accentHex: '#FF2E88', name: 'NORTH BAY',    sub: 'TOWERS',        seed: 24, cafe: false, style: 'midtown_tower' },
      { x: -240, z: -860, w: 38, h: 24, d: 24, base: '#DCE4EC', trimHex: '#F2F6FA', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'HYMAN ARENA',  sub: 'CONCERT HALL',  seed: 35, cafe: false, style: 'mall_atrium' },
      { x: -240, z: -1020, w: 38, h: 30, d: 24, base: '#EDE2D4', trimHex: '#FAF6F0', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'NORTH HARBOR', sub: 'CONVENTION',   seed: 36, cafe: false, style: 'midtown_tower' },

      // Little Haiti & Little Havana Vibrant Colonial + Industrial Warehouse District (X = -336)
      { x: -336, z: 100,  w: 34, h: 15, d: 22, base: '#E2D6C8', trimHex: '#F6F0E8', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'KAUFMAN CABS', sub: 'DISPATCH DEPOT', seed: 37, cafe: false, style: 'warehouse' },
      { x: -336, z: -60,  w: 36, h: 16, d: 22, base: '#DDD6E4', trimHex: '#F4F0FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'PRINT WORKS',  sub: 'INDUSTRIAL',     seed: 38, cafe: false, style: 'warehouse' },
      { x: -336, z: -220, w: 36, h: 17, d: 22, base: '#F0DEC8', trimHex: '#FFF6EA', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'CAFE ROBINA',  sub: 'CUBAN ROAST',    seed: 39, cafe: false, style: 'colonial' },
      { x: -336, z: -380, w: 36, h: 18, d: 22, base: '#F2E4CC', trimHex: '#FFF9EC', accent: 0xffd36b, accentHex: '#FFD36B', name: 'CHERRY POPPER', sub: 'ICE CREAM CO',  seed: 40, cafe: false, style: 'colonial' },
      { x: -336, z: -540, w: 36, h: 15, d: 22, base: '#D8D4D0', trimHex: '#F0ECE8', accent: 0xff2e88, accentHex: '#FF2E88', name: 'PHIL PLACE',   sub: 'SURPLUS DEPOT',  seed: 41, cafe: false, style: 'warehouse' },
      { x: -336, z: -700, w: 36, h: 18, d: 22, base: '#E6DCCE', trimHex: '#FAF4EA', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'GREASY CHOP',  sub: 'DOWNTOWN WEST',  seed: 42, cafe: false, style: 'colonial' },
      { x: -336, z: -860, w: 36, h: 28, d: 22, base: '#EDE0D2', trimHex: '#FFF8F0', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'VROCK STUDIO', sub: 'FM 107.4',       seed: 43, cafe: false, style: 'midtown_tower' },
      { x: -336, z: -1020, w: 36, h: 16, d: 22, base: '#D4D8E0', trimHex: '#EEF2F8', accent: 0xff2e88, accentHex: '#FF2E88', name: 'WEST STADIUM', sub: 'CARGO ANNEX',    seed: 44, cafe: false, style: 'warehouse' }
    ];

    this.beacons = [];
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff2442, emissive: 0xff2442, emissiveIntensity: 1.8 });
    hotelCatalog.forEach((hd) => {
      const hotel = createArtDecoHotel(hd, maxAniso, this.isSoftwareGl);
      hotel.position.set(hd.x, 0.16, hd.z);
      this.scene.add(hotel);
      if (hd.enterable) {
        // Segmented hollow perimeter colliders leaving 7.2m wide East (+X) doorway completely open to walk inside!
        const minX = hd.x - hd.d * 0.5;
        const maxX = hd.x + hd.d * 0.5;
        const minZ = hd.z - hd.w * 0.5;
        const maxZ = hd.z + hd.w * 0.5;
        this.addBoxCollider(minX - 0.5, minX + 0.75, minZ - 0.5, maxZ + 0.5); // Back (-X) wall
        this.addBoxCollider(minX - 0.5, maxX + 0.75, minZ - 0.6, minZ + 0.75); // North (-Z) wall
        this.addBoxCollider(minX - 0.5, maxX + 0.75, maxZ - 0.75, maxZ + 0.6); // South (+Z) wall
        this.addBoxCollider(maxX - 0.5, maxX + 0.9, minZ - 0.5, hd.z - 3.65);  // East-North facade wing
        this.addBoxCollider(maxX - 0.5, maxX + 0.9, hd.z + 3.65, maxZ + 0.5);  // East-South facade wing

        const ebId = hd.enterable === 'hotel' ? 'ocean-view' : (hd.enterable === 'club' ? 'malibu-club' : 'ammunation');
        this.enterableBuildings.push({
          id: ebId, label: hd.name, kind: hd.enterable,
          doorX: maxX + 1.4, doorZ: hd.z,
          insideX: hd.x + 1.4, insideZ: hd.z, insideYaw: Math.PI / 2,
          perkX: hd.x + 0.8, perkZ: hd.z,
          accent: hd.accent, accentHex: hd.accentHex
        });
      } else {
        // Exact solid collider including corner turrets & entrance columns
        this.addBoxCollider(hd.x - hd.d * 0.5 - 0.6, hd.x + hd.d * 0.5 + 1.8, hd.z - hd.w * 0.5 - 0.8, hd.z + hd.w * 0.5 + 0.8);
      }

      const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), beaconMat.clone());
      b.position.set(hd.x + hd.d * 0.5 + 0.82, hd.h + 6.5, hd.z);
      b.userData.phase = hd.seed * 1.3;
      this.scene.add(b);
      this.beacons.push(b);
    });

    // Glowing GTA Floor Doorway Rings + Interior Interactive Perk Pads for All Walk-In Buildings!
    this.doorBeacons = [];
    this.interiorPerks = [];
    this.enterableBuildings.forEach((eb, idx) => {
      const doorRing = new THREE.Mesh(
        new THREE.RingGeometry(1.15, 1.55, 24),
        new THREE.MeshBasicMaterial({ color: eb.accent, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
      );
      doorRing.rotation.x = -Math.PI / 2;
      doorRing.position.set(eb.doorX, 0.22, eb.doorZ);
      this.scene.add(doorRing);
      this.doorBeacons.push({ mesh: doorRing, phase: idx * 1.1 });

      const perkRing = new THREE.Mesh(
        new THREE.RingGeometry(0.95, 1.35, 24),
        new THREE.MeshBasicMaterial({ color: 0x34e89e, transparent: true, opacity: 0.78, side: THREE.DoubleSide, depthWrite: false })
      );
      perkRing.rotation.x = -Math.PI / 2;
      perkRing.position.set(eb.perkX, 0.24, eb.perkZ);
      const perkGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.36, 0),
        new THREE.MeshBasicMaterial({ color: eb.accent })
      );
      perkGem.position.set(eb.perkX, 1.35, eb.perkZ);
      this.scene.add(perkRing, perkGem);
      this.interiorPerks.push({ ...eb, ring: perkRing, gem: perkGem, cooldown: 0 });
    });

    // Downtown Reflective Glass Curtain-Wall Skyscrapers (Between Washington Ave & Downtown Hwy: X = -144)
    const glassTowers = [
      { x: -144, z: 260,  w: 36, h: 42, d: 28, glassTint: '#2b4a6e', mullionHex: '#2e3340', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'BAY MARINA',  sub: 'SOUTH TOWER', seed: 45 },
      { x: -144, z: -60,  w: 40, h: 58, d: 32, glassTint: '#2b4a6e', mullionHex: '#2e3340', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'RAZORPAY',    sub: 'FINTECH HQ', seed: 13 },
      { x: -144, z: -220, w: 38, h: 72, d: 30, glassTint: '#364d72', mullionHex: '#3c404e', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'HYMAN TOWER', sub: 'DOWNTOWN',   seed: 14 },
      { x: -144, z: -380, w: 42, h: 66, d: 32, glassTint: '#284c68', mullionHex: '#2b323e', accent: 0xff2e88, accentHex: '#FF2E88', name: 'VICE METRO',  sub: 'FINANCIAL',  seed: 15 },
      { x: -144, z: -540, w: 38, h: 54, d: 30, glassTint: '#324864', mullionHex: '#383d4a', accent: 0xffd36b, accentHex: '#FFD36B', name: 'HAVANA PLAZA',sub: 'GALLERIA',   seed: 16 },
      { x: -144, z: -700, w: 40, h: 64, d: 32, glassTint: '#2b466a', mullionHex: '#2e3444', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'NORTH APEX',  sub: 'SKYLINE',    seed: 25 },
      { x: -144, z: -860, w: 40, h: 68, d: 32, glassTint: '#304a70', mullionHex: '#2b3242', accent: 0xff2e88, accentHex: '#FF2E88', name: 'MIDNIGHT',    sub: 'TOWER NORTH', seed: 46 },
      { x: -144, z: -1020, w: 38, h: 56, d: 30, glassTint: '#284a66', mullionHex: '#2d3545', accent: 0xffd36b, accentHex: '#FFD36B', name: 'VICE NORTH',  sub: 'TRADE CENTER', seed: 47 }
    ];
    glassTowers.forEach((gt) => {
      const { group, beaconY } = createGlassSkyscraper(gt, maxAniso, this.isSoftwareGl);
      group.position.set(gt.x, 0.16, gt.z);
      this.scene.add(group);
      this.addBoxCollider(gt.x - gt.d * 0.5 - 1.4, gt.x + gt.d * 0.5 + 1.4, gt.z - gt.w * 0.5 - 1.4, gt.z + gt.w * 0.5 + 1.4);

      const b = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 8), beaconMat.clone());
      b.position.set(gt.x, beaconY + 0.16, gt.z);
      b.userData.phase = gt.seed * 1.1;
      this.scene.add(b);
      this.beacons.push(b);
    });

    // Vice Port Industrial Shipping Container Yard & Gantry Cranes (Between Little Haiti Ave & Vice Port Expy: X = -432, 3 Instanced Draw Calls!)
    const containerPalette = [0xc93b2b, 0x2563eb, 0x168a6a, 0xd9822b, 0x7c3aed, 0x3b4858];
    const containerSpecs = [];
    for (let z = 280; z >= -1040; z -= 80) {
      if (CROSS_STREETS.some((cs) => Math.abs(z - cs) < 22)) continue;
      for (let col = 0; col < 3; col++) {
        const cx = -454 + col * 22;
        containerSpecs.push({ x: cx, y: 1.75, z: z - 12, color: containerPalette[Math.abs(z + col * 17) % containerPalette.length], yaw: 0 });
        containerSpecs.push({ x: cx, y: 1.75, z: z + 14, color: containerPalette[Math.abs(z + col * 31 + 3) % containerPalette.length], yaw: 0 });
        if ((Math.abs(z) + col) % 2 === 0) {
          containerSpecs.push({ x: cx, y: 4.95, z: z - 12, color: containerPalette[Math.abs(z + col * 7 + 5) % containerPalette.length], yaw: 0 });
        }
        this.addBoxCollider(cx - 5.2, cx + 5.2, z - 20, z + 22);
      }
    }
    const contInst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(9.2, 3.2, 16.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.38 }),
      containerSpecs.length
    );
    const contTmpCol = new THREE.Color();
    containerSpecs.forEach((cs, i) => {
      _dummy.position.set(cs.x, cs.y, cs.z);
      _dummy.rotation.set(0, cs.yaw, 0);
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      contInst.setMatrixAt(i, _dummy.matrix);
      contInst.setColorAt(i, contTmpCol.setHex(cs.color));
    });
    contInst.instanceColor.needsUpdate = true;
    contInst.computeBoundingSphere();
    this.scene.add(contInst);

    // 5 Towering Vice Port Cargo Gantry Cranes along the West Bay Seawall (X = -492)
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xe66a22, roughness: 0.52, metalness: 0.42 });
    for (const cz of [100, -180, -460, -740, -1000]) {
      const cg = new THREE.Group();
      for (const lz of [-7, 7]) {
        const legL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 24, 1.4), craneMat);
        legL.position.set(-4, 12, lz);
        const legR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 24, 1.4), craneMat);
        legR.position.set(4, 12, lz);
        cg.add(legL, legR);
      }
      const boom = new THREE.Mesh(new THREE.BoxGeometry(34, 2.2, 15.6), craneMat);
      boom.position.set(-6, 24, 0);
      cg.add(boom);
      cg.position.set(-492, 0.16, cz);
      this.scene.add(cg);
    }

    // 8. INSTANCED 14-FROND 3D TROPICAL PALM TREES (5 DRAW CALLS FOR ALL PALMS & PLANTERS!)
    const lowerFrondGeo = buildArchingFrondGeometry(4.4, 2.35, 0.95, 2.15);
    const upperFrondGeo = buildArchingFrondGeometry(3.4, 1.95, 1.45, 1.15);
    const { trunkGeo, collarGeo, frondCrownGeo } = buildMergedPalmGeometries(lowerFrondGeo, upperFrondGeo);
    lowerFrondGeo.dispose();
    upperFrondGeo.dispose();

    const trunkMat = new THREE.MeshStandardMaterial({ map: makePalmBarkTexture(), roughness: 0.90 });
    const collarMat = new THREE.MeshStandardMaterial({ color: 0x3b5c34, roughness: 0.80 });
    const frondMat = new THREE.MeshStandardMaterial({
      map: makePalmFrondTexture(), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.62, metalness: 0.02
    });
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x4b3b30, roughness: 0.92 });

    const palmSpecs = [];
    const planterSpecs = [];
    const queuePalm = (px, py, pz, h, rotY, addBush = false) => {
      palmSpecs.push({ x: px, y: py, z: pz, s: h / 10.0, rotY });
      this.addCircleCollider(px, pz, 0.48); // Solid palm trunk!
      if (addBush) planterSpecs.push({ x: px, y: py, z: pz });
    };

    for (let z = 355; z >= -1105; z -= 22) {
      if (Math.abs(z + 300) < 16 || Math.abs(z + 430) < 22 || Math.abs(z + 540) < 12 || Math.abs(z + 620) < 16 || Math.abs(z + 940) < 16) continue;
      const h = 8.8 + ((Math.abs(z) * 13) % 28) * 0.1;
      queuePalm(14.8, 0.16, z, h, (z * 0.7) % 6.28, true);
      if (Math.abs(z) % 44 === 0 && Math.abs(z - 8 + 430) > 24 && Math.abs(z - 8 + 540) > 14 && Math.abs(z - 8 + 940) > 18) {
        queuePalm(23.5, -0.15, z - 8, h * 0.9, (z * 1.3) % 6.28, false);
      }
    }
    for (let z = 310; z >= -1080; z -= 44) {
      if (CROSS_STREETS.some((cs) => Math.abs(z - cs) < 18)) continue;
      if (z < 20 || z > 180) queuePalm(-85.5, 0.16, z, 9.2, z * 0.5, true);
      queuePalm(-277.5, 0.16, z, 9.0, z * 0.8, false);
      queuePalm(-373.5, 0.16, z, 8.8, z * 1.1, false);
    }
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      if (Math.cos(ang) < -0.78) continue;
      queuePalm(152 + Math.cos(ang) * 31, 0.04, -300 + Math.sin(ang) * 31, 9.0 + (i % 3) * 0.9, ang, false);
      queuePalm(156 + Math.cos(ang) * 33, 0.04, -620 + Math.sin(ang) * 33, 9.2 + (i % 3) * 0.9, ang + 0.5, false);
      queuePalm(164 + Math.cos(ang) * 37, 0.04, -940 + Math.sin(ang) * 37, 9.4 + (i % 3) * 0.8, ang + 0.9, false);
    }

    const palmTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmSpecs.length);
    const palmCollars = new THREE.InstancedMesh(collarGeo, collarMat, palmSpecs.length);
    const palmFronds = new THREE.InstancedMesh(frondCrownGeo, frondMat, palmSpecs.length);
    palmTrunks.castShadow = !this.isSoftwareGl;
    palmSpecs.forEach((ps, i) => {
      _dummy.position.set(ps.x, ps.y, ps.z);
      _dummy.rotation.set(0, ps.rotY, 0);
      _dummy.scale.setScalar(ps.s);
      _dummy.updateMatrix();
      palmTrunks.setMatrixAt(i, _dummy.matrix);
      palmCollars.setMatrixAt(i, _dummy.matrix);
      palmFronds.setMatrixAt(i, _dummy.matrix);
    });
    palmTrunks.computeBoundingSphere();
    palmCollars.computeBoundingSphere();
    palmFronds.computeBoundingSphere();
    this.scene.add(palmTrunks, palmCollars, palmFronds);
    this.palms = [];

    const planterInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.05, 1.12, 0.22, 8), planterMat, planterSpecs.length);
    const bushInst = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.75, 1), bushMat, planterSpecs.length);
    planterSpecs.forEach((pl, i) => {
      _dummy.rotation.set(0, 0, 0); _dummy.scale.set(1, 1, 1);
      _dummy.position.set(pl.x, pl.y + 0.08, pl.z); _dummy.updateMatrix(); planterInst.setMatrixAt(i, _dummy.matrix);
      _dummy.position.set(pl.x + 0.3, pl.y + 0.42, pl.z + 0.2); _dummy.scale.set(1.2, 0.65, 1.2); _dummy.updateMatrix(); bushInst.setMatrixAt(i, _dummy.matrix);
    });
    this.scene.add(planterInst, bushInst);

    // 9. Instanced Streetlamps + Iconic GTA Vice City Soft 2D Light Coronas + Hydrants & Benches!
    const lampWarmMat = new THREE.MeshStandardMaterial({ color: 0xfff0c4, emissive: 0xffd888, emissiveIntensity: 1.65 });
    const lampCyanMat = new THREE.MeshStandardMaterial({ color: 0x9cf8f0, emissive: 0x21e6d1, emissiveIntensity: 1.55 });
    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x7a4e3a, roughness: 0.82 });
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xd92834, roughness: 0.45, metalness: 0.25 });

    const lampPosts = [];
    const warmGlobes = [];
    const cyanGlobes = [];
    const benchList = [];
    const hydrantList = [];

    for (let z = 340; z >= -1090; z -= 34) {
      if (Math.abs(z + 300) < 18 || Math.abs(z + 430) < 22 || Math.abs(z + 620) < 18 || Math.abs(z + 940) < 18) continue;
      lampPosts.push({ x: 9.4, z, dir: -1 });
      (Math.abs(z) % 68 === 0 ? cyanGlobes : warmGlobes).push({ x: 9.4 - 1.72, z });
      this.addCircleCollider(9.4, z, 0.28);

      if (Math.abs(z - 12 + 430) > 22 && Math.abs(z - 12 + 540) > 14 && Math.abs(z - 12 + 940) > 18) {
        benchList.push({ x: 15.6, z: z - 12 });
        this.addBoxCollider(15.1, 16.1, z - 13.2, z - 10.8);
      }

      if (Math.abs(z) % 68 === 0 && (z < 20 || z > 180)) {
        hydrantList.push({ x: -9.3, z });
        this.addCircleCollider(-9.3, z, 0.24);
      }

      if (!CROSS_STREETS.some((cs) => Math.abs(z - cs) < 18) && (z < 20 || z > 180)) {
        lampPosts.push({ x: -105.4, z, dir: 1 });
        warmGlobes.push({ x: -105.4 + 1.65, z });
        this.addCircleCollider(-105.4, z, 0.28);
      }
      if (!CROSS_STREETS.some((cs) => Math.abs(z - cs) < 18) && Math.abs(z) % 68 === 0) {
        lampPosts.push({ x: -374.6, z, dir: -1 });
        cyanGlobes.push({ x: -374.6 - 1.65, z });
        this.addCircleCollider(-374.6, z, 0.28);
      }
    }

    const lampPoleInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.14, 6.4, 7), poleMat, lampPosts.length);
    const lampArmInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.1, 0.1), poleMat, lampPosts.length);
    lampPosts.forEach((lp, i) => {
      _dummy.rotation.set(0, 0, 0); _dummy.scale.set(1, 1, 1);
      _dummy.position.set(lp.x, 3.36, lp.z); _dummy.updateMatrix(); lampPoleInst.setMatrixAt(i, _dummy.matrix);
      _dummy.position.set(lp.x + lp.dir * 0.88, 6.41, lp.z); _dummy.updateMatrix(); lampArmInst.setMatrixAt(i, _dummy.matrix);
    });
    const globeGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const warmGlobeInst = new THREE.InstancedMesh(globeGeo, lampWarmMat, warmGlobes.length);
    warmGlobes.forEach((g, i) => { _dummy.position.set(g.x, 6.26, g.z); _dummy.rotation.set(0, 0, 0); _dummy.scale.set(1, 1, 1); _dummy.updateMatrix(); warmGlobeInst.setMatrixAt(i, _dummy.matrix); });
    const cyanGlobeInst = new THREE.InstancedMesh(globeGeo, lampCyanMat, cyanGlobes.length);
    cyanGlobes.forEach((g, i) => { _dummy.position.set(g.x, 6.26, g.z); _dummy.rotation.set(0, 0, 0); _dummy.scale.set(1, 1, 1); _dummy.updateMatrix(); cyanGlobeInst.setMatrixAt(i, _dummy.matrix); });

    // Authentic GTA Vice City RenderWare Soft Additive 2D Light Coronas on Ocean Drive & Avenue Streetlamps!
    const coronaTex = makeCoronaGlowTexture();
    const warmCoronaMat = new THREE.SpriteMaterial({
      map: coronaTex, color: 0xffc97a, transparent: true, opacity: 0.48,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const cyanCoronaMat = new THREE.SpriteMaterial({
      map: coronaTex, color: 0x3bf5e8, transparent: true, opacity: 0.52,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const pinkCoronaMat = new THREE.SpriteMaterial({
      map: coronaTex, color: 0xff4ca8, transparent: true, opacity: 0.50,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.coronaMats = [warmCoronaMat, cyanCoronaMat, pinkCoronaMat];
    warmGlobes.forEach((g, i) => {
      if (i % 2 !== 0) return; // keep scene crisp & light on draw calls
      const sp = new THREE.Sprite(warmCoronaMat);
      sp.position.set(g.x, 6.22, g.z);
      sp.scale.set(4.6, 4.6, 1);
      this.scene.add(sp);
    });
    cyanGlobes.forEach((g, i) => {
      const sp = new THREE.Sprite(i % 2 === 0 ? cyanCoronaMat : pinkCoronaMat);
      sp.position.set(g.x, 6.22, g.z);
      sp.scale.set(4.9, 4.9, 1);
      this.scene.add(sp);
    });

    const benchSeatInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.08, 2.2), benchWoodMat, benchList.length);
    const benchBackInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.52, 2.2), benchWoodMat, benchList.length);
    benchList.forEach((b, i) => {
      _dummy.rotation.set(0, 0, 0); _dummy.scale.set(1, 1, 1);
      _dummy.position.set(b.x, 0.66, b.z); _dummy.updateMatrix(); benchSeatInst.setMatrixAt(i, _dummy.matrix);
      _dummy.position.set(b.x - 0.26, 0.92, b.z); _dummy.updateMatrix(); benchBackInst.setMatrixAt(i, _dummy.matrix);
    });
    const hydrantInst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.16, 0.72, 7), hydrantMat, hydrantList.length);
    hydrantList.forEach((h, i) => { _dummy.position.set(h.x, 0.52, h.z); _dummy.rotation.set(0, 0, 0); _dummy.scale.set(1, 1, 1); _dummy.updateMatrix(); hydrantInst.setMatrixAt(i, _dummy.matrix); });

    this.scene.add(lampPoleInst, lampArmInst, warmGlobeInst, cyanGlobeInst, benchSeatInst, benchBackInst, hydrantInst);

    // Lifeguard Tower (Z = -195) & Wooden Atlantic Pier (Z = -430)
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xeee4dc, roughness: 0.8 });
    const lg = new THREE.Group();
    for (const [lx, lz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
      const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 8), woodMat); stilt.position.set(lx, 1.6, lz); lg.add(stilt);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 3.2), woodMat); deck.position.y = 3.2; lg.add(deck);
    const hut = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 2.2), woodMat); hut.position.y = 4.3; lg.add(hut);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.0, 4), new THREE.MeshStandardMaterial({ color: 0xe6297a, roughness: 0.5 }));
    roof.rotation.y = Math.PI / 4; roof.position.y = 5.8; lg.add(roof);
    lg.position.set(24.5, -0.25, -195);
    this.scene.add(lg);

    // Vice Beach Grand Carnival Fair & Amusement Pier (X = 17.5..141.5, Z = -448..-412 — Open Walkable/Drivable Entrance!)
    const goldPierNeon = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xffb84d, emissiveIntensity: 1.5 });
    const carnivalPier = createCarnivalPier(pinkNeon, cyanNeon, goldPierNeon, maxAniso);
    carnivalPier.root.position.set(17.5, 0, -430);
    this.scene.add(carnivalPier.root);
    this.carnivalPier = carnivalPier;
    this.ferrisWheel = carnivalPier.ferrisWheel;

    // Register 3 Rideable Amusement Park Attractions on Vice Carnival Pier (Press [E] to Ride!)
    const rideDefs = [
      { id: 'ferris', label: 'GIANT VICE FERRIS WHEEL', sub: '30m Panoramic Ocean View', boardX: 112.0, boardZ: -430.0, exitX: 108.0, exitZ: -430.0, col: 0xffd36b },
      { id: 'coaster', label: 'VICE CYCLONE ROLLER COASTER', sub: 'Oceanfront Thrill Track', boardX: 62.0, boardZ: -421.0, exitX: 62.0, exitZ: -426.0, col: 0xff2e88 },
      { id: 'carousel', label: 'VINTAGE NEON CAROUSEL', sub: 'Classic Painted Horses', boardX: 53.5, boardZ: -432.5, exitX: 53.5, exitZ: -428.0, col: 0x21e6d1 }
    ];
    rideDefs.forEach((rd, idx) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.5, 2.05, 24),
        new THREE.MeshBasicMaterial({ color: rd.col, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(rd.boardX, 0.22, rd.boardZ);
      this.scene.add(ring);
      this.pierRides.push({ ...rd, ring, phase: idx * 1.2 });
    });
    // Solid boardwalk rails & ride base colliders on the Carnival Pier
    this.addBoxCollider(17.5, 141.5, -448.6, -447.5);
    this.addBoxCollider(17.5, 141.5, -412.5, -411.4);
    this.addBoxCollider(140.8, 142.2, -448.5, -411.5);
    this.addCircleCollider(17.5 + 36, -430 - 9.5, 6.9); // Carousel
    this.addCircleCollider(17.5 + 68, -430 - 9.5, 4.4); // Wave Swinger
    this.addBoxCollider(17.5 + 15.5, 17.5 + 80.5, -430 + 10.2, -430 + 15.2); // Midway Booths row
    this.addBoxCollider(17.5 + 98, 17.5 + 110, -430 - 9.5, -430 + 9.5); // Ferris Wheel base

    // 10. Scenic Off-Road Vice Beach Contact Showcase Plaza (East Promenade X = 24.5, Z = -540 — Road 100% Clear!)
    const contactPlaza = new THREE.Group();
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xf4ece2, roughness: 0.76, metalness: 0.04 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x262238, roughness: 0.42, metalness: 0.55 });
    const deckBase = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.36, 7.6), deckMat);
    deckBase.position.set(0, 0.14, 1.2);
    contactPlaza.add(deckBase);
    const deckStep = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.24, 6.2), deckMat);
    deckStep.position.set(0, 0.42, 1.0);
    contactPlaza.add(deckStep);
    const carpet = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.04, 6.4),
      new THREE.MeshStandardMaterial({ color: 0xc21e56, roughness: 0.85 })
    );
    carpet.position.set(0, 0.55, 2.2);
    contactPlaza.add(carpet);

    // Sculpted Art Deco Neon Monument Backdrop
    const mono = new THREE.Mesh(new THREE.BoxGeometry(11.6, 6.0, 0.92), trimMat);
    mono.position.set(0, 3.52, -0.8);
    contactPlaza.add(mono);
    const crown = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.85, 0.72), deckMat);
    crown.position.set(0, 6.92, -0.8);
    contactPlaza.add(crown);
    const crownNeon = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.14, 0.82), goldPierNeon);
    crownNeon.position.set(0, 7.38, -0.8);
    contactPlaza.add(crownNeon);
    for (const sx of [-6.0, 6.0]) {
      const colPillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 6.5, 1.15), deckMat);
      colPillar.position.set(sx, 3.72, -0.78);
      contactPlaza.add(colPillar);
      const colNeon = new THREE.Mesh(new THREE.BoxGeometry(0.14, 6.1, 0.16), pinkNeon);
      colNeon.position.set(sx, 3.72, -0.18);
      contactPlaza.add(colNeon);
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 1.15, 10), trimMat);
      bollard.position.set(sx * 0.72, 1.06, 3.4);
      contactPlaza.add(bollard);
      const bCap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), cyanNeon);
      bCap.position.set(sx * 0.72, 1.68, 3.4);
      contactPlaza.add(bCap);
    }
    const monoTex = makeNeonSignTexture('AKSHAT SINGH', 'STAFF PRODUCT DESIGNER · CONTACT', '#FF2E88', maxAniso, false);
    const monoSignMat = new THREE.MeshStandardMaterial({ map: monoTex, emissive: 0xffffff, emissiveMap: monoTex, emissiveIntensity: 0.90 });
    const monoSignFront = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 5.2), monoSignMat);
    monoSignFront.position.set(0, 3.55, -0.32);
    contactPlaza.add(monoSignFront);
    const monoSignBack = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 5.2), monoSignMat);
    monoSignBack.rotation.y = Math.PI;
    monoSignBack.position.set(0, 3.55, -1.28);
    contactPlaza.add(monoSignBack);

    // Position off-road on Vice Beach East Promenade facing Ocean Drive (-X)
    contactPlaza.position.set(CONTACT_SHOWROOM.x, 0.0, CONTACT_SHOWROOM.z);
    contactPlaza.rotation.y = -Math.PI / 2;
    this.scene.add(contactPlaza);
    this.addBoxCollider(CONTACT_SHOWROOM.x - 0.2, CONTACT_SHOWROOM.x + 2.0, CONTACT_SHOWROOM.z - 6.6, CONTACT_SHOWROOM.z + 6.6);

    // 11. Articulated High-Poly GTA Pedestrians (Promenade, Sidewalks, Carnival Pier, Airport & Islands!)
    this.buildPedestrians();

    // 12. High-Poly Luxury Yachts, Circling Seagulls, Blimp & 24 Sculpted Traffic Cars
    this.yachts = [];
    [
      { x: 96, z: -110, speed: -2.4, col: 0x21e6d1 },
      { x: 235, z: -260, speed: 1.9, col: 0xff2e88 },
      { x: 182, z: -480, speed: -1.8, col: 0xffd36b }
    ].forEach((yd) => {
      const yGroup = createLuxuryYacht(yd.col);
      yGroup.position.set(yd.x, -0.45, yd.z);
      if (yd.speed > 0) yGroup.rotation.y = Math.PI;
      yGroup.userData.speed = yd.speed;
      this.scene.add(yGroup);
      this.yachts.push(yGroup);
    });

    this.seagulls = [];
    const gullMat = new THREE.MeshStandardMaterial({ color: 0xfbf8fc, roughness: 0.65, side: THREE.DoubleSide });
    const wingGeo = new THREE.PlaneGeometry(0.95, 0.24); wingGeo.translate(0.475, 0, 0);
    for (let i = 0; i < 10; i++) {
      const gWrap = new THREE.Group();
      const wL = new THREE.Mesh(wingGeo, gullMat); wL.rotation.x = -Math.PI / 2; wL.rotation.z = Math.PI;
      const wR = new THREE.Mesh(wingGeo, gullMat); wR.rotation.x = -Math.PI / 2;
      gWrap.add(wL, wR);
      gWrap.userData = { cx: 34 + (i % 3) * 18, cz: -50 - i * 58, cy: 14 + (i % 4) * 3.2, rad: 12 + (i % 3) * 5, spd: 0.44 + (i % 3) * 0.1, phase: i * 1.7, wL, wR };
      this.scene.add(gWrap); this.seagulls.push(gWrap);
    }

    this.blimp = new THREE.Group();
    const blimpHull = new THREE.Mesh(new THREE.SphereGeometry(5.8, 22, 14), new THREE.MeshStandardMaterial({ color: 0xe6e0ee, roughness: 0.38, metalness: 0.22 }));
    blimpHull.scale.set(1.0, 0.72, 2.6);
    this.blimp.add(blimpHull);
    this.blimp.add(new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.25, 10, 28), pinkNeon));
    this.blimp.position.set(54, 54, -260);
    this.scene.add(this.blimp);

    this.traffic = [];
    const trafficSpecs = [
      // Ocean Drive (North & Southbound — diverse hijackable 1986 rides across full 1.45km strip!)
      { x: -3.6,   z:  260, speed:  12, color: 0x21e6d1, type: 'convertible' },
      { x: -3.6,   z:  120, speed:  12, color: 0xf4c430, type: 'taxi' },
      { x: -3.6,   z:  -38, speed:  11, color: 0x21e6d1, type: 'convertible' },
      { x: -3.6,   z: -165, speed:  13, color: 0xff2e88, type: 'muscle' },
      { x: -3.6,   z: -340, speed:  12, color: 0xf4c430, type: 'taxi' },
      { x: -3.6,   z: -510, speed:  13, color: 0x3b82f6, type: 'suv' },
      { x: -3.6,   z: -690, speed:  12, color: 0xe2dde8, type: 'coupe' },
      { x: -3.6,   z: -910, speed:  13, color: 0xff8a2a, type: 'muscle' },
      { x:  3.6,   z:  280, speed: -12, color: 0xf4c430, type: 'taxi' },
      { x:  3.6,   z:   85, speed: -12, color: 0xff6b35, type: 'convertible' },
      { x:  3.6,   z:  -95, speed: -12, color: 0xf4c430, type: 'taxi' },
      { x:  3.6,   z: -245, speed: -14, color: 0xd93060, type: 'muscle' },
      { x:  3.6,   z: -425, speed: -13, color: 0x18b5aa, type: 'suv' },
      { x:  3.6,   z: -610, speed: -13, color: 0xe6a834, type: 'coupe' },
      { x:  3.6,   z: -790, speed: -12, color: 0x9b5de5, type: 'convertible' },
      { x:  3.6,   z: -1020, speed: -13, color: 0xff2e88, type: 'muscle' },
      // Washington Avenue
      { x: -99.6,  z:  240, speed:  13, color: 0x18b5aa, type: 'suv' },
      { x: -99.6,  z:   60, speed:  13, color: 0xe68838, type: 'muscle' },
      { x: -99.6,  z: -140, speed:  12, color: 0xf4c430, type: 'taxi' },
      { x: -99.6,  z: -390, speed:  13, color: 0x18b5aa, type: 'convertible' },
      { x: -99.6,  z: -650, speed:  14, color: 0x3b66d8, type: 'suv' },
      { x: -99.6,  z: -960, speed:  13, color: 0xf4c430, type: 'taxi' },
      { x: -92.4,  z:  -65, speed: -14, color: 0xd93060, type: 'coupe' },
      { x: -92.4,  z: -290, speed: -13, color: 0xe2dde8, type: 'muscle' },
      { x: -92.4,  z: -560, speed: -13, color: 0xf4c430, type: 'taxi' },
      { x: -92.4,  z: -860, speed: -14, color: 0x21e6d1, type: 'convertible' },
      // Downtown Hwy & West Bayside Blvd
      { x: -195.6, z: -120, speed:  15, color: 0xe2dde8, type: 'coupe' },
      { x: -188.4, z: -440, speed: -15, color: 0xff2e88, type: 'muscle' },
      { x: -188.4, z: -880, speed: -14, color: 0x21e6d1, type: 'suv' },
      { x: -291.6, z: -190, speed:  14, color: 0xf4c430, type: 'taxi' },
      { x: -284.4, z: -520, speed: -15, color: 0xff8a2a, type: 'convertible' },
      { x: -284.4, z: -920, speed: -14, color: 0xe2dde8, type: 'coupe' },
      // Little Haiti Ave & Vice Port Expressway
      { x: -387.6, z:   80, speed:  13, color: 0xf4c430, type: 'taxi' },
      { x: -380.4, z: -360, speed: -14, color: 0x34e89e, type: 'muscle' },
      { x: -387.6, z: -760, speed:  13, color: 0xff2e88, type: 'convertible' },
      { x: -483.6, z: -220, speed:  14, color: 0x3b66d8, type: 'suv' },
      { x: -476.4, z: -640, speed: -15, color: 0xe68838, type: 'muscle' }
    ];
    trafficSpecs.forEach((ts) => {
      const tc = createTrafficCar(ts.color, ts.type);
      tc.position.set(ts.x, 0, ts.z);
      const origYaw = ts.speed > 0 ? Math.PI : 0;
      tc.rotation.y = origYaw;
      const maxHp = ts.type === 'suv' ? 135 : 100;
      tc.userData = {
        ...tc.userData,
        speed: ts.speed, baseSpeed: ts.speed, stun: 0, vx: 0, vy: 0, vz: 0,
        spinX: 0, spinZ: 0, wheelSpin: 0,
        carType: ts.type, colorHex: ts.color,
        hp: maxHp, maxHp, vehState: 'ok', burnTimer: 0, wreckTimer: 0, fireTick: 0,
        origX: ts.x, origZ: ts.z, origYaw
      };
      this.scene.add(tc);
      this.traffic.push(tc);
    });

    // Pooled Sparks, Drift Smoke, Vehicle Fire & Explosion Plume Particles (120 sprites)
    const partTex = makeSoftParticleTexture();
    this.particles = [];
    for (let i = 0; i < 120; i++) {
      const mat = new THREE.SpriteMaterial({ map: partTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.visible = false;
      this.scene.add(sp);
      this.particles.push({ sprite: sp, life: 0, maxLife: 1, vx: 0, vy: 0, vz: 0, grow: 1, gravity: 0 });
    }
    this.particleCursor = 0;

    // 10. Interactive Vice City World Items & Iconic Landmarks
    this.buildWorldItems(pinkNeon, cyanNeon, poleMat, maxAniso);
  }

  buildWorldItems(pinkNeon, cyanNeon, poleMat, maxAniso = 4) {
    // A. 40 3D Piles of Cash ($100 Stacked Dollar Bundles across the entire 6x10 Expanded Vice City!)
    const tokenCoords = [
      // Ocean Drive & Beachfront (South Marina to North Mall)
      [0, 265], [0, 95], [0, -28], [4.2, -110], [-3.8, -195], [3.6, -268], [0, -345], [-4.0, -430], [3.5, -515], [0, -585],
      [0, -685], [3.6, -750], [0, -860], [3.6, -1010],
      // Starfish Island & Causeway
      [48, -300], [105, -300], [148, -284], [148, -316],
      // North Vice Key Resort Island & Bridge
      [68, -620], [156, -604], [156, -636],
      // Prawn Island Film Studios & Bridge
      [68, -940], [156, -924], [156, -956],
      // Midtown, Washington Ave & Downtown
      [-48, 260], [-48, -140], [-48, -300], [-96, -75], [-96, -385], [-144, -460], [-192, -300], [-192, -860],
      // West Bayside, Little Haiti, Vice Port & Int'l Airport Runway
      [-288, -180], [-288, -500], [-384, -140], [-384, -460], [-384, -780], [-480, -300], [-190, 114], [-80, 114]
    ];
    tokenCoords.forEach(([x, z], idx) => {
      const cp = createCashPileMesh();
      cp.root.position.set(x, 0.08, z);
      this.scene.add(cp.root);
      this.tokens.push({ mesh: cp.root, pile: cp.pile, ring: cp.ring, badge: cp.badge, x, z, collected: false, phase: idx * 0.7 });
    });

    // A2. 10 Glowing Floating 3D Vice City Weapon Pickups (walk or drive over to instantly equip!)
    const pickupSpecs = [
      { id: 'bat',     x:  11.8, z:  -12, color: 0xffd36b, label: 'BAT' },
      { id: 'pistol',  x:  11.8, z:  -62, color: 0x21e6d1, label: '9MM' },
      { id: 'smg',     x: -11.4, z: -158, color: 0xff2e88, label: 'UZI' },
      { id: 'shotgun', x:  12.0, z: -265, color: 0xff8a2a, label: '12G' },
      { id: 'rifle',   x: 146.0, z: -288, color: 0x34e89e, label: 'M4' },
      { id: 'bazooka', x: -135,  z:  114, color: 0xff465a, label: 'RPG' },
      { id: 'bat',     x:  11.8, z:  252, color: 0xffd36b, label: 'BAT' },
      { id: 'smg',     x: -376,  z: -380, color: 0xff2e88, label: 'UZI' },
      { id: 'rifle',   x: -474,  z: -140, color: 0x34e89e, label: 'M4' },
      { id: 'bazooka', x: 152.0, z: -940, color: 0xff465a, label: 'RPG' }
    ];
    pickupSpecs.forEach((ps, idx) => {
      const wpMesh = createWeaponPickupMesh(ps.id, ps.color, ps.label);
      wpMesh.root.position.set(ps.x, 0.16, ps.z);
      this.scene.add(wpMesh.root);
      this.weaponPickups.push({ ...ps, ...wpMesh, phase: idx * 1.1, cooldown: 0 });
    });

    // B. 14 Neon-Edged Asphalt Stunt Jump Ramps (including South Airport, Prawn Island, Little Haiti & Vice Port!)
    const rampShape = new THREE.Shape();
    rampShape.moveTo(0, 0);
    rampShape.lineTo(10.5, 0);
    rampShape.lineTo(10.5, 2.35);
    rampShape.closePath();
    const rampGeo = new THREE.ExtrudeGeometry(rampShape, { depth: 4.8, bevelEnabled: false });
    rampGeo.translate(-5.25, 0, -2.4);
    rampGeo.rotateY(Math.PI / 2); // High end at -Z (heading north), entry at +Z
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x2c2a38, roughness: 0.72, metalness: 0.18 });
    const railStripGeo = new THREE.BoxGeometry(0.18, 0.18, 10.6);

    const rampSpecs = [
      { x: 4.0,   z:  255, yaw: 0,           name: 'South Marina Launch' },
      { x: 4.0,   z: -168, yaw: 0,           name: 'Ocean Beach Launch' },
      { x: 4.0,   z: -485, yaw: 0,           name: 'Vice Point Flyover' },
      { x: 4.0,   z: -860, yaw: 0,           name: 'North Beach Sky Jump' },
      { x: 64.0,  z: -296.0, yaw: -Math.PI / 2, name: 'Starfish Causeway Leap' },
      { x: 64.0,  z: -616.0, yaw: -Math.PI / 2, name: 'Vice Key Island Launch' },
      { x: 64.0,  z: -936.0, yaw: -Math.PI / 2, name: 'Prawn Studios Stunt Leap' },
      { x: -92.0, z: -175, yaw: 0,           name: 'Washington Ave Boost' },
      { x: -188,  z: -360, yaw: 0,           name: 'Downtown Skyway Jump' },
      { x: -48,   z: -460, yaw: Math.PI / 2, name: 'Midtown Cross Jump' },
      { x: -380,  z: -320, yaw: 0,           name: 'Little Haiti Air Jump' },
      { x: -476,  z: -460, yaw: 0,           name: 'Vice Port Dock Leap' },
      { x: -102,  z:  114, yaw: Math.PI / 2, name: 'Airport Runway Jump West' },
      { x: -206,  z:  114, yaw: -Math.PI / 2, name: 'Airport Runway Jump East' }
    ];
    rampSpecs.forEach((rs) => {
      const rg = new THREE.Group();
      rg.add(new THREE.Mesh(rampGeo, rampMat));
      for (const sx of [-2.42, 2.42]) {
        const rail = new THREE.Mesh(railStripGeo, sx < 0 ? pinkNeon : cyanNeon);
        rail.position.set(sx, 1.25, 0);
        rail.rotation.x = Math.atan2(2.35, 10.5);
        rg.add(rail);
      }
      rg.position.set(rs.x, 0.02, rs.z);
      rg.rotation.y = rs.yaw;
      this.scene.add(rg);
      this.ramps.push({ ...rs, fx: -Math.sin(rs.yaw), fz: -Math.cos(rs.yaw), rx: Math.cos(rs.yaw), rz: -Math.sin(rs.yaw), cooldown: 0 });
    });

    // C. 16 Glowing Cyan Nitro Boost Pads (Instant free Turbo Surge!)
    const padC = document.createElement('canvas');
    padC.width = 128; padC.height = 256;
    const pctx = padC.getContext('2d');
    pctx.fillStyle = '#071422'; pctx.fillRect(0, 0, 128, 256);
    pctx.strokeStyle = '#21E6D1'; pctx.lineWidth = 10;
    for (let cy = 48; cy <= 220; cy += 56) {
      pctx.beginPath(); pctx.moveTo(22, cy + 20); pctx.lineTo(64, cy - 16); pctx.lineTo(106, cy + 20); pctx.stroke();
    }
    pctx.strokeStyle = '#FF2E88'; pctx.lineWidth = 6; pctx.strokeRect(4, 4, 120, 248);
    const padTex = new THREE.CanvasTexture(padC);
    padTex.colorSpace = THREE.SRGBColorSpace;
    const padGeo = new THREE.PlaneGeometry(3.8, 7.6);
    padGeo.rotateX(-Math.PI / 2);
    const padMat = new THREE.MeshBasicMaterial({
      map: padTex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    });
    [
      [3.6, 225, 0], [3.6, -42, 0], [3.6, -245, 0], [3.6, -415, 0], [3.6, -560, 0], [3.6, -710, 0], [3.6, -985, 0],
      [36, -300, -Math.PI / 2], [96, -300, -Math.PI / 2], [68, -620, -Math.PI / 2], [68, -940, -Math.PI / 2],
      [-92.4, -270, 0], [-188.4, -220, 0], [-380.4, -520, 0], [-476.4, -260, 0], [-152, 114, -Math.PI / 2]
    ].forEach(([x, z, yaw]) => {
      const m = new THREE.Mesh(padGeo, padMat);
      m.position.set(x, 0.04, z);
      m.rotation.y = yaw;
      this.scene.add(m);
      this.boostPads.push({ x, z, cooldown: 0 });
    });

    // D. 28 Knockable Reflective Traffic Cones & 14 Bouncy Beach Balls (Dynamic Physics!)
    const coneBodyG = new THREE.ConeGeometry(0.24, 0.72, 10); coneBodyG.translate(0, 0.36, 0);
    const coneBaseG = new THREE.BoxGeometry(0.52, 0.06, 0.52); coneBaseG.translate(0, 0.03, 0);
    const coneGeo = mergeGeometries([coneBodyG, coneBaseG]);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.48, emissive: 0x661a00, emissiveIntensity: 0.22 });
    const coneSpots = [
      [8.2, -16], [8.2, -20], [8.2, -24], [-8.2, -55], [-8.2, -59],
      [8.2, -130], [8.2, -134], [-8.2, -148], [-8.2, -152],
      [8.2, -286], [8.2, -290], [8.2, -310], [8.2, -314],
      [-8.2, -356], [-8.2, -360], [8.2, -450], [8.2, -454],
      [8.2, -590], [-8.2, -590],
      [-87.8, -132], [-87.8, -136], [-104.2, -292], [-104.2, -296],
      [-87.8, -454], [-104.2, -520], [134, -292], [134, -308], [142, -314]
    ];
    coneSpots.forEach(([x, z]) => {
      const m = new THREE.Mesh(coneGeo, coneMat);
      m.position.set(x, 0.02, z);
      this.scene.add(m);
      this.knockables.push({ mesh: m, type: 'cone', x, y: 0.02, z, homeX: x, homeZ: z, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, active: false, resetTimer: 0 });
    });

    const ballGeo = new THREE.SphereGeometry(0.44, 12, 10);
    const ballCols = [0xff2e88, 0x21e6d1, 0xffd36b, 0xff7b2e];
    const ballMats = ballCols.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.34, metalness: 0.08 }));
    for (let i = 0; i < 14; i++) {
      const x = 14.2 + (i % 2) * 1.4;
      const z = -18 - i * 42;
      if (Math.abs(z + 300) < 16) continue;
      const m = new THREE.Mesh(ballGeo, ballMats[i % ballMats.length]);
      m.position.set(x, 0.44, z);
      this.scene.add(m);
      this.knockables.push({ mesh: m, type: 'ball', x, y: 0.44, z, homeX: x, homeZ: z, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, active: false, resetTimer: 0 });
    }

    // E. Instanced Miami Surfboard Racks (10 beach racks -> 2 InstancedMeshes!)
    const rackPositions = [];
    for (let z = -34; z >= -574; z -= 60) {
      if (Math.abs(z + 300) < 24) continue;
      rackPositions.push([17.2, z]);
    }
    const rPostL = new THREE.BoxGeometry(0.14, 1.4, 0.14); rPostL.translate(-1.1, 0.7, 0);
    const rPostR = new THREE.BoxGeometry(0.14, 1.4, 0.14); rPostR.translate(1.1, 0.7, 0);
    const rBar = new THREE.BoxGeometry(2.4, 0.12, 0.14); rBar.translate(0, 1.15, 0);
    const rackWoodGeo = mergeGeometries([rPostL, rPostR, rBar]);
    const rackWoodMat = new THREE.MeshStandardMaterial({ color: 0xb07c4f, roughness: 0.84 });
    const rackInst = new THREE.InstancedMesh(rackWoodGeo, rackWoodMat, rackPositions.length);

    const sbGeo = new THREE.BoxGeometry(0.46, 2.05, 0.08); sbGeo.translate(0, 1.05, 0);
    const sbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.12 });
    const sbInst = new THREE.InstancedMesh(sbGeo, sbMat, rackPositions.length * 3);
    const sbPalette = [new THREE.Color(0xff2e88), new THREE.Color(0x21e6d1), new THREE.Color(0xffd36b), new THREE.Color(0xff7b2e)];
    let sbIdx = 0;
    rackPositions.forEach(([x, z], i) => {
      _dummy.position.set(x, 0.08, z); _dummy.rotation.set(0, Math.PI / 2, 0); _dummy.scale.set(1, 1, 1); _dummy.updateMatrix();
      rackInst.setMatrixAt(i, _dummy.matrix);
      for (let b = -1; b <= 1; b++) {
        _dummy.position.set(x, 0.08, z + b * 0.65); _dummy.rotation.set(0.14, Math.PI / 2, 0.05 * b); _dummy.updateMatrix();
        sbInst.setMatrixAt(sbIdx, _dummy.matrix);
        sbInst.setColorAt(sbIdx, sbPalette[(i + b + 3) % sbPalette.length]);
        sbIdx++;
      }
    });
    rackInst.instanceMatrix.needsUpdate = true;
    sbInst.instanceMatrix.needsUpdate = true;
    if (sbInst.instanceColor) sbInst.instanceColor.needsUpdate = true;
    this.scene.add(rackInst, sbInst);

    // F. Instanced Retro 1986 Payphone Booths on Hotel Corners (2 InstancedMeshes!)
    const phoneSpots = [
      [-11.2, -32], [-11.2, -124], [-11.2, -210], [-11.2, -330], [-11.2, -445], [-11.2, -565],
      [-84.8, -60], [-84.8, -195], [-84.8, -340], [-84.8, -490], [-107.2, -260], [-107.2, -410]
    ];
    const pbBase = new THREE.BoxGeometry(0.95, 2.35, 0.95); pbBase.translate(0, 1.18, 0);
    const pbCap = new THREE.BoxGeometry(1.04, 0.24, 1.04); pbCap.translate(0, 2.42, 0);
    const pbBodyInst = new THREE.InstancedMesh(pbBase, new THREE.MeshStandardMaterial({ color: 0x26354a, metalness: 0.45, roughness: 0.35 }), phoneSpots.length);
    const pbGlowInst = new THREE.InstancedMesh(pbCap, cyanNeon, phoneSpots.length);
    phoneSpots.forEach(([x, z], i) => {
      _dummy.position.set(x, 0.16, z); _dummy.rotation.set(0, 0, 0); _dummy.scale.set(1, 1, 1); _dummy.updateMatrix();
      pbBodyInst.setMatrixAt(i, _dummy.matrix);
      pbGlowInst.setMatrixAt(i, _dummy.matrix);
      this.addCircleCollider(x, z, 0.56);
    });
    pbBodyInst.instanceMatrix.needsUpdate = true;
    pbGlowInst.instanceMatrix.needsUpdate = true;
    this.scene.add(pbBodyInst, pbGlowInst);

    // G. 4 Valet-Parked Classic Coupes Outside Beachfront Hotels
    [[-10.2, -16, 0x21e6d1], [-10.2, -168, 0xffd36b], [-10.2, -336, 0xff2e88], [-10.2, -502, 0xe2dde8]].forEach(([x, z, col]) => {
      const pc = createTrafficCar(col);
      pc.position.set(x, 0.16, z);
      pc.rotation.y = 0.08;
      this.scene.add(pc);
      this.addBoxCollider(x - 1.1, x + 1.1, z - 2.3, z + 2.3);
    });

    // H. Patrol Helicopter Circling Downtown & Starfish Island
    const heli = new THREE.Group();
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 4.8), new THREE.MeshStandardMaterial({ color: 0x1b2338, metalness: 0.55, roughness: 0.28 }));
    const hCanopy = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), new THREE.MeshStandardMaterial({ color: 0x21e6d1, metalness: 0.4, roughness: 0.12 }));
    hCanopy.scale.set(0.95, 0.72, 1.15); hCanopy.position.set(0, 0.1, -1.8);
    const hTail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.48, 4.6), new THREE.MeshStandardMaterial({ color: 0x26324d, metalness: 0.5, roughness: 0.35 }));
    hTail.position.set(0, 0.2, 4.2);
    const hFin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.3, 0.9), pinkNeon);
    hFin.position.set(0, 0.6, 6.2);
    const rotorHub = new THREE.Group(); rotorHub.position.set(0, 1.15, 0);
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.07, 0.32), poleMat);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 9.2), poleMat);
    rotorHub.add(blade1, blade2);
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.18), poleMat);
    tailRotor.position.set(0.32, 0.5, 6.3);
    heli.add(hBody, hCanopy, hTail, hFin, rotorHub, tailRotor);
    heli.position.set(-45, 36, -240);
    this.scene.add(heli);
    this.heli = { group: heli, rotorHub, tailRotor };

    // I. Gold Neon Material (Ferris Wheel is now integrated into the Vice Pier Carnival Fair!)
    const goldNeon = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xffb84d, emissiveIntensity: 1.5 });

    // J. Two Lush Midtown Tropical Fountain Plazas (with solid basin colliders!)
    [[-48, -60], [-48, -380]].forEach(([fx, fz]) => {
      const fp = createFountainPlaza(cyanNeon);
      fp.group.position.set(fx, 0.16, fz);
      this.scene.add(fp.group);
      this.fountains.push({ group: fp.group, jet: fp.jet, x: fx, z: fz });
      this.addCircleCollider(fx, fz, 6.5);
    });

    // K. Beachfront Vice Tiki Bar Cabana & Beach Volleyball Court
    const tiki = createTikiBeachBar(pinkNeon, cyanNeon, maxAniso);
    tiki.position.set(23.5, -0.18, -254);
    this.scene.add(tiki);

    const vball = createVolleyballCourt();
    vball.position.set(24.8, -0.16, -124);
    this.scene.add(vball);

    // L. 3 Overhead Neon District Gateway Arches (VICE POINT, DOWNTOWN VICE, LITTLE HAVANA)
    const arches = [
      { x: 0,   z: -332, title: 'VICE POINT',    sub: 'OCEAN DRIVE NORTH · SHOWROOM 04', hex: '#21E6D1', mat: cyanNeon },
      { x: -96, z: -168, title: 'DOWNTOWN VICE', sub: 'WASHINGTON AVE · SHOWROOM 03',    hex: '#FF8A2A', mat: goldNeon },
      { x: -96, z: -488, title: 'LITTLE HAVANA', sub: 'ART DISTRICT · SHOWROOM 05',      hex: '#FFD36B', mat: pinkNeon }
    ];
    arches.forEach((ar) => {
      const mesh = createDistrictArch(ar.title, ar.sub, ar.hex, poleMat, ar.mat, maxAniso);
      mesh.position.set(ar.x, 0, ar.z);
      this.scene.add(mesh);
      this.addBoxCollider(ar.x - 10.0, ar.x - 8.8, ar.z - 0.65, ar.z + 0.65);
      this.addBoxCollider(ar.x + 8.8,  ar.x + 10.0, ar.z - 0.65, ar.z + 0.65);
    });

    // M. 2 Bobbing Marina Speedboats flanking the Vice Pier Carnival Boardwalk (Z = -430)
    const boatWhite = new THREE.MeshStandardMaterial({ color: 0xf7f4fa, roughness: 0.28, metalness: 0.22 });
    const boatStripe = new THREE.MeshStandardMaterial({ color: 0xff2e88, roughness: 0.35 });
    [
      { x: 56, z: -402, yaw: 0.4, phase: 0 },
      { x: 64, z: -458, yaw: -0.6, phase: 2.1 }
    ].forEach((bs) => {
      const bg = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 7.2), boatWhite); hull.position.y = 0.4;
      const bow = new THREE.Mesh(new THREE.ConeGeometry(1.32, 2.2, 4), boatWhite); bow.rotation.x = -Math.PI / 2; bow.rotation.z = Math.PI / 4; bow.position.set(0, 0.4, -4.6);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.22, 6.8), boatStripe); stripe.position.y = 0.52;
      const wind = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 1.4), new THREE.MeshStandardMaterial({ color: 0x16263a, metalness: 0.6, roughness: 0.15 })); wind.position.set(0, 1.05, -0.6);
      bg.add(hull, bow, stripe, wind);
      bg.position.set(bs.x, -0.42, bs.z);
      bg.rotation.y = bs.yaw;
      this.scene.add(bg);
      this.speedboats.push({ group: bg, baseZ: bs.z, phase: bs.phase });
    });

    // N. Glowing Neon Under-Bridge Reflection Strips on Starfish Causeway
    const underBridgeGlow = new THREE.Mesh(new THREE.BoxGeometry(118, 0.18, 15.6), cyanNeon);
    underBridgeGlow.position.set(69.4, -0.92, -300);
    this.scene.add(underBridgeGlow);

    // O. Rooftop Illuminated Neon Billboards on Key City Skyline Towers
    [
      { x: -24.5, y: 27.2, z: -190, rotY: Math.PI / 2, title: 'VICE RADIO 86.5', sub: 'SYNTHWAVE ALL NIGHT', hex: '#FF2E88' },
      { x: -64,   y: 41.5, z: -220, rotY: Math.PI / 2, title: 'OCEAN DRIVE',     sub: 'GOLDEN HOUR TOUR',    hex: '#21E6D1' }
    ].forEach((bb) => {
      const bTex = makeNeonSignTexture(bb.title, bb.sub, bb.hex, maxAniso, false);
      const bMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 3.2),
        new THREE.MeshStandardMaterial({ map: bTex, emissive: 0xffffff, emissiveMap: bTex, emissiveIntensity: 0.92, side: THREE.DoubleSide })
      );
      bMesh.position.set(bb.x, bb.y, bb.z);
      bMesh.rotation.y = bb.rotY;
      this.scene.add(bMesh);
    });
  }

  buildPedestrians() {
    this.pedestrians = [];
    const sharedGeos = {
      torso: new THREE.BoxGeometry(0.38, 0.56, 0.22),
      tee: new THREE.BoxGeometry(0.16, 0.44, 0.03),
      head: new THREE.SphereGeometry(0.13, 10, 10),
      hair: new THREE.SphereGeometry(0.138, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58),
      shades: new THREE.BoxGeometry(0.20, 0.055, 0.05),
      arm: new THREE.CylinderGeometry(0.052, 0.044, 0.46, 8),
      hand: new THREE.SphereGeometry(0.046, 6, 6),
      leg: new THREE.CylinderGeometry(0.068, 0.052, 0.78, 8),
      shoe: new THREE.BoxGeometry(0.11, 0.08, 0.22),
      shadow: new THREE.PlaneGeometry(0.86, 0.86),
      splat: new THREE.PlaneGeometry(1.7, 1.7),
      star: new THREE.OctahedronGeometry(0.09, 0)
    };
    const splatMat = new THREE.MeshBasicMaterial({
      map: makeSplatDecalTexture(), transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
    });
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffd84a });

    const skins = [0xf2c29b, 0xd89d72, 0x9b6543, 0xe8b48e, 0x6f452c];
    const shirts = [0x21d6c4, 0xff4c96, 0xf2eef8, 0xffa64d, 0x5282ff, 0xffe074, 0xd83254, 0x2e2a48];
    const bikiniColors = [0xff2e88, 0x21e6d1, 0xffd36b, 0xff7b2e, 0xf7f4fa, 0x9b5de5, 0xff4d6d];
    const pants = [0xe8e4f0, 0x1e2236, 0x2c3e5a, 0x45354e, 0x191722, 0xc8b698];
    const hairs = [0x1b151e, 0x4c3020, 0xd8a852, 0x2a1d19, 0x7c3e26];

    const pedMatCache = new Map();
    const pedMats = {
      get: (key, make) => {
        let m = pedMatCache.get(key);
        if (!m) { m = make(); pedMatCache.set(key, m); }
        return m;
      }
    };

    this._pedSharedGeos = sharedGeos;
    this._pedSplatMat = splatMat;
    this._pedStarMat = starMat;
    this._pedMats = pedMats;
    const pedShadowGeo = new THREE.PlaneGeometry(0.92, 0.92);
    pedShadowGeo.rotateX(-Math.PI / 2);
    const pedShadowMat = getContactShadowMat();

    const addPed = (x, y, z, dir, jog, i, axis = 'z', minPos = -775, maxPos = 185, bikini = false) => {
      const p = createPedestrian({
        x, y, z, dir, jog, axis, minPos, maxPos, bikini,
        speed: dir === 0 ? 0 : (jog ? 3.5 : (bikini ? 1.42 : 1.45) + (i % 4) * 0.22),
        phase: i * 1.15,
        scale: bikini ? 0.93 + (i % 3) * 0.035 : 0.95 + (i % 4) * 0.045,
        skin: skins[i % skins.length],
        shirt: bikini ? bikiniColors[i % bikiniColors.length] : shirts[(i * 3) % shirts.length],
        pants: pants[(i * 2) % pants.length],
        hair: hairs[(i * 5) % hairs.length],
        shoe: i % 2 === 0 ? 0xf2eff6 : 0x1b1824,
        blazer: !bikini && !jog && i % 3 === 0,
        shades: bikini || i % 2 === 0
      }, sharedGeos, splatMat, starMat, pedMats);
      const prof = NPC_PROFILES[i % NPC_PROFILES.length];
      p.name = prof.name;
      p.role = prof.role;
      p.profileIdx = i % NPC_PROFILES.length;
      p.fighter = !bikini || (i % 3 === 0); // ~75% of Vice City citizens fight back when punched!
      p.provoked = false;
      p.attackTimer = 0;
      p.attackCooldown = 0;
      p.hitDealt = false;
      p.tipGiven = false;
      const sh = new THREE.Mesh(pedShadowGeo, pedShadowMat);
      sh.position.y = 0.015;
      p.root.add(sh);
      p.root.position.set(p.x, p.y, p.z);
      p.root.rotation.y = axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
      this.scene.add(p.root);
      this.pedestrians.push(p);
      return p;
    };
    this._addPed = addPed;

    // 48 Ocean Drive East Promenade Walkers & Sculpted Miami Beach Bikini Strollers (Z = +340 to -1090!)
    for (let i = 0; i < 48; i++) {
      const isBikini = (i % 2 === 0);
      addPed(10.5 + (i % 4) * 0.95, 0.16, 330 - i * 30, i % 2 === 0 ? -1 : 1, !isBikini && i % 5 === 0, i, 'z', -1095, 345, isBikini);
    }
    // 24 Ocean Drive West Hotel Sidewalk Walkers
    for (let i = 0; i < 24; i++) {
      const isBikini = (i % 3 === 0);
      addPed(-10.4 - (i % 2) * 0.9, 0.16, 310 - i * 58, i % 2 === 0 ? -1 : 1, false, i + 45, 'z', -1095, 330, isBikini);
    }
    // 18 Dedicated Vice Beach Sand & Boardwalk Bikini Strollers
    for (let i = 0; i < 18; i++) {
      addPed(18.6 + (i % 3) * 1.65, 0.04, 300 - i * 76, i % 2 === 0 ? -1 : 1, false, i + 110, 'z', -1060, 325, true);
    }
    // 16 Street & Crosswalk Crossers
    const crossSpots = [
      { z: 250, ax: 0 }, { z: -32, ax: 0 }, { z: -56, ax: 0 }, { z: -133, ax: 0 }, { z: -147, ax: 0 },
      { z: -215, ax: 0 }, { z: -293, ax: 0 }, { z: -307, ax: 0 }, { z: -453, ax: 0 },
      { z: -467, ax: 0 }, { z: -550, ax: 0 }, { z: -855, ax: 0 }, { z: -133, ax: -96 }, { z: -293, ax: -96 },
      { z: -380, ax: -384 }, { z: -300, ax: 146 }
    ];
    crossSpots.forEach((cs, i) => {
      const startX = cs.ax + (i % 2 === 0 ? -5.5 : 5.5);
      addPed(startX, 0.01, cs.z, i % 2 === 0 ? 1 : -1, false, i + 70, 'x', cs.ax - 9.5, cs.ax + 9.5, cs.ax === 0 && i % 3 === 0);
    });
    // 26 Washington Ave, West Bayside, Little Haiti & Vice Port Sidewalk Walkers
    for (let i = 0; i < 26; i++) {
      const ax = i < 8 ? (i % 2 === 0 ? -85.4 : -106.6)
        : (i < 16 ? (i % 2 === 0 ? -277.4 : -202.6)
        : (i < 22 ? (i % 2 === 0 ? -373.4 : -394.6) : -469.4));
      addPed(ax, 0.16, 220 - (i % 10) * 125, i % 3 === 0 ? 1 : -1, i % 4 === 0, i + 90, 'z', -1080, 310, false);
    }
    // 18 Starfish Island, Vice Key Resort & Prawn Island Film Studio Strollers
    for (let i = 0; i < 6; i++) addPed(142 + i * 3.2, 0.04, -314 + (i % 3) * 14, i % 2 === 0 ? 1 : -1, false, i + 130, 'z', -320, -280, i % 2 === 0);
    for (let i = 0; i < 6; i++) addPed(146 + i * 3.2, 0.04, -634 + (i % 3) * 14, i % 2 === 0 ? 1 : -1, false, i + 140, 'z', -640, -600, true);
    for (let i = 0; i < 6; i++) addPed(150 + i * 3.5, 0.04, -954 + (i % 3) * 14, i % 2 === 0 ? 1 : -1, false, i + 146, 'z', -966, -914, i % 3 === 0);
    // 12 Vice Pier Carnival Fair Visitors Strolling the Midway Boardwalk!
    for (let i = 0; i < 12; i++) {
      addPed(26 + i * 6.8, 0.16, -427.5 + (i % 3) * 2.8, i % 2 === 0 ? 1 : -1, false, i + 150, 'x', 22, 108, i % 2 === 0);
    }
    // 6 Vice Int'l Airport Concourse Travelers & Ground Crew
    for (let i = 0; i < 6; i++) {
      addPed(-138 + i * 12, 0.04, 57 + (i % 2) * 3.5, i % 2 === 0 ? 1 : -1, false, i + 170, 'x', -142, -74, false);
    }
  }

  spawnParticle(x, y, z, vx, vy, vz, colorHex, size, life, grow, gravity = 0) {
    const p = this.particles[this.particleCursor];
    this.particleCursor = (this.particleCursor + 1) % this.particles.length;
    p.sprite.position.set(x, y, z);
    p.sprite.scale.set(size, size, 1);
    p.sprite.material.color.setHex(colorHex);
    p.sprite.material.opacity = 0.72;
    p.sprite.visible = true;
    p.vx = vx; p.vy = vy; p.vz = vz;
    p.life = life; p.maxLife = life; p.grow = grow; p.gravity = gravity;
  }

  triggerSquish(ped, hitSpeed, latOffset) {
    const cs = this.carState;
    const fwdX = -Math.sin(cs.yaw);
    const fwdZ = -Math.cos(cs.yaw);
    const rightX = Math.cos(cs.yaw);
    const rightZ = -Math.sin(cs.yaw);
    const dirSign = cs.speed >= 0 ? 1 : -1;

    this.squishCount += 1;
    this.streakCount += 1;
    this.streakTimer = 4.5;
    const reward = 100 * Math.min(this.streakCount, 5);
    this.cash += reward;
    this.wantedStars = Math.min(5, Math.max(this.wantedStars, Math.ceil(this.squishCount / 2)));
    this.wantedDecay = 14.0;
    this.camShake = Math.max(this.camShake, 0.24);
    this.audio.squish();
    this.updateWantedHUD(reward);

    // Arcade cash/star burst particles
    for (let k = 0; k < 10; k++) {
      this.spawnParticle(
        ped.x, ped.y + 0.8, ped.z,
        (Math.random() - 0.5) * 7 + fwdX * hitSpeed * 0.25,
        3.0 + Math.random() * 4.5,
        (Math.random() - 0.5) * 7 + fwdZ * hitSpeed * 0.25,
        k % 2 === 0 ? 0x34e89e : 0xffd36b,
        0.55, 0.85, 0.4, 9.8
      );
    }

    if (hitSpeed > 22 && Math.abs(latOffset) > 0.45) {
      // High-speed bumper clip -> dramatic GTA ragdoll launch!
      ped.state = 'ragdoll';
      ped.stateTimer = 9.0;
      const sidePush = latOffset >= 0 ? 1 : -1;
      ped.vx = fwdX * dirSign * Math.min(hitSpeed * 0.65, 22) + rightX * sidePush * 6.5;
      ped.vz = fwdZ * dirSign * Math.min(hitSpeed * 0.65, 22) + rightZ * sidePush * 6.5;
      ped.vy = 7.5 + Math.min(hitSpeed * 0.16, 6.5);
      ped.spinX = 9.5;
      ped.spinZ = sidePush * 7.2;
      ped.splat.visible = false;
      ped.stars.visible = false;
    } else {
      // Direct GTA run-over -> instant cartoon pancake squish!
      ped.state = 'squished';
      ped.stateTimer = 9.0;
      ped.vx = 0; ped.vy = 0; ped.vz = 0;
      ped.body.scale.set(1.42, 0.08, 1.42);
      ped.body.rotation.set(Math.PI / 2, 0, (Math.random() - 0.5) * 1.4);
      ped.body.position.set(0, 0.07, 0);
      ped.armL.rotation.set(0, 0, -1.2);
      ped.armR.rotation.set(0, 0, 1.2);
      ped.legL.rotation.set(0, 0, -0.35);
      ped.legR.rotation.set(0, 0, 0.35);
      ped.splat.visible = true;
      ped.stars.visible = true;
    }

    // Panic nearby pedestrians within 18m so they run away!
    for (let j = 0; j < this.pedestrians.length; j++) {
      const other = this.pedestrians[j];
      if (other !== ped && (other.state === 'walk' || other.state === 'panic')) {
        if (Math.hypot(other.x - ped.x, other.z - ped.z) < 18) {
          other.state = 'panic';
          other.stateTimer = 4.5;
        }
      }
    }
  }

  updateWantedHUD(reward = 0) {
    this.el.wanted.classList.toggle('active', this.wantedStars > 0);
    this.el.stars.forEach((s, i) => s.classList.toggle('lit', i < this.wantedStars));
    this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
    if (reward > 0) {
      const label = this.streakCount > 1 ? `SQUISH x${this.streakCount}!` : 'SQUISH!';
      this.el.combo.innerHTML = `${label} <span>+$${reward}</span>`;
      this.el.combo.classList.add('on');
    }
  }

  // ROCK-SOLID 3-POINT ORIENTED CAR HULL COLLISION SOLVER (2 PASSES — ZERO CLIPPING!)
  resolveWorldCollisions() {
    const cs = this.carState;
    const fwdX = -Math.sin(cs.yaw);
    const fwdZ = -Math.cos(cs.yaw);
    const hullOffsets = [1.42, 0.0, -1.42]; // Front bumper, chassis center, rear bumper
    const hullR = 1.06;
    let totalPush = 0;

    for (let pass = 0; pass < 2; pass++) {
      // 1. Expanded World Perimeter Bounds (South Marina, Vice Port, North Mall & Roadable Mount Vice!)
      if (cs.x < -495.5) { cs.x = -495.5; totalPush += 0.5; }
      if (cs.z > 364) { cs.z = 364; totalPush += 0.5; }
      if (cs.z < -1478) { cs.z = -1478; totalPush += 0.5; }
      if (cs.z < -1115 && cs.x > 40) { cs.x = 40; totalPush += 0.5; }

      // 2. East Ocean Islands Water Perimeter (Starfish -300, Vice Key -620 & Prawn Island -940; Carnival Pier -430 is open!)
      if (cs.x > 126 && Math.abs(cs.z + 430) > 19.0) {
        const isPrawn = cs.z < -780;
        const isViceKey = !isPrawn && cs.z < -460;
        const icx = isPrawn ? 164 : (isViceKey ? 156 : 152);
        const icz = isPrawn ? -940 : (isViceKey ? -620 : -300);
        const iRad = isPrawn ? 38.5 : (isViceKey ? 33.5 : 31.5);
        const distI = Math.hypot(cs.x - icx, cs.z - icz);
        if (distI > iRad) {
          const nx = (cs.x - icx) / distI;
          const nz = (cs.z - icz) / distI;
          const over = distI - iRad;
          cs.x -= nx * over;
          cs.z -= nz * over;
          totalPush += over;
        }
      }

      // 3. Test all 3 hull spheres against every solid AABB (Buildings, Showrooms, Bridge Rails, Seawall, Arch)
      for (let h = 0; h < hullOffsets.length; h++) {
        const off = hullOffsets[h];
        const px = cs.x + fwdX * off;
        const pz = cs.z + fwdZ * off;

        for (let i = 0; i < this.boxColliders.length; i++) {
          const b = this.boxColliders[i];
          const cx = THREE.MathUtils.clamp(px, b.minX, b.maxX);
          const cz = THREE.MathUtils.clamp(pz, b.minZ, b.maxZ);
          const dx = px - cx;
          const dz = pz - cz;
          const distSq = dx * dx + dz * dz;
          if (distSq < hullR * hullR) {
            if (distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const push = hullR - dist;
              cs.x += (dx / dist) * push;
              cs.z += (dz / dist) * push;
              totalPush += push;
            } else {
              // Deep inside fallback -> push to closest face
              const pL = px - b.minX, pR = b.maxX - px, pT = pz - b.minZ, pB = b.maxZ - pz;
              const m = Math.min(pL, pR, pT, pB);
              if (m === pL) cs.x -= pL + hullR;
              else if (m === pR) cs.x += pR + hullR;
              else if (m === pT) cs.z -= pT + hullR;
              else cs.z += pB + hullR;
              totalPush += m + hullR;
            }
          }
        }

        // 4. Test all 3 hull spheres against every solid Cylinder/Circle Prop (Palm Trunks, Lamps, Poles, Hydrants, Lighthouse)
        for (let i = 0; i < this.circleColliders.length; i++) {
          const c = this.circleColliders[i];
          const dx = px - c.x;
          const dz = pz - c.z;
          const minD = hullR + c.r;
          const dSq = dx * dx + dz * dz;
          if (dSq < minD * minD && dSq > 0.00001) {
            const d = Math.sqrt(dSq);
            const push = minD - d;
            cs.x += (dx / d) * push;
            cs.z += (dz / d) * push;
            totalPush += push;
          }
        }
      }
    }

    if (totalPush > 0.02) {
      const impactSpd = Math.abs(cs.speed);
      if (impactSpd > 9 && this.impactCooldown <= 0) {
        this.impactCooldown = 0.25;
        this.camShake = Math.min(0.42, impactSpd * 0.01);
        this.audio.impact(Math.min(1, impactSpd / 40));
        for (let k = 0; k < 6; k++) {
          this.spawnParticle(
            cs.x + fwdX * 1.8, 0.55, cs.z + fwdZ * 1.8,
            (Math.random() - 0.5) * 6, 2.0 + Math.random() * 3.0, (Math.random() - 0.5) * 6,
            0xffb44c, 0.36, 0.42, 0.2, 9.8
          );
        }
      }
      // Realistic wall-slide / bounce damping
      cs.speed *= totalPush > 0.45 ? -0.22 : 0.72;
    }
  }

  cancelAutopilot() {
    this.autopilotQueue = [];
    this.autopilotPath = [];
    this.autopilotTarget = null;
    this.autopilotStuckTimer = 0;
    this.autopilotReverseTimer = 0;
    this.lastAutoDist = -1;
    this.lastNavKey = '';
    if (this.navBeacon) this.navBeacon.group.visible = false;
    if (this.navArrow) this.navArrow.visible = false;
    if (this.el && this.el.autoBar) this.el.autoBar.classList.remove('on');
    if (this.el && this.el.navBar) this.el.navBar.classList.remove('on');
    if (this.el && this.el.lampAuto) this.el.lampAuto.classList.remove('on-auto');
  }

  fastTravelTo(wp) {
    if (!wp) return;
    this.started = true;
    this.el.startOv.hidden = true;
    this.closeNpcDialogue();
    this.closeMiniGameHub();
    if (this.mode === 'ride') this.exitPierRide();
    if (this.mode === 'plane' && this.activePlane) {
      this.activePlane.resetTimer = 0.2;
      this.activePlane = null;
    }
    if (this.mode !== 'car') this.setMode('car');
    this.cancelAutopilot();
    this.carState.x = wp.x;
    this.carState.z = wp.z;
    const mvHit = wp.z < -1104 ? closestMountainRoad(wp.x, wp.z) : null;
    this.carState.y = getTerrainHeight(wp.x, wp.z) + (mvHit && mvHit.dist < 7.2 ? 0.08 : 0);
    this.carState.vy = 0;
    this.carState.airborne = false;
    this.carState.yaw = wp.yaw || 0;
    this.carState.speed = 0;
    this.snapCameraNext = true;
    const vehMesh = this.activeVehicle ? this.activeVehicle.mesh : this.car.root;
    vehMesh.position.set(wp.x, this.carState.y, wp.z);
    vehMesh.rotation.y = this.carState.yaw;
    this.drawRadar();
    this.audio.pickup();
    this.el.combo.innerHTML = `ARRIVED · ${wp.label} <span>GPS</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.4;
  }

  syncReticleVisibility() {
    if (!this.el || !this.el.crosshair) return;
    const playing = this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.activeDialogue && this.mode !== 'ride' && this.wastedTimer <= 0;
    const armed = this.mode === 'foot' && this.weapon !== 'fists' && this.weapon !== 'bat';
    this.el.crosshair.classList.toggle('look-on', playing);
    this.el.crosshair.classList.toggle('on', playing && armed);
    this.el.crosshair.classList.toggle('locked', playing && this.pointerLocked);
    if (this.el.mount) this.el.mount.classList.toggle('armed', playing && armed);
  }

  releasePointerLock() {
    try {
      if (document.pointerLockElement) document.exitPointerLock();
    } catch (_) {}
    this.pointerLocked = false;
    this.syncReticleVisibility();
  }

  requestPointerLockSafe() {
    if (!this.el || !this.el.mount || typeof this.el.mount.requestPointerLock !== 'function') return;
    try {
      const res = this.el.mount.requestPointerLock();
      if (res && typeof res.catch === 'function') res.catch(() => {});
    } catch (_) {}
  }

  flashLockTip() {
    if (!this.el || !this.el.lockTip) return;
    this.el.lockTip.classList.add('on');
    clearTimeout(this._lockTipTimer);
    this._lockTipTimer = window.setTimeout(() => {
      if (this.el && this.el.lockTip) this.el.lockTip.classList.remove('on');
    }, 4200);
  }

  setMode(nextMode) {
    this.mode = nextMode;
    const isFoot = nextMode === 'foot';
    const isPlane = nextMode === 'plane';
    const isRide = nextMode === 'ride';
    if (!isPlane && this.activePlane) {
      this.activePlane.resetTimer = Math.max(this.activePlane.resetTimer || 0, 0.2);
      this.activePlane = null;
    }
    if (!isRide && this.activeRide) {
      this.activeRide = null;
      if (this.el && this.el.rideBar) this.el.rideBar.classList.remove('on');
    }
    this.fireHeld = false;
    this.player.root.visible = isFoot || isRide;
    if (this.parachuteMesh && !isFoot) this.parachuteMesh.visible = false;
    // Show sculpted seated protagonist inside whichever vehicle we're driving (and hide when exited!)
    if (this.supercar && this.supercar.playerDriverMesh) {
      this.supercar.playerDriverMesh.visible = nextMode === 'car' && (!this.activeVehicle || this.activeVehicle.isHero);
    }
    if (this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.playerDriverMesh) {
      this.activeVehicle.rig.playerDriverMesh.visible = nextMode === 'car';
    }
    if (this.parkedVehicles) {
      for (const pv of this.parkedVehicles) {
        if (pv && pv.rig && pv.rig.playerDriverMesh) pv.rig.playerDriverMesh.visible = false;
      }
    }
    if (this.flyablePlanes) {
      for (const pl of this.flyablePlanes) {
        if (pl && pl.rig && pl.rig.pilotMesh) {
          pl.rig.pilotMesh.visible = isPlane && this.activePlane === pl;
        }
      }
    }
    if (this.player.setWeapon) this.player.setWeapon(this.weapon);
    const hideCluster = isFoot || isRide;
    this.el.cluster.classList.remove('hidden');
    this.el.cluster.classList.toggle('hidden-foot', hideCluster);
    if (this.el.carBadge) {
      this.el.carBadge.classList.remove('hidden');
      this.el.carBadge.classList.toggle('hidden-foot', hideCluster);
    }
    this.el.footHud.classList.toggle('on', isFoot);
    const armed = isFoot && this.weapon !== 'fists' && this.weapon !== 'bat';
    this.syncReticleVisibility();
    const curWep = WEAPONS.find((w) => w.id === this.weapon);
    if (this.el.gtaWepPill) {
      this.el.gtaWepPill.textContent = isPlane
        ? 'AIRCRAFT PILOT'
        : (isRide ? 'CARNIVAL RIDE' : (isFoot ? (curWep ? curWep.label.toUpperCase() : 'FISTS') : 'DRIVE-BY UZI'));
    }
    if (this.el.carName && !isPlane) {
      this.el.carName.textContent = (this.activeVehicle && this.activeVehicle.label) || 'VICE SUPERCAR';
    }
    if (this.el.carSub) {
      this.el.carSub.textContent = isPlane ? 'SPACE CLIMB · F BAILOUT' : 'LMB · UZI DRIVE-BY';
    }
    if (this.el.radarInfo && !isPlane) {
      const remTokens = this.tokens ? this.tokens.length - this.tokensCollected : 0;
      const txt = isRide ? 'Carnival Pier Ride' : (isFoot ? `On Foot · ${this.koCount} KO` : `${remTokens} Cash Piles`);
      this.lastRadarInfo = txt;
      this.el.radarInfo.textContent = txt;
    }
    this.el.vehBtn.textContent = isPlane
      ? 'Exit / Bailout [F]'
      : (isRide ? 'Exit Ride [F]' : (isFoot ? 'Enter / Fly [F]' : 'Exit Car [F]'));
    this.el.vehBtn.classList.toggle('on', isFoot || isPlane || isRide);
    this.el.keysHint.textContent = isPlane
      ? 'W/S Thrust · A/D Bank Turn · SPACE Climb · Q Dive · SHIFT Afterburner · F Land / Parachute'
      : (isRide
        ? 'Mouse 360° Scenic Look · E / F Exit Carnival Ride'
        : (isFoot
          ? 'WASD Walk · Mouse Look · 1–7 Weapons · Click Punch/Fire · E Talk/Ride/Play · F Car / Plane'
          : 'WASD Drive · Click Drive-By Uzi · R Radio · T/Y Sky · F Exit Car · G Map'));
    if (this.el.touchGo) this.el.touchGo.textContent = isPlane ? 'THRUST' : (isFoot ? 'WALK' : 'DRIVE');
    if (this.el.touchAct) this.el.touchAct.textContent = isPlane ? 'CLIMB' : (isFoot ? (armed ? 'FIRE' : 'HIT') : 'NOS');
    if (this.el.touchVeh) this.el.touchVeh.textContent = isPlane ? 'BAIL' : (isFoot ? 'BOARD' : 'FOOT');
    if (!isFoot) this.el.carPrompt.classList.remove('on');
    this.audio.setRadioInCar(!isFoot && !isRide);
    this.updateRadioHUD();
  }

  setWeapon(id) {
    const wep = WEAPONS.find((w) => w.id === id);
    if (!wep) return;
    this.weapon = wep.id;
    this.fireHeld = false;
    if (this.player && this.player.setWeapon) this.player.setWeapon(wep.id);
    this.el.wepBtns.forEach((b) => b.classList.toggle('active', b.dataset.wep === wep.id));
    this.el.footWepLbl.textContent = wep.label.toUpperCase();
    if (this.el.gtaWepPill && this.mode === 'foot') {
      this.el.gtaWepPill.textContent = wep.label.toUpperCase();
    }
    this.el.punchBtn.textContent = wep.id === 'fists' ? 'Punch [LMB]' : (wep.id === 'bat' ? 'Swing [LMB]' : 'Fire [LMB]');
    const armed = this.mode === 'foot' && wep.id !== 'fists' && wep.id !== 'bat';
    this.syncReticleVisibility();
    if (this.el.touchAct && this.mode === 'foot') this.el.touchAct.textContent = armed ? 'FIRE' : 'HIT';
    if (this.mode === 'foot') {
      this.el.combo.innerHTML = `${wep.label.toUpperCase()} <span>EQUIPPED</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 1.6;
    }
  }

  fireWeapon() {
    if (!this.started || !this.el.modal.hidden || this.fullMapOpen || this.projectsHubOpen || this.miniGameHubOpen || this.activeDialogue || this.mode === 'ride' || this.wastedTimer > 0) return;

    // DRIVE-BY UZI SHOOTING FROM ANY CAR!
    if (this.mode === 'car') {
      if (this.fireCooldown > 0) return;
      const cs = this.carState;
      this.fireCooldown = 0.095;
      this.audio.gunshot('smg');
      this.camShake = Math.max(this.camShake, 0.045);

      const aimYaw = cs.yaw + this.orbitYawOffset;
      const dx = -Math.sin(aimYaw), dz = -Math.cos(aimYaw);
      const rx = Math.cos(cs.yaw), rz = -Math.sin(cs.yaw);
      const muzzleX = cs.x - rx * 1.12 + dx * 0.4;
      const muzzleY = cs.y + 1.08;
      const muzzleZ = cs.z - rz * 1.12 + dz * 0.4;

      const spread = (Math.random() - 0.5) * 0.055;
      const sdx = dx * Math.cos(spread) - dz * Math.sin(spread);
      const sdz = dx * Math.sin(spread) + dz * Math.cos(spread);
      this.fireBulletRay(muzzleX, muzzleY, muzzleZ, sdx, -0.02, sdz, 58, 1.4, 0xff2e88, 'DRIVE-BY UZI');
      return;
    }

    if (this.weapon === 'fists') {
      this.triggerMeleeAttack('punch');
      return;
    }
    if (this.weapon === 'bat') {
      this.triggerMeleeAttack('bat');
      return;
    }
    if (this.fireCooldown > 0) return;

    const wep = WEAPONS.find((w) => w.id === this.weapon) || WEAPONS[2];
    const ps = this.playerState;
    ps.yaw = this.orbitYawOffset;
    this.fireCooldown = wep.cooldown;
    this.muzzleFlashTimer = wep.id === 'bazooka' ? 0.11 : (wep.id === 'shotgun' ? 0.09 : 0.06);
    this.crosshairPulseTimer = 0.12;
    this.el.crosshair.classList.add('pulse');
    this.audio.gunshot(wep.id);

    const fx = -Math.sin(ps.yaw);
    const fz = -Math.cos(ps.yaw);
    const rx = Math.cos(ps.yaw);
    const rz = -Math.sin(ps.yaw);
    const pitchY = THREE.MathUtils.clamp(-this.orbitPitchOffset * 0.44, -0.36, 0.36);
    const dirLen = Math.hypot(fx, pitchY, fz) || 1;
    const dx = fx / dirLen, dy = pitchY / dirLen, dz = fz / dirLen;

    const muzzleX = ps.x + fx * 0.82 + rx * 0.24;
    const muzzleY = ps.y + 1.38;
    const muzzleZ = ps.z + fz * 0.82 + rz * 0.24;

    if (wep.id === 'bazooka') {
      this.camShake = Math.max(this.camShake, 0.22);
      const rGrp = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.56, 8),
        new THREE.MeshStandardMaterial({ color: 0x3b482e, roughness: 0.45, metalness: 0.4 })
      );
      body.rotation.x = Math.PI / 2;
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.082, 0.22, 8),
        new THREE.MeshStandardMaterial({ color: 0xff6a2a, emissive: 0xff4620, emissiveIntensity: 1.5, roughness: 0.25 })
      );
      tip.rotation.x = -Math.PI / 2;
      tip.position.z = -0.34;
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.075, 0.36, 8),
        new THREE.MeshBasicMaterial({ color: 0xffd86b, transparent: true, opacity: 0.92 })
      );
      flame.rotation.x = Math.PI / 2;
      flame.position.z = 0.44;
      rGrp.add(body, tip, flame);
      rGrp.position.set(muzzleX, muzzleY, muzzleZ);
      rGrp.lookAt(muzzleX + dx * 10, muzzleY + dy * 10, muzzleZ + dz * 10);
      this.scene.add(rGrp);

      const spd = 48;
      this.rockets.push({
        mesh: rGrp, x: muzzleX, y: muzzleY, z: muzzleZ,
        vx: dx * spd, vy: dy * spd, vz: dz * spd, life: 3.0
      });
      for (let k = 0; k < 5; k++) {
        this.spawnParticle(
          ps.x - fx * 0.7, muzzleY, ps.z - fz * 0.7,
          -fx * (4 + Math.random() * 4) + (Math.random() - 0.5) * 2,
          0.6 + Math.random() * 1.2,
          -fz * (4 + Math.random() * 4) + (Math.random() - 0.5) * 2,
          0xd8d2e2, 0.52, 0.55, 1.4, 0
        );
      }
      return;
    }

    if (wep.id === 'shotgun') {
      this.camShake = Math.max(this.camShake, 0.24);
      // 6-pellet 12-gauge blast spread!
      for (let p = 0; p < 6; p++) {
        const angY = (p - 2.5) * 0.045 + (Math.random() - 0.5) * 0.025;
        const angP = (Math.random() - 0.5) * 0.06;
        const pdx = dx * Math.cos(angY) - dz * Math.sin(angY);
        const pdz = dx * Math.sin(angY) + dz * Math.cos(angY);
        const pdy = dy + angP;
        this.fireBulletRay(muzzleX, muzzleY, muzzleZ, pdx, pdy, pdz, wep.range, 1.35, 0xff8a2a, 'SHOTGUN');
      }
      return;
    }

    // Pistol / Vice Uzi SMG / M4 Rifle hitscan with glowing 3D tracer!
    this.camShake = Math.max(this.camShake, wep.id === 'rifle' ? 0.06 : (wep.id === 'smg' ? 0.045 : 0.08));
    const spread = wep.id === 'smg' ? (Math.random() - 0.5) * 0.05 : 0;
    const sdx = dx * Math.cos(spread) - dz * Math.sin(spread);
    const sdz = dx * Math.sin(spread) + dz * Math.cos(spread);
    const col = wep.id === 'rifle' ? 0x21e6d1 : (wep.id === 'smg' ? 0xff2e88 : 0xffd36b);
    this.fireBulletRay(muzzleX, muzzleY, muzzleZ, sdx, dy, sdz, wep.range, wep.dmg, col, wep.name.toUpperCase());
  }

  fireBulletRay(muzzleX, muzzleY, muzzleZ, dx, dy, dz, range, dmg, tracerColor, labelName) {
    let bestDist = range;
    let hitPed = null;
    let hitCar = null;
    let hitKb = null;

    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      if (p.state === 'squished' || p.state === 'ragdoll') continue;
      const ox = p.x - muzzleX, oy = (p.y + 1.1) - muzzleY, oz = p.z - muzzleZ;
      const t = ox * dx + oy * dy + oz * dz;
      if (t < 0.6 || t > bestDist) continue;
      const cx = muzzleX + dx * t - p.x;
      const cz = muzzleZ + dz * t - p.z;
      const cy = muzzleY + dy * t - (p.y + 1.05);
      if (Math.hypot(cx, cz) < 1.35 && Math.abs(cy) < 1.45) {
        bestDist = t; hitPed = p; hitCar = null; hitKb = null;
      }
    }

    for (let i = 0; i < this.traffic.length; i++) {
      const tc = this.traffic[i];
      if (!tc.visible) continue;
      const ox = tc.position.x - muzzleX, oz = tc.position.z - muzzleZ;
      const t = ox * dx + oz * dz;
      if (t < 1.0 || t > bestDist) continue;
      const cx = muzzleX + dx * t - tc.position.x;
      const cz = muzzleZ + dz * t - tc.position.z;
      const cy = muzzleY + dy * t - (tc.position.y + 0.85);
      if (Math.hypot(cx, cz) < 2.2 && Math.abs(cy) < 1.65) {
        bestDist = t; hitCar = tc; hitPed = null; hitKb = null;
      }
    }

    let hitParked = null;
    for (let i = 0; i < this.parkedVehicles.length; i++) {
      const pv = this.parkedVehicles[i];
      if (!pv.mesh || !pv.mesh.visible) continue;
      const ox = pv.x - muzzleX, oz = pv.z - muzzleZ;
      const t = ox * dx + oz * dz;
      if (t < 1.0 || t > bestDist) continue;
      const cx = muzzleX + dx * t - pv.x;
      const cz = muzzleZ + dz * t - pv.z;
      const cy = muzzleY + dy * t - ((pv.y || 0) + 0.85);
      if (Math.hypot(cx, cz) < 2.2 && Math.abs(cy) < 1.65) {
        bestDist = t; hitParked = pv; hitCar = null; hitPed = null; hitKb = null;
      }
    }

    for (let i = 0; i < this.knockables.length; i++) {
      const kb = this.knockables[i];
      if (kb.active) continue;
      const ox = kb.x - muzzleX, oz = kb.z - muzzleZ;
      const t = ox * dx + oz * dz;
      if (t < 0.8 || t > bestDist) continue;
      const cx = muzzleX + dx * t - kb.x;
      const cz = muzzleZ + dz * t - kb.z;
      if (Math.hypot(cx, cz) < 1.1) {
        bestDist = t; hitKb = kb; hitPed = null; hitCar = null; hitParked = null;
      }
    }

    let hitRangeTarget = null;
    if (this.activeMiniGame && this.activeMiniGame.id === 'range' && this.activeMiniGame.targets) {
      for (let i = 0; i < this.activeMiniGame.targets.length; i++) {
        const tg = this.activeMiniGame.targets[i];
        if (!tg.alive) continue;
        const ox = tg.x - muzzleX, oy = (tg.y + 1.65) - muzzleY, oz = tg.z - muzzleZ;
        const t = ox * dx + oy * dy + oz * dz;
        if (t < 0.8 || t > bestDist) continue;
        const cx = muzzleX + dx * t - tg.x;
        const cy = muzzleY + dy * t - (tg.y + 1.65);
        const cz = muzzleZ + dz * t - tg.z;
        if (Math.hypot(cx, cz) < 1.45 && Math.abs(cy) < 1.55) {
          bestDist = t; hitRangeTarget = tg; hitPed = null; hitCar = null; hitParked = null; hitKb = null;
        }
      }
    }

    const endX = muzzleX + dx * bestDist;
    const endY = Math.max(0.15, muzzleY + dy * bestDist);
    const endZ = muzzleZ + dz * bestDist;

    const tGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(muzzleX, muzzleY, muzzleZ),
      new THREE.Vector3(endX, endY, endZ)
    ]);
    const tMat = new THREE.LineBasicMaterial({ color: tracerColor, transparent: true, opacity: 0.92 });
    const tLine = new THREE.Line(tGeo, tMat);
    this.scene.add(tLine);
    this.tracers.push({ mesh: tLine, geo: tGeo, mat: tMat, life: 0.085, maxLife: 0.085 });

    if (hitRangeTarget) {
      this.onRangeTargetHit(hitRangeTarget);
    } else if (hitPed) {
      hitPed.hp -= dmg;
      const isKO = hitPed.hp <= 0;
      for (let k = 0; k < (isKO ? 10 : 5); k++) {
        this.spawnParticle(
          hitPed.x, hitPed.y + 1.2, hitPed.z,
          dx * (4 + Math.random() * 4) + (Math.random() - 0.5) * 3,
          2.0 + Math.random() * 3.0,
          dz * (4 + Math.random() * 4) + (Math.random() - 0.5) * 3,
          isKO ? 0xffd36b : 0xff7b2e, 0.44, 0.65, 0.3, 9.5
        );
      }
      this.audio.hitNpc(isKO);
      if (isKO) {
        this.koCount += 1;
        this.streakCount += 1;
        this.streakTimer = 4.5;
        const reward = 150 * Math.min(this.streakCount, 5);
        this.cash += reward;
        this.wantedStars = Math.min(5, Math.max(this.wantedStars, Math.ceil((this.squishCount + this.koCount) / 2)));
        this.wantedDecay = 14.0;
        this.el.footKo.textContent = `${this.koCount} KO`;
        this.el.wanted.classList.toggle('active', this.wantedStars > 0);
        this.el.stars.forEach((s, idx) => s.classList.toggle('lit', idx < this.wantedStars));
        this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        this.el.combo.innerHTML = `${labelName} KO! <span>+$${reward}</span>`;
        this.el.combo.classList.add('on');
        hitPed.state = 'ragdoll';
        hitPed.stateTimer = 9.0;
        hitPed.vx = dx * 13.5 + (Math.random() - 0.5) * 3;
        hitPed.vz = dz * 13.5 + (Math.random() - 0.5) * 3;
        hitPed.vy = 5.8;
        hitPed.spinX = 9.5;
        hitPed.spinZ = (Math.random() < 0.5 ? -1 : 1) * 7.5;
        hitPed.splat.visible = false;
        hitPed.stars.visible = false;
      } else {
        hitPed.state = 'stagger';
        hitPed.stateTimer = 0.42;
        hitPed.vx = dx * 6.5;
        hitPed.vz = dz * 6.5;
      }
      for (let j = 0; j < this.pedestrians.length; j++) {
        const o = this.pedestrians[j];
        if (o !== hitPed && (o.state === 'walk' || o.state === 'panic') && Math.hypot(o.x - hitPed.x, o.z - hitPed.z) < 22) {
          o.state = 'panic'; o.stateTimer = 4.5;
        }
      }
    } else if (hitCar) {
      const vehDmg = Math.max(10, dmg * 11.5);
      this.damageVehicle(hitCar, vehDmg, endX, endY, endZ, dx, dz, labelName);
    } else if (hitParked) {
      if (hitParked.hp === undefined) hitParked.hp = 100;
      hitParked.hp -= Math.max(10, dmg * 11.5);
      this.audio.impact(0.42);
      for (let k = 0; k < 6; k++) {
        this.spawnParticle(endX, endY, endZ, (Math.random() - 0.5) * 6, 2.5 + Math.random() * 3, (Math.random() - 0.5) * 6, 0xffd36b, 0.36, 0.4, 0.2, 9.8);
      }
      if (hitParked.hp <= 0) {
        hitParked.hp = 100;
        this.spawnVehicleDebris(hitParked.x, (hitParked.y || 0) + 0.9, hitParked.z, 0x2a2436);
        this.triggerExplosion(hitParked.x, (hitParked.y || 0) + 0.9, hitParked.z, 1.15);
      } else if (hitParked.hp < 50) {
        this.spawnParticle(hitParked.x, (hitParked.y || 0) + 1.15, hitParked.z, (Math.random() - 0.5) * 1.4, 2.8, (Math.random() - 0.5) * 1.4, 0x2a2634, 0.95, 0.9, 1.8, -0.8);
      }
    } else if (hitKb) {
      hitKb.active = true;
      hitKb.resetTimer = 14.0;
      hitKb.vx = dx * 16; hitKb.vz = dz * 16; hitKb.vy = 7.5;
      hitKb.rx = 10; hitKb.rz = -9;
      this.audio.impact(0.35);
    } else {
      for (let k = 0; k < 3; k++) {
        this.spawnParticle(endX, endY, endZ, (Math.random() - 0.5) * 4, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 4, 0xffd36b, 0.28, 0.28, 0.2, 9.8);
      }
    }
  }

  spawnVehicleDebris(x, y, z, colorHex = 0x262230) {
    // 9 spinning 3D metallic panels, tires & glowing embers that arc and bounce off asphalt!
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const spd = 6.5 + Math.random() * 11.5;
      const isTire = i === 0 || i === 1;
      const isEmber = i >= 7;
      const geo = isTire
        ? new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12)
        : (isEmber ? new THREE.BoxGeometry(0.28, 0.14, 0.28) : new THREE.BoxGeometry(0.55 + Math.random() * 0.45, 0.08, 0.38 + Math.random() * 0.35));
      const mat = isEmber
        ? new THREE.MeshBasicMaterial({ color: i === 7 ? 0xff7a22 : 0xffd36b })
        : new THREE.MeshStandardMaterial({
            color: isTire ? 0x16161c : (i % 2 === 0 ? colorHex : 0x221f28),
            roughness: isTire ? 0.88 : 0.62,
            metalness: isTire ? 0.08 : 0.55
          });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x + (Math.random() - 0.5) * 1.1, y + Math.random() * 0.6, z + (Math.random() - 0.5) * 1.1);
      mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      this.scene.add(mesh);
      this.debris.push({
        mesh, geo, mat,
        vx: Math.cos(ang) * spd,
        vy: 6.5 + Math.random() * 8.5,
        vz: Math.sin(ang) * spd,
        rx: (Math.random() - 0.5) * 14,
        ry: (Math.random() - 0.5) * 14,
        rz: (Math.random() - 0.5) * 14,
        life: 3.4 + Math.random() * 1.8,
        smoking: !isTire
      });
    }
  }

  damageVehicle(tc, dmg, hitX, hitY, hitZ, dx = 0, dz = -1, sourceLabel = 'WEAPON') {
    const u = tc.userData;
    if (!u) return;
    if (u.vehState === 'wrecked') {
      // Sparks on already-charred wreck
      this.audio.impact(0.28);
      for (let k = 0; k < 4; k++) {
        this.spawnParticle(hitX, hitY, hitZ, (Math.random() - 0.5) * 5, 2.0 + Math.random() * 2.5, (Math.random() - 0.5) * 5, 0xffaa38, 0.34, 0.35, 0.2, 9.8);
      }
      return;
    }

    u.hp = Math.max(0, (u.hp ?? 100) - dmg);
    u.stun = Math.max(u.stun || 0, 1.1);
    u.vx = dx * 5.2;
    u.vz = dz * 5.2;
    this.audio.impact(0.46);

    // Metallic impact sparks & paint chips
    for (let k = 0; k < 6; k++) {
      this.spawnParticle(
        hitX, hitY, hitZ,
        (Math.random() - 0.5) * 6.5, 2.2 + Math.random() * 3.4, (Math.random() - 0.5) * 6.5,
        k % 2 === 0 ? 0xffd36b : 0xff7a22, 0.38, 0.42, 0.25, 9.8
      );
    }

    // Visual rattle on chassis suspension
    if (u.carRig && u.carRig.bodyGroup) {
      u.carRig.bodyGroup.rotation.z = (Math.random() - 0.5) * 0.08;
    }

    // Stage 1 (< 68% HP): Hood smoke puff
    if (u.hp < (u.maxHp || 100) * 0.68 && u.hp > 0) {
      const fx = -Math.sin(tc.rotation.y), fz = -Math.cos(tc.rotation.y);
      this.spawnParticle(
        tc.position.x + fx * 1.45, tc.position.y + 1.05, tc.position.z + fz * 1.45,
        (Math.random() - 0.5) * 1.4, 2.6, (Math.random() - 0.5) * 1.4,
        u.hp < (u.maxHp || 100) * 0.38 ? 0x26222e : 0xd8d6e0, 0.85, 0.85, 1.8, -0.7
      );
    }

    // Stage 3 (HP <= 0): CATASTROPHIC DETONATION!
    if (u.hp <= 0) {
      this.detonateVehicle(tc, sourceLabel);
      return;
    }

    // Stage 2 (< 32% HP): Engine catches fire + panicked NPC driver bails out!
    if (u.hp <= (u.maxHp || 100) * 0.32 && u.vehState === 'ok') {
      u.vehState = 'burning';
      u.burnTimer = 1.65;
      u.stun = 3.0;
      u.vx *= 0.35;
      u.vz *= 0.35;
      // Panicked NPC driver bails out of burning car!
      if (u.carRig && u.carRig.driverMesh && u.carRig.driverMesh.visible) {
        u.carRig.driverMesh.visible = false;
        if (u.carRig.driverDoorPivot) u.carRig.driverDoorPivot.rotation.y = -0.92;
        if (this._addPed) {
          const rx = Math.cos(tc.rotation.y), rz = -Math.sin(tc.rotation.y);
          const bail = this._addPed(
            tc.position.x - rx * 1.75, 0.02, tc.position.z - rz * 1.75,
            1, true, Math.floor(Math.random() * 80), 'z', -775, 180, false
          );
          bail.state = 'panic';
          bail.stateTimer = 6.5;
        }
      }
      this.el.combo.innerHTML = `${u.carRig ? u.carRig.label : 'VEHICLE'} ON FIRE! <span>IGNITED</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.0;
    }
  }

  detonateVehicle(tc, sourceLabel = 'WEAPON') {
    const u = tc.userData;
    if (!u || u.vehState === 'wrecked') return;
    u.vehState = 'wrecked';
    u.hp = 0;
    u.wreckTimer = 18.0;
    u.burnTimer = 0;
    u.stun = 0;

    // Launch destroyed car violently into the air with chaotic spin!
    const blastAng = Math.random() * Math.PI * 2;
    u.vy = 8.4 + Math.random() * 3.0;
    u.vx = Math.cos(blastAng) * (3.2 + Math.random() * 2.8);
    u.vz = Math.sin(blastAng) * (3.2 + Math.random() * 2.8);
    u.spinX = (Math.random() < 0.5 ? -1 : 1) * (2.6 + Math.random() * 1.8);
    u.spinZ = (Math.random() < 0.5 ? -1 : 1) * (3.4 + Math.random() * 2.2);

    // Char the vehicle hull to blackened, smoking scorched steel & blow driver door open
    const rig = u.carRig;
    if (rig) {
      if (rig.paintMat) {
        rig.paintMat.color.setHex(0x16141a);
        rig.paintMat.clearcoat = 0.0;
        rig.paintMat.roughness = 0.96;
        rig.paintMat.metalness = 0.16;
      }
      if (rig.headLensMat) rig.headLensMat.emissiveIntensity = 0;
      if (rig.tailMat) rig.tailMat.emissiveIntensity = 0;
      if (rig.driverMesh) rig.driverMesh.visible = false;
      if (rig.driverDoorPivot) rig.driverDoorPivot.rotation.y = -0.82;
    }

    // Spawn 3D flying car debris chunks!
    this.spawnVehicleDebris(tc.position.x, tc.position.y + 0.9, tc.position.z, u.colorHex || 0x2a2436);

    // Reward cash + Wanted Star + HUD alert
    this.vehiclesDestroyed += 1;
    this.cash += 350;
    this.wantedStars = Math.min(5, Math.max(1, this.wantedStars + 1));
    this.wantedDecay = 18.0;
    this.el.wanted.classList.toggle('active', this.wantedStars > 0);
    this.el.stars.forEach((s, idx) => s.classList.toggle('lit', idx < this.wantedStars));
    this.el.cash.textContent = `$${this.cash.toLocaleString()}`;

    // Massive fireball + dynamic light flash + chain-reaction blast!
    this.triggerExplosion(tc.position.x, Math.max(0.7, tc.position.y + 0.9), tc.position.z, 1.28, tc);

    this.el.combo.innerHTML = `${rig ? rig.label : 'VEHICLE'} DESTROYED! <span>+$350</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.6;
  }

  triggerExplosion(x, y, z, scale = 1.0, sourceCar = null) {
    this.camShake = Math.max(this.camShake, 0.65 * scale);
    this.audio.explosion();

    const grp = new THREE.Group();
    grp.position.set(x, Math.max(0.4, y), z);
    const coreGeo = new THREE.SphereGeometry(0.85 * scale, 14, 12);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff8a22, transparent: true, opacity: 0.92, depthWrite: false });
    const core = new THREE.Mesh(coreGeo, coreMat);
    const innerGeo = new THREE.SphereGeometry(0.55 * scale, 12, 10);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xfff6c2, transparent: true, opacity: 0.98, depthWrite: false });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    const ringGeo = new THREE.RingGeometry(0.85 * scale, 1.45 * scale, 30);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -Math.max(0.3, y - 0.14);

    // Dynamic fiery explosion flash PointLight illuminates nearby cars, road & facades!
    const flashLight = new THREE.PointLight(0xff8424, 24 * scale, 38 * scale, 1.6);
    flashLight.position.set(0, 1.4, 0);

    grp.add(core, inner, ring, flashLight);
    this.scene.add(grp);
    this.explosions.push({
      grp, core, inner, ring, light: flashLight,
      coreMat, innerMat, ringMat,
      geos: [coreGeo, innerGeo, ringGeo],
      scale,
      life: 0.62, maxLife: 0.62
    });

    // Multi-layered volumetric fireball, white-hot inner blast, glowing embers & towering charcoal smoke plumes!
    const partCount = Math.round(40 * Math.min(1.35, scale));
    for (let k = 0; k < partCount; k++) {
      const ang = Math.random() * Math.PI * 2;
      const layer = k % 5; // 0: white-hot core, 1: bright orange fireball, 2: deep red-orange flame, 3: dark smoke plume, 4: flying ember sparks
      const isSmoke = layer === 3;
      const isSpark = layer === 4;
      const isCore = layer === 0;
      const spd = isSpark ? (9.0 + Math.random() * 14.0) * scale : (isCore ? (1.2 + Math.random() * 3.5) : (2.5 + Math.random() * 7.5)) * scale;
      const col = isCore ? 0xfff0a0 : (layer === 1 ? 0xff7a1a : (layer === 2 ? 0xe63a14 : (isSmoke ? 0x221d2b : 0xffd36b)));
      const sz = isSmoke ? 2.4 * scale : (isCore ? 2.1 * scale : (isSpark ? 0.42 * scale : 1.9 * scale));
      const dur = isSmoke ? 1.65 : (isCore ? 0.52 : (isSpark ? 0.85 : 0.88));
      const grow = isSmoke ? 3.2 : (isSpark ? 0.1 : 2.6);
      const grav = isSmoke ? -1.8 : (isSpark ? 14.0 : -0.6);
      this.spawnParticle(
        x + (Math.random() - 0.5) * (isCore ? 1.0 : 2.2),
        Math.max(0.45, y) + Math.random() * (isSmoke ? 1.8 : 1.1),
        z + (Math.random() - 0.5) * (isCore ? 1.0 : 2.2),
        Math.cos(ang) * spd,
        (isSmoke ? 5.2 : (isSpark ? 7.5 : 3.2)) + Math.random() * (isSpark ? 8.5 : 4.8),
        Math.sin(ang) * spd,
        col, sz, dur + Math.random() * 0.25, grow, grav
      );
    }

    // Blast all nearby pedestrians within 14.5m into dramatic ragdolls!
    let blasted = 0;
    const pedRad = 14.5 * scale;
    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      if (p.state === 'squished' || p.state === 'ragdoll') continue;
      const dx = p.x - x, dz = p.z - z;
      const dist = Math.hypot(dx, dz);
      if (dist < pedRad) {
        blasted += 1;
        this.koCount += 1;
        this.streakCount += 1;
        this.cash += 150;
        const nx = dist > 0.1 ? dx / dist : 1;
        const nz = dist > 0.1 ? dz / dist : 0;
        const force = (1 - dist / (pedRad + 1.0)) * 19 + 7;
        p.state = 'ragdoll';
        p.stateTimer = 9.0;
        p.vx = nx * force;
        p.vz = nz * force;
        p.vy = 8.5 + Math.random() * 5.5;
        p.spinX = 11.0;
        p.spinZ = (Math.random() < 0.5 ? -1 : 1) * 9.5;
        p.splat.visible = false;
        p.stars.visible = false;
      } else if (dist < 34 && (p.state === 'walk' || p.state === 'panic')) {
        p.state = 'panic';
        p.stateTimer = 5.5;
      }
    }

    // Chain-Reaction Vehicle Damage & Shockwave Push on Nearby Traffic Cars!
    const carBlastRad = 14.5 * scale;
    for (let i = 0; i < this.traffic.length; i++) {
      const tc = this.traffic[i];
      if (tc === sourceCar) continue;
      const dx = tc.position.x - x, dz = tc.position.z - z;
      const dist = Math.hypot(dx, dz);
      if (dist < carBlastRad) {
        const nx = dist > 0.1 ? dx / dist : 1;
        const nz = dist > 0.1 ? dz / dist : 0;
        if (tc.userData.vehState !== 'wrecked') {
          // Direct/close blast (< 6.5m) obliterates immediately; outer blast ignites for chain-reaction!
          const blastDmg = dist < 6.5 ? 140 : 85;
          this.damageVehicle(tc, blastDmg, tc.position.x, 1.0, tc.position.z, nx, nz, 'BLAST');
        }
        tc.userData.stun = 2.6;
        tc.userData.vx = nx * 16;
        tc.userData.vz = nz * 16;
      }
    }

    // Launch knockables within 15m!
    for (let i = 0; i < this.knockables.length; i++) {
      const kb = this.knockables[i];
      const dx = kb.x - x, dz = kb.z - z;
      const dist = Math.hypot(dx, dz);
      if (dist < 15 * scale) {
        const nx = dist > 0.1 ? dx / dist : 1;
        const nz = dist > 0.1 ? dz / dist : 0;
        kb.active = true;
        kb.resetTimer = 14.0;
        kb.vx = nx * 18; kb.vz = nz * 18; kb.vy = 11;
        kb.rx = 12; kb.rz = -10;
      }
    }

    this.wantedStars = Math.min(5, Math.max(this.wantedStars, blasted > 0 ? Math.min(5, this.wantedStars + 2) : Math.max(1, this.wantedStars)));
    this.wantedDecay = 16.0;
    this.el.footKo.textContent = `${this.koCount} KO`;
    this.el.wanted.classList.toggle('active', this.wantedStars > 0);
    this.el.stars.forEach((s, idx) => s.classList.toggle('lit', idx < this.wantedStars));
    this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
    if (!sourceCar) {
      this.el.combo.innerHTML = blasted > 0
        ? `BAZOOKA BLAST x${blasted}! <span>+$${blasted * 150}</span>`
        : `RPG DETONATION! <span>BOOM</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 3.4;
    }
  }

  selectRadioStation(idx) {
    const prevIdx = this.audio.radioIdx;
    const nextIdx = ((idx % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    this.radioTuneRot += (nextIdx - prevIdx || 1) * 72;
    if (!this.audio.enabled) {
      this.audio.setEnabled(true);
      this.el.audioBtn.textContent = 'Audio: On';
      this.el.audioBtn.classList.add('on');
      this.audio.setRainLevel(WEATHER_PRESETS[this.weatherIdx].rain);
    }
    this.audio.setRadioStation(nextIdx);
    this.audio.setRadioInCar(this.mode === 'car');
    this.updateRadioHUD();
  }

  cycleRadio(delta = 1) {
    this.selectRadioStation(this.audio.radioIdx + delta);
  }

  toggleRadioPower() {
    if (!this.audio.enabled) {
      this.audio.setEnabled(true);
      this.audio.setRadioPower(true);
      this.el.audioBtn.textContent = 'Audio: On';
      this.el.audioBtn.classList.add('on');
      this.audio.setRainLevel(WEATHER_PRESETS[this.weatherIdx].rain);
    } else {
      this.audio.setRadioPower(!this.audio.radioPower);
    }
    this.audio.setRadioInCar(this.mode === 'car');
    this.updateRadioHUD();
  }

  setRadioVolume(v) {
    this.audio.setRadioVolume(v);
    this.updateRadioHUD();
  }

  updateRadioHUD() {
    if (!this.el || !this.el.radioDeck) return;
    const st = this.audio.getRadioStation();
    const isPlaying = this.audio.enabled && this.audio.radioPower && this.mode === 'car';
    this.el.radF.textContent = st.freq;
    this.el.radN.textContent = isPlaying
      ? st.name
      : (this.mode === 'foot' ? `${st.name} · in car` : `${st.name} · paused`);
    const pct = (((parseFloat(st.freq) - 87.5) / (108 - 87.5)) * 100).toFixed(1);
    this.el.radNd.style.setProperty('--np', `${pct}%`);
    this.el.radPres.forEach((b, i) => b.setAttribute('aria-pressed', String(i === this.audio.radioIdx)));
    this.el.radTune.style.setProperty('--r', `${this.radioTuneRot}deg`);
    this.el.radVol.style.setProperty('--r', `${(this.audio.radioVolume * 2.7 - 135).toFixed(1)}deg`);
    this.el.radVol.setAttribute('aria-valuenow', String(this.audio.radioVolume));
    this.el.radioDeck.classList.toggle('on', isPlaying);
    this.el.radioDeck.classList.toggle('dim', this.mode === 'foot');
  }

  setTimeOfDay(idx) {
    this.timeIdx = ((idx % TIME_PRESETS.length) + TIME_PRESETS.length) % TIME_PRESETS.length;
    const tp = TIME_PRESETS[this.timeIdx];
    this.el.timeBtn.textContent = `${tp.icon} ${tp.label} [T]`;
    this.el.timeBtn.classList.toggle('on', this.timeIdx === 2);
    if (this.timeIdx === 2 && !this.lightsOn) this.toggleLights();
    this.el.combo.innerHTML = `TIME · ${tp.label.toUpperCase()} <span>SKY</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 1.8;
  }

  setWeather(idx) {
    this.weatherIdx = ((idx % WEATHER_PRESETS.length) + WEATHER_PRESETS.length) % WEATHER_PRESETS.length;
    const wp = WEATHER_PRESETS[this.weatherIdx];
    this.el.weatherBtn.textContent = `${wp.icon} ${wp.label} [Y]`;
    this.el.weatherBtn.classList.toggle('on', this.weatherIdx > 0);
    this.audio.setRainLevel(wp.rain);
    if (this.rainLines) this.rainLines.mesh.visible = wp.rain > 0;
    if (this.weatherIdx === 2 && !this.lightsOn) this.toggleLights();
    this.el.combo.innerHTML = `WEATHER · ${wp.label.toUpperCase()} <span>MIAMI</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 1.8;
  }

  applyHoverLook(dx, dy = 0) {
    if (this.mode === 'foot') {
      this.orbitYawOffset -= dx * 0.0042;
    } else {
      this.orbitYawOffset = THREE.MathUtils.clamp(this.orbitYawOffset - dx * 0.0036, -2.8, 2.8);
    }
    this.orbitPitchOffset = THREE.MathUtils.clamp(this.orbitPitchOffset + dy * 0.0024, -0.32, 0.68);
    this.lastLookTime = performance.now();
  }

  findNearestVehicleTarget(maxDist = 6.5) {
    const ps = this.playerState;
    const cs = this.carState;
    let best = null;
    let bestD = maxDist;

    // 0. Check flyable airport airplanes (generous boarding radius around wings/airstair!)
    if (this.flyablePlanes) {
      for (let i = 0; i < this.flyablePlanes.length; i++) {
        const pl = this.flyablePlanes[i];
        if (pl.y > 4.0) continue;
        const d = Math.hypot(pl.x - ps.x, pl.z - ps.z);
        if (d < maxDist + 4.2 && (!best || d - 2.4 < bestD)) {
          bestD = Math.max(0.1, d - 2.4);
          best = { kind: 'plane', plane: pl, label: pl.label, dist: d };
        }
      }
    }
    // 1. Check all moving/stopped intact NPC traffic cars (skip burned-out wrecks!)
    for (let i = 0; i < this.traffic.length; i++) {
      const tc = this.traffic[i];
      if (!tc.visible || tc.userData.vehState === 'wrecked') continue;
      const d = Math.hypot(tc.position.x - ps.x, tc.position.z - ps.z);
      if (d < bestD) {
        bestD = d;
        const rig = tc.userData.carRig;
        best = { kind: 'traffic', mesh: tc, label: rig ? rig.label : 'NPC CAR', dist: d };
      }
    }
    // 2. Check current parked active vehicle
    const dCur = Math.hypot(cs.x - ps.x, cs.z - ps.z);
    if (dCur < bestD) {
      bestD = dCur;
      best = { kind: 'active', vehicle: this.activeVehicle, label: this.activeVehicle.label, dist: dCur };
    }
    // 3. Check previously abandoned / parked vehicles (including your Red Supercar!)
    for (let i = 0; i < this.parkedVehicles.length; i++) {
      const pv = this.parkedVehicles[i];
      const d = Math.hypot(pv.x - ps.x, pv.z - ps.z);
      if (d < bestD) {
        bestD = d;
        best = { kind: 'parked', vehicle: pv, index: i, label: pv.label, dist: d };
      }
    }
    return best;
  }

  startCarjackAnim(tc) {
    if (this.carjackAnim) return;
    const ps = this.playerState;
    // Halt & detach target traffic car immediately so it screeches to a stop for the heist!
    const idx = this.traffic.indexOf(tc);
    if (idx !== -1) this.traffic.splice(idx, 1);

    const rig = tc.userData.carRig || {
      label: 'VICE SEDAN', topSpeed: 40, accel: 17, grip: 0.92,
      bodyGroup: tc, driverDoorPivot: null, wheelSpinGroups: [], frontSteerGroups: [], tailMat: null, headLensMat: null, driverMesh: null
    };
    const carYaw = tc.rotation.y;
    const fx = -Math.sin(carYaw), fz = -Math.cos(carYaw);
    const rx = Math.cos(carYaw), rz = -Math.sin(carYaw);
    const carX = tc.position.x, carZ = tc.position.z;

    // Driver-side door stand spot (-rx is LEFT/driver side!) & driver seat target
    const doorX = carX - rx * 1.44 + fx * 0.06;
    const doorZ = carZ - rz * 1.44 + fz * 0.06;
    const seatX = carX - rx * 0.36 - fx * 0.14;
    const seatZ = carZ - rz * 0.36 - fz * 0.14;
    const faceDoorYaw = carYaw - Math.PI / 2;

    if (rig.tailMat) rig.tailMat.emissiveIntensity = 2.4;
    // Tire skid brake smoke puff as driver slams on brakes!
    for (let k = 0; k < 5; k++) {
      this.spawnParticle(
        carX - fx * 1.2 + (Math.random() - 0.5) * 1.1, 0.25, carZ - fz * 1.2 + (Math.random() - 0.5) * 1.1,
        (Math.random() - 0.5) * 1.6, 0.9, (Math.random() - 0.5) * 1.6, 0xe8e4f0, 0.72, 0.55, 1.8
      );
    }

    this.el.combo.innerHTML = `JACKING · ${rig.label} <span>CARJACK</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.2;

    this.carjackAnim = {
      kind: 'steal',
      t: 0,
      dur: 1.48,
      tc,
      rig,
      carX, carZ, carYaw,
      rx, rz, fx, fz,
      startX: ps.x, startZ: ps.z, startYaw: ps.yaw,
      doorX, doorZ, seatX, seatZ, faceDoorYaw,
      doorOpenedSfx: false,
      driverEjected: false,
      doorClosedSfx: false
    };
  }

  startVehicleDoorAnim(kind, vehicle, parkedIdx = -1) {
    if (this.carjackAnim) return;
    const ps = this.playerState;
    const cs = this.carState;
    const rig = (vehicle && vehicle.rig) || this.car;
    const carX = kind === 'parked' ? vehicle.x : cs.x;
    const carZ = kind === 'parked' ? vehicle.z : cs.z;
    const carYaw = kind === 'parked' ? vehicle.yaw : cs.yaw;
    const fx = -Math.sin(carYaw), fz = -Math.cos(carYaw);
    const rx = Math.cos(carYaw), rz = -Math.sin(carYaw);

    const doorX = carX - rx * 1.52 + fx * 0.06;
    const doorZ = carZ - rz * 1.52 + fz * 0.06;
    const seatX = carX - rx * 0.36 - fx * 0.14;
    const seatZ = carZ - rz * 0.36 - fz * 0.14;
    const faceDoorYaw = carYaw - Math.PI / 2;

    if (kind === 'exit') {
      this.setMode('foot');
      this.player.root.visible = true;
      ps.x = seatX; ps.z = seatZ; ps.y = 0; ps.yaw = carYaw;
      this.player.root.position.set(ps.x, 0, ps.z);
      this.audio.carDoor();
    }

    this.carjackAnim = {
      kind, // 'exit' | 'enter' | 'parked'
      t: 0,
      dur: 0.64,
      vehicle,
      parkedIdx,
      rig,
      carX, carZ, carYaw,
      rx, rz, fx, fz,
      startX: ps.x, startZ: ps.z, startYaw: ps.yaw,
      doorX, doorZ, seatX, seatZ, faceDoorYaw,
      doorOpenedSfx: kind === 'exit',
      doorClosedSfx: false
    };
  }

  updateCarjackAnim(dt, elapsed) {
    const a = this.carjackAnim;
    if (!a) return;
    const ps = this.playerState;
    const p = this.player;
    const smooth = (v) => { const c = THREE.MathUtils.clamp(v, 0, 1); return c * c * (3 - 2 * c); };
    const lerpAngle = (a0, a1, t) => {
      let d = a1 - a0;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return a0 + d * t;
    };

    a.t += dt;
    const t = a.t;
    const doorPivot = a.rig && a.rig.driverDoorPivot;
    const elbowL = p.armL.userData && p.armL.userData.elbow;
    const elbowR = p.armR.userData && p.armR.userData.elbow;
    const kneeL = p.legL.userData && p.legL.userData.knee;
    const kneeR = p.legR.userData && p.legR.userData.knee;

    if (a.kind === 'steal') {
      p.root.visible = true;
      // Subtle braking nose-dive suspension bounce on target traffic car
      if (a.rig && a.rig.bodyGroup) {
        a.rig.bodyGroup.rotation.x = t < 0.32 ? -0.05 * Math.sin((t / 0.32) * Math.PI) : 0;
        a.rig.bodyGroup.rotation.z = (t >= 0.56 && t < 1.05) ? Math.sin((t - 0.56) * 14) * 0.045 : 0;
      }

      if (t < 0.30) {
        // PHASE 1 (0.00 - 0.30s): Sprint to driver door & reach forward for door handle
        const u = smooth(t / 0.30);
        ps.x = THREE.MathUtils.lerp(a.startX, a.doorX, u);
        ps.z = THREE.MathUtils.lerp(a.startZ, a.doorZ, u);
        ps.yaw = lerpAngle(a.startYaw, a.faceDoorYaw, u);
        const sw = Math.sin(t * 22);
        p.legL.rotation.x = sw * 0.58; p.legR.rotation.x = -sw * 0.58;
        p.armL.rotation.x = -sw * 0.42; p.armR.rotation.x = THREE.MathUtils.lerp(0, 0.88, u);
        if (elbowR) elbowR.rotation.x = 0.28;
        p.body.rotation.set(-0.10, 0, 0);
        p.body.position.y = Math.abs(sw) * 0.04;
      } else if (t < 0.60) {
        // PHASE 2 (0.30 - 0.60s): Yank driver door wide open (-1.18 rad outward!)
        const u = smooth((t - 0.30) / 0.30);
        if (!a.doorOpenedSfx) { a.doorOpenedSfx = true; this.audio.carDoor(); }
        ps.x = a.doorX; ps.z = a.doorZ; ps.yaw = a.faceDoorYaw;
        if (doorPivot) doorPivot.rotation.y = -1.18 * u;
        p.legL.rotation.x = 0.14; p.legR.rotation.x = -0.14;
        p.armR.rotation.x = 0.92 - u * 0.24;
        p.armR.rotation.z = -0.28 * u;
        p.armL.rotation.x = 0.38 * u;
        if (elbowR) elbowR.rotation.x = 0.38 * u;
        p.body.rotation.set(-0.08, -0.32 * u, 0);
        p.body.position.y = 0;
      } else if (t < 1.06) {
        // PHASE 3 (0.60 - 1.06s): Lean INTO cockpit & HAUL NPC DRIVER OUT onto asphalt!
        const u = smooth((t - 0.60) / 0.46);
        if (doorPivot) doorPivot.rotation.y = -1.18;
        if (!a.driverEjected) {
          a.driverEjected = true;
          if (a.rig && a.rig.driverMesh) a.rig.driverMesh.visible = false;
          this.audio.carjack();
          this.camShake = Math.max(this.camShake, 0.22);
          if (this._addPed) {
            const ex = a.doorX - a.rx * 0.28 - a.fx * 0.25;
            const ez = a.doorZ - a.rz * 0.28 - a.fz * 0.25;
            const ejected = this._addPed(ex, 0.02, ez, 1, false, Math.floor(Math.random() * 60), 'z', -775, 180, false);
            ejected.state = 'stagger';
            ejected.stateTimer = 0.92;
            ejected.vx = -a.rx * 5.2 - a.fx * 1.6;
            ejected.vz = -a.rz * 5.2 - a.fz * 1.6;
            ejected.curYaw = a.faceDoorYaw + Math.PI;
            ejected.root.rotation.y = ejected.curYaw;
          }
          for (let k = 0; k < 6; k++) {
            this.spawnParticle(
              a.doorX - a.rx * 0.5, 0.55, a.doorZ - a.rz * 0.5,
              -a.rx * (2.5 + Math.random() * 3.5), 1.4 + Math.random() * 1.6, -a.rz * (2.5 + Math.random() * 3.5),
              0xe8d8c8, 0.55, 0.55, 1.4, 4.5
            );
          }
        }
        ps.x = a.doorX + a.rx * Math.sin(u * Math.PI) * 0.22;
        ps.z = a.doorZ + a.rz * Math.sin(u * Math.PI) * 0.22;
        ps.yaw = a.faceDoorYaw + (u > 0.45 ? -0.45 * Math.sin(((u - 0.45) / 0.55) * Math.PI) : 0);
        // Natural forward two-arm collar grab -> forceful yank outward pose (chest height, NOT overhead!)
        const throwSwing = Math.sin(u * Math.PI);
        p.body.rotation.set(-0.20 * throwSwing, (u - 0.35) * -0.90, 0);
        p.armL.rotation.x = 0.72 * throwSwing + 0.32;
        p.armR.rotation.x = 0.84 * throwSwing + 0.32;
        p.armL.rotation.z = 0.24 * throwSwing;
        p.armR.rotation.z = -0.28 * throwSwing;
        if (elbowL) elbowL.rotation.x = 0.34;
        if (elbowR) elbowR.rotation.x = 0.36;
        p.legL.rotation.x = 0.22; p.legR.rotation.x = -0.26;
      } else if (t < a.dur) {
        // PHASE 4 (1.06 - 1.48s): Slide cleanly into driver seat & slam door shut!
        const u = smooth((t - 1.06) / (a.dur - 1.06));
        ps.x = THREE.MathUtils.lerp(a.doorX, a.seatX, Math.min(1, u * 1.35));
        ps.z = THREE.MathUtils.lerp(a.doorZ, a.seatZ, Math.min(1, u * 1.35));
        ps.yaw = lerpAngle(a.faceDoorYaw, a.carYaw, u);
        p.body.position.y = -0.38 * u;
        p.body.scale.setScalar(1.0 - u * 0.16);
        p.body.rotation.set(-0.14 * u, 0, 0);
        p.legL.rotation.x = 0.65 * u; p.legR.rotation.x = 0.65 * u;
        p.armL.rotation.x = 0.62 * u; p.armR.rotation.x = 0.62 * u;
        p.armL.rotation.z = 0; p.armR.rotation.z = 0;
        if (u > 0.38) {
          const du = smooth((u - 0.38) / 0.62);
          if (doorPivot) doorPivot.rotation.y = -1.18 * (1 - du);
          if (!a.doorClosedSfx && du > 0.85) { a.doorClosedSfx = true; this.audio.carDoor(); }
        }
      }

      p.root.position.set(ps.x, 0, ps.z);
      p.root.rotation.y = ps.yaw;
      if (p.chest) p.chest.rotation.set(0, 0, 0);
      if (p.head) p.head.rotation.set(0, 0, 0);
      if (kneeL) kneeL.rotation.x = -0.15;
      if (kneeR) kneeR.rotation.x = -0.15;

      if (t >= a.dur) {
        if (doorPivot) doorPivot.rotation.y = 0;
        p.body.position.set(0, 0, 0);
        p.body.scale.setScalar(1);
        p.body.rotation.set(0, 0, 0);
        if (p.chest) p.chest.rotation.set(0, 0, 0);
        if (p.head) p.head.rotation.set(0, 0, 0);
        p.armL.rotation.set(0, 0, 0); p.armR.rotation.set(0, 0, 0);
        p.legL.rotation.set(0, 0, 0); p.legR.rotation.set(0, 0, 0);
        const stolen = a.tc;
        this.carjackAnim = null;
        this.finishStealTrafficCar(stolen);
      }
      return;
    }

    // Smooth Animated Enter / Exit for Hero Supercar & Parked Cars (with real hinged door swing!)
    const u = smooth(t / a.dur);
    if (a.kind === 'exit') {
      p.root.visible = true;
      const doorOpen = u < 0.55 ? smooth(u / 0.55) : 1 - smooth((u - 0.55) / 0.45);
      if (doorPivot) doorPivot.rotation.y = -1.08 * doorOpen;
      const stepU = smooth(Math.min(1, u * 1.25));
      ps.x = THREE.MathUtils.lerp(a.seatX, a.doorX - a.rx * 0.42, stepU);
      ps.z = THREE.MathUtils.lerp(a.seatZ, a.doorZ - a.rz * 0.42, stepU);
      ps.yaw = lerpAngle(a.carYaw, a.carYaw, stepU);
      p.body.position.y = -0.28 * (1 - stepU);
      p.body.scale.setScalar(0.86 + 0.14 * stepU);
      p.root.position.set(ps.x, 0, ps.z);
      p.root.rotation.y = ps.yaw;
      if (t >= a.dur) {
        if (doorPivot) doorPivot.rotation.y = 0;
        p.body.position.set(0, 0, 0); p.body.scale.setScalar(1);
        this.orbitYawOffset = a.carYaw;
        this.orbitPitchOffset = 0;
        this.carjackAnim = null;
      }
    } else {
      // 'enter' (active car) or 'parked' (abandoned car)
      p.root.visible = true;
      if (!a.doorOpenedSfx && u > 0.15) { a.doorOpenedSfx = true; this.audio.carDoor(); }
      const doorOpen = u < 0.55 ? smooth(u / 0.55) : 1 - smooth((u - 0.55) / 0.45);
      if (doorPivot) doorPivot.rotation.y = -1.08 * doorOpen;
      if (u < 0.42) {
        const su = smooth(u / 0.42);
        ps.x = THREE.MathUtils.lerp(a.startX, a.doorX, su);
        ps.z = THREE.MathUtils.lerp(a.startZ, a.doorZ, su);
        ps.yaw = lerpAngle(a.startYaw, a.faceDoorYaw, su);
      } else {
        const su = smooth((u - 0.42) / 0.58);
        ps.x = THREE.MathUtils.lerp(a.doorX, a.seatX, su);
        ps.z = THREE.MathUtils.lerp(a.doorZ, a.seatZ, su);
        ps.yaw = lerpAngle(a.faceDoorYaw, a.carYaw, su);
        p.body.position.y = -0.34 * su;
        p.body.scale.setScalar(1 - su * 0.15);
      }
      p.root.position.set(ps.x, 0, ps.z);
      p.root.rotation.y = ps.yaw;
      if (t >= a.dur) {
        if (doorPivot) doorPivot.rotation.y = 0;
        p.body.position.set(0, 0, 0); p.body.scale.setScalar(1);
        const kind = a.kind, veh = a.vehicle, pIdx = a.parkedIdx;
        this.carjackAnim = null;
        if (kind === 'parked') this.enterParkedVehicle(veh, pIdx);
        else {
          this.orbitYawOffset = 0;
          this.orbitPitchOffset = 0;
          this.setMode('car');
        }
      }
    }
  }

  finishStealTrafficCar(tc) {
    const cs = this.carState;
    // Save previously driven vehicle as a persistent parked car in the world
    if (this.activeVehicle) {
      this.activeVehicle.x = cs.x;
      this.activeVehicle.y = cs.y;
      this.activeVehicle.z = cs.z;
      this.activeVehicle.yaw = cs.yaw;
      this.parkedVehicles.push(this.activeVehicle);
    }
    const idx = this.traffic.indexOf(tc);
    if (idx !== -1) this.traffic.splice(idx, 1);

    const rig = tc.userData.carRig || {
      label: 'VICE SEDAN', topSpeed: 40, accel: 17, grip: 0.92,
      bodyGroup: tc, driverDoorPivot: null, wheelSpinGroups: [], frontSteerGroups: [], tailMat: null, headLensMat: null
    };
    if (rig.driverMesh) rig.driverMesh.visible = false;
    if (rig.driverDoorPivot) rig.driverDoorPivot.rotation.y = 0;

    this.activeVehicle = {
      isHero: false,
      label: rig.label,
      mesh: tc,
      rig,
      topSpeed: rig.topSpeed || 42,
      nitroSpeed: (rig.topSpeed || 42) * 1.38,
      accel: rig.accel || 18,
      grip: rig.grip || 0.94,
      x: tc.position.x,
      y: 0,
      z: tc.position.z,
      yaw: tc.rotation.y
    };

    cs.x = tc.position.x;
    cs.y = 0;
    cs.z = tc.position.z;
    cs.vy = 0;
    cs.airborne = false;
    cs.yaw = tc.rotation.y;
    cs.speed = 0;
    cs.steer = 0;
    cs.pitch = 0;
    cs.roll = 0;

    if (this.el.carName) this.el.carName.textContent = `STOLEN · ${rig.label}`;
    this.wantedStars = Math.min(5, Math.max(1, this.wantedStars + 1));
    this.wantedDecay = 16.0;
    this.updateWantedHUD(0);
    this.el.combo.innerHTML = `STOLEN · ${rig.label} <span>CARJACK</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.6;
    this.orbitYawOffset = 0;
    this.orbitPitchOffset = 0;
    this.setMode('car');
  }

  stealTrafficCar(tc) {
    this.startCarjackAnim(tc);
  }

  enterParkedVehicle(pv, parkedIdx) {
    const cs = this.carState;
    if (this.activeVehicle) {
      this.activeVehicle.x = cs.x;
      this.activeVehicle.y = cs.y;
      this.activeVehicle.z = cs.z;
      this.activeVehicle.yaw = cs.yaw;
      this.parkedVehicles.push(this.activeVehicle);
    }
    if (parkedIdx >= 0 && parkedIdx < this.parkedVehicles.length) this.parkedVehicles.splice(parkedIdx, 1);
    this.activeVehicle = pv;
    cs.x = pv.x;
    cs.y = pv.y || 0;
    cs.z = pv.z;
    cs.vy = 0;
    cs.airborne = false;
    cs.yaw = pv.yaw;
    cs.speed = 0;
    cs.steer = 0;
    if (this.el.carName) this.el.carName.textContent = pv.isHero ? pv.label : `STOLEN · ${pv.label}`;
    this.orbitYawOffset = 0;
    this.orbitPitchOffset = 0;
    this.setMode('car');
    this.audio.carDoor();
  }

  enterPlane(plane) {
    if (!plane) return;
    this.cancelAutopilot();
    this.activePlane = plane;
    plane.resetTimer = 0;
    this.playerState.parachuting = false;
    if (this.parachuteMesh) this.parachuteMesh.visible = false;
    this.orbitYawOffset = 0;
    this.orbitPitchOffset = 0;
    this.snapCameraNext = true;
    if (this.el.carName) this.el.carName.textContent = plane.label;
    this.setMode('plane');
    this.drawRadar();
    this.audio.carDoor();
    this.el.combo.innerHTML = `PILOTING · ${plane.label} <span>W THRUST · SPACE CLIMB</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.2;
  }

  exitPlane() {
    const pl = this.activePlane;
    if (!pl) { this.setMode('foot'); return; }
    const ps = this.playerState;
    const rx = Math.cos(pl.yaw), rz = -Math.sin(pl.yaw);
    if (pl.y > 4.5) {
      // Dramatic mid-air parachute bailout!
      ps.x = pl.x - rx * 4.5;
      ps.z = pl.z - rz * 4.5;
      ps.y = Math.max(4.5, pl.y - 1.2);
      ps.vx = -Math.sin(pl.yaw) * Math.min(14, pl.speed * 0.25);
      ps.vz = -Math.cos(pl.yaw) * Math.min(14, pl.speed * 0.25);
      ps.vy = -2.8;
      ps.yaw = pl.yaw;
      ps.grounded = false;
      ps.parachuting = true;
      if (this.parachuteMesh) this.parachuteMesh.visible = true;
      pl.resetTimer = 4.2;
      this.el.combo.innerHTML = `PARACHUTE DEPLOYED! <span>BAILOUT</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 3.0;
    } else {
      // Clean tarmac disembark beside wing/airstair
      pl.speed = 0;
      pl.throttle = 0;
      pl.y = 0.02;
      pl.pitch = 0;
      pl.roll = 0;
      pl.gearBlend = 1;
      this.syncPlaneTransform(pl, 0.016, this.clock.getElapsedTime());
      ps.x = pl.x - rx * 5.2;
      ps.z = pl.z - rz * 5.2;
      ps.y = 0;
      ps.vx = 0; ps.vz = 0; ps.vy = 0;
      ps.yaw = pl.yaw;
      ps.grounded = true;
      ps.parachuting = false;
    }
    this.player.root.position.set(ps.x, ps.y, ps.z);
    this.player.root.rotation.y = ps.yaw;
    this.orbitYawOffset = pl.yaw;
    this.orbitPitchOffset = 0.08;
    this.snapCameraNext = true;
    this.activePlane = null;
    this.setMode('foot');
    this.drawRadar();
    this.audio.carDoor();
  }

  syncPlaneTransform(pl, dt, elapsed) {
    const rig = pl.rig;
    pl.root.position.set(pl.x, pl.y, pl.z);
    pl.root.rotation.order = 'YXZ';
    pl.root.rotation.set(pl.pitch, pl.yaw, pl.roll);

    // Smooth auto-retracting landing gear above 7m AGL
    const targetGear = pl.y < 7.0 ? 1 : 0;
    pl.gearBlend = THREE.MathUtils.damp(pl.gearBlend, targetGear, 4.2, dt);
    if (rig.gearGroup) {
      rig.gearGroup.visible = pl.gearBlend > 0.05;
      rig.gearGroup.scale.y = Math.max(0.05, pl.gearBlend);
    }
    // Spin turbine blades / nose propeller proportional to throttle & airspeed
    const spinRate = 6 + pl.throttle * 34 + pl.speed * 0.45;
    if (rig.fanMeshes) {
      for (let i = 0; i < rig.fanMeshes.length; i++) rig.fanMeshes[i].rotation.z += dt * spinRate;
    }
    if (rig.propHub) {
      rig.propHub.rotation.z += dt * (10 + pl.throttle * 42 + pl.speed * 0.55);
    }
    // Glowing jet afterburner exhaust cones when throttling
    if (rig.afterburnerMat) {
      const abOp = pl.throttle > 0.12 ? THREE.MathUtils.clamp(pl.throttle * 0.85 + Math.sin(elapsed * 45) * 0.12, 0.1, 0.95) : 0;
      rig.afterburnerMat.opacity = abOp;
    }
    if (rig.strobe) {
      rig.strobe.visible = (elapsed % 1.1) < 0.14;
    }
    if (rig.shadow) {
      const altFade = THREE.MathUtils.clamp(1 - pl.y / 38, 0.08, 0.92);
      rig.shadow.position.y = Math.max(-pl.y + 0.04, -38);
      rig.shadow.scale.setScalar(1 + pl.y * 0.015);
      rig.shadow.visible = pl.y < 42;
      if (rig.shadow.material) rig.shadow.material.opacity = altFade * 0.65;
    }
  }

  toggleVehicle(forceEnter = false) {
    if (this.carjackAnim) return;
    this.started = true;
    this.el.startOv.hidden = true;
    const cs = this.carState;
    const ps = this.playerState;

    if (this.mode === 'ride') {
      this.exitPierRide();
      return;
    }
    if (this.mode === 'plane') {
      this.exitPlane();
      return;
    }
    if (this.mode === 'car') {
      this.cancelAutopilot();
      cs.speed *= 0.12;
      this.startVehicleDoorAnim('exit', this.activeVehicle);
    } else {
      const target = this.findNearestVehicleTarget(6.6);
      if (target && target.kind === 'plane') {
        this.enterPlane(target.plane);
        return;
      }
      if (target && target.kind === 'traffic') {
        this.startCarjackAnim(target.mesh);
        return;
      }
      if (target && target.kind === 'parked') {
        this.startVehicleDoorAnim('parked', target.vehicle, target.index);
        return;
      }
      const distCar = Math.hypot(ps.x - cs.x, ps.z - cs.z);
      if (distCar <= 6.6) {
        this.startVehicleDoorAnim('enter', this.activeVehicle);
        return;
      }
      if (!forceEnter) {
        this.el.combo.innerHTML = `BACK TO ${this.activeVehicle.label} <span>DRIVER SEAT</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 1.8;
      }
      this.orbitYawOffset = 0;
      this.orbitPitchOffset = 0;
      this.setMode('car');
      this.audio.carDoor();
    }
  }

  isPointBlocked(x, z, r = 0.45) {
    if (x < -495 || z > 362 || z < -1476) return true;
    for (let i = 0; i < this.boxColliders.length; i++) {
      const b = this.boxColliders[i];
      if (x > b.minX - r && x < b.maxX + r && z > b.minZ - r && z < b.maxZ + r) return true;
    }
    for (let i = 0; i < this.circleColliders.length; i++) {
      const c = this.circleColliders[i];
      if (Math.hypot(x - c.x, z - c.z) < c.r + r) return true;
    }
    return false;
  }

  resolvePlayerCollisions() {
    const ps = this.playerState;
    const cs = this.carState;
    const r = 0.44;

    // 1. Expanded World Perimeter (including Roadable Mount Vice Summit up to Z = -1478!)
    if (ps.x < -495.5) ps.x = -495.5;
    if (ps.z > 364) ps.z = 364;
    if (ps.z < -1478) ps.z = -1478;
    const onCarnivalPier = Math.abs(ps.z + 430) <= 18.5 && ps.x > 16;
    if (onCarnivalPier) {
      ps.x = Math.min(ps.x, 140.0);
    } else if (ps.x > 126) {
      const isPrawn = ps.z < -780;
      const isViceKey = !isPrawn && ps.z < -460;
      const icx = isPrawn ? 164 : (isViceKey ? 156 : 152);
      const icz = isPrawn ? -940 : (isViceKey ? -620 : -300);
      const iRad = isPrawn ? 40.5 : (isViceKey ? 35.5 : 33.5);
      const distI = Math.hypot(ps.x - icx, ps.z - icz);
      if (distI > iRad) {
        ps.x = icx + ((ps.x - icx) / distI) * iRad;
        ps.z = icz + ((ps.z - icz) / distI) * iRad;
      }
    } else if (ps.x > 31 && Math.abs(ps.z + 300) > 9.5 && Math.abs(ps.z + 620) > 9.5 && Math.abs(ps.z + 940) > 9.5) {
      ps.x = 31;
    }

    // 2. Solid Building / Wall AABBs
    for (let i = 0; i < this.boxColliders.length; i++) {
      const b = this.boxColliders[i];
      if (b.minX >= 17.0 && b.maxX <= 18.3) continue;
      const cx = THREE.MathUtils.clamp(ps.x, b.minX, b.maxX);
      const cz = THREE.MathUtils.clamp(ps.z, b.minZ, b.maxZ);
      const dx = ps.x - cx, dz = ps.z - cz;
      const dSq = dx * dx + dz * dz;
      if (dSq < r * r && dSq > 0.00001) {
        const d = Math.sqrt(dSq);
        ps.x += (dx / d) * (r - d);
        ps.z += (dz / d) * (r - d);
      }
    }

    // 3. Solid Cylinders (Palms, Fountains, Lamps, Hydrants, Lighthouse, ATC Tower)
    for (let i = 0; i < this.circleColliders.length; i++) {
      const c = this.circleColliders[i];
      const dx = ps.x - c.x, dz = ps.z - c.z;
      const minD = r + c.r;
      const dSq = dx * dx + dz * dz;
      if (dSq < minD * minD && dSq > 0.00001) {
        const d = Math.sqrt(dSq);
        ps.x += (dx / d) * (minD - d);
        ps.z += (dz / d) * (minD - d);
      }
    }

    // 4. Active Vehicle & Parked Vehicles Solid Bodies
    const pushOutCar = (vx, vz, vyaw) => {
      const dxC = ps.x - vx, dzC = ps.z - vz;
      const fwdX = -Math.sin(vyaw), fwdZ = -Math.cos(vyaw);
      const rightX = Math.cos(vyaw), rightZ = -Math.sin(vyaw);
      const localF = dxC * fwdX + dzC * fwdZ;
      const localR = dxC * rightX + dzC * rightZ;
      const clF = THREE.MathUtils.clamp(localF, -2.35, 2.35);
      const clR = THREE.MathUtils.clamp(localR, -1.05, 1.05);
      const df = localF - clF, dr = localR - clR;
      const cSq = df * df + dr * dr;
      if (cSq < r * r && cSq > 0.00001) {
        const d = Math.sqrt(cSq);
        const push = r - d;
        const pf = (df / d) * push, pr = (dr / d) * push;
        ps.x += fwdX * pf + rightX * pr;
        ps.z += fwdZ * pf + rightZ * pr;
      }
    };
    pushOutCar(cs.x, cs.z, cs.yaw);
    for (let i = 0; i < this.parkedVehicles.length; i++) {
      const pv = this.parkedVehicles[i];
      pushOutCar(pv.x, pv.z, pv.yaw);
    }
  }

  triggerMeleeAttack(type = 'punch') {
    if (this.mode !== 'foot' || !this.started || !this.el.modal.hidden || this.fullMapOpen) return;
    const ps = this.playerState;
    if (ps.attackTimer > 0.08) return;

    if (type === 'punch') ps.attackCombo = (ps.attackCombo % 4) + 1;
    else if (type === 'bat') ps.attackCombo = (ps.attackCombo % 3) + 1;
    else ps.attackCombo = 3;

    ps.attackType = type;
    ps.attackDur = type === 'bat'
      ? (ps.attackCombo === 3 ? 0.50 : 0.44)
      : (type === 'kick'
        ? 0.40
        : (ps.attackCombo === 1 ? 0.26 : (ps.attackCombo === 2 ? 0.30 : (ps.attackCombo === 3 ? 0.34 : 0.40))));
    ps.attackTimer = ps.attackDur;
    ps.hitApplied = false;
    ps.comboResetTimer = 1.85;
    if (type === 'punch' || type === 'kick') ps.combatGuardTimer = 3.8;

    // Soft GTA auto-face toward nearest standing NPC within 3.6m
    let bestPed = null, bestD = 3.6;
    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      if (p.state === 'squished' || p.state === 'ragdoll') continue;
      const d = Math.hypot(p.x - ps.x, p.z - ps.z);
      if (d < bestD) { bestD = d; bestPed = p; }
    }
    if (bestPed) {
      ps.yaw = Math.atan2(-(bestPed.x - ps.x), -(bestPed.z - ps.z));
    }
    if (type === 'bat') this.audio.gunshot('bat');
    else this.audio.punch();
  }

  applyMeleeHit() {
    const ps = this.playerState;
    const fx = -Math.sin(ps.yaw), fz = -Math.cos(ps.yaw);
    const isBat = ps.attackType === 'bat';
    const isHeavy = isBat || ps.attackType === 'kick' || ps.attackCombo === 3;
    const dmg = isBat ? 3 : (isHeavy ? 2 : 1);
    const reach = isBat ? 3.35 : (ps.attackType === 'kick' ? 2.85 : 2.45);

    let hitAny = false;
    for (let i = 0; i < this.pedestrians.length; i++) {
      const ped = this.pedestrians[i];
      if (ped.state === 'squished' || ped.state === 'ragdoll') continue;
      const dx = ped.x - ps.x, dz = ped.z - ps.z;
      const dist = Math.hypot(dx, dz);
      if (dist > reach) continue;
      const fwdDot = dist > 0.01 ? (dx * fx + dz * fz) / dist : 1;
      if (fwdDot < 0.15) continue;

      hitAny = true;
      ped.hp -= dmg;
      const isKO = ped.hp <= 0;

      // Crisp impact sparks at fist/foot contact point
      for (let k = 0; k < (isKO ? 12 : 6); k++) {
        this.spawnParticle(
          ped.x, ped.y + 1.25, ped.z,
          fx * (3 + Math.random() * 4) + (Math.random() - 0.5) * 4,
          2.2 + Math.random() * 3.5,
          fz * (3 + Math.random() * 4) + (Math.random() - 0.5) * 4,
          isKO ? (k % 2 === 0 ? 0xffd36b : 0x34e89e) : 0xff7b2e,
          isKO ? 0.54 : 0.38, isKO ? 0.8 : 0.45, 0.3, 9.5
        );
      }

      this.camShake = Math.max(this.camShake, isKO ? 0.28 : 0.14);
      this.audio.hitNpc(isKO);

      if (isKO) {
        this.koCount += 1;
        this.streakCount += 1;
        this.streakTimer = 4.5;
        const reward = 150 * Math.min(this.streakCount, 5);
        this.cash += reward;
        this.wantedStars = Math.min(5, Math.max(this.wantedStars, Math.ceil((this.squishCount + this.koCount) / 2)));
        this.wantedDecay = 14.0;
        this.el.footKo.textContent = `${this.koCount} KO`;
        this.el.wanted.classList.toggle('active', this.wantedStars > 0);
        this.el.stars.forEach((s, idx) => s.classList.toggle('lit', idx < this.wantedStars));
        this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        const label = ps.attackType === 'kick' ? 'KICK KO!' : (this.streakCount > 1 ? `KNOCKOUT x${this.streakCount}!` : 'KNOCKOUT!');
        this.el.combo.innerHTML = `${label} <span>+$${reward}</span>`;
        this.el.combo.classList.add('on');

        // Dramatic GTA ragdoll knockout flight!
        ped.state = 'ragdoll';
        ped.stateTimer = 9.0;
        const launch = isHeavy ? 11.5 : 8.2;
        ped.vx = fx * launch + (Math.random() - 0.5) * 2.5;
        ped.vz = fz * launch + (Math.random() - 0.5) * 2.5;
        ped.vy = isHeavy ? 6.8 : 4.8;
        ped.spinX = 8.5;
        ped.spinZ = (Math.random() < 0.5 ? -1 : 1) * 6.5;
        ped.splat.visible = false;
        ped.stars.visible = false;
      } else {
        // Stagger knockback recoil -> Aggressive NPCs fight back when punched with fists!
        ped.state = 'stagger';
        ped.stateTimer = (ps.attackType === 'punch' || ps.attackType === 'kick') && (ped.fighter || ped.provoked) ? 0.34 : 0.52;
        if (ps.attackType === 'punch' || ps.attackType === 'kick') {
          if (ped.fighter || ped.provoked) ped.willFightBack = true;
        }
        ped.vx = fx * 5.8;
        ped.vz = fz * 5.8;
        ped.root.rotation.y = Math.atan2(-dx, -dz);
        const moveName = ps.attackType === 'kick' ? 'ROUNDHOUSE!' : (ps.attackCombo === 1 ? 'JAB!' : ps.attackCombo === 2 ? 'CROSS!' : 'UPPERCUT!');
        this.el.combo.innerHTML = ped.willFightBack ? `${moveName} <span>FIGHTING BACK!</span>` : `${moveName} <span>HIT</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 1.8;
      }

      // Panic nearby pedestrians within 14m
      for (let j = 0; j < this.pedestrians.length; j++) {
        const other = this.pedestrians[j];
        if (other !== ped && (other.state === 'walk' || other.state === 'panic')) {
          if (Math.hypot(other.x - ped.x, other.z - ped.z) < 14) {
            other.state = 'panic';
            other.stateTimer = 4.2;
          }
        }
      }
      break;
    }

    // Also bash/kick nearby NPC vehicles with Bat or Melee!
    if (!hitAny) {
      for (let i = 0; i < this.traffic.length; i++) {
        const tc = this.traffic[i];
        if (!tc.visible) continue;
        const dx = tc.position.x - ps.x, dz = tc.position.z - ps.z;
        const dist = Math.hypot(dx, dz);
        if (dist < reach + 1.55) {
          hitAny = true;
          this.damageVehicle(tc, isBat ? 28 : 15, ps.x + fx * 1.4, 1.0, ps.z + fz * 1.4, fx, fz, isBat ? 'BASEBALL BAT' : 'MELEE');
          break;
        }
      }
    }

    // Also kick/punch nearby traffic cones & beach balls!
    for (let i = 0; i < this.knockables.length; i++) {
      const kb = this.knockables[i];
      if (!kb.active && Math.hypot(kb.x - ps.x, kb.z - ps.z) < reach) {
        kb.active = true;
        kb.resetTimer = 14.0;
        kb.vx = fx * 12 + (Math.random() - 0.5) * 3;
        kb.vz = fz * 12 + (Math.random() - 0.5) * 3;
        kb.vy = kb.type === 'ball' ? 8.5 : 5.0;
        kb.rx = 9; kb.rz = -8;
        if (!hitAny) this.audio.impact(0.4);
      }
    }
  }

  // Build exact road-network graph & Dijkstra shortest path (ZERO wall-clipping!)
  planAutopilotTo(wp) {
    if (this.mode === 'foot') this.setMode('car');
    const cs = this.carState;
    const nodes = [];
    const adj = new Map();
    const addNode = (id, x, z) => {
      const idx = nodes.length;
      nodes.push({ id, x, z });
      adj.set(idx, []);
      return idx;
    };
    const addEdge = (a, b) => {
      if (a === b) return;
      const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
      adj.get(a).push({ to: b, cost: d });
      adj.get(b).push({ to: a, cost: d });
    };

    // 1. All 15 city intersections (AVENUES x CROSS_STREETS)
    const gridIdx = {};
    for (let ai = 0; ai < AVENUES.length; ai++) {
      for (let ci = 0; ci < CROSS_STREETS.length; ci++) {
        gridIdx[`${ai}_${ci}`] = addNode(`I_${ai}_${ci}`, AVENUES[ai], CROSS_STREETS[ci]);
      }
    }
    for (let ai = 0; ai < AVENUES.length; ai++) {
      for (let ci = 0; ci < CROSS_STREETS.length - 1; ci++) {
        addEdge(gridIdx[`${ai}_${ci}`], gridIdx[`${ai}_${ci + 1}`]);
      }
    }
    for (let ci = 0; ci < CROSS_STREETS.length; ci++) {
      for (let ai = 0; ai < AVENUES.length - 1; ai++) {
        addEdge(gridIdx[`${ai}_${ci}`], gridIdx[`${ai + 1}_${ci}`]);
      }
    }

    // 2. Causeway Bridges: Starfish (-300 -> 0_4), Vice Key (-620 -> 0_6) & Prawn Island (-940 -> 0_8)
    const b0 = addNode('B0', 16, -300);
    const b1 = addNode('B1', 68, -300);
    const b2 = addNode('B2', 120, -300);
    const b3 = addNode('B3', 142, -300);
    addEdge(gridIdx['0_4'], b0);
    addEdge(b0, b1);
    addEdge(b1, b2);
    addEdge(b2, b3);

    const k0 = addNode('K0', 16, -620);
    const k1 = addNode('K1', 68, -620);
    const k2 = addNode('K2', 120, -620);
    const k3 = addNode('K3', 146, -620);
    addEdge(gridIdx['0_6'], k0);
    addEdge(k0, k1);
    addEdge(k1, k2);
    addEdge(k2, k3);

    const p0 = addNode('P0', 16, -940);
    const p1 = addNode('P1', 68, -940);
    const p2 = addNode('P2', 120, -940);
    const p3 = addNode('P3', 152, -940);
    addEdge(gridIdx['0_8'], p0);
    addEdge(p0, p1);
    addEdge(p1, p2);
    addEdge(p2, p3);

    // Helper: snap any arbitrary (x, z) onto its nearest clear road centerline segment
    const attachPoint = (tag, px, pz) => {
      if (px > 10) {
        const isPrawn = pz < -780;
        const isViceKey = !isPrawn && pz < -460;
        const bz = isPrawn ? -940 : (isViceKey ? -620 : -300);
        const maxX = isPrawn ? 152 : (isViceKey ? 146 : 142);
        const cx = THREE.MathUtils.clamp(px, 14, maxX);
        const id = addNode(tag, cx, bz);
        const bridgeIds = isPrawn ? [gridIdx['0_8'], p0, p1, p2, p3]
          : (isViceKey ? [gridIdx['0_6'], k0, k1, k2, k3] : [gridIdx['0_4'], b0, b1, b2, b3]);
        const bridgeXs = [0, 16, 68, 120, maxX];
        let seg = 0;
        for (let k = 0; k < bridgeXs.length - 1; k++) {
          if (cx >= bridgeXs[k] && cx <= bridgeXs[k + 1]) { seg = k; break; }
          if (cx > bridgeXs[k + 1]) seg = k;
        }
        addEdge(id, bridgeIds[seg]);
        addEdge(id, bridgeIds[seg + 1]);
        return { idx: id, segKey: `BR_${isPrawn ? 'P' : (isViceKey ? 'K' : 'S')}_${seg}`, x: cx, z: bz };
      }

      // Compare distance to nearest Avenue vs nearest Cross Street
      let bestAi = 0, bestAveD = Infinity;
      for (let ai = 0; ai < AVENUES.length; ai++) {
        const d = Math.abs(px - AVENUES[ai]);
        if (d < bestAveD) { bestAveD = d; bestAi = ai; }
      }
      let bestCi = 0, bestCrossD = Infinity;
      for (let ci = 0; ci < CROSS_STREETS.length; ci++) {
        const d = Math.abs(pz - CROSS_STREETS[ci]);
        if (d < bestCrossD) { bestCrossD = d; bestCi = ci; }
      }

      if (bestAveD <= bestCrossD) {
        const ax = AVENUES[bestAi];
        const cz = THREE.MathUtils.clamp(pz, -1100, 340);
        const id = addNode(tag, ax, cz);
        let seg = 0;
        for (let ci = 0; ci < CROSS_STREETS.length - 1; ci++) {
          if (cz <= CROSS_STREETS[ci] && cz >= CROSS_STREETS[ci + 1]) { seg = ci; break; }
        }
        addEdge(id, gridIdx[`${bestAi}_${seg}`]);
        addEdge(id, gridIdx[`${bestAi}_${seg + 1}`]);
        return { idx: id, segKey: `A_${bestAi}_${seg}`, x: ax, z: cz };
      } else {
        const cz = CROSS_STREETS[bestCi];
        const cx = THREE.MathUtils.clamp(px, -480, 0);
        const id = addNode(tag, cx, cz);
        let seg = 0;
        for (let ai = 0; ai < AVENUES.length - 1; ai++) {
          if (cx <= AVENUES[ai] && cx >= AVENUES[ai + 1]) { seg = ai; break; }
        }
        addEdge(id, gridIdx[`${seg}_${bestCi}`]);
        addEdge(id, gridIdx[`${seg + 1}_${bestCi}`]);
        return { idx: id, segKey: `C_${bestCi}_${seg}`, x: cx, z: cz };
      }
    };

    const startSnap = attachPoint('START', cs.x, cs.z);
    const goalSnap = attachPoint('GOAL', wp.x, wp.z);
    if (startSnap.segKey === goalSnap.segKey) addEdge(startSnap.idx, goalSnap.idx);

    // 3. Dijkstra Shortest Path
    const N = nodes.length;
    const dist = new Array(N).fill(Infinity);
    const prev = new Array(N).fill(-1);
    const used = new Array(N).fill(false);
    dist[startSnap.idx] = 0;

    for (let iter = 0; iter < N; iter++) {
      let u = -1, best = Infinity;
      for (let i = 0; i < N; i++) {
        if (!used[i] && dist[i] < best) { best = dist[i]; u = i; }
      }
      if (u === -1 || u === goalSnap.idx) break;
      used[u] = true;
      const edges = adj.get(u);
      for (let k = 0; k < edges.length; k++) {
        const e = edges[k];
        if (!used[e.to] && dist[u] + e.cost < dist[e.to]) {
          dist[e.to] = dist[u] + e.cost;
          prev[e.to] = u;
        }
      }
    }

    const rawPts = [];
    for (let cur = goalSnap.idx; cur !== -1; cur = prev[cur]) {
      rawPts.push({ x: nodes[cur].x, z: nodes[cur].z });
    }
    rawPts.reverse();

    // Remove START node if already within 5m of it, keep all corner turns intact, append exact showroom pull-in
    const queue = [];
    for (let i = 0; i < rawPts.length; i++) {
      const p = rawPts[i];
      if (i === 0 && Math.hypot(p.x - cs.x, p.z - cs.z) < 5.5) continue;
      const last = queue[queue.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 2.5) queue.push(p);
    }
    const lastPt = queue[queue.length - 1];
    if (!lastPt || Math.hypot(wp.x - lastPt.x, wp.z - lastPt.z) > 1.8) {
      queue.push({ x: wp.x, z: wp.z });
    }

    this.autopilotTarget = wp;
    this.autopilotQueue = queue;
    this.autopilotPath = [{ x: cs.x, z: cs.z }, ...queue];
    this.autopilotStuckTimer = 0;
    this.autopilotReverseTimer = 0;
    this.autopilotLastPos = { x: cs.x, z: cs.z };
    this.lastAutoDist = -1;
    this.el.autoBar.classList.add('on');
    this.el.navBar.classList.add('on');
    this.el.lampAuto.classList.add('on-auto');
    this.el.autoText.textContent = `GPS Auto-Drive → ${wp.label}`;
    if (this.navBeacon) {
      this.navBeacon.group.position.set(wp.x, 0, wp.z);
      this.navBeacon.group.visible = true;
    }
    if (this.navArrow) this.navArrow.visible = true;
  }

  openFullMap() {
    this.fullMapOpen = true;
    this.el.fullMapOv.hidden = false;
    this.releasePointerLock();
    this.drawFullMap();
  }

  closeFullMap() {
    this.fullMapOpen = false;
    this.el.fullMapOv.hidden = true;
    this.syncReticleVisibility();
  }

  drawFullMap() {
    const ctx = this.fullMapCtx;
    if (!ctx) return;
    const w = 520, h = 520;
    const cs = this.carState;

    // Expanded World bounds including Mount Vice Mountain Range: X in [-525, 232], Z in [-1505, 390]
    const minX = -525, maxX = 232, minZ = -1505, maxZ = 390;
    const pad = 14;
    const scale = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxZ - minZ));
    const offX = (w - (maxX - minX) * scale) * 0.5;
    const offY = (h - (maxZ - minZ) * scale) * 0.5;
    const toMap = (wx, wz) => [offX + (wx - minX) * scale, offY + (wz - minZ) * scale];
    this._fullMapMeta = { minX, minZ, scale, offX, offY };

    // Ocean gradient backdrop
    const oceanGrad = ctx.createLinearGradient(0, 0, w, h);
    oceanGrad.addColorStop(0, '#071b2e');
    oceanGrad.addColorStop(1, '#0e364f');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Coastal turquoise shallows + sandy Miami beach + expanded mainland + Mount Vice Wilderness
    const [landLeft, landTop] = toMap(-500, -1130);
    const [mtTopX, mtTopY] = toMap(-505, -1488);
    const [mtRightX] = toMap(42, -1488);
    const [beachRight, landBot] = toMap(30, 368);
    const [cityRight] = toMap(15, 368);
    // Mount Vice Alpine Mountain Terrain & Elevation Contours
    ctx.fillStyle = '#243a2c';
    ctx.fillRect(mtTopX, mtTopY, mtRightX - mtTopX, landTop - mtTopY + 4);
    const [pkX, pkY] = toMap(-228, -1432);
    [155, 110, 68, 32].forEach((r, idx) => {
      ctx.fillStyle = idx === 3 ? '#7c7870' : (idx === 2 ? '#595852' : (idx === 1 ? '#364d36' : '#2c4430'));
      ctx.beginPath(); ctx.ellipse(pkX, pkY, r * scale * 1.15, r * scale * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    });
    // Switchback Mountain Highway Ribbon on Full Map
    ctx.strokeStyle = '#FFD36B';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    MOUNT_VICE_ROAD.forEach((rp, idx) => {
      const [rx, ry] = toMap(rp.x, rp.z);
      if (idx === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
    });
    ctx.stroke();

    ctx.fillStyle = 'rgba(33, 230, 209, 0.14)';
    ctx.fillRect(cityRight, landTop, 38 * scale, landBot - landTop);
    ctx.fillRect(landLeft - 24 * scale, landTop, 24 * scale, landBot - landTop);
    ctx.fillStyle = '#c8a97e';
    ctx.fillRect(cityRight, landTop, (beachRight - cityRight), landBot - landTop);
    ctx.fillStyle = '#1b1826';
    ctx.fillRect(landLeft, landTop, cityRight - landLeft, landBot - landTop);

    // Shaded city blocks (between all 6 avenues & 10 cross streets)
    ctx.fillStyle = '#252136';
    for (let ai = 0; ai < AVENUES.length - 1; ai++) {
      for (let ci = 0; ci < CROSS_STREETS.length - 1; ci++) {
        if (ci === 1 && ai < 3) continue; // Airport tarmac
        const [bx1, by1] = toMap(AVENUES[ai + 1] + 10, CROSS_STREETS[ci + 1] + 10);
        const [bx2, by2] = toMap(AVENUES[ai] - 10, CROSS_STREETS[ci] - 10);
        ctx.fillRect(bx1, by1, bx2 - bx1, by2 - by1);
      }
    }

    // Vice City International Airport Tarmac, Terminal, Jetways & Runway
    const [apX1, apY1] = toMap(-276, 30);
    const [apX2, apY2] = toMap(-12, 170);
    ctx.fillStyle = '#2a2a38';
    ctx.fillRect(apX1, apY1, apX2 - apX1, apY2 - apY1);
    const [termX1, termY1] = toMap(-142, 34);
    const [termX2, termY2] = toMap(-74, 52);
    ctx.fillStyle = '#38c8d8';
    ctx.fillRect(termX1, termY1, termX2 - termX1, termY2 - termY1);
    const [rw1, ry1] = toMap(-268, 114);
    const [rw2] = toMap(-20, 114);
    ctx.strokeStyle = 'rgba(255, 211, 107, 0.78)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(rw1, ry1); ctx.lineTo(rw2, ry1); ctx.stroke();
    ctx.setLineDash([]);
    // Parked & Flying Airliner silhouettes on Full Map
    const jetsOnMap = [[-127, 78, '#FF2E88'], [-88, 78, '#21E6D1'], [-38, 70, '#FFD36B']];
    if (this.flyingJet) jetsOnMap.push([this.flyingJet.root.position.x, this.flyingJet.root.position.z, '#FF8A2A']);
    jetsOnMap.forEach(([jx, jz, col]) => {
      const [mjx, mjy] = toMap(jx, jz);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(mjx, mjy, 3.2, 0, Math.PI * 2); ctx.fill();
    });

    // Vice Pier Carnival Fair Deck (X = 17.5..141.5, Z = -448..-412)
    const [pierX1, pierY1] = toMap(17.5, -448);
    const [pierX2, pierY2] = toMap(141.5, -412);
    ctx.fillStyle = '#6f4e37';
    ctx.fillRect(pierX1, pierY1, pierX2 - pierX1, pierY2 - pierY1);
    ctx.strokeStyle = '#FF2E88';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(pierX1, pierY1, pierX2 - pierX1, pierY2 - pierY1);

    // Starfish Island (-300), Vice Key Resort (-620) & Prawn Island Film Studios (-940)
    [[152, -300, 37], [156, -620, 39], [164, -940, 43]].forEach(([cx, cz, rad]) => {
      const [ix, iy] = toMap(cx, cz);
      ctx.fillStyle = 'rgba(33, 230, 209, 0.2)';
      ctx.beginPath(); ctx.arc(ix, iy, (rad + 7) * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c8a97e';
      ctx.beginPath(); ctx.arc(ix, iy, rad * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2438';
      ctx.beginPath(); ctx.arc(ix, iy, (rad - 8) * scale, 0, Math.PI * 2); ctx.fill();
    });

    // Roads (6 Avenues + 10 Cross Streets + 3 Neon Causeway Bridges)
    ctx.strokeStyle = 'rgba(232, 228, 240, 0.56)';
    ctx.lineWidth = Math.max(2.6, ROAD_W * scale);
    ctx.lineCap = 'round';
    AVENUES.forEach((ax) => {
      const [x1, y1] = toMap(ax, 360);
      const [x2, y2] = toMap(ax, -1120);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    CROSS_STREETS.forEach((cz) => {
      const [x1, y1] = toMap(-486, cz);
      const [x2, y2] = toMap(8, cz);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    [[-300, '#21E6D1'], [-620, '#FF2E88'], [-940, '#FFD36B']].forEach(([bz, col]) => {
      const [bx1, by1] = toMap(4, bz);
      const [bx2, by2] = toMap(152, bz);
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(2.8, 14 * scale);
      ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();
    });

    // District labels across full 6x10 Vice City
    ctx.fillStyle = 'rgba(255, 245, 238, 0.54)';
    ctx.font = '700 8px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    [
      ['SOUTH MARINA', -48, 265],
      ['OCEAN BEACH', -48, -60],
      ['VICE POINT', -48, -380],
      ['NORTH MALL', -120, -1015],
      ['DOWNTOWN', -144, -220],
      ['LITTLE HAVANA', -144, -535],
      ['WEST BAYSIDE', -240, -295],
      ['LITTLE HAITI', -348, -425],
      ['VICE PORT', -432, -195],
      ["INT'L AIRPORT", -144, 146],
      ['CARNIVAL PIER', 82, -460],
      ['STARFISH', 152, -356],
      ['VICE KEY', 156, -678],
      ['PRAWN STUDIOS', 164, -1005],
      ['MOUNT VICE 66M', -228, -1454]
    ].forEach(([lbl, wx, wz]) => {
      const [lx, ly] = toMap(wx, wz);
      ctx.fillText(lbl, lx, ly);
    });

    // Active GPS route polyline
    if (this.autopilotQueue.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#FF2E88';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      const [sx, sy] = toMap(cs.x, cs.z);
      ctx.moveTo(sx, sy);
      for (let i = 0; i < this.autopilotQueue.length; i++) {
        const [qx, qy] = toMap(this.autopilotQueue[i].x, this.autopilotQueue[i].z);
        ctx.lineTo(qx, qy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Piles of Cash ($100 Green Bill Stacks), Weapon Pickups, Ramps & Boost Pads
    this.tokens.forEach((tk) => {
      if (tk.collected) return;
      const [tx, ty] = toMap(tk.x, tk.z);
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(tx - 5, ty - 3.6, 10, 7.2);
      ctx.strokeStyle = '#072213';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(tx - 5, ty - 3.6, 10, 7.2);
      ctx.fillStyle = '#062010';
      ctx.font = '900 7px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('$', tx, ty + 2.4);
    });
    this.weaponPickups.forEach((wp) => {
      const [wx, wy] = toMap(wp.x, wp.z);
      ctx.fillStyle = '#FF2E88';
      ctx.beginPath();
      ctx.moveTo(wx, wy - 5.5); ctx.lineTo(wx + 5.5, wy); ctx.lineTo(wx, wy + 5.5); ctx.lineTo(wx - 5.5, wy); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#FFF5EE'; ctx.lineWidth = 1; ctx.stroke();
    });
    this.ramps.forEach((rp) => {
      const [rx, ry] = toMap(rp.x, rp.z);
      ctx.fillStyle = '#FF8A2A';
      ctx.beginPath();
      ctx.moveTo(rx, ry - 4); ctx.lineTo(rx + 3.5, ry + 3); ctx.lineTo(rx - 3.5, ry + 3); ctx.closePath();
      ctx.fill();
    });
    this.boostPads.forEach((bp) => {
      const [px, py] = toMap(bp.x, bp.z);
      ctx.fillStyle = '#21E6D1';
      ctx.fillRect(px - 2.2, py - 2.2, 4.4, 4.4);
    });

    // Unique Landmarks on Full Map (Carnival Ferris Wheel, Int'l Airport, Fountain Plazas, Tiki Bar, Lighthouse)
    [
      [121, -430, '#FF2E88', 'F'],
      [-108, 42, '#21E6D1', '✈'],
      [-48, -60, '#21E6D1', '✦'],
      [-48, -380, '#21E6D1', '✦'],
      [23.5, -254, '#FF8A2A', 'T'],
      [177, -300, '#FF465A', 'L']
    ].forEach(([lx, lz, col, sym]) => {
      const [mx, my] = toMap(lx, lz);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(mx, my, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0B0418';
      ctx.font = '800 7.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sym, mx, my + 2.6);
    });

    // Numbered Showroom Pins
    SHOWROOMS.forEach((sr) => {
      const [sx, sy] = toMap(sr.x, sr.z);
      const vis = this.visited.has(sr.id);
      ctx.fillStyle = vis ? '#FFD36B' : sr.accentHex;
      ctx.beginPath(); ctx.arc(sx, sy, 8.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#0B0418';
      ctx.font = '800 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sr.num, sx, sy + 3.2);
    });

    // Enterable Building Doorway Pins & Flyable Aircraft Pins on Full Map
    if (this.enterableBuildings) {
      this.enterableBuildings.forEach((eb) => {
        const [ex, ey] = toMap(eb.doorX, eb.doorZ);
        ctx.fillStyle = '#34E89E';
        ctx.fillRect(ex - 5, ey - 5, 10, 10);
        ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.4;
        ctx.strokeRect(ex - 5, ey - 5, 10, 10);
      });
    }
    if (this.flyablePlanes) {
      this.flyablePlanes.forEach((pl) => {
        const [ax, ay] = toMap(pl.x, pl.z);
        ctx.fillStyle = '#FFD36B';
        ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0B0418';
        ctx.font = '800 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✈', ax, ay + 2.8);
      });
    }

    // Parked Supercar Marker when roaming on foot or flying
    if (this.mode !== 'car') {
      const [cx, cy] = toMap(cs.x, cs.z);
      ctx.fillStyle = '#21E6D1';
      ctx.fillRect(cx - 4.5, cy - 6.5, 9, 13);
      ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.6;
      ctx.strokeRect(cx - 4.5, cy - 6.5, 9, 13);
    }

    // Active Actor (Player, Car, or Flying Airplane) Chevron
    const act = this.mode === 'plane' && this.activePlane ? this.activePlane : (this.mode === 'foot' ? this.playerState : cs);
    const [px, py] = toMap(act.x, act.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-act.yaw);
    ctx.fillStyle = this.mode === 'plane' ? '#FFD36B' : '#FFF5EE';
    ctx.beginPath();
    ctx.moveTo(0, -9); ctx.lineTo(6.5, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6.5, 7); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.mode === 'plane' ? '#FF2E88' : (this.mode === 'foot' ? '#21E6D1' : '#FF2E88'); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();

    // Subtle tactical GPS latitude/longitude grid + Time/Weather badge on Full Map
    ctx.strokeStyle = 'rgba(33, 230, 209, 0.07)';
    ctx.lineWidth = 1;
    for (let g = 40; g < w; g += 48) {
      ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(w, g); ctx.stroke();
    }
    const tpLbl = `${TIME_PRESETS[this.timeIdx].icon} ${TIME_PRESETS[this.timeIdx].label.toUpperCase()} · ${WEATHER_PRESETS[this.weatherIdx].icon} ${WEATHER_PRESETS[this.weatherIdx].label.toUpperCase()}`;
    ctx.fillStyle = 'rgba(10, 5, 22, 0.78)';
    ctx.fillRect(10, 10, 152, 22);
    ctx.strokeStyle = 'rgba(33, 230, 209, 0.34)';
    ctx.strokeRect(10, 10, 152, 22);
    ctx.fillStyle = '#21E6D1';
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(tpLbl, 18, 24);

    // Update live distances in sidebar
    this.el.fmDists.forEach((el) => {
      const wp = WAYPOINTS.find((w) => w.id === el.dataset.fmDist);
      if (wp) el.textContent = `${Math.round(Math.hypot(wp.x - act.x, wp.z - act.z))}m`;
    });
  }

  drawRadar() {
    const ctx = this.radarCtx;
    if (!ctx) return;
    const w = 212, h = 184;
    ctx.clearRect(0, 0, w, h);

    // Deep Atlantic Ocean Gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, w, h);
    oceanGrad.addColorStop(0, '#071b2e');
    oceanGrad.addColorStop(1, '#0d314b');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    const cs = this.carState;
    const act = this.mode === 'plane' && this.activePlane
      ? this.activePlane
      : ((this.mode === 'foot' || this.mode === 'ride') ? this.playerState : cs);
    const scale = this.mode === 'plane' ? 0.24 : (this.mode === 'foot' ? 0.68 : (this.mode === 'ride' ? 0.56 : 0.46));
    const toRadar = (wx, wz) => [w * 0.5 + (wx - act.x) * scale, h * 0.5 + (wz - act.z) * scale];

    // Shallows, Miami Beach Sand, Turquoise Coastline & Mainland
    const [coastX] = toRadar(14, act.z);
    const [beachX] = toRadar(30, act.z);
    const [shallowX] = toRadar(44, act.z);
    ctx.fillStyle = 'rgba(33, 230, 209, 0.18)';
    ctx.fillRect(0, 0, Math.max(0, Math.min(w, shallowX)), h);
    ctx.fillStyle = '#c8a77b';
    ctx.fillRect(0, 0, Math.max(0, Math.min(w, beachX)), h);
    ctx.fillStyle = '#191626';
    ctx.fillRect(0, 0, Math.max(0, Math.min(w, coastX)), h);
    if (beachX > 0 && beachX < w) {
      ctx.strokeStyle = 'rgba(33, 230, 209, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(beachX, 0); ctx.lineTo(beachX, h); ctx.stroke();
    }

    // Mount Vice Mountain Range & Winding Switchback Highway on Tactical Minimap
    const [rmX1, rmY1] = toRadar(-505, -1488);
    const [rmX2, rmY2] = toRadar(42, -1115);
    if (rmY2 > 0 && rmY1 < h && rmX2 > 0 && rmX1 < w) {
      ctx.fillStyle = '#213728';
      ctx.fillRect(rmX1, rmY1, rmX2 - rmX1, rmY2 - rmY1);
      const [rpkX, rpkY] = toRadar(-228, -1432);
      ctx.fillStyle = '#4e524c';
      ctx.beginPath(); ctx.arc(rpkX, rpkY, 72 * scale, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 211, 107, 0.85)';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      MOUNT_VICE_ROAD.forEach((rp, idx) => {
        const [rx, ry] = toRadar(rp.x, rp.z);
        if (idx === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      });
      ctx.stroke();
    }

    // City Blocks with Subtle Architectural Edge
    ctx.fillStyle = '#252036';
    ctx.strokeStyle = 'rgba(255, 245, 238, 0.08)';
    ctx.lineWidth = 1;
    for (let ai = 0; ai < AVENUES.length - 1; ai++) {
      for (let ci = 0; ci < CROSS_STREETS.length - 1; ci++) {
        const [bx1, by1] = toRadar(AVENUES[ai + 1] + 10, CROSS_STREETS[ci + 1] + 10);
        const [bx2, by2] = toRadar(AVENUES[ai] - 10, CROSS_STREETS[ci] - 10);
        if (bx2 < 0 || bx1 > w || by2 < 0 || by1 > h) continue;
        ctx.fillRect(bx1, by1, bx2 - bx1, by2 - by1);
        ctx.strokeRect(bx1, by1, bx2 - bx1, by2 - by1);
      }
    }

    // Vice Int'l Airport Tarmac & Terminal on Minimap
    const [rapX1, rapY1] = toRadar(-276, 30);
    const [rapX2, rapY2] = toRadar(-12, 170);
    if (rapX2 > 0 && rapX1 < w && rapY2 > 0 && rapY1 < h) {
      ctx.fillStyle = '#262836';
      ctx.fillRect(rapX1, rapY1, rapX2 - rapX1, rapY2 - rapY1);
      const [rtX1, rtY1] = toRadar(-142, 34);
      const [rtX2, rtY2] = toRadar(-74, 52);
      ctx.fillStyle = 'rgba(33, 230, 209, 0.55)';
      ctx.fillRect(rtX1, rtY1, rtX2 - rtX1, rtY2 - rtY1);
      const [rrw1, rry1] = toRadar(-268, 114);
      const [rrw2] = toRadar(-20, 114);
      ctx.strokeStyle = 'rgba(255, 211, 107, 0.72)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(rrw1, rry1); ctx.lineTo(rrw2, rry1); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Vice Beach Carnival Fair & Amusement Pier on Minimap
    const [rpX1, rpY1] = toRadar(17.5, -448);
    const [rpX2, rpY2] = toRadar(141.5, -412);
    if (rpX2 > 0 && rpX1 < w && rpY2 > 0 && rpY1 < h) {
      ctx.fillStyle = '#6f4e37';
      ctx.fillRect(rpX1, rpY1, rpX2 - rpX1, rpY2 - rpY1);
      ctx.strokeStyle = 'rgba(255, 46, 136, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(rpX1, rpY1, rpX2 - rpX1, rpY2 - rpY1);
    }

    // Starfish Island, Vice Key Island & Prawn Island Studios
    [[152, -300, 37], [156, -620, 39], [164, -940, 43]].forEach(([cx, cz, rad]) => {
      const [ix, iy] = toRadar(cx, cz);
      ctx.fillStyle = 'rgba(33, 230, 209, 0.22)';
      ctx.beginPath(); ctx.arc(ix, iy, (rad + 6) * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c8a77b';
      ctx.beginPath(); ctx.arc(ix, iy, rad * scale, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b2538';
      ctx.beginPath(); ctx.arc(ix, iy, (rad - 8) * scale, 0, Math.PI * 2); ctx.fill();
    });

    // Subtle Tactical Blueprint Grid
    ctx.strokeStyle = 'rgba(33, 230, 209, 0.075)';
    ctx.lineWidth = 1;
    for (let gx = 32; gx < w; gx += 36) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (let gy = 32; gy < h; gy += 36) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

    // Dual-Tone Road Grid (Expanded 6x10 Avenues & Cross Streets + 3 Bridges)
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(218, 214, 232, 0.48)';
    ctx.lineWidth = 7.4;
    AVENUES.forEach((ax) => {
      const [x1, y1] = toRadar(ax, 362);
      const [x2, y2] = toRadar(ax, -1122);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    CROSS_STREETS.forEach((cz) => {
      const [x1, y1] = toRadar(-488, cz);
      const [x2, y2] = toRadar(8, cz);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(255, 211, 107, 0.36)';
    ctx.lineWidth = 1.2;
    AVENUES.forEach((ax) => {
      const [x1, y1] = toRadar(ax, 362);
      const [x2, y2] = toRadar(ax, -1122);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    [[-300, 'rgba(33, 230, 209, 0.9)'], [-620, 'rgba(255, 46, 136, 0.9)'], [-940, 'rgba(255, 211, 107, 0.9)']].forEach(([bz, col]) => {
      const [bx1, by1] = toRadar(4, bz);
      const [bx2, by2] = toRadar(152, bz);
      ctx.strokeStyle = col;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();
    });

    // Weapon Pickup Diamonds on Minimap
    for (let i = 0; i < this.weaponPickups.length; i++) {
      const wp = this.weaponPickups[i];
      const [wx, wy] = toRadar(wp.x, wp.z);
      if (wx < -6 || wx > w + 6 || wy < -6 || wy > h + 6) continue;
      ctx.fillStyle = '#FF2E88';
      ctx.beginPath();
      ctx.moveTo(wx, wy - 4.5); ctx.lineTo(wx + 4.5, wy); ctx.lineTo(wx, wy + 4.5); ctx.lineTo(wx - 4.5, wy); ctx.closePath();
      ctx.fill();
    }

    // Active GPS Navigation Route Line
    if (this.autopilotQueue.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#FF2E88';
      ctx.lineWidth = 3.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.5);
      for (let i = 0; i < this.autopilotQueue.length; i++) {
        const [qx, qy] = toRadar(this.autopilotQueue[i].x, this.autopilotQueue[i].z);
        ctx.lineTo(qx, qy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Emerald Piles of Cash ($ Icons) & Stunt Ramps
    for (let i = 0; i < this.tokens.length; i++) {
      const tk = this.tokens[i];
      if (tk.collected) continue;
      const [tx, ty] = toRadar(tk.x, tk.z);
      if (tx < -6 || tx > w + 6 || ty < -6 || ty > h + 6) continue;
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(tx - 5, ty - 3.5, 10, 7);
      ctx.strokeStyle = '#072213';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx - 5, ty - 3.5, 10, 7);
      ctx.fillStyle = '#FFFDF5';
      ctx.font = '900 6.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('$', tx, ty + 2.3);
    }
    for (let i = 0; i < this.ramps.length; i++) {
      const rp = this.ramps[i];
      const [rx, ry] = toRadar(rp.x, rp.z);
      if (rx < -4 || rx > w + 4 || ry < -4 || ry > h + 4) continue;
      ctx.fillStyle = '#FF8A2A';
      ctx.fillRect(rx - 2, ry - 2, 4, 4);
    }

    // Landmark Badges (Carnival Ferris Wheel, Int'l Airport, Fountain Plazas, Tiki Bar)
    [
      [121, -430, '#FF2E88', 'F'],
      [-108, 42, '#21E6D1', '✈'],
      [-48, -60, '#21E6D1', '✦'],
      [-48, -380, '#21E6D1', '✦'],
      [23.5, -254, '#FF8A2A', 'T']
    ].forEach(([lx, lz, col, sym]) => {
      const [mx, my] = toRadar(lx, lz);
      if (mx < 4 || mx > w - 4 || my < 4 || my > h - 4) return;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(mx, my, 4.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0B0418';
      ctx.font = '800 6.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sym, mx, my + 2.3);
    });

    // Live Flying Airliner Blip on Minimap
    if (this.flyingJet) {
      const [fjx, fjy] = toRadar(this.flyingJet.root.position.x, this.flyingJet.root.position.z);
      if (fjx > 4 && fjx < w - 4 && fjy > 4 && fjy < h - 4) {
        ctx.fillStyle = '#FF8A2A';
        ctx.beginPath(); ctx.arc(fjx, fjy, 3.8, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Nearby Pedestrian Blips (Hot Pink for Bikini Beachgoers, Soft White for Locals)
    for (let i = 0; i < this.pedestrians.length; i++) {
      const ped = this.pedestrians[i];
      if (ped.state === 'squished' || ped.state === 'ragdoll') continue;
      const [px2, py2] = toRadar(ped.x, ped.z);
      if (px2 < 2 || px2 > w - 2 || py2 < 2 || py2 > h - 2) continue;
      ctx.fillStyle = ped.bikini ? 'rgba(255, 76, 150, 0.85)' : 'rgba(255, 245, 238, 0.42)';
      ctx.beginPath(); ctx.arc(px2, py2, ped.bikini ? 1.8 : 1.3, 0, Math.PI * 2); ctx.fill();
    }

    // Moving Traffic Blips
    ctx.fillStyle = 'rgba(255, 245, 238, 0.72)';
    for (let i = 0; i < this.traffic.length; i++) {
      const [tx, ty] = toRadar(this.traffic[i].position.x, this.traffic[i].position.z);
      if (tx < -4 || tx > w + 4 || ty < -4 || ty > h + 4) continue;
      ctx.fillRect(tx - 1.5, ty - 2.2, 3, 4.4);
    }

    // Parked Supercar Cyan Pin when On Foot!
    if (this.mode === 'foot') {
      const [cx, cy] = toRadar(cs.x, cs.z);
      const clx = THREE.MathUtils.clamp(cx, 10, w - 10);
      const cly = THREE.MathUtils.clamp(cy, 10, h - 10);
      ctx.fillStyle = '#21E6D1';
      ctx.beginPath(); ctx.arc(clx, cly, 5.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // Numbered Showroom Pins
    SHOWROOMS.forEach((sr) => {
      const [sx, sy] = toRadar(sr.x, sr.z);
      const clampedX = THREE.MathUtils.clamp(sx, 10, w - 10);
      const clampedY = THREE.MathUtils.clamp(sy, 10, h - 10);
      const offscreen = clampedX !== sx || clampedY !== sy;
      ctx.fillStyle = this.visited.has(sr.id) ? '#FFD36B' : sr.accentHex;
      ctx.beginPath(); ctx.arc(clampedX, clampedY, offscreen ? 4.2 : 6.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.2; ctx.stroke();
      if (!offscreen) {
        ctx.fillStyle = '#0B0418';
        ctx.font = '800 7.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(sr.num, clampedX, clampedY + 2.6);
      }
    });

    // Enterable Doorways (Mint Squares) & Flyable Planes (Gold Pins) on Minimap
    if (this.enterableBuildings) {
      for (let i = 0; i < this.enterableBuildings.length; i++) {
        const eb = this.enterableBuildings[i];
        const [ex, ey] = toRadar(eb.doorX, eb.doorZ);
        if (ex < 4 || ex > w - 4 || ey < 4 || ey > h - 4) continue;
        ctx.fillStyle = '#34E89E';
        ctx.fillRect(ex - 3.5, ey - 3.5, 7, 7);
        ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.1;
        ctx.strokeRect(ex - 3.5, ey - 3.5, 7, 7);
      }
    }
    if (this.flyablePlanes) {
      for (let i = 0; i < this.flyablePlanes.length; i++) {
        const pl = this.flyablePlanes[i];
        if (this.mode === 'plane' && this.activePlane === pl) continue;
        const [ax, ay] = toRadar(pl.x, pl.z);
        if (ax < 6 || ax > w - 6 || ay < 6 || ay > h - 6) continue;
        ctx.fillStyle = '#FFD36B';
        ctx.beginPath(); ctx.arc(ax, ay, 4.8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.2; ctx.stroke();
      }
    }

    // Player / Car / Plane Directional Chevron + View Cone
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate(-(this.mode === 'foot' ? this.orbitYawOffset : act.yaw));
    const coneG = ctx.createRadialGradient(0, 0, 2, 0, -14, 24);
    coneG.addColorStop(0, this.mode === 'plane' ? 'rgba(255, 211, 107, 0.34)' : (this.mode === 'foot' ? 'rgba(33, 230, 209, 0.28)' : 'rgba(255, 46, 136, 0.22)'));
    coneG.addColorStop(1, 'rgba(33, 230, 209, 0)');
    ctx.fillStyle = coneG;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.arc(0, 0, 26, -Math.PI * 0.72, -Math.PI * 0.28); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = this.mode === 'plane' ? '#FFD36B' : '#FFF5EE';
    ctx.beginPath();
    ctx.moveTo(0, -8.5); ctx.lineTo(5.8, 6.5); ctx.lineTo(0, 3); ctx.lineTo(-5.8, 6.5); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.mode === 'foot' ? '#21E6D1' : '#FF2E88'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // Precision Compass Badge
    ctx.fillStyle = 'rgba(10, 5, 22, 0.88)';
    ctx.beginPath(); ctx.arc(w - 16, 16, 9.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 245, 238, 0.36)'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.fillStyle = '#FF4B5C';
    ctx.font = '800 9.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', w - 16, 19.3);

    if (this.fullMapOpen) this.drawFullMap();
  }

  bindEvents() {
    this.el.beginBtn.addEventListener('click', () => {
      this.started = true;
      this.el.startOv.hidden = true;
      this.syncReticleVisibility();
      this.flashLockTip();
    });
    this.el.closeBtn.addEventListener('click', () => this.close());
    this.el.mClose.addEventListener('click', () => {
      this.el.modal.hidden = true;
      this.syncReticleVisibility();
    });
    this.el.srPreview.addEventListener('click', () => { if (this.activeShowroom) this.openShowroomModal(this.activeShowroom); });
    this.el.dockToggle.addEventListener('click', () => {
      const collapsed = this.el.dockWrap.classList.toggle('collapsed');
      this.el.dockToggle.textContent = collapsed ? '▴ Show Controls' : '▾ Hide Controls';
    });

    this.el.wpBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const wp = WAYPOINTS.find((w) => w.id === btn.dataset.wp);
        if (!wp) return;
        this.started = true; this.el.startOv.hidden = true;
        this.planAutopilotTo(wp);
      });
    });

    this.el.paintBtns.forEach((btn) => btn.addEventListener('click', () => this.setPaint(Number(btn.dataset.paint))));
    this.el.camBtn.addEventListener('click', () => this.cycleCamera());
    this.el.lightsBtn.addEventListener('click', () => this.toggleLights());
    this.el.vehBtn.addEventListener('click', () => this.toggleVehicle(true));
    this.el.footCarBtn.addEventListener('click', () => this.toggleVehicle(true));
    this.el.wepBtns.forEach((btn) => btn.addEventListener('click', () => this.setWeapon(btn.dataset.wep)));
    this.el.punchBtn.addEventListener('click', () => this.fireWeapon());
    this.el.kickBtn.addEventListener('click', () => this.triggerMeleeAttack('kick'));
    // GTA 5 NPC Dialogue, Carnival Pier Ride & Mini-Games Launcher Bindings
    if (this.el.dlgClose) this.el.dlgClose.addEventListener('click', () => this.closeNpcDialogue());
    if (this.el.dlgChoices) {
      this.el.dlgChoices.forEach((btn) => {
        btn.addEventListener('click', () => this.handleDialogueChoice(Number(btn.dataset.dlgChoice)));
      });
    }
    if (this.el.rideExit) this.el.rideExit.addEventListener('click', () => this.exitPierRide());
    if (this.el.mgBtn) this.el.mgBtn.addEventListener('click', () => { if (this.miniGameHubOpen) this.closeMiniGameHub(); else this.openMiniGameHub(); });
    if (this.el.mgClose) this.el.mgClose.addEventListener('click', () => this.closeMiniGameHub());
    if (this.el.mgStarts) {
      this.el.mgStarts.forEach((btn) => {
        btn.addEventListener('click', () => this.startMiniGame(btn.dataset.mgStart));
      });
    }
    if (this.el.mgAbort) this.el.mgAbort.addEventListener('click', () => this.endMiniGame(false, 'CHALLENGE ABORTED'));
    // Main Website Car Radio Interactions (Tap LCD to fold/open, Pwr/Vol knob drag+click, Tune knob & 5 presets)
    this.el.radLcd.addEventListener('click', (e) => {
      e.stopPropagation();
      this.el.radioDeck.classList.toggle('open');
    });
    this.el.radTune.addEventListener('click', (e) => { e.stopPropagation(); this.cycleRadio(1); });
    let radWheelT = 0;
    this.el.radTune.addEventListener('wheel', (e) => {
      e.preventDefault(); e.stopPropagation();
      const now = performance.now();
      if (now - radWheelT < 240) return;
      radWheelT = now;
      this.cycleRadio(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
    this.el.radPres.forEach((btn, i) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this.selectRadioStation(i); });
    });
    let volDrag = false, volMoved = 0, volLastY = 0;
    this.el.radVol.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      volDrag = true; volMoved = 0; volLastY = e.clientY;
      this.el.radVol.setPointerCapture(e.pointerId);
      this.el.radVol.classList.add('drag');
    });
    this.el.radVol.addEventListener('pointermove', (e) => {
      if (!volDrag) return;
      const dy = volLastY - e.clientY;
      volLastY = e.clientY;
      volMoved += Math.abs(dy);
      if (volMoved > 3) this.setRadioVolume(this.audio.radioVolume + dy * 1.2);
    });
    const endVol = () => {
      if (!volDrag) return;
      volDrag = false;
      this.el.radVol.classList.remove('drag');
      if (volMoved < 4) this.toggleRadioPower();
    };
    this.el.radVol.addEventListener('pointerup', endVol);
    this.el.radVol.addEventListener('pointercancel', () => { volDrag = false; this.el.radVol.classList.remove('drag'); });
    this.el.radVol.addEventListener('wheel', (e) => {
      e.preventDefault(); e.stopPropagation();
      this.setRadioVolume(this.audio.radioVolume + (e.deltaY < 0 ? 5 : -5));
    }, { passive: false });
    this.updateRadioHUD();
    this.el.timeBtn.addEventListener('click', () => this.setTimeOfDay(this.timeIdx + 1));
    this.el.weatherBtn.addEventListener('click', () => this.setWeather(this.weatherIdx + 1));
    if (this.el.touchVeh) this.el.touchVeh.addEventListener('click', () => this.toggleVehicle(true));
    this.el.radarWrap.addEventListener('click', () => this.openFullMap());
    this.el.mapBtn.addEventListener('click', () => this.fullMapOpen ? this.closeFullMap() : this.openFullMap());
    this.el.fullMapClose.addEventListener('click', () => this.closeFullMap());
    this.el.projBtn.addEventListener('click', () => this.projectsHubOpen ? this.closeProjectsHub() : this.openProjectsHub());
    this.el.projHubClose.addEventListener('click', () => this.closeProjectsHub());

    // Floating 3D Project Pins: Click to Inspect if nearby, else GPS Auto-Drive directly there!
    this.el.projPinBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sr = SHOWROOMS.find((s) => s.id === btn.dataset.projPin);
        if (!sr) return;
        this.started = true; this.el.startOv.hidden = true;
        const act = this.mode === 'foot' ? this.playerState : this.carState;
        if (Math.hypot(act.x - sr.parkX, act.z - sr.parkZ) < 22) {
          this.openShowroomModal(sr);
        } else {
          const wp = WAYPOINTS.find((w) => w.id === sr.id);
          if (wp) this.planAutopilotTo(wp);
        }
      });
    });

    // Projects Mission Hub Actions (Auto-Drive / Warp / Inspect)
    this.el.phDriveBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const wp = WAYPOINTS.find((w) => w.id === btn.dataset.phDrive);
        if (!wp) return;
        this.started = true; this.el.startOv.hidden = true;
        this.closeProjectsHub();
        this.planAutopilotTo(wp);
      });
    });
    this.el.phTpBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const wp = WAYPOINTS.find((w) => w.id === btn.dataset.phTp);
        if (!wp) return;
        this.closeProjectsHub();
        this.fastTravelTo(wp);
      });
    });
    this.el.phInspectBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sr = [...SHOWROOMS, CONTACT_SHOWROOM].find((s) => s.id === btn.dataset.phInspect);
        if (!sr) return;
        this.closeProjectsHub();
        this.openShowroomModal(sr);
      });
    });

    // Dossier Modal Prev / Next / Auto-Drive Next Navigation
    const allProjects = [...SHOWROOMS, CONTACT_SHOWROOM];
    this.el.mPrev.addEventListener('click', () => {
      const prevIdx = (this.modalProjectIdx - 1 + allProjects.length) % allProjects.length;
      this.openShowroomModal(allProjects[prevIdx]);
    });
    this.el.mNext.addEventListener('click', () => {
      const nextIdx = (this.modalProjectIdx + 1) % allProjects.length;
      this.openShowroomModal(allProjects[nextIdx]);
    });
    this.el.mDriveNext.addEventListener('click', () => {
      const nextProj = allProjects[(this.modalProjectIdx + 1) % allProjects.length];
      const wp = WAYPOINTS.find((w) => w.id === nextProj.id);
      this.el.modal.hidden = true;
      if (wp) {
        this.started = true; this.el.startOv.hidden = true;
        this.planAutopilotTo(wp);
      }
    });

    this.el.autoCancel.addEventListener('click', () => this.cancelAutopilot());
    this.el.navCancel.addEventListener('click', () => this.cancelAutopilot());
    this.el.navTp.addEventListener('click', () => { if (this.autopilotTarget) this.fastTravelTo(this.autopilotTarget); });

    this.el.fmBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const wp = WAYPOINTS.find((w) => w.id === btn.dataset.fmWp);
        if (!wp) return;
        this.started = true; this.el.startOv.hidden = true;
        this.closeFullMap();
        this.planAutopilotTo(wp);
      });
    });

    this.el.fmTpBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const wp = WAYPOINTS.find((w) => w.id === btn.dataset.fmTp);
        if (!wp) return;
        this.closeFullMap();
        this.fastTravelTo(wp);
      });
    });

    this.el.fullMapCanvas.addEventListener('click', (e) => {
      if (!this._fullMapMeta) return;
      const rect = this.el.fullMapCanvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * 520;
      const cy = ((e.clientY - rect.top) / rect.height) * 520;
      const { minX, minZ, scale, offX, offY } = this._fullMapMeta;
      const wx = minX + (cx - offX) / scale;
      const wz = minZ + (cy - offY) / scale;
      this.started = true; this.el.startOv.hidden = true;
      this.closeFullMap();
      this.planAutopilotTo({ id: 'custom', label: 'Map Pin', zone: 'Custom Waypoint', x: THREE.MathUtils.clamp(wx, -485, 190), z: THREE.MathUtils.clamp(wz, -1110, 355), yaw: 0 });
    });

    this.el.audioBtn.addEventListener('click', () => {
      const next = !this.audio.enabled;
      this.audio.setEnabled(next);
      this.el.audioBtn.textContent = next ? 'Audio: On' : 'Audio: Off';
      this.el.audioBtn.classList.toggle('on', next);
      this.audio.setRainLevel(WEATHER_PRESETS[this.weatherIdx].rain);
      this.audio.setRadioInCar(this.mode === 'car');
      this.updateRadioHUD();
    });

    this.el.stage.querySelectorAll('[data-hold]').forEach((btn) => {
      const key = btn.dataset.hold;
      const setHeld = (v) => {
        if (key === 'nitro' && this.mode === 'foot') {
          this.fireHeld = v;
          if (v) this.fireWeapon();
          return;
        }
        this.keys[key] = v; btn.classList.toggle('held', v);
        if (v) { this.cancelAutopilot(); if (!this.started) { this.started = true; this.el.startOv.hidden = true; } }
      };
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); setHeld(true); });
      btn.addEventListener('pointerup', () => setHeld(false));
      btn.addEventListener('pointercancel', () => setHeld(false));
      btn.addEventListener('pointerleave', () => setHeld(false));
    });

    // Pointer Lock Change Listener (True 360° Look-Through Gameplay + Zero OS Cursor!)
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.el.mount;
      if (this.pointerLocked && this.el.uiCursor) {
        this.el.uiCursor.classList.remove('on');
      }
      if (this.el.lockTip && this.pointerLocked) {
        this.el.lockTip.classList.remove('on');
      }
      this.syncReticleVisibility();
    });

    // Look-Through Camera Pointer Lock + LMB Fire (On-Foot Weapons AND Car Drive-By Uzi!)
    this.el.mount.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') {
        this.dragging = true;
        this.lastPtrX = e.clientX; this.lastPtrY = e.clientY;
      } else if (e.button === 0 && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen) {
        if (!this.pointerLocked) {
          this.requestPointerLockSafe();
        }
        this.fireWeapon();
        this.fireHeld = true;
      }
    });
    this.el.mount.addEventListener('contextmenu', (e) => {
      if (this.mode === 'foot') {
        e.preventDefault();
        this.triggerMeleeAttack('kick');
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.isOpen) return;
      if (e.pointerType === 'mouse') {
        // 1. Pointer-Locked 360° Free-Look (Uses raw hardware movementX/Y, zero UI cursor!)
        if (this.pointerLocked) {
          if (this.el.uiCursor) this.el.uiCursor.classList.remove('on');
          if (this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen) {
            const dx = THREE.MathUtils.clamp(e.movementX || 0, -90, 90);
            const dy = THREE.MathUtils.clamp(e.movementY || 0, -90, 90);
            if (dx !== 0 || dy !== 0) this.applyHoverLook(dx, dy);
          }
          return;
        }

        // 2. Unlocked Mode: Custom Vice Neon UI Pointer for HUD/Modals & Look-Through Hover-Look on 3D Canvas
        const uiCursor = this.el.uiCursor;
        const playing = this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen;
        const targetEl = e.target instanceof Element ? e.target : null;
        const overMount = Boolean(targetEl && targetEl.closest('[data-mount]'));
        if (uiCursor) {
          uiCursor.style.transform = `translate3d(${(e.clientX - 3).toFixed(1)}px, ${(e.clientY - 2).toFixed(1)}px, 0)`;
          const showUiPtr = !playing || !overMount;
          uiCursor.classList.toggle('on', showUiPtr);
          const isInteractive = Boolean(targetEl && targetEl.closest('button, a, [role="button"], [role="slider"], .v3-radar-wrap, canvas[data-fullmap-canvas]'));
          uiCursor.classList.toggle('hover-ui', showUiPtr && isInteractive);
        }

        if (!playing) {
          this.lastHoverX = e.clientX;
          this.lastHoverY = e.clientY;
          return;
        }
        this.hoverNormX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
        if (this.lastHoverX !== null && overMount) {
          const dx = e.clientX - this.lastHoverX;
          const dy = e.clientY - this.lastHoverY;
          if (Math.abs(dx) < 120 && Math.abs(dy) < 120 && (dx !== 0 || dy !== 0)) {
            this.applyHoverLook(dx, dy);
          }
        }
        this.lastHoverX = e.clientX;
        this.lastHoverY = e.clientY;
        return;
      }
      if (!this.dragging) return;
      const dx = e.clientX - this.lastPtrX, dy = e.clientY - this.lastPtrY;
      this.lastPtrX = e.clientX; this.lastPtrY = e.clientY;
      this.applyHoverLook(dx * 1.2, dy * 1.2);
    });
    window.addEventListener('pointerup', () => {
      this.dragging = false;
      this.fireHeld = false;
    });
    document.addEventListener('pointerleave', () => {
      if (this.el && this.el.uiCursor) this.el.uiCursor.classList.remove('on');
    });
    window.addEventListener('wheel', (e) => {
      if (!this.isOpen || this.mode !== 'foot' || !this.started || !this.el.modal.hidden || this.fullMapOpen || this.projectsHubOpen) return;
      const idx = WEAPONS.findIndex((w) => w.id === this.weapon);
      const next = (idx + (e.deltaY > 0 ? 1 : -1) + WEAPONS.length) % WEAPONS.length;
      this.setWeapon(WEAPONS[next].id);
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.activeDialogue) this.closeNpcDialogue();
        else if (this.miniGameHubOpen) this.closeMiniGameHub();
        else if (this.projectsHubOpen) this.closeProjectsHub();
        else if (this.fullMapOpen) this.closeFullMap();
        else if (!this.el.modal.hidden) this.el.modal.hidden = true;
        else this.close();
        return;
      }
      if (this.activeDialogue) {
        if (e.key === '1' || e.key === '2' || e.key === '3') {
          e.preventDefault();
          this.handleDialogueChoice(Number(e.key) - 1);
          return;
        }
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          this.closeNpcDialogue();
          return;
        }
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        if (this.miniGameHubOpen) this.closeMiniGameHub(); else this.openMiniGameHub();
        return;
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (this.projectsHubOpen) this.closeProjectsHub(); else this.openProjectsHub();
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        if (this.fullMapOpen) this.closeFullMap(); else this.openFullMap();
        return;
      }
      if (e.key === 'e' || e.key === 'E') {
        if (this.mode === 'ride') {
          e.preventDefault();
          this.exitPierRide();
          return;
        }
        if (this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen) {
          if (this.mode === 'foot') {
            const nearRide = this.findNearestPierRide(8.5);
            if (nearRide) { e.preventDefault(); this.boardPierRide(nearRide); return; }
            const nearNpc = this.findNearestTalkableNpc(4.6);
            if (nearNpc) { e.preventDefault(); this.openNpcDialogue(nearNpc); return; }
          }
          const nearPad = this.findNearestMiniGamePad(6.5);
          if (nearPad) { e.preventDefault(); this.startMiniGame(nearPad.id); return; }
        }
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && this.el.modal.hidden) this.toggleVehicle(false);
        return;
      }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.cycleRadio(1); return; }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); this.setTimeOfDay(this.timeIdx + 1); return; }
      if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); this.setWeather(this.weatherIdx + 1); return; }

      if (this.mode === 'foot') {
        if (e.key >= '1' && e.key <= '7') {
          const w = WEAPONS[Number(e.key) - 1];
          if (w) this.setWeapon(w.id);
          return;
        }
        if (e.key === 'q' || e.key === 'Q') {
          const idx = WEAPONS.findIndex((w) => w.id === this.weapon);
          this.setWeapon(WEAPONS[(idx + 1) % WEAPONS.length].id);
          return;
        }
        if (e.key === 'j' || e.key === 'J' || e.key === 'x' || e.key === 'X' || e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          this.fireWeapon();
          this.fireHeld = true;
          return;
        }
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          this.triggerMeleeAttack('kick');
          return;
        }
      }
      if (e.key === 'Enter' && this.activeShowroom && this.el.modal.hidden && !this.fullMapOpen) { e.preventDefault(); this.openShowroomModal(this.activeShowroom); return; }
      if (e.key === 'Tab') { e.preventDefault(); this.el.dockToggle.click(); return; }
      if (e.key === 'v' || e.key === 'V') { this.cycleCamera(); return; }
      if (e.key === 'c' || e.key === 'C') { this.setPaint((this.paintIdx + 1) % PAINTS.length); return; }
      if (e.key === 'l' || e.key === 'L') { this.toggleLights(); return; }
      if (e.key === 'm' || e.key === 'M') { this.el.audioBtn.click(); return; }
      if (e.key === 'h' || e.key === 'H') {
        this.audio.horn();
        const act = this.mode === 'foot' ? this.playerState : this.carState;
        for (let i = 0; i < this.pedestrians.length; i++) {
          const p = this.pedestrians[i];
          if (p.state === 'walk' && Math.hypot(p.x - act.x, p.z - act.z) < 22) {
            p.state = 'panic'; p.stateTimer = 3.0;
          }
        }
        return;
      }

      const k = e.key.toLowerCase();
      let drivingKey = false;
      if (k === 'w' || e.key === 'ArrowUp') { this.keys.up = true; drivingKey = true; }
      if (k === 's' || e.key === 'ArrowDown') { this.keys.down = true; drivingKey = true; }
      if (k === 'a' || e.key === 'ArrowLeft') { this.keys.left = true; drivingKey = true; }
      if (k === 'd' || e.key === 'ArrowRight') { this.keys.right = true; drivingKey = true; }
      if (e.key === 'Shift') { this.keys.nitro = true; drivingKey = true; }
      if (e.key === ' ') { e.preventDefault(); this.keys.drift = true; drivingKey = true; }
      if (k === 'q' || e.key === 'Control') { this.keys.dive = true; }
      if (drivingKey) {
        this.cancelAutopilot();
        if (!this.started) {
          this.started = true;
          this.el.startOv.hidden = true;
          this.syncReticleVisibility();
          this.flashLockTip();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = false;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = false;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === 'Shift') this.keys.nitro = false;
      if (e.key === ' ') this.keys.drift = false;
      if (k === 'q' || e.key === 'Control') this.keys.dive = false;
      if (k === 'j' || k === 'e' || k === 'x') this.fireHeld = false;
    });

    window.addEventListener('resize', () => this.onResize());
  }

  setPaint(idx) {
    this.paintIdx = idx % PAINTS.length;
    this.car.applyPaint(this.paintIdx);
    this.el.paintBtns.forEach((b, i) => b.classList.toggle('active', i === this.paintIdx));
  }

  cycleCamera() {
    this.camIdx = (this.camIdx + 1) % CAM_MODES.length;
    this.el.camBtn.textContent = `Cam: ${CAM_MODES[this.camIdx]}`;
    this.orbitYawOffset = 0; this.orbitPitchOffset = 0;
  }

  toggleLights() {
    this.lightsOn = !this.lightsOn;
    this.el.lightsBtn.classList.toggle('on', this.lightsOn);
    this.el.lampLights.classList.toggle('on-lights', this.lightsOn);
    this.car.headLights.forEach((s) => { s.intensity = this.lightsOn ? 1.85 : 0; });
    this.car.headLensMat.emissiveIntensity = this.lightsOn ? 1.35 : 0.06;
  }

  openProjectsHub() {
    this.started = true;
    this.el.startOv.hidden = true;
    if (this.fullMapOpen) this.closeFullMap();
    this.el.modal.hidden = true;
    this.projectsHubOpen = true;
    this.el.projHubOv.hidden = false;
    this.releasePointerLock();
    this.updateProjectsHub();
  }

  closeProjectsHub() {
    this.projectsHubOpen = false;
    this.el.projHubOv.hidden = true;
    this.syncReticleVisibility();
  }

  updateProjectsHub() {
    const act = this.mode === 'foot' ? this.playerState : this.carState;
    const allProjects = [...SHOWROOMS, CONTACT_SHOWROOM];
    this.el.phDists.forEach((el) => {
      const sr = allProjects.find((s) => s.id === el.dataset.phDist);
      if (sr) el.textContent = `${Math.round(Math.hypot(sr.parkX - act.x, sr.parkZ - act.z))}m`;
    });
    this.el.phBadges.forEach((el) => {
      const id = el.dataset.phBadge;
      const sr = allProjects.find((s) => s.id === id);
      if (!sr) return;
      if (id === 'contact') {
        el.textContent = '★ CONTACT';
      } else {
        el.textContent = this.visited.has(id) ? `✓ VISITED ${sr.num}` : `PROJECT ${sr.num}`;
      }
    });
  }

  updateProjectPins(act) {
    const showPins = this.started && !this.fullMapOpen && !this.projectsHubOpen && this.el.modal.hidden;
    if (!showPins) {
      if (this.el.projPins.style.display !== 'none') this.el.projPins.style.display = 'none';
      return;
    }
    if (this.el.projPins.style.display !== '') this.el.projPins.style.display = '';

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.updateMatrixWorld();

    for (let i = 0; i < SHOWROOMS.length; i++) {
      const sr = SHOWROOMS[i];
      const btn = this.el.projPinBtns[i];
      if (!btn) continue;

      // Hide active showroom's pin when discovery card is already visible right in front of you
      if (this.activeShowroom && this.activeShowroom.id === sr.id) {
        btn.style.transform = 'translate3d(-9999px, -9999px, 0)';
        continue;
      }

      const dist = Math.round(Math.hypot(sr.parkX - act.x, sr.parkZ - act.z));
      _projVec.set(sr.x, 14.5, sr.z).project(this.camera);

      // Hide pins behind the camera or too far behind frustum
      if (_projVec.z >= 1.0 || _projVec.z < -1.0) {
        btn.style.transform = 'translate3d(-9999px, -9999px, 0)';
        continue;
      }

      const rawX = (_projVec.x * 0.5 + 0.5) * w;
      const rawY = (-_projVec.y * 0.5 + 0.5) * h;

      // Only show pins cleanly inside or near viewport edges (avoiding top HUD & bottom dock)
      if (rawX < -180 || rawX > w + 180 || rawY < -140 || rawY > h + 140) {
        btn.style.transform = 'translate3d(-9999px, -9999px, 0)';
        continue;
      }
      const clampedX = Math.max(98, Math.min(w - 98, rawX));
      const minTopY = clampedX < 460 ? 176 : 112;
      const clampedY = Math.max(minTopY, Math.min(h - 196, rawY));
      const isEdge = clampedX !== rawX || clampedY !== rawY;
      const farScale = dist > 220 ? 0.86 : 1.0;
      btn.classList.toggle('edge', isEdge);
      btn.classList.toggle('visited', this.visited.has(sr.id));
      btn.style.opacity = dist > 240 ? '0.82' : '';
      btn.style.transform = `translate3d(${Math.round(clampedX)}px, ${Math.round(clampedY)}px, 0) translate(-50%, -50%) scale(${farScale})`;

      const distEl = btn.querySelector('[data-pin-dist]');
      if (distEl) distEl.textContent = dist < 22 ? 'NEAR · INSPECT' : `${dist}m · GPS`;
    }
  }

  openShowroomModal(sr) {
    const allProjects = [...SHOWROOMS, CONTACT_SHOWROOM];
    const idx = allProjects.findIndex((p) => p.id === sr.id);
    this.modalProjectIdx = idx >= 0 ? idx : 0;
    const nextProj = allProjects[(this.modalProjectIdx + 1) % allProjects.length];

    if (sr.id === 'contact') {
      this.el.mImg.src = CONTACT_SHOWROOM.img;
      this.el.mImg.alt = 'Akshat Singh Portrait';
      this.el.mK.textContent = 'Miami Beach Plaza · Contact';
      this.el.mTitle.textContent = CONTACT_SHOWROOM.title;
      this.el.mDesc.textContent = CONTACT_SHOWROOM.desc;
      this.el.mStat.textContent = CONTACT_SHOWROOM.stat;
      this.el.mOpen.textContent = 'Email Akshat';
      this.el.mOpen.href = CONTACT_SHOWROOM.url;
    } else {
      this.el.mImg.src = sr.img; this.el.mImg.alt = sr.title;
      this.el.mK.textContent = `Project ${sr.num} · ${sr.district}`;
      this.el.mTitle.textContent = sr.title;
      this.el.mDesc.textContent = sr.desc;
      this.el.mStat.textContent = sr.stat;
      this.el.mOpen.textContent = 'Open Full Case Study';
      this.el.mOpen.href = sr.url;
    }
    this.el.mDriveNext.textContent = `Auto-Drive → ${nextProj.title}`;
    this.el.modal.hidden = false;
    this.releasePointerLock();
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
      if (this.bloomPass) this.bloomPass.resolution.set(Math.max(1, Math.floor(w * 0.5)), Math.max(1, Math.floor(h * 0.5)));
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    document.body.classList.add('vice-game-open');
    try { if (typeof window.__stopMainWebsiteRadio === 'function') window.__stopMainWebsiteRadio(); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('vice:game-open')); } catch (_) {}
    this.el.stage.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.onResize();
    this.clock.getDelta();
    this.startLoop();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.releasePointerLock();
    if (this.el.uiCursor) this.el.uiCursor.classList.remove('on');
    document.body.classList.remove('vice-game-open');
    this.el.stage.classList.remove('open');
    this.el.modal.hidden = true;
    document.body.style.overflow = '';
    this.audio.setEnabled(false);
    this.el.audioBtn.textContent = 'Audio: Off';
    this.el.audioBtn.classList.remove('on');
    this.stopLoop();
  }

  stopLoop() {
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.frameId = 0;
  }

  afterDraw(cb) {
    const gl = this.renderer.getContext();
    const sync = gl.fenceSync && gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (!this.isOpen) return;
      const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (st === gl.UNSIGNALED) this.frameId = window.setTimeout(poll, 5);
      else { if (sync) gl.deleteSync(sync); this.frameId = window.setTimeout(cb, 80); }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  renderFrame() {
    // Always keep sky dome centered on active camera so teleports & instant camera snaps never clip sky horizon
    if (this.skyDome) this.skyDome.position.copy(this.camera.position);
    // Smart Dynamic CubeCamera reflection update: only refresh on startup or after driving >16m (eliminates 6-face stutter!)
    if (this.cubeCamera && (this.frameCount === 0 || (this.frameCount - this.lastCubeFrame >= 24 && Math.hypot(this.carState.x - this.lastCubeX, this.carState.z - this.lastCubeZ) > 16))) {
      try {
        this.car.root.visible = false;
        this.cubeCamera.position.set(this.carState.x, 1.2, this.carState.z);
        this.cubeCamera.update(this.renderer, this.scene);
        this.car.root.visible = true;
        this.lastCubeX = this.carState.x;
        this.lastCubeZ = this.carState.z;
        this.lastCubeFrame = this.frameCount;
      } catch (_) {
        this.car.root.visible = true;
        this.cubeCamera = null;
      }
    }
    if (this.composer) {
      try {
        this.composer.render();
        return;
      } catch (_) {
        this.composer = null;
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  startLoop() {
    this.stopLoop();
    const tick = () => {
      if (!this.isOpen) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();
      this.update(dt, elapsed);
      this.renderFrame();
      this.frameCount += 1;
      if (this.isSoftwareGl) this.afterDraw(tick);
      else this.frameId = requestAnimationFrame(tick);
    };
    tick();
  }

  /* ==========================================================================
     GTA 5 INSPIRED INTERACTION, BRAWL, CARNIVAL RIDES & MINI-GAMES ENGINE
     ========================================================================== */
  updateHealthHUD() {
    if (this.el.hpFill) this.el.hpFill.style.width = `${Math.max(0, Math.min(100, this.playerHp))}%`;
    if (this.el.hpVal) this.el.hpVal.textContent = String(Math.max(0, Math.round(this.playerHp)));
    if (this.el.armFill) this.el.armFill.style.width = `${Math.max(0, Math.min(100, this.playerArmor))}%`;
    if (this.el.armVal) this.el.armVal.textContent = String(Math.max(0, Math.round(this.playerArmor)));
  }

  damagePlayer(amount, attacker = null) {
    if (this.wastedTimer > 0) return;
    let rem = amount;
    if (this.playerArmor > 0) {
      const absorbed = Math.min(this.playerArmor, rem);
      this.playerArmor -= absorbed;
      rem -= absorbed;
    }
    if (rem > 0) this.playerHp = Math.max(0, this.playerHp - rem);
    this.updateHealthHUD();
    this.dmgFlashTimer = 0.28;
    if (this.el.dmgFlash) this.el.dmgFlash.classList.add('on');
    this.camShake = Math.max(this.camShake, 0.22);
    this.audio.hitNpc(false);
    if (attacker) {
      this.el.combo.innerHTML = `${attacker.name.toUpperCase()} HIT YOU! <span>-${amount}</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 1.6;
    }
    if (this.playerHp <= 0) {
      this.triggerWasted();
    }
  }

  triggerWasted() {
    this.wastedTimer = 2.4;
    this.closeNpcDialogue();
    if (this.activeMiniGame) this.endMiniGame(false, 'WASTED!');
    if (this.el.wasted) this.el.wasted.classList.add('on');
    this.audio.explosion();
  }

  findNearestTalkableNpc(maxDist = 4.6) {
    const ps = this.playerState;
    let best = null, bestD = maxDist;
    for (let i = 0; i < this.pedestrians.length; i++) {
      const p = this.pedestrians[i];
      if (!p.root.visible) continue;
      if (p.state === 'squished' || p.state === 'ragdoll' || p.state === 'fight' || p.state === 'panic') continue;
      const d = Math.hypot(p.x - ps.x, p.z - ps.z);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  findNearestPierRide(maxDist = 8.5) {
    const ps = this.playerState;
    let best = null, bestD = maxDist;
    for (let i = 0; i < this.pierRides.length; i++) {
      const r = this.pierRides[i];
      const d = Math.hypot(r.boardX - ps.x, r.boardZ - ps.z);
      if (d < bestD) { bestD = d; best = r; }
    }
    return best;
  }

  findNearestMiniGamePad(maxDist = 6.5) {
    const act = this.mode === 'foot' ? this.playerState : this.carState;
    let best = null, bestD = maxDist;
    for (let i = 0; i < this.miniGamePads.length; i++) {
      const pd = this.miniGamePads[i];
      const d = Math.hypot(pd.x - act.x, pd.z - act.z);
      if (d < bestD) { bestD = d; best = pd; }
    }
    return best;
  }

  openNpcDialogue(ped) {
    if (!ped) return;
    if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (_) {} }
    this.activeDialogue = { ped, profile: NPC_PROFILES[ped.profileIdx || 0] };
    ped.prevState = ped.state;
    ped.state = 'talk';
    ped.curSpeed = 0;
    const prof = this.activeDialogue.profile;
    this.el.dlgName.textContent = ped.name || prof.name;
    this.el.dlgRole.textContent = ped.role || prof.role;
    this.el.dlgLine.textContent = prof.greeting;
    this.el.dlg.classList.add('on');
    this.audio.pickup();
    this.syncReticleVisibility();
  }

  handleDialogueChoice(idx) {
    if (!this.activeDialogue) return;
    const { ped, profile } = this.activeDialogue;
    if (idx === 0) {
      this.el.dlgLine.textContent = profile.tip;
      if (!ped.tipGiven) {
        ped.tipGiven = true;
        this.cash += 50;
        this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        this.audio.pickup();
        this.el.combo.innerHTML = `LOCAL TIP FROM ${(ped.name || 'CITIZEN').toUpperCase()} <span>+$50</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 2.4;
      }
    } else if (idx === 1) {
      this.el.dlgLine.textContent = profile.chat;
      this.audio.pickup();
    } else if (idx === 2) {
      this.el.dlgLine.textContent = profile.provoke;
      ped.fighter = true;
      ped.provoked = true;
      this.audio.punch();
      setTimeout(() => {
        if (this.activeDialogue && this.activeDialogue.ped === ped) {
          this.closeNpcDialogue(true);
        }
        ped.state = 'fight';
        ped.stateTimer = 22.0;
        ped.attackCooldown = 0.45;
        this.el.combo.innerHTML = `${(ped.name || 'LOCAL').toUpperCase()} WANTS TO BRAWL! <span>FIGHT!</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 2.4;
      }, 520);
    }
  }

  closeNpcDialogue(keepFighting = false) {
    if (!this.activeDialogue) return;
    const { ped } = this.activeDialogue;
    if (!keepFighting && ped && ped.state === 'talk') {
      ped.state = 'walk';
    }
    this.activeDialogue = null;
    if (this.el.dlg) this.el.dlg.classList.remove('on');
    this.syncReticleVisibility();
  }

  boardPierRide(ride) {
    if (!ride) return;
    this.closeNpcDialogue();
    this.closeMiniGameHub();
    this.cancelAutopilot();
    if (this.activePlane) {
      this.activePlane.resetTimer = 0.2;
      this.activePlane = null;
    }
    this.activeRide = ride;
    this.playerState.x = ride.boardX;
    this.playerState.z = ride.boardZ;
    this.playerState.y = 0.24;
    this.setMode('ride');
    this.el.rideTitle.textContent = ride.label;
    this.el.rideSub.textContent = `${ride.sub} · Press [E] or [F] to Exit`;
    this.el.rideBar.classList.add('on');
    this.el.carPrompt.classList.remove('on');
    this.orbitYawOffset = 0;
    this.orbitPitchOffset = 0.08;
    this.snapCameraNext = true;
    this.drawRadar();
    this.audio.pickup();
    this.el.combo.innerHTML = `BOARDED · ${ride.label} <span>CARNIVAL PIER</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.6;
    this.syncReticleVisibility();
  }

  exitPierRide() {
    if (this.mode !== 'ride' || !this.activeRide) return;
    const r = this.activeRide;
    this.activeRide = null;
    this.el.rideBar.classList.remove('on');
    this.setMode('foot');
    this.playerState.x = r.exitX;
    this.playerState.z = r.exitZ;
    this.playerState.y = 0.16;
    this.playerState.vy = 0;
    this.playerState.grounded = true;
    this.player.root.position.set(r.exitX, 0.16, r.exitZ);
    this.player.root.rotation.set(0, -Math.PI / 2, 0);
    this.snapCameraNext = true;
    this.drawRadar();
    this.audio.carDoor();
  }

  openMiniGameHub() {
    if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (_) {} }
    this.closeNpcDialogue();
    this.miniGameHubOpen = true;
    this.el.mgOv.hidden = false;
    this.syncReticleVisibility();
  }

  closeMiniGameHub() {
    this.miniGameHubOpen = false;
    this.el.mgOv.hidden = true;
    this.syncReticleVisibility();
  }

  cleanupMiniGameMeshes() {
    if (!this.activeMiniGame || !this.activeMiniGame.meshes) return;
    this.activeMiniGame.meshes.forEach((m) => this.scene.remove(m));
    this.activeMiniGame.meshes = [];
  }

  startMiniGame(id) {
    this.closeMiniGameHub();
    this.closeNpcDialogue();
    if (this.activeMiniGame) this.cleanupMiniGameMeshes();
    if (this.mode === 'ride') this.exitPierRide();
    this.cancelAutopilot();
    this.started = true;
    this.el.startOv.hidden = true;

    if (id === 'range') {
      // 1. VICE CARNIVAL PIER SHOOTING GALLERY (30s Neon Floating Ocean Bullseyes — ZERO Buildings Blocking!)
      this.setMode('foot');
      this.setWeapon('rifle');
      this.playerState.x = 91.5;
      this.playerState.z = -442.8;
      this.playerState.y = 0.16;
      this.playerState.vy = 0;
      this.playerState.grounded = true;
      this.playerState.yaw = 0; // Facing North straight out over open Atlantic Ocean!
      this.orbitYawOffset = 0;
      this.orbitPitchOffset = -0.02;
      this.player.root.position.set(91.5, 0.16, -442.8);
      this.player.root.rotation.y = 0;

      const targets = [];
      const meshes = [];
      const ringGeo = new THREE.CylinderGeometry(0.88, 0.88, 0.16, 20);
      ringGeo.rotateX(Math.PI / 2); // Face South directly toward Tommy on the Pier!
      const midGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.19, 18);
      midGeo.rotateX(Math.PI / 2);
      const bullGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.22, 16);
      bullGeo.rotateX(Math.PI / 2);
      const buoyGeo = new THREE.CylinderGeometry(0.45, 0.55, 0.65, 12);
      const postGeo = new THREE.CylinderGeometry(0.08, 0.10, 1.55, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xff2e88, emissive: 0xff2e88, emissiveIntensity: 1.05 });
      const midMat = new THREE.MeshStandardMaterial({ color: 0xfff5ee, emissive: 0x21e6d1, emissiveIntensity: 0.45 });
      const bullMat = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xffd36b, emissiveIntensity: 1.45 });
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e2534, roughness: 0.48, metalness: 0.4 });
      const buoyMat = new THREE.MeshStandardMaterial({ color: 0x21e6d1, emissive: 0x21e6d1, emissiveIntensity: 0.4, roughness: 0.4 });

      for (let i = 0; i < 6; i++) {
        const grp = new THREE.Group();
        const buoy = new THREE.Mesh(buoyGeo, buoyMat);
        buoy.position.y = -0.15;
        const post = new THREE.Mesh(postGeo, poleMat);
        post.position.y = 0.72;
        const disc = new THREE.Mesh(ringGeo, baseMat);
        disc.position.y = 1.65;
        const mid = new THREE.Mesh(midGeo, midMat);
        mid.position.y = 1.65;
        const bull = new THREE.Mesh(bullGeo, bullMat);
        bull.position.y = 1.65;
        grp.add(buoy, post, disc, mid, bull);
        const tx = 81.0 + i * 4.2;
        const tz = -460.0 - (i % 3) * 5.2;
        grp.position.set(tx, 0.35, tz);
        this.scene.add(grp);
        meshes.push(grp);
        targets.push({ mesh: grp, x: tx, y: 0.35, z: tz, baseX: tx, amp: 2.4 + (i % 2) * 1.4, spd: 1.35 + i * 0.22, phase: i * 1.15, alive: true, respawnT: 0 });
      }
      this.activeMiniGame = { id: 'range', label: 'PIER SHOOTING GALLERY', timeLeft: 30.0, score: 0, goal: 12, targets, meshes };
      this.el.mgName.textContent = 'PIER SHOOTING GALLERY';
      this.el.mgStat.textContent = '0 / 12 HITS';
      this.el.mgTimer.textContent = '30.0s';
      this.el.mgHud.classList.add('on');
      this.el.combo.innerHTML = `PIER SHOOTING GALLERY! <span>BLAST 12 OCEAN TARGETS</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.8;
      this.snapCameraNext = true;
      this.drawRadar();
      this.audio.pickup();
    } else if (id === 'hillclimb') {
      // 2. PIER-TO-PEAK MOUNT VICE HILLCLIMB RACE (10 Glowing Switchback Highway Gates to 66m Summit!)
      if (this.mode !== 'car') this.setMode('car');
      this.carState.x = 0.0;
      this.carState.z = -1108.0;
      this.carState.y = getTerrainHeight(0.0, -1108.0) + 0.08;
      this.carState.vy = 0;
      this.carState.airborne = false;
      this.carState.yaw = 0;
      this.carState.speed = 0;
      this.orbitYawOffset = 0;
      this.orbitPitchOffset = 0.08;
      const vehMesh = this.activeVehicle ? this.activeVehicle.mesh : this.car.root;
      vehMesh.position.set(this.carState.x, this.carState.y, this.carState.z);
      vehMesh.rotation.y = 0;

      const gates = [];
      const meshes = [];
      const indices = [12, 26, 40, 54, 68, 82, 96, 110, 124, 138];
      indices.forEach((ri, gi) => {
        const pt = MOUNT_VICE_ROAD[Math.min(MOUNT_VICE_ROAD.length - 1, ri)];
        const nxt = MOUNT_VICE_ROAD[Math.min(MOUNT_VICE_ROAD.length - 1, ri + 2)];
        const gy = getTerrainHeight(pt.x, pt.z) + 0.08;
        const yaw = Math.atan2(-(nxt.x - pt.x), -(nxt.z - pt.z));
        const arch = new THREE.Mesh(
          new THREE.TorusGeometry(5.8, 0.38, 10, 26, Math.PI),
          new THREE.MeshBasicMaterial({ color: gi === 0 ? 0xffd36b : 0x21e6d1, transparent: true, opacity: gi === 0 ? 0.96 : 0.45 })
        );
        arch.position.set(pt.x, gy + 0.35, pt.z);
        arch.rotation.y = yaw;
        this.scene.add(arch);
        meshes.push(arch);
        gates.push({ mesh: arch, x: pt.x, y: gy, z: pt.z, cleared: false });
      });
      this.activeMiniGame = { id: 'hillclimb', label: 'MOUNT VICE HILLCLIMB', timeLeft: 95.0, gateIdx: 0, gates, meshes };
      this.el.mgName.textContent = 'MOUNT VICE HILLCLIMB';
      this.el.mgStat.textContent = 'GATE 1 / 10';
      this.el.mgTimer.textContent = '95.0s';
      this.el.mgHud.classList.add('on');
      this.el.combo.innerHTML = `HILLCLIMB RACE GO! <span>CLIMB TO 66M SUMMIT</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.8;
      this.snapCameraNext = true;
      this.drawRadar();
      this.audio.pickup();
    } else if (id === 'skyring') {
      // 3. CARNIVAL PIER SKY-RING STUNT FLIGHT (Launches Above Ferris Wheel Through 8 Golden Coastal Rings!)
      const jet = this.flyablePlanes && this.flyablePlanes[0];
      if (!jet) return;
      this.enterPlane(jet);
      jet.x = 118; jet.y = 48; jet.z = -430;
      jet.yaw = 0; jet.pitch = 0.04; jet.roll = 0;
      jet.speed = 68; jet.throttle = 0.86; jet.gearBlend = 0;
      this.syncPlaneTransform(jet, 0.016, this.clock.getElapsedTime());

      const ringSpots = [
        { x: 118,  y: 54,  z: -560 },
        { x: 135,  y: 62,  z: -720 },
        { x: 96,   y: 68,  z: -900 },
        { x: 12,   y: 78,  z: -1080 },
        { x: -115, y: 92,  z: -1240 },
        { x: -228, y: 98,  z: -1432 },
        { x: -120, y: 84,  z: -980 },
        { x: 78,   y: 58,  z: -480 }
      ];
      const rings = [];
      const meshes = [];
      ringSpots.forEach((rs, idx) => {
        const torus = new THREE.Mesh(
          new THREE.TorusGeometry(11.5, 0.72, 12, 32),
          new THREE.MeshBasicMaterial({ color: idx === 0 ? 0xffd36b : 0xff2e88, transparent: true, opacity: idx === 0 ? 0.95 : 0.45 })
        );
        torus.position.set(rs.x, rs.y, rs.z);
        this.scene.add(torus);
        meshes.push(torus);
        rings.push({ mesh: torus, x: rs.x, y: rs.y, z: rs.z, cleared: false });
      });
      this.activeMiniGame = { id: 'skyring', label: 'CARNIVAL PIER SKY-RING', timeLeft: 95.0, ringIdx: 0, rings, meshes };
      this.el.mgName.textContent = 'PIER SKY-RING FLIGHT';
      this.el.mgStat.textContent = 'RING 1 / 8';
      this.el.mgTimer.textContent = '95.0s';
      this.el.mgHud.classList.add('on');
      this.el.combo.innerHTML = `CARNIVAL PIER SKY-RING! <span>FLY THROUGH 8 GOLD RINGS</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 3.0;
      this.snapCameraNext = true;
      this.drawRadar();
      this.audio.pickup();
    }
  }

  onRangeTargetHit(tg) {
    if (!this.activeMiniGame || this.activeMiniGame.id !== 'range') return;
    tg.alive = false;
    tg.respawnT = 2.0;
    tg.mesh.visible = false;
    this.activeMiniGame.score += 1;
    this.audio.pickup();
    for (let k = 0; k < 8; k++) {
      this.spawnParticle(tg.x, tg.y + 1.65, tg.z, (Math.random() - 0.5) * 6, 2.5 + Math.random() * 3, (Math.random() - 0.5) * 6, 0xffd36b, 0.45, 0.5, 0.3, 9.8);
    }
    this.el.mgStat.textContent = `${this.activeMiniGame.score} / ${this.activeMiniGame.goal} HITS`;
    if (this.activeMiniGame.score >= this.activeMiniGame.goal) {
      this.endMiniGame(true, 'GOLD MEDAL · PIER GALLERY!', 1500);
    }
  }

  updateMiniGame(dt, elapsed) {
    const mg = this.activeMiniGame;
    if (!mg) return;
    mg.timeLeft = Math.max(0, mg.timeLeft - dt);
    this.el.mgTimer.textContent = `${mg.timeLeft.toFixed(1)}s`;

    if (mg.id === 'range') {
      for (let i = 0; i < mg.targets.length; i++) {
        const tg = mg.targets[i];
        if (!tg.alive) {
          tg.respawnT -= dt;
          if (tg.respawnT <= 0) { tg.alive = true; tg.mesh.visible = true; }
        } else {
          tg.x = tg.baseX + Math.sin(elapsed * tg.spd + tg.phase) * tg.amp;
          tg.y = 0.35 + Math.sin(elapsed * 2.2 + tg.phase) * 0.14;
          tg.mesh.position.set(tg.x, tg.y, tg.z);
        }
      }
      if (mg.timeLeft <= 0) {
        const prize = mg.score >= 8 ? 800 : (mg.score >= 4 ? 400 : 0);
        this.endMiniGame(prize > 0, prize > 0 ? `GALLERY COMPLETE · ${mg.score} HITS!` : `TIME UP · ${mg.score} HITS`, prize);
      }
    } else if (mg.id === 'hillclimb') {
      const gate = mg.gates[mg.gateIdx];
      if (gate) {
        const sc = 1.0 + Math.sin(elapsed * 5.0) * 0.05;
        gate.mesh.scale.setScalar(sc);
        // Aim overhead 3D GPS arrow toward the next Mount Vice checkpoint!
        this.navArrow.visible = true;
        this.navArrow.position.set(this.carState.x, this.carState.y + 2.55, this.carState.z);
        this.navArrow.rotation.y = Math.atan2(-(gate.x - this.carState.x), -(gate.z - this.carState.z));
        if (Math.hypot(this.carState.x - gate.x, this.carState.z - gate.z) < 9.5) {
          gate.cleared = true;
          gate.mesh.visible = false;
          mg.gateIdx += 1;
          this.audio.pickup();
          if (mg.gateIdx >= mg.gates.length) {
            this.endMiniGame(true, 'MOUNT VICE SUMMIT GOLD TROPHY!', 2500);
          } else {
            const nxt = mg.gates[mg.gateIdx];
            nxt.mesh.material.color.setHex(0xffd36b);
            nxt.mesh.material.opacity = 0.96;
            this.el.mgStat.textContent = `GATE ${mg.gateIdx + 1} / ${mg.gates.length}`;
          }
        }
      }
      if (mg.timeLeft <= 0) this.endMiniGame(false, 'HILLCLIMB TIME UP!');
    } else if (mg.id === 'skyring') {
      const pl = this.activePlane;
      const ring = mg.rings[mg.ringIdx];
      if (pl && ring) {
        ring.mesh.rotation.z = elapsed * 1.4;
        this.navArrow.visible = true;
        this.navArrow.position.set(pl.x, pl.y + 4.2, pl.z);
        this.navArrow.rotation.y = Math.atan2(-(ring.x - pl.x), -(ring.z - pl.z));
        if (Math.hypot(pl.x - ring.x, pl.y - ring.y, pl.z - ring.z) < 16.5) {
          ring.cleared = true;
          ring.mesh.visible = false;
          mg.ringIdx += 1;
          this.audio.pickup();
          if (mg.ringIdx >= mg.rings.length) {
            this.endMiniGame(true, 'ACE PILOT · SKY RINGS CLEARED!', 3000);
          } else {
            const nxt = mg.rings[mg.ringIdx];
            nxt.mesh.material.color.setHex(0xffd36b);
            nxt.mesh.material.opacity = 0.96;
            this.el.mgStat.textContent = `RING ${mg.ringIdx + 1} / ${mg.rings.length}`;
          }
        }
      }
      if (mg.timeLeft <= 0) this.endMiniGame(false, 'STUNT FLIGHT TIME UP!');
    }
  }

  endMiniGame(won, msg, prize = 0) {
    if (!this.activeMiniGame) return;
    this.cleanupMiniGameMeshes();
    this.activeMiniGame = null;
    if (this.el.mgHud) this.el.mgHud.classList.remove('on');
    if (this.navArrow && this.autopilotQueue.length === 0) this.navArrow.visible = false;
    if (prize > 0) {
      this.cash += prize;
      this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
      this.audio.pickup();
    }
    this.el.combo.innerHTML = prize > 0 ? `${msg} <span>+$${prize.toLocaleString()}</span>` : `${msg} <span>MINI-GAME</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.6;
  }

  update(dt, elapsed) {
    const cs = this.carState;
    const ps = this.playerState;
    const isFoot = this.mode === 'foot';
    const isRide = this.mode === 'ride' && Boolean(this.activeRide);
    const isPlane = this.mode === 'plane' && Boolean(this.activePlane);
    const act = isPlane ? this.activePlane : ((isFoot || isRide) ? ps : cs);

    if (this.impactCooldown > 0) this.impactCooldown -= dt;
    if (this.camShake > 0) this.camShake = Math.max(0, this.camShake - dt * 1.4);
    if (this.dmgFlashTimer > 0) {
      this.dmgFlashTimer = Math.max(0, this.dmgFlashTimer - dt);
      if (this.dmgFlashTimer <= 0 && this.el.dmgFlash) this.el.dmgFlash.classList.remove('on');
    }
    if (this.wastedTimer > 0) {
      this.wastedTimer = Math.max(0, this.wastedTimer - dt);
      if (this.wastedTimer <= 0) {
        if (this.el.wasted) this.el.wasted.classList.remove('on');
        this.playerHp = 100;
        this.playerArmor = 100;
        this.wantedStars = 0;
        this.updateHealthHUD();
        this.updateWantedHUD(0);
        this.setMode('foot');
        ps.x = -12.5; ps.z = -48.0; ps.y = 0.16; ps.vy = 0; ps.grounded = true;
        this.player.root.position.set(ps.x, ps.y, ps.z);
        this.snapCameraNext = true;
        // Calm all fighting NPCs upon hospital respawn
        for (let i = 0; i < this.pedestrians.length; i++) {
          if (this.pedestrians[i].state === 'fight') this.pedestrians[i].state = 'walk';
        }
      }
    }
    if (this.mountVice && this.mountVice.beacon) {
      this.mountVice.beacon.visible = (elapsed % 1.2) < 0.55;
    }
    for (let i = 0; i < this.pierRides.length; i++) {
      const pr = this.pierRides[i];
      if (pr.ring) pr.ring.scale.setScalar(1 + Math.sin(elapsed * 3.6 + pr.phase) * 0.08);
    }
    for (let i = 0; i < this.miniGamePads.length; i++) {
      const mp = this.miniGamePads[i];
      if (mp.ring) mp.ring.scale.setScalar(1 + Math.sin(elapsed * 3.2 + mp.phase) * 0.08);
    }
    if (this.activeMiniGame) this.updateMiniGame(dt, elapsed);

    if (this.streakTimer > 0) {
      this.streakTimer -= dt;
      if (this.streakTimer <= 0) { this.streakCount = 0; this.el.combo.classList.remove('on'); }
    }
    if (this.wantedStars > 0) {
      this.wantedDecay -= dt;
      if (this.wantedDecay <= 0) {
        this.wantedStars = Math.max(0, this.wantedStars - 1);
        this.wantedDecay = 10.0;
        this.updateWantedHUD(0);
      }
    }

    // 1. Dynamic Day/Night Cycle, Weather, Lightning, 3D Rain & Sky Follows Camera
    const tp = TIME_PRESETS[this.timeIdx];
    const wp = WEATHER_PRESETS[this.weatherIdx];
    const envLerp = Math.min(1, dt * 3.2);

    // Storm lightning flashes & rolling thunder
    if (this.weatherIdx === 2) {
      this.lightningCooldown -= dt;
      if (this.lightningCooldown <= 0) {
        this.lightningFlash = 1.0;
        this.lightningCooldown = 4.2 + Math.random() * 5.8;
        this.audio.thunder();
      }
    }
    if (this.lightningFlash > 0) this.lightningFlash = Math.max(0, this.lightningFlash - dt * 4.5);

    this.envSunDir.lerp(tp.sunDir, envLerp).normalize();
    const skyU = this.skyDome.material.uniforms;
    this.skyDome.position.copy(this.camera.position);
    skyU.uTime.value = elapsed;
    skyU.uSunDir.value.copy(this.envSunDir);
    skyU.uHorizon.value.lerp(_tmpCol.setHex(tp.horizon), envLerp);
    skyU.uLower.value.lerp(_tmpCol.setHex(tp.lower), envLerp);
    skyU.uMid.value.lerp(_tmpCol.setHex(tp.mid), envLerp);
    skyU.uZenith.value.lerp(_tmpCol.setHex(tp.zenith), envLerp);
    skyU.uSunGlow.value.lerp(_tmpCol.setHex(tp.sunGlow), envLerp);
    skyU.uNightMix.value = THREE.MathUtils.lerp(skyU.uNightMix.value, tp.nightMix, envLerp);
    skyU.uRainDark.value = THREE.MathUtils.lerp(skyU.uRainDark.value, wp.dark, envLerp);
    skyU.uLightning.value = this.lightningFlash;

    const ocU = this.ocean.material.uniforms;
    ocU.uTime.value = elapsed;
    ocU.uSunDir.value.copy(this.envSunDir);
    ocU.uSkyTint.value.lerp(_tmpCol.setHex(tp.skyTint), envLerp);
    ocU.uNightMix.value = skyU.uNightMix.value;

    const weatherLightDim = 1.0 - wp.dark * 0.42;
    this.sunLight.color.lerp(_tmpCol.setHex(tp.sunCol), envLerp);
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, tp.sunInt * weatherLightDim + this.lightningFlash * 2.2, envLerp * 2.5);
    if (this.hemiLight) {
      this.hemiLight.color.lerp(_tmpCol.setHex(tp.hemiSky), envLerp);
      this.hemiLight.groundColor.lerp(_tmpCol.setHex(tp.hemiGnd), envLerp);
      this.hemiLight.intensity = THREE.MathUtils.lerp(this.hemiLight.intensity, tp.hemiInt * weatherLightDim + this.lightningFlash * 0.9, envLerp * 2.0);
    }
    if (this.fillLight) {
      this.fillLight.intensity = THREE.MathUtils.lerp(this.fillLight.intensity, tp.fillInt * weatherLightDim, envLerp);
    }
    _tmpCol.setHex(tp.fog).lerp(_tmpCol2.setHex(0x1f2836), wp.dark * 0.65);
    this.scene.fog.color.lerp(_tmpCol, envLerp);
    this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, 0.00145 * wp.fogMult, envLerp);
    this.scene.background.copy(this.scene.fog.color);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, tp.exposure, envLerp);
    // Modulate iconic GTA Vice City 2D light coronas (subtle golden shimmer at sunset, vibrant neon halo at night!)
    if (this.coronaMats) {
      const coronaOp = tp.id === 'night' ? 0.72 : (tp.id === 'noon' ? 0.16 : 0.46);
      for (let ci = 0; ci < this.coronaMats.length; ci++) {
        this.coronaMats[ci].opacity = THREE.MathUtils.lerp(this.coronaMats[ci].opacity, coronaOp, envLerp);
      }
    }

    // 3D Falling Rain Streaks (Single Draw Call anchored around active actor!)
    if (this.rainLines && this.rainLines.mesh.visible) {
      this.rainLines.mesh.position.set(act.x, 0, act.z);
      const pos = this.rainLines.positions;
      const spds = this.rainLines.speeds;
      const windX = this.weatherIdx === 2 ? -0.32 : -0.14;
      const fallMult = this.weatherIdx === 2 ? 1.38 : 1.0;
      for (let i = 0; i < this.rainLines.count; i++) {
        const idx = i * 6;
        let ry = pos[idx + 1] - spds[i] * fallMult * dt;
        if (ry < 0) ry += 28;
        pos[idx + 1] = ry;
        pos[idx + 3] = pos[idx] + windX;
        pos[idx + 4] = ry - (this.weatherIdx === 2 ? 1.45 : 1.05);
      }
      this.rainLines.mesh.geometry.attributes.position.needsUpdate = true;
    }

    // Cycling Traffic Lights (Red -> Green -> Yellow)
    for (let i = 0; i < this.trafficSignals.length; i++) {
      const ts = this.trafficSignals[i];
      const cyc = (elapsed + ts.phase) % 10.0;
      ts.lG.material = cyc < 4.5 ? this.sigMats.grn : this.sigMats.off;
      ts.lY.material = (cyc >= 4.5 && cyc < 5.6) ? this.sigMats.yel : this.sigMats.off;
      ts.lR.material = cyc >= 5.6 ? this.sigMats.red : this.sigMats.off;
    }

    for (let i = 0; i < this.palms.length; i++) {
      const p = this.palms[i];
      p.userData.crown.rotation.z = Math.sin(elapsed * 1.3 + p.userData.phase) * 0.04;
      p.userData.crown.rotation.x = Math.cos(elapsed * 0.9 + p.userData.phase) * 0.025;
    }
    for (let i = 0; i < this.beacons.length; i++) {
      const b = this.beacons[i];
      b.material.emissiveIntensity = Math.sin(elapsed * 2.4 + b.userData.phase) > 0.25 ? 2.0 : 0.15;
    }
    for (let i = 0; i < this.yachts.length; i++) {
      const y = this.yachts[i];
      y.position.z += y.userData.speed * dt;
      y.rotation.z = Math.sin(elapsed * 1.1 + i * 2) * 0.035;
      if (y.position.z < -640) y.position.z = 30;
      if (y.position.z > 40) y.position.z = -620;
    }
    for (let i = 0; i < this.seagulls.length; i++) {
      const g = this.seagulls[i], u = g.userData;
      const ang = elapsed * u.spd + u.phase;
      g.position.set(u.cx + Math.cos(ang) * u.rad, u.cy + Math.sin(elapsed * 1.5 + u.phase) * 0.8, u.cz + Math.sin(ang) * u.rad);
      g.rotation.y = -ang;
      const flap = Math.sin(elapsed * 6.5 + u.phase) * 0.42;
      u.wL.rotation.y = flap; u.wR.rotation.y = -flap;
    }
    this.blimp.position.z = -280 + Math.sin(elapsed * 0.07) * 180;
    this.blimp.position.y = 54 + Math.sin(elapsed * 0.6) * 1.6;
    if (this.heli) {
      const ha = elapsed * 0.22;
      this.heli.group.position.set(-20 + Math.cos(ha) * 115, 36 + Math.sin(elapsed * 0.9) * 2.4, -290 + Math.sin(ha) * 165);
      this.heli.group.rotation.y = -ha;
      this.heli.rotorHub.rotation.y += dt * 26;
      this.heli.tailRotor.rotation.x += dt * 32;
    }
    // Iconic Vice Beach Carnival Fair & Amusement Pier Live Rides!
    if (this.ferrisWheel) {
      this.ferrisWheel.wheel.rotation.x += dt * 0.22;
      const counterRot = -this.ferrisWheel.wheel.rotation.x;
      for (let i = 0; i < this.ferrisWheel.gondolas.length; i++) {
        this.ferrisWheel.gondolas[i].rotation.x = counterRot;
      }
    }
    if (this.carnivalPier) {
      const cp = this.carnivalPier;
      // 1. Vintage Carousel (Spinning Canopy + 8 Bobbing Painted Horses)
      if (cp.carouselSpin) cp.carouselSpin.rotation.y += dt * 0.68;
      if (cp.carouselHorses) {
        for (let i = 0; i < cp.carouselHorses.length; i++) {
          const h = cp.carouselHorses[i];
          h.mesh.position.y = 1.65 + Math.sin(elapsed * 2.9 + h.phase) * 0.34;
        }
      }
      // 2. Wave Swinger (Spinning Tilted Canopy + Outward-Swinging Chains)
      if (cp.swingerTop) {
        cp.swingerTop.rotation.y -= dt * 1.18;
        cp.swingerTop.rotation.z = Math.sin(elapsed * 0.85) * 0.085;
      }
      if (cp.swChains) {
        for (let i = 0; i < cp.swChains.length; i++) {
          cp.swChains[i].rotation.z = 0.44 + Math.sin(elapsed * 1.7 + i * 0.65) * 0.065;
        }
      }
      // 3. "VICE CYCLONE" Oceanfront Roller Coaster (3-Car Train Gliding Along Spline!)
      if (cp.coasterCurve && cp.coasterCars) {
        const baseU = (elapsed * 0.068) % 1;
        const pierPos = cp.root.position;
        for (let i = 0; i < cp.coasterCars.length; i++) {
          const u = (baseU - i * 0.022 + 1) % 1;
          const nextU = (u + 0.012) % 1;
          const pt = cp.coasterCurve.getPointAt(u);
          const nextPt = cp.coasterCurve.getPointAt(nextU);
          const car = cp.coasterCars[i];
          car.position.copy(pt);
          _vecA.copy(nextPt).add(pierPos);
          car.lookAt(_vecA);
        }
      }
    }

    // Vice City International Airport Live Aviation, Flyable Aircraft & Doorway Beacons!
    if (this.atcRadar) this.atcRadar.rotation.y += dt * 1.45;
    if (this.doorBeacons) {
      for (let i = 0; i < this.doorBeacons.length; i++) {
        const db = this.doorBeacons[i];
        const s = 1.0 + Math.sin(elapsed * 3.4 + db.phase) * 0.08;
        db.mesh.scale.setScalar(s);
      }
    }
    if (this.interiorPerks) {
      for (let i = 0; i < this.interiorPerks.length; i++) {
        const ip = this.interiorPerks[i];
        ip.gem.rotation.y += dt * 2.2;
        ip.gem.position.y = 1.32 + Math.sin(elapsed * 3.0 + i) * 0.16;
        if (ip.cooldown > 0) ip.cooldown = Math.max(0, ip.cooldown - dt);
        if (isFoot && ip.cooldown <= 0 && Math.hypot(ps.x - ip.perkX, ps.z - ip.perkZ) < 2.2) {
          ip.cooldown = 10.0;
          this.audio.pickup();
          if (ip.kind === 'hotel') {
            this.wantedStars = 0;
            this.playerHp = 100;
            this.playerArmor = 100;
            this.updateHealthHUD();
            this.updateWantedHUD(0);
            this.cash += 250;
            this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.el.combo.innerHTML = `OCEAN VIEW SAFEHOUSE · FULL HP & HEAT CLEARED! <span>+$250</span>`;
          } else if (ip.kind === 'ammunation') {
            this.setWeapon('rifle');
            this.playerArmor = 100;
            this.playerHp = Math.min(100, this.playerHp + 40);
            this.updateHealthHUD();
            this.cash += 200;
            this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.el.combo.innerHTML = `AMMU-NATION · M4 ARSENAL & ARMOR LOADED! <span>+$200</span>`;
          } else if (ip.kind === 'club') {
            this.cash += 300;
            this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.el.combo.innerHTML = `MALIBU CLUB VIP · PARTY BONUS! <span>+$300</span>`;
          } else if (ip.kind === 'airport') {
            this.cash += 200;
            this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.el.combo.innerHTML = `BOARDING PASS · RUNWAY APRON OPEN! <span>+$200</span>`;
          } else {
            this.cash += 150;
            this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.el.combo.innerHTML = `HANGAR #1 · FLIGHT GEAR READY! <span>+$150</span>`;
          }
          this.el.combo.classList.add('on');
          this.streakTimer = 3.2;
        }
      }
    }
    // Update Flyable Airplanes (idle prop/turbine spin, active flight aerodynamics, or abandoned return!)
    if (this.flyablePlanes) {
      const canFly = isPlane && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen;
      for (let i = 0; i < this.flyablePlanes.length; i++) {
        const pl = this.flyablePlanes[i];
        if (isPlane && this.activePlane === pl) {
          const boost = canFly && this.keys.nitro;
          if (canFly && this.keys.up) pl.throttle = Math.min(1.0, pl.throttle + dt * 0.58);
          else if (canFly && this.keys.down) pl.throttle = Math.max(0.0, pl.throttle - dt * 0.72);
          else if (pl.y > 2.0) pl.throttle = THREE.MathUtils.damp(pl.throttle, 0.58, 0.45, dt);
          else pl.throttle = THREE.MathUtils.damp(pl.throttle, 0.0, 0.9, dt);

          const maxSpd = boost ? pl.topSpeed * 1.18 : pl.topSpeed;
          const targetSpd = pl.throttle * maxSpd;
          const accelRate = pl.throttle > 0.05 ? 1.15 : (pl.y < 0.8 ? 1.8 : 0.42);
          pl.speed = THREE.MathUtils.damp(pl.speed, targetSpd, accelRate, dt);
          if (canFly && this.keys.down && pl.y < 0.8) pl.speed = Math.max(0, pl.speed - 28 * dt);

          // Steering & Bank-to-Turn Aerodynamics
          let turnIn = 0;
          if (canFly && this.keys.left) turnIn += 1;
          if (canFly && this.keys.right) turnIn -= 1;

          const airborn = pl.y > 0.6;
          const targetRoll = airborn ? turnIn * 0.62 : 0;
          pl.roll = THREE.MathUtils.damp(pl.roll, targetRoll, 4.8, dt);

          if (airborn) {
            pl.yaw += pl.roll * 1.28 * dt;
          } else if (pl.speed > 1.2) {
            pl.yaw += turnIn * Math.min(1, pl.speed / 12) * 1.45 * dt;
          }

          // Pitch Control (SPACE = Pull Up / Climb, Q/Ctrl = Dive, S airborne = gentle descent)
          let targetPitch = 0;
          if (canFly && this.keys.drift) targetPitch = 0.44;
          else if (canFly && this.keys.dive) targetPitch = -0.36;
          else if (airborn && canFly && this.keys.down) targetPitch = -0.22;
          else if (!airborn && pl.speed > pl.takeoffSpeed * 1.12 && canFly && this.keys.up) targetPitch = 0.14;
          pl.pitch = THREE.MathUtils.damp(pl.pitch, targetPitch, 4.2, dt);

          // Forward & Vertical Flight Integration
          const cosP = Math.cos(pl.pitch);
          const fwdX = -Math.sin(pl.yaw) * cosP;
          const fwdZ = -Math.cos(pl.yaw) * cosP;
          const liftRatio = THREE.MathUtils.clamp((pl.speed - pl.takeoffSpeed * 0.65) / (pl.takeoffSpeed * 0.45), 0, 1);
          let vy = Math.sin(pl.pitch) * pl.speed * 0.78;
          if (airborn && liftRatio < 0.85) vy -= (1 - liftRatio) * 10.5;
          if (!airborn && (pl.speed < pl.takeoffSpeed || vy < 0)) vy = 0;

          const planeGroundY = Math.max(0.02, getTerrainHeight(pl.x, pl.z) + 0.04);
          pl.x += fwdX * pl.speed * dt;
          pl.z += fwdZ * pl.speed * dt;
          pl.y = THREE.MathUtils.clamp(pl.y + vy * dt, planeGroundY, 240);

          // Smooth Touchdown Leveling
          if (pl.y <= planeGroundY + 0.03) {
            pl.y = planeGroundY;
            pl.pitch = THREE.MathUtils.damp(pl.pitch, 0, 8, dt);
            pl.roll = THREE.MathUtils.damp(pl.roll, 0, 8, dt);
          }

          // Wide Scenic Airspace Soft Boundary Turnback (Covers all of Vice City + Mount Vice Summit!)
          if (pl.x < -580 || pl.x > 330 || pl.z < -1580 || pl.z > 440) {
            const toCenterYaw = Math.atan2(-(pl.x - (-100)), -(pl.z - (-350)));
            let dy = toCenterYaw - pl.yaw;
            while (dy > Math.PI) dy -= Math.PI * 2;
            while (dy < -Math.PI) dy += Math.PI * 2;
            pl.yaw += Math.sign(dy) * Math.min(Math.abs(dy), dt * 1.4);
          }

          // Subtle Wingtip Contrails / Jet Exhaust Haze at High Speed
          if (pl.speed > 32 && Math.random() < (boost ? 0.85 : 0.42)) {
            this.spawnParticle(
              pl.x - fwdX * 4.5 + (Math.random() - 0.5) * 1.6,
              pl.y + 1.4,
              pl.z - fwdZ * 4.5 + (Math.random() - 0.5) * 1.6,
              -fwdX * 3, 0.4, -fwdZ * 3,
              boost ? 0xff8a2a : 0xeef6ff, 0.65, 0.55, 1.8, 0
            );
          }
        } else if (pl.resetTimer > 0) {
          // Abandoned mid-air plane glides out briefly then respawns cleanly on Airport Apron!
          pl.resetTimer -= dt;
          pl.x += -Math.sin(pl.yaw) * pl.speed * 0.7 * dt;
          pl.z += -Math.cos(pl.yaw) * pl.speed * 0.7 * dt;
          pl.y = Math.max(0.02, pl.y - 4.5 * dt);
          if (pl.resetTimer <= 0) {
            pl.x = pl.homeX; pl.y = 0.02; pl.z = pl.homeZ;
            pl.yaw = pl.homeYaw; pl.pitch = 0; pl.roll = 0;
            pl.speed = 0; pl.throttle = 0; pl.gearBlend = 1;
          }
        }
        this.syncPlaneTransform(pl, dt, elapsed);
      }
    }
    if (this.windsock) {
      this.windsock.rotation.y = Math.sin(elapsed * 2.1) * 0.24;
      this.windsock.rotation.z = -0.14 + Math.sin(elapsed * 5.2) * 0.12;
    }
    if (this.rwyLights && this.rwyLights.length) {
      for (let i = 0; i < this.rwyLights.length; i++) {
        const rl = this.rwyLights[i];
        const wave = Math.sin(elapsed * 5.2 - rl.phase);
        const s = wave > 0.65 ? 1.32 : 0.92;
        rl.mesh.scale.setScalar(s);
      }
    }
    if (this.parkedJets) {
      const strobeOn = (elapsed % 1.4) < 0.14;
      for (let i = 0; i < this.parkedJets.length; i++) {
        const pj = this.parkedJets[i];
        if (pj.fanMeshes) {
          for (let f = 0; f < pj.fanMeshes.length; f++) pj.fanMeshes[f].rotation.z += dt * 4.5;
        }
        if (pj.strobe) pj.strobe.visible = strobeOn;
      }
    }
    if (this.flyingJet) {
      const fj = this.flyingJet;
      fj.cycleT = ((fj.cycleT || 0) + dt) % 46.0;
      const t = fj.cycleT;
      let jx = -252, jy = 0.02, jz = 114;
      let jYaw = -Math.PI / 2, jPitch = 0, jRoll = 0;
      let thrust = 0.35, gearDown = true;

      if (t < 8.5) {
        // 0..8.5s: Runway Takeoff Acceleration & Rotation (West -> East along Z = 114)
        const p = t / 8.5;
        jx = -252 + p * p * 238;
        const rotP = THREE.MathUtils.clamp((p - 0.68) / 0.32, 0, 1);
        jy = 0.02 + rotP * rotP * 14.0;
        jPitch = rotP * 0.21;
        jYaw = -Math.PI / 2;
        thrust = 0.92;
        gearDown = jy < 8.0;
      } else if (t < 15.0) {
        // 8.5..15s: Steep Tropical Climb Over Atlantic Ocean
        const p = (t - 8.5) / 6.5;
        jx = -14 + p * 185;
        jy = 14 + p * 54;
        jz = 114 - p * p * 130;
        jYaw = -Math.PI / 2 + p * 0.68;
        jPitch = 0.21 * (1 - p * 0.55);
        jRoll = -0.24 * p;
        thrust = 0.85;
        gearDown = false;
      } else if (t < 31.0) {
        // 15..31s: Scenic Vice City Coastal Sky Orbit (Visible from Ocean Drive & Carnival Pier!)
        const p = (t - 15.0) / 16.0;
        const ang = p * Math.PI * 1.48;
        const cx = -95, cz = -180, rx = 275, rz = 290;
        jx = cx + Math.cos(ang) * rx;
        jz = cz + Math.sin(ang) * rz;
        const nextAng = ang + 0.04;
        const nx = cx + Math.cos(nextAng) * rx;
        const nz = cz + Math.sin(nextAng) * rz;
        jYaw = Math.atan2(-(nx - jx), -(nz - jz));
        jy = 68 + Math.sin(p * Math.PI) * 20 - Math.max(0, p - 0.72) * 115;
        jPitch = p > 0.72 ? -0.10 : 0.02;
        jRoll = -0.28;
        thrust = 0.55;
        gearDown = jy < 36;
      } else if (t < 39.0) {
        // 31..39s: Final Approach Glide Slope from West -> Runway 09 Touchdown!
        const p = (t - 31.0) / 8.0;
        const startX = -370, endX = -215;
        jx = THREE.MathUtils.lerp(startX, endX, p);
        jz = THREE.MathUtils.lerp(132, 114, Math.min(1, p * 1.4));
        jy = Math.max(0.02, (1 - p) * (1 - p) * 36);
        jYaw = -Math.PI / 2;
        jPitch = p > 0.82 ? 0.08 * ((p - 0.82) / 0.18) : -0.08;
        jRoll = 0;
        thrust = 0.35;
        gearDown = true;
        if (p > 0.96 && Math.random() < 0.65) {
          this.spawnParticle(jx, 0.35, jz + (Math.random() - 0.5) * 3.5, -6, 1.4, (Math.random() - 0.5) * 2, 0xeae6f2, 1.25, 0.7, 2.2, 0);
        }
      } else {
        // 39..46s: Runway Rollout & Smooth Reset to Threshold for Next Takeoff
        const p = (t - 39.0) / 7.0;
        if (p < 0.72) {
          const rp = p / 0.72;
          jx = -215 + (1 - (1 - rp) * (1 - rp)) * 175;
          jz = 114;
          jYaw = -Math.PI / 2;
        } else {
          const tp = (p - 0.72) / 0.28;
          jx = THREE.MathUtils.lerp(-40, -252, tp);
          jz = 114 + Math.sin(tp * Math.PI) * 18;
          jYaw = Math.PI / 2;
        }
        jy = 0.02;
        jPitch = 0;
        jRoll = 0;
        thrust = 0.22;
        gearDown = true;
      }

      fj.root.position.set(jx, jy, jz);
      fj.root.rotation.order = 'YXZ';
      fj.root.rotation.set(jPitch, jYaw, jRoll);
      if (fj.gearGroup) fj.gearGroup.visible = gearDown;
      if (fj.shadow) fj.shadow.visible = jy < 12;
      if (fj.engineGlowMat) fj.engineGlowMat.opacity = thrust * 0.75;
      if (fj.strobe) fj.strobe.visible = (elapsed % 0.95) < 0.12;
      if (fj.fanMeshes) {
        const fSpd = 12 + thrust * 32;
        for (let f = 0; f < fj.fanMeshes.length; f++) fj.fanMeshes[f].rotation.z += dt * fSpd;
      }
    }
    // Midtown Fountain Plazas (pulsing water jets + mist)
    for (let i = 0; i < this.fountains.length; i++) {
      const f = this.fountains[i];
      const pulse = 0.88 + Math.sin(elapsed * 5.2 + i * 1.7) * 0.16;
      f.jet.scale.y = pulse;
      if (Math.hypot(act.x - f.x, act.z - f.z) < 42 && Math.random() < 0.22) {
        this.spawnParticle(
          f.x + (Math.random() - 0.5) * 1.2, 3.6, f.z + (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 2.2, 2.4 + Math.random() * 1.6, (Math.random() - 0.5) * 2.2,
          0x8cf4f8, 0.36, 0.72, 0.55, 8.2
        );
      }
    }
    // Bobbing Marina Speedboats near Pier
    for (let i = 0; i < this.speedboats.length; i++) {
      const b = this.speedboats[i];
      b.group.position.y = -0.42 + Math.sin(elapsed * 2.1 + b.phase) * 0.09;
      b.group.rotation.z = Math.sin(elapsed * 1.5 + b.phase) * 0.045;
      b.group.rotation.x = Math.cos(elapsed * 1.3 + b.phase) * 0.025;
    }
    // 3D GPS Destination Sky Beacon pulse
    if (this.navBeacon && this.navBeacon.group.visible) {
      const ringS = 1.0 + Math.sin(elapsed * 4.2) * 0.14;
      this.navBeacon.ring.scale.set(ringS, ringS, 1);
      this.navBeacon.beam.material.opacity = 0.12 + Math.sin(elapsed * 3.4) * 0.05;
    }

    // 2. Supercar Driving & Bulletproof Road-Graph Autopilot
    if (this.boostPadTimer > 0) this.boostPadTimer = Math.max(0, this.boostPadTimer - dt);
    let accelInput = 0, steerInput = 0, braking = false, nitroActive = !isFoot && this.boostPadTimer > 0, drifting = false;

    if (!isFoot && this.autopilotQueue.length > 0) {
      const tgt = this.autopilotQueue[0];
      const dx = tgt.x - cs.x, dz = tgt.z - cs.z, dist = Math.hypot(dx, dz);
      const isFinal = this.autopilotQueue.length === 1;
      const arriveDist = isFinal ? 3.2 : 4.2;

      if (dist < arriveDist) {
        this.autopilotQueue.shift();
        this.autopilotStuckTimer = 0;
        if (this.autopilotQueue.length === 0) {
          cs.speed *= 0.25;
          this.cancelAutopilot();
        }
      } else {
        // Anti-stuck monitor: if blocked for >0.85s, smoothly reverse & re-plan
        this.autopilotStuckTimer += dt;
        if (this.autopilotStuckTimer > 0.85) {
          const moved = Math.hypot(cs.x - this.autopilotLastPos.x, cs.z - this.autopilotLastPos.z);
          this.autopilotLastPos = { x: cs.x, z: cs.z };
          this.autopilotStuckTimer = 0;
          if (moved < 1.1 && this.autopilotReverseTimer <= 0) {
            this.autopilotReverseTimer = 0.72;
            const desiredYaw0 = Math.atan2(-dx, -dz);
            let d0 = desiredYaw0 - cs.yaw;
            while (d0 > Math.PI) d0 -= Math.PI * 2;
            while (d0 < -Math.PI) d0 += Math.PI * 2;
            this.autopilotReverseSteer = d0 >= 0 ? -0.9 : 0.9;
          }
        }

        if (this.autopilotReverseTimer > 0) {
          this.autopilotReverseTimer -= dt;
          accelInput = -0.78;
          steerInput = this.autopilotReverseSteer;
          if (this.autopilotReverseTimer <= 0 && this.autopilotTarget) {
            this.planAutopilotTo(this.autopilotTarget);
          }
        } else {
          // Slight lateral lane nudge if a traffic car is directly ahead (<14m)
          let aimX = tgt.x, aimZ = tgt.z;
          const fx = -Math.sin(cs.yaw), fz = -Math.cos(cs.yaw);
          const rx = Math.cos(cs.yaw), rz = -Math.sin(cs.yaw);
          for (let ti = 0; ti < this.traffic.length; ti++) {
            const tc = this.traffic[ti];
            const tdx = tc.position.x - cs.x, tdz = tc.position.z - cs.z;
            const fwd = tdx * fx + tdz * fz;
            const lat = tdx * rx + tdz * rz;
            if (fwd > 1.5 && fwd < 14 && Math.abs(lat) < 2.6) {
              const side = lat >= 0 ? -3.6 : 3.6;
              aimX += rx * side;
              aimZ += rz * side;
              break;
            }
          }

          const desiredYaw = Math.atan2(-(aimX - cs.x), -(aimZ - cs.z));
          let diff = desiredYaw - cs.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;

          // If target is sharply behind us (>105 deg), execute a clean 3-point reverse turn!
          if (Math.abs(diff) > 1.82 && dist > 5.0 && cs.speed < 8.0) {
            accelInput = -0.68;
            steerInput = diff > 0 ? -1.0 : 1.0;
          } else {
            steerInput = THREE.MathUtils.clamp(diff * 2.45, -1, 1);
            // Anticipate upcoming 90-degree corner slowdown so car never swings wide into poles/walls!
            let cornerCap = 42;
            if (this.autopilotQueue.length >= 2 && dist < 24) {
              const nxt = this.autopilotQueue[1];
              const seg1Yaw = Math.atan2(-(tgt.x - cs.x), -(tgt.z - cs.z));
              const seg2Yaw = Math.atan2(-(nxt.x - tgt.x), -(nxt.z - tgt.z));
              let turnAng = Math.abs(seg2Yaw - seg1Yaw);
              if (turnAng > Math.PI) turnAng = Math.PI * 2 - turnAng;
              if (turnAng > 0.55) cornerCap = THREE.MathUtils.clamp(dist * 0.95, 11.5, 28);
            }
            const angleCap = Math.abs(diff) > 0.65 ? 11.5 : (Math.abs(diff) > 0.25 ? 24 : cornerCap);
            const targetSpd = isFinal ? THREE.MathUtils.clamp(dist * 1.15, 7.5, angleCap) : Math.min(angleCap, 42);
            if (cs.speed > targetSpd + 3.0) { accelInput = -0.85; braking = true; }
            else if (cs.speed < targetSpd) accelInput = 0.92;
          }
        }

        // Update live GPS Auto-Drive distance banner
        if (this.autopilotTarget) {
          const totalDist = Math.round(Math.hypot(this.autopilotTarget.x - cs.x, this.autopilotTarget.z - cs.z));
          if (Math.abs(totalDist - this.lastAutoDist) >= 3) {
            this.lastAutoDist = totalDist;
            this.el.autoText.textContent = `GPS Auto-Drive → ${this.autopilotTarget.label} · ${totalDist}m`;
          }
        }
      }
    } else if (!isFoot && !isPlane && !isRide && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.miniGameHubOpen && !this.activeDialogue && this.wastedTimer <= 0) {
      if (this.keys.up) accelInput += 1;
      if (this.keys.down) accelInput -= 1;
      if (this.keys.left) steerInput += 1;
      if (this.keys.right) steerInput -= 1;
      if (this.keys.nitro && cs.speed > 4) nitroActive = true;
      braking = (this.keys.down && cs.speed > 1.5) || this.keys.drift;
      drifting = this.keys.drift && Math.abs(cs.speed) > 12 && Math.abs(steerInput) > 0.1;
    }

    const veh = this.activeVehicle || this.heroVehicle;
    const maxSpeed = nitroActive ? (veh.nitroSpeed || 72) : (veh.topSpeed || 52);
    const accelRate = nitroActive ? (veh.accel || 22) * 1.6 : (veh.accel || 22);
    let targetPitch = 0;

    if (accelInput > 0) {
      cs.speed = Math.min(maxSpeed, cs.speed + accelInput * accelRate * dt);
      targetPitch = nitroActive ? 0.045 : 0.022;
    } else if (accelInput < 0) {
      if (cs.speed > 0.8) { cs.speed = Math.max(0, cs.speed - 36 * dt); targetPitch = -0.042; }
      else { cs.speed = Math.max(-16, cs.speed + accelInput * 14 * dt); targetPitch = -0.02; }
    } else {
      cs.speed = THREE.MathUtils.damp(cs.speed, 0, (isFoot || isPlane || isRide) ? 4.5 : 1.35, dt);
    }
    if (!isFoot && !isPlane && !isRide && this.keys.drift && Math.abs(cs.speed) > 4) cs.speed = THREE.MathUtils.damp(cs.speed, 0, 1.8, dt);

    // Car Drive-By Uzi auto-fire cooldown
    if (!isFoot && !isPlane && !isRide) {
      if (this.fireCooldown > 0) this.fireCooldown = Math.max(0, this.fireCooldown - dt);
      if (this.fireHeld && this.fireCooldown <= 0 && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.activeDialogue && this.wastedTimer <= 0) {
        this.fireWeapon();
      }
    }

    cs.steer = THREE.MathUtils.damp(cs.steer, steerInput * 0.45, 10, dt);
    const speedFactor = THREE.MathUtils.clamp(Math.abs(cs.speed) / 13, 0, 1);
    cs.yaw += cs.steer * speedFactor * (drifting ? 2.55 : 1.85) * (veh.grip || 1.0) * (cs.speed >= -0.05 ? 1 : -1) * dt;
    cs.driftSlip = THREE.MathUtils.damp(cs.driftSlip, drifting ? steerInput * 0.24 : 0, 6, dt);

    const moveYaw = cs.yaw - cs.driftSlip;
    cs.x += -Math.sin(moveYaw) * cs.speed * dt;
    cs.z += -Math.cos(moveYaw) * cs.speed * dt;

    // 2b. Cinematic 4-Phase Carjacking / Vehicle Door Animation OR Normal On-Foot Locomotion
    if (this.carjackAnim) {
      this.updateCarjackAnim(dt, elapsed);
    } else if (isRide) {
      // RIDEABLE AMUSEMENT PARK RIDES ON VICE CARNIVAL PIER (Ferris Wheel, Cyclone Coaster, Vintage Carousel!)
      const r = this.activeRide;
      const pMesh = this.player;
      let seatObj = null;
      let seatOffY = -0.35;
      if (r.id === 'ferris' && this.ferrisWheel && this.ferrisWheel.gondolas[0]) {
        seatObj = this.ferrisWheel.gondolas[0];
        seatOffY = -1.15;
      } else if (r.id === 'coaster' && this.carnivalPier && this.carnivalPier.coasterCars[0]) {
        seatObj = this.carnivalPier.coasterCars[0];
        seatOffY = 0.25;
      } else if (r.id === 'carousel' && this.carnivalPier && this.carnivalPier.carouselHorses[0]) {
        seatObj = this.carnivalPier.carouselHorses[0].mesh;
        seatOffY = 0.42;
      }
      if (seatObj) {
        seatObj.getWorldPosition(_vecA);
        ps.x = _vecA.x;
        ps.y = _vecA.y + seatOffY;
        ps.z = _vecA.z;
        pMesh.root.position.set(ps.x, ps.y, ps.z);
        if (r.id === 'coaster') {
          pMesh.root.rotation.y = seatObj.rotation.y + Math.PI;
        } else {
          pMesh.root.rotation.y = elapsed * 0.35;
        }
        // Seated thrill-ride posture (legs tucked, hands up on roller coaster!)
        const handsUp = r.id === 'coaster' ? 2.55 : 0.65;
        pMesh.armL.rotation.set(handsUp, 0, 0.25);
        pMesh.armR.rotation.set(handsUp, 0, -0.25);
        pMesh.legL.rotation.x = 1.15;
        pMesh.legR.rotation.x = 1.15;
      }
    } else if (isFoot) {
      const canAct = this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.activeDialogue && this.wastedTimer <= 0;
      let moveFwd = 0, moveStrafe = 0;
      if (canAct) {
        if (this.keys.up) moveFwd += 1;
        if (this.keys.down) moveFwd -= 1;
        if (this.keys.right) moveStrafe += 1;
        if (this.keys.left) moveStrafe -= 1;
      }

      const camYaw = this.orbitYawOffset;
      const cfX = -Math.sin(camYaw), cfZ = -Math.cos(camYaw);
      const crX = Math.cos(camYaw), crZ = -Math.sin(camYaw);
      let mx = cfX * moveFwd + crX * moveStrafe;
      let mz = cfZ * moveFwd + crZ * moveStrafe;
      const mLen = Math.hypot(mx, mz);
      const sprinting = Boolean(canAct && this.keys.nitro && mLen > 0.05);
      const targetMaxSpd = ps.attackTimer > 0 ? 1.8 : (sprinting ? 8.6 : 4.5);

      // Smooth biomechanical acceleration & deceleration (zero robotic instant start/stop!)
      const targetVx = mLen > 0.05 ? (mx / mLen) * targetMaxSpd : 0;
      const targetVz = mLen > 0.05 ? (mz / mLen) * targetMaxSpd : 0;
      const velDamp = mLen > 0.05 ? 11.5 : 14.5;
      ps.vx = THREE.MathUtils.damp(ps.vx || 0, targetVx, velDamp, dt);
      ps.vz = THREE.MathUtils.damp(ps.vz || 0, targetVz, velDamp, dt);

      ps.x += ps.vx * dt;
      ps.z += ps.vz * dt;
      const moveSpeed = Math.hypot(ps.vx, ps.vz);
      ps.speed = moveSpeed;

      let yawDeltaRate = 0;
      if (moveSpeed > 0.25 && ps.attackTimer <= 0) {
        const targetYaw = Math.atan2(-ps.vx, -ps.vz);
        let dy = targetYaw - ps.yaw;
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        const stepYaw = dy * Math.min(1, dt * 11.5);
        ps.yaw += stepYaw;
        yawDeltaRate = THREE.MathUtils.clamp(dy, -1.2, 1.2);
      }
      // Natural turn banking lean & landing knee compression
      ps.turnLean = THREE.MathUtils.damp(ps.turnLean || 0, -yawDeltaRate * Math.min(1, moveSpeed / 6.5) * 0.16, 10, dt);
      ps.landSquash = THREE.MathUtils.damp(ps.landSquash || 0, 0, 12, dt);

      // Ground-speed-matched stride phase (zero foot-sliding!)
      if (moveSpeed > 0.15) {
        const cadence = sprinting ? 1.56 : 1.88;
        ps.walkPhase += dt * moveSpeed * cadence;
      }

      if (canAct && this.keys.drift && ps.grounded) {
        ps.vy = 7.4;
        ps.grounded = false;
        this.audio.jump();
      }
      const onPierDeck = ps.x >= 17.5 && ps.x <= 141.5 && ps.z >= -448 && ps.z <= -412;
      const footMvHit = ps.z < -1104 ? closestMountainRoad(ps.x, ps.z) : null;
      const footFloorY = onPierDeck ? 0.16 : (getTerrainHeight(ps.x, ps.z) + (footMvHit && footMvHit.dist < 7.2 ? 0.08 : 0));
      if (ps.grounded) {
        ps.y = footFloorY;
      }
      if (!ps.grounded || ps.y > footFloorY + 0.02) {
        if (ps.parachuting) {
          ps.vy = THREE.MathUtils.damp(ps.vy, -6.2, 4.5, dt);
          if (this.parachuteMesh) {
            this.parachuteMesh.visible = true;
            this.parachuteMesh.rotation.z = Math.sin(elapsed * 2.2) * 0.06 - ps.turnLean * 0.5;
          }
        } else {
          ps.vy -= 21.0 * dt;
        }
        ps.y += ps.vy * dt;
        if (ps.y <= footFloorY) {
          ps.y = footFloorY;
          ps.vy = 0;
          ps.grounded = true;
          ps.parachuting = false;
          if (this.parachuteMesh) this.parachuteMesh.visible = false;
          ps.landSquash = 0.22;
        }
      }

      if (canAct && !this.pointerLocked && Math.abs(this.hoverNormX) > 0.88 && (performance.now() - this.lastLookTime < 1600)) {
        const edgeStrength = (Math.abs(this.hoverNormX) - 0.88) / 0.12;
        this.orbitYawOffset -= Math.sign(this.hoverNormX) * edgeStrength * 2.15 * dt;
      }

      this.resolvePlayerCollisions();

      // Weapons cooldowns, SMG / Rifle auto-fire, Muzzle Flash & Crosshair recoil pulse
      if (this.fireCooldown > 0) this.fireCooldown = Math.max(0, this.fireCooldown - dt);
      const curWep = WEAPONS.find((w) => w.id === this.weapon);
      if (this.fireHeld && curWep && curWep.auto && this.fireCooldown <= 0 && canAct) {
        this.fireWeapon();
      }
      if (this.muzzleFlashTimer > 0) {
        this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - dt);
        if (this.player.weapons && this.player.weapons.muzzleFlash) {
          this.player.weapons.muzzleFlash.visible = this.muzzleFlashTimer > 0;
          this.player.weapons.muzzleFlash.rotation.z = elapsed * 40;
        }
      } else if (this.player.weapons && this.player.weapons.muzzleFlash && this.player.weapons.muzzleFlash.visible) {
        this.player.weapons.muzzleFlash.visible = false;
      }
      if (this.crosshairPulseTimer > 0) {
        this.crosshairPulseTimer = Math.max(0, this.crosshairPulseTimer - dt);
        if (this.crosshairPulseTimer <= 0) this.el.crosshair.classList.remove('pulse');
      }

      const isFirearm = this.weapon !== 'fists' && this.weapon !== 'bat';
      if (isFirearm && ps.attackTimer <= 0) {
        let dyAim = this.orbitYawOffset - ps.yaw;
        while (dyAim > Math.PI) dyAim -= Math.PI * 2;
        while (dyAim < -Math.PI) dyAim += Math.PI * 2;
        ps.yaw += dyAim * Math.min(1, dt * 15);
      }

      if (ps.comboResetTimer > 0) {
        ps.comboResetTimer -= dt;
        if (ps.comboResetTimer <= 0) ps.attackCombo = 0;
      }
      if (ps.combatGuardTimer > 0) {
        ps.combatGuardTimer = Math.max(0, ps.combatGuardTimer - dt);
      }

      const pMesh = this.player;
      const chest = pMesh.chest;
      const head = pMesh.head;
      const kneeL = pMesh.legL.userData && pMesh.legL.userData.knee;
      const kneeR = pMesh.legR.userData && pMesh.legR.userData.knee;
      const ankleL = pMesh.legL.userData && pMesh.legL.userData.ankle;
      const ankleR = pMesh.legR.userData && pMesh.legR.userData.ankle;
      const elbowL = pMesh.armL.userData && pMesh.armL.userData.elbow;
      const elbowR = pMesh.armR.userData && pMesh.armR.userData.elbow;

      const batPivot = pMesh.weapons && pMesh.weapons.batPivot;
      const batTrailMat = pMesh.weapons && pMesh.weapons.batTrailMat;
      if (batTrailMat) batTrailMat.opacity = 0;

      if (ps.attackTimer > 0) {
        ps.attackTimer = Math.max(0, ps.attackTimer - dt);
        const hitThreshold = ps.attackType === 'bat' ? (ps.attackCombo === 3 ? 0.48 : 0.56) : 0.58;
        if (!ps.hitApplied && ps.attackTimer <= ps.attackDur * hitThreshold) {
          ps.hitApplied = true;
          this.applyMeleeHit();
        }
        const prog = 1 - ps.attackTimer / Math.max(0.01, ps.attackDur);
        const swing = Math.sin(prog * Math.PI);
        const easeOut3 = (t) => 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3);
        const easeInOut = (t) => { const c = THREE.MathUtils.clamp(t, 0, 1); return c * c * (3 - 2 * c); };

        if (ps.attackType === 'bat') {
          // AUTHENTIC GTA VICE CITY 3-HIT FULL-BODY BASEBALL BAT COMBO (YXZ Euler order -> clean horizontal & overhead arcs!)
          const cIdx = ps.attackCombo || 1;
          let chestY = 0, chestX = 0, chestZ = 0, bodyY = 0, bodyPosY = 0;
          let rX = 1.32, rY = 0, rZ = 0.12, eRX = 0.22;
          let lX = 1.05, lY = 0.35, lZ = -0.35, eLX = 0.65;
          let bpX = 0.14, bpZ = 0;
          let trailOp = 0;

          if (cIdx === 1) {
            // HIT 1: Wide Forehand Home-Run Sweep (Right-to-Left full torso whip!)
            if (prog < 0.24) {
              const t = easeInOut(prog / 0.24);
              chestY = -0.78 * t; chestX = 0.08 * t; bodyY = -0.18 * t;
              rX = THREE.MathUtils.lerp(0.65, 1.24, t);
              rY = THREE.MathUtils.lerp(-0.20, -1.16, t);
              rZ = THREE.MathUtils.lerp(0.18, 0.34, t);
              eRX = THREE.MathUtils.lerp(1.20, 0.66, t);
              lX = THREE.MathUtils.lerp(0.25, 1.05, t);
              lY = THREE.MathUtils.lerp(0.0, -0.52, t);
              lZ = -0.32 * t;
              eLX = THREE.MathUtils.lerp(0.25, 0.85, t);
              bpX = THREE.MathUtils.lerp(1.05, 0.30, t);
            } else if (prog < 0.58) {
              const t = easeOut3((prog - 0.24) / 0.34);
              chestY = THREE.MathUtils.lerp(-0.78, 0.88, t);
              chestX = THREE.MathUtils.lerp(0.08, -0.14, t);
              bodyY = THREE.MathUtils.lerp(-0.18, 0.24, t);
              rX = THREE.MathUtils.lerp(1.24, 1.44, t);
              rY = THREE.MathUtils.lerp(-1.16, 1.32, t);
              rZ = THREE.MathUtils.lerp(0.34, -0.14, t);
              eRX = THREE.MathUtils.lerp(0.66, 0.14, t);
              lX = THREE.MathUtils.lerp(1.05, 1.18, t);
              lY = THREE.MathUtils.lerp(-0.52, 0.92, t);
              lZ = THREE.MathUtils.lerp(-0.32, 0.16, t);
              eLX = THREE.MathUtils.lerp(0.85, 0.42, t);
              bpX = 0.12;
              trailOp = Math.sin(t * Math.PI) * 0.62;
            } else {
              const t = easeInOut((prog - 0.58) / 0.42);
              chestY = THREE.MathUtils.lerp(0.88, 0.0, t);
              chestX = THREE.MathUtils.lerp(-0.14, 0.0, t);
              bodyY = THREE.MathUtils.lerp(0.24, 0.0, t);
              rX = THREE.MathUtils.lerp(1.44, 0.36, t);
              rY = THREE.MathUtils.lerp(1.32, -0.14, t);
              rZ = THREE.MathUtils.lerp(-0.14, 0.20, t);
              eRX = THREE.MathUtils.lerp(0.14, 1.48, t);
              lX = THREE.MathUtils.lerp(1.18, 0.12, t);
              lY = THREE.MathUtils.lerp(0.92, 0.0, t);
              lZ = THREE.MathUtils.lerp(0.16, 0.05, t);
              eLX = THREE.MathUtils.lerp(0.42, 0.18, t);
              bpX = THREE.MathUtils.lerp(0.12, 1.12, t);
            }
          } else if (cIdx === 2) {
            // HIT 2: Explosive Backhand Cross-Slash (Left-to-Right return!)
            if (prog < 0.22) {
              const t = easeInOut(prog / 0.22);
              chestY = THREE.MathUtils.lerp(0.25, 0.82, t);
              bodyY = 0.20 * t;
              rX = 1.34; rY = THREE.MathUtils.lerp(0.45, 1.24, t); rZ = -0.18; eRX = 0.42;
              lX = 1.10; lY = 0.80 * t; lZ = 0.12; eLX = 0.55;
              bpX = 0.22;
            } else if (prog < 0.58) {
              const t = easeOut3((prog - 0.22) / 0.36);
              chestY = THREE.MathUtils.lerp(0.82, -0.84, t);
              chestX = -0.12 * Math.sin(t * Math.PI);
              bodyY = THREE.MathUtils.lerp(0.20, -0.22, t);
              rX = THREE.MathUtils.lerp(1.34, 1.22, t);
              rY = THREE.MathUtils.lerp(1.24, -1.20, t);
              rZ = THREE.MathUtils.lerp(-0.18, 0.36, t);
              eRX = 0.16;
              lX = THREE.MathUtils.lerp(1.10, 0.78, t);
              lY = THREE.MathUtils.lerp(0.80, -0.58, t);
              lZ = THREE.MathUtils.lerp(0.12, -0.28, t);
              eLX = 0.52;
              bpX = 0.14;
              trailOp = Math.sin(t * Math.PI) * 0.58;
            } else {
              const t = easeInOut((prog - 0.58) / 0.42);
              chestY = THREE.MathUtils.lerp(-0.84, 0.0, t);
              bodyY = THREE.MathUtils.lerp(-0.22, 0.0, t);
              rX = THREE.MathUtils.lerp(1.22, 0.32, t);
              rY = THREE.MathUtils.lerp(-1.20, -0.14, t);
              rZ = THREE.MathUtils.lerp(0.36, 0.22, t);
              eRX = THREE.MathUtils.lerp(0.16, 1.62, t);
              lX = THREE.MathUtils.lerp(0.78, 0.10, t);
              lY = THREE.MathUtils.lerp(-0.58, 0.0, t);
              lZ = THREE.MathUtils.lerp(-0.28, 0.05, t);
              eLX = THREE.MathUtils.lerp(0.52, 0.18, t);
              bpX = THREE.MathUtils.lerp(0.14, 1.22, t);
            }
          } else {
            // HIT 3: Heavy Two-Handed Overhead Vice City Finisher Smash!
            if (prog < 0.32) {
              const t = easeInOut(prog / 0.32);
              chestX = 0.22 * t; chestY = -0.18 * t; bodyPosY = 0.09 * t;
              rX = THREE.MathUtils.lerp(0.60, 2.72, t);
              rY = -0.12 * t; rZ = -0.16 * t;
              eRX = THREE.MathUtils.lerp(1.10, 0.58, t);
              lX = THREE.MathUtils.lerp(0.30, 2.55, t);
              lY = 0.18 * t; lZ = 0.22 * t; eLX = 0.62 * t;
              bpX = THREE.MathUtils.lerp(1.0, 0.32, t);
            } else if (prog < 0.62) {
              const t = easeOut3((prog - 0.32) / 0.30);
              chestX = THREE.MathUtils.lerp(0.22, -0.34, t);
              chestY = THREE.MathUtils.lerp(-0.18, 0.22, t);
              bodyPosY = THREE.MathUtils.lerp(0.09, -0.06, t);
              rX = THREE.MathUtils.lerp(2.72, 0.68, t);
              rY = THREE.MathUtils.lerp(-0.12, 0.18, t);
              rZ = THREE.MathUtils.lerp(-0.16, -0.06, t);
              eRX = THREE.MathUtils.lerp(0.58, 0.16, t);
              lX = THREE.MathUtils.lerp(2.55, 0.72, t);
              lY = THREE.MathUtils.lerp(0.18, -0.10, t);
              lZ = THREE.MathUtils.lerp(0.22, 0.12, t);
              eLX = THREE.MathUtils.lerp(0.62, 0.30, t);
              bpX = THREE.MathUtils.lerp(0.32, 0.58, t);
              trailOp = Math.sin(t * Math.PI) * 0.68;
            } else {
              const t = easeInOut((prog - 0.62) / 0.38);
              chestX = THREE.MathUtils.lerp(-0.34, 0.0, t);
              chestY = THREE.MathUtils.lerp(0.22, 0.0, t);
              bodyPosY = THREE.MathUtils.lerp(-0.06, 0.0, t);
              rX = THREE.MathUtils.lerp(0.68, 0.30, t);
              rY = THREE.MathUtils.lerp(0.18, -0.14, t);
              rZ = THREE.MathUtils.lerp(-0.06, 0.22, t);
              eRX = THREE.MathUtils.lerp(0.16, 1.72, t);
              lX = THREE.MathUtils.lerp(0.72, 0.06, t);
              lY = THREE.MathUtils.lerp(-0.10, 0.0, t);
              lZ = THREE.MathUtils.lerp(0.12, 0.05, t);
              eLX = THREE.MathUtils.lerp(0.30, 0.18, t);
              bpX = THREE.MathUtils.lerp(0.58, 1.24, t);
            }
          }

          pMesh.body.position.set(0, bodyPosY, 0);
          pMesh.body.rotation.set(0, bodyY, 0);
          if (chest) chest.rotation.set(chestX, chestY, chestZ);
          if (head) head.rotation.set(-chestX * 0.5, -chestY * 0.72, 0);
          pMesh.armR.rotation.set(rX, rY, rZ);
          pMesh.armL.rotation.set(lX, lY, lZ);
          if (elbowR) elbowR.rotation.x = eRX;
          if (elbowL) elbowL.rotation.x = eLX;
          if (batPivot) { batPivot.rotation.x = bpX; batPivot.rotation.z = bpZ; }
          if (batTrailMat) batTrailMat.opacity = trailOp;
          // Athletic planted batting stance legs
          pMesh.legL.rotation.x = 0.28 * swing;
          pMesh.legR.rotation.x = -0.24 * swing;
          if (kneeL) kneeL.rotation.x = -0.26 * swing;
          if (kneeR) kneeR.rotation.x = -0.22 * swing;
          if (ankleL) ankleL.rotation.x = 0;
          if (ankleR) ankleR.rotation.x = 0;
        } else {
          // REWORKED AUTHENTIC GTA STREET-BRAWLER / BOXING 4-HIT FIST COMBO & CHAMBER-SNAP KICK!
          // (Zero stiff straight arms, zero goofy 360 helicopter spin — real hip/shoulder torque & opposite hand chin-guard!)
          let chestX = -0.06, chestY = 0, chestZ = 0, bodyY = 0, bodyPosY = 0;
          let lX = 0.84, lY = 0.14, lZ = 0.22, eLX = 1.56;
          let rX = 0.78, rY = -0.14, rZ = -0.22, eRX = 1.66;
          let legLX = 0.20, legRX = -0.22, kLX = -0.24, kRX = -0.24;

          if (ps.attackType === 'kick') {
            // Chamber -> Snap Front/Push Kick (Athletic lean back + high fists guard + crisp knee snap!)
            if (prog < 0.28) {
              const t = easeInOut(prog / 0.28);
              chestX = 0.10 * t; chestY = 0.22 * t;
              legRX = THREE.MathUtils.lerp(-0.18, 1.18, t);
              kRX = THREE.MathUtils.lerp(-0.22, -1.35, t);
              legLX = -0.10 * t; kLX = -0.18;
              lX = 0.92; eLX = 1.55; rX = 0.84; eRX = 1.62;
            } else if (prog < 0.58) {
              const t = easeOut3((prog - 0.28) / 0.30);
              chestX = THREE.MathUtils.lerp(0.10, 0.20, t);
              chestY = THREE.MathUtils.lerp(0.22, 0.36, t);
              legRX = THREE.MathUtils.lerp(1.18, 1.64, t);
              kRX = THREE.MathUtils.lerp(-1.35, -0.06, t);
              legLX = -0.14; kLX = -0.16;
              lX = 0.96; lZ = 0.28; eLX = 1.48;
              rX = 0.56; rZ = -0.32; eRX = 1.38;
            } else {
              const t = easeInOut((prog - 0.58) / 0.42);
              chestX = THREE.MathUtils.lerp(0.20, -0.06, t);
              chestY = THREE.MathUtils.lerp(0.36, -0.22, t);
              legRX = THREE.MathUtils.lerp(1.64, -0.20, t);
              kRX = THREE.MathUtils.lerp(-0.06, -0.22, t);
              legLX = THREE.MathUtils.lerp(-0.14, 0.18, t);
            }
          } else if (ps.attackCombo === 1) {
            // HIT 1: Snappy Lead Left Jab (Fast straight extension from chin guard, right fist glued to jaw!)
            if (prog < 0.24) {
              const t = easeInOut(prog / 0.24);
              chestY = THREE.MathUtils.lerp(-0.22, -0.10, t);
              lX = THREE.MathUtils.lerp(0.84, 0.96, t); eLX = THREE.MathUtils.lerp(1.56, 1.72, t);
            } else if (prog < 0.56) {
              const t = easeOut3((prog - 0.24) / 0.32);
              chestX = -0.12 * t;
              chestY = THREE.MathUtils.lerp(-0.10, -0.44, t);
              bodyY = -0.10 * t;
              lX = THREE.MathUtils.lerp(0.96, 1.62, t);
              lY = THREE.MathUtils.lerp(0.14, -0.10, t);
              lZ = THREE.MathUtils.lerp(0.22, -0.06, t);
              eLX = THREE.MathUtils.lerp(1.72, 0.08, t);
              rX = 0.82; rY = -0.18; rZ = -0.26; eRX = 1.72;
              legLX = 0.30 * t; legRX = -0.26 * t;
            } else {
              const t = easeInOut((prog - 0.56) / 0.44);
              chestX = THREE.MathUtils.lerp(-0.12, -0.06, t);
              chestY = THREE.MathUtils.lerp(-0.44, -0.22, t);
              bodyY = THREE.MathUtils.lerp(-0.10, 0, t);
              lX = THREE.MathUtils.lerp(1.62, 0.84, t);
              lY = THREE.MathUtils.lerp(-0.10, 0.14, t);
              lZ = THREE.MathUtils.lerp(-0.06, 0.22, t);
              eLX = THREE.MathUtils.lerp(0.08, 1.56, t);
            }
          } else if (ps.attackCombo === 2) {
            // HIT 2: Power Straight Right Cross (Full hip pivot + torso rotation + explosive right punch!)
            if (prog < 0.24) {
              const t = easeInOut(prog / 0.24);
              chestY = THREE.MathUtils.lerp(-0.22, -0.48, t);
              rX = THREE.MathUtils.lerp(0.78, 0.62, t);
              rZ = THREE.MathUtils.lerp(-0.22, -0.34, t);
              eRX = 1.76;
            } else if (prog < 0.58) {
              const t = easeOut3((prog - 0.24) / 0.34);
              chestX = THREE.MathUtils.lerp(-0.04, -0.16, t);
              chestY = THREE.MathUtils.lerp(-0.48, 0.58, t);
              bodyY = THREE.MathUtils.lerp(-0.10, 0.20, t);
              rX = THREE.MathUtils.lerp(0.62, 1.66, t);
              rY = THREE.MathUtils.lerp(-0.14, 0.14, t);
              rZ = THREE.MathUtils.lerp(-0.34, 0.04, t);
              eRX = THREE.MathUtils.lerp(1.76, 0.06, t);
              lX = 0.76; lY = 0.22; lZ = 0.28; eLX = 1.68;
              legLX = 0.34; legRX = -0.30; kLX = -0.28;
            } else {
              const t = easeInOut((prog - 0.58) / 0.42);
              chestX = THREE.MathUtils.lerp(-0.16, -0.06, t);
              chestY = THREE.MathUtils.lerp(0.58, -0.22, t);
              bodyY = THREE.MathUtils.lerp(0.20, 0, t);
              rX = THREE.MathUtils.lerp(1.66, 0.78, t);
              rY = THREE.MathUtils.lerp(0.14, -0.14, t);
              rZ = THREE.MathUtils.lerp(0.04, -0.22, t);
              eRX = THREE.MathUtils.lerp(0.06, 1.66, t);
            }
          } else if (ps.attackCombo === 3) {
            // HIT 3: Sweeping 90°-Elbow Left Hook (Classic horizontal boxing arc across target jaw!)
            if (prog < 0.28) {
              const t = easeInOut(prog / 0.28);
              chestY = THREE.MathUtils.lerp(-0.20, 0.38, t);
              bodyY = 0.14 * t;
              lX = THREE.MathUtils.lerp(0.84, 1.32, t);
              lY = THREE.MathUtils.lerp(0.14, 0.72, t);
              lZ = THREE.MathUtils.lerp(0.22, -0.52, t);
              eLX = THREE.MathUtils.lerp(1.56, 1.34, t);
            } else if (prog < 0.60) {
              const t = easeOut3((prog - 0.28) / 0.32);
              chestX = -0.10;
              chestY = THREE.MathUtils.lerp(0.38, -0.72, t);
              bodyY = THREE.MathUtils.lerp(0.14, -0.24, t);
              lX = 1.38;
              lY = THREE.MathUtils.lerp(0.72, -0.64, t);
              lZ = THREE.MathUtils.lerp(-0.52, -0.44, t);
              eLX = 1.32;
              rX = 0.80; rY = -0.16; rZ = -0.26; eRX = 1.72;
              legLX = 0.28; legRX = -0.28; kLX = -0.32;
            } else {
              const t = easeInOut((prog - 0.60) / 0.40);
              chestY = THREE.MathUtils.lerp(-0.72, -0.22, t);
              bodyY = THREE.MathUtils.lerp(-0.24, 0, t);
              lX = THREE.MathUtils.lerp(1.38, 0.84, t);
              lY = THREE.MathUtils.lerp(-0.64, 0.14, t);
              lZ = THREE.MathUtils.lerp(-0.44, 0.22, t);
              eLX = THREE.MathUtils.lerp(1.32, 1.56, t);
            }
          } else {
            // HIT 4: Heavy Rising Right Uppercut Finisher (Drop knees -> coiled drive straight through the chin!)
            if (prog < 0.30) {
              const t = easeInOut(prog / 0.30);
              bodyPosY = -0.11 * t;
              chestX = THREE.MathUtils.lerp(-0.06, -0.22, t);
              chestY = THREE.MathUtils.lerp(-0.22, -0.46, t);
              rX = THREE.MathUtils.lerp(0.78, 0.44, t);
              rZ = THREE.MathUtils.lerp(-0.22, -0.36, t);
              eRX = 1.52;
              kLX = -0.48 * t; kRX = -0.48 * t;
            } else if (prog < 0.62) {
              const t = easeOut3((prog - 0.30) / 0.32);
              bodyPosY = THREE.MathUtils.lerp(-0.11, 0.08, t);
              chestX = THREE.MathUtils.lerp(-0.22, 0.14, t);
              chestY = THREE.MathUtils.lerp(-0.46, 0.64, t);
              bodyY = THREE.MathUtils.lerp(-0.12, 0.22, t);
              rX = THREE.MathUtils.lerp(0.44, 2.08, t);
              rY = THREE.MathUtils.lerp(-0.14, 0.26, t);
              rZ = THREE.MathUtils.lerp(-0.36, 0.08, t);
              eRX = THREE.MathUtils.lerp(1.52, 0.96, t);
              lX = 0.68; lY = 0.24; lZ = 0.30; eLX = 1.66;
              kLX = THREE.MathUtils.lerp(-0.48, -0.12, t);
              kRX = THREE.MathUtils.lerp(-0.48, -0.12, t);
            } else {
              const t = easeInOut((prog - 0.62) / 0.38);
              bodyPosY = THREE.MathUtils.lerp(0.08, 0, t);
              chestX = THREE.MathUtils.lerp(0.14, -0.06, t);
              chestY = THREE.MathUtils.lerp(0.64, -0.22, t);
              bodyY = THREE.MathUtils.lerp(0.22, 0, t);
              rX = THREE.MathUtils.lerp(2.08, 0.78, t);
              rY = THREE.MathUtils.lerp(0.26, -0.14, t);
              rZ = THREE.MathUtils.lerp(0.08, -0.22, t);
              eRX = THREE.MathUtils.lerp(0.96, 1.66, t);
            }
          }

          pMesh.body.position.set(0, bodyPosY, 0);
          pMesh.body.rotation.set(0, bodyY, 0);
          if (chest) chest.rotation.set(chestX, chestY, chestZ);
          if (head) head.rotation.set(-chestX * 0.45, -chestY * 0.72, 0);
          pMesh.armL.rotation.set(lX, lY, lZ);
          pMesh.armR.rotation.set(rX, rY, rZ);
          if (elbowL) elbowL.rotation.x = eLX;
          if (elbowR) elbowR.rotation.x = eRX;
          pMesh.legL.rotation.x = legLX;
          pMesh.legR.rotation.x = legRX;
          if (kneeL) kneeL.rotation.x = kLX;
          if (kneeR) kneeR.rotation.x = kRX;
          if (ankleL) ankleL.rotation.x = 0;
          if (ankleR) ankleR.rotation.x = 0;
        }
      } else if (ps.parachuting) {
        // Parachute Skydiving Descent Pose (Hands gripping risers overhead, legs relaxed!)
        pMesh.body.position.y = THREE.MathUtils.damp(pMesh.body.position.y, 0, 10, dt);
        pMesh.body.rotation.set(0.08, 0, ps.turnLean * 0.6);
        if (chest) chest.rotation.set(-0.08, 0, 0);
        if (head) head.rotation.set(-0.12, 0, 0);
        pMesh.armL.rotation.set(2.38, 0.14, 0.24);
        pMesh.armR.rotation.set(2.38, -0.14, -0.24);
        if (elbowL) elbowL.rotation.x = 0.42;
        if (elbowR) elbowR.rotation.x = 0.42;
        pMesh.legL.rotation.x = 0.22 + Math.sin(elapsed * 2.4) * 0.08;
        pMesh.legR.rotation.x = -0.14 - Math.sin(elapsed * 2.4) * 0.08;
        if (kneeL) kneeL.rotation.x = -0.36;
        if (kneeR) kneeR.rotation.x = -0.28;
      } else if (!ps.grounded) {
        const airRise = THREE.MathUtils.clamp(ps.vy * 0.05, -0.35, 0.35);
        pMesh.body.rotation.x = THREE.MathUtils.damp(pMesh.body.rotation.x, 0, 10, dt);
        pMesh.body.rotation.y = THREE.MathUtils.damp(pMesh.body.rotation.y, 0, 10, dt);
        pMesh.body.rotation.z = THREE.MathUtils.damp(pMesh.body.rotation.z, 0, 10, dt);
        if (chest) {
          chest.rotation.x = THREE.MathUtils.damp(chest.rotation.x, -0.12 + airRise * 0.28, 10, dt);
          chest.rotation.y = THREE.MathUtils.damp(chest.rotation.y, 0, 10, dt);
          chest.rotation.z = THREE.MathUtils.damp(chest.rotation.z, 0, 10, dt);
        }
        if (head) {
          head.rotation.x = THREE.MathUtils.damp(head.rotation.x, 0.08, 10, dt);
          head.rotation.y = THREE.MathUtils.damp(head.rotation.y, 0, 10, dt);
        }
        pMesh.legL.rotation.x = THREE.MathUtils.damp(pMesh.legL.rotation.x, 0.48 + airRise * 0.4, 10, dt);
        pMesh.legR.rotation.x = THREE.MathUtils.damp(pMesh.legR.rotation.x, -0.34, 10, dt);
        if (kneeL) kneeL.rotation.x = THREE.MathUtils.damp(kneeL.rotation.x, -0.68, 12, dt);
        if (kneeR) kneeR.rotation.x = THREE.MathUtils.damp(kneeR.rotation.x, -0.46, 12, dt);
        if (ankleL) ankleL.rotation.x = THREE.MathUtils.damp(ankleL.rotation.x, -0.22, 10, dt);
        if (ankleR) ankleR.rotation.x = THREE.MathUtils.damp(ankleR.rotation.x, -0.28, 10, dt);
        pMesh.armL.rotation.x = THREE.MathUtils.damp(pMesh.armL.rotation.x, -0.45, 10, dt);
        pMesh.armL.rotation.y = THREE.MathUtils.damp(pMesh.armL.rotation.y, 0, 12, dt);
        pMesh.armR.rotation.x = THREE.MathUtils.damp(pMesh.armR.rotation.x, 0.56, 10, dt);
        pMesh.armR.rotation.y = THREE.MathUtils.damp(pMesh.armR.rotation.y, 0, 12, dt);
        if (elbowL) elbowL.rotation.x = THREE.MathUtils.damp(elbowL.rotation.x, 0.48, 10, dt);
        if (elbowR) elbowR.rotation.x = THREE.MathUtils.damp(elbowR.rotation.x, 0.48, 10, dt);
      } else {
        // Coordinated Biomechanical Human Gait (Protagonist faces -Z: +leg/arm forward, -knee back, -chest forward lean!)
        const strideBlend = THREE.MathUtils.clamp(moveSpeed / 4.0, 0, 1);
        const runBlend = THREE.MathUtils.clamp((moveSpeed - 4.2) / 4.2, 0, 1);
        const sw = Math.sin(ps.walkPhase);
        const hipAmp = (0.46 + runBlend * 0.36) * strideBlend;
        const armAmp = (0.40 + runBlend * 0.44) * strideBlend;

        // Anatomically timed knee flexion: bends cleanly during swing clearance, straightens cleanly at heel strike!
        const kneeBendL = Math.max(0, Math.cos(ps.walkPhase + 0.25)) * (0.62 + runBlend * 0.50) * strideBlend + ps.landSquash * 1.05;
        const kneeBendR = Math.max(0, Math.cos(ps.walkPhase + Math.PI + 0.25)) * (0.62 + runBlend * 0.50) * strideBlend + ps.landSquash * 1.05;

        // Heel-to-toe ankle pitch (dorsiflex +0.20 at heel strike, plantarflex -0.26 at toe-off!)
        const ankleTargetL = (Math.max(0, sw) * 0.20 - Math.max(0, -sw) * (0.24 + runBlend * 0.14)) * strideBlend;
        const ankleTargetR = (Math.max(0, -sw) * 0.20 - Math.max(0, sw) * (0.24 + runBlend * 0.14)) * strideBlend;

        // Natural breathing, weight shift & occasional relaxed idle glance
        const breath = Math.sin(elapsed * 2.15);
        const idleShift = Math.sin(elapsed * 0.95) * 0.022 * (1 - strideBlend);
        const idleGlance = Math.sin(elapsed * 0.55) * 0.16 * (1 - strideBlend);

        // Double-frequency pelvic vertical bob (lowest at full stride, highest at mid-stance)
        const bobY = (Math.abs(Math.cos(ps.walkPhase)) * (0.038 + runBlend * 0.048) * strideBlend)
          + breath * 0.010 * (1 - strideBlend) - ps.landSquash * 0.20;

        pMesh.legL.rotation.x = THREE.MathUtils.damp(pMesh.legL.rotation.x, sw * hipAmp + ps.landSquash * 0.45, 16, dt);
        pMesh.legR.rotation.x = THREE.MathUtils.damp(pMesh.legR.rotation.x, -sw * hipAmp + ps.landSquash * 0.45, 16, dt);
        if (kneeL) kneeL.rotation.x = THREE.MathUtils.damp(kneeL.rotation.x, -kneeBendL, 18, dt);
        if (kneeR) kneeR.rotation.x = THREE.MathUtils.damp(kneeR.rotation.x, -kneeBendR, 18, dt);
        if (ankleL) ankleL.rotation.x = THREE.MathUtils.damp(ankleL.rotation.x, ankleTargetL, 16, dt);
        if (ankleR) ankleR.rotation.x = THREE.MathUtils.damp(ankleR.rotation.x, ankleTargetR, 16, dt);

        // Contra-lateral arm swing (Left arm swings back when Left leg steps forward)
        pMesh.armL.rotation.x = THREE.MathUtils.damp(pMesh.armL.rotation.x, -sw * armAmp + (0.03 + breath * 0.022) * (1 - strideBlend), 14, dt);
        pMesh.armL.rotation.y = THREE.MathUtils.damp(pMesh.armL.rotation.y, 0, 14, dt);
        pMesh.armR.rotation.x = THREE.MathUtils.damp(pMesh.armR.rotation.x, sw * armAmp + (0.03 - breath * 0.022) * (1 - strideBlend), 14, dt);
        pMesh.armR.rotation.y = THREE.MathUtils.damp(pMesh.armR.rotation.y, 0, 14, dt);
        pMesh.armL.rotation.z = THREE.MathUtils.damp(pMesh.armL.rotation.z, -0.05 - runBlend * 0.05, 12, dt);
        pMesh.armR.rotation.z = THREE.MathUtils.damp(pMesh.armR.rotation.z, 0.05 + runBlend * 0.05, 12, dt);

        // Natural forward elbow curve (+X bends forearm forward toward -Z!)
        const elbLTarget = 0.14 + (0.16 + Math.max(0, -sw) * (0.42 + runBlend * 0.42)) * strideBlend;
        const elbRTarget = 0.14 + (0.16 + Math.max(0, sw) * (0.42 + runBlend * 0.42)) * strideBlend;
        if (elbowL) elbowL.rotation.x = THREE.MathUtils.damp(elbowL.rotation.x, elbLTarget, 16, dt);
        if (elbowR) elbowR.rotation.x = THREE.MathUtils.damp(elbowR.rotation.x, elbRTarget, 16, dt);

        // Pelvis bob & subtle hip twist
        pMesh.body.position.y = THREE.MathUtils.damp(pMesh.body.position.y, bobY, 16, dt);
        pMesh.body.rotation.x = THREE.MathUtils.damp(pMesh.body.rotation.x, 0, 12, dt);
        pMesh.body.rotation.y = THREE.MathUtils.damp(pMesh.body.rotation.y, sw * (0.06 + runBlend * 0.04) * strideBlend, 14, dt);
        pMesh.body.rotation.z = THREE.MathUtils.damp(pMesh.body.rotation.z, ps.turnLean * 0.65 + idleShift + sw * 0.024 * strideBlend, 12, dt);

        // Waist-pivoted spine/chest: CORRECTED forward lean (-X toward -Z!) + counter-rotation against hips!
        const chestLeanX = -((0.04 + runBlend * 0.16) * strideBlend + ps.landSquash * 0.18 + breath * 0.015 * (1 - strideBlend));
        const chestTwistY = -sw * (0.11 + runBlend * 0.08) * strideBlend;
        if (chest) {
          chest.rotation.x = THREE.MathUtils.damp(chest.rotation.x, chestLeanX, 12, dt);
          chest.rotation.y = THREE.MathUtils.damp(chest.rotation.y, chestTwistY, 14, dt);
          chest.rotation.z = THREE.MathUtils.damp(chest.rotation.z, ps.turnLean * 0.45 - sw * 0.018 * strideBlend, 12, dt);
        }
        // Head gaze stabilization (stays level & looks slightly into turns!)
        if (head) {
          head.rotation.x = THREE.MathUtils.damp(head.rotation.x, -chestLeanX * 0.55, 12, dt);
          head.rotation.y = THREE.MathUtils.damp(head.rotation.y, -chestTwistY * 0.65 + ps.turnLean * 1.1 + idleGlance, 10, dt);
          head.rotation.z = THREE.MathUtils.damp(head.rotation.z, -ps.turnLean * 0.35, 10, dt);
        }
      }

      // Override upper-body aim/carry stance when equipping Firearms or Vice Baseball Bat!
      if (isFirearm && ps.attackTimer <= 0) {
        const recoil = this.fireCooldown > 0 ? Math.min(0.26, this.fireCooldown * 0.9) : 0;
        const aimPitch = THREE.MathUtils.clamp(-this.orbitPitchOffset * 0.55, -0.4, 0.4);
        if (chest) chest.rotation.y = THREE.MathUtils.damp(chest.rotation.y, 0.18, 14, dt);
        if (head) head.rotation.y = THREE.MathUtils.damp(head.rotation.y, -0.14, 14, dt);
        pMesh.armR.rotation.x = 1.50 + aimPitch + recoil;
        pMesh.armR.rotation.y = 0;
        pMesh.armR.rotation.z = 0.02;
        if (elbowR) elbowR.rotation.x = 0.08;
        if (this.weapon === 'rifle' || this.weapon === 'shotgun' || this.weapon === 'bazooka') {
          pMesh.armL.rotation.x = 1.20 + aimPitch + recoil * 0.6;
          pMesh.armL.rotation.y = 0;
          pMesh.armL.rotation.z = 0.22;
          if (elbowL) elbowL.rotation.x = 0.44;
        }
      } else if (this.weapon === 'bat' && ps.attackTimer <= 0) {
        // AUTHENTIC GTA VICE CITY BAT STANCES:
        // Idle -> Classic Shoulder-Rest Ready Stance (angled up over right shoulder with subtle breathing sway!)
        // Walk/Sprint -> Relaxed Diagonal Right-Side Athletic Carry (angled cleanly down-forward, clear of legs!)
        const moveMix = THREE.MathUtils.clamp((moveSpeed - 0.35) / 2.2, 0, 1);
        const breathSway = Math.sin(elapsed * 2.15) * 0.035 * (1 - moveMix);
        const swCarry = Math.sin(ps.walkPhase) * 0.24 * moveMix;

        const targetArmRX = THREE.MathUtils.lerp(0.26 + breathSway, -0.08 + swCarry, moveMix);
        const targetArmRY = THREE.MathUtils.lerp(-0.18, -0.04, moveMix);
        const targetArmRZ = THREE.MathUtils.lerp(0.22, 0.18, moveMix);
        const targetElbRX = THREE.MathUtils.lerp(1.82 + breathSway * 0.6, 0.42, moveMix);
        const targetBatX  = THREE.MathUtils.lerp(1.30, 0.56, moveMix);
        const targetBatZ  = THREE.MathUtils.lerp(-0.18, 0.08, moveMix);

        pMesh.armR.rotation.x = THREE.MathUtils.damp(pMesh.armR.rotation.x, targetArmRX, 12, dt);
        pMesh.armR.rotation.y = THREE.MathUtils.damp(pMesh.armR.rotation.y, targetArmRY, 12, dt);
        pMesh.armR.rotation.z = THREE.MathUtils.damp(pMesh.armR.rotation.z, targetArmRZ, 12, dt);
        if (elbowR) elbowR.rotation.x = THREE.MathUtils.damp(elbowR.rotation.x, targetElbRX, 12, dt);
        if (batPivot) {
          batPivot.rotation.x = THREE.MathUtils.damp(batPivot.rotation.x, targetBatX, 12, dt);
          batPivot.rotation.z = THREE.MathUtils.damp(batPivot.rotation.z, targetBatZ, 12, dt);
        }
        // Subtle confident Vice City side-angled shoulder turn while resting bat on shoulder
        if (chest && moveMix < 0.5) {
          chest.rotation.y = THREE.MathUtils.damp(chest.rotation.y, -0.18 * (1 - moveMix), 8, dt);
        }
      } else if (this.weapon === 'fists' && ps.attackTimer <= 0 && ps.combatGuardTimer > 0 && ps.grounded) {
        // AUTHENTIC BOXER'S GUARD STANCE (Elbows tucked, fists shielding chin, rhythmic boxer bob!)
        const gBob = Math.sin(elapsed * 5.2) * 0.032;
        if (chest) {
          chest.rotation.x = THREE.MathUtils.damp(chest.rotation.x, -0.09, 12, dt);
          chest.rotation.y = THREE.MathUtils.damp(chest.rotation.y, -0.24, 12, dt);
        }
        if (head) head.rotation.y = THREE.MathUtils.damp(head.rotation.y, 0.20, 12, dt);
        pMesh.armL.rotation.x = THREE.MathUtils.damp(pMesh.armL.rotation.x, 0.88 + gBob * 1.4, 14, dt);
        pMesh.armL.rotation.y = THREE.MathUtils.damp(pMesh.armL.rotation.y, 0.16, 14, dt);
        pMesh.armL.rotation.z = THREE.MathUtils.damp(pMesh.armL.rotation.z, 0.22, 14, dt);
        if (elbowL) elbowL.rotation.x = THREE.MathUtils.damp(elbowL.rotation.x, 1.54, 14, dt);
        pMesh.armR.rotation.x = THREE.MathUtils.damp(pMesh.armR.rotation.x, 0.80 - gBob * 1.4, 14, dt);
        pMesh.armR.rotation.y = THREE.MathUtils.damp(pMesh.armR.rotation.y, -0.16, 14, dt);
        pMesh.armR.rotation.z = THREE.MathUtils.damp(pMesh.armR.rotation.z, -0.22, 14, dt);
        if (elbowR) elbowR.rotation.x = THREE.MathUtils.damp(elbowR.rotation.x, 1.66, 14, dt);
      }

      pMesh.root.position.set(ps.x, ps.y, ps.z);
      pMesh.root.rotation.y = ps.yaw;

      // Dynamic GTA 5 Prompt: Ride Pier Attraction [E] | Talk to NPC [E] | Start Mini-Game [E] | Enter/Fly Vehicle [F] | Walk Inside!
      const nearRide = this.findNearestPierRide(8.5);
      const nearNpc = this.findNearestTalkableNpc(4.6);
      const nearPad = this.findNearestMiniGamePad(6.5);
      const nearTarget = this.findNearestVehicleTarget(6.5);
      this.nearbyVehicleTarget = nearTarget;
      const uiFree = this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.activeDialogue;
      if (uiFree && nearRide) {
        this.el.carPrompt.textContent = `Press E · Ride ${nearRide.label}`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && nearPad) {
        this.el.carPrompt.textContent = `Press E · Start ${nearPad.label}`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && nearNpc) {
        this.el.carPrompt.textContent = `Press E · Talk to ${nearNpc.name} (${nearNpc.role})`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && nearTarget) {
        this.el.carPrompt.textContent = nearTarget.kind === 'plane'
          ? `Press F · Fly ${nearTarget.label}`
          : (nearTarget.kind === 'traffic'
            ? `Press F · Steal ${nearTarget.label}`
            : `Press F · Enter ${nearTarget.label}`);
        this.el.carPrompt.classList.add('on');
      } else {
        let nearDoor = null;
        if (this.enterableBuildings) {
          for (let i = 0; i < this.enterableBuildings.length; i++) {
            const eb = this.enterableBuildings[i];
            if (Math.hypot(ps.x - eb.doorX, ps.z - eb.doorZ) < 5.2) { nearDoor = eb; break; }
          }
        }
        if (nearDoor && uiFree) {
          this.el.carPrompt.textContent = `Walk Inside · ${nearDoor.label}`;
          this.el.carPrompt.classList.add('on');
        } else {
          this.el.carPrompt.classList.remove('on');
        }
      }
    } else {
      this.el.carPrompt.classList.remove('on');
    }

    // 2c. Active Weapon Tracers, Flying RPG Bazooka Rockets & Fireball Explosions
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.life -= dt;
      if (tr.life <= 0) {
        this.scene.remove(tr.mesh);
        tr.geo.dispose();
        tr.mat.dispose();
        this.tracers.splice(i, 1);
      } else {
        tr.mat.opacity = tr.life / tr.maxLife;
      }
    }

    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.life -= dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.z += r.vz * dt;
      r.mesh.position.set(r.x, r.y, r.z);
      // White smoke + orange spark exhaust trail
      this.spawnParticle(r.x, r.y, r.z, (Math.random() - 0.5) * 1.5, 0.5, (Math.random() - 0.5) * 1.5, 0xe8e4f0, 0.44, 0.42, 1.3, 0);

      let detonate = r.life <= 0 || r.y <= 0.25 || this.isPointBlocked(r.x, r.z, 0.45);
      if (!detonate) {
        for (let pi = 0; pi < this.pedestrians.length; pi++) {
          const p = this.pedestrians[pi];
          if (p.state !== 'squished' && p.state !== 'ragdoll' && Math.hypot(p.x - r.x, p.z - r.z) < 1.35 && Math.abs(r.y - (p.y + 1.0)) < 1.4) {
            detonate = true; break;
          }
        }
      }
      if (!detonate) {
        for (let ti = 0; ti < this.traffic.length; ti++) {
          const tc = this.traffic[ti];
          if (tc.visible && Math.hypot(tc.position.x - r.x, tc.position.z - r.z) < 2.35 && r.y < 2.5) {
            detonate = true; break;
          }
        }
      }
      if (!detonate) {
        for (let pi = 0; pi < this.parkedVehicles.length; pi++) {
          const pv = this.parkedVehicles[pi];
          if (pv.mesh && pv.mesh.visible && Math.hypot(pv.x - r.x, pv.z - r.z) < 2.35 && r.y < 2.5) {
            detonate = true; break;
          }
        }
      }
      if (detonate) {
        this.scene.remove(r.mesh);
        this.rockets.splice(i, 1);
        this.triggerExplosion(r.x, Math.max(0.4, r.y), r.z, 1.15);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.life -= dt;
      if (ex.life <= 0) {
        this.scene.remove(ex.grp);
        ex.geos.forEach((g) => g.dispose());
        ex.coreMat.dispose(); ex.innerMat.dispose(); ex.ringMat.dispose();
        if (ex.smokeMat) ex.smokeMat.dispose();
        this.explosions.splice(i, 1);
      } else {
        const p = 1 - ex.life / ex.maxLife;
        const sc = ex.scale || 1.0;
        const flashFade = Math.max(0, 1 - p * 2.1);
        const sCore = 1.0 + p * 2.4 * sc;
        const sRing = 1.0 + p * 11.5 * sc;
        ex.core.scale.setScalar(sCore);
        ex.inner.scale.setScalar(1.0 + p * 1.8 * sc);
        ex.ring.scale.set(sRing, sRing, 1);
        ex.coreMat.opacity = flashFade * 0.85;
        ex.innerMat.opacity = Math.max(0, 1 - p * 2.8) * 0.96;
        ex.ringMat.opacity = (1 - p) * 0.78;
        if (ex.light) ex.light.intensity = 24 * sc * (1 - p) * (1 - p);
      }
    }

    // 2d. Flying 3D Spinning Vehicle Explosion Debris (gravity, asphalt bounce & smoke trails!)
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt;
      if (d.life <= 0) {
        this.scene.remove(d.mesh);
        d.geo.dispose();
        d.mat.dispose();
        this.debris.splice(i, 1);
        continue;
      }
      d.vy -= 22.0 * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.rotation.x += d.rx * dt;
      d.mesh.rotation.y += d.ry * dt;
      d.mesh.rotation.z += d.rz * dt;
      if (d.mesh.position.y < 0.14) {
        d.mesh.position.y = 0.14;
        if (Math.abs(d.vy) > 2.0) {
          d.vy = -d.vy * 0.42;
          d.vx *= 0.68;
          d.vz *= 0.68;
          d.rx *= 0.7; d.ry *= 0.7; d.rz *= 0.7;
        } else {
          d.vy = 0;
          d.vx *= Math.pow(0.06, dt);
          d.vz *= Math.pow(0.06, dt);
          d.rx *= 0.8; d.ry *= 0.8; d.rz *= 0.8;
        }
      }
      if (d.smoking && d.life > 1.2 && Math.random() < 0.25) {
        this.spawnParticle(d.mesh.position.x, d.mesh.position.y, d.mesh.position.z, 0, 1.2, 0, 0x262030, 0.42, 0.45, 0.9, -0.5);
      }
    }

    // 3. Solid Traffic Cars (TRUE SOLID COLLISION, ENGINE FIRE, AIRBORNE EXPLOSION WRECKS & RESPAWN!)
    const fwdX = -Math.sin(cs.yaw), fwdZ = -Math.cos(cs.yaw);
    for (let i = 0; i < this.traffic.length; i++) {
      const tc = this.traffic[i];
      const u = tc.userData;

      if (u.vehState === 'wrecked') {
        // Airborne flip/bounce physics -> smoking charred wreck -> clean respawn down avenue
        u.wreckTimer -= dt;
        if (tc.position.y > 0.01 || Math.abs(u.vy) > 0.15) {
          u.vy -= 22.0 * dt;
          tc.position.x += u.vx * dt;
          tc.position.y += u.vy * dt;
          tc.position.z += u.vz * dt;
          tc.rotation.x += u.spinX * dt;
          tc.rotation.z += u.spinZ * dt;
          if (tc.position.y <= 0.12) {
            tc.position.y = 0.12;
            if (Math.abs(u.vy) > 2.4) {
              u.vy = -u.vy * 0.34;
              u.vx *= 0.55; u.vz *= 0.55;
              u.spinX *= 0.5; u.spinZ *= 0.5;
              this.audio.impact(0.5);
            } else {
              u.vy = 0; u.vx = 0; u.vz = 0; u.spinX = 0; u.spinZ = 0;
            }
          }
        }
        // Billowing black wreck smoke & embers while burning out
        u.fireTick = (u.fireTick || 0) - dt;
        if (u.fireTick <= 0 && tc.visible) {
          u.fireTick = 0.14;
          const hot = u.wreckTimer > 11.0;
          this.spawnParticle(
            tc.position.x + (Math.random() - 0.5) * 1.1, tc.position.y + 0.85, tc.position.z + (Math.random() - 0.5) * 1.1,
            (Math.random() - 0.5) * 1.2, 2.8 + Math.random() * 1.6, (Math.random() - 0.5) * 1.2,
            hot && Math.random() < 0.42 ? 0xff6e1a : 0x1d1926, hot ? 1.15 : 1.35, 1.1, 2.1, -1.0
          );
        }
        if (u.wreckTimer <= 0) {
          // Clean respawn back onto original lane away from player
          u.vehState = 'ok';
          u.hp = u.maxHp || 100;
          u.vx = 0; u.vy = 0; u.vz = 0; u.spinX = 0; u.spinZ = 0; u.stun = 0;
          tc.position.set(u.origX, 0, u.origZ);
          tc.rotation.set(0, u.origYaw || 0, 0);
          if (u.carRig) {
            if (u.carRig.paintMat) {
              u.carRig.paintMat.color.setHex(u.carRig.baseColor || u.colorHex || 0xf4c430);
              u.carRig.paintMat.clearcoat = 0.88;
              u.carRig.paintMat.roughness = 0.22;
              u.carRig.paintMat.metalness = 0.65;
            }
            if (u.carRig.headLensMat) u.carRig.headLensMat.emissiveIntensity = 1.4;
            if (u.carRig.tailMat) u.carRig.tailMat.emissiveIntensity = 1.1;
            if (u.carRig.driverMesh) u.carRig.driverMesh.visible = true;
            if (u.carRig.driverDoorPivot) u.carRig.driverDoorPivot.rotation.y = 0;
            if (u.carRig.bodyGroup) u.carRig.bodyGroup.rotation.set(0, 0, 0);
          }
        }
      } else if (u.vehState === 'burning') {
        // Engine engulfed in roaring flames -> automatic fuse detonation!
        u.burnTimer -= dt;
        tc.position.x += u.vx * dt;
        tc.position.z += u.vz * dt;
        u.vx *= Math.pow(0.06, dt);
        u.vz *= Math.pow(0.06, dt);
        u.fireTick = (u.fireTick || 0) - dt;
        if (u.fireTick <= 0 && tc.visible) {
          u.fireTick = 0.065;
          const fx = -Math.sin(tc.rotation.y), fz = -Math.cos(tc.rotation.y);
          const hx = tc.position.x + fx * 1.48, hz = tc.position.z + fz * 1.48;
          this.spawnParticle(
            hx + (Math.random() - 0.5) * 0.65, 1.05, hz + (Math.random() - 0.5) * 0.65,
            (Math.random() - 0.5) * 1.5, 3.8 + Math.random() * 2.2, (Math.random() - 0.5) * 1.5,
            Math.random() < 0.55 ? 0xff6e1a : 0xffd36b, 0.95, 0.45, 1.4, -0.6
          );
          this.spawnParticle(
            hx + (Math.random() - 0.5) * 0.7, 1.35, hz + (Math.random() - 0.5) * 0.7,
            (Math.random() - 0.5) * 1.2, 3.2, (Math.random() - 0.5) * 1.2,
            0x201c28, 1.15, 0.95, 2.0, -1.0
          );
        }
        if (u.burnTimer <= 0) {
          this.detonateVehicle(tc, 'ENGINE FIRE');
        }
      } else if (u.stun > 0) {
        u.stun = Math.max(0, u.stun - dt);
        tc.position.x += u.vx * dt;
        tc.position.z += u.vz * dt;
        u.vx *= Math.pow(0.08, dt);
        u.vz *= Math.pow(0.08, dt);
        if (u.carRig && u.carRig.bodyGroup) {
          u.carRig.bodyGroup.rotation.z = THREE.MathUtils.damp(u.carRig.bodyGroup.rotation.z, 0, 8, dt);
        }
      } else {
        tc.position.z += u.baseSpeed * dt;
        if (tc.position.z > 358) tc.position.z = -1112;
        if (tc.position.z < -1116) tc.position.z = 352;
        if (u.carRig && u.carRig.wheelSpinGroups) {
          u.wheelSpin = (u.wheelSpin || 0) - Math.abs(u.baseSpeed) * dt * 2.5;
          for (let w = 0; w < u.carRig.wheelSpinGroups.length; w++) u.carRig.wheelSpinGroups[w].rotation.x = u.wheelSpin;
        }
        // Subtle damaged hood smoke if injured below 65% HP
        if (u.hp < (u.maxHp || 100) * 0.65 && tc.visible && Math.random() < 0.16) {
          const fx = -Math.sin(tc.rotation.y), fz = -Math.cos(tc.rotation.y);
          this.spawnParticle(tc.position.x + fx * 1.45, 1.05, tc.position.z + fz * 1.45, 0, 2.4, 0, 0xcac8d4, 0.72, 0.65, 1.4, -0.5);
        }
      }

      const tdxAct = tc.position.x - act.x, tdzAct = tc.position.z - act.z;
      const tVis = (tdxAct * tdxAct + tdzAct * tdzAct) < 48400; // 220m visibility culling
      if (tc.visible !== tVis) tc.visible = tVis;

      const tdx = tc.position.x - cs.x, tdz = tc.position.z - cs.z;
      if (tdx * tdx + tdz * tdz > 100) continue; // Skip 3-point car collision when >10m away

      // 3-point hull vs traffic AABB push-out
      const tMinX = tc.position.x - 1.02, tMaxX = tc.position.x + 1.02;
      const tMinZ = tc.position.z - 2.25, tMaxZ = tc.position.z + 2.25;
      for (const off of [1.4, 0, -1.4]) {
        const px = cs.x + fwdX * off, pz = cs.z + fwdZ * off;
        const cx = THREE.MathUtils.clamp(px, tMinX, tMaxX);
        const cz = THREE.MathUtils.clamp(pz, tMinZ, tMaxZ);
        const dx = px - cx, dz = pz - cz;
        const dSq = dx * dx + dz * dz;
        if (dSq < 1.06 * 1.06 && dSq > 0.00001) {
          const d = Math.sqrt(dSq);
          const push = 1.06 - d;
          const nx = dx / d, nz = dz / d;
          cs.x += nx * push * 0.72;
          cs.z += nz * push * 0.72;
          tc.position.x -= nx * push * 0.28;
          tc.position.z -= nz * push * 0.28;
          if (u.vehState !== 'wrecked') {
            u.stun = 1.6;
            u.vx = -nx * Math.min(Math.abs(cs.speed) * 0.35, 10);
            u.vz = -nz * Math.min(Math.abs(cs.speed) * 0.35, 10);
          }
          if (this.impactCooldown <= 0) {
            this.impactCooldown = 0.26;
            this.camShake = 0.30;
            this.audio.impact(0.8);
            for (let k = 0; k < 6; k++) {
              this.spawnParticle(cx, 0.6, cz, (Math.random() - 0.5) * 7, 2.5 + Math.random() * 3, (Math.random() - 0.5) * 7, 0xffaa38, 0.4, 0.45, 0.2, 9.8);
            }
          }
          cs.speed *= -0.18;
        }
      }
    }

    // 4. Solid World Collisions (Buildings, Showrooms, Palms, Poles, Rails, Seawall)
    this.resolveWorldCollisions();

    // 5. GTA Pedestrians (Walking, Crossing, Panic, Melee Stagger, Direct Run-Over Squish & Ragdoll Flight!)
    const rightX = Math.cos(cs.yaw), rightZ = -Math.sin(cs.yaw);
    const carAbsSpd = Math.abs(cs.speed);

    for (let i = 0; i < this.pedestrians.length; i++) {
      const ped = this.pedestrians[i];

      if (ped.state === 'ragdoll') {
        ped.root.visible = true;
        ped.stateTimer -= dt;
        ped.vy -= 20.0 * dt;
        ped.x += ped.vx * dt;
        ped.z += ped.vz * dt;
        ped.root.position.y += ped.vy * dt;
        ped.body.rotation.x += ped.spinX * dt;
        ped.body.rotation.z += ped.spinZ * dt;
        if (ped.root.position.y <= ped.y) {
          ped.root.position.y = ped.y;
          if (Math.abs(ped.vy) > 2.8) {
            ped.vy = -ped.vy * 0.34;
            ped.vx *= 0.55; ped.vz *= 0.55;
            ped.spinX *= 0.5; ped.spinZ *= 0.5;
          } else {
            ped.state = 'squished';
            ped.body.scale.set(1.38, 0.10, 1.38);
            ped.body.rotation.set(Math.PI / 2, 0, Math.random() * 3.14);
            ped.body.position.set(0, 0.08, 0);
            ped.splat.visible = true;
            ped.stars.visible = true;
          }
        }
        ped.root.position.x = ped.x;
        ped.root.position.z = ped.z;
        continue;
      }

      if (ped.state === 'squished') {
        ped.stateTimer -= dt;
        if (ped.root.visible) ped.stars.rotation.y += dt * 4.5;
        if (ped.stateTimer <= 0) {
          ped.state = 'walk';
          ped.hp = 3;
          ped.x = ped.homeX; ped.z = ped.homeZ;
          ped.root.position.set(ped.x, ped.y, ped.z);
          ped.body.scale.set(1, 1, 1);
          ped.body.rotation.set(0, 0, 0);
          ped.body.position.set(0, 0, 0);
          ped.armL.rotation.set(0, 0, 0); ped.armR.rotation.set(0, 0, 0);
          ped.legL.rotation.set(0, 0, 0); ped.legR.rotation.set(0, 0, 0);
          ped.splat.visible = false;
          ped.stars.visible = false;
        }
        continue;
      }

      if (ped.state === 'stagger') {
        ped.root.visible = true;
        ped.stateTimer -= dt;
        ped.x = THREE.MathUtils.clamp(ped.x + ped.vx * dt, -492, 198);
        ped.z = THREE.MathUtils.clamp(ped.z + ped.vz * dt, -1470, 355);
        ped.vx *= Math.pow(0.05, dt);
        ped.vz *= Math.pow(0.05, dt);
        ped.body.rotation.x = -0.30;
        ped.armL.rotation.x = -0.78;
        ped.armR.rotation.x = -0.62;
        ped.armL.rotation.z = -0.56;
        ped.armR.rotation.z = 0.56;
        ped.legL.rotation.x = 0.28;
        ped.legR.rotation.x = -0.24;
        ped.root.position.set(ped.x, ped.y, ped.z);
        if (ped.stateTimer <= 0) {
          ped.body.rotation.x = 0;
          ped.armL.rotation.set(0, 0, 0);
          ped.armR.rotation.set(0, 0, 0);
          if (ped.willFightBack) {
            ped.willFightBack = false;
            ped.state = 'fight';
            ped.stateTimer = 18.0;
            ped.attackCooldown = 0.42;
          } else {
            ped.state = 'panic';
            ped.stateTimer = 4.5;
          }
        }
        continue;
      }

      if (ped.state === 'talk') {
        ped.root.visible = true;
        const toPlayerYaw = Math.atan2(ps.x - ped.x, ps.z - ped.z);
        let dY = toPlayerYaw - (ped.curYaw || 0);
        while (dY > Math.PI) dY -= Math.PI * 2;
        while (dY < -Math.PI) dY += Math.PI * 2;
        ped.curYaw = (ped.curYaw || 0) + dY * Math.min(1, dt * 8.0);
        ped.root.rotation.y = ped.curYaw;
        ped.root.position.set(ped.x, ped.y, ped.z);
        const talkGest = Math.sin(elapsed * 5.2 + ped.phase);
        ped.armR.rotation.set(-0.55 + talkGest * 0.22, 0, 0.14);
        ped.armL.rotation.set(-0.28 - talkGest * 0.12, 0, -0.10);
        if (ped.armR.userData && ped.armR.userData.elbow) ped.armR.userData.elbow.rotation.x = -0.85;
        if (ped.headGroup) ped.headGroup.rotation.x = Math.sin(elapsed * 3.8) * 0.08;
        continue;
      }

      if (ped.state === 'fight') {
        ped.root.visible = true;
        ped.stateTimer -= dt;
        const toPx = ps.x - ped.x, toPz = ps.z - ped.z;
        const distP = Math.hypot(toPx, toPz) || 0.01;
        if (!isFoot || distP > 26 || ped.stateTimer <= 0 || this.wastedTimer > 0) {
          ped.state = 'walk';
          ped.attackTimer = 0;
          continue;
        }
        const faceYaw = Math.atan2(toPx, toPz);
        let dY = faceYaw - (ped.curYaw || 0);
        while (dY > Math.PI) dY -= Math.PI * 2;
        while (dY < -Math.PI) dY += Math.PI * 2;
        ped.curYaw = (ped.curYaw || 0) + dY * Math.min(1, dt * 11.5);
        ped.root.rotation.y = ped.curYaw;

        const pElbowL = ped.armL.userData && ped.armL.userData.elbow;
        const pElbowR = ped.armR.userData && ped.armR.userData.elbow;
        if (ped.attackCooldown > 0) ped.attackCooldown = Math.max(0, ped.attackCooldown - dt);

        if (distP > 1.85 && ped.attackTimer <= 0) {
          const chaseSpd = 4.2;
          ped.x = THREE.MathUtils.clamp(ped.x + (toPx / distP) * chaseSpd * dt, -492, 198);
          ped.z = THREE.MathUtils.clamp(ped.z + (toPz / distP) * chaseSpd * dt, -1470, 355);
          ped.y = getTerrainHeight(ped.x, ped.z);
          ped.walkPhase = (ped.walkPhase || 0) + dt * chaseSpd * 2.1;
          const sw = Math.sin(ped.walkPhase);
          ped.legL.rotation.x = -sw * 0.58;
          ped.legR.rotation.x = sw * 0.58;
          ped.body.position.y = Math.abs(Math.cos(ped.walkPhase)) * 0.05;
        } else {
          ped.legL.rotation.x = THREE.MathUtils.damp(ped.legL.rotation.x, -0.22, 10, dt);
          ped.legR.rotation.x = THREE.MathUtils.damp(ped.legR.rotation.x, 0.22, 10, dt);
          if (ped.attackTimer <= 0 && ped.attackCooldown <= 0 && distP <= 2.25) {
            ped.attackTimer = 0.46;
            ped.attackCooldown = 1.05 + Math.random() * 0.45;
            ped.hitDealt = false;
            ped.punchSide = (ped.punchSide || 0) ^ 1;
            this.audio.punch();
          }
        }

        if (ped.attackTimer > 0) {
          ped.attackTimer = Math.max(0, ped.attackTimer - dt);
          const prog = 1 - ped.attackTimer / 0.46;
          const punchArc = Math.sin(prog * Math.PI);
          if (!ped.hitDealt && prog > 0.42 && distP <= 2.35) {
            ped.hitDealt = true;
            this.damagePlayer(12, ped);
          }
          // Animated Boxing Jab / Cross Strike (Pedestrians face +Z -> -X shoulder extends arm forward!)
          if (ped.punchSide === 0) {
            ped.armR.rotation.set(-0.95 - punchArc * 0.85, 0, 0.14);
            if (pElbowR) pElbowR.rotation.x = -1.45 * (1 - punchArc * 0.85);
            ped.armL.rotation.set(-0.95, 0, -0.18);
            if (pElbowL) pElbowL.rotation.x = -1.55;
            if (ped.chest) ped.chest.rotation.y = -punchArc * 0.48;
          } else {
            ped.armL.rotation.set(-0.95 - punchArc * 0.85, 0, -0.14);
            if (pElbowL) pElbowL.rotation.x = -1.45 * (1 - punchArc * 0.85);
            ped.armR.rotation.set(-0.95, 0, 0.18);
            if (pElbowR) pElbowR.rotation.x = -1.55;
            if (ped.chest) ped.chest.rotation.y = punchArc * 0.48;
          }
        } else {
          // Fighting Boxer's Guard Stance!
          const gBob = Math.sin(elapsed * 6.0 + ped.phase) * 0.08;
          ped.armL.rotation.set(-0.95 + gBob, 0, -0.18);
          ped.armR.rotation.set(-0.92 - gBob, 0, 0.18);
          if (pElbowL) pElbowL.rotation.x = -1.55;
          if (pElbowR) pElbowR.rotation.x = -1.55;
          if (ped.chest) ped.chest.rotation.y = THREE.MathUtils.damp(ped.chest.rotation.y, 0.18, 8, dt);
        }
        ped.root.position.set(ped.x, ped.y, ped.z);
        continue;
      }

      const dxAct = ped.x - act.x;
      const dzAct = ped.z - act.z;
      const distActSq = dxAct * dxAct + dzAct * dzAct;

      // Distance-cull far pedestrians (>118m invisible -> skips distant draw calls!)
      const isVisible = distActSq < 13924; // 118^2
      if (ped.root.visible !== isVisible) ped.root.visible = isVisible;

      // Check car-vs-pedestrian collision only when car is moving and near car (<5m)
      const dxCar = ped.x - cs.x;
      const dzCar = ped.z - cs.z;
      if (carAbsSpd > 2.2 && (dxCar * dxCar + dzCar * dzCar) < 25) {
        const fwdDist = dxCar * fwdX + dzCar * fwdZ;
        const latDist = dxCar * rightX + dzCar * rightZ;
        if (Math.abs(fwdDist) < 2.55 && Math.abs(latDist) < 1.32) {
          this.triggerSquish(ped, carAbsSpd, latDist);
          continue;
        }
      }

      // Lazy-init natural biomechanical locomotion fields per NPC
      if (ped.walkPhase === undefined) {
        ped.walkPhase = ped.phase || 0;
        ped.curYaw = ped.root.rotation.y || 0;
        ped.curSpeed = ped.speed || 0;
        ped.pauseTimer = 0;
        ped.nextPause = 6 + (ped.phase % 9);
      }

      let targetYaw = ped.curYaw;
      let targetSpd = 0;
      let isPanic = false;

      if (ped.state === 'panic') {
        isPanic = true;
        ped.stateTimer -= dt;
        const fd = Math.max(0.1, Math.sqrt(distActSq));
        targetSpd = 5.2;
        ped.curSpeed = THREE.MathUtils.damp(ped.curSpeed, targetSpd, 8.5, dt);
        const nx = ped.x + (dxAct / fd) * ped.curSpeed * dt;
        const nz = ped.z + (dzAct / fd) * ped.curSpeed * dt;
        ped.x = THREE.MathUtils.clamp(nx, -492, 198);
        ped.z = THREE.MathUtils.clamp(nz, -1110, 355);
        targetYaw = Math.atan2(dxAct, dzAct);
        if (ped.stateTimer <= 0) ped.state = 'walk';
      } else if (ped.dir !== 0) {
        // Occasional natural idle browsing pauses on sidewalks / Carnival Pier (never for joggers)
        if (!ped.jog) {
          if (ped.pauseTimer > 0) {
            ped.pauseTimer -= dt;
            targetSpd = 0;
          } else {
            ped.nextPause -= dt;
            if (ped.nextPause <= 0) {
              ped.pauseTimer = 1.6 + Math.random() * 2.4;
              ped.nextPause = 9 + Math.random() * 14;
              targetSpd = 0;
            } else {
              targetSpd = ped.speed;
            }
          }
        } else {
          targetSpd = ped.speed;
        }
        ped.curSpeed = THREE.MathUtils.damp(ped.curSpeed, targetSpd, 6.5, dt);

        if (ped.axis === 'x') {
          ped.x += ped.dir * ped.curSpeed * dt;
          if (ped.x > ped.maxPos) { ped.x = ped.maxPos; ped.dir = -1; }
          if (ped.x < ped.minPos) { ped.x = ped.minPos; ped.dir = 1; }
          targetYaw = ped.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          ped.z += ped.dir * ped.curSpeed * dt;
          if (ped.z < ped.minPos) ped.z = ped.maxPos;
          if (ped.z > ped.maxPos) ped.z = ped.minPos;
          targetYaw = ped.dir > 0 ? 0 : Math.PI;
        }
      } else {
        ped.curSpeed = THREE.MathUtils.damp(ped.curSpeed, 0, 8, dt);
      }

      // Smooth shortest-angle yaw turn (NPCs never snap 180° abruptly!)
      let dYaw = targetYaw - ped.curYaw;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      ped.curYaw += dYaw * Math.min(1, dt * (isPanic ? 10.5 : 7.0));
      if (isVisible) ped.root.rotation.y = ped.curYaw;

      // Anatomically Accurate Articulated Gait (Pedestrians face +Z: -leg forward, +knee bend back, -elbow bend forward, +chest forward lean!)
      if (distActSq < 8800 && isVisible) {
        const pChest = ped.chest;
        const pHead = ped.headGroup;
        const pKneeL = ped.legL.userData && ped.legL.userData.knee;
        const pKneeR = ped.legR.userData && ped.legR.userData.knee;
        const pAnkleL = ped.legL.userData && ped.legL.userData.ankle;
        const pAnkleR = ped.legR.userData && ped.legR.userData.ankle;
        const pElbowL = ped.armL.userData && ped.armL.userData.elbow;
        const pElbowR = ped.armR.userData && ped.armR.userData.elbow;

        if (ped.curSpeed > 0.12) {
          ped.walkPhase += dt * ped.curSpeed * (isPanic ? 2.15 : (ped.jog ? 1.95 : 2.12));
          const sw = Math.sin(ped.walkPhase);
          const strideBlend = THREE.MathUtils.clamp(ped.curSpeed / 1.9, 0, 1);
          const runAmt = isPanic ? 1.0 : (ped.jog ? 0.72 : 0.0);
          const hipAmp = (0.42 + runAmt * 0.38) * strideBlend;

          // Left leg swings forward (+Z) when sw > 0 (-legL.rotation.x)
          ped.legL.rotation.x = -sw * hipAmp;
          ped.legR.rotation.x = sw * hipAmp;
          // CORRECTED KNEE FLEXION: +X bends shin BACKWARD toward -Z (peak during mid-swing, straight at heel strike!)
          if (pKneeL) pKneeL.rotation.x = Math.max(0, Math.cos(ped.walkPhase + 0.25)) * (0.56 + runAmt * 0.48) * strideBlend;
          if (pKneeR) pKneeR.rotation.x = Math.max(0, Math.cos(ped.walkPhase + Math.PI + 0.25)) * (0.56 + runAmt * 0.48) * strideBlend;
          // Heel-to-toe ankle articulation (-X toes up at heel strike, +X push-off behind)
          if (pAnkleL) pAnkleL.rotation.x = (-Math.max(0, sw) * 0.18 + Math.max(0, -sw) * (0.22 + runAmt * 0.12)) * strideBlend;
          if (pAnkleR) pAnkleR.rotation.x = (-Math.max(0, -sw) * 0.18 + Math.max(0, sw) * (0.22 + runAmt * 0.12)) * strideBlend;

          if (isPanic) {
            // Athletic panicked sprint pumping (bent elbows pumping at chest height, NOT frozen straight overhead!)
            ped.armL.rotation.x = sw * 0.92 - 0.18;
            ped.armR.rotation.x = -sw * 0.92 - 0.18;
            ped.armL.rotation.z = -0.14;
            ped.armR.rotation.z = 0.14;
            if (pElbowL) pElbowL.rotation.x = -1.22;
            if (pElbowR) pElbowR.rotation.x = -1.22;
          } else {
            // Contra-lateral natural arm swing (Left arm swings back when Left leg steps forward)
            const armAmp = (0.34 + runAmt * 0.44) * strideBlend;
            ped.armL.rotation.x = sw * armAmp;
            ped.armR.rotation.x = -sw * armAmp;
            ped.armL.rotation.z = -0.04 - runAmt * 0.04;
            ped.armR.rotation.z = 0.04 + runAmt * 0.04;
            // CORRECTED ELBOW FLEXION: -X bends forearm FORWARD toward +Z!
            if (pElbowL) pElbowL.rotation.x = -(0.14 + Math.max(0, -sw) * (0.36 + runAmt * 0.44) * strideBlend);
            if (pElbowR) pElbowR.rotation.x = -(0.14 + Math.max(0, sw) * (0.36 + runAmt * 0.44) * strideBlend);
          }

          ped.body.position.y = Math.abs(Math.cos(ped.walkPhase)) * (0.034 + runAmt * 0.046) * strideBlend;
          ped.body.rotation.x = 0;
          ped.body.rotation.y = sw * (0.05 + runAmt * 0.04) * strideBlend;
          ped.body.rotation.z = sw * 0.022 * strideBlend;
          // Waist-pivoted chest forward lean (+X toward +Z) + counter-rotation!
          const leanX = (0.035 + runAmt * 0.15) * strideBlend;
          const twistY = -sw * (0.095 + runAmt * 0.07) * strideBlend;
          if (pChest) {
            pChest.rotation.x = leanX;
            pChest.rotation.y = twistY;
            pChest.rotation.z = -sw * 0.016 * strideBlend;
          }
          if (pHead) {
            pHead.rotation.x = -leanX * 0.55;
            pHead.rotation.y = -twistY * 0.6 + (isPanic ? Math.sin(elapsed * 7 + ped.phase) * 0.22 : 0);
          }
        } else {
          // Relaxed breathing idle with subtle natural head glance when paused or sunbathing
          const br = Math.sin(elapsed * 2.0 + ped.phase) * 0.022;
          ped.legL.rotation.x = THREE.MathUtils.damp(ped.legL.rotation.x, 0, 8, dt);
          ped.legR.rotation.x = THREE.MathUtils.damp(ped.legR.rotation.x, 0, 8, dt);
          if (pKneeL) pKneeL.rotation.x = THREE.MathUtils.damp(pKneeL.rotation.x, 0, 8, dt);
          if (pKneeR) pKneeR.rotation.x = THREE.MathUtils.damp(pKneeR.rotation.x, 0, 8, dt);
          if (pAnkleL) pAnkleL.rotation.x = THREE.MathUtils.damp(pAnkleL.rotation.x, 0, 8, dt);
          if (pAnkleR) pAnkleR.rotation.x = THREE.MathUtils.damp(pAnkleR.rotation.x, 0, 8, dt);
          ped.armL.rotation.x = THREE.MathUtils.damp(ped.armL.rotation.x, -0.03 + br, 8, dt);
          ped.armR.rotation.x = THREE.MathUtils.damp(ped.armR.rotation.x, -0.03 - br, 8, dt);
          ped.armL.rotation.z = THREE.MathUtils.damp(ped.armL.rotation.z, -0.04, 8, dt);
          ped.armR.rotation.z = THREE.MathUtils.damp(ped.armR.rotation.z, 0.04, 8, dt);
          if (pElbowL) pElbowL.rotation.x = THREE.MathUtils.damp(pElbowL.rotation.x, -0.14, 8, dt);
          if (pElbowR) pElbowR.rotation.x = THREE.MathUtils.damp(pElbowR.rotation.x, -0.14, 8, dt);
          ped.body.position.y = br * 0.30;
          ped.body.rotation.x = THREE.MathUtils.damp(ped.body.rotation.x, 0, 8, dt);
          ped.body.rotation.y = THREE.MathUtils.damp(ped.body.rotation.y, Math.sin(elapsed * 0.45 + ped.phase) * 0.06, 5, dt);
          ped.body.rotation.z = THREE.MathUtils.damp(ped.body.rotation.z, 0, 8, dt);
          if (pChest) {
            pChest.rotation.x = THREE.MathUtils.damp(pChest.rotation.x, br * 0.6, 8, dt);
            pChest.rotation.y = THREE.MathUtils.damp(pChest.rotation.y, Math.sin(elapsed * 0.6 + ped.phase) * 0.08, 5, dt);
            pChest.rotation.z = THREE.MathUtils.damp(pChest.rotation.z, 0, 8, dt);
          }
          if (pHead) {
            pHead.rotation.x = THREE.MathUtils.damp(pHead.rotation.x, 0, 8, dt);
            pHead.rotation.y = THREE.MathUtils.damp(pHead.rotation.y, Math.sin(elapsed * 0.72 + ped.phase) * 0.26, 4, dt);
          }
        }
      }
      if (isVisible) ped.root.position.set(ped.x, ped.y, ped.z);
    }

    // 5a-2. Animate 1986 Art Deco Showcase Cinemas (Chasing Marquee Bulbs, Blade Finial & Classic GTA Gold Star)
    const chasePhase = Math.floor(elapsed * 2.6) % 2;
    for (let i = 0; i < this.showroomAnims.length; i++) {
      const sa = this.showroomAnims[i];
      const visited = this.visited.has(sa.sr.id);
      if (sa.bulbMatA && sa.bulbMatB) {
        const aLit = (chasePhase + i) % 2 === 0;
        sa.bulbMatA.emissiveIntensity = aLit ? 1.75 : 0.35;
        sa.bulbMatB.emissiveIntensity = aLit ? 0.35 : 1.75;
      }
      if (sa.starMarker) {
        sa.starMarker.rotation.y = elapsed * 2.1 + i * 0.9;
        sa.starMarker.position.y = 1.45 + Math.sin(elapsed * 2.8 + i) * 0.18;
      }
      if (sa.starMat && visited) {
        sa.starMat.color.setHex(0x34e89e);
        sa.starMat.emissive.setHex(0x18b878);
      }
      if (sa.bladeTopper) {
        sa.bladeTopper.rotation.y = elapsed * 1.1 + i;
      }
    }

    // 5b. Interactive World Items: 3D Piles of Cash ($100 Stacks), Nitro Pads, Stunt Ramps & Knockable Props
    const tokenPickupSq = isFoot ? 4.4 : 9.2;
    for (let i = 0; i < this.tokens.length; i++) {
      const tk = this.tokens[i];
      if (tk.collected) continue;
      const dSq = (tk.x - act.x) * (tk.x - act.x) + (tk.z - act.z) * (tk.z - act.z);
      if (dSq < 22000) {
        tk.mesh.visible = true;
        if (tk.pile) tk.pile.rotation.y = elapsed * 1.25 + tk.phase;
        if (tk.badge) tk.badge.position.y = 1.62 + Math.sin(elapsed * 3.0 + tk.phase) * 0.16;
        if (tk.ring) {
          const rs = 1.0 + Math.sin(elapsed * 3.4 + tk.phase) * 0.08;
          tk.ring.scale.set(rs, rs, 1);
        }
      } else if (tk.mesh.visible) {
        tk.mesh.visible = false;
      }
      if (dSq < tokenPickupSq) {
        tk.collected = true;
        tk.mesh.visible = false;
        this.tokensCollected += 1;
        this.cash += 500;
        this.audio.pickup();
        this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        this.el.progress.textContent = `${this.visited.size} / 5 Projects · ${this.tokensCollected} / ${this.tokens.length} Cash Piles`;
        this.el.combo.innerHTML = `CASH PILE ${this.tokensCollected}/${this.tokens.length}! <span>+$500</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 3.2;
        for (let k = 0; k < 12; k++) {
          this.spawnParticle(tk.x, 1.1, tk.z, (Math.random() - 0.5) * 6.5, 2.8 + Math.random() * 3.6, (Math.random() - 0.5) * 6.5, k % 3 === 0 ? 0xffd36b : 0x2ee88a, 0.58, 0.78, 0.35, 8.5);
        }
      }
    }

    // 5b-2. Glowing Floating 3D Weapon Pickups across Vice City
    for (let i = 0; i < this.weaponPickups.length; i++) {
      const wp = this.weaponPickups[i];
      if (wp.cooldown > 0) wp.cooldown = Math.max(0, wp.cooldown - dt);
      const dSq = (wp.x - act.x) * (wp.x - act.x) + (wp.z - act.z) * (wp.z - act.z);
      if (dSq < 22000) {
        wp.root.visible = true;
        wp.icon.rotation.y = elapsed * 2.2 + wp.phase;
        wp.icon.position.y = 1.12 + Math.sin(elapsed * 3.2 + wp.phase) * 0.18;
        const rs = 1.0 + Math.sin(elapsed * 3.6 + wp.phase) * 0.1;
        wp.ring.scale.set(rs, rs, 1);
      } else if (wp.root.visible) {
        wp.root.visible = false;
      }
      if (wp.cooldown <= 0 && dSq < (isFoot ? 4.8 : 9.5)) {
        wp.cooldown = 6.0;
        this.setWeapon(wp.id);
        this.audio.pickup();
        this.el.combo.innerHTML = `WEAPON PICKUP · ${wp.label} <span>EQUIPPED</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 2.6;
      }
    }

    for (let i = 0; i < this.boostPads.length; i++) {
      const bp = this.boostPads[i];
      if (bp.cooldown > 0) bp.cooldown -= dt;
      if (!isFoot && bp.cooldown <= 0 && Math.hypot(bp.x - cs.x, bp.z - cs.z) < 3.4 && carAbsSpd > 4) {
        bp.cooldown = 3.0;
        this.boostPadTimer = 1.6;
        cs.speed = Math.min(72, cs.speed + 18);
        this.camShake = Math.max(this.camShake, 0.16);
        this.audio.boost();
        this.el.combo.innerHTML = `NITRO BOOST! <span>TURBO</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 2.0;
      }
    }

    // Stunt Jump Ramps & Vertical Airborne Physics
    let rampPitch = 0;
    for (let i = 0; i < this.ramps.length; i++) {
      const rp = this.ramps[i];
      if (rp.cooldown > 0) rp.cooldown -= dt;
      const dx = cs.x - rp.x, dz = cs.z - rp.z;
      const along = dx * rp.fx + dz * rp.fz; // -5.25 (entry) to +5.25 (lip)
      const side = dx * rp.rx + dz * rp.rz;
      if (Math.abs(side) < 2.55 && along > -5.4 && along < 5.5) {
        const alignDot = fwdX * rp.fx + fwdZ * rp.fz;
        if (alignDot > 0.35 && cs.speed > 6) {
          const frac = THREE.MathUtils.clamp((along + 5.25) / 10.5, 0, 1);
          const rampH = frac * 2.35;
          if (cs.y <= rampH + 0.35) {
            cs.y = rampH;
            rampPitch = 0.22;
            if (frac > 0.78 && !cs.airborne && rp.cooldown <= 0 && cs.speed > 16) {
              rp.cooldown = 2.0;
              cs.airborne = true;
              cs.airTime = 0;
              cs.vy = Math.min(13.5, cs.speed * 0.27);
              this.audio.jump();
            }
          }
        }
      }
    }
    const carMvHit = cs.z < -1104 ? closestMountainRoad(cs.x, cs.z) : null;
    const carGroundY = getTerrainHeight(cs.x, cs.z) + (carMvHit && carMvHit.dist < 7.2 ? 0.08 : 0);
    if (cs.airborne || cs.y > carGroundY + 0.02) {
      if (cs.airborne) {
        cs.airTime += dt;
        cs.vy -= 21.5 * dt;
        cs.y += cs.vy * dt;
        rampPitch = THREE.MathUtils.clamp(cs.vy * 0.025, -0.2, 0.28);
        if (cs.y <= carGroundY) {
          cs.y = carGroundY;
          cs.vy = 0;
          cs.airborne = false;
          this.camShake = Math.max(this.camShake, 0.22);
          this.audio.impact(0.5);
          if (cs.airTime > 0.45) {
            const bonus = 500;
            this.cash += bonus;
            this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.el.combo.innerHTML = `STUNT JUMP! <span>+$${bonus}</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 3.2;
          }
          for (let k = 0; k < 6; k++) {
            this.spawnParticle(cs.x + (Math.random() - 0.5) * 1.6, carGroundY + 0.25, cs.z + (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 5, 1.8 + Math.random() * 2, (Math.random() - 0.5) * 5, 0xffd36b, 0.42, 0.48, 0.25, 9.8);
          }
        }
      } else if (rampPitch === 0) {
        cs.y = Math.max(carGroundY, cs.y - 14 * dt);
      }
    } else if (rampPitch === 0) {
      cs.y = carGroundY;
    }

    // Knockable Traffic Cones & Bouncy Beach Balls (car impact OR walking into them on foot!)
    const actFwdX = -Math.sin(act.yaw), actFwdZ = -Math.cos(act.yaw);
    const actSpd = isFoot ? ps.speed : carAbsSpd;
    const kbRadSq = isFoot ? 1.8 : 4.4;
    for (let i = 0; i < this.knockables.length; i++) {
      const kb = this.knockables[i];
      if (!kb.active) {
        const dSq = (kb.x - act.x) * (kb.x - act.x) + (kb.z - act.z) * (kb.z - act.z);
        if (dSq < kbRadSq && actSpd > 1.5) {
          kb.active = true;
          kb.resetTimer = 14.0;
          const kick = isFoot ? 8.5 : Math.min(20, Math.max(6, carAbsSpd * 0.6));
          kb.vx = actFwdX * kick + (Math.random() - 0.5) * 4.5;
          kb.vz = actFwdZ * kick + (Math.random() - 0.5) * 4.5;
          kb.vy = kb.type === 'ball' ? 7.5 + Math.random() * 3.5 : 4.2 + Math.random() * 3.0;
          kb.rx = (Math.random() - 0.5) * 10;
          kb.rz = (Math.random() - 0.5) * 10;
        }
      } else {
        kb.resetTimer -= dt;
        kb.vy -= 18.0 * dt;
        kb.x += kb.vx * dt;
        kb.y += kb.vy * dt;
        kb.z += kb.vz * dt;
        const floorY = kb.type === 'ball' ? 0.44 : 0.14;
        if (kb.y < floorY) {
          kb.y = floorY;
          kb.vy = Math.abs(kb.vy) > 1.2 ? -kb.vy * (kb.type === 'ball' ? 0.68 : 0.34) : 0;
          kb.vx *= 0.82; kb.vz *= 0.82;
          kb.rx *= 0.78; kb.rz *= 0.78;
        }
        kb.mesh.position.set(kb.x, kb.y, kb.z);
        kb.mesh.rotation.x += kb.rx * dt;
        kb.mesh.rotation.z += kb.rz * dt;
        if (kb.resetTimer <= 0) {
          kb.active = false;
          kb.x = kb.homeX; kb.z = kb.homeZ; kb.y = kb.type === 'ball' ? 0.44 : 0.02;
          kb.mesh.position.set(kb.x, kb.y, kb.z);
          kb.mesh.rotation.set(0, 0, 0);
        }
      }
    }

    // 6. Apply Active Vehicle Transform + Roadable Mount Vice Slope Pitch & Roll Alignment!
    let slopePitch = 0, slopeRoll = 0;
    if (cs.z < -1112 && !cs.airborne) {
      const hFront = getTerrainHeight(cs.x + fwdX * 1.9, cs.z + fwdZ * 1.9);
      const hBack  = getTerrainHeight(cs.x - fwdX * 1.9, cs.z - fwdZ * 1.9);
      const hRight = getTerrainHeight(cs.x + rightX * 1.1, cs.z + rightZ * 1.1);
      const hLeft  = getTerrainHeight(cs.x - rightX * 1.1, cs.z - rightZ * 1.1);
      slopePitch = THREE.MathUtils.clamp(Math.atan2(hFront - hBack, 3.8), -0.34, 0.34);
      slopeRoll  = THREE.MathUtils.clamp(Math.atan2(hLeft - hRight, 2.2), -0.26, 0.26);
    }
    const activeRig = (this.activeVehicle && this.activeVehicle.rig) || this.car;
    const activeMesh = (this.activeVehicle && this.activeVehicle.mesh) || this.car.root;
    activeMesh.position.set(cs.x, cs.y, cs.z);
    activeMesh.rotation.y = cs.yaw;
    cs.pitch = THREE.MathUtils.damp(cs.pitch, targetPitch + rampPitch + slopePitch, 8, dt);
    cs.roll = THREE.MathUtils.damp(cs.roll, -cs.steer * speedFactor * (drifting ? 0.12 : 0.065) + slopeRoll, 8, dt);
    if (activeRig.bodyGroup) {
      activeRig.bodyGroup.rotation.x = cs.pitch;
      activeRig.bodyGroup.rotation.z = cs.roll;
      activeRig.bodyGroup.position.y = cs.airborne ? 0 : Math.sin(elapsed * 22) * Math.min(carAbsSpd * 0.0004, 0.012);
    }

    cs.wheelSpin -= cs.speed * dt * 2.85;
    if (activeRig.wheelSpinGroups) {
      for (let i = 0; i < activeRig.wheelSpinGroups.length; i++) activeRig.wheelSpinGroups[i].rotation.x = cs.wheelSpin;
    }
    if (activeRig.frontSteerGroups) {
      for (let i = 0; i < activeRig.frontSteerGroups.length; i++) activeRig.frontSteerGroups[i].rotation.y = cs.steer;
    }
    if (activeRig.tailMat) activeRig.tailMat.emissiveIntensity = braking ? 2.1 : 1.1;

    if (activeRig.isHero) {
      cs.popAngle = THREE.MathUtils.damp(cs.popAngle, this.lightsOn ? 0.56 : 0.0, 10, dt);
      for (let i = 0; i < this.car.popPods.length; i++) this.car.popPods[i].rotation.x = cs.popAngle;
      this.car.brakeLight.intensity = braking ? 1.85 : 0.6;
      const flameAlpha = nitroActive ? 0.65 + Math.sin(elapsed * 55) * 0.2 : 0;
      this.car.flameOuterMat.opacity = flameAlpha;
      this.car.flameCoreMat.opacity = flameAlpha * 1.05;
      const flameScale = nitroActive ? 0.95 + Math.sin(elapsed * 64) * 0.24 : 0.01;
      for (let i = 0; i < this.car.nitroFlames.length; i++) this.car.nitroFlames[i].scale.set(1, flameScale, 1);
    }

    if (drifting && !cs.airborne && Math.random() < 0.65) {
      this.spawnParticle(cs.x - fwdX * 1.4 + (Math.random() - 0.5) * 1.4, 0.24, cs.z - fwdZ * 1.4, (Math.random() - 0.5) * 1.4, 0.9, (Math.random() - 0.5) * 1.4, 0xe8e4f0, 0.85, 0.65, 2.4);
    }
    if (nitroActive && Math.random() < 0.7) {
      this.spawnParticle(cs.x - fwdX * 2.5 + (Math.random() - 0.5) * 0.9, cs.y + 0.28, cs.z - fwdZ * 2.5, 0, 0.4, 0, 0x21e6d1, 0.52, 0.35, 1.4);
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) p.sprite.visible = false;
      else {
        p.vy -= p.gravity * dt;
        p.sprite.position.x += p.vx * dt;
        p.sprite.position.y = Math.max(0.12, p.sprite.position.y + p.vy * dt);
        p.sprite.position.z += p.vz * dt;
        p.sprite.material.opacity = (p.life / p.maxLife) * 0.65;
        const sc = p.sprite.scale.x + p.grow * dt;
        p.sprite.scale.set(sc, sc, 1);
      }
    }

    // Keep shadow frustum anchored around active actor & live dynamic sun direction!
    this.sunLight.position.set(act.x + this.envSunDir.x * 85, Math.max(12, this.envSunDir.y * 85), act.z + this.envSunDir.z * 85);
    this.sunLight.target.position.set(act.x, 0, act.z);

    // 6b. 3D Overhead GPS Pointer Arrow + Turn-by-Turn GPS Navigation Ribbon
    if (this.autopilotQueue.length > 0 && this.autopilotTarget) {
      const nextNode = this.autopilotQueue[0];
      const arrowY = act.y + (isFoot ? 2.55 : 2.38) + Math.sin(elapsed * 4.6) * 0.14;
      this.navArrow.visible = true;
      this.navArrow.position.set(act.x, arrowY, act.z);
      const aimYaw = Math.atan2(-(nextNode.x - act.x), -(nextNode.z - act.z));
      this.navArrow.rotation.y = aimYaw;

      const totalDist = Math.round(Math.hypot(this.autopilotTarget.x - act.x, this.autopilotTarget.z - act.z));
      const nodeDist = Math.round(Math.hypot(nextNode.x - act.x, nextNode.z - act.z));
      let sym = '↑', dirText = `Continue toward ${this.autopilotTarget.label}`;
      if (totalDist < 26) {
        sym = '★';
        dirText = `Arriving at ${this.autopilotTarget.label}`;
      } else if (this.autopilotQueue.length >= 2 && nodeDist < 55) {
        const nxt = this.autopilotQueue[1];
        const y1 = Math.atan2(-(nextNode.x - act.x), -(nextNode.z - act.z));
        const y2 = Math.atan2(-(nxt.x - nextNode.x), -(nxt.z - nextNode.z));
        let delta = y2 - y1;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        if (delta > 0.45) { sym = '↰'; dirText = `Turn Left in ${nodeDist}m`; }
        else if (delta < -0.45) { sym = '↱'; dirText = `Turn Right in ${nodeDist}m`; }
        else if (nextNode.x > 12) { sym = '→'; dirText = `Cross Causeway Bridge`; }
      } else if (nextNode.x > 12 && act.x <= 12) {
        sym = '↱'; dirText = `Take Causeway to Starfish Island`;
      }
      const navKey = `${sym}|${dirText}|${Math.floor(totalDist / 5)}`;
      if (navKey !== this.lastNavKey) {
        this.lastNavKey = navKey;
        this.el.navArrow.textContent = sym;
        this.el.navDir.textContent = dirText;
        this.el.navSub.textContent = `${this.autopilotTarget.label} · ${totalDist}m remaining`;
      }
    } else if (this.navArrow.visible) {
      this.navArrow.visible = false;
    }

    // 7. Smooth Camera Choreography (Airplane Flight Chase + Car Chase/Low/Drone + On-Foot Over-The-Shoulder GTA Camera)
    if (!isFoot && !this.dragging && (isPlane ? act.speed > 6 : carAbsSpd > 5) && (performance.now() - this.lastLookTime > 1800)) {
      this.orbitYawOffset = THREE.MathUtils.damp(this.orbitYawOffset, 0, 2.2, dt);
      this.orbitPitchOffset = THREE.MathUtils.damp(this.orbitPitchOffset, 0, 2.2, dt);
    }
    const speedRatio = isPlane
      ? THREE.MathUtils.clamp(act.speed / Math.max(1, act.topSpeed || 90), 0, 1)
      : THREE.MathUtils.clamp(carAbsSpd / 64, 0, 1);
    const camMode = CAM_MODES[this.camIdx];
    let camDist = 8.8, camHeight = 2.50, lookAhead = 8.5;
    let targetFov = isPlane
      ? (58 + speedRatio * 15)
      : (isFoot ? (this.weapon !== 'fists' ? 50 : 56) : (55 + speedRatio * 14 + (nitroActive ? 5 : 0)));

    if (!this.started) {
      const a = elapsed * 0.22;
      _vecA.set(cs.x + Math.sin(a) * 6.8, 2.15, cs.z + Math.cos(a) * 6.8);
      _vecB.set(cs.x, 0.9, cs.z - 0.5);
      targetFov = 48;
    } else if (isPlane) {
      // Cinematic Vice City Aerial Flight Chase Camera (frames wingspan, afterburners & skyline below!)
      const pl = this.activePlane;
      const yaw = pl.yaw + this.orbitYawOffset;
      const pDist = (pl.kind === 'prop' ? 14.5 : 18.5) + speedRatio * 4.5;
      const pHeight = 4.6 + speedRatio * 1.4 - pl.pitch * 4.2 + this.orbitPitchOffset * 5.0;
      _vecA.set(pl.x + Math.sin(yaw) * pDist, pl.y + pHeight, pl.z + Math.cos(yaw) * pDist);
      _vecB.set(pl.x - Math.sin(pl.yaw) * 14.0, pl.y + 1.4 + pl.pitch * 6.0, pl.z - Math.cos(pl.yaw) * 14.0);
    } else if (this.carjackAnim && this.carjackAnim.kind === 'steal') {
      // Dynamic GTA Cinematic Side-Action Camera framing open door, protagonist & ejected NPC driver!
      const cj = this.carjackAnim;
      _vecA.set(
        cj.carX - cj.rx * 4.9 - cj.fx * 3.1,
        1.95,
        cj.carZ - cj.rz * 4.9 - cj.fz * 3.1
      );
      _vecB.set(cj.doorX, 1.02, cj.doorZ);
      targetFov = 46;
    } else if (isRide) {
      // Sweeping Scenic / Thrill Ride Camera for Carnival Pier Attractions!
      const r = this.activeRide;
      const yaw = (r.id === 'ferris' ? elapsed * 0.18 : (r.id === 'carousel' ? elapsed * 0.55 : this.player.root.rotation.y)) + this.orbitYawOffset;
      const dist = r.id === 'ferris' ? 9.5 : (r.id === 'coaster' ? 6.8 : 5.6);
      const hOff = r.id === 'ferris' ? 3.2 : (r.id === 'coaster' ? 2.8 : 2.2);
      _vecA.set(ps.x + Math.sin(yaw) * dist, ps.y + hOff + this.orbitPitchOffset * 2.4, ps.z + Math.cos(yaw) * dist);
      _vecB.set(ps.x, ps.y + 1.1, ps.z);
      targetFov = r.id === 'coaster' ? 64 : 56;
    } else if (isFoot) {
      const armed = this.weapon !== 'fists';
      const footDist = ps.parachuting ? 7.2 : (armed ? 3.85 : 4.6);
      const footH = (ps.parachuting ? 3.2 : (armed ? 1.88 : 2.05)) + this.orbitPitchOffset * 2.1;
      const yaw = this.orbitYawOffset;
      const shoulderR = ps.parachuting ? 0 : (armed ? 0.58 : 0.16);
      const rx = Math.cos(yaw) * shoulderR, rz = -Math.sin(yaw) * shoulderR;
      _vecA.set(ps.x + Math.sin(yaw) * footDist + rx, ps.y + footH, ps.z + Math.cos(yaw) * footDist + rz);
      _vecB.set(ps.x - Math.sin(yaw) * 6.0 + rx * 0.4, ps.y + 1.42 - this.orbitPitchOffset * 2.2, ps.z - Math.cos(yaw) * 6.0 + rz * 0.4);
    } else if (camMode === 'Low') {
      camDist = 5.6; camHeight = 1.28; lookAhead = 12.0; targetFov = 62 + speedRatio * 15;
      const yaw = cs.yaw + this.orbitYawOffset;
      _vecA.set(cs.x + Math.sin(yaw) * camDist, cs.y + camHeight + this.orbitPitchOffset * 2, cs.z + Math.cos(yaw) * camDist);
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead, cs.y + 0.85, cs.z - Math.cos(cs.yaw) * lookAhead);
    } else if (camMode === 'Drone') {
      camDist = 14.5; camHeight = 9.4; lookAhead = 8.0; targetFov = 50 + speedRatio * 8;
      const yaw = cs.yaw + 0.34 + this.orbitYawOffset;
      _vecA.set(cs.x + Math.sin(yaw) * camDist, cs.y + camHeight + this.orbitPitchOffset * 4, cs.z + Math.cos(yaw) * camDist);
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead - 2.2, cs.y + 1.0, cs.z - Math.cos(cs.yaw) * lookAhead);
    } else {
      const yaw = cs.yaw + this.orbitYawOffset;
      _vecA.set(cs.x + Math.sin(yaw) * (camDist + speedRatio * 1.4), cs.y + camHeight + this.orbitPitchOffset * 3.2, cs.z + Math.cos(yaw) * (camDist + speedRatio * 1.4));
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead, cs.y + 0.78, cs.z - Math.cos(cs.yaw) * lookAhead);
    }

    const sx = (Math.random() - 0.5) * this.camShake;
    const sy = (Math.random() - 0.5) * this.camShake;
    const camDamp = isPlane ? 6.2 : (isFoot ? 11.0 : 7.5);
    if (this.snapCameraNext) {
      this.camera.position.set(_vecA.x, Math.max(0.8, _vecA.y), _vecA.z);
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
      this.snapCameraNext = false;
    } else {
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _vecA.x + sx, camDamp, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, Math.max(0.8, _vecA.y + sy), camDamp, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _vecA.z, camDamp, dt);
      const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
      if (Math.abs(nextFov - this.camera.fov) > 0.02) {
        this.camera.fov = nextFov;
        this.camera.updateProjectionMatrix();
      }
    }
    this.camera.lookAt(_vecB);
    this.updateProjectPins(act);

    this.audio.update(isFoot ? 0 : speedRatio, isPlane ? (act.throttle > 0.75) : nitroActive, drifting);
    if (this.frameCount % 4 === 0) this.drawRadar();

    // 8. Realistic 1986 Dual-Gauge Vintage Binnacle (Car Speed/Gear OR Aircraft Airspeed KTS & Altitude!)
    const kmh = isPlane ? Math.round(act.speed * 1.94) : Math.round(carAbsSpd * 3.9);
    const needleDeg = -130 + THREE.MathUtils.clamp((isPlane ? kmh / 240 : carAbsSpd * 3.9 / 280), 0, 1) * 260;
    if (Math.abs(needleDeg - this.lastNeedleDeg) > 0.25) {
      this.lastNeedleDeg = needleDeg;
      this.el.needle.style.transform = `rotate(${needleDeg.toFixed(1)}deg)`;
    }
    if (kmh !== this.lastHudKmh) {
      this.lastHudKmh = kmh;
      this.el.speed.textContent = String(kmh);
    }
    const gearNum = cs.speed < -0.5 ? 0 : kmh < 4 ? 0 : Math.min(5, Math.floor(kmh / 46) + 1);
    const gearStr = isPlane
      ? `${Math.round(act.y)}M`
      : (cs.speed < -0.5 ? 'R' : kmh < 4 ? 'N' : String(gearNum));
    if (gearStr !== this.lastHudGear) {
      this.lastHudGear = gearStr;
      this.el.gear.textContent = gearStr;
    }
    if (isPlane && this.el.carName && this.frameCount % 6 === 0) {
      const gTxt = act.gearBlend > 0.5 ? 'GEAR DN' : 'GEAR UP';
      this.el.carName.textContent = `${act.label} · ${Math.round(act.y)}M · ${gTxt}`;
    }

    // Dynamic RPM Tachometer Needle + Warm Backlit Arc
    const rpmNorm = kmh < 4
      ? 0.11 + Math.sin(elapsed * 8) * 0.018
      : THREE.MathUtils.clamp(0.24 + ((kmh % 46) / 46) * 0.65 + (nitroActive ? 0.16 : 0), 0.12, 0.99);
    const tachDeg = -130 + rpmNorm * 260;
    if (this.el.tachNeedle && Math.abs(tachDeg - this.lastTachDeg) > 0.35) {
      this.lastTachDeg = tachDeg;
      this.el.tachNeedle.style.transform = `rotate(${tachDeg.toFixed(1)}deg)`;
    }
    const rpmOffset = Math.round(208 * (1 - rpmNorm));
    if (this.el.rpmArc && Math.abs(rpmOffset - this.lastRpmOffset) >= 2) {
      this.lastRpmOffset = rpmOffset;
      this.el.rpmArc.style.strokeDashoffset = String(rpmOffset);
      this.el.rpmArc.style.stroke = rpmNorm > 0.84 ? '#FF465A' : '#FFB84D';
    }
    this.el.lampNos.classList.toggle('on-nos', nitroActive);

    // Rolling mechanical odometer
    this.odometerKm += (carAbsSpd * dt) / 1000;
    const odoStr = this.odometerKm.toFixed(1);
    if (odoStr !== this.lastOdoStr) {
      this.lastOdoStr = odoStr;
      const [intPart, decPart] = odoStr.split('.');
      this.el.odoMain.textContent = intPart.padStart(5, '0');
      this.el.odoDec.textContent = `.${decPart}`;
    }

    let zoneText = 'Ocean Beach · Ocean Drive';
    let shortStreet = 'Ocean Drive';
    if (act.z < -1115) { zoneText = act.y > 54 ? 'Mount Vice Summit · 66M' : 'Mount Vice Switchback Highway'; shortStreet = 'Mount Vice'; }
    else if (act.x > 17 && Math.abs(act.z + 430) < 20) { zoneText = 'Vice Pier · Carnival Fair'; shortStreet = 'Carnival Pier'; }
    else if (act.x > 115 && act.z < -780) { zoneText = 'Prawn Island Film Studios'; shortStreet = 'Prawn Island'; }
    else if (act.x > 115 && act.z < -460) { zoneText = 'Vice Key Resort Island'; shortStreet = 'Vice Key'; }
    else if (act.x > 115) { zoneText = 'Starfish Island'; shortStreet = 'Starfish Island'; }
    else if (act.x > 18 && act.z > -965 && act.z < -915) { zoneText = 'Prawn Island Causeway'; shortStreet = 'Prawn Bridge'; }
    else if (act.x > 18 && act.z > -645 && act.z < -595) { zoneText = 'Vice Key Causeway Bridge'; shortStreet = 'Vice Key Bridge'; }
    else if (act.x > 18 && act.z > -325 && act.z < -275) { zoneText = 'Starfish Causeway Bridge'; shortStreet = 'Causeway Bridge'; }
    else if (act.x > 18) { zoneText = 'Vice Beach Boardwalk & Sand'; shortStreet = 'Vice Beach'; }
    else if (act.z > 190) { zoneText = 'South Ocean Bay Marina'; shortStreet = 'South Marina'; }
    else if (act.z > 28 && act.x < -8 && act.x > -288) { zoneText = "Vice City Int'l Airport"; shortStreet = "Int'l Airport"; }
    else if (act.x < -420) { zoneText = 'Vice Port Industrial Docks'; shortStreet = 'Vice Port'; }
    else if (act.x < -330) { zoneText = 'Little Haiti · West Vice'; shortStreet = 'Little Haiti'; }
    else if (act.x < -235) { zoneText = 'West Bayside Boulevard'; shortStreet = 'West Bayside'; }
    else if (act.x < -145) { zoneText = 'Downtown Vice Skyline'; shortStreet = 'Downtown Hwy'; }
    else if (act.x < -55) { zoneText = 'Washington Avenue'; shortStreet = 'Washington Ave'; }
    else if (act.z < -900) { zoneText = 'North Point Mall · Vice Point'; shortStreet = 'North Mall'; }
    else if (act.z < -645) { zoneText = 'North Vice Point Heights'; shortStreet = 'Vice Heights'; }
    else if (act.z < -580) { zoneText = 'Miami Beach Plaza'; shortStreet = 'Miami Plaza'; }
    else if (act.z < -330) { zoneText = 'Vice Point · Ocean Drive'; shortStreet = 'Vice Point'; }
    if (zoneText !== this.lastHudZone) {
      this.lastHudZone = zoneText;
      this.el.zone.textContent = zoneText;
      this.el.radarStreet.textContent = shortStreet;
    }
    const remTokens = this.tokens.length - this.tokensCollected;
    const radarInfoTxt = isPlane
      ? `ALT ${Math.round(act.y)}m · ${Math.round(act.speed * 1.94)} KTS`
      : (isRide
        ? 'Carnival Pier Ride'
        : (this.autopilotTarget
          ? `GPS ${Math.round(Math.hypot(this.autopilotTarget.x - act.x, this.autopilotTarget.z - act.z))}m`
          : (isFoot ? `On Foot · ${this.koCount} KO` : `${remTokens} Cash Piles`)));
    if (radarInfoTxt !== this.lastRadarInfo) {
      this.lastRadarInfo = radarInfoTxt;
      this.el.radarInfo.textContent = radarInfoTxt;
    }

    let nearestWp = WAYPOINTS[0], bestWpDist = Infinity;
    for (let i = 0; i < WAYPOINTS.length; i++) {
      const d = Math.hypot(act.x - WAYPOINTS[i].x, act.z - WAYPOINTS[i].z);
      if (d < bestWpDist) { bestWpDist = d; nearestWp = WAYPOINTS[i]; }
    }
    const trackPct = Math.round(THREE.MathUtils.clamp((360 - act.z) / 1480, 0.04, 1) * 100);
    if (trackPct !== this.lastTrackPct) {
      this.lastTrackPct = trackPct;
      this.el.trackFill.style.width = `${trackPct}%`;
    }

    if (nearestWp.id !== this.lastHudWp) {
      this.lastHudWp = nearestWp.id;
      this.el.wpBtns.forEach((b) => {
        b.classList.toggle('active', b.dataset.wp === nearestWp.id);
        b.classList.toggle('visited', this.visited.has(b.dataset.wp));
      });
    }

    let found = null;
    for (let i = 0; i < SHOWROOMS.length; i++) {
      const sr = SHOWROOMS[i];
      if (Math.hypot(act.x - sr.parkX, act.z - sr.parkZ) < 16) {
        found = sr;
        if (!this.visited.has(sr.id)) {
          this.visited.add(sr.id);
          this.el.progress.textContent = `${this.visited.size} / 5 Projects · ${this.tokensCollected} / ${this.tokens.length} Cash Piles`;
          this.el.wpBtns.forEach((b) => b.classList.toggle('visited', this.visited.has(b.dataset.wp)));
        }
        break;
      }
    }
    if (!found && (Math.hypot(act.x - CONTACT_SHOWROOM.parkX, act.z - CONTACT_SHOWROOM.parkZ) < 18 || Math.hypot(act.x - CONTACT_SHOWROOM.x, act.z - CONTACT_SHOWROOM.z) < 16)) {
      found = CONTACT_SHOWROOM;
    }
    if (found !== this.activeShowroom) {
      this.activeShowroom = found;
      if (found) {
        if (this.el.srThumb) {
          this.el.srThumb.src = found.img;
          this.el.srThumb.alt = found.title;
        }
        this.el.srSub.textContent = `${found.district} · ${found.stat}`;
        this.el.srTitle.textContent = found.title;
        this.el.srOpen.href = found.url;
        this.el.srOpen.textContent = found.id === 'contact' ? 'Send Email' : 'Open Case Study';
        this.el.srBar.classList.add('on');
      } else {
        this.el.srBar.classList.remove('on');
      }
    }
  }
}

export function openViceCity3D() {
  if (!instance) instance = new ViceCity3DApp();
  instance.open();
}
