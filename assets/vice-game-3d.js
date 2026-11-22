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

import {
  SUN_DIR,
  createGoldenHourEnvironment,
  createViceSkyDome,
  createAtlanticOcean,
  makeAsphaltTextures,
  makeIntersectionTexture,
  makeSidewalkTexture,
  makeGrassTexture,
  makeSandTexture,
  makePalmBarkTexture,
  makePalmFrondTexture,
  makeSkyscraperGlassTextures,
  makeNeonSignTexture,
  makeSoftParticleTexture,
  makeSplatDecalTexture
} from './vice-env.js?v=8';

import {
  PAINTS,
  mergeGeometries,
  createSupercar,
  buildArchingFrondGeometry,
  buildMergedPalmGeometries,
  createArtDecoHotel,
  createGlassSkyscraper,
  createCaseStudyShowroom,
  createTrafficCar,
  createPedestrian
} from './vice-assets.js?v=8';

import { ViceAudioEngine } from './vice-audio.js?v=8';

const AVENUES = [0, -96, -192]; // Ocean Drive, Washington Ave, Downtown Hwy
const CROSS_STREETS = [20, -140, -300, -460, -620];
const ROAD_W = 16.8;
const ROAD_H = ROAD_W * 0.5; // 8.4m half-width

const WAYPOINTS = [
  { id: 'start', label: 'Ocean Dr', zone: 'Ocean Drive South', x: 3.2, z: 6, yaw: 0 },
  { id: 'fix-my-itch', label: '01 FixMyItch', zone: 'Ocean Beach', x: -4.8, z: -82, yaw: 0.25 },
  { id: 'magic-checkout', label: '02 Magic (Bridge)', zone: 'Starfish Island', x: 138, z: -300, yaw: -Math.PI / 2 },
  { id: 'agentic-payments', label: '03 Agentic', zone: 'Downtown Vice', x: -100.8, z: -220, yaw: 0.25 },
  { id: 'ai-launches', label: '04 AI Impact', zone: 'Vice Point', x: -4.8, z: -382, yaw: 0.25 },
  { id: 'journey', label: '05 Journey', zone: 'Little Havana', x: -100.8, z: -538, yaw: 0.25 },
  { id: 'contact', label: 'Contact', zone: 'Miami Beach Plaza', x: 0, z: -612, yaw: 0 }
];

const SHOWROOMS = [
  {
    id: 'fix-my-itch', num: '01', district: 'Ocean Beach', title: 'FixMyItch',
    stat: 'Awwwards Nominee · Framer Showcase · Razorpay',
    desc: 'Tactile interactive campaign transforming merchant payment friction into an award-winning product showcase.',
    img: '/assets/images/mockup-fix-my-itch.webp', url: '/fix-my-itch/',
    accent: 0xff2e88, accentHex: '#FF2E88', x: -17.0, z: -82, rotY: 0, parkX: -4.8, parkZ: -82
  },
  {
    id: 'magic-checkout', num: '02', district: 'Starfish Island', title: 'Magic Checkout',
    stat: '5x Faster Checkout · 12 Interactive Islands',
    desc: 'High-craft conversion showcase demonstrating 1-click checkout speed and intelligent RTO protection.',
    img: '/assets/images/mockup-magic-checkout-v3.webp', url: '/magic-checkout/',
    accent: 0x21e6d1, accentHex: '#21E6D1', x: 162, z: -300, rotY: Math.PI, parkX: 148, parkZ: -300
  },
  {
    id: 'agentic-payments', num: '03', district: 'Downtown Vice', title: 'Agentic Payments',
    stat: 'AI Agent MCP Protocol · Multi-Device Launch',
    desc: 'Product storytelling and interactive system launch for Razorpay’s autonomous AI-native commerce stack.',
    img: '/assets/images/mockup-agentic-payments.webp', url: '/razorpay-agentic-payments/',
    accent: 0xff8a2a, accentHex: '#FF8A2A', x: -113.0, z: -220, rotY: 0, parkX: -100.8, parkZ: -220
  },
  {
    id: 'ai-launches', num: '04', district: 'Vice Point', title: 'India AI Impact',
    stat: '4 Live AI Unveils · 14-Day Sprint · Summit',
    desc: 'Rapid-turnaround keynote launchpad unveiling four flagship AI payment products live at Bharat Mandapam.',
    img: '/assets/images/mockup-ai-launches.webp', url: '/razorpay-ai-launches/',
    accent: 0x21e6d1, accentHex: '#21E6D1', x: -17.0, z: -382, rotY: 0, parkX: -4.8, parkZ: -382
  },
  {
    id: 'journey', num: '05', district: 'Little Havana', title: 'Journey App',
    stat: 'Multi-City India Planner · Conflict Auto-Fix',
    desc: 'Calm mobile travel companion unifying multi-leg flights, stays, and live itinerary conflict resolution.',
    img: '/assets/images/journey-cover-v2.jpg', url: '/journey/',
    accent: 0xffd36b, accentHex: '#FFD36B', x: -113.0, z: -538, rotY: 0, parkX: -100.8, parkZ: -538
  }
];

const CAM_MODES = ['Chase', 'Low', 'Drone'];
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _dummy = new THREE.Object3D();

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
    this.autopilotQueue = [];
    this.orbitYawOffset = 0;
    this.orbitPitchOffset = 0;
    this.dragging = false;
    this.lastPtrX = 0;
    this.lastPtrY = 0;

    // Solid world collision geometry
    this.boxColliders = [];
    this.circleColliders = [];
    this.impactCooldown = 0;
    this.camShake = 0;

    // GTA Wanted Stars & Squish Arcade Counter
    this.squishCount = 0;
    this.streakCount = 0;
    this.streakTimer = 0;
    this.wantedStars = 0;
    this.wantedDecay = 0;
    this.cash = 0;

    this.lastCubeX = 9999;
    this.lastCubeZ = 9999;
    this.lastCubeFrame = -999;
    this.lastHudKmh = -1;
    this.lastHudGear = '';
    this.lastHudZone = '';
    this.lastHudWp = '';
    this.audio = new ViceAudioEngine();
    this.carState = {
      x: 3.2, z: 6.0, yaw: 0, speed: 0, steer: 0,
      wheelSpin: 0, driftSlip: 0, pitch: 0, roll: 0, popAngle: 0.56
    };
    this.keys = { up: false, down: false, left: false, right: false, nitro: false, drift: false };

    this.buildDOM();
    this.initWebGL();
    this.bindEvents();
    this.exposeQCHook();
  }

  exposeQCHook() {
    window.__VICE_QC__ = {
      getState: () => ({
        isOpen: this.isOpen,
        started: this.started,
        isSoftwareGl: this.isSoftwareGl,
        car: { ...this.carState },
        boxColliders: this.boxColliders.length,
        circleColliders: this.circleColliders.length,
        pedestrians: this.pedestrians ? this.pedestrians.length : 0,
        squishCount: this.squishCount,
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
      teleport: (x, z, yaw = 0, speed = 0) => {
        this.carState.x = x;
        this.carState.z = z;
        this.carState.yaw = yaw;
        this.carState.speed = speed;
        this.autopilotQueue = [];
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

      <div class="v3-top">
        <div class="v3-brand">
          <div class="v3-kicker">Vice City Open World · 3D Portfolio</div>
          <div class="v3-zone" data-zone>Ocean Drive South</div>
          <div class="v3-meta-line" data-progress>0 / 5 Showrooms Explored</div>
        </div>
        <div class="v3-top-r">
          <div class="v3-wanted" data-wanted title="GTA Wanted Level & Cash">
            <span class="star" data-s="1">★</span><span class="star" data-s="2">★</span><span class="star" data-s="3">★</span><span class="star" data-s="4">★</span><span class="star" data-s="5">★</span>
            <span class="v3-wanted-cash" data-cash>$0</span>
          </div>
          <div class="v3-speedo">
            <span class="v3-speed-num" data-speed>0</span>
            <span class="v3-speed-unit">KM/H</span>
            <span class="v3-gear" data-gear>N</span>
          </div>
          <button class="v3-exit" type="button" data-close>Exit · ESC</button>
        </div>
      </div>

      <div class="v3-combo" data-combo>SQUISH! <span>+$100</span></div>
      <div class="v3-radar"><canvas width="180" height="180" data-radar></canvas></div>

      <div class="v3-showroom-bar" data-sr-bar>
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
            <div class="v3-keys-hint">WASD Drive · Shift Nitro · Space Drift · H Horn · Drag Look</div>
            <div class="v3-tools">
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
          <button class="v3-tbtn" type="button" data-hold="down">BRK</button>
          <button class="v3-tbtn wide" type="button" data-hold="up">DRIVE</button>
          <button class="v3-tbtn" type="button" data-hold="nitro">NOS</button>
        </div>
      </div>

      <div class="v3-ov" data-start-ov>
        <div class="v3-start">
          <div class="v3-start-k">Akshat Singh · Interactive 3D Open World</div>
          <h2>Vice City Ocean Drive</h2>
          <p>Cruise golden-hour Ocean Drive, Downtown skyscrapers, and the Starfish Island causeway bridge to discover Akshat’s five case study showrooms—or stir up classic GTA street mayhem.</p>
          <button class="v3-start-btn" type="button" data-begin>Start Driving</button>
          <div class="v3-start-keys">W A S D / Arrows · Shift Nitro · Space Drift · H Horn · V Camera · C Paint · L Lights</div>
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
            <div class="v3-card-acts">
              <a class="v3-btn-primary" href="#" data-m-open>Open Full Case Study</a>
              <button class="v3-card-close" type="button" data-m-close>Resume Driving</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(stage);
    this.el = {
      stage,
      mount: stage.querySelector('[data-mount]'),
      zone: stage.querySelector('[data-zone]'),
      progress: stage.querySelector('[data-progress]'),
      speed: stage.querySelector('[data-speed]'),
      gear: stage.querySelector('[data-gear]'),
      wanted: stage.querySelector('[data-wanted]'),
      stars: Array.from(stage.querySelectorAll('[data-s]')),
      cash: stage.querySelector('[data-cash]'),
      combo: stage.querySelector('[data-combo]'),
      radarCanvas: stage.querySelector('[data-radar]'),
      srBar: stage.querySelector('[data-sr-bar]'),
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
      mClose: stage.querySelector('[data-m-close]')
    };
    this.radarCtx = this.el.radarCanvas.getContext('2d');
  }

  initWebGL() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x6e546d);
    this.scene.fog = new THREE.FogExp2(0x6e546d, 0.0018);

    const w = window.innerWidth;
    const h = window.innerHeight;
    // Higher near plane (0.6) improves 24-bit depth-buffer precision; far 1150 keeps 950m sky dome unclipped!
    this.camera = new THREE.PerspectiveCamera(56, w / h, 0.6, 1150);
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
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.el.mount.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.stopLoop(); });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => { if (this.isOpen) this.startLoop(); });

    // Golden-Hour Sunset PMREM Environment Map (vivid sky/sun/city reflections across all glass, paint & road)
    try {
      this.scene.environment = createGoldenHourEnvironment(this.renderer);
    } catch (err) {
      console.warn('[ViceCity3D] PMREM environment fallback:', err);
    }

    // Half-res Bloom + Smart MSAA EffectComposer (4x faster fill rate on Retina/4K displays!)
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
          0.22, 0.30, 1.38
        );
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(new OutputPass());
      } catch (err) {
        console.warn('[ViceCity3D] Post-processing composer fallback to direct render:', err);
        this.composer = null;
        this.bloomPass = null;
      }
    }

    const maxAniso = Math.min(this.renderer.capabilities.getMaxAnisotropy(), 4);
    this.buildLighting();
    this.buildOpenWorld(maxAniso);

    this.car = createSupercar(this.isSoftwareGl);
    this.car.root.position.set(this.carState.x, 0, this.carState.z);
    this.scene.add(this.car.root);

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

    if (!this.isSoftwareGl) {
      try { this.renderer.compile(this.scene, this.camera); } catch (_) {}
    }
    this.clock = new THREE.Clock();
  }

  buildLighting() {
    // Warm sunlit sky + warm coastal ground bounce
    const hemi = new THREE.HemisphereLight(0x88b4e8, 0x624844, 0.92);
    this.scene.add(hemi);

    // Golden-Hour Sun Directional Light aligned with SUN_DIR (crisp 1024 shadow map -> 4x faster!)
    this.sunLight = new THREE.DirectionalLight(0xffcb8c, 2.15);
    this.sunLight.position.copy(SUN_DIR).multiplyScalar(85);
    if (!this.isSoftwareGl) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 4;
      this.sunLight.shadow.camera.far = 175;
      const d = 36;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.03;
    }
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Cool sky fill light from the west so shaded building faces retain crisp architectural detail
    const fill = new THREE.DirectionalLight(0x7ca8e8, 0.52);
    fill.position.set(-55, 32, 40);
    this.scene.add(fill);
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
      map: nsTex.map, roughnessMap: nsTex.roughnessMap, bumpMap: nsTex.bumpMap,
      bumpScale: 0.03, roughness: 0.74, metalness: 0.06, envMapIntensity: 0.65
    });

    const ewTex = makeAsphaltTextures(maxAniso, 4);
    const ewRoadMat = new THREE.MeshStandardMaterial({
      map: ewTex.map, roughnessMap: ewTex.roughnessMap, bumpMap: ewTex.bumpMap,
      bumpScale: 0.03, roughness: 0.74, metalness: 0.06, envMapIntensity: 0.65
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

    // 2b. Non-Overlapping NS Avenue Road Segments strictly between intersections
    AVENUES.forEach((ax) => {
      // South stub (Z = 28.4 to 54)
      const stubS = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 25.6), nsRoadMat);
      stubS.rotation.x = -Math.PI / 2;
      stubS.position.set(ax, 0.0, 41.2);
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

      // North stub (Z = -628.4 to -654)
      const stubN = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 25.6), nsRoadMat);
      stubN.rotation.x = -Math.PI / 2;
      stubN.position.set(ax, 0.0, -641.2);
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
    const sidewalkMat = new THREE.MeshStandardMaterial({ map: makeSidewalkTexture(maxAniso, 10, 22), roughness: 0.84, metalness: 0.02 });
    const grassMat = new THREE.MeshStandardMaterial({ map: makeGrassTexture(maxAniso, 5, 10), roughness: 0.92 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xb6aea4, roughness: 0.82 });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d6e3a, roughness: 0.88 });

    // Build raised block islands between every avenue & cross-street (ZERO road overlap!)
    const blockRangesX = [
      { minX: -87.6, maxX: -8.4 },   // Between Ocean Drive & Washington Ave
      { minX: -183.6, maxX: -104.4 },// Between Washington Ave & Downtown Hwy
      { minX: -290, maxX: -200.4 }   // West Skyline Foundation beyond Downtown Hwy
    ];
    blockRangesX.forEach((bx) => {
      const bw = bx.maxX - bx.minX;
      const cx = (bx.minX + bx.maxX) * 0.5;
      for (let i = 0; i < CROSS_STREETS.length - 1; i++) {
        const zMax = CROSS_STREETS[i] - ROAD_H;
        const zMin = CROSS_STREETS[i + 1] + ROAD_H;
        const bd = zMax - zMin;
        const cz = (zMax + zMin) * 0.5;
        const block = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.32, bd), sidewalkMat);
        block.position.set(cx, 0.0, cz); // top surface = +0.16m crisp raised curb!
        block.receiveShadow = true;
        this.scene.add(block);

        // Landscaped tropical grass lawn park inset in Midtown/Downtown interior courtyard
        if (bw > 70 && bw < 85) {
          const lawn = new THREE.Mesh(new THREE.BoxGeometry(bw - 14, 0.06, bd - 18), grassMat);
          lawn.position.set(cx, 0.16, cz);
          lawn.receiveShadow = true;
          this.scene.add(lawn);
        }
      }
    });

    // East Oceanfront Raised Promenade Boardwalk (X = 8.4 to 17.6, with clean gap at Z = -300 Bridge!)
    const promSegments = [
      { zMin: -291.6, zMax: 54.0 },
      { zMin: -654.0, zMax: -308.4 }
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

    // Instanced Beach Umbrellas & Lounge Chairs along Golden Sand (3 draw calls total instead of 70!)
    const beachColors = [0xff2e88, 0x21e6d1, 0xff9e32, 0x3b82f6, 0xffd36b];
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xf4f0ea, roughness: 0.72 });
    const umbPositions = [];
    for (let z = 12; z >= -600; z -= 26) {
      if (Math.abs(z + 300) < 22) continue;
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
    const archSignTex = makeNeonSignTexture('AKSHAT SINGH · VICE CITY', 'OPEN WORLD 3D PORTFOLIO SHOWCASE', '#21E6D1', maxAniso, false);
    const archSign = new THREE.Mesh(
      new THREE.PlaneGeometry(14.5, 2.3),
      new THREE.MeshStandardMaterial({ map: archSignTex, emissive: 0xffffff, emissiveMap: archSignTex, emissiveIntensity: 0.88 })
    );
    archSign.position.set(0, 10.4, 0.66); archGroup.add(archSign);
    archGroup.position.set(0, 0, -22);
    this.scene.add(archGroup);

    // 6. Five Monumental 3D Portfolio Showrooms (EXACT SOLID COLLIDERS!)
    SHOWROOMS.forEach((sr) => {
      const showroom = createCaseStudyShowroom(sr, texLoader, maxAniso);
      showroom.position.set(sr.x, 0.16, sr.z);
      this.scene.add(showroom);
      this.addBoxCollider(sr.x - 4.0, sr.x + 4.0, sr.z - 8.6, sr.z + 8.6);
    });

    // 7. ARCHITECTURAL CITY: SUN-WARMED ART DECO HOTELS + REFLECTIVE GLASS SKYSCRAPERS!
    const hotelCatalog = [
      // Ocean Drive Beachfront Row (Sun-drenched Miami Art Deco Cream, Coral, Mint, Sand Stucco!)
      { x: -24.5, z: -48,  w: 24, h: 17, d: 15, base: '#EDE2D4', trimHex: '#FAF6F0', accent: 0xff2e88, accentHex: '#FF2E88', name: 'OCEAN VIEW',  sub: 'HOTEL · EST 1984', seed: 1, cafe: true },
      { x: -24.5, z: -116, w: 22, h: 19, d: 15, base: '#D4E6E2', trimHex: '#F4FAF8', accent: 0x0ec4b8, accentHex: '#0EC4B8', name: 'THE COLONY',  sub: 'ART DECO SUITES',  seed: 2, cafe: true },
      { x: -24.5, z: -190, w: 26, h: 21, d: 15, base: '#F0D8CA', trimHex: '#FFF5EE', accent: 0xff7a24, accentHex: '#FF7A24', name: 'STARFISH',    sub: 'MIAMI BEACH',      seed: 3, cafe: true },
      { x: -24.5, z: -252, w: 26, h: 22, d: 15, base: '#E8DCE8', trimHex: '#F8F2FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'CLEVELANDER', sub: 'LOUNGE & CLUB',    seed: 4, cafe: true },
      { x: -24.5, z: -344, w: 24, h: 20, d: 15, base: '#F2E4CC', trimHex: '#FFF9EC', accent: 0xe6a822, accentHex: '#E6A822', name: 'MALIBU CLUB', sub: 'VICE POINT',       seed: 5, cafe: true },
      { x: -24.5, z: -424, w: 24, h: 22, d: 15, base: '#D8E4EC', trimHex: '#F4F8FC', accent: 0x18c4be, accentHex: '#18C4BE', name: 'CARLYLE',     sub: 'RESIDENCES',       seed: 6, cafe: true },
      { x: -24.5, z: -512, w: 28, h: 24, d: 15, base: '#EED6DC', trimHex: '#FFF4F6', accent: 0xff2e88, accentHex: '#FF2E88', name: 'BREAKWATER',  sub: 'OCEAN FRONT',      seed: 7, cafe: true },
      { x: -24.5, z: -574, w: 26, h: 19, d: 15, base: '#E6DFD2', trimHex: '#FAF7F2', accent: 0xff7a24, accentHex: '#FF7A24', name: 'BEACON',      sub: 'ART DECO',         seed: 8, cafe: true },

      // Midtown Condos & Shopping Arcades (Between Ocean Drive & Washington Ave: X = -64)
      { x: -64, z: -60,  w: 36, h: 30, d: 24, base: '#E2D8CE', trimHex: '#F7F3EE', accent: 0x18c4be, accentHex: '#18C4BE', name: 'VICE PLAZA', sub: 'MIDTOWN',     seed: 9,  cafe: false },
      { x: -64, z: -220, w: 38, h: 36, d: 24, base: '#DCE2EC', trimHex: '#F2F6FA', accent: 0xff2e88, accentHex: '#FF2E88', name: 'BISCAYNE',   sub: 'TOWERS',      seed: 10, cafe: false },
      { x: -64, z: -380, w: 36, h: 34, d: 24, base: '#EDE0D2', trimHex: '#FFF8F0', accent: 0xe6a822, accentHex: '#E6A822', name: 'POINCIANA',  sub: 'GRAND HOTEL', seed: 11, cafe: false },
      { x: -64, z: -540, w: 38, h: 28, d: 24, base: '#D8E2E0', trimHex: '#F2F8F6', accent: 0x18c4be, accentHex: '#18C4BE', name: 'WASHINGTON', sub: 'ARCADE',      seed: 12, cafe: false }
    ];

    this.beacons = [];
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff2442, emissive: 0xff2442, emissiveIntensity: 1.8 });
    hotelCatalog.forEach((hd) => {
      const hotel = createArtDecoHotel(hd, maxAniso, this.isSoftwareGl);
      hotel.position.set(hd.x, 0.16, hd.z);
      this.scene.add(hotel);
      // Exact solid collider including corner turrets & entrance columns
      this.addBoxCollider(hd.x - hd.d * 0.5 - 0.6, hd.x + hd.d * 0.5 + 1.8, hd.z - hd.w * 0.5 - 0.8, hd.z + hd.w * 0.5 + 0.8);

      const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), beaconMat.clone());
      b.position.set(hd.x + hd.d * 0.5 + 0.82, hd.h + 6.5, hd.z);
      b.userData.phase = hd.seed * 1.3;
      this.scene.add(b);
      this.beacons.push(b);
    });

    // Downtown Reflective Glass Curtain-Wall Skyscrapers (Between Washington Ave & Downtown Hwy: X = -144)
    const glassTowers = [
      { x: -144, z: -60,  w: 40, h: 58, d: 32, glassTint: '#2b4a6e', mullionHex: '#2e3340', accent: 0x21e6d1, accentHex: '#21E6D1', name: 'RAZORPAY',    sub: 'FINTECH HQ', seed: 13 },
      { x: -144, z: -220, w: 38, h: 72, d: 30, glassTint: '#364d72', mullionHex: '#3c404e', accent: 0xff8a2a, accentHex: '#FF8A2A', name: 'HYMAN TOWER', sub: 'DOWNTOWN',   seed: 14 },
      { x: -144, z: -380, w: 42, h: 66, d: 32, glassTint: '#284c68', mullionHex: '#2b323e', accent: 0xff2e88, accentHex: '#FF2E88', name: 'VICE METRO',  sub: 'FINANCIAL',  seed: 15 },
      { x: -144, z: -540, w: 38, h: 54, d: 30, glassTint: '#324864', mullionHex: '#383d4a', accent: 0xffd36b, accentHex: '#FFD36B', name: 'HAVANA PLAZA',sub: 'GALLERIA',   seed: 16 }
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

    // Distant Reflective West Skyline Backdrop Beyond Downtown Hwy (X < -215)
    const skyGlass = makeSkyscraperGlassTextures('#284464', '#262b38', 99, maxAniso, 1, 3);
    const skyTowerMat = new THREE.MeshStandardMaterial({
      map: skyGlass.map, emissive: 0xffe4bc, emissiveMap: skyGlass.emissiveMap, emissiveIntensity: 0.45,
      metalness: 0.72, roughness: 0.22, envMapIntensity: 1.25
    });
    const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), skyTowerMat, 36);
    for (let i = 0; i < 36; i++) {
      const tw = 16 + (i % 4) * 6;
      const th = 46 + ((i * 23) % 76);
      const td = 16 + ((i * 9) % 12);
      _dummy.position.set(-228 - (i % 3) * 26, th * 0.5, 40 - i * 20);
      _dummy.scale.set(tw, th, td);
      _dummy.rotation.set(0, 0, 0);
      _dummy.updateMatrix();
      towers.setMatrixAt(i, _dummy.matrix);
    }
    towers.computeBoundingSphere();
    this.scene.add(towers);

    // 8. INSTANCED 14-FROND 3D TROPICAL PALM TREES (5 DRAW CALLS FOR ALL 76 PALMS & PLANTERS!)
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

    for (let z = 30; z >= -625; z -= 18) {
      if (Math.abs(z + 300) < 16) continue;
      const h = 8.8 + ((Math.abs(z) * 13) % 28) * 0.1;
      queuePalm(14.8, 0.16, z, h, (z * 0.7) % 6.28, true);
      if (Math.abs(z) % 36 === 0) queuePalm(23.5, -0.15, z - 8, h * 0.9, (z * 1.3) % 6.28, false);
    }
    for (let z = -10; z >= -600; z -= 34) {
      if (CROSS_STREETS.some((cs) => Math.abs(z - cs) < 16)) continue;
      queuePalm(-85.5, 0.16, z, 9.2, z * 0.5, true);
    }
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      if (Math.cos(ang) < -0.78) continue;
      queuePalm(152 + Math.cos(ang) * 31, 0.04, -300 + Math.sin(ang) * 31, 9.0 + (i % 3) * 0.9, ang, false);
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

    // 9. Instanced Streetlamps, Fire Hydrants & Benches (ALL SOLID, 7 draw calls instead of 220!)
    const lampWarmMat = new THREE.MeshStandardMaterial({ color: 0xfff0c4, emissive: 0xffd888, emissiveIntensity: 1.55 });
    const lampCyanMat = new THREE.MeshStandardMaterial({ color: 0x9cf8f0, emissive: 0x21e6d1, emissiveIntensity: 1.45 });
    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x7a4e3a, roughness: 0.82 });
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xd92834, roughness: 0.45, metalness: 0.25 });

    const lampPosts = [];
    const warmGlobes = [];
    const cyanGlobes = [];
    const benchList = [];
    const hydrantList = [];

    for (let z = 14; z >= -600; z -= 28) {
      if (Math.abs(z + 300) < 18) continue;
      lampPosts.push({ x: 9.4, z, dir: -1 });
      (z % 56 === 0 ? cyanGlobes : warmGlobes).push({ x: 9.4 - 1.72, z });
      this.addCircleCollider(9.4, z, 0.28);

      benchList.push({ x: 15.6, z: z - 12 });
      this.addBoxCollider(15.1, 16.1, z - 13.2, z - 10.8);

      if (Math.abs(z) % 56 === 0) {
        hydrantList.push({ x: -9.3, z });
        this.addCircleCollider(-9.3, z, 0.24);
      }

      if (!CROSS_STREETS.some((cs) => Math.abs(z - cs) < 16)) {
        lampPosts.push({ x: -105.4, z, dir: 1 });
        warmGlobes.push({ x: -105.4 + 1.65, z });
        this.addCircleCollider(-105.4, z, 0.28);
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

    const pier = new THREE.Group();
    const pierWood = new THREE.MeshStandardMaterial({ color: 0x6b5244, roughness: 0.86 });
    const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(46, 0.28, 5.4), pierWood); pierDeck.position.set(23, 1.4, 0); pier.add(pierDeck);
    for (let px = 4; px <= 44; px += 6) {
      for (const pz of [-2.2, 2.2]) {
        const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 3.2, 8), pierWood); piling.position.set(px, 0.2, pz); pier.add(piling);
      }
    }
    pier.position.set(17.5, 0, -430);
    this.scene.add(pier);

    // 10. North End Contact Finale Plaza (Z = -620)
    const finale = new THREE.Group();
    const mono = new THREE.Mesh(new THREE.BoxGeometry(11.6, 6.2, 0.75), poleMat); mono.position.set(0, 3.6, -15); finale.add(mono);
    const monoTex = makeNeonSignTexture('AKSHAT SINGH', 'LET’S BUILD SOMETHING ICONIC · CONTACT', '#FF2E88', maxAniso, false);
    const monoSign = new THREE.Mesh(
      new THREE.PlaneGeometry(10.8, 5.4),
      new THREE.MeshStandardMaterial({ map: monoTex, emissive: 0xffffff, emissiveMap: monoTex, emissiveIntensity: 0.88 })
    );
    monoSign.position.set(0, 3.6, -14.58); finale.add(monoSign);
    finale.position.set(0, 0, -620);
    this.scene.add(finale);
    this.addBoxCollider(-6.2, 6.2, -636.2, -634.0);

    // 11. 72 GTA Pedestrians (Promenade, Sidewalks, Crosswalk Crossers & Starfish Island!)
    this.buildPedestrians();

    // 12. Yachts, Circling Seagulls, Blimp & 10 Sculpted Traffic Cars
    this.yachts = [];
    const yachtMat = new THREE.MeshStandardMaterial({ color: 0xf4f0f6, roughness: 0.35, metalness: 0.15 });
    const yachtGlow = new THREE.MeshStandardMaterial({ color: 0xffe49c, emissive: 0xffd274, emissiveIntensity: 1.25 });
    [{ x: 96, z: -110, speed: -2.4 }, { x: 235, z: -260, speed: 1.9 }, { x: 105, z: -480, speed: -1.8 }].forEach((yd) => {
      const yGroup = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.6, 16), yachtMat); hull.position.y = 0.8; yGroup.add(hull);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 8.5), yachtMat); cabin.position.set(0, 2.3, 1.0); yGroup.add(cabin);
      const win = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.45, 7.6), yachtGlow); win.position.set(0, 2.2, 1.0); yGroup.add(win);
      yGroup.position.set(yd.x, -0.45, yd.z); yGroup.userData.speed = yd.speed;
      this.scene.add(yGroup); this.yachts.push(yGroup);
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
    [
      { x: -3.6,   z: -68,  speed:  12, color: 0xe6a834 },
      { x: -3.6,   z: -240, speed:  14, color: 0x18b5aa },
      { x: -3.6,   z: -470, speed:  12, color: 0xd93060 },
      { x:  3.6,   z: -155, speed: -13, color: 0xe2dde8 },
      { x:  3.6,   z: -410, speed: -13, color: 0x3b66d8 },
      { x: -99.6,  z: -90,  speed:  13, color: 0xe68838 },
      { x: -99.6,  z: -360, speed:  12, color: 0x18b5aa },
      { x: -92.4,  z: -200, speed: -14, color: 0xd93060 },
      { x: -195.6, z: -140, speed:  15, color: 0xe2dde8 },
      { x: -188.4, z: -440, speed: -15, color: 0xe6a834 }
    ].forEach((ts) => {
      const tc = createTrafficCar(ts.color);
      tc.position.set(ts.x, 0, ts.z);
      if (ts.speed > 0) tc.rotation.y = Math.PI;
      tc.userData = { speed: ts.speed, baseSpeed: ts.speed, stun: 0, vx: 0, vz: 0 };
      this.scene.add(tc);
      this.traffic.push(tc);
    });

    // Pooled Sparks, Drift Smoke & Arcade Squish Particles
    const partTex = makeSoftParticleTexture();
    this.particles = [];
    for (let i = 0; i < 64; i++) {
      const mat = new THREE.SpriteMaterial({ map: partTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.visible = false;
      this.scene.add(sp);
      this.particles.push({ sprite: sp, life: 0, maxLife: 1, vx: 0, vy: 0, vz: 0, grow: 1, gravity: 0 });
    }
    this.particleCursor = 0;
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

    const addPed = (x, y, z, dir, jog, i, axis = 'z', minPos = -610, maxPos = 24) => {
      const p = createPedestrian({
        x, y, z, dir, jog, axis, minPos, maxPos,
        speed: dir === 0 ? 0 : (jog ? 3.5 : 1.45 + (i % 4) * 0.24),
        phase: i * 1.15,
        scale: 0.94 + (i % 4) * 0.045,
        skin: skins[i % skins.length],
        shirt: shirts[(i * 3) % shirts.length],
        pants: pants[(i * 2) % pants.length],
        hair: hairs[(i * 5) % hairs.length],
        shoe: i % 2 === 0 ? 0xf2eff6 : 0x1b1824,
        blazer: !jog && i % 3 === 0,
        shades: i % 2 === 0
      }, sharedGeos, splatMat, starMat, pedMats);
      p.root.position.set(p.x, p.y, p.z);
      p.root.rotation.y = axis === 'x' ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
      this.scene.add(p.root);
      this.pedestrians.push(p);
      return p;
    };

    // 26 Ocean Drive East Promenade Walkers & Joggers
    for (let i = 0; i < 26; i++) addPed(10.6 + (i % 4) * 0.95, 0.16, 10 - i * 24, i % 2 === 0 ? -1 : 1, i % 5 === 0, i);
    // 14 Ocean Drive West Hotel Sidewalk Walkers
    for (let i = 0; i < 14; i++) addPed(-10.4 - (i % 2) * 0.9, 0.16, -12 - i * 44, i % 2 === 0 ? -1 : 1, false, i + 30);
    // 14 Street & Crosswalk Crossers (walking right across Ocean Drive & Washington Ave!)
    const crossSpots = [
      { z: -32, ax: 0 }, { z: -56, ax: 0 }, { z: -133, ax: 0 }, { z: -147, ax: 0 },
      { z: -215, ax: 0 }, { z: -293, ax: 0 }, { z: -307, ax: 0 }, { z: -453, ax: 0 },
      { z: -467, ax: 0 }, { z: -550, ax: 0 }, { z: -133, ax: -96 }, { z: -293, ax: -96 },
      { z: -453, ax: -96 }, { z: -300, ax: 146 }
    ];
    crossSpots.forEach((cs, i) => {
      const startX = cs.ax + (i % 2 === 0 ? -5.5 : 5.5);
      addPed(startX, 0.01, cs.z, i % 2 === 0 ? 1 : -1, false, i + 50, 'x', cs.ax - 9.5, cs.ax + 9.5);
    });
    // 12 Washington Ave Sidewalk Walkers
    for (let i = 0; i < 12; i++) addPed(i % 2 === 0 ? -85.4 : -106.6, 0.16, -22 - i * 50, i % 3 === 0 ? 1 : -1, i % 4 === 0, i + 70);
    // 6 Starfish Island Strollers
    for (let i = 0; i < 6; i++) addPed(142 + i * 3.2, 0.04, -314 + (i % 3) * 14, i % 2 === 0 ? 1 : -1, false, i + 90, 'z', -320, -280);
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
      // 1. World Perimeter Bounds
      if (cs.x < -200.5) { cs.x = -200.5; totalPush += 0.5; }
      if (cs.z > 46) { cs.z = 46; totalPush += 0.5; }
      if (cs.z < -644) { cs.z = -644; totalPush += 0.5; }

      // 2. Starfish Island Peninsula Water Perimeter (X > 128)
      if (cs.x > 126) {
        const distI = Math.hypot(cs.x - 152, cs.z + 300);
        if (distI > 31.5) {
          const nx = (cs.x - 152) / distI;
          const nz = (cs.z + 300) / distI;
          const over = distI - 31.5;
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

  planAutopilotTo(wp) {
    const cs = this.carState;
    const queue = [];
    if (cs.x > 18 && wp.x <= 18) queue.push({ x: 8, z: -300 });
    if (wp.x > 18 && cs.x <= 18) {
      if (Math.abs(cs.x) > 14) {
        const nearCross = CROSS_STREETS.reduce((a, b) => Math.abs(b - cs.z) < Math.abs(a - cs.z) ? b : a);
        queue.push({ x: cs.x, z: nearCross }, { x: 0, z: nearCross });
      }
      queue.push({ x: 0, z: -300 }, { x: 80, z: -300 }, { x: wp.x, z: wp.z });
      this.autopilotQueue = queue;
      return;
    }
    const targetAve = Math.abs(wp.x + 96) < 40 ? -96 : 0;
    const currAve = Math.abs(cs.x + 192) < 40 ? -192 : (Math.abs(cs.x + 96) < 40 ? -96 : 0);
    if (currAve !== targetAve) {
      const nearCross = CROSS_STREETS.reduce((a, b) => Math.abs(b - wp.z) < Math.abs(a - wp.z) ? b : a);
      queue.push({ x: currAve, z: nearCross }, { x: targetAve, z: nearCross });
    }
    queue.push({ x: wp.x, z: wp.z });
    this.autopilotQueue = queue;
  }

  drawRadar() {
    const ctx = this.radarCtx;
    if (!ctx) return;
    const w = 180, h = 180;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0e2438';
    ctx.fillRect(0, 0, w, h);

    const cs = this.carState;
    const scale = 0.38;
    const toRadar = (wx, wz) => [w * 0.5 + (wx - cs.x) * scale, h * 0.5 + (wz - cs.z) * scale];

    const [landR] = toRadar(24, cs.z);
    ctx.fillStyle = '#1e1c28';
    ctx.fillRect(0, 0, Math.max(0, Math.min(w, landR)), h);

    const [ix, iy] = toRadar(152, -300);
    ctx.fillStyle = '#2d2838';
    ctx.beginPath(); ctx.arc(ix, iy, 36 * scale, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = 'rgba(232, 228, 240, 0.44)';
    ctx.lineWidth = 5;
    AVENUES.forEach((ax) => {
      const [x1, y1] = toRadar(ax, 40);
      const [x2, y2] = toRadar(ax, -640);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    CROSS_STREETS.forEach((cz) => {
      const [x1, y1] = toRadar(-200, cz);
      const [x2, y2] = toRadar(8, cz);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    });
    const [bx1, by1] = toRadar(8, -300);
    const [bx2, by2] = toRadar(145, -300);
    ctx.strokeStyle = 'rgba(33, 230, 209, 0.72)';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2); ctx.stroke();

    SHOWROOMS.forEach((sr) => {
      const [sx, sy] = toRadar(sr.x, sr.z);
      ctx.fillStyle = this.visited.has(sr.id) ? '#FFD36B' : sr.accentHex;
      ctx.beginPath(); ctx.arc(sx, sy, 4.2, 0, Math.PI * 2); ctx.fill();
    });

    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate(-cs.yaw);
    ctx.fillStyle = '#FFF5EE';
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6); ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 245, 238, 0.75)';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText('N', w - 16, 15);
  }

  bindEvents() {
    this.el.beginBtn.addEventListener('click', () => { this.started = true; this.el.startOv.hidden = true; });
    this.el.closeBtn.addEventListener('click', () => this.close());
    this.el.mClose.addEventListener('click', () => { this.el.modal.hidden = true; });
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
    this.el.audioBtn.addEventListener('click', () => {
      const next = !this.audio.enabled;
      this.audio.setEnabled(next);
      this.el.audioBtn.textContent = next ? 'Audio: On' : 'Audio: Off';
      this.el.audioBtn.classList.toggle('on', next);
    });

    this.el.stage.querySelectorAll('[data-hold]').forEach((btn) => {
      const key = btn.dataset.hold;
      const setHeld = (v) => {
        this.keys[key] = v; btn.classList.toggle('held', v);
        if (v) { this.autopilotQueue = []; if (!this.started) { this.started = true; this.el.startOv.hidden = true; } }
      };
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); setHeld(true); });
      btn.addEventListener('pointerup', () => setHeld(false));
      btn.addEventListener('pointercancel', () => setHeld(false));
      btn.addEventListener('pointerleave', () => setHeld(false));
    });

    this.el.mount.addEventListener('pointerdown', (e) => { this.dragging = true; this.lastPtrX = e.clientX; this.lastPtrY = e.clientY; });
    window.addEventListener('pointermove', (e) => {
      if (!this.dragging || !this.isOpen) return;
      const dx = e.clientX - this.lastPtrX, dy = e.clientY - this.lastPtrY;
      this.lastPtrX = e.clientX; this.lastPtrY = e.clientY;
      this.orbitYawOffset = THREE.MathUtils.clamp(this.orbitYawOffset - dx * 0.005, -2.6, 2.6);
      this.orbitPitchOffset = THREE.MathUtils.clamp(this.orbitPitchOffset + dy * 0.003, -0.35, 0.78);
    });
    window.addEventListener('pointerup', () => { this.dragging = false; });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); if (!this.el.modal.hidden) this.el.modal.hidden = true; else this.close(); return; }
      if (e.key === 'Enter' && this.activeShowroom && this.el.modal.hidden) { e.preventDefault(); this.openShowroomModal(this.activeShowroom); return; }
      if (e.key === 'Tab') { e.preventDefault(); this.el.dockToggle.click(); return; }
      if (e.key === 'v' || e.key === 'V') { this.cycleCamera(); return; }
      if (e.key === 'c' || e.key === 'C') { this.setPaint((this.paintIdx + 1) % PAINTS.length); return; }
      if (e.key === 'l' || e.key === 'L') { this.toggleLights(); return; }
      if (e.key === 'm' || e.key === 'M') { this.el.audioBtn.click(); return; }
      if (e.key === 'h' || e.key === 'H') {
        this.audio.horn();
        for (let i = 0; i < this.pedestrians.length; i++) {
          const p = this.pedestrians[i];
          if (p.state === 'walk' && Math.hypot(p.x - this.carState.x, p.z - this.carState.z) < 22) {
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
      if (drivingKey) { this.autopilotQueue = []; if (!this.started) { this.started = true; this.el.startOv.hidden = true; } }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') this.keys.up = false;
      if (k === 's' || e.key === 'ArrowDown') this.keys.down = false;
      if (k === 'a' || e.key === 'ArrowLeft') this.keys.left = false;
      if (k === 'd' || e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === 'Shift') this.keys.nitro = false;
      if (e.key === ' ') this.keys.drift = false;
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
    this.car.headLights.forEach((s) => { s.intensity = this.lightsOn ? 1.85 : 0; });
    this.car.headLensMat.emissiveIntensity = this.lightsOn ? 1.35 : 0.06;
  }

  openShowroomModal(sr) {
    if (sr.id === 'contact') {
      this.el.mImg.src = '/assets/images/home-1.webp';
      this.el.mImg.alt = 'Akshat Singh Portrait';
      this.el.mK.textContent = 'Miami Beach Plaza · Contact';
      this.el.mTitle.textContent = 'Akshat Singh';
      this.el.mDesc.textContent = 'Staff Product Designer at Razorpay crafting interactive product storytelling, AI-native workflows, and high-conversion commerce systems.';
      this.el.mStat.textContent = 'Bengaluru, India · Open to Select Collaborations';
      this.el.mOpen.textContent = 'Email Akshat';
      this.el.mOpen.href = 'mailto:akshat018singh@gmail.com';
    } else {
      this.el.mImg.src = sr.img; this.el.mImg.alt = sr.title;
      this.el.mK.textContent = `Showroom ${sr.num} · ${sr.district}`;
      this.el.mTitle.textContent = sr.title;
      this.el.mDesc.textContent = sr.desc;
      this.el.mStat.textContent = sr.stat;
      this.el.mOpen.textContent = 'Open Full Case Study';
      this.el.mOpen.href = sr.url;
    }
    this.el.modal.hidden = false;
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
    this.el.stage.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.onResize();
    this.clock.getDelta();
    this.startLoop();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
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

  update(dt, elapsed) {
    const cs = this.carState;
    if (this.impactCooldown > 0) this.impactCooldown -= dt;
    if (this.camShake > 0) this.camShake = Math.max(0, this.camShake - dt * 1.4);
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

    // 1. Living World & Sky Follows Camera
    this.skyDome.position.copy(this.camera.position);
    this.skyDome.material.uniforms.uTime.value = elapsed;
    this.ocean.material.uniforms.uTime.value = elapsed;

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

    // 2. Supercar Driving & Autopilot
    let accelInput = 0, steerInput = 0, braking = false, nitroActive = false, drifting = false;

    if (this.autopilotQueue.length > 0) {
      const tgt = this.autopilotQueue[0];
      const dx = tgt.x - cs.x, dz = tgt.z - cs.z, dist = Math.hypot(dx, dz);
      const arriveDist = this.autopilotQueue.length === 1 ? 3.2 : 8.0;
      if (dist < arriveDist) {
        this.autopilotQueue.shift();
        if (this.autopilotQueue.length === 0) cs.speed *= 0.65;
      } else {
        const desiredYaw = Math.atan2(-dx, -dz);
        let diff = desiredYaw - cs.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        steerInput = THREE.MathUtils.clamp(diff * 2.2, -1, 1);
        const turnSlow = Math.abs(diff) > 0.7 ? 14 : 46;
        const targetSpd = THREE.MathUtils.clamp(dist * 1.4, 10, turnSlow);
        accelInput = cs.speed < targetSpd ? 0.92 : -0.45;
      }
    } else if (this.started && this.el.modal.hidden) {
      if (this.keys.up) accelInput += 1;
      if (this.keys.down) accelInput -= 1;
      if (this.keys.left) steerInput += 1;
      if (this.keys.right) steerInput -= 1;
      nitroActive = this.keys.nitro && cs.speed > 4;
      braking = (this.keys.down && cs.speed > 1.5) || this.keys.drift;
      drifting = this.keys.drift && Math.abs(cs.speed) > 12 && Math.abs(steerInput) > 0.1;
    }

    const maxSpeed = nitroActive ? 72 : 52;
    const accelRate = nitroActive ? 36 : 22;
    let targetPitch = 0;

    if (accelInput > 0) {
      cs.speed = Math.min(maxSpeed, cs.speed + accelInput * accelRate * dt);
      targetPitch = nitroActive ? 0.045 : 0.022;
    } else if (accelInput < 0) {
      if (cs.speed > 0.8) { cs.speed = Math.max(0, cs.speed - 36 * dt); targetPitch = -0.042; }
      else { cs.speed = Math.max(-16, cs.speed + accelInput * 14 * dt); targetPitch = -0.02; }
    } else {
      cs.speed = THREE.MathUtils.damp(cs.speed, 0, 1.35, dt);
    }
    if (this.keys.drift && Math.abs(cs.speed) > 4) cs.speed = THREE.MathUtils.damp(cs.speed, 0, 1.8, dt);

    cs.steer = THREE.MathUtils.damp(cs.steer, steerInput * 0.45, 10, dt);
    const speedFactor = THREE.MathUtils.clamp(Math.abs(cs.speed) / 13, 0, 1);
    cs.yaw += cs.steer * speedFactor * (drifting ? 2.55 : 1.85) * (cs.speed >= -0.05 ? 1 : -1) * dt;
    cs.driftSlip = THREE.MathUtils.damp(cs.driftSlip, drifting ? steerInput * 0.24 : 0, 6, dt);

    const moveYaw = cs.yaw - cs.driftSlip;
    cs.x += -Math.sin(moveYaw) * cs.speed * dt;
    cs.z += -Math.cos(moveYaw) * cs.speed * dt;

    // 3. Solid Traffic Cars (TRUE SOLID COLLISION + KNOCKBACK!)
    const fwdX = -Math.sin(cs.yaw), fwdZ = -Math.cos(cs.yaw);
    for (let i = 0; i < this.traffic.length; i++) {
      const tc = this.traffic[i];
      const u = tc.userData;
      if (u.stun > 0) {
        u.stun = Math.max(0, u.stun - dt);
        tc.position.x += u.vx * dt;
        tc.position.z += u.vz * dt;
        u.vx *= Math.pow(0.08, dt);
        u.vz *= Math.pow(0.08, dt);
      } else {
        tc.position.z += u.baseSpeed * dt;
        if (tc.position.z > 48) tc.position.z = -610;
        if (tc.position.z < -615) tc.position.z = 42;
      }

      const tdx = tc.position.x - cs.x, tdz = tc.position.z - cs.z;
      const tDistSq = tdx * tdx + tdz * tdz;
      const tVis = tDistSq < 48400; // 220m visibility culling
      if (tc.visible !== tVis) tc.visible = tVis;
      if (tDistSq > 100) continue; // Skip 3-point collision test when >10m away

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
          u.stun = 1.6;
          u.vx = -nx * Math.min(Math.abs(cs.speed) * 0.35, 10);
          u.vz = -nz * Math.min(Math.abs(cs.speed) * 0.35, 10);
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

    // 5. GTA Pedestrians (Walking, Crossing, Panic, Direct Run-Over Squish & Ragdoll Flight!)
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

      const dxCar = ped.x - cs.x;
      const dzCar = ped.z - cs.z;
      const distSq = dxCar * dxCar + dzCar * dzCar;

      // Distance-cull far pedestrians (>115m invisible -> skips distant draw calls!)
      const isVisible = distSq < 13225; // 115^2
      if (ped.root.visible !== isVisible) ped.root.visible = isVisible;

      // Check car-vs-pedestrian collision only when near car (<5m)
      if (carAbsSpd > 2.2 && distSq < 25) {
        const fwdDist = dxCar * fwdX + dzCar * fwdZ;
        const latDist = dxCar * rightX + dzCar * rightZ;
        if (Math.abs(fwdDist) < 2.55 && Math.abs(latDist) < 1.32) {
          this.triggerSquish(ped, carAbsSpd, latDist);
          continue;
        }
      }

      // Normal walking or panicked fleeing
      if (ped.state === 'panic') {
        ped.stateTimer -= dt;
        const fd = Math.max(0.1, Math.sqrt(distSq));
        const runSpd = 5.4;
        const nx = ped.x + (dxCar / fd) * runSpd * dt;
        const nz = ped.z + (dzCar / fd) * runSpd * dt;
        ped.x = THREE.MathUtils.clamp(nx, -200, 16.5);
        ped.z = THREE.MathUtils.clamp(nz, -630, 35);
        ped.root.rotation.y = Math.atan2(dxCar, dzCar);
        if (isVisible) {
          const sw = Math.sin(elapsed * 14 + ped.phase);
          ped.legL.rotation.x = sw * 0.85; ped.legR.rotation.x = -sw * 0.85;
          ped.armL.rotation.x = -2.6 + sw * 0.3; ped.armR.rotation.x = -2.6 - sw * 0.3;
          ped.body.position.y = Math.abs(sw) * 0.1;
        }
        if (ped.stateTimer <= 0) ped.state = 'walk';
      } else if (ped.dir !== 0) {
        if (ped.axis === 'x') {
          ped.x += ped.dir * ped.speed * dt;
          if (ped.x > ped.maxPos) { ped.x = ped.maxPos; ped.dir = -1; }
          if (ped.x < ped.minPos) { ped.x = ped.minPos; ped.dir = 1; }
          if (isVisible) ped.root.rotation.y = ped.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          ped.z += ped.dir * ped.speed * dt;
          if (ped.z < ped.minPos) ped.z = ped.maxPos;
          if (ped.z > ped.maxPos) ped.z = ped.minPos;
          if (isVisible) ped.root.rotation.y = ped.dir > 0 ? 0 : Math.PI;
        }
        if (distSq < 8100) { // Animate limbs only within 90m
          const freq = ped.jog ? 9.5 : 5.4;
          const sw = Math.sin(elapsed * freq + ped.phase);
          ped.legL.rotation.x = sw * (ped.jog ? 0.72 : 0.44);
          ped.legR.rotation.x = -sw * (ped.jog ? 0.72 : 0.44);
          ped.armL.rotation.x = -sw * (ped.jog ? 0.82 : 0.36);
          ped.armR.rotation.x = sw * (ped.jog ? 0.82 : 0.36);
          ped.body.position.y = Math.abs(sw) * (ped.jog ? 0.08 : 0.035);
          ped.body.rotation.x = ped.jog ? 0.12 : 0.02;
        }
      }
      if (isVisible) ped.root.position.set(ped.x, ped.y, ped.z);
    }

    // 6. Apply Supercar Transform, Suspension, Wheels & Particles
    this.car.root.position.set(cs.x, 0, cs.z);
    this.car.root.rotation.y = cs.yaw;
    cs.pitch = THREE.MathUtils.damp(cs.pitch, targetPitch, 8, dt);
    cs.roll = THREE.MathUtils.damp(cs.roll, -cs.steer * speedFactor * (drifting ? 0.12 : 0.065), 8, dt);
    this.car.bodyGroup.rotation.x = cs.pitch;
    this.car.bodyGroup.rotation.z = cs.roll;
    this.car.bodyGroup.position.y = Math.sin(elapsed * 22) * Math.min(carAbsSpd * 0.0004, 0.012);

    cs.wheelSpin -= cs.speed * dt * 2.85;
    for (let i = 0; i < this.car.wheelSpinGroups.length; i++) this.car.wheelSpinGroups[i].rotation.x = cs.wheelSpin;
    for (let i = 0; i < this.car.frontSteerGroups.length; i++) this.car.frontSteerGroups[i].rotation.y = cs.steer;
    cs.popAngle = THREE.MathUtils.damp(cs.popAngle, this.lightsOn ? 0.56 : 0.0, 10, dt);
    for (let i = 0; i < this.car.popPods.length; i++) this.car.popPods[i].rotation.x = cs.popAngle;

    this.car.tailMat.emissiveIntensity = braking ? 2.1 : 1.1;
    this.car.brakeLight.intensity = braking ? 1.85 : 0.6;
    const flameAlpha = nitroActive ? 0.65 + Math.sin(elapsed * 55) * 0.2 : 0;
    this.car.flameOuterMat.opacity = flameAlpha;
    this.car.flameCoreMat.opacity = flameAlpha * 1.05;
    const flameScale = nitroActive ? 0.95 + Math.sin(elapsed * 64) * 0.24 : 0.01;
    for (let i = 0; i < this.car.nitroFlames.length; i++) this.car.nitroFlames[i].scale.set(1, flameScale, 1);

    if (drifting && Math.random() < 0.65) {
      this.spawnParticle(cs.x - fwdX * 1.4 + (Math.random() - 0.5) * 1.4, 0.24, cs.z - fwdZ * 1.4, (Math.random() - 0.5) * 1.4, 0.9, (Math.random() - 0.5) * 1.4, 0xe8e4f0, 0.85, 0.65, 2.4);
    }
    if (nitroActive && Math.random() < 0.7) {
      this.spawnParticle(cs.x - fwdX * 2.5 + (Math.random() - 0.5) * 0.9, 0.28, cs.z - fwdZ * 2.5, 0, 0.4, 0, 0x21e6d1, 0.52, 0.35, 1.4);
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

    // Keep shadow frustum anchored around player car
    this.sunLight.position.set(cs.x + SUN_DIR.x * 85, SUN_DIR.y * 85, cs.z + SUN_DIR.z * 85);
    this.sunLight.target.position.set(cs.x, 0, cs.z);

    // 7. Smooth Camera Choreography + Impact Micro-Shake
    if (!this.dragging && carAbsSpd > 4) {
      this.orbitYawOffset = THREE.MathUtils.damp(this.orbitYawOffset, 0, 2.5, dt);
      this.orbitPitchOffset = THREE.MathUtils.damp(this.orbitPitchOffset, 0, 2.5, dt);
    }
    const speedRatio = THREE.MathUtils.clamp(carAbsSpd / 64, 0, 1);
    const camMode = CAM_MODES[this.camIdx];
    let camDist = 8.8, camHeight = 2.50, lookAhead = 8.5;
    let targetFov = 55 + speedRatio * 14 + (nitroActive ? 5 : 0);

    if (!this.started) {
      const a = elapsed * 0.22;
      _vecA.set(cs.x + Math.sin(a) * 6.8, 2.15, cs.z + Math.cos(a) * 6.8);
      _vecB.set(cs.x, 0.9, cs.z - 0.5);
      targetFov = 48;
    } else if (camMode === 'Low') {
      camDist = 5.6; camHeight = 1.28; lookAhead = 12.0; targetFov = 62 + speedRatio * 15;
      const yaw = cs.yaw + this.orbitYawOffset;
      _vecA.set(cs.x + Math.sin(yaw) * camDist, camHeight + this.orbitPitchOffset * 2, cs.z + Math.cos(yaw) * camDist);
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead, 0.85, cs.z - Math.cos(cs.yaw) * lookAhead);
    } else if (camMode === 'Drone') {
      camDist = 14.5; camHeight = 9.4; lookAhead = 8.0; targetFov = 50 + speedRatio * 8;
      const yaw = cs.yaw + 0.34 + this.orbitYawOffset;
      _vecA.set(cs.x + Math.sin(yaw) * camDist, camHeight + this.orbitPitchOffset * 4, cs.z + Math.cos(yaw) * camDist);
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead - 2.2, 1.0, cs.z - Math.cos(cs.yaw) * lookAhead);
    } else {
      const yaw = cs.yaw + this.orbitYawOffset;
      _vecA.set(cs.x + Math.sin(yaw) * (camDist + speedRatio * 1.4), camHeight + this.orbitPitchOffset * 3.2, cs.z + Math.cos(yaw) * (camDist + speedRatio * 1.4));
      _vecB.set(cs.x - Math.sin(cs.yaw) * lookAhead, 0.78, cs.z - Math.cos(cs.yaw) * lookAhead);
    }

    const sx = (Math.random() - 0.5) * this.camShake;
    const sy = (Math.random() - 0.5) * this.camShake;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _vecA.x + sx, 7.5, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, Math.max(0.8, _vecA.y + sy), 7.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _vecA.z, 7.5, dt);
    const nextFov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, dt);
    if (Math.abs(nextFov - this.camera.fov) > 0.02) {
      this.camera.fov = nextFov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.lookAt(_vecB);

    this.audio.update(speedRatio, nitroActive, drifting);
    if (this.frameCount % 4 === 0) this.drawRadar();

    // 8. HUD & Showroom Proximity (only mutate DOM when values change!)
    const kmh = Math.round(carAbsSpd * 3.9);
    if (kmh !== this.lastHudKmh) {
      this.lastHudKmh = kmh;
      this.el.speed.textContent = String(kmh);
    }
    const gearStr = cs.speed < -0.5 ? 'R' : kmh < 4 ? 'N' : String(Math.min(5, Math.floor(kmh / 46) + 1));
    if (gearStr !== this.lastHudGear) {
      this.lastHudGear = gearStr;
      this.el.gear.textContent = gearStr;
    }

    let zoneText = 'Ocean Beach · Ocean Drive';
    if (cs.x > 115) zoneText = 'Starfish Island';
    else if (cs.x > 16) zoneText = 'Starfish Causeway Bridge';
    else if (cs.x < -145) zoneText = 'Downtown Vice Skyline';
    else if (cs.x < -55) zoneText = 'Washington Avenue';
    else if (cs.z < -580) zoneText = 'Miami Beach Plaza';
    else if (cs.z < -330) zoneText = 'Vice Point · Ocean Drive';
    if (zoneText !== this.lastHudZone) {
      this.lastHudZone = zoneText;
      this.el.zone.textContent = zoneText;
    }

    let nearestWp = WAYPOINTS[0], bestWpDist = Infinity;
    for (let i = 0; i < WAYPOINTS.length; i++) {
      const d = Math.hypot(cs.x - WAYPOINTS[i].x, cs.z - WAYPOINTS[i].z);
      if (d < bestWpDist) { bestWpDist = d; nearestWp = WAYPOINTS[i]; }
    }
    const trackPct = Math.round(THREE.MathUtils.clamp((50 - cs.z) / 670, 0.04, 1) * 100);
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
      if (Math.hypot(cs.x - sr.parkX, cs.z - sr.parkZ) < 16) {
        found = sr;
        if (!this.visited.has(sr.id)) {
          this.visited.add(sr.id);
          this.el.progress.textContent = `${this.visited.size} / 5 Showrooms Explored`;
          this.el.wpBtns.forEach((b) => b.classList.toggle('visited', this.visited.has(b.dataset.wp)));
        }
        break;
      }
    }
    if (!found && Math.hypot(cs.x, cs.z + 620) < 18) {
      found = { id: 'contact', district: 'Miami Beach Plaza', title: 'Connect with Akshat', stat: 'Staff Product Designer · Razorpay', url: 'mailto:akshat018singh@gmail.com' };
    }
    if (found !== this.activeShowroom) {
      this.activeShowroom = found;
      if (found) {
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
