// ==========================================
// КОНФИГУРАЦИЯ САЙТА CHERNISH
// ==========================================

const CONFIG = {
  // Твой никнейм
  nickname: "@Chernish",

  // Твой статус по умолчанию
  bioPublic: "steam profile",
  
  // Твой статус после разблокировки
  bioSecret: "yor friend ❤",

  // Твой ник в Discord для копирования в 1 клик
  discordUsername: "chernish",

  // ==========================================
  // 1. ПУБЛИЧНЫЙ РЕЖИМ (ВИДНЫ ТОЛЬКО STEAM)
  // ==========================================
  publicLinks: [
    {
      type: "steam",
      name: "STEAM MAIN",
      badge: "waify_love",
      url: "https://steamcommunity.com/id/waify_love/",
      effect: "snow"
    },
    {
      type: "steam",
      name: "STEAM 2ND",
      badge: "Chernish_",
      url: "https://steamcommunity.com/id/Chernish_/",
      effect: "snow"
    }
  ],

  // ==========================================
  // 2. СЕКРЕТНЫЙ РЕЖИМ (20 БЫСТРЫХ КЛИКОВ ПО АВАТАРКЕ)
  // ==========================================
  secretLinks: [
    {
      type: "telegram",
      name: "TELEGRAM",
      badge: "@EtoChernish",
      url: "https://t.me/EtoChernish",
      effect: "rain"
    },
    {
      type: "discord",
      name: "DISCORD",
      badge: "chernish",
      isDiscordCopy: true,
      url: "#",
      effect: "rain"
    },
    {
      type: "steam",
      name: "STEAM MAIN",
      badge: "waify_love",
      url: "https://steamcommunity.com/id/waify_love/",
      effect: "snow"
    },
    {
      type: "steam",
      name: "STEAM 2ND",
      badge: "Chernish_",
      url: "https://steamcommunity.com/id/Chernish_/",
      effect: "snow"
    },
    {
      type: "github",
      name: "GITHUB",
      badge: "ChernishTV",
      url: "https://github.com/ChernishTV",
      effect: "leaves"
    }
  ]
};
