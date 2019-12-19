const { playInBrowser } = require('bomberjam-backend');
const { bot } = require("./bots");

play();
async function play() {
    const bots = await createBots();
    playInBrowser(bots).catch(console.log);
}

async function createBots() {
    const bots = [
        bot.newBot(),
        bot.newBot(),
        bot.newBot(),
        bot.newBot()
    ];

    for (const bot of bots) {
        if (bot.init) {
            await bot.init();
        }
    }

    return bots;
}
