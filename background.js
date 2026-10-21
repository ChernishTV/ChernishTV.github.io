/* =========================================================
   INTERACTIVE MULTI-THEME CANVAS (STARS, RAIN, LEAVES, SNOW)
   With smooth 2x slower mouse tracking & seamless morphing
   ========================================================= */

const canvas = document.querySelector('canvas#stars');
const ctx = canvas.getContext('2d');

let scale = 1;
let width = 0;
let height = 0;

let currentMode = 'stars'; // 'stars', 'rain', 'leaves', 'snow'
let themeColor = '#ffffff';

// Mouse & velocity
let pointerX = null;
let pointerY = null;
let velocity = { x: 0, y: 0, tx: 0, ty: 0, z: 0.00035 };
let isPointerEnabled = true;

const PARTICLE_COUNT = Math.floor(Math.min(window.innerWidth, 1600) * 0.18);
let particles = [];

class Particle {
  constructor() {
    this.reset(true);
  }

  reset(initial = false) {
    this.x = Math.random() * (width || window.innerWidth);
    this.y = initial ? Math.random() * (height || window.innerHeight) : -20;
    this.z = 0.2 + Math.random() * 0.8;
    this.baseSpeed = 0.8 + Math.random() * 1.6;
    
    // Rotation & wobble for leaves/snow
    this.angle = Math.random() * Math.PI * 2;
    this.angleSpeed = (Math.random() - 0.5) * 0.03;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.02 + Math.random() * 0.03;
    this.wobbleRadius = 1 + Math.random() * 2;

    // Size
    this.size = 1.5 + Math.random() * 2.5;

    // Colors
    this.alpha = 0.3 + Math.random() * 0.7;
    this.leafColors = ['#f59e0b', '#fbbf24', '#f97316', '#34d399', '#f472b6'];
    this.leafColor = this.leafColors[Math.floor(Math.random() * this.leafColors.length)];
  }

  update() {
    if (currentMode === 'stars') {
      // Gentle 3D celestial warp (slowed down by 2x)
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
    else if (currentMode === 'rain') {
      // Fast vertical cyber raindrops with slight mouse drift
      this.y += (8 + this.baseSpeed * 6) * scale;
      this.x += velocity.x * 0.2;

      if (this.y > height + 30) {
        this.y = -20;
        this.x = Math.random() * width;
      }
    } 
    else if (currentMode === 'leaves') {
      // Gentle floating/fluttering falling leaves
      this.wobble += this.wobbleSpeed;
      this.angle += this.angleSpeed;
      this.x += Math.sin(this.wobble) * this.wobbleRadius + (velocity.x * 0.15);
      this.y += (1.4 + this.baseSpeed * 0.9) * scale;

      if (this.y > height + 30 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    } 
    else if (currentMode === 'snow') {
      // Soft drifting snowflakes
      this.wobble += this.wobbleSpeed * 0.8;
      this.x += Math.cos(this.wobble) * 0.8 + (velocity.x * 0.15);
      this.y += (1.2 + this.baseSpeed * 0.7) * scale;

      if (this.y > height + 20) {
        this.reset();
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
    else if (currentMode === 'rain') {
      // Cyber Rain: sleek glowing vertical streaks
      ctx.beginPath();
      ctx.strokeStyle = themeColor || '#00d2ff';
      ctx.lineWidth = 1.6 * scale;
      ctx.globalAlpha = 0.5 + this.alpha * 0.4;
      const streakLength = (16 + this.baseSpeed * 10) * scale;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x + velocity.x * 0.5, this.y + streakLength);
      ctx.stroke();
    } 
    else if (currentMode === 'leaves') {
      // Leaves: stylized falling curved petals/leaves
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = this.leafColor;
      ctx.globalAlpha = 0.75;

      const leafW = (5 + this.size * 2) * scale;
      const leafH = (9 + this.size * 3) * scale;

      ctx.beginPath();
      ctx.moveTo(0, -leafH / 2);
      ctx.quadraticCurveTo(leafW / 2, 0, 0, leafH / 2);
      ctx.quadraticCurveTo(-leafW / 2, 0, 0, -leafH / 2);
      ctx.fill();
    } 
    else if (currentMode === 'snow') {
      // Snow: soft frosty glowing flakes
      ctx.beginPath();
      ctx.fillStyle = themeColor || '#e0f2fe';
      ctx.globalAlpha = 0.6 + this.alpha * 0.35;
      const r = (2 + this.size * 1.2) * scale;
      ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
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

  // Smooth mouse velocity damping (more than 2x smoother and slower)
  velocity.tx *= 0.94;
  velocity.ty *= 0.94;
  velocity.x += (velocity.tx - velocity.x) * 0.35;
  velocity.y += (velocity.ty - velocity.y) * 0.35;

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

    // Снижено влияние мыши более чем в 2.5 раза (было ox / 8, стало ox / 22)
    velocity.tx = velocity.tx - (ox / 22) * scale;
    velocity.ty = velocity.ty - (oy / 22) * scale;
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
