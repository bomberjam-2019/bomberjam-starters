const { startSimulation } = require('bomberjam-backend');
const { bot } = require("./bots");

/*
*   You can pass an argument for the number of games to play.
*   Defaults to 10.
*/
const NUMBER_OF_GAMES = process.argv[2] || 10;

simulate();
async function simulate() {
    console.log("Creating bots");
    const bots = await createBots();

    console.log("Playing", NUMBER_OF_GAMES, "games");
    const scores = {};
    const averageScores = {};
    const saveGamelog = true;
    for (let game = 1; game <= NUMBER_OF_GAMES; game++) {
        const finalState = play(bots, saveGamelog);
        crunchScoreStats(finalState, scores, averageScores, game);
        console.log("Game", game);
    }

    console.log("Scores:");
    scores["Average"] = averageScores;
    console.table(scores);
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

function play(bots, saveGamelog) {
    const simulation = startSimulation(bots, saveGamelog);
    while (!simulation.isFinished) {
        simulation.executeNextTick();
    }

    return simulation.currentState;
}

function crunchScoreStats(finalState, scores, averageScores, currentGame) {
    const players = finalState.players;
    const score = {};
    let totalScore = 0;
    let lastAlive = "none";
    for (const playerId in players) {
        totalScore += players[playerId].score;
        score[playerId] = players[playerId].score;

        if (players[playerId].hasWon) {
            lastAlive = playerId;
        }

        if (!averageScores[playerId]) {
            averageScores[playerId] = 0;
        }
        averageScores[playerId] += Math.round(score[playerId] / NUMBER_OF_GAMES);
    }

    score.average = Math.round(totalScore / Object.keys(players).length);
    score["last alive"] = lastAlive;
    scores[`Game ${currentGame}`] = score;

    if (!averageScores.average) {
        averageScores.average = 0;
    }
    averageScores.average += Math.round(score.average / NUMBER_OF_GAMES);
}
