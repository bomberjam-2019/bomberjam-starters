const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const { modelName } = require("./model");
const { gameStateToModelInputConverter } = require("./data");
const { ACTION_STRINGS } = require("../../src/game-constants");

class DeepCNNBot {
    constructor(modelName) {
        this.model = null;
        this.modelName = modelName;
    }

    async init() {
        this.model = await tf.loadLayersModel(`file://./trained-models/${this.modelName}/model.json`);
    }

    getAction(state, myPlayerId) {
        const input = tf.tensor4d([gameStateToModelInputConverter(state, myPlayerId)]);
        const predictionTensor = this.model.predict(input);

        const prediction = tf.argMax(predictionTensor, 1).dataSync()[0];
        input.dispose();
        predictionTensor.dispose();

        const action = ACTION_STRINGS[prediction];

        return action;
    }
}

module.exports = {
    newBot: () => new DeepCNNBot(modelName)
}