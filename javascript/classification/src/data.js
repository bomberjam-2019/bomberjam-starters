const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { shuffleInPlace, oneHotVector } = require("./utils");
const { TILES, ALL_ACTIONS, ACTION_SIZE } = require("./game-constants");

const DATA_DIRECTORY = "./data";

async function get(numberOfGames, trainRatio = 0.75) {
    console.group("\nParsing data");
    const inputs = [];
    const outputs = [];
    const fileNames = shuffleInPlace(fs.readdirSync(DATA_DIRECTORY));

    let games = 0;
    const selectedFiles = fileNames.splice(0, numberOfGames);
    for (const fileName of selectedFiles) {
        const filePath = path.resolve(DATA_DIRECTORY, fileName);
        const gameData = await parseGameData(filePath);
        inputs.push(...gameData.inputs);
        outputs.push(...gameData.outputs);
        console.log("Game:", fileName, "Games:", ++games, "Ticks:", inputs.length);
    }
    console.groupEnd();

    const train = {
        inputs: tf.tensor2d(inputs.splice(0, Math.round(inputs.length * trainRatio))),
        outputs: tf.tensor2d(outputs.splice(0, Math.round(outputs.length * trainRatio)))
    }

    const test = {
        inputs: tf.tensor2d(inputs),
        outputs: tf.tensor2d(outputs)
    }

    return {
        train,
        test
    }
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
        inputs.push([player, ...state.tiles.split('').map(tile => TILES[tile])]);
        outputs.push(oneHotVector(ACTION_SIZE, actionTaken));
    }

    return {
        inputs,
        outputs
    };
}

module.exports = {
    get
};