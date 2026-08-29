import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// --- DOM要素 ---
const scoreEl = document.getElementById('score');
const timeTakenEl = document.getElementById('time-taken');
const accEl = document.getElementById('acc');
const clearCountEl = document.getElementById('clear-count');
const clearGoalEl = document.getElementById('clear-goal');
const gaugeBar = document.getElementById('gauge-bar');
const trackingStatusEl = document.getElementById('tracking-status');
const targetHealthEl = document.getElementById('target-health');
const targetHealthBar = document.getElementById('target-health-bar');

const menuEl = document.getElementById('menu');
const uiEl = document.getElementById('ui');
const startBtn = document.getElementById('start-btn');
const resultStats = document.getElementById('result-stats');
const bestScoreDisplay = document.getElementById('best-score-display');
const crosshairContainer = document.getElementById('crosshair-container');
const countdownOverlay = document.getElementById('countdown-overlay');
const pauseOverlay = document.getElementById('pause-overlay');
const resumeBtn = document.getElementById('resume-btn');
const quitBtn = document.getElementById('quit-btn');

const modeInput = document.getElementById('game-mode');
const themeInput = document.getElementById('theme-mode');
const weaponDisplayInput = document.getElementById('weapon-display');
const rangeInput = document.getElementById('target-range');
const targetGoalInput = document.getElementById('target-goal');
const targetColorInput = document.getElementById('target-color');
const sensInput = document.getElementById('val-sens');
const targetCountInput = document.getElementById('target-count');
const targetCountVal = document.getElementById('target-count-val');
const targetSizeInput = document.getElementById('target-size');
const targetSizeVal = document.getElementById('target-size-val');

const valCodeInput = document.getElementById('val-code');
const chSizeInput = document.getElementById('ch-size');
const chSizeVal = document.getElementById('ch-size-val');
const chColorInput = document.getElementById('ch-color');

const MODE_LABELS = {
  gridshot: 'Gridshot',
  tracking: 'Moving',
  'smooth-tracking': 'Tracking',
  flick: 'Flick'
};

// --- クロスヘアコード解析器 ---
function parseValorantCode(code) {
  if (!code || typeof code !== 'string') return null;
  const tokens = code.trim().split(';');
  const settings = {
    color: '#00ff00', outline: true, outlineOpacity: 0.5, outlineThickness: 1,
    centerDot: false, centerDotOpacity: 1, centerDotSize: 2,
    innerLines: true, innerOpacity: 0.8, innerLength: 6, innerVertLength: null, innerThickness: 2, innerOffset: 3,
    outerLines: false, outerOpacity: 0.8, outerLength: 6, outerVertLength: null, outerThickness: 2, outerOffset: 10
  };
  const colors = { '0': '#ffffff', '1': '#00ff00', '2': '#7fff00', '3': '#dfff00', '4': '#ffff00', '5': '#00ffff', '6': '#ff00ff', '7': '#ff0000' };
  let inPrimary = !tokens.includes('P');

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === 'P') { inPrimary = true; continue; }
    if (token === 'S' || token === 'A') { inPrimary = false; continue; }
    if (!inPrimary) continue;

    const key = token;
    const val = tokens[i + 1];

    if (val !== undefined) {
      if (key === 'c') { settings.color = colors[val] || settings.color; i++; }
      else if (key === 'u') { settings.color = '#' + val.substring(0, 6); i++; }
      else if (key === 'h') { settings.outline = val === '1'; i++; }
      else if (key === 'o') { settings.outlineOpacity = parseFloat(val); i++; }
      else if (key === 't') { settings.outlineThickness = parseFloat(val); i++; }
      else if (key === 'd') { settings.centerDot = val === '1'; i++; }
      else if (key === 'a') { settings.centerDotOpacity = parseFloat(val); i++; }
      else if (key === 'z') { settings.centerDotSize = parseFloat(val); i++; }
      else if (key === '0b') { settings.innerLines = val === '1'; i++; }
      else if (key === '0a') { settings.innerOpacity = parseFloat(val); i++; }
      else if (key === '0l') { settings.innerLength = parseFloat(val); i++; }
      else if (key === '0v') { settings.innerVertLength = parseFloat(val); i++; }
      else if (key === '0t') { settings.innerThickness = parseFloat(val); i++; }
      else if (key === '0o') { settings.innerOffset = parseFloat(val); i++; }
      else if (key === '1b') { settings.outerLines = val === '1'; i++; }
      else if (key === '1a') { settings.outerOpacity = parseFloat(val); i++; }
      else if (key === '1l') { settings.outerLength = parseFloat(val); i++; }
      else if (key === '1v') { settings.outerVertLength = parseFloat(val); i++; }
      else if (key === '1t') { settings.outerThickness = parseFloat(val); i++; }
      else if (key === '1o') { settings.outerOffset = parseFloat(val); i++; }
    }
  }

  if (settings.innerVertLength === null) settings.innerVertLength = settings.innerLength;
  if (settings.outerVertLength === null) settings.outerVertLength = settings.outerLength;
  return settings;
}

function updateCrosshairDisplay() {
  const code = valCodeInput.value.trim();
  crosshairContainer.innerHTML = '';

  if (code) {
    const s = parseValorantCode(code);
    if (s) {
      const outlineBorder = s.outline ? `outline: ${s.outlineThickness}px solid rgba(0,0,0,${s.outlineOpacity});` : '';
      if (s.centerDot) {
        const dot = document.createElement('div');
        dot.style.cssText = `position: absolute; top: 50%; left: 50%; width: ${s.centerDotSize}px; height: ${s.centerDotSize}px; background-color: ${s.color}; opacity: ${s.centerDotOpacity}; transform: translate(-50%, -50%); ${s.outline ? `box-shadow: 0 0 0 ${s.outlineThickness}px rgba(0,0,0,${s.outlineOpacity});` : ''}`;
        crosshairContainer.appendChild(dot);
      }
      const createLine = (isVert, isPositive, offset, thickness, length, vertLength, opacity) => {
        const el = document.createElement('div');
        const w = isVert ? thickness : length;
        const h = isVert ? vertLength : thickness;
        let posCss = isVert ? (isPositive ? `top: 50%; left: 50%; transform: translateX(-50%); margin-top: ${offset}px;` : `bottom: 50%; left: 50%; transform: translateX(-50%); margin-bottom: ${offset}px;`)
                            : (isPositive ? `top: 50%; left: 50%; transform: translateY(-50%); margin-left: ${offset}px;` : `top: 50%; right: 50%; transform: translateY(-50%); margin-right: ${offset}px;`);
        el.style.cssText = `position: absolute; width: ${w}px; height: ${h}px; background-color: ${s.color}; opacity: ${opacity}; ${posCss} ${outlineBorder}`;
        return el;
      };
      if (s.innerLines) {
        crosshairContainer.appendChild(createLine(true, false, s.innerOffset, s.innerThickness, s.innerLength, s.innerVertLength, s.innerOpacity));
        crosshairContainer.appendChild(createLine(true, true, s.innerOffset, s.innerThickness, s.innerLength, s.innerVertLength, s.innerOpacity));
        crosshairContainer.appendChild(createLine(false, false, s.innerOffset, s.innerThickness, s.innerLength, s.innerVertLength, s.innerOpacity));
        crosshairContainer.appendChild(createLine(false, true, s.innerOffset, s.innerThickness, s.innerLength, s.innerVertLength, s.innerOpacity));
      }
      return;
    }
  }

  const size = chSizeInput.value;
  const color = chColorInput.value;
  const dot = document.createElement('div');
  dot.style.cssText = `position: absolute; top: 50%; left: 50%; width: ${size}px; height: ${size}px; background-color: ${color}; border-radius: 50%; transform: translate(-50%, -50%);`;
  crosshairContainer.appendChild(dot);
}

// --- THREE.js 3D設定 ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 0);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
document.body.appendChild(renderer.domElement);

const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
gridHelper.position.y = -2;
scene.add(gridHelper);

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x101820, 0.55);
scene.add(ambientLight);

const weaponLight = new THREE.PointLight(0xffffff, 0.8, 3);
weaponLight.position.set(0.2, 0.35, -0.35);
camera.add(weaponLight);

// 銃
const gunGroup = new THREE.Group();
const gunFrameMat = new THREE.MeshStandardMaterial({ color: 0x171a1f, roughness: 0.72, metalness: 0.35 });
const gunSlideMat = new THREE.MeshStandardMaterial({ color: 0x2c323a, roughness: 0.42, metalness: 0.72 });
const gripMat = new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.88, metalness: 0.12 });
const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x070809, roughness: 0.55, metalness: 0.75 });
const brassMat = new THREE.MeshStandardMaterial({ color: 0xc69539, roughness: 0.38, metalness: 0.85 });
const flashOuterMat = new THREE.MeshBasicMaterial({ color: 0xff8a18, transparent: true, opacity: 0, side: THREE.DoubleSide });
const flashInnerMat = new THREE.MeshBasicMaterial({ color: 0xfff4b8, transparent: true, opacity: 0, side: THREE.DoubleSide });

function boxMesh(width, height, depth, material, position, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.copy(position);
  if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  return mesh;
}

const frameMesh = boxMesh(0.2, 0.12, 0.56, gunFrameMat, new THREE.Vector3(0, -0.01, 0.02));
const slideMesh = boxMesh(0.22, 0.1, 0.62, gunSlideMat, new THREE.Vector3(0, 0.08, -0.04));
const slideCutMesh = boxMesh(0.11, 0.012, 0.11, darkMetalMat, new THREE.Vector3(0.112, 0.105, -0.06));
const barrelMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.38, 18), darkMetalMat);
barrelMesh.rotation.x = Math.PI / 2;
barrelMesh.position.set(0, 0.08, -0.39);
const muzzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.007, 10, 22), darkMetalMat);
muzzleRing.position.set(0, 0.08, -0.59);
const gripMesh = boxMesh(0.13, 0.34, 0.16, gripMat, new THREE.Vector3(0, -0.22, 0.17), new THREE.Vector3(-0.43, 0, 0));
const magazineBase = boxMesh(0.15, 0.035, 0.2, darkMetalMat, new THREE.Vector3(0, -0.38, 0.23), new THREE.Vector3(-0.43, 0, 0));
const triggerGuard = new THREE.Group();
triggerGuard.add(
  boxMesh(0.02, 0.095, 0.018, darkMetalMat, new THREE.Vector3(-0.055, -0.12, -0.01)),
  boxMesh(0.02, 0.095, 0.018, darkMetalMat, new THREE.Vector3(0.055, -0.12, -0.01)),
  boxMesh(0.13, 0.018, 0.018, darkMetalMat, new THREE.Vector3(0, -0.17, -0.01))
);
const triggerMesh = boxMesh(0.028, 0.085, 0.018, darkMetalMat, new THREE.Vector3(0.025, -0.13, 0.01), new THREE.Vector3(0, 0, -0.22));
const rearSight = boxMesh(0.15, 0.028, 0.045, darkMetalMat, new THREE.Vector3(0, 0.145, 0.19));
const frontSight = boxMesh(0.055, 0.032, 0.028, darkMetalMat, new THREE.Vector3(0, 0.15, -0.51));
gunGroup.add(frameMesh, slideMesh, slideCutMesh, barrelMesh, muzzleRing, gripMesh, magazineBase, triggerGuard, triggerMesh, rearSight, frontSight);
gunGroup.position.set(0.35, -0.28, -0.5);
camera.add(gunGroup);

const simpleGunGroup = new THREE.Group();
const simpleGunMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
const simpleBarrelMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.7), simpleGunMat);
const simpleGripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.12), simpleGunMat);
simpleGripMesh.position.set(0, -0.15, 0.15);
simpleGripMesh.rotation.x = -Math.PI / 6;
simpleGunGroup.add(simpleBarrelMesh, simpleGripMesh);
simpleGunGroup.position.set(0.35, -0.28, -0.5);
simpleGunGroup.visible = false;
camera.add(simpleGunGroup);

const muzzleFlash = new THREE.PointLight(0xfff0a0, 0, 3.5);
muzzleFlash.position.set(0, 0.08, -0.62);
gunGroup.add(muzzleFlash);

const simpleMuzzleFlash = new THREE.PointLight(0xfff0a0, 0, 3.5);
simpleMuzzleFlash.position.set(0, 0.02, -0.45);
simpleGunGroup.add(simpleMuzzleFlash);

const muzzleFlareGroup = new THREE.Group();
const outerFlash = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 7, 1, true), flashOuterMat);
outerFlash.rotation.x = -Math.PI / 2;
outerFlash.position.z = -0.17;
const innerFlash = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.3, 7, 1, true), flashInnerMat);
innerFlash.rotation.x = -Math.PI / 2;
innerFlash.position.z = -0.12;
muzzleFlareGroup.position.set(0, 0.08, -0.62);
muzzleFlareGroup.visible = false;
muzzleFlareGroup.add(outerFlash, innerFlash);
gunGroup.add(muzzleFlareGroup);

const defaultGunPos = new THREE.Vector3(0.35, -0.28, -0.5);
const defaultGunRot = new THREE.Euler(-0.03, -0.04, 0.02);
gunGroup.rotation.copy(defaultGunRot);
const defaultSlideZ = slideMesh.position.z;

function getWeaponDisplayMode() {
  const mode = weaponDisplayInput?.value;
  return ['realistic', 'simple', 'none'].includes(mode) ? mode : 'realistic';
}

function updateWeaponDisplay() {
  const mode = getWeaponDisplayMode();
  gunGroup.visible = mode === 'realistic';
  simpleGunGroup.visible = mode === 'simple';
  weaponLight.visible = mode === 'realistic';
  if (mode !== 'realistic') {
    muzzleFlareGroup.visible = false;
    clearWeaponEffects();
  }
  if (mode === 'none') {
    muzzleFlashLife = 0;
    muzzleFlash.intensity = 0;
    simpleMuzzleFlash.intensity = 0;
  }
}

let gunRecoilZ = 0;
let gunRecoilY = 0;
let gunRecoilPitch = 0;
let gunRecoilYaw = 0;
let gunRecoilRoll = 0;
let slideOffset = 0;
let muzzleFlashLife = 0;
let screenShake = 0;
let autoFireFeedbackCooldown = 0;
let casings = [];
let smokePuffs = [];
let shotTrails = [];
const casingGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.07, 10);
const smokeGeometry = new THREE.SphereGeometry(0.045, 10, 10);

function triggerShotFeedback(intensity = 1) {
  const weaponMode = getWeaponDisplayMode();

  if (weaponMode === 'none') {
    screenShake = Math.max(screenShake, 0.004 * intensity);
    return;
  }

  if (weaponMode === 'simple') {
    gunRecoilZ = Math.max(gunRecoilZ, 0.08 * intensity);
    muzzleFlashLife = Math.max(muzzleFlashLife, 1);
    screenShake = Math.max(screenShake, 0.014 * intensity);
    return;
  }

  playGunshotSound(intensity);
  gunRecoilZ = Math.max(gunRecoilZ, 0.075 * intensity);
  gunRecoilY = Math.max(gunRecoilY, 0.018 * intensity);
  gunRecoilPitch = Math.max(gunRecoilPitch, 0.09 * intensity);
  gunRecoilYaw += (Math.random() - 0.5) * 0.025 * intensity;
  gunRecoilRoll += (Math.random() - 0.5) * 0.03 * intensity;
  slideOffset = Math.max(slideOffset, 0.095 * intensity);
  muzzleFlashLife = Math.max(muzzleFlashLife, 1);
  screenShake = Math.max(screenShake, 0.018 * intensity);
  muzzleFlareGroup.rotation.z = Math.random() * Math.PI * 2;
  spawnCasing(intensity);
  spawnMuzzleSmoke(intensity);
  createShotTrail(intensity);
}

function dampToZero(value, strength, deltaMs) {
  return value * Math.exp(-strength * deltaMs / 1000);
}

function localToWorldFromGun(position) {
  gunGroup.updateMatrixWorld(true);
  return gunGroup.localToWorld(position.clone());
}

function vectorFromCameraLocal(x, y, z, scale = 1) {
  return new THREE.Vector3(x, y, z).applyQuaternion(camera.quaternion).multiplyScalar(scale);
}

function spawnCasing(intensity) {
  const casing = new THREE.Mesh(casingGeometry, brassMat);
  casing.position.copy(localToWorldFromGun(new THREE.Vector3(0.14, 0.1, -0.06)));
  casing.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  const velocity = vectorFromCameraLocal(
    0.04 + Math.random() * 0.035,
    0.028 + Math.random() * 0.035,
    0.015 + Math.random() * 0.02,
    intensity
  );
  scene.add(casing);
  casings.push({
    mesh: casing,
    velocity,
    spin: new THREE.Vector3(Math.random() * 0.3, Math.random() * 0.35, Math.random() * 0.25),
    life: 1
  });
}

function spawnMuzzleSmoke(intensity) {
  const material = new THREE.MeshBasicMaterial({ color: 0xb8bdc1, transparent: true, opacity: 0.28, depthWrite: false });
  const puff = new THREE.Mesh(smokeGeometry, material);
  puff.position.copy(localToWorldFromGun(new THREE.Vector3(0, 0.08, -0.7)));
  const velocity = vectorFromCameraLocal(
    (Math.random() - 0.5) * 0.008,
    0.006 + Math.random() * 0.01,
    -0.018 - Math.random() * 0.012,
    intensity
  );
  scene.add(puff);
  smokePuffs.push({ mesh: puff, velocity, life: 1, maxScale: 1.6 + Math.random() * 1.1 });
}

function createShotTrail(intensity) {
  const start = localToWorldFromGun(new THREE.Vector3(0, 0.08, -0.66));
  const end = start.clone().add(vectorFromCameraLocal(0, 0, -1, 10 + Math.random() * 3));
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({
    color: 0xffe2a6,
    transparent: true,
    opacity: Math.min(0.55, 0.32 * intensity)
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  shotTrails.push({ mesh: line, life: 1 });
}

function updateWeaponEffects(deltaMs) {
  for (let i = casings.length - 1; i >= 0; i--) {
    const casing = casings[i];
    casing.velocity.y -= 0.00022 * deltaMs;
    casing.mesh.position.add(casing.velocity);
    casing.mesh.rotation.x += casing.spin.x;
    casing.mesh.rotation.y += casing.spin.y;
    casing.mesh.rotation.z += casing.spin.z;
    casing.life -= deltaMs / 1100;
    if (casing.life <= 0 || casing.mesh.position.y < -2.2) {
      scene.remove(casing.mesh);
      casings.splice(i, 1);
    }
  }

  for (let i = smokePuffs.length - 1; i >= 0; i--) {
    const puff = smokePuffs[i];
    puff.mesh.position.add(puff.velocity);
    puff.life -= deltaMs / 620;
    const progress = 1 - Math.max(0, puff.life);
    puff.mesh.scale.setScalar(0.6 + progress * puff.maxScale);
    puff.mesh.material.opacity = Math.max(0, puff.life) * 0.24;
    if (puff.life <= 0) {
      scene.remove(puff.mesh);
      puff.mesh.material.dispose();
      smokePuffs.splice(i, 1);
    }
  }

  for (let i = shotTrails.length - 1; i >= 0; i--) {
    const trail = shotTrails[i];
    trail.life -= deltaMs / 85;
    trail.mesh.material.opacity = Math.max(0, trail.life) * 0.35;
    if (trail.life <= 0) {
      scene.remove(trail.mesh);
      trail.mesh.geometry.dispose();
      trail.mesh.material.dispose();
      shotTrails.splice(i, 1);
    }
  }
}

function clearWeaponEffects() {
  casings.forEach(casing => scene.remove(casing.mesh));
  smokePuffs.forEach(puff => {
    scene.remove(puff.mesh);
    puff.mesh.material.dispose();
  });
  shotTrails.forEach(trail => {
    scene.remove(trail.mesh);
    trail.mesh.geometry.dispose();
    trail.mesh.material.dispose();
  });
  casings = [];
  smokePuffs = [];
  shotTrails = [];
}

// --- テーマ設定 ---
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    scene.background = new THREE.Color(0xe0e0e0);
    scene.fog = new THREE.Fog(0xe0e0e0, 5, 20);
  } else {
    document.body.classList.remove('light-mode');
    scene.background = new THREE.Color(0x1a1a1a);
    scene.fog = new THREE.Fog(0x1a1a1a, 5, 20);
  }
}
themeInput.addEventListener('change', (e) => applyTheme(e.target.value));

// --- ★新機能: パーティクルエフェクト ---
let particles = [];
function createExplosion(position, colorHex) {
  const particleCount = 12;
  const geometry = new THREE.SphereGeometry(0.08, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: colorHex });

  for (let i = 0; i < particleCount; i++) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.15,
      (Math.random() - 0.5) * 0.15,
      (Math.random() - 0.5) * 0.15
    );
    scene.add(mesh);
    particles.push({ mesh, velocity, life: 1.0 });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.mesh.position.add(p.velocity);
    p.life -= 0.04;
    p.mesh.scale.setScalar(p.life);
    if (p.life <= 0) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
    }
  }
}

// --- ★新機能: サウンド (Hit & Miss) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playGunshotSound(intensity = 1) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;

  const noiseLength = Math.floor(audioCtx.sampleRate * 0.085);
  const noiseBuffer = audioCtx.createBuffer(1, noiseLength, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseLength; i++) {
    const decay = 1 - i / noiseLength;
    data[i] = (Math.random() * 2 - 1) * decay * decay;
  }

  const crack = audioCtx.createBufferSource();
  const crackFilter = audioCtx.createBiquadFilter();
  const crackGain = audioCtx.createGain();
  crack.buffer = noiseBuffer;
  crackFilter.type = 'bandpass';
  crackFilter.frequency.setValueAtTime(2400, now);
  crackFilter.Q.setValueAtTime(1.8, now);
  crackGain.gain.setValueAtTime(0.18 * intensity, now);
  crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
  crack.connect(crackFilter);
  crackFilter.connect(crackGain);
  crackGain.connect(audioCtx.destination);
  crack.start(now);
  crack.stop(now + 0.09);

  const thump = audioCtx.createOscillator();
  const thumpGain = audioCtx.createGain();
  thump.type = 'triangle';
  thump.frequency.setValueAtTime(96, now);
  thump.frequency.exponentialRampToValueAtTime(46, now + 0.11);
  thumpGain.gain.setValueAtTime(0.12 * intensity, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  thump.connect(thumpGain);
  thumpGain.connect(audioCtx.destination);
  thump.start(now);
  thump.stop(now + 0.13);
}

function playHitSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function playMissSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}

// --- 設定の保存・読込 ---
function updateBestScoreDisplay() {
  const mode = modeInput.value;
  const goal = targetGoalInput.value;
  const key = `aimBest_${mode}_${goal}`;
  const bestTime = localStorage.getItem(key);
  const label = MODE_LABELS[mode] || mode;
  bestScoreDisplay.innerText = bestTime ? `Best Time (${label}/${goal}): ${bestTime}s` : `Best Time: None`;
}

function loadSettings() {
  const savedMode = localStorage.getItem('aimSettings_mode');
  const savedTheme = localStorage.getItem('aimSettings_theme');
  const savedWeaponDisplay = localStorage.getItem('aimSettings_weaponDisplay');
  const savedRange = localStorage.getItem('aimSettings_range');
  const savedGoal = localStorage.getItem('aimSettings_goal');
  const savedTargetColor = localStorage.getItem('aimSettings_targetColor');
  const savedSens = localStorage.getItem('aimSettings_sens');
  const savedTargetCount = localStorage.getItem('aimSettings_targetCount');
  const savedTargetSize = localStorage.getItem('aimSettings_targetSize');
  const savedValCode = localStorage.getItem('aimSettings_valCode');
  const savedChSize = localStorage.getItem('aimSettings_chSize');
  const savedChColor = localStorage.getItem('aimSettings_chColor');

  if (savedMode) modeInput.value = savedMode;
  if (savedTheme) { themeInput.value = savedTheme; applyTheme(savedTheme); } else applyTheme('dark');
  if (['realistic', 'simple', 'none'].includes(savedWeaponDisplay)) weaponDisplayInput.value = savedWeaponDisplay;
  if (savedRange) rangeInput.value = savedRange;
  if (savedGoal) targetGoalInput.value = savedGoal;
  if (savedTargetColor) targetColorInput.value = savedTargetColor;
  if (savedSens) sensInput.value = savedSens;
  if (savedTargetCount) { targetCountInput.value = savedTargetCount; targetCountVal.innerText = savedTargetCount + '個'; }
  if (savedTargetSize) { targetSizeInput.value = savedTargetSize; targetSizeVal.innerText = savedTargetSize; }
  if (savedValCode) valCodeInput.value = savedValCode;
  if (savedChSize) { chSizeInput.value = savedChSize; chSizeVal.innerText = savedChSize + 'px'; }
  if (savedChColor) chColorInput.value = savedChColor;

  updateCrosshairDisplay();
  updateWeaponDisplay();
  updateBestScoreDisplay();
}
loadSettings();

function updateStartButtonLabel() {
  const mode = modeInput.value;
  if (mode === 'tracking') startBtn.innerText = 'START MOVING';
  else if (mode === 'smooth-tracking') startBtn.innerText = 'START TRACKING';
  else if (mode === 'flick') startBtn.innerText = 'START FLICK';
  else startBtn.innerText = 'START GRIDSHOT';
}

modeInput.addEventListener('change', () => { updateBestScoreDisplay(); updateStartButtonLabel(); });
weaponDisplayInput.addEventListener('change', () => {
  localStorage.setItem('aimSettings_weaponDisplay', weaponDisplayInput.value);
  updateWeaponDisplay();
});
targetGoalInput.addEventListener('change', updateBestScoreDisplay);
targetCountInput.addEventListener('input', (e) => targetCountVal.innerText = e.target.value + '個');
targetSizeInput.addEventListener('input', (e) => targetSizeVal.innerText = e.target.value);
valCodeInput.addEventListener('input', updateCrosshairDisplay);
chSizeInput.addEventListener('input', (e) => { chSizeVal.innerText = e.target.value + 'px'; updateCrosshairDisplay(); });
chColorInput.addEventListener('input', updateCrosshairDisplay);
updateStartButtonLabel();

// --- ゲーム変数 ---
let score = 0, shots = 0, hits = 0;
let isPlaying = false, isPaused = false;
let startTime = 0, pausedTime = 0, totalPausedDuration = 0;
let totalReactionTime = 0, clearedTargets = 0;
let isFiring = false, currentTrackingStreak = 0, bestTrackingStreak = 0;
let lastFrameTime = performance.now();
let targetGoal = 30;
let targets = [];
const FLICK_TARGET_LIFETIME = 800;

const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });

function isSmoothTrackingMode() {
  return modeInput.value === 'smooth-tracking';
}

function isFlickMode() {
  return modeInput.value === 'flick';
}

function clearTargets() {
  targets.forEach(t => scene.remove(t));
  targets = [];
}

function updateProgressUi() {
  clearCountEl.innerText = clearedTargets;
  clearGoalEl.innerText = targetGoal;
  const progress = (clearedTargets / targetGoal) * 100;
  gaugeBar.style.width = Math.min(progress, 100) + '%';
}

function updateAccuracyUi() {
  accEl.innerText = shots > 0 ? Math.round((hits / shots) * 100) : 100;
}

function updateTrackingStatus() {
  const enabled = isSmoothTrackingMode() && isPlaying;
  trackingStatusEl.hidden = !enabled;
  if (!enabled) return;

  const activeTarget = targets[0];
  const health = activeTarget ? Math.max(0, activeTarget.userData.health || 0) : 0;
  const healthPercent = Math.round(health * 100);
  targetHealthEl.innerText = healthPercent;
  targetHealthBar.style.width = `${healthPercent}%`;
}

function getSpawnBounds() {
  const rangeSetting = rangeInput.value;
  let xSpan = 8, yMin = 0.5, ySpan = 3;
  if (rangeSetting === 'small') { xSpan = 4; yMin = 1.0; ySpan = 2; }
  else if (rangeSetting === 'large') { xSpan = 14; yMin = -0.5; ySpan = 5; }
  return { xSpan, yMin, ySpan };
}

function randomTargetPosition(bounds, fixedCenterX = false) {
  const x = fixedCenterX ? 0 : (Math.random() - 0.5) * bounds.xSpan;
  const y = (Math.random() - 0.5) * bounds.ySpan + (bounds.yMin + bounds.ySpan / 2);
  return new THREE.Vector3(x, y, -8);
}

function pickNonOverlappingPosition(bounds, radius, fixedCenterX = false) {
  const minDistance = Math.max(radius * 2.8, 1.35);
  let fallback = randomTargetPosition(bounds, fixedCenterX);

  for (let i = 0; i < 40; i++) {
    const candidate = randomTargetPosition(bounds, fixedCenterX);
    fallback = candidate;
    const hasOverlap = targets.some(target => candidate.distanceTo(target.position) < minDistance);
    if (!hasOverlap) return candidate;
  }

  return fallback;
}

function spawnTarget() {
  const baseRadius = parseFloat(targetSizeInput.value) || 0.5;
  const radius = isFlickMode() ? baseRadius * 0.88 : baseRadius;
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const colorHex = targetColorInput.value;
  const targetMaterial = new THREE.MeshBasicMaterial({ color: colorHex });

  const mesh = new THREE.Mesh(geometry, targetMaterial);
  const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
  outlineMesh.scale.setScalar(1.12);
  mesh.add(outlineMesh);

  const bounds = getSpawnBounds();
  const mode = modeInput.value;
  if (mode === 'tracking' || mode === 'smooth-tracking') {
    const position = pickNonOverlappingPosition(bounds, radius, true);
    const y = position.y;
    mesh.position.copy(position);
    mesh.userData = {
      spawnTime: performance.now(),
      isMoving: true,
      smoothTracking: mode === 'smooth-tracking',
      speed: (Math.random() * 0.002) + 0.0015,
      amplitude: bounds.xSpan / 2,
      verticalAmplitude: mode === 'smooth-tracking' ? Math.max(0.25, bounds.ySpan * 0.18) : 0,
      yBase: y,
      timeOffset: Math.random() * 100,
      health: 1,
      maxHealth: 1,
      timeToBreak: 950
    };
  } else {
    mesh.position.copy(pickNonOverlappingPosition(bounds, radius));
    mesh.userData = {
      spawnTime: performance.now(),
      isMoving: false,
      isFlick: isFlickMode(),
      lifetime: FLICK_TARGET_LIFETIME
    };
  }
  
  scene.add(mesh);
  targets.push(mesh);
  updateTrackingStatus();
}

// --- 視点・射撃 ---
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
document.addEventListener('mousemove', (event) => {
  if (!isPlaying || isPaused || document.pointerLockElement !== document.body) return;
  const valSens = parseFloat(sensInput.value) || 0.3;
  const sensitivity = (valSens * 0.07) * (Math.PI / 180);
  euler.setFromQuaternion(camera.quaternion);
  euler.y -= event.movementX * sensitivity;
  euler.x -= event.movementY * sensitivity;
  euler.x = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, euler.x));
  camera.quaternion.setFromEuler(euler);
});

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

window.addEventListener('mousedown', (event) => {
  if (!isPlaying || isPaused || document.pointerLockElement !== document.body) return;
  if (event.button !== 0) return;

  if (isSmoothTrackingMode()) {
    isFiring = true;
    triggerShotFeedback(0.55);
    return;
  }

  triggerShotFeedback(isFlickMode() ? 1.15 : 1);
  shots++;
  raycaster.setFromCamera(center, camera);
  const intersects = raycaster.intersectObjects(targets);

  if (intersects.length > 0) {
    const hitTarget = intersects[0].object;
    hits++;
    clearedTargets++;
    score += 100;
    playHitSound();
    
    createExplosion(hitTarget.position.clone(), targetColorInput.value);
    
    totalReactionTime += (performance.now() - hitTarget.userData.spawnTime);
    scene.remove(hitTarget);
    targets = targets.filter(t => t !== hitTarget);

    updateProgressUi();

    if (clearedTargets >= targetGoal) endGame();
    else spawnTarget();
  } else {
    playMissSound();
  }
  
  scoreEl.innerText = score;
  updateAccuracyUi();
});

window.addEventListener('mouseup', (event) => {
  if (event.button === 0) isFiring = false;
});

window.addEventListener('blur', () => {
  isFiring = false;
});

function processTrackingFire(deltaMs) {
  if (!isSmoothTrackingMode() || !isFiring || targets.length === 0) {
    if (isSmoothTrackingMode()) currentTrackingStreak = 0;
    autoFireFeedbackCooldown = 0;
    return;
  }

  shots += deltaMs;
  autoFireFeedbackCooldown -= deltaMs;
  if (autoFireFeedbackCooldown <= 0) {
    triggerShotFeedback(0.45);
    autoFireFeedbackCooldown = 95;
  }
  raycaster.setFromCamera(center, camera);
  const intersects = raycaster.intersectObjects(targets);
  const hitTarget = intersects.find(hit => hit.object.userData.smoothTracking)?.object;

  if (!hitTarget) {
    currentTrackingStreak = 0;
    updateAccuracyUi();
    return;
  }

  hits += deltaMs;
  currentTrackingStreak += deltaMs;
  bestTrackingStreak = Math.max(bestTrackingStreak, currentTrackingStreak);

  const damage = deltaMs / hitTarget.userData.timeToBreak;
  hitTarget.userData.health = Math.max(0, hitTarget.userData.health - damage);
  score += Math.max(1, Math.round(deltaMs * 0.12));

  if (hitTarget.userData.health <= 0) {
    clearedTargets++;
    score += 250;
    playHitSound();
    createExplosion(hitTarget.position.clone(), targetColorInput.value);
    totalReactionTime += (performance.now() - hitTarget.userData.spawnTime);
    scene.remove(hitTarget);
    targets = targets.filter(t => t !== hitTarget);
    currentTrackingStreak = 0;
    updateProgressUi();

    if (clearedTargets >= targetGoal) {
      endGame();
    } else {
      spawnTarget();
    }
  }

  scoreEl.innerText = score;
  updateAccuracyUi();
  updateTrackingStatus();
}

function processFlickTimeouts(deltaMs) {
  if (!isFlickMode() || targets.length === 0) return;

  let expiredCount = 0;
  const expired = [];
  targets.forEach(target => {
    target.userData.lifetime -= deltaMs;
    const lifeRatio = Math.max(0, target.userData.lifetime / FLICK_TARGET_LIFETIME);
    target.scale.setScalar(0.82 + lifeRatio * 0.18);
    target.material.opacity = 0.35 + lifeRatio * 0.65;
    target.material.transparent = true;

    if (target.userData.lifetime <= 0) {
      expired.push(target);
    }
  });

  expired.forEach(target => {
    expiredCount++;
    scene.remove(target);
    targets = targets.filter(t => t !== target);
  });

  if (expiredCount === 0) return;

  shots += expiredCount;
  playMissSound();
  updateAccuracyUi();
  for (let i = 0; i < expiredCount && isPlaying; i++) spawnTarget();
}

// --- ★新機能: ポーズ (Pause) 処理 ---
function togglePause() {
  if (!isPlaying) return;
  isPaused = !isPaused;

  if (isPaused) {
    isFiring = false;
    pausedTime = performance.now();
    document.exitPointerLock();
    crosshairContainer.style.display = 'none';
    pauseOverlay.style.display = 'flex';
  } else {
    totalPausedDuration += (performance.now() - pausedTime);
    pauseOverlay.style.display = 'none';
    crosshairContainer.style.display = 'block';
    document.body.requestPointerLock();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isPlaying) togglePause();
});

resumeBtn.addEventListener('click', () => togglePause());
quitBtn.addEventListener('click', () => {
  isPaused = false;
  pauseOverlay.style.display = 'none';
  endGame(true);
});

// --- ★新機能: カウントダウン付きゲーム開始 ---
function startGame() {
  // 設定保存
  localStorage.setItem('aimSettings_mode', modeInput.value);
  localStorage.setItem('aimSettings_theme', themeInput.value);
  localStorage.setItem('aimSettings_weaponDisplay', weaponDisplayInput.value);
  localStorage.setItem('aimSettings_range', rangeInput.value);
  localStorage.setItem('aimSettings_goal', targetGoalInput.value);
  localStorage.setItem('aimSettings_targetColor', targetColorInput.value);
  localStorage.setItem('aimSettings_sens', sensInput.value);
  localStorage.setItem('aimSettings_targetCount', targetCountInput.value);
  localStorage.setItem('aimSettings_targetSize', targetSizeInput.value);
  localStorage.setItem('aimSettings_valCode', valCodeInput.value);
  localStorage.setItem('aimSettings_chSize', chSizeInput.value);
  localStorage.setItem('aimSettings_chColor', chColorInput.value);

  targetGoal = parseInt(targetGoalInput.value) || 30;
  score = 0; shots = 0; hits = 0; clearedTargets = 0;
  totalReactionTime = 0; totalPausedDuration = 0;
  isFiring = false; currentTrackingStreak = 0; bestTrackingStreak = 0;
  muzzleFlashLife = 0; screenShake = 0; gunRecoilZ = 0;
  gunRecoilY = 0; gunRecoilPitch = 0; gunRecoilYaw = 0; gunRecoilRoll = 0; slideOffset = 0;
  autoFireFeedbackCooldown = 0;
  updateWeaponDisplay();
  
  scoreEl.innerText = score;
  timeTakenEl.innerText = '0.0';
  accEl.innerText = '100';
  updateProgressUi();
  updateTrackingStatus();
  
  clearTargets();
  clearWeaponEffects();
  
  menuEl.style.display = 'none';
  uiEl.style.display = 'block';
  crosshairContainer.style.display = 'block';

  document.body.requestPointerLock();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // カウントダウン演出
  let count = 3;
  countdownOverlay.style.display = 'block';
  countdownOverlay.innerText = count;

  const countInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownOverlay.innerText = count;
    } else if (count === 0) {
      countdownOverlay.innerText = 'GO!';
    } else {
      clearInterval(countInterval);
      countdownOverlay.style.display = 'none';
      
      // ゲーム正式開始
      isPlaying = true;
      updateTrackingStatus();
      startTime = performance.now();
      const countVal = isSmoothTrackingMode() ? 1 : (parseInt(targetCountInput.value) || 3);
      for (let i = 0; i < countVal; i++) spawnTarget();
    }
  }, 700);
}

// --- ゲーム終了 ---
function endGame(quitEarly = false) {
  isPlaying = false;
  isFiring = false;
  document.exitPointerLock();
  crosshairContainer.style.display = 'none';
  updateTrackingStatus();

  if (quitEarly) {
    clearTargets();
    clearWeaponEffects();
    resultStats.style.display = 'none';
    menuEl.style.display = 'flex';
    uiEl.style.display = 'none';
    return;
  }

  const elapsed = (performance.now() - startTime - totalPausedDuration) / 1000;
  const finalTime = elapsed.toFixed(2);
  const finalAcc = shots > 0 ? Math.round((hits / shots) * 100) : 0;
  const avgTTK = clearedTargets > 0 ? Math.round(totalReactionTime / clearedTargets) : 0;
  const bestTrack = Math.round(bestTrackingStreak);

  // ハイスコア保存
  const mode = modeInput.value;
  const goal = targetGoalInput.value;
  const key = `aimBest_${mode}_${goal}`;
  const bestTime = localStorage.getItem(key);

  let isNewRecord = false;
  if (!bestTime || parseFloat(finalTime) < parseFloat(bestTime)) {
    localStorage.setItem(key, finalTime);
    isNewRecord = true;
  }

  updateBestScoreDisplay();

  resultStats.innerHTML = `
    Target Reached! ${isNewRecord ? '<span style="color:#00f3ff;">[NEW BEST!]</span>' : ''}<br>
    Time: <span class="highlight">${finalTime} s</span><br>
    Score: <span class="highlight">${score}</span><br>
    Accuracy: <span class="highlight">${finalAcc}%</span><br>
    Targets: <span class="highlight">${clearedTargets}</span><br>
    Avg TTK: <span class="highlight">${avgTTK} ms</span>
    ${isSmoothTrackingMode() ? `<br>Best Track: <span class="highlight">${bestTrack} ms</span>` : ''}
  `;
  
  resultStats.style.display = 'block';
  menuEl.style.display = 'flex';
  uiEl.style.display = 'none';
  clearTargets();
  clearWeaponEffects();
  startBtn.innerText = isSmoothTrackingMode() ? 'PLAY AGAIN (TRACKING)' : (modeInput.value === 'tracking' ? 'PLAY AGAIN (MOVING)' : (isFlickMode() ? 'PLAY AGAIN (FLICK)' : 'PLAY AGAIN (GRIDSHOT)'));
}

startBtn.addEventListener('click', startGame);

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== document.body && isPlaying && !isPaused) {
    togglePause();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- アニメーションループ ---
function animate() {
  requestAnimationFrame(animate);
  const frameTime = performance.now();
  const deltaMs = Math.min(frameTime - lastFrameTime, 50);
  lastFrameTime = frameTime;
  
  gunRecoilZ = dampToZero(gunRecoilZ, 15, deltaMs);
  gunRecoilY = dampToZero(gunRecoilY, 18, deltaMs);
  gunRecoilPitch = dampToZero(gunRecoilPitch, 13, deltaMs);
  gunRecoilYaw = dampToZero(gunRecoilYaw, 10, deltaMs);
  gunRecoilRoll = dampToZero(gunRecoilRoll, 12, deltaMs);
  slideOffset = dampToZero(slideOffset, 26, deltaMs);
  const weaponMode = getWeaponDisplayMode();
  gunGroup.position.set(defaultGunPos.x, defaultGunPos.y + gunRecoilY, defaultGunPos.z + gunRecoilZ);
  gunGroup.rotation.set(
    defaultGunRot.x + gunRecoilPitch,
    defaultGunRot.y + gunRecoilYaw,
    defaultGunRot.z + gunRecoilRoll
  );
  simpleGunGroup.position.set(defaultGunPos.x, defaultGunPos.y, defaultGunPos.z + gunRecoilZ);
  slideMesh.position.z = defaultSlideZ + slideOffset;
  muzzleFlashLife = Math.max(0, muzzleFlashLife - deltaMs / 70);
  muzzleFlash.intensity = weaponMode === 'realistic' && muzzleFlashLife > 0 ? 2.7 * muzzleFlashLife : 0;
  simpleMuzzleFlash.intensity = weaponMode === 'simple' && muzzleFlashLife > 0 ? 2.7 * muzzleFlashLife : 0;
  muzzleFlareGroup.visible = weaponMode === 'realistic' && muzzleFlashLife > 0;
  if (muzzleFlareGroup.visible) {
    const flashScale = 0.55 + muzzleFlashLife * (0.35 + Math.random() * 0.4);
    muzzleFlareGroup.scale.setScalar(flashScale);
    flashOuterMat.opacity = Math.min(0.72, muzzleFlashLife * 0.54);
    flashInnerMat.opacity = Math.min(0.95, muzzleFlashLife * 0.78);
  } else {
    flashOuterMat.opacity = 0;
    flashInnerMat.opacity = 0;
  }
  screenShake = Math.max(0, screenShake - deltaMs * 0.00055);
  updateWeaponEffects(deltaMs);

  if (isPlaying && !isPaused) {
    const time = frameTime;
    const elapsed = (time - startTime - totalPausedDuration) / 1000;
    timeTakenEl.innerText = Math.max(0, elapsed).toFixed(1);

    targets.forEach(t => {
      if (t.userData.isMoving) {
        t.position.x = Math.sin(time * t.userData.speed + t.userData.timeOffset) * t.userData.amplitude;
        if (t.userData.verticalAmplitude) {
          t.position.y = t.userData.yBase + Math.cos(time * t.userData.speed * 0.72 + t.userData.timeOffset) * t.userData.verticalAmplitude;
        }
      }
    });

    processTrackingFire(deltaMs);
    processFlickTimeouts(deltaMs);
    updateParticles();
  }

  if (screenShake > 0) {
    camera.position.set(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake
    );
  } else {
    camera.position.set(0, 0, 0);
  }

  renderer.render(scene, camera);
  camera.position.set(0, 0, 0);
}
animate();
