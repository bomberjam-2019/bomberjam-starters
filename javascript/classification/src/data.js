const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { oneHotVector, createMap } = require("./utils");
const { TILE_NAMES, TILE_MAPPING, ALL_ACTIONS, ACTION_SIZE, BOMB_MAX_COUNTDOWN, BONUSES, BOARD } = require("./game-constants");

const DATA_DIRECTORY = "./data";

const NUMBER_OF_FEATURES = 10;
const DATA_SHAPE = [NUMBER_OF_FEATURES, BOARD.width, BOARD.height]

async function get(startIndex, gamesToLoad) {
    console.group("\nParsing data");
    const inputs = [];
    const outputs = [];
    const fileNames = fs.readdirSync(DATA_DIRECTORY);

    let games = startIndex;
    const selectedFiles = fileNames.splice(startIndex, gamesToLoad);
    for (const fileName of selectedFiles) {
        const filePath = path.resolve(DATA_DIRECTORY, fileName);
        const gameData = await parseGameData(filePath);
        inputs.push(...gameData.inputs);
        outputs.push(...gameData.outputs);
        console.log("Game:", fileName, "Games:", ++games, "Ticks:", inputs.length);
    }

    console.log("Creating tensors");
    console.groupEnd();

    return {
        inputs: tf.tensor4d(inputs),
        outputs: tf.tensor2d(outputs)
    };
}

async function parseGameData(filePath) {
    const inputs = [];
    const outputs = [];
    const fileStream = fs.createReadStream(filePath);
    const game = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    for await (const tick of game) {
        const formattedTick = formatTick(JSON.parse(tick));
        inputs.push(...formattedTick.inputs);
        outputs.push(...formattedTick.outputs);
    }

    return {
        inputs,
        outputs
    };
}

function formatTick({ state, actions }) {
    const inputs = [];
    const outputs = [];
    for (const playerId in state.players) {
        const actionTaken = ALL_ACTIONS[actions[playerId]];
        if (actionTaken === undefined) {
            // There's no action at the end of a game
            continue;
        }

        inputs.push(stateToModelInput(playerId, state));
        outputs.push(oneHotVector(ACTION_SIZE, actionTaken));
    }

    return {
        inputs,
        outputs
    };
}

function stateToModelInput(playerId, state) {
    const currentPlayer = state.players[playerId];
    const otherPlayers = Object.values(state.players).filter(player => player.id !== playerId);

    const currentPlayerPositionMap = createMap(state.width, state.height);
    currentPlayerPositionMap[currentPlayer.x][currentPlayer.y] = 1;

    const otherPlayersPositionMap = createMap(state.width, state.height);
    for (const otherPlayer of otherPlayers) {
        otherPlayersPositionMap[otherPlayer.x][otherPlayer.y] = 1;
    }

    const breakableTilesMap = createMap(state.width, state.height);
    const blockedTilesMap = createMap(state.width, state.height);
    for (let x = 0; x < state.width; x++) {
        for (let y = 0; y < state.height; y++) {
            const tile = TILE_MAPPING[state.tiles[x + y * state.width]];
            if(tile === TILE_NAMES.breakable) {
                breakableTilesMap[x][y] = 1;
            }

            if(tile === TILE_NAMES.blocked) {
                blockedTilesMap[x][y] = 1;
            }
        }
    }

    const bombPositionsMap = createMap(state.width, state.height);
    const bombRangesMap = createMap(state.width, state.height);
    const bombCountdownsMap = createMap(state.width, state.height, 1);
    for (const bomb of Object.values(state.bombs)) {
        blockedTilesMap[bomb.x][bomb.y] = 1;
        bombPositionsMap[bomb.x][bomb.y] = 1;
        bombRangesMap[bomb.x][bomb.y] = bomb.range / Math.max(state.width, state.height);
        bombCountdownsMap[bomb.x][bomb.y] = bomb.countdown / BOMB_MAX_COUNTDOWN + 1;
    }

    const bonusesMap = createMap(state.width, state.height);
    for (const bonus of Object.values(state.bonuses)) {
        bonusesMap[bonus.x][bonus.y] = BONUSES[bonus.type];
    }

    const currentPlayerBombsLeftMap = createMap(state.width, state.height, currentPlayer.bombsLeft / currentPlayer.maxBombs);
    const currentPlayerBombRangeMap = createMap(state.width, state.height, currentPlayer.bombRange / Math.max(state.width, state.height));

    return [
        currentPlayerPositionMap,
        otherPlayersPositionMap,
        breakableTilesMap,
        blockedTilesMap,
        bombPositionsMap,
        bombRangesMap,
        bombCountdownsMap,
        bonusesMap,
        currentPlayerBombsLeftMap,
        currentPlayerBombRangeMap
    ];
}

module.exports = {
    get,
    stateToModelInput,
    DATA_SHAPE
};