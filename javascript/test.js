const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const data = require("./src/data");
const { bot } = require("./bots");
const { ACTION_STRINGS } = require("./bots/game-constants");
const { writeFileSync } = require("./src/file-operations");

/*
*   You can pass an argument for the number of games to load for the test.
*   Defaults to 25
*/
const GAMES_TO_LOAD = Number(process.argv[2] || 25);

test();
async function test() {
    const classifier = await tf.loadLayersModel(`file://./saved-models/${bot.modelName}/model.json`);

    console.log("\nUsing model", bot.modelName);
    console.group("Testing");
    const test = await data.get(6000 - GAMES_TO_LOAD, GAMES_TO_LOAD, bot.gameStateToModelInputConverter, false);

    console.log("Making predictions");
    const predictionsTensor = classifier.predict(test.inputs);

    console.log("Extracting results");
    const expected = test.outputs.argMax(1).dataSync();
    const predicted = predictionsTensor.argMax(1).dataSync();
    console.groupEnd();

    console.log("Results:");
    const answers = answerStruct();

    for (let i = 0; i < expected.length; i++) {
        const expectedAction = ACTION_STRINGS[expected[i]];
        const predictedAction = ACTION_STRINGS[predicted[i]];
        answers[expectedAction].expected++;
        answers[predictedAction].predicted++;
        if (expected[i] === predicted[i]) {
            answers[expectedAction].good++;
        }
    }

    crunchAnswersData(answers);

    console.table(answers);

    writeFileSync(`./saved-models/${bot.modelName}/test.json`, answers);
}

function answerStruct() {
    return Object.values(ACTION_STRINGS).reduce((acc, action) => {
        acc[action] = {
            expected: 0,
            predicted: 0,
            good: 0
        };

        return acc;
    }, {});
}

function crunchAnswersData(answers) {
    const totals = {
        expected: 0,
        predicted: 0,
        good: 0
    };

    for (const action in answers) {
        totals.expected += answers[action].expected;
        totals.predicted += answers[action].predicted;
        totals.good += answers[action].good;
    }

    answers.total = { ...totals };

    const totalActions = answers.total.expected;
    for (const action in answers) {
        answers[action]["expected %"] = Math.round(answers[action].expected / totalActions * 100);
        answers[action]["predicted %"] = Math.round(answers[action].predicted / totalActions * 100);
        answers[action]["accuracy %"] = Math.round(answers[action].good / answers[action].expected * 100);
    }
}