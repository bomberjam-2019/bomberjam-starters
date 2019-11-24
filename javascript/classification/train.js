const data = require("./src/data");
const model = require("./src/model");

const GAMES_TO_LOAD = 10;

main();
async function main() {
    const { train, test } = await data.get(GAMES_TO_LOAD);
    const classifier = model.make();
    await trainModel(classifier, train, test);
    classifier.save("file://./class-bomberjam.tfm");
}

async function trainModel(model, train, test) {
    console.group("\nFitting model");
    const fitResult = await model.fit(train.inputs, train.outputs, {
        batchSize: 64,
        epochs: 10,
        shuffle: true,
        validationSplit: 0.15
    });
    console.groupEnd();

    console.group("\nEvaluating model");
    const evalResult = model.evaluate(test.inputs, test.outputs, {
        batchSize: test.inputs.length
    });
    
    const accuracyMetricIndex = fitResult.params.metrics.indexOf("acc");
    const accuracy = await evalResult[accuracyMetricIndex].data();
    console.log(`Test accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.groupEnd();
}