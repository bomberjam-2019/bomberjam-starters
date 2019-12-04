const { playInBrowser } = require('bomberjam-backend');
const { classifierBot, RandomBot } = require("./bots");

play();

async function play() {
    const bots = await createBots();
    playInBrowser(bots).catch(console.log);
}

async function createBots() {
    const bots = [
        classifierBot.new(),
        classifierBot.new(),
        classifierBot.new(),
        classifierBot.new()
    ];

    for (const bot of bots) {
        if (bot.init) {
            await bot.init();
        }
    }

    return bots;
}
