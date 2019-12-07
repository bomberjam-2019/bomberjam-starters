const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const data = require("./src/data");
const { bot } = require("./bots");

/*
*   You can pass an argument for the number of games to load in memory at the same time.
*   Defaults to 50
*/
const GAMES_TO_LOAD = process.argv[2] || 50;
const DATASET_SIZE = 3000;

train();
async function train() {
    const start = new Date();
    console.log("\nTraining model", bot.modelName);
    console.log("Started at:", start.toLocaleTimeString());
    const model = bot.buildModel();
    model.summary();
    console.log("");
    let accuracyMetricIndex = null;
    let bestValAcc = 0;

    /*
    *   Because of memory issues, we cannot load all the games all at once.
    *   There's a way to stream the data on the fly, but it is painfully slow.
    *   The trick I've found is to proceed with batches of fit. It has proven to work.
    *   The model is saved after each fit batch.
    */
    let start = 0;
    while (start < DATASET_SIZE - GAMES_TO_LOAD) {
        console.group();
        console.log("Time elapsed", new Date() - start, "\n");
        const train = await data.get(start, GAMES_TO_LOAD, bot.gameStateToModelInputConverter);
        console.log("Fitting model |", tf.memory().numTensors, "tensors");
        const fitResult = await model.fit(train.inputs, train.outputs, {
            batchSize: 64,
            epochs: 3,
            shuffle: true,
            validationSplit: 0.15,
            callbacks: {
                onEpochEnd: async (_, logs) => {
                    if (logs.val_acc > bestValAcc) {
                        bestValAcc = logs.val_acc;
                        console.log("Saving new best model based on validation accuracy");
                        model.save(`file://./trained-models/${bot.modelName}-best`);
                    }
                }
            }
        });
        train.inputs.dispose();
        train.outputs.dispose();
        
        if (!accuracyMetricIndex) {
            accuracyMetricIndex = fitResult.params.metrics.indexOf("acc");
        }

        console.log("Batch ended! Saving model\n");
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