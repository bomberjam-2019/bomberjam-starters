const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const { oneHotVector, argmax, shuffle } = require("./utils");
const { ACTION_NUMBERS, ACTION_SIZE } = require("../bots/game-constants");

const DATA_DIRECTORY = "./data";

/*
*   Gets game data from files.
*   It will load "gamesToLoad" files starting at the "startIndex"th file.
*   The provided "tickFormatter" will be used to convert the game data into your neural network input.
*   When "equalizeClasses" is true, samples an equal number of each output class.
*/
async function get(startIndex, gamesToLoad, tickFormatter, equalizeClasses = true) {
    console.group("Parsing data");
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
    let minActionRepresentation = parsedGameData.length;
    if (equalizeClasses) {
        console.log("Building dataset with equally represented classes");
        const actionDistribution = new Array(ACTION_SIZE).fill(0);
        for (const { output } of parsedGameData) {
            actionDistribution[argmax(output)]++;
        }
    
        minActionRepresentation = Math.min(...actionDistribution);
        
        shuffle(parsedGameData);
    }

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

/*
*   Reads a game file line by line. We do this because the whole file is not a valid JSON.
*   It then proceeds to format each game tick.
*/
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

/*
*   Format a game tick.
*   It will create a set of input/output for each player in the game.
*   The input will be formatted using the provided tickFormatter.
*   The output is a one hot vector of the action taken.
*/
function formatTick({ state, actions }, tickFormatter) {
    const inputs = [];
    const outputs = [];
    for (const playerId in state.players) {
        const actionTaken = ACTION_NUMBERS[actions[playerId]];
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