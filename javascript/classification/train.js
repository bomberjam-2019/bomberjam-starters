const fs = require("fs");
const path = require("path");
const readline = require("readline");
const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const { shuffleInPlace, oneHotVector } = require("./utils");

// Game
const TILES = {
    ".": 0,
    "#": 1,
    "+": 2,
    "*": 3
};
const ALL_ACTIONS = {
    "up": 0,
    "down": 1,
    "left": 2,
    "right": 3,
    "stay": 4,
    "bomb": 5
};
const ACTION_SIZE = Object.values(ALL_ACTIONS).length;
const BOARD = {
    width: 13,
    height: 11
}

// Model
const INPUT_SIZE = 1 + BOARD.width * BOARD.height;
const HIDDEN_LAYER_NB_NEURONS = 43;
const OUTPUT_SIZE = ACTION_SIZE;

// Data
const DATA_DIRECTORY = "./data";
const GAMES_TO_LOAD = 10;

main();
async function main() {
    const { train, test } = await getData(GAMES_TO_LOAD);
    const model = makeModel();
    await trainModel(model, train, test);
    model.save("file://./class-bomberjam.tfm");
}

async function trainModel(model, train, test) {
    console.log("Fitting model");
    const fitResult = await model.fit(train.inputs, train.outputs, {
        batchSize: 64,
        epochs: 10,
        shuffle: true,
        validationSplit: 0.15
    });

    console.log("Evaluating model");
    const evalResult = model.evaluate(test.inputs, test.outputs, {
        batchSize: test.inputs.length
    });
    
    const accuracyMetricIndex = fitResult.params.metrics.indexOf("acc");
    const accuracy = await evalResult[accuracyMetricIndex].data();
    console.log(`Test accuracy: ${(accuracy * 100).toFixed(2)}%`);
}

async function getData(numberOfGames, trainRatio = 0.75) {
    console.log("Parsing...");
    let i = 0;
    const test = {
        inputs: [],
        outputs: []
    };
    const fileNames = fs.readdirSync(DATA_DIRECTORY);
    shuffleInPlace(fileNames);

    const selectedFiles = fileNames.splice(0, numberOfGames);
    for (const fileName of selectedFiles) {
        const filePath = path.resolve(DATA_DIRECTORY, fileName);
        const { inputs, outputs } = await parseGameData(filePath);
        test.inputs.push(...inputs);
        test.outputs.push(...outputs);
        console.log("Game:", fileName, "Games:", ++i, "Ticks:", test.inputs.length);
    }

    const train = {
        inputs: tf.tensor2d(test.inputs.splice(0, Math.round(test.inputs.length * trainRatio))),
        outputs: tf.tensor2d(test.outputs.splice(0, Math.round(test.outputs.length * trainRatio)))
    }
    test.inputs = tf.tensor2d(test.inputs);
    test.outputs = tf.tensor2d(test.outputs);

    console.log("...done!");
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

function makeModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [INPUT_SIZE], units: HIDDEN_LAYER_NB_NEURONS, activation: "relu" }));
    model.add(tf.layers.dense({ units: OUTPUT_SIZE, activation: "softmax" }));
    model.compile({
        optimizer: "sgd",
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"]
    });

    return model;
}