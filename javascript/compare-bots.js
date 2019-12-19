const { startSimulation } = require('bomberjam-backend');
const { botsToCompare } = require("./bots");

/*
*   You can pass an argument for the number of games to play.
*   Defaults to 10.
*/
const NUMBER_OF_GAMES_TO_PLAY_IN_EACH_STARTING_POSITION = Number(process.argv[2] || 10);
const NUMBER_OF_PLAYERS = 4;
const TOTAL_NUMBER_OF_GAMES = NUMBER_OF_PLAYERS * NUMBER_OF_GAMES_TO_PLAY_IN_EACH_STARTING_POSITION;
const SAVE_GAMELOG = true;

simulateMultipleBots();
async function simulateMultipleBots() {
    const playerIds = ["p1", "p2", "p3", "p4"];
    let bots = botsToCompare.map(bot => bot.newBot());

    console.group("\nPlaying 4 differents bots against each other");
    console.log("Each bot will play", NUMBER_OF_GAMES_TO_PLAY_IN_EACH_STARTING_POSITION, "games in each starting position");
    console.group("Selected bots:");
    for (const bot of bots) {
        if (bot.init) {
            console.log(bot.modelName);
            await bot.init();
        }
    }
    console.groupEnd();

    const results = {};
    const averages = bots.reduce((acc, bot) => ({ ...acc, [bot.modelName]: 0 }), {});
    const wins = bots.reduce((acc, bot) => ({ ...acc, [bot.modelName]: 0 }), {});

    for (let i = 0; i < NUMBER_OF_PLAYERS; i++) {
        console.group("Rotation", i + 1);
        results[`Rotation ${i + 1}`] = bots.reduce((acc, bot, index) => ({ ...acc, [bot.modelName]: playerIds[index] }), {});

        for (let j = 1; j <= NUMBER_OF_GAMES_TO_PLAY_IN_EACH_STARTING_POSITION; j++) {
            const gameNumber = i * NUMBER_OF_GAMES_TO_PLAY_IN_EACH_STARTING_POSITION + j;
            console.log("Game", gameNumber);
            const finalState = play(bots, SAVE_GAMELOG);

            let maxScore = 0;
            let winner = "";
            results[`Game ${gameNumber}`] = bots.reduce((acc, bot, index) => {
                const score = finalState.players[playerIds[index]].score;
                acc[bot.modelName] = score;
                averages[bot.modelName] += score;
                if (score > maxScore) {
                    maxScore = score;
                    winner = bot.modelName;
                }
    
                return acc;
            }, {});

            results[`Game ${gameNumber}`][winner] = maxScore.toFixed(0);

            wins[winner]++;
        }

        results[(new Array(i + 1)).fill(" ").join("")] = { [" "]: "" }; // Make an empty row
        console.groupEnd();

        bots.push(bots.shift());
    }
    console.groupEnd();

    for (const modelName in averages) {
        averages[modelName] = Math.round(averages[modelName] / TOTAL_NUMBER_OF_GAMES);
    }
    results["Average score"] = averages;
    results["Wins"] = wins;
    results["Win rate"] = Object.keys(wins).reduce((acc, modelName) => ({ ...acc, [modelName]: `${Math.round(wins[modelName] / TOTAL_NUMBER_OF_GAMES * 100)}%` }), {});
    console.group("\nResults:");
    console.table(results);
}

function play(bots, saveGamelog) {
    const simulation = startSimulation(bots, saveGamelog);

    while (!simulation.isFinished) {
        simulation.executeNextTick();
    }

    return simulation.currentState;
}