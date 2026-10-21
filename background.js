/* =========================================================
   INTERACTIVE MULTI-THEME CANVAS
   Themes: 'stars', 'hearts' (сердечки), 'snow' (снег), 'rain' (дождь)
   With smooth 2.5x slower mouse tracking & seamless morphing
   ========================================================= */

const canvas = document.querySelector('canvas#stars');
const ctx = canvas.getContext('2d');

let scale = 1;
let width = 0;
let height = 0;

let currentMode = 'stars'; // 'stars', 'hearts', 'snow', 'rain'
let themeColor = '#ffffff';

// Mouse & velocity
let pointerX = null;
let pointerY = null;
let velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.00035 };
let isPointerEnabled = true;

const PARTICLE_COUNT = Math.floor(Math.min(window.innerWidth, 1600) * 0.18);
let particles = [];

const HEART_COLORS = ['#ff2a6d', '#ff5983', '#ff0055', '#ff7597', '#ff4081', '#f43f5e'];

class Particle {
  constructor() {
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * (width || window.innerWidth);
    this.y = initial ? Math.random() * (height || window.innerHeight) : -25;
    this.z = 0.2 + Math.random() * 0.8;
    this.baseSpeed = 0.8 + Math.random() * 1.6;
    
    // Rotation & wobble for hearts/snow
    this.angle = (Math.random() - 0.5) * 0.5;
    this.angleSpeed = (Math.random() - 0.5) * 0.03;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.02 + Math.random() * 0.035;
    this.wobbleRadius = 1.2 + Math.random() * 2.2;

    // Size
    this.size = 1.5 + Math.random() * 2.5;

    // Colors
    this.alpha = 0.4 + Math.random() * 0.6;
    this.heartColor = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
  }

  update() {
    if (currentMode === 'stars') {
      // Gentle 3D celestial warp (2.5x slower)
      this.x += velocity.x * this.z;
      this.y += velocity.y * this.z;

      this.x += (this.x - width / 2) * velocity.z * this.z;
      this.y += (this.y - height / 2) * velocity.z * this.z;
      this.z += velocity.z * 0.5;

      if (this.x < -40 || this.x > width + 40 || this.y < -40 || this.y > height + 40) {
        this.reset();
        this.y = Math.random() * height;
      }
    } 
    else if (currentMode === 'hearts') {
      // Fluttering rain of cute neon hearts (Телеграм)
      this.wobble += this.wobbleSpeed;
      this.angle += this.angleSpeed;
      this.x += Math.sin(this.wobble) * this.wobbleRadius + (velocity.x * 0.15);
      this.y += (2.2 + this.baseSpeed * 1.6) * scale;

      if (this.y > height + 35 || this.x < -40 || this.x > width + 40) {
        this.reset();
      }
    }
    else if (currentMode === 'snow') {
      // Soft drifting snowflakes (Стим)
      this.wobble += this.wobbleSpeed * 0.8;
      this.x += Math.cos(this.wobble) * 1.2 + (velocity.x * 0.15);
      this.y += (1.4 + this.baseSpeed * 0.9) * scale;

      if (this.y > height + 25 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    }
    else if (currentMode === 'rain') {
      // Fast vertical rain streaks (Гитхаб / Дискорд)
      this.y += (9 + this.baseSpeed * 7) * scale;
      this.x += velocity.x * 0.2;

      if (this.y > height + 35) {
        this.y = -20;
        this.x = Math.random() * width;
      }
    }
  }

  draw() {
    ctx.save();

    if (currentMode === 'stars') {
      // Stars: glowing round dots with subtle trailing
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = this.alpha;
      const radius = Math.max(0.8, this.size * this.z * scale * 0.75);
      ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle star trail when moving
      if (Math.abs(velocity.x) > 0.4 || Math.abs(velocity.y) > 0.4) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = radius * 0.7;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - velocity.x * 1.5, this.y - velocity.y * 1.5);
        ctx.stroke();
      }
    } 
    else if (currentMode === 'hearts') {
      // Hearts: cute smooth flutter hearts
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const s = (0.7 + this.size * 0.3) * scale;
      ctx.scale(s, s);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-5, -6, -11, 2, 0, 10);
      ctx.bezierCurveTo(11, 2, 5, -6, 0, 0);
      ctx.fillStyle = this.heartColor;
      ctx.globalAlpha = this.alpha * 0.85;
      ctx.shadowColor = '#ff2a6d';
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    else if (currentMode === 'snow') {
      // Snow: soft frosty glowing flakes
      ctx.beginPath();
      ctx.fillStyle = themeColor || '#e0f2fe';
      ctx.globalAlpha = 0.65 + this.alpha * 0.35;
      const r = (2 + this.size * 1.2) * scale;
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.shadowColor = '#66c0f4';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    else if (currentMode === 'rain') {
      // Cyber Rain: sleek glowing vertical streaks
      ctx.beginPath();
      ctx.strokeStyle = themeColor || '#00d2ff';
      ctx.lineWidth = 1.6 * scale;
      ctx.globalAlpha = 0.55 + this.alpha * 0.4;
      const streakLength = (16 + this.baseSpeed * 10) * scale;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + velocity.x * 0.4, this.y + streakLength);
      ctx.shadowColor = themeColor || '#00d2ff';
      ctx.shadowBlur = 4;
      ctx.stroke();
    }

    ctx.restore();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
}

function resize() {
  scale = window.devicePixelRatio || 1;
  width = window.innerWidth * scale;
  height = window.innerHeight * scale;

  canvas.width = width;
  canvas.height = height;

  if (particles.length === 0) {
    initParticles();
  }
}

function step() {
  ctx.clearRect(0, 0, width, height);

  // Smooth mouse velocity damping (more than 2.5x smoother and slower)
  velocity.tx *= 0.94;
  velocity.ty *= 0.94;
  velocity.x += (velocity.tx - velocity.x) * 0.32;
  velocity.y += (velocity.ty - velocity.y) * 0.32;

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
  }

  requestAnimationFrame(step);
}

function movePointer(x, y) {
  if (!isPointerEnabled) return;
  if (typeof pointerX === 'number' && typeof pointerY === 'number') {
    let ox = x - pointerX;
    let oy = y - pointerY;

    // Снижено влияние мыши более чем в 2.5 раза
    velocity.tx = velocity.tx - (ox / 24) * scale;
    velocity.ty = velocity.ty - (oy / 24) * scale;
  }

  pointerX = x;
  pointerY = y;
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => movePointer(e.clientX, e.clientY));
window.addEventListener('mouseleave', () => {
  pointerX = null;
  pointerY = null;
});

// Touch support for phones
window.addEventListener('touchmove', (e) => {
  if (e.touches.length > 0) {
    movePointer(e.touches[0].clientX, e.touches[0].clientY);
  }
}, { passive: true });

window.addEventListener('touchend', () => {
  pointerX = null;
  pointerY = null;
});

// Global API to change particle mode seamlessly
window.setParticleTheme = function(mode, color) {
  currentMode = mode || 'stars';
  themeColor = color || '#ffffff';
};

resize();
step();
