const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { oneHotVector, argmax, shuffle } = require("./utils");
const { ALL_ACTIONS, ACTION_SIZE } = require("./game-constants");

const DATA_DIRECTORY = "./data";

async function get(startIndex, gamesToLoad, tickFormatter) {
    console.group("\nParsing data");
    const inputs = [];
    const outputs = [];
    const fileNames = fs.readdirSync(DATA_DIRECTORY);
    const parsedGameData = [];

    console.log("Loading games:", startIndex, "to", startIndex + gamesToLoad);
    const selectedFiles = fileNames.splice(startIndex, gamesToLoad);
    for (const fileName of selectedFiles) {
        const filePath = path.resolve(DATA_DIRECTORY, fileName);
        const gameData = await parseGameData(filePath, tickFormatter);
        for (let i = 0; i < gameData.inputs.length; i++) {
            parsedGameData.push({
                input: gameData.inputs[i],
                output: gameData.outputs[i]
            });
        }
    }

    console.log("Ticks parsed:", parsedGameData.length);
    console.log("Building dataset with equally represented classes");
    const actionDistribution = new Array(ACTION_SIZE).fill(0);
    for (const { output } of parsedGameData) {
        actionDistribution[argmax(output)]++;
    }

    const minActionRepresentation = Math.min(...actionDistribution);
    
    shuffle(parsedGameData);
    const actionsSelected = new Array(ACTION_SIZE).fill(0);
    for (const { input, output } of parsedGameData) {
        const action = argmax(output);
        if(actionsSelected[action] < minActionRepresentation) {
            inputs.push(input);
            outputs.push(output);
            actionsSelected[action]++;
        }
    }

    console.log("Ticks selected:", inputs.length);
    console.log("Creating tensors");
    console.groupEnd();

    return {
        inputs: tf.tensor4d(inputs),
        outputs: tf.tensor2d(outputs)
    };
}

async function parseGameData(filePath, tickFormatter) {
    const inputs = [];
    const outputs = [];
    const fileStream = fs.createReadStream(filePath);
    const game = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    for await (const tick of game) {
        const formattedTick = formatTick(JSON.parse(tick), tickFormatter);
        inputs.push(...formattedTick.inputs);
        outputs.push(...formattedTick.outputs);
    }

    return {
        inputs,
        outputs
    };
}

function formatTick({ state, actions }, tickFormatter) {
    const inputs = [];
    const outputs = [];
    for (const playerId in state.players) {
        const actionTaken = ALL_ACTIONS[actions[playerId]];
        if (actionTaken === undefined) {
            // There's no action at the end of a game
            continue;
        }

        inputs.push(tickFormatter(state, playerId));
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