class Pixel {
  constructor(canvas, context, x, y, color, speed, delay) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min, max) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(
      this.x + centerOffset,
      this.y + centerOffset,
      this.size,
      this.size
    );
  }

  appear() {
    this.isIdle = false;

    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }

    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }

    if (this.isShimmer) {
      this.shimmer();
    } else {
      this.size += this.sizeStep;
    }

    this.draw();
  }

  disappear() {
    this.isShimmer = false;
    this.counter = 0;

    if (this.size <= 0) {
      this.isIdle = true;
      return;
    } else {
      this.size -= 0.1;
    }

    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }

    if (this.isReverse) {
      this.size -= this.speed;
    } else {
      this.size += this.speed;
    }
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
      display: grid;
      inline-size: 100%;
      block-size: 100%;
      overflow: hidden;
    }
  `;

  get colors() {
    return this.dataset.colors?.split(",").map((c) => c.trim()) || ["#f8fafc", "#f1f5f9", "#cbd5e1"];
  }

  get gap() {
    const value = parseInt(this.dataset.gap || "6", 10);
    return Math.max(4, Math.min(value, 50));
  }

  get speed() {
    const value = parseInt(this.dataset.speed || "80", 10);
    const throttle = 0.001;
    return Math.max(0, Math.min(value, 100)) * throttle;
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
    this.timeInterval = 1000 / 60;
    this.timePrevious = performance.now();
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.init();
    this.resizeObserver = new ResizeObserver(() => this.init());
    this.resizeObserver.observe(this);

    this._parent.addEventListener("mouseenter", () => this.handleAnimation("appear"));
    this._parent.addEventListener("mouseleave", () => this.handleAnimation("disappear"));

    if (!this.noFocus) {
      this._parent.addEventListener("focusin", () => this.handleAnimation("appear"));
      this._parent.addEventListener("focusout", () => this.handleAnimation("disappear"));
    }
  }

  disconnectedCallback() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this._parent) {
      this._parent.removeEventListener("mouseenter", () => this.handleAnimation("appear"));
      this._parent.removeEventListener("mouseleave", () => this.handleAnimation("disappear"));
      if (!this.noFocus) {
        this._parent.removeEventListener("focusin", () => this.handleAnimation("appear"));
        this._parent.removeEventListener("focusout", () => this.handleAnimation("disappear"));
      }
    }
    delete this._parent;
  }

  handleAnimation(name) {
    cancelAnimationFrame(this.animation);
    this.animation = this.animate(name);
  }

  init() {
    const rect = this.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    if (width === 0 || height === 0) return;

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.pixels = [];

    const gap = parseInt(this.gap, 10);
    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const delay = this.reducedMotion ? 0 : this.getDistanceToCanvasCenter(x, y);
        this.pixels.push(new Pixel(this.canvas, this.ctx, x, y, color, this.speed, delay));
      }
    }
  }

  getDistanceToCanvasCenter(x, y) {
    const dx = x - this.canvas.width / 2;
    const dy = y - this.canvas.height / 2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  animate(fnName) {
    this.animation = requestAnimationFrame(() => this.animate(fnName));

    const timeNow = performance.now();
    const timePassed = timeNow - this.timePrevious;

    if (timePassed < this.timeInterval) return;

    this.timePrevious = timeNow - (timePassed % this.timeInterval);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.pixels.length; i++) {
      this.pixels[i][fnName]();
    }

    if (this.pixels.every((pixel) => pixel.isIdle)) {
      cancelAnimationFrame(this.animation);
    }
  }
}

PixelCanvas.register();

/* Guaranteed Vector SVGs for every brand (never fail to load) */
const SVG_ICONS = {
  telegram: `<svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
  steam: `<svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12zm-4.664 16.292c0 .484.2.923.522 1.242l-1.925.795c-.375-.623-.597-1.348-.597-2.127 0-.584.126-1.139.352-1.642l2.038.843c-.244.269-.39.624-.39 1.012l.001-.123zm8.629-9.507c-1.17 0-2.122.951-2.122 2.125s.952 2.127 2.122 2.127c1.174 0 2.125-.953 2.125-2.127s-.951-2.125-2.125-2.125zm0 .748c.76 0 1.378.618 1.378 1.377 0 .758-.618 1.377-1.378 1.377s-1.374-.619-1.374-1.377c0-.759.614-1.377 1.374-1.377zm-8.629 8.01c-1.173 0-2.125.952-2.125 2.126 0 1.172.952 2.125 2.125 2.125 1.172 0 2.125-.953 2.125-2.125 0-1.174-.953-2.126-2.125-2.126zm0 .75c.76 0 1.377.618 1.377 1.376 0 .759-.617 1.377-1.377 1.377s-1.376-.618-1.376-1.377c0-.758.616-1.376 1.376-1.376z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" class="icon-svg"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`
};

/* Presets for popular social networks */
const SERVICE_PRESETS = {
  telegram: { color: "#24a1de", rgb: "36, 161, 222", colors: "#24a1de, #0088cc, #ffffff" },
  discord: { color: "#5865f2", rgb: "88, 101, 242", colors: "#5865f2, #7983f5, #ffffff" },
  steam: { color: "#66c0f4", rgb: "102, 192, 244", colors: "#1b2838, #2a475e, #66c0f4, #c7d5e0" },
  github: { color: "#ffffff", rgb: "255, 255, 255", colors: "#ffffff, #c9d1d9, #30363d" }
};

/* Toast Notification Helper */
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

/* RGB Channel Split (Glitch text) */
function channelSplit(elem) {
  if (elem) {
    const inner = elem.innerHTML;
    elem.innerHTML = "";

    const spanHidden = document.createElement("span");
    spanHidden.classList.add("channel-split-static");
    spanHidden.innerHTML = inner;
    elem.appendChild(spanHidden);

    ["red", "green", "blue"].forEach((x) => {
      const span = document.createElement("span");
      span.classList.add("channel-split");
      span.classList.add(`channel-split-${x}`);
      span.innerHTML = inner;
      elem.appendChild(span);
    });
  }
}

/* Render cards helper */
function renderCards(linksArray) {
  const gridEl = document.getElementById("cards-grid");
  if (!gridEl || !Array.isArray(linksArray)) return;

  gridEl.innerHTML = "";

  linksArray.forEach((item) => {
    const typeKey = item.type?.toLowerCase();
    const preset = SERVICE_PRESETS[typeKey] || {
      color: "#ffffff",
      rgb: "255, 255, 255",
      colors: "#ffffff, #888888"
    };

    const iconSvg = SVG_ICONS[typeKey] || `<svg viewBox="0 0 24 24" class="icon-svg"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>`;

    const card = document.createElement("a");
    card.className = "card";
    card.style.setProperty("--active-color", preset.color);
    card.style.setProperty("--active-rgb", preset.rgb);

    // Interactive background particle morphing
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
        navigator.clipboard.writeText(username).then(() => {
          showToast(`Дискорд скопирован: ${username}`);
        }).catch(() => {
          showToast(`Дискорд: ${username}`);
        });
      });
    } else {
      card.href = item.url || "#";
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }

    card.innerHTML = `
      <pixel-canvas data-gap="6" data-speed="80" data-colors="${preset.colors}" data-no-focus></pixel-canvas>
      <div class="icon-wrapper">
        ${iconSvg}
      </div>
      <div class="card-info">
        <span class="title">${item.name || item.type?.toUpperCase()}</span>
        ${item.badge ? `<span class="badge">${item.badge}</span>` : ""}
      </div>
    `;

    gridEl.appendChild(card);
  });
}

/* Easter Egg: Rapid clicks on avatar to toggle full socials with heavy glitch */
let avatarClicks = 0;
let lastClickTime = 0;
let isUnlocked = false;
let isGlitching = false;
const TARGET_CLICKS = 12; // 12 быстрых кликов (удобнее и надёжнее, чем 20)

function setupEasterEgg() {
  const avatarImg = document.getElementById("avatar-img");
  if (!avatarImg) return;

  // Listen to both click and pointerdown for immediate touch response on mobile
  const handleClick = (e) => {
    if (isGlitching) return;

    const now = Date.now();
    // Reset counter if idle > 1400ms
    if (now - lastClickTime > 1400) {
      avatarClicks = 0;
      avatarImg.classList.remove("avatar-charging");
    }

    lastClickTime = now;
    avatarClicks++;

    // Visual feedback when approaching target clicks
    if (avatarClicks >= 6 && avatarClicks < TARGET_CLICKS) {
      avatarImg.classList.add("avatar-charging");
    }

    if (avatarClicks >= TARGET_CLICKS) {
      avatarClicks = 0;
      avatarImg.classList.remove("avatar-charging");
      triggerGlitchSequence();
    }
  };

  avatarImg.addEventListener("pointerdown", handleClick);
}

function triggerGlitchSequence() {
  isGlitching = true;
  const overlay = document.getElementById("glitch-overlay");
  const container = document.getElementById("container");

  // Glitch burst on screen & container
  if (overlay) overlay.classList.add("active");
  if (container) container.classList.add("glitching");

  // In the middle of the glitch (550ms), swap the cards & status
  setTimeout(() => {
    isUnlocked = !isUnlocked;
    renderCards(isUnlocked ? CONFIG.secretLinks : CONFIG.publicLinks);

    const bioText = document.getElementById("bio-text");
    if (bioText) {
      bioText.textContent = isUnlocked
        ? (CONFIG.bioSecret || "yor friend ❤")
        : (CONFIG.bioPublic || "steam profile");
    }
  }, 550);

  // Finish glitch after 1.1s
  setTimeout(() => {
    if (overlay) overlay.classList.remove("active");
    if (container) container.classList.remove("glitching");
    isGlitching = false;

    if (isUnlocked) {
      showToast("⚡ Доступ открыт: личные контакты");
    } else {
      showToast("🔒 Режим: только Steam");
    }
  }, 1100);
}

/* Initialize App */
function renderApp() {
  if (typeof CONFIG === "undefined") return;

  // Nickname
  const nicknameEl = document.querySelector(".channel-split-wrapper");
  if (nicknameEl && CONFIG.nickname) {
    nicknameEl.textContent = CONFIG.nickname;
  }
  channelSplit(nicknameEl);

  // Initial Bio
  const bioText = document.getElementById("bio-text");
  if (bioText) {
    bioText.textContent = CONFIG.bioPublic || "steam profile";
  }

  // Initial Cards: Public Mode (Steam accounts only)
  renderCards(CONFIG.publicLinks || []);

  // Setup Easter Egg
  setupEasterEgg();
}

document.addEventListener("DOMContentLoaded", renderApp);
