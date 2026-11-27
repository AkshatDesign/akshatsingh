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
  makeCoronaGlowTexture,
  getWorldPBRTextures
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
  createMountViceRange,
  createSierraWestRange
} from './vice-assets.js?v=30';

import { ViceAudioEngine, RADIO_STATIONS } from './vice-audio.js?v=25';
import {
  createMotorcycle,
  createPoliceCruiser,
  createRhinoTank,
  createBarricadeWall,
  createCountrysideVillage,
  createPineForest,
  createWildlifeAnimal,
  createMalibuClubBuilding,
  createNorthPointMall,
  createOceanViewSafehouse,
  createBarberShopBuilding,
  createClothesStoreBuilding,
  VICE_CHEAT_CODES
} from './vice-world-ext.js?v=3';
import {
  LEONIDA_PROJ,
  LEONIDA_PLACES,
  LEONIDA_HIGHWAYS,
  isInCoreViceFootprint,
  isInLegacyMountains,
  getLandFactor,
  closestLeonidaHighway,
  getLeonidaElevation,
  getLeonidaZone,
  createLeonidaVectorMapCanvas,
  buildLeonidaWorld
} from './leonida-world.js?v=10';
import {
  getImageBillboardMaterials,
  buildImageBillboardMesh,
  buildMountainRopeway
} from './leonida-props.js?v=7';
import {
  createSpeedboat,
  createJetSki,
  createHelicopter,
  createPayNSprayBuilding,
  createBurgerShotBuilding,
  createAmmuNationBuilding,
  SkidmarkPool,
  RouteChevronGuide,
  createSkyRings,
  createMissionBeacon,
  STREET_RACE_GATES,
  TAXI_FARE_SPOTS,
  SCAVENGER_UNLOCKS
} from './vice-enhancements.js?v=2';

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
  { id: 'fists',   key: '1', name: 'Fists',   category: 'Unarmed',        cooldown: 0.28,  dmg: 1,   range: 2.6,  auto: false, label: 'Fists (Melee)',     ammo: 'MELEE', stats: { dmg: 22, rate: 72, range: 10, acc: 95 } },
  { id: 'bat',     key: '2', name: 'Bat',     category: 'Melee',          cooldown: 0.36,  dmg: 2.5, range: 3.3,  auto: false, label: 'Vice Baseball Bat', ammo: 'MELEE', stats: { dmg: 42, rate: 58, range: 16, acc: 92 } },
  { id: 'pistol',  key: '3', name: '9mm',     category: 'Handgun',        cooldown: 0.25,  dmg: 2,   range: 64,   auto: false, label: 'Chrome 9mm Pistol', ammo: '∞',     stats: { dmg: 46, rate: 64, range: 58, acc: 82 } },
  { id: 'smg',     key: '4', name: 'Uzi',     category: 'Submachine Gun', cooldown: 0.085, dmg: 1.2, range: 58,   auto: true,  label: 'Vice Uzi SMG',      ammo: '∞',     stats: { dmg: 38, rate: 96, range: 52, acc: 64 } },
  { id: 'shotgun', key: '5', name: 'Shotgun', category: 'Shotgun',        cooldown: 0.62,  dmg: 4.5, range: 34,   auto: false, label: '12-Gauge Shotgun',  ammo: '∞',     stats: { dmg: 84, rate: 34, range: 36, acc: 54 } },
  { id: 'rifle',   key: '6', name: 'M4',      category: 'Assault Rifle',  cooldown: 0.11,  dmg: 1.6, range: 82,   auto: true,  label: 'Vice M4 Rifle',     ammo: '∞',     stats: { dmg: 68, rate: 86, range: 82, acc: 86 } },
  { id: 'bazooka', key: '7', name: 'RPG',     category: 'Heavy Weapon',   cooldown: 0.92,  dmg: 10,  range: 115,  auto: false, label: 'RPG Bazooka',       ammo: '∞',     stats: { dmg: 100, rate: 18, range: 96, acc: 72 } }
];

function getWeaponWheelSvg(id) {
  switch (id) {
    case 'fists':
      return `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M18 22v-7a3 3 0 0 1 6 0v3h1v-5a3 3 0 0 1 6 0v5h1v-4a3 3 0 0 1 6 0v4h1v-2a3 3 0 0 1 6 0v9c0 6.5-4.5 11-11.5 11H28c-6.5 0-11-4.2-11-10.5V22h1zm-2 0a3 3 0 0 0-3 3v2.5c0 2.5 1.7 4.5 4 5V22h-1z" fill="currentColor"/></svg>`;
    case 'bat':
      return `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M11 31l4 4 3.5-2.5-1.2-1.2 12.2-10.6 19.8-13.2c2.2-1.5 2.7-4.2 1.2-5.7s-4.2-1-5.7 1.2L31.6 22.8 21 35l-1.2-1.2L11 31z" fill="currentColor" transform="translate(0,-1)"/></svg>`;
    case 'pistol':
      return `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M12 10h36c2 0 3 1 3 3v4c0 1.6-1.1 2.7-2.6 2.9L36 20.5l-1.5 3.8c-.4 1-1.3 1.7-2.4 1.7h-4.6l-3.6 10.2c-.4 1.1-1.4 1.8-2.6 1.8h-5.8c-1.5 0-2.5-1.5-2-2.9L17.8 20H14c-1.4 0-2.4-1-2.4-2.4V12c0-1.1.9-2 2-2zm14.5 10.5l-1 2.7h4.2l1-2.7h-4.2z" fill="currentColor"/></svg>`;
    case 'smg':
      return `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M10 12h31v2.5h11v4H41v3H32l-1 14.5h-6.5l1.2-14.5H19l-2 8.5h-5.5l1.8-8.5H10V12zm3-4h16v3H13V8z" fill="currentColor"/></svg>`;
    case 'shotgun':
      return `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M5 24l11.5-5.5h8.5V15h34v3.2H42v3.6H30.5l-2.5 2.2h-6.5l-9.5 7.2L5 24zm29-5.8h18v2.2H34v-2.2z" fill="currentColor"/></svg>`;
    case 'rifle':
      return `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M4 17h12l4-3h4v-3h12v3h8v2h15v3H46v3.2h-8.5l2.8 11.2-5.2 1.2-3.4-12.4H24l-2.8 9.2h-4.8l1.6-9.2H15l-9.5 5.2L4 23v-6zm22-4h8v1.8h-8V13z" fill="currentColor"/></svg>`;
    case 'bazooka':
      return `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M5 17.5l7 1.2v-2.2h30v1.2l5-3.2 12 5.5-12 5.5-5-3.2v1.2H12v-2.2L5 22.5v-5zm17 6h5v8.5h-4.2L22 23.5zm12 0h4.2l1.6 7.2h-4.4L34 23.5z" fill="currentColor"/></svg>`;
    default:
      return '';
  }
}

function buildWeaponWheelHTML() {
  const size = 420;
  const cx = 210;
  const cy = 210;
  const innerR = 94;
  const outerR = 198;
  const n = WEAPONS.length;
  const step = (Math.PI * 2) / n;
  const gap = 0.032;

  const wedgesSvg = WEAPONS.map((w, i) => {
    const mid = -Math.PI / 2 + i * step;
    const a0 = mid - step / 2 + gap;
    const a1 = mid + step / 2 - gap;
    const x0o = cx + Math.cos(a0) * outerR;
    const y0o = cy + Math.sin(a0) * outerR;
    const x1o = cx + Math.cos(a1) * outerR;
    const y1o = cy + Math.sin(a1) * outerR;
    const x1i = cx + Math.cos(a1) * innerR;
    const y1i = cy + Math.sin(a1) * innerR;
    const x0i = cx + Math.cos(a0) * innerR;
    const y0i = cy + Math.sin(a0) * innerR;
    const d = `M ${x0o.toFixed(2)} ${y0o.toFixed(2)} A ${outerR} ${outerR} 0 0 1 ${x1o.toFixed(2)} ${y1o.toFixed(2)} L ${x1i.toFixed(2)} ${y1i.toFixed(2)} A ${innerR} ${innerR} 0 0 0 ${x0i.toFixed(2)} ${y0i.toFixed(2)} Z`;
    return `<path class="v3-ww-wedge" data-ww-wedge="${i}" d="${d}" />`;
  }).join('');

  const itemsHtml = WEAPONS.map((w, i) => {
    const mid = -Math.PI / 2 + i * step;
    const iconR = 146;
    const px = ((cx + Math.cos(mid) * iconR) / size) * 100;
    const py = ((cy + Math.sin(mid) * iconR) / size) * 100;
    return `
      <button class="v3-ww-slot" type="button" data-ww-slot="${i}" style="left:${px.toFixed(2)}%;top:${py.toFixed(2)}%" aria-label="${w.label}">
        <span class="v3-ww-key">${w.key}</span>
        <span class="v3-ww-ico">${getWeaponWheelSvg(w.id)}</span>
        <span class="v3-ww-lbl">${w.name}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="v3-ww-ov" data-weapon-wheel hidden role="dialog" aria-label="Weapon Wheel">
      <div class="v3-ww-shell" data-ww-shell>
        <svg class="v3-ww-svg" viewBox="0 0 ${size} ${size}" aria-hidden="true">
          <circle class="v3-ww-outer-rim" cx="${cx}" cy="${cy}" r="${outerR + 4}" />
          ${wedgesSvg}
        </svg>
        <div class="v3-ww-items">${itemsHtml}</div>
        <div class="v3-ww-hub">
          <div class="v3-ww-cat" data-ww-cat>UNARMED</div>
          <div class="v3-ww-title" data-ww-title>FISTS (MELEE)</div>
          <div class="v3-ww-ammo" data-ww-ammo>MELEE</div>
          <div class="v3-ww-stats">
            <div class="v3-ww-stat"><span>DMG</span><i class="v3-ww-track"><b data-ww-dmg style="width:22%"></b></i></div>
            <div class="v3-ww-stat"><span>RATE</span><i class="v3-ww-track"><b data-ww-rate style="width:72%"></b></i></div>
            <div class="v3-ww-stat"><span>RNG</span><i class="v3-ww-track"><b data-ww-range style="width:10%"></b></i></div>
            <div class="v3-ww-stat"><span>ACC</span><i class="v3-ww-track"><b data-ww-acc style="width:95%"></b></i></div>
          </div>
        </div>
        <div class="v3-ww-hint">MOVE MOUSE / SCROLL · RELEASE TAB OR CLICK TO EQUIP · ESC CANCEL</div>
      </div>
    </div>
  `;
}

const TIME_PRESETS = [
  {
    id: 'sunset', label: 'Sunset', icon: '☀', hour: 18.25,
    sunDir: new THREE.Vector3(0.42, 0.24, -0.87).normalize(),
    horizon: 0xfa8a5c, lower: 0xc26680, mid: 0x3d6bb8, zenith: 0x143075,
    sunGlow: 0xffb866, fog: 0x7c5e74, skyTint: 0xf28f61,
    sunCol: 0xffce8f, sunInt: 2.55, hemiSky: 0x88b4e8, hemiGnd: 0x5c423e, hemiInt: 0.78,
    fillInt: 0.48, nightMix: 0.0, exposure: 1.12
  },
  {
    id: 'noon', label: 'Day', icon: '☼', hour: 13.0,
    sunDir: new THREE.Vector3(0.26, 0.84, -0.48).normalize(),
    horizon: 0xaadbf5, lower: 0x6cb8ec, mid: 0x3386d8, zenith: 0x1656aa,
    sunGlow: 0xfff2cc, fog: 0x9bc2db, skyTint: 0x8cd0f2,
    sunCol: 0xfff8e6, sunInt: 2.75, hemiSky: 0xcce8ff, hemiGnd: 0x76685a, hemiInt: 0.82,
    fillInt: 0.52, nightMix: 0.0, exposure: 1.08
  },
  {
    id: 'night', label: 'Night', icon: '☾', hour: 23.0,
    sunDir: new THREE.Vector3(-0.35, 0.52, -0.78).normalize(),
    horizon: 0x1e183a, lower: 0x14122e, mid: 0x0b0e24, zenith: 0x040614,
    sunGlow: 0x8cb8ff, fog: 0x16132b, skyTint: 0x262854,
    sunCol: 0x8eb4f0, sunInt: 0.76, hemiSky: 0x3a4a82, hemiGnd: 0x1b1428, hemiInt: 0.56,
    fillInt: 0.34, nightMix: 1.0, exposure: 1.16
  },
  {
    id: 'dawn', label: 'Dawn', icon: '◐', hour: 6.0,
    sunDir: new THREE.Vector3(0.76, 0.19, -0.62).normalize(),
    horizon: 0xffa6b8, lower: 0xc87ea6, mid: 0x526cb0, zenith: 0x1c2b66,
    sunGlow: 0xffc4a8, fog: 0x8d7594, skyTint: 0xeba0b2,
    sunCol: 0xffd2b8, sunInt: 2.05, hemiSky: 0x9cb8f0, hemiGnd: 0x544458, hemiInt: 0.74,
    fillInt: 0.46, nightMix: 0.12, exposure: 1.10
  }
];

// Chronological 24-hour keyframe stops for continuous smooth automatic Day/Night cycle
const DAY_CYCLE_STOPS = [
  { hour: 0.0,  preset: 2 }, // Midnight (Night)
  { hour: 5.5,  preset: 3 }, // Sunrise (Dawn)
  { hour: 12.5, preset: 1 }, // High Noon (Day)
  { hour: 18.25, preset: 0 }, // Golden Hour (Sunset)
  { hour: 22.0, preset: 2 }, // Late Evening (Night)
  { hour: 24.0, preset: 2 }  // Wrap Midnight
];
const _cycColA = new THREE.Color();
const _cycColB = new THREE.Color();
const _cycDirTmp = new THREE.Vector3();

const WEATHER_PRESETS = [
  { id: 'clear', label: 'Hazy Sun', icon: '☀', rain: 0.0,  fogMult: 1.0,  dark: 0.0 },
  { id: 'haze',  label: 'Mist',     icon: '☁', rain: 0.0,  fogMult: 1.52, dark: 0.22 },
  { id: 'rain',  label: 'Rain',     icon: '☂', rain: 0.72, fogMult: 1.78, dark: 0.56 },
  { id: 'storm', label: 'Storm',    icon: '⚡', rain: 1.0,  fogMult: 2.15, dark: 0.86 }
];

const HAIR_STYLES = [
  { id: 'tommy',  name: '1986 Swept Pompadour', sub: 'Classic Vice City signature wave', price: 0 },
  { id: 'slick',  name: 'Miami Executive Slick', sub: 'Swept-back Ocean Drive kingpin cut', price: 45 },
  { id: 'buzz',   name: 'Tactical Buzz Fade',   sub: 'Clean low-profile street fade', price: 35 },
  { id: 'afro',   name: 'Disco Crown Afro',     sub: 'Malibu Club retro volume', price: 60 },
  { id: 'mohawk', name: 'Neon Punk Mohawk',     sub: 'Spiked Vice Point rebel crest', price: 75 },
  { id: 'mullet', name: 'Sunset Beach Mullet',  sub: 'Business front, boardwalk back', price: 55 },
  { id: 'dreads', name: 'Island Locs',          sub: 'Tropical braided Vice Key locs', price: 85 }
];

const HAIR_COLORS = [
  { id: 'espresso', name: 'Dark Espresso', hex: '#261a14' },
  { id: 'jet',      name: 'Jet Black',     hex: '#121216' },
  { id: 'chestnut', name: 'Sun Chestnut',  hex: '#5c3620' },
  { id: 'blonde',   name: 'Beach Blonde',  hex: '#d9b566' },
  { id: 'silver',   name: 'Platinum',      hex: '#cfd6e2' },
  { id: 'pink',     name: 'Vice Neon',     hex: '#ff2e88' },
  { id: 'cyan',     name: 'Malibu Cyan',   hex: '#21e6d1' }
];

const OUTFIT_CATALOG = [
  { id: 'hawaiian',    name: 'Ocean Beach Hawaiian',  sub: 'Teal palm shirt & washed denim', price: 0 },
  { id: 'miami_suit',  name: 'Pastel Miami Suit',     sub: 'White linen blazer & neon pink tee', price: 180 },
  { id: 'street_pink', name: 'Malibu Club Nights',    sub: 'Magenta silk shirt & dark slacks', price: 140 },
  { id: 'sunset_surf', name: 'Boardwalk Sunset',      sub: 'Coral resort shirt & cream chinos', price: 120 },
  { id: 'black_tux',   name: 'Midnight Vice Tux',     sub: 'Tailored noir tuxedo & crimson tie', price: 280 },
  { id: 'tactical',    name: 'Bayside Tactical',      sub: 'Armored dark jacket & cargo pants', price: 240 },
  { id: 'gold_boss',   name: 'Kingpin Gold Blazer',   sub: '24K gold jacket & obsidian trousers', price: 420 }
];

const SHADE_STYLES = [
  { id: 'aviator', name: 'Gold Aviators',   price: 0 },
  { id: 'pink',    name: 'Vice Pink Tint',  price: 40 },
  { id: 'dark',    name: 'Noir Wayfarers',  price: 40 },
  { id: 'none',    name: 'No Sunglasses',   price: 0 }
];

const TV_CHANNELS = [
  { id: 'news',    label: 'CH 04 · VICE NEWS' },
  { id: 'weather', label: 'CH 07 · LEONIDA SKY' },
  { id: 'race',    label: 'CH 12 · VICE TURBO' },
  { id: 'synth',   label: 'CH 86 · WAVE VISUAL' }
];

const CORE_WAYPOINTS = [
  { id: 'start', label: 'Ocean Dr', zone: 'Ocean Drive South', county: 'Vice-Dale County', x: 3.2, z: 6, yaw: 0 },
  { id: 'fix-my-itch', label: '01 FixMyItch', zone: 'Ocean Beach', county: 'Vice-Dale County', x: -4.2, z: -82, yaw: 0 },
  { id: 'magic-checkout', label: '02 Magic Checkout', zone: 'Waning Sands Beachfront', county: 'Leonard County', x: 117.0, z: -1908, yaw: 0 },
  { id: 'agentic-payments', label: '03 Agentic Payments', zone: 'Port Gellhorn Downtown', county: 'Kelly County', x: -1963.0, z: -1222, yaw: 0 },
  { id: 'ai-launches', label: '04 AI Impact', zone: 'Ambrosia Downtown', county: 'Leonard County', x: -963.0, z: -1790, yaw: 0 },
  { id: 'pier', label: 'Carnival Pier', zone: 'Vice Pier Carnival', county: 'Vice-Dale County', x: 24, z: -430, yaw: -Math.PI / 2 },
  { id: 'journey', label: '05 Journey App', zone: 'Key Lento Village', county: 'Leonida Keys', x: -443.0, z: 1320, yaw: 0 },
  { id: 'vice-key', label: 'Vice Key', zone: 'Vice Key Island', county: 'Vice-Dale County', x: 144, z: -620, yaw: -Math.PI / 2 },
  { id: 'prawn-island', label: 'Prawn Studios', zone: 'Prawn Island', county: 'Vice-Dale County', x: 148, z: -940, yaw: -Math.PI / 2 },
  { id: 'north-mall', label: 'North Point Mall [IN]', zone: 'North Point Mall', county: 'Vice-Dale County', x: -13.0, z: -1018, yaw: Math.PI / 2 },
  { id: 'little-haiti', label: 'Little Haiti', zone: 'Little Haiti', county: 'Vice-Dale County', x: -384, z: -380, yaw: 0 },
  { id: 'vice-port', label: 'Vice Port', zone: 'Vice Port Docks', county: 'Vice-Dale County', x: -480, z: -140, yaw: 0 },
  { id: 'south-marina', label: 'South Marina', zone: 'Ocean Bay Marina', county: 'Vice-Dale County', x: -4.2, z: 260, yaw: 0 },
  { id: 'ocean-view', label: 'Ocean View Safehouse [IN]', zone: 'Ocean View Hotel Safehouse', county: 'Vice-Dale County', x: -13.0, z: -48, yaw: Math.PI / 2 },
  { id: 'barber-ocean', label: 'Vice Cuts Barber [IN]', zone: 'Ocean Beach Barber Shop', county: 'Vice-Dale County', x: -13.0, z: -221, yaw: Math.PI / 2 },
  { id: 'clothes-vice', label: 'Vice Couture Clothes [IN]', zone: 'Vice Point Boutique', county: 'Vice-Dale County', x: -13.0, z: -384, yaw: Math.PI / 2 },
  { id: 'barber-north', label: 'North Point Barber [IN]', zone: 'Vice Heights Barber Shop', county: 'Vice-Dale County', x: -13.0, z: -707, yaw: Math.PI / 2 },
  { id: 'clothes-gash', label: 'Gash Clothes [IN]', zone: 'North Vice Designer Store', county: 'Vice-Dale County', x: -13.0, z: -808, yaw: Math.PI / 2 },
  { id: 'ammunation', label: 'Ammu-Nation [IN]', zone: 'Ammu-Nation', county: 'Vice-Dale County', x: -13.0, z: -190, yaw: Math.PI / 2 },
  { id: 'malibu-club', label: 'Malibu Club [IN]', zone: 'Malibu Club', county: 'Vice-Dale County', x: -13.0, z: -344, yaw: Math.PI / 2 },
  { id: 'airport', label: 'Int’l Airport [FLY]', zone: "Vice Int'l Airport", county: 'Vice-Dale County', x: -46, z: 66, yaw: 0 },
  { id: 'forest', label: 'Vice Pines Forest', zone: 'Vice Pines Forest', county: 'Vice-Dale County', x: -418, z: -1036, yaw: 0 },
  { id: 'village', label: 'Vice Hollow Village', zone: 'Vice Hollow Community', county: 'Vice-Dale County', x: -382, z: -1178, yaw: 0 },
  { id: 'mount-vice', label: 'Mount Vice [118M]', zone: 'Mount Vice Summit', county: 'Vice-Dale County', x: -228, z: -1422, yaw: Math.PI },
  { id: 'sierra-west', label: 'Sierra West [96M]', zone: 'Sierra West Peaks', county: 'Vice-Dale County', x: -772, z: -206, yaw: -Math.PI / 2 }
];

const LEONIDA_WAYPOINTS = LEONIDA_PLACES.map((pl) => ({
  id: pl.id,
  label: pl.name,
  zone: `${pl.county}${pl.note ? ' · ' + pl.note : ''}`,
  county: pl.county,
  kind: pl.kind,
  x: pl.x,
  z: pl.z,
  yaw: pl.yaw || 0,
  isLeonida: true
}));

const WAYPOINTS = [...CORE_WAYPOINTS, ...LEONIDA_WAYPOINTS];
const DOCK_FEATURED_IDS = new Set([
  'leaf-links', 'waning-sands', 'lake-leonida', 'mount-kalaga',
  'port-gellhorn', 'ambrosia-raceway', 'leonida-prison', 'key-lento'
]);
const DOCK_WAYPOINTS = [
  ...CORE_WAYPOINTS,
  ...LEONIDA_WAYPOINTS.filter((w) => DOCK_FEATURED_IDS.has(w.id))
];

/* ==========================================================================
   DUAL ROADABLE MOUNTAIN RANGES — ZERO DEAD ENDS! (MOUNT CHILIAD SCALE)
   1) MOUNT VICE (NORTH, Z = -1106..-1496): Full continuous alpine loop from
      Ocean Drive North (X=0) -> 118m Summit -> West Descent -> Vice Port Expy (X=-480)!
   2) SIERRA WEST (WEST, X = -885..-492, Z = -760..+240): Completely separate
      redrock canyon & redwood mountain range looping Vice Port North (-486,-540)
      -> 96m Redrock Overlook (-772,-210) -> Vice Port South (-486,-60)!
   ========================================================================== */
const MOUNT_VICE_ANCHORS = [
  { x: 0,    z: -1106, y: 0.0 },
  { x: -2,   z: -1146, y: 6.2 },
  { x: -20,  z: -1188, y: 18.4 },
  { x: -84,  z: -1218, y: 32.5 },
  { x: -184, z: -1236, y: 47.0 },
  { x: -290, z: -1262, y: 61.8 },
  { x: -332, z: -1302, y: 75.2 },
  { x: -252, z: -1336, y: 88.4 },
  { x: -146, z: -1356, y: 99.6 },
  { x: -144, z: -1398, y: 110.2 },
  { x: -198, z: -1426, y: 116.6 },
  { x: -228, z: -1432, y: 118.0 }, // 118m Towering Mount Vice Summit Overlook!
  // Continuous West Alpine Descent Loop back onto flat Vice Port Expy (ZERO DEAD END!)
  { x: -316, z: -1410, y: 101.0 },
  { x: -404, z: -1366, y: 75.5 },
  { x: -464, z: -1298, y: 44.8 },
  { x: -478, z: -1216, y: 17.2 },
  { x: -480, z: -1152, y: 4.0 },
  { x: -480, z: -1106, y: 0.0 }
];
const MOUNT_VICE_CURVE = new THREE.CatmullRomCurve3(
  MOUNT_VICE_ANCHORS.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
  false,
  'catmullrom',
  0.42
);
const MOUNT_VICE_ROAD = MOUNT_VICE_CURVE.getSpacedPoints(185);

const SIERRA_WEST_ANCHORS = [
  { x: -486, z: -540, y: 0.0 },
  { x: -534, z: -540, y: 10.6 },
  { x: -608, z: -518, y: 31.5 },
  { x: -694, z: -464, y: 55.6 },
  { x: -762, z: -372, y: 77.8 },
  { x: -784, z: -278, y: 91.6 },
  { x: -772, z: -210, y: 96.0 }, // 96m Towering Sierra West Redrock Summit Overlook!
  { x: -746, z: -134, y: 78.6 },
  { x: -678, z: -82,  y: 52.8 },
  { x: -598, z: -64,  y: 26.0 },
  { x: -532, z: -60,  y: 7.6 },
  { x: -486, z: -60,  y: 0.0 }   // Reconnects cleanly back onto Vice Port South!
];
const SIERRA_WEST_CURVE = new THREE.CatmullRomCurve3(
  SIERRA_WEST_ANCHORS.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
  false,
  'catmullrom',
  0.42
);
const SIERRA_WEST_ROAD = SIERRA_WEST_CURVE.getSpacedPoints(150);

function _closestRoadPts(pts, x, z) {
  let bestDistSq = Infinity;
  let bestY = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const lenSq = abx * abx + abz * abz;
    const t = lenSq > 1e-6 ? THREE.MathUtils.clamp(((x - a.x) * abx + (z - a.z) * abz) / lenSq, 0, 1) : 0;
    const dx = x - (a.x + abx * t);
    const dz = z - (a.z + abz * t);
    const dSq = dx * dx + dz * dz;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestY = a.y + (b.y - a.y) * t;
    }
  }
  return { dist: Math.sqrt(bestDistSq), roadY: bestY };
}

function closestMountainRoad(x, z) {
  return _closestRoadPts(MOUNT_VICE_ROAD, x, z);
}

function closestSierraRoad(x, z) {
  return _closestRoadPts(SIERRA_WEST_ROAD, x, z);
}

function closestAnyMountainRoad(x, z) {
  if (z < -1104) return closestMountainRoad(x, z);
  if (x < -484 && z > -765 && z < 245) return closestSierraRoad(x, z);
  return { dist: 999, roadY: 0 };
}

function getTerrainHeight(x, z) {
  // 1) NORTHERN MOUNT VICE RANGE (Strict footprint X in [-506, 44], Z in [-1498, -1106], 118m Alpine Peak!)
  if (z < -1106 && z > -1498 && x > -506 && x < 44) {
    const roadHit = closestMountainRoad(x, z);
    const dSummitMv = Math.hypot(x + 228, z + 1432);
    const mvDeckH = dSummitMv < 22.0
      ? (dSummitMv <= 17.6 ? 118.14 : THREE.MathUtils.lerp(118.14, roadHit.roadY, (dSummitMv - 17.6) / 4.4))
      : 0;
    if (roadHit.dist <= 7.6) return Math.max(0, roadHit.roadY, mvDeckH);

    const northT = THREE.MathUtils.clamp((-1106 - z) / 56, 0, 1);
    const apron = northT * northT * (3 - 2 * northT);

    const dMainSq  = ((x + 228) * (x + 228)) / (172 * 172) + ((z + 1432) * (z + 1432)) / (148 * 148);
    const dWestSq  = ((x + 392) * (x + 392)) / (112 * 112) + ((z + 1358) * (z + 1358)) / (108 * 108);
    const dFarWSq  = ((x + 468) * (x + 468)) / (84 * 84)   + ((z + 1292) * (z + 1292)) / (86 * 86);
    const dEastSq  = ((x + 58)  * (x + 58))  / (92 * 92)   + ((z + 1318) * (z + 1318)) / (94 * 94);
    const dNeSq    = ((x - 16)  * (x - 16))  / (78 * 78)   + ((z + 1396) * (z + 1396)) / (84 * 84);
    const dKnollSq = ((x + 152) * (x + 152)) / (76 * 76)   + ((z + 1184) * (z + 1184)) / (64 * 64);

    let h =
      Math.exp(-dMainSq) * 121.0 +
      Math.exp(-dWestSq) * 82.0 +
      Math.exp(-dFarWSq) * 62.0 +
      Math.exp(-dEastSq) * 60.0 +
      Math.exp(-dNeSq) * 71.0 +
      Math.exp(-dKnollSq) * 34.0;
    h += (Math.sin(x * 0.042) * Math.cos(z * 0.048) + Math.sin((x + z) * 0.025) * 0.7) * 5.2 * apron;
    h = Math.max(0, h * apron);

    // Level Scenic Valley Terrace for Vice Hollow Community Village (X = -448..-308, Z = -1236..-1148)
    const vdx = Math.max(0, Math.max(-446 - x, x - (-308)));
    const vdz = Math.max(0, Math.max(-1234 - z, z - (-1148)));
    const vDist = Math.hypot(vdx, vdz);
    if (vDist < 28) {
      const vt = THREE.MathUtils.clamp((28 - vDist) / 22, 0, 1);
      const vb = vt * vt * (3 - 2 * vt);
      h = THREE.MathUtils.lerp(h, 2.0, vb);
    }

    const dSummit = Math.hypot(x + 228, z + 1432);
    if (dSummit < 28) {
      const st = THREE.MathUtils.clamp((28 - dSummit) / 11, 0, 1);
      const sb = st * st * (3 - 2 * st);
      h = THREE.MathUtils.lerp(h, 118.0, sb);
    }

    if (roadHit.dist < 24.0) {
      const rt = THREE.MathUtils.clamp((24.0 - roadHit.dist) / 16.4, 0, 1);
      const rb = rt * rt * (3 - 2 * rt);
      h = THREE.MathUtils.lerp(h, roadHit.roadY, rb);
    }
    return Math.max(0, h, mvDeckH);
  }

  // 2) SEPARATE WESTERN MOUNTAIN RANGE — SIERRA WEST REDROCK PEAKS (Strict footprint X in [-886, -492], Z in [-760, 240], 96m Peak!)
  if (x < -492 && x > -886 && z > -760 && z < 240) {
    const roadHit = closestSierraRoad(x, z);
    const dSummitSw = Math.hypot(x + 772, z + 210);
    const swDeckH = dSummitSw < 20.0
      ? (dSummitSw <= 15.6 ? 96.14 : THREE.MathUtils.lerp(96.14, roadHit.roadY, (dSummitSw - 15.6) / 4.4))
      : 0;
    if (roadHit.dist <= 7.6) return Math.max(0, roadHit.roadY, swDeckH);

    const westT = THREE.MathUtils.clamp((-492 - x) / 52, 0, 1);
    const northFade = THREE.MathUtils.clamp((z - (-760)) / 65, 0, 1);
    const southFade = THREE.MathUtils.clamp((240 - z) / 65, 0, 1);
    const smooth = (t) => t * t * (3 - 2 * t);
    const apron = smooth(westT) * smooth(northFade) * smooth(southFade);

    const dPeakSq  = ((x + 772) * (x + 772)) / (155 * 155) + ((z + 210) * (z + 210)) / (195 * 195);
    const dNorthSq = ((x + 738) * (x + 738)) / (128 * 128) + ((z + 520) * (z + 520)) / (145 * 145);
    const dSouthSq = ((x + 725) * (x + 725)) / (125 * 125) + ((z - 45)  * (z - 45))  / (135 * 135);
    const dRidgeSq = ((x + 618) * (x + 618)) / (95 * 95)   + ((z + 305) * (z + 305)) / (155 * 155);

    let h =
      Math.exp(-dPeakSq) * 101.5 +
      Math.exp(-dNorthSq) * 84.0 +
      Math.exp(-dSouthSq) * 74.0 +
      Math.exp(-dRidgeSq) * 46.0;
    h += (Math.sin(x * 0.038 + 1.1) * Math.cos(z * 0.044) + Math.sin((x - z) * 0.022) * 0.65) * 4.6 * apron;
    h = Math.max(0, h * apron);

    const dSummit = Math.hypot(x + 772, z + 210);
    if (dSummit < 25) {
      const st = THREE.MathUtils.clamp((25 - dSummit) / 10, 0, 1);
      h = THREE.MathUtils.lerp(h, 96.0, smooth(st));
    }

    if (roadHit.dist < 24.0) {
      const rt = THREE.MathUtils.clamp((24.0 - roadHit.dist) / 16.4, 0, 1);
      h = THREE.MathUtils.lerp(h, roadHit.roadY, smooth(rt));
    }
    return Math.max(0, h, swDeckH);
  }

  if (isInCoreViceFootprint(x, z)) return 0;
  return Math.max(0, getLeonidaElevation(x, z));
}

/* ==========================================================================
   O(1) ZERO-ALLOCATION SPATIAL HASH GRID FOR SOLID COLLIDERS
   - Replaces O(N) scans over 1,800+ colliders with instant local neighborhood
     queries so 8x substepped continuous collision runs at rock-solid 60 FPS!
   ========================================================================== */
class SpatialColliderGrid {
  constructor(cellSize = 24) {
    this.cellSize = cellSize;
    this.inv = 1 / cellSize;
    this.boxes = new Map();
    this.circles = new Map();
    this._stamp = 0;
    this._boxOut = [];
    this._cirOut = [];
  }
  _key(cx, cz) {
    return ((cx + 512) << 12) ^ (cz + 512);
  }
  addBox(b) {
    b._q = 0;
    const x0 = Math.floor(b.minX * this.inv), x1 = Math.floor(b.maxX * this.inv);
    const z0 = Math.floor(b.minZ * this.inv), z1 = Math.floor(b.maxZ * this.inv);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const k = this._key(cx, cz);
        let bucket = this.boxes.get(k);
        if (!bucket) { bucket = []; this.boxes.set(k, bucket); }
        bucket.push(b);
      }
    }
  }
  addCircle(c) {
    c._q = 0;
    const x0 = Math.floor((c.x - c.r) * this.inv), x1 = Math.floor((c.x + c.r) * this.inv);
    const z0 = Math.floor((c.z - c.r) * this.inv), z1 = Math.floor((c.z + c.r) * this.inv);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const k = this._key(cx, cz);
        let bucket = this.circles.get(k);
        if (!bucket) { bucket = []; this.circles.set(k, bucket); }
        bucket.push(c);
      }
    }
  }
  queryBoxes(x, z, rad) {
    const out = this._boxOut;
    out.length = 0;
    const st = ++this._stamp;
    const x0 = Math.floor((x - rad) * this.inv), x1 = Math.floor((x + rad) * this.inv);
    const z0 = Math.floor((z - rad) * this.inv), z1 = Math.floor((z + rad) * this.inv);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const bucket = this.boxes.get(this._key(cx, cz));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const b = bucket[i];
          if (b._q !== st) { b._q = st; out.push(b); }
        }
      }
    }
    return out;
  }
  queryCircles(x, z, rad) {
    const out = this._cirOut;
    out.length = 0;
    const st = ++this._stamp;
    const x0 = Math.floor((x - rad) * this.inv), x1 = Math.floor((x + rad) * this.inv);
    const z0 = Math.floor((z - rad) * this.inv), z1 = Math.floor((z + rad) * this.inv);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const bucket = this.circles.get(this._key(cx, cz));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const c = bucket[i];
          if (c._q !== st) { c._q = st; out.push(c); }
        }
      }
    }
    return out;
  }
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
    id: 'fix-my-itch', num: '01', district: 'Ocean Beach · Vice City', title: 'FixMyItch',
    stat: 'Awwwards Nominee · Framer Showcase · Razorpay',
    desc: 'Tactile interactive campaign transforming merchant payment friction into an award-winning product showcase.',
    img: '/assets/images/mockup-fix-my-itch.webp', url: '/fix-my-itch/',
    accent: 0xff2e88, accentHex: '#FF2E88', x: -17.0, z: -82, rotY: 0, parkX: -4.2, parkZ: -82
  },
  {
    id: 'magic-checkout', num: '02', district: 'Waning Sands · Leonard County', title: 'Magic Checkout',
    stat: '5x Faster Checkout · 12 Interactive Islands',
    desc: 'High-craft conversion showcase demonstrating 1-click checkout speed and intelligent RTO protection.',
    img: '/assets/images/mockup-magic-checkout-v3.webp', url: '/magic-checkout/',
    accent: 0x21e6d1, accentHex: '#21E6D1', x: 103.0, z: -1908, rotY: 0, parkX: 117.0, parkZ: -1908
  },
  {
    id: 'agentic-payments', num: '03', district: 'Port Gellhorn · Kelly County', title: 'Agentic Payments',
    stat: 'AI Agent MCP Protocol · Multi-Device Launch',
    desc: 'Product storytelling and interactive system launch for Razorpay’s autonomous AI-native commerce stack.',
    img: '/assets/images/mockup-agentic-payments.webp', url: '/razorpay-agentic-payments/',
    accent: 0xff8a2a, accentHex: '#FF8A2A', x: -1977.0, z: -1222, rotY: 0, parkX: -1963.0, parkZ: -1222
  },
  {
    id: 'ai-launches', num: '04', district: 'Ambrosia · Lake Leonida', title: 'India AI Impact',
    stat: '4 Live AI Unveils · 14-Day Sprint · Summit',
    desc: 'Rapid-turnaround keynote launchpad unveiling four flagship AI payment products live at Bharat Mandapam.',
    img: '/assets/images/mockup-ai-launches.webp', url: '/razorpay-ai-launches/',
    accent: 0x21e6d1, accentHex: '#21E6D1', x: -977.0, z: -1790, rotY: 0, parkX: -963.0, parkZ: -1790
  },
  {
    id: 'journey', num: '05', district: 'Key Lento · Leonida Keys', title: 'Journey App',
    stat: 'Multi-City India Planner · Conflict Auto-Fix',
    desc: 'Calm mobile travel companion unifying multi-leg flights, stays, and live itinerary conflict resolution.',
    img: '/assets/images/journey-cover-v2.jpg', url: '/journey/',
    accent: 0xffd36b, accentHex: '#FFD36B', x: -457.0, z: 1320, rotY: 0, parkX: -443.0, parkZ: 1320
  }
];

const CONTACT_SHOWROOM = {
  id: 'contact', num: '★', district: 'Vice Beach Promenade', title: 'Akshat Singh',
  stat: 'Staff Product Designer · Razorpay · Bengaluru',
  desc: 'Staff Product Designer at Razorpay crafting interactive product storytelling, AI-native workflows, and high-conversion commerce systems.',
  img: '/assets/images/home-1.webp', url: 'mailto:akshat018singh@gmail.com',
  accent: 0xffd36b, accentHex: '#FFD36B', x: 24.5, z: -540, parkX: 11.5, parkZ: -540
};

const CAM_MODES = ['Chase', 'Low', 'Hood', 'Drone'];
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _tmpCol = new THREE.Color();
const _tmpCol2 = new THREE.Color();

function buildPortfolioSpeedoSVG() {
  return `
    <svg viewBox="0 0 410 200" aria-hidden="true">
      <defs>
        <linearGradient id="v3SpdCh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f4f4fa"/>
          <stop offset=".25" stop-color="#7d7d8c"/>
          <stop offset=".5" stop-color="#e2e2ec"/>
          <stop offset=".75" stop-color="#55555f"/>
          <stop offset="1" stop-color="#c9c9d6"/>
        </linearGradient>
        <radialGradient id="v3SpdFc" cx=".5" cy=".42" r=".65">
          <stop offset="0" stop-color="#262633"/>
          <stop offset=".7" stop-color="#0d0d15"/>
          <stop offset="1" stop-color="#050509"/>
        </radialGradient>
        <linearGradient id="v3SpdGl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g>
        <circle cx="100" cy="100" r="99" fill="#000"/>
        <circle cx="100" cy="100" r="97" fill="url(#v3SpdCh)"/>
        <circle cx="100" cy="100" r="92.5" fill="#050509"/>
        <circle cx="100" cy="100" r="91" fill="url(#v3SpdFc)"/>
        <path d="M188.57 91.28A89 89 0 0 1 162.93 162.93" fill="none" stroke="#ff3b4a" stroke-width="2.4" stroke-linecap="butt"/>
        <line x1="39.19" y1="160.81" x2="49.80" y2="150.20" stroke="#e8e8f2" stroke-width="2.2"/><text x="58.28" y="144.72" class="spd-t">0</text>
        <line x1="24.15" y1="140.54" x2="30.33" y2="137.24" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="15.65" y1="116.78" x2="30.36" y2="113.85" stroke="#e8e8f2" stroke-width="2.2"/><text x="42.13" y="114.51" class="spd-t">1</text>
        <line x1="14.41" y1="91.57" x2="21.38" y2="92.26" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="20.55" y1="67.09" x2="34.40" y2="72.83" stroke="#e8e8f2" stroke-width="2.2"/><text x="45.49" y="80.42" class="spd-t">2</text>
        <line x1="33.52" y1="45.44" x2="38.93" y2="49.88" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="52.22" y1="28.49" x2="60.55" y2="40.97" stroke="#e8e8f2" stroke-width="2.2"/><text x="67.22" y="53.94" class="spd-t">3</text>
        <line x1="75.04" y1="17.70" x2="77.07" y2="24.40" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="100.00" y1="14.00" x2="100.00" y2="29.00" stroke="#e8e8f2" stroke-width="2.2"/><text x="100.00" y="44.00" class="spd-t">4</text>
        <line x1="124.96" y1="17.70" x2="122.93" y2="24.40" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="147.78" y1="28.49" x2="139.45" y2="40.97" stroke="#e8e8f2" stroke-width="2.2"/><text x="132.78" y="53.94" class="spd-t">5</text>
        <line x1="166.48" y1="45.44" x2="161.07" y2="49.88" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="179.45" y1="67.09" x2="165.60" y2="72.83" stroke="#e8e8f2" stroke-width="2.2"/><text x="154.51" y="80.42" class="spd-t">6</text>
        <line x1="185.59" y1="91.57" x2="178.62" y2="92.26" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="184.35" y1="116.78" x2="169.64" y2="113.85" stroke="#ff3b4a" stroke-width="2.2"/><text x="157.87" y="114.51" class="spd-t r">7</text>
        <line x1="175.85" y1="140.54" x2="169.67" y2="137.24" stroke="#ff3b4a" stroke-width="1.1"/>
        <line x1="160.81" y1="160.81" x2="150.20" y2="150.20" stroke="#ff3b4a" stroke-width="2.2"/><text x="141.72" y="144.72" class="spd-t r">8</text>
        <text x="100" y="124" class="spd-lim tch" text-anchor="middle">RPM x1000</text>
        <text x="100" y="152" class="spd-num tch-g" data-gear text-anchor="middle">N</text>
        <text x="100" y="165" class="spd-u" data-tch-u text-anchor="middle">GEAR</text>
        <g class="v3-tch-needle" data-tach-needle transform="rotate(135 100 100)">
          <polygon points="100,97.6 176,99.3 176,100.7 100,102.4" fill="#ff8a2a"/>
          <polygon points="100,97.2 86,98.4 86,101.6 100,102.8" fill="#ff8a2a"/>
        </g>
        <circle cx="100" cy="100" r="10" fill="url(#v3SpdCh)"/>
        <circle cx="100" cy="100" r="6" fill="#14141c"/>
        <circle cx="100" cy="100" r="2" fill="#ff8a2a"/>
        <path d="M14 88A88 88 0 0 1 186 88Q100 70 14 88Z" fill="url(#v3SpdGl)"/>
      </g>
      <g transform="translate(210 0)">
        <circle cx="100" cy="100" r="99" fill="#000"/>
        <circle cx="100" cy="100" r="97" fill="url(#v3SpdCh)"/>
        <circle cx="100" cy="100" r="92.5" fill="#050509"/>
        <circle cx="100" cy="100" r="91" fill="url(#v3SpdFc)"/>
        <path d="M37.07 162.93A89 89 0 0 1 22.35 56.51" fill="none" stroke="#21e6d1" stroke-width="2.4" stroke-linecap="butt"/>
        <path d="M187.90 86.08A89 89 0 0 1 162.93 162.93" fill="none" stroke="#ff3b4a" stroke-width="2.4" stroke-linecap="butt"/>
        <line x1="39.19" y1="160.81" x2="49.80" y2="150.20" stroke="#e8e8f2" stroke-width="2.2"/><text x="58.28" y="144.72" class="spd-t">0</text>
        <line x1="26.67" y1="144.93" x2="32.64" y2="141.28" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="18.21" y1="126.58" x2="32.47" y2="121.94" stroke="#e8e8f2" stroke-width="2.2"/><text x="43.89" y="121.23" class="spd-t">20</text>
        <line x1="14.27" y1="106.75" x2="21.24" y2="106.20" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="15.06" y1="86.55" x2="29.87" y2="88.89" stroke="#e8e8f2" stroke-width="2.2"/><text x="41.73" y="93.77" class="spd-t">40</text>
        <line x1="20.55" y1="67.09" x2="27.01" y2="69.77" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="30.42" y1="49.45" x2="42.56" y2="58.27" stroke="#e8e8f2" stroke-width="2.2"/><text x="52.27" y="68.32" class="spd-t">60</text>
        <line x1="44.15" y1="34.61" x2="48.69" y2="39.93" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="60.96" y1="23.37" x2="67.77" y2="36.74" stroke="#e8e8f2" stroke-width="2.2"/><text x="73.21" y="50.43" class="spd-t">80</text>
        <line x1="79.92" y1="16.38" x2="81.56" y2="23.18" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="100.00" y1="14.00" x2="100.00" y2="29.00" stroke="#e8e8f2" stroke-width="2.2"/><text x="100.00" y="44.00" class="spd-t">100</text>
        <line x1="120.08" y1="16.38" x2="118.44" y2="23.18" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="139.04" y1="23.37" x2="132.23" y2="36.74" stroke="#e8e8f2" stroke-width="2.2"/><text x="126.79" y="50.43" class="spd-t">120</text>
        <line x1="155.85" y1="34.61" x2="151.31" y2="39.93" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="169.58" y1="49.45" x2="157.44" y2="58.27" stroke="#e8e8f2" stroke-width="2.2"/><text x="147.73" y="68.32" class="spd-t">140</text>
        <line x1="179.45" y1="67.09" x2="172.99" y2="69.77" stroke="#e8e8f2" stroke-width="1.1"/>
        <line x1="184.94" y1="86.55" x2="170.13" y2="88.89" stroke="#ff3b4a" stroke-width="2.2"/><text x="158.27" y="93.77" class="spd-t r">160</text>
        <line x1="185.73" y1="106.75" x2="178.76" y2="106.20" stroke="#ff3b4a" stroke-width="1.1"/>
        <line x1="181.79" y1="126.58" x2="167.53" y2="121.94" stroke="#ff3b4a" stroke-width="2.2"/><text x="156.11" y="121.23" class="spd-t r">180</text>
        <line x1="173.33" y1="144.93" x2="167.36" y2="141.28" stroke="#ff3b4a" stroke-width="1.1"/>
        <line x1="160.81" y1="160.81" x2="150.20" y2="150.20" stroke="#ff3b4a" stroke-width="2.2"/><text x="141.72" y="144.72" class="spd-t r">200</text>
        <line x1="24.97" y1="57.98" x2="38.05" y2="65.31" stroke="#ffd447" stroke-width="2.6"/>
        <text x="100" y="124" class="spd-lim" data-spd-lim text-anchor="middle">LIMIT 55</text>
        <text x="100" y="152" class="spd-num" data-speed text-anchor="middle">000</text>
        <text x="100" y="165" class="spd-u" data-spd-u text-anchor="middle">MPH</text>
        <g class="v3-spd-needle" data-needle transform="rotate(135 100 100)">
          <polygon points="100,97.6 176,99.3 176,100.7 100,102.4" fill="#ff3b4a"/>
          <polygon points="100,97.2 86,98.4 86,101.6 100,102.8" fill="#ff3b4a"/>
        </g>
        <circle cx="100" cy="100" r="10" fill="url(#v3SpdCh)"/>
        <circle cx="100" cy="100" r="6" fill="#14141c"/>
        <circle cx="100" cy="100" r="2" fill="#ff3b4a"/>
        <path d="M14 88A88 88 0 0 1 186 88Q100 70 14 88Z" fill="url(#v3SpdGl)"/>
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
    this.started = true;
    this.frameId = 0;
    this.frameCount = 0;
    this.paintIdx = 0;
    this.camIdx = 0;
    this.lightsOn = true;
    this.visited = new Set();
    this.activeShowroom = null;
    this.showroomAnims = [];
    this.projectsHubOpen = false;
    this.projectsHubSelectedId = SHOWROOMS[0].id;
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
    this.targetOrbitYaw = 0;
    this.targetOrbitPitch = 0;
    this._lastAppliedOrbitYaw = 0;
    this._lastAppliedOrbitPitch = 0;
    this.northPointMall = null;
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

    // Barber Shops, Clothes Stores, Ocean View Safehouse & Malibu Club Dance State
    this.oceanViewSafehouse = null;
    this.safehouseStations = [];
    this.shopInteractZones = [];
    this.barberPoles = [];
    this.activeShop = null; // { kind: 'barber'|'clothes'|'wardrobe', label, snapshot }
    this.tvOpen = false;
    this.tvChannel = 0;
    this.sleepAnimTimer = 0;
    this.isDancing = false;
    this.danceStyleIdx = 0;
    this.danceRewardTimer = 0;
    this.playerStyle = {
      hair: 'tommy',
      hairColor: '#261a14',
      outfit: 'hawaiian',
      shades: 'aviator',
      ownedHair: ['tommy'],
      ownedOutfits: ['hawaiian'],
      ownedShades: ['aviator', 'none']
    };
    try {
      const savedStyle = JSON.parse(localStorage.getItem('vice3d_style_v1') || 'null');
      if (savedStyle && typeof savedStyle === 'object') {
        if (typeof savedStyle.hair === 'string') this.playerStyle.hair = savedStyle.hair;
        if (typeof savedStyle.hairColor === 'string') this.playerStyle.hairColor = savedStyle.hairColor;
        if (typeof savedStyle.outfit === 'string') this.playerStyle.outfit = savedStyle.outfit;
        if (typeof savedStyle.shades === 'string') this.playerStyle.shades = savedStyle.shades;
        if (Array.isArray(savedStyle.ownedHair)) this.playerStyle.ownedHair = Array.from(new Set(['tommy', ...savedStyle.ownedHair]));
        if (Array.isArray(savedStyle.ownedOutfits)) this.playerStyle.ownedOutfits = Array.from(new Set(['hawaiian', ...savedStyle.ownedOutfits]));
        if (Array.isArray(savedStyle.ownedShades)) this.playerStyle.ownedShades = Array.from(new Set(['aviator', 'none', ...savedStyle.ownedShades]));
      }
    } catch (_) {}

    // Continuous Automatic Day/Night & Dynamic Weather Cycle State
    this.timeIdx = 0; // 0: Sunset, 1: Day, 2: Night, 3: Dawn
    this.dayTime = 17.6; // Continuous 24h solar clock (starts at Golden Sunset!)
    this.autoDayNight = true;
    this.weatherIdx = 0; // 0: Hazy Sun, 1: Mist, 2: Rain, 3: Storm
    this.autoWeather = true;
    this.autoWeatherTimer = 54.0; // Automatically transitions weather smoothly every ~54-72s
    this.curRainLevel = 0.0;
    this.curFogMult = 1.0;
    this.curWeatherDark = 0.0;
    this.lastAutoNightLights = false;
    this.envSunDir = SUN_DIR.clone();
    this.lightningFlash = 0;
    this.lightningCooldown = 5.0;
    this.rainLines = null;
    this.mountViceRopeway = null;
    this.worldHazeGroup = null;
    this.worldHazeMats = [];
    this._ambientWeights = { forest: 0, carnival: 0, malibu: 0, airport: 0, mall: 0 };

    // Enhancements State: Boats, Missions, Phone, Car Damage/Mods, Graphics Preset & Persistent Save
    this.boats = [];
    this.activeBoat = null;
    this.skyRings = [];
    this.skidPool = null;
    this.routeGuide = null;
    this.missionBeacon = null;
    this.activeSideMission = null;
    this.customWaypoint = null;
    this.stuntSlowMo = 0;
    this.carHealth = 100;
    this.carMods = {
      underglow: 'none',
      spoiler: false,
      goldChrome: false,
      turboStage: 0,
      rims: 'stock',
      hydraulics: false,
      hornTune: 'classic'
    };
    this.savedGarage = [];
    this.hydraulicsState = { mode: 0, bounceY: 0, bounceVel: 0, pitchOff: 0, rollOff: 0, phase: 0, pulseTimer: 0 };
    this.dynamicEvent = null;
    this.dynamicEventCooldown = 20.0;
    this._dynamicEventMeshes = [];
    this._volleyballRig = null;
    this._jetSkiGates = [];
    this._pizzaFaggio = null;
    this._vehicleModCache = new WeakMap();
    this.graphicsPreset = 'high';
    this.phoneOpen = false;
    this.phoneApp = 'home';
    this.roadMaterials = [];
    this.ammuNation = null;
    this.burgerShot = null;
    this.payNSpray = null;
    this.footstepTimer = 0;
    this.skidStampTimer = 0;
    this.missionsCompleted = 0;
    this.stuntJumpsDone = 0;
    this.ambientChase = null;
    this.loadPersistentSave();

    // Solid world collision geometry & O(1) spatial hash grid + interactive items
    this.boxColliders = [];
    this.circleColliders = [];
    this.colliderGrid = new SpatialColliderGrid(24);
    this.sierraWest = null;
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
    this.cash = 250;
    this.odometerKm = 18.4;

    // VCPD Police Chase Units, Wildlife Animals, Malibu Club Disco, Barricades, Taxi Service & Vice City Cheats!
    this.policeUnits = [];
    this.policeCops = [];
    this.policeSirenTimer = 0;
    this.policeDispatchTimer = 0;
    this.wildlife = [];
    this.malibuExtras = null;
    this.barricadeBeacons = [];
    this.taxiModalOpen = false;
    this.taxiFareMission = null;
    this.taxiDropBeacon = null;
    this.cheatBuffer = '';
    this.cheatToastTimer = 0;
    this.cheats = {
      flyingCars: false, seaways: false, grip: false, greenLight: false,
      fastTraffic: false, slowMo: false, fastMo: false, fastClock: false,
      riot: false, hostilePeds: false, armedPeds: false, fannyMagnet: false, heavyFog: false
    };

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
    this.audio.onRadioChange = () => this.updateRadioHUD();
    this.weaponWheelOpen = false;
    this.weaponWheelHover = 0;
    this.weaponWheelHoldMode = false;
    this.weaponWheelVecX = 0;
    this.weaponWheelVecY = -1;
    this.weaponWheelHadPointerLock = false;
    this.carState = {
      x: 3.2, y: 0, z: 6.0, vy: 0, airborne: false, airTime: 0,
      yaw: 0, speed: 0, steer: 0,
      wheelSpin: 0, driftSlip: 0, pitch: 0, roll: 0, popAngle: 0.56
    };
    this.keys = { up: false, down: false, left: false, right: false, nitro: false, drift: false, dive: false };

    this.buildDOM();
    this.initWebGL();
    this.bindEvents();
    this.audio.setRadioInCar(this.isInCar());
    this.updateRadioHUD();
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
        dayTime: Number((this.dayTime || 0).toFixed(3)),
        autoDayNight: Boolean(this.autoDayNight),
        weather: WEATHER_PRESETS[this.weatherIdx].id,
        autoWeather: Boolean(this.autoWeather),
        autoWeatherTimer: Number((this.autoWeatherTimer || 0).toFixed(1)),
        curRainLevel: Number((this.curRainLevel || 0).toFixed(3)),
        ropewaysCount: (this.mountViceRopeway ? 1 : 0) + (this.leonidaWorld && this.leonidaWorld.kalagaRopeway ? 1 : 0),
        radioStation: this.audio.getRadioStation().name,
        radioStep: this.audio.radioStep,
        radioInCar: this.audio.radioInCar,
        radioPlaying: this.audio.canPlayRadio(),
        radioVisible: Boolean(this.el && this.el.radioDeck && !this.el.radioDeck.hidden && !this.el.radioDeck.classList.contains('hidden-radio')),
        rjActive: Boolean(this.audio.getActiveRJ()),
        rjPaused: Boolean(this.audio.rjPausedByExit),
        rjTime: this.audio.rjAudio ? Number(this.audio.rjAudio.currentTime.toFixed(3)) : 0,
        rjRemainingMs: this.audio.rjRemainingMs,
        rjHost: this.audio.rjClip ? this.audio.rjClip.host : null,
        rjSrc: this.audio.rjClip ? this.audio.rjClip.src : null,
        ambientAudio: this.audio.getAmbientLevels(),
        weaponWheelOpen: Boolean(this.weaponWheelOpen),
        weaponWheelHover: this.weaponWheelHover,
        weaponWheelHoverId: WEAPONS[this.weaponWheelHover] ? WEAPONS[this.weaponWheelHover].id : null,
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
        hasMalibuClub: Boolean(this.malibuExtras),
        hasNorthPointMall: Boolean(this.northPointMall),
        fogDensity: this.scene && this.scene.fog ? Number(this.scene.fog.density.toFixed(5)) : 0,
        bikeRiderRotY: this.player && this.player.root ? Number(this.player.root.rotation.y.toFixed(3)) : null,
        mountViceSummitY: Number(getTerrainHeight(-228, -1432).toFixed(2)),
        sierraWestSummitY: Number(getTerrainHeight(-772, -210).toFixed(2)),
        loopEndpointsY: [
          Number(getTerrainHeight(0, -1106).toFixed(2)),
          Number(getTerrainHeight(-480, -1106).toFixed(2)),
          Number(getTerrainHeight(-486, -540).toFixed(2)),
          Number(getTerrainHeight(-486, -60).toFixed(2))
        ],
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
      triggerRandomRJ: (idx = null) => this.audio.triggerRandomRJ(idx),
      openWeaponWheel: (hold = false) => this.openWeaponWheel(hold),
      closeWeaponWheel: (commit = true) => this.closeWeaponWheel(commit),
      hoverWeaponWheel: (idx = 0) => this.setWeaponWheelHover(idx),
      stealNearest: (instant = false) => {
        this.carjackAnim = null;
        if (this.mode !== 'foot') {
          this.setMode('foot');
          this.playerState.x = this.carState.x - 2.3;
          this.playerState.z = this.carState.z;
          this.playerState.y = this.getSurfaceY(this.playerState.x, this.playerState.z, true);
          this.player.root.position.set(this.playerState.x, this.playerState.y, this.playerState.z);
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
          this.playerState.y = this.getSurfaceY(this.playerState.x, this.playerState.z, true);
          this.player.root.position.set(this.playerState.x, this.playerState.y, this.playerState.z);
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
          this.playerState.y = this.getSurfaceY(x, z, true);
          this.playerState.vy = 0;
          this.playerState.grounded = true;
          this.playerState.yaw = yaw;
          this.player.root.position.set(x, this.playerState.y, z);
        } else {
          this.carState.x = x;
          this.carState.z = z;
          this.carState.y = this.getSurfaceY(x, z, false) + 0.05;
          this.carState.vy = 0;
          this.carState.airborne = false;
          this.carState.yaw = yaw;
          this.carState.speed = speed;
        }
        this.snapCameraNext = true;
        this.cancelAutopilot();
        this.drawRadar();
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
      setDayTime: (h) => { this.dayTime = ((Number(h) % 24) + 24) % 24; },
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
      leonidaPlaces: LEONIDA_PLACES,
      getLeonidaStats: () => this.leonidaWorld ? {
        placesCount: this.leonidaWorld.placesCount,
        highwaysCount: this.leonidaWorld.highwaysCount,
        buildingsCount: this.leonidaWorld.buildingsCount,
        treesCount: this.leonidaWorld.treesCount,
        tollPlazasCount: this.leonidaWorld.tollPlazasCount,
        signsCount: this.leonidaWorld.signsCount,
        billboardsCount: this.leonidaWorld.billboardsCount,
        gasStationsCount: this.leonidaWorld.gasStationsCount,
        rocksCount: this.leonidaWorld.rocksCount,
        bushesCount: this.leonidaWorld.bushesCount,
        trafficCount: this.leonidaWorld.trafficCount,
        trafficSignalsCount: (this.leonidaWorld.trafficSignalsCount || 0) + (this.trafficSignals ? this.trafficSignals.length : 0)
      } : null,
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
        let peakIdx = Math.floor(MOUNT_VICE_ROAD.length * 0.5);
        let peakY = -Infinity;
        for (let i = 0; i < MOUNT_VICE_ROAD.length; i++) {
          if (MOUNT_VICE_ROAD[i].y > peakY) { peakY = MOUNT_VICE_ROAD[i].y; peakIdx = i; }
        }
        const pt = MOUNT_VICE_ROAD[Math.max(4, peakIdx - 6)];
        const nextPt = MOUNT_VICE_ROAD[Math.min(MOUNT_VICE_ROAD.length - 1, peakIdx + 2)];
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
        if (this.el && this.el.combo) this.el.combo.classList.remove('on');
        this.streakTimer = 0;
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
      setKeys: (k) => Object.assign(this.keys, k),
      triggerCheat: (code) => this.activateCheatCode(code),
      openTaxi: () => this.openTaxiModal(),
      closeTaxi: () => this.closeTaxiModal(),
      teleportTo: (x, z, mode = 'car', yaw = 0) => {
        this.started = true; this.el.startOv.hidden = true;
        this.closeNpcDialogue(); this.closeMiniGameHub(); this.closeTaxiModal();
        if (this.mode === 'ride') this.exitPierRide();
        if (this.mode !== mode) this.setMode(mode);
        const gy = getTerrainHeight(x, z);
        if (mode === 'foot') {
          this.playerState.x = x; this.playerState.z = z; this.playerState.y = gy;
          this.playerState.yaw = yaw; this.orbitYawOffset = yaw;
          this.player.root.position.set(x, gy, z);
        } else {
          this.carState.x = x; this.carState.z = z; this.carState.y = gy + 0.06;
          this.carState.yaw = yaw; this.carState.speed = 0; this.carState.vy = 0; this.carState.airborne = false;
          this.orbitYawOffset = 0;
          const m = this.activeVehicle ? this.activeVehicle.mesh : this.car.root;
          m.position.set(x, this.carState.y, z); m.rotation.y = yaw;
        }
        this.snapCameraNext = true;
        this.drawRadar();
        return { x, y: gy, z, fog: this.scene.fog ? this.scene.fog.density : 0 };
      },
      mountBike: (kind = 'pcj600') => {
        this.started = true; this.el.startOv.hidden = true;
        const idx = this.parkedVehicles.findIndex((pv) => pv && pv.rig && pv.rig.isBike && (!kind || pv.rig.bikeKind === kind));
        if (idx === -1) return false;
        this.enterParkedVehicle(this.parkedVehicles[idx], idx);
        this.snapCameraNext = true;
        return this.activeVehicle ? this.activeVehicle.label : false;
      },
      spawnPolice: (stars = 3) => {
        this.started = true; this.el.startOv.hidden = true;
        this.wantedStars = Math.max(1, Math.min(5, stars));
        this.wantedDecay = 28;
        this.updateWantedHUD(0);
        this.ensurePoliceDispatch(true);
        return this.policeUnits.length;
      },
      tryFarEnterF: () => {
        this.started = true; this.el.startOv.hidden = true;
        if (this.mode !== 'foot') this.setMode('foot');
        this.playerState.x = this.carState.x + 28;
        this.playerState.z = this.carState.z;
        this.toggleVehicle(false);
        return { modeAfterF: this.mode, comboText: this.el.combo ? this.el.combo.textContent : '' };
      }
    };
  }

  buildDOM() {
    const stage = document.createElement('div');
    stage.className = 'v3-stage';
    stage.setAttribute('role', 'dialog');
    stage.setAttribute('aria-label', 'Vice City 3D Open World');
    stage.tabIndex = -1;

    stage.innerHTML = `
      <div class="v3-mount" data-mount></div>
      <div class="v3-vignette"></div>
      <div class="v3-rain-screen" data-rain-screen aria-hidden="true"></div>
      <div class="v3-shutter" data-shutter aria-hidden="true"></div>
      <!-- Active Side-Mission / Race / Taxi Objective Bar -->
      <div class="v3-mission-bar" data-mission-bar hidden>
        <div>
          <div class="v3-mission-tag" data-mission-tag>SIDE JOB</div>
          <div class="v3-mission-obj" data-mission-obj>Drive to target</div>
        </div>
        <div class="v3-mission-timer" data-mission-timer>00:00</div>
        <button class="v3-mission-abort" type="button" data-mission-abort>End</button>
      </div>
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
                <div class="v3-rad-lcd" data-rad-lcd title="Click to expand/fold radio deck (Press R to tune, O to turn off)">
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
              <div class="v3-rad-pwr-row">
                <button class="v3-rad-pwr" type="button" data-rad-pwr title="Turn Car Radio On or Off (Press O)">Radio: ON</button>
                <span class="v3-rad-ctrl"><b>[R]</b> Tune · <b>[O]</b> On/Off</span>
              </div>
              <div class="v3-rad-guide"><b>[R]</b> Station · <b>[O]</b> Radio Off · <b>[1–5]</b> Presets · Scroll Vol</div>
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
            <button class="v3-env-chip" type="button" data-phone-btn title="Open ViceFruit Smartphone (I)">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="1.5" width="8" height="13" rx="1.6"/><line x1="7" y1="12" x2="9" y2="12"/></svg>
              <span>Phone</span><kbd>I</kbd>
            </button>
            <button class="v3-env-chip mini" type="button" data-mg-btn title="Play Carnival Pier & Street Activities (B)">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 10.5L4 5.5A2 2 0 0 1 5.9 4h4.2a2 2 0 0 1 1.9 1.5l1.5 5a1.6 1.6 0 0 1-2.5 1.7L9.7 11H6.3l-1.3 1.2a1.6 1.6 0 0 1-2.5-1.7Z"/><line x1="5.6" y1="7.5" x2="7.4" y2="7.5"/><line x1="6.5" y1="6.6" x2="6.5" y2="8.4"/><circle cx="10.4" cy="7.2" r=".5" fill="currentColor"/><circle cx="11.4" cy="8.2" r=".5" fill="currentColor"/></svg>
              <span>Activities</span><kbd>B</kbd>
            </button>
            <button class="v3-env-chip proj" type="button" data-proj-btn title="Browse All 5 Projects & GPS Warp (P)">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4L8 11.1 4.4 13l.7-4-2.9-2.8 4-.6L8 2z"/></svg>
              <span>Projects</span><kbd>P</kbd>
            </button>
            <button class="v3-env-chip" type="button" data-time-btn title="Cycle Time of Day (T)">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M8 2v1.4M8 12.6V14M2 8h1.4M12.6 8H14M3.8 3.8l1 1M11.2 11.2l1 1M12.2 3.8l-1 1M4.8 11.2l-1 1"/></svg>
              <span data-time-lbl>Sunset</span><kbd>T</kbd>
            </button>
            <button class="v3-env-chip" type="button" data-weather-btn title="Cycle Weather (Y)">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12h7.2a2.8 2.8 0 0 0 .3-5.6A4 4 0 0 0 4.3 5.5 2.7 2.7 0 0 0 4.5 12Z"/></svg>
              <span data-weather-lbl>Clear</span><kbd>Y</kbd>
            </button>
            <button class="v3-exit" type="button" data-close>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>
              <span>Exit</span>
            </button>
          </div>
          <!-- Authentic Unboxed GTA V / Vice City Top-Right Floating Status HUD -->
          <div class="v3-gta-hud" aria-label="Vice City HUD Status">
            <div class="v3-gta-toprow">
              <span class="v3-gta-clock" data-gta-clock>18:45</span>
              <div class="v3-gta-cash" data-cash>$250</div>
            </div>
            <div class="v3-wanted" data-wanted title="GTA Wanted Level">
              <span class="star" data-s="1">★</span><span class="star" data-s="2">★</span><span class="star" data-s="3">★</span><span class="star" data-s="4">★</span><span class="star" data-s="5">★</span>
            </div>
            <button class="v3-gta-wep-pill" type="button" data-gta-wep-pill title="Open GTA 5 Weapon Wheel [TAB]">
              <span class="v3-gta-wep-ico" data-gta-wep-ico>${getWeaponWheelSvg('smg')}</span>
              <span class="v3-gta-wep-txt" data-gta-wep-txt>DRIVE-BY UZI</span>
              <span class="v3-gta-wep-key">TAB</span>
            </button>
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

      <!-- Classic GTA Vice City Cheat Activated Toast -->
      <div class="v3-cheat-toast" data-cheat-toast>
        <div class="v3-cheat-k">CHEAT ACTIVATED</div>
        <div class="v3-cheat-msg" data-cheat-msg>PANZER · RHINO TANK SPAWNED</div>
      </div>

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

      <!-- Authentic GTA V Rectangular Tactical Minimap + Flush Health / Armor / Special Bars -->
      <div class="v3-radar" data-radar-wrap title="Open Full Vice City GPS Map (G)">
        <div class="v3-radar-map">
          <canvas width="240" height="154" data-radar></canvas>
          <span class="v3-radar-tag">MAP [G]</span>
          <div class="v3-radar-cap">
            <span data-radar-street>Ocean Drive</span>
            <strong data-radar-info>40 Cash Piles</strong>
          </div>
        </div>
        <div class="v3-radar-bars" aria-label="Health, Armor and Nitro">
          <div class="v3-gbar hp" title="Health"><div class="v3-gbar-fill" data-hp-fill></div></div>
          <div class="v3-gbar arm" title="Armor"><div class="v3-gbar-fill" data-arm-fill></div></div>
          <div class="v3-gbar nos" title="Nitro / Special"><div class="v3-gbar-fill" data-nos-fill></div></div>
        </div>
      </div>

      <!-- Exact Main Portfolio Website Sports-Car Dual-Dial Tachometer & Speedometer -->
      <div class="v3-cluster v3-spd" data-cluster aria-label="Sports car tachometer and speedometer">
        ${buildPortfolioSpeedoSVG()}
      </div>

      <!-- Authentic GTA Bottom-Right Unboxed Vehicle Callout + Chassis Integrity -->
      <button class="v3-car-badge" type="button" data-car-badge title="Click or Left-Click on road to fire Drive-By Uzi">
        <strong data-car-name>VICE SUPERCAR</strong>
        <span data-car-sub>LMB · UZI DRIVE-BY</span>
        <div class="v3-veh-hp-wrap" data-veh-hp-wrap>
          <span class="v3-veh-hp-lbl">CHASSIS</span>
          <div class="v3-veh-hp-track"><div class="v3-veh-hp-fill" data-veh-hp-fill></div></div>
        </div>
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
          <button class="v3-combat-btn wheel" type="button" data-foot-wheel-btn title="Open GTA 5 Weapon Wheel [TAB]">Wheel [TAB]</button>
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

      <div class="v3-dock-wrap collapsed" data-dock-wrap>
        <div class="v3-auto-bar" data-auto-bar>
          <span data-auto-text>GPS Auto-Driving...</span>
          <button class="v3-auto-cancel" type="button" data-auto-cancel>Cancel</button>
        </div>
        <button class="v3-dock-toggle" type="button" data-dock-toggle>▴ Controls</button>
        <div class="v3-dock">
          <div class="v3-route-row" data-waypoints>
            ${DOCK_WAYPOINTS.map((w, i) => `<button class="v3-wp${i === 0 ? ' active' : ''}" type="button" data-wp="${w.id}">${w.label}</button>`).join('')}
          </div>
          <div class="v3-track"><div class="v3-track-fill" data-track-fill></div></div>
          <div class="v3-ctrl-row">
            <div class="v3-swatches">
              <span class="v3-sw-label">Finish</span>
              ${PAINTS.map((p, i) => `<button class="v3-swatch${i === 0 ? ' active' : ''}" type="button" data-paint="${i}" title="${p.name}" style="background:${p.swatch}"></button>`).join('')}
            </div>
            <div class="v3-keys-hint" data-keys-hint>WASD Drive · V Cam · I Phone · G Map · R/O Radio · F Enter/Exit</div>
            <div class="v3-tools">
              <button class="v3-tool-btn" type="button" data-veh-btn>Exit Car [F]</button>
              <button class="v3-tool-btn" type="button" data-taxi-btn title="Hail Kaufman Cabs Taxi Service [X]">Taxi [X]</button>
              <button class="v3-tool-btn" type="button" data-map-btn>Map [G]</button>
              <button class="v3-tool-btn" type="button" data-cam title="Cycle Chase / Low / Hood / Drone Camera [V]">Cam: Chase</button>
              <button class="v3-tool-btn" type="button" data-gfx-btn title="Cycle Graphics Quality Preset (High / Med / Low)">Gfx: High</button>
              <button class="v3-tool-btn on" type="button" data-lights>Lights</button>
              <button class="v3-tool-btn" type="button" data-audio>Audio: Off</button>
            </div>
          </div>
        </div>
      </div>

      <!-- GTA IV/V Style ViceFruit iFruit 86 Smartphone -->
      <aside class="v3-phone" data-phone hidden role="dialog" aria-label="ViceFruit Smartphone">
        <div class="v3-phone-notch"></div>
        <div class="v3-phone-status">
          <span>VICE-CELL 5G</span>
          <span data-phone-clock>18:45</span>
          <span data-phone-cash>$250</span>
        </div>
        <div class="v3-phone-screen" data-phone-screen></div>
        <div class="v3-phone-foot">
          <button class="v3-phone-home" type="button" data-phone-home title="Home Screen">⌂</button>
          <button class="v3-phone-close" type="button" data-phone-close>Put Away [I]</button>
        </div>
      </aside>

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

      <!-- Malibu Club Live Dance Floor HUD Controls -->
      <div class="v3-dance-bar" data-dance-bar role="region" aria-label="Malibu Club Dance Controls">
        <div class="v3-dance-title">MALIBU DANCEFLOOR</div>
        <div class="v3-dance-moves">
          <button class="v3-dance-btn active" type="button" data-dance-move="0">[1] Disco Fever</button>
          <button class="v3-dance-btn" type="button" data-dance-move="1">[2] Hands Up</button>
          <button class="v3-dance-btn" type="button" data-dance-move="2">[3] Vice Groove</button>
        </div>
        <button class="v3-dance-stop" type="button" data-dance-stop>Stop [E]</button>
      </div>

      <!-- Barber Shop / Clothes Store / Safehouse Wardrobe Live 3D Customization Drawer -->
      <aside class="v3-shop-drawer" data-shop-drawer hidden role="dialog" aria-label="Character Customization">
        <div class="v3-shop-head">
          <div>
            <div class="v3-shop-kicker" data-shop-kicker>VICE CUTS BARBER</div>
            <h3 class="v3-shop-title" data-shop-title>Barber Chair</h3>
            <div class="v3-shop-cash" data-shop-cash>Cash: $250</div>
          </div>
          <button class="v3-dlg-close" type="button" data-shop-close>Close [ESC]</button>
        </div>
        <div class="v3-shop-body" data-shop-body></div>
        <div class="v3-shop-foot">
          <span class="v3-shop-tip">Hover to preview · Click to buy/equip</span>
          <button class="v3-btn-primary" type="button" data-shop-done>Done</button>
        </div>
      </aside>

      <!-- Ocean View Safehouse Sleep Transition Overlay -->
      <div class="v3-sleep-ov" data-sleep-ov aria-live="polite">
        <div class="v3-sleep-title">RESTING AT OCEAN VIEW</div>
        <div class="v3-sleep-sub" data-sleep-sub>Advancing +6 Hours · Restoring Health &amp; Clearing Wanted Heat...</div>
      </div>

      <!-- Ocean View Safehouse 1986 Retro CRT TV Viewer Modal -->
      <div class="v3-ov" data-tv-ov hidden>
        <div class="v3-tv-set" role="dialog" aria-label="Ocean View Hotel Television">
          <div class="v3-tv-bezel">
            <div class="v3-tv-screen-wrap">
              <canvas width="640" height="400" data-tv-canvas></canvas>
            </div>
          </div>
          <div class="v3-tv-bar">
            <div class="v3-tv-chs">
              ${TV_CHANNELS.map((ch, i) => `<button class="v3-tv-ch${i === 0 ? ' active' : ''}" type="button" data-tv-ch="${i}">${ch.label}</button>`).join('')}
            </div>
            <button class="v3-dlg-close" type="button" data-tv-close>Power Off [ESC]</button>
          </div>
        </div>
      </div>

      <!-- Kaufman Cabs Interactive Vice City Taxi Service Modal -->
      <div class="v3-ov" data-taxi-ov hidden>
        <div class="v3-taxi-card" role="dialog" aria-label="Kaufman Cabs Taxi Service">
          <div class="v3-taxi-head">
            <div>
              <div class="v3-taxi-title">KAUFMAN CABS · VICE TAXI SERVICE</div>
              <div class="v3-taxi-sub">Choose your destination for instant VIP cab transport across Vice City</div>
            </div>
            <button class="v3-dlg-close" type="button" data-taxi-close>Close [ESC]</button>
          </div>
          <div class="v3-taxi-grid">
            ${[
              { id: 'ocean-view', name: 'Ocean View Safehouse [IN]', fare: 20 },
              { id: 'malibu-club', name: 'The Malibu Club [IN]', fare: 25 },
              { id: 'barber-ocean', name: 'Vice Cuts Barber [IN]', fare: 20 },
              { id: 'clothes-vice', name: 'Vice Couture Clothes [IN]', fare: 25 },
              { id: 'north-mall', name: 'North Point Mall [IN]', fare: 35 },
              { id: 'pier', name: 'Vice Carnival Pier', fare: 30 },
              { id: 'airport', name: "Escobar Int'l Airport", fare: 40 },
              { id: 'village', name: 'Vice Hollow Community', fare: 55 },
              { id: 'mount-vice', name: 'Mount Vice Loop (118m)', fare: 75 },
              { id: 'ammunation', name: 'Ammu-Nation Ocean Dr', fare: 20 }
            ].map((d) => `
              <button class="v3-taxi-dest" type="button" data-taxi-dest="${d.id}" data-taxi-fare="${d.fare}">
                <span>${d.name}</span>
                <span class="v3-taxi-fare">$${d.fare}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Interactive Full-Screen Great State of Leonida GPS Atlas Modal -->
      <div class="v3-ov" data-fullmap-ov hidden>
        <div class="v3-fullmap">
          <div class="v3-fullmap-canvas-wrap">
            <canvas width="460" height="620" data-fullmap-canvas></canvas>
            <div class="v3-fullmap-tip">Click anywhere on the State of Leonida map to set GPS Auto-Drive</div>
          </div>
          <div class="v3-fullmap-side">
            <div class="v3-fullmap-top">
              <div class="v3-card-k">The Great State of Leonida · GPS Atlas</div>
              <div class="v3-fullmap-headrow">
                <h3>State Map</h3>
                <span class="v3-fm-count" data-fm-count>${WAYPOINTS.length - 1} Places</span>
              </div>
              <div class="v3-fm-tabs" data-fm-tabs>
                <button class="v3-fm-tab active" type="button" data-fm-tab="ALL">All</button>
                <button class="v3-fm-tab" type="button" data-fm-tab="Vice-Dale County">Vice-Dale</button>
                <button class="v3-fm-tab" type="button" data-fm-tab="Leonard County">Leonard</button>
                <button class="v3-fm-tab" type="button" data-fm-tab="Kelly County">Kelly</button>
                <button class="v3-fm-tab" type="button" data-fm-tab="Lummox County">Lummox</button>
                <button class="v3-fm-tab" type="button" data-fm-tab="MARIANA">Keys &amp; Mariana</button>
              </div>
              <input class="v3-fm-search" type="search" data-fm-search placeholder="Search Leonida cities, golf, shops, parks..." autocomplete="off" />
              <div class="v3-fullmap-list" data-fullmap-list>
                ${WAYPOINTS.filter((w) => w.id !== 'start').map((w) => `
                  <div class="v3-fm-row" data-fm-row data-fm-county="${w.county || 'Vice-Dale County'}" data-fm-q="${(w.label + ' ' + w.zone + ' ' + (w.county || '')).toLowerCase().replace(/"/g, '')}">
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
                <span>✈ 4 Airports / Jets</span>
                <span>━ 12 Interstates &amp; Grids</span>
                <span>▲ Player Position</span>
              </div>
              <div style="margin-top:10px; display:flex; justify-content:flex-end;">
                <button class="v3-card-close" type="button" data-fullmap-close>Close Map [G]</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Redesigned Split-Stage Architectural Projects Dossier ([P] Button) -->
      <div class="v3-ov" data-proj-hub-ov hidden>
        <div class="v3-proj-hub" role="dialog" aria-modal="true" aria-label="Featured Projects">
          <div class="v3-ph-head">
            <div class="v3-ph-head-left">
              <div class="v3-card-k">Vice City Showcase · Interactive Portfolio</div>
              <h3>Featured Projects</h3>
            </div>
            <div class="v3-ph-head-right">
              <div class="v3-ph-prog-wrap">
                <div class="v3-ph-prog-label"><span data-ph-progress-text>0 / 5</span> EXPLORED</div>
                <div class="v3-ph-prog-track"><div class="v3-ph-prog-fill" data-ph-progress-fill style="width:0%"></div></div>
              </div>
              <button class="v3-card-close" type="button" data-proj-hub-close>Close [P]</button>
            </div>
          </div>

          <div class="v3-ph-split">
            <div class="v3-ph-rail" role="listbox" aria-label="Project list">
              ${[...SHOWROOMS, CONTACT_SHOWROOM].map((sr, idx) => `
                <button class="v3-ph-row${idx === 0 ? ' active' : ''}" type="button" role="option" aria-selected="${idx === 0 ? 'true' : 'false'}" data-ph-select="${sr.id}" style="--item-col:${sr.accentHex}">
                  <span class="v3-ph-row-num">${sr.num}</span>
                  <span class="v3-ph-row-meta">
                    <span class="v3-ph-row-title">${sr.title}</span>
                    <span class="v3-ph-row-sub">${sr.district}</span>
                  </span>
                  <span class="v3-ph-row-right">
                    <span class="v3-ph-row-dist" data-ph-dist="${sr.id}">--m</span>
                    <span class="v3-ph-row-state" data-ph-badge="${sr.id}">${sr.id === 'contact' ? 'DIRECT' : 'UNSEEN'}</span>
                  </span>
                </button>
              `).join('')}
            </div>

            <div class="v3-ph-stage" data-ph-stage style="--stage-col:${SHOWROOMS[0].accentHex}">
              <div class="v3-ph-hero-media">
                <img src="${SHOWROOMS[0].img}" alt="${SHOWROOMS[0].title}" referrerpolicy="no-referrer" data-ph-hero-img>
                <div class="v3-ph-hero-scrim"></div>
                <div class="v3-ph-hero-hud">
                  <span class="v3-ph-hero-tag" data-ph-hero-badge>PROJECT 01</span>
                  <span class="v3-ph-hero-dist" data-ph-hero-dist>--m AWAY</span>
                </div>
              </div>

              <div class="v3-ph-hero-body">
                <div class="v3-ph-hero-eyebrow" data-ph-hero-district>${SHOWROOMS[0].district}</div>
                <h4 class="v3-ph-hero-title" data-ph-hero-title>${SHOWROOMS[0].title}</h4>
                <div class="v3-ph-hero-stat" data-ph-hero-stat>${SHOWROOMS[0].stat}</div>
                <p class="v3-ph-hero-desc" data-ph-hero-desc>${SHOWROOMS[0].desc}</p>
              </div>

              <div class="v3-ph-hero-acts">
                <button class="v3-ph-act primary" type="button" data-ph-tp="${SHOWROOMS[0].id}">Warp to Showroom</button>
                <button class="v3-ph-act" type="button" data-ph-drive="${SHOWROOMS[0].id}">GPS Auto-Drive</button>
                <a class="v3-ph-act accent" href="${SHOWROOMS[0].url}" target="_blank" rel="noopener" data-ph-hero-open>Open Case Study ↗</a>
              </div>
            </div>
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
            <div class="v3-mg-card" style="--mg-col:#FF7B2E">
              <div>
                <div class="v3-mg-tag">04 · Well Stacked Pizza Co.</div>
                <h4>Pizza Boy Faggio Run</h4>
                <p>Hop on the red-and-white delivery Faggio scooter and drop 5 piping-hot pizzas across Ocean Drive before time runs out.</p>
              </div>
              <div>
                <div class="v3-mg-prize">Delivery Payout: $1,400+</div>
                <button class="v3-mg-play" type="button" data-mg-start="pizza" style="margin-top:8px;">Ride Faggio</button>
              </div>
            </div>
            <div class="v3-mg-card" style="--mg-col:#21E6D1">
              <div>
                <div class="v3-mg-tag">05 · Vice Beach Atlantic Surf</div>
                <h4>Jet-Ski Slalom Trial</h4>
                <p>Carve through 8 glowing ocean buoy gates along Vice Beach &amp; Carnival Pier on a turbo WaveRunner Jet-Ski.</p>
              </div>
              <div>
                <div class="v3-mg-prize">Surf Prize: $1,350</div>
                <button class="v3-mg-play" type="button" data-mg-start="jetski" style="margin-top:8px;">Launch Jet-Ski</button>
              </div>
            </div>
            <div class="v3-mg-card" style="--mg-col:#34E89E">
              <div>
                <div class="v3-mg-tag">06 · Vice Beach Sand Court</div>
                <h4>Beach Volleyball Rally</h4>
                <p>Step onto the Ocean Beach sand court, race into the landing ring, and spike 8 consecutive volleys across the net.</p>
              </div>
              <div>
                <div class="v3-mg-prize">Beach Trophy: $750</div>
                <button class="v3-mg-play" type="button" data-mg-start="volleyball" style="margin-top:8px;">Hit Sand Court</button>
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
      ${buildWeaponWheelHTML()}
    `;

    document.body.appendChild(stage);
    this.el = {
      stage,
      mount: stage.querySelector('[data-mount]'),
      crosshair: stage.querySelector('[data-crosshair]'),
      uiCursor: stage.querySelector('[data-ui-cursor]'),
      lockTip: stage.querySelector('[data-lock-tip]'),
      gtaWepPill: stage.querySelector('[data-gta-wep-pill]'),
      gtaWepIco: stage.querySelector('[data-gta-wep-ico]'),
      gtaWepTxt: stage.querySelector('[data-gta-wep-txt]'),
      gtaClock: stage.querySelector('[data-gta-clock]'),
      zone: stage.querySelector('[data-zone]'),
      progress: stage.querySelector('[data-progress]'),
      radioDeck: stage.querySelector('[data-radio-deck]'),
      radVol: stage.querySelector('[data-rad-vol]'),
      radTune: stage.querySelector('[data-rad-tune]'),
      radLcd: stage.querySelector('[data-rad-lcd]'),
      radPwr: stage.querySelector('[data-rad-pwr]'),
      radF: stage.querySelector('[data-rad-f]'),
      radN: stage.querySelector('[data-rad-n]'),
      radNd: stage.querySelector('[data-rad-nd]'),
      radPres: Array.from(stage.querySelectorAll('[data-rad-pre]')),
      danceBar: stage.querySelector('[data-dance-bar]'),
      danceMoveBtns: Array.from(stage.querySelectorAll('[data-dance-move]')),
      danceStop: stage.querySelector('[data-dance-stop]'),
      shopDrawer: stage.querySelector('[data-shop-drawer]'),
      shopKicker: stage.querySelector('[data-shop-kicker]'),
      shopTitle: stage.querySelector('[data-shop-title]'),
      shopCash: stage.querySelector('[data-shop-cash]'),
      shopBody: stage.querySelector('[data-shop-body]'),
      shopClose: stage.querySelector('[data-shop-close]'),
      shopDone: stage.querySelector('[data-shop-done]'),
      sleepOv: stage.querySelector('[data-sleep-ov]'),
      sleepSub: stage.querySelector('[data-sleep-sub]'),
      tvOv: stage.querySelector('[data-tv-ov]'),
      tvCanvas: stage.querySelector('[data-tv-canvas]'),
      tvChBtns: Array.from(stage.querySelectorAll('[data-tv-ch]')),
      tvClose: stage.querySelector('[data-tv-close]'),
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
      spdLim: stage.querySelector('[data-spd-lim]'),
      spdUnit: stage.querySelector('[data-spd-u]'),
      tchUnit: stage.querySelector('[data-tch-u]'),
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
      footWheelBtn: stage.querySelector('[data-foot-wheel-btn]'),
      footCarBtn: stage.querySelector('[data-foot-car-btn]'),
      weaponWheel: stage.querySelector('[data-weapon-wheel]'),
      wwShell: stage.querySelector('[data-ww-shell]'),
      wwWedges: Array.from(stage.querySelectorAll('[data-ww-wedge]')),
      wwSlots: Array.from(stage.querySelectorAll('[data-ww-slot]')),
      wwCat: stage.querySelector('[data-ww-cat]'),
      wwTitle: stage.querySelector('[data-ww-title]'),
      wwAmmo: stage.querySelector('[data-ww-ammo]'),
      wwDmg: stage.querySelector('[data-ww-dmg]'),
      wwRate: stage.querySelector('[data-ww-rate]'),
      wwRange: stage.querySelector('[data-ww-range]'),
      wwAcc: stage.querySelector('[data-ww-acc]'),
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
      nosFill: stage.querySelector('[data-nos-fill]'),
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
      cheatToast: stage.querySelector('[data-cheat-toast]'),
      cheatMsg: stage.querySelector('[data-cheat-msg]'),
      taxiBtn: stage.querySelector('[data-taxi-btn]'),
      taxiOv: stage.querySelector('[data-taxi-ov]'),
      taxiClose: stage.querySelector('[data-taxi-close]'),
      taxiDests: Array.from(stage.querySelectorAll('[data-taxi-dest]')),
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
      fmTabs: Array.from(stage.querySelectorAll('[data-fm-tab]')),
      fmSearch: stage.querySelector('[data-fm-search]'),
      fmCount: stage.querySelector('[data-fm-count]'),
      fmRows: Array.from(stage.querySelectorAll('[data-fm-row]')),
      fmBtns: Array.from(stage.querySelectorAll('[data-fm-wp]')),
      fmTpBtns: Array.from(stage.querySelectorAll('[data-fm-tp]')),
      fmDists: Array.from(stage.querySelectorAll('[data-fm-dist]')),
      projHubOv: stage.querySelector('[data-proj-hub-ov]'),
      projHubClose: stage.querySelector('[data-proj-hub-close]'),
      phSelectBtns: Array.from(stage.querySelectorAll('[data-ph-select]')),
      phStage: stage.querySelector('[data-ph-stage]'),
      phHeroImg: stage.querySelector('[data-ph-hero-img]'),
      phHeroBadge: stage.querySelector('[data-ph-hero-badge]'),
      phHeroDist: stage.querySelector('[data-ph-hero-dist]'),
      phHeroDistrict: stage.querySelector('[data-ph-hero-district]'),
      phHeroTitle: stage.querySelector('[data-ph-hero-title]'),
      phHeroStat: stage.querySelector('[data-ph-hero-stat]'),
      phHeroDesc: stage.querySelector('[data-ph-hero-desc]'),
      phHeroOpen: stage.querySelector('[data-ph-hero-open]'),
      phProgressText: stage.querySelector('[data-ph-progress-text]'),
      phProgressFill: stage.querySelector('[data-ph-progress-fill]'),
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
      startOv: { hidden: true },
      beginBtn: null,
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
      mNext: stage.querySelector('[data-m-next]'),
      rainScreen: stage.querySelector('[data-rain-screen]'),
      shutter: stage.querySelector('[data-shutter]'),
      missionBar: stage.querySelector('[data-mission-bar]'),
      missionTag: stage.querySelector('[data-mission-tag]'),
      missionObj: stage.querySelector('[data-mission-obj]'),
      missionTimer: stage.querySelector('[data-mission-timer]'),
      missionAbort: stage.querySelector('[data-mission-abort]'),
      phoneBtn: stage.querySelector('[data-phone-btn]'),
      phone: stage.querySelector('[data-phone]'),
      phoneClock: stage.querySelector('[data-phone-clock]'),
      phoneCash: stage.querySelector('[data-phone-cash]'),
      phoneScreen: stage.querySelector('[data-phone-screen]'),
      phoneHome: stage.querySelector('[data-phone-home]'),
      phoneClose: stage.querySelector('[data-phone-close]'),
      gfxBtn: stage.querySelector('[data-gfx-btn]'),
      vehHpFill: stage.querySelector('[data-veh-hp-fill]'),
      vehHpWrap: stage.querySelector('[data-veh-hp-wrap]')
    };
    this.radarCtx = this.el.radarCanvas.getContext('2d');
    this.fullMapCtx = this.el.fullMapCanvas.getContext('2d');
    this.tvCtx = this.el.tvCanvas ? this.el.tvCanvas.getContext('2d') : null;
  }

  initWebGL() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6e546d);
    this.scene.fog = new THREE.FogExp2(0x6e546d, 0.00145);

    const w = window.innerWidth;
    const h = window.innerHeight;
    // Wide 3600m far plane keeps towering Mount Kalaga (165m) & distant Leonida coastlines crisp!
    this.camera = new THREE.PerspectiveCamera(56, w / h, 0.6, 3600);
    this.camera.position.set(7.5, 2.7, 15.5);

    // Generate 100% custom procedural GTA-style vector map & minimap directly from the live 3D world!
    this.activeCountyTab = 'ALL';
    this.leonidaMapCanvas = createLeonidaVectorMapCanvas(640, 840);

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
      this.scene.environmentIntensity = 1.24;
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
    this.parkedVehicles = [];
    this.buildLighting();
    this.buildOpenWorld(maxAniso);

    this.car = createSupercar(this.isSoftwareGl);
    this.car.isHero = true;
    this.car.root.position.set(this.carState.x, 0, this.carState.z);
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
    this.nearbyVehicleTarget = null;

    // Playable 1986 Vice City Protagonist (steps out on 'F' to roam, fight, customize, dance & fly!)
    this.player = createPlayerCharacter();
    if (typeof this.player.setHairstyle === 'function') this.player.setHairstyle(this.playerStyle.hair, this.playerStyle.hairColor);
    if (typeof this.player.setOutfit === 'function') this.player.setOutfit(this.playerStyle.outfit);
    if (typeof this.player.setShades === 'function') this.player.setShades(this.playerStyle.shades);
    this.player.root.position.set(this.carState.x, 0, this.carState.z);
    this.player.root.visible = this.mode !== 'car';
    this.scene.add(this.player.root);

    // Redesigned Vice City 7-Cell Rectangular Ram-Air Sport Parafoil + Dorsal Backpack Rig + Suspension Lines + Brake Toggles
    const paraGrp = new THREE.Group();
    const packGrp = new THREE.Group();
    const packMat = new THREE.MeshStandardMaterial({ color: 0x1b2030, roughness: 0.62, metalness: 0.14 });
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x10131c, roughness: 0.72 });
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0xd8e0ec, metalness: 0.88, roughness: 0.22 });
    const toggleMat = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0x664400, emissiveIntensity: 0.35, roughness: 0.4 });
    const cellPinkMat = new THREE.MeshStandardMaterial({ color: 0xff2e88, roughness: 0.56, side: THREE.DoubleSide });
    const cellCyanMat = new THREE.MeshStandardMaterial({ color: 0x21e6d1, roughness: 0.56, side: THREE.DoubleSide });
    const cellWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf6f4fc, roughness: 0.54, side: THREE.DoubleSide });
    const cellDarkMat = new THREE.MeshStandardMaterial({ color: 0x1a1426, roughness: 0.78, side: THREE.DoubleSide });
    const riserMat = new THREE.MeshStandardMaterial({ color: 0x262c3d, roughness: 0.66 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xeaf0f8 });

    // Dorsal skydiving backpack container + twin shoulder harness straps
    const mainPack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.18), packMat);
    mainPack.position.set(0, 1.18, 0.20);
    const packTrim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.04), cellCyanMat);
    packTrim.position.set(0, 1.32, 0.29);
    const chestStrap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.055, 0.04), strapMat);
    chestStrap.position.set(0, 1.24, -0.155);
    const chestBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.065, 0.05), buckleMat);
    chestBuckle.position.set(0, 1.24, -0.165);
    packGrp.add(mainPack, packTrim, chestStrap, chestBuckle);
    for (const sx of [-1, 1]) {
      const sStrap = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.44, 0.34), strapMat);
      sStrap.position.set(sx * 0.175, 1.32, 0.02);
      packGrp.add(sStrap);
    }
    paraGrp.add(packGrp);

    // Overhead 7-Cell Arched Ram-Air Parafoil Canopy pivoted at harness riser root (y = 1.46) for natural inflation & pitch/bank!
    const canopyPivot = new THREE.Group();
    canopyPivot.position.set(0, 1.46, 0.04);
    const canopyY = 3.10; // local height above shoulders (world ~4.56m)
    const span = 5.65;
    const chord = 2.25;
    const nCells = 7;
    const cellW = span / nCells;
    const cellPalette = [cellPinkMat, cellWhiteMat, cellCyanMat, cellPinkMat, cellCyanMat, cellWhiteMat, cellPinkMat];

    // Sculpted airfoil cross-section for each inflated ram-air cell
    const airfoilShape = new THREE.Shape();
    airfoilShape.moveTo(-chord * 0.5, 0.02);
    airfoilShape.quadraticCurveTo(-chord * 0.15, 0.38, chord * 0.5, 0.02);
    airfoilShape.quadraticCurveTo(0.0, 0.08, -chord * 0.5, 0.02);
    const cellGeo = new THREE.ExtrudeGeometry(airfoilShape, {
      depth: cellW * 0.94, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 2, curveSegments: 10
    });
    cellGeo.translate(0, 0, -cellW * 0.47);
    cellGeo.rotateY(Math.PI / 2); // chord runs along -Z (leading edge) to +Z (trailing edge)

    const archHeight = (x) => {
      const nx = x / (span * 0.5);
      return canopyY - nx * nx * 0.62;
    };
    const archSlope = (x) => {
      const nx = x / (span * 0.5);
      return -nx * 0.42;
    };

    for (let i = 0; i < nCells; i++) {
      const cx = -span * 0.5 + (i + 0.5) * cellW;
      const cy = archHeight(cx);
      const cell = new THREE.Mesh(cellGeo, cellPalette[i % cellPalette.length]);
      cell.position.set(cx, cy, 0.08);
      cell.rotation.z = archSlope(cx);
      canopyPivot.add(cell);

      // Dark ram-air intake cell mouth on leading edge (-Z)
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(cellW * 0.80, 0.16, 0.05), cellDarkMat);
      mouth.position.set(cx, cy + 0.09, -chord * 0.46 + 0.08);
      mouth.rotation.z = archSlope(cx);
      canopyPivot.add(mouth);
    }

    // Wingtip end-cell stabilizers on left & right tips
    for (const sx of [-1, 1]) {
      const tipX = sx * (span * 0.5 + 0.03);
      const tipY = archHeight(tipX) - 0.14;
      const stab = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.58, chord * 0.88), cellDarkMat);
      stab.position.set(tipX, tipY, 0.12);
      stab.rotation.z = -sx * 0.24;
      canopyPivot.add(stab);
    }

    // Helper: create an accurately oriented cylinder connecting point A -> point B
    const _upAxis = new THREE.Vector3(0, 1, 0);
    const addLineMesh = (parent, ax, ay, az, bx, by, bz, radius, mat) => {
      const pA = new THREE.Vector3(ax, ay, az);
      const pB = new THREE.Vector3(bx, by, bz);
      const dir = pB.clone().sub(pA);
      const len = dir.length();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 5), mat);
      m.position.copy(pA).addScaledVector(dir, 0.5);
      m.quaternion.setFromUnitVectors(_upAxis, dir.normalize());
      parent.add(m);
      return m;
    };

    // Twin main shoulder risers rising up from harness + 16 fanned suspension lines to canopy cells + steering toggles
    const toggleHandles = [];
    for (const sx of [-1, 1]) {
      const riserTopX = sx * 0.28;
      const riserTopY = 0.64;
      addLineMesh(canopyPivot, sx * 0.18, 0.0, 0.06, riserTopX, riserTopY, 0.04, 0.022, riserMat);
      // Fanned suspension lines from riser top to 4 spanwise canopy stations x front & rear attachment points
      const stations = [0.45, 1.25, 2.02, 2.68];
      for (let k = 0; k < stations.length; k++) {
        const tx = sx * stations[k];
        const ty = archHeight(tx) + 0.04;
        addLineMesh(canopyPivot, riserTopX, riserTopY, 0.00, tx, ty, -0.62, 0.0075, lineMat);
        addLineMesh(canopyPivot, riserTopX, riserTopY, 0.08, tx, ty,  0.76, 0.0075, lineMat);
      }
      // Yellow steering brake toggle right at raised hand height
      const togGrp = new THREE.Group();
      togGrp.position.set(sx * 0.26, 0.44, -0.08);
      const togGrip = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.013, 6, 12), toggleMat);
      togGrp.add(togGrip);
      canopyPivot.add(togGrp);
      toggleHandles.push(togGrp);
    }

    paraGrp.add(canopyPivot);
    paraGrp.visible = false;
    this.player.root.add(paraGrp);
    this.parachuteMesh = paraGrp;
    this.parachuteRig = {
      root: paraGrp,
      pack: packGrp,
      canopy: canopyPivot,
      toggleL: toggleHandles[0],
      toggleR: toggleHandles[1]
    };

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

    // High-Res 128px Dynamic CubeCamera reflections on Player Supercar (updates smoothly on movement!)
    this.cubeCamera = null;
    this.cubeRT = null;
    if (!this.isSoftwareGl) {
      try {
        this.cubeRT = new THREE.WebGLCubeRenderTarget(128, {
          generateMipmaps: true,
          minFilter: THREE.LinearMipmapLinearFilter
        });
        this.cubeCamera = new THREE.CubeCamera(0.6, 1250, this.cubeRT);
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
    const b = { minX, maxX, minZ, maxZ };
    this.boxColliders.push(b);
    this.colliderGrid.addBox(b);
  }

  addCircleCollider(x, z, r) {
    const c = { x, z, r };
    this.circleColliders.push(c);
    this.colliderGrid.addCircle(c);
  }

  buildOpenWorld(maxAniso) {
    const texLoader = new THREE.TextureLoader();

    // 1. Sky Dome (follows camera every frame) & Reflective Atlantic/Gulf Ocean across all of Leonida
    this.skyDome = createViceSkyDome();
    this.skyDome.scale.setScalar(1.65);
    this.scene.add(this.skyDome);

    this.ocean = createAtlanticOcean();
    this.ocean.scale.set(3.4, 1, 3.4);
    this.ocean.position.set(-980, -0.58, -300);
    this.scene.add(this.ocean);

    // 2. NON-OVERLAPPING ZERO-Z-FIGHTING ROAD NETWORK (y = 0.0)
    const interTex = makeIntersectionTexture(maxAniso);
    const interMat = new THREE.MeshStandardMaterial({
      map: interTex, roughness: 0.56, metalness: 0.14, envMapIntensity: 0.92
    });

    const nsTex = makeAsphaltTextures(maxAniso, 8);
    const nsRoadMat = new THREE.MeshStandardMaterial({
      map: nsTex.map, roughnessMap: nsTex.roughnessMap, normalMap: nsTex.normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42), roughness: 0.54, metalness: 0.14, envMapIntensity: 1.12
    });

    const ewTex = makeAsphaltTextures(maxAniso, 4);
    const ewRoadMat = new THREE.MeshStandardMaterial({
      map: ewTex.map, roughnessMap: ewTex.roughnessMap, normalMap: ewTex.normalMap,
      normalScale: new THREE.Vector2(0.42, 0.42), roughness: 0.54, metalness: 0.14, envMapIntensity: 1.12
    });
    this.roadMaterials = [interMat, nsRoadMat, ewRoadMat];

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

    const tlBaseG = new THREE.CylinderGeometry(0.28, 0.34, 0.35, 8); tlBaseG.translate(0, 0.175, 0);
    const tlPostG = new THREE.CylinderGeometry(0.13, 0.17, 6.7, 8); tlPostG.translate(0, 3.35, 0);
    const tlArm1G = new THREE.BoxGeometry(6.6, 0.16, 0.16); tlArm1G.translate(-3.3, 6.45, 0);
    const tlArm2G = new THREE.BoxGeometry(0.16, 0.16, 6.6); tlArm2G.translate(0, 6.15, 3.3);
    const tlPedG  = new THREE.BoxGeometry(0.32, 0.44, 0.24); tlPedG.translate(-0.26, 2.55, 0.12);
    const tlBox1G = new THREE.BoxGeometry(0.48, 1.38, 0.38); tlBox1G.translate(-3.8, 5.75, 0);
    const tlVis1a = new THREE.BoxGeometry(0.50, 0.06, 0.36); tlVis1a.translate(-3.8, 6.26, 0.24);
    const tlVis1b = new THREE.BoxGeometry(0.50, 0.06, 0.36); tlVis1b.translate(-3.8, 5.86, 0.24);
    const tlVis1c = new THREE.BoxGeometry(0.50, 0.06, 0.36); tlVis1c.translate(-3.8, 5.46, 0.24);
    const tlBox2G = new THREE.BoxGeometry(0.38, 1.38, 0.48); tlBox2G.translate(0, 5.45, 3.8);
    const tlVis2a = new THREE.BoxGeometry(0.36, 0.06, 0.50); tlVis2a.translate(-0.24, 5.96, 3.8);
    const tlVis2b = new THREE.BoxGeometry(0.36, 0.06, 0.50); tlVis2b.translate(-0.24, 5.56, 3.8);
    const tlVis2c = new THREE.BoxGeometry(0.36, 0.06, 0.50); tlVis2c.translate(-0.24, 5.16, 3.8);
    const tlGantryGeo = mergeGeometries([tlBaseG, tlPostG, tlArm1G, tlArm2G, tlPedG, tlBox1G, tlVis1a, tlVis1b, tlVis1c, tlBox2G, tlVis2a, tlVis2b, tlVis2c]);
    const tlGantryInst = new THREE.InstancedMesh(tlGantryGeo, poleMat, interCount);
    const bulbGeo = new THREE.SphereGeometry(0.13, 6, 6);
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

        // N-S Signal Head (facing +Z / -Z)
        const lR = new THREE.Mesh(bulbGeo, sigOffMat); lR.position.set(px - 3.8, 6.28, pz + 0.21); this.scene.add(lR);
        const lY = new THREE.Mesh(bulbGeo, sigOffMat); lY.position.set(px - 3.8, 5.88, pz + 0.21); this.scene.add(lY);
        const lG = new THREE.Mesh(bulbGeo, sigOffMat); lG.position.set(px - 3.8, 5.48, pz + 0.21); this.scene.add(lG);
        // E-W Cross-Street Signal Head (opposing phase!)
        const lR2 = new THREE.Mesh(bulbGeo, sigOffMat); lR2.position.set(px - 0.21, 5.98, pz + 3.8); this.scene.add(lR2);
        const lY2 = new THREE.Mesh(bulbGeo, sigOffMat); lY2.position.set(px - 0.21, 5.58, pz + 3.8); this.scene.add(lY2);
        const lG2 = new THREE.Mesh(bulbGeo, sigOffMat); lG2.position.set(px - 0.21, 5.18, pz + 3.8); this.scene.add(lG2);
        this.addCircleCollider(px, pz, 0.36);
        this.trafficSignals.push({ lR, lY, lG, lR2, lY2, lG2, phase: (ci % 2) * 5.0 });
      });
    });
    interInst.instanceMatrix.needsUpdate = true;
    tlGantryInst.instanceMatrix.needsUpdate = true;
    interInst.computeBoundingSphere();
    tlGantryInst.computeBoundingSphere();
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
    const pbrLib = getWorldPBRTextures(maxAniso);
    const grassMat = new THREE.MeshStandardMaterial({
      map: makeGrassTexture(maxAniso, 5, 10),
      normalMap: pbrLib.grass.normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughness: 0.92
    });
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

    // 2 Parked High-Poly Vice Air Widebody Airliners Docked at Boarding Jetways (Clean Wingtip Clearance!)
    this.parkedJets = [];
    const parkedJetA = createAirlinerJet('#FF2E88', maxAniso);
    parkedJetA.root.position.set(-132, 0.02, 78);
    parkedJetA.root.rotation.y = Math.PI * 0.04;
    this.scene.add(parkedJetA.root);
    this.parkedJets.push(parkedJetA);
    this.addBoxCollider(-149, -115, 62, 92);

    const parkedJetB = createAirlinerJet('#21E6D1', maxAniso);
    parkedJetB.root.position.set(-84, 0.02, 78);
    parkedJetB.root.rotation.y = -Math.PI * 0.04;
    this.scene.add(parkedJetB.root);
    this.parkedJets.push(parkedJetB);
    this.addBoxCollider(-101, -67, 62, 92);

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

    // REGIONAL LEONIDA AIRFIELD AIRCRAFT (Wild Hog Airfield, Bobcat Key Airport, Mile Zero Naval Air Station!)
    const extraPlanes = [
      { id: 'wildhog-prop',  placeId: 'wild-hog-airfield', kind: 'prop', color: 0x21e6d1, label: 'GELLHORN STUNT PROP', dx: 18,   dz: 66, yaw: -Math.PI * 0.5 },
      { id: 'bobcat-jet',    placeId: 'bobcat-key',        kind: 'jet',  color: 0xff8a2a, label: 'MARIANA CHARTER JET', dx: -150, dz: 76, yaw: -Math.PI * 0.5 },
      { id: 'milezero-jet',  placeId: 'mile-zero',         kind: 'jet',  color: 0x21e6d1, label: 'MILE ZERO NAVAL JET', dx: 18,   dz: 56, yaw: -Math.PI * 0.5 }
    ];
    extraPlanes.forEach((ep) => {
      const pl = LEONIDA_PLACES.find((p) => p.id === ep.placeId);
      if (!pl) return;
      const px = pl.x + ep.dx;
      const pz = pl.z + ep.dz;
      const py = Math.max(0.4, getLeonidaElevation(px, pz) + 0.08);
      const rig = ep.kind === 'jet' ? createPrivateLearjet(ep.color, maxAniso) : createPropPlane(ep.color);
      rig.root.position.set(px, py, pz);
      rig.root.rotation.y = ep.yaw;
      this.scene.add(rig.root);
      this.flyablePlanes.push({
        id: ep.id, label: ep.label, kind: ep.kind,
        rig, root: rig.root,
        x: px, y: py, z: pz, yaw: ep.yaw, pitch: 0, roll: 0,
        speed: 0, throttle: 0, gearBlend: 1, resetTimer: 0,
        topSpeed: ep.kind === 'jet' ? 112 : 72,
        takeoffSpeed: ep.kind === 'jet' ? 24 : 19,
        climbRate: ep.kind === 'jet' ? 26 : 19,
        homeX: px, homeZ: pz, homeYaw: ep.yaw, radius: ep.kind === 'jet' ? 5.4 : 4.6
      });
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
    this.addCircleCollider(-68, 72, 2.2);
    this.addCircleCollider(-156, 74, 2.2);

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
    this.addCircleCollider(-42, 92, 0.55);

    // LSIA-Style Upgraded Escobar Int'l Airport: FAA Runway 09/27 Markings, Taxiway Blue Edge Lights,
    // Aviation Fuel Farm ("VICE JET-A1"), Security Gatehouse + Perimeter Fence, Hangar #2 & Boarding Airstairs!
    const rwyMarkings = createAirportRunwayMarkings(maxAniso);
    this.scene.add(rwyMarkings.root);

    const fuelFarm = createAirportFuelFarm(maxAniso);
    fuelFarm.position.set(-164, 0, 48);
    this.scene.add(fuelFarm);
    this.addBoxCollider(-174.5, -153.5, 41.5, 54.5);

    // North Open Airport Entry Gatehouse (16.6m clear drive-in opening at X = -56..-39.4, Z = 29)
    const gatehouse = createAirportGatehouse(maxAniso);
    gatehouse.position.set(-58, 0, 29);
    this.scene.add(gatehouse);
    this.addBoxCollider(-60, -56, 27.2, 30.8);

    // East Main Boulevard Open Airport Entry Gatehouse directly off Ocean Drive (17m clear opening at Z = 79..95!)
    const eastGatehouse = createAirportGatehouse(maxAniso);
    eastGatehouse.position.set(-10, 0, 77);
    eastGatehouse.rotation.y = -Math.PI / 2;
    this.scene.add(eastGatehouse);
    this.addBoxCollider(-11.8, -8.2, 75.2, 78.8);

    // Smooth Asphalt Entry Driveways & Lane Stripes leading directly through BOTH open Airport Gates!
    const gateApronMat = new THREE.MeshStandardMaterial({ color: 0x262932, roughness: 0.86, metalness: 0.06 });
    const eastEntryDrive = new THREE.Mesh(new THREE.BoxGeometry(22, 0.09, 17.5), gateApronMat);
    eastEntryDrive.position.set(-12.5, 0.015, 86.8);
    eastEntryDrive.receiveShadow = true;
    const northEntryDrive = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.09, 24), gateApronMat);
    northEntryDrive.position.set(-47.5, 0.015, 25.0);
    northEntryDrive.receiveShadow = true;
    this.scene.add(eastEntryDrive, northEntryDrive);

    const gateStripeMat = new THREE.MeshBasicMaterial({ color: 0x34e89e });
    const gateDashMat = new THREE.MeshBasicMaterial({ color: 0xffd36b });
    for (let s = 0; s < 3; s++) {
      const eDash = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.36), gateDashMat);
      eDash.rotation.x = -Math.PI / 2;
      eDash.position.set(-5.5 - s * 6.0, 0.068, 86.8);
      this.scene.add(eDash);
      const nDash = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 3.2), gateDashMat);
      nDash.rotation.x = -Math.PI / 2;
      nDash.position.set(-47.5, 0.068, 17.5 + s * 6.5);
      this.scene.add(nDash);
    }
    for (const ez of [79.4, 94.2]) {
      const eEdge = new THREE.Mesh(new THREE.PlaneGeometry(20, 0.28), gateStripeMat);
      eEdge.rotation.x = -Math.PI / 2;
      eEdge.position.set(-12.5, 0.068, ez);
      this.scene.add(eEdge);
    }

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

    // SOLID ESCOBAR INT'L AIRPORT SECURITY BARRICADES & CHAIN-LINK PERIMETER FENCING
    // Leaves TWO wide-open drive-in entry gates: East Ocean Drive Gate (Z=74..96) & North Gatehouse (X=-56..-39), plus Terminal Concourse (X=-108)!
    const airportBarricades = [
      [-272, 30, -144, 30],   // North-West tarmac fence
      [-74,  30, -61,  30],   // North-Center fence up to Gatehouse
      [-38.5, 30, -12, 30],   // North-East Hangar #2 fence
      [-274, 30, -274, 154],  // West Runway 09 threshold barricade
      [-10,  30, -10,  74],   // East North perimeter fence (stops cleanly before East Open Entry Gate!)
      [-10,  96, -10,  154],  // East South perimeter fence (resumes cleanly after East Open Entry Gate!)
      [-274, 154, -10, 154]   // South Runway perimeter barricade
    ];
    airportBarricades.forEach(([x1, z1, x2, z2]) => {
      const bw = createBarricadeWall(x1, z1, x2, z2, 'airport', getTerrainHeight);
      this.scene.add(bw.group);
      this.addBoxCollider(bw.collider.minX, bw.collider.maxX, bw.collider.minZ, bw.collider.maxZ);
      this.barricadeBeacons.push(...bw.beacons);
    });

    // FULL-SCALE GREAT STATE OF LEONIDA OPEN WORLD (5 Counties, 68 Named Places, 10 Interstates & Ocean Bridges!)
    // Replaces cramped old Vice-edge roadblock walls so players can drive seamlessly across the entire State of Leonida!
    this.leonidaWorld = buildLeonidaWorld(
      this.scene,
      getTerrainHeight,
      maxAniso,
      (minX, maxX, minZ, maxZ) => this.addBoxCollider(minX, maxX, minZ, maxZ),
      (cx, cz, cr) => this.addCircleCollider(cx, cz, cr),
      SHOWROOMS
    );

    // 1) NORTHERN MOUNT VICE FULL-LOOP RANGE (Z = -1106..-1496, ZERO DEAD ENDS!)
    this.mountVice = createMountViceRange(getTerrainHeight, closestMountainRoad, MOUNT_VICE_ROAD, maxAniso);
    this.scene.add(this.mountVice.root);
    if (this.mountVice.circleColliders) {
      this.mountVice.circleColliders.forEach((c) => this.addCircleCollider(c.x, c.z, c.r));
    }
    // Seamless Asphalt Aprons for BOTH Mount Vice Loop Entries (East Ocean Dr X=0 & West Vice Port Expy X=-480!)
    const connMat = new THREE.MeshStandardMaterial({ color: 0x262933, roughness: 0.84, polygonOffset: true, polygonOffsetFactor: -1 });
    for (const [cx, cz, cw, cd] of [[0, -1108, 14.4, 24.0], [-480, -1108, 14.4, 24.0], [-384, -1126, 13.0, 48.0]]) {
      const conn = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd), connMat);
      conn.rotation.x = -Math.PI / 2;
      conn.position.set(cx, 0.04, cz);
      this.scene.add(conn);
    }

    // 1B) MOUNT VICE SKYWAY — ANIMATED AERIAL ROPEWAY / GONDOLA LIFT (Foothills -> 118M Summit!)
    this.mountViceRopeway = buildMountainRopeway({
      root: this.scene,
      id: 'mt-vice',
      title: 'MOUNT VICE SKYWAY',
      subtitle: '118M SUMMIT CABLE CAR',
      startPos: { x: -116, z: -1114 },
      endPos: { x: -214, z: -1412 },
      numPylons: 4,
      numCabins: 6,
      clearanceY: 16.5,
      speed: 0.038,
      getHeight: getTerrainHeight,
      addCircleCollider: (cx, cz, cr) => this.addCircleCollider(cx, cz, cr),
      addBoxCollider: (a, b, c, d) => this.addBoxCollider(a, b, c, d)
    });

    // Register Rideable Boarding Rings for BOTH Mountain Ropeways (Mount Vice Skyway & Mount Kalaga Gondola!)
    const ropewayRides = [];
    if (this.mountViceRopeway) {
      const mv = this.mountViceRopeway;
      ropewayRides.push(
        {
          id: 'mt-vice-base', ropewayKey: 'mountVice', label: 'MOUNT VICE SKYWAY',
          sub: '118m Alpine Cable Car Ascent',
          boardX: mv.baseBoardPos.x, boardZ: mv.baseBoardPos.z, boardY: mv.baseBoardPos.y,
          exitX: mv.baseBoardPos.x, exitZ: mv.baseBoardPos.z, col: 0xffbe0b
        },
        {
          id: 'mt-vice-summit', ropewayKey: 'mountVice', label: 'MOUNT VICE SKYWAY',
          sub: '118m Summit Gondola Descent',
          boardX: mv.summitBoardPos.x, boardZ: mv.summitBoardPos.z, boardY: mv.summitBoardPos.y,
          exitX: mv.summitBoardPos.x, exitZ: mv.summitBoardPos.z, col: 0xffbe0b
        }
      );
    }
    if (this.leonidaWorld && this.leonidaWorld.kalagaRopeway) {
      const kg = this.leonidaWorld.kalagaRopeway;
      ropewayRides.push(
        {
          id: 'mt-kalaga-base', ropewayKey: 'kalaga', label: 'MT. KALAGA SKYWAY',
          sub: '148m Lummox Alpine Gondola',
          boardX: kg.baseBoardPos.x, boardZ: kg.baseBoardPos.z, boardY: kg.baseBoardPos.y,
          exitX: kg.baseBoardPos.x, exitZ: kg.baseBoardPos.z, col: 0x21e6d1
        },
        {
          id: 'mt-kalaga-summit', ropewayKey: 'kalaga', label: 'MT. KALAGA SKYWAY',
          sub: '148m Summit Observation Lift',
          boardX: kg.summitBoardPos.x, boardZ: kg.summitBoardPos.z, boardY: kg.summitBoardPos.y,
          exitX: kg.summitBoardPos.x, exitZ: kg.summitBoardPos.z, col: 0x21e6d1
        }
      );
    }
    ropewayRides.forEach((rd, idx) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.25, 24),
        new THREE.MeshBasicMaterial({ color: rd.col, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(rd.boardX, (rd.boardY || 0) + 0.24, rd.boardZ);
      this.scene.add(ring);
      this.pierRides.push({ ...rd, ring, phase: 4.0 + idx * 1.1 });
    });

    // THICK ATMOSPHERIC HAZE LAYER (24 Soft-Radial Drifting Horizon & Forest Mist Banks Around Camera!)
    const hazeTex = makeSoftParticleTexture();
    this.worldHazeGroup = new THREE.Group();
    this.worldHazeMats = [];
    for (let hi = 0; hi < 24; hi++) {
      const ang = (hi / 24) * Math.PI * 2;
      const dist = 115 + (hi % 3) * 52;
      const hMat = new THREE.SpriteMaterial({
        map: hazeTex,
        color: 0xcfdce8,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        fog: true
      });
      const hSp = new THREE.Sprite(hMat);
      hSp.position.set(Math.cos(ang) * dist, 14 + (hi % 4) * 10, Math.sin(ang) * dist);
      hSp.scale.set(110 + (hi % 3) * 35, 38 + (hi % 2) * 16, 1);
      hSp.userData = { baseAng: ang, dist, baseY: hSp.position.y, phase: hi * 0.85 };
      this.worldHazeGroup.add(hSp);
      this.worldHazeMats.push(hMat);
    }
    this.scene.add(this.worldHazeGroup);

    // 2) COMPLETELY SEPARATE WESTERN MOUNTAIN RANGE — SIERRA WEST REDROCK PEAKS (X = -885..-492, Z = -760..+240)!
    this.sierraWest = createSierraWestRange(getTerrainHeight, closestSierraRoad, SIERRA_WEST_ROAD, maxAniso);
    this.scene.add(this.sierraWest.root);
    if (this.sierraWest.circleColliders) {
      this.sierraWest.circleColliders.forEach((c) => this.addCircleCollider(c.x, c.z, c.r));
    }
    // Seamless Asphalt Aprons connecting Vice Port Expy (X=-480) to BOTH Sierra West Loop Entrances (Z=-540 & Z=-60)!
    for (const sz of [-540, -60]) {
      const sConn = new THREE.Mesh(new THREE.PlaneGeometry(22.0, 14.6), connMat);
      sConn.rotation.x = -Math.PI / 2;
      sConn.position.set(-488, 0.04, sz);
      this.scene.add(sConn);
    }

    // VICE HOLLOW COUNTRYSIDE COMMUNITY VILLAGE (NW Foothill Valley, X = -448..-308, Z = -1236..-1148!)
    this.village = createCountrysideVillage(getTerrainHeight, maxAniso);
    this.scene.add(this.village.root);
    this.village.boxColliders.forEach((b) => this.addBoxCollider(b.minX, b.maxX, b.minZ, b.maxZ));
    this.village.circleColliders.forEach((c) => this.addCircleCollider(c.x, c.z, c.r));

    // VICE PINES DEEP WOODLAND FOREST (NW Wilderness, X = -486..-362, Z = -1132..-946!)
    this.pineForest = createPineForest(getTerrainHeight, closestMountainRoad, maxAniso);
    this.scene.add(this.pineForest.root);
    this.pineForest.circleColliders.forEach((c) => this.addCircleCollider(c.x, c.z, c.r));

    // LIVE ANIMATED 3D WILDLIFE ANIMALS (Deer, Boars, Village Dogs & Vice City Pink Flamingos across Forest & Both Ranges!)
    const wildlifeSpecs = [
      // White-Tail Deer in Vice Pines Forest, Foothills & Separate Sierra West Redrock Canyons
      { kind: 'deer', x: -426, z: -1028 }, { kind: 'deer', x: -454, z: -1064 },
      { kind: 'deer', x: -406, z: -1088 }, { kind: 'deer', x: -442, z: -992 },
      { kind: 'deer', x: -318, z: -1158 }, { kind: 'deer', x: -162, z: -1172 },
      { kind: 'deer', x: -580, z: -320 },  { kind: 'deer', x: -670, z: -240 },
      { kind: 'deer', x: -640, z: -420 },  { kind: 'deer', x: -620, z: -110 },
      // Wild Forest & Canyon Boars
      { kind: 'boar', x: -460, z: -1015 }, { kind: 'boar', x: -432, z: -1096 },
      { kind: 'boar', x: -468, z: -1072 }, { kind: 'boar', x: -408, z: -978 },
      { kind: 'boar', x: -575, z: -190 },  { kind: 'boar', x: -690, z: -340 },
      // Village & Beachfront Dogs
      { kind: 'dog', x: -380, z: -1184 }, { kind: 'dog', x: -362, z: -1196 },
      { kind: 'dog', x: -404, z: -1192 }, { kind: 'dog', x: 18, z: -140 },
      { kind: 'dog', x: 20, z: -310 },
      // Iconic Vice City Pink Flamingos along Ocean Beach Sand & Lagoons!
      { kind: 'flamingo', x: 28, z: -86 }, { kind: 'flamingo', x: 29.5, z: -92 },
      { kind: 'flamingo', x: 27, z: -95 }, { kind: 'flamingo', x: 28.5, z: -215 },
      { kind: 'flamingo', x: 29, z: -222 }, { kind: 'flamingo', x: 28, z: -510 },
      { kind: 'flamingo', x: 29.5, z: -516 }
    ];
    wildlifeSpecs.forEach((ws, idx) => {
      const rig = createWildlifeAnimal(ws.kind);
      const gy = getTerrainHeight(ws.x, ws.z);
      rig.root.position.set(ws.x, gy, ws.z);
      const yaw = (idx * 1.7) % (Math.PI * 2);
      rig.root.rotation.y = yaw;
      this.scene.add(rig.root);
      this.wildlife.push({
        ...rig,
        x: ws.x, y: gy, z: ws.z,
        homeX: ws.x, homeZ: ws.z,
        yaw, speed: 0, walkPhase: idx * 0.9,
        state: 'wander', stateTimer: 2 + (idx % 4),
        baseSpeed: ws.kind === 'deer' ? 2.2 : (ws.kind === 'boar' ? 1.8 : (ws.kind === 'dog' ? 2.4 : 0.7)),
        fleeSpeed: ws.kind === 'deer' ? 9.5 : (ws.kind === 'boar' ? 6.8 : (ws.kind === 'dog' ? 6.2 : 2.6))
      });
    });

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
    const seawallMat = new THREE.MeshStandardMaterial({
      map: pbrLib.concrete.map,
      normalMap: pbrLib.concrete.normalMap,
      normalScale: new THREE.Vector2(1.0, 1.0),
      color: 0xdcd4ca,
      roughness: 0.80
    });
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

    // Instanced Beach Umbrellas & Lounge Chairs along Extended Golden Sand Coastline (with Solid Colliders!)
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
      this.addCircleCollider(up.x, up.z, 0.72);
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
      const srY = Math.max(0.16, this.getSurfaceY(sr.x, sr.z, false));
      srObj.group.position.set(sr.x, srY, sr.z);
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
      // Ocean Drive Beachfront Row (Ocean View Hotel is mounted standalone as a 2-story usable safehouse!)
      { x: -24.5, z: -116, w: 22, h: 16, d: 15, base: '#F2E0CC', trimHex: '#FFF6EC', accent: 0x0ec4b8, accentHex: '#0EC4B8', name: 'THE COLONY',  sub: 'SPANISH VILLAS',   seed: 2, cafe: true,  style: 'colonial' },
      { x: -24.5, z: -190, w: 26, h: 18, d: 15, base: '#E4DDD6', trimHex: '#FAF4EE', accent: 0xff3a4c, accentHex: '#FF3A4C', name: 'AMMU-NATION', sub: 'GUNS · WALK IN',   seed: 3, cafe: false, style: 'artdeco', enterable: 'ammunation' },
      { x: -24.5, z: -252, w: 26, h: 24, d: 15, base: '#E8DCE8', trimHex: '#F8F2FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'CLEVELANDER', sub: 'LOUNGE & SUITES',  seed: 4, cafe: true,  style: 'midtown_tower' },
      { x: -24.5, z: -424, w: 24, h: 18, d: 15, base: '#E8DEC8', trimHex: '#FFF8EC', accent: 0x18c4be, accentHex: '#18C4BE', name: 'CARLYLE',     sub: 'COLONIAL SUITES',  seed: 6, cafe: true,  style: 'colonial' },
      { x: -24.5, z: -512, w: 28, h: 24, d: 15, base: '#EED6DC', trimHex: '#FFF4F6', accent: 0xff2e88, accentHex: '#FF2E88', name: 'BREAKWATER',  sub: 'OCEAN FRONT',      seed: 7, cafe: true,  style: 'artdeco' },
      { x: -24.5, z: -574, w: 26, h: 17, d: 15, base: '#E6DFD2', trimHex: '#FAF7F2', accent: 0xff7a24, accentHex: '#FF7A24', name: 'BEACON',      sub: 'MIAMI COLONIAL',   seed: 8, cafe: true,  style: 'colonial' },

      // Midtown Towers & Glass Atriums (Between Ocean Drive & Washington Ave: X = -64)
      { x: -64, z: -60,  w: 36, h: 32, d: 24, base: '#E2D8CE', trimHex: '#F7F3EE', accent: 0x18c4be, accentHex: '#18C4BE', name: 'VICE PLAZA', sub: 'MIDTOWN TOWER', seed: 9,  cafe: false, style: 'midtown_tower' },
      { x: -64, z: -220, w: 38, h: 38, d: 24, base: '#DCE2EC', trimHex: '#F2F6FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'BISCAYNE',   sub: 'SETBACK TOWER', seed: 10, cafe: false, style: 'midtown_tower' },
      { x: -64, z: -380, w: 36, h: 22, d: 24, base: '#EDE0D2', trimHex: '#FFF8F0', accent: 0xe6a822, accentHex: '#E6A822', name: 'POINCIANA',  sub: 'GRAND ATRIUM',  seed: 11, cafe: false, style: 'mall_atrium' },
      { x: -64, z: -540, w: 38, h: 20, d: 24, base: '#D8E2E0', trimHex: '#F2F8F6', accent: 0x18c4be, accentHex: '#18C4BE', name: 'WASHINGTON', sub: 'SHOPPING MALL', seed: 12, cafe: false, style: 'mall_atrium' },

      // North Vice Point Heights (North Point Mall is mounted standalone at X=-50, Z=-1018!)
      { x: -24.5, z: -676, w: 26, h: 26, d: 15, base: '#F0DEE6', trimHex: '#FFF6FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'NORTH PALMS', sub: 'VICE HEIGHTS', seed: 17, cafe: true, style: 'midtown_tower' },
      { x: -24.5, z: -738, w: 26, h: 28, d: 15, base: '#D6ECE8', trimHex: '#F2FCFA', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'BAYSIDE CLUB', sub: 'PENTHOUSE',  seed: 18, cafe: true, style: 'artdeco' },
      { x: -24.5, z: -846, w: 28, h: 18, d: 15, base: '#F4DFCE', trimHex: '#FFF7EE', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'EL SWANKO',   sub: 'NORTH CASA',  seed: 26, cafe: true, style: 'colonial' },
      { x: -24.5, z: -904, w: 26, h: 24, d: 15, base: '#DCE8F0', trimHex: '#F4FAFF', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'LINKS VIEW',  sub: 'ESTATES',     seed: 27, cafe: true, style: 'midtown_tower' },
      { x: -64,   z: -700, w: 38, h: 36, d: 24, base: '#EDE2D4', trimHex: '#FAF6F0', accent: 0xffd36b, accentHex: '#FFD36B', name: 'SUNSET ROYALE', sub: 'RESIDENCES', seed: 19, cafe: false, style: 'midtown_tower' },
      { x: -64,   z: -860, w: 38, h: 32, d: 24, base: '#D8E8E4', trimHex: '#F2FCFA', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'FAIRGROUND',  sub: 'NORTH TOWER', seed: 29, cafe: false, style: 'midtown_tower' },

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

        const ebId = hd.enterable === 'hotel' ? 'ocean-view' : 'ammunation';
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

    // 7b. STANDALONE REBUILT THE MALIBU CLUB (Streamline Moderne Exterior + 2-Level Enterable Disco Interior!)
    const malibuX = -30.0, malibuZ = -344.0;
    this.malibuExtras = createMalibuClubBuilding(maxAniso);
    this.malibuExtras.root.position.set(malibuX, 0.16, malibuZ);
    this.scene.add(this.malibuExtras.root);
    if (this.malibuExtras.localColliders) {
      this.malibuExtras.localColliders.forEach((c) => {
        this.addBoxCollider(malibuX + c.minX, malibuX + c.maxX, malibuZ + c.minZ, malibuZ + c.maxZ);
      });
    }
    this.enterableBuildings.push({
      id: 'malibu-club', label: 'THE MALIBU CLUB', kind: 'club',
      doorX: malibuX + 14.5, doorZ: malibuZ,
      insideX: malibuX + 4.5, insideZ: malibuZ, insideYaw: Math.PI / 2,
      perkX: malibuX + 2.2, perkZ: malibuZ + 7.2,
      bounds: { minX: malibuX - 11.4, maxX: malibuX + 11.4, minZ: malibuZ - 10.4, maxZ: malibuZ + 10.4 },
      accent: 0xff2e88, accentHex: '#FF2E88'
    });

    // 7c. STANDALONE HUGE ENTERABLE 2-STORY NORTH POINT MALL (68m x 54m Vice City Shopping Concourse!)
    const mallX = -50.0, mallZ = -1018.0;
    this.northPointMall = createNorthPointMall(maxAniso);
    this.northPointMall.root.position.set(mallX, 0.16, mallZ);
    this.scene.add(this.northPointMall.root);
    if (this.northPointMall.localColliders) {
      this.northPointMall.localColliders.forEach((c) => {
        this.addBoxCollider(mallX + c.minX, mallX + c.maxX, mallZ + c.minZ, mallZ + c.maxZ);
      });
    }
    this.enterableBuildings.push({
      id: 'north-point-mall', label: 'NORTH POINT MALL', kind: 'mall',
      doorX: mallX + 35.8, doorZ: mallZ,
      insideX: mallX + 22.0, insideZ: mallZ, insideYaw: Math.PI / 2,
      perkX: mallX, perkZ: mallZ - 21.5,
      bounds: { minX: mallX - 32.0, maxX: mallX + 32.0, minZ: mallZ - 25.0, maxZ: mallZ + 25.0 },
      accent: 0x21e6d1, accentHex: '#21E6D1'
    });

    // 7d. STANDALONE 2-STORY USABLE OCEAN VIEW HOTEL SAFEHOUSE (Walkable 1st Floor Suite: Sleep, Watch TV, Eat Food, Wardrobe!)
    const ovX = -24.5, ovZ = -48.0;
    this.oceanViewSafehouse = createOceanViewSafehouse(maxAniso);
    this.oceanViewSafehouse.root.position.set(ovX, 0.16, ovZ);
    this.scene.add(this.oceanViewSafehouse.root);
    if (this.oceanViewSafehouse.localColliders) {
      this.oceanViewSafehouse.localColliders.forEach((c) => {
        this.addBoxCollider(ovX + c.minX, ovX + c.maxX, ovZ + c.minZ, ovZ + c.maxZ);
      });
    }
    this.safehouseStations = (this.oceanViewSafehouse.stationDefs || []).map((st) => ({
      id: st.id,
      label: st.label,
      x: ovX + st.lx,
      y: 0.16 + this.oceanViewSafehouse.floor1Y,
      z: ovZ + st.lz
    }));
    this.enterableBuildings.push({
      id: 'ocean-view', label: 'OCEAN VIEW SAFEHOUSE', kind: 'hotel',
      doorX: ovX + 9.4, doorZ: ovZ,
      insideX: ovX + 2.0, insideZ: ovZ, insideYaw: Math.PI / 2,
      perkX: ovX - 0.5, perkZ: ovZ + 2.0,
      bounds: { minX: ovX - 7.3, maxX: ovX + 7.3, minZ: ovZ - 11.2, maxZ: ovZ + 11.2, floor1Y: 0.16 + this.oceanViewSafehouse.floor1Y, ceilY: 9.25 },
      accent: 0xff2e88, accentHex: '#FF2E88'
    });

    // 7e. WALK-IN BARBER SHOPS (2 Ocean Drive Locations — Get New 3D Hairstyles & Hair Colors!)
    this.shopInteractZones = [];
    this.barberPoles = [];
    const barberSpots = [
      { id: 'barber-ocean', x: -24.5, z: -221.0, title: 'VICE CUTS BARBER', accent: 0x21e6d1, accentHex: '#21E6D1' },
      { id: 'barber-north', x: -24.5, z: -707.0, title: 'NORTH POINT BARBER', accent: 0xff2e88, accentHex: '#FF2E88' }
    ];
    barberSpots.forEach((bs) => {
      const shop = createBarberShopBuilding(maxAniso, bs.title, bs.accentHex);
      shop.root.position.set(bs.x, 0.16, bs.z);
      this.scene.add(shop.root);
      if (shop.localColliders) {
        shop.localColliders.forEach((c) => {
          this.addBoxCollider(bs.x + c.minX, bs.x + c.maxX, bs.z + c.minZ, bs.z + c.maxZ);
        });
      }
      if (shop.barberPoles) this.barberPoles.push(...shop.barberPoles);
      this.shopInteractZones.push({
        id: bs.id, kind: 'barber', label: bs.title,
        x: bs.x - 1.2, y: 0.16, z: bs.z, radius: 3.4, ring: shop.shopRing
      });
      this.enterableBuildings.push({
        id: bs.id, label: bs.title, kind: 'barber',
        doorX: bs.x + 8.4, doorZ: bs.z,
        insideX: bs.x + 1.5, insideZ: bs.z, insideYaw: Math.PI / 2,
        perkX: bs.x - 1.2, perkZ: bs.z, skipPerk: true,
        bounds: { minX: bs.x - 6.6, maxX: bs.x + 6.6, minZ: bs.z - 8.1, maxZ: bs.z + 8.1 },
        accent: bs.accent, accentHex: bs.accentHex
      });
    });

    // 7f. WALK-IN DESIGNER CLOTHES STORES (2 Ocean Drive Locations — Buy & Equip Outfits + Shades!)
    const clothesSpots = [
      { id: 'clothes-vice', x: -24.5, z: -384.0, title: 'VICE COUTURE CLOTHES', accent: 0xff2e88, accentHex: '#FF2E88' },
      { id: 'clothes-gash', x: -24.5, z: -808.0, title: 'GASH DESIGNER CLOTHES', accent: 0xffd36b, accentHex: '#FFD36B' }
    ];
    clothesSpots.forEach((csSpot) => {
      const store = createClothesStoreBuilding(maxAniso, csSpot.title, csSpot.accentHex);
      store.root.position.set(csSpot.x, 0.16, csSpot.z);
      this.scene.add(store.root);
      if (store.localColliders) {
        store.localColliders.forEach((c) => {
          this.addBoxCollider(csSpot.x + c.minX, csSpot.x + c.maxX, csSpot.z + c.minZ, csSpot.z + c.maxZ);
        });
      }
      this.shopInteractZones.push({
        id: csSpot.id, kind: 'clothes', label: csSpot.title,
        x: csSpot.x - 1.4, y: 0.16, z: csSpot.z, radius: 3.8, ring: store.shopRing
      });
      this.enterableBuildings.push({
        id: csSpot.id, label: csSpot.title, kind: 'clothes',
        doorX: csSpot.x + 8.6, doorZ: csSpot.z,
        insideX: csSpot.x + 1.5, insideZ: csSpot.z, insideYaw: Math.PI / 2,
        perkX: csSpot.x - 1.4, perkZ: csSpot.z, skipPerk: true,
        bounds: { minX: csSpot.x - 6.8, maxX: csSpot.x + 6.8, minZ: csSpot.z - 8.8, maxZ: csSpot.z + 8.8 },
        accent: csSpot.accent, accentHex: csSpot.accentHex
      });
    });

    // 7g. NEW ENTERABLE INTERIORS: PAY 'N' SPRAY MOD GARAGE, BURGER SHOT 24/7 DINER & AMMU-NATION GUN STORE + RANGE
    const pnsX = -68.0, pnsZ = -182.0;
    this.payNSpray = createPayNSprayBuilding(maxAniso);
    this.payNSpray.root.position.set(pnsX, 0.16, pnsZ);
    this.scene.add(this.payNSpray.root);
    this.payNSpray.localColliders.forEach((c) => this.addBoxCollider(pnsX + c.minX, pnsX + c.maxX, pnsZ + c.minZ, pnsZ + c.maxZ));
    this.shopInteractZones.push({ id: 'paynspray', kind: 'paynspray', label: "PAY 'N' SPRAY MOD GARAGE", x: pnsX + 1.5, y: 0.16, z: pnsZ, radius: 6.2, allowInCar: true });
    this.enterableBuildings.push({
      id: 'paynspray', label: "PAY 'N' SPRAY GARAGE", kind: 'garage',
      doorX: pnsX + 8.6, doorZ: pnsZ, insideX: pnsX + 1.5, insideZ: pnsZ, insideYaw: Math.PI / 2,
      perkX: pnsX + 1.5, perkZ: pnsZ, skipPerk: true,
      bounds: { minX: pnsX - 6.8, maxX: pnsX + 6.8, minZ: pnsZ - 5.8, maxZ: pnsZ + 5.8 },
      accent: 0xff8a2a, accentHex: '#FF8A2A'
    });

    const bsX = -68.0, bsZ = -262.0;
    this.burgerShot = createBurgerShotBuilding(maxAniso);
    this.burgerShot.root.position.set(bsX, 0.16, bsZ);
    this.scene.add(this.burgerShot.root);
    this.burgerShot.localColliders.forEach((c) => this.addBoxCollider(bsX + c.minX, bsX + c.maxX, bsZ + c.minZ, bsZ + c.maxZ));
    this.shopInteractZones.push({ id: 'burgershot', kind: 'diner', label: 'BURGER SHOT 24/7 DINER', x: bsX - 0.8, y: 0.16, z: bsZ, radius: 4.0 });
    this.enterableBuildings.push({
      id: 'burgershot', label: 'BURGER SHOT 24/7', kind: 'diner',
      doorX: bsX + 8.4, doorZ: bsZ, insideX: bsX + 2.0, insideZ: bsZ, insideYaw: Math.PI / 2,
      perkX: bsX - 0.8, perkZ: bsZ, skipPerk: true,
      bounds: { minX: bsX - 6.5, maxX: bsX + 6.5, minZ: bsZ - 5.5, maxZ: bsZ + 5.5 },
      accent: 0xffd36b, accentHex: '#FFD36B'
    });

    const amX = -68.0, amZ = -102.0;
    this.ammuNation = createAmmuNationBuilding(maxAniso);
    this.ammuNation.root.position.set(amX, 0.16, amZ);
    this.scene.add(this.ammuNation.root);
    this.ammuNation.localColliders.forEach((c) => this.addBoxCollider(amX + c.minX, amX + c.maxX, amZ + c.minZ, amZ + c.maxZ));
    this.ammuNationWorld = { x: amX, z: amZ };
    this.shopInteractZones.push({ id: 'ammunation-shop', kind: 'ammu', label: 'AMMU-NATION & RANGE', x: amX + 2.8, y: 0.16, z: amZ - 1.5, radius: 4.2 });
    this.enterableBuildings.push({
      id: 'ammunation', label: 'AMMU-NATION GUN STORE', kind: 'ammu',
      doorX: amX + 9.4, doorZ: amZ, insideX: amX + 3.2, insideZ: amZ, insideYaw: Math.PI / 2,
      perkX: amX + 2.2, perkZ: amZ - 2.2, skipPerk: true,
      bounds: { minX: amX - 7.8, maxX: amX + 7.8, minZ: amZ - 5.6, maxZ: amZ + 5.6 },
      accent: 0xff3b4e, accentHex: '#FF3B4E'
    });

    // 7h. FLYABLE MAVERICK HELICOPTERS (Escobar Int'l Helipad & Vice Beach Marina Pad)
    const heliDefs = [
      { id: 'heli-airport', label: 'VICE MAVERICK CHOPPER', x: -64, y: 0.04, z: 62, yaw: 0, col: 0x21e6d1, stripe: 0xff2e88 },
      { id: 'heli-marina',  label: 'VIP GOLDEN CHOPPER',    x: 24,  y: 0.18, z: -86, yaw: Math.PI * 0.5, col: 0xffd36b, stripe: 0x1a1528 }
    ];
    heliDefs.forEach((hd) => {
      const hRig = createHelicopter(hd.col, hd.stripe);
      hRig.root.position.set(hd.x, hd.y, hd.z);
      hRig.root.rotation.y = hd.yaw;
      this.scene.add(hRig.root);
      this.flyablePlanes.push({
        id: hd.id, label: hd.label, kind: 'heli', isHeli: true,
        rig: hRig, root: hRig.root,
        x: hd.x, y: hd.y, z: hd.z, yaw: hd.yaw, pitch: 0, roll: 0,
        speed: 0, throttle: 0, vzHeli: 0, gearBlend: 1, resetTimer: 0,
        topSpeed: 54, takeoffSpeed: 0, climbRate: 22,
        homeX: hd.x, homeZ: hd.z, homeYaw: hd.yaw, radius: 5.2
      });
    });

    // 7i. DRIVABLE WATERCRAFT (Speedboats & Jet Skis along Vice Beach, Pier & Leonida Keys)
    const boatDefs = [
      { id: 'boat-beach1', type: 'speedboat', label: 'VICE SQUALLO SPEEDBOAT', x: 46, z: -130, yaw: 0, col: 0xffffff, stripe: 0xff2e88 },
      { id: 'boat-jetski1', type: 'jetski',   label: 'VICE WAVE RUNNER',       x: 43, z: -285, yaw: 0, col: 0x21e6d1, stripe: 0xff2e88 },
      { id: 'boat-pier',   type: 'speedboat', label: 'CARNIVAL CRUISER BOAT',  x: 54, z: -458, yaw: -Math.PI * 0.4, col: 0xffd36b, stripe: 0x162038 },
      { id: 'boat-jetski2', type: 'jetski',   label: 'STARFISH JET SKI',       x: 112, z: -332, yaw: Math.PI * 0.5, col: 0xff8a2a, stripe: 0x21e6d1 }
    ];
    this.boats = [];
    boatDefs.forEach((bd, idx) => {
      const bRig = bd.type === 'jetski' ? createJetSki(bd.col) : createSpeedboat(bd.col, bd.stripe);
      bRig.root.position.set(bd.x, -0.44, bd.z);
      bRig.root.rotation.y = bd.yaw;
      this.scene.add(bRig.root);
      this.boats.push({
        ...bd, rig: bRig, root: bRig.root,
        y: -0.44, speed: 0, steer: 0, roll: 0, pitch: 0, phase: idx * 1.5,
        topSpeed: bRig.topSpeed || 35, homeX: bd.x, homeZ: bd.z, homeYaw: bd.yaw
      });
    });

    // 7j. PERSISTENT AERIAL SKY-RINGS, SKIDMARK POOL, 3D ROUTE CHEVRONS & MISSION BEACON
    this.skyRings = createSkyRings(this.scene);
    this.skidPool = new SkidmarkPool(this.scene, 110);
    this.routeGuide = new RouteChevronGuide(this.scene, 6);
    this.missionBeacon = createMissionBeacon(this.scene);
    this.setupCarModMeshes();
    this.applyCarMods();
    this.applyGraphicsPreset(this.graphicsPreset, false);

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

      if (eb.skipPerk) return;

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
      new THREE.MeshStandardMaterial({
        map: pbrLib.corrugated.map,
        normalMap: pbrLib.corrugated.normalMap,
        normalScale: new THREE.Vector2(1.25, 1.25),
        color: 0xffffff,
        roughness: 0.58,
        metalness: 0.42
      }),
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
      // Ocean Drive (North & Southbound — bustling Miami beachfront avenue!)
      { x: -3.6,   z:  310, speed:  12, color: 0xf4c430, type: 'taxi' },
      { x: -3.6,   z:  220, speed:  13, color: 0x21e6d1, type: 'convertible' },
      { x: -3.6,   z:  130, speed:  12, color: 0xff6b35, type: 'coupe' },
      { x: -3.6,   z:   42, speed:  11, color: 0xf4c430, type: 'taxi' },
      { x: -3.6,   z:  -46, speed:  12, color: 0x21e6d1, type: 'convertible' },
      { x: -3.6,   z: -135, speed:  13, color: 0xff2e88, type: 'muscle' },
      { x: -3.6,   z: -225, speed:  12, color: 0x3b82f6, type: 'suv' },
      { x: -3.6,   z: -325, speed:  12, color: 0xf4c430, type: 'taxi' },
      { x: -3.6,   z: -420, speed:  13, color: 0x9b5de5, type: 'convertible' },
      { x: -3.6,   z: -515, speed:  13, color: 0x3b82f6, type: 'suv' },
      { x: -3.6,   z: -620, speed:  12, color: 0xe2dde8, type: 'coupe' },
      { x: -3.6,   z: -740, speed:  13, color: 0x34e89e, type: 'muscle' },
      { x: -3.6,   z: -865, speed:  13, color: 0xff8a2a, type: 'muscle' },
      { x: -3.6,   z: -990, speed:  12, color: 0xf4c430, type: 'taxi' },
      { x:  3.6,   z:  295, speed: -12, color: 0xf4c430, type: 'taxi' },
      { x:  3.6,   z:  195, speed: -13, color: 0x3b66d8, type: 'suv' },
      { x:  3.6,   z:   92, speed: -12, color: 0xff6b35, type: 'convertible' },
      { x:  3.6,   z:   -8, speed: -13, color: 0xe2dde8, type: 'coupe' },
      { x:  3.6,   z:  -98, speed: -12, color: 0xf4c430, type: 'taxi' },
      { x:  3.6,   z: -195, speed: -14, color: 0xd93060, type: 'muscle' },
      { x:  3.6,   z: -305, speed: -12, color: 0x21e6d1, type: 'convertible' },
      { x:  3.6,   z: -415, speed: -13, color: 0x18b5aa, type: 'suv' },
      { x:  3.6,   z: -525, speed: -13, color: 0xf4c430, type: 'taxi' },
      { x:  3.6,   z: -630, speed: -13, color: 0xe6a834, type: 'coupe' },
      { x:  3.6,   z: -745, speed: -12, color: 0x9b5de5, type: 'convertible' },
      { x:  3.6,   z: -875, speed: -14, color: 0x34e89e, type: 'muscle' },
      { x:  3.6,   z: -1010, speed: -13, color: 0xff2e88, type: 'muscle' },
      // Washington Avenue (High-Density Midtown Traffic)
      { x: -99.6,  z:  260, speed:  13, color: 0x18b5aa, type: 'suv' },
      { x: -99.6,  z:  140, speed:  13, color: 0xff2e88, type: 'convertible' },
      { x: -99.6,  z:   30, speed:  13, color: 0xe68838, type: 'muscle' },
      { x: -99.6,  z: -115, speed:  12, color: 0xf4c430, type: 'taxi' },
      { x: -99.6,  z: -260, speed:  14, color: 0xe2dde8, type: 'coupe' },
      { x: -99.6,  z: -395, speed:  13, color: 0x18b5aa, type: 'convertible' },
      { x: -99.6,  z: -535, speed:  13, color: 0xd93060, type: 'muscle' },
      { x: -99.6,  z: -675, speed:  14, color: 0x3b66d8, type: 'suv' },
      { x: -99.6,  z: -820, speed:  13, color: 0x34e89e, type: 'coupe' },
      { x: -99.6,  z: -970, speed:  13, color: 0xf4c430, type: 'taxi' },
      { x: -92.4,  z:  215, speed: -13, color: 0xf4c430, type: 'taxi' },
      { x: -92.4,  z:   75, speed: -14, color: 0x21e6d1, type: 'suv' },
      { x: -92.4,  z:  -65, speed: -14, color: 0xd93060, type: 'coupe' },
      { x: -92.4,  z: -210, speed: -13, color: 0xff8a2a, type: 'convertible' },
      { x: -92.4,  z: -345, speed: -13, color: 0xe2dde8, type: 'muscle' },
      { x: -92.4,  z: -485, speed: -14, color: 0x9b5de5, type: 'coupe' },
      { x: -92.4,  z: -620, speed: -13, color: 0xf4c430, type: 'taxi' },
      { x: -92.4,  z: -775, speed: -14, color: 0x3b82f6, type: 'suv' },
      { x: -92.4,  z: -920, speed: -14, color: 0x21e6d1, type: 'convertible' },
      // Downtown Highway (Both Lanes)
      { x: -195.6, z:  220, speed:  15, color: 0xf4c430, type: 'taxi' },
      { x: -195.6, z:   45, speed:  15, color: 0xff6b35, type: 'muscle' },
      { x: -195.6, z: -130, speed:  15, color: 0xe2dde8, type: 'coupe' },
      { x: -195.6, z: -340, speed:  14, color: 0x3b66d8, type: 'suv' },
      { x: -195.6, z: -570, speed:  15, color: 0x21e6d1, type: 'convertible' },
      { x: -195.6, z: -830, speed:  15, color: 0xd93060, type: 'muscle' },
      { x: -188.4, z:  160, speed: -14, color: 0x18b5aa, type: 'suv' },
      { x: -188.4, z:  -55, speed: -15, color: 0xf4c430, type: 'taxi' },
      { x: -188.4, z: -260, speed: -15, color: 0x9b5de5, type: 'coupe' },
      { x: -188.4, z: -460, speed: -15, color: 0xff2e88, type: 'muscle' },
      { x: -188.4, z: -690, speed: -14, color: 0xe6a834, type: 'convertible' },
      { x: -188.4, z: -910, speed: -14, color: 0x21e6d1, type: 'suv' },
      // West Bayside Blvd
      { x: -291.6, z:  180, speed:  14, color: 0x34e89e, type: 'convertible' },
      { x: -291.6, z:  -30, speed:  14, color: 0x3b82f6, type: 'suv' },
      { x: -291.6, z: -240, speed:  14, color: 0xf4c430, type: 'taxi' },
      { x: -291.6, z: -510, speed:  15, color: 0xd93060, type: 'muscle' },
      { x: -291.6, z: -810, speed:  14, color: 0xe2dde8, type: 'coupe' },
      { x: -284.4, z:   95, speed: -14, color: 0xff2e88, type: 'muscle' },
      { x: -284.4, z: -180, speed: -15, color: 0xf4c430, type: 'taxi' },
      { x: -284.4, z: -480, speed: -15, color: 0xff8a2a, type: 'convertible' },
      { x: -284.4, z: -760, speed: -14, color: 0x18b5aa, type: 'suv' },
      { x: -284.4, z: -960, speed: -14, color: 0xe2dde8, type: 'coupe' },
      // Little Haiti Ave & Vice Port Expressway
      { x: -387.6, z:  160, speed:  13, color: 0xf4c430, type: 'taxi' },
      { x: -387.6, z: -180, speed:  14, color: 0x3b66d8, type: 'suv' },
      { x: -387.6, z: -540, speed:  13, color: 0xff2e88, type: 'convertible' },
      { x: -387.6, z: -860, speed:  14, color: 0xe68838, type: 'muscle' },
      { x: -380.4, z:   20, speed: -14, color: 0xe2dde8, type: 'coupe' },
      { x: -380.4, z: -360, speed: -14, color: 0x34e89e, type: 'muscle' },
      { x: -380.4, z: -720, speed: -13, color: 0xf4c430, type: 'taxi' },
      { x: -483.6, z:  110, speed:  14, color: 0xff6b35, type: 'coupe' },
      { x: -483.6, z: -240, speed:  14, color: 0x3b66d8, type: 'suv' },
      { x: -483.6, z: -640, speed:  15, color: 0x21e6d1, type: 'convertible' },
      { x: -476.4, z:  -75, speed: -15, color: 0xf4c430, type: 'taxi' },
      { x: -476.4, z: -480, speed: -15, color: 0xe68838, type: 'muscle' },
      { x: -476.4, z: -890, speed: -14, color: 0xd93060, type: 'suv' }
    ];
    trafficSpecs.forEach((ts) => {
      // Avenues intersecting Escobar Int'l Airport (X in -305..-8) stay strictly north of the airport fence (Z <= 14)
      const hitsAirport = ts.x > -305 && ts.x < -8;
      const zMax = hitsAirport ? 14 : 300;
      const zMin = -1050;
      let spawnZ = ts.z;
      if (spawnZ > zMax - 4) spawnZ = zMin + ((Math.abs(spawnZ) * 3.7) % (zMax - zMin - 40));
      if (spawnZ < zMin + 4) spawnZ = zMin + 24;
      // Nudge initial spawn out of any building/barricade box collider
      for (let tries = 0; tries < 10; tries++) {
        const boxes = this.colliderGrid.queryBoxes(ts.x, spawnZ, 3.2);
        let overlap = false;
        for (let bIdx = 0; bIdx < boxes.length; bIdx++) {
          const b = boxes[bIdx];
          if (ts.x + 1.25 > b.minX && ts.x - 1.25 < b.maxX && spawnZ + 2.4 > b.minZ && spawnZ - 2.4 < b.maxZ) {
            overlap = true;
            break;
          }
        }
        if (!overlap) break;
        spawnZ -= 22;
        if (spawnZ < zMin + 8) spawnZ = zMax - 18;
      }
      // Compute opposite-direction parallel lane X (lanes are ±3.6m around avenue centerlines 0, -96, -192, -288, -384, -480)
      const aveCenter = Math.round(ts.x / 96) * 96;
      const pairX = aveCenter - (ts.x - aveCenter);
      const tc = createTrafficCar(ts.color, ts.type);
      tc.position.set(ts.x, 0, spawnZ);
      const origYaw = ts.speed > 0 ? Math.PI : 0;
      tc.rotation.y = origYaw;
      const maxHp = ts.type === 'suv' ? 135 : 100;
      tc.userData = {
        ...tc.userData,
        speed: ts.speed, baseSpeed: ts.speed, stun: 0, vx: 0, vy: 0, vz: 0,
        spinX: 0, spinZ: 0, wheelSpin: 0,
        carType: ts.type, colorHex: ts.color,
        hp: maxHp, maxHp, vehState: 'ok', burnTimer: 0, wreckTimer: 0, fireTick: 0,
        origX: ts.x, pairX, origZ: spawnZ, origYaw, zMin, zMax
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

    // B. Clean Realistic Roads — Zero Stunt Ramps on Boulevards, Bridges or Runways!
    this.ramps = [];

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

    // G. Rideable Parked Two-Wheelers (PCJ-600 Superbikes, Sanchez Dirt Bikes, Faggio Scooters),
    //    VCPD Patrol Cruiser & Kaufman Cabs Yellow Taxi across Vice City & Vice Hollow Village!
    const bikeSpecs = [
      { kind: 'pcj600',  color: 0xff2e88, x:  9.2,   z: -8.0,   yaw: 0.25 },
      { kind: 'faggio',  color: 0x21e6d1, x: -10.8,  z: -332.0, yaw: 0.15 }, // Outside Malibu Club!
      { kind: 'pcj600',  color: 0xffd36b, x:  13.2,  z: -424.0, yaw: -1.2 }, // Carnival Pier entrance!
      { kind: 'sanchez', color: 0xff5a22, x: -372.0, z: -1188,  yaw: 1.55 }, // Vice Hollow Village!
      { kind: 'sanchez', color: 0x34e89e, x: -8.5,   z: -1112,  yaw: 0.0  }, // Mount Vice East Trailhead!
      { kind: 'sanchez', color: 0xff8a2a, x: -496.0, z: -532.0, yaw: Math.PI / 2 }, // Sierra West North Entry!
      { kind: 'sanchez', color: 0xffd36b, x: -762.0, z: -206.0, yaw: -Math.PI / 2 }, // Sierra West Redrock Overlook!
      { kind: 'faggio',  color: 0xff9ec4, x: -10.5,  z: -56.0,  yaw: 0.1  }  // Outside Ocean View Hotel!
    ];
    bikeSpecs.forEach((bs) => {
      const rig = createMotorcycle(bs.kind, bs.color);
      const gy = getTerrainHeight(bs.x, bs.z);
      rig.root.position.set(bs.x, gy, bs.z);
      rig.root.rotation.y = bs.yaw;
      this.scene.add(rig.root);
      this.parkedVehicles.push({
        isHero: false, isBike: true, label: rig.label,
        mesh: rig.root, rig,
        topSpeed: rig.topSpeed, nitroSpeed: rig.topSpeed * 1.32,
        accel: rig.accel, grip: rig.grip,
        x: bs.x, y: gy, z: bs.z, yaw: bs.yaw
      });
    });

    // Parked Stealable VCPD Police Cruiser & Kaufman Cabs Yellow Taxi on Ocean Drive
    const parkedCop = createPoliceCruiser(maxAniso);
    parkedCop.root.position.set(-10.2, 0.02, -168);
    parkedCop.root.rotation.y = 0.08;
    this.scene.add(parkedCop.root);
    this.parkedVehicles.push({
      isHero: false, isPolice: true, label: 'VCPD CRUISER',
      mesh: parkedCop.root, rig: parkedCop,
      topSpeed: parkedCop.topSpeed, nitroSpeed: 64, accel: parkedCop.accel, grip: parkedCop.grip,
      x: -10.2, y: 0.02, z: -168, yaw: 0.08
    });

    const parkedCab = createTrafficCar(0xf4c430, 'taxi');
    parkedCab.position.set(-10.2, 0.02, -24);
    parkedCab.rotation.y = 0.06;
    this.scene.add(parkedCab);
    const cabRig = parkedCab.userData.carRig;
    this.parkedVehicles.push({
      isHero: false, isTaxi: true, label: 'KAUFMAN CAB TAXI',
      mesh: parkedCab, rig: cabRig,
      topSpeed: 44, nitroSpeed: 58, accel: 20, grip: 0.94,
      x: -10.2, y: 0.02, z: -24, yaw: 0.06
    });

    // 2 Valet-Parked Classic Coupes Outside Beachfront Hotels (Rideable via [F]!)
    [[-10.2, -366, 0xff2e88], [-10.2, -502, 0xe2dde8]].forEach(([x, z, col]) => {
      const pc = createTrafficCar(col, 'convertible');
      pc.position.set(x, 0.02, z);
      pc.rotation.y = 0.08;
      this.scene.add(pc);
      const rig = pc.userData.carRig;
      this.parkedVehicles.push({
        isHero: false, label: rig ? rig.label : 'VICE COUPE',
        mesh: pc, rig, topSpeed: 46, nitroSpeed: 62, accel: 21, grip: 0.94,
        x, y: 0.02, z, yaw: 0.08
      });
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

    // K. Beachfront Vice Tiki Bar Cabana & Beach Volleyball Court (with solid colliders!)
    const tiki = createTikiBeachBar(pinkNeon, cyanNeon, maxAniso);
    tiki.position.set(23.5, -0.18, -254);
    this.scene.add(tiki);
    this.addBoxCollider(20.6, 26.4, -256.8, -251.2);

    const vball = createVolleyballCourt();
    vball.position.set(24.8, -0.16, -124);
    this.scene.add(vball);
    this.addCircleCollider(24.8, -128.5, 0.45);
    this.addCircleCollider(24.8, -119.5, 0.45);

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

    // O. 28 Realistic 16:9 Illuminated Parody Image Billboards Across Vice City (Rooftops + Avenues + Beachfront!)
    const viceBillboardMats = getImageBillboardMaterials(maxAniso);
    const viceBillboardSpecs = [
      // Ocean Drive Beachfront & Skyline (Hero opening corridor — immediately visible from Start!)
      { x: 20.6,   y: 0.0,  z: -48,  rotY: -0.34, idx: 0,  w: 12.8, poleH: 7.4,  rooftop: false }, // 01 Deadbull (Beachfront South)
      { x: -24.5,  y: 16.4, z: -116, rotY: 0.36,  idx: 1,  w: 12.8, poleH: 3.6,  rooftop: true  }, // 02 Rotflix Watching (Colony Roof)
      { x: 20.6,   y: 0.0,  z: -154, rotY: -0.32, idx: 3,  w: 12.8, poleH: 7.6,  rooftop: false }, // 04 SugarShock Fizz Cola
      { x: -24.5,  y: 18.4, z: -190, rotY: 0.34,  idx: 9,  w: 13.6, poleH: 3.8,  rooftop: true  }, // 10 Edison Motors (Ammu-Nation Roof)
      { x: -64.0,  y: 32.4, z: -60,  rotY: 0.95,  idx: 12, w: 14.4, poleH: 3.8,  rooftop: true  }, // 13 Swiggity (Vice Plaza Tower)
      { x: -64.0,  y: 38.4, z: -220, rotY: 1.18,  idx: 17, w: 14.4, poleH: 4.0,  rooftop: true  }, // 18 Loot Vuitton (Biscayne Tower)
      { x: 20.6,   y: 0.0,  z: -264, rotY: -0.36, idx: 8,  w: 12.8, poleH: 7.6,  rooftop: false }, // 09 Gainz Gym (Before Causeway)
      { x: -24.5,  y: 24.4, z: -252, rotY: 0.34,  idx: 10, w: 12.8, poleH: 3.6,  rooftop: true  }, // 11 Edison Drives Itself (Clevelander Roof)
      { x: 136.0,  y: 0.16, z: -280, rotY: -1.18, idx: 11, w: 12.8, poleH: 7.4,  rooftop: false }, // 12 Chai-Bros ₹500 (Starfish Island)
      { x: 20.6,   y: 0.0,  z: -386, rotY: -0.32, idx: 4,  w: 12.8, poleH: 7.6,  rooftop: false }, // 05 Amaze-Con (Malibu / Pier)
      { x: -24.5,  y: 24.4, z: -512, rotY: 0.34,  idx: 22, w: 13.6, poleH: 3.6,  rooftop: true  }, // 23 Strawberry 15 Pro Sweet (Breakwater)
      { x: 20.6,   y: 0.0,  z: -560, rotY: -0.32, idx: 15, w: 12.8, poleH: 7.6,  rooftop: false }, // 16 Cluck Bucket (Ocean Beach Mid)
      { x: -24.5,  y: 26.4, z: -676, rotY: 0.34,  idx: 25, w: 13.6, poleH: 3.6,  rooftop: true  }, // 26 iBerry Duo Oct23 (North Palms)
      { x: 20.6,   y: 0.0,  z: -744, rotY: -0.32, idx: 6,  w: 12.8, poleH: 7.6,  rooftop: false }, // 07 Drip-Kart (North Beach)
      { x: -24.5,  y: 18.4, z: -846, rotY: 0.34,  idx: 31, w: 13.6, poleH: 3.6,  rooftop: true  }, // 46 Valraise The Movie (El Swanko)
      { x: 20.6,   y: 0.0,  z: -992, rotY: -0.34, idx: 24, w: 12.8, poleH: 7.6,  rooftop: false }, // 25 Clownkings Burger (North Point Mall)

      // Washington Ave & Downtown Vice (Midtown + Financial District)
      { x: -82.5,  y: 0.0,  z: -102, rotY: -0.34, idx: 2,  w: 12.0, poleH: 7.4,  rooftop: false }, // 03 Rotflix Binge (Washington South)
      { x: -111.0, y: 0.0,  z: -260, rotY: 0.34,  idx: 7,  w: 12.0, poleH: 7.4,  rooftop: false }, // 08 Insta-Brag (Washington Central)
      { x: -64.0,  y: 22.4, z: -380, rotY: -1.15, idx: 13, w: 13.6, poleH: 3.6,  rooftop: true  }, // 14 Nomato (Poinciana Roof facing Wash Ave)
      { x: -64.0,  y: 20.4, z: -540, rotY: -1.15, idx: 23, w: 13.6, poleH: 3.6,  rooftop: true  }, // 24 Strawberry 15 Pro Seeds (Wash Mall)
      { x: -175.0, y: 0.0,  z: -182, rotY: -0.34, idx: 19, w: 12.8, poleH: 7.6,  rooftop: false }, // 20 Slacker (Downtown Hwy)
      { x: -210.0, y: 0.0,  z: -340, rotY: 0.34,  idx: 20, w: 12.8, poleH: 7.6,  rooftop: false }, // 21 KRED (Downtown West)
      { x: -175.0, y: 0.0,  z: -660, rotY: -0.34, idx: 27, w: 12.8, poleH: 7.6,  rooftop: false }, // 28 Numb-Zac (Uptown Downtown)

      // West Bayside, Little Haiti, Vice Port & Escobar Int'l Airport
      { x: -240.0, y: 22.4, z: -60,  rotY: 0.85,  idx: 14, w: 13.6, poleH: 3.6,  rooftop: true  }, // 15 Zapto (Bayside Mall Roof)
      { x: -240.0, y: 24.4, z: -380, rotY: 0.85,  idx: 28, w: 13.6, poleH: 3.6,  rooftop: true  }, // 38 Shinjuku Future Pod (Vice Arena)
      { x: -366.0, y: 0.0,  z: -338, rotY: -0.34, idx: 18, w: 12.8, poleH: 7.6,  rooftop: false }, // 19 El's Pawn (Little Haiti)
      { x: -466.0, y: 0.0,  z: -180, rotY: -0.34, idx: 21, w: 12.8, poleH: 7.6,  rooftop: false }, // 22 Crazy Cal's Cars (Vice Port Expy)
      { x: -48.0,  y: 0.0,  z: 4.5,  rotY: 0.25,  idx: 16, w: 12.8, poleH: 7.6,  rooftop: false }, // 17 Pay-Dayum (Airport Blvd East)
      { x: -146.0, y: 0.0,  z: 4.5,  rotY: -0.25, idx: 5,  w: 12.8, poleH: 7.6,  rooftop: false }, // 06 Just Gourd It Lauki (Airport Blvd)
      { x: -64.0,  y: 22.4, z: 260,  rotY: 0.65,  idx: 32, w: 13.6, poleH: 3.6,  rooftop: true  }, // 49 Lumiere Seoul (South Marina Plaza)
      { x: -111.0, y: 0.0,  z: -832, rotY: 0.34,  idx: 33, w: 12.8, poleH: 7.6,  rooftop: false }, // 56 Rouge Obsession (North Washington)
      { x: -272.0, y: 0.0,  z: -740, rotY: -0.34, idx: 30, w: 12.8, poleH: 7.6,  rooftop: false }, // 42 Ryujin Whisky (North Bayside)
      { x: -366.0, y: 0.0,  z: -740, rotY: -0.34, idx: 29, w: 12.8, poleH: 7.6,  rooftop: false }, // 41 Capsule Hotel Mirai (Little Haiti North)
      { x: -210.0, y: 0.0,  z: -910, rotY: 0.34,  idx: 26, w: 12.8, poleH: 7.6,  rooftop: false }  // 27 iBerry Duo Harvest (North Downtown)
    ];

    viceBillboardSpecs.forEach((bb) => {
      const mat = viceBillboardMats[bb.idx % viceBillboardMats.length];
      const mesh = buildImageBillboardMesh(mat, {
        width: bb.w,
        height: (bb.w * 9) / 16,
        poleHeight: bb.poleH,
        rooftop: bb.rooftop,
        doubleSided: !bb.rooftop
      });
      mesh.position.set(bb.x, bb.y, bb.z);
      mesh.rotation.y = bb.rotY;
      this.scene.add(mesh);
      if (!bb.rooftop) {
        this.addCircleCollider(bb.x, bb.z, 2.2);
      }
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
      // Rain Umbrella (pops open automatically in tropical rain & thunderstorms!)
      if (!bikini) {
        if (!this._umbPoleGeo) {
          this._umbPoleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.05, 5);
          this._umbCapGeo = new THREE.ConeGeometry(0.56, 0.24, 8);
          this._umbPoleMat = new THREE.MeshStandardMaterial({ color: 0x222633, roughness: 0.5 });
          this._umbMats = [0xff2e88, 0x21e6d1, 0xffd36b, 0x8b5cf6, 0xf8fafc].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.42, side: THREE.DoubleSide }));
        }
        const umb = new THREE.Group();
        const uPole = new THREE.Mesh(this._umbPoleGeo, this._umbPoleMat);
        uPole.position.set(0.24, 1.55, 0.06);
        const uCap = new THREE.Mesh(this._umbCapGeo, this._umbMats[i % this._umbMats.length]);
        uCap.position.set(0.24, 2.08, 0.06);
        umb.add(uPole, uCap);
        umb.visible = false;
        p.root.add(umb);
        p.umbrella = umb;
      }
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
    // 10 Living Vice Hollow Community Villagers Strolling the Plaza, Diner, Chapel & Cottages!
    if (this.village && this.village.npcSpawns) {
      this.village.npcSpawns.forEach((sp, i) => {
        const gy = getTerrainHeight(sp.x, sp.z) + 0.08;
        const axis = i % 2 === 0 ? 'x' : 'z';
        const span = 7.5;
        addPed(
          sp.x, gy, sp.z,
          i % 2 === 0 ? 1 : -1,
          false,
          i + 210,
          axis,
          (axis === 'x' ? sp.x : sp.z) - span,
          (axis === 'x' ? sp.x : sp.z) + span,
          false
        );
      });
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

  // ROCK-SOLID SUBSTEPPED 3-POINT ORIENTED CAR HULL COLLISION SOLVER (O(1) SPATIAL GRID — ZERO PASS-THROUGH!)
  resolveWorldCollisions(isSubstep = false) {
    const cs = this.carState;
    const fwdX = -Math.sin(cs.yaw);
    const fwdZ = -Math.cos(cs.yaw);
    const actIsBike = Boolean(this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.isBike);
    const hullOffsets = actIsBike ? [0.65, -0.65] : [1.45, 0.0, -1.45];
    const hullR = actIsBike ? 0.56 : 1.08;
    let totalPush = 0;
    let hitCliffWall = false;

    const localBoxes = this.colliderGrid.queryBoxes(cs.x, cs.z, 5.5);
    const localCircles = this.colliderGrid.queryCircles(cs.x, cs.z, 5.5);

    for (let pass = 0; pass < 3; pass++) {
      // 1. Full Great State of Leonida Outer Perimeter Bounds (3.8km x 5.4km continuous open world!)
      if (cs.x < LEONIDA_PROJ.minX + 20) { cs.x = LEONIDA_PROJ.minX + 20; totalPush += 0.55; }
      if (cs.x > LEONIDA_PROJ.maxX - 20) { cs.x = LEONIDA_PROJ.maxX - 20; totalPush += 0.55; }
      if (cs.z < LEONIDA_PROJ.minZ + 20) { cs.z = LEONIDA_PROJ.minZ + 20; totalPush += 0.55; }
      if (cs.z > LEONIDA_PROJ.maxZ - 20) { cs.z = LEONIDA_PROJ.maxZ - 20; totalPush += 0.55; }

      // 1b. BULLETPROOF SOLID MOUNTAIN CLIFF WALLS & GUARDRAILS (Mount Vice, Sierra West & Mount Kalaga!)
      const inLegacyMt = isInLegacyMountains(cs.x, cs.z);
      const inCoreVice = isInCoreViceFootprint(cs.x, cs.z);
      const leoHwHit = (!inCoreVice && !inLegacyMt) ? closestLeonidaHighway(cs.x, cs.z) : null;
      if (inLegacyMt && !cs.airborne && !this.cheats.flyingCars) {
        const mvHit = closestAnyMountainRoad(cs.x, cs.z);
        if (mvHit.dist > 6.55 && mvHit.dist < 8.4 && mvHit.roadY > 4.5) {
          const hHere = getTerrainHeight(cs.x, cs.z);
          if (hHere < mvHit.roadY - 0.65) {
            const eps = 0.8;
            const dXp = closestAnyMountainRoad(cs.x + eps, cs.z).dist;
            const dXm = closestAnyMountainRoad(cs.x - eps, cs.z).dist;
            const dZp = closestAnyMountainRoad(cs.x, cs.z + eps).dist;
            const dZm = closestAnyMountainRoad(cs.x, cs.z - eps).dist;
            const gx = dXp - dXm, gz = dZp - dZm;
            const gLen = Math.hypot(gx, gz) || 1;
            const pushBack = (mvHit.dist - 6.5);
            cs.x -= (gx / gLen) * pushBack;
            cs.z -= (gz / gLen) * pushBack;
            totalPush += pushBack * 0.7;
          }
        }
        if (mvHit.dist > 7.9) {
          // Climbable up to ~45 deg; cleanly deflect off sheer cliff faces (>47 deg) & sudden rock steps so bumpers NEVER merge into mountains!
          const hC = this.getSurfaceY(cs.x, cs.z, false);
          const hPx = this.getSurfaceY(cs.x + 1.8, cs.z, false);
          const hMx = this.getSurfaceY(cs.x - 1.8, cs.z, false);
          const hPz = this.getSurfaceY(cs.x, cs.z + 1.8, false);
          const hMz = this.getSurfaceY(cs.x, cs.z - 1.8, false);
          const gradX = (hPx - hMx) / 3.6;
          const gradZ = (hPz - hMz) / 3.6;
          const slope = Math.hypot(gradX, gradZ);
          const moveSign = cs.speed < -0.5 ? -1 : 1;
          const dirX = -Math.sin(cs.yaw) * moveSign;
          const dirZ = -Math.cos(cs.yaw) * moveSign;
          const hAhead = this.getSurfaceY(cs.x + dirX * 2.35, cs.z + dirZ * 2.35, false);
          const fwdSlope = (hAhead - hC) / 2.35;
          if ((slope > 1.06 && hC > 1.0) || (fwdSlope > 1.08 && hAhead > 1.5)) {
            const nx = slope > 0.12 ? (gradX / slope) : dirX;
            const nz = slope > 0.12 ? (gradZ / slope) : dirZ;
            const excess = Math.max(slope - 1.02, fwdSlope - 1.04, 0.08);
            const push = Math.min(1.65, excess * 1.45 + 0.16);
            cs.x -= nx * push;
            cs.z -= nz * push;
            const intoWall = (dirX * nx + dirZ * nz) * Math.abs(cs.speed);
            if (intoWall > 0) cs.speed *= 0.62;
            totalPush += push;
            hitCliffWall = true;
          }
        }
      } else if (!inCoreVice && !inLegacyMt && !cs.airborne && !this.cheats.flyingCars) {
        // Climbable up to ~45 deg on Mount Kalaga & Leonida ridges; deflect off sheer cliff walls (>47 deg) & sudden rock faces!
        const onLeoRoad = leoHwHit && leoHwHit.dist <= leoHwHit.width * 0.65;
        if (!onLeoRoad) {
          const hC = this.getSurfaceY(cs.x, cs.z, false);
          const moveSign = cs.speed < -0.5 ? -1 : 1;
          const dirX = -Math.sin(cs.yaw) * moveSign;
          const dirZ = -Math.cos(cs.yaw) * moveSign;
          const hAhead = this.getSurfaceY(cs.x + dirX * 2.35, cs.z + dirZ * 2.35, false);
          const fwdSlope = (hAhead - hC) / 2.35;
          if (hC > 1.0 || hAhead > 1.8) {
            const hPx = this.getSurfaceY(cs.x + 2.0, cs.z, false);
            const hMx = this.getSurfaceY(cs.x - 2.0, cs.z, false);
            const hPz = this.getSurfaceY(cs.x, cs.z + 2.0, false);
            const hMz = this.getSurfaceY(cs.x, cs.z - 2.0, false);
            const gradX = (hPx - hMx) / 4.0;
            const gradZ = (hPz - hMz) / 4.0;
            const slope = Math.hypot(gradX, gradZ);
            if (slope > 1.06 || fwdSlope > 1.08) {
              const nx = slope > 0.12 ? (gradX / slope) : dirX;
              const nz = slope > 0.12 ? (gradZ / slope) : dirZ;
              const excess = Math.max(slope - 1.02, fwdSlope - 1.04, 0.08);
              const push = Math.min(1.65, excess * 1.45 + 0.16);
              cs.x -= nx * push;
              cs.z -= nz * push;
              const intoWall = (dirX * nx + dirZ * nz) * Math.abs(cs.speed);
              if (intoWall > 0) cs.speed *= 0.62;
              totalPush += push;
              hitCliffWall = true;
            }
          }
        }
        // Leonida Shoreline & Ocean Bridge Containment (Disabled when SEAWAYS cheat is active!)
        if (!this.cheats.seaways && !onLeoRoad) {
          const lf = getLandFactor(cs.x, cs.z);
          if (lf < 0.245) {
            // Gently steer back toward shore or bridge deck
            const eps = 3.5;
            const gx = getLandFactor(cs.x + eps, cs.z) - getLandFactor(cs.x - eps, cs.z);
            const gz = getLandFactor(cs.x, cs.z + eps) - getLandFactor(cs.x, cs.z - eps);
            const gLen = Math.hypot(gx, gz);
            if (gLen > 0.0005) {
              const push = Math.min(2.6, (0.255 - lf) * 18.0 + 0.35);
              cs.x += (gx / gLen) * push;
              cs.z += (gz / gLen) * push;
              totalPush += push * 0.5;
            }
          }
        }
      }

      // 2. Core Vice East Ocean Islands Water Perimeter (Disabled when SEAWAYS cheat is active!)
      if (!this.cheats.seaways && inCoreVice && cs.x > 126 && Math.abs(cs.z + 430) > 19.0) {
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

      // 3. Test all hull spheres against local O(1) Solid AABBs (Buildings, Cottages, Barricades, Showrooms, Bridge Rails, Seawall)
      for (let h = 0; h < hullOffsets.length; h++) {
        const off = hullOffsets[h];
        const px = cs.x + fwdX * off;
        const pz = cs.z + fwdZ * off;

        for (let i = 0; i < localBoxes.length; i++) {
          const b = localBoxes[i];
          if (this.cheats.seaways && b.minX >= 16.5 && b.maxX <= 19.5) continue;
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

        // 4. Test all hull spheres against local O(1) Solid Cylinders (Trees, Boulders, Palms, Lamps, Silo, Water Tower, Well, Umbrellas)
        for (let i = 0; i < localCircles.length; i++) {
          const c = localCircles[i];
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

        // 5. SOLID DYNAMIC COLLISIONS: Parked Vehicles (Cars/Bikes/Taxis), Police Cruisers & Parked Airport Aircraft!
        const pushAgainstVehicle = (vx, vz, vyaw, halfL, halfW) => {
          const dxC = px - vx, dzC = pz - vz;
          if (Math.abs(dxC) > halfL + hullR + 1.0 || Math.abs(dzC) > halfL + hullR + 1.0) return;
          const vfX = -Math.sin(vyaw), vfZ = -Math.cos(vyaw);
          const vrX = Math.cos(vyaw), vrZ = -Math.sin(vyaw);
          const localF = dxC * vfX + dzC * vfZ;
          const localR = dxC * vrX + dzC * vrZ;
          const clF = THREE.MathUtils.clamp(localF, -halfL, halfL);
          const clR = THREE.MathUtils.clamp(localR, -halfW, halfW);
          const df = localF - clF, dr = localR - clR;
          const cSq = df * df + dr * dr;
          if (cSq < hullR * hullR) {
            if (cSq > 0.00001) {
              const d = Math.sqrt(cSq);
              const push = hullR - d;
              const pf = (df / d) * push, pr = (dr / d) * push;
              cs.x += vfX * pf + vrX * pr;
              cs.z += vfZ * pf + vrZ * pr;
              totalPush += push;
            } else {
              cs.x += vrX * (hullR + halfW);
              cs.z += vrZ * (hullR + halfW);
              totalPush += hullR;
            }
          }
        };

        for (let i = 0; i < this.parkedVehicles.length; i++) {
          const pv = this.parkedVehicles[i];
          if (!pv || pv === this.activeVehicle || !pv.mesh || !pv.mesh.visible) continue;
          const isB = Boolean(pv.rig && pv.rig.isBike);
          pushAgainstVehicle(pv.x, pv.z, pv.yaw, isB ? 1.15 : 2.32, isB ? 0.48 : 1.04);
        }
        for (let i = 0; i < this.policeUnits.length; i++) {
          const pu = this.policeUnits[i];
          if (!pu || !pu.mesh || !pu.mesh.visible) continue;
          pushAgainstVehicle(pu.x, pu.z, pu.yaw, 2.42, 1.08);
        }
        if (this.flyablePlanes) {
          for (let i = 0; i < this.flyablePlanes.length; i++) {
            const pl = this.flyablePlanes[i];
            if (!pl || pl === this.activePlane || pl.y > 4.0) continue;
            pushAgainstVehicle(pl.x, pl.z, pl.yaw, pl.kind === 'airliner' ? 8.5 : 4.2, pl.kind === 'airliner' ? 3.2 : 1.8);
          }
        }
      }
    }

    if (totalPush > 0.02) {
      const impactSpd = Math.abs(cs.speed);
      if (!isSubstep && impactSpd > 8 && this.impactCooldown <= 0) {
        this.impactCooldown = 0.25;
        this.camShake = Math.min(0.42, impactSpd * 0.01);
        this.audio.impact(Math.min(1, impactSpd / 40));
        this.damageCar(Math.min(22, (impactSpd - 7) * 0.65));
        for (let k = 0; k < 6; k++) {
          this.spawnParticle(
            cs.x + fwdX * 1.8, cs.y + 0.55, cs.z + fwdZ * 1.8,
            (Math.random() - 0.5) * 6, 2.0 + Math.random() * 3.0, (Math.random() - 0.5) * 6,
            0xffb44c, 0.36, 0.42, 0.2, 9.8
          );
        }
      }
      cs.speed *= (totalPush > 0.42 || hitCliffWall) ? -0.18 : 0.68;
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

  getSurfaceY(x, z, isFoot = false) {
    let h = getTerrainHeight(x, z);
    if (this.mountVice && this.mountVice.sampleMeshHeight) {
      const mh = this.mountVice.sampleMeshHeight(x, z);
      if (mh !== null && mh > h) h = mh;
    }
    if (this.sierraWest && this.sierraWest.sampleMeshHeight) {
      const sh = this.sierraWest.sampleMeshHeight(x, z);
      if (sh !== null && sh > h) h = sh;
    }
    if (this.leonidaWorld && this.leonidaWorld.sampleMeshHeight) {
      const lh = this.leonidaWorld.sampleMeshHeight(x, z);
      if (lh !== null && lh > h) h = lh;
    }
    if (isInCoreViceFootprint(x, z)) {
      let minAve = Infinity;
      for (let i = 0; i < AVENUES.length; i++) {
        const d = Math.abs(x - AVENUES[i]);
        if (d < minAve) minAve = d;
      }
      let minCross = Infinity;
      for (let i = 0; i < CROSS_STREETS.length; i++) {
        const d = Math.abs(z - CROSS_STREETS[i]);
        if (d < minCross) minCross = d;
      }
      const onRoad = minAve <= ROAD_H + 0.35 || minCross <= ROAD_H + 0.35;
      if (onRoad) return Math.max(h, 0.04);
      if (x <= 26 && z <= 220 && z >= -1100) return Math.max(h, isFoot ? 0.17 : 0.14);
      return Math.max(h, 0.04);
    }
    if (isInLegacyMountains(x, z)) {
      const mvHit = closestAnyMountainRoad(x, z);
      if (mvHit && mvHit.dist < 7.6) return Math.max(h, mvHit.roadY + 0.10);
    }
    return h;
  }

  getInteriorFloorY(x, z, curY = 0.16) {
    // Ocean View Hotel Safehouse (-24.5, -48): true walkable 2-story interior + glitch-free grand staircase!
    const ovX = -24.5, ovZ = -48.0;
    const lx = x - ovX;
    const lz = z - ovZ;
    if (lx >= -7.8 && lx <= 7.8 && lz >= -11.8 && lz <= 11.8) {
      const floor1Y = this.oceanViewSafehouse ? this.oceanViewSafehouse.floor1Y : 4.44;
      const groundY = 0.16;
      const upperY = groundY + floor1Y;

      // West upper stair landing (lx: -7.8..-4.20, lz: -11.5..-7.05)
      const onWestLanding = lx <= -4.20 && lz <= -7.05;
      if (onWestLanding && curY >= upperY - 1.95) {
        return upperY;
      }

      // Walkable 16-step grand staircase along North wall: lx +4.2 (ground) -> lx -4.6 (1st floor), lz -11.4..-7.20
      if (lz >= -11.4 && lz <= -7.20 && lx >= -4.85 && lx <= 4.75) {
        const t = THREE.MathUtils.clamp((4.2 - lx) / 8.8, 0, 1);
        const stairY = groundY + t * floor1Y;
        // Prevent snapping UP through the underside of the high stairs from ground floor!
        if (stairY <= curY + 1.45 || curY >= groundY + 0.30) {
          return stairY;
        }
        return groundY;
      }

      // Main 1st-floor suite deck (lz >= -7.30) — seamlessly active once player reaches top of stairs!
      if (lz >= -7.30 && curY >= groundY + floor1Y * 0.50) {
        return upperY;
      }
      return groundY;
    }
    return null;
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
    let tx = wp.x;
    let tz = wp.z;
    // Guarantee dry ground or bridge deck when fast-traveling anywhere in Leonida!
    if (!isInCoreViceFootprint(tx, tz) && !isInLegacyMountains(tx, tz)) {
      const hw = closestLeonidaHighway(tx, tz);
      if (getLandFactor(tx, tz) < 0.27 && hw.dist > hw.width * 0.6) {
        for (let r = 25; r <= 240; r += 25) {
          let found = false;
          for (let a = 0; a < 8; a++) {
            const ang = (a / 8) * Math.PI * 2;
            const cx = tx + Math.cos(ang) * r;
            const cz = tz + Math.sin(ang) * r;
            if (getLandFactor(cx, cz) >= 0.32 || closestLeonidaHighway(cx, cz).dist < 8) {
              tx = cx; tz = cz; found = true; break;
            }
          }
          if (found) break;
        }
      }
    }
    this.carState.x = tx;
    this.carState.z = tz;
    this.carState.y = this.getSurfaceY(tx, tz, false) + 0.06;
    this.carState.vy = 0;
    this.carState.airborne = false;
    this.carState.yaw = wp.yaw || 0;
    this.carState.speed = 0;
    this.snapCameraNext = true;
    const vehMesh = this.activeVehicle ? this.activeVehicle.mesh : this.car.root;
    vehMesh.position.set(tx, this.carState.y, tz);
    vehMesh.rotation.y = this.carState.yaw;
    if (!isInCoreViceFootprint(tx, tz) && !isInLegacyMountains(tx, tz)) {
      const lz = getLeonidaZone(tx, tz);
      this.lastHudZone = lz.zone;
      if (this.el.zone) this.el.zone.textContent = lz.zone;
      if (this.el.radarStreet) this.el.radarStreet.textContent = lz.street;
    }
    this.drawRadar();
    this.audio.pickup();
    this.el.combo.innerHTML = `ARRIVED · ${wp.label} <span>GPS</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.4;
  }

  handleLeonidaToll(ev) {
    if (!ev) return;
    const fee = ev.fee || 25;
    const isEvasion = (ev.speedKmh > 110) || (this.cash < fee);
    if (isEvasion) {
      this.wantedStars = Math.min(5, Math.max(1, this.wantedStars + 1));
      this.wantedDecay = 22.0;
      if (this.el.wanted) this.el.wanted.classList.add('active');
      if (this.el.stars) this.el.stars.forEach((s, i) => s.classList.toggle('lit', i < this.wantedStars));
      if (this.audio && typeof this.audio.impact === 'function') this.audio.impact(0.75);
      this.el.combo.innerHTML = `TOLL EVASION · ${ev.title} <span>+★ WANTED</span>`;
    } else {
      this.cash = Math.max(0, this.cash - fee);
      if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
      if (this.audio && typeof this.audio.pickup === 'function') this.audio.pickup();
      this.el.combo.innerHTML = `TOLL TAX PAID -$${fee} · ${ev.title} <span>E-PASS</span>`;
    }
    this.el.combo.classList.add('on');
    this.streakTimer = 3.2;
  }

  syncReticleVisibility() {
    if (!this.el || !this.el.crosshair) return;
    const playing = this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.activeDialogue && !this.weaponWheelOpen && !this.activeShop && !this.tvOpen && !this.phoneOpen && this.sleepAnimTimer <= 0 && this.mode !== 'ride' && this.wastedTimer <= 0;
    const armed = this.mode === 'foot' && !this.isDancing && this.weapon !== 'fists' && this.weapon !== 'bat';
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
    const isBoat = nextMode === 'boat';
    const isRide = nextMode === 'ride';
    if (!isPlane && this.activePlane) {
      this.activePlane.resetTimer = Math.max(this.activePlane.resetTimer || 0, 0.2);
      this.activePlane = null;
    }
    if (!isBoat && this.activeBoat) {
      this.activeBoat = null;
    }
    if (!isPlane && this.audio) {
      if (typeof this.audio.stopPlaneSequence === 'function') this.audio.stopPlaneSequence();
      if (typeof this.audio.setHeliRotor === 'function') this.audio.setHeliRotor(false, 0);
    }
    if (!isRide && this.activeRide) {
      this.activeRide = null;
      if (this.el && this.el.rideBar) this.el.rideBar.classList.remove('on');
    }
    this.fireHeld = false;
    const isRidingBike = nextMode === 'car' && Boolean(this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.isBike);
    const isRidingBoat = isBoat && Boolean(this.activeBoat);
    this.player.root.visible = isFoot || isRide || isRidingBike || isRidingBoat;
    if (!isRidingBike && !isRidingBoat && this.player && this.player.root && this.player.root.parent !== this.scene) {
      this.scene.add(this.player.root);
      this.player.root.scale.set(1, 1, 1);
      this.player.root.rotation.set(0, this.playerState.yaw, 0);
      const pM = this.player;
      if (pM.body) { pM.body.position.set(0, 0, 0); pM.body.rotation.set(0, 0, 0); }
      if (pM.chest) pM.chest.rotation.set(0, 0, 0);
      if (pM.head) pM.head.rotation.set(0, 0, 0);
      if (pM.armL) { pM.armL.rotation.set(0, 0, 0); if (pM.armL.userData && pM.armL.userData.elbow) pM.armL.userData.elbow.rotation.set(0, 0, 0); }
      if (pM.armR) { pM.armR.rotation.set(0, 0, 0); if (pM.armR.userData && pM.armR.userData.elbow) pM.armR.userData.elbow.rotation.set(0, 0, 0); }
      if (pM.legL) { pM.legL.rotation.set(0, 0, 0); if (pM.legL.userData && pM.legL.userData.knee) pM.legL.userData.knee.rotation.set(0, 0, 0); }
      if (pM.legR) { pM.legR.rotation.set(0, 0, 0); if (pM.legR.userData && pM.legR.userData.knee) pM.legR.userData.knee.rotation.set(0, 0, 0); }
    }
    if (isRidingBike && this.activeVehicle.rig.riderSeat) {
      this.activeVehicle.rig.riderSeat.add(this.player.root);
      this.player.root.position.set(0, -0.26, 0.14);
      this.player.root.rotation.set(0, 0, 0);
    } else if (isRidingBoat && this.activeBoat && this.activeBoat.rig) {
      const boatSeat = this.activeBoat.rig.riderSeat || this.activeBoat.rig.seat;
      if (boatSeat) {
        boatSeat.add(this.player.root);
        this.player.root.position.set(0, -0.58, 0.05);
        this.player.root.rotation.set(0, 0, 0);
      }
    } else if (nextMode === 'car' && !isRidingBike) {
      this.playerState.x = this.carState.x;
      this.playerState.y = this.carState.y;
      this.playerState.z = this.carState.z;
      this.player.root.position.set(this.carState.x, this.carState.y, this.carState.z);
    }
    if (this.parachuteMesh && !isFoot) this.parachuteMesh.visible = false;
    if (this.car && this.car.playerDriverMesh) {
      this.car.playerDriverMesh.visible = nextMode === 'car' && (!this.activeVehicle || this.activeVehicle.isHero);
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
    const isHeli = isPlane && this.activePlane && this.activePlane.isHeli;
    const hudWepLabel = isBoat
      ? 'WATERCRAFT HELM'
      : (isHeli ? 'CHOPPER PILOT' : (isPlane ? 'AIRCRAFT PILOT' : (isRide ? 'CARNIVAL RIDE' : (isFoot ? (curWep ? curWep.label.toUpperCase() : 'FISTS') : 'DRIVE-BY UZI'))));
    if (this.el.gtaWepTxt) {
      this.el.gtaWepTxt.textContent = hudWepLabel;
    } else if (this.el.gtaWepPill) {
      this.el.gtaWepPill.textContent = hudWepLabel;
    }
    if (this.el.gtaWepIco) {
      this.el.gtaWepIco.innerHTML = getWeaponWheelSvg(isFoot ? (curWep ? curWep.id : 'fists') : 'smg');
    }
    if (this.el.carName && !isPlane && !isBoat) {
      this.el.carName.textContent = (this.activeVehicle && this.activeVehicle.label) || 'VICE SUPERCAR';
    }
    if (this.el.carSub) {
      this.el.carSub.textContent = isBoat
        ? 'W/S THROTTLE · SHIFT TURBO · F EXIT TO SHORE'
        : (isHeli ? 'SPACE ASCEND · Q/SHIFT DESCEND · F EXIT' : (isPlane ? 'SPACE CLIMB · F BAILOUT' : 'LMB UZI · [V] HOOD CAM · [I] PHONE'));
    }
    if (this.el.radarInfo && !isPlane && !isBoat) {
      const remTokens = this.tokens ? this.tokens.length - this.tokensCollected : 0;
      const txt = isRide ? 'Carnival Pier Ride' : (isFoot ? `On Foot · ${this.koCount} KO` : `${remTokens} Cash Piles`);
      this.lastRadarInfo = txt;
      this.el.radarInfo.textContent = txt;
    }
    this.el.vehBtn.textContent = isBoat
      ? 'Disembark [F]'
      : (isPlane ? 'Exit / Bailout [F]' : (isRide ? 'Exit Ride [F]' : (isFoot ? 'Enter / Board [F]' : 'Exit Car [F]')));
    this.el.vehBtn.classList.toggle('on', isFoot || isPlane || isRide || isBoat);
    this.el.keysHint.textContent = isBoat
      ? 'WASD Steer Boat · SHIFT Turbo Wake · V Cam · I Phone · F Disembark'
      : (isHeli
        ? 'SPACE Hover Up · Q/SHIFT Descend · W/S Pitch · A/D Yaw · V Cam · F Bailout'
        : (isPlane
          ? 'W/S Thrust · A/D Bank · SPACE Climb · Q Dive · SHIFT Burner · V Cam · F Bailout'
          : (isRide
            ? 'Mouse 360° Scenic Look · E / F Exit Ride'
            : (isFoot
              ? 'WASD Walk · TAB Weapons · E Shop/Interact · F Car/Boat/Chopper · V 1st-Person · I Phone'
              : 'WASD Drive · R/O Radio · V Cam (Hood) · I Phone · E Pay n Spray · F Exit'))));
    if (this.el.touchGo) this.el.touchGo.textContent = isBoat ? 'BOAT' : (isPlane ? 'THRUST' : (isFoot ? 'WALK' : 'DRIVE'));
    if (this.el.touchAct) this.el.touchAct.textContent = isBoat ? 'TURBO' : (isPlane ? 'CLIMB' : (isFoot ? (armed ? 'FIRE' : 'HIT') : 'NOS'));
    if (this.el.touchVeh) this.el.touchVeh.textContent = isBoat ? 'SHORE' : (isPlane ? 'BAIL' : (isFoot ? 'BOARD' : 'FOOT'));
    if (!isFoot) {
      this.el.carPrompt.classList.remove('on');
      if (this.isDancing) this.stopDancing();
      if (this.activeShop) this.closeShopMenu(false);
      if (this.tvOpen) this.closeTvModal();
    }
    if (isPlane || isRide) this.closeWeaponWheel(false);
    this.audio.setRadioInCar(this.isInCar());
    this.updateRadioHUD();
  }

  isInCar() {
    // Enable FM Radio & RJ broadcasts in both cars and two-wheelers (motorcycles / scooters)
    return this.mode === 'car';
  }

  openWeaponWheel(holdMode = false) {
    if (!this.isOpen || !this.started || !this.el || !this.el.weaponWheel) return;
    if (!this.el.modal.hidden || this.fullMapOpen || this.projectsHubOpen || this.miniGameHubOpen || this.taxiModalOpen || this.activeDialogue || this.mode === 'ride' || this.mode === 'plane' || this.wastedTimer > 0) return;
    this.weaponWheelOpen = true;
    this.weaponWheelHoldMode = Boolean(holdMode);
    this.fireHeld = false;
    this.weaponWheelHadPointerLock = Boolean(this.pointerLocked);
    this.weaponWheelVecX = 0;
    this.weaponWheelVecY = -1;
    const curIdx = Math.max(0, WEAPONS.findIndex((w) => w.id === this.weapon));
    this.el.weaponWheel.hidden = false;
    requestAnimationFrame(() => {
      if (this.weaponWheelOpen && this.el && this.el.weaponWheel) {
        this.el.weaponWheel.classList.add('open');
      }
    });
    this.setWeaponWheelHover(curIdx, false);
    this.syncReticleVisibility();
  }

  closeWeaponWheel(commit = true) {
    if (!this.weaponWheelOpen) return;
    const picked = WEAPONS[this.weaponWheelHover];
    this.weaponWheelOpen = false;
    this.weaponWheelHoldMode = false;
    if (this.el && this.el.weaponWheel) {
      this.el.weaponWheel.classList.remove('open');
      this.el.weaponWheel.hidden = true;
    }
    if (commit && picked) {
      this.setWeapon(picked.id);
      this.audio.wheelSelect();
    }
    this.syncReticleVisibility();
  }

  setWeaponWheelHover(idx, playSound = true) {
    const clamped = ((idx % WEAPONS.length) + WEAPONS.length) % WEAPONS.length;
    const changed = clamped !== this.weaponWheelHover;
    this.weaponWheelHover = clamped;
    const w = WEAPONS[clamped];
    if (!w || !this.el) return;
    if (this.el.wwWedges) {
      this.el.wwWedges.forEach((el, i) => {
        el.classList.toggle('active', i === clamped);
        el.classList.toggle('equipped', WEAPONS[i].id === this.weapon);
      });
    }
    if (this.el.wwSlots) {
      this.el.wwSlots.forEach((el, i) => {
        el.classList.toggle('active', i === clamped);
        el.classList.toggle('equipped', WEAPONS[i].id === this.weapon);
      });
    }
    if (this.el.wwCat) this.el.wwCat.textContent = w.category.toUpperCase();
    if (this.el.wwTitle) this.el.wwTitle.textContent = w.label.toUpperCase();
    if (this.el.wwAmmo) this.el.wwAmmo.textContent = w.ammo === 'MELEE' ? 'MELEE' : `AMMO ${w.ammo}`;
    if (this.el.wwDmg) this.el.wwDmg.style.width = `${w.stats.dmg}%`;
    if (this.el.wwRate) this.el.wwRate.style.width = `${w.stats.rate}%`;
    if (this.el.wwRange) this.el.wwRange.style.width = `${w.stats.range}%`;
    if (this.el.wwAcc) this.el.wwAcc.style.width = `${w.stats.acc}%`;
    if (changed && playSound) this.audio.wheelTick();
  }

  updateWeaponWheelFromVector(vx, vy) {
    const mag = Math.hypot(vx, vy);
    if (mag < 26) return;
    const step = (Math.PI * 2) / WEAPONS.length;
    let ang = Math.atan2(vy, vx) + Math.PI / 2;
    if (ang < 0) ang += Math.PI * 2;
    const idx = Math.floor((ang + step * 0.5) / step) % WEAPONS.length;
    if (idx !== this.weaponWheelHover) {
      this.setWeaponWheelHover(idx, true);
    }
  }

  setWeapon(id) {
    const wep = WEAPONS.find((w) => w.id === id);
    if (!wep) return;
    this.weapon = wep.id;
    this.fireHeld = false;
    if (this.player && this.player.setWeapon) this.player.setWeapon(wep.id);
    this.el.wepBtns.forEach((b) => b.classList.toggle('active', b.dataset.wep === wep.id));
    this.el.footWepLbl.textContent = wep.label.toUpperCase();
    if (this.mode === 'foot') {
      if (this.el.gtaWepTxt) this.el.gtaWepTxt.textContent = wep.label.toUpperCase();
      else if (this.el.gtaWepPill) this.el.gtaWepPill.textContent = wep.label.toUpperCase();
      if (this.el.gtaWepIco) this.el.gtaWepIco.innerHTML = getWeaponWheelSvg(wep.id);
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
    if (!this.started || !this.el.modal.hidden || this.fullMapOpen || this.projectsHubOpen || this.miniGameHubOpen || this.weaponWheelOpen || this.activeDialogue || this.mode === 'ride' || this.wastedTimer > 0) return;

    // During Vice Beach Volleyball rally, left-click spikes/returns the volleyball!
    if (this.mode === 'foot' && this.activeSideMission && this.activeSideMission.kind === 'volleyball') {
      this.tryVolleyballStrike();
      return;
    }

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
      if (!this._rocketShared) {
        this._rocketShared = {
          bodyGeo: new THREE.CylinderGeometry(0.055, 0.055, 0.56, 8),
          bodyMat: new THREE.MeshStandardMaterial({ color: 0x3b482e, roughness: 0.45, metalness: 0.4 }),
          tipGeo: new THREE.ConeGeometry(0.082, 0.22, 8),
          tipMat: new THREE.MeshStandardMaterial({ color: 0xff6a2a, emissive: 0xff4620, emissiveIntensity: 1.5, roughness: 0.25 }),
          flameGeo: new THREE.ConeGeometry(0.075, 0.36, 8),
          flameMat: new THREE.MeshBasicMaterial({ color: 0xffd86b, transparent: true, opacity: 0.92 })
        };
      }
      const rs = this._rocketShared;
      const rGrp = new THREE.Group();
      const body = new THREE.Mesh(rs.bodyGeo, rs.bodyMat);
      body.rotation.x = Math.PI / 2;
      const tip = new THREE.Mesh(rs.tipGeo, rs.tipMat);
      tip.rotation.x = -Math.PI / 2;
      tip.position.z = -0.34;
      const flame = new THREE.Mesh(rs.flameGeo, rs.flameMat);
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

    let hitIndoorTarget = null;
    if (this.ammuNation && this.ammuNation.rangeTargets) {
      for (let i = 0; i < this.ammuNation.rangeTargets.length; i++) {
        const rt = this.ammuNation.rangeTargets[i];
        if (rt.hitCooldown > 0) continue;
        rt.group.getWorldPosition(_vecA);
        const ox = _vecA.x - muzzleX, oy = _vecA.y - muzzleY, oz = _vecA.z - muzzleZ;
        const t = ox * dx + oy * dy + oz * dz;
        if (t < 0.6 || t > bestDist) continue;
        const cx = muzzleX + dx * t - _vecA.x;
        const cy = muzzleY + dy * t - _vecA.y;
        const cz = muzzleZ + dz * t - _vecA.z;
        if (Math.hypot(cx, cz) < 0.88 && Math.abs(cy) < 1.1) {
          bestDist = t; hitIndoorTarget = rt; hitPed = null; hitCar = null; hitParked = null; hitKb = null; hitRangeTarget = null;
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

    if (hitIndoorTarget) {
      hitIndoorTarget.hitCooldown = 0.75;
      hitIndoorTarget.group.rotation.x = -0.52;
      this.audio.pickup();
      this.cash += 50;
      if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
      if (this.activeSideMission && this.activeSideMission.kind === 'indoorRange') {
        this.activeSideMission.hits += 1;
        this.el.combo.innerHTML = `BULLSEYE ${this.activeSideMission.hits}/${this.activeSideMission.goal}! <span>+$50</span>`;
      } else {
        this.el.combo.innerHTML = `AMMU-NATION RANGE BULLSEYE! <span>+$50</span>`;
      }
      this.el.combo.classList.add('on');
      this.streakTimer = 2.0;
      this.savePersistentSave();
    } else if (hitRangeTarget) {
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

    // Stage 3 (HP <= 0): Wreck vehicle cleanly (no fire on vehicles!)
    if (u.hp <= 0) {
      this.detonateVehicle(tc, sourceLabel);
      return;
    }

    // Heavily damaged (< 32% HP): Panicked NPC driver bails out (no engine fire!)
    if (u.hp <= (u.maxHp || 100) * 0.32 && u.carRig && u.carRig.driverMesh && u.carRig.driverMesh.visible) {
      u.stun = 2.6;
      u.vx *= 0.35;
      u.vz *= 0.35;
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
    if (!this.isInCar()) return;
    const prevIdx = this.audio.radioIdx;
    const nextIdx = ((idx % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    this.radioTuneRot += (nextIdx - prevIdx || 1) * 72;
    this.audio.setRadioInCar(true);
    if (!this.audio.enabled) {
      this.audio.setEnabled(true);
      this.el.audioBtn.textContent = 'Audio: On';
      this.el.audioBtn.classList.add('on');
      this.audio.setRainLevel(WEATHER_PRESETS[this.weatherIdx].rain);
    }
    this.audio.setRadioStation(nextIdx);
    this.updateRadioHUD();
  }

  cycleRadio(delta = 1) {
    if (!this.isInCar()) return;
    this.selectRadioStation(this.audio.radioIdx + delta);
  }

  toggleRadioPower() {
    if (!this.isInCar()) return;
    this.audio.setRadioInCar(true);
    if (!this.audio.enabled) {
      this.audio.setEnabled(true);
      this.audio.setRadioPower(true);
      this.el.audioBtn.textContent = 'Audio: On';
      this.el.audioBtn.classList.add('on');
      this.audio.setRainLevel(WEATHER_PRESETS[this.weatherIdx].rain);
    } else {
      this.audio.setRadioPower(!this.audio.radioPower);
    }
    this.updateRadioHUD();
    if (this.el && this.el.combo) {
      const isOn = this.audio.radioPower && this.audio.enabled;
      const st = this.audio.getRadioStation();
      const radioLabel = (this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.isBike) ? 'BIKE RADIO' : 'CAR RADIO';
      this.el.combo.innerHTML = isOn
        ? `${radioLabel} ON · ${st.name.toUpperCase()} <span>[R] TUNE · [O] OFF</span>`
        : `${radioLabel} OFF <span>PRESS [O] TO TURN ON</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.0;
    }
  }

  setRadioVolume(v) {
    if (!this.isInCar()) return;
    this.audio.setRadioVolume(v);
    this.updateRadioHUD();
  }

  updateRadioHUD() {
    if (!this.el || !this.el.radioDeck) return;
    const inCar = this.isInCar();
    this.el.radioDeck.hidden = !inCar;
    this.el.radioDeck.classList.toggle('hidden-radio', !inCar);
    if (!inCar) {
      this.el.radioDeck.classList.remove('open', 'on', 'rj-live');
      return;
    }
    const st = this.audio.getRadioStation();
    const isPlaying = this.audio.canPlayRadio();
    const radioOff = !this.audio.radioPower;
    const activeRJ = isPlaying ? this.audio.getActiveRJ() : null;
    this.el.radF.textContent = radioOff ? 'OFF' : st.freq;
    this.el.radN.textContent = radioOff
      ? 'RADIO OFF · Press [O]'
      : (isPlaying ? (activeRJ ? activeRJ.short : st.name) : `${st.name} · muted`);
    const pct = (((parseFloat(st.freq) - 87.5) / (108 - 87.5)) * 100).toFixed(1);
    this.el.radNd.style.setProperty('--np', `${pct}%`);
    this.el.radPres.forEach((b, i) => b.setAttribute('aria-pressed', String(!radioOff && i === this.audio.radioIdx)));
    this.el.radTune.style.setProperty('--r', `${this.radioTuneRot}deg`);
    this.el.radVol.style.setProperty('--r', `${(this.audio.radioVolume * 2.7 - 135).toFixed(1)}deg`);
    this.el.radVol.setAttribute('aria-valuenow', String(this.audio.radioVolume));
    if (this.el.radPwr) {
      this.el.radPwr.textContent = radioOff ? 'Radio: OFF' : 'Radio: ON';
      this.el.radPwr.classList.toggle('off', radioOff);
    }
    this.el.radioDeck.classList.toggle('on', isPlaying);
    this.el.radioDeck.classList.toggle('rj-live', Boolean(activeRJ));
    this.el.radioDeck.classList.remove('dim');
  }

  savePlayerStyle() {
    try {
      localStorage.setItem('vice3d_style_v1', JSON.stringify(this.playerStyle));
    } catch (_) {}
  }

  applyPlayerStyle(st = this.playerStyle) {
    if (!this.player || !st) return;
    if (typeof this.player.setHairstyle === 'function') this.player.setHairstyle(st.hair, st.hairColor);
    if (typeof this.player.setOutfit === 'function') this.player.setOutfit(st.outfit);
    if (typeof this.player.setShades === 'function') this.player.setShades(st.shades);
  }

  findNearestShopZone() {
    if (!this.shopInteractZones) return null;
    const isFoot = this.mode === 'foot';
    const isCar = this.mode === 'car';
    if (!isFoot && !isCar) return null;
    const pos = isCar ? this.carState : this.playerState;
    for (let i = 0; i < this.shopInteractZones.length; i++) {
      const sz = this.shopInteractZones[i];
      if (isCar && !sz.allowInCar) continue;
      if (Math.hypot(pos.x - sz.x, pos.z - sz.z) <= sz.radius && Math.abs((pos.y || 0) - sz.y) < 2.2) {
        return sz;
      }
    }
    return null;
  }

  findNearestSafehouseStation() {
    if (this.mode !== 'foot' || !this.safehouseStations) return null;
    const ps = this.playerState;
    let best = null, bestD = Infinity;
    for (let i = 0; i < this.safehouseStations.length; i++) {
      const st = this.safehouseStations[i];
      const d = Math.hypot(ps.x - st.x, ps.z - st.z);
      if (d <= 2.35 && Math.abs(ps.y - st.y) < 1.6 && d < bestD) {
        best = st;
        bestD = d;
      }
    }
    return best;
  }

  isInsideMalibuDanceZone() {
    if (this.mode !== 'foot') return false;
    const ps = this.playerState;
    return ps.x >= -39.5 && ps.x <= -19.5 && ps.z >= -353.5 && ps.z <= -334.5 && ps.y < 2.2;
  }

  openShopMenu(kind, label) {
    if (!this.el || !this.el.shopDrawer) return;
    if (this.isDancing) this.stopDancing();
    if (this.phoneOpen) this.togglePhone(false);
    this.releasePointerLock();
    this.fireHeld = false;
    this.activeShop = {
      kind,
      label,
      snapshot: {
        hair: this.playerStyle.hair,
        hairColor: this.playerStyle.hairColor,
        outfit: this.playerStyle.outfit,
        shades: this.playerStyle.shades
      }
    };
    const kickerMap = {
      barber: 'BARBER CHAIR · LIVE 3D PREVIEW',
      wardrobe: 'OCEAN VIEW SUITE · PRIVATE CLOSET',
      paynspray: "PAY 'N' SPRAY · AUTO MOD & REPAIR GARAGE",
      diner: 'BURGER SHOT 24/7 · VICE FAST FOOD',
      ammu: 'AMMU-NATION · TACTICAL ARMORY & RANGE'
    };
    this.el.shopKicker.textContent = kickerMap[kind] || 'DESIGNER BOUTIQUE · LIVE 3D PREVIEW';
    this.el.shopTitle.textContent = label || (kind === 'barber' ? 'Vice Cuts Barber' : 'Vice Couture');
    this.el.shopDrawer.hidden = false;
    this.renderShopDrawer();
    this.syncReticleVisibility();
  }

  closeShopMenu(commit = true) {
    if (!this.activeShop) return;
    if (!commit && this.activeShop.snapshot && (this.activeShop.kind === 'barber' || this.activeShop.kind === 'clothes' || this.activeShop.kind === 'wardrobe')) {
      this.playerStyle.hair = this.activeShop.snapshot.hair;
      this.playerStyle.hairColor = this.activeShop.snapshot.hairColor;
      this.playerStyle.outfit = this.activeShop.snapshot.outfit;
      this.playerStyle.shades = this.activeShop.snapshot.shades;
      this.applyPlayerStyle(this.playerStyle);
    } else {
      this.savePlayerStyle();
      this.savePersistentSave();
    }
    this.activeShop = null;
    if (this.el && this.el.shopDrawer) this.el.shopDrawer.hidden = true;
    this.syncReticleVisibility();
  }

  renderShopDrawer() {
    if (!this.activeShop || !this.el || !this.el.shopBody) return;
    const kind = this.activeShop.kind;
    if (this.el.shopCash) this.el.shopCash.textContent = `Cash: $${this.cash.toLocaleString()}`;
    const body = this.el.shopBody;
    body.innerHTML = '';

    if (kind === 'paynspray') {
      const vipFree = this.visited.size >= 1;
      const goldUnlocked = this.visited.size >= 5;
      const curVeh = this.activeVehicle || this.heroVehicle;
      const curMods = this.getActiveVehicleMods();
      const addSection = (title, items) => {
        const sec = document.createElement('div');
        sec.innerHTML = `<div class="v3-shop-sec-lbl">${title}</div><div class="v3-shop-list"></div>`;
        const list = sec.querySelector('.v3-shop-list');
        items.forEach((it) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `v3-shop-item${it.active ? ' active' : ''}`;
          const badgeTxt = it.badge || (it.active ? 'INSTALLED' : (it.price === 0 ? 'FREE' : `$${it.price}`));
          btn.innerHTML = `<div><div class="v3-shop-item-name">${it.name}</div><div class="v3-shop-item-sub">${it.sub}</div></div><span class="v3-shop-price ${it.active ? 'equipped' : ''}">${badgeTxt}</span>`;
          btn.addEventListener('click', () => { it.act(); this.savePersistentSave(); this.renderShopDrawer(); });
          list.appendChild(btn);
        });
        body.appendChild(sec);
      };

      // 1. Repair & Personal Garage Storage (Save ANY Stolen or Custom Car!)
      const garageItems = [
        {
          name: 'Full Repair & Clear Wanted',
          sub: `${curVeh.label} · Health ${Math.round(this.carHealth)}% · Clears VCPD heat`,
          price: 50,
          act: () => {
            if (this.cash < 50) return this.showShopToast('NEED $50 FOR REPAIR');
            this.cash -= 50;
            this.carHealth = 100;
            this.wantedStars = 0;
            this.updateCarHealthHUD();
            this.updateWantedHUD(0);
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.sprayHiss();
            this.showShopToast('VEHICLE REPAIRED · WANTED CLEARED!');
          }
        },
        {
          name: `Save "${curVeh.label}" to Personal Garage`,
          sub: `Stores stolen/custom ride with all tuning (${this.savedGarage.length}/6 slots used)`,
          price: 0,
          badge: this.savedGarage.length >= 6 ? 'FULL' : 'SAVE',
          act: () => this.saveCurrentVehicleToGarage()
        }
      ];
      addSection('Pay ’n’ Spray Service & Personal Garage', garageItems);

      // 1b. Saved Personal Garage Vehicles List
      if (this.savedGarage.length > 0) {
        const gSec = document.createElement('div');
        gSec.innerHTML = `<div class="v3-shop-sec-lbl">Saved Garage Bay (${this.savedGarage.length}/6)</div><div class="v3-shop-list"></div>`;
        const gList = gSec.querySelector('.v3-shop-list');
        this.savedGarage.forEach((gv, gIdx) => {
          const row = document.createElement('div');
          row.className = 'v3-shop-item';
          row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:default;';
          const turboLbl = ['Stock', 'ECU Stg 1', 'Twin-Turbo', 'Apex V12'][gv.mods?.turboStage || 0];
          const extra = [turboLbl, gv.mods?.hydraulics ? 'Hydraulics' : '', gv.mods?.rims && gv.mods.rims !== 'stock' ? gv.mods.rims.replace('_', ' ') : ''].filter(Boolean).join(' · ');
          row.innerHTML = `<div style="min-width:0;flex:1"><div class="v3-shop-item-name">${gv.label}</div><div class="v3-shop-item-sub">${extra || 'Stock Build'}</div></div><div style="display:flex;gap:6px;flex-shrink:0"><button type="button" class="v3-shop-price equipped" data-g-drive style="cursor:pointer;border:none;">DRIVE</button><button type="button" class="v3-shop-price" data-g-del style="cursor:pointer;border:none;background:rgba(255,46,136,0.22);color:#ff85bd;">✕</button></div>`;
          row.querySelector('[data-g-drive]').addEventListener('click', () => {
            this.spawnGarageVehicle(gIdx);
            this.closeShopMenu(true);
          });
          row.querySelector('[data-g-del]').addEventListener('click', () => {
            this.savedGarage.splice(gIdx, 1);
            this.savePersistentSave();
            this.showShopToast(`REMOVED ${gv.label} FROM GARAGE`);
            this.renderShopDrawer();
          });
          gList.appendChild(row);
        });
        body.appendChild(gSec);
      }

      // 2. Engine & Turbo Upgrades
      const turboSpecs = [
        { stage: 0, name: 'Stock Engine Tune', sub: 'Factory Vice City calibration', price: 0 },
        { stage: 1, name: 'Stage 1 · Street ECU Chip', sub: '+12% Top Speed · +16% Launch Torque', price: 220 },
        { stage: 2, name: 'Stage 2 · Twin-Turbo Kit', sub: '+24% Top Speed · +32% Accel · Turbo Whine', price: 480 },
        { stage: 3, name: 'Stage 3 · Apex V12 Supercharger', sub: '+36% Top Speed · +48% Accel · Max Boost', price: 850 }
      ];
      addSection('Engine & Turbo Tuning', turboSpecs.map((ts) => ({
        name: ts.name,
        sub: ts.sub,
        price: ts.price,
        active: (curMods.turboStage || 0) === ts.stage,
        act: () => {
          if ((curMods.turboStage || 0) === ts.stage) return;
          if (ts.price > 0 && this.cash < ts.price) return this.showShopToast(`NEED $${ts.price}`);
          this.cash -= ts.price;
          curMods.turboStage = ts.stage;
          this.applyCarMods();
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          if (this.audio) this.audio.exhaustPop();
          this.showShopToast(`${ts.name.toUpperCase()} INSTALLED!`);
        }
      })));

      // 3. Hydraulics / Lowrider Bounce Mode
      addSection('Suspension & Hydraulics', [
        {
          name: 'Pro Lowrider Hydraulics Kit',
          sub: 'Press [H] while driving to hop, tilt & bounce! (Shift+H Dance Mode)',
          price: 380,
          active: Boolean(curMods.hydraulics),
          act: () => {
            if (!curMods.hydraulics && this.cash < 380) return this.showShopToast('NEED $380 FOR HYDRAULICS');
            if (!curMods.hydraulics) this.cash -= 380;
            curMods.hydraulics = !curMods.hydraulics;
            this.hydraulicsState.mode = 0;
            this.applyCarMods();
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.hydraulicsBounce();
            if (curMods.hydraulics) this.triggerHydraulicsBounce(false);
            this.showShopToast(curMods.hydraulics ? 'HYDRAULICS INSTALLED · PRESS [H] TO BOUNCE!' : 'HYDRAULICS REMOVED');
          }
        }
      ]);

      // 4. Custom Wheel Rims
      const rimSpecs = [
        { id: 'stock', name: 'Factory Alloy Rims', sub: 'Original twin-5-spoke finish', price: 0 },
        { id: 'gold_mesh', name: 'Gold Mesh ’86 Rims', sub: 'Anodized Miami gold forged alloy', price: 140 },
        { id: 'neon_cyan', name: 'Neon Cyan Deep-Dish', sub: 'Electric cyan spokes + glowing rim rings', price: 180 },
        { id: 'hot_pink', name: 'Hot Pink Turbofan', sub: 'Vice sunset magenta spokes + neon halo', price: 180 },
        { id: 'stealth_black', name: 'Stealth Carbon Matte', sub: 'Satin obsidian street-racer rims', price: 160 },
        { id: 'chrome_deep', name: 'Mirror Chrome Spinners', sub: 'Polished chrome deep-dish rims', price: 200 }
      ];
      addSection('Custom Wheel Rims', rimSpecs.map((rm) => ({
        name: rm.name,
        sub: rm.sub,
        price: rm.price,
        active: (curMods.rims || 'stock') === rm.id,
        act: () => {
          if ((curMods.rims || 'stock') === rm.id) return;
          if (rm.price > 0 && this.cash < rm.price) return this.showShopToast(`NEED $${rm.price}`);
          this.cash -= rm.price;
          curMods.rims = rm.id;
          this.applyCarMods();
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          if (this.audio) this.audio.sprayHiss();
          this.showShopToast(`CUSTOM RIMS · ${rm.name.toUpperCase()}`);
        }
      })));

      // 5. Custom Horn Tunes (Plays instant preview on click!)
      const hornSpecs = [
        { id: 'classic', name: 'Classic Italian Dual-Tone', sub: 'Factory Fiamm sports horn ([K] / [H])', price: 0 },
        { id: 'cucaracha', name: 'La Cucaracha Brass', sub: 'Iconic 10-note musical lowrider horn', price: 120 },
        { id: 'dixie', name: 'Vice ’86 Fanfare', sub: 'High-energy classic stunt car melody', price: 140 },
        { id: 'airhorn', name: 'Heavy Truck Air Horn', sub: 'Deep triple-trumpet blast', price: 110 },
        { id: 'synth80s', name: 'Neon 80s Synth Chord', sub: 'Warm Juno-106 Ocean Drive chord stab', price: 150 },
        { id: 'siren', name: 'VCPD Whoop-Whoop Chirp', sub: 'Quick twin police cruiser siren chirp', price: 180 }
      ];
      addSection('Custom Horn Tunes (Tap to Preview)', hornSpecs.map((hn) => ({
        name: hn.name,
        sub: hn.sub,
        price: hn.price,
        active: (curMods.hornTune || 'classic') === hn.id,
        act: () => {
          if ((curMods.hornTune || 'classic') !== hn.id) {
            if (hn.price > 0 && this.cash < hn.price) return this.showShopToast(`NEED $${hn.price}`);
            this.cash -= hn.price;
            curMods.hornTune = hn.id;
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          }
          if (this.audio) this.audio.horn(hn.id);
          this.showShopToast(`HORN EQUIPPED · ${hn.name.toUpperCase()}`);
        }
      })));

      // 6. Body Kits, Underglow & 24K Chrome
      const bodyItems = [
        {
          name: 'Neon Underglow: Vice Pink',
          sub: vipFree ? 'Scavenger VIP Pack (FREE!)' : 'Glowing magenta underbody neon kit',
          price: vipFree ? 0 : 120,
          active: curMods.underglow === 'pink',
          act: () => {
            const p = vipFree ? 0 : 120;
            if (curMods.underglow !== 'pink' && this.cash < p) return this.showShopToast(`NEED $${p}`);
            if (curMods.underglow !== 'pink') this.cash -= p;
            curMods.underglow = curMods.underglow === 'pink' ? 'none' : 'pink';
            this.applyCarMods();
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.sprayHiss();
            this.showShopToast(curMods.underglow === 'pink' ? 'PINK NEON UNDERGLOW INSTALLED' : 'UNDERGLOW REMOVED');
          }
        },
        {
          name: 'Neon Underglow: Miami Cyan',
          sub: vipFree ? 'Scavenger VIP Pack (FREE!)' : 'Electric ocean neon underbody',
          price: vipFree ? 0 : 120,
          active: curMods.underglow === 'cyan',
          act: () => {
            const p = vipFree ? 0 : 120;
            if (curMods.underglow !== 'cyan' && this.cash < p) return this.showShopToast(`NEED $${p}`);
            if (curMods.underglow !== 'cyan') this.cash -= p;
            curMods.underglow = curMods.underglow === 'cyan' ? 'none' : 'cyan';
            this.applyCarMods();
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.sprayHiss();
            this.showShopToast(curMods.underglow === 'cyan' ? 'CYAN NEON UNDERGLOW INSTALLED' : 'UNDERGLOW REMOVED');
          }
        },
        {
          name: 'Neon Underglow: Sunset Gold',
          sub: '24K amber underbody street glow',
          price: 120,
          active: curMods.underglow === 'gold',
          act: () => {
            if (curMods.underglow !== 'gold' && this.cash < 120) return this.showShopToast('NEED $120');
            if (curMods.underglow !== 'gold') this.cash -= 120;
            curMods.underglow = curMods.underglow === 'gold' ? 'none' : 'gold';
            this.applyCarMods();
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.sprayHiss();
            this.showShopToast(curMods.underglow === 'gold' ? 'GOLD UNDERGLOW INSTALLED' : 'UNDERGLOW REMOVED');
          }
        },
        {
          name: 'Carbon GT Wing Spoiler',
          sub: vipFree ? 'Scavenger VIP Pack (FREE!)' : 'High-downforce rear GT wing',
          price: vipFree ? 0 : 160,
          active: Boolean(curMods.spoiler),
          act: () => {
            const p = vipFree ? 0 : 160;
            if (!curMods.spoiler && this.cash < p) return this.showShopToast(`NEED $${p}`);
            if (!curMods.spoiler) this.cash -= p;
            curMods.spoiler = !curMods.spoiler;
            this.applyCarMods();
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.sprayHiss();
            this.showShopToast(curMods.spoiler ? 'CARBON GT SPOILER INSTALLED' : 'SPOILER REMOVED');
          }
        },
        {
          name: '24K Gold Chrome Respray',
          sub: goldUnlocked ? '5/5 Portfolio Showrooms Reward (FREE!)' : 'Unlock FREE at 5/5 showrooms or buy now',
          price: goldUnlocked ? 0 : 500,
          active: Boolean(curMods.goldChrome),
          act: () => {
            const p = goldUnlocked ? 0 : 500;
            if (!curMods.goldChrome && this.cash < p) return this.showShopToast(`NEED $${p}`);
            if (!curMods.goldChrome) this.cash -= p;
            curMods.goldChrome = !curMods.goldChrome;
            this.applyCarMods();
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.sprayHiss();
            this.showShopToast(curMods.goldChrome ? 'GOLD CHROME FINISH APPLIED!' : 'STANDARD PAINT RESTORED');
          }
        }
      ];
      addSection('Neon Underglow & Aero Kits', bodyItems);

      const secP = document.createElement('div');
      secP.innerHTML = '<div class="v3-shop-sec-lbl">Respray Paint Booth ($25)</div><div class="v3-shop-swatches"></div>';
      const swWrap = secP.querySelector('.v3-shop-swatches');
      PAINTS.forEach((p, idx) => {
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = `v3-shop-swatch${idx === this.paintIdx && !curMods.goldChrome ? ' active' : ''}`;
        sw.style.background = p.swatch;
        sw.title = p.name;
        sw.addEventListener('click', () => {
          curMods.goldChrome = false;
          curMods.paintIdx = idx;
          if (curVeh.isHero) this.setPaint(idx);
          else if (curVeh.rig && curVeh.rig.paintMat) {
            curVeh.rig.paintMat.color.setHex(p.color);
            curVeh.rig.paintMat.metalness = p.metalness;
            curVeh.rig.paintMat.roughness = p.roughness;
            curVeh.rig.baseColor = p.color;
            curMods.paintHex = p.color;
          }
          this.applyCarMods();
          if (this.audio) this.audio.sprayHiss();
          this.showShopToast(`RESPRAYED · ${p.name.toUpperCase()}`);
          this.renderShopDrawer();
        });
        swWrap.appendChild(sw);
      });
      body.appendChild(secP);
      return;
    }

    if (kind === 'diner') {
      const meals = [
        { name: 'Vice Sprunk Soda', sub: 'Restores +25 Health', hp: 25, price: 10 },
        { name: 'The Bleeder Burger', sub: 'Restores +50 Health · Fresh off the grill', hp: 50, price: 20 },
        { name: 'Heart Stopper 6-Stack', sub: 'Restores 100% Health + Full Sprint Stamina', hp: 100, price: 35 }
      ];
      const sec = document.createElement('div');
      sec.innerHTML = `<div class="v3-shop-sec-lbl">Current Health: ${Math.round(this.playerHp)}% · Order Counter</div><div class="v3-shop-list"></div>`;
      const list = sec.querySelector('.v3-shop-list');
      meals.forEach((m) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'v3-shop-item';
        btn.innerHTML = `<div><div class="v3-shop-item-name">${m.name}</div><div class="v3-shop-item-sub">${m.sub}</div></div><span class="v3-shop-price">$${m.price}</span>`;
        btn.addEventListener('click', () => {
          if (this.cash < m.price) return this.showShopToast(`NEED $${m.price}`);
          this.cash -= m.price;
          this.playerHp = Math.min(100, this.playerHp + m.hp);
          this.updateHealthHUD();
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          if (this.audio) this.audio.pickup();
          this.showShopToast(`ATE ${m.name.toUpperCase()} · HP ${Math.round(this.playerHp)}%`);
          this.savePersistentSave();
          this.renderShopDrawer();
        });
        list.appendChild(btn);
      });
      body.appendChild(sec);
      return;
    }

    if (kind === 'ammu') {
      const gear = [
        {
          name: 'Kevlar Body Armor (+100%)',
          sub: 'Full ballistic protection vest',
          price: 80,
          act: () => {
            if (this.cash < 80) return this.showShopToast('NEED $80');
            this.cash -= 80;
            this.playerArmor = 100;
            this.updateHealthHUD();
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.pickup();
            this.showShopToast('BODY ARMOR EQUIPPED (100%)');
          }
        },
        {
          name: 'M4 Tactical Rifle + Full Ammo',
          sub: 'Equips M4 Carbine ready for range & streets',
          price: 60,
          act: () => {
            if (this.cash < 60) return this.showShopToast('NEED $60');
            this.cash -= 60;
            this.setWeapon('rifle');
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            if (this.audio) this.audio.pickup();
            this.showShopToast('M4 CARBINE LOADED!');
          }
        },
        {
          name: 'Start Indoor Shooting Range',
          sub: 'Hit 10 moving targets in the back bay · Prize $400!',
          price: 0,
          act: () => {
            this.closeShopMenu(true);
            this.startIndoorRange();
          }
        }
      ];
      const sec = document.createElement('div');
      sec.innerHTML = `<div class="v3-shop-sec-lbl">Armor: ${Math.round(this.playerArmor)}% · Counter & Back Range</div><div class="v3-shop-list"></div>`;
      const list = sec.querySelector('.v3-shop-list');
      gear.forEach((g) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'v3-shop-item';
        btn.innerHTML = `<div><div class="v3-shop-item-name">${g.name}</div><div class="v3-shop-item-sub">${g.sub}</div></div><span class="v3-shop-price">${g.price === 0 ? 'PLAY' : `$${g.price}`}</span>`;
        btn.addEventListener('click', () => { g.act(); this.savePersistentSave(); if (this.activeShop) this.renderShopDrawer(); });
        list.appendChild(btn);
      });
      body.appendChild(sec);
      return;
    }

    if (kind === 'barber') {
      const secStyle = document.createElement('div');
      secStyle.innerHTML = '<div class="v3-shop-sec-lbl">Hairstyles (7 3D Cuts)</div><div class="v3-shop-list"></div>';
      const list = secStyle.querySelector('.v3-shop-list');
      HAIR_STYLES.forEach((hs) => {
        const owned = this.playerStyle.ownedHair.includes(hs.id) || hs.price === 0;
        const equipped = this.playerStyle.hair === hs.id;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `v3-shop-item${equipped ? ' active' : ''}`;
        btn.innerHTML = `<div><div class="v3-shop-item-name">${hs.name}</div><div class="v3-shop-item-sub">${hs.sub}</div></div><span class="v3-shop-price ${equipped ? 'equipped' : (owned ? 'owned' : '')}">${equipped ? 'EQUIPPED' : (owned ? 'OWNED' : `$${hs.price}`)}</span>`;
        btn.addEventListener('mouseenter', () => {
          if (this.player && this.player.setHairstyle) this.player.setHairstyle(hs.id, this.playerStyle.hairColor);
        });
        btn.addEventListener('mouseleave', () => this.applyPlayerStyle(this.playerStyle));
        btn.addEventListener('click', () => {
          if (!owned) {
            if (this.cash < hs.price) {
              this.showShopToast(`NEED $${hs.price} FOR ${hs.name.toUpperCase()}`);
              return;
            }
            this.cash -= hs.price;
            this.playerStyle.ownedHair.push(hs.id);
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          }
          this.playerStyle.hair = hs.id;
          this.activeShop.snapshot.hair = hs.id;
          this.applyPlayerStyle(this.playerStyle);
          this.savePlayerStyle();
          if (this.audio) this.audio.pickup();
          this.showShopToast(`NEW HAIRCUT · ${hs.name.toUpperCase()}`);
          this.renderShopDrawer();
        });
        list.appendChild(btn);
      });
      body.appendChild(secStyle);

      const secCol = document.createElement('div');
      secCol.innerHTML = '<div class="v3-shop-sec-lbl">Hair Color Dye (Complimentary)</div><div class="v3-shop-swatches"></div>';
      const swWrap = secCol.querySelector('.v3-shop-swatches');
      HAIR_COLORS.forEach((hc) => {
        const active = this.playerStyle.hairColor.toLowerCase() === hc.hex.toLowerCase();
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = `v3-shop-swatch${active ? ' active' : ''}`;
        sw.style.background = hc.hex;
        sw.title = hc.name;
        sw.addEventListener('mouseenter', () => {
          if (this.player && this.player.setHairstyle) this.player.setHairstyle(this.playerStyle.hair, hc.hex);
        });
        sw.addEventListener('mouseleave', () => this.applyPlayerStyle(this.playerStyle));
        sw.addEventListener('click', () => {
          this.playerStyle.hairColor = hc.hex;
          this.activeShop.snapshot.hairColor = hc.hex;
          this.applyPlayerStyle(this.playerStyle);
          this.savePlayerStyle();
          if (this.audio) this.audio.pickup();
          this.showShopToast(`HAIR DYE · ${hc.name.toUpperCase()}`);
          this.renderShopDrawer();
        });
        swWrap.appendChild(sw);
      });
      body.appendChild(secCol);
      return;
    }

    // Clothes Store or Safehouse Wardrobe
    const isWardrobe = kind === 'wardrobe';
    const outfits = isWardrobe
      ? OUTFIT_CATALOG.filter((o) => this.playerStyle.ownedOutfits.includes(o.id) || o.price === 0)
      : OUTFIT_CATALOG;
    const secOut = document.createElement('div');
    secOut.innerHTML = `<div class="v3-shop-sec-lbl">${isWardrobe ? 'Owned Outfits (Buy More at Vice Couture / Gash)' : 'Designer Outfits (7 Styles)'}</div><div class="v3-shop-list"></div>`;
    const list = secOut.querySelector('.v3-shop-list');
    outfits.forEach((of) => {
      const owned = this.playerStyle.ownedOutfits.includes(of.id) || of.price === 0;
      const equipped = this.playerStyle.outfit === of.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `v3-shop-item${equipped ? ' active' : ''}`;
      btn.innerHTML = `<div><div class="v3-shop-item-name">${of.name}</div><div class="v3-shop-item-sub">${of.sub}</div></div><span class="v3-shop-price ${equipped ? 'equipped' : (owned ? 'owned' : '')}">${equipped ? 'EQUIPPED' : (owned ? 'OWNED' : `$${of.price}`)}</span>`;
      btn.addEventListener('mouseenter', () => {
        if (this.player && this.player.setOutfit) this.player.setOutfit(of.id);
      });
      btn.addEventListener('mouseleave', () => this.applyPlayerStyle(this.playerStyle));
      btn.addEventListener('click', () => {
        if (!owned) {
          if (this.cash < of.price) {
            this.showShopToast(`NEED $${of.price} FOR ${of.name.toUpperCase()}`);
            return;
          }
          this.cash -= of.price;
          this.playerStyle.ownedOutfits.push(of.id);
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        }
        this.playerStyle.outfit = of.id;
        this.activeShop.snapshot.outfit = of.id;
        this.applyPlayerStyle(this.playerStyle);
        this.savePlayerStyle();
        if (this.audio) this.audio.pickup();
        this.showShopToast(`OUTFIT EQUIPPED · ${of.name.toUpperCase()}`);
        this.renderShopDrawer();
      });
      list.appendChild(btn);
    });
    body.appendChild(secOut);

    const secShades = document.createElement('div');
    secShades.innerHTML = '<div class="v3-shop-sec-lbl">Eyewear &amp; Sunglasses</div><div class="v3-shop-shades"></div>';
    const shWrap = secShades.querySelector('.v3-shop-shades');
    SHADE_STYLES.forEach((sh) => {
      const owned = this.playerStyle.ownedShades.includes(sh.id) || sh.price === 0;
      const equipped = this.playerStyle.shades === sh.id;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `v3-shop-item${equipped ? ' active' : ''}`;
      btn.innerHTML = `<div class="v3-shop-item-name" style="font-size:14px">${sh.name}</div><span class="v3-shop-price ${equipped ? 'equipped' : (owned ? 'owned' : '')}">${equipped ? 'ON' : (owned ? 'FREE' : `$${sh.price}`)}</span>`;
      btn.addEventListener('mouseenter', () => {
        if (this.player && this.player.setShades) this.player.setShades(sh.id);
      });
      btn.addEventListener('mouseleave', () => this.applyPlayerStyle(this.playerStyle));
      btn.addEventListener('click', () => {
        if (!owned) {
          if (this.cash < sh.price) {
            this.showShopToast(`NEED $${sh.price} FOR ${sh.name.toUpperCase()}`);
            return;
          }
          this.cash -= sh.price;
          this.playerStyle.ownedShades.push(sh.id);
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        }
        this.playerStyle.shades = sh.id;
        this.activeShop.snapshot.shades = sh.id;
        this.applyPlayerStyle(this.playerStyle);
        this.savePlayerStyle();
        if (this.audio) this.audio.pickup();
        this.renderShopDrawer();
      });
      shWrap.appendChild(btn);
    });
    body.appendChild(secShades);
  }

  showShopToast(msg) {
    if (!this.el || !this.el.combo) return;
    this.el.combo.innerHTML = `${msg} <span>STYLE</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.4;
  }

  interactSafehouseStation(st) {
    if (!st) return;
    if (st.id === 'sleep') {
      if (this.sleepAnimTimer > 0) return;
      this.releasePointerLock();
      this.sleepAnimTimer = 2.6;
      const nextHour = (this.dayTime + 6) % 24;
      const hh = String(Math.floor(nextHour)).padStart(2, '0');
      const mm = String(Math.floor((nextHour % 1) * 60)).padStart(2, '0');
      if (this.el.sleepSub) this.el.sleepSub.textContent = `Waking Up at ${hh}:${mm} · 100% Health Restored & Wanted Level Cleared`;
      if (this.el.sleepOv) this.el.sleepOv.classList.add('on');
      this.dayTime = nextHour;
      this.playerHp = 100;
      this.wantedStars = 0;
      this.updateHealthHUD();
      this.updateWantedHUD(0);
      if (this.audio) this.audio.pickup();
      this.syncReticleVisibility();
    } else if (st.id === 'tv') {
      this.openTvModal();
    } else if (st.id === 'food') {
      this.playerHp = Math.min(100, this.playerHp + 45);
      this.playerArmor = Math.min(100, this.playerArmor + 25);
      this.updateHealthHUD();
      if (this.audio) this.audio.pickup();
      if (this.el && this.el.combo) {
        this.el.combo.innerHTML = `ATE PIZZA, BURGER &amp; SPRUNK · +45 HP +25 ARMOR <span>SAFEHOUSE</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 2.8;
      }
    } else if (st.id === 'wardrobe') {
      this.openShopMenu('wardrobe', 'Ocean View Wardrobe');
    }
  }

  openTvModal() {
    if (!this.el || !this.el.tvOv) return;
    this.releasePointerLock();
    this.fireHeld = false;
    this.tvOpen = true;
    this.el.tvOv.hidden = false;
    this.setTvChannel(this.tvChannel);
    this.syncReticleVisibility();
  }

  closeTvModal() {
    if (!this.tvOpen) return;
    this.tvOpen = false;
    if (this.el && this.el.tvOv) this.el.tvOv.hidden = true;
    this.syncReticleVisibility();
  }

  setTvChannel(idx) {
    this.tvChannel = ((idx % TV_CHANNELS.length) + TV_CHANNELS.length) % TV_CHANNELS.length;
    if (this.el && this.el.tvChBtns) {
      this.el.tvChBtns.forEach((b, i) => b.classList.toggle('active', i === this.tvChannel));
    }
  }

  drawRetroTvScreen(elapsed) {
    const ctx = this.tvCtx;
    if (!ctx) return;
    const W = 640, H = 400;
    const ch = this.tvChannel;
    if (ch === 0) {
      // CH 04 · VICE NEWS LIVE
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a1638');
      bg.addColorStop(1, '#1c0c2e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      // Animated skyline backdrop
      ctx.fillStyle = '#0e1f4d';
      for (let i = 0; i < 14; i++) {
        const bh = 70 + ((i * 37) % 110);
        ctx.fillRect(i * 48, 250 - bh, 42, bh);
      }
      // Anchor desk + anchor silhouette
      ctx.fillStyle = '#ff2e88';
      ctx.fillRect(190, 232, 260, 82);
      ctx.fillStyle = '#182442';
      ctx.fillRect(200, 240, 240, 74);
      ctx.fillStyle = '#f2c29b';
      ctx.beginPath(); ctx.arc(320, 174 + Math.sin(elapsed * 4) * 2, 24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#243a68';
      ctx.fillRect(284, 198, 72, 46);
      // Breaking News Banner & Ticker
      ctx.fillStyle = '#e62244';
      ctx.fillRect(0, 314, W, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Barlow Condensed", sans-serif';
      ctx.fillText('LIVE · VICE CITY ACTION NEWS · OCEAN DRIVE TRAFFIC ALERT', 22, 340);
      ctx.fillStyle = '#070b18';
      ctx.fillRect(0, 352, W, 48);
      const tickX = W - ((elapsed * 110) % (W + 860));
      ctx.fillStyle = '#ffd36b';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('BREAKING: MALIBU CLUB PACKED TONIGHT · MOUNT VICE ROPEWAY OPEN · VICE CUTS BARBER & VICE COUTURE NOW OPEN ON OCEAN DRIVE · ', tickX, 382);
    } else if (ch === 1) {
      // CH 07 · LEONIDA WEATHER RADAR
      ctx.fillStyle = '#071a2c';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(33, 230, 209, 0.22)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const rCx = 320, rCy = 195;
      for (const rad of [55, 110, 160]) {
        ctx.beginPath(); ctx.arc(rCx, rCy, rad, 0, Math.PI * 2); ctx.stroke();
      }
      const sweep = elapsed * 1.4;
      ctx.fillStyle = 'rgba(33, 230, 209, 0.25)';
      ctx.beginPath(); ctx.moveTo(rCx, rCy); ctx.arc(rCx, rCy, 160, sweep, sweep + 0.55); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#21e6d1';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      const wp = WEATHER_PRESETS[this.weatherIdx] || WEATHER_PRESETS[0];
      const hh = String(Math.floor(this.dayTime)).padStart(2, '0');
      const mm = String(Math.floor((this.dayTime % 1) * 60)).padStart(2, '0');
      ctx.fillText(`LEONIDA DOPPLER · ${wp.label.toUpperCase()} · ${hh}:${mm}`, 24, 38);
      ctx.fillStyle = '#ffd36b';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('OCEAN BEACH 84°F · MOUNT VICE 62°F · CARNIVAL PIER BREEZE 9KT', 24, 376);
    } else if (ch === 2) {
      // CH 12 · VICE TURBO RACING
      const sky = ctx.createLinearGradient(0, 0, 0, 210);
      sky.addColorStop(0, '#1c0736');
      sky.addColorStop(1, '#ff5c44');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, 210);
      ctx.fillStyle = '#181c28';
      ctx.fillRect(0, 210, W, 190);
      // Perspective highway lines
      ctx.strokeStyle = '#ff2e88';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(270, 210); ctx.lineTo(40, 400); ctx.moveTo(370, 210); ctx.lineTo(600, 400); ctx.stroke();
      ctx.strokeStyle = '#ffd36b';
      ctx.setLineDash([18, 16]);
      ctx.lineDashOffset = -(elapsed * 220);
      ctx.beginPath(); ctx.moveTo(320, 210); ctx.lineTo(320, 400); ctx.stroke();
      ctx.setLineDash([]);
      // Animated retro race car
      const cx = 320 + Math.sin(elapsed * 2.3) * 72;
      ctx.fillStyle = '#ff2e88';
      ctx.fillRect(cx - 56, 294, 112, 34);
      ctx.fillStyle = '#21e6d1';
      ctx.fillRect(cx - 38, 276, 76, 20);
      ctx.fillStyle = '#ff3844';
      ctx.fillRect(cx - 48, 304, 24, 9);
      ctx.fillRect(cx + 24, 304, 24, 9);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText('VICE TURBO GRAND PRIX · 1986 LIVE REPLAY', 24, 36);
    } else {
      // CH 86 · WAVE 103 SYNTHWAVE VISUALIZER
      ctx.fillStyle = '#090418';
      ctx.fillRect(0, 0, W, H);
      const sunGrad = ctx.createLinearGradient(0, 80, 0, 240);
      sunGrad.addColorStop(0, '#ffe066');
      sunGrad.addColorStop(0.55, '#ff4d88');
      sunGrad.addColorStop(1, '#7a1ca8');
      ctx.fillStyle = sunGrad;
      ctx.beginPath(); ctx.arc(320, 175, 86, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#090418';
      for (let sy = 175; sy < 260; sy += 13) ctx.fillRect(220, sy, 200, 4);
      // Equalizer bars
      for (let i = 0; i < 24; i++) {
        const bh = 28 + Math.abs(Math.sin(elapsed * 5.2 + i * 0.55)) * 115;
        ctx.fillStyle = i % 2 === 0 ? '#21e6d1' : '#ff2e88';
        ctx.fillRect(28 + i * 24.5, 385 - bh, 17, bh);
      }
      ctx.fillStyle = '#21e6d1';
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillText('WAVE 103 · LATE NIGHT SYNTHWAVE TV', 24, 36);
    }
    // Subtle CRT scanlines & channel badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(W - 122, 12, 108, 26);
    ctx.fillStyle = '#49c65e';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(`CH 0${ch + 1} · CRT`, W - 110, 30);
  }

  startDancing(styleIdx = 0) {
    if (this.mode !== 'foot') return;
    this.isDancing = true;
    this.danceStyleIdx = styleIdx % 3;
    this.danceRewardTimer = 6.5;
    this.fireHeld = false;
    this.playerState.vx = 0;
    this.playerState.vz = 0;
    this.playerState.speed = 0;
    if (this.el && this.el.danceBar) this.el.danceBar.classList.add('on');
    this.setDanceStyle(this.danceStyleIdx);
    if (this.el && this.el.combo) {
      this.el.combo.innerHTML = `DANCING AT THE MALIBU CLUB · [1/2/3] MOVES <span>PARTY</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.6;
    }
    this.syncReticleVisibility();
  }

  setDanceStyle(idx) {
    this.danceStyleIdx = ((idx % 3) + 3) % 3;
    if (this.el && this.el.danceMoveBtns) {
      this.el.danceMoveBtns.forEach((b, i) => b.classList.toggle('active', i === this.danceStyleIdx));
    }
  }

  stopDancing() {
    if (!this.isDancing) return;
    this.isDancing = false;
    if (this.el && this.el.danceBar) this.el.danceBar.classList.remove('on');
    this.syncReticleVisibility();
  }

  setTimeOfDay(idx, silent = false) {
    this.timeIdx = ((idx % TIME_PRESETS.length) + TIME_PRESETS.length) % TIME_PRESETS.length;
    const tp = TIME_PRESETS[this.timeIdx];
    this.dayTime = tp.hour;
    if (this.el.timeBtn) {
      const lbl = this.el.timeBtn.querySelector('[data-time-lbl]');
      if (lbl) lbl.textContent = tp.label;
      else this.el.timeBtn.textContent = `${tp.label} [T]`;
      this.el.timeBtn.classList.toggle('on', this.timeIdx === 2);
    }
    if (this.timeIdx === 2 && !this.lightsOn) this.toggleLights();
    if (!silent && this.el.combo) {
      this.el.combo.innerHTML = `TIME · ${tp.label.toUpperCase()} <span>AUTO CYCLE</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 1.8;
    }
  }

  setWeather(idx, silent = false) {
    this.weatherIdx = ((idx % WEATHER_PRESETS.length) + WEATHER_PRESETS.length) % WEATHER_PRESETS.length;
    const wp = WEATHER_PRESETS[this.weatherIdx];
    this.autoWeatherTimer = 50 + Math.random() * 22;
    if (this.el.weatherBtn) {
      const lbl = this.el.weatherBtn.querySelector('[data-weather-lbl]');
      if (lbl) lbl.textContent = wp.label;
      else this.el.weatherBtn.textContent = `${wp.label} [Y]`;
      this.el.weatherBtn.classList.toggle('on', this.weatherIdx > 0);
    }
    this.audio.setRainLevel(wp.rain);
    if (this.rainLines) this.rainLines.mesh.visible = wp.rain > 0.04;
    if (this.weatherIdx === 3 && !this.lightsOn) this.toggleLights();
    if (!silent && this.el.combo) {
      this.el.combo.innerHTML = `WEATHER · ${wp.label.toUpperCase()} <span>LEONIDA</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 1.8;
    }
  }

  applyHoverLook(dx, dy = 0) {
    // Clamp spikes for silky-smooth velocity-damped GTA camera look without jump glitches
    const cdx = THREE.MathUtils.clamp(dx, -64, 64);
    const cdy = THREE.MathUtils.clamp(dy, -48, 48);
    if (this.mode === 'foot') {
      this.targetOrbitYaw -= cdx * 0.0044;
    } else {
      this.targetOrbitYaw = THREE.MathUtils.clamp(this.targetOrbitYaw - cdx * 0.0038, -2.85, 2.85);
    }
    this.targetOrbitPitch = THREE.MathUtils.clamp(this.targetOrbitPitch + cdy * 0.0026, -0.34, 0.70);
    this.lastLookTime = performance.now();
  }

  findNearestVehicleTarget(maxDist = 5.4) {
    const ps = this.playerState;
    const cs = this.carState;
    let best = null;
    let bestD = maxDist;

    // 0. Check flyable airport airplanes & Maverick helicopters
    if (this.flyablePlanes) {
      for (let i = 0; i < this.flyablePlanes.length; i++) {
        const pl = this.flyablePlanes[i];
        if (pl.y > 4.0) continue;
        const d = Math.hypot(pl.x - ps.x, pl.z - ps.z);
        if (d < maxDist + 3.4 && (!best || d - 2.0 < bestD)) {
          bestD = Math.max(0.1, d - 2.0);
          best = { kind: 'plane', plane: pl, label: pl.label, dist: d };
        }
      }
    }
    // 0b. Check drivable ocean speedboats & jet skis along beaches/piers
    if (this.boats) {
      for (let i = 0; i < this.boats.length; i++) {
        const b = this.boats[i];
        const d = Math.hypot(b.x - ps.x, b.z - ps.z);
        if (d < maxDist + 3.6 && (!best || d - 1.6 < bestD)) {
          bestD = Math.max(0.1, d - 1.6);
          best = { kind: 'boat', boat: b, label: b.label, dist: d };
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
    // 3. Check parked vehicles (including Two-Wheelers, Police Cruiser, Kaufman Cab & Coupes!)
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
      ps.x = seatX; ps.z = seatZ;
      ps.y = this.getSurfaceY(seatX, seatZ, true);
      ps.vy = 0; ps.grounded = true;
      ps.yaw = carYaw;
      this.player.root.position.set(ps.x, ps.y, ps.z);
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

      ps.y = this.getSurfaceY(ps.x, ps.z, true);
      p.root.position.set(ps.x, ps.y, ps.z);
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
      ps.y = this.getSurfaceY(ps.x, ps.z, true);
      ps.vy = 0;
      ps.grounded = true;
      p.root.position.set(ps.x, ps.y, ps.z);
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
      ps.y = this.getSurfaceY(ps.x, ps.z, true);
      p.root.position.set(ps.x, ps.y, ps.z);
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

    const stolenY = this.getSurfaceY(tc.position.x, tc.position.z, false) + 0.04;
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
      y: stolenY,
      z: tc.position.z,
      yaw: tc.rotation.y
    };

    cs.x = tc.position.x;
    cs.y = stolenY;
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
    if (this.hydraulicsState) {
      this.hydraulicsState.bounceY = 0;
      this.hydraulicsState.bounceVel = 0;
      this.hydraulicsState.mode = 0;
    }
    this.setMode('car');
    this.applyCarMods();
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
    if (plane.isHeli) {
      if (typeof this.audio.setHeliRotor === 'function') this.audio.setHeliRotor(true, 0.35);
      this.el.combo.innerHTML = `CHOPPER PILOT · ${plane.label} <span>SPACE UP · Q/SHIFT DOWN · W/S FLY</span>`;
    } else {
      if (typeof this.audio.startPlaneSequence === 'function') this.audio.startPlaneSequence();
      this.el.combo.innerHTML = `PILOTING · ${plane.label} <span>W THRUST · SPACE CLIMB</span>`;
    }
    this.el.combo.classList.add('on');
    this.streakTimer = 3.2;
  }

  enterBoat(boat) {
    if (!boat) return;
    this.cancelAutopilot();
    this.activeBoat = boat;
    this.orbitYawOffset = 0;
    this.orbitPitchOffset = 0;
    this.snapCameraNext = true;
    if (this.el.carName) this.el.carName.textContent = boat.label;
    this.setMode('boat');
    this.drawRadar();
    this.audio.carDoor();
    this.el.combo.innerHTML = `AT THE HELM · ${boat.label} <span>WASD STEER · SHIFT TURBO · F SHORE</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.0;
  }

  exitBoat() {
    const b = this.activeBoat;
    if (!b) { this.setMode('foot'); return; }
    b.speed = 0;
    const ps = this.playerState;
    // Place safely onto nearest shoreline/pier boardwalk
    const shoreX = b.x > 80 && b.x < 145 ? 122 : Math.min(25.5, b.x - 4.0);
    ps.x = THREE.MathUtils.clamp(shoreX, -15, 138);
    ps.z = b.z;
    ps.y = Math.max(0.16, this.getSurfaceY(ps.x, ps.z, true));
    ps.vx = 0; ps.vz = 0; ps.vy = 0; ps.grounded = true;
    this.activeBoat = null;
    this.setMode('foot');
    this.player.root.position.set(ps.x, ps.y, ps.z);
    this.player.root.rotation.y = ps.yaw;
    this.snapCameraNext = true;
    this.drawRadar();
    this.audio.carDoor();
  }

  exitPlane() {
    const pl = this.activePlane;
    if (!pl) { this.setMode('foot'); return; }
    const ps = this.playerState;
    const rx = Math.cos(pl.yaw), rz = -Math.sin(pl.yaw);
    if (pl.y > 4.5) {
      ps.x = pl.x - rx * 4.5;
      ps.z = pl.z - rz * 4.5;
      ps.y = Math.max(5.5, pl.y - 1.2);
      const launchSpd = THREE.MathUtils.clamp(pl.speed * 0.32, 8.5, 16.0);
      ps.vx = -Math.sin(pl.yaw) * launchSpd;
      ps.vz = -Math.cos(pl.yaw) * launchSpd;
      ps.vy = -3.6;
      ps.yaw = pl.yaw;
      ps.grounded = false;
      ps.parachuting = true;
      ps.paraOpenT = 0.04;
      ps.paraRoll = 0;
      ps.paraPitch = 0;
      ps.paraFlare = 0;
      ps.paraSteer = 0;
      if (this.parachuteMesh) this.parachuteMesh.visible = true;
      pl.resetTimer = 4.2;
      this.el.combo.innerHTML = `RAM-AIR CHUTE DEPLOYED · W DIVE · S FLARE · A/D STEER <span>SKYDIVE</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 3.8;
    } else {
      pl.speed = 0;
      pl.throttle = 0;
      pl.y = Math.max(0.02, this.getSurfaceY(pl.x, pl.z, false));
      pl.pitch = 0;
      pl.roll = 0;
      pl.gearBlend = 1;
      this.syncPlaneTransform(pl, 0.016, this.clock.getElapsedTime());
      ps.x = pl.x - rx * 5.2;
      ps.z = pl.z - rz * 5.2;
      ps.y = this.getSurfaceY(ps.x, ps.z, true);
      ps.vx = 0; ps.vz = 0; ps.vy = 0;
      ps.yaw = pl.yaw;
      ps.grounded = true;
      ps.parachuting = false;
      ps.paraOpenT = 0;
      if (this.parachuteMesh) this.parachuteMesh.visible = false;
    }
    this.player.root.position.set(ps.x, ps.y, ps.z);
    this.player.root.rotation.y = ps.yaw;
    this.orbitYawOffset = pl.yaw;
    this.targetOrbitYaw = pl.yaw;
    this.orbitPitchOffset = 0.12;
    this.snapCameraNext = true;
    this.activePlane = null;
    if (typeof this.audio.stopPlaneSequence === 'function') this.audio.stopPlaneSequence();
    if (typeof this.audio.setHeliRotor === 'function') this.audio.setHeliRotor(false, 0);
    this.setMode('foot');
    this.drawRadar();
    this.audio.carDoor();
  }

  syncPlaneTransform(pl, dt, elapsed) {
    const rig = pl.rig;
    pl.root.position.set(pl.x, pl.y, pl.z);
    pl.root.rotation.order = 'YXZ';
    pl.root.rotation.set(pl.pitch, pl.yaw, pl.roll);

    if (pl.isHeli) {
      const spin = this.mode === 'plane' && this.activePlane === pl ? (14 + pl.throttle * 26) : 2.8;
      if (rig.mainRotor) rig.mainRotor.rotation.y += dt * spin;
      if (rig.tailRotor) rig.tailRotor.rotation.x += dt * spin * 1.45;
      if (rig.strobe) rig.strobe.visible = (elapsed % 1.0) < 0.16;
      return;
    }

    const targetGear = pl.y < 7.0 ? 1 : 0;
    pl.gearBlend = THREE.MathUtils.damp(pl.gearBlend, targetGear, 4.2, dt);
    if (rig.gearGroup) {
      rig.gearGroup.visible = pl.gearBlend > 0.05;
      rig.gearGroup.scale.y = Math.max(0.05, pl.gearBlend);
    }
    const spinRate = 6 + pl.throttle * 34 + pl.speed * 0.45;
    if (rig.fanMeshes) {
      for (let i = 0; i < rig.fanMeshes.length; i++) rig.fanMeshes[i].rotation.z += dt * spinRate;
    }
    if (rig.propHub) {
      rig.propHub.rotation.z += dt * (10 + pl.throttle * 42 + pl.speed * 0.55);
    }
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
    if (this.mode === 'boat') {
      this.exitBoat();
      return;
    }
    if (this.mode === 'plane') {
      this.exitPlane();
      return;
    }
    if (this.mode === 'car') {
      this.cancelAutopilot();
      cs.speed *= 0.12;
      if (this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.isBike) {
        const rx = Math.cos(cs.yaw), rz = -Math.sin(cs.yaw);
        ps.x = cs.x - rx * 1.45;
        ps.z = cs.z - rz * 1.45;
        ps.y = this.getSurfaceY(ps.x, ps.z, true);
        ps.vy = 0; ps.grounded = true;
        ps.yaw = cs.yaw;
        this.setMode('foot');
        this.player.root.position.set(ps.x, ps.y, ps.z);
        this.audio.carDoor();
      } else {
        this.startVehicleDoorAnim('exit', this.activeVehicle);
      }
    } else {
      const target = this.findNearestVehicleTarget(5.4);
      if (target && target.kind === 'plane') {
        this.enterPlane(target.plane);
        return;
      }
      if (target && target.kind === 'boat') {
        this.enterBoat(target.boat);
        return;
      }
      if (target && target.kind === 'traffic') {
        this.startCarjackAnim(target.mesh);
        return;
      }
      if (target && target.kind === 'parked') {
        if (target.vehicle && target.vehicle.rig && target.vehicle.rig.isBike) {
          this.enterParkedVehicle(target.vehicle, target.index);
        } else {
          this.startVehicleDoorAnim('parked', target.vehicle, target.index);
        }
        return;
      }
      const distCar = Math.hypot(ps.x - cs.x, ps.z - cs.z);
      if (distCar <= 5.4) {
        if (this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.isBike) {
          this.orbitYawOffset = 0;
          this.orbitPitchOffset = 0;
          this.setMode('car');
          this.audio.carDoor();
        } else {
          this.startVehicleDoorAnim('enter', this.activeVehicle);
        }
        return;
      }
      if (!forceEnter) {
        // STRICT REALISTIC BOARDING: Never teleport into a faraway car when pressing [F]!
        this.el.combo.innerHTML = `NO VEHICLE NEARBY <span>WALK CLOSER OR CALL TAXI [X]</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 2.0;
        return;
      }
      this.orbitYawOffset = 0;
      this.orbitPitchOffset = 0;
      this.setMode('car');
      this.audio.carDoor();
    }
  }

  isPointBlocked(x, z, r = 0.45) {
    if (x < LEONIDA_PROJ.minX + 18 || x > LEONIDA_PROJ.maxX - 18 || z > LEONIDA_PROJ.maxZ - 18 || z < LEONIDA_PROJ.minZ + 18) return true;
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

    // 1. Full Great State of Leonida On-Foot Perimeter Bounds & Shoreline Containment
    if (ps.x < LEONIDA_PROJ.minX + 18) ps.x = LEONIDA_PROJ.minX + 18;
    if (ps.x > LEONIDA_PROJ.maxX - 18) ps.x = LEONIDA_PROJ.maxX - 18;
    if (ps.z < LEONIDA_PROJ.minZ + 18) ps.z = LEONIDA_PROJ.minZ + 18;
    if (ps.z > LEONIDA_PROJ.maxZ - 18) ps.z = LEONIDA_PROJ.maxZ - 18;

    const inCoreViceFoot = isInCoreViceFootprint(ps.x, ps.z);
    const inLegacyMtFoot = isInLegacyMountains(ps.x, ps.z);
    if (inLegacyMtFoot || (!inCoreViceFoot && this.getSurfaceY(ps.x, ps.z, true) > 16)) {
      const hPx = this.getSurfaceY(ps.x + 1.2, ps.z, true);
      const hMx = this.getSurfaceY(ps.x - 1.2, ps.z, true);
      const hPz = this.getSurfaceY(ps.x, ps.z + 1.2, true);
      const hMz = this.getSurfaceY(ps.x, ps.z - 1.2, true);
      const gx = (hPx - hMx) / 2.4, gz = (hPz - hMz) / 2.4;
      const slope = Math.hypot(gx, gz);
      const onMtRd = inLegacyMtFoot ? closestAnyMountainRoad(ps.x, ps.z).dist <= 7.4 : closestLeonidaHighway(ps.x, ps.z).dist <= 9.0;
      // Only block sheer near-vertical rock overhangs (>61 deg); allow smooth on-foot mountain hiking everywhere!
      if (slope > 1.85 && !onMtRd) {
        const push = Math.min(0.65, 0.25 + (slope - 1.85) * 0.5);
        ps.x -= (gx / slope) * push;
        ps.z -= (gz / slope) * push;
        const vUp = (ps.vx || 0) * (gx / slope) + (ps.vz || 0) * (gz / slope);
        if (vUp > 0) {
          ps.vx -= (gx / slope) * vUp;
          ps.vz -= (gz / slope) * vUp;
        }
      }
    }
    if (inCoreViceFoot) {
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
    } else if (!inLegacyMtFoot) {
      const hwF = closestLeonidaHighway(ps.x, ps.z);
      if (hwF.dist > hwF.width * 0.65 && getLandFactor(ps.x, ps.z) < 0.24) {
        const eps = 3.0;
        const gx = getLandFactor(ps.x + eps, ps.z) - getLandFactor(ps.x - eps, ps.z);
        const gz = getLandFactor(ps.x, ps.z + eps) - getLandFactor(ps.x, ps.z - eps);
        const gLen = Math.hypot(gx, gz);
        if (gLen > 0.0005) {
          ps.x += (gx / gLen) * 1.1;
          ps.z += (gz / gLen) * 1.1;
        }
      }
    }

    // 2. O(1) Spatial-Hashed Solid Building / Wall / Barricade AABBs & Solid Cylinders (2 passes for crisp zero-clip corners)
    const nearBoxes = this.colliderGrid.queryBoxes(ps.x, ps.z, 3.5);
    const nearCircles = this.colliderGrid.queryCircles(ps.x, ps.z, 3.5);
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < nearBoxes.length; i++) {
        const b = nearBoxes[i];
        if (b.minX >= 17.0 && b.maxX <= 18.3) continue;
        const cx = THREE.MathUtils.clamp(ps.x, b.minX, b.maxX);
        const cz = THREE.MathUtils.clamp(ps.z, b.minZ, b.maxZ);
        const dx = ps.x - cx, dz = ps.z - cz;
        const dSq = dx * dx + dz * dz;
        if (dSq < r * r) {
          if (dSq > 0.00001) {
            const d = Math.sqrt(dSq);
            ps.x += (dx / d) * (r - d);
            ps.z += (dz / d) * (r - d);
          } else {
            const dL = Math.abs(ps.x - b.minX), dR = Math.abs(b.maxX - ps.x);
            const dT = Math.abs(ps.z - b.minZ), dB = Math.abs(b.maxZ - ps.z);
            const m = Math.min(dL, dR, dT, dB);
            if (m === dL) ps.x = b.minX - r;
            else if (m === dR) ps.x = b.maxX + r;
            else if (m === dT) ps.z = b.minZ - r;
            else ps.z = b.maxZ + r;
          }
        }
      }

      // 2b. Ocean View Safehouse Floor-Aware Interior Colliders (100% Unobstructed Grand Staircase + Suite Furniture)
      const ovX = -24.5, ovZ = -48.0;
      const ovLx = ps.x - ovX, ovLz = ps.z - ovZ;
      if (ovLx >= -8.0 && ovLx <= 8.0 && ovLz >= -12.0 && ovLz <= 12.0) {
        let floorBoxes;
        if (ps.y >= 3.60) {
          // 1st-Floor Suite: Stairwell glass railing (leaves West landing -7.3..-4.35 wide open!) + solid furniture
          floorBoxes = [
            { minX: ovX - 4.25, maxX: ovX + 7.35, minZ: ovZ - 7.45, maxZ: ovZ - 7.05 }, // stairwell safety railing
            { minX: ovX - 7.05, maxX: ovX - 3.10, minZ: ovZ + 4.95, maxZ: ovZ + 8.25 }, // king bed
            { minX: ovX + 5.25, maxX: ovX + 6.95, minZ: ovZ + 5.90, maxZ: ovZ + 9.30 }, // TV console
            { minX: ovX + 3.65, maxX: ovX + 4.65, minZ: ovZ + 6.75, maxZ: ovZ + 8.85 }, // coffee table
            { minX: ovX + 5.45, maxX: ovX + 7.10, minZ: ovZ - 5.10, maxZ: ovZ + 1.25 }, // kitchen counter & fridge
            { minX: ovX + 2.75, maxX: ovX + 4.85, minZ: ovZ - 1.80, maxZ: ovZ + 1.00 }, // dining table
            { minX: ovX - 7.30, maxX: ovX - 6.00, minZ: ovZ - 3.45, maxZ: ovZ - 0.15 }  // wardrobe closet
          ];
        } else if (ps.y >= 0.40) {
          // Actively climbing or descending the grand staircase: keep full flight & landing open, guide south rail!
          floorBoxes = [
            { minX: ovX - 4.25, maxX: ovX + 4.30, minZ: ovZ - 7.52, maxZ: ovZ - 7.22 }  // angled brass handrail guide
          ];
        } else {
          // Ground Lobby: Solid under-stair wall ONLY west of the entry steps + reception desk + lobby lounge sofa
          floorBoxes = [
            { minX: ovX - 7.30, maxX: ovX + 1.40, minZ: ovZ - 11.2, maxZ: ovZ - 7.42 }, // solid under-stairs enclosure
            { minX: ovX - 6.10, maxX: ovX - 4.35, minZ: ovZ - 1.10, maxZ: ovZ + 5.50 }, // reception desk
            { minX: ovX + 0.35, maxX: ovX + 2.05, minZ: ovZ + 5.20, maxZ: ovZ + 9.75 }  // lobby lounge sofa/table
          ];
        }
        for (let fi = 0; fi < floorBoxes.length; fi++) {
          const fb = floorBoxes[fi];
          const cx = THREE.MathUtils.clamp(ps.x, fb.minX, fb.maxX);
          const cz = THREE.MathUtils.clamp(ps.z, fb.minZ, fb.maxZ);
          const dx = ps.x - cx, dz = ps.z - cz;
          const dSq = dx * dx + dz * dz;
          if (dSq < r * r) {
            if (dSq > 0.00001) {
              const d = Math.sqrt(dSq);
              ps.x += (dx / d) * (r - d);
              ps.z += (dz / d) * (r - d);
            } else {
              const dL = Math.abs(ps.x - fb.minX), dR = Math.abs(fb.maxX - ps.x);
              const dT = Math.abs(ps.z - fb.minZ), dB = Math.abs(fb.maxZ - ps.z);
              const m = Math.min(dL, dR, dT, dB);
              if (m === dL) ps.x = fb.minX - r;
              else if (m === dR) ps.x = fb.maxX + r;
              else if (m === dT) ps.z = fb.minZ - r;
              else ps.z = fb.maxZ + r;
            }
          }
        }
      }

      // 3. Solid Cylinders (Mountain Pines, Boulders, Palms, Wishing Well, Lamps, Water Tower, Silo, Umbrellas)
      for (let i = 0; i < nearCircles.length; i++) {
        const c = nearCircles[i];
        const dx = ps.x - c.x, dz = ps.z - c.z;
        const minD = r + c.r;
        const dSq = dx * dx + dz * dz;
        if (dSq < minD * minD && dSq > 0.00001) {
          const d = Math.sqrt(dSq);
          ps.x += (dx / d) * (minD - d);
          ps.z += (dz / d) * (minD - d);
        }
      }
    }

    // 4. Active Vehicle, Parked Vehicles, Moving Traffic Cars, VCPD Cruisers & Parked Aircraft Solid Bodies!
    const pushOutCar = (vx, vz, vyaw, halfL = 2.35, halfW = 1.05) => {
      const dxC = ps.x - vx, dzC = ps.z - vz;
      if (Math.abs(dxC) > halfL + 2.0 || Math.abs(dzC) > halfL + 2.0) return;
      const fwdX = -Math.sin(vyaw), fwdZ = -Math.cos(vyaw);
      const rightX = Math.cos(vyaw), rightZ = -Math.sin(vyaw);
      const localF = dxC * fwdX + dzC * fwdZ;
      const localR = dxC * rightX + dzC * rightZ;
      const clF = THREE.MathUtils.clamp(localF, -halfL, halfL);
      const clR = THREE.MathUtils.clamp(localR, -halfW, halfW);
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
    const actIsBike = this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.isBike;
    pushOutCar(cs.x, cs.z, cs.yaw, actIsBike ? 1.15 : 2.35, actIsBike ? 0.45 : 1.05);
    for (let i = 0; i < this.parkedVehicles.length; i++) {
      const pv = this.parkedVehicles[i];
      const isB = pv && pv.rig && pv.rig.isBike;
      pushOutCar(pv.x, pv.z, pv.yaw, isB ? 1.15 : 2.35, isB ? 0.45 : 1.05);
    }
    for (let i = 0; i < this.traffic.length; i++) {
      const tc = this.traffic[i];
      if (!tc || !tc.visible) continue;
      pushOutCar(tc.position.x, tc.position.z, tc.rotation.y, 2.3, 1.02);
    }
    for (let i = 0; i < this.policeUnits.length; i++) {
      const pu = this.policeUnits[i];
      if (pu && pu.mesh && pu.mesh.visible) pushOutCar(pu.x, pu.z, pu.yaw, 2.45, 1.08);
    }
    if (this.flyablePlanes) {
      for (let i = 0; i < this.flyablePlanes.length; i++) {
        const pl = this.flyablePlanes[i];
        if (!pl || pl === this.activePlane || pl.y > 4.0) continue;
        pushOutCar(pl.x, pl.z, pl.yaw, 4.4, 2.1);
      }
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

    // 2b. Full State of Leonida Interstate & Town Street Graph (seamlessly stitched into Vice City!)
    const needsLeonidaGraph = !isInCoreViceFootprint(cs.x, cs.z) || !isInCoreViceFootprint(wp.x, wp.z);
    const leoNodes = [];
    if (needsLeonidaGraph) {
      for (let hi = 0; hi < LEONIDA_HIGHWAYS.length; hi++) {
        const hw = LEONIDA_HIGHWAYS[hi];
        const pts = hw.pts;
        let prevIdx = -1;
        const step = hw.isTownRoad ? Math.max(1, Math.floor(pts.length / 4)) : Math.max(2, Math.floor(pts.length / 22));
        for (let i = 0; i < pts.length; i += step) {
          const idx = addNode(`L_${hi}_${i}`, pts[i].x, pts[i].z);
          leoNodes.push(idx);
          if (prevIdx !== -1) addEdge(prevIdx, idx);
          prevIdx = idx;
        }
        const lastP = pts[pts.length - 1];
        const endIdx = addNode(`L_${hi}_END`, lastP.x, lastP.z);
        leoNodes.push(endIdx);
        if (prevIdx !== -1) addEdge(prevIdx, endIdx);
      }
      // Stitch intersecting highways, town streets & all 6 Vice City gateway intersections
      for (let i = 0; i < leoNodes.length; i++) {
        const a = nodes[leoNodes[i]];
        for (let j = i + 1; j < leoNodes.length; j++) {
          const b = nodes[leoNodes[j]];
          if (Math.hypot(a.x - b.x, a.z - b.z) < 92) addEdge(leoNodes[i], leoNodes[j]);
        }
        if (a.x > -580 && a.x < 100 && a.z > -1200 && a.z < 460) {
          for (let ai = 0; ai < AVENUES.length; ai++) {
            for (let ci = 0; ci < CROSS_STREETS.length; ci++) {
              const gIdx = gridIdx[`${ai}_${ci}`];
              const g = nodes[gIdx];
              if (Math.hypot(a.x - g.x, a.z - g.z) < 120) addEdge(leoNodes[i], gIdx);
            }
          }
        }
      }
    }

    // Helper: snap any arbitrary (x, z) onto its nearest clear road centerline segment
    const attachPoint = (tag, px, pz) => {
      if (needsLeonidaGraph && !isInCoreViceFootprint(px, pz)) {
        const id = addNode(tag, px, pz);
        let bestIdx = -1, bestD = Infinity;
        for (let i = 0; i < leoNodes.length; i++) {
          const n = nodes[leoNodes[i]];
          const d = Math.hypot(px - n.x, pz - n.z);
          if (d < bestD) { bestD = d; bestIdx = leoNodes[i]; }
        }
        if (bestIdx !== -1) addEdge(id, bestIdx);
        return { idx: id, segKey: `LEO_${bestIdx}`, x: px, z: pz };
      }
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
    if (this.el.lampAuto) this.el.lampAuto.classList.add('on-auto');
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
    const w = 460, h = 620;
    const cs = this.carState;
    const act = this.mode === 'plane' && this.activePlane
      ? this.activePlane
      : (this.mode === 'foot' ? this.playerState : cs);

    const spanX = LEONIDA_PROJ.maxX - LEONIDA_PROJ.minX;
    const spanZ = LEONIDA_PROJ.maxZ - LEONIDA_PROJ.minZ;
    // Exact 1:1 Linear World-to-Vector-Atlas Projection
    const toMap = (wx, wz) => [
      ((wx - LEONIDA_PROJ.minX) / spanX) * w,
      ((wz - LEONIDA_PROJ.minZ) / spanZ) * h
    ];
    this._fullMapMeta = { w, h, mode: 'leonida-vector' };

    // Blit our 100% custom procedural GTA-style vector map (zero static image!)
    if (this.leonidaMapCanvas) {
      ctx.drawImage(this.leonidaMapCanvas, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#1b4768';
      ctx.fillRect(0, 0, w, h);
    }

    // Active GPS route polyline across the State of Leonida
    if (this.autopilotQueue.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#FF2E88';
      ctx.lineWidth = 3.4;
      ctx.shadowColor = '#FF2E88';
      ctx.shadowBlur = 8;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      const [sx, sy] = toMap(act.x, act.z);
      ctx.moveTo(sx, sy);
      for (let i = 0; i < this.autopilotQueue.length; i++) {
        const [qx, qy] = toMap(this.autopilotQueue[i].x, this.autopilotQueue[i].z);
        ctx.lineTo(qx, qy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Flyable Aircraft Pins across all 4 Leonida Airports
    if (this.flyablePlanes) {
      this.flyablePlanes.forEach((pl) => {
        const [ax, ay] = toMap(pl.x, pl.z);
        ctx.fillStyle = '#FFD36B';
        ctx.beginPath(); ctx.arc(ax, ay, 6.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.fillStyle = '#0B0418';
        ctx.font = '800 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✈', ax, ay + 2.8);
      });
    }

    // Numbered Portfolio Showroom Pins (Vice Beach / Vice City)
    SHOWROOMS.forEach((sr) => {
      const [sx, sy] = toMap(sr.x, sr.z);
      const vis = this.visited.has(sr.id);
      ctx.fillStyle = vis ? '#FFD36B' : sr.accentHex;
      ctx.beginPath(); ctx.arc(sx, sy, 6.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = '#0B0418';
      ctx.font = '800 7.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(sr.num, sx, sy + 2.6);
    });

    // Custom Map Pin & Active Side-Mission Objective Marker on Full Map
    if (this.customWaypoint) {
      const [wx, wy] = toMap(this.customWaypoint.x, this.customWaypoint.z);
      ctx.fillStyle = '#FFD36B';
      ctx.beginPath(); ctx.arc(wx, wy, 7.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FF2E88'; ctx.lineWidth = 2.0; ctx.stroke();
    }
    if (this.activeSideMission && this.activeSideMission.target) {
      const [mx, my] = toMap(this.activeSideMission.target.x, this.activeSideMission.target.z);
      ctx.fillStyle = '#21E6D1';
      ctx.beginPath(); ctx.arc(mx, my, 7.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 2.0; ctx.stroke();
    }

    // Parked Supercar Marker when roaming on foot or flying
    if (this.mode !== 'car') {
      const [cx, cy] = toMap(cs.x, cs.z);
      ctx.fillStyle = '#21E6D1';
      ctx.fillRect(cx - 4, cy - 5.5, 8, 11);
      ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 4, cy - 5.5, 8, 11);
    }

    // Active Actor (Player, Car, or Flying Airplane) Glowing Chevron
    const [px, py] = toMap(act.x, act.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-act.yaw);
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 6;
    ctx.fillStyle = this.mode === 'plane' ? '#FFD36B' : '#FFF5EE';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(7, 7.5); ctx.lineTo(0, 3.8); ctx.lineTo(-7, 7.5); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.mode === 'plane' ? '#FF2E88' : (this.mode === 'foot' ? '#21E6D1' : '#FF2E88');
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();

    // Time/Weather & Live Vector GPS Badge
    const tpLbl = `${TIME_PRESETS[this.timeIdx].icon} ${TIME_PRESETS[this.timeIdx].label.toUpperCase()} · ${WEATHER_PRESETS[this.weatherIdx].icon} ${WEATHER_PRESETS[this.weatherIdx].label.toUpperCase()} · LEONIDA GPS`;
    ctx.fillStyle = 'rgba(10, 5, 22, 0.86)';
    ctx.fillRect(10, 10, 232, 22);
    ctx.strokeStyle = 'rgba(33, 230, 209, 0.48)';
    ctx.strokeRect(10, 10, 232, 22);
    ctx.fillStyle = '#21E6D1';
    ctx.font = '700 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(tpLbl, 17, 24);

    // Update live distances in sidebar (km when >= 1000m)
    this.el.fmDists.forEach((el) => {
      const wp = WAYPOINTS.find((w) => w.id === el.dataset.fmDist);
      if (!wp) return;
      const d = Math.round(Math.hypot(wp.x - act.x, wp.z - act.z));
      el.textContent = d >= 1000 ? `${(d / 1000).toFixed(1)}km` : `${d}m`;
    });
  }

  drawRadar() {
    const ctx = this.radarCtx;
    if (!ctx) return;
    const w = 240, h = 154;
    ctx.clearRect(0, 0, w, h);

    // Deep Atlantic/Gulf Ocean Gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, w, h);
    oceanGrad.addColorStop(0, '#0a2238');
    oceanGrad.addColorStop(1, '#123a59');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    const cs = this.carState;
    const act = this.mode === 'plane' && this.activePlane
      ? this.activePlane
      : (this.mode === 'boat' && this.activeBoat ? this.activeBoat : ((this.mode === 'foot' || this.mode === 'ride') ? this.playerState : cs));
    const inViceCore = isInCoreViceFootprint(act.x, act.z) || isInLegacyMountains(act.x, act.z);
    const scale = this.mode === 'plane' ? 0.14 : (this.mode === 'foot' ? 0.68 : (inViceCore ? 0.46 : 0.28));
    const toRadar = (wx, wz) => [w * 0.5 + (wx - act.x) * scale, h * 0.5 + (wz - act.z) * scale];

    // Live Zoomed Slice of our 100% Custom Procedural Vector Map Canvas!
    if (this.leonidaMapCanvas) {
      const cw = this.leonidaMapCanvas.width;
      const ch = this.leonidaMapCanvas.height;
      const spanX = LEONIDA_PROJ.maxX - LEONIDA_PROJ.minX;
      const spanZ = LEONIDA_PROJ.maxZ - LEONIDA_PROJ.minZ;
      const u = (act.x - LEONIDA_PROJ.minX) / spanX;
      const v = (act.z - LEONIDA_PROJ.minZ) / spanZ;
      const worldSpanX = w / scale;
      const worldSpanZ = h / scale;
      const srcW = (worldSpanX / spanX) * cw;
      const srcH = (worldSpanZ / spanZ) * ch;
      const srcX = u * cw - srcW * 0.5;
      const srcY = v * ch - srcH * 0.5;
      ctx.save();
      ctx.globalAlpha = inViceCore ? 0.42 : 0.96;
      ctx.drawImage(this.leonidaMapCanvas, srcX, srcY, srcW, srcH, 0, 0, w, h);
      ctx.restore();
      if (!inViceCore) {
        ctx.fillStyle = 'rgba(8, 12, 24, 0.16)';
        ctx.fillRect(0, 0, w, h);
        // Crisp live-vector local town streets & highways overlay at exact radar scale
        LEONIDA_HIGHWAYS.forEach((hw) => {
          ctx.strokeStyle = hw.isTownRoad ? 'rgba(218, 224, 238, 0.78)' : 'rgba(255, 220, 125, 0.9)';
          ctx.lineWidth = hw.isTownRoad ? Math.max(1.8, hw.width * scale) : Math.max(2.6, hw.width * scale * 0.95);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let i = 0; i < hw.pts.length; i++) {
            const [rx, ry] = toRadar(hw.pts[i].x, hw.pts[i].z);
            if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
          }
          ctx.stroke();
        });
      }
    }

    // Core Vice City detailed street blocks & beaches (blended cleanly when inside Vice City!)
    if (inViceCore) {
      const [coastX] = toRadar(14, act.z);
      const [beachX] = toRadar(30, act.z);
      const [shallowX] = toRadar(44, act.z);
      ctx.fillStyle = 'rgba(33, 230, 209, 0.16)';
      ctx.fillRect(0, 0, Math.max(0, Math.min(w, shallowX)), h);
      ctx.fillStyle = 'rgba(200, 167, 123, 0.82)';
      ctx.fillRect(0, 0, Math.max(0, Math.min(w, beachX)), h);
      ctx.fillStyle = 'rgba(25, 22, 38, 0.82)';
      ctx.fillRect(0, 0, Math.max(0, Math.min(w, coastX)), h);
      if (beachX > 0 && beachX < w) {
        ctx.strokeStyle = 'rgba(33, 230, 209, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(beachX, 0); ctx.lineTo(beachX, h); ctx.stroke();
      }
    }

    // Mount Vice Mountain Range & Winding Switchback Loop Highway on Tactical Minimap
    const [rmX1, rmY1] = toRadar(-505, -1488);
    const [rmX2, rmY2] = toRadar(42, -1115);
    if (inViceCore && rmY2 > 0 && rmY1 < h && rmX2 > 0 && rmX1 < w) {
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

    // Separate Western Mountain Range: Sierra West Redrock Peaks & Continuous Loop Highway on Tactical Minimap
    const [rswX1, rswY1] = toRadar(-885, -760);
    const [rswX2, rswY2] = toRadar(-496, 240);
    if (inViceCore && rswY2 > 0 && rswY1 < h && rswX2 > 0 && rswX1 < w) {
      ctx.fillStyle = '#4a3123';
      ctx.fillRect(rswX1, rswY1, rswX2 - rswX1, rswY2 - rswY1);
      const [rswPkX, rswPkY] = toRadar(-772, -210);
      ctx.fillStyle = '#8b573b';
      ctx.beginPath(); ctx.ellipse(rswPkX, rswPkY, 64 * scale, 110 * scale, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255, 138, 42, 0.9)';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      SIERRA_WEST_ROAD.forEach((rp, idx) => {
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
    if (this.boats) {
      for (let i = 0; i < this.boats.length; i++) {
        const b = this.boats[i];
        if (this.mode === 'boat' && this.activeBoat === b) continue;
        const [bx, by] = toRadar(b.x, b.z);
        if (bx < 5 || bx > w - 5 || by < 5 || by > h - 5) continue;
        ctx.fillStyle = '#21E6D1';
        ctx.beginPath(); ctx.arc(bx, by, 3.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (this.customWaypoint) {
      const [wx, wy] = toRadar(this.customWaypoint.x, this.customWaypoint.z);
      const clx = THREE.MathUtils.clamp(wx, 9, w - 9);
      const cly = THREE.MathUtils.clamp(wy, 9, h - 9);
      ctx.fillStyle = '#FFD36B';
      ctx.beginPath(); ctx.arc(clx, cly, 5.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FF2E88'; ctx.lineWidth = 1.6; ctx.stroke();
    }
    if (this.activeSideMission && this.activeSideMission.target) {
      const [mx, my] = toRadar(this.activeSideMission.target.x, this.activeSideMission.target.z);
      const clx = THREE.MathUtils.clamp(mx, 9, w - 9);
      const cly = THREE.MathUtils.clamp(my, 9, h - 9);
      ctx.fillStyle = this.activeSideMission.kind === 'pizza' ? '#FF7B2E' : (this.activeSideMission.kind === 'impromptuRace' ? '#FF2E88' : '#21E6D1');
      ctx.beginPath(); ctx.arc(clx, cly, 5.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0B0418'; ctx.lineWidth = 1.4; ctx.stroke();
    }
    // Dynamic Street Events & Rival Gangs Radar Blips
    if (this.dynamicEvent && !this.dynamicEvent.completed) {
      const de = this.dynamicEvent;
      const [ex, ey] = toRadar(de.x, de.z);
      const clx = THREE.MathUtils.clamp(ex, 9, w - 9);
      const cly = THREE.MathUtils.clamp(ey, 9, h - 9);
      ctx.save();
      ctx.translate(clx, cly);
      if (de.kind === 'racer') {
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#FF2E88';
        ctx.fillRect(-4.5, -4.5, 9, 9);
        ctx.strokeStyle = '#FFD36B'; ctx.lineWidth = 1.4; ctx.strokeRect(-4.5, -4.5, 9, 9);
      } else {
        ctx.fillStyle = '#FF384B';
        ctx.beginPath(); ctx.arc(0, 0, 5.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFD36B'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
    }
    // Flashing Red/Blue VCPD Police Cruiser Blips on Minimap Radar!
    if (this.policeUnits && this.policeUnits.length > 0) {
      const flashBlue = Math.floor(performance.now() / 180) % 2 === 0;
      for (let i = 0; i < this.policeUnits.length; i++) {
        const pu = this.policeUnits[i];
        if (!pu.mesh || !pu.mesh.visible) continue;
        const [px, py] = toRadar(pu.x, pu.z);
        const clx = THREE.MathUtils.clamp(px, 8, w - 8);
        const cly = THREE.MathUtils.clamp(py, 8, h - 8);
        ctx.fillStyle = flashBlue ? '#2288FF' : '#FF2442';
        ctx.beginPath(); ctx.arc(clx, cly, 4.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2; ctx.stroke();
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
    this.el.closeBtn.addEventListener('click', () => this.close());
    this.el.mClose.addEventListener('click', () => {
      this.el.modal.hidden = true;
      this.syncReticleVisibility();
    });
    this.el.srPreview.addEventListener('click', () => { if (this.activeShowroom) this.openShowroomModal(this.activeShowroom); });
    this.el.dockToggle.addEventListener('click', () => {
      const collapsed = this.el.dockWrap.classList.toggle('collapsed');
      this.el.dockToggle.textContent = collapsed ? '▴ Controls' : '▾ Hide Controls';
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
    if (this.el.footWheelBtn) {
      this.el.footWheelBtn.addEventListener('click', () => {
        if (this.weaponWheelOpen) this.closeWeaponWheel(true);
        else this.openWeaponWheel(false);
      });
    }
    if (this.el.gtaWepPill) {
      this.el.gtaWepPill.addEventListener('click', () => {
        if (this.weaponWheelOpen) this.closeWeaponWheel(true);
        else this.openWeaponWheel(false);
      });
    }
    if (this.el.wwWedges) {
      this.el.wwWedges.forEach((el, idx) => {
        el.addEventListener('pointerenter', () => { if (this.weaponWheelOpen) this.setWeaponWheelHover(idx, true); });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setWeaponWheelHover(idx, false);
          this.closeWeaponWheel(true);
        });
      });
    }
    if (this.el.wwSlots) {
      this.el.wwSlots.forEach((el, idx) => {
        el.addEventListener('pointerenter', () => { if (this.weaponWheelOpen) this.setWeaponWheelHover(idx, true); });
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.setWeaponWheelHover(idx, false);
          this.closeWeaponWheel(true);
        });
      });
    }
    if (this.el.weaponWheel) {
      this.el.weaponWheel.addEventListener('click', (e) => {
        if (e.target === this.el.weaponWheel) this.closeWeaponWheel(true);
      });
    }
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
    // Kaufman Cabs Interactive Taxi Service Bindings
    if (this.el.taxiBtn) this.el.taxiBtn.addEventListener('click', () => { if (this.taxiModalOpen) this.closeTaxiModal(); else this.openTaxiModal(); });
    if (this.el.taxiClose) this.el.taxiClose.addEventListener('click', () => this.closeTaxiModal());
    if (this.el.taxiDests) {
      this.el.taxiDests.forEach((btn) => {
        btn.addEventListener('click', () => this.takeTaxiRide(btn.dataset.taxiDest, Number(btn.dataset.taxiFare || 25)));
      });
    }
    // Main Website Car Radio Interactions (Tap LCD to fold/open, explicit ON/OFF button, Pwr/Vol knob, Tune knob & 5 presets)
    this.el.radLcd.addEventListener('click', (e) => {
      e.stopPropagation();
      this.el.radioDeck.classList.toggle('open');
    });
    if (this.el.radPwr) {
      this.el.radPwr.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleRadioPower();
      });
    }
    if (this.el.shopClose) this.el.shopClose.addEventListener('click', () => this.closeShopMenu(false));
    if (this.el.shopDone) this.el.shopDone.addEventListener('click', () => this.closeShopMenu(true));
    if (this.el.tvClose) this.el.tvClose.addEventListener('click', () => this.closeTvModal());
    if (this.el.tvChBtns) {
      this.el.tvChBtns.forEach((btn, i) => btn.addEventListener('click', () => this.setTvChannel(i)));
    }
    if (this.el.danceMoveBtns) {
      this.el.danceMoveBtns.forEach((btn, i) => btn.addEventListener('click', () => this.setDanceStyle(i)));
    }
    if (this.el.danceStop) this.el.danceStop.addEventListener('click', () => this.stopDancing());
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
    this.el.projHubOv.addEventListener('click', (e) => {
      if (e.target === this.el.projHubOv) this.closeProjectsHub();
    });

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

    // Projects Split-Stage Dossier Selection & Actions (Select / Auto-Drive / Warp / Inspect)
    this.el.phSelectBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectProjectHubItem(btn.dataset.phSelect);
      });
    });
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

    const applyFullMapFilter = () => {
      const tab = this.activeCountyTab || 'ALL';
      const q = (this.el.fmSearch ? this.el.fmSearch.value : '').trim().toLowerCase();
      let shown = 0;
      this.el.fmRows.forEach((row) => {
        const cty = row.dataset.fmCounty || '';
        const matchTab = tab === 'ALL'
          || (tab === 'MARIANA' ? (cty === 'Mariana County' || cty === 'Leonida Keys') : cty === tab);
        const matchQ = !q || (row.dataset.fmQ || '').includes(q);
        const vis = matchTab && matchQ;
        row.hidden = !vis;
        if (vis) shown++;
      });
      if (this.el.fmCount) this.el.fmCount.textContent = `${shown} Places`;
    };
    this.el.fmTabs.forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        this.activeCountyTab = tabBtn.dataset.fmTab || 'ALL';
        this.el.fmTabs.forEach((b) => b.classList.toggle('active', b === tabBtn));
        applyFullMapFilter();
      });
    });
    if (this.el.fmSearch) {
      this.el.fmSearch.addEventListener('input', applyFullMapFilter);
      this.el.fmSearch.addEventListener('keydown', (e) => e.stopPropagation());
    }

    this.el.fullMapCanvas.addEventListener('click', (e) => {
      if (!this._fullMapMeta) return;
      const rect = this.el.fullMapCanvas.getBoundingClientRect();
      const u = THREE.MathUtils.clamp((e.clientX - rect.left) / rect.width, 0.02, 0.98);
      const v = THREE.MathUtils.clamp((e.clientY - rect.top) / rect.height, 0.02, 0.98);
      const wx = THREE.MathUtils.clamp(LEONIDA_PROJ.minX + u * (LEONIDA_PROJ.maxX - LEONIDA_PROJ.minX), LEONIDA_PROJ.minX + 30, LEONIDA_PROJ.maxX - 30);
      const wz = THREE.MathUtils.clamp(LEONIDA_PROJ.minZ + v * (LEONIDA_PROJ.maxZ - LEONIDA_PROJ.minZ), LEONIDA_PROJ.minZ + 30, LEONIDA_PROJ.maxZ - 30);
      const zInfo = getLeonidaZone(wx, wz);
      this.customWaypoint = { x: wx, z: wz, label: zInfo.street || 'Custom GPS Pin' };
      this.started = true; this.el.startOv.hidden = true;
      this.closeFullMap();
      this.planAutopilotTo({
        id: 'custom',
        label: zInfo.street || 'Leonida Pin',
        zone: zInfo.zone || 'State of Leonida',
        x: wx,
        z: wz,
        yaw: 0
      });
      if (this.audio) this.audio.phoneChime();
    });

    if (this.el.phoneBtn) this.el.phoneBtn.addEventListener('click', () => this.togglePhone());
    if (this.el.phoneClose) this.el.phoneClose.addEventListener('click', () => this.togglePhone(false));
    if (this.el.phoneHome) this.el.phoneHome.addEventListener('click', () => this.renderPhoneScreen('home'));
    if (this.el.missionAbort) this.el.missionAbort.addEventListener('click', () => this.abortSideMission());
    if (this.el.gfxBtn) {
      this.el.gfxBtn.addEventListener('click', () => {
        const order = ['high', 'med', 'low'];
        const next = order[(order.indexOf(this.graphicsPreset) + 1) % order.length];
        this.applyGraphicsPreset(next, true);
      });
    }

    this.el.audioBtn.addEventListener('click', () => {
      const next = !this.audio.enabled;
      this.audio.setRadioInCar(this.isInCar());
      this.audio.setEnabled(next);
      this.el.audioBtn.textContent = next ? 'Audio: On' : 'Audio: Off';
      this.el.audioBtn.classList.toggle('on', next);
      this.audio.setRainLevel(WEATHER_PRESETS[this.weatherIdx].rain);
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
      } else if (!this.pointerLocked && this.phoneOpen && this.el.uiCursor) {
        this.el.uiCursor.classList.add('on');
      }
      if (this.el.lockTip && this.pointerLocked) {
        this.el.lockTip.classList.remove('on');
      }
      this.syncReticleVisibility();
    });

    // Look-Through Camera Pointer Lock + LMB Fire (On-Foot Weapons AND Car Drive-By Uzi!)
    window.addEventListener('pointerdown', () => {
      if (this.isOpen && this.audio) this.audio.resumeUnlockedAmbient();
    }, { passive: true });
    window.addEventListener('keydown', () => {
      if (this.isOpen && this.audio) this.audio.resumeUnlockedAmbient();
    }, { passive: true });
    this.el.mount.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') {
        this.dragging = true;
        this.lastPtrX = e.clientX; this.lastPtrY = e.clientY;
      } else if (e.button === 0 && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.activeShop && !this.tvOpen && !this.phoneOpen && this.sleepAnimTimer <= 0) {
        if (!this.pointerLocked) {
          this.requestPointerLockSafe();
        }
        if (!this.isDancing) {
          this.fireWeapon();
          this.fireHeld = true;
        }
      }
    });
    this.el.mount.addEventListener('contextmenu', (e) => {
      if (this.mode === 'foot' && !this.activeShop && !this.tvOpen && !this.isDancing) {
        e.preventDefault();
        this.triggerMeleeAttack('kick');
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.isOpen) return;
      if (this.weaponWheelOpen) {
        if (this.el.uiCursor && !this.pointerLocked) {
          this.el.uiCursor.style.transform = `translate3d(${(e.clientX - 3).toFixed(1)}px, ${(e.clientY - 2).toFixed(1)}px, 0)`;
          this.el.uiCursor.classList.add('on');
          this.el.uiCursor.classList.remove('hover-ui');
        }
        if (this.pointerLocked) {
          this.weaponWheelVecX = THREE.MathUtils.clamp(this.weaponWheelVecX + (e.movementX || 0) * 1.15, -140, 140);
          this.weaponWheelVecY = THREE.MathUtils.clamp(this.weaponWheelVecY + (e.movementY || 0) * 1.15, -140, 140);
          this.updateWeaponWheelFromVector(this.weaponWheelVecX, this.weaponWheelVecY);
        } else if (this.el.wwShell) {
          const rect = this.el.wwShell.getBoundingClientRect();
          const cx = rect.left + rect.width * 0.5;
          const cy = rect.top + rect.height * 0.5;
          this.updateWeaponWheelFromVector(e.clientX - cx, e.clientY - cy);
        }
        return;
      }
      if (e.pointerType === 'mouse') {
        // 1. Pointer-Locked 360° Free-Look (Uses raw hardware movementX/Y, zero UI cursor!)
        if (this.pointerLocked) {
          if (this.el.uiCursor) this.el.uiCursor.classList.remove('on');
          if (this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.activeShop && !this.tvOpen && !this.phoneOpen) {
            const dx = THREE.MathUtils.clamp(e.movementX || 0, -90, 90);
            const dy = THREE.MathUtils.clamp(e.movementY || 0, -90, 90);
            if (dx !== 0 || dy !== 0) this.applyHoverLook(dx, dy);
          }
          return;
        }

        // 2. Unlocked Mode: Custom Vice Neon UI Pointer for HUD/Modals & Look-Through Hover-Look on 3D Canvas
        this.lastClientX = e.clientX;
        this.lastClientY = e.clientY;
        const uiCursor = this.el.uiCursor;
        const playing = this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.activeShop && !this.tvOpen && !this.phoneOpen && this.sleepAnimTimer <= 0;
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
      if (!this.isOpen || !this.started || !this.el.modal.hidden || this.fullMapOpen || this.projectsHubOpen) return;
      if (this.weaponWheelOpen) {
        const dir = e.deltaY > 0 ? 1 : -1;
        this.setWeaponWheelHover((this.weaponWheelHover + dir + WEAPONS.length) % WEAPONS.length, true);
        return;
      }
      if (this.mode !== 'foot') return;
      const idx = WEAPONS.findIndex((w) => w.id === this.weapon);
      const next = (idx + (e.deltaY > 0 ? 1 : -1) + WEAPONS.length) % WEAPONS.length;
      this.setWeapon(WEAPONS[next].id);
    }, { passive: true });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      // Classic GTA Vice City Real-Time Cheat Code Listener (type any code like PANZER, ASPIRINE, LEAVEMEALONE, COMEFLYWITHME, SEAWAYS!)
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        this.handleCheatKey(e.key.toUpperCase());
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.phoneOpen) this.togglePhone(false);
        else if (this.weaponWheelOpen) this.closeWeaponWheel(false);
        else if (this.activeShop) this.closeShopMenu(false);
        else if (this.tvOpen) this.closeTvModal();
        else if (this.isDancing) this.stopDancing();
        else if (this.taxiModalOpen) this.closeTaxiModal();
        else if (this.activeDialogue) this.closeNpcDialogue();
        else if (this.miniGameHubOpen) this.closeMiniGameHub();
        else if (this.projectsHubOpen) this.closeProjectsHub();
        else if (this.fullMapOpen) this.closeFullMap();
        else if (!this.el.modal.hidden) this.el.modal.hidden = true;
        else this.close();
        return;
      }
      if (e.key === 'i' || e.key === 'I') {
        if (!this.activeShop && !this.tvOpen && !this.fullMapOpen && !this.projectsHubOpen && this.el.modal.hidden) {
          e.preventDefault();
          this.togglePhone();
          return;
        }
      }
      if (this.phoneOpen) return;
      if (this.activeShop) return;
      if (this.tvOpen) {
        if (e.key >= '1' && e.key <= '4') { e.preventDefault(); this.setTvChannel(Number(e.key) - 1); }
        return;
      }
      if (this.sleepAnimTimer > 0) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!e.repeat && !this.weaponWheelOpen) this.openWeaponWheel(true);
        return;
      }
      if (this.weaponWheelOpen && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        this.setWeaponWheelHover(Number(e.key) - 1, false);
        this.closeWeaponWheel(true);
        return;
      }
      if (this.taxiModalOpen) return;
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
      if (e.key === 'x' || e.key === 'X') {
        if (this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.activeDialogue) {
          e.preventDefault();
          this.openTaxiModal();
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
      if (this.projectsHubOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const allProjects = [...SHOWROOMS, CONTACT_SHOWROOM];
        const curIdx = Math.max(0, allProjects.findIndex((p) => p.id === this.projectsHubSelectedId));
        const nextIdx = (curIdx + (e.key === 'ArrowDown' ? 1 : -1) + allProjects.length) % allProjects.length;
        this.selectProjectHubItem(allProjects[nextIdx].id);
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
          if (this.activeSideMission && this.activeSideMission.kind === 'volleyball') {
            e.preventDefault();
            this.tryVolleyballStrike();
            return;
          }
          if (this.mode === 'car') {
            if (this.tryAcceptStreetRacerChallenge()) {
              e.preventDefault();
              return;
            }
            const nearDriveShop = this.findNearestShopZone();
            if (nearDriveShop) {
              e.preventDefault();
              this.openShopMenu(nearDriveShop.kind, nearDriveShop.label);
              return;
            }
          }
          if (this.mode === 'foot') {
            if (this.isDancing) {
              e.preventDefault();
              this.stopDancing();
              return;
            }
            if (Math.hypot(this.playerState.x - 24.8, this.playerState.z + 124) < 10.8 && !this.activeSideMission) {
              e.preventDefault();
              this.startBeachVolleyball();
              return;
            }
            const nearShop = this.findNearestShopZone();
            if (nearShop) {
              e.preventDefault();
              this.openShopMenu(nearShop.kind, nearShop.label);
              return;
            }
            const nearSafe = this.findNearestSafehouseStation();
            if (nearSafe) {
              e.preventDefault();
              this.interactSafehouseStation(nearSafe);
              return;
            }
            if (this.isInsideMalibuDanceZone()) {
              e.preventDefault();
              this.startDancing(0);
              return;
            }
            const nearVeh = this.findNearestVehicleTarget(6.2);
            if (nearVeh && ((nearVeh.vehicle && nearVeh.vehicle.isTaxi) || (nearVeh.mesh && nearVeh.mesh.userData && nearVeh.mesh.userData.carType === 'taxi'))) {
              e.preventDefault();
              this.openTaxiModal();
              return;
            }
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
      if (e.key === 'r' || e.key === 'R') {
        if (this.isInCar()) {
          e.preventDefault();
          if (e.shiftKey) this.toggleRadioPower();
          else this.cycleRadio(1);
        }
        return;
      }
      if (e.key === 'o' || e.key === 'O') {
        if (this.isInCar()) {
          e.preventDefault();
          this.toggleRadioPower();
          return;
        }
      }
      if (this.isInCar() && e.key >= '1' && e.key <= '5' && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen) {
        e.preventDefault();
        this.selectRadioStation(Number(e.key) - 1);
        return;
      }
      if (e.key === 't' || e.key === 'T') { e.preventDefault(); this.setTimeOfDay(this.timeIdx + 1); return; }
      if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); this.setWeather(this.weatherIdx + 1); return; }

      if (this.mode === 'foot') {
        if (this.isDancing && e.key >= '1' && e.key <= '3') {
          e.preventDefault();
          this.setDanceStyle(Number(e.key) - 1);
          return;
        }
        if (e.key >= '1' && e.key <= '7') {
          const w = WEAPONS[Number(e.key) - 1];
          if (w) this.setWeapon(w.id);
          return;
        }
        if (e.key === 'q' || e.key === 'Q') {
          e.preventDefault();
          if (this.weaponWheelOpen) this.closeWeaponWheel(true);
          else this.openWeaponWheel(false);
          return;
        }
        if (e.key === 'j' || e.key === 'J' || e.key === 'e' || e.key === 'E') {
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
      if (e.key === '`') { e.preventDefault(); this.el.dockToggle.click(); return; }
      if (e.key === 'v' || e.key === 'V') { this.cycleCamera(); return; }
      if (e.key === 'c' || e.key === 'C') { this.setPaint((this.paintIdx + 1) % PAINTS.length); return; }
      if (e.key === 'l' || e.key === 'L') { this.toggleLights(); return; }
      if (e.key === 'm' || e.key === 'M') { this.el.audioBtn.click(); return; }
      if (e.key === 'h' || e.key === 'H') {
        const mods = this.getActiveVehicleMods();
        const isFourWheelCar = this.mode === 'car' && !(this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.isBike);
        if (this.mode === 'car' && this.tryAcceptStreetRacerChallenge()) {
          this.audio.horn(mods.hornTune || 'classic');
          return;
        }
        if (isFourWheelCar && mods.hydraulics) {
          this.triggerHydraulicsBounce(Boolean(e.shiftKey));
          return;
        }
        this.audio.horn(mods.hornTune || 'classic');
        const act = this.mode === 'foot' ? this.playerState : this.carState;
        for (let i = 0; i < this.pedestrians.length; i++) {
          const p = this.pedestrians[i];
          if (p.state === 'walk' && Math.hypot(p.x - act.x, p.z - act.z) < 22) {
            p.state = 'panic'; p.stateTimer = 3.0;
          }
        }
        return;
      }
      if ((e.key === 'k' || e.key === 'K') && this.mode === 'car') {
        const mods = this.getActiveVehicleMods();
        this.audio.horn(mods.hornTune || 'classic');
        if (this.tryAcceptStreetRacerChallenge()) return;
        const act = this.carState;
        for (let i = 0; i < this.pedestrians.length; i++) {
          const p = this.pedestrians[i];
          if (p.state === 'walk' && Math.hypot(p.x - act.x, p.z - act.z) < 22) {
            p.state = 'panic'; p.stateTimer = 3.0;
          }
        }
        return;
      }

      const k = (e.key || '').toLowerCase();
      const code = e.code || '';
      let drivingKey = false;
      if (k === 'w' || code === 'KeyW' || e.key === 'ArrowUp' || code === 'ArrowUp') { this.keys.up = true; drivingKey = true; }
      if (k === 's' || code === 'KeyS' || e.key === 'ArrowDown' || code === 'ArrowDown') { this.keys.down = true; drivingKey = true; }
      if (k === 'a' || code === 'KeyA' || e.key === 'ArrowLeft' || code === 'ArrowLeft') { this.keys.left = true; drivingKey = true; }
      if (k === 'd' || code === 'KeyD' || e.key === 'ArrowRight' || code === 'ArrowRight') { this.keys.right = true; drivingKey = true; }
      if (e.key === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight') { this.keys.nitro = true; drivingKey = true; }
      if (e.key === ' ' || code === 'Space') {
        e.preventDefault();
        if (this.activeSideMission && this.activeSideMission.kind === 'volleyball' && this.mode === 'foot') {
          this.tryVolleyballStrike();
          return;
        }
        this.keys.drift = true;
        drivingKey = true;
      }
      if (k === 'q' || code === 'KeyQ' || e.key === 'Control') { this.keys.dive = true; }
      if (drivingKey) {
        if (e.key && e.key.startsWith('Arrow')) e.preventDefault();
        if (this.isDancing) this.stopDancing();
        this.cancelAutopilot();
        if (!this.started) {
          this.started = true;
          this.el.startOv.hidden = true;
          this.syncReticleVisibility();
          this.flashLockTip();
        }
      }
    }, true);

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Tab' && this.weaponWheelOpen && this.weaponWheelHoldMode) {
        e.preventDefault();
        this.closeWeaponWheel(true);
        return;
      }
      const k = (e.key || '').toLowerCase();
      const code = e.code || '';
      if (k === 'w' || code === 'KeyW' || e.key === 'ArrowUp' || code === 'ArrowUp') this.keys.up = false;
      if (k === 's' || code === 'KeyS' || e.key === 'ArrowDown' || code === 'ArrowDown') this.keys.down = false;
      if (k === 'a' || code === 'KeyA' || e.key === 'ArrowLeft' || code === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || code === 'KeyD' || e.key === 'ArrowRight' || code === 'ArrowRight') this.keys.right = false;
      if (e.key === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight') this.keys.nitro = false;
      if (e.key === ' ' || code === 'Space') this.keys.drift = false;
      if (k === 'q' || code === 'KeyQ' || e.key === 'Control') this.keys.dive = false;
      if (k === 'j' || k === 'e' || k === 'x') this.fireHeld = false;
    }, true);

    window.addEventListener('blur', () => {
      this.keys.up = false;
      this.keys.down = false;
      this.keys.left = false;
      this.keys.right = false;
      this.keys.nitro = false;
      this.keys.drift = false;
      this.keys.dive = false;
      this.fireHeld = false;
    });

    window.addEventListener('resize', () => this.onResize());
  }

  setPaint(idx) {
    this.paintIdx = idx % PAINTS.length;
    this.car.applyPaint(this.paintIdx);
    this.el.paintBtns.forEach((b, i) => b.classList.toggle('active', i === this.paintIdx));
    this.savePersistentSave();
  }

  cycleCamera() {
    this.camIdx = (this.camIdx + 1) % CAM_MODES.length;
    this.el.camBtn.textContent = `Cam: ${CAM_MODES[this.camIdx]}`;
    this.orbitYawOffset = 0; this.orbitPitchOffset = 0;
  }

  toggleLights() {
    this.lightsOn = !this.lightsOn;
    this.el.lightsBtn.classList.toggle('on', this.lightsOn);
    if (this.el.lampLights) this.el.lampLights.classList.toggle('on-lights', this.lightsOn);
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
    if (!this.projectsHubSelectedId) this.projectsHubSelectedId = SHOWROOMS[0].id;
    this.selectProjectHubItem(this.projectsHubSelectedId);
    this.updateProjectsHub();
  }

  closeProjectsHub() {
    this.projectsHubOpen = false;
    this.el.projHubOv.hidden = true;
    this.syncReticleVisibility();
  }

  selectProjectHubItem(id) {
    const allProjects = [...SHOWROOMS, CONTACT_SHOWROOM];
    const sr = allProjects.find((s) => s.id === id) || SHOWROOMS[0];
    this.projectsHubSelectedId = sr.id;

    this.el.phSelectBtns.forEach((btn) => {
      const isAct = btn.dataset.phSelect === sr.id;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });

    const act = this.mode === 'foot' ? this.playerState : this.carState;
    const distM = Math.round(Math.hypot(sr.parkX - act.x, sr.parkZ - act.z));
    const isVisited = this.visited.has(sr.id);

    if (this.el.phStage) this.el.phStage.style.setProperty('--stage-col', sr.accentHex);
    if (this.el.phHeroImg) {
      this.el.phHeroImg.src = sr.img;
      this.el.phHeroImg.alt = sr.title;
    }
    if (this.el.phHeroBadge) {
      this.el.phHeroBadge.textContent = sr.id === 'contact'
        ? 'CREATOR PROFILE'
        : (isVisited ? `EXPLORED · PROJECT ${sr.num}` : `PROJECT ${sr.num}`);
      this.el.phHeroBadge.classList.toggle('visited', isVisited);
    }
    if (this.el.phHeroDist) this.el.phHeroDist.textContent = `${distM}m AWAY`;
    if (this.el.phHeroDistrict) this.el.phHeroDistrict.textContent = sr.district;
    if (this.el.phHeroTitle) this.el.phHeroTitle.textContent = sr.title;
    if (this.el.phHeroStat) this.el.phHeroStat.textContent = sr.stat;
    if (this.el.phHeroDesc) this.el.phHeroDesc.textContent = sr.desc;
    if (this.el.phHeroOpen) {
      this.el.phHeroOpen.href = sr.url;
      this.el.phHeroOpen.textContent = sr.id === 'contact' ? 'Send Email ↗' : 'Open Case Study ↗';
    }
    this.el.phTpBtns.forEach((btn) => {
      btn.dataset.phTp = sr.id;
      btn.textContent = sr.id === 'contact' ? 'Warp to Promenade' : 'Warp to Showroom';
    });
    this.el.phDriveBtns.forEach((btn) => {
      btn.dataset.phDrive = sr.id;
    });
  }

  updateProjectsHub() {
    const act = this.mode === 'foot' ? this.playerState : this.carState;
    const allProjects = [...SHOWROOMS, CONTACT_SHOWROOM];
    const visitedCount = SHOWROOMS.filter((s) => this.visited.has(s.id)).length;
    if (this.el.phProgressText) this.el.phProgressText.textContent = `${visitedCount} / ${SHOWROOMS.length}`;
    if (this.el.phProgressFill) this.el.phProgressFill.style.width = `${Math.round((visitedCount / SHOWROOMS.length) * 100)}%`;

    this.el.phDists.forEach((el) => {
      const sr = allProjects.find((s) => s.id === el.dataset.phDist);
      if (sr) el.textContent = `${Math.round(Math.hypot(sr.parkX - act.x, sr.parkZ - act.z))}m`;
    });
    this.el.phBadges.forEach((el) => {
      const id = el.dataset.phBadge;
      const sr = allProjects.find((s) => s.id === id);
      if (!sr) return;
      const seen = this.visited.has(id);
      if (id === 'contact') {
        el.textContent = 'DIRECT';
        el.classList.remove('seen');
      } else {
        el.textContent = seen ? 'EXPLORED' : 'UNSEEN';
        el.classList.toggle('seen', seen);
      }
    });
    const activeSr = allProjects.find((s) => s.id === this.projectsHubSelectedId);
    if (activeSr && this.el.phHeroDist) {
      const distM = Math.round(Math.hypot(activeSr.parkX - act.x, activeSr.parkZ - act.z));
      this.el.phHeroDist.textContent = `${distM}m AWAY`;
    }
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
      if (dist > 540) {
        btn.style.transform = 'translate3d(-9999px, -9999px, 0)';
        continue;
      }
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
    if (w <= 900 && this.isOpen) {
      this.close();
      return;
    }
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
    this.started = true;
    this.snapCameraNext = true;
    // Clear any stale UI overlays or held keys so the car responds immediately with zero mouse click required
    this.fullMapOpen = false;
    this.projectsHubOpen = false;
    this.miniGameHubOpen = false;
    this.taxiModalOpen = false;
    this.phoneOpen = false;
    this.weaponWheelOpen = false;
    this.activeDialogue = null;
    this.activeShop = null;
    this.tvOpen = false;
    this.sleepAnimTimer = 0;
    this.wastedTimer = 0;
    this.isDancing = false;
    this.fireHeld = false;
    this.keys = { up: false, down: false, left: false, right: false, nitro: false, drift: false, dive: false };
    if (this.el && this.el.modal) this.el.modal.hidden = true;
    if (this.el && this.el.startOv) this.el.startOv.hidden = true;

    document.body.classList.add('vice-game-open');
    try { if (typeof window.__stopMainWebsiteRadio === 'function') window.__stopMainWebsiteRadio(); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('vice:game-open')); } catch (_) {}
    this.el.stage.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Focus the 3D game stage immediately so WASD / Arrow keys drive the car right away without clicking the screen
    const grabFocus = () => {
      try {
        if (document.activeElement && document.activeElement !== this.el.stage && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        if (typeof window.focus === 'function') window.focus();
        if (this.el && this.el.stage && typeof this.el.stage.focus === 'function') {
          this.el.stage.focus({ preventScroll: true });
        }
      } catch (_) {}
    };
    grabFocus();
    requestAnimationFrame(grabFocus);

    // Always start the game with our character seated inside the car
    const isSeatedInCar = this.mode === 'car' && !(this.activeVehicle && this.activeVehicle.rig && this.activeVehicle.rig.isBike);
    if (!isSeatedInCar) {
      if (this.mode === 'ride') this.exitPierRide();
      if (this.mode === 'plane') this.activePlane = null;
      if (this.mode === 'boat') this.activeBoat = null;
      this.activeVehicle = this.heroVehicle;
      this.mode = 'car';
      this.playerState.x = this.carState.x;
      this.playerState.y = this.carState.y;
      this.playerState.z = this.carState.z;
    }
    this.setMode('car');
    try {
      this.audio.setRadioInCar(true);
      this.audio.radioPower = true;
      if (!this.audio.enabled) {
        this.audio.setEnabled(true);
        this.el.audioBtn.textContent = 'Audio: On';
        this.el.audioBtn.classList.add('on');
        this.audio.setRainLevel(WEATHER_PRESETS[this.weatherIdx].rain);
      } else {
        this.audio.resumeUnlockedAmbient();
      }
      const rjClip = this.audio.playSpecialIntroRJ();
      if (rjClip && this.el && this.el.combo) {
        this.el.combo.innerHTML = `${rjClip.short} · ${rjClip.host.toUpperCase()} <span>CAR RADIO</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 4.2;
      }
      this.updateRadioHUD();
    } catch (_) {}
    this.syncReticleVisibility();
    this.onResize();
    this.clock.getDelta();
    this.startLoop();
  }

  close() {
    if (!this.isOpen) return;
    this.closeWeaponWheel(false);
    this.closeShopMenu(false);
    this.closeTvModal();
    this.stopDancing();
    this.sleepAnimTimer = 0;
    if (this.el && this.el.sleepOv) this.el.sleepOv.classList.remove('on');
    this.isOpen = false;
    this.releasePointerLock();
    if (this.el.uiCursor) this.el.uiCursor.classList.remove('on');
    document.body.classList.remove('vice-game-open');
    this.el.stage.classList.remove('open');
    this.el.modal.hidden = true;
    document.body.style.overflow = '';
    if (typeof this.audio.stopPlaneSequence === 'function') this.audio.stopPlaneSequence();
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
    // Smart Dynamic CubeCamera reflection update: only refresh on startup or after driving >48m (eliminates 6-face stutter!)
    const wantsCube = this.cubeCamera && this.graphicsPreset !== 'low' && (
      this.frameCount === 0 || (
        this.mode === 'car' && this.activeVehicle && this.activeVehicle.isHero &&
        this.frameCount - this.lastCubeFrame >= 72 &&
        Math.hypot(this.carState.x - this.lastCubeX, this.carState.z - this.lastCubeZ) > 48
      )
    );
    if (wantsCube) {
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
    if (this.activeMiniGame) return null;
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
    if (this.el.carPrompt) this.el.carPrompt.classList.remove('on');
    if (this.el.footHud) this.el.footHud.classList.remove('on');
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
    if (this.mode === 'foot' && this.el.footHud) this.el.footHud.classList.add('on');
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
    let ex = r.exitX, ez = r.exitZ;
    if (r.ropewayKey) {
      const rw = r.ropewayKey === 'mountVice' ? this.mountViceRopeway : (this.leonidaWorld && this.leonidaWorld.kalagaRopeway);
      if (rw) {
        const dBase = Math.hypot(this.playerState.x - rw.baseBoardPos.x, this.playerState.z - rw.baseBoardPos.z);
        const dTop = Math.hypot(this.playerState.x - rw.summitBoardPos.x, this.playerState.z - rw.summitBoardPos.z);
        const dst = dTop < dBase ? rw.summitBoardPos : rw.baseBoardPos;
        ex = dst.x; ez = dst.z;
      }
    }
    const ey = Math.max(0.16, this.getSurfaceY(ex, ez, true) + 0.16);
    this.playerState.x = ex;
    this.playerState.z = ez;
    this.playerState.y = ey;
    this.playerState.vy = 0;
    this.playerState.grounded = true;
    this.player.root.position.set(ex, ey, ez);
    this.player.root.rotation.set(0, -Math.PI / 2, 0);
    this.snapCameraNext = true;
    if (this.el && this.el.combo) this.el.combo.classList.remove('on');
    this.streakTimer = 0;
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

    if (id === 'pizza') { this.startPizzaBoyJob(); return; }
    if (id === 'jetski') { this.startJetSkiTimeTrial(); return; }
    if (id === 'volleyball') { this.startBeachVolleyball(); return; }

    if (id === 'range') {
      // 1. VICE CARNIVAL PIER SHOOTING GALLERY (30s Neon Floating Ocean Bullseyes — ZERO Buildings Blocking!)
      this.setMode('foot');
      this.setWeapon('rifle');
      this.playerState.x = 91.5;
      this.playerState.z = -444.0;
      this.playerState.y = 0.16;
      this.playerState.vy = 0;
      this.playerState.grounded = true;
      this.playerState.yaw = 0; // Facing North straight out over open Atlantic Ocean!
      this.orbitYawOffset = 0;
      this.orbitPitchOffset = -0.02;
      this.player.root.position.set(91.5, 0.16, -444.0);
      this.player.root.rotation.y = 0;
      if (this.el && this.el.carPrompt) this.el.carPrompt.classList.remove('on');

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
      this.el.combo.innerHTML = `HILLCLIMB RACE GO! <span>CLIMB TO 118M SUMMIT</span>`;
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

  /* ==========================================================================
     KAUFMAN CABS TAXI SERVICE, COMPLETE VICE CITY CHEAT CODES,
     VCPD POLICE PURSUIT AI, WILDLIFE ANIMALS & MALIBU CLUB DISCO ENGINE
     ========================================================================== */
  openTaxiModal() {
    if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (_) {} }
    this.closeNpcDialogue();
    this.closeMiniGameHub();
    if (this.fullMapOpen) this.closeFullMap();
    this.taxiModalOpen = true;
    if (this.el.taxiOv) this.el.taxiOv.hidden = false;
    this.syncReticleVisibility();
  }

  closeTaxiModal() {
    this.taxiModalOpen = false;
    if (this.el.taxiOv) this.el.taxiOv.hidden = true;
    this.syncReticleVisibility();
  }

  takeTaxiRide(destId, fare = 25) {
    const TAXI_SPOTS = {
      'malibu-club': { x: -13.0, z: -344.0, label: 'The Malibu Club' },
      'north-mall':  { x: -13.0, z: -1018.0, label: 'North Point Mall' },
      'pier':        { x:  12.0, z: -430.0, label: 'Vice Carnival Pier' },
      'airport':     { x: -16.0, z:   86.0, label: "Escobar Int'l Airport" },
      'village':     { x: -382.0, z: -1178.0, label: 'Vice Hollow Community' },
      'forest':      { x: -418.0, z: -1036.0, label: 'Vice Pines Forest' },
      'mount-vice':  { x: -222.0, z: -1434.0, label: 'Mount Vice Summit (118m)' },
      'sierra-west': { x: -764.0, z: -206.0, label: 'Sierra West Peaks (96m)' },
      'ammunation':  { x: -12.5, z: -190.0, label: 'Ammu-Nation Ocean Dr' },
      'start':       { x: -12.5, z:  -48.0, label: 'Ocean Drive Beachfront' }
    };
    const spot = TAXI_SPOTS[destId] || TAXI_SPOTS.start;
    this.closeTaxiModal();
    this.cancelAutopilot();
    if (this.mode === 'ride') this.exitPierRide();
    if (this.mode === 'plane' && this.activePlane) {
      this.activePlane.resetTimer = 0.2;
      this.activePlane = null;
    }
    const charged = this.cash >= fare ? fare : 0;
    if (charged > 0) {
      this.cash -= charged;
      if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
    }
    this.setMode('foot');
    const gy = getTerrainHeight(spot.x, spot.z) + 0.08;
    this.playerState.x = spot.x;
    this.playerState.z = spot.z;
    this.playerState.y = gy;
    this.playerState.vy = 0;
    this.playerState.grounded = true;
    this.player.root.position.set(spot.x, gy, spot.z);
    this.orbitYawOffset = 0;
    this.orbitPitchOffset = 0.04;
    this.snapCameraNext = true;
    this.started = true;
    if (this.el.startOv) this.el.startOv.hidden = true;
    this.audio.horn();
    this.audio.carDoor();
    this.el.combo.innerHTML = `KAUFMAN CABS ARRIVED · ${spot.label.toUpperCase()} <span>${charged > 0 ? `-$${charged}` : 'VIP FREE'}</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.2;
    this.drawRadar();
  }

  showCheatToast(label) {
    if (this.el.cheatMsg) this.el.cheatMsg.textContent = label;
    if (this.el.cheatToast) this.el.cheatToast.classList.add('on');
    this.cheatToastTimer = 3.4;
    this.audio.cheatChime();
  }

  handleCheatKey(letter) {
    if (!letter || letter.length !== 1) return;
    this.cheatBuffer = (this.cheatBuffer + letter.toUpperCase()).slice(-34);
    for (let i = 0; i < VICE_CHEAT_CODES.length; i++) {
      const entry = VICE_CHEAT_CODES[i];
      if (this.cheatBuffer.endsWith(entry.code)) {
        this.cheatBuffer = '';
        this.activateCheatCode(entry.code);
        return;
      }
    }
  }

  spawnCheatVehicle(action) {
    const act = this.mode === 'foot' ? this.playerState : this.carState;
    const yaw = act.yaw || 0;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const sx = THREE.MathUtils.clamp(act.x + fx * 6.4, -482, 185);
    const sz = THREE.MathUtils.clamp(act.z + fz * 6.4, -1462, 344);
    const sy = getTerrainHeight(sx, sz) + 0.08;

    let entry = null;
    if (action === 'spawn_tank') {
      const rig = createRhinoTank();
      rig.root.position.set(sx, sy, sz);
      rig.root.rotation.y = yaw + Math.PI * 0.5;
      this.scene.add(rig.root);
      entry = {
        isHero: false, isTank: true, label: 'RHINO TANK',
        mesh: rig.root, rig, topSpeed: 34, nitroSpeed: 44, accel: 16, grip: 1.05,
        x: sx, y: sy, z: sz, yaw: yaw + Math.PI * 0.5
      };
    } else if (action === 'spawn_pcj' || action === 'spawn_sanchez' || action === 'spawn_faggio') {
      const kind = action === 'spawn_sanchez' ? 'sanchez' : (action === 'spawn_faggio' ? 'faggio' : 'pcj600');
      const col = kind === 'sanchez' ? 0x34e89e : (kind === 'faggio' ? 0x21e6d1 : 0xff2e88);
      const rig = createMotorcycle(kind, col);
      rig.root.position.set(sx, sy, sz);
      rig.root.rotation.y = yaw;
      this.scene.add(rig.root);
      entry = {
        isHero: false, isBike: true, label: rig.label,
        mesh: rig.root, rig, topSpeed: rig.topSpeed, nitroSpeed: rig.topSpeed * 1.32,
        accel: rig.accel, grip: rig.grip, x: sx, y: sy, z: sz, yaw
      };
    } else {
      const specs = {
        spawn_sabre:    { col: 0xff3b2f, kind: 'muscle', label: 'SABRE TURBO', top: 56, acc: 26 },
        spawn_hotring:  { col: 0x21e6d1, kind: 'convertible', label: 'HOTRING RACER', top: 64, acc: 30 },
        spawn_infernus: { col: 0xffd36b, kind: 'convertible', label: 'INFERNUS GT', top: 68, acc: 32 },
        spawn_hearse:   { col: 0x1b1d26, kind: 'sedan', label: 'ROMERO HEARSE', top: 38, acc: 16 },
        spawn_limo:     { col: 0x20182a, kind: 'sedan', label: 'LOVE FIST LIMO', top: 44, acc: 18 },
        spawn_caddy:    { col: 0xf4f6fa, kind: 'convertible', label: 'CADDY GOLF CART', top: 26, acc: 15 },
        spawn_banger:   { col: 0xff7a1a, kind: 'muscle', label: 'BLOODRING BANGER', top: 52, acc: 24 },
        spawn_trash:    { col: 0x2f6b48, kind: 'suv', label: 'TRASHMASTER', top: 32, acc: 14 }
      };
      const sp = specs[action] || specs.spawn_sabre;
      const mesh = createTrafficCar(sp.col, sp.kind);
      if (action === 'spawn_limo') mesh.scale.set(1.0, 1.0, 1.38);
      if (action === 'spawn_caddy') mesh.scale.set(0.76, 0.82, 0.72);
      if (action === 'spawn_trash') mesh.scale.set(1.22, 1.28, 1.35);
      mesh.position.set(sx, sy, sz);
      mesh.rotation.y = yaw;
      this.scene.add(mesh);
      const rig = mesh.userData.carRig || { root: mesh, bodyGroup: mesh, wheelSpinGroups: [], frontSteerGroups: [] };
      entry = {
        isHero: false, label: sp.label, mesh, rig,
        topSpeed: sp.top, nitroSpeed: sp.top * 1.28, accel: sp.acc, grip: 0.96,
        x: sx, y: sy, z: sz, yaw
      };
    }

    if (entry) {
      this.parkedVehicles.push(entry);
      for (let k = 0; k < 12; k++) {
        this.spawnParticle(
          sx + (Math.random() - 0.5) * 2.4, sy + 0.6, sz + (Math.random() - 0.5) * 2.4,
          (Math.random() - 0.5) * 4.5, 2.2 + Math.random() * 2.4, (Math.random() - 0.5) * 4.5,
          0xffd36b, 0.65, 0.65, 0.6, 8.2
        );
      }
      this.drawRadar();
    }
    return entry;
  }

  activateCheatCode(rawCode) {
    const code = String(rawCode || '').trim().toUpperCase();
    const entry = VICE_CHEAT_CODES.find((c) => c.code === code);
    if (!entry) return false;
    const act = entry.action;

    if (act === 'health') {
      this.playerHp = 100;
      this.updateHealthHUD();
    } else if (act === 'hesoyam') {
      this.playerHp = 100;
      this.playerArmor = 100;
      this.cash += 250000;
      this.updateHealthHUD();
      if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
    } else if (act === 'armor') {
      this.playerArmor = 100;
      this.updateHealthHUD();
    } else if (act === 'clearwanted') {
      this.wantedStars = 0;
      this.wantedDecay = 0;
      this.updateWantedHUD(0);
      this.clearPoliceUnits();
    } else if (act === 'raisewanted') {
      this.wantedStars = Math.min(5, this.wantedStars + 2);
      this.wantedDecay = 22.0;
      this.updateWantedHUD(0);
      this.ensurePoliceDispatch(true);
    } else if (act === 'wasted') {
      this.triggerWasted();
    } else if (act === 'thugstools') {
      this.setWeapon('bat');
    } else if (act === 'protools') {
      this.playerArmor = 100;
      this.updateHealthHUD();
      this.setWeapon('rifle');
    } else if (act === 'nuttertools') {
      this.playerArmor = 100;
      this.updateHealthHUD();
      this.setWeapon('bazooka');
    } else if (act.startsWith('spawn_')) {
      this.spawnCheatVehicle(act);
    } else if (act === 'flyingcars') {
      this.cheats.flyingCars = !this.cheats.flyingCars;
    } else if (act === 'seaways') {
      this.cheats.seaways = !this.cheats.seaways;
    } else if (act === 'bigbang') {
      const ref = this.mode === 'foot' ? this.playerState : this.carState;
      for (let i = 0; i < this.traffic.length; i++) {
        const tc = this.traffic[i];
        if (tc.userData.vehState !== 'wrecked' && Math.hypot(tc.position.x - ref.x, tc.position.z - ref.z) < 92) {
          this.detonateVehicle(tc, 'BIG BANG');
        }
      }
      for (let i = this.policeUnits.length - 1; i >= 0; i--) {
        const pu = this.policeUnits[i];
        if (Math.hypot(pu.x - ref.x, pu.z - ref.z) < 92) {
          this.triggerExplosion(pu.x, pu.y + 0.9, pu.z, 1.25);
          this.scene.remove(pu.rig.root);
          this.policeUnits.splice(i, 1);
        }
      }
    } else if (act === 'greenlight') {
      this.cheats.greenLight = !this.cheats.greenLight;
    } else if (act === 'grip') {
      this.cheats.grip = !this.cheats.grip;
    } else if (act === 'pinkcars' || act === 'blackcars') {
      const hex = act === 'pinkcars' ? 0xff4db8 : 0x181920;
      for (let i = 0; i < this.traffic.length; i++) {
        const rig = this.traffic[i].userData && this.traffic[i].userData.carRig;
        if (rig && rig.paintMat) rig.paintMat.color.setHex(hex);
      }
    } else if (act === 'fasttraffic') {
      this.cheats.fastTraffic = !this.cheats.fastTraffic;
    } else if (act === 'slowmo') {
      this.cheats.slowMo = !this.cheats.slowMo;
      if (this.cheats.slowMo) this.cheats.fastMo = false;
    } else if (act === 'fastmo') {
      this.cheats.fastMo = !this.cheats.fastMo;
      if (this.cheats.fastMo) this.cheats.slowMo = false;
    } else if (act === 'fastclock') {
      this.cheats.fastClock = !this.cheats.fastClock;
    } else if (act === 'riot' || act === 'hostilepeds' || act === 'armedpeds') {
      if (act === 'riot') this.cheats.riot = !this.cheats.riot;
      if (act === 'hostilepeds') this.cheats.hostilePeds = !this.cheats.hostilePeds;
      if (act === 'armedpeds') this.cheats.armedPeds = !this.cheats.armedPeds;
      const ref = this.mode === 'foot' ? this.playerState : this.carState;
      for (let i = 0; i < this.pedestrians.length; i++) {
        const p = this.pedestrians[i];
        if (Math.hypot(p.x - ref.x, p.z - ref.z) < 42 && p.state === 'walk') {
          p.fighter = true;
          p.state = 'fight';
          p.stateTimer = 24.0;
          p.attackCooldown = 0.6 + Math.random() * 0.8;
        }
      }
    } else if (act === 'fannymagnet') {
      this.cheats.fannyMagnet = !this.cheats.fannyMagnet;
    } else if (act === 'weather_sunset' || act === 'weather_noon' || act === 'weather_night') {
      const targetT = act === 'weather_noon' ? 1 : (act === 'weather_night' ? 2 : 0);
      this.setTimeOfDay(targetT, true);
      this.setWeather(0, true);
      this.cheats.heavyFog = false;
    } else if (act === 'weather_rain') {
      this.setWeather(3, true);
    } else if (act === 'weather_fog') {
      this.cheats.heavyFog = !this.cheats.heavyFog;
    }

    this.showCheatToast(entry.label);
    return true;
  }

  clearPoliceUnits() {
    for (let i = 0; i < this.policeUnits.length; i++) {
      this.scene.remove(this.policeUnits[i].rig.root);
    }
    this.policeUnits.length = 0;
    for (let i = 0; i < this.policeCops.length; i++) {
      this.scene.remove(this.policeCops[i].root);
    }
    this.policeCops.length = 0;
  }

  ensurePoliceDispatch(force = false) {
    if (this.wantedStars <= 0 && !force) return;
    const targetCount = Math.min(3, Math.max(force ? 1 : 0, this.wantedStars));
    const act = this.mode === 'plane' && this.activePlane
      ? this.activePlane
      : (this.mode === 'foot' || this.mode === 'ride' ? this.playerState : this.carState);

    while (this.policeUnits.length < targetCount) {
      const idx = this.policeUnits.length;
      const ang = (act.yaw || 0) + (idx === 0 ? 0.35 : (idx === 1 ? -0.45 : Math.PI));
      const dist = 34 + idx * 14;
      const px = THREE.MathUtils.clamp(act.x - Math.sin(ang) * dist, -478, 16);
      const pz = THREE.MathUtils.clamp(act.z - Math.cos(ang) * dist, -1440, 338);
      const py = getTerrainHeight(px, pz) + 0.04;
      const rig = createPoliceCruiser(4);
      const yaw = Math.atan2(-(act.x - px), -(act.z - pz));
      rig.root.position.set(px, py, pz);
      rig.root.rotation.y = yaw;
      this.scene.add(rig.root);
      this.policeUnits.push({
        rig, x: px, y: py, z: pz, yaw, speed: 14,
        wheelSpin: 0, ramCooldown: 0, copDeployed: false
      });
    }
  }

  updatePolice(dt, elapsed) {
    if (this.wantedStars <= 0) {
      if (this.policeUnits.length > 0 || this.policeCops.length > 0) this.clearPoliceUnits();
      return;
    }

    this.policeDispatchTimer -= dt;
    if (this.policeDispatchTimer <= 0) {
      this.policeDispatchTimer = 2.8;
      this.ensurePoliceDispatch(false);
    }

    // Periodic VCPD wailing siren while chased
    this.policeSirenTimer -= dt;
    if (this.policeSirenTimer <= 0 && this.policeUnits.length > 0) {
      this.policeSirenTimer = 2.4;
      this.audio.policeSiren();
    }

    const isFoot = this.mode === 'foot';
    const act = this.mode === 'plane' && this.activePlane
      ? this.activePlane
      : (isFoot || this.mode === 'ride' ? this.playerState : this.carState);

    const flashPhase = Math.floor(elapsed * 8.5) % 2;

    for (let i = 0; i < this.policeUnits.length; i++) {
      const pu = this.policeUnits[i];
      if (pu.ramCooldown > 0) pu.ramCooldown = Math.max(0, pu.ramCooldown - dt);

      // Alternating VCPD Red/Blue Roof Lightbar Strobe
      if (pu.rig.redLightMat && pu.rig.blueLightMat) {
        const redOn = (flashPhase + i) % 2 === 0;
        pu.rig.redLightMat.emissiveIntensity = redOn ? 3.2 : 0.22;
        pu.rig.blueLightMat.emissiveIntensity = redOn ? 0.22 : 3.2;
      }

      const dx = act.x - pu.x, dz = act.z - pu.z;
      const dist = Math.hypot(dx, dz) || 0.01;
      const desiredYaw = Math.atan2(-dx, -dz);
      let dYaw = desiredYaw - pu.yaw;
      while (dYaw > Math.PI) dYaw -= Math.PI * 2;
      while (dYaw < -Math.PI) dYaw += Math.PI * 2;
      pu.yaw += THREE.MathUtils.clamp(dYaw, -2.4 * dt, 2.4 * dt);

      const stopDist = isFoot ? 11.5 : 5.2;
      const maxPursuit = 20 + this.wantedStars * 4.5;
      const targetSpd = dist > stopDist ? maxPursuit : (dist > stopDist - 3 ? 4.5 : 0);
      pu.speed = THREE.MathUtils.damp(pu.speed, targetSpd, 4.2, dt);

      const nextX = THREE.MathUtils.clamp(pu.x - Math.sin(pu.yaw) * pu.speed * dt, -486, 175);
      const nextZ = THREE.MathUtils.clamp(pu.z - Math.cos(pu.yaw) * pu.speed * dt, -1455, 348);
      if (!this.isPointBlocked(nextX, nextZ, 1.35)) {
        pu.x = nextX;
        pu.z = nextZ;
      } else {
        pu.yaw += 1.4 * dt;
        pu.speed *= 0.45;
      }
      pu.y = getTerrainHeight(pu.x, pu.z) + 0.04;
      pu.rig.root.position.set(pu.x, pu.y, pu.z);
      pu.rig.root.rotation.y = pu.yaw;

      pu.wheelSpin -= pu.speed * dt * 2.6;
      if (pu.rig.wheelSpinGroups) {
        for (let w = 0; w < pu.rig.wheelSpinGroups.length; w++) pu.rig.wheelSpinGroups[w].rotation.x = pu.wheelSpin;
      }

      // Ram player car if cruiser closes in during car chase
      if (!isFoot && this.mode === 'car' && dist < 3.6 && pu.ramCooldown <= 0) {
        pu.ramCooldown = 1.6;
        this.carState.x += (dx / dist) * 1.1;
        this.carState.z += (dz / dist) * 1.1;
        this.camShake = Math.max(this.camShake, 0.24);
        this.audio.impact(0.65);
        this.damagePlayer(5);
      }

      // Deploy VCPD officer on foot if player is on foot & cruiser pulls up!
      if (isFoot && dist < 16.0 && !pu.copDeployed && this.policeCops.length < 3 && this._pedSharedGeos && this._pedMats) {
        pu.copDeployed = true;
        const cx = pu.x + Math.cos(pu.yaw) * 2.2;
        const cz = pu.z - Math.sin(pu.yaw) * 2.2;
        const cy = getTerrainHeight(cx, cz);
        const copRig = createPedestrian({
          x: cx, y: cy, z: cz, dir: 0, jog: false, axis: 'z', minPos: cz - 50, maxPos: cz + 50,
          bikini: false, speed: 4.5, phase: 0, scale: 1.02,
          skin: 0xd9a17a, shirt: 0x2d4a7c, pants: 0x1b2434, hair: 0x1a1a22, shoe: 0x12141a, blazer: false, shades: true
        }, this._pedSharedGeos, this._pedSplatMat, this._pedStarMat, this._pedMats);
        copRig.root.position.set(cx, cy, cz);
        this.scene.add(copRig.root);
        this.policeCops.push({
          ...copRig, x: cx, y: cy, z: cz, yaw: pu.yaw,
          walkPhase: 0, attackCd: 0.7, name: 'VCPD Officer'
        });
      }

      // Relocate cruiser closer if player drove way ahead (>155m), ensuring it never spawns inside a building!
      if (dist > 155) {
        const reAng = (act.yaw || 0) + (i === 0 ? 0.3 : -0.35);
        const candX = THREE.MathUtils.clamp(act.x - Math.sin(reAng) * 58, -478, 16);
        const candZ = THREE.MathUtils.clamp(act.z - Math.cos(reAng) * 58, -1440, 338);
        if (!this.isPointBlocked(candX, candZ, 2.2)) {
          pu.x = candX;
          pu.z = candZ;
          pu.y = getTerrainHeight(pu.x, pu.z) + 0.04;
        } else {
          // Snap to nearest open avenue centerline so VCPD cruisers always materialize on asphalt
          const nearAve = Math.round(candX / 96) * 96;
          const safeZ = (nearAve > -305 && nearAve < -8 && candZ > 10) ? -24 : candZ;
          if (!this.isPointBlocked(nearAve + 3.6, safeZ, 2.0)) {
            pu.x = nearAve + 3.6;
            pu.z = safeZ;
            pu.y = getTerrainHeight(pu.x, pu.z) + 0.04;
          }
        }
      }
    }

    // Update deployed VCPD officers pursuing on foot
    for (let i = this.policeCops.length - 1; i >= 0; i--) {
      const cop = this.policeCops[i];
      if (cop.attackCd > 0) cop.attackCd = Math.max(0, cop.attackCd - dt);
      const dx = act.x - cop.x, dz = act.z - cop.z;
      const d = Math.hypot(dx, dz) || 0.01;
      if (d > 70) {
        this.scene.remove(cop.root);
        this.policeCops.splice(i, 1);
        continue;
      }
      cop.yaw = Math.atan2(dx, dz);
      cop.root.rotation.y = cop.yaw;
      if (d > 2.0) {
        const spd = 4.5;
        const nx = THREE.MathUtils.clamp(cop.x + (dx / d) * spd * dt, -488, 185);
        const nz = THREE.MathUtils.clamp(cop.z + (dz / d) * spd * dt, -1462, 348);
        if (!this.isPointBlocked(nx, nz, 0.55)) {
          cop.x = nx;
          cop.z = nz;
        }
        cop.y = getTerrainHeight(cop.x, cop.z);
        cop.walkPhase += dt * spd * 2.2;
        const sw = Math.sin(cop.walkPhase);
        if (cop.legL) cop.legL.rotation.x = -sw * 0.55;
        if (cop.legR) cop.legR.rotation.x = sw * 0.55;
        if (cop.armL) cop.armL.rotation.x = sw * 0.48;
        if (cop.armR) cop.armR.rotation.x = -sw * 0.48;
      } else if (isFoot && cop.attackCd <= 0 && this.wastedTimer <= 0) {
        cop.attackCd = 1.25;
        this.damagePlayer(8, cop);
      }
      cop.root.position.set(cop.x, cop.y, cop.z);
    }
  }

  updateWildlife(dt, elapsed) {
    if (!this.wildlife || this.wildlife.length === 0) return;
    const act = this.mode === 'foot' || this.mode === 'ride' ? this.playerState : this.carState;
    for (let i = 0; i < this.wildlife.length; i++) {
      const w = this.wildlife[i];
      const dx = w.x - act.x, dz = w.z - act.z;
      const dSq = dx * dx + dz * dz;
      const vis = dSq < 21000;
      if (w.root.visible !== vis) w.root.visible = vis;
      if (!vis) continue;

      const dist = Math.sqrt(dSq) || 0.1;
      let targetYaw = w.yaw;
      let targetSpd = 0;

      if (dist < 11.5 && w.kind !== 'dog') {
        // Deer, Boars & Flamingos flee gracefully away from approaching player/vehicles
        w.state = 'flee';
        w.stateTimer = 2.6;
        targetYaw = Math.atan2(-dx, -dz);
        targetSpd = w.fleeSpeed;
      } else if (w.state === 'flee') {
        w.stateTimer -= dt;
        targetSpd = w.fleeSpeed * 0.78;
        if (w.stateTimer <= 0) { w.state = 'wander'; w.stateTimer = 3.0; }
      } else {
        w.stateTimer -= dt;
        if (w.stateTimer <= 0) {
          if (w.state === 'graze') {
            w.state = 'wander';
            w.stateTimer = 2.8 + Math.random() * 4.2;
            const toHomeX = w.homeX - w.x, toHomeZ = w.homeZ - w.z;
            if (Math.hypot(toHomeX, toHomeZ) > 18) {
              w.wanderYaw = Math.atan2(-toHomeX, -toHomeZ) + (Math.random() - 0.5) * 0.7;
            } else {
              w.wanderYaw = Math.random() * Math.PI * 2;
            }
          } else {
            w.state = 'graze';
            w.stateTimer = 1.8 + Math.random() * 3.0;
          }
        }
        if (w.state === 'wander') {
          targetYaw = w.wanderYaw !== undefined ? w.wanderYaw : w.yaw;
          targetSpd = w.baseSpeed;
        }
      }

      let dY = targetYaw - w.yaw;
      while (dY > Math.PI) dY -= Math.PI * 2;
      while (dY < -Math.PI) dY += Math.PI * 2;
      w.yaw += dY * Math.min(1, dt * 5.2);
      w.speed = THREE.MathUtils.damp(w.speed, targetSpd, 6.0, dt);

      if (w.speed > 0.08) {
        w.x = THREE.MathUtils.clamp(w.x - Math.sin(w.yaw) * w.speed * dt, -484, 34);
        w.z = THREE.MathUtils.clamp(w.z - Math.cos(w.yaw) * w.speed * dt, -1450, 340);
        w.y = getTerrainHeight(w.x, w.z);
        w.walkPhase += dt * w.speed * (w.kind === 'flamingo' ? 4.2 : 3.1);
        const sw = Math.sin(w.walkPhase) * (w.state === 'flee' ? 0.68 : 0.42);
        for (let li = 0; li < w.legs.length; li++) {
          w.legs[li].rotation.x = (li % 2 === 0 ? sw : -sw);
        }
        w.bodyGrp.position.y = Math.abs(Math.cos(w.walkPhase)) * (w.state === 'flee' ? 0.12 : 0.04);
      } else {
        for (let li = 0; li < w.legs.length; li++) {
          w.legs[li].rotation.x = THREE.MathUtils.damp(w.legs[li].rotation.x, 0, 8, dt);
        }
        w.bodyGrp.position.y = 0;
      }

      if (w.headGrp) {
        w.headGrp.rotation.x = w.state === 'graze'
          ? 0.34 + Math.sin(elapsed * 2.4 + i) * 0.08
          : Math.sin(elapsed * 2.2 + i) * 0.06;
      }
      if (w.tailMesh) {
        w.tailMesh.rotation.z = Math.sin(elapsed * (w.kind === 'dog' ? 11.5 : 4.2) + i) * (w.kind === 'dog' ? 0.45 : 0.14);
      }
      w.root.position.set(w.x, w.y, w.z);
      w.root.rotation.y = w.yaw;
    }
  }

  updateMalibuClub(dt, elapsed) {
    const act = this.mode === 'foot' ? this.playerState : this.carState;
    // 1. Standalone The Malibu Club Disco Floor, Mirror Ball, Spotlight Cones & 5-Piece Stage Band
    if (this.malibuExtras && Math.hypot(act.x + 30.0, act.z + 344) < 105) {
      const m = this.malibuExtras;
      if (m.discoPivot) m.discoPivot.rotation.y += dt * 1.18;
      const beat = Math.floor(elapsed * 2.15);
      if (m.tiles) {
        for (let i = 0; i < m.tiles.length; i++) {
          const t = m.tiles[i];
          const colIdx = (t.baseIdx + beat) % m.palette.length;
          t.mesh.material.color.setHex(m.palette[colIdx]);
          t.mesh.material.opacity = 0.50 + 0.36 * (0.5 + 0.5 * Math.sin(elapsed * 5.4 + t.phase));
        }
      }
      if (m.danceSpotRing) {
        const s = 1.0 + Math.sin(elapsed * 4.4) * 0.09;
        m.danceSpotRing.scale.set(s, s, 1);
      }
      if (m.dancers) {
        for (let i = 0; i < m.dancers.length; i++) {
          const d = m.dancers[i];
          const b = Math.sin(elapsed * 6.8 + d.phase);
          const b2 = Math.cos(elapsed * 3.4 + d.phase);
          const style = d.style || 0;
          d.group.position.y = d.baseY + Math.abs(b) * (d.isDJ ? 0.05 : 0.14);
          if (d.isDJ) {
            d.group.rotation.y = (d.baseYaw || 0) + Math.sin(elapsed * 2.1 + d.phase) * 0.18;
            d.armL.rotation.set(-0.78 + b * 0.25, 0, 0.26);
            d.armR.rotation.set(-0.78 - b * 0.25, 0, -0.26);
          } else {
            d.group.rotation.y = (d.baseYaw || 0) + Math.sin(elapsed * 1.9 + d.phase) * 0.55;
            if (d.upper) {
              d.upper.rotation.z = b2 * 0.14;
              d.upper.rotation.y = b * 0.22;
            }
            if (d.head) {
              d.head.rotation.x = Math.sin(elapsed * 6.8 + d.phase) * 0.14;
              d.head.rotation.y = -b2 * 0.18;
            }
            if (style === 0) {
              // Classic 80s Disco Point
              d.armR.rotation.set(1.55 + b * 0.72, 0, -0.45 - b * 0.35);
              d.armL.rotation.set(0.35 - b * 0.35, 0, 0.52);
            } else if (style === 1) {
              // Hands-Up Rave Wave
              d.armL.rotation.set(2.35 + b * 0.28, 0, 0.42 + b2 * 0.22);
              d.armR.rotation.set(2.35 - b * 0.28, 0, -0.42 + b2 * 0.22);
            } else if (style === 2) {
              // Two-Step Groove Pump
              d.armL.rotation.set(0.95 + b * 0.65, 0, 0.36);
              d.armR.rotation.set(0.95 - b * 0.65, 0, -0.36);
            } else {
              // Side-to-Side Club Shimmy
              d.armL.rotation.set(1.15, 0, 0.85 + b * 0.48);
              d.armR.rotation.set(1.15, 0, -0.85 - b * 0.48);
            }
            if (d.legL) d.legL.rotation.x = b * 0.36;
            if (d.legR) d.legR.rotation.x = -b * 0.36;
          }
        }
      }
    }
    // 1b. Spinning Helical Barber Poles, Shop Floor Rings & Ocean View Safehouse Animations
    if (this.barberPoles && this.barberPoles.length) {
      for (let i = 0; i < this.barberPoles.length; i++) {
        this.barberPoles[i].rotation.y += dt * 2.8;
      }
    }
    if (this.shopInteractZones) {
      for (let i = 0; i < this.shopInteractZones.length; i++) {
        const rg = this.shopInteractZones[i].ring;
        if (rg) {
          const s = 1.0 + Math.sin(elapsed * 3.8 + i) * 0.08;
          rg.scale.set(s, s, 1);
        }
      }
    }
    if (this.oceanViewSafehouse) {
      if (this.oceanViewSafehouse.tvScreenMat) {
        const flick = 0.72 + Math.sin(elapsed * 9.0) * 0.14 + Math.cos(elapsed * 21.0) * 0.06;
        this.oceanViewSafehouse.tvScreenMat.emissiveIntensity = flick;
      }
      if (this.oceanViewSafehouse.stationRings) {
        for (let i = 0; i < this.oceanViewSafehouse.stationRings.length; i++) {
          const sr = this.oceanViewSafehouse.stationRings[i];
          const s = 1.0 + Math.sin(elapsed * 3.6 + i * 1.1) * 0.08;
          sr.scale.set(s, s, 1);
        }
      }
    }
    if (this.tvOpen) {
      this.drawRetroTvScreen(elapsed);
    }
    if (this.sleepAnimTimer > 0) {
      this.sleepAnimTimer = Math.max(0, this.sleepAnimTimer - dt);
      if (this.sleepAnimTimer <= 0) {
        if (this.el && this.el.sleepOv) this.el.sleepOv.classList.remove('on');
        this.syncReticleVisibility();
      }
    }
    // 2. Standalone Huge 2-Story North Point Mall Animations (Spinning Raffle Infernus, Fountain Spray & Shoppers!)
    if (this.northPointMall && Math.hypot(act.x + 50.0, act.z + 1018) < 130) {
      const nm = this.northPointMall;
      if (nm.raffleCar) nm.raffleCar.rotation.y += dt * 0.65;
      if (nm.fountainSpray) {
        const s = 0.92 + Math.sin(elapsed * 6.0) * 0.10;
        nm.fountainSpray.scale.set(s, 0.95 + Math.cos(elapsed * 7.5) * 0.08, s);
      }
      if (nm.shoppers) {
        for (let i = 0; i < nm.shoppers.length; i++) {
          const sp = nm.shoppers[i];
          const travel = Math.sin(elapsed * 0.42 + sp.phase) * sp.range * 0.5;
          if (sp.axis === 'x') {
            sp.group.position.x = sp.baseX + travel;
            sp.group.rotation.y = Math.cos(elapsed * 0.42 + sp.phase) >= 0 ? Math.PI / 2 : -Math.PI / 2;
          } else {
            sp.group.position.z = sp.baseZ + travel;
            sp.group.rotation.y = Math.cos(elapsed * 0.42 + sp.phase) >= 0 ? 0 : Math.PI;
          }
          sp.group.position.y = 0.16 + Math.abs(Math.sin(elapsed * 5.2 + sp.phase)) * 0.05;
        }
      }
    }
    // 3. Drifting 3D Alpine Mountain Mist & Cloud Layers on Mount Vice (118m) & Sierra West (96m)
    if (this.mountVice && this.mountVice.mistClouds) {
      this.mountVice.mistClouds.position.x = Math.sin(elapsed * 0.08) * 14.0;
    }
    if (this.sierraWest && this.sierraWest.mistClouds) {
      this.sierraWest.mistClouds.position.z = Math.cos(elapsed * 0.07) * 14.0;
    }
  }

  update(dt, elapsed) {
    // GTA 5 Weapon Wheel bullet-time slow-motion + Stunt Jump Slow-Mo + cheat speed modifiers
    if (this.stuntSlowMo > 0) {
      this.stuntSlowMo = Math.max(0, this.stuntSlowMo - dt);
      if (this.carState.airborne) dt *= 0.44;
      else this.stuntSlowMo = 0;
    }
    if (this.weaponWheelOpen) dt *= 0.22;
    if (this.cheats.slowMo) dt *= 0.52;
    else if (this.cheats.fastMo) dt *= 1.55;
    // Continuous Automatic Day/Night 24-Hour Clock (~2.5 minutes per full GTA day, accelerated by FASTCLOCK cheat!)
    if (this.autoDayNight) {
      const daySpeed = this.cheats.fastClock ? 1.15 : 0.16;
      this.dayTime = (this.dayTime + dt * daySpeed) % 24;
    }
    // Continuous Automatic Dynamic Weather Cycle (Clear -> Thick Mist -> Rain -> Thunderstorm -> Clearing!)
    if (this.autoWeather && this.started) {
      this.autoWeatherTimer -= dt;
      if (this.autoWeatherTimer <= 0) {
        const pool = [0, 1, 2, 3].filter((w) => w !== this.weatherIdx);
        const nextW = (this.weatherIdx >= 2 && Math.random() < 0.58)
          ? (Math.random() < 0.55 ? 0 : 1)
          : pool[Math.floor(Math.random() * pool.length)];
        this.weatherIdx = nextW;
        this.autoWeatherTimer = 42 + Math.random() * 20;
        const wpNow = WEATHER_PRESETS[this.weatherIdx];
        if (this.el.weatherBtn) {
          const lbl = this.el.weatherBtn.querySelector('[data-weather-lbl]');
          if (lbl) lbl.textContent = wpNow.label;
          else this.el.weatherBtn.textContent = `${wpNow.label} [Y]`;
          this.el.weatherBtn.classList.toggle('on', this.weatherIdx > 0);
        }
      }
    }
    if (this.cheatToastTimer > 0) {
      this.cheatToastTimer = Math.max(0, this.cheatToastTimer - dt);
      if (this.cheatToastTimer <= 0 && this.el.cheatToast) this.el.cheatToast.classList.remove('on');
    }

    const cs = this.carState;
    const ps = this.playerState;
    const isFoot = this.mode === 'foot';
    const isRide = this.mode === 'ride' && Boolean(this.activeRide);
    const isPlane = this.mode === 'plane' && Boolean(this.activePlane);
    const isBoat = this.mode === 'boat' && Boolean(this.activeBoat);
    const act = isPlane ? this.activePlane : (isBoat ? this.activeBoat : ((isFoot || isRide) ? ps : cs));

    this.updatePolice(dt, elapsed);
    this.updateWildlife(dt, elapsed);
    this.updateMalibuClub(dt, elapsed);
    this.updateBoats(dt, elapsed);
    this.updateSideMissions(dt, elapsed, act);
    this.updateDynamicEvents(dt, elapsed, act);
    this.updateSkyRings(dt, elapsed, act);
    if (this.ammuNation && this.ammuNation.rangeTargets) {
      for (let ri = 0; ri < this.ammuNation.rangeTargets.length; ri++) {
        const rt = this.ammuNation.rangeTargets[ri];
        rt.group.position.z = rt.baseZ + Math.sin(elapsed * 2.1 + rt.phase) * 1.15;
        if (rt.hitCooldown > 0) {
          rt.hitCooldown = Math.max(0, rt.hitCooldown - dt);
          if (rt.hitCooldown <= 0) rt.group.rotation.x = 0;
        }
      }
    }
    // Interior / Street footsteps while walking on foot
    if (isFoot && ps.grounded && ps.speed > 1.2 && !this.isDancing) {
      this._footstepAcc = (this._footstepAcc || 0) + dt * ps.speed * 0.48;
      if (this._footstepAcc >= 1.0) {
        this._footstepAcc = 0;
        const isIndoor = (ps.x >= -84 && ps.x <= -16 && ps.z >= -1046 && ps.z <= -990)
          || (ps.x >= -33 && ps.x <= -16 && ps.z >= -60 && ps.z <= -36)
          || (ps.x >= -79 && ps.x <= -57 && ps.z >= -272 && ps.z <= -92);
        if (this.audio && typeof this.audio.footstep === 'function') this.audio.footstep(isIndoor);
      }
    }
    if (this.barricadeBeacons && this.barricadeBeacons.length > 0) {
      const blinkOn = (elapsed % 1.1) < 0.52;
      for (let bi = 0; bi < this.barricadeBeacons.length; bi++) {
        this.barricadeBeacons[bi].visible = blinkOn;
      }
    }

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
    if (this.sierraWest && this.sierraWest.beacon) {
      this.sierraWest.beacon.visible = ((elapsed + 0.4) % 1.2) < 0.55;
    }
    for (let i = 0; i < this.pierRides.length; i++) {
      const pr = this.pierRides[i];
      if (pr.ring) pr.ring.scale.setScalar(1 + Math.sin(elapsed * 3.6 + pr.phase) * 0.08);
    }
    for (let i = 0; i < this.miniGamePads.length; i++) {
      const mp = this.miniGamePads[i];
      const showPad = !this.activeMiniGame;
      if (mp.ring) {
        mp.ring.visible = showPad;
        if (showPad) mp.ring.scale.setScalar(1 + Math.sin(elapsed * 3.2 + mp.phase) * 0.08);
      }
      if (mp.pillar) mp.pillar.visible = showPad;
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

    // 1. Continuous Automatic Day/Night Cycle, Smooth Weather Transitions, Thick Atmospheric Haze & Sky!
    const hNow = ((this.dayTime % 24) + 24) % 24;
    let stopA = DAY_CYCLE_STOPS[0], stopB = DAY_CYCLE_STOPS[1];
    for (let si = 0; si < DAY_CYCLE_STOPS.length - 1; si++) {
      if (hNow >= DAY_CYCLE_STOPS[si].hour && hNow <= DAY_CYCLE_STOPS[si + 1].hour) {
        stopA = DAY_CYCLE_STOPS[si];
        stopB = DAY_CYCLE_STOPS[si + 1];
        break;
      }
    }
    const spanH = Math.max(0.001, stopB.hour - stopA.hour);
    const rawT = THREE.MathUtils.clamp((hNow - stopA.hour) / spanH, 0, 1);
    const blendT = rawT * rawT * (3 - 2 * rawT); // Smoothstep solar transition
    const tpA = TIME_PRESETS[stopA.preset];
    const tpB = TIME_PRESETS[stopB.preset];

    // Keep phase index & top-bar [T] label synced smoothly with live solar clock
    const livePhase = (hNow >= 4.5 && hNow < 8.5) ? 3 : (hNow >= 8.5 && hNow < 16.2) ? 1 : (hNow >= 16.2 && hNow < 20.4) ? 0 : 2;
    if (livePhase !== this.timeIdx) {
      this.timeIdx = livePhase;
      const curTp = TIME_PRESETS[this.timeIdx];
      if (this.el.timeBtn) {
        const lbl = this.el.timeBtn.querySelector('[data-time-lbl]');
        if (lbl) lbl.textContent = curTp.label;
        else this.el.timeBtn.textContent = `${curTp.label} [T]`;
        this.el.timeBtn.classList.toggle('on', this.timeIdx === 2);
      }
    }

    const wp = WEATHER_PRESETS[this.weatherIdx];
    const wLerp = Math.min(1, dt * 0.55);
    this.curRainLevel = THREE.MathUtils.lerp(this.curRainLevel, wp.rain, wLerp);
    this.curFogMult = THREE.MathUtils.lerp(this.curFogMult, wp.fogMult, wLerp);
    this.curWeatherDark = THREE.MathUtils.lerp(this.curWeatherDark, wp.dark, wLerp);
    if (this.frameCount % 8 === 0 && this.audio) {
      this.audio.setRainLevel(this.curRainLevel);
    }
    if (this.rainLines) {
      this.rainLines.mesh.visible = this.curRainLevel > 0.04;
      if (this.rainLines.mesh.material) {
        this.rainLines.mesh.material.opacity = THREE.MathUtils.clamp(this.curRainLevel * 0.55, 0.05, 0.58);
      }
    }
    // Wet Road Reflections & Raindrop Lens Streaks!
    if (this.roadMaterials && this.frameCount % 4 === 0) {
      const wetRough = THREE.MathUtils.lerp(0.56, 0.22, this.curRainLevel);
      const wetEnv = THREE.MathUtils.lerp(0.96, 1.55, this.curRainLevel);
      for (let rm = 0; rm < this.roadMaterials.length; rm++) {
        this.roadMaterials[rm].roughness = wetRough;
        this.roadMaterials[rm].envMapIntensity = wetEnv;
      }
    }
    if (this.el && this.el.rainScreen) {
      const rainOp = this.curRainLevel > 0.14 ? (this.curRainLevel * 0.34).toFixed(2) : '0';
      if (this.el.rainScreen.style.opacity !== rainOp) this.el.rainScreen.style.opacity = rainOp;
    }

    const envLerp = Math.min(1, dt * 3.5);
    const targetNightMix = THREE.MathUtils.lerp(tpA.nightMix, tpB.nightMix, blendT);
    const targetSunInt = THREE.MathUtils.lerp(tpA.sunInt, tpB.sunInt, blendT);
    const targetHemiInt = THREE.MathUtils.lerp(tpA.hemiInt, tpB.hemiInt, blendT);
    const targetFillInt = THREE.MathUtils.lerp(tpA.fillInt, tpB.fillInt, blendT);
    const targetExposure = THREE.MathUtils.lerp(tpA.exposure, tpB.exposure, blendT);

    // Auto-switch car headlights at dusk/storm and off after sunrise!
    const wantAutoLights = targetNightMix > 0.45 || this.weatherIdx === 3;
    if (wantAutoLights !== this.lastAutoNightLights) {
      this.lastAutoNightLights = wantAutoLights;
      if (wantAutoLights && !this.lightsOn) this.toggleLights();
      else if (!wantAutoLights && this.lightsOn) this.toggleLights();
    }

    // Storm lightning flashes & rolling thunder (weatherIdx === 3: Storm!)
    if (this.weatherIdx === 3 && this.curRainLevel > 0.55) {
      this.lightningCooldown -= dt;
      if (this.lightningCooldown <= 0) {
        this.lightningFlash = 1.0;
        this.lightningCooldown = 4.2 + Math.random() * 5.8;
        this.audio.thunder();
      }
    }
    if (this.lightningFlash > 0) this.lightningFlash = Math.max(0, this.lightningFlash - dt * 4.5);

    _cycDirTmp.copy(tpA.sunDir).lerp(tpB.sunDir, blendT).normalize();
    this.envSunDir.lerp(_cycDirTmp, envLerp).normalize();
    const skyU = this.skyDome.material.uniforms;
    this.skyDome.position.copy(this.camera.position);
    skyU.uTime.value = elapsed;
    skyU.uSunDir.value.copy(this.envSunDir);
    skyU.uHorizon.value.lerp(_cycColA.setHex(tpA.horizon).lerp(_cycColB.setHex(tpB.horizon), blendT), envLerp);
    skyU.uLower.value.lerp(_cycColA.setHex(tpA.lower).lerp(_cycColB.setHex(tpB.lower), blendT), envLerp);
    skyU.uMid.value.lerp(_cycColA.setHex(tpA.mid).lerp(_cycColB.setHex(tpB.mid), blendT), envLerp);
    skyU.uZenith.value.lerp(_cycColA.setHex(tpA.zenith).lerp(_cycColB.setHex(tpB.zenith), blendT), envLerp);
    skyU.uSunGlow.value.lerp(_cycColA.setHex(tpA.sunGlow).lerp(_cycColB.setHex(tpB.sunGlow), blendT), envLerp);
    skyU.uNightMix.value = THREE.MathUtils.lerp(skyU.uNightMix.value, targetNightMix, envLerp);
    skyU.uRainDark.value = THREE.MathUtils.lerp(skyU.uRainDark.value, this.curWeatherDark, envLerp);
    skyU.uLightning.value = this.lightningFlash;

    const ocU = this.ocean.material.uniforms;
    ocU.uTime.value = elapsed;
    ocU.uSunDir.value.copy(this.envSunDir);
    ocU.uSkyTint.value.lerp(_cycColA.setHex(tpA.skyTint).lerp(_cycColB.setHex(tpB.skyTint), blendT), envLerp);
    ocU.uNightMix.value = skyU.uNightMix.value;

    const weatherLightDim = 1.0 - this.curWeatherDark * 0.42;
    this.sunLight.color.lerp(_cycColA.setHex(tpA.sunCol).lerp(_cycColB.setHex(tpB.sunCol), blendT), envLerp);
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, targetSunInt * weatherLightDim + this.lightningFlash * 2.2, envLerp * 2.5);
    if (this.hemiLight) {
      this.hemiLight.color.lerp(_cycColA.setHex(tpA.hemiSky).lerp(_cycColB.setHex(tpB.hemiSky), blendT), envLerp);
      this.hemiLight.groundColor.lerp(_cycColA.setHex(tpA.hemiGnd).lerp(_cycColB.setHex(tpB.hemiGnd), blendT), envLerp);
      this.hemiLight.intensity = THREE.MathUtils.lerp(this.hemiLight.intensity, targetHemiInt * weatherLightDim + this.lightningFlash * 0.9, envLerp * 2.0);
    }
    if (this.fillLight) {
      this.fillLight.intensity = THREE.MathUtils.lerp(this.fillLight.intensity, targetFillInt * weatherLightDim, envLerp);
    }

    // THICK CINEMATIC ATMOSPHERIC HAZE THROUGHOUT THE ENTIRE MAP (Vice City, Forests, Highways & Mountains!)
    let biomeFog = 0.0031;
    let hazeTintMix = 0.34;
    const inLegacyMtFog = isInLegacyMountains(act.x, act.z);
    const inCoreFog = isInCoreViceFootprint(act.x, act.z);
    if (inLegacyMtFog) {
      // Thick alpine mist & cloud bank fog ramping up Mount Vice (118m) & Sierra West (96m)!
      const altT = THREE.MathUtils.clamp((act.y - 10) / 100, 0, 1);
      const altCurve = altT * altT * (1.45 - 0.45 * altT);
      biomeFog = 0.0040 + altCurve * 0.0052;
      hazeTintMix = 0.42 + altCurve * 0.36;
    } else if (!inCoreFog && act.y > 22 && this.mode !== 'plane') {
      // Mount Kalaga National Park thick alpine valley & peak haze!
      const altT = THREE.MathUtils.clamp((act.y - 22) / 128, 0, 1);
      biomeFog = 0.0036 + altT * 0.0034;
      hazeTintMix = 0.40 + altT * 0.32;
    } else if (act.y > 22) {
      // High-altitude flight / hilltop atmospheric haze across Leonida
      const airT = THREE.MathUtils.clamp((act.y - 22) / 140, 0, 1);
      biomeFog = 0.0024 + airT * 0.0030;
      hazeTintMix = 0.32 + airT * 0.36;
    } else if (!inCoreFog) {
      // Thick subtropical coastal, forest & interstate haze across the Great State of Leonida!
      const inSwamp = Math.hypot(act.x + 1340, act.z - 640) < 280 || Math.hypot(act.x + 1120, act.z + 820) < 260;
      biomeFog = inSwamp ? 0.0046 : 0.0034;
      hazeTintMix = inSwamp ? 0.52 : 0.40;
    } else if (act.x < -285 || act.z < -970) {
      // Vice Pines Deep Forest & Vice Hollow Valley Mist
      biomeFog = 0.0042;
      hazeTintMix = 0.44;
    }
    // Outer State of Leonida Ocean Horizon Distance Fog
    const edgeDist = Math.min(
      Math.max(0, act.x - LEONIDA_PROJ.minX),
      Math.max(0, LEONIDA_PROJ.maxX - act.x),
      Math.max(0, act.z - LEONIDA_PROJ.minZ),
      Math.max(0, LEONIDA_PROJ.maxZ - act.z)
    );
    if (edgeDist < 180) {
      const edgeT = 1.0 - THREE.MathUtils.clamp(edgeDist / 180, 0, 1);
      biomeFog = Math.max(biomeFog, 0.0036 + edgeT * edgeT * 0.0048);
      hazeTintMix = Math.max(hazeTintMix, 0.42 + edgeT * 0.42);
    }
    let targetFogDensity = biomeFog * this.curFogMult;
    if (this.cheats.heavyFog) {
      targetFogDensity = Math.max(targetFogDensity, 0.0112);
      hazeTintMix = Math.max(hazeTintMix, 0.72);
    }
    _tmpCol.setHex(tpA.fog).lerp(_cycColB.setHex(tpB.fog), blendT);
    _tmpCol.lerp(_tmpCol2.setHex(0x232d3d), this.curWeatherDark * 0.62);
    if (hazeTintMix > 0.01) {
      const mistTintHex = targetNightMix > 0.55 ? 0x1d2742 : (this.timeIdx === 0 ? 0xdcb4a4 : 0xd0dce8);
      _tmpCol.lerp(_tmpCol2.setHex(mistTintHex), hazeTintMix * 0.62);
    }
    this.scene.fog.color.lerp(_tmpCol, envLerp);
    this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, targetFogDensity, envLerp);
    this.scene.background.copy(this.scene.fog.color);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, targetExposure, envLerp);

    // Update Drifting Volumetric-Style Low-Altitude Haze Cards around Player!
    if (this.worldHazeGroup) {
      this.worldHazeGroup.position.set(act.x, Math.max(0, act.y * 0.35), act.z);
      const hazeOp = THREE.MathUtils.clamp(0.15 * this.curFogMult + (this.cheats.heavyFog ? 0.16 : 0), 0.12, 0.34);
      for (let hi = 0; hi < this.worldHazeMats.length; hi++) {
        this.worldHazeMats[hi].color.copy(this.scene.fog.color);
        this.worldHazeMats[hi].opacity = hazeOp;
      }
      const kids = this.worldHazeGroup.children;
      for (let hi = 0; hi < kids.length; hi++) {
        const sp = kids[hi];
        const ud = sp.userData;
        const a = ud.baseAng + elapsed * 0.012;
        sp.position.x = Math.cos(a) * ud.dist;
        sp.position.z = Math.sin(a) * ud.dist;
        sp.position.y = ud.baseY + Math.sin(elapsed * 0.22 + ud.phase) * 3.5;
      }
    }

    // Animate Mount Vice Skyway Ropeway (bullwheels, gondolas, sway & night lamps!)
    if (this.mountViceRopeway) {
      this.mountViceRopeway.update(dt, elapsed, skyU.uNightMix.value);
    }

    // Modulate iconic GTA Vice City 2D light coronas (subtle golden shimmer at sunset, vibrant neon halo at night!)
    if (this.coronaMats) {
      const coronaOp = THREE.MathUtils.lerp(0.26, 0.76, skyU.uNightMix.value);
      for (let ci = 0; ci < this.coronaMats.length; ci++) {
        this.coronaMats[ci].opacity = THREE.MathUtils.lerp(this.coronaMats[ci].opacity, coronaOp, envLerp);
      }
    }

    // 3D Falling Rain Streaks (Single Draw Call anchored around active actor!)
    if (this.rainLines && this.rainLines.mesh.visible) {
      this.rainLines.mesh.position.set(act.x, Math.max(0, (act.y || 0) - 4), act.z);
      const pos = this.rainLines.positions;
      const spds = this.rainLines.speeds;
      const isStorm = this.weatherIdx === 3;
      const windX = isStorm ? -0.32 : -0.14;
      const fallMult = isStorm ? 1.38 : 1.0;
      for (let i = 0; i < this.rainLines.count; i++) {
        const idx = i * 6;
        let ry = pos[idx + 1] - spds[i] * fallMult * dt;
        if (ry < 0) ry += 28;
        pos[idx + 1] = ry;
        pos[idx + 3] = pos[idx] + windX;
        pos[idx + 4] = ry - (isStorm ? 1.45 : 1.05);
      }
      this.rainLines.mesh.geometry.attributes.position.needsUpdate = true;
    }

    // Cycling Traffic Lights (N-S & Opposing E-W Red -> Green -> Yellow, or ALL GREEN under GREENLIGHT cheat!)
    for (let i = 0; i < this.trafficSignals.length; i++) {
      const ts = this.trafficSignals[i];
      if (this.cheats.greenLight) {
        ts.lG.material = this.sigMats.grn;
        ts.lY.material = this.sigMats.off;
        ts.lR.material = this.sigMats.off;
        if (ts.lG2) {
          ts.lG2.material = this.sigMats.grn;
          ts.lY2.material = this.sigMats.off;
          ts.lR2.material = this.sigMats.off;
        }
      } else {
        const cyc = (elapsed + ts.phase) % 10.0;
        ts.lG.material = cyc < 4.5 ? this.sigMats.grn : this.sigMats.off;
        ts.lY.material = (cyc >= 4.5 && cyc < 5.6) ? this.sigMats.yel : this.sigMats.off;
        ts.lR.material = cyc >= 5.6 ? this.sigMats.red : this.sigMats.off;
        if (ts.lG2) {
          const cyc2 = (elapsed + ts.phase + 5.0) % 10.0;
          ts.lG2.material = cyc2 < 4.5 ? this.sigMats.grn : this.sigMats.off;
          ts.lY2.material = (cyc2 >= 4.5 && cyc2 < 5.6) ? this.sigMats.yel : this.sigMats.off;
          ts.lR2.material = cyc2 >= 5.6 ? this.sigMats.red : this.sigMats.off;
        }
      }
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
          } else if (ip.kind === 'mall') {
            this.playerHp = 100;
            this.playerArmor = 100;
            this.setWeapon('rifle');
            this.updateHealthHUD();
            this.cash += 250;
            this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.el.combo.innerHTML = `NORTH POINT MALL · FOOD COURT + AMMU-NATION 100% HP & ARMOR! <span>+$250</span>`;
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
    // Update Flyable Airplanes & VTOL Helicopters!
    if (this.flyablePlanes) {
      const canFly = isPlane && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.phoneOpen;
      for (let i = 0; i < this.flyablePlanes.length; i++) {
        const pl = this.flyablePlanes[i];
        if (isPlane && this.activePlane === pl) {
          if (pl.isHeli) {
            // True VTOL Helicopter Flight (Hover, Ascend [SPACE], Descend [Q/SHIFT], Forward/Back [W/S], Yaw [A/D])
            let thrustIn = 0, yawIn = 0, vertIn = 0;
            if (canFly && this.keys.up) thrustIn += 1;
            if (canFly && this.keys.down) thrustIn -= 0.72;
            if (canFly && this.keys.left) yawIn += 1;
            if (canFly && this.keys.right) yawIn -= 1;
            if (canFly && this.keys.drift) vertIn += 1;
            if (canFly && (this.keys.dive || this.keys.nitro)) vertIn -= 1;

            const hGroundY = Math.max(0.04, this.getSurfaceY(pl.x, pl.z, false));
            const airborneH = pl.y > hGroundY + 0.35;
            pl.throttle = THREE.MathUtils.damp(pl.throttle, airborneH || vertIn > 0 ? (0.62 + Math.max(0, vertIn) * 0.38) : 0.2, 3.5, dt);
            pl.yaw += yawIn * 1.55 * dt;
            const targetSpdH = airborneH ? thrustIn * pl.topSpeed : 0;
            pl.speed = THREE.MathUtils.damp(pl.speed, targetSpdH, 2.4, dt);
            pl.pitch = THREE.MathUtils.damp(pl.pitch, airborneH ? -thrustIn * 0.24 : 0, 5.2, dt);
            pl.roll = THREE.MathUtils.damp(pl.roll, airborneH ? yawIn * 0.34 : 0, 5.2, dt);

            const hFwdX = -Math.sin(pl.yaw), hFwdZ = -Math.cos(pl.yaw);
            pl.x += hFwdX * pl.speed * dt;
            pl.z += hFwdZ * pl.speed * dt;
            pl.y = THREE.MathUtils.clamp(pl.y + vertIn * 15.5 * dt, hGroundY, 260);
            if (pl.y <= hGroundY + 0.04) {
              pl.y = hGroundY;
              pl.speed = THREE.MathUtils.damp(pl.speed, 0, 6, dt);
            }
            if (this.audio && typeof this.audio.setHeliRotor === 'function') {
              this.audio.setHeliRotor(true, THREE.MathUtils.clamp(pl.throttle + Math.abs(pl.speed) / 80, 0.25, 1.0));
            }
          } else {
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

            let targetPitch = 0;
            if (canFly && this.keys.drift) targetPitch = 0.44;
            else if (canFly && this.keys.dive) targetPitch = -0.36;
            else if (airborn && canFly && this.keys.down) targetPitch = -0.22;
            else if (!airborn && pl.speed > pl.takeoffSpeed * 1.12 && canFly && this.keys.up) targetPitch = 0.14;
            pl.pitch = THREE.MathUtils.damp(pl.pitch, targetPitch, 4.2, dt);

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
            pl.y = THREE.MathUtils.clamp(pl.y + vy * dt, planeGroundY, 340);

            if (pl.y <= planeGroundY + 0.03) {
              pl.y = planeGroundY;
              pl.pitch = THREE.MathUtils.damp(pl.pitch, 0, 8, dt);
              pl.roll = THREE.MathUtils.damp(pl.roll, 0, 8, dt);
            }

            if (pl.x < LEONIDA_PROJ.minX - 120 || pl.x > LEONIDA_PROJ.maxX + 120 || pl.z < LEONIDA_PROJ.minZ - 120 || pl.z > LEONIDA_PROJ.maxZ + 120) {
              const toCenterYaw = Math.atan2(-(pl.x - (-1150)), -(pl.z - (-200)));
              let dy = toCenterYaw - pl.yaw;
              while (dy > Math.PI) dy -= Math.PI * 2;
              while (dy < -Math.PI) dy += Math.PI * 2;
              pl.yaw += Math.sign(dy) * Math.min(Math.abs(dy), dt * 1.4);
            }

            if (pl.speed > 32 && Math.random() < (boost ? 0.85 : 0.42)) {
              this.spawnParticle(
                pl.x - fwdX * 4.5 + (Math.random() - 0.5) * 1.6,
                pl.y + 1.4,
                pl.z - fwdZ * 4.5 + (Math.random() - 0.5) * 1.6,
                -fwdX * 3, 0.4, -fwdZ * 3,
                boost ? 0xff8a2a : 0xeef6ff, 0.65, 0.55, 1.8, 0
              );
            }
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
    } else if (!isFoot && !isPlane && !isRide && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.miniGameHubOpen && !this.taxiModalOpen && !this.activeDialogue && this.wastedTimer <= 0) {
      if (this.keys.up) accelInput += 1;
      if (this.keys.down) accelInput -= 1;
      if (this.keys.left) steerInput += 1;
      if (this.keys.right) steerInput -= 1;
      if (this.keys.nitro && cs.speed > 4) nitroActive = true;
      braking = (this.keys.down && cs.speed > 1.5) || this.keys.drift;
      drifting = this.keys.drift && Math.abs(cs.speed) > 12 && Math.abs(steerInput) > 0.1;
      // GRIPISEVERYTHING Car Hop on Space!
      if (this.cheats.grip && this.keys.drift && !cs.airborne && cs.y <= getTerrainHeight(cs.x, cs.z) + 0.35) {
        cs.airborne = true;
        cs.airTime = 0;
        cs.vy = 10.2;
        this.audio.jump();
      }
    }

    // Realistic 6-Speed Gearbox Torque Curve, Mountain Slope Gravity, Aerodynamic Drag & Weight Transfer Physics
    const veh = this.activeVehicle || this.heroVehicle;
    const activeMods = this.getActiveVehicleMods();
    const tStage = Math.max(0, Math.min(3, activeMods.turboStage || 0));
    const turboSpdMult = 1 + tStage * 0.12;
    const turboAccMult = 1 + tStage * 0.16;
    const maxSpeed = (nitroActive ? (veh.nitroSpeed || 74) : (veh.topSpeed || 54)) * turboSpdMult;
    const baseAccel = (nitroActive ? (veh.accel || 24) * 1.55 : (veh.accel || 24)) * turboAccMult;
    const spdFrac = THREE.MathUtils.clamp(Math.abs(cs.speed) / Math.max(1, maxSpeed), 0, 1);
    const torqueMult = 1.24 - spdFrac * 0.56; // Punchy 1st-2nd gear launch tapering realistically in 5th-6th!
    let targetPitch = 0;

    // Real-time mountain grade gravity along vehicle heading (strong low-end hill-climb torque for steep mountains!)
    const physFwdX = -Math.sin(cs.yaw), physFwdZ = -Math.cos(cs.yaw);
    const gradeH1 = this.getSurfaceY(cs.x + physFwdX * 1.9, cs.z + physFwdZ * 1.9, false);
    const gradeH0 = this.getSurfaceY(cs.x - physFwdX * 1.9, cs.z - physFwdZ * 1.9, false);
    const gradeSin = THREE.MathUtils.clamp((gradeH1 - gradeH0) / 3.8, -0.58, 0.58);

    if (accelInput > 0) {
      const aeroDrag = cs.speed * cs.speed * 0.0021;
      const netAccel = Math.max(11.5, accelInput * baseAccel * torqueMult * 1.22 - aeroDrag - Math.max(0, gradeSin) * 4.2);
      cs.speed = Math.min(maxSpeed, cs.speed + netAccel * dt);
      targetPitch = nitroActive ? 0.052 : (0.028 * torqueMult);
    } else if (accelInput < 0) {
      if (cs.speed > 0.8) { cs.speed = Math.max(0, cs.speed - 42 * dt); targetPitch = -0.052; }
      else { cs.speed = Math.max(-17, cs.speed + accelInput * 15 * dt); targetPitch = -0.024; }
    } else {
      const coastGravity = -gradeSin * 13.5 * dt;
      const rollDrag = Math.sign(cs.speed) * (1.8 + cs.speed * cs.speed * 0.0026) * dt;
      if (isFoot || isPlane || isRide) {
        cs.speed = THREE.MathUtils.damp(cs.speed, 0, 4.8, dt);
      } else {
        const nextSpd = cs.speed + coastGravity - rollDrag;
        cs.speed = (Math.abs(cs.speed) < 0.25 && Math.abs(gradeSin) < 0.04) ? 0 : nextSpd;
      }
    }
    if (!isFoot && !isPlane && !isRide && this.keys.drift && !this.cheats.grip && Math.abs(cs.speed) > 4) {
      cs.speed = THREE.MathUtils.damp(cs.speed, 0, 2.0, dt);
    }

    // Car Drive-By Uzi auto-fire cooldown
    if (!isFoot && !isPlane && !isRide) {
      if (this.fireCooldown > 0) this.fireCooldown = Math.max(0, this.fireCooldown - dt);
      if (this.fireHeld && this.fireCooldown <= 0 && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.taxiModalOpen && !this.activeDialogue && this.wastedTimer <= 0) {
        this.fireWeapon();
      }
    }

    // Progressive speed-sensitive steering (tight city turning, planted high-speed stability!)
    const steerLimit = THREE.MathUtils.lerp(0.50, 0.29, spdFrac);
    cs.steer = THREE.MathUtils.damp(cs.steer, steerInput * steerLimit, 11, dt);
    const speedFactor = THREE.MathUtils.clamp(Math.abs(cs.speed) / 11.5, 0, 1);
    const cheatGripBoost = this.cheats.grip ? 1.48 : 1.0;
    cs.yaw += cs.steer * speedFactor * (drifting ? 2.65 : 1.92) * (veh.grip || 1.0) * cheatGripBoost * (cs.speed >= -0.05 ? 1 : -1) * dt;
    cs.driftSlip = THREE.MathUtils.damp(cs.driftSlip, (drifting && !this.cheats.grip) ? steerInput * 0.28 : 0, 5.8, dt);

    // Continuous Substepped Vehicle Movement (max 0.55m per substep -> ZERO high-speed tunneling through buildings, trees, cars, or cliffs!)
    const moveYaw = cs.yaw - cs.driftSlip;
    const moveDx = -Math.sin(moveYaw) * cs.speed * dt;
    const moveDz = -Math.cos(moveYaw) * cs.speed * dt;
    const stepDist = Math.hypot(moveDx, moveDz);
    const subSteps = Math.max(1, Math.min(8, Math.ceil(stepDist / 0.55)));
    const invSub = 1 / subSteps;
    for (let ss = 0; ss < subSteps; ss++) {
      cs.x += moveDx * invSub;
      cs.z += moveDz * invSub;
      this.resolveWorldCollisions(ss < subSteps - 1);
    }

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
      } else if (r.ropewayKey) {
        const rw = r.ropewayKey === 'mountVice' ? this.mountViceRopeway : (this.leonidaWorld && this.leonidaWorld.kalagaRopeway);
        if (rw && rw.gondolas && rw.gondolas[0]) {
          seatObj = rw.gondolas[0].bodyGrp;
          seatOffY = -1.95;
        }
      }
      if (seatObj) {
        seatObj.getWorldPosition(_vecA);
        ps.x = _vecA.x;
        ps.y = _vecA.y + seatOffY;
        ps.z = _vecA.z;
        pMesh.root.position.set(ps.x, ps.y, ps.z);
        if (r.id === 'coaster') {
          pMesh.root.rotation.y = seatObj.rotation.y + Math.PI;
        } else if (r.ropewayKey) {
          pMesh.root.rotation.y = seatObj.parent ? seatObj.parent.rotation.y : 0;
        } else {
          pMesh.root.rotation.y = elapsed * 0.35;
        }
        // Seated thrill-ride posture (legs tucked, hands up on roller coaster!)
        const handsUp = r.id === 'coaster' ? 2.55 : (r.ropewayKey ? 0.35 : 0.65);
        pMesh.armL.rotation.set(handsUp, 0, 0.25);
        pMesh.armR.rotation.set(handsUp, 0, -0.25);
        pMesh.legL.rotation.x = 1.15;
        pMesh.legR.rotation.x = 1.15;
      }
    } else if (isFoot) {
      const canAct = this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.taxiModalOpen && !this.activeDialogue && !this.activeShop && !this.tvOpen && this.sleepAnimTimer <= 0 && !this.isDancing && this.wastedTimer <= 0;
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

      let moveSpeed = 0;
      let yawDeltaRate = 0;

      if (ps.parachuting) {
        // TRUE STEERABLE RAM-AIR PARAFOIL FLIGHT PHYSICS (W = Dive Faster, S = Flare/Brake, A/D = Bank & Turn!)
        ps.paraOpenT = Math.min(1.0, (ps.paraOpenT || 0) + dt * 1.95);
        const openEase = 1 - Math.pow(1 - ps.paraOpenT, 3);
        const turnInput = canAct ? moveStrafe : 0;
        const pitchInput = canAct ? moveFwd : 0; // +1 dive (W), -1 flare (S)

        ps.paraSteer = THREE.MathUtils.damp(ps.paraSteer || 0, turnInput, 7.5, dt);
        ps.paraFlare = THREE.MathUtils.damp(ps.paraFlare || 0, Math.max(0, -pitchInput), 8.0, dt);
        ps.paraRoll = THREE.MathUtils.damp(ps.paraRoll || 0, -turnInput * 0.40, 6.5, dt);
        ps.paraPitch = THREE.MathUtils.damp(ps.paraPitch || 0, pitchInput * 0.24, 6.5, dt);

        // Smooth heading turn + gentle auto-align camera behind glide heading when user isn't actively orbiting
        const yawStep = -turnInput * 1.72 * dt;
        ps.yaw += yawStep;
        if (Math.abs(turnInput) > 0.05 && (performance.now() - this.lastLookTime > 550)) {
          let dCam = ps.yaw - this.targetOrbitYaw;
          while (dCam > Math.PI) dCam -= Math.PI * 2;
          while (dCam < -Math.PI) dCam += Math.PI * 2;
          this.targetOrbitYaw += dCam * Math.min(1, dt * 2.6);
        }

        // Forward ram-air glide airspeed & controlled sink rate
        const targetAirSpd = pitchInput > 0 ? 20.5 : (pitchInput < 0 ? 5.2 : 13.4);
        const fx = -Math.sin(ps.yaw), fz = -Math.cos(ps.yaw);
        const targetVx = fx * targetAirSpd;
        const targetVz = fz * targetAirSpd;
        ps.vx = THREE.MathUtils.damp(ps.vx || 0, targetVx, 3.8, dt);
        ps.vz = THREE.MathUtils.damp(ps.vz || 0, targetVz, 3.8, dt);

        ps.x += ps.vx * dt;
        ps.z += ps.vz * dt;
        this.resolvePlayerCollisions();
        moveSpeed = Math.hypot(ps.vx, ps.vz);
        ps.speed = moveSpeed;
        ps.turnLean = ps.paraRoll * 0.55;
        ps.landSquash = 0;

        // Animate 7-cell parafoil inflation billow, bank roll, dive/flare pitch, wind sway & brake toggles!
        if (this.parachuteRig) {
          this.parachuteRig.root.visible = true;
          const billow = ps.paraOpenT < 1 ? (1 + Math.sin(ps.paraOpenT * Math.PI) * 0.14) : 1.0;
          const sx = THREE.MathUtils.lerp(0.14, 1.0, openEase) * billow;
          const sy = THREE.MathUtils.lerp(0.28, 1.0, openEase);
          const sz = THREE.MathUtils.lerp(0.18, 1.0, openEase) * billow;
          this.parachuteRig.canopy.scale.set(sx, sy, sz);
          this.parachuteRig.canopy.rotation.z = ps.paraRoll + Math.sin(elapsed * 2.1) * 0.035;
          this.parachuteRig.canopy.rotation.x = -ps.paraPitch + Math.cos(elapsed * 1.7) * 0.025;
          if (this.parachuteRig.toggleL && this.parachuteRig.toggleR) {
            const pullL = Math.max(0, -ps.paraSteer) * 0.20 + ps.paraFlare * 0.22;
            const pullR = Math.max(0,  ps.paraSteer) * 0.20 + ps.paraFlare * 0.22;
            this.parachuteRig.toggleL.position.y = 0.44 - pullL;
            this.parachuteRig.toggleR.position.y = 0.44 - pullR;
          }
        }
      } else {
        let hillFactor = 1.0;
        if (mLen > 0.05) {
          const dirX = mx / mLen, dirZ = mz / mLen;
          const hNow = this.getSurfaceY(ps.x, ps.z, true);
          const hNext = this.getSurfaceY(ps.x + dirX * 1.0, ps.z + dirZ * 1.0, true);
          const uphillSlope = Math.max(0, hNext - hNow);
          hillFactor = THREE.MathUtils.clamp(1.0 - uphillSlope * 0.24, 0.62, 1.0);
        }
        const targetMaxSpd = (ps.attackTimer > 0 ? 1.8 : (sprinting ? 8.6 : 4.5)) * hillFactor;

        // Smooth biomechanical acceleration & deceleration (zero robotic instant start/stop!)
        const targetVx = mLen > 0.05 ? (mx / mLen) * targetMaxSpd : 0;
        const targetVz = mLen > 0.05 ? (mz / mLen) * targetMaxSpd : 0;
        const velDamp = ps.grounded ? (mLen > 0.05 ? 11.5 : 14.5) : 3.2;
        ps.vx = THREE.MathUtils.damp(ps.vx || 0, targetVx, velDamp, dt);
        ps.vz = THREE.MathUtils.damp(ps.vz || 0, targetVz, velDamp, dt);

        const footStepDist = Math.hypot(ps.vx * dt, ps.vz * dt);
        const footSub = footStepDist > 0.28 ? 2 : 1;
        for (let fs = 0; fs < footSub; fs++) {
          ps.x += (ps.vx * dt) / footSub;
          ps.z += (ps.vz * dt) / footSub;
          this.resolvePlayerCollisions();
        }
        moveSpeed = Math.hypot(ps.vx, ps.vz);
        ps.speed = moveSpeed;

        if (moveSpeed > 0.25 && ps.attackTimer <= 0) {
          const targetYaw = Math.atan2(-ps.vx, -ps.vz);
          let dy = targetYaw - ps.yaw;
          while (dy > Math.PI) dy -= Math.PI * 2;
          while (dy < -Math.PI) dy += Math.PI * 2;
          const stepYaw = dy * Math.min(1, dt * 11.5);
          ps.yaw += stepYaw;
          yawDeltaRate = THREE.MathUtils.clamp(dy, -1.2, 1.2);
        }
        ps.turnLean = THREE.MathUtils.damp(ps.turnLean || 0, -yawDeltaRate * Math.min(1, moveSpeed / 6.5) * 0.16, 10, dt);
        ps.landSquash = THREE.MathUtils.damp(ps.landSquash || 0, 0, 12, dt);

        if (moveSpeed > 0.15) {
          const cadence = sprinting ? 1.56 : 1.88;
          ps.walkPhase += dt * moveSpeed * cadence;
        }
      }

      const onPierDeck = ps.x >= 17.5 && ps.x <= 141.5 && ps.z >= -448 && ps.z <= -412;
      const interiorY = this.getInteriorFloorY(ps.x, ps.z, ps.y);
      const footFloorY = interiorY !== null ? interiorY : (onPierDeck ? 0.16 : this.getSurfaceY(ps.x, ps.z, true));
      const altAboveGround = ps.y - footFloorY;

      if (canAct && this.keys.drift) {
        if (ps.grounded) {
          ps.vy = 7.4;
          ps.grounded = false;
          this.audio.jump();
        } else if (!ps.parachuting && altAboveGround > 6.5 && ps.vy < -2.2) {
          // Manual Mid-Air Parachute Deployment when jumping off Mount Vice cliffs, skyscrapers, or bridges!
          ps.parachuting = true;
          ps.paraOpenT = 0.04;
          ps.paraRoll = 0;
          ps.paraPitch = 0;
          ps.paraFlare = 0;
          ps.paraSteer = 0;
          ps.vy = Math.max(ps.vy * 0.45, -5.5);
          if (this.parachuteMesh) this.parachuteMesh.visible = true;
          this.el.combo.innerHTML = `RAM-AIR CHUTE DEPLOYED · W DIVE · S FLARE · A/D STEER <span>BASE JUMP</span>`;
          this.el.combo.classList.add('on');
          this.streakTimer = 3.4;
        }
      }

      if (ps.grounded) {
        if (ps.y > footFloorY && ps.y - footFloorY < 0.85) ps.y = footFloorY;
        else if (ps.y - footFloorY > 1.25) ps.grounded = false;
        else ps.y = footFloorY;
      }
      if (!ps.grounded || ps.y > footFloorY + 0.02) {
        if (ps.parachuting) {
          const pitchInput = canAct ? moveFwd : 0;
          const targetSink = pitchInput > 0 ? -9.2 : (pitchInput < 0 ? -2.2 : -4.8);
          ps.vy = THREE.MathUtils.damp(ps.vy, targetSink, 4.8, dt);
        } else {
          ps.vy = Math.max(-34.0, ps.vy - 21.0 * dt);
          // Show helpful Spacebar deploy prompt during high freefall!
          if (altAboveGround > 7.5 && ps.vy < -4.0 && this.streakTimer <= 0.1) {
            this.el.combo.innerHTML = `FREEFALL · PRESS [SPACE] TO DEPLOY PARACHUTE <span>${Math.round(altAboveGround)}M</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 0.5;
          }
        }
        ps.y += ps.vy * dt;
        if (ps.y <= footFloorY) {
          const wasParachuting = ps.parachuting;
          ps.y = footFloorY;
          ps.vy = 0;
          ps.grounded = true;
          ps.parachuting = false;
          ps.paraOpenT = 0;
          ps.paraRoll = 0;
          ps.paraPitch = 0;
          if (this.parachuteMesh) this.parachuteMesh.visible = false;
          ps.landSquash = wasParachuting ? 0.30 : 0.22;
          if (wasParachuting) {
            ps.vx *= 0.35;
            ps.vz *= 0.35;
            this.el.combo.innerHTML = `TOUCHDOWN · SMOOTH LANDING! <span>SAFE</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 2.0;
          }
        }
      }

      if (canAct && !this.pointerLocked && Math.abs(this.hoverNormX) > 0.88 && (performance.now() - this.lastLookTime < 1600)) {
        const edgeStrength = (Math.abs(this.hoverNormX) - 0.88) / 0.12;
        this.targetOrbitYaw -= Math.sign(this.hoverNormX) * edgeStrength * 2.15 * dt;
      }

      this.resolvePlayerCollisions();
      if (ps.grounded) {
        const postIntY = this.getInteriorFloorY(ps.x, ps.z, ps.y);
        const postPier = ps.x >= 17.5 && ps.x <= 141.5 && ps.z >= -448 && ps.z <= -412;
        ps.y = postIntY !== null ? postIntY : (postPier ? 0.16 : this.getSurfaceY(ps.x, ps.z, true));
      }

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
      } else if (this.isDancing) {
        // Full-Body 1986 Malibu Club Dance Choreography (3 Switchable Styles + Periodic VIP Vibe Tips!)
        const b1 = Math.sin(elapsed * 6.8);
        const b2 = Math.cos(elapsed * 3.4);
        const bounce = Math.abs(b1) * 0.10;
        pMesh.body.position.set(0, bounce, 0);
        pMesh.body.rotation.set(0, b2 * 0.28, b2 * 0.08);
        if (chest) chest.rotation.set(Math.sin(elapsed * 6.8) * 0.09, b1 * 0.28, -b2 * 0.12);
        if (head) head.rotation.set(b1 * 0.14, -b2 * 0.24, b2 * 0.08);
        if (this.danceStyleIdx === 0) {
          // 1: Disco Fever (Saturday Night Point & Hip Groove)
          pMesh.armR.rotation.set(1.85 + b1 * 0.72, 0.18, -0.36 - b1 * 0.26);
          pMesh.armL.rotation.set(0.45 - b1 * 0.35, -0.18, 0.56);
          if (elbowR) elbowR.rotation.x = 0.22 + Math.max(0, -b1) * 0.75;
          if (elbowL) elbowL.rotation.x = 1.12;
        } else if (this.danceStyleIdx === 1) {
          // 2: Hands Up Club Rave
          pMesh.armL.rotation.set(2.42 + b1 * 0.26, 0.12, 0.36 + b2 * 0.22);
          pMesh.armR.rotation.set(2.42 - b1 * 0.26, -0.12, -0.36 + b2 * 0.22);
          if (elbowL) elbowL.rotation.x = 0.45 + Math.abs(b1) * 0.42;
          if (elbowR) elbowR.rotation.x = 0.45 + Math.abs(b2) * 0.42;
        } else {
          // 3: Vice Two-Step Groove
          pMesh.armL.rotation.set(1.05 + b1 * 0.52, 0.35, 0.32 + b2 * 0.26);
          pMesh.armR.rotation.set(1.05 - b1 * 0.52, -0.35, -0.32 - b2 * 0.26);
          if (elbowL) elbowL.rotation.x = 1.25 + b1 * 0.32;
          if (elbowR) elbowR.rotation.x = 1.25 - b1 * 0.32;
        }
        pMesh.legL.rotation.x = b1 * 0.34;
        pMesh.legR.rotation.x = -b1 * 0.34;
        if (kneeL) kneeL.rotation.x = -Math.abs(b1) * 0.44;
        if (kneeR) kneeR.rotation.x = -Math.abs(b2) * 0.44;
        if (ankleL) ankleL.rotation.x = 0;
        if (ankleR) ankleR.rotation.x = 0;

        this.danceRewardTimer -= dt;
        if (this.danceRewardTimer <= 0) {
          this.danceRewardTimer = 8.0;
          this.cash += 25;
          if (this.el && this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          if (this.audio) this.audio.pickup();
          if (this.el && this.el.combo) {
            this.el.combo.innerHTML = `MALIBU DANCE FLOOR VIBES · CROWD LOVES IT! <span>+$25</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 2.2;
          }
        }
      } else if (ps.parachuting) {
        // Authentic Ram-Air Harness Descent Pose (Hands gripping overhead toggles, pulling dynamically on turns & flare!)
        const steerL = Math.max(0, -(ps.paraSteer || 0));
        const steerR = Math.max(0,  (ps.paraSteer || 0));
        const flare = ps.paraFlare || 0;
        pMesh.body.position.y = THREE.MathUtils.damp(pMesh.body.position.y, 0, 10, dt);
        pMesh.body.rotation.set(0.14 - (ps.paraPitch || 0) * 0.65, 0, (ps.paraRoll || 0) * 0.72);
        if (chest) chest.rotation.set(-0.08 + flare * 0.12, 0, (ps.paraRoll || 0) * 0.25);
        if (head) head.rotation.set(-0.18 + (ps.paraPitch || 0) * 0.4, (ps.paraSteer || 0) * 0.22, 0);
        // Hands raised to overhead brake toggles; steering/flaring pulls elbows cleanly downward!
        pMesh.armL.rotation.set(2.45 - (steerL * 0.42 + flare * 0.48), 0.14, 0.24);
        pMesh.armR.rotation.set(2.45 - (steerR * 0.42 + flare * 0.48), -0.14, -0.24);
        if (elbowL) elbowL.rotation.x = 0.36 + steerL * 0.55 + flare * 0.62;
        if (elbowR) elbowR.rotation.x = 0.36 + steerR * 0.55 + flare * 0.62;
        // Relaxed knees tucked forward slightly in the wind stream (and bent for landing flare!)
        pMesh.legL.rotation.x = 0.26 + flare * 0.36 + Math.sin(elapsed * 2.4) * 0.07;
        pMesh.legR.rotation.x = -0.06 + flare * 0.30 - Math.sin(elapsed * 2.4) * 0.07;
        if (kneeL) kneeL.rotation.x = -0.44 - flare * 0.36;
        if (kneeR) kneeR.rotation.x = -0.34 - flare * 0.32;
        if (ankleL) ankleL.rotation.x = -0.18;
        if (ankleR) ankleR.rotation.x = -0.18;
      } else if (!ps.grounded && altAboveGround > 5.0 && ps.vy < -4.2) {
        // High-Altitude Skydiving Freefall X-Pose (belly-down arched skydiver catching wind!)
        const flutter = Math.sin(elapsed * 14.0) * 0.08;
        pMesh.body.rotation.x = THREE.MathUtils.damp(pMesh.body.rotation.x, -1.18, 6, dt);
        pMesh.body.rotation.y = THREE.MathUtils.damp(pMesh.body.rotation.y, 0, 8, dt);
        pMesh.body.rotation.z = THREE.MathUtils.damp(pMesh.body.rotation.z, ps.turnLean * 1.4, 8, dt);
        if (chest) chest.rotation.set(0.26, 0, 0);
        if (head) head.rotation.set(0.55, 0, 0);
        pMesh.armL.rotation.set(1.25 + flutter, 0.2, 0.85);
        pMesh.armR.rotation.set(1.25 - flutter, -0.2, -0.85);
        if (elbowL) elbowL.rotation.x = 0.65;
        if (elbowR) elbowR.rotation.x = 0.65;
        pMesh.legL.rotation.x = -0.22 + flutter;
        pMesh.legR.rotation.x = -0.22 - flutter;
        if (kneeL) kneeL.rotation.x = -0.58;
        if (kneeR) kneeR.rotation.x = -0.58;
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

      // Dynamic GTA 5 Prompt: Barber / Clothes [E] | Safehouse Actions [E] | Malibu Dance [E] | Ride / NPC / Mini-Game [E] | Vehicle [F]
      const nearShop = this.findNearestShopZone();
      const nearSafe = this.findNearestSafehouseStation();
      const canDanceHere = !this.isDancing && this.isInsideMalibuDanceZone();
      const nearRide = this.findNearestPierRide(8.5);
      const nearNpc = this.findNearestTalkableNpc(4.6);
      const nearPad = this.findNearestMiniGamePad(6.5);
      const nearTarget = this.findNearestVehicleTarget(5.4);
      this.nearbyVehicleTarget = nearTarget;
      const uiFree = this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.miniGameHubOpen && !this.taxiModalOpen && !this.activeDialogue && !this.activeShop && !this.tvOpen && this.sleepAnimTimer <= 0;
      if (uiFree && nearShop) {
        const promptMap = {
          barber: `Press E · Sit in Barber Chair (${nearShop.label})`,
          paynspray: `Press E · Enter Pay 'n' Spray Garage (Repair · Underglow · Spoiler)`,
          diner: `Press E · Order Food at ${nearShop.label} (+HP)`,
          ammu: `Press E · ${nearShop.label} (Armor · M4 · Indoor Range)`
        };
        this.el.carPrompt.textContent = promptMap[nearShop.kind] || `Press E · Browse Outfits (${nearShop.label})`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && nearSafe) {
        this.el.carPrompt.textContent = `Press E · ${nearSafe.label}`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && canDanceHere) {
        this.el.carPrompt.textContent = `Press E · Dance on The Malibu Club Dancefloor`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && nearRide) {
        this.el.carPrompt.textContent = `Press E · Ride ${nearRide.label}`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && nearPad) {
        this.el.carPrompt.textContent = `Press E · Start ${nearPad.label}`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && nearNpc) {
        this.el.carPrompt.textContent = `Press E · Talk to ${nearNpc.name} (${nearNpc.role})`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFree && nearTarget) {
        if (nearTarget.kind === 'plane') {
          this.el.carPrompt.textContent = `Press F · Fly ${nearTarget.label}`;
        } else if (nearTarget.kind === 'boat') {
          this.el.carPrompt.textContent = `Press F · Board ${nearTarget.label} (Watercraft)`;
        } else if (nearTarget.isTaxi || (nearTarget.kind === 'traffic' && nearTarget.tc && nearTarget.tc.userData && nearTarget.tc.userData.kind === 'taxi')) {
          this.el.carPrompt.textContent = `Press E · Hail Kaufman Cab | Press F · Steal Taxi`;
        } else if (nearTarget.isBike) {
          this.el.carPrompt.textContent = `Press F · Ride ${nearTarget.label}`;
        } else if (nearTarget.kind === 'traffic') {
          this.el.carPrompt.textContent = `Press F · Steal ${nearTarget.label}`;
        } else {
          this.el.carPrompt.textContent = `Press F · Enter ${nearTarget.label}`;
        }
        this.el.carPrompt.classList.add('on');
      } else {
        let nearDoor = null;
        if (this.enterableBuildings) {
          for (let i = 0; i < this.enterableBuildings.length; i++) {
            const eb = this.enterableBuildings[i];
            if (Math.hypot(ps.x - eb.doorX, ps.z - eb.doorZ) < 5.2) { nearDoor = eb; break; }
          }
        }
        const inOceanLobby = ps.x >= -32.2 && ps.x <= -16.8 && ps.z >= -59.5 && ps.z <= -36.5 && ps.y < 2.2;
        const nearVball = Math.hypot(ps.x - 24.8, ps.z + 124) < 10.8 && !this.activeSideMission;
        if (this.activeSideMission && this.activeSideMission.kind === 'volleyball' && uiFree) {
          this.el.carPrompt.textContent = `Move Into Glowing Ring · Press [SPACE] or [E] to SPIKE!`;
          this.el.carPrompt.classList.add('on');
        } else if (nearVball && uiFree) {
          this.el.carPrompt.textContent = `Press E · Play Vice Beach Volleyball Rally ($750 Prize)`;
          this.el.carPrompt.classList.add('on');
        } else if (nearDoor && uiFree) {
          this.el.carPrompt.textContent = `Walk Inside · ${nearDoor.label}`;
          this.el.carPrompt.classList.add('on');
        } else if (inOceanLobby && uiFree) {
          this.el.carPrompt.textContent = `Walk Up North Stairs · 1st Floor Ocean View Suite (Sleep · TV · Food · Wardrobe)`;
          this.el.carPrompt.classList.add('on');
        } else {
          this.el.carPrompt.classList.remove('on');
        }
      }
    } else if (this.mode === 'car') {
      const nearDriveShop = this.findNearestShopZone();
      const uiFreeCar = this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.activeShop && !this.phoneOpen;
      const nearRacer = this.dynamicEvent && this.dynamicEvent.kind === 'racer' && !this.dynamicEvent.completed
        && Math.hypot(cs.x - this.dynamicEvent.x, cs.z - this.dynamicEvent.z) < 26;
      if (uiFreeCar && nearRacer) {
        this.el.carPrompt.textContent = `STREET RACER CHALLENGE · Press [H] Honk or [E] to Race ($1,200)!`;
        this.el.carPrompt.classList.add('on');
      } else if (uiFreeCar && nearDriveShop) {
        this.el.carPrompt.textContent = `Press E · Open ${nearDriveShop.label} (Turbo · Rims · Hydraulics · Horns · Garage)`;
        this.el.carPrompt.classList.add('on');
      } else {
        this.el.carPrompt.classList.remove('on');
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

    // 3. Solid Traffic Cars (TRUE SOLID BUILDING COLLISIONS, LANE-END TURNAROUNDS, AIRBORNE WRECKS & RESPAWN!)
    const fwdX = -Math.sin(cs.yaw), fwdZ = -Math.cos(cs.yaw);
    const pushTrafficOutOfBuildings = (carObj, carData, bounceVel) => {
      const halfW = 1.18, halfL = 2.25;
      const localBoxes = this.colliderGrid.queryBoxes(carObj.position.x, carObj.position.z, 3.8);
      let collided = false;
      for (let pass = 0; pass < 2; pass++) {
        for (let bIdx = 0; bIdx < localBoxes.length; bIdx++) {
          const b = localBoxes[bIdx];
          const minX = b.minX - halfW, maxX = b.maxX + halfW;
          const minZ = b.minZ - halfL, maxZ = b.maxZ + halfL;
          if (carObj.position.x > minX && carObj.position.x < maxX && carObj.position.z > minZ && carObj.position.z < maxZ) {
            const oL = carObj.position.x - minX;
            const oR = maxX - carObj.position.x;
            const oT = carObj.position.z - minZ;
            const oB = maxZ - carObj.position.z;
            const m = Math.min(oL, oR, oT, oB);
            if (m === oL) {
              carObj.position.x = minX - 0.04;
              if (bounceVel && carData.vx > 0) carData.vx *= -0.35;
            } else if (m === oR) {
              carObj.position.x = maxX + 0.04;
              if (bounceVel && carData.vx < 0) carData.vx *= -0.35;
            } else if (m === oT) {
              carObj.position.z = minZ - 0.04;
              if (bounceVel && carData.vz > 0) carData.vz *= -0.35;
            } else {
              carObj.position.z = maxZ + 0.04;
              if (bounceVel && carData.vz < 0) carData.vz *= -0.35;
            }
            collided = true;
          }
        }
      }
      return collided;
    };

    for (let i = 0; i < this.traffic.length; i++) {
      const tc = this.traffic[i];
      const u = tc.userData;
      const zMin = u.zMin !== undefined ? u.zMin : -1050;
      const zMax = u.zMax !== undefined ? u.zMax : 300;
      const tdxAct0 = tc.position.x - act.x, tdzAct0 = tc.position.z - act.z;
      const distActSq = tdxAct0 * tdxAct0 + tdzAct0 * tdzAct0;
      const tVis = distActSq < (this.trafficCullSq || 48400);
      if (tc.visible !== tVis) tc.visible = tVis;

      if (u.vehState === 'wrecked') {
        // Airborne flip/bounce physics -> charred wreck -> clean respawn down avenue (never clips into buildings!)
        u.wreckTimer -= dt;
        if (tc.position.y > 0.01 || Math.abs(u.vy) > 0.15) {
          u.vy -= 22.0 * dt;
          tc.position.x += u.vx * dt;
          tc.position.y += u.vy * dt;
          tc.position.z += u.vz * dt;
          tc.rotation.x += u.spinX * dt;
          tc.rotation.z += u.spinZ * dt;
          pushTrafficOutOfBuildings(tc, u, true);
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
        if (u.wreckTimer <= 0) {
          // Clean respawn back onto original lane away from player
          u.vehState = 'ok';
          u.hp = u.maxHp || 100;
          u.vx = 0; u.vy = 0; u.vz = 0; u.spinX = 0; u.spinZ = 0; u.stun = 0;
          tc.position.set(u.origX, 0, THREE.MathUtils.clamp(u.origZ, zMin + 8, zMax - 8));
          tc.rotation.set(0, u.origYaw || 0, 0);
          pushTrafficOutOfBuildings(tc, u, false);
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
      } else if (u.stun > 0) {
        u.stun = Math.max(0, u.stun - dt);
        tc.position.x += u.vx * dt;
        tc.position.z += u.vz * dt;
        u.vx *= Math.pow(0.08, dt);
        u.vz *= Math.pow(0.08, dt);
        pushTrafficOutOfBuildings(tc, u, true);
        if (u.carRig && u.carRig.bodyGroup) {
          u.carRig.bodyGroup.rotation.z = THREE.MathUtils.damp(u.carRig.bodyGroup.rotation.z, 0, 8, dt);
        }
      } else {
        const trafficMult = this.cheats.fastTraffic ? 1.68 : 1.0;
        const stepZ = u.baseSpeed * trafficMult * dt;
        const dirZ = u.baseSpeed >= 0 ? 1 : -1;

        // Smoothly steer back onto lane centerline after any bump or lane turnaround
        if (Math.abs(tc.position.x - u.origX) > 0.04) {
          const nextX = THREE.MathUtils.damp(tc.position.x, u.origX, 2.8, dt);
          const steerDelta = nextX - tc.position.x;
          tc.position.x = nextX;
          const steerBank = THREE.MathUtils.clamp(steerDelta * 8.0 * dirZ, -0.35, 0.35);
          tc.rotation.y = THREE.MathUtils.damp(tc.rotation.y, (u.origYaw || 0) + steerBank, 6.0, dt);
        } else {
          tc.rotation.y = THREE.MathUtils.damp(tc.rotation.y, u.origYaw || 0, 6.0, dt);
        }

        // Lookahead building/barricade check (runs on all visible cars so none ever enter buildings!)
        let blockedAhead = false;
        if (tVis) {
          const probeZ = tc.position.z + stepZ + dirZ * 2.1;
          const aheadBoxes = this.colliderGrid.queryBoxes(tc.position.x, probeZ, 3.4);
          for (let bIdx = 0; bIdx < aheadBoxes.length; bIdx++) {
            const b = aheadBoxes[bIdx];
            if (tc.position.x + 1.15 > b.minX && tc.position.x - 1.15 < b.maxX && probeZ + 1.45 > b.minZ && probeZ - 1.45 < b.maxZ) {
              blockedAhead = true;
              break;
            }
          }
        }

        const nextZ = tc.position.z + stepZ;
        const hitRoadEnd = nextZ > zMax || nextZ < zMin;

        if (hitRoadEnd || blockedAhead) {
          if (distActSq > 110 * 110) {
            // Far from player: seamlessly wrap to clear opposite end of avenue
            tc.position.x = u.origX;
            tc.position.z = dirZ > 0 ? (zMin + 12) : (zMax - 12);
            tc.rotation.y = u.origYaw || 0;
          } else {
            // Within player sight: gracefully reverse onto the parallel opposite lane instead of popping or hitting walls!
            const prevOrig = u.origX;
            u.origX = u.pairX !== undefined ? u.pairX : prevOrig;
            u.pairX = prevOrig;
            u.baseSpeed = -u.baseSpeed;
            u.origYaw = u.baseSpeed > 0 ? Math.PI : 0;
            tc.position.z = THREE.MathUtils.clamp(tc.position.z - dirZ * 1.1, zMin + 2, zMax - 2);
          }
        } else {
          tc.position.z = nextZ;
        }

        // Ironclad safety net: guarantee zero overlap with any building collider on visible cars
        if (tVis) {
          pushTrafficOutOfBuildings(tc, u, false);
        }

        if (u.carRig && u.carRig.wheelSpinGroups) {
          u.wheelSpin = (u.wheelSpin || 0) - Math.abs(u.baseSpeed * trafficMult) * dt * 2.5;
          for (let w = 0; w < u.carRig.wheelSpinGroups.length; w++) u.carRig.wheelSpinGroups[w].rotation.x = u.wheelSpin;
        }
        // Working Traffic Brake Lights & Periodic Blinking Intersection Turn Signals!
        if (u.carRig && u.carRig.tailMat) {
          const nearCross = Math.abs((tc.position.z % 160)) < 16;
          const blink = nearCross && (Math.floor(elapsed * 4.5 + i) % 2 === 0);
          u.carRig.tailMat.emissiveIntensity = blink ? 2.4 : 1.05;
        }
      }

      if (u.stun > 0 && u.carRig && u.carRig.tailMat) {
        u.carRig.tailMat.emissiveIntensity = 2.8;
      }

      const tdx = tc.position.x - cs.x, tdz = tc.position.z - cs.z;
      if (tdx * tdx + tdz * tdz > 100) continue;

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
          pushTrafficOutOfBuildings(tc, u, false);
          if (u.vehState !== 'wrecked') {
            u.stun = 1.6;
            u.vx = -nx * Math.min(Math.abs(cs.speed) * 0.35, 10);
            u.vz = -nz * Math.min(Math.abs(cs.speed) * 0.35, 10);
          }
          if (this.impactCooldown <= 0) {
            this.impactCooldown = 0.26;
            this.camShake = 0.30;
            this.audio.impact(0.8);
            this.damageCar(Math.min(18, 4 + Math.abs(cs.speed) * 0.35));
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
        if (ped.stateTimer <= 0 && !ped.isGang) {
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

      if (this.cheats.fannyMagnet && isFoot && distActSq > 6.5 && distActSq < 580 && ped.state === 'walk') {
        const dP = Math.sqrt(distActSq) || 0.1;
        targetSpd = 3.2;
        ped.curSpeed = THREE.MathUtils.damp(ped.curSpeed, targetSpd, 7.0, dt);
        ped.x = THREE.MathUtils.clamp(ped.x - (dxAct / dP) * ped.curSpeed * dt, -492, 198);
        ped.z = THREE.MathUtils.clamp(ped.z - (dzAct / dP) * ped.curSpeed * dt, -1470, 355);
        targetYaw = Math.atan2(-dxAct, -dzAct);
      } else if (ped.state === 'panic') {
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
      if (ped.umbrella) {
        ped.umbrella.visible = this.curRainLevel > 0.25 && ped.state === 'walk';
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
              this.stuntSlowMo = 1.45;
              this.audio.jump();
            }
          }
        }
      }
    }
    const hCenter = this.getSurfaceY(cs.x, cs.z, false);
    const carOnSlope = !isInCoreViceFootprint(cs.x, cs.z) || hCenter > 0.25;
    let targetSlopePitch = 0, targetSlopeRoll = 0;
    if (carOnSlope && !cs.airborne) {
      const hFront = this.getSurfaceY(cs.x + fwdX * 1.9, cs.z + fwdZ * 1.9, false);
      const hBack  = this.getSurfaceY(cs.x - fwdX * 1.9, cs.z - fwdZ * 1.9, false);
      const hRight = this.getSurfaceY(cs.x + rightX * 1.1, cs.z + rightZ * 1.1, false);
      const hLeft  = this.getSurfaceY(cs.x - rightX * 1.1, cs.z - rightZ * 1.1, false);
      targetSlopePitch = THREE.MathUtils.clamp(Math.atan2(hFront - hBack, 3.8), -0.74, 0.74);
      targetSlopeRoll  = THREE.MathUtils.clamp(Math.atan2(hRight - hLeft, 2.2), -0.64, 0.64);
    }
    cs.slopePitch = THREE.MathUtils.damp(cs.slopePitch || 0, targetSlopePitch, 20, dt);
    cs.slopeRoll  = THREE.MathUtils.damp(cs.slopeRoll || 0, targetSlopeRoll, 20, dt);

    let carGroundY = hCenter + 0.05;
    if (carOnSlope) {
      const sinP = Math.sin(cs.slopePitch);
      const cosP = Math.cos(cs.slopePitch);
      const sinRcosP = Math.sin(cs.slopeRoll) * cosP;
      let reqY = hCenter + 0.06;
      const samplePts = [
        [ 0.98,  1.48,  0.06], [-0.98,  1.48,  0.06],
        [ 0.98, -1.48,  0.06], [-0.98, -1.48,  0.06],
        [ 1.08,  2.35, -0.06], [-1.08,  2.35, -0.06],
        [ 1.08, -2.35, -0.06], [-1.08, -2.35, -0.06]
      ];
      for (let i = 0; i < samplePts.length; i++) {
        const sx = samplePts[i][0];
        const sz = samplePts[i][1];
        const pad = samplePts[i][2];
        const wx = cs.x + rightX * sx + fwdX * sz;
        const wz = cs.z + rightZ * sx + fwdZ * sz;
        const hPt = this.getSurfaceY(wx, wz, false);
        const dy = sz * sinP + sx * sinRcosP;
        const neededCenter = hPt - dy + pad;
        if (neededCenter > reqY) reqY = neededCenter;
      }
      carGroundY = reqY;
    }
    if (this.cheats.seaways && cs.x > 28 && cs.z > -1110 && carGroundY < -0.25) {
      carGroundY = -0.28;
      if (carAbsSpd > 5 && Math.random() < 0.55) {
        this.spawnParticle(cs.x - fwdX * 2.0 + (Math.random() - 0.5) * 1.4, -0.1, cs.z - fwdZ * 2.0, (Math.random() - 0.5) * 2.5, 2.2, (Math.random() - 0.5) * 2.5, 0x9cf4ff, 0.55, 0.72, 1.2, 7.5);
      }
    }
    if (this.cheats.flyingCars && !isFoot && !isPlane && !isRide && !isBoat && cs.speed > 22) {
      const climbInput = (this.keys.up || this.keys.nitro) ? 1.0 : (this.keys.down ? -1.0 : 0.12);
      const lift = (cs.speed - 20) * 0.28 * climbInput;
      cs.y = THREE.MathUtils.clamp(cs.y + lift * dt, carGroundY, 92);
      cs.vy = 0;
      cs.airborne = cs.y > carGroundY + 0.4;
      rampPitch = THREE.MathUtils.clamp(climbInput * 0.22, -0.18, 0.24);
    } else if (cs.airborne || cs.y > carGroundY + 0.02) {
      if (cs.airborne) {
        cs.airTime += dt;
        cs.vy -= 21.5 * dt;
        cs.y += cs.vy * dt;
        rampPitch = THREE.MathUtils.clamp(cs.vy * 0.025, -0.2, 0.28);
        if (cs.y <= carGroundY) {
          cs.y = carGroundY;
          cs.vy = 0;
          cs.airborne = false;
          this.stuntSlowMo = 0;
          this.camShake = Math.max(this.camShake, 0.22);
          this.audio.impact(0.5);
          if (cs.airTime > 0.42) {
            const bonus = Math.round(450 + cs.airTime * 350);
            this.stuntJumpsDone = (this.stuntJumpsDone || 0) + 1;
            this.cash += bonus;
            this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.el.combo.innerHTML = `STUNT JUMP #${this.stuntJumpsDone} · ${cs.airTime.toFixed(1)}s AIR! <span>+$${bonus}</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 3.4;
            this.savePersistentSave();
          }
          for (let k = 0; k < 6; k++) {
            this.spawnParticle(cs.x + (Math.random() - 0.5) * 1.6, carGroundY + 0.25, cs.z + (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 5, 1.8 + Math.random() * 2, (Math.random() - 0.5) * 5, 0xffd36b, 0.42, 0.48, 0.25, 9.8);
          }
        }
      } else if (rampPitch === 0) {
        cs.y = Math.max(carGroundY, cs.y - 18 * dt);
      }
    } else if (rampPitch === 0) {
      cs.y = carGroundY;
    }
    if (!this.cheats.flyingCars && !cs.airborne && rampPitch === 0 && cs.y < carGroundY) {
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

    // 6. Apply Active Vehicle Transform (chassis + ALL 4 wheels rotated together cleanly with terrain slope!)
    const activeRig = (this.activeVehicle && this.activeVehicle.rig) || this.car;
    const activeMesh = (this.activeVehicle && this.activeVehicle.mesh) || this.car.root;
    activeMesh.position.set(cs.x, cs.y, cs.z);
    activeMesh.rotation.order = 'YXZ';
    activeMesh.rotation.set(cs.slopePitch, cs.yaw, cs.slopeRoll);
    const bikeWheeliePitch = activeRig.isBike && nitroActive && cs.speed > 10 ? 0.24 : 0;
    const bikeLeanRoll = activeRig.isBike
      ? cs.steer * speedFactor * 0.42
      : -cs.steer * speedFactor * (drifting ? 0.12 : 0.065);
    cs.pitch = THREE.MathUtils.damp(cs.pitch, targetPitch + rampPitch + bikeWheeliePitch, 8, dt);
    cs.roll = THREE.MathUtils.damp(cs.roll, bikeLeanRoll, 8, dt);
    // Pro Lowrider Hydraulics Bounce Physics (H key hop & Shift+H rhythmic bounce dance!)
    const hy = this.hydraulicsState;
    const hasHydraulics = this.mode === 'car' && !activeRig.isBike && Boolean(this.getActiveVehicleMods().hydraulics);
    if (hasHydraulics) {
      if (hy.mode > 0) {
        hy.phase += dt * (hy.mode === 2 ? 7.8 : 6.4);
        const hopWave = Math.max(0, Math.sin(hy.phase));
        const targetY = 0.08 + hopWave * 0.24;
        const targetPitch = hy.mode === 1 ? (Math.sin(hy.phase) * 0.14) : (Math.sin(hy.phase * 0.5) * 0.11);
        const targetRoll = hy.mode === 2 ? (Math.cos(hy.phase) * 0.15) : (Math.sin(hy.phase * 0.5) * 0.04);
        hy.bounceY = THREE.MathUtils.damp(hy.bounceY, targetY, 14, dt);
        hy.pitchOff = THREE.MathUtils.damp(hy.pitchOff, targetPitch, 14, dt);
        hy.rollOff = THREE.MathUtils.damp(hy.rollOff, targetRoll, 14, dt);
      } else {
        // Spring-damper physics for manual single-tap [H] hydraulic hops
        hy.bounceVel += (-110 * hy.bounceY - 12 * hy.bounceVel) * dt;
        hy.bounceY = Math.max(0, hy.bounceY + hy.bounceVel * dt);
        if (hy.bounceY <= 0.001 && Math.abs(hy.bounceVel) < 0.05) { hy.bounceY = 0; hy.bounceVel = 0; }
        hy.pitchOff = THREE.MathUtils.damp(hy.pitchOff, hy.bounceY * 0.42, 12, dt);
        hy.rollOff = THREE.MathUtils.damp(hy.rollOff, 0, 10, dt);
      }
    } else {
      hy.mode = 0;
      hy.bounceY = THREE.MathUtils.damp(hy.bounceY, 0, 12, dt);
      hy.pitchOff = THREE.MathUtils.damp(hy.pitchOff, 0, 12, dt);
      hy.rollOff = THREE.MathUtils.damp(hy.rollOff, 0, 12, dt);
    }
    if (activeRig.bodyGroup) {
      activeRig.bodyGroup.rotation.x = cs.pitch + hy.pitchOff;
      activeRig.bodyGroup.rotation.z = cs.roll + hy.rollOff;
      activeRig.bodyGroup.position.y = (cs.airborne ? 0 : Math.sin(elapsed * 22) * Math.min(carAbsSpd * 0.0004, 0.012)) + hy.bounceY;
    }

    // Keep standing player mesh strictly synchronized with vehicle (never left behind when driving car/boat!)
    if (!isFoot && !isPlane && !isRide && !isBoat && !this.carjackAnim && this.player) {
      if (activeRig.isBike) {
        if (activeRig.riderSeat && this.player.root.parent !== activeRig.riderSeat) {
          activeRig.riderSeat.add(this.player.root);
          this.player.root.position.set(0, -0.26, 0.14);
          this.player.root.rotation.set(0, 0, 0);
        }
        this.player.root.visible = true;
      } else {
        if (this.player.root.visible) this.player.root.visible = false;
        ps.x = cs.x; ps.y = cs.y; ps.z = cs.z;
        this.player.root.position.set(cs.x, cs.y, cs.z);
        if (activeRig.playerDriverMesh && !activeRig.playerDriverMesh.visible) {
          activeRig.playerDriverMesh.visible = true;
        }
      }
    } else if (isBoat && this.activeBoat && this.player) {
      const boatSeat = this.activeBoat.rig && (this.activeBoat.rig.riderSeat || this.activeBoat.rig.seat);
      if (boatSeat && this.player.root.parent !== boatSeat) {
        boatSeat.add(this.player.root);
        this.player.root.position.set(0, -0.58, 0.05);
        this.player.root.rotation.set(0, 0, 0);
      }
      this.player.root.visible = true;
      const pM = this.player;
      if (pM.chest) pM.chest.rotation.set(-0.14, 0, 0);
      if (pM.head) pM.head.rotation.set(0.10, 0, 0);
      pM.armL.rotation.set(0.95, 0, -0.14);
      pM.armR.rotation.set(0.95, 0, 0.14);
      pM.legL.rotation.set(1.22, 0, -0.12);
      pM.legR.rotation.set(1.22, 0, 0.12);
      if (pM.legL.userData && pM.legL.userData.knee) pM.legL.userData.knee.rotation.x = -1.18;
      if (pM.legR.userData && pM.legR.userData.knee) pM.legR.userData.knee.rotation.x = -1.18;
    }

    // Two-Wheeler Seated Rider Posture (Facing FORWARD -Z, leaning into handlebars, feet tucked on pegs!)
    if (!isFoot && !isPlane && !isRide && !isBoat && activeRig.isBike && this.player && this.player.root.visible) {
      const pM = this.player;
      const isScooter = activeRig.bikeKind === 'faggio';
      const leanFwd = isScooter ? -0.10 : (-0.30 - speedFactor * 0.14);
      if (pM.chest) pM.chest.rotation.set(leanFwd, 0, 0);
      if (pM.head) pM.head.rotation.set(-leanFwd * 0.78, cs.steer * 0.36, 0);
      pM.armL.rotation.set(isScooter ? 0.96 : 1.18, 0, -0.18);
      pM.armR.rotation.set(isScooter ? 0.96 : 1.18, 0, 0.18);
      if (pM.armL.userData && pM.armL.userData.elbow) pM.armL.userData.elbow.rotation.x = 0.28;
      if (pM.armR.userData && pM.armR.userData.elbow) pM.armR.userData.elbow.rotation.x = 0.28;
      pM.legL.rotation.set(isScooter ? 1.18 : 0.88, 0, -0.22);
      pM.legR.rotation.set(isScooter ? 1.18 : 0.88, 0, 0.22);
      if (pM.legL.userData && pM.legL.userData.knee) pM.legL.userData.knee.rotation.x = isScooter ? -1.18 : -1.24;
      if (pM.legR.userData && pM.legR.userData.knee) pM.legR.userData.knee.rotation.x = isScooter ? -1.18 : -1.24;
      pM.body.position.set(0, -0.24, 0.04);
      pM.body.rotation.set(0, 0, 0);
    }

    // Flashing emergency roof lightbar if player is driving a stolen VCPD Cruiser!
    if (activeRig.isPolice && activeRig.redLightMat && activeRig.blueLightMat) {
      const pFlash = Math.floor(elapsed * 8.0) % 2;
      activeRig.redLightMat.emissiveIntensity = pFlash === 0 ? 3.0 : 0.25;
      activeRig.blueLightMat.emissiveIntensity = pFlash === 1 ? 3.0 : 0.25;
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
      if (this.car.flameOuterMat) this.car.flameOuterMat.opacity = 0;
      if (this.car.flameCoreMat) this.car.flameCoreMat.opacity = 0;
    }

    if (drifting && !cs.airborne) {
      if (Math.random() < 0.65) {
        this.spawnParticle(cs.x - fwdX * 1.4 + (Math.random() - 0.5) * 1.4, cs.y + 0.24, cs.z - fwdZ * 1.4, (Math.random() - 0.5) * 1.4, 0.9, (Math.random() - 0.5) * 1.4, 0xe8e4f0, 0.85, 0.65, 2.4);
      }
      if (this.skidPool && this.frameCount % 2 === 0 && !activeRig.isBike) {
        this.skidPool.stampPair(cs.x - fwdX * 1.35, cs.y + 0.05, cs.z - fwdZ * 1.35, cs.yaw, 0.82);
      }
    }
    // Rain Tire Water Spray behind rear wheels!
    if (!isFoot && !isPlane && !isBoat && this.curRainLevel > 0.22 && carAbsSpd > 10 && !cs.airborne && Math.random() < 0.55) {
      this.spawnParticle(cs.x - fwdX * 1.65 + (Math.random() - 0.5) * 1.5, cs.y + 0.26, cs.z - fwdZ * 1.65, -fwdX * 2.5 + (Math.random() - 0.5) * 1.4, 1.35 + Math.random() * 0.9, -fwdZ * 2.5 + (Math.random() - 0.5) * 1.4, 0xd4eefc, 0.68, 0.44, 1.8, 3.2);
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

    // Keep shadow frustum texel-snapped around active actor so shadows never shimmer while driving!
    const snapX = Math.round(act.x * 0.25) * 4;
    const snapZ = Math.round(act.z * 0.25) * 4;
    this.sunLight.position.set(snapX + this.envSunDir.x * 85, Math.max(12, this.envSunDir.y * 85), snapZ + this.envSunDir.z * 85);
    this.sunLight.target.position.set(snapX, 0, snapZ);

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

    // 7. Velocity-Damped Smooth Mouse Look & Camera Choreography (with gentle auto-recenter while driving!)
    if (this.orbitYawOffset !== this._lastAppliedOrbitYaw) this.targetOrbitYaw = this.orbitYawOffset;
    if (this.orbitPitchOffset !== this._lastAppliedOrbitPitch) this.targetOrbitPitch = this.orbitPitchOffset;
    if (!isFoot && !this.dragging && (isPlane ? act.speed > 6 : carAbsSpd > 5) && (performance.now() - this.lastLookTime > 2400)) {
      this.targetOrbitYaw = THREE.MathUtils.damp(this.targetOrbitYaw, 0, 2.2, dt);
      this.targetOrbitPitch = THREE.MathUtils.damp(this.targetOrbitPitch, 0, 2.2, dt);
    }
    this.orbitYawOffset = THREE.MathUtils.damp(this.orbitYawOffset, this.targetOrbitYaw, 18, dt);
    this.orbitPitchOffset = THREE.MathUtils.damp(this.orbitPitchOffset, this.targetOrbitPitch, 18, dt);
    this._lastAppliedOrbitYaw = this.orbitYawOffset;
    this._lastAppliedOrbitPitch = this.orbitPitchOffset;
    const speedRatio = isPlane
      ? THREE.MathUtils.clamp(act.speed / Math.max(1, act.topSpeed || 90), 0, 1)
      : THREE.MathUtils.clamp(carAbsSpd / 64, 0, 1);
    const camMode = CAM_MODES[this.camIdx];
    let camDist = 8.8, camHeight = 2.50, lookAhead = 8.5;
    let targetFov = isPlane
      ? (58 + speedRatio * 15)
      : (isFoot ? (this.weapon !== 'fists' ? 50 : 56) : (55 + speedRatio * 14 + (nitroActive ? 5 : 0)));

    // Floating 3D Street Chevron Arrows toward active Mission Target, GPS Autopilot, or Custom Map Waypoint!
    if (this.routeGuide) {
      const guideTgt = (this.activeSideMission && this.activeSideMission.target)
        ? this.activeSideMission.target
        : (this.autopilotQueue.length > 0 ? this.autopilotQueue[0] : this.customWaypoint);
      if (guideTgt && !isPlane) {
        const dG = Math.hypot(guideTgt.x - act.x, guideTgt.z - act.z);
        if (dG < 12 && this.customWaypoint && guideTgt === this.customWaypoint) {
          this.customWaypoint = null;
          this.routeGuide.hide();
        } else {
          this.routeGuide.update(act, guideTgt, (gx, gz, b) => this.getSurfaceY(gx, gz, b), elapsed);
        }
      } else {
        this.routeGuide.hide();
      }
    }

    if (isPlane) {
      const pl = this.activePlane;
      if (camMode === 'Hood') {
        const fxP = -Math.sin(pl.yaw), fzP = -Math.cos(pl.yaw);
        _vecA.set(pl.x + fxP * 1.6, pl.y + (pl.isHeli ? 1.55 : 2.1), pl.z + fzP * 1.6);
        _vecB.set(pl.x + fxP * 32, pl.y + 1.4 + pl.pitch * 18, pl.z + fzP * 32);
        targetFov = 68;
      } else {
        const yaw = pl.yaw + this.orbitYawOffset;
        const pDist = (pl.isHeli ? 12.2 : (pl.kind === 'prop' ? 14.5 : 18.5)) + speedRatio * 4.5;
        const pHeight = (pl.isHeli ? 3.8 : 4.6) + speedRatio * 1.4 - pl.pitch * 4.2 + this.orbitPitchOffset * 5.0;
        _vecA.set(pl.x + Math.sin(yaw) * pDist, pl.y + pHeight, pl.z + Math.cos(yaw) * pDist);
        _vecB.set(pl.x - Math.sin(pl.yaw) * 14.0, pl.y + 1.4 + pl.pitch * 6.0, pl.z - Math.cos(pl.yaw) * 14.0);
      }
    } else if (isBoat) {
      const b = this.activeBoat;
      const yaw = b.yaw + this.orbitYawOffset;
      const bDist = camMode === 'Hood' ? -0.4 : 9.4;
      const bH = camMode === 'Hood' ? 1.65 : 3.2 + this.orbitPitchOffset * 2.2;
      _vecA.set(b.x + Math.sin(yaw) * bDist, b.y + bH, b.z + Math.cos(yaw) * bDist);
      _vecB.set(b.x - Math.sin(b.yaw) * 14.0, b.y + 0.9, b.z - Math.cos(b.yaw) * 14.0);
      targetFov = 58 + Math.min(12, Math.abs(b.speed) * 0.25);
    } else if (this.carjackAnim && this.carjackAnim.kind === 'steal') {
      const cj = this.carjackAnim;
      _vecA.set(
        cj.carX - cj.rx * 4.9 - cj.fx * 3.1,
        1.95,
        cj.carZ - cj.rz * 4.9 - cj.fz * 3.1
      );
      _vecB.set(cj.doorX, 1.02, cj.doorZ);
      targetFov = 46;
    } else if (isRide) {
      const r = this.activeRide;
      const yaw = (r.ropewayKey ? (this.player.root.rotation.y + 0.55) : (r.id === 'ferris' ? elapsed * 0.18 : (r.id === 'carousel' ? elapsed * 0.55 : this.player.root.rotation.y))) + this.orbitYawOffset;
      const dist = r.ropewayKey ? 11.5 : (r.id === 'ferris' ? 9.5 : (r.id === 'coaster' ? 6.8 : 5.6));
      const hOff = r.ropewayKey ? 3.8 : (r.id === 'ferris' ? 3.2 : (r.id === 'coaster' ? 2.8 : 2.2));
      _vecA.set(ps.x + Math.sin(yaw) * dist, ps.y + hOff + this.orbitPitchOffset * 2.4, ps.z + Math.cos(yaw) * dist);
      _vecB.set(ps.x, ps.y + 1.1, ps.z);
      targetFov = r.id === 'coaster' ? 64 : (r.ropewayKey ? 60 : 56);
    } else if (isFoot && this.activeShop) {
      const isBarber = this.activeShop.kind === 'barber';
      const frontDist = isBarber ? 1.85 : 2.95;
      const frontYaw = ps.yaw + Math.PI + Math.sin(elapsed * 0.45) * 0.16;
      const sideRightX = Math.cos(frontYaw) * (isBarber ? 0.34 : 0.56);
      const sideRightZ = -Math.sin(frontYaw) * (isBarber ? 0.34 : 0.56);
      _vecA.set(
        ps.x + Math.sin(frontYaw) * frontDist + sideRightX,
        ps.y + (isBarber ? 1.62 : 1.38),
        ps.z + Math.cos(frontYaw) * frontDist + sideRightZ
      );
      _vecB.set(ps.x + sideRightX * 0.55, ps.y + (isBarber ? 1.56 : 1.08), ps.z + sideRightZ * 0.55);
      targetFov = isBarber ? 42 : 48;
    } else if (isFoot && this.isDancing) {
      const dYaw = elapsed * 0.42 + this.orbitYawOffset;
      _vecA.set(ps.x + Math.sin(dYaw) * 3.8, ps.y + 1.92, ps.z + Math.cos(dYaw) * 3.8);
      _vecB.set(ps.x, ps.y + 1.15, ps.z);
      targetFov = 54;
    } else if (isFoot && camMode === 'Hood') {
      // First-person on-foot eye-level view!
      const yaw = this.orbitYawOffset;
      if (this.player.root.visible) this.player.root.visible = false;
      _vecA.set(ps.x, ps.y + 1.66, ps.z);
      _vecB.set(ps.x - Math.sin(yaw) * 14.0, ps.y + 1.62 - this.orbitPitchOffset * 6.5, ps.z - Math.cos(yaw) * 14.0);
      targetFov = 68;
    } else if (isFoot) {
      if (!this.player.root.visible) this.player.root.visible = true;
      const armed = this.weapon !== 'fists';
      let indoorBounds = null;
      if (this.enterableBuildings) {
        for (let i = 0; i < this.enterableBuildings.length; i++) {
          const b = this.enterableBuildings[i].bounds;
          if (b && ps.x >= b.minX - 0.8 && ps.x <= b.maxX + 0.8 && ps.z >= b.minZ - 0.8 && ps.z <= b.maxZ + 0.8) {
            indoorBounds = b;
            break;
          }
        }
      }
      const footDist = ps.parachuting ? 8.8 : (indoorBounds ? 2.95 : (armed ? 3.85 : 4.6));
      const footH = (ps.parachuting ? 3.55 : (indoorBounds ? 1.72 : (armed ? 1.88 : 2.05))) + this.orbitPitchOffset * (ps.parachuting ? 2.6 : 1.7);
      const yaw = this.orbitYawOffset;
      const shoulderR = ps.parachuting ? 0 : (armed ? 0.58 : 0.16);
      const rx = Math.cos(yaw) * shoulderR, rz = -Math.sin(yaw) * shoulderR;
      let cx = ps.x + Math.sin(yaw) * footDist + rx;
      let cz = ps.z + Math.cos(yaw) * footDist + rz;
      let cy = ps.y + footH;
      if (indoorBounds) {
        cx = THREE.MathUtils.clamp(cx, indoorBounds.minX + 0.65, indoorBounds.maxX - 0.65);
        cz = THREE.MathUtils.clamp(cz, indoorBounds.minZ + 0.65, indoorBounds.maxZ - 0.65);
        const inOpenStairwell = Boolean(indoorBounds.floor1Y) && ps.z < -55.15;
        if (indoorBounds.floor1Y && !inOpenStairwell && ps.y < indoorBounds.floor1Y - 1.15) {
          // Ground floor lobby under deck: clamp below 1st-floor slab so camera never clips through ceiling!
          cy = THREE.MathUtils.clamp(cy, 1.15, indoorBounds.floor1Y - 0.55);
        } else if (indoorBounds.floor1Y && ps.y >= indoorBounds.floor1Y - 1.15) {
          // 1st-floor suite: clamp cleanly between hardwood deck and suite ceiling!
          cy = THREE.MathUtils.clamp(cy, indoorBounds.floor1Y + 0.65, (indoorBounds.ceilY || 9.25) - 0.50);
        } else if (indoorBounds.ceilY) {
          cy = THREE.MathUtils.clamp(cy, 1.15, indoorBounds.ceilY - 0.45);
        }
      }
      if (ps.parachuting) targetFov = 64;
      _vecA.set(cx, cy, cz);
      _vecB.set(ps.x - Math.sin(yaw) * 6.0 + rx * 0.4, ps.y + (ps.parachuting ? 2.15 : 1.42) - this.orbitPitchOffset * 2.2, ps.z - Math.cos(yaw) * 6.0 + rz * 0.4);
    } else if (camMode === 'Hood') {
      // First-Person Car / Bike Hood Cockpit Camera!
      const fxC = -Math.sin(cs.yaw), fzC = -Math.cos(cs.yaw);
      const hoodH = activeRig.isBike ? 1.42 : 1.30;
      const hoodOff = activeRig.isBike ? 0.25 : 0.48;
      _vecA.set(cs.x + fxC * hoodOff, cs.y + hoodH, cs.z + fzC * hoodOff);
      _vecB.set(cs.x + fxC * 28.0 - Math.sin(this.orbitYawOffset) * 8, cs.y + hoodH - 0.08 + (cs.slopePitch || 0) * 14, cs.z + fzC * 28.0);
      targetFov = 68 + speedRatio * 10;
    } else if (camMode === 'Low') {
      camDist = activeRig.isBike ? 4.4 : 5.6; camHeight = activeRig.isBike ? 1.38 : 1.28; lookAhead = 12.0; targetFov = 62 + speedRatio * 15;
      const yaw = cs.yaw + this.orbitYawOffset;
      const orbBlend = Math.max(0, Math.cos(this.orbitYawOffset));
      _vecA.set(cs.x + Math.sin(yaw) * camDist, cs.y + camHeight + this.orbitPitchOffset * 2, cs.z + Math.cos(yaw) * camDist);
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead * orbBlend, cs.y + 0.92, cs.z - Math.cos(cs.yaw) * lookAhead * orbBlend);
    } else if (camMode === 'Drone') {
      camDist = 14.5; camHeight = 9.4; lookAhead = 8.0; targetFov = 50 + speedRatio * 8;
      const yaw = cs.yaw + 0.34 + this.orbitYawOffset;
      const orbBlend = Math.max(0, Math.cos(this.orbitYawOffset));
      _vecA.set(cs.x + Math.sin(yaw) * camDist, cs.y + camHeight + this.orbitPitchOffset * 4, cs.z + Math.cos(yaw) * camDist);
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead * orbBlend - 2.2 * orbBlend, cs.y + 1.0, cs.z - Math.cos(cs.yaw) * lookAhead * orbBlend);
    } else {
      if (activeRig.isBike) { camDist = 5.4; camHeight = 1.92; lookAhead = 6.5; }
      const yaw = cs.yaw + this.orbitYawOffset;
      const orbBlend = Math.max(0, Math.cos(this.orbitYawOffset));
      const slopeCamLift = Math.max(0, (cs.slopePitch || 0) * 3.8);
      const slopeLookLift = (cs.slopePitch || 0) * 4.2;
      _vecA.set(cs.x + Math.sin(yaw) * (camDist + speedRatio * 1.4), cs.y + camHeight + slopeCamLift + this.orbitPitchOffset * 3.2, cs.z + Math.cos(yaw) * (camDist + speedRatio * 1.4));
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead * orbBlend, cs.y + (activeRig.isBike ? 1.02 : 0.85) + slopeLookLift, cs.z - Math.cos(cs.yaw) * lookAhead * orbBlend);
    }

    // Never let the chase/foot camera clip underneath mountain slopes behind the actor!
    let camFloorY = 0.8;
    if (!isPlane) {
      const surfCam = this.getSurfaceY(_vecA.x, _vecA.z, false);
      const surfMid = this.getSurfaceY((_vecA.x + act.x) * 0.5, (_vecA.z + act.z) * 0.5, false);
      camFloorY = Math.max(0.8, surfCam + 1.45, surfMid + 1.15);
    }
    const sx = (Math.random() - 0.5) * this.camShake;
    const sy = (Math.random() - 0.5) * this.camShake;
    const camDamp = isPlane ? 6.2 : (isFoot ? 11.0 : 7.5);
    if (this.snapCameraNext) {
      this.camera.position.set(_vecA.x, Math.max(camFloorY, _vecA.y), _vecA.z);
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
      this.snapCameraNext = false;
    } else {
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _vecA.x + sx, camDamp, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, Math.max(camFloorY, _vecA.y + sy), camDamp, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _vecA.z, camDamp, dt);
      const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
      if (Math.abs(nextFov - this.camera.fov) > 0.02) {
        this.camera.fov = nextFov;
        this.camera.updateProjectionMatrix();
      }
    }
    this.camera.lookAt(_vecB);
    this.updateProjectPins(act);

    // 8. Exact Main Portfolio Dual-Dial Sports-Car Speedometer & Tachometer + GTA V Special Bar & Clock
    const kmh = isPlane ? Math.round(Math.abs(act.speed) * 1.94) : (isBoat ? Math.round(Math.abs(act.speed) * 1.94) : Math.round(carAbsSpd * 3.9));
    const mph = isPlane ? Math.round(Math.abs(act.speed) * 1.94) : (isBoat ? Math.round(Math.abs(act.speed) * 1.94) : Math.round(carAbsSpd * 2.55));
    const gearNum = cs.speed < -0.5 ? 0 : mph < 3 ? 0 : Math.min(6, Math.floor(mph / 28) + 1);
    this.audio.update(
      (isFoot || isPlane) ? 0 : (isBoat ? THREE.MathUtils.clamp(Math.abs(act.speed) / 38, 0, 1) : speedRatio),
      isPlane ? (act.throttle > 0.75) : nitroActive,
      drifting,
      Boolean(activeRig.isBike),
      act.y,
      gearNum
    );
    this.updateAmbientZoneAudio(act, isPlane, isRide, dt);
    if (this.leonidaWorld && typeof this.leonidaWorld.update === 'function') {
      const liveNightMix = this.skyDome && this.skyDome.material && this.skyDome.material.uniforms ? this.skyDome.material.uniforms.uNightMix.value : 0;
      this.leonidaWorld.update(dt, act, kmh, this.mode === 'car', (ev) => this.handleLeonidaToll(ev), elapsed, liveNightMix);
    }
    if (this.frameCount % 4 === 0) this.drawRadar();

    // Main Portfolio Speedometer SVG sweep (135 deg -> 405 deg = 270 deg sweep, 0..200 MPH)
    const spdNeedleDeg = 135 + (Math.min(mph, 200) / 200) * 270;
    if (this.el.needle && Math.abs(spdNeedleDeg - this.lastNeedleDeg) > 0.25) {
      this.lastNeedleDeg = spdNeedleDeg;
      this.el.needle.setAttribute('transform', `rotate(${spdNeedleDeg.toFixed(1)} 100 100)`);
    }
    if (mph !== this.lastHudKmh) {
      this.lastHudKmh = mph;
      if (this.el.speed) this.el.speed.textContent = String(Math.min(999, mph)).padStart(3, '0');
      if (this.el.cluster) this.el.cluster.classList.toggle('over', !isPlane && !isBoat && mph > 55);
    }
    const gearStr = isPlane
      ? `${Math.round(act.y)}M`
      : (isBoat ? 'SEA' : (cs.speed < -0.5 ? 'R' : mph < 3 ? 'N' : String(gearNum)));
    if (gearStr !== this.lastHudGear) {
      this.lastHudGear = gearStr;
      if (this.el.gear) this.el.gear.textContent = gearStr;
    }
    if (this.el.spdLim) {
      const limTxt = isPlane ? 'AIRSPEED' : (isBoat ? 'MARINA' : 'LIMIT 55');
      if (this.el.spdLim.textContent !== limTxt) this.el.spdLim.textContent = limTxt;
    }
    if (this.el.spdUnit) {
      const unitTxt = (isPlane || isBoat) ? 'KTS' : 'MPH';
      if (this.el.spdUnit.textContent !== unitTxt) this.el.spdUnit.textContent = unitTxt;
    }
    if (this.el.tchUnit) {
      const tUnitTxt = isPlane ? 'ALT' : (isBoat ? 'HELM' : 'GEAR');
      if (this.el.tchUnit.textContent !== tUnitTxt) this.el.tchUnit.textContent = tUnitTxt;
    }
    if (isPlane && this.el.carName && this.frameCount % 6 === 0) {
      const gTxt = act.isHeli ? 'VTOL' : (act.gearBlend > 0.5 ? 'GEAR DN' : 'GEAR UP');
      this.el.carName.textContent = `${act.label} · ${Math.round(act.y)}M · ${gTxt}`;
    }

    // Main Portfolio Tachometer Needle (0..8 RPM x1000, 135 deg -> 405 deg, flashes .rev > 6.5)
    const rpmVal = isPlane
      ? THREE.MathUtils.clamp(1.2 + (act.throttle || 0.35) * 6.5, 1.0, 8.0)
      : (mph < 3
        ? 0.85 + Math.sin(elapsed * 8) * 0.14
        : THREE.MathUtils.clamp(1.9 + ((mph % 28) / 28) * 5.2 + (nitroActive ? 1.1 : 0), 1.0, 7.95));
    const tachDeg = 135 + (Math.min(rpmVal, 8) / 8) * 270;
    if (this.el.tachNeedle && Math.abs(tachDeg - this.lastTachDeg) > 0.35) {
      this.lastTachDeg = tachDeg;
      this.el.tachNeedle.setAttribute('transform', `rotate(${tachDeg.toFixed(1)} 100 100)`);
    }
    const isRev = rpmVal > 6.5;
    if (this.el.cluster && isRev !== this.lastRevState) {
      this.lastRevState = isRev;
      this.el.cluster.classList.toggle('rev', isRev);
    }

    // GTA V Special / Nitro Bar beneath Minimap + Live In-Game Clock
    if (typeof this.specialCharge !== 'number') this.specialCharge = 100;
    if (nitroActive || (isFoot && this.keys.nitro)) {
      this.specialCharge = Math.max(8, this.specialCharge - dt * 24);
    } else {
      this.specialCharge = Math.min(100, this.specialCharge + dt * 14);
    }
    if (this.el.nosFill) {
      const nosPct = Math.round(this.specialCharge);
      if (nosPct !== this.lastNosPct) {
        this.lastNosPct = nosPct;
        this.el.nosFill.style.width = `${nosPct}%`;
      }
      if (nitroActive !== this.lastNosBurn) {
        this.lastNosBurn = nitroActive;
        this.el.nosFill.classList.toggle('burning', nitroActive);
      }
    }
    if (this.el.gtaClock && this.frameCount % 12 === 0) {
      const totalMins = Math.floor((((this.dayTime % 24) + 24) % 24) * 60);
      const hrs = Math.floor(totalMins / 60) % 24;
      const mins = totalMins % 60;
      const clk = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      if (clk !== this.lastClockStr) {
        this.lastClockStr = clk;
        this.el.gtaClock.textContent = clk;
      }
    }
    this.odometerKm += (carAbsSpd * dt) / 1000;

    let zoneText = 'Ocean Beach · Ocean Drive';
    let shortStreet = 'Ocean Drive';
    if (!isInCoreViceFootprint(act.x, act.z) && !isInLegacyMountains(act.x, act.z)) {
      const lz = getLeonidaZone(act.x, act.z);
      zoneText = lz.zone;
      shortStreet = lz.street;
    } else if (act.x < -492 && act.z > -760 && act.z < 240) { zoneText = act.y > 74 ? 'Sierra West · Redrock Overlook (96M)' : 'Sierra West · Redrock Scenic Loop'; shortStreet = 'Sierra West'; }
    else if (act.x > -455 && act.x < -302 && act.z > -1248 && act.z < -1138) { zoneText = 'Vice Hollow · Countryside Community'; shortStreet = 'Vice Hollow'; }
    else if (act.x < -360 && act.z > -1138 && act.z < -955) { zoneText = 'Vice Pines · Deep Forest'; shortStreet = 'Vice Pines'; }
    else if (act.z < -1115) { zoneText = act.y > 92 ? 'Mount Vice Summit · 118M' : 'Mount Vice Switchback Loop'; shortStreet = 'Mount Vice'; }
    else if (act.x > -86 && act.x < -14 && act.z > -1048 && act.z < -988) { zoneText = 'North Point Mall · 2-Story Concourse'; shortStreet = 'North Point Mall'; }
    else if (act.x > -44 && act.x < -15 && act.z > -358 && act.z < -330) { zoneText = 'The Malibu Club · Disco VIP Lounge'; shortStreet = 'Malibu Club'; }
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
          this.checkScavengerUnlocks();
          this.savePersistentSave();
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

  updateAmbientZoneAudio(act, isPlane, isRide, dt) {
    if (!this.audio || typeof this.audio.setAmbientZones !== 'function') return;
    const w = this._ambientWeights;
    const x = act.x;
    const y = act.y || 0;
    const z = act.z;

    // 1. THE MALIBU CLUB (interior at x:[-41.4..-18.6], z:[-354.4..-333.6] + curbside bleed)
    let malibuW = 0;
    if (x >= -42.5 && x <= -17.5 && z >= -355.5 && z <= -332.5) {
      malibuW = 1.0;
    } else {
      const dxM = Math.max(-42.5 - x, 0, x - (-17.5));
      const dzM = Math.max(-355.5 - z, 0, z - (-332.5));
      const dM = Math.hypot(dxM, dzM);
      if (dM < 44) {
        malibuW = (1 - dM / 44) * 0.52;
      }
    }

    // 2. VICE CARNIVAL PIER (pier deck x:[18..138], z:[-450..-410] + boardwalk approach + pier rides)
    let carnivalW = 0;
    if (isRide && this.activeRide && !this.activeRide.ropewayKey) {
      carnivalW = 1.0;
    } else {
      const dxC = Math.max(18 - x, 0, x - 138);
      const dzC = Math.max(-450 - z, 0, z - (-410));
      const dC = Math.hypot(dxC, dzC);
      if (dC <= 12) carnivalW = 1.0;
      else if (dC < 78) carnivalW = 1 - (dC - 12) / 66;
    }

    // 3. FORESTS & MOUNTAINS (Vice Pines, Mount Vice, Sierra West, Mount Kalaga, Ropeways, Swamps & Dense Leonida Woodland Corridors)
    let forestW = 0;
    if (isRide && this.activeRide && this.activeRide.ropewayKey) {
      forestW = 1.0;
    } else {
      // 3a. Vice Pines Deep Forest (x < -345, z in [-1155..-940])
      const dxVP = Math.max(0, x - (-345));
      const dzVP = Math.max(-1155 - z, 0, z - (-940));
      const dVP = Math.hypot(dxVP, dzVP);
      if (dVP < 55) forestW = Math.max(forestW, 1 - dVP / 55);

      // 3b. Mount Vice & northern foothills (z < -1110 inside legacy mountains)
      if (z < -1085 && x > -620 && x < 160) {
        forestW = Math.max(forestW, THREE.MathUtils.clamp((-1085 - z) / 55, 0, 1));
      }

      // 3c. Sierra West Peaks & Redrock mountains (x < -470, z in [-790..260])
      if (x < -460 && z > -790 && z < 260) {
        forestW = Math.max(forestW, THREE.MathUtils.clamp((-460 - x) / 55, 0, 1));
      }

      // 3d. Mount Kalaga National Park & Summit (around (-1080, -2250))
      const dKalaga = Math.hypot(x + 1080, z + 2250);
      if (dKalaga < 460) {
        forestW = Math.max(forestW, THREE.MathUtils.clamp(1 - (dKalaga - 280) / 180, 0, 1));
      }

      // 3e. Elevation mountain ambience anywhere above 14m terrain
      if (!isPlane && y > 14) {
        forestW = Math.max(forestW, THREE.MathUtils.clamp((y - 14) / 22, 0, 1));
      }

      // 3f. Leonida dense forest corridors, swamps & alpine timber towns (outside core Vice City)
      if (!isInCoreViceFootprint(x, z) && !isInLegacyMountains(x, z) && getLandFactor(x, z) > 0.12) {
        let inUrbanTown = false;
        let inNaturePlace = false;
        for (let i = 0; i < LEONIDA_PLACES.length; i++) {
          const pl = LEONIDA_PLACES[i];
          const d = Math.hypot(x - pl.x, z - pl.z);
          if (pl.kind === 'mountain' || pl.kind === 'alpine' || pl.kind === 'swamp') {
            if (d < pl.radius + 90) { inNaturePlace = true; break; }
          } else if (d < pl.radius * 0.92) {
            inUrbanTown = true;
            break;
          }
        }
        if (inNaturePlace) {
          forestW = Math.max(forestW, 0.95);
        } else if (!inUrbanTown) {
          forestW = Math.max(forestW, 0.78);
        }
      }
    }

    // 4. NORTH POINT MALL INTERIOR (standalone 68m x 54m mall at X=-50, Z=-1018, bounds x:[-82..-18], z:[-1043..-993])
    let mallW = 0;
    if (!isPlane) {
      if (x >= -82.0 && x <= -18.0 && z >= -1043.0 && z <= -993.0) {
        mallW = 1.0;
      } else if (x > -18.0 && x < -12.5 && z >= -1028.0 && z <= -1008.0) {
        // Short doorway fade right at the East main entrance glass foyer
        mallW = (1 - (x - (-18.0)) / 5.5) * 0.45;
      }
    }

    // 5. AIRPORT AMBIENCE (strictly inside Escobar / Vice Int'l Airport perimeter fence or regional airfield compounds)
    // Zero bleed outside the airport gates/fence; smoothly fades in/out via vice-audio.js envelope, and ducks to 0 once inside a plane.
    let airportW = 0;
    if (!isPlane) {
      if (x >= -274 && x <= -10 && z >= 30 && z <= 154) {
        airportW = 1.0;
      } else {
        for (let i = 0; i < LEONIDA_PLACES.length; i++) {
          const pl = LEONIDA_PLACES[i];
          if (pl.kind !== 'airport') continue;
          if (Math.hypot(x - pl.x, z - pl.z) <= pl.radius * 0.72) {
            airportW = 1.0;
            break;
          }
        }
      }
    }

    // Fade ground ambience smoothly when flying high above the treetops/city in an aircraft
    if (isPlane && y > 32) {
      const airFade = THREE.MathUtils.clamp(1 - (y - 32) / 55, 0, 1);
      malibuW *= airFade;
      carnivalW *= airFade;
      forestW *= airFade;
    }

    // Prioritize Malibu, Carnival, Airport & Mall over forest if overlapping near borders
    forestW *= Math.max(0, 1 - Math.max(malibuW, carnivalW, airportW, mallW));

    w.malibu = malibuW;
    w.carnival = carnivalW;
    w.forest = forestW;
    w.airport = airportW;
    w.mall = mallW;
    this.audio.setAmbientZones(w, dt);
    if (typeof this.audio.updatePlaneAudio === 'function') {
      const fixedWing = isPlane && this.activePlane && !this.activePlane.isHeli;
      this.audio.updatePlaneAudio(fixedWing, dt);
    }
    // Dynamic Ocean Surf + Downtown City Hum Procedural Soundscape!
    if (typeof this.audio.setAtmosphereLevels === 'function') {
      const nearOcean = this.mode === 'boat' ? 1.0 : THREE.MathUtils.clamp((x - 10) / 36, 0, 1);
      const inCity = (!isPlane && x < 12 && x > -220 && z < 20 && z > -940) ? 0.72 : 0.08;
      this.audio.setAtmosphereLevels(nearOcean * (1 - mallW), inCity * (1 - malibuW) * (1 - mallW));
    }
  }

  /* =========================================================================
     ALL 12 ENHANCEMENTS: SAVE/LOAD, GRAPHICS PRESET, MODS & DAMAGE,
     BOATS, SIDE MISSIONS, SKY-RINGS, SCAVENGER HUNT & VICEFRUIT SMARTPHONE
     ========================================================================= */

  loadPersistentSave() {
    try {
      const raw = localStorage.getItem('vice3d_save_v2');
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.cash === 'number' && Number.isFinite(d.cash)) this.cash = Math.max(0, d.cash);
      if (Array.isArray(d.visited)) d.visited.forEach((id) => this.visited.add(id));
      if (typeof d.paintIdx === 'number') this.paintIdx = ((d.paintIdx % PAINTS.length) + PAINTS.length) % PAINTS.length;
      if (d.carMods && typeof d.carMods === 'object') this.carMods = { ...this.carMods, ...d.carMods };
      if (Array.isArray(d.savedGarage)) this.savedGarage = d.savedGarage.slice(0, 6);
      if (d.graphicsPreset && ['low', 'med', 'high'].includes(d.graphicsPreset)) this.graphicsPreset = d.graphicsPreset;
      if (typeof d.missionsCompleted === 'number') this.missionsCompleted = d.missionsCompleted;
      if (typeof d.stuntJumpsDone === 'number') this.stuntJumpsDone = d.stuntJumpsDone;
    } catch (_) {}
  }

  savePersistentSave() {
    try {
      localStorage.setItem('vice3d_save_v2', JSON.stringify({
        cash: this.cash,
        visited: Array.from(this.visited),
        paintIdx: this.paintIdx,
        carMods: this.carMods,
        savedGarage: (this.savedGarage || []).slice(0, 6),
        graphicsPreset: this.graphicsPreset,
        missionsCompleted: this.missionsCompleted || 0,
        stuntJumpsDone: this.stuntJumpsDone || 0
      }));
    } catch (_) {}
  }

  resetPersistentSave() {
    try {
      localStorage.removeItem('vice3d_save_v2');
      localStorage.removeItem('vice3d_style_v1');
    } catch (_) {}
    this.cash = 1000;
    this.visited.clear();
    this.carMods = {
      underglow: 'none', spoiler: false, goldChrome: false,
      turboStage: 0, rims: 'stock', hydraulics: false, hornTune: 'classic'
    };
    this.savedGarage = [];
    this.carHealth = 100;
    this.missionsCompleted = 0;
    this.stuntJumpsDone = 0;
    this.applyCarMods();
    this.updateCarHealthHUD();
    if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
    if (this.el.progress) this.el.progress.textContent = `0 / 5 Projects · ${this.tokensCollected} / ${this.tokens.length} Cash Piles`;
    this.el.combo.innerHTML = `SAVE DATA RESET <span>FRESH START</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.4;
  }

  applyGraphicsPreset(preset = 'high', save = true) {
    this.graphicsPreset = ['low', 'med', 'high'].includes(preset) ? preset : 'high';
    const dpr = Math.min(window.devicePixelRatio || 1, this.graphicsPreset === 'high' ? 1.35 : (this.graphicsPreset === 'med' ? 1.05 : 0.8));
    if (this.renderer) {
      this.renderer.setPixelRatio(dpr);
      this.renderer.shadowMap.enabled = this.graphicsPreset !== 'low';
    }
    if (this.bloomPass) {
      this.bloomPass.enabled = this.graphicsPreset === 'high';
    }
    if (this.camera) {
      this.camera.far = this.graphicsPreset === 'low' ? 1800 : (this.graphicsPreset === 'med' ? 2600 : 3600);
      this.camera.updateProjectionMatrix();
      if (this.skyDome) {
        const safeSkyScale = Math.min(1.65, (this.camera.far * 0.78) / 1750);
        this.skyDome.scale.setScalar(safeSkyScale);
      }
    }
    this.trafficCullSq = this.graphicsPreset === 'low' ? 16900 : (this.graphicsPreset === 'med' ? 32400 : 48400);
    if (this.el && this.el.gfxBtn) {
      const lbl = this.graphicsPreset === 'high' ? 'High' : (this.graphicsPreset === 'med' ? 'Med' : 'Low');
      this.el.gfxBtn.textContent = `GFX: ${lbl}`;
      this.el.gfxBtn.classList.toggle('on', this.graphicsPreset === 'high');
    }
    if (save) {
      this.savePersistentSave();
      this.el.combo.innerHTML = `GRAPHICS PRESET · ${this.graphicsPreset.toUpperCase()} <span>LIVE</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.0;
    }
  }

  getActiveVehicleMods() {
    if (!this.activeVehicle || this.activeVehicle.isHero) return this.carMods;
    if (!this.activeVehicle.customMods) {
      this.activeVehicle.customMods = {
        underglow: 'none', spoiler: false, goldChrome: false,
        turboStage: 0, rims: 'stock', hydraulics: false, hornTune: 'classic'
      };
    }
    return this.activeVehicle.customMods;
  }

  ensureVehicleModMeshes(root, rig, isHero = false) {
    if (!root || !rig) return null;
    let cache = this._vehicleModCache.get(root);
    if (cache) return cache;

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff2e88, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide
    });
    const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.32, 4.7), glowMat);
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.set(0, 0.09, 0);
    glowPlane.visible = false;
    root.add(glowPlane);

    const spGroup = new THREE.Group();
    const carbMat = new THREE.MeshStandardMaterial({ color: 0x12151e, roughness: 0.25, metalness: 0.72 });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.08, 0.42), carbMat);
    wing.position.set(0, isHero ? 1.18 : 1.24, isHero ? 2.02 : 1.92);
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.24), carbMat);
    strutL.position.set(-0.62, isHero ? 0.99 : 1.05, isHero ? 1.98 : 1.88);
    const strutR = strutL.clone(); strutR.position.x = 0.62;
    const endMat = new THREE.MeshStandardMaterial({ color: 0xff2e88, emissive: 0xff2e88, emissiveIntensity: 0.5 });
    const endL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.48), endMat);
    endL.position.set(-0.97, isHero ? 1.18 : 1.24, isHero ? 2.02 : 1.92);
    const endR = endL.clone(); endR.position.x = 0.97;
    spGroup.add(wing, strutL, strutR, endL, endR);
    spGroup.visible = false;
    (rig.bodyGroup || root).add(spGroup);

    // Custom glowing 3D Rim Halo Rings mounted onto each wheel spin group
    const rimRingMat = new THREE.MeshBasicMaterial({ color: 0x21e6d1, side: THREE.DoubleSide });
    const rimRingGeo = new THREE.TorusGeometry(isHero ? 0.27 : 0.24, 0.024, 8, 20);
    const rimRings = [];
    const spins = rig.wheelSpinGroups || rig.wheels || [];
    for (let i = 0; i < spins.length; i++) {
      const wg = spins[i];
      if (!wg) continue;
      const ring = new THREE.Mesh(rimRingGeo, rimRingMat);
      ring.rotation.y = Math.PI / 2;
      const sideSign = (i % 2 === 0) ? -1 : 1;
      ring.position.set(sideSign * (isHero ? 0.16 : 0.14), 0, 0);
      ring.visible = false;
      wg.add(ring);
      rimRings.push(ring);
    }

    cache = { glowPlane, glowMat, spGroup, rimRings, rimRingMat };
    this._vehicleModCache.set(root, cache);
    return cache;
  }

  setupCarModMeshes() {
    if (!this.car || !this.car.root || this._carModMeshesReady) return;
    this._carModMeshesReady = true;
    const c = this.ensureVehicleModMeshes(this.car.root, this.car, true);
    if (c) {
      this._carUnderglow = c.glowPlane;
      this._carUnderglowMat = c.glowMat;
      this._carSpoiler = c.spGroup;
    }
  }

  applyModsToRig(root, rig, mods, isHero = false) {
    if (!root || !rig || !mods || rig.isBike) return;
    const c = this.ensureVehicleModMeshes(root, rig, isHero);
    if (c) {
      const ug = mods.underglow || 'none';
      c.glowPlane.visible = ug !== 'none';
      if (ug === 'pink') c.glowMat.color.setHex(0xff2e88);
      else if (ug === 'cyan') c.glowMat.color.setHex(0x21e6d1);
      else if (ug === 'gold') c.glowMat.color.setHex(0xffd36b);
      c.spGroup.visible = Boolean(mods.spoiler);

      const rimStyle = mods.rims || 'stock';
      const isCyan = rimStyle === 'neon_cyan' || rimStyle === 'cyan';
      const isPink = rimStyle === 'hot_pink' || rimStyle === 'pink';
      const isGold = rimStyle === 'gold_mesh' || rimStyle === 'gold';
      const isStealth = rimStyle === 'stealth_black' || rimStyle === 'stealth';
      const isChrome = rimStyle === 'chrome_deep' || rimStyle === 'chrome';
      const showHalo = isCyan || isPink || isGold;
      if (isCyan) c.rimRingMat.color.setHex(0x21e6d1);
      else if (isPink) c.rimRingMat.color.setHex(0xff2e88);
      else if (isGold) c.rimRingMat.color.setHex(0xffd36b);
      for (let i = 0; i < c.rimRings.length; i++) c.rimRings[i].visible = showHalo;
    }
    if (rig.rimMat) {
      const rimStyle = mods.rims || 'stock';
      if (rimStyle === 'gold_mesh' || rimStyle === 'gold') {
        rig.rimMat.color.setHex(0xffc947); rig.rimMat.metalness = 0.96; rig.rimMat.roughness = 0.14;
        if (rig.rimMat.emissive) rig.rimMat.emissive.setHex(0x3a2600);
      } else if (rimStyle === 'neon_cyan' || rimStyle === 'cyan') {
        rig.rimMat.color.setHex(0x21e6d1); rig.rimMat.metalness = 0.85; rig.rimMat.roughness = 0.18;
        if (rig.rimMat.emissive) rig.rimMat.emissive.setHex(0x0b5e58);
      } else if (rimStyle === 'hot_pink' || rimStyle === 'pink') {
        rig.rimMat.color.setHex(0xff2e88); rig.rimMat.metalness = 0.85; rig.rimMat.roughness = 0.18;
        if (rig.rimMat.emissive) rig.rimMat.emissive.setHex(0x5c0c30);
      } else if (rimStyle === 'stealth_black' || rimStyle === 'stealth') {
        rig.rimMat.color.setHex(0x161820); rig.rimMat.metalness = 0.55; rig.rimMat.roughness = 0.42;
        if (rig.rimMat.emissive) rig.rimMat.emissive.setHex(0x000000);
      } else if (rimStyle === 'chrome_deep' || rimStyle === 'chrome') {
        rig.rimMat.color.setHex(0xf4f7ff); rig.rimMat.metalness = 1.0; rig.rimMat.roughness = 0.04;
        if (rig.rimMat.emissive) rig.rimMat.emissive.setHex(0x10141c);
      } else {
        rig.rimMat.color.setHex(0xd4dce6); rig.rimMat.metalness = 0.88; rig.rimMat.roughness = 0.22;
        if (rig.rimMat.emissive) rig.rimMat.emissive.setHex(0x000000);
      }
    }
    if (rig.paintMat) {
      if (mods.goldChrome) {
        rig.paintMat.color.setHex(0xffd24c);
        rig.paintMat.metalness = 0.98;
        rig.paintMat.roughness = 0.08;
      } else if (isHero && this.car && this.car.applyPaint) {
        this.car.applyPaint(this.paintIdx);
      } else if (typeof mods.paintHex === 'number') {
        rig.paintMat.color.setHex(mods.paintHex);
        rig.paintMat.metalness = 0.72;
        rig.paintMat.roughness = 0.22;
      }
    }
  }

  applyCarMods() {
    if (this.car && this.car.root) {
      this.applyModsToRig(this.car.root, this.car, this.carMods, true);
    }
    if (this.activeVehicle && !this.activeVehicle.isHero && !this.activeVehicle.isBike && this.activeVehicle.mesh && this.activeVehicle.rig) {
      this.applyModsToRig(this.activeVehicle.mesh, this.activeVehicle.rig, this.getActiveVehicleMods(), false);
    }
  }

  triggerHydraulicsBounce(toggleDance = false) {
    if (this.mode !== 'car' || !this.activeVehicle || this.activeVehicle.isBike) return;
    const mods = this.getActiveVehicleMods();
    if (!mods.hydraulics) return;
    const hs = this.hydraulicsState;
    if (toggleDance) {
      hs.mode = (hs.mode + 1) % 3;
      const modeNames = ['OFF', 'LOWRIDER BOUNCE', '3-WHEEL TILT DANCE'];
      if (this.audio && typeof this.audio.hydraulicsBounce === 'function') this.audio.hydraulicsBounce();
      this.el.combo.innerHTML = `HYDRAULICS · ${modeNames[hs.mode]} <span>SHIFT+H TO CYCLE</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.4;
      return;
    }
    hs.bounceVel = Math.max(hs.bounceVel, 2.85);
    hs.bounceY = Math.max(hs.bounceY, 0.06);
    if (this.audio && typeof this.audio.hydraulicsBounce === 'function') this.audio.hydraulicsBounce();
    const cs = this.carState;
    for (let i = 0; i < 4; i++) {
      this.spawnParticle(
        cs.x + (Math.random() - 0.5) * 1.6, cs.y + 0.14, cs.z + (Math.random() - 0.5) * 3.0,
        (Math.random() - 0.5) * 2.2, 0.65, (Math.random() - 0.5) * 2.2,
        0xdcf7ff, 0.35, 0.28, 1.3, 1.2
      );
    }
    this.el.combo.innerHTML = `HYDRAULICS HOP! <span>SHIFT+H FOR CONTINUOUS BOUNCE</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 1.6;
  }

  saveCurrentVehicleToGarage() {
    if (!this.activeVehicle) {
      this.el.combo.innerHTML = `GET IN A VEHICLE FIRST <span>DRIVE INTO PAY 'N' SPRAY</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.0;
      return;
    }
    const v = this.activeVehicle;
    const mods = { ...this.getActiveVehicleMods() };
    const paintHex = v.isHero
      ? PAINTS[this.paintIdx].color
      : (typeof mods.paintHex === 'number' ? mods.paintHex : (v.rig && v.rig.paintMat ? v.rig.paintMat.color.getHex() : 0x21e6d1));
    const entry = {
      id: `gar-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      label: v.label || 'CUSTOM RIDE',
      isHero: Boolean(v.isHero),
      isBike: Boolean(v.isBike),
      bikeKind: v.isBike ? (v.rig && v.rig.kind ? v.rig.kind : 'pcj600') : null,
      archetype: !v.isHero && !v.isBike ? (v.rig && v.rig.archetype ? v.rig.archetype : 'sports') : null,
      paintIdx: this.paintIdx,
      paintHex,
      mods
    };
    if (!Array.isArray(this.savedGarage)) this.savedGarage = [];
    const existingHeroIdx = entry.isHero ? this.savedGarage.findIndex((g) => g.isHero) : -1;
    if (existingHeroIdx >= 0) {
      this.savedGarage[existingHeroIdx] = entry;
    } else if (this.savedGarage.length >= 6) {
      this.savedGarage.shift();
      this.savedGarage.push(entry);
    } else {
      this.savedGarage.push(entry);
    }
    this.savePersistentSave();
    if (this.audio) this.audio.pickup();
    this.el.combo.innerHTML = `SAVED TO GARAGE · ${entry.label} <span>${this.savedGarage.length}/6 SLOTS · CALL VIA PHONE [I]</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.8;
  }

  spawnGarageVehicle(idx) {
    if (!Array.isArray(this.savedGarage) || !this.savedGarage[idx]) return;
    const g = this.savedGarage[idx];
    this.togglePhone(false);
    if (this.activeShop && typeof this.closeShopMenu === 'function') this.closeShopMenu(true);
    const act = this.mode === 'foot' ? this.playerState : this.carState;
    const inPns = Math.hypot(act.x + 66.5, act.z + 182.0) < 10.5;
    const sx = inPns ? -64.0 : act.x + 4.2;
    const sz = inPns ? -182.0 : act.z + 2.4;
    const sy = this.getSurfaceY(sx, sz, false) + 0.05;
    const syaw = inPns ? -Math.PI / 2 : (act.yaw || 0);

    if (g.isHero) {
      if (typeof g.paintIdx === 'number') this.paintIdx = ((g.paintIdx % PAINTS.length) + PAINTS.length) % PAINTS.length;
      if (g.mods) this.carMods = { ...this.carMods, ...g.mods };
      this.activeVehicle = this.heroVehicle;
      this.carHealth = 100;
      this.updateCarHealthHUD();
      this.carState.x = sx; this.carState.y = sy; this.carState.z = sz;
      this.carState.yaw = syaw; this.carState.speed = 0; this.carState.vy = 0; this.carState.airborne = false;
      this.setMode('car');
      this.applyCarMods();
    } else if (g.isBike) {
      const rig = createMotorcycle(g.bikeKind || 'pcj600', g.paintHex || 0xff2e88);
      rig.root.position.set(sx, sy, sz);
      rig.root.rotation.y = syaw;
      this.scene.add(rig.root);
      const pv = {
        isHero: false, isBike: true, label: g.label || rig.label,
        mesh: rig.root, rig,
        topSpeed: rig.topSpeed, nitroSpeed: rig.topSpeed * 1.34,
        accel: rig.accel, grip: rig.grip,
        x: sx, y: sy, z: sz, yaw: syaw,
        customMods: { ...(g.mods || {}), paintHex: g.paintHex }
      };
      this.enterParkedVehicle(pv, -1);
    } else {
      const mesh = createTrafficCar(g.paintHex || 0x21e6d1, g.archetype || 'sports');
      mesh.position.set(sx, sy, sz);
      mesh.rotation.y = syaw;
      this.scene.add(mesh);
      const rig = mesh.userData.carRig;
      const pv = {
        isHero: false, isBike: false, label: g.label || rig.label,
        mesh, rig,
        topSpeed: rig.topSpeed || 46, nitroSpeed: (rig.topSpeed || 46) * 1.32,
        accel: rig.accel || 22, grip: rig.grip || 0.94,
        x: sx, y: sy, z: sz, yaw: syaw,
        customMods: { ...(g.mods || {}), paintHex: g.paintHex }
      };
      this.carHealth = 100;
      this.updateCarHealthHUD();
      this.enterParkedVehicle(pv, -1);
      this.applyCarMods();
    }
    this.snapCameraNext = true;
    if (this.audio) this.audio.phoneChime();
    this.el.combo.innerHTML = `GARAGE DELIVERED · ${g.label} <span>100% TUNED</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.8;
  }

  damageCar(amount) {
    if (this.mode !== 'car') return;
    this.carHealth = Math.max(8, this.carHealth - amount);
    this.updateCarHealthHUD();
  }

  updateCarHealthHUD() {
    if (!this.el || !this.el.vehHpFill) return;
    const pct = Math.round(THREE.MathUtils.clamp(this.carHealth, 0, 100));
    this.el.vehHpFill.style.width = `${pct}%`;
    this.el.vehHpFill.classList.toggle('warn', pct < 50 && pct >= 25);
    this.el.vehHpFill.classList.toggle('crit', pct < 25);
  }

  checkScavengerUnlocks() {
    const cnt = this.visited.size;
    for (let i = 0; i < SCAVENGER_UNLOCKS.length; i++) {
      const u = SCAVENGER_UNLOCKS[i];
      if (cnt === u.count) {
        if (u.id === 'vip-chopper' || u.id === 'vip_chopper') {
          this.cash += 2500;
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        }
        if (this.audio) this.audio.phoneChime();
        this.el.combo.innerHTML = `SCAVENGER UNLOCK (${cnt}/5): ${u.title.toUpperCase()} <span>CHECK PHONE [I]</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 4.5;
      }
    }
  }

  togglePhone(forceState) {
    const next = typeof forceState === 'boolean' ? forceState : !this.phoneOpen;
    this.phoneOpen = next;
    if (this.el && this.el.phone) this.el.phone.hidden = !next;
    if (next) {
      this.releasePointerLock();
      this.fireHeld = false;
      if (this.audio) this.audio.phoneChime();
      this.renderPhoneScreen('home');
      if (this.el && this.el.uiCursor) {
        const cx = typeof this.lastClientX === 'number' ? this.lastClientX : Math.max(120, window.innerWidth - 160);
        const cy = typeof this.lastClientY === 'number' ? this.lastClientY : Math.max(120, window.innerHeight - 280);
        this.el.uiCursor.style.transform = `translate3d(${(cx - 3).toFixed(1)}px, ${(cy - 2).toFixed(1)}px, 0)`;
        this.el.uiCursor.classList.add('on');
      }
    }
    this.syncReticleVisibility();
  }

  renderPhoneScreen(app = 'home') {
    this.phoneApp = app;
    if (!this.el || !this.el.phoneScreen) return;
    if (this.el.phoneClock) {
      const totalMins = Math.floor((((this.dayTime % 24) + 24) % 24) * 60);
      this.el.phoneClock.textContent = `${String(Math.floor(totalMins / 60) % 24).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
    }
    if (this.el.phoneCash) {
      this.el.phoneCash.textContent = `$${this.cash.toLocaleString()}`;
    }
    const scr = this.el.phoneScreen;
    scr.innerHTML = '';

    if (app === 'home') {
      const grid = document.createElement('div');
      grid.className = 'v3-phone-grid';
      const apps = [
        { id: 'mechanic', ico: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 3.5a4 4 0 0 0-5.1 5.1L3.2 13.8a1.6 1.6 0 1 0 2.3 2.3l5.2-5.2a4 4 0 0 0 5.1-5.1l-2.1 2.1-2.3-2.3 2.1-2.1Z"/></svg>', lbl: 'Mechanic' },
        { id: 'missions', ico: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17V3.5M4 4h11l-2.2 3.5L15 11H4"/></svg>', lbl: 'Jobs' },
        { id: 'portfolio', ico: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="14" height="10" rx="1.6"/><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6"/></svg>', lbl: 'Portfolio' },
        { id: 'taxi', ico: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11.5L5 7.2A2 2 0 0 1 6.9 6h6.2a2 2 0 0 1 1.9 1.2l1.5 4.3"/><rect x="2.5" y="11" width="15" height="4.5" rx="1.2"/><path d="M8 6V4h4v2"/></svg>', lbl: 'Cab Co.' },
        { id: 'camera', ico: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6.5h2.5L7 4.5h6l1.5 2H17a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 17 16.5H3A1.5 1.5 0 0 1 1.5 15V8A1.5 1.5 0 0 1 3 6.5Z"/><circle cx="10" cy="11.2" r="2.7"/></svg>', lbl: 'Snapmatic' },
        { id: 'settings', ico: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="2.8"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"/></svg>', lbl: 'Settings' }
      ];
      apps.forEach((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'v3-phone-app';
        b.innerHTML = `<span class="v3-phone-app-ic" aria-hidden="true">${a.ico}</span><span>${a.lbl}</span>`;
        b.addEventListener('click', () => {
          if (a.id === 'camera') this.takeSnapmaticPhoto();
          else this.renderPhoneScreen(a.id);
        });
        grid.appendChild(b);
      });
      scr.appendChild(grid);
      const stat = document.createElement('div');
      stat.className = 'v3-phone-summary';
      stat.innerHTML = `<b style="color:#4BD36B">$${this.cash.toLocaleString()}</b> · Showrooms <b style="color:#21E6D1">${this.visited.size}/5</b><br>Jobs Done: ${this.missionsCompleted} · Garage: ${(this.savedGarage || []).length}/6`;
      scr.appendChild(stat);
      return;
    }

    const head = document.createElement('div');
    head.className = 'v3-phone-subhead';
    head.innerHTML = `<strong>${app.toUpperCase()}</strong><button type="button" class="v3-phone-back">← Back</button>`;
    head.querySelector('.v3-phone-back').addEventListener('click', () => this.renderPhoneScreen('home'));
    scr.appendChild(head);

    const list = document.createElement('div');
    list.className = 'v3-phone-list';
    scr.appendChild(list);

    const addRow = (title, sub, pillTxt, onClick, disabled = false) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v3-phone-row' + (disabled ? ' locked' : '');
      btn.disabled = disabled;
      btn.innerHTML = `<div><div class="v3-phone-row-title">${title}</div><div class="v3-phone-row-sub">${sub}</div></div><span class="v3-phone-pill">${pillTxt}</span>`;
      if (!disabled && onClick) btn.addEventListener('click', onClick);
      list.appendChild(btn);
    };

    if (app === 'mechanic') {
      if (Array.isArray(this.savedGarage) && this.savedGarage.length > 0) {
        this.savedGarage.forEach((g, idx) => {
          const tStg = g.mods && g.mods.turboStage ? `Turbo S${g.mods.turboStage}` : 'Stock';
          const hyd = g.mods && g.mods.hydraulics ? ' · Hydraulics' : '';
          addRow(`★ ${g.label}`, `Saved Garage · ${tStg}${hyd}`, 'DELIVER', () => this.spawnGarageVehicle(idx));
        });
      }
      addRow('Personal Vice Supercar', 'Instant roadside delivery + full repair', 'CALL', () => this.summonMechanicVehicle('hero'));
      addRow('PCJ-600 Streetbike', 'Fast two-wheeler right beside you', 'CALL', () => this.summonMechanicVehicle('bike'));
      const hyperOk = this.visited.size >= 3;
      addRow('Infernus Apex V12 Hypercar', hyperOk ? 'Unlocked! 230 MPH tuned hypercar' : `Discover 3/5 showrooms (${this.visited.size}/3)`, hyperOk ? 'DELIVER' : 'LOCKED', () => this.summonMechanicVehicle('hyper'), !hyperOk);
      const heliOk = this.visited.size >= 5;
      addRow('VIP Maverick Chopper', heliOk ? 'Unlocked! Summon VTOL helicopter' : `Discover 5/5 showrooms (${this.visited.size}/5)`, heliOk ? 'SUMMON' : 'LOCKED', () => this.summonMechanicVehicle('heli'), !heliOk);
      addRow("GPS → Pay 'n' Spray Mod Shop", 'Turbo, Rims, Hydraulics, Horns & Garage', 'GPS', () => {
        this.togglePhone(false);
        this.planAutopilotTo({ id: 'pns', label: "Pay 'n' Spray", x: -64, z: -182, yaw: 0 });
      });
    } else if (app === 'missions') {
      addRow('🍕 Pizza Boy Faggio Run', '5 timed scooter deliveries ($1,400+)', 'RIDE', () => { this.togglePhone(false); this.startPizzaBoyJob(); });
      addRow('🌊 Jet-Ski Ocean Slalom', '8 glowing Atlantic buoy gates ($1,350)', 'RACE', () => { this.togglePhone(false); this.startJetSkiTimeTrial(); });
      addRow('🏐 Vice Beach Volleyball', '8-hit sand court rally challenge ($750)', 'PLAY', () => { this.togglePhone(false); this.startBeachVolleyball(); });
      addRow('🔥 Red-Light Street Racer', 'Spawn live neon rival ahead ($1,200)', 'SPAWN', () => { this.togglePhone(false); this.spawnDynamicStreetEvent('racer'); });
      addRow('💀 Rival Gang Turf Raid', 'Clear rival crew & loot stash ($950)', 'RAID', () => { this.togglePhone(false); this.spawnDynamicStreetEvent('gang'); });
      addRow('Taxi Fare Driver Job', 'Pick up & drop off passengers ($350+)', 'START', () => { this.togglePhone(false); this.startTaxiJob(); });
      addRow('Leonida Street Race', '10-gate Vice Beach circuit ($1,800 prize)', 'RACE', () => { this.togglePhone(false); this.startStreetRace(); });
      addRow('Ammu-Nation Shooting Range', 'Hit 10 moving indoor targets ($400)', 'PLAY', () => { this.togglePhone(false); this.startIndoorRange(); });
      addRow('Aerial Sky-Rings Flight', 'Fly to marina chopper & clear golden rings', 'WARP', () => {
        this.togglePhone(false);
        const h = this.flyablePlanes.find((p) => p.isHeli);
        if (h) this.enterPlane(h);
      });
      if (this.activeSideMission) {
        addRow('Cancel Active Job', 'Abort current side mission', 'ABORT', () => { this.abortSideMission(); this.renderPhoneScreen('missions'); });
      }
    } else if (app === 'taxi') {
      addRow('Hail Kaufman Cab Ride', 'Fast-travel anywhere in Vice City', 'BOOK', () => { this.togglePhone(false); this.openTaxiModal(); });
      addRow('Drive Taxi Fare Shift', 'Earn cash picking up local fares', 'DRIVE', () => { this.togglePhone(false); this.startTaxiJob(); });
    } else if (app === 'portfolio') {
      SHOWROOMS.forEach((sr) => {
        const vis = this.visited.has(sr.id);
        addRow(`${vis ? '✓ ' : ''}${sr.title}`, `${sr.district} · ${sr.stat}`, vis ? 'OPEN' : 'GPS', () => {
          this.togglePhone(false);
          if (vis) this.openShowroomModal(sr);
          else {
            const wp = WAYPOINTS.find((w) => w.id === sr.id);
            if (wp) this.planAutopilotTo(wp);
          }
        });
      });
      SCAVENGER_UNLOCKS.forEach((u) => {
        const ok = this.visited.size >= u.count;
        addRow(`${ok ? '★ ' : '🔒 '}${u.title}`, `${u.count}/5 Showrooms · ${u.desc}`, ok ? 'UNLOCKED' : `${this.visited.size}/${u.count}`, null, !ok);
      });
    } else if (app === 'settings') {
      addRow(`Graphics: ${this.graphicsPreset.toUpperCase()}`, 'Tap to switch Low / Med / High', 'CYCLE', () => {
        const order = ['high', 'med', 'low'];
        this.applyGraphicsPreset(order[(order.indexOf(this.graphicsPreset) + 1) % order.length], true);
        this.renderPhoneScreen('settings');
      });
      addRow(`Master Audio: ${this.audio.enabled ? 'ON' : 'OFF'}`, 'Toggle soundtrack & ambient SFX', 'TOGGLE', () => {
        this.el.audioBtn.click();
        this.renderPhoneScreen('settings');
      });
      addRow('Reset Saved Progress', 'Clear cash, unlocks & garage mods', 'RESET', () => {
        this.resetPersistentSave();
        this.renderPhoneScreen('settings');
      });
    }
  }

  summonMechanicVehicle(kind) {
    this.togglePhone(false);
    const act = this.mode === 'foot' ? this.playerState : this.carState;
    const sx = act.x + 4.5, sz = act.z + 2.5;
    if (kind === 'heli') {
      const h = this.flyablePlanes.find((p) => p.isHeli);
      if (h) {
        h.x = act.x + 8.0; h.z = act.z; h.y = Math.max(0.05, this.getSurfaceY(h.x, h.z, false));
        h.speed = 0; h.pitch = 0; h.roll = 0;
        this.syncPlaneTransform(h, 0.016, this.clock.getElapsedTime());
        this.enterPlane(h);
      }
      return;
    }
    if (kind === 'bike') {
      const bikeIdx = this.parkedVehicles.findIndex((pv) => pv.rig && pv.rig.isBike);
      if (bikeIdx >= 0) {
        const b = this.parkedVehicles[bikeIdx];
        b.x = sx; b.z = sz; b.y = this.getSurfaceY(sx, sz, false) + 0.04;
        b.mesh.position.set(b.x, b.y, b.z);
        this.enterParkedVehicle(b, bikeIdx);
      }
      return;
    }
    const cs = this.carState;
    this.activeVehicle = this.heroVehicle;
    this.heroVehicle.topSpeed = kind === 'hyper' ? 68 : 54;
    this.heroVehicle.nitroSpeed = kind === 'hyper' ? 92 : 74;
    this.heroVehicle.label = kind === 'hyper' ? 'INFERNUS APEX V12 HYPERCAR' : 'VICE SUPERCAR';
    this.carHealth = 100;
    this.updateCarHealthHUD();
    cs.x = sx; cs.z = sz; cs.y = this.getSurfaceY(sx, sz, false) + 0.05;
    cs.speed = 0; cs.vy = 0; cs.airborne = false;
    this.setMode('car');
    this.applyCarMods();
    if (this.audio) this.audio.phoneChime();
    this.el.combo.innerHTML = `MECHANIC DELIVERED · ${this.heroVehicle.label} <span>100% HP</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.8;
  }

  takeSnapmaticPhoto() {
    this.togglePhone(false);
    if (this.audio) this.audio.cameraShutter();
    if (this.el && this.el.shutter) {
      this.el.shutter.classList.add('flash');
      setTimeout(() => this.el.shutter && this.el.shutter.classList.remove('flash'), 190);
    }
    try {
      this.renderer.render(this.scene, this.camera);
      const dataUrl = this.renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `vice-city-snapmatic-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (_) {}
    this.el.combo.innerHTML = `SNAPMATIC PHOTO SAVED! <span>PNG DOWNLOADED</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 2.6;
  }

  startTaxiJob() {
    this.abortSideMission();
    if (this.mode !== 'car') this.setMode('car');
    const pickup = TAXI_FARE_SPOTS[Math.floor(Math.random() * TAXI_FARE_SPOTS.length)];
    this.activeSideMission = {
      kind: 'taxi',
      phase: 'pickup',
      faresDone: 0,
      timer: 65,
      target: pickup
    };
    if (this.el.missionBar) this.el.missionBar.hidden = false;
    if (this.audio) this.audio.phoneChime();
    this.el.combo.innerHTML = `TAXI SHIFT STARTED! <span>PICK UP FARE AT ${pickup.name.toUpperCase()}</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.2;
  }

  startStreetRace() {
    this.abortSideMission();
    if (this.mode !== 'car') this.setMode('car');
    const cs = this.carState;
    cs.x = 0; cs.z = -38; cs.yaw = 0; cs.speed = 0;
    cs.y = this.getSurfaceY(cs.x, cs.z, false) + 0.05;
    this.snapCameraNext = true;
    this.activeSideMission = {
      kind: 'race',
      gateIdx: 0,
      timer: 85,
      target: { x: STREET_RACE_GATES[0].x, z: STREET_RACE_GATES[0].z, name: 'Checkpoint 1/10' }
    };
    if (this.el.missionBar) this.el.missionBar.hidden = false;
    if (this.audio) this.audio.phoneChime();
    this.el.combo.innerHTML = `LEONIDA STREET RACE · GO! <span>10 GATES · $1,800 PRIZE</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.2;
  }

  startIndoorRange() {
    this.abortSideMission();
    const ps = this.playerState;
    this.setMode('foot');
    ps.x = -67.5; ps.z = -102; ps.y = 0.22; ps.yaw = Math.PI / 2;
    this.orbitYawOffset = Math.PI / 2;
    this.player.root.position.set(ps.x, ps.y, ps.z);
    this.setWeapon('rifle');
    this.snapCameraNext = true;
    this.activeSideMission = {
      kind: 'indoorRange',
      hits: 0,
      goal: 10,
      timer: 45,
      target: null
    };
    if (this.el.missionBar) this.el.missionBar.hidden = false;
    this.el.combo.innerHTML = `AMMU-NATION RANGE! <span>HIT 10 MOVING TARGETS · $400 PRIZE</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.2;
  }

  startPizzaBoyJob() {
    this.abortSideMission();
    const sx = -10.5, sz = -64.0;
    const sy = this.getSurfaceY(sx, sz, false) + 0.04;
    if (!this._pizzaFaggio) {
      const rig = createMotorcycle('faggio', 0xd92638);
      // Composite 3D Well Stacked Pizza Co. insulated heated rear delivery box!
      const boxGroup = new THREE.Group();
      const rackMat = new THREE.MeshStandardMaterial({ color: 0x262934, metalness: 0.78, roughness: 0.3 });
      const redBoxMat = new THREE.MeshStandardMaterial({ color: 0xe6323e, roughness: 0.34, metalness: 0.12 });
      const lidMat = new THREE.MeshStandardMaterial({ color: 0xfff3de, roughness: 0.38 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xffa020, emissiveIntensity: 0.35, roughness: 0.28 });
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.46), rackMat);
      rack.position.set(0, 0.86, 0.72);
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 0.52), redBoxMat);
      crate.position.set(0, 1.11, 0.74);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.07, 0.56), lidMat);
      lid.position.set(0, 1.35, 0.74);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 0.54), goldMat);
      stripe.position.set(0, 1.14, 0.74);
      boxGroup.add(rack, crate, lid, stripe);
      (rig.bodyGroup || rig.root).add(boxGroup);
      rig.root.position.set(sx, sy, sz);
      rig.root.rotation.y = 0;
      this.scene.add(rig.root);
      this._pizzaFaggio = {
        isHero: false, isBike: true, isPizzaBike: true,
        label: 'PIZZA BOY FAGGIO',
        mesh: rig.root, rig,
        topSpeed: 39, nitroSpeed: 50, accel: 24, grip: 0.96,
        x: sx, y: sy, z: sz, yaw: 0
      };
    } else {
      const pIdx = this.parkedVehicles.indexOf(this._pizzaFaggio);
      if (pIdx >= 0) this.parkedVehicles.splice(pIdx, 1);
      this._pizzaFaggio.x = sx; this._pizzaFaggio.y = sy; this._pizzaFaggio.z = sz; this._pizzaFaggio.yaw = 0;
      this._pizzaFaggio.mesh.position.set(sx, sy, sz);
      this._pizzaFaggio.mesh.rotation.y = 0;
    }
    if (this.activeVehicle === this._pizzaFaggio) {
      this.carState.x = sx; this.carState.y = sy; this.carState.z = sz; this.carState.yaw = 0; this.carState.speed = 0;
      this.setMode('car');
    } else {
      this.enterParkedVehicle(this._pizzaFaggio, -1);
    }
    this.snapCameraNext = true;

    const pool = [
      { x: -16, z: -168, name: 'Ocean View Plaza' },
      { x: -24, z: -344, name: 'The Malibu Club' },
      { x: 18,  z: -248, name: 'Vice Beach Boardwalk' },
      { x: -58, z: -262, name: 'Burger Shot Corner' },
      { x: 20,  z: -424, name: 'Carnival Pier Gate' },
      { x: -46, z: -480, name: 'Downtown Towers' },
      { x: -14, z: -102, name: 'Ammu-Nation Block' }
    ];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    const drops = pool.slice(0, 5);
    this.activeSideMission = {
      kind: 'pizza',
      drops,
      dropIdx: 0,
      delivered: 0,
      timer: 52,
      target: drops[0]
    };
    if (this.el.missionBar) this.el.missionBar.hidden = false;
    if (this.audio) this.audio.horn('cucaracha');
    this.el.combo.innerHTML = `🍕 PIZZA BOY RUN · 5 HOT PIZZAS! <span>DELIVER TO ${drops[0].name.toUpperCase()}</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.4;
  }

  startJetSkiTimeTrial() {
    this.abortSideMission();
    const js = (this.boats || []).find((b) => b.type === 'jetski') || (this.boats && this.boats[0]);
    if (!js) return;
    js.x = 42; js.z = -90; js.yaw = 0; js.speed = 0;
    js.root.position.set(js.x, -0.35, js.z);
    js.root.rotation.set(0, 0, 0);
    this.enterBoat(js);

    const gateCoords = [
      { x: 46, z: -138 },
      { x: 60, z: -186 },
      { x: 42, z: -236 },
      { x: 64, z: -288 },
      { x: 44, z: -340 },
      { x: 68, z: -392 },
      { x: 54, z: -446 },
      { x: 74, z: -502 }
    ];
    const buoyGeo = new THREE.CylinderGeometry(0.42, 0.52, 1.8, 10);
    const topGeo = new THREE.SphereGeometry(0.32, 10, 8);
    const archGeo = new THREE.TorusGeometry(6.8, 0.24, 8, 28, Math.PI);
    this._jetSkiGates = [];
    gateCoords.forEach((gc, idx) => {
      const grp = new THREE.Group();
      const bMat = new THREE.MeshStandardMaterial({ color: 0xff6b2c, roughness: 0.35 });
      const archMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xffd36b : 0x21e6d1, transparent: true, opacity: idx === 0 ? 0.92 : 0.45
      });
      const bL = new THREE.Mesh(buoyGeo, bMat); bL.position.set(-6.8, 0.65, 0);
      const bR = new THREE.Mesh(buoyGeo, bMat); bR.position.set(6.8, 0.65, 0);
      const tL = new THREE.Mesh(topGeo, archMat); tL.position.set(-6.8, 1.65, 0);
      const tR = new THREE.Mesh(topGeo, archMat); tR.position.set(6.8, 1.65, 0);
      const arch = new THREE.Mesh(archGeo, archMat); arch.position.set(0, 0.45, 0);
      grp.add(bL, bR, tL, tR, arch);
      grp.position.set(gc.x, -0.32, gc.z);
      this.scene.add(grp);
      this._jetSkiGates.push({ x: gc.x, z: gc.z, group: grp, archMat, cleared: false });
    });

    this.activeSideMission = {
      kind: 'jetski',
      gateIdx: 0,
      total: gateCoords.length,
      timer: 56,
      target: { x: gateCoords[0].x, z: gateCoords[0].z, name: 'Buoy Gate 1/8' }
    };
    if (this.el.missionBar) this.el.missionBar.hidden = false;
    if (this.audio) this.audio.phoneChime();
    this.el.combo.innerHTML = `🌊 JET-SKI OCEAN SLALOM! <span>CLEAR 8 BUOY GATES · $1,350 PRIZE</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.4;
  }

  startBeachVolleyball() {
    this.abortSideMission();
    const ps = this.playerState;
    this.setMode('foot');
    ps.x = 22.0; ps.z = -124.0;
    ps.y = Math.max(0.16, this.getSurfaceY(ps.x, ps.z, true));
    ps.yaw = -Math.PI / 2;
    ps.vx = 0; ps.vz = 0; ps.vy = 0;
    this.orbitYawOffset = -Math.PI / 2;
    this.orbitPitchOffset = 0.08;
    this.player.root.position.set(ps.x, ps.y, ps.z);
    this.player.root.rotation.y = ps.yaw;
    this.snapCameraNext = true;

    // Composite 3D striped beach volleyball + glowing landing target ring + Beach Rival NPC
    const ballGrp = new THREE.Group();
    const ballCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0xfff8f0, roughness: 0.35 })
    );
    const band1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.275, 0.032, 8, 22),
      new THREE.MeshStandardMaterial({ color: 0xff2e88, roughness: 0.3 })
    );
    const band2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.275, 0.032, 8, 22),
      new THREE.MeshStandardMaterial({ color: 0x21e6d1, roughness: 0.3 })
    );
    band2.rotation.y = Math.PI / 2;
    ballGrp.add(ballCore, band1, band2);
    ballGrp.position.set(27.4, 2.2, -124.0);
    this.scene.add(ballGrp);

    const landRingMat = new THREE.MeshBasicMaterial({
      color: 0x21e6d1, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false
    });
    const landRing = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.15, 24), landRingMat);
    landRing.rotation.x = -Math.PI / 2;
    landRing.position.set(22.0, ps.y + 0.06, -124.0);
    this.scene.add(landRing);

    const timingRingMat = new THREE.MeshBasicMaterial({
      color: 0xffd36b, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false
    });
    const timingRing = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.58, 24), timingRingMat);
    timingRing.rotation.x = -Math.PI / 2;
    timingRing.position.set(22.0, ps.y + 0.07, -124.0);
    this.scene.add(timingRing);

    let rival = null;
    if (this._pedSharedGeos && this._pedMats) {
      rival = createPedestrian({
        x: 27.6, y: ps.y, z: -124.0, dir: 0, jog: false, axis: 'z', minPos: -129, maxPos: -119,
        bikini: true, speed: 0, phase: 0, scale: 0.98,
        skin: 0xd89d72, shirt: 0xff2e88, pants: 0x21e6d1, hair: 0x1b151e, shoe: 0xf2eff6, blazer: false, shades: true
      }, this._pedSharedGeos, this._pedSplatMat, this._pedStarMat, this._pedMats);
      rival.root.position.set(27.6, ps.y, -124.0);
      rival.root.rotation.y = Math.PI / 2;
      this.scene.add(rival.root);
    }

    this._volleyballRig = { ballGrp, landRing, landRingMat, timingRing, rival };
    this.activeSideMission = {
      kind: 'volleyball',
      rally: 0,
      goal: 8,
      misses: 0,
      maxMisses: 3,
      timer: 70,
      phase: 'incoming',
      t: 0,
      duration: 1.48,
      startX: 27.4, startZ: -124.0,
      destX: 22.0, destZ: -124.0,
      target: { x: 22.0, z: -124.0, name: 'Volleyball Ring' }
    };
    if (this.el.missionBar) this.el.missionBar.hidden = false;
    if (this.audio && typeof this.audio.volleyballHit === 'function') this.audio.volleyballHit(false);
    this.el.combo.innerHTML = `🏐 BEACH VOLLEYBALL RALLY! <span>STEP INTO RING & PRESS [SPACE / E / CLICK] TO SPIKE!</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.8;
  }

  tryVolleyballStrike() {
    const m = this.activeSideMission;
    if (!m || m.kind !== 'volleyball' || !this._volleyballRig) return;
    const ps = this.playerState;
    const dist = Math.hypot(ps.x - m.destX, ps.z - m.destZ);
    if (m.phase === 'incoming' && m.t >= 0.54 && dist < 3.35) {
      const isSpike = m.t >= 0.76 && dist < 2.1;
      m.rally += 1;
      m.phase = 'outgoing';
      m.t = 0;
      m.duration = isSpike ? 0.92 : 1.15;
      m.startX = ps.x + 0.35;
      m.startZ = ps.z;
      m.destX = 27.2 + (Math.random() - 0.5) * 1.4;
      m.destZ = -124.0 + (Math.random() - 0.5) * 5.2;
      ps.vy = Math.max(ps.vy, isSpike ? 4.4 : 2.8);
      if (this.audio && typeof this.audio.volleyballHit === 'function') this.audio.volleyballHit(isSpike);
      for (let i = 0; i < 6; i++) {
        this.spawnParticle(
          ps.x + 0.4, ps.y + 1.5, ps.z,
          (Math.random() - 0.5) * 3.0, 1.8 + Math.random() * 1.5, (Math.random() - 0.5) * 3.0,
          isSpike ? 0xffd36b : 0x21e6d1, 0.36, 0.24, 1.3, 4.0
        );
      }
      if (m.rally >= m.goal) {
        this.cash += 750;
        this.missionsCompleted += 1;
        if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        this.abortSideMission();
        this.savePersistentSave();
        if (this.audio) this.audio.pickup();
        this.el.combo.innerHTML = `🏐 BEACH VOLLEYBALL CHAMPION! <span>8-HIT RALLY · +$750</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 4.0;
      } else {
        this.el.combo.innerHTML = `${isSpike ? 'POWER SPIKE!' : 'CLEAN RETURN!'} <span>RALLY ${m.rally}/${m.goal}</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 1.5;
      }
    } else if (m.phase === 'incoming') {
      this.el.combo.innerHTML = dist >= 3.35 ? `MOVE INTO THE GLOWING RING! <span>WASD</span>` : `WAIT FOR BALL TO DROP! <span>TIMING</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 1.1;
    }
  }

  clearDynamicEvent(despawnGangPeds = false) {
    if (this._dynamicEventMeshes && this._dynamicEventMeshes.length) {
      for (let i = 0; i < this._dynamicEventMeshes.length; i++) {
        const obj = this._dynamicEventMeshes[i];
        if (obj && obj.parent) obj.parent.remove(obj);
      }
      this._dynamicEventMeshes = [];
    }
    if (despawnGangPeds && this.dynamicEvent && Array.isArray(this.dynamicEvent.gangPeds)) {
      this.dynamicEvent.gangPeds.forEach((gp) => {
        if (gp.root && gp.root.parent) gp.root.parent.remove(gp.root);
        const idx = this.pedestrians.indexOf(gp);
        if (idx >= 0) this.pedestrians.splice(idx, 1);
      });
    }
    this.dynamicEvent = null;
  }

  spawnDynamicStreetEvent(forceKind = null) {
    this.clearDynamicEvent(true);
    const act = this.mode === 'car' ? this.carState : this.playerState;
    const kind = forceKind || (this.mode === 'car' ? (Math.random() < 0.65 ? 'racer' : 'gang') : 'gang');

    if (kind === 'racer') {
      // Pick nearest clean city avenue slightly ahead of player
      const avenues = [-2, -46, -126];
      let roadX = avenues[0];
      let bestD = Infinity;
      for (let i = 0; i < avenues.length; i++) {
        const d = Math.abs(act.x - avenues[i]);
        if (d < bestD) { bestD = d; roadX = avenues[i]; }
      }
      const dirZ = act.z < -420 ? 1 : -1;
      const sx = roadX + (dirZ < 0 ? 3.2 : -3.2);
      const sz = THREE.MathUtils.clamp(act.z + dirZ * (58 + Math.random() * 24), -820, -45);
      const sy = this.getSurfaceY(sx, sz, false) + 0.04;
      const syaw = dirZ < 0 ? 0 : Math.PI;
      const neonColors = [0xff2e88, 0x21e6d1, 0xffd36b, 0xa855f7];
      const col = neonColors[Math.floor(Math.random() * neonColors.length)];
      const carMesh = createTrafficCar(col, Math.random() < 0.5 ? 'sports' : 'muscle');
      carMesh.position.set(sx, sy, sz);
      carMesh.rotation.y = syaw;
      this.scene.add(carMesh);
      const carRig = carMesh.userData.carRig;
      this.applyModsToRig(carMesh, carRig, { underglow: 'pink', spoiler: true, rims: 'cyan' }, false);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.2, 4.1, 28),
        new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(sx, sy + 0.08, sz);
      this.scene.add(ring);

      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.9, 26, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xff2e88, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false })
      );
      beacon.position.set(sx, sy + 13, sz);
      this.scene.add(beacon);

      this._dynamicEventMeshes = [carMesh, ring, beacon];
      this.dynamicEvent = {
        kind: 'racer',
        x: sx, y: sy, z: sz, yaw: syaw, roadX, dirZ,
        carMesh, carRig, ring, beacon,
        label: carRig ? carRig.label : 'MIDNIGHT RACER',
        timer: 65
      };
      if (this.audio) this.audio.horn('synth80s');
      this.el.combo.innerHTML = `🔥 STREET RACER CHALLENGE NEARBY! <span>PULL UP & HONK [H/K] OR [E] · $1,200</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 4.2;
      return;
    }

    // Rival Gang Turf Ambush & Contraband Cash Stash!
    const angle = Math.random() * Math.PI * 2;
    const dist = forceKind ? 32 : 52 + Math.random() * 26;
    const gx = THREE.MathUtils.clamp(act.x + Math.cos(angle) * dist, -145, 16);
    const gz = THREE.MathUtils.clamp(act.z + Math.sin(angle) * dist, -820, -25);
    const gy = this.getSurfaceY(gx, gz, false) + 0.04;
    const isSharks = Math.random() < 0.5;
    const gangName = isSharks ? 'VICE SHARKS' : 'HAVANA KINGS';
    const jacketCol = isSharks ? 0x16d9c6 : 0xe02848;

    // Composite 3D Contraband Stash Crate + glowing cash stacks + perimeter turf ring
    const stashGrp = new THREE.Group();
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.85, 1.05),
      new THREE.MeshStandardMaterial({ color: 0x181c26, roughness: 0.42, metalness: 0.55 })
    );
    crate.position.y = 0.44;
    const cashTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.24, 0.78),
      new THREE.MeshStandardMaterial({ color: 0x34e89e, emissive: 0x10b981, emissiveIntensity: 0.55, roughness: 0.35 })
    );
    cashTop.position.y = 0.96;
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.12, 1.12),
      new THREE.MeshStandardMaterial({ color: 0xffd36b, metalness: 0.85, roughness: 0.2 })
    );
    trim.position.y = 0.82;
    stashGrp.add(crate, cashTop, trim);
    stashGrp.position.set(gx, gy, gz);
    this.scene.add(stashGrp);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4040, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.9, 28), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(gx, gy + 0.08, gz);
    this.scene.add(ring);

    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xff4040, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false
    });
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.85, 22, 10, 1, true), beaconMat);
    beacon.position.set(gx, gy + 11, gz);
    this.scene.add(beacon);

    const gangPeds = [];
    if (this._pedSharedGeos && this._pedMats) {
      const count = 4;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.4;
        const px = gx + Math.cos(a) * 3.4;
        const pz = gz + Math.sin(a) * 3.4;
        const p = createPedestrian({
          x: px, y: gy, z: pz, dir: 0, jog: false, axis: 'z', minPos: gz - 20, maxPos: gz + 20,
          bikini: false, speed: 3.0, phase: i * 1.4, scale: 1.04,
          skin: [0xd89d72, 0x9b6543, 0xf2c29b, 0x6f452c][i % 4],
          shirt: jacketCol, pants: 0x161822, hair: 0x18141c, shoe: 0xffd36b, blazer: true, shades: true
        }, this._pedSharedGeos, this._pedSplatMat, this._pedStarMat, this._pedMats);
        p.name = `${gangName} ENFORCER`;
        p.role = 'Rival Gang';
        p.isGang = true;
        p.hp = 5;
        p.fighter = true;
        p.provoked = false;
        p.stateTimer = 45.0;
        p.attackTimer = 0;
        p.attackCooldown = 0;
        p.hitDealt = false;
        p.root.position.set(px, gy, pz);
        p.root.rotation.y = a + Math.PI;
        this.scene.add(p.root);
        this.pedestrians.push(p);
        gangPeds.push(p);
      }
    }

    this._dynamicEventMeshes = [stashGrp, ring, beacon];
    this.dynamicEvent = {
      kind: 'gang',
      gangName,
      x: gx, y: gy, z: gz,
      stashGrp, ring, ringMat, beacon, beaconMat,
      gangPeds,
      cleared: false,
      timer: 95
    };
    if (this.audio) this.audio.phoneChime();
    this.el.combo.innerHTML = `💀 ${gangName} TURF STASH NEARBY! <span>TAKE OUT CREW & LOOT $950</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 4.2;
  }

  tryAcceptStreetRacerChallenge() {
    if (!this.dynamicEvent || this.dynamicEvent.kind !== 'racer') return false;
    const ev = this.dynamicEvent;
    const act = this.mode === 'car' ? this.carState : this.playerState;
    const dist = Math.hypot(act.x - ev.x, act.z - ev.z);
    if (dist > 34) return false;
    if (this.mode !== 'car') {
      this.el.combo.innerHTML = `GET IN A CAR TO RACE! <span>PRESS [F] TO BOARD</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.0;
      return true;
    }

    // Remove challenge ring & beacon, keep rival car mesh for the live head-to-head race!
    if (ev.ring && ev.ring.parent) ev.ring.parent.remove(ev.ring);
    if (ev.beacon && ev.beacon.parent) ev.beacon.parent.remove(ev.beacon);
    const rivalMesh = ev.carMesh;
    const rivalRig = ev.carRig;
    const roadX = ev.roadX;
    const dirZ = ev.dirZ;
    const finishZ = THREE.MathUtils.clamp(ev.z + dirZ * 460, -880, -15);
    this._dynamicEventMeshes = [];
    this.dynamicEvent = null;

    this.abortSideMission();
    const cs = this.carState;
    cs.yaw = dirZ < 0 ? 0 : Math.PI;
    cs.speed = 0;

    this.activeSideMission = {
      kind: 'impromptuRace',
      rivalMesh,
      rivalRig,
      rivalX: ev.x,
      rivalZ: ev.z,
      rivalYaw: ev.yaw,
      rivalSpeed: 0,
      roadX,
      dirZ,
      countdown: 2.2,
      timer: 65,
      target: { x: roadX, z: finishZ, name: 'Street Race Finish' }
    };
    if (this.el.missionBar) this.el.missionBar.hidden = false;
    if (this.audio) this.audio.horn('airhorn');
    this.el.combo.innerHTML = `🏁 HEAD-TO-HEAD STREET RACE! <span>BEAT ${ev.label} TO THE FINISH · $1,200</span>`;
    this.el.combo.classList.add('on');
    this.streakTimer = 3.4;
    return true;
  }

  updateDynamicEvents(dt, elapsed, act) {
    if (this.dynamicEvent) {
      const ev = this.dynamicEvent;
      ev.timer -= dt;
      const dist = Math.hypot(act.x - ev.x, act.z - ev.z);
      if (ev.ring) {
        ev.ring.scale.setScalar(1 + Math.sin(elapsed * 5.2) * 0.12);
      }
      if (ev.kind === 'racer') {
        if (ev.carRig && ev.carRig.bodyGroup) {
          ev.carRig.bodyGroup.position.y = Math.sin(elapsed * 22) * 0.015;
        }
        if (ev.timer <= 0 || dist > 320) {
          this.clearDynamicEvent(false);
          this.dynamicEventCooldown = 28;
        }
      } else if (ev.kind === 'gang') {
        if (ev.stashGrp) {
          ev.stashGrp.rotation.y += dt * 0.55;
        }
        let aliveCount = 0;
        for (let i = 0; i < ev.gangPeds.length; i++) {
          const gp = ev.gangPeds[i];
          const alive = gp.state !== 'dead' && gp.state !== 'ragdoll' && gp.state !== 'squished';
          if (alive) {
            aliveCount++;
            if (dist < 26 && !gp.provoked) {
              gp.provoked = true;
              gp.state = 'fight';
              gp.stateTimer = 45.0;
            }
          }
        }
        if (aliveCount === 0 && !ev.cleared) {
          ev.cleared = true;
          ev.ringMat.color.setHex(0x34e89e);
          ev.beaconMat.color.setHex(0x34e89e);
          if (this.audio) this.audio.pickup();
          this.el.combo.innerHTML = `💀 ${ev.gangName} WIPED OUT! <span>GRAB THE GREEN CASH STASH ($950)</span>`;
          this.el.combo.classList.add('on');
          this.streakTimer = 3.6;
        }
        if (ev.cleared && dist < 6.8) {
          this.cash += 950;
          this.missionsCompleted += 1;
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          this.savePersistentSave();
          if (this.audio) this.audio.pickup();
          for (let i = 0; i < 12; i++) {
            this.spawnParticle(
              ev.x + (Math.random() - 0.5) * 1.4, ev.y + 1.0, ev.z + (Math.random() - 0.5) * 1.4,
              (Math.random() - 0.5) * 4.5, 2.5 + Math.random() * 2.5, (Math.random() - 0.5) * 4.5,
              0x34e89e, 0.55, 0.35, 1.5, 5.5
            );
          }
          this.el.combo.innerHTML = `TURF STASH CLAIMED! <span>+$950 CASH</span>`;
          this.el.combo.classList.add('on');
          this.streakTimer = 3.8;
          this.clearDynamicEvent(false);
          this.dynamicEventCooldown = 42 + Math.random() * 18;
          return;
        }
        if (ev.timer <= 0 || dist > 340) {
          this.clearDynamicEvent(true);
          this.dynamicEventCooldown = 34;
        }
      }
      return;
    }

    // Ambient random encounter spawner while cruising Vice City!
    if (!this.activeSideMission && (this.mode === 'car' || this.mode === 'foot') && act.x > -170 && act.x < 35 && act.z < -20 && act.z > -840) {
      this.dynamicEventCooldown -= dt;
      if (this.dynamicEventCooldown <= 0) {
        this.spawnDynamicStreetEvent();
        this.dynamicEventCooldown = 46 + Math.random() * 18;
      }
    }
  }

  abortSideMission() {
    if (this.activeSideMission && this.activeSideMission.rivalMesh && this.activeSideMission.rivalMesh.parent) {
      this.activeSideMission.rivalMesh.parent.remove(this.activeSideMission.rivalMesh);
    }
    if (this._volleyballRig) {
      const vr = this._volleyballRig;
      if (vr.ballGrp && vr.ballGrp.parent) vr.ballGrp.parent.remove(vr.ballGrp);
      if (vr.landRing && vr.landRing.parent) vr.landRing.parent.remove(vr.landRing);
      if (vr.timingRing && vr.timingRing.parent) vr.timingRing.parent.remove(vr.timingRing);
      if (vr.rival && vr.rival.root && vr.rival.root.parent) vr.rival.root.parent.remove(vr.rival.root);
      this._volleyballRig = null;
    }
    if (this._jetSkiGates && this._jetSkiGates.length) {
      for (let i = 0; i < this._jetSkiGates.length; i++) {
        const g = this._jetSkiGates[i];
        if (g.group && g.group.parent) g.group.parent.remove(g.group);
      }
      this._jetSkiGates = [];
    }
    this.activeSideMission = null;
    if (this.el.missionBar) this.el.missionBar.hidden = true;
    if (this.missionBeacon) this.missionBeacon.group.visible = false;
  }

  updateSideMissions(dt, elapsed, act) {
    const m = this.activeSideMission;
    if (!m) {
      if (this.missionBeacon && this.missionBeacon.group.visible) this.missionBeacon.group.visible = false;
      return;
    }
    m.timer -= dt;
    if (m.timer <= 0) {
      this.abortSideMission();
      this.el.combo.innerHTML = `TIME UP · MISSION ENDED <span>TRY AGAIN VIA PHONE [I]</span>`;
      this.el.combo.classList.add('on');
      this.streakTimer = 2.8;
      return;
    }
    if (this.el.missionTimer) this.el.missionTimer.textContent = `${Math.ceil(m.timer)}s`;

    if (m.kind === 'indoorRange') {
      if (this.el.missionObj) this.el.missionObj.textContent = `AMMU-NATION RANGE · ${m.hits}/${m.goal} BULLSEYES`;
      if (m.hits >= m.goal) {
        this.cash += 400;
        this.missionsCompleted += 1;
        if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        this.abortSideMission();
        this.savePersistentSave();
        this.audio.pickup();
        this.el.combo.innerHTML = `SHARPSHOOTER COMPLETE! <span>+$400</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 3.6;
      }
      return;
    }

    if (m.kind === 'volleyball' && this._volleyballRig) {
      if (this.missionBeacon) this.missionBeacon.group.visible = false;
      const vr = this._volleyballRig;
      if (this.el.missionObj) {
        this.el.missionObj.textContent = `🏐 BEACH VOLLEYBALL · RALLY ${m.rally}/${m.goal} · MISSES ${m.misses}/${m.maxMisses}`;
      }
      m.t += dt / m.duration;
      const u = THREE.MathUtils.clamp(m.t, 0, 1);
      const bx = THREE.MathUtils.lerp(m.startX, m.destX, u);
      const bz = THREE.MathUtils.lerp(m.startZ, m.destZ, u);
      const peakH = m.phase === 'incoming' ? 4.4 : 4.1;
      const by = 0.85 + Math.sin(u * Math.PI) * peakH;
      vr.ballGrp.position.set(bx, by, bz);
      vr.ballGrp.rotation.x += dt * 7.5;
      vr.ballGrp.rotation.z += dt * 5.0;

      const baseSandY = this.getSurfaceY(m.destX, m.destZ, true) + 0.06;
      if (m.phase === 'incoming') {
        vr.landRing.visible = true;
        vr.timingRing.visible = true;
        vr.landRing.position.set(m.destX, baseSandY, m.destZ);
        vr.timingRing.position.set(m.destX, baseSandY + 0.02, m.destZ);
        const s = Math.max(0.25, 1.9 - u * 1.5);
        vr.timingRing.scale.setScalar(s);
        vr.landRingMat.color.setHex(u >= 0.56 ? 0xffd36b : 0x21e6d1);
      } else {
        vr.landRing.visible = false;
        vr.timingRing.visible = false;
      }

      if (vr.rival && vr.rival.root) {
        const targetRZ = m.phase === 'outgoing' ? m.destZ : -124.0;
        vr.rival.root.position.z = THREE.MathUtils.damp(vr.rival.root.position.z, targetRZ, 6.0, dt);
      }

      if (m.t >= 1.0) {
        if (m.phase === 'outgoing') {
          // Rival returns the volleyball across the net!
          m.phase = 'incoming';
          m.t = 0;
          m.duration = Math.max(1.12, 1.48 - m.rally * 0.04);
          m.startX = m.destX;
          m.startZ = m.destZ;
          m.destX = 21.3 + Math.random() * 2.1;
          m.destZ = -124.0 + (Math.random() - 0.5) * 5.4;
          if (this.audio && typeof this.audio.volleyballHit === 'function') this.audio.volleyballHit(false);
        } else {
          // Ball landed on player's sand!
          m.misses += 1;
          if (m.misses >= m.maxMisses) {
            const consolation = m.rally * 40;
            if (consolation > 0) {
              this.cash += consolation;
              if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            }
            this.abortSideMission();
            this.el.combo.innerHTML = `MATCH OVER · ${m.rally} VOLLEYS <span>${consolation > 0 ? `+$${consolation}` : 'PRESS [E] AT COURT TO RETRY'}</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 3.2;
            return;
          }
          m.t = 0;
          m.startX = 27.4; m.startZ = -124.0;
          m.destX = 22.0; m.destZ = -124.0 + (Math.random() - 0.5) * 3.6;
          this.el.combo.innerHTML = `MISSED VOLLEY! (${m.misses}/${m.maxMisses}) <span>NEXT SERVE INCOMING</span>`;
          this.el.combo.classList.add('on');
          this.streakTimer = 1.8;
        }
      }
      return;
    }

    if (m.kind === 'jetski' && this._jetSkiGates && this._jetSkiGates.length) {
      if (this.missionBeacon) this.missionBeacon.group.visible = false;
      for (let i = 0; i < this._jetSkiGates.length; i++) {
        const g = this._jetSkiGates[i];
        g.group.position.y = -0.32 + Math.sin(elapsed * 2.6 + i * 0.9) * 0.14;
      }
      const cur = this._jetSkiGates[m.gateIdx];
      if (cur) {
        const d = Math.hypot(act.x - cur.x, act.z - cur.z);
        if (this.el.missionObj) {
          this.el.missionObj.textContent = `🌊 JET-SKI SLALOM · GATE ${m.gateIdx + 1}/${m.total} (${Math.round(d)}m)`;
        }
        if (d < 12.0) {
          cur.cleared = true;
          cur.group.visible = false;
          this.audio.pickup();
          m.gateIdx += 1;
          m.timer = Math.min(70, m.timer + 5);
          if (m.gateIdx >= m.total) {
            this.cash += 1350;
            this.missionsCompleted += 1;
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.abortSideMission();
            this.savePersistentSave();
            this.el.combo.innerHTML = `🌊 JET-SKI SLALOM CHAMPION! <span>+$1,350</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 4.2;
          } else {
            const nxt = this._jetSkiGates[m.gateIdx];
            nxt.archMat.color.setHex(0xffd36b);
            nxt.archMat.opacity = 0.92;
            m.target = { x: nxt.x, z: nxt.z, name: `Buoy Gate ${m.gateIdx + 1}/${m.total}` };
            this.el.combo.innerHTML = `GATE ${m.gateIdx}/${m.total} CLEARED! <span>+5s BONUS</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 1.6;
          }
        }
      }
      return;
    }

    if (m.target && this.missionBeacon) {
      const by = this.getSurfaceY(m.target.x, m.target.z, false);
      this.missionBeacon.group.visible = true;
      this.missionBeacon.group.position.set(m.target.x, by, m.target.z);
      this.missionBeacon.ring.scale.setScalar(1 + Math.sin(elapsed * 5.0) * 0.14);
      const col = m.kind === 'race' ? 0x21e6d1
        : (m.kind === 'pizza' ? 0xff7b2e
        : (m.kind === 'impromptuRace' ? 0xff2e88
        : (m.phase === 'pickup' ? 0xffd36b : 0x34e89e)));
      this.missionBeacon.cylMat.color.setHex(col);
      this.missionBeacon.ringMat.color.setHex(col);

      const d = Math.hypot(act.x - m.target.x, act.z - m.target.z);
      if (m.kind === 'impromptuRace') {
        if (m.countdown > 0) {
          m.countdown -= dt;
          if (this.el.missionObj) this.el.missionObj.textContent = `🏁 STREET RACE STARTING · ${Math.ceil(m.countdown)}...`;
          return;
        }
        // Drive AI rival car along the avenue with exciting gentle rubber-banding!
        const playerDist = Math.abs(act.z - m.target.z);
        const rivalDist = Math.abs(m.rivalZ - m.target.z);
        const leadGap = playerDist - rivalDist; // negative if player is ahead
        const targetSpd = THREE.MathUtils.clamp(43 + (leadGap < -18 ? 7.5 : (leadGap > 24 ? -5.5 : 0)), 34, 54);
        m.rivalSpeed = THREE.MathUtils.damp(m.rivalSpeed, targetSpd, 2.4, dt);
        const nextRivalZ = m.rivalZ + m.dirZ * m.rivalSpeed * dt;
        const rivalBoxes = this.colliderGrid.queryBoxes(m.rivalX, nextRivalZ, 3.4);
        let rivalBlocked = false;
        for (let bIdx = 0; bIdx < rivalBoxes.length; bIdx++) {
          const b = rivalBoxes[bIdx];
          if (m.rivalX + 1.2 > b.minX && m.rivalX - 1.2 < b.maxX && nextRivalZ + 2.3 > b.minZ && nextRivalZ - 2.3 < b.maxZ) {
            rivalBlocked = true;
            const aveCenter = Math.round(m.rivalX / 96) * 96;
            m.rivalX = THREE.MathUtils.damp(m.rivalX, aveCenter + (m.rivalX >= aveCenter ? -3.6 : 3.6), 5.0, dt);
            break;
          }
        }
        if (!rivalBlocked) m.rivalZ = nextRivalZ;
        const ry = this.getSurfaceY(m.rivalX, m.rivalZ, false) + 0.04;
        if (m.rivalMesh) {
          m.rivalMesh.position.set(m.rivalX, ry, m.rivalZ);
          if (m.rivalRig && m.rivalRig.wheelSpinGroups) {
            for (let i = 0; i < m.rivalRig.wheelSpinGroups.length; i++) {
              m.rivalRig.wheelSpinGroups[i].rotation.x -= m.rivalSpeed * dt * 2.5;
            }
          }
        }
        const posStr = playerDist <= rivalDist ? '1ST' : '2ND';
        if (this.el.missionObj) this.el.missionObj.textContent = `🔥 STREET RACE · ${posStr} · ${Math.round(d)}m TO FINISH`;

        if (d < 15.0) {
          this.cash += 1200;
          this.missionsCompleted += 1;
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          this.abortSideMission();
          this.savePersistentSave();
          this.audio.pickup();
          this.el.combo.innerHTML = `🏁 STREET RACE WINNER! <span>+$1,200 PRIZE</span>`;
          this.el.combo.classList.add('on');
          this.streakTimer = 4.2;
          return;
        }
        if (rivalDist < 12.0) {
          this.cash += 250;
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          this.abortSideMission();
          this.savePersistentSave();
          this.el.combo.innerHTML = `2ND PLACE · CLOSE RACE! <span>+$250 CONSOLATION</span>`;
          this.el.combo.classList.add('on');
          this.streakTimer = 3.4;
          return;
        }
      } else if (m.kind === 'pizza') {
        if (this.el.missionObj) this.el.missionObj.textContent = `🍕 PIZZA BOY (${m.delivered}/${m.drops.length}) · ${m.target.name} (${Math.round(d)}m)`;
        if (d < 10.5) {
          this.audio.pickup();
          m.delivered += 1;
          const tip = 220 + Math.min(180, Math.round(m.timer * 4));
          this.cash += tip;
          if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
          for (let i = 0; i < 8; i++) {
            this.spawnParticle(
              m.target.x + (Math.random() - 0.5) * 1.4, by + 1.2, m.target.z + (Math.random() - 0.5) * 1.4,
              (Math.random() - 0.5) * 3.5, 2.2 + Math.random() * 1.8, (Math.random() - 0.5) * 3.5,
              0xff7b2e, 0.45, 0.3, 1.4, 4.5
            );
          }
          if (m.delivered >= m.drops.length) {
            this.cash += 1400;
            this.missionsCompleted += 1;
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.abortSideMission();
            this.savePersistentSave();
            this.el.combo.innerHTML = `🍕 PIZZA BOY SHIFT COMPLETE! <span>+$1,400 BONUS</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 4.2;
          } else {
            m.dropIdx += 1;
            m.target = m.drops[m.dropIdx];
            m.timer = Math.min(72, m.timer + 28);
            this.el.combo.innerHTML = `HOT PIZZA DELIVERED! +$${tip} <span>NEXT: ${m.target.name.toUpperCase()}</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 2.8;
          }
        }
      } else if (m.kind === 'taxi') {
        if (this.el.missionObj) this.el.missionObj.textContent = `${m.phase === 'pickup' ? 'PICKUP' : 'DROPOFF'} · ${m.target.name} (${Math.round(d)}m)`;
        if (d < 9.5) {
          this.audio.pickup();
          if (m.phase === 'pickup') {
            const others = TAXI_FARE_SPOTS.filter((s) => s.name !== m.target.name);
            m.target = others[Math.floor(Math.random() * others.length)];
            m.phase = 'dropoff';
            m.timer = Math.min(90, m.timer + 38);
            this.el.combo.innerHTML = `PASSENGER BOARDED! <span>DRIVE TO ${m.target.name.toUpperCase()}</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 2.8;
          } else {
            m.faresDone += 1;
            const pay = 350 + m.faresDone * 75;
            this.cash += pay;
            this.missionsCompleted += 1;
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.savePersistentSave();
            const nextP = TAXI_FARE_SPOTS.filter((s) => s.name !== m.target.name);
            m.target = nextP[Math.floor(Math.random() * nextP.length)];
            m.phase = 'pickup';
            m.timer = 65;
            this.el.combo.innerHTML = `FARE #${m.faresDone} COMPLETE! <span>+$${pay} · NEXT: ${m.target.name.toUpperCase()}</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 3.2;
          }
        }
      } else if (m.kind === 'race') {
        if (this.el.missionObj) this.el.missionObj.textContent = `STREET RACE · GATE ${m.gateIdx + 1}/${STREET_RACE_GATES.length} (${Math.round(d)}m)`;
        if (d < 11.5) {
          this.audio.pickup();
          m.gateIdx += 1;
          if (m.gateIdx >= STREET_RACE_GATES.length) {
            this.cash += 1800;
            this.missionsCompleted += 1;
            if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
            this.abortSideMission();
            this.savePersistentSave();
            this.el.combo.innerHTML = `LEONIDA STREET RACE WINNER! <span>+$1,800</span>`;
            this.el.combo.classList.add('on');
            this.streakTimer = 4.2;
          } else {
            const g = STREET_RACE_GATES[m.gateIdx];
            m.target = { x: g.x, z: g.z, name: `Gate ${m.gateIdx + 1}` };
          }
        }
      }
    }
  }

  updateSkyRings(dt, elapsed, act) {
    if (!this.skyRings) return;
    for (let i = 0; i < this.skyRings.length; i++) {
      const r = this.skyRings[i];
      if (r.collected) {
        r.respawnTimer -= dt;
        if (r.respawnTimer <= 0) { r.collected = false; r.mesh.visible = true; }
        continue;
      }
      r.mesh.rotation.y += dt * 1.1;
      r.mesh.position.y = r.y + Math.sin(elapsed * 2.2 + i) * 1.2;
      if (this.mode === 'plane' && Math.hypot(act.x - r.x, act.z - r.z) < 11.5 && Math.abs((act.y || 0) - r.y) < 10.5) {
        r.collected = true;
        r.respawnTimer = 45;
        r.mesh.visible = false;
        this.cash += 250;
        if (this.el.cash) this.el.cash.textContent = `$${this.cash.toLocaleString()}`;
        this.audio.pickup();
        this.el.combo.innerHTML = `SKY-RING CLEARED! <span>+$250</span>`;
        this.el.combo.classList.add('on');
        this.streakTimer = 2.4;
        this.savePersistentSave();
      }
    }
  }

  updateBoats(dt, elapsed) {
    if (!this.boats) return;
    const isBoat = this.mode === 'boat' && Boolean(this.activeBoat);
    const canDrive = isBoat && this.started && this.el.modal.hidden && !this.fullMapOpen && !this.projectsHubOpen && !this.phoneOpen;
    for (let i = 0; i < this.boats.length; i++) {
      const b = this.boats[i];
      const ph = b.phase || 0;
      const waveY = -0.34 + Math.sin(elapsed * 2.4 + ph) * 0.14;
      if (isBoat && this.activeBoat === b) {
        let thr = 0, str = 0;
        if (canDrive && this.keys.up) thr += 1;
        if (canDrive && this.keys.down) thr -= 0.55;
        if (canDrive && this.keys.left) str += 1;
        if (canDrive && this.keys.right) str -= 1;
        const maxS = (canDrive && this.keys.nitro) ? b.topSpeed * 1.32 : b.topSpeed;
        b.speed = THREE.MathUtils.damp(b.speed, thr * maxS, thr !== 0 ? 1.8 : 1.1, dt);
        b.yaw += str * (1.25 + Math.min(0.9, Math.abs(b.speed) * 0.03)) * dt;
        const fx = -Math.sin(b.yaw), fz = -Math.cos(b.yaw);
        const nx = b.x + fx * b.speed * dt;
        const nz = b.z + fz * b.speed * dt;
        // Keep boats in navigable Atlantic ocean waters off Vice Beach & Starfish Island
        b.x = THREE.MathUtils.clamp(nx, 28.5, 420);
        b.z = THREE.MathUtils.clamp(nz, -1120, 320);
        b.y = waveY + Math.min(0.28, Math.abs(b.speed) * 0.008);
        b.root.rotation.order = 'YXZ';
        b.root.rotation.set(Math.min(0.18, b.speed * 0.004) + Math.sin(elapsed * 2.6 + ph) * 0.04, b.yaw, -str * 0.24 * Math.min(1, Math.abs(b.speed) / 14));
        if (Math.abs(b.speed) > 4 && Math.random() < 0.72) {
          this.spawnParticle(b.x - fx * 3.0 + (Math.random() - 0.5) * 1.2, -0.1, b.z - fz * 3.0 + (Math.random() - 0.5) * 1.2, -fx * 2.2 + (Math.random() - 0.5) * 1.8, 1.4, -fz * 2.2 + (Math.random() - 0.5) * 1.8, 0xdcf7ff, 0.72, 0.55, 1.9, 4.5);
        }
      } else {
        b.y = waveY;
        b.root.rotation.set(Math.sin(elapsed * 2.0 + ph) * 0.04, b.yaw, Math.cos(elapsed * 1.7 + ph) * 0.04);
      }
      b.root.position.set(b.x, b.y, b.z);
    }
  }
}

export function preloadViceCity3D() {
  if (!instance) instance = new ViceCity3DApp();
  return instance;
}

export function openViceCity3D() {
  if (!instance) instance = new ViceCity3DApp();
  instance.open();
}
