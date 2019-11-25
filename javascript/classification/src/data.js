const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { oneHotVector, createMap } = require("./utils");
const { TILE_NAMES, TILE_MAPPING, ALL_ACTIONS, ACTION_SIZE } = require("./game-constants");

const DATA_DIRECTORY = "./data";

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
    const actionArray = Object.values(actions);
    for (let player = 0; player < actionArray.length; player++) {
        const actionTaken = ALL_ACTIONS[actionArray[player]];
        inputs.push(stateToModelInput(player, state));
        outputs.push(oneHotVector(ACTION_SIZE, actionTaken));
    }

    return {
        inputs,
        outputs
    };
}

function stateToModelInput(player, state) {
    const otherPlayers = Object.values(state.players);
    const currentPlayer = otherPlayers.splice(player, 1)[0];

    const currentPlayerPositionMap = createMap(state.width, state.height);
    currentPlayerPositionMap[currentPlayer.x][currentPlayer.y] = 1;

    const otherPlayersPositionMap = createMap(state.width, state.height);
    for (const otherPlayer of otherPlayers) {
        otherPlayersPositionMap[otherPlayer.x][otherPlayer.y] = 1;
    }

    const bombPositionsMap = createMap(state.width, state.height);
    for (const bomb of Object.values(state.bombs)) {
        bombPositionsMap[bomb.x][bomb.y] = 1;
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

    return [
        currentPlayerPositionMap,
        otherPlayersPositionMap,
        bombPositionsMap,
        breakableTilesMap,
        blockedTilesMap
    ];
}

module.exports = {
    get
};