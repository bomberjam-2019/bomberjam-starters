const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const data = require("./src/data");
const { bot } = require("./bots");

/*
*   You can pass an argument for the number of games to load in memory at the same time.
*   Defaults to 50
*/
const GAMES_TO_LOAD = Number(process.argv[2] || 50);
const DATASET_SIZE = 6000;

train();
async function train() {
    const start = new Date();
    console.log("\nTraining model", bot.modelName);
    console.log("Started at:", start.toLocaleTimeString());

    /*
    *   The model summary is useful to validate that the network architecture you designed was implemented correctly.
    *   Look at the output shape of each layer to verify that the dimensions are as expected.
    *   It will also tell you how many trainable parameters there are.
    *   The more parameters, the better potential performance, but it will take more training time.
    */
    console.log("\nModel summary:");
    const model = bot.buildModel();
    model.summary();
    console.log("");

    /*
    *   Because of memory issues, we cannot load all the games all at once.
    *   There's a way to stream the data on the fly, but it is painfully slow.
    *   The trick I've found is to proceed with batches of fit. It has proven to work.
    *   The model is saved after each fit batch with your model name, and the model 
    *   with the best validation accuracy is saved as "modelName-best".
    */
    let accuracyMetricIndex = null;
    let bestValAcc = 0;
    let dataIndex = 0;
    while (dataIndex < DATASET_SIZE - GAMES_TO_LOAD) {
        console.group();
        console.log("Time elapsed:", Math.round((new Date() - start) / 1000 / 60), "minutes\n");
        const train = await data.get(dataIndex, GAMES_TO_LOAD, bot.gameStateToModelInputConverter);
        console.log("Fitting model |", tf.memory().numTensors, "tensors");

        /*
        *   This is where the training happens.
        *   You can play with the parameters if you wish, to see what they do.
        */
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
                        model.save(`file://./saved-models/${bot.modelName}-best`);
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
        model.save(`file://./saved-models/${bot.modelName}`);
        console.groupEnd();

        dataIndex += GAMES_TO_LOAD;
    }

    console.group("\nEvaluating model");
    const test = await data.get(dataIndex, GAMES_TO_LOAD, bot.gameStateToModelInputConverter);
    const evalResult = model.evaluate(test.inputs, test.outputs, {
        batchSize: test.inputs.length
    });
    const accuracy = await evalResult[accuracyMetricIndex].data();
    console.log(`Test accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.groupEnd();
}