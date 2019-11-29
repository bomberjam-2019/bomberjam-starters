const tf = require("@tensorflow/tfjs");
require("@tensorflow/tfjs-node");

const { stateToModelInput } = require("./src/data");
const { ALL_ACTIONS } = require("./src/game-constants");

class ClassifierBot {
    constructor() {
        this.model = null;
    }

    async init() {
        this.model = await tf.loadLayersModel("file://./bomberjam-cnn.tfm/model.json");
    }

    getAction(state, myPlayerId) {
        const actionStrings = Object.keys(ALL_ACTIONS);
        const input = tf.tensor4d([stateToModelInput(myPlayerId, state)]);
        const predictionTensor = this.model.predict(input);

        const prediction = tf.argMax(predictionTensor, 1).dataSync()[0];
        input.dispose();
        predictionTensor.dispose();

        const action = actionStrings[prediction];

        return action;
    }
}

module.exports = {
    ClassifierBot
}