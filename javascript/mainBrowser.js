const { playInBrowser } = require('bomberjam-backend/dist/client');
const { ClassifierBot } = require("./classification/bot");

async function play() {
  const bot = new ClassifierBot();
  await bot.init();
  
  playInBrowser(bot).catch(console.log);
}

play();
