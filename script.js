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
document.body.appendChild(renderer.domElement);

const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
gridHelper.position.y = -2;
scene.add(gridHelper);

// 銃
const gunGroup = new THREE.Group();
const gunMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
const barrelMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.7), gunMat);
const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.12), gunMat);
gripMesh.position.set(0, -0.15, 0.15);
gripMesh.rotation.x = -Math.PI / 6;
gunGroup.add(barrelMesh, gripMesh);
gunGroup.position.set(0.35, -0.28, -0.5);
camera.add(gunGroup);

const muzzleFlash = new THREE.PointLight(0xfff0a0, 0, 3.5);
muzzleFlash.position.set(0, 0.02, -0.45);
gunGroup.add(muzzleFlash);

const defaultGunPos = new THREE.Vector3(0.35, -0.28, -0.5);
let gunRecoilZ = 0;
let muzzleFlashLife = 0;
let screenShake = 0;

function triggerShotFeedback(intensity = 1) {
  gunRecoilZ = Math.max(gunRecoilZ, 0.08 * intensity);
  muzzleFlashLife = Math.max(muzzleFlashLife, 1);
  screenShake = Math.max(screenShake, 0.018 * intensity);
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
    return;
  }

  shots += deltaMs;
  gunRecoilZ = Math.max(gunRecoilZ, 0.025);
  muzzleFlashLife = Math.max(muzzleFlashLife, 0.35);
  screenShake = Math.max(screenShake, 0.004);
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
  
  scoreEl.innerText = score;
  timeTakenEl.innerText = '0.0';
  accEl.innerText = '100';
  updateProgressUi();
  updateTrackingStatus();
  
  clearTargets();
  
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
  
  if (gunRecoilZ > 0) {
    gunRecoilZ -= 0.01;
    if (gunRecoilZ < 0) gunRecoilZ = 0;
  }
  gunGroup.position.z = defaultGunPos.z + gunRecoilZ;
  muzzleFlashLife = Math.max(0, muzzleFlashLife - deltaMs / 70);
  muzzleFlash.intensity = muzzleFlashLife > 0 ? 2.7 * muzzleFlashLife : 0;
  screenShake = Math.max(0, screenShake - deltaMs * 0.00055);

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
