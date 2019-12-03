const { playInBrowser } = require('bomberjam-backend');
const { ClassifierBot } = require("./classification/bot");

play();

async function play() {
  const bots = await createBots();
  
  playInBrowser(bots).catch(console.log);
}

async function createBots() {
  const bots = [new ClassifierBot(), new ClassifierBot(), new ClassifierBot(), new ClassifierBot()];
  for (const bot of bots) {
    if (bot.init) {
      await bot.init();
    }
  }

  return bots;
}
