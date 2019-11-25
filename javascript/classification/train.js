const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const data = require("./src/data");
const model = require("./src/model");

const DATASET_SIZE = 1000;
const GAMES_TO_LOAD = 100;

async function main() {
    const classifier = model.make();
    let accuracyMetricIndex = null;

    let start = 0;
    while (start < DATASET_SIZE - GAMES_TO_LOAD) {
        const train = await data.get(start, GAMES_TO_LOAD);
        console.group("\nFitting model |", tf.memory().numTensors, "tensors");
        const fitResult = await classifier.fit(train.inputs, train.outputs, {
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

        classifier.save("file://./bomberjam-cnn.tfm");
        console.groupEnd();

        start += GAMES_TO_LOAD;
    }

    console.group("\nEvaluating model");
    const test = await data.get(start, GAMES_TO_LOAD);
    const evalResult = classifier.evaluate(test.inputs, test.outputs, {
        batchSize: test.inputs.length
    });
    const accuracy = await evalResult[accuracyMetricIndex].data();
    console.log(`Test accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.groupEnd();
}

main();