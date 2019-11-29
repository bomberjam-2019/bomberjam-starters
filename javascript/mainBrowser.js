const { playInBrowser } = require('bomberjam-backend');
const { ClassifierBot } = require("./classification/bot");

play();

async function play() {
  const bot = await createBots();
  
  playInBrowser(bot).catch(console.log);
}

async function createBots() {
  const bots = [new ClassifierBot(), new ClassifierBot(), new ClassifierBot(), new ClassifierBot()];
  for (const bot of bots) {
    await bot.init();
  }

  return bots;
}
