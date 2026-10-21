// ==========================================
// КОНФИГУРАЦИЯ САЙТА CHERNISH
// ==========================================

const CONFIG = {
  // Твой никнейм
  nickname: "@Chernish",

  // Твой статус/подпись под ником
  bio: "yor friend ❤",

  // Твой ник в Discord для копирования в 1 клик
  discordUsername: "chernish",

  // Карточки соцсетей
  // Эффекты фона при наведении (effect):
  // "rain"   - неоновый дождь
  // "leaves" - падающие покачивающиеся листочки
  // "snow"   - снежинки / мороз
  // "stars"  - звёзды
  links: [
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
