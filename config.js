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
      effect: "snow" // Снег при наведении
    },
    {
      type: "steam",
      name: "STEAM 2ND",
      badge: "Chernish_",
      url: "https://steamcommunity.com/id/Chernish_/",
      effect: "snow" // Снег при наведении
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
      effect: "hearts" // Дождь из сердечек при наведении!
    },
    {
      type: "discord",
      name: "DISCORD",
      badge: "chernish",
      isDiscordCopy: true,
      url: "#",
      effect: "rain" // Дождь при наведении
    },
    {
      type: "steam",
      name: "STEAM MAIN",
      badge: "waify_love",
      url: "https://steamcommunity.com/id/waify_love/",
      effect: "snow" // Снег при наведении
    },
    {
      type: "steam",
      name: "STEAM 2ND",
      badge: "Chernish_",
      url: "https://steamcommunity.com/id/Chernish_/",
      effect: "snow" // Снег при наведении
    },
    {
      type: "github",
      name: "GITHUB",
      badge: "ChernishTV",
      url: "https://github.com/ChernishTV",
      effect: "rain" // Дождь при наведении
    }
  ]
};
