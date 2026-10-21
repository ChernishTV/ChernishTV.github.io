/* =========================================================
   1. PIXEL SHIMMER (ПОЛНОЕ ПОКРЫТИЕ ФОНА КНОПКИ С ПЕРЕЛИВАМИ)
   ========================================================= */
class Pixel {
  constructor(canvas, context, x, y, colors, speed, delay, cellSize) {
    this.canvas = canvas;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.colors = colors;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.cellSize = cellSize;

    // Скорость раскрытия и мерцания
    this.growSpeed = (0.08 + Math.random() * 0.06) * (speed * 15);
    this.progress = 0;
    this.delay = delay;
    this.counter = 0;

    // Фаза перелива (чтобы вся залитая карточка живо переливалась)
    this.shimmerPhase = Math.random() * Math.PI * 2;
    this.shimmerSpeed = 0.04 + Math.random() * 0.05;

    this.isIdle = true;
  }

  appear() {
    this.isIdle = false;

    if (this.counter < this.delay) {
      this.counter += 5;
      return;
    }

    if (this.progress < 1) {
      this.progress = Math.min(1, this.progress + this.growSpeed);
    }

    this.shimmerPhase += this.shimmerSpeed;
    // Случайная мягкая смена оттенка из палитры карточки
    if (Math.random() < 0.012) {
      this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    this.draw();
  }

  disappear() {
    this.shimmerPhase += this.shimmerSpeed;

    if (this.progress > 0) {
      this.progress = Math.max(0, this.progress - this.growSpeed * 1.15);
      this.draw();
    } else {
      this.counter = 0;
      this.isIdle = true;
    }
  }

  draw() {
    if (this.progress <= 0) return;

    // +0.8px перекрывает микро-зазоры между соседними ячейками сетки
    const fullSize = this.cellSize + 0.8;
    const currentSize = fullSize * this.progress;
    const offset = (this.cellSize - currentSize) * 0.5;

    // Когда пиксель раскрылся на 100%, он переливается по яркости/прозрачности (от 0.72 до 1.0)
    const shimmerAlpha = 0.86 + Math.sin(this.shimmerPhase) * 0.14;

    this.ctx.save();
    this.ctx.globalAlpha = Math.min(1, this.progress * shimmerAlpha);
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(
      this.x + offset,
      this.y + offset,
      currentSize,
      currentSize
    );
    this.ctx.restore();
  }
}

class PixelCanvas extends HTMLElement {
  static register(tag = "pixel-canvas") {
    if ("customElements" in window && !customElements.get(tag)) {
      customElements.define(tag, this);
    }
  }

  static css = `
    :host {
      display: block;
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      overflow: hidden;
      border-radius: inherit;
      pointer-events: none;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  get colors() {
    return (
      this.dataset.colors?.split(",").map((c) => c.trim()) || [
        "#f8fafc",
        "#f1f5f9",
        "#cbd5e1"
      ]
    );
  }

  get gap() {
    const value = parseInt(this.dataset.gap || "8", 10);
    return Math.max(4, Math.min(value, 50));
  }

  get speed() {
    const value = parseInt(this.dataset.speed || "80", 10);
    return Math.max(10, Math.min(value, 100)) * 0.001;
  }

  get noFocus() {
    return this.hasAttribute("data-no-focus");
  }

  connectedCallback() {
    const canvas = document.createElement("canvas");
    const sheet = new CSSStyleSheet();

    this._parent = this.parentNode;
    this.shadowroot = this.attachShadow({ mode: "open" });

    sheet.replaceSync(PixelCanvas.css);
    this.shadowroot.adoptedStyleSheets = [sheet];
    this.shadowroot.appendChild(canvas);

    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    this.init();
    this.resizeObserver = new ResizeObserver(() => this.init());
    this.resizeObserver.observe(this);

    this._onEnter = () => this.handleAnimation("appear");
    this._onLeave = () => this.handleAnimation("disappear");

    this._parent.addEventListener("mouseenter", this._onEnter);
    this._parent.addEventListener("mouseleave", this._onLeave);

    if (!this.noFocus) {
      this._parent.addEventListener("focusin", this._onEnter);
      this._parent.addEventListener("focusout", this._onLeave);
    }
  }

  disconnectedCallback() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this._parent) {
      this._parent.removeEventListener("mouseenter", this._onEnter);
      this._parent.removeEventListener("mouseleave", this._onLeave);
      if (!this.noFocus) {
        this._parent.removeEventListener("focusin", this._onEnter);
        this._parent.removeEventListener("focusout", this._onLeave);
      }
    }
    cancelAnimationFrame(this.animation);
    delete this._parent;
  }

  handleAnimation(name) {
    this.animMode = name;
    cancelAnimationFrame(this.animation);
    this.animate();
  }

  init() {
    const rect = this.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);

    if (width === 0 || height === 0) return;

    this.canvas.width = width;
    this.canvas.height = height;
    this.pixels = [];

    const gap = this.gap;
    const cols = Math.ceil(width / gap) + 1;
    const rows = Math.ceil(height / gap) + 1;
    const palette = this.colors;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = c * gap;
        const y = r * gap;
        const delay = this.reducedMotion
          ? 0
          : this.getDistanceToCanvasCenter(x, y) * 0.45;
        this.pixels.push(
          new Pixel(
            this.canvas,
            this.ctx,
            x,
            y,
            palette,
            this.speed,
            delay,
            gap
          )
        );
      }
    }
  }

  getDistanceToCanvasCenter(x, y) {
    const dx = x - this.canvas.width / 2;
    const dy = y - this.canvas.height / 2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  animate() {
    this.animation = requestAnimationFrame(() => this.animate());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const mode = this.animMode || "disappear";
    for (let i = 0; i < this.pixels.length; i++) {
      this.pixels[i][mode]();
    }

    if (mode === "disappear" && this.pixels.every((p) => p.isIdle)) {
      cancelAnimationFrame(this.animation);
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

PixelCanvas.register();

/* =========================================================
   2. ИКОНКИ И ЦВЕТОВЫЕ ПРЕСЕТЫ СОЦСЕТЕЙ
   ========================================================= */
const SVG_ICONS = {
  telegram: `<svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
  steam: `<svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm-4.664 16.292c0 .484.2.923.522 1.242l-1.925.795c-.375-.623-.597-1.348-.597-2.127 0-.584.126-1.139.352-1.642l2.038.843c-.244.269-.39.624-.39 1.012l.001-.123zm8.629-9.507c-1.17 0-2.122.951-2.122 2.125s.952 2.127 2.122 2.127c1.174 0 2.125-.953 2.125-2.127s-.951-2.125-2.125-2.125zm0 .748c.76 0 1.378.618 1.378 1.377 0 .758-.618 1.377-1.378 1.377s-1.374-.619-1.374-1.377c0-.759.614-1.377 1.374-1.377zm-8.629 8.01c-1.173 0-2.125.952-2.125 2.126 0 1.172.952 2.125 2.125 2.125 1.172 0 2.125-.953 2.125-2.125 0-1.174-.953-2.126-2.125-2.126zm0 .75c.76 0 1.377.618 1.377 1.376 0 .759-.617 1.377-1.377 1.377s-1.376-.618-1.376-1.377c0-.758.616-1.376 1.376-1.376z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`
};

/* Насыщенные палитры для сплошного пиксельного перелива */
const SERVICE_PRESETS = {
  telegram: {
    color: "#24a1de",
    rgb: "36, 161, 222",
    colors: "#0b557a, #1378aa, #24a1de, #4fc3f7"
  },
  discord: {
    color: "#5865f2",
    rgb: "88, 101, 242",
    colors: "#31398c, #4752c4, #5865f2, #7983f5"
  },
  steam: {
    color: "#66c0f4",
    rgb: "102, 192, 244",
    colors: "#172636, #1b3b54, #2a5a7a, #66c0f4"
  },
  github: {
    color: "#c9d1d9",
    rgb: "201, 209, 217",
    colors: "#21262d, #30363d, #484f58, #6e7681"
  }
};

/* Всплывающее уведомление */
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  const toastText = document.getElementById("toast-text");
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* Эффект двоения текста для ника */
function channelSplit(elem) {
  if (!elem) return;
  const inner = elem.innerHTML;
  elem.innerHTML = "";

  const spanHidden = document.createElement("span");
  spanHidden.classList.add("channel-split-static");
  spanHidden.innerHTML = inner;
  elem.appendChild(spanHidden);

  ["red", "green", "blue"].forEach((x) => {
    const span = document.createElement("span");
    span.classList.add("channel-split", `channel-split-${x}`);
    span.innerHTML = inner;
    elem.appendChild(span);
  });
}

/* Отрисовка кнопок соцсетей */
function renderCards(linksArray, hiddenForHeartReveal = false) {
  const gridEl = document.getElementById("cards-grid");
  if (!gridEl || !Array.isArray(linksArray)) return [];

  gridEl.innerHTML = "";
  const createdCards = [];

  linksArray.forEach((item) => {
    const typeKey = item.type?.toLowerCase();
    const preset = SERVICE_PRESETS[typeKey] || {
      color: "#ffffff",
      rgb: "255, 255, 255",
      colors: "#334155, #475569, #64748b"
    };

    const iconSvg =
      SVG_ICONS[typeKey] ||
      `<svg viewBox="0 0 24 24" class="icon-svg"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>`;

    const card = document.createElement("a");
    card.className = hiddenForHeartReveal
      ? "card card-hidden-for-heart"
      : "card";
    card.style.setProperty("--active-color", preset.color);
    card.style.setProperty("--active-rgb", preset.rgb);

    card.addEventListener("mouseenter", () => {
      if (typeof window.setParticleTheme === "function") {
        window.setParticleTheme(item.effect || "stars", preset.color);
      }
    });

    card.addEventListener("mouseleave", () => {
      if (typeof window.setParticleTheme === "function") {
        window.setParticleTheme("stars", null);
      }
    });

    if (item.isDiscordCopy) {
      card.href = "javascript:void(0)";
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const username = CONFIG.discordUsername || "chernish";
        navigator.clipboard
          .writeText(username)
          .then(() => showToast(`Дискорд скопирован: ${username}`))
          .catch(() => showToast(`Дискорд: ${username}`));
      });
    } else {
      card.href = item.url || "#";
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    card.innerHTML = `
      <pixel-canvas data-gap="8" data-speed="85" data-colors="${preset.colors}" data-no-focus></pixel-canvas>
      <div class="icon-wrapper">
        ${iconSvg}
      </div>
      <div class="card-info">
        <span class="title">${item.name || item.type?.toUpperCase()}</span>
        ${item.badge ? `<span class="badge">${item.badge}</span>` : ""}
      </div>
    `;

    gridEl.appendChild(card);
    createdCards.push(card);
  });

  return createdCards;
}

/* =========================================================
   3. ПАСХАЛКА: 20 КЛИКОВ ПО АВАТАРКЕ -> ЛАВИНА СЕРДЕЧЕК
      И ЛОПАЮЩИЕСЯ СЕРДЕЧКИ НА МЕСТАХ НОВЫХ КНОПОК
   ========================================================= */
let avatarClicks = 0;
let clickResetTimer = null;
let isUnlocked = false;
let isTransitioning = false;
const TARGET_CLICKS = 20; // Ровно 20 нажатий на аватарку

const TRANSITION_HEART_COLORS = [
  "#ff2a6d",
  "#ff5983",
  "#ff0055",
  "#ff7597",
  "#ff4081",
  "#fb7185",
  "#f43f5e"
];

function drawHeartShape(ctx, x, y, size, angle, color, alpha, glow = false) {
  if (alpha <= 0 || size <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const s = size / 16;
  ctx.scale(s, s);

  ctx.beginPath();
  ctx.moveTo(0, -4);
  ctx.bezierCurveTo(-8, -14, -20, -2, 0, 14);
  ctx.bezierCurveTo(20, -2, 8, -14, 0, -4);

  ctx.fillStyle = color;
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
  }
  ctx.fill();
  ctx.restore();
}

function setupEasterEgg() {
  const avatarImg = document.getElementById("avatar-img");
  if (!avatarImg) return;

  const onAvatarClick = (e) => {
    e.preventDefault();
    if (isTransitioning) return;

    avatarClicks++;

    // Сброс счётчика, если перестали кликать дольше 3.5 секунд
    clearTimeout(clickResetTimer);
    clickResetTimer = setTimeout(() => {
      avatarClicks = 0;
      avatarImg.classList.remove("avatar-charging");
    }, 3500);

    // Мягкое розовое свечение аватарки после 5 кликов
    if (avatarClicks >= 5 && avatarClicks < TARGET_CLICKS) {
      avatarImg.classList.add("avatar-charging");
    }

    if (avatarClicks >= TARGET_CLICKS) {
      clearTimeout(clickResetTimer);
      avatarClicks = 0;
      avatarImg.classList.remove("avatar-charging");
      triggerHeartsSequence();
    }
  };

  avatarImg.addEventListener("click", onAvatarClick);
  avatarImg.addEventListener("dragstart", (e) => e.preventDefault());
}

function triggerHeartsSequence() {
  isTransitioning = true;

  const tCanvas = document.getElementById("hearts-transition");
  if (!tCanvas) {
    isTransitioning = false;
    return;
  }

  const tCtx = tCanvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  let w = window.innerWidth;
  let h = window.innerHeight;
  tCanvas.width = w * dpr;
  tCanvas.height = h * dpr;
  tCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 1) Густая лавина сердечек сверху, полностью закрывающая весь экран
  const curtainHearts = [];
  const totalCurtainHearts = 420;

  for (let i = 0; i < totalCurtainHearts; i++) {
    curtainHearts.push({
      x: Math.random() * (w + 120) - 60,
      // Распределяем плотной стеной над экраном, чтобы при падении они перекрыли весь фон
      y: -40 - Math.random() * (h * 1.45),
      size: 28 + Math.random() * 48,
      speedY: (h / 55) + Math.random() * 7,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.04 + Math.random() * 0.05,
      angle: (Math.random() - 0.5) * 0.5,
      angleSpeed: (Math.random() - 0.5) * 0.02,
      color:
        TRANSITION_HEART_COLORS[
          Math.floor(Math.random() * TRANSITION_HEART_COLORS.length)
        ],
      alpha: 0.92 + Math.random() * 0.08
    });
  }

  // 2) Большие сердечки на местах новых кнопок и 3) маленькие сердечки при лопании
  const cardBigHearts = [];
  const burstMiniHearts = [];

  let cardsSwapped = false;
  let cardHeartsSpawned = false;
  const startTime = performance.now();

  function spawnMiniBurst(cx, cy) {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = 3.2 + Math.random() * 6.5;
      burstMiniHearts.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        gravity: 0.14,
        size: 8 + Math.random() * 10,
        angle: (Math.random() - 0.5) * 0.8,
        angleSpeed: (Math.random() - 0.5) * 0.12,
        alpha: 1,
        decay: 0.018 + Math.random() * 0.015,
        color:
          TRANSITION_HEART_COLORS[
            Math.floor(Math.random() * TRANSITION_HEART_COLORS.length)
          ]
      });
    }
  }

  function animateTransition(now) {
    const elapsed = now - startTime;
    tCtx.clearRect(0, 0, w, h);

    // Пока густая стена сердечек закрывает экран (~950 мс), подменяем карточки на скрытые
    if (!cardsSwapped && elapsed >= 950) {
      cardsSwapped = true;
      isUnlocked = !isUnlocked;

      const bioText = document.getElementById("bio-text");
      if (bioText) {
        bioText.textContent = isUnlocked
          ? CONFIG.bioSecret || "yor friend ❤"
          : CONFIG.bioPublic || "steam profile";
      }

      const targetLinks = isUnlocked ? CONFIG.secretLinks : CONFIG.publicLinks;
      renderCards(targetLinks, true);
    }

    // Отрисовка падающей стены сердечек
    let curtainStillOnScreen = false;
    for (let i = 0; i < curtainHearts.length; i++) {
      const p = curtainHearts[i];
      p.y += p.speedY;
      p.wobble += p.wobbleSpeed;
      p.x += Math.sin(p.wobble) * 1.8;
      p.angle += p.angleSpeed;

      if (p.y < h + 90) {
        curtainStillOnScreen = true;
        drawHeartShape(tCtx, p.x, p.y, p.size, p.angle, p.color, p.alpha, false);
      }
    }

    // Когда основная масса сердечек уходит вниз (~1650 мс), на местах новых кнопок появляются сердечки
    if (!cardHeartsSpawned && elapsed >= 1650) {
      cardHeartsSpawned = true;
      const cardEls = Array.from(document.querySelectorAll("#cards-grid .card"));

      cardEls.forEach((cardEl, idx) => {
        const rect = cardEl.getBoundingClientRect();
        cardBigHearts.push({
          cardEl,
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          scale: 0,
          maxSize: Math.min(rect.width, rect.height) * 0.55,
          delay: idx * 130, // Поочерёдное красивое лопание для каждой кнопки
          elapsedLocal: 0,
          popped: false,
          color:
            TRANSITION_HEART_COLORS[idx % TRANSITION_HEART_COLORS.length]
        });
      });
    }

    // Отрисовка больших сердечек на местах кнопок -> надувание и лопание
    let allCardHeartsPopped = cardHeartsSpawned;
    for (let i = 0; i < cardBigHearts.length; i++) {
      const bh = cardBigHearts[i];
      if (bh.popped) continue;

      allCardHeartsPopped = false;
      bh.elapsedLocal += 16.6;

      if (bh.elapsedLocal < bh.delay) continue;

      const activeTime = bh.elapsedLocal - bh.delay;
      const popDuration = 520; // Время надувания сердечка перед тем, как оно лопнет

      if (activeTime < popDuration) {
        const t = activeTime / popDuration;
        // Эластичное надувание с лёгким дрожанием перед взрывом
        const pulse =
          t < 0.7
            ? (t / 0.7) * 1.1
            : 1.1 + Math.sin(t * 35) * 0.08 + (t - 0.7) * 0.6;
        const currentSize = bh.maxSize * pulse;
        const wobbleAngle = Math.sin(activeTime * 0.03) * 0.12;

        drawHeartShape(
          tCtx,
          bh.cx,
          bh.cy,
          currentSize,
          wobbleAngle,
          bh.color,
          1,
          true
        );
      } else {
        // Сердечко лопается! Вылетают маленькие сердечки и появляется сама кнопка
        bh.popped = true;
        spawnMiniBurst(bh.cx, bh.cy);
        bh.cardEl.classList.remove("card-hidden-for-heart");
        bh.cardEl.classList.add("card-pop-reveal");
      }
    }

    // Отрисовка маленьких сердечек, разлетающихся от лопнувших больших
    let miniBurstActive = false;
    for (let i = 0; i < burstMiniHearts.length; i++) {
      const mh = burstMiniHearts[i];
      if (mh.alpha <= 0) continue;

      miniBurstActive = true;
      mh.x += mh.vx;
      mh.y += mh.vy;
      mh.vy += mh.gravity;
      mh.vx *= 0.98;
      mh.angle += mh.angleSpeed;
      mh.alpha -= mh.decay;

      drawHeartShape(
        tCtx,
        mh.x,
        mh.y,
        mh.size,
        mh.angle,
        mh.color,
        mh.alpha,
        true
      );
    }

    // Продолжаем анимацию, пока не улетят все сердечки
    if (
      curtainStillOnScreen ||
      !allCardHeartsPopped ||
      miniBurstActive ||
      elapsed < 2200
    ) {
      requestAnimationFrame(animateTransition);
    } else {
      tCtx.clearRect(0, 0, w, h);
      isTransitioning = false;
      if (isUnlocked) {
        showToast("Секретные соцсети открыты ❤");
      } else {
        showToast("Секретные соцсети спрятаны ❤");
      }
    }
  }

  requestAnimationFrame(animateTransition);
}

/* Инициализация сайта */
function renderApp() {
  if (typeof CONFIG === "undefined") return;

  const nicknameEl = document.querySelector(".channel-split-wrapper");
  if (nicknameEl && CONFIG.nickname) {
    nicknameEl.textContent = CONFIG.nickname;
  }
  channelSplit(nicknameEl);

  const bioText = document.getElementById("bio-text");
  if (bioText) {
    bioText.textContent = CONFIG.bioPublic || "steam profile";
  }

  renderCards(CONFIG.publicLinks || [], false);
  setupEasterEgg();
}

document.addEventListener("DOMContentLoaded", renderApp);
