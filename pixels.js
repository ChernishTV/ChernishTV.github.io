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

/* Presets for popular social networks and services */
const SERVICE_PRESETS = {
  telegram: { icon: "fa-brands fa-telegram", color: "#24a1de", rgb: "36, 161, 222", colors: "#24a1de, #0088cc, #ffffff" },
  discord: { icon: "fa-brands fa-discord", color: "#5865f2", rgb: "88, 101, 242", colors: "#5865f2, #7983f5, #ffffff" },
  steam: { icon: "fa-brands fa-steam", color: "#66c0f4", rgb: "102, 192, 244", colors: "#1b2838, #2a475e, #66c0f4, #c7d5e0" },
  youtube: { icon: "fa-brands fa-youtube", color: "#ff0000", rgb: "255, 0, 0", colors: "#ff0000, #ff4e4e, #282828, #ffffff" },
  twitch: { icon: "fa-brands fa-twitch", color: "#9146ff", rgb: "145, 70, 255", colors: "#9146ff, #bf94ff, #ffffff" },
  vk: { icon: "fa-brands fa-vk", color: "#0077ff", rgb: "0, 119, 255", colors: "#0077ff, #4c9eff, #ffffff" },
  spotify: { icon: "fa-brands fa-spotify", color: "#1ed760", rgb: "30, 215, 96", colors: "#1ed760, #1db954, #121212, #ffffff" },
  tiktok: { icon: "fa-brands fa-tiktok", color: "#00f2ea", rgb: "0, 242, 234", colors: "#00f2ea, #ff0050, #ffffff" },
  github: { icon: "fa-brands fa-github", color: "#ffffff", rgb: "255, 255, 255", colors: "#ffffff, #c9d1d9, #30363d" },
  instagram: { icon: "fa-brands fa-instagram", color: "#e1306c", rgb: "225, 48, 108", colors: "#405de6, #833ab4, #c13584, #fd1d1d" }
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
  }, 2500);
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

/* Render cards and profile from CONFIG */
function renderApp() {
  if (typeof CONFIG === "undefined") return;

  // Nickname
  const nicknameEl = document.querySelector(".channel-split-wrapper");
  if (nicknameEl && CONFIG.nickname) {
    nicknameEl.textContent = CONFIG.nickname;
  }
  channelSplit(nicknameEl);

  // Bio
  const bioText = document.getElementById("bio-text");
  if (bioText && CONFIG.bio) {
    bioText.textContent = CONFIG.bio;
  }

  // Cards
  const gridEl = document.getElementById("cards-grid");
  if (!gridEl || !Array.isArray(CONFIG.links)) return;

  gridEl.innerHTML = "";

  CONFIG.links.forEach((item) => {
    const preset = SERVICE_PRESETS[item.type?.toLowerCase()] || {
      icon: item.icon || "fa-solid fa-link",
      color: item.color || "#ffffff",
      rgb: "255, 255, 255",
      colors: item.pixelColors || "#ffffff, #888888"
    };

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
        <i class="${preset.icon} icon"></i>
      </div>
      <div class="card-info">
        <span class="title">${item.name || item.type?.toUpperCase()}</span>
        ${item.badge ? `<span class="badge">${item.badge}</span>` : ""}
      </div>
    `;

    gridEl.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", renderApp);
