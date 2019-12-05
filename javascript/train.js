const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const data = require("./src/data");
const { bot } = require("./bots");

const DATASET_SIZE = 3000;
const GAMES_TO_LOAD = 50;

async function main() {
    const model = bot.buildModel();
    let accuracyMetricIndex = null;

    let start = 0;
    while (start < DATASET_SIZE - GAMES_TO_LOAD) {
        const train = await data.get(start, GAMES_TO_LOAD, bot.gameStateToModelInputConverter);
        console.group("\nFitting model |", tf.memory().numTensors, "tensors");
        const fitResult = await model.fit(train.inputs, train.outputs, {
            batchSize: 64,
            epochs: 10,
            shuffle: true,
            validationSplit: 0.15
        });
        train.inputs.dispose();
        train.outputs.dispose();
        
        if (!accuracyMetricIndex) {
            accuracyMetricIndex = fitResult.params.metrics.indexOf("acc");
        }

        model.save(`file://./trained-models/${bot.modelName}`);
        console.groupEnd();

        start += GAMES_TO_LOAD;
    }

    console.group("\nEvaluating model");
    const test = await data.get(start, GAMES_TO_LOAD, bot.gameStateToModelInputConverter);
    const evalResult = model.evaluate(test.inputs, test.outputs, {
        batchSize: test.inputs.length
    });
    const accuracy = await evalResult[accuracyMetricIndex].data();
    console.log(`Test accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.groupEnd();
}

main();