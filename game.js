'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle, perpVel = 0) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    const fx = Math.cos(angle);
    const fy = Math.sin(angle);
    const px = -fy;          // vector perpendicular 90° CCW
    const py =  fx;
    this.vx = fx * SPEED + px * perpVel;
    this.vy = fy * SPEED + py * perpVel;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const SHOOTING_STAR_POINTS      = 500;
const SHOOTING_STAR_LIFETIME    = 10;
const SHOOTING_STAR_SPEED       = 220;
const SHOOTING_STAR_RADIUS      = 14;
const SHOOTING_STAR_SPAWN_MIN   = 15;
const SHOOTING_STAR_SPAWN_MAX   = 25;
const SHOOTING_STAR_COLOR       = '#64f0ff';

class ShootingStar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = SHOOTING_STAR_RADIUS;
    this.dead = false;
    this.ttl = SHOOTING_STAR_LIFETIME;

    const angle = rand(0, Math.PI * 2);
    const speed = SHOOTING_STAR_SPEED + rand(-20, 20);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-2.5, 2.5);
    this.rot = rand(0, Math.PI * 2);

    // Forma de diamante / estrella de 4 puntas
    this.verts = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.5;
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }

    this.trail = [];
    this.maxTrailLength = 18;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) this.trail.shift();

    if (this.ttl <= 0) {
      this.dead = true;
      return [
        new Asteroid(this.x, this.y, 1),
        new Asteroid(this.x, this.y, 1),
      ];
    }
    return [];
  }

  draw() {
    const headAlpha = Math.min(1, this.ttl);

    // Estela: dibujada como puntos para evitar líneas que atraviesen la pantalla al hacer wrap
    if (this.trail.length > 1) {
      ctx.save();
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        const alpha = (i / this.trail.length) * 0.65 * headAlpha;
        ctx.fillStyle = `rgba(100, 240, 255, ${alpha.toFixed(2)})`;
        const r = 0.8 + (i / this.trail.length) * 2.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Cuerpo brillante
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowBlur = 18;
    ctx.shadowColor = SHOOTING_STAR_COLOR;
    ctx.strokeStyle = SHOOTING_STAR_COLOR;
    ctx.fillStyle = 'rgba(100, 240, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
const SKIN_STORAGE_KEY = 'asteroids.skin';

const SKINS = [
  {
    id: 'classic',
    name: 'Clásica',
    stroke: '#ffffff',
    flame:  'rgba(255, 130, 0, 0.85)',
    verts:  [ [ 20,  0], [-12, -9], [ -7,  0], [-12,  9] ],
  },
  {
    id: 'hunter',
    name: 'Cazadora',
    stroke: '#ff4d4d',
    flame:  'rgba(255, 80, 30, 0.9)',
    verts:  [ [ 22,  0], [-14, -7], [ -6, -3], [ -6,  3], [-14,  7] ],
  },
  {
    id: 'cruiser',
    name: 'Acorazado',
    stroke: '#64c8ff',
    flame:  'rgba(255, 200, 80, 0.85)',
    verts:  [ [ 18,  0], [-10, -10], [-14, -6], [ -4,  0], [-14,  6], [-10,  10] ],
  },
  {
    id: 'ghost',
    name: 'Espectral',
    stroke: '#c084ff',
    flame:  'rgba(180, 100, 255, 0.85)',
    verts:  [ [ 20,  0], [-10, -8], [-12,  0], [-10,  8] ],
    glow:   8,
  },
  {
    id: 'titan',
    name: 'Titán',
    stroke: '#a855f7',
    flame:  'rgba(220, 100, 255, 0.9)',
    verts:  [ [ 20,  0], [-12, -9], [ -7,  0], [-12,  9] ],
    glow:   12,
    scale:  1.5,
    scoreMultiplier: 2,
  },
];

function loadSkinIndex() {
  try {
    const id = localStorage.getItem(SKIN_STORAGE_KEY);
    const idx = SKINS.findIndex(s => s.id === id);
    if (idx >= 0) return idx;
  } catch (_) { /* localStorage no disponible */ }
  return 0;
}

function saveSkinIndex() {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, SKINS[skinIndex].id);
  } catch (_) { /* no-op */ }
}

// ── Escudo ────────────────────────────────────────────────────────────────────
const SHIELD_DURATION = 7;     // segundos activo
const SHIELD_RADIUS   = 30;

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12 * (SKINS[skinIndex].scale || 1);
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
    this.speedBoostTimer = 0;
    this.tripleShotTimer = 0;
    this.trail = [];
    this.shieldActive   = false;
    this.shieldTimer    = 0;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoostTimer > 0) this.speedBoostTimer -= dt;
    if (this.tripleShotTimer > 0) this.tripleShotTimer -= dt;

    if (this.shieldActive) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.shieldActive = false;
        this.shieldTimer = 0;
      }
    }

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const BASE_MAX_SPEED = 360;
    const BOOST_MAX_SPEED = BASE_MAX_SPEED * 2;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;

    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = this.speedBoostTimer > 0 ? BOOST_MAX_SPEED : BASE_MAX_SPEED;
    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      this.vx *= scale;
      this.vy *= scale;
    }

    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);

    // Estela durante el boost
    if (this.speedBoostTimer > 0 && speed > 10) {
      this.trail.push({ x: this.x, y: this.y, life: 0.35 });
    }
    for (const t of this.trail) t.life -= dt;
    this.trail = this.trail.filter(t => t.life > 0);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const skin = SKINS[skinIndex];
    const sc = skin.scale || 1;
    let maxX = 0;
    for (const v of skin.verts) if (v[0] > maxX) maxX = v[0];
    const NOSE = (maxX + 1) * sc;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShotTimer > 0) {
      return [
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle,  POWERUP_TRIPLE_SPREAD_VEL),
        new Bullet(ox, oy, this.angle, -POWERUP_TRIPLE_SPREAD_VEL),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  activateShield() {
    if (this.dead || this.shieldActive) return false;
    this.shieldActive = true;
    this.shieldTimer = SHIELD_DURATION;
    playShieldSound();
    return true;
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    // Estela de velocidad
    if (this.speedBoostTimer > 0 && this.trail.length > 1) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.strokeStyle = `rgba(100, 200, 255, ${Math.min(0.6, this.speedBoostTimer * 0.15).toFixed(2)})`;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const skin = SKINS[skinIndex];
    const sc = skin.scale || 1;
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    if (skin.glow) {
      ctx.shadowBlur  = skin.glow;
      ctx.shadowColor = skin.stroke;
    }

    // Silueta de la skin
    ctx.beginPath();
    ctx.moveTo(skin.verts[0][0] * sc, skin.verts[0][1] * sc);
    for (let i = 1; i < skin.verts.length; i++)
      ctx.lineTo(skin.verts[i][0] * sc, skin.verts[i][1] * sc);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8 * sc, -4 * sc);
      ctx.lineTo(-8 * sc - rand(6, 14) * sc, 0);
      ctx.lineTo(-8 * sc,  4 * sc);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    // Escudo
    if (this.shieldActive && (this.shieldTimer > 0.5 || Math.floor(this.shieldTimer * 12) % 2 === 0)) {
      const alpha = 0.25 + Math.sin(this.shieldTimer * 8) * 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, SHIELD_RADIUS, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(80, 220, 255, ${0.8 + Math.sin(this.shieldTimer * 8) * 0.2})`;
      ctx.fillStyle   = `rgba(80, 220, 255, ${alpha.toFixed(2)})`;
      ctx.lineWidth   = 2;
      ctx.shadowBlur  = 14;
      ctx.shadowColor = '#50dcff';
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur  = 0;
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
const POWERUP_LIFETIME = 8;     // segundos en pantalla
const POWERUP_DURATION = 5;     // segundos de efecto
const POWERUP_DROP_CHANCE = 0.10;
const POWERUP_TYPE = { SPEED: 'speed', TRIPLE: 'triple', SHIELD: 'shield' };
const POWERUP_TYPES = [
  POWERUP_TYPE.SPEED,
  POWERUP_TYPE.SPEED,
  POWERUP_TYPE.TRIPLE,
  POWERUP_TYPE.SHIELD,
];
const POWERUP_TRIPLE_COLOR = '#ff8c1a';
const POWERUP_TRIPLE_START_SPREAD = 0;   // separación inicial en px entre bullet central y laterales
const POWERUP_TRIPLE_SPREAD_VEL   = 90;  // px/s de drift perpendicular por bala lateral

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type || POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    this.radius = 10;
    this.ttl = POWERUP_LIFETIME;
    this.dead = false;
    this.pulse = 0;
  }

  update(dt) {
    this.ttl -= dt;
    this.pulse += dt * 5;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const scale = 1 + Math.sin(this.pulse) * 0.12;
    const isTriple = this.type === POWERUP_TYPE.TRIPLE;
    const isShield = this.type === POWERUP_TYPE.SHIELD;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scale, scale);

    if (isShield) {
      // Rombo cyan para escudo
      ctx.strokeStyle = '#50dcff';
      ctx.fillStyle   = 'rgba(80, 220, 255, 0.18)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#50dcff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('K', 0, 1);
    } else {
      const ringColor = isTriple ? POWERUP_TRIPLE_COLOR : '#ffd700';
      const fillBg    = isTriple ? 'rgba(255, 140, 26, 0.18)' : 'rgba(255, 215, 0, 0.18)';
      const label     = isTriple ? '3' : 'V';

      ctx.strokeStyle = ringColor;
      ctx.fillStyle   = fillBg;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = ringColor;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 1);
    }

    ctx.restore();
  }
}

// ── Audio ─────────────────────────────────────────────────────────────────────
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
}

function playSpeedSound() {
  ensureAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

function playTripleSound() {
  ensureAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const tones = [440, 554, 659];   // A4, C#5, E5 — arpegio mayor
  const stepDur = 0.07;
  for (let i = 0; i < tones.length; i++) {
    const start = now + i * stepDur;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(tones[i], start);
    gain.gain.setValueAtTime(0.16, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  }
}

function playShieldSound() {
  ensureAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(990, now + 0.18);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.32);
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups, shootingStars;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let shootingStarTimer;
let skinIndex;
let skinToastTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  const SAFE_DIST = 160;
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (ship && Math.hypot(x - ship.x, y - ship.y) < SAFE_DIST);
  shootingStars.push(new ShootingStar(x, y));
}

function resetShootingStarTimer() {
  shootingStarTimer = rand(SHOOTING_STAR_SPAWN_MIN, SHOOTING_STAR_SPAWN_MAX);
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  resetShootingStarTimer();
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  shootingStars = [];
  ship.reset();
  resetShootingStarTimer();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function bounceAway(obj, other) {
  const dx = obj.x - other.x;
  const dy = obj.y - other.y;
  const d  = Math.hypot(dx, dy) || 1;
  const nx = dx / d;
  const ny = dy / d;
  const dot = obj.vx * nx + obj.vy * ny;
  obj.vx -= 2 * dot * nx;
  obj.vy -= 2 * dot * ny;
  obj.x = wrap(obj.x + nx * 3, W);
  obj.y = wrap(obj.y + ny * 3, H);
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedBoostTimer = 0;
  ship.tripleShotTimer = 0;
  ship.trail = [];
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (skinToastTimer > 0) skinToastTimer -= dt;

  if (pressed('KeyK')) {
    skinIndex = (skinIndex + 1) % SKINS.length;
    saveSkinIndex();
    skinToastTimer = 1.6;
  }

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));

  // Spawn periódico de estrella fugaz
  shootingStarTimer -= dt;
  if (shootingStarTimer <= 0) {
    resetShootingStarTimer();
    if (shootingStars.length === 0) spawnShootingStar();
  }

  // Update estrellas fugaces: las que expiran generan asteroides pequeños
  const spawnedFromStar = [];
  shootingStars.forEach(s => {
    const spawned = s.update(dt);
    spawnedFromStar.push(...spawned);
  });

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs estrella fugaz
  const scoreMult = SKINS[skinIndex].scoreMultiplier || 1;
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += SHOOTING_STAR_POINTS * scoreMult;
        explode(s.x, s.y, 12);
      }
    }
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size] * scoreMult;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (Math.random() < POWERUP_DROP_CHANCE) {
          powerups.push(new PowerUp(a.x, a.y));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Filtrar estrellas fugaces y agregar asteroides generados al expirar
  shootingStars = shootingStars.filter(s => !s.dead);
  asteroids = asteroids.concat(spawnedFromStar);

  // Nave vs asteroide / estrella fugaz
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldActive) {
          bounceAway(a, ship);
          explode(a.x, a.y, 4);
        } else {
          killShip();
          break;
        }
      }
    }
    if (!ship.dead) {
      for (const s of shootingStars) {
        if (dist(ship, s) < ship.radius + s.radius * 0.82) {
          if (ship.shieldActive) {
            bounceAway(s, ship);
            explode(s.x, s.y, 6);
          } else {
            killShip();
            break;
          }
        }
      }
    }
  }

  // Power-ups
  powerups.forEach(p => p.update(dt));
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === POWERUP_TYPE.TRIPLE) {
        ship.tripleShotTimer += POWERUP_DURATION;
        playTripleSound();
      } else if (p.type === POWERUP_TYPE.SHIELD) {
        ship.activateShield();
      } else {
        ship.speedBoostTimer += POWERUP_DURATION;
        playSpeedSound();
      }
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
const LIFE_ICON_SCALE = 0.45;

function drawLifeIcon(x, y) {
  const skin = SKINS[skinIndex];
  const sc = (skin.scale || 1) * LIFE_ICON_SCALE;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.verts[0][0] * sc, skin.verts[0][1] * sc);
  for (let i = 1; i < skin.verts.length; i++)
    ctx.lineTo(skin.verts[i][0] * sc, skin.verts[i][1] * sc);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  if (skinToastTimer > 0) {
    const alpha = Math.min(1, skinToastTimer / 0.4);
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.font = '13px monospace';
    ctx.fillText(`SKIN: ${SKINS[skinIndex].name}`, W / 2, 44);
  }

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicador de velocidad activa
  if (ship.speedBoostTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64c8ff';
    ctx.font = '13px monospace';
    const timeText = ship.speedBoostTimer.toFixed(1) + 's';
    ctx.fillText(`VELOCIDAD ${timeText}`, 14, 46);

    const barW = 80;
    const pct = Math.min(ship.speedBoostTimer / POWERUP_DURATION, 1);
    ctx.strokeStyle = '#64c8ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 52, barW, 6);
    ctx.fillStyle = 'rgba(100, 200, 255, 0.75)';
    ctx.fillRect(14, 52, barW * pct, 6);
  }

  // Indicador de triple-shot activo
  if (ship.tripleShotTimer > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = POWERUP_TRIPLE_COLOR;
    ctx.font = '13px monospace';
    const timeText = ship.tripleShotTimer.toFixed(1) + 's';
    ctx.fillText(`TRIPLE ${timeText}`, 14, 70);

    const barW = 80;
    const pct = Math.min(ship.tripleShotTimer / POWERUP_DURATION, 1);
    ctx.strokeStyle = POWERUP_TRIPLE_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 76, barW, 6);
    ctx.fillStyle = 'rgba(255, 140, 26, 0.75)';
    ctx.fillRect(14, 76, barW * pct, 6);
  }

  // Indicador de escudo activo
  if (ship.shieldActive) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#50dcff';
    ctx.font = '13px monospace';
    const timeText = ship.shieldTimer.toFixed(1) + 's';
    ctx.fillText(`ESCUDO ${timeText}`, 14, 94);

    const barW = 80;
    const pct = Math.max(0, Math.min(ship.shieldTimer / SHIELD_DURATION, 1));
    ctx.strokeStyle = '#50dcff';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 100, barW, 6);
    ctx.fillStyle = 'rgba(80, 220, 255, 0.75)';
    ctx.fillRect(14, 100, barW * pct, 6);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  shootingStars.forEach(s => s.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

skinIndex     = loadSkinIndex();
skinToastTimer = 0;
initGame();
requestAnimationFrame(loop);

