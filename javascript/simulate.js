const { startSimulation } = require('bomberjam-backend');
const { bot, RandomBot } = require("./bots");
const { writeFileSync } = require("./src/file-operations");

/*
*   You can pass an argument for the number of games to play.
*   Defaults to 10.
*/
const NUMBER_OF_GAMES = Number(process.argv[2] || 10);

simulate();
async function simulate() {
    console.log("\nUsing model", bot.modelName);
    const bots = await createBots();

    console.group("Simulating", NUMBER_OF_GAMES, "games");
    const stats = { scores: {}, deaths: {} };
    const averages = { scores: {}, deaths: {} };
    const saveGamelog = true;
    for (let game = 1; game <= NUMBER_OF_GAMES; game++) {
        const { finalState, deaths } = play(bots, saveGamelog);
        crunchScoreStats(game, stats.scores, averages.scores, finalState.players);
        crunchDeathStats(game, stats.deaths, averages.deaths, finalState.players, deaths);
        console.log("Game", game);
    }
    console.groupEnd();

    stats.scores[" "] = { [" "]: "" }; // Make an empty row
    stats.scores["Average"] = averages.scores;

    for (const col in averages.deaths) {
        averages.deaths[col] = Number(averages.deaths[col].toFixed(2));
    }
    stats.deaths[" "] = { [" "]: "" }; // Make an empty row
    stats.deaths["Average"] = averages.deaths;

    console.log("\nScores:");
    console.table(stats.scores);

    console.log("Deaths:");
    console.table(stats.deaths);

    writeFileSync(`./saved-models/${bot.modelName}/simulate.json`, stats);
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
    const deaths = {};
    const isDead = {};
    for (const playerId in simulation.currentState.players) {
        deaths[playerId] = 0;
        isDead[playerId] = false;
    }

    while (!simulation.isFinished) {
        simulation.executeNextTick();

        for (const playerId in simulation.currentState.players) {
            const player = simulation.currentState.players[playerId];
            if (player.respawning > 0 || !player.alive) {
                if (!isDead[playerId]) {
                    deaths[playerId]++;
                    isDead[playerId] = true;
                }
            }
            else {
                isDead[playerId] = false;
            }
        }
    }

    return {
        finalState: simulation.currentState,
        deaths
    };
}

function crunchScoreStats(currentGame, stats, averages, players) {
    const score = {};
    let winner = "";
    let highScore = 0;
    let totalScore = 0;
    let lastAlive = "none";
    for (const playerId in players) {
        totalScore += players[playerId].score;
        score[playerId] = players[playerId].score;
        if (highScore < players[playerId].score) {
            highScore = players[playerId].score;
            winner = playerId
        }

        if (players[playerId].hasWon) {
            lastAlive = playerId;
        }

        if (!averages[playerId]) {
            averages[playerId] = 0;
        }
        averages[playerId] += Math.round(score[playerId] / NUMBER_OF_GAMES);
    }

    score[winner] = score[winner].toFixed(0);
    score["avg"] = Math.round(totalScore / Object.keys(players).length);
    score["last alive"] = lastAlive;

    stats[`Game ${currentGame}`] = score;

    if (!averages["avg"]) {
        averages["avg"] = 0;
    }
    averages["avg"] += Math.round(score["avg"] / NUMBER_OF_GAMES);
}

function crunchDeathStats(currentGame, stats, averages, players, deaths) {
    const deathStats = {};
    let winner = "";
    let minDeaths = 999;
    let totalDeaths = 0;
    for (const playerId in players) {
        totalDeaths += deaths[playerId];
        deathStats[playerId] = deaths[playerId];
        if (minDeaths > deaths[playerId]) {
            minDeaths = deaths[playerId];
            winner = playerId
        }

        if (!averages[playerId]) {
            averages[playerId] = 0;
        }
        averages[playerId] += deaths[playerId] / NUMBER_OF_GAMES;
    }

    deathStats[winner] = deathStats[winner].toFixed(0);
    const avgDeaths = totalDeaths / Object.keys(players).length;
    deathStats["avg"] = Number(avgDeaths.toFixed(2));

    stats[`Game ${currentGame}`] = deathStats;

    if (!averages["avg"]) {
        averages["avg"] = 0;
    }
    averages["avg"] += avgDeaths / NUMBER_OF_GAMES;
}
